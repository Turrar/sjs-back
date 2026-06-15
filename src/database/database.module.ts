import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApplicationEntity,
  ChatRoomEntity,
  CityEntity,
  EmployerProfileEntity,
  EmployerReviewEntity,
  EntityEmbeddingEntity,
  JobAlertEntity,
  JobCategoryEntity,
  JobEntity,
  MessageEntity,
  NotificationEntity,
  RefreshTokenEntity,
  ResumeDraftEntity,
  ScheduleSlotEntity,
  ScheduleSourceEntity,
  StudentProfileEntity,
  TagEntity,
  UserEntity,
} from './entities';
import { UserPointsEntity } from './entities/user-points.entity';
import {
  InternshipEntity,
  InternshipLogEntryEntity,
  InternshipTaskEntity,
} from './entities/internship.entity';
import {
  SkillBadgeEntity,
  SkillTestEntity,
  SkillTestQuestionEntity,
  SkillTestResultEntity,
} from './entities/skill-test.entity';
import { TelegramLinkCodeEntity } from './entities/telegram-link-code.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        entities: [
          UserEntity,
          StudentProfileEntity,
          EmployerProfileEntity,
          CityEntity,
          JobCategoryEntity,
          TagEntity,
          JobEntity,
          ApplicationEntity,
          ScheduleSourceEntity,
          ScheduleSlotEntity,
          ChatRoomEntity,
          MessageEntity,
          NotificationEntity,
          ResumeDraftEntity,
          RefreshTokenEntity,
          EntityEmbeddingEntity,
          JobAlertEntity,
          EmployerReviewEntity,
          UserPointsEntity,
          InternshipEntity,
          InternshipLogEntryEntity,
          InternshipTaskEntity,
          SkillTestEntity,
          SkillTestQuestionEntity,
          SkillTestResultEntity,
          SkillBadgeEntity,
          TelegramLinkCodeEntity,
        ],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('TYPEORM_LOGGING') === 'true',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
