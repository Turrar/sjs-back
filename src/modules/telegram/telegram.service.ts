import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Отправка сообщений через Telegram Bot API.
 * Требует переменную TELEGRAM_BOT_TOKEN в .env.
 * Без токена — тихо пропускает.
 */
@Injectable()
export class TelegramService {
  private readonly log = new Logger(TelegramService.name);
  private readonly token: string | null;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('TELEGRAM_BOT_TOKEN')?.trim() || null;
    if (!this.token) {
      this.log.warn('TELEGRAM_BOT_TOKEN not set — Telegram notifications disabled');
    }
  }

  isEnabled(): boolean {
    return !!this.token;
  }

  /** Отправить сообщение пользователю по его chat_id. */
  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.token || !chatId) return;
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.token}/sendMessage`,
        { chat_id: chatId, text, parse_mode: 'HTML' },
        { timeout: 8000 },
      );
    } catch (e) {
      this.log.warn(
        `Telegram sendMessage failed chatId=${chatId}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
