import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ScheduleSlotEntity,
  ScheduleSourceEntity,
  StudentProfileEntity,
} from '../../database/entities';
import { AiModule } from '../ai/ai.module';
import { ScheduleCompatibilityService } from './schedule-compatibility.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleSourceEntity,
      ScheduleSlotEntity,
      StudentProfileEntity,
    ]),
    forwardRef(() => AiModule),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService, ScheduleCompatibilityService],
  exports: [ScheduleService, ScheduleCompatibilityService],
})
export class ScheduleModule {}
