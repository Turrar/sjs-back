import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmployerProfileEntity,
  EmployerReviewEntity,
  JobEntity,
  SkillBadgeEntity,
  StudentProfileEntity,
  UserEntity,
} from '../../database/entities';
import { UploadModule } from '../upload/upload.module';
import { GitHubService } from './github.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentProfileEntity,
      SkillBadgeEntity,
      EmployerProfileEntity,
      EmployerReviewEntity,
      JobEntity,
      UserEntity,
    ]),
    UploadModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService, GitHubService],
  exports: [GitHubService],
})
export class ProfilesModule {}
