import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { NameI18nDto } from '../../../common/dto/name-i18n.dto';

export class CreateTagDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NameI18nDto)
  nameI18n?: NameI18nDto;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
