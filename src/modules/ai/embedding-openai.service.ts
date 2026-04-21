import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingOpenAiService {
  private readonly log = new Logger(EmbeddingOpenAiService.name);
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('OPENAI_API_KEY')?.trim();
    this.model = this.config.get<string>(
      'OPENAI_EMBEDDING_MODEL',
      'text-embedding-3-small',
    );
    this.client = key ? new OpenAI({ apiKey: key }) : null;
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  getModel(): string {
    return this.model;
  }

  /** Single text → embedding (truncated for API limits). */
  async embedDocument(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('OpenAI embeddings are not configured');
    }
    const input = text.trim().slice(0, 30_000);
    if (!input) {
      throw new Error('Empty text for embedding');
    }
    const res = await this.client.embeddings.create({
      model: this.model,
      input,
    });
    const vec = res.data[0]?.embedding;
    if (!vec || !Array.isArray(vec)) {
      this.log.error('Unexpected embeddings response shape');
      throw new Error('Invalid embedding response');
    }
    return vec;
  }
}
