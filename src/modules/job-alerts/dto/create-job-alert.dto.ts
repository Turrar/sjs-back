import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateJobAlertDto {
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  /** Ключевое слово для поиска в названии вакансии */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}

export class UpdateJobAlertDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  cityId?: string | null;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[] | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string | null;
}
