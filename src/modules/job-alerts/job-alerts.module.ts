import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobAlertEntity, JobEntity } from '../../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobAlertsController } from './job-alerts.controller';
import { JobAlertsService } from './job-alerts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobAlertEntity, JobEntity]),
    NotificationsModule,
  ],
  controllers: [JobAlertsController],
  providers: [JobAlertsService],
})
export class JobAlertsModule {}
