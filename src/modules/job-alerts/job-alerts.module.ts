import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  JobAlertEntity,
  JobEntity,
  StudentProfileEntity,
} from '../../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { TelegramModule } from '../telegram/telegram.module';
import { JobAlertsController } from './job-alerts.controller';
import { JobAlertsService } from './job-alerts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobAlertEntity, JobEntity, StudentProfileEntity]),
    NotificationsModule,
    TelegramModule,
  ],
  controllers: [JobAlertsController],
  providers: [JobAlertsService],
})
export class JobAlertsModule {}
