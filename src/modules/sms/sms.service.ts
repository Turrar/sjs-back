import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * SMS-уведомления через Twilio REST API.
 * Требует TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER в .env.
 * Без ключей — тихо пропускает (warn).
 */
@Injectable()
export class SmsService {
  private readonly log = new Logger(SmsService.name);
  private readonly accountSid: string | null;
  private readonly authToken: string | null;
  private readonly fromNumber: string | null;

  constructor(private readonly config: ConfigService) {
    this.accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID')?.trim() || null;
    this.authToken = this.config.get<string>('TWILIO_AUTH_TOKEN')?.trim() || null;
    this.fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER')?.trim() || null;

    if (!this.accountSid || !this.authToken) {
      this.log.warn('Twilio credentials not set — SMS notifications disabled');
    }
  }

  isEnabled(): boolean {
    return !!(this.accountSid && this.authToken && this.fromNumber);
  }

  async send(to: string, body: string): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        new URLSearchParams({ To: to, From: this.fromNumber!, Body: body }),
        {
          auth: { username: this.accountSid!, password: this.authToken! },
          timeout: 10000,
        },
      );
    } catch (e) {
      this.log.warn(
        `SMS send failed to=${to}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
