import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleSlotEntity, StudentProfileEntity } from '../../database/entities';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleSlotEntity, StudentProfileEntity])],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
