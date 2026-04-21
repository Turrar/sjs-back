import { Injectable } from '@nestjs/common';
import { EmbeddingOpenAiService } from './embedding-openai.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type {
  EmbeddingJobPayload,
  ParseScheduleJobPayload,
  ScoreApplicationPayload,
} from './contracts/ai-contracts';
import {
  AI_QUEUE_EMBEDDINGS,
  AI_QUEUE_PARSE_SCHEDULE,
  AI_QUEUE_SCORE_APPLICATION,
} from './queues/ai-queue.constants';

const queueOpts = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 50,
};

@Injectable()
export class AiService {
  constructor(
    @InjectQueue(AI_QUEUE_PARSE_SCHEDULE)
    private readonly parseScheduleQueue: Queue,
    @InjectQueue(AI_QUEUE_EMBEDDINGS)
    private readonly embeddingsQueue: Queue,
    @InjectQueue(AI_QUEUE_SCORE_APPLICATION)
    private readonly scoreApplicationQueue: Queue,
    private readonly embeddingOpenAi: EmbeddingOpenAiService,
  ) {}

  async enqueueParseSchedule(payload: ParseScheduleJobPayload) {
    await this.parseScheduleQueue.add('parse', payload, queueOpts);
  }

  async enqueueEmbedding(payload: EmbeddingJobPayload) {
    await this.embeddingsQueue.add('embed', payload, queueOpts);
  }

  async enqueueScoreApplication(payload: ScoreApplicationPayload) {
    await this.scoreApplicationQueue.add('score', payload, queueOpts);
  }

  health(): {
    module: string;
    openaiEmbeddings: { configured: boolean; model: string };
  } {
    return {
      module: 'AiModule',
      openaiEmbeddings: {
        configured: this.embeddingOpenAi.isEnabled(),
        model: this.embeddingOpenAi.getModel(),
      },
    };
  }
}
