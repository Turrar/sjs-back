import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SkillBadgeEntity,
  SkillTestEntity,
  SkillTestQuestionEntity,
  SkillTestResultEntity,
} from '../../database/entities';
import { GamificationModule } from '../gamification/gamification.module';
import { SkillTestsController } from './skill-tests.controller';
import { SkillTestsService } from './skill-tests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SkillTestEntity,
      SkillTestQuestionEntity,
      SkillTestResultEntity,
      SkillBadgeEntity,
    ]),
    GamificationModule,
  ],
  controllers: [SkillTestsController],
  providers: [SkillTestsService],
})
export class SkillTestsModule {}
