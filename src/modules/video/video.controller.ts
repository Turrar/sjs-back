import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { NotificationKind } from '../../common/enums/notification-kind.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { ApplicationEntity } from '../../database/entities/application.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { VideoService } from './video.service';

/** Статусы, при которых видеозвонок разрешён. */
const VIDEO_ALLOWED_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFER,
  ApplicationStatus.HIRED,
];

@Controller('video')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(
    private readonly video: VideoService,
    private readonly notifications: NotificationsService,
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
  ) {}

  /**
   * Создать видеокомнату или войти как хост (работодатель).
   *
   * Правила:
   * - Только EMPLOYER
   * - Статус заявки должен быть INTERVIEW, OFFER или HIRED
   * - Если комната уже создана — вернуть ссылку для хоста к той же комнате
   * - Если комнаты нет — создать, сохранить, уведомить студента
   *
   * POST /api/video/rooms/:applicationId
   */
  @Post('rooms/:applicationId')
  async createOrJoinAsHost(
    @CurrentUser() user: JwtPayload,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    if (user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenException('Only employers can initiate video calls');
    }

    const app = await this.loadApplication(applicationId);

    if (app.job.employerUserId !== user.sub) {
      throw new ForbiddenException();
    }

    this.assertVideoAllowed(app.status);

    // Комната уже создана — вернуть хост-ссылку к существующей
    if (app.videoRoomName && app.videoRoomUrl) {
      return this.video.getJoinUrl(app.videoRoomName, app.videoRoomUrl, true);
    }

    // Создать новую комнату
    const room = await this.video.createRoom(applicationId, true);

    await this.applications.update(applicationId, {
      videoRoomName: room.name,
      videoRoomUrl: room.roomUrl,
    });

    // Уведомить студента (fire-and-forget — ошибка не должна ронять ответ)
    this.notifications
      .create(app.studentUserId, NotificationKind.APPLICATION_UPDATE, {
        applicationId,
        jobTitle: app.job.title,
        status: app.status,
        videoRoom: true,
      })
      .catch((e: unknown) => {
        // Логируем, но не ломаем ответ работодателю
        void e;
      });

    return { name: room.name, url: room.url, token: room.token, expiresAt: room.expiresAt };
  }

  /**
   * Получить ссылку для входа в уже созданную комнату.
   *
   * Правила:
   * - Доступно студенту и работодателю (оба участника заявки)
   * - Статус заявки должен быть INTERVIEW, OFFER или HIRED
   * - Если комната ещё не создана — 404
   * - Работодатель получает is_owner=true (host), студент — is_owner=false
   *
   * GET /api/video/rooms/:applicationId
   */
  @Get('rooms/:applicationId')
  async getJoinUrl(
    @CurrentUser() user: JwtPayload,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const app = await this.loadApplication(applicationId);

    const isEmployer = app.job.employerUserId === user.sub;
    const isStudent = app.studentUserId === user.sub;

    if (!isEmployer && !isStudent) {
      throw new ForbiddenException();
    }

    this.assertVideoAllowed(app.status);

    if (!app.videoRoomName || !app.videoRoomUrl) {
      throw new NotFoundException('Video room not created yet — waiting for employer to start');
    }

    const isOwner = isEmployer;
    return this.video.getJoinUrl(app.videoRoomName, app.videoRoomUrl, isOwner);
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  private async loadApplication(applicationId: string): Promise<ApplicationEntity> {
    const app = await this.applications.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  private assertVideoAllowed(status: ApplicationStatus): void {
    if (!VIDEO_ALLOWED_STATUSES.includes(status)) {
      throw new ForbiddenException(
        `Video calls are available from INTERVIEW status. Current status: ${status}`,
      );
    }
  }
}
