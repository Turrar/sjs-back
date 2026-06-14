import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /**
   * Инициировать Premium-оплату за вакансию через Kaspi Pay.
   * POST /api/payments/kaspi/premium/:jobId
   * Возвращает { orderId, paymentUrl } — фронт редиректит пользователя на paymentUrl.
   */
  @Post('kaspi/premium/:jobId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  initPremium(
    @CurrentUser() u: JwtPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.payments.initPremiumPayment(u.sub, jobId);
  }

  /**
   * Статус Premium после оплаты — фронт может опрашивать после redirect из Kaspi.
   * GET /api/payments/kaspi/premium/:jobId/status
   */
  @Get('kaspi/premium/:jobId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  premiumStatus(
    @CurrentUser() u: JwtPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.payments.getPremiumStatus(u.sub, jobId);
  }

  /**
   * Webhook от Kaspi после успешной оплаты.
   * POST /api/payments/kaspi/webhook
   * Без авторизации — Kaspi сам вызывает этот endpoint.
   */
  @Post('kaspi/webhook')
  @SkipThrottle()
  webhook(
    @Headers('x-kaspi-webhook-secret') webhookSecret: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.payments.handleWebhook(body, webhookSecret);
  }
}
