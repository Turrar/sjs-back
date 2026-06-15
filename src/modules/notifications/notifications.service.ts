import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { NotificationKind } from '../../common/enums/notification-kind.enum';
import { formatApplicationUpdateSms } from '../../common/utils/application-notification.util';
import {
  EmployerProfileEntity,
  NotificationEntity,
  StudentProfileEntity,
  UserEntity,
} from '../../database/entities';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { TelegramService } from '../telegram/telegram.service';
import { formatApplicationUpdateTelegram } from '../../common/utils/application-notification.util';

/** Human-readable Telegram messages per notification kind */
const TELEGRAM_TEMPLATES: Partial<Record<NotificationKind, (p: Record<string, unknown>) => string>> = {
  [NotificationKind.APPLICATION_UPDATE]: formatApplicationUpdateTelegram,
  [NotificationKind.CHAT_MESSAGE]: (p) =>
    `💬 Новое сообщение от ${p['senderName'] ?? 'пользователя'}`,
  [NotificationKind.JOB_ALERT]: (p) =>
    `🔔 Найдено ${p['count'] ?? ''} новых вакансий по вашей подписке`,
  [NotificationKind.SCHEDULE_READY]: () => `📅 Ваше расписание успешно обработано`,
};

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly studentProfiles: Repository<StudentProfileEntity>,
    @InjectRepository(EmployerProfileEntity)
    private readonly employerProfiles: Repository<EmployerProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly telegram: TelegramService,
    private readonly email: EmailService,
    private readonly sms: SmsService,
  ) {}

  async create(
    userId: string,
    kind: NotificationKind,
    payload?: Record<string, unknown> | null,
  ) {
    const notification = await this.repo.save(
      this.repo.create({
        userId,
        kind,
        payload: payload ?? null,
      }),
    );

    // Fire-and-forget side channels
    const p = payload ?? {};
    this.sendTelegram(userId, kind, p).catch((e) =>
      this.log.warn(`Telegram dispatch failed: ${e instanceof Error ? e.message : String(e)}`),
    );
    this.sendEmail(userId, kind, p).catch((e) =>
      this.log.warn(`Email dispatch failed: ${e instanceof Error ? e.message : String(e)}`),
    );
    this.sendSms(userId, kind, p).catch((e) =>
      this.log.warn(`SMS dispatch failed: ${e instanceof Error ? e.message : String(e)}`),
    );

    return notification;
  }

  private async sendTelegram(
    userId: string,
    kind: NotificationKind,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.telegram.isEnabled()) return;

    const templateFn = TELEGRAM_TEMPLATES[kind];
    if (!templateFn) return;

    const chatId = await this.resolveChatId(userId);
    if (!chatId) return;

    await this.telegram.sendHtmlMessage(chatId, templateFn(payload));
  }

  private async sendEmail(
    userId: string,
    kind: NotificationKind,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.email.isEnabled()) return;
    const user = await this.users.findOne({ where: { id: userId }, select: ['email'] });
    if (!user) return;
    await this.email.sendNotification(user.email, kind, payload);
  }

  private async sendSms(
    userId: string,
    kind: NotificationKind,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.sms.isEnabled()) return;
    // Отправляем SMS только при смене статуса заявки (APPLICATION_UPDATE) и JOB_ALERT
    if (kind !== NotificationKind.APPLICATION_UPDATE && kind !== NotificationKind.JOB_ALERT) return;

    const student = await this.studentProfiles.findOne({
      where: { userId },
      select: ['phone'],
    });
    if (!student?.phone) return;

    const text =
      kind === NotificationKind.APPLICATION_UPDATE
        ? formatApplicationUpdateSms(payload)
        : `SJS: Найдено ${payload['count'] ?? ''} новых вакансий по вашей подписке.`;

    await this.sms.send(student.phone, text);
  }

  private async resolveChatId(userId: string): Promise<string | null> {
    const student = await this.studentProfiles.findOne({
      where: { userId },
      select: ['telegramChatId'],
    });
    if (student?.telegramChatId) return student.telegramChatId;

    const employer = await this.employerProfiles.findOne({
      where: { userId },
      select: ['telegramChatId'],
    });
    return employer?.telegramChatId ?? null;
  }

  async list(userId: string, limit = 50) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.repo.count({
      where: { userId, readAt: IsNull() },
    });
  }

  async markRead(userId: string, id: string) {
    const n = await this.repo.findOne({ where: { id, userId } });
    if (!n) {
      throw new NotFoundException();
    }
    n.readAt = new Date();
    return this.repo.save(n);
  }
}
