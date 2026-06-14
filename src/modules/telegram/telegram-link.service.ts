import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import {
  EmployerProfileEntity,
  StudentProfileEntity,
  UserEntity,
} from '../../database/entities';

type TelegramLinkPayload = JwtPayload & { purpose: string };

@Injectable()
export class TelegramLinkService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly students: Repository<StudentProfileEntity>,
    @InjectRepository(EmployerProfileEntity)
    private readonly employers: Repository<EmployerProfileEntity>,
  ) {}

  async createLinkToken(user: JwtPayload) {
    const token = await this.jwt.signAsync(
      { sub: user.sub, email: user.email, role: user.role, purpose: 'telegram_link' },
      { expiresIn: '15m' },
    );
    const botUsername =
      this.config.get<string>('TELEGRAM_BOT_USERNAME')?.trim() || 'YourBot';
    return {
      token,
      deepLink: `https://t.me/${botUsername}?start=${encodeURIComponent(token)}`,
      expiresInSeconds: 900,
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
    const payload = parts[1];
    if (!payload) {
      await this.reply(
        chat.id,
        'SJS: откройте ссылку привязки из личного кабинета (POST /api/telegram/link-token).',
      );
      return { ok: true, handled: true };
    }

    try {
      const decoded = await this.jwt.verifyAsync<TelegramLinkPayload>(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      if (decoded.purpose !== 'telegram_link') {
        throw new BadRequestException('Invalid link token');
      }
      await this.saveChatId(decoded.sub, String(chat.id));
      await this.reply(chat.id, 'SJS: Telegram успешно привязан. Уведомления включены.');
      return { ok: true, handled: true, userId: decoded.sub };
    } catch {
      await this.reply(chat.id, 'SJS: ссылка недействительна или просрочена. Запросите новую в приложении.');
      return { ok: true, handled: true, error: 'invalid_token' };
    }
  }

  private async saveChatId(userId: string, chatId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['studentProfile', 'employerProfile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === UserRole.STUDENT && user.studentProfile) {
      user.studentProfile.telegramChatId = chatId;
      await this.students.save(user.studentProfile);
      return;
    }
    if (user.role === UserRole.EMPLOYER && user.employerProfile) {
      user.employerProfile.telegramChatId = chatId;
      await this.employers.save(user.employerProfile);
      return;
    }
    throw new BadRequestException('Profile not found for Telegram link');
  }

  private async reply(chatId: number, text: string) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN')?.trim();
    if (!token) return;
    const axios = (await import('axios')).default;
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      { chat_id: chatId, text },
      { timeout: 8000 },
    );
  }
}
