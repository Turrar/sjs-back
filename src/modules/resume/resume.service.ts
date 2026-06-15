import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ResumeDraftEntity,
  StudentProfileEntity,
} from '../../database/entities';
import { AiService } from '../ai/ai.service';
import { StudentAiService } from '../ai/student-ai.service';
import { GamificationService } from '../gamification/gamification.service';
import { PointEventType } from '../../database/entities/user-points.entity';
import { assertStorageKeyOwned } from '../../common/utils/storage-key.util';
import { buildResumeDraftText } from '../ai/embedding-text.util';
import { CreateResumeDraftDto } from './dto/create-resume-draft.dto';
import { UpdateResumeDraftDto } from './dto/update-resume-draft.dto';

@Injectable()
export class ResumeService {
  private readonly log = new Logger(ResumeService.name);

  constructor(
    @InjectRepository(ResumeDraftEntity)
    private readonly drafts: Repository<ResumeDraftEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly students: Repository<StudentProfileEntity>,
    private readonly ai: AiService,
    private readonly studentAi: StudentAiService,
    private readonly gamification: GamificationService,
  ) {}

  private async profileIdFor(userId: string) {
    const p = await this.students.findOne({ where: { userId } });
    if (!p) {
      throw new ForbiddenException('Student profile required');
    }
    return p.id;
  }

  async list(userId: string) {
    const sid = await this.profileIdFor(userId);
    return this.drafts.find({
      where: { studentProfileId: sid },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string) {
    const sid = await this.profileIdFor(userId);
    const row = await this.drafts.findOne({
      where: { id, studentProfileId: sid },
    });
    if (!row) {
      throw new NotFoundException();
    }
    return row;
  }

  async create(userId: string, dto: CreateResumeDraftDto) {
    const sid = await this.profileIdFor(userId);
    if (dto.pdfStorageKey) {
      assertStorageKeyOwned(userId, dto.pdfStorageKey);
    }
    const row = await this.drafts.save(
      this.drafts.create({
        studentProfileId: sid,
        title: dto.title ?? null,
        contentJson: dto.contentJson,
        pdfStorageKey: dto.pdfStorageKey ?? null,
      }),
    );
    this.log.log(
      `ResumeDraft created id=${row.id} studentProfileId=${sid} pdf=${Boolean(row.pdfStorageKey)}`,
    );
    await this.enqueueResumeEmbedding(row);
    this.gamification.award(userId, PointEventType.RESUME_CREATED).catch(() => null);
    return row;
  }

  async update(userId: string, id: string, dto: UpdateResumeDraftDto) {
    const sid = await this.profileIdFor(userId);
    const row = await this.drafts.findOne({
      where: { id, studentProfileId: sid },
    });
    if (!row) {
      throw new NotFoundException();
    }
    if (dto.title !== undefined) row.title = dto.title;
    if (dto.contentJson !== undefined) row.contentJson = dto.contentJson;
    if (dto.pdfStorageKey !== undefined) {
      if (dto.pdfStorageKey !== null) {
        assertStorageKeyOwned(userId, dto.pdfStorageKey);
      }
      row.pdfStorageKey = dto.pdfStorageKey;
    }
    const saved = await this.drafts.save(row);
    await this.enqueueResumeEmbedding(saved);
    return saved;
  }

  async remove(userId: string, id: string) {
    const sid = await this.profileIdFor(userId);
    const row = await this.drafts.findOne({
      where: { id, studentProfileId: sid },
    });
    if (!row) {
      throw new NotFoundException();
    }
    await this.drafts.remove(row);
  }

  async getSuggestions(
    userId: string,
    id: string,
    language: 'ru' | 'kk' | 'en' = 'ru',
  ): Promise<{ suggestions: string[] }> {
    const suggestions = await this.studentAi.getResumeSuggestions({
      studentUserId: userId,
      draftId: id,
      language,
    });
    return { suggestions };
  }

  private async enqueueResumeEmbedding(row: ResumeDraftEntity) {
    try {
      await this.ai.enqueueEmbedding({
        target: 'resume_draft',
        entityId: row.id,
        textChunks: [buildResumeDraftText(row)],
      });
    } catch (e) {
      this.log.warn(
        `Could not enqueue resume embedding: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
}
