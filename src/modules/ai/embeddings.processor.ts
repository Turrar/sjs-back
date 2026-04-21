import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { EmbeddingJobPayload } from './contracts/ai-contracts';
import { EmbeddingOpenAiService } from './embedding-openai.service';
import { EmbeddingVectorStorageService } from './embedding-vector-storage.service';
import { AI_QUEUE_EMBEDDINGS } from './queues/ai-queue.constants';

@Processor(AI_QUEUE_EMBEDDINGS)
export class EmbeddingsProcessor extends WorkerHost {
  private readonly log = new Logger(EmbeddingsProcessor.name);

  constructor(
    private readonly openAiEmbeddings: EmbeddingOpenAiService,
    private readonly vectorStorage: EmbeddingVectorStorageService,
  ) {
    super();
  }

  async process(job: Job<EmbeddingJobPayload>): Promise<void> {
    if (!this.openAiEmbeddings.isEnabled()) {
      this.log.warn('OPENAI_API_KEY missing; skipping embedding job');
      return;
    }
    const { target, entityId, textChunks } = job.data;
    const text = textChunks
      .map((c) => c.trim())
      .filter(Boolean)
      .join('\n\n');
    await this.vectorStorage.syncFromText(target, entityId, text);
  }
}
