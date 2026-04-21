import {
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
import {
  ApplicationEntity,
  ChatRoomEntity,
  JobEntity,
  StudentProfileEntity,
} from '../../database/entities';
import { AiService } from '../ai/ai.service';
import { GamificationService } from '../gamification/gamification.service';
import { PointEventType } from '../../database/entities/user-points.entity';
import { NotificationsService } from '../notifications/notifications.service';

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
    @InjectRepository(ChatRoomEntity)
    private readonly chatRooms: Repository<ChatRoomEntity>,
    private readonly notifications: NotificationsService,
    private readonly ai: AiService,
    private readonly gamification: GamificationService,
  ) {}

  async apply(
    studentUserId: string,
    dto: { jobId: string; coverLetter?: string },
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
        coverLetter: dto.coverLetter ?? null,
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
    // Очки за первый отклик (идемпотентно)
    this.gamification.award(studentUserId, PointEventType.FIRST_APPLICATION).catch(() => null);
    return app;
  }

  async listMine(studentUserId: string) {
    return this.applications.find({
      where: { studentUserId },
      relations: ['job'],
      order: { createdAt: 'DESC' },
    });
  }

  async listForJob(employerUserId: string, jobId: string) {
    const job = await this.jobs.findOne({ where: { id: jobId } });
    if (!job || job.employerUserId !== employerUserId) {
      throw new NotFoundException();
    }
    return this.applications.find({
      where: { jobId },
      relations: ['student', 'studentProfile'],
      order: { createdAt: 'DESC' },
    });
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
    app.status = status;
    await this.applications.save(app);
    await this.notifications.create(
      app.studentUserId,
      NotificationKind.APPLICATION_UPDATE,
      {
        applicationId: app.id,
        jobId: app.jobId,
        status,
      },
    );
    return app;
  }
}
