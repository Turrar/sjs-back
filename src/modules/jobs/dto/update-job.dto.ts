import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { JobStatus } from '../../../common/enums/job-status.enum';
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

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

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
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  cityId?: string | null;

  /** Полная замена списка категорий; [] — снять все. */
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
