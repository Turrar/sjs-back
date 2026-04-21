import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import type { ParsedScheduleLessonJson } from './contracts/ai-contracts';

const SYSTEM_PROMPT = `You extract a weekly class/lesson schedule from the user's input (text from a PDF or an image).
Return ONLY valid JSON with this exact shape: {"lessons":[{"dayOfWeek":number,"startMinute":number,"endMinute":number,"label":string}]}
Rules:
- dayOfWeek: 0 = Monday through 6 = Sunday
- startMinute: minutes from midnight 0–1439; endMinute: greater than startMinute, at most 1440
- label: short name if known, otherwise use an empty string
- If nothing can be parsed, return {"lessons":[]}`;

@Injectable()
export class ScheduleOpenAiParserService {
  private readonly log = new Logger(ScheduleOpenAiParserService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('OPENAI_API_KEY')?.trim();
    this.model = this.config.get<string>(
      'OPENAI_SCHEDULE_MODEL',
      'gpt-4o-mini',
    );
    this.client = key ? new OpenAI({ apiKey: key }) : null;
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  getModel(): string {
    return this.model;
  }

  /**
   * Parse weekly busy intervals from a file buffer. Requires OPENAI_API_KEY.
   */
  async parseLessons(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ParsedScheduleLessonJson[]> {
    if (!this.client) {
      throw new Error('OpenAI is not configured');
    }
    const mt = (mimeType || '').toLowerCase().split(';')[0].trim();
    let content: string;
    if (mt === 'application/pdf' || mt === 'application/x-pdf') {
      content = await this.completeFromPdf(buffer);
    } else if (mt.startsWith('image/')) {
      content = await this.completeFromImage(buffer, mt);
    } else if (mt === 'application/octet-stream' || !mt) {
      if (buffer.length >= 4 && buffer.subarray(0, 4).toString() === '%PDF') {
        content = await this.completeFromPdf(buffer);
      } else {
        throw new Error(
          `Cannot infer schedule format for mime "${mimeType || '(empty)'}"`,
        );
      }
    } else {
      throw new Error(
        `Unsupported mime type for schedule parsing: ${mimeType}`,
      );
    }
    return this.normalizeLessonsFromContent(content);
  }

  private async completeFromPdf(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    try {
      const data = await parser.getText();
      const text = (data.text || '').trim();
      if (!text) {
        this.log.warn('PDF produced no extractable text');
        return '{"lessons":[]}';
      }
      const clipped = text.length > 120_000 ? text.slice(0, 120_000) : text;
      return this.completeJson([
        {
          type: 'text',
          text: `Extract the weekly schedule from this document text:\n\n${clipped}`,
        },
      ]);
    } finally {
      await parser.destroy();
    }
  }

  private async completeFromImage(
    buffer: Buffer,
    mime: string,
  ): Promise<string> {
    const b64 = buffer.toString('base64');
    const dataUrl = `data:${mime};base64,${b64}`;
    return this.completeJson([
      {
        type: 'text',
        text: 'Extract the weekly class schedule from this image.',
      },
      {
        type: 'image_url',
        image_url: { url: dataUrl },
      },
    ]);
  }

  private async completeJson(
    userContent: OpenAI.Chat.ChatCompletionContentPart[],
  ): Promise<string> {
    const completion = await this.client!.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error('Empty OpenAI completion');
    }
    return raw;
  }

  private normalizeLessonsFromContent(
    content: string,
  ): ParsedScheduleLessonJson[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      this.log.warn('OpenAI returned non-JSON');
      return [];
    }
    return this.normalizeLessons(parsed);
  }

  private normalizeLessons(raw: unknown): ParsedScheduleLessonJson[] {
    if (!raw || typeof raw !== 'object') {
      return [];
    }
    const obj = raw as Record<string, unknown>;
    const lessons = obj.lessons ?? obj.schedule ?? obj.items;
    if (!Array.isArray(lessons)) {
      return [];
    }
    const out: ParsedScheduleLessonJson[] = [];
    for (const item of lessons) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const d = item as Record<string, unknown>;
      const day = Number(d.dayOfWeek);
      const sm = Number(d.startMinute);
      const em = Number(d.endMinute);
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        continue;
      }
      if (!Number.isFinite(sm) || !Number.isFinite(em)) {
        continue;
      }
      const startMinute = Math.floor(sm);
      const endMinute = Math.floor(em);
      if (
        startMinute < 0 ||
        startMinute >= 1440 ||
        endMinute <= 0 ||
        endMinute > 1440 ||
        startMinute >= endMinute
      ) {
        continue;
      }
      const labelRaw = d.label;
      const label =
        typeof labelRaw === 'string' ? labelRaw.slice(0, 200) : undefined;
      out.push({
        dayOfWeek: day,
        startMinute,
        endMinute,
        ...(label !== undefined && label.length > 0 ? { label } : {}),
      });
    }
    return out;
  }
}
