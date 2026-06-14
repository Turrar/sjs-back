import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { JobStatus } from '../../common/enums/job-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  JobEntity,
  ResumeDraftEntity,
  StudentProfileEntity,
} from '../../database/entities';

@Injectable()
export class StudentAiService {
  private readonly log = new Logger(StudentAiService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly studentProfiles: Repository<StudentProfileEntity>,
    @InjectRepository(ResumeDraftEntity)
    private readonly resumeDrafts: Repository<ResumeDraftEntity>,
  ) {
    const key = this.config.get<string>('OPENAI_API_KEY')?.trim();
    this.model = this.config.get<string>('OPENAI_CHAT_MODEL', 'gpt-4o-mini');
    this.client = key ? new OpenAI({ apiKey: key }) : null;
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  private requireClient(): OpenAI {
    if (!this.client) {
      throw new ServiceUnavailableException('AI service is not configured (OPENAI_API_KEY missing)');
    }
    return this.client;
  }

  async generateCoverLetter(opts: {
    studentUserId: string;
    jobId: string;
    language?: 'ru' | 'kk' | 'en';
    tone?: 'formal' | 'friendly';
  }): Promise<string> {
    const client = this.requireClient();
    const { studentUserId, jobId, language = 'ru', tone = 'formal' } = opts;

    const profile = await this.studentProfiles.findOne({ where: { userId: studentUserId } });
    if (!profile) throw new ServiceUnavailableException('Student profile not found');

    const job = await this.jobs.findOne({ where: { id: jobId } });
    if (!job) throw new ServiceUnavailableException('Job not found');

    const studentInfo = [
      profile.firstName && profile.lastName
        ? `Имя: ${profile.firstName} ${profile.lastName}`
        : '',
      profile.university ? `Университет: ${profile.university}` : '',
      profile.specialty ? `Специальность: ${profile.specialty}` : '',
      profile.bio ? `О себе: ${profile.bio}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const langLabel: Record<string, string> = { ru: 'русском', kk: 'казахском', en: 'English' };
    const toneLabel =
      tone === 'formal'
        ? 'формальном профессиональном стиле'
        : 'дружелюбном, но профессиональном стиле';

    const systemPrompt =
      `Ты — опытный HR-специалист и карьерный консультант в Казахстане, ` +
      `помогающий студентам писать сопроводительные письма. ` +
      `Пиши только на ${langLabel[language] ?? 'русском'} языке.`;

    const userPrompt =
      `Напиши сопроводительное письмо в ${toneLabel}.\n\n` +
      `СТУДЕНТ:\n${studentInfo || 'Информация не заполнена'}\n\n` +
      `ВАКАНСИЯ:\nНазвание: ${job.title}\nОписание: ${job.description.slice(0, 2000)}\n\n` +
      `Письмо должно быть 150–250 слов, убедительным и подходящим для студента без большого опыта.`;

    const res = await client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const text = res.choices[0]?.message?.content?.trim() ?? '';
    this.log.log(`Cover letter generated for studentUserId=${studentUserId} jobId=${jobId}`);
    return text;
  }

  async getResumeSuggestions(opts: {
    studentUserId: string;
    draftId: string;
    language?: 'ru' | 'kk' | 'en';
  }): Promise<string[]> {
    const client = this.requireClient();
    const { studentUserId, draftId, language = 'ru' } = opts;

    const profile = await this.studentProfiles.findOne({ where: { userId: studentUserId } });
    if (!profile) throw new ServiceUnavailableException('Student profile not found');

    const draft = await this.resumeDrafts.findOne({
      where: { id: draftId, studentProfileId: profile.id },
    });
    if (!draft) throw new ServiceUnavailableException('Resume draft not found');

    const langLabel: Record<string, string> = { ru: 'русском', kk: 'казахском', en: 'English' };
    const content = JSON.stringify(draft.contentJson).slice(0, 4000);

    const res = await client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            `Ты — карьерный консультант в Казахстане, специализирующийся на студенческих резюме. ` +
            `Анализируй резюме и давай конкретные, практические советы по улучшению. ` +
            `Отвечай на ${langLabel[language] ?? 'русском'} языке. ` +
            `Формат ответа: JSON {"suggestions":["совет 1","совет 2",...]}. Только JSON, без пояснений.`,
        },
        {
          role: 'user',
          content:
            `Проанализируй резюме студента и дай 5–7 конкретных советов по улучшению:\n\n` +
            `Заголовок: ${draft.title ?? 'не указан'}\n` +
            `Содержимое: ${content}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const raw = res.choices[0]?.message?.content?.trim() ?? '{}';
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const arr = Array.isArray(parsed['suggestions']) ? parsed['suggestions'] : [];
      return (arr as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 10);
    } catch {
      return [];
    }
  }

  async getInterviewQuestions(
    userId: string,
    role: UserRole,
    opts: {
    jobId: string;
    language?: 'ru' | 'kk' | 'en';
    count?: number;
  },
  ): Promise<string[]> {
    const client = this.requireClient();
    const { jobId, language = 'ru', count = 10 } = opts;

    const job = await this.jobs.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== JobStatus.PUBLISHED && job.employerUserId !== userId) {
      throw new ForbiddenException();
    }

    const langLabel: Record<string, string> = { ru: 'русском', kk: 'казахском', en: 'English' };

    const res = await client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            `Ты — HR-эксперт. Составляй вопросы для подготовки студента к собеседованию. ` +
            `Отвечай на ${langLabel[language] ?? 'русском'} языке. ` +
            `Формат ответа: JSON {"questions":["вопрос 1","вопрос 2",...]}. Только JSON.`,
        },
        {
          role: 'user',
          content:
            `Составь ${count} вопросов для подготовки студента к собеседованию:\n\n` +
            `Вакансия: ${job.title}\n` +
            `Описание: ${job.description.slice(0, 1500)}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    const raw = res.choices[0]?.message?.content?.trim() ?? '{}';
    try {
      const parsed = JSON.parse(raw) as { questions?: unknown[] };
      return (parsed.questions ?? [])
        .filter((s): s is string => typeof s === 'string')
        .slice(0, count);
    } catch {
      return [];
    }
  }
}
