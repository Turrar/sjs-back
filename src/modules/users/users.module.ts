import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmployerProfileEntity,
  StudentProfileEntity,
  UserEntity,
} from '../../database/entities';
import { AiModule } from '../ai/ai.module';
import { GamificationModule } from '../gamification/gamification.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      StudentProfileEntity,
      EmployerProfileEntity,
    ]),
    AiModule,
    GamificationModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
