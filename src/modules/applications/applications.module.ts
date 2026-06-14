import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApplicationEntity,
  ChatRoomEntity,
  InternshipEntity,
  JobEntity,
  StudentProfileEntity,
} from '../../database/entities';
import { AiModule } from '../ai/ai.module';
import { EmployerReviewsModule } from '../employer-reviews/employer-reviews.module';
import { GamificationModule } from '../gamification/gamification.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationEntity,
      JobEntity,
      StudentProfileEntity,
      ChatRoomEntity,
      InternshipEntity,
    ]),
    NotificationsModule,
    AiModule,
    GamificationModule,
    EmployerReviewsModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
