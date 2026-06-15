import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { NotificationKind } from '../../common/enums/notification-kind.enum';
import { formatApplicationUpdateEmail } from '../../common/utils/application-notification.util';

interface EmailTemplate {
  subject: string;
  html: string;
}

function buildTemplate(
  kind: NotificationKind,
  payload: Record<string, unknown>,
): EmailTemplate | null {
  switch (kind) {
    case NotificationKind.APPLICATION_UPDATE:
      return formatApplicationUpdateEmail(payload);
    case NotificationKind.CHAT_MESSAGE:
      return {
        subject: `Новое сообщение от ${payload['senderName'] ?? 'пользователя'}`,
        html: `
          <h2>Новое сообщение</h2>
          <p><b>${payload['senderName'] ?? 'Пользователь'}</b> написал вам в чате.</p>
          <p>Откройте приложение, чтобы ответить.</p>
        `,
      };
    case NotificationKind.JOB_ALERT:
      return {
        subject: `Найдено ${payload['count'] ?? ''} новых вакансий по вашей подписке`,
        html: `
          <h2>Новые вакансии</h2>
          <p>По вашей подписке найдено <b>${payload['count'] ?? 0}</b> новых вакансий.</p>
          <ul>
            ${((payload['jobs'] as Array<{ title: string }>) ?? [])
              .map((j) => `<li>${j.title}</li>`)
              .join('')}
          </ul>
          <p>Откройте приложение для просмотра.</p>
        `,
      };
    case NotificationKind.SCHEDULE_READY:
      return {
        subject: 'Ваше расписание успешно обработано',
        html: `
          <h2>Расписание готово</h2>
          <p>Ваше расписание было успешно проанализировано. Теперь вы можете получать рекомендации вакансий, совместимых с вашим расписанием.</p>
        `,
      };
    default:
      return null;
  }
}

@Injectable()
export class EmailService implements OnModuleDestroy {
  private readonly log = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const port = parseInt(this.config.get<string>('SMTP_PORT') ?? '587', 10);
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS')?.trim();
    this.fromAddress =
      this.config.get<string>('SMTP_FROM')?.trim() ?? 'noreply@sjs.app';

    if (!host || !user || !pass) {
      this.log.warn('SMTP credentials not set — email notifications disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      pool: true,
      maxConnections: 2,
      maxMessages: 50,
    });
    this.log.log(`Email service ready (${host}:${port})`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }

  isEnabled(): boolean {
    return !!this.transporter;
  }

  async sendNotification(
    to: string,
    kind: NotificationKind,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.transporter) return;

    const template = buildTemplate(kind, payload);
    if (!template) return;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: template.subject,
        html: template.html,
      });
    } catch (e) {
      this.log.warn(
        `Email send failed to=${to}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
