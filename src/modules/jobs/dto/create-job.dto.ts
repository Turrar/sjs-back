import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { JobWorkWindowJson } from '../../../database/entities/job.entity';

class WorkWindowDto implements JobWorkWindowJson {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsInt()
  @Min(0)
  @Max(1440)
  startMinute!: number;

  @IsInt()
  @Min(0)
  @Max(1440)
  endMinute!: number;
}

export class CreateJobDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(20000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsInt()
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  salaryMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsNumber()
  requiredWeeklyHours?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkWindowDto)
  workWindows?: WorkWindowDto[];

  @IsOptional()
  @IsUUID()
  cityId?: string;

  /** Несколько категорий (как теги). */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}
