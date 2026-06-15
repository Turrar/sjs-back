import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  jobId!: string;

  @IsOptional()
  @IsUUID()
  resumeDraftId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  coverLetter?: string;
}
