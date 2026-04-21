import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApplicationEntity,
  InternshipEntity,
  InternshipLogEntryEntity,
  InternshipTaskEntity,
} from '../../database/entities';
import { GamificationModule } from '../gamification/gamification.module';
import { InternshipController } from './internship.controller';
import { InternshipService } from './internship.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InternshipEntity,
      InternshipLogEntryEntity,
      InternshipTaskEntity,
      ApplicationEntity,
    ]),
    GamificationModule,
  ],
  controllers: [InternshipController],
  providers: [InternshipService],
})
export class InternshipModule {}
