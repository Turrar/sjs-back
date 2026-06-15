import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JobStatus } from '../../common/enums/job-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { normalizeNameI18n } from '../../common/utils/catalog-i18n.util';
import {
  CityEntity,
  ApplicationEntity,
  EmployerProfileEntity,
  EntityEmbeddingEntity,
  JobCategoryEntity,
  JobEntity,
  StudentProfileEntity,
  TagEntity,
} from '../../database/entities';
import { AiService } from '../ai/ai.service';
import { cosineSimilarity } from '../ai/cosine-similarity';
import { buildJobEmbeddingText } from '../ai/embedding-text.util';
import { ScheduleCompatibilityService } from '../schedule/schedule-compatibility.service';
import { ScheduleService } from '../schedule/schedule.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { mapJobResponse, type StudentApplicationRef } from './job.mapper';

const jobRelations = ['city', 'categories', 'tags'] as const;

@Injectable()
export class JobsService {
  private readonly log = new Logger(JobsService.name);

  constructor(
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(EmployerProfileEntity)
    private readonly employers: Repository<EmployerProfileEntity>,
    @InjectRepository(CityEntity)
    private readonly cities: Repository<CityEntity>,
    @InjectRepository(JobCategoryEntity)
    private readonly jobCategories: Repository<JobCategoryEntity>,
    @InjectRepository(TagEntity)
    private readonly tags: Repository<TagEntity>,
    @InjectRepository(EntityEmbeddingEntity)
    private readonly embeddings: Repository<EntityEmbeddingEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly studentProfiles: Repository<StudentProfileEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    private readonly schedule: ScheduleService,
    private readonly scheduleFit: ScheduleCompatibilityService,
    private readonly ai: AiService,
  ) {}

  private normalizeJobCatalog(job: JobEntity): void {
    if (job.city) {
      Object.assign(job.city, normalizeNameI18n(job.city));
    }
    job.categories?.forEach((c) =>
      Object.assign(c, normalizeNameI18n(c)),
    );
    job.tags?.forEach((t) => Object.assign(t, normalizeNameI18n(t)));
  }

  async create(employerUserId: string, dto: CreateJobDto) {
    const ep = await this.employers.findOne({
      where: { userId: employerUserId },
    });
    if (!ep) {
      throw new ForbiddenException('Employer profile required');
    }
    if (dto.cityId) {
      const c = await this.cities.findOne({ where: { id: dto.cityId } });
      if (!c) {
        throw new BadRequestException('Invalid cityId');
      }
    }
    let categoryEntities: JobCategoryEntity[] | undefined;
    if (dto.categoryIds?.length) {
      categoryEntities = await this.jobCategories.findBy({
        id: In(dto.categoryIds),
      });
      if (categoryEntities.length !== dto.categoryIds.length) {
        throw new BadRequestException('One or more categoryIds are invalid');
      }
    }
    const job = this.jobs.create({
      employerUserId,
      employerProfileId: ep.id,
      title: dto.title,
      description: dto.description,
      status: JobStatus.DRAFT,
      location: dto.location ?? null,
      cityId: dto.cityId ?? null,
      salaryMin: dto.salaryMin ?? null,
      salaryMax: dto.salaryMax ?? null,
      currency: dto.currency ?? 'USD',
      requiredWeeklyHours: dto.requiredWeeklyHours ?? null,
      workWindows: dto.workWindows ?? null,
      requiresResume: dto.requiresResume ?? false,
      requiresCoverLetter: dto.requiresCoverLetter ?? false,
    });
    let saved = await this.jobs.save(job);
    if (categoryEntities?.length) {
      saved.categories = categoryEntities;
      saved = await this.jobs.save(saved);
    }
    if (dto.tagIds?.length) {
      const tagRows = await this.tags.findBy({ id: In(dto.tagIds) });
      if (tagRows.length !== dto.tagIds.length) {
        throw new BadRequestException('One or more tagIds are invalid');
      }
      saved.tags = tagRows;
      saved = await this.jobs.save(saved);
    }
    this.log.log(
      `Job created jobId=${saved.id} employerUserId=${employerUserId} status=${saved.status}`,
    );
    const created = await this.jobs.findOne({
      where: { id: saved.id },
      relations: [...jobRelations],
    });
    if (created) {
      this.normalizeJobCatalog(created);
    }
    return created;
  }

  async update(jobId: string, employerUserId: string, dto: UpdateJobDto) {
    const job = await this.requireEmployerJob(jobId, employerUserId);
    if (dto.title !== undefined) {
      job.title = dto.title;
    }
    if (dto.description !== undefined) {
      job.description = dto.description;
    }
    if (dto.status !== undefined) {
      job.status = dto.status;
    }
    if (dto.location !== undefined) {
      job.location = dto.location;
    }
    if (dto.cityId !== undefined) {
      if (dto.cityId === null) {
        job.cityId = null;
      } else {
        const c = await this.cities.findOne({ where: { id: dto.cityId } });
        if (!c) {
          throw new BadRequestException('Invalid cityId');
        }
        job.cityId = dto.cityId;
      }
    }
    if (dto.categoryIds !== undefined) {
      if (!dto.categoryIds.length) {
        job.categories = [];
      } else {
        const catRows = await this.jobCategories.findBy({
          id: In(dto.categoryIds),
        });
        if (catRows.length !== dto.categoryIds.length) {
          throw new BadRequestException('One or more categoryIds are invalid');
        }
        job.categories = catRows;
      }
    }
    if (dto.salaryMin !== undefined) {
      job.salaryMin = dto.salaryMin;
    }
    if (dto.salaryMax !== undefined) {
      job.salaryMax = dto.salaryMax;
    }
    if (dto.currency !== undefined) {
      job.currency = dto.currency;
    }
    if (dto.requiredWeeklyHours !== undefined) {
      job.requiredWeeklyHours = dto.requiredWeeklyHours;
    }
    if (dto.workWindows !== undefined) {
      job.workWindows = dto.workWindows;
    }
    if (dto.requiresResume !== undefined) {
      job.requiresResume = dto.requiresResume;
    }
    if (dto.requiresCoverLetter !== undefined) {
      job.requiresCoverLetter = dto.requiresCoverLetter;
    }
    if (dto.tagIds !== undefined) {
      if (!dto.tagIds.length) {
        job.tags = [];
      } else {
        const tagRows = await this.tags.findBy({ id: In(dto.tagIds) });
        if (tagRows.length !== dto.tagIds.length) {
          throw new BadRequestException('One or more tagIds are invalid');
        }
        job.tags = tagRows;
      }
    }
    const saved = await this.jobs.save(job);
    if (saved.status === JobStatus.PUBLISHED) {
      try {
        await this.ai.enqueueEmbedding({
          target: 'job',
          entityId: saved.id,
          textChunks: [buildJobEmbeddingText(saved)],
        });
      } catch (e) {
        this.log.warn(
          `Could not enqueue job embedding: ${e instanceof Error ? e.message : e}`,
        );
      }
    }
    const updated = await this.jobs.findOne({
      where: { id: saved.id },
      relations: [...jobRelations],
    });
    if (updated) {
      this.normalizeJobCatalog(updated);
    }
    return updated;
  }

  async remove(jobId: string, employerUserId: string) {
    const job = await this.requireEmployerJob(jobId, employerUserId);
    await this.jobs.remove(job);
  }

  async findOne(id: string, user?: JwtPayload) {
    const job = await this.jobs.findOne({
      where: { id },
      relations: [...jobRelations],
    });
    if (!job) {
      throw new NotFoundException();
    }
    const canAccess =
      job.status === JobStatus.PUBLISHED ||
      (user?.role === UserRole.EMPLOYER && job.employerUserId === user.sub);
    if (!canAccess) {
      throw new NotFoundException();
    }
    this.normalizeJobCatalog(job);
    const matchScore =
      user?.role === UserRole.STUDENT
        ? await this.computeMatchScore(user.sub, job.id)
        : null;
    const application =
      user?.role === UserRole.STUDENT
        ? await this.findStudentApplication(user.sub, job.id)
        : undefined;
    return mapJobResponse(job, { matchScore, application });
  }

  private async findStudentApplication(
    studentUserId: string,
    jobId: string,
  ): Promise<StudentApplicationRef | null> {
    const row = await this.applications.findOne({
      where: { studentUserId, jobId },
      select: ['id', 'status'],
    });
    return row ? { id: row.id, status: row.status } : null;
  }

  private async loadStudentApplicationIndex(
    studentUserId: string,
  ): Promise<Map<string, StudentApplicationRef>> {
    const rows = await this.applications.find({
      where: { studentUserId },
      select: ['id', 'jobId', 'status'],
    });
    return new Map(
      rows.map((row) => [row.jobId, { id: row.id, status: row.status }]),
    );
  }

  /** Cosine similarity [0..100] between student profile and job embeddings; null when not available. */
  private async computeMatchScore(
    userId: string,
    jobId: string,
  ): Promise<number | null> {
    try {
      const profile = await this.studentProfiles.findOne({ where: { userId } });
      if (!profile) return null;
      const [studentEmb, jobEmb] = await Promise.all([
        this.embeddings.findOne({
          where: { target: 'student_profile', entityId: profile.id },
        }),
        this.embeddings.findOne({ where: { target: 'job', entityId: jobId } }),
      ]);
      if (!studentEmb?.embedding?.length || !jobEmb?.embedding?.length) {
        return null;
      }
      return Math.round(cosineSimilarity(studentEmb.embedding, jobEmb.embedding) * 100);
    } catch {
      return null;
    }
  }

  /**
   * Рекомендованные вакансии для студента по векторному сходству профиля.
   * Опционально фильтрует по совместимости с расписанием студента.
   */
  async findRecommended(opts: {
    userId: string;
    limit?: number;
    compatibleWithSchedule?: boolean;
  }) {
    const { userId, limit = 10, compatibleWithSchedule = false } = opts;

    const profile = await this.studentProfiles.findOne({ where: { userId } });
    if (!profile) {
      throw new ForbiddenException('Student profile required');
    }

    // Эмбеддинг профиля студента
    const studentEmb = await this.embeddings.findOne({
      where: { target: 'student_profile', entityId: profile.id },
    });

    // Все эмбеддинги опубликованных вакансий
    const jobEmbRows = await this.embeddings.find({ where: { target: 'job' } });
    if (!jobEmbRows.length) return [];

    // Вычисляем cosine similarity в памяти
    const scored: Array<{ jobId: string; score: number }> = jobEmbRows.map((row) => ({
      jobId: row.entityId,
      score:
        studentEmb?.embedding?.length
          ? Math.round(cosineSimilarity(studentEmb.embedding, row.embedding) * 100)
          : 0,
    }));

    scored.sort((a, b) => b.score - a.score);
    const scoreMap = new Map(scored.map((s) => [s.jobId, s.score]));

    // Берём с запасом на случай фильтрации по расписанию
    const candidateIds = scored.slice(0, limit * 4).map((s) => s.jobId);

    const qb = this.jobs
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.city', 'city')
      .leftJoinAndSelect('job.categories', 'categories')
      .leftJoinAndSelect('job.tags', 'tags')
      .where('job.status = :st', { st: JobStatus.PUBLISHED })
      .andWhere('job.id IN (:...ids)', { ids: candidateIds });

    let rows = await qb.getMany();

    const appliedIndex = await this.loadStudentApplicationIndex(userId);
    rows = rows.filter((j) => !appliedIndex.has(j.id));

    if (compatibleWithSchedule) {
      const busy = await this.schedule.getBusySlotsForStudentUser(userId);
      rows = rows.filter((j) =>
        this.scheduleFit.isJobCompatible(busy, j.workWindows ?? undefined),
      );
    }

    // Сортируем по score, берём top-N
    rows.sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
    rows = rows.slice(0, limit);
    rows.forEach((j) => this.normalizeJobCatalog(j));

    return rows.map((j) =>
      mapJobResponse(j, {
        matchScore: scoreMap.get(j.id) ?? null,
        application: null,
      }),
    );
  }

  async listMine(employerUserId: string) {
    const rows = await this.jobs.find({
      where: { employerUserId },
      relations: [...jobRelations],
      order: { createdAt: 'DESC' },
    });
    rows.forEach((j) => this.normalizeJobCatalog(j));
    return rows;
  }

  async findPublished(opts: {
    compatibleWithSchedule?: boolean;
    excludeApplied?: boolean;
    user?: JwtPayload;
    q?: string;
    location?: string;
    cityId?: string;
    categoryId?: string;
    tagId?: string;
  }) {
    const {
      compatibleWithSchedule,
      excludeApplied = true,
      user,
      q,
      location,
      cityId,
      categoryId,
      tagId,
    } = opts;
    if (compatibleWithSchedule) {
      if (!user || user.role !== UserRole.STUDENT) {
        throw new BadRequestException(
          'compatibleWithSchedule requires a logged-in student',
        );
      }
    }
    const qb = this.jobs
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.city', 'city')
      .leftJoinAndSelect('job.categories', 'categories')
      .leftJoinAndSelect('job.tags', 'tags')
      .where('job.status = :st', { st: JobStatus.PUBLISHED });
    if (q) {
      qb.andWhere('job.title ILIKE :q', { q: `%${q}%` });
    }
    if (location) {
      qb.andWhere('job.location ILIKE :loc', { loc: `%${location}%` });
    }
    if (cityId) {
      qb.andWhere('job.city_id = :cityId', { cityId });
    }
    if (categoryId) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM job_job_categories jjc WHERE jjc.job_id = job.id AND jjc.job_category_id = :categoryId)`,
        { categoryId },
      );
    }
    if (tagId) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM job_tags jt WHERE jt.job_id = job.id AND jt.tag_id = :tagId)`,
        { tagId },
      );
    }
    const isStudent = user?.role === UserRole.STUDENT;
    if (isStudent && excludeApplied) {
      qb.andWhere(
        `NOT EXISTS (
          SELECT 1 FROM applications app
          WHERE app.job_id = job.id AND app.student_user_id = :studentUserId
        )`,
        { studentUserId: user.sub },
      );
    }
    let rows = await qb
      .orderBy('job.isPremium', 'DESC')
      .addOrderBy('job.createdAt', 'DESC')
      .getMany();
    if (compatibleWithSchedule && user) {
      const busy = await this.schedule.getBusySlotsForStudentUser(user.sub);
      rows = rows.filter((job) =>
        this.scheduleFit.isJobCompatible(busy, job.workWindows ?? undefined),
      );
    }
    rows.forEach((j) => this.normalizeJobCatalog(j));

    if (!isStudent) {
      return rows;
    }

    const appliedIndex =
      excludeApplied ? null : await this.loadStudentApplicationIndex(user.sub);

    return rows.map((j) =>
      mapJobResponse(j, {
        application: excludeApplied
          ? null
          : (appliedIndex?.get(j.id) ?? null),
      }),
    );
  }

  private async requireEmployerJob(jobId: string, employerUserId: string) {
    const job = await this.jobs.findOne({
      where: { id: jobId },
      relations: [...jobRelations],
    });
    if (!job || job.employerUserId !== employerUserId) {
      throw new NotFoundException();
    }
    return job;
  }
}
