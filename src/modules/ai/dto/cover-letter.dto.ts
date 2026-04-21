import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CoverLetterDto {
  @IsUUID()
  jobId!: string;

  @IsOptional()
  @IsEnum(['ru', 'kk', 'en'])
  language?: 'ru' | 'kk' | 'en';

  @IsOptional()
  @IsEnum(['formal', 'friendly'])
  tone?: 'formal' | 'friendly';
}
