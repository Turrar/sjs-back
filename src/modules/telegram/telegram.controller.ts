import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramService, type TelegramDeliveryMode } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly link: TelegramLinkService,
    private readonly telegram: TelegramService,
    private readonly config: ConfigService,
  ) {}

  /** Диагностика: настроен ли бот и как доставляются /start (polling vs webhook). */
  @Get('status')
  status() {
    const mode = this.telegram.resolveDeliveryMode();
    const hints: Record<TelegramDeliveryMode, string> = {
      none: 'Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_BOT_USERNAME в .env',
      polling:
        'Локальный режим: бот слушает getUpdates. Перезапустите сервер после смены .env.',
      webhook:
        'Webhook: Telegram шлёт POST на публичный URL. Локально нужен ngrok + npm run telegram:set-webhook',
    };
    return {
      botConfigured: this.telegram.isEnabled(),
      botUsername: this.telegram.getBotUsername(),
      deliveryMode: mode,
      hint: hints[mode],
      webhookUrlConfigured: !!this.config.get<string>('TELEGRAM_WEBHOOK_URL')?.trim(),
    };
  }

  /** JWT: получить deep-link для привязки Telegram через /start в боте */
  @Post('link-token')
  @UseGuards(JwtAuthGuard)
  createLinkToken(@CurrentUser() user: JwtPayload) {
    return this.link.createLinkToken(user);
  }

  /**
   * Webhook Telegram Bot API (setWebhook → POST /api/telegram/webhook).
   * Заголовок X-Telegram-Bot-Api-Secret-Token должен совпадать с TELEGRAM_WEBHOOK_SECRET.
   */
  @Post('webhook')
  @SkipThrottle()
  webhook(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const expected = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET')?.trim();
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN')?.trim();
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    if (isProd && botToken && !expected) {
      throw new UnauthorizedException('Telegram webhook secret not configured');
    }
    if (expected && secret !== expected) {
      throw new UnauthorizedException('Invalid Telegram webhook secret');
    }
    return this.link.handleWebhookUpdate(body);
  }
}
