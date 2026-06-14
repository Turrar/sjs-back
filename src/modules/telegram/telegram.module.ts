import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmployerProfileEntity,
  StudentProfileEntity,
  UserEntity,
} from '../../database/entities';
import { TelegramController } from './telegram.controller';
import { TelegramLinkService } from './telegram-link.service';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      StudentProfileEntity,
      EmployerProfileEntity,
    ]),
  ],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramLinkService],
  exports: [TelegramService, TelegramLinkService],
})
export class TelegramModule {}
