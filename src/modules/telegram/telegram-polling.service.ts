import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramService } from './telegram.service';

/**
 * Локальная разработка: long-polling getUpdates вместо webhook.
 * Telegram не может слать webhook на localhost — без polling Start не обрабатывается.
 *
 * Включается если TELEGRAM_BOT_TOKEN задан и TELEGRAM_WEBHOOK_URL пуст
 * (или явно TELEGRAM_POLLING=true). TELEGRAM_POLLING=false отключает.
 */
@Injectable()
export class TelegramPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(TelegramPollingService.name);
  private running = false;
  private offset = 0;
  private abortController: AbortController | null = null;

  constructor(
    private readonly telegram: TelegramService,
    private readonly link: TelegramLinkService,
  ) {}

  onModuleInit() {
    if (this.telegram.resolveDeliveryMode() !== 'polling') {
      return;
    }
    this.running = true;
    void this.pollLoop();
    this.log.log('Telegram long-polling started (dev/local mode)');
  }

  onModuleDestroy() {
    this.running = false;
    this.abortController?.abort();
  }

  private async pollLoop(): Promise<void> {
    try {
      await this.telegram.deleteWebhook();
    } catch (e) {
      this.log.warn(
        `deleteWebhook before polling: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    while (this.running) {
      this.abortController = new AbortController();
      const signal = this.abortController.signal;
      try {
        const updates = await this.telegram.getUpdates(this.offset, 25, signal);
        for (const update of updates) {
          const updateId = update['update_id'];
          if (typeof updateId === 'number') {
            this.offset = updateId + 1;
          }
          const result = await this.link.handleWebhookUpdate(update);
          if (result.handled) {
            this.log.log(
              `Processed update_id=${String(updateId)} userId=${String(result.userId ?? '')}`,
            );
          }
        }
      } catch (e) {
        if (!this.running || signal.aborted) break;
        this.log.warn(
          `Polling error: ${e instanceof Error ? e.message : String(e)}`,
        );
        await sleep(3000);
      } finally {
        this.abortController = null;
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
