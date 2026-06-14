import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmployerProfileEntity,
  EmployerReviewEntity,
  UserEntity,
} from '../../database/entities';
import { GamificationModule } from '../gamification/gamification.module';
import { EmployerReviewsController } from './employer-reviews.controller';
import { EmployerReviewsService } from './employer-reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployerReviewEntity, UserEntity, EmployerProfileEntity]),
    GamificationModule,
  ],
  controllers: [EmployerReviewsController],
  providers: [EmployerReviewsService],
  exports: [EmployerReviewsService],
})
export class EmployerReviewsModule {}
