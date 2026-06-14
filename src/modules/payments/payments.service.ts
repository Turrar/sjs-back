import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { JobEntity } from '../../database/entities';

export interface KaspiPaymentInit {
  orderId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
}

/**
 * Оплата Premium-размещения вакансии через Kaspi Pay.
 *
 * Kaspi предоставляет шлюз только для зарегистрированных мерчантов (КЗ).
 * Здесь реализован стандартный flow: инициализация → redirect URL → webhook подтверждение.
 * Документация: https://kaspi.kz/bank/developer/documentation
 *
 * Без KASPI_MERCHANT_ID / KASPI_API_KEY работает в demo-режиме.
 */
@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);
  private readonly merchantId: string | null;
  private readonly apiKey: string | null;
  private readonly webhookSecret: string | null;
  private readonly premiumPriceKzt: number;

  constructor(
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    private readonly config: ConfigService,
  ) {
    this.merchantId = this.config.get<string>('KASPI_MERCHANT_ID')?.trim() || null;
    this.apiKey = this.config.get<string>('KASPI_API_KEY')?.trim() || null;
    this.webhookSecret = this.config.get<string>('KASPI_WEBHOOK_SECRET')?.trim() || null;
    this.premiumPriceKzt = parseInt(
      this.config.get<string>('KASPI_PREMIUM_PRICE_KZT') ?? '9900',
      10,
    );
  }

  isEnabled(): boolean {
    return !!(this.merchantId && this.apiKey);
  }

  async getPremiumStatus(employerUserId: string, jobId: string) {
    const job = await this.jobs.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.employerUserId !== employerUserId) {
      throw new BadRequestException('You do not own this job');
    }
    return {
      jobId: job.id,
      isPremium: job.isPremium,
      title: job.title,
    };
  }

  /**
   * Возвращает orderId (для webhook) и paymentUrl (редирект в приложение Kaspi).
   */
  async initPremiumPayment(
    employerUserId: string,
    jobId: string,
  ): Promise<KaspiPaymentInit> {
    const job = await this.jobs.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.employerUserId !== employerUserId) {
      throw new BadRequestException('You do not own this job');
    }
    if (job.isPremium) {
      throw new BadRequestException('Job is already Premium');
    }

    const orderId = `sjs-premium-${jobId}-${Date.now()}`;

    if (!this.isEnabled()) {
      this.log.warn('Kaspi credentials not set — returning demo payment URL');
      return {
        orderId,
        paymentUrl: `https://pay.kaspi.kz/pay/demo?orderId=${orderId}`,
        amount: this.premiumPriceKzt,
        currency: 'KZT',
      };
    }

    try {
      const { data } = await axios.post(
        'https://api.kaspi.kz/payments/v1/orders',
        {
          merchantId: this.merchantId,
          orderId,
          amount: this.premiumPriceKzt,
          currency: 'KZT',
          description: `Premium job listing: ${job.title}`,
          returnUrl: this.config.get<string>('KASPI_RETURN_URL') ?? 'https://sjs.app/employer/jobs',
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
      return {
        orderId,
        paymentUrl: data.paymentUrl as string,
        amount: this.premiumPriceKzt,
        currency: 'KZT',
      };
    } catch (e) {
      this.log.error(
        `Kaspi payment init failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      throw new BadRequestException('Payment service error');
    }
  }

  /**
   * Webhook: Kaspi вызывает этот метод после подтверждения оплаты.
   * Активируем isPremium для вакансии.
   */
  async handleWebhook(
    body: Record<string, unknown>,
    webhookSecret?: string,
  ): Promise<{ status: string }> {
    if (this.webhookSecret) {
      if (!webhookSecret || webhookSecret !== this.webhookSecret) {
        throw new UnauthorizedException('Invalid Kaspi webhook secret');
      }
    } else if (this.isEnabled()) {
      throw new UnauthorizedException('Kaspi webhook secret not configured');
    }

    const orderId = body['orderId'] as string;
    const status = body['status'] as string;

    if (!orderId || status !== 'PAID') {
      return { status: 'ignored' };
    }

    // orderId формат: sjs-premium-{jobId}-{timestamp}
    const match = orderId.match(/^sjs-premium-([a-f0-9-]+)-\d+$/);
    if (!match) return { status: 'ignored' };

    const jobId = match[1];
    const job = await this.jobs.findOne({ where: { id: jobId } });
    if (!job) return { status: 'job_not_found' };

    if (job.isPremium) {
      return { status: 'already_premium' };
    }

    job.isPremium = true;
    await this.jobs.save(job);
    this.log.log(`Job ${jobId} upgraded to Premium via Kaspi orderId=${orderId}`);
    return { status: 'ok' };
  }
}
