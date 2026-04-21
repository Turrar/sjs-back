import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class InterviewPrepDto {
  @IsUUID()
  jobId!: string;

  @IsOptional()
  @IsEnum(['ru', 'kk', 'en'])
  language?: 'ru' | 'kk' | 'en';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(20)
  count?: number;
}
