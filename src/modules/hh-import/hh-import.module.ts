import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CityEntity,
  EmployerProfileEntity,
  JobEntity,
} from '../../database/entities';
import { HhImportService } from './hh-import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity, EmployerProfileEntity, CityEntity]),
  ],
  providers: [HhImportService],
  exports: [HhImportService],
})
export class HhImportModule {}
