import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmployerProfileEntity,
  NotificationEntity,
  StudentProfileEntity,
  UserEntity,
} from '../../database/entities';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { TelegramModule } from '../telegram/telegram.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, StudentProfileEntity, EmployerProfileEntity, UserEntity]),
    TelegramModule,
    EmailModule,
    SmsModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
