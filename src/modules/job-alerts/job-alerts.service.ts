import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { NotificationKind } from '../../common/enums/notification-kind.enum';
import { JobAlertEntity, JobEntity } from '../../database/entities';
import { JobStatus } from '../../common/enums/job-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateJobAlertDto, UpdateJobAlertDto } from './dto/create-job-alert.dto';

@Injectable()
export class JobAlertsService {
  private readonly log = new Logger(JobAlertsService.name);

  constructor(
    @InjectRepository(JobAlertEntity)
    private readonly alerts: Repository<JobAlertEntity>,
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(studentUserId: string, dto: CreateJobAlertDto): Promise<JobAlertEntity> {
    const alert = this.alerts.create({
      studentUserId,
      cityId: dto.cityId ?? null,
      categoryId: dto.categoryId ?? null,
      tagIds: dto.tagIds?.length ? dto.tagIds : null,
      q: dto.q ?? null,
      isActive: true,
    });
    return this.alerts.save(alert);
  }

  async list(studentUserId: string): Promise<JobAlertEntity[]> {
    return this.alerts.find({
      where: { studentUserId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(studentUserId: string, id: string, dto: UpdateJobAlertDto): Promise<JobAlertEntity> {
    const alert = await this.findOwnOrThrow(studentUserId, id);
    if (dto.isActive !== undefined) alert.isActive = dto.isActive;
    if (dto.cityId !== undefined) alert.cityId = dto.cityId;
    if (dto.categoryId !== undefined) alert.categoryId = dto.categoryId;
    if (dto.tagIds !== undefined) alert.tagIds = dto.tagIds;
    if (dto.q !== undefined) alert.q = dto.q;
    return this.alerts.save(alert);
  }

  async remove(studentUserId: string, id: string): Promise<void> {
    const alert = await this.findOwnOrThrow(studentUserId, id);
    await this.alerts.remove(alert);
  }

  private async findOwnOrThrow(studentUserId: string, id: string): Promise<JobAlertEntity> {
    const alert = await this.alerts.findOne({ where: { id, studentUserId } });
    if (!alert) throw new NotFoundException();
    return alert;
  }

  /** Запускается каждые 30 минут; находит новые вакансии и отправляет уведомления. */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async processAlerts(): Promise<void> {
    const activeAlerts = await this.alerts.find({ where: { isActive: true } });
    if (!activeAlerts.length) return;

    this.log.log(`Processing ${activeAlerts.length} job alerts`);

    for (const alert of activeAlerts) {
      try {
        await this.processOneAlert(alert);
      } catch (e) {
        this.log.warn(
          `Alert ${alert.id} processing failed: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  private async processOneAlert(alert: JobAlertEntity): Promise<void> {
    const since = alert.lastNotifiedAt ?? alert.createdAt;

    const qb = this.jobs
      .createQueryBuilder('job')
      .where('job.status = :st', { st: JobStatus.PUBLISHED })
      .andWhere('job.created_at > :since', { since });

    if (alert.cityId) {
      qb.andWhere('job.city_id = :cityId', { cityId: alert.cityId });
    }
    if (alert.q) {
      qb.andWhere('job.title ILIKE :q', { q: `%${alert.q}%` });
    }
    if (alert.categoryId) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM job_job_categories jjc WHERE jjc.job_id = job.id AND jjc.job_category_id = :catId)`,
        { catId: alert.categoryId },
      );
    }
    if (alert.tagIds?.length) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM job_tags jt WHERE jt.job_id = job.id AND jt.tag_id = ANY(:tagIds))`,
        { tagIds: alert.tagIds },
      );
    }

    const newJobs = await qb.select(['job.id', 'job.title']).limit(10).getMany();
    if (!newJobs.length) return;

    await this.notifications.create(alert.studentUserId, NotificationKind.JOB_ALERT, {
      count: newJobs.length,
      jobs: newJobs.map((j) => ({ id: j.id, title: j.title })),
    });

    alert.lastNotifiedAt = new Date();
    await this.alerts.save(alert);
  }
}
