import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
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
  InternshipEntity,
  InternshipLogEntryEntity,
  InternshipTaskEntity,
  SkillTestEntity,
  SkillTestQuestionEntity,
  SkillTestResultEntity,
  SkillBadgeEntity,
} from './entities';
import { TelegramLinkCodeEntity } from './entities/telegram-link-code.entity';
import { UserPointsEntity } from './entities/user-points.entity';
import { AddSourceHashToEntityEmbeddings1735200000000 } from './migrations/1735200000000-AddSourceHashToEntityEmbeddings';
import { CatalogCitiesCategoriesTags1735300000000 } from './migrations/1735300000000-CatalogCitiesCategoriesTags';
import { JobIsPremium1735400000000 } from './migrations/1735400000000-JobIsPremium';
import { ProfileAvatarLogo1735500000000 } from './migrations/1735500000000-ProfileAvatarLogo';
import { ResumeDraftPdfKeyLength1735600000000 } from './migrations/1735600000000-ResumeDraftPdfKeyLength';
import { CatalogNameI18n1735700000000 } from './migrations/1735700000000-CatalogNameI18n';
import { JobCategoriesManyToMany1735800000000 } from './migrations/1735800000000-JobCategoriesManyToMany';
import { Sprint2Features1735900000000 } from './migrations/1735900000000-Sprint2Features';
import { JobSource1736000000000 } from './migrations/1736000000000-JobSource';
import { UserPoints1736100000000 } from './migrations/1736100000000-UserPoints';
import { Internship1736200000000 } from './migrations/1736200000000-Internship';
import { SkillTests1736300000000 } from './migrations/1736300000000-SkillTests';
import { ApplicationVideoRoom1736400000000 } from './migrations/1736400000000-ApplicationVideoRoom';
import { TelegramLinkCodes1736500000000 } from './migrations/1736500000000-TelegramLinkCodes';
import { JobApplicationRequirements1736600000000 } from './migrations/1736600000000-JobApplicationRequirements';

dotenv.config({ path: '.env' });

/**
 * CLI: `npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts`
 * Requires DATABASE_URL. Use when synchronize is disabled (e.g. production).
 */
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
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
  migrations: [
    AddSourceHashToEntityEmbeddings1735200000000,
    CatalogCitiesCategoriesTags1735300000000,
    JobIsPremium1735400000000,
    ProfileAvatarLogo1735500000000,
    ResumeDraftPdfKeyLength1735600000000,
    CatalogNameI18n1735700000000,
    JobCategoriesManyToMany1735800000000,
    Sprint2Features1735900000000,
    JobSource1736000000000,
    UserPoints1736100000000,
    Internship1736200000000,
    SkillTests1736300000000,
    ApplicationVideoRoom1736400000000,
    TelegramLinkCodes1736500000000,
    JobApplicationRequirements1736600000000,
  ],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
});
