import { ScheduleParseStatus } from '../../../common/enums/schedule-parse-status.enum';

/** Vision / LLM output for one class block before normalization into ScheduleSlot rows */
export type ParsedScheduleLessonJson = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  label?: string;
};

export type ParseScheduleVisionResult = {
  lessons: ParsedScheduleLessonJson[];
  confidence?: number;
  rawModelText?: string;
};

export type ParseScheduleJobPayload = {
  scheduleSourceId: string;
  storageKey: string;
  mimeType: string;
};

export type ParseScheduleJobResult = {
  scheduleSourceId: string;
  status: ScheduleParseStatus;
  errorMessage?: string;
};

/** Embedding job for pgvector upsert */
export type EmbeddingTarget = 'student_profile' | 'job' | 'resume_draft';

export type EmbeddingJobPayload = {
  target: EmbeddingTarget;
  entityId: string;
  textChunks: string[];
};

/** Employer-facing score for an application */
export type ScoreApplicationPayload = {
  applicationId: string;
  jobId: string;
  studentUserId: string;
};

export type ScoreApplicationResult = {
  applicationId: string;
  score: number;
  rationale?: string;
};
