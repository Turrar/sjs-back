import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CityEntity,
  EmployerProfileEntity,
  JobCategoryEntity,
  JobEntity,
  TagEntity,
  UserEntity,
} from '../../database/entities';
import { HhImportModule } from '../hh-import/hh-import.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      EmployerProfileEntity,
      JobEntity,
      CityEntity,
      JobCategoryEntity,
      TagEntity,
    ]),
    HhImportModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
