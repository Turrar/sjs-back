import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { ScheduleParseStatus } from '../../common/enums/schedule-parse-status.enum';
import {
  ScheduleSlotEntity,
  ScheduleSourceEntity,
} from '../../database/entities';
import { UploadService } from '../upload/upload.service';
import type {
  ParsedScheduleLessonJson,
  ParseScheduleJobPayload,
} from './contracts/ai-contracts';
import { AI_QUEUE_PARSE_SCHEDULE } from './queues/ai-queue.constants';
import { ScheduleOpenAiParserService } from './schedule-openai-parser.service';

@Processor(AI_QUEUE_PARSE_SCHEDULE)
export class ParseScheduleProcessor extends WorkerHost {
  private readonly log = new Logger(ParseScheduleProcessor.name);

  constructor(
    @InjectRepository(ScheduleSourceEntity)
    private readonly sources: Repository<ScheduleSourceEntity>,
    @InjectRepository(ScheduleSlotEntity)
    private readonly slots: Repository<ScheduleSlotEntity>,
    private readonly upload: UploadService,
    private readonly openAiParser: ScheduleOpenAiParserService,
  ) {
    super();
  }

  async process(job: Job<ParseScheduleJobPayload>): Promise<void> {
    const { scheduleSourceId, storageKey, mimeType } = job.data;
    const source = await this.sources.findOne({
      where: { id: scheduleSourceId },
      relations: ['studentProfile'],
    });
    if (!source) {
      this.log.warn(`Missing schedule source ${scheduleSourceId}`);
      return;
    }
    source.parseStatus = ScheduleParseStatus.PROCESSING;
    await this.sources.save(source);
    try {
      await this.slots.delete({ scheduleSourceId: source.id });
      const profileId = source.studentProfileId;
      await this.slots.delete({ studentProfileId: profileId });

      let lessons: ParsedScheduleLessonJson[];
      let rawMeta: Record<string, unknown>;

      if (this.openAiParser.isEnabled()) {
        const buffer = await this.upload.getObjectBuffer(storageKey);
        lessons = await this.openAiParser.parseLessons(buffer, mimeType);
        rawMeta = {
          source: 'openai',
          model: this.openAiParser.getModel(),
          jobId: job.id,
        };
      } else {
        this.log.warn(
          'OPENAI_API_KEY not set; using placeholder schedule slots',
        );
        lessons = this.placeholderLessons();
        rawMeta = { placeholder: true, jobId: job.id };
      }

      for (const s of lessons) {
        await this.slots.save(
          this.slots.create({
            studentProfileId: profileId,
            scheduleSourceId: source.id,
            dayOfWeek: s.dayOfWeek,
            startMinute: s.startMinute,
            endMinute: s.endMinute,
            label: s.label ?? null,
          }),
        );
      }
      source.parseStatus = ScheduleParseStatus.READY;
      source.rawAiJson = rawMeta;
      await this.sources.save(source);
    } catch (e) {
      if (UploadService.isObjectNotFoundError(e)) {
        this.log.warn(
          `Schedule file not found in storage key=${storageKey} sourceId=${scheduleSourceId}`,
        );
        source.parseStatus = ScheduleParseStatus.FAILED;
        source.rawAiJson = {
          error: 'storage_file_not_found',
          storageKey,
          jobId: job.id,
        };
        await this.sources.save(source);
        return;
      }
      this.log.error(e);
      source.parseStatus = ScheduleParseStatus.FAILED;
      await this.sources.save(source);
      throw e;
    }
  }

  private placeholderLessons(): ParsedScheduleLessonJson[] {
    return [
      {
        dayOfWeek: 0,
        startMinute: 9 * 60,
        endMinute: 12 * 60,
        label: 'Class A',
      },
      {
        dayOfWeek: 0,
        startMinute: 14 * 60,
        endMinute: 18 * 60,
        label: 'Class B',
      },
      {
        dayOfWeek: 2,
        startMinute: 10 * 60,
        endMinute: 13 * 60,
        label: 'Class C',
      },
    ];
  }
}
