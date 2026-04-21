import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TaskStatus } from '../../../database/entities/internship.entity';

export class CreateInternshipDto {
  @IsUUID()
  applicationId!: string;
}

export class AddLogEntryDto {
  @IsDateString()
  date!: string;

  @IsNumber()
  @Min(0.25)
  @Max(24)
  hours!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class CreateTaskDto {
  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class CompleteInternshipDto {
  @IsString()
  @MaxLength(5000)
  employerFeedback!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  employerRating!: number;
}
