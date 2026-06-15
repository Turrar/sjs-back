import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import {
  EmployerProfileEntity,
  StudentProfileEntity,
  TelegramLinkCodeEntity,
  UserEntity,
} from '../../database/entities';
import { PointEventType } from '../../database/entities/user-points.entity';
import { GamificationService } from '../gamification/gamification.service';
import { TelegramService } from './telegram.service';
import { generateTelegramLinkCode } from './telegram-link-code.util';

const LINK_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class TelegramLinkService {
  private readonly log = new Logger(TelegramLinkService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly students: Repository<StudentProfileEntity>,
    @InjectRepository(EmployerProfileEntity)
    private readonly employers: Repository<EmployerProfileEntity>,
    @InjectRepository(TelegramLinkCodeEntity)
    private readonly linkCodes: Repository<TelegramLinkCodeEntity>,
    private readonly telegram: TelegramService,
    private readonly gamification: GamificationService,
  ) {}

  async createLinkToken(user: JwtPayload) {
    if (user.role !== UserRole.STUDENT && user.role !== UserRole.EMPLOYER) {
      throw new BadRequestException('Only students and employers can link Telegram');
    }

    await this.linkCodes.delete({ userId: user.sub });
    await this.linkCodes.delete({ expiresAt: LessThan(new Date()) });

    const code = generateTelegramLinkCode();
    const expiresAt = new Date(Date.now() + LINK_TTL_MS);
    await this.linkCodes.save(
      this.linkCodes.create({
        code,
        userId: user.sub,
        expiresAt,
      }),
    );

    this.log.log(`Link code created userId=${user.sub} codeLen=${code.length}`);

    const botUsername =
      this.config.get<string>('TELEGRAM_BOT_USERNAME')?.trim() || 'YourBot';

    return {
      linkCode: code,
      deepLink: `https://t.me/${botUsername}?start=${code}`,
      expiresInSeconds: LINK_TTL_MS / 1000,
      instructions:
        'Откройте ссылку в Telegram и нажмите Start — chat_id привяжется автоматически.',
    };
  }

  async handleWebhookUpdate(update: Record<string, unknown>) {
    const message = update['message'] as Record<string, unknown> | undefined;
    if (!message) {
      return { ok: true, handled: false };
    }
    const chat = message['chat'] as { id?: number } | undefined;
    const text = message['text'] as string | undefined;
    if (!chat?.id || !text?.startsWith('/start')) {
      return { ok: true, handled: false };
    }

    const parts = text.trim().split(/\s+/);
    const code = parts[1]?.trim();
    if (!code) {
      await this.reply(
        chat.id,
        'SJS: откройте ссылку привязки из личного кабинета (POST /api/telegram/link-token).',
      );
      return { ok: true, handled: true };
    }

    const row = await this.linkCodes.findOne({ where: { code } });
    if (!row || row.expiresAt < new Date()) {
      if (row) {
        await this.linkCodes.delete({ code });
      }
      await this.reply(
        chat.id,
        'SJS: ссылка недействительна или просрочена. Запросите новую в приложении.',
      );
      return { ok: true, handled: true, error: 'invalid_or_expired' };
    }

    try {
      const hadLinked = await this.saveChatId(row.userId, String(chat.id));
      await this.linkCodes.delete({ code });
      await this.reply(chat.id, 'SJS: Telegram успешно привязан. Уведомления включены.');
      this.log.log(`Linked userId=${row.userId} chatId=${chat.id}`);
      if (!hadLinked) {
        this.gamification
          .award(row.userId, PointEventType.TELEGRAM_LINKED)
          .catch(() => null);
      }
      return { ok: true, handled: true, userId: row.userId };
    } catch (e) {
      this.log.warn(
        `Telegram link failed code=${code}: ${e instanceof Error ? e.message : String(e)}`,
      );
      await this.reply(
        chat.id,
        'SJS: не удалось привязать аккаунт. Попробуйте снова из приложения.',
      );
      return { ok: true, handled: true, error: 'link_failed' };
    }
  }

  /** @returns true if user already had telegram linked */
  private async saveChatId(userId: string, chatId: string): Promise<boolean> {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['studentProfile', 'employerProfile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === UserRole.STUDENT && user.studentProfile) {
      const hadLinked = !!user.studentProfile.telegramChatId;
      user.studentProfile.telegramChatId = chatId;
      await this.students.save(user.studentProfile);
      return hadLinked;
    }
    if (user.role === UserRole.EMPLOYER && user.employerProfile) {
      const hadLinked = !!user.employerProfile.telegramChatId;
      user.employerProfile.telegramChatId = chatId;
      await this.employers.save(user.employerProfile);
      return hadLinked;
    }
    throw new BadRequestException('Profile not found for Telegram link');
  }

  private async reply(chatId: number, text: string) {
    try {
      await this.telegram.sendMessage(String(chatId), text);
    } catch (e) {
      this.log.warn(
        `Telegram reply failed chatId=${chatId}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
