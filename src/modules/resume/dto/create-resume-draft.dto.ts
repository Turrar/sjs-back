import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateResumeDraftDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsObject()
  contentJson!: Record<string, unknown>;

  /** Ключ PDF в S3 после POST /upload/presign; опционально при создании */
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  pdfStorageKey?: string;
}
