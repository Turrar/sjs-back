import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ResumeDraftEntity,
  StudentProfileEntity,
} from '../../database/entities';
import { AiModule } from '../ai/ai.module';
import { GamificationModule } from '../gamification/gamification.module';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ResumeDraftEntity, StudentProfileEntity]),
    AiModule,
    GamificationModule,
  ],
  controllers: [ResumeController],
  providers: [ResumeService],
  exports: [ResumeService],
})
export class ResumeModule {}
