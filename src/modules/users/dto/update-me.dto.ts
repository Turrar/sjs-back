import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  university?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bio?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  portfolioUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  /** Ключ в S3 после POST /upload/presign; null — убрать фото */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(2048)
  avatarStorageKey?: string | null;

  /** GitHub username для отображения репозиториев в публичном профиле */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(128)
  githubUsername?: string | null;

  /** Telegram chat_id для включения уведомлений (null — отключить) */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(64)
  telegramChatId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  companyDescription?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  /** Ключ в S3 после presign; null — убрать логотип */
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(2048)
  logoStorageKey?: string | null;
}
