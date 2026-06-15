import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmployerProfileEntity,
  StudentProfileEntity,
  TelegramLinkCodeEntity,
  UserEntity,
} from '../../database/entities';
import { GamificationModule } from '../gamification/gamification.module';
import { TelegramController } from './telegram.controller';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramPollingService } from './telegram-polling.service';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      StudentProfileEntity,
      EmployerProfileEntity,
      TelegramLinkCodeEntity,
    ]),
    GamificationModule,
  ],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramLinkService, TelegramPollingService],
  exports: [TelegramService, TelegramLinkService],
})
export class TelegramModule {}
