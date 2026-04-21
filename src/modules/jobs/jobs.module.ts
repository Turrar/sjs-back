import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CityEntity,
  EmployerProfileEntity,
  EntityEmbeddingEntity,
  JobCategoryEntity,
  JobEntity,
  StudentProfileEntity,
  TagEntity,
} from '../../database/entities';
import { AiModule } from '../ai/ai.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobEntity,
      EmployerProfileEntity,
      CityEntity,
      JobCategoryEntity,
      TagEntity,
      EntityEmbeddingEntity,
      StudentProfileEntity,
    ]),
    ScheduleModule,
    AiModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
