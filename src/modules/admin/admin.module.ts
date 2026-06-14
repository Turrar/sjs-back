import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CityEntity,
  EmployerProfileEntity,
  JobCategoryEntity,
  JobEntity,
  SkillTestEntity,
  SkillTestQuestionEntity,
  TagEntity,
  UserEntity,
} from '../../database/entities';
import { HhImportModule } from '../hh-import/hh-import.module';
import { UploadModule } from '../upload/upload.module';
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
      SkillTestEntity,
      SkillTestQuestionEntity,
    ]),
    HhImportModule,
    UploadModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
