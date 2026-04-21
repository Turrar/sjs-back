import { IsString, MaxLength } from 'class-validator';

export class NameI18nDto {
  @IsString()
  @MaxLength(500)
  ru!: string;

  @IsString()
  @MaxLength(500)
  kk!: string;

  @IsString()
  @MaxLength(500)
  en!: string;
}
