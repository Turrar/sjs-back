import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';
import * as https from 'node:https';

export type TelegramDeliveryMode = 'none' | 'polling' | 'webhook';

/**
 * Отправка сообщений и низкоуровневые вызовы Telegram Bot API.
 */
@Injectable()
export class TelegramService {
  private readonly log = new Logger(TelegramService.name);
  private readonly token: string | null;
  private readonly botUsername: string | null;
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('TELEGRAM_BOT_TOKEN')?.trim() || null;
    this.botUsername =
      this.config.get<string>('TELEGRAM_BOT_USERNAME')?.trim() || null;
    this.http = axios.create({
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 4 }),
      timeout: 10_000,
    });
    if (!this.token) {
      this.log.warn('TELEGRAM_BOT_TOKEN not set — Telegram disabled');
    }
  }

  isEnabled(): boolean {
    return !!this.token;
  }

  getBotUsername(): string | null {
    return this.botUsername;
  }

  resolveDeliveryMode(): TelegramDeliveryMode {
    if (!this.token) return 'none';
    const polling = this.config.get<string>('TELEGRAM_POLLING')?.trim();
    const webhookUrl = this.config.get<string>('TELEGRAM_WEBHOOK_URL')?.trim();
    if (polling === 'true') return 'polling';
    if (polling === 'false') return webhookUrl ? 'webhook' : 'none';
    // Без публичного webhook URL — long-polling (локальная разработка, даже если NODE_ENV=production)
    if (!webhookUrl) return 'polling';
    return 'webhook';
  }

  private apiUrl(method: string): string {
    if (!this.token) throw new Error('TELEGRAM_BOT_TOKEN not set');
    return `https://api.telegram.org/bot${this.token}/${method}`;
  }

  async deleteWebhook(): Promise<void> {
    if (!this.token) return;
    await this.http.post(this.apiUrl('deleteWebhook'), {
      drop_pending_updates: false,
    });
  }

  async getUpdates(
    offset: number,
    timeoutSec = 25,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>[]> {
    const res = await this.http.get<{ ok: boolean; result: Record<string, unknown>[] }>(
      this.apiUrl('getUpdates'),
      {
        params: { offset, timeout: timeoutSec, allowed_updates: ['message'] },
        timeout: (timeoutSec + 10) * 1000,
        signal,
      },
    );
    return res.data.result ?? [];
  }

  /** Отправить plain-text (без HTML parse_mode). */
  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.token || !chatId) return;
    try {
      await this.http.post(
        this.apiUrl('sendMessage'),
        { chat_id: chatId, text },
        { timeout: 8000 },
      );
    } catch (e) {
      this.log.warn(
        `Telegram sendMessage failed chatId=${chatId}: ${e instanceof Error ? e.message : String(e)}`,
      );
      throw e;
    }
  }

  /** HTML-уведомления (notifications). */
  async sendHtmlMessage(chatId: string, text: string): Promise<void> {
    if (!this.token || !chatId) return;
    try {
      await this.http.post(
        this.apiUrl('sendMessage'),
        { chat_id: chatId, text, parse_mode: 'HTML' },
        { timeout: 8000 },
      );
    } catch (e) {
      this.log.warn(
        `Telegram sendHtmlMessage failed chatId=${chatId}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
