import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApplicationEntity,
  EntityEmbeddingEntity,
  JobEntity,
  ResumeDraftEntity,
  ScheduleSlotEntity,
  ScheduleSourceEntity,
  StudentProfileEntity,
} from '../../database/entities';
import { UploadModule } from '../upload/upload.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { EmbeddingOpenAiService } from './embedding-openai.service';
import { EmbeddingVectorStorageService } from './embedding-vector-storage.service';
import { EmbeddingsProcessor } from './embeddings.processor';
import { ParseScheduleProcessor } from './parse-schedule.processor';
import {
  AI_QUEUE_EMBEDDINGS,
  AI_QUEUE_PARSE_SCHEDULE,
  AI_QUEUE_SCORE_APPLICATION,
} from './queues/ai-queue.constants';
import { ScheduleOpenAiParserService } from './schedule-openai-parser.service';
import { ScoreApplicationProcessor } from './score-application.processor';
import { StudentAiService } from './student-ai.service';

@Module({
  imports: [
    UploadModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: AI_QUEUE_PARSE_SCHEDULE },
      { name: AI_QUEUE_EMBEDDINGS },
      { name: AI_QUEUE_SCORE_APPLICATION },
    ),
    TypeOrmModule.forFeature([
      ScheduleSourceEntity,
      ScheduleSlotEntity,
      EntityEmbeddingEntity,
      ApplicationEntity,
      ResumeDraftEntity,
      JobEntity,
      StudentProfileEntity,
    ]),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    EmbeddingOpenAiService,
    EmbeddingVectorStorageService,
    ScheduleOpenAiParserService,
    ParseScheduleProcessor,
    EmbeddingsProcessor,
    ScoreApplicationProcessor,
    StudentAiService,
  ],
  exports: [AiService, StudentAiService, EmbeddingVectorStorageService],
})
export class AiModule {}
