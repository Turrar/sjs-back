import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { ApplicationEntity, ResumeDraftEntity } from '../../database/entities';
import type { ScoreApplicationPayload } from './contracts/ai-contracts';
import { cosineSimilarity } from './cosine-similarity';
import { EmbeddingOpenAiService } from './embedding-openai.service';
import {
  buildJobEmbeddingText,
  buildStudentScoringText,
} from './embedding-text.util';
import { EmbeddingVectorStorageService } from './embedding-vector-storage.service';
import { AI_QUEUE_SCORE_APPLICATION } from './queues/ai-queue.constants';

@Processor(AI_QUEUE_SCORE_APPLICATION)
export class ScoreApplicationProcessor extends WorkerHost {
  private readonly log = new Logger(ScoreApplicationProcessor.name);

  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(ResumeDraftEntity)
    private readonly resumeDrafts: Repository<ResumeDraftEntity>,
    private readonly openAiEmbeddings: EmbeddingOpenAiService,
    private readonly vectorStorage: EmbeddingVectorStorageService,
  ) {
    super();
  }

  async process(job: Job<ScoreApplicationPayload>): Promise<void> {
    if (!this.openAiEmbeddings.isEnabled()) {
      this.log.warn('OPENAI_API_KEY missing; skipping application score job');
      return;
    }
    const { applicationId } = job.data;
    const app = await this.applications.findOne({
      where: { id: applicationId },
      relations: ['job', 'studentProfile'],
    });
    if (!app) {
      this.log.warn(`Application ${applicationId} not found`);
      return;
    }
    const jobRow = app.job;
    const profile = app.studentProfile;
    const latestResume = await this.resumeDrafts.findOne({
      where: { studentProfileId: profile.id },
      order: { updatedAt: 'DESC' },
    });
    const jobText = buildJobEmbeddingText(jobRow);
    const studentText = buildStudentScoringText(profile, latestResume);
    if (!studentText.trim()) {
      this.log.warn(
        `Student profile ${profile.id} has no text for scoring; score skipped`,
      );
      return;
    }
    const jobVec = await this.vectorStorage.getOrComputeVector(
      'job',
      jobRow.id,
      jobText,
    );
    const studentVec = await this.vectorStorage.getOrComputeVector(
      'student_profile',
      profile.id,
      studentText,
    );
    const sim = cosineSimilarity(jobVec, studentVec);
    const score = Math.round(Math.max(0, Math.min(100, sim * 100)));
    app.employerScore = score;
    await this.applications.save(app);
  }
}
