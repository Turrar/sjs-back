import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class PresignUploadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  /** Original filename; used for extension only */
  filename!: string;

  @IsString()
  @Matches(/^[a-z0-9][a-z0-9./+-]*$/i)
  @MaxLength(120)
  contentType!: string;
}
