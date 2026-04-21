import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentProfileEntity } from '../../database/entities';
import { GitHubService } from './github.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudentProfileEntity])],
  controllers: [ProfilesController],
  providers: [ProfilesService, GitHubService],
  exports: [GitHubService],
})
export class ProfilesModule {}
