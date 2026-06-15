import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { JobStatus } from '../../common/enums/job-status.enum';
import { NotificationKind } from '../../common/enums/notification-kind.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  assertEmployerStatusTransition,
  assertStudentWithdraw,
} from '../../common/utils/application-status.util';
import {
  ApplicationEntity,
  ChatRoomEntity,
  InternshipEntity,
  InternshipStatus,
  JobEntity,
  ResumeDraftEntity,
  StudentProfileEntity,
} from '../../database/entities';
import { AiService } from '../ai/ai.service';
import { EmployerReviewsService } from '../employer-reviews/employer-reviews.service';
import { GamificationService } from '../gamification/gamification.service';
import { PointEventType } from '../../database/entities/user-points.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadService } from '../upload/upload.service';
import { mapApplication } from './application.mapper';

const applicationRelations = [
  'job',
  'job.city',
  'student',
  'studentProfile',
  'resumeDraft',
] as const;

@Injectable()
export class ApplicationsService {
  private readonly log = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly students: Repository<StudentProfileEntity>,
    @InjectRepository(ResumeDraftEntity)
    private readonly resumeDrafts: Repository<ResumeDraftEntity>,
    @InjectRepository(ChatRoomEntity)
    private readonly chatRooms: Repository<ChatRoomEntity>,
    @InjectRepository(InternshipEntity)
    private readonly internships: Repository<InternshipEntity>,
    private readonly notifications: NotificationsService,
    private readonly ai: AiService,
    private readonly gamification: GamificationService,
    private readonly reviews: EmployerReviewsService,
    private readonly upload: UploadService,
  ) {}

  async apply(
    studentUserId: string,
    dto: { jobId: string; resumeDraftId?: string; coverLetter?: string },
  ) {
    const job = await this.jobs.findOne({ where: { id: dto.jobId } });
    if (!job || job.status !== JobStatus.PUBLISHED) {
      throw new NotFoundException('Job not found');
    }
    const profile = await this.students.findOne({
      where: { userId: studentUserId },
    });
    if (!profile) {
      throw new ForbiddenException('Student profile required');
    }
    const coverLetter = dto.coverLetter?.trim() || null;
    if (job.requiresResume && !dto.resumeDraftId) {
      throw new BadRequestException('Resume is required for this job');
    }
    if (job.requiresCoverLetter && !coverLetter) {
      throw new BadRequestException('Cover letter is required for this job');
    }

    let resumeDraftId: string | null = null;
    if (dto.resumeDraftId) {
      const draft = await this.resumeDrafts.findOne({
        where: { id: dto.resumeDraftId, studentProfileId: profile.id },
      });
      if (!draft) {
        throw new NotFoundException('Resume draft not found');
      }
      resumeDraftId = draft.id;
    }

    const existing = await this.applications.findOne({
      where: { jobId: dto.jobId, studentUserId },
    });
    if (existing) {
      throw new ConflictException('Already applied');
    }
    const app = await this.applications.save(
      this.applications.create({
        jobId: dto.jobId,
        studentUserId,
        studentProfileId: profile.id,
        status: ApplicationStatus.SUBMITTED,
        coverLetter,
        resumeDraftId,
      }),
    );
    await this.chatRooms.save(
      this.chatRooms.create({
        applicationId: app.id,
      }),
    );
    this.log.log(
      `Application created id=${app.id} jobId=${dto.jobId} studentUserId=${studentUserId}`,
    );
    await this.notifications.create(
      job.employerUserId,
      NotificationKind.APPLICATION_UPDATE,
      {
        applicationId: app.id,
        jobId: job.id,
        jobTitle: job.title,
        message: 'New application received',
      },
    );
    try {
      await this.ai.enqueueScoreApplication({
        applicationId: app.id,
        jobId: app.jobId,
        studentUserId: app.studentUserId,
      });
    } catch (e) {
      this.log.warn(
        `Could not enqueue application score job: ${e instanceof Error ? e.message : e}`,
      );
    }
    this.gamification.award(studentUserId, PointEventType.FIRST_APPLICATION).catch(() => null);
    return this.loadAndMap(app.id, studentUserId);
  }

  async listMine(studentUserId: string) {
    const rows = await this.applications.find({
      where: { studentUserId },
      relations: [...applicationRelations],
      order: { createdAt: 'DESC' },
    });
    const employerIds = rows
      .map((r) => r.job?.employerUserId)
      .filter((id): id is string => !!id);
    const reviewed = await this.reviews.hasReviewedEmployerIds(
      studentUserId,
      employerIds,
    );
    return Promise.all(
      rows.map((r) =>
        this.mapWithResumeUrl(r, {
          hasReviewed: r.job?.employerUserId
            ? reviewed.has(r.job.employerUserId)
            : false,
        }),
      ),
    );
  }

  async listForJob(
    employerUserId: string,
    jobId: string,
    status?: ApplicationStatus,
  ) {
    const job = await this.jobs.findOne({ where: { id: jobId } });
    if (!job || job.employerUserId !== employerUserId) {
      throw new NotFoundException();
    }
    const rows = await this.applications.find({
      where: { jobId, ...(status ? { status } : {}) },
      relations: [...applicationRelations],
      order: { createdAt: 'DESC' },
    });
    return Promise.all(rows.map((r) => this.mapWithResumeUrl(r)));
  }

  async findOne(
    userId: string,
    role: UserRole,
    applicationId: string,
  ) {
    const app = await this.applications.findOne({
      where: { id: applicationId },
      relations: [...applicationRelations],
    });
    if (!app) {
      throw new NotFoundException();
    }
    if (role === UserRole.STUDENT && app.studentUserId !== userId) {
      throw new NotFoundException();
    }
    if (role === UserRole.EMPLOYER) {
      if (!app.job || app.job.employerUserId !== userId) {
        throw new NotFoundException();
      }
      return this.mapWithResumeUrl(app);
    }
    const hasReviewed = app.job?.employerUserId
      ? await this.reviews.hasReviewed(userId, app.job.employerUserId)
      : false;
    return this.mapWithResumeUrl(app, { hasReviewed });
  }

  async withdraw(studentUserId: string, applicationId: string) {
    const app = await this.applications.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });
    if (!app || app.studentUserId !== studentUserId) {
      throw new NotFoundException();
    }
    assertStudentWithdraw(app.status);

    const activeInternship = await this.internships.findOne({
      where: {
        applicationId,
        status: InternshipStatus.ACTIVE,
      },
    });
    if (activeInternship) {
      throw new BadRequestException(
        'Cannot withdraw application with an active internship',
      );
    }

    app.status = ApplicationStatus.WITHDRAWN;
    await this.applications.save(app);
    await this.notifications.create(
      app.job.employerUserId,
      NotificationKind.APPLICATION_UPDATE,
      {
        applicationId: app.id,
        jobId: app.jobId,
        jobTitle: app.job.title,
        status: ApplicationStatus.WITHDRAWN,
        message: 'Application withdrawn by student',
      },
    );
    return this.loadAndMap(applicationId, studentUserId);
  }

  private async loadAndMap(applicationId: string, studentUserId?: string) {
    const app = await this.applications.findOne({
      where: { id: applicationId },
      relations: [...applicationRelations],
    });
    if (!app) {
      throw new NotFoundException();
    }
    if (studentUserId) {
      const hasReviewed = app.job?.employerUserId
        ? await this.reviews.hasReviewed(studentUserId, app.job.employerUserId)
        : false;
      return this.mapWithResumeUrl(app, { hasReviewed });
    }
    return this.mapWithResumeUrl(app);
  }

  async updateStatus(
    employerUserId: string,
    applicationId: string,
    status: ApplicationStatus,
  ) {
    const app = await this.applications.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });
    if (!app || app.job.employerUserId !== employerUserId) {
      throw new NotFoundException();
    }
    assertEmployerStatusTransition(app.status, status);
    app.status = status;
    await this.applications.save(app);
    await this.notifications.create(
      app.studentUserId,
      NotificationKind.APPLICATION_UPDATE,
      {
        applicationId: app.id,
        jobId: app.jobId,
        jobTitle: app.job.title,
        status,
      },
    );
    return this.loadAndMap(applicationId);
  }

  private async mapWithResumeUrl(
    app: ApplicationEntity,
    extras?: { hasReviewed?: boolean },
  ) {
    const resumePdfUrl = await this.resolveResumePdfUrl(app.resumeDraft);
    return mapApplication(app, {
      ...extras,
      resumePdfUrl,
    });
  }

  private async resolveResumePdfUrl(
    draft: ResumeDraftEntity | null | undefined,
  ): Promise<string | null> {
    if (!draft?.pdfStorageKey) return null;
    return this.upload.resolvePublicUrl(draft.pdfStorageKey);
  }
}
