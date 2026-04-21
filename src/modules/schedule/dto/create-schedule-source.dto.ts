import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateScheduleSourceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  storageKey!: string;

  @IsString()
  @MaxLength(120)
  mimeType!: string;
}
