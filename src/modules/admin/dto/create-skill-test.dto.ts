import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class SkillTestQuestionDto {
  @IsString()
  question!: string;

  @IsArray()
  options!: Array<{ id: string; text: string }>;

  @IsString()
  @MaxLength(10)
  correctOptionId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateSkillTestDto {
  @IsString()
  @MaxLength(200)
  skill!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  passThreshold?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillTestQuestionDto)
  questions?: SkillTestQuestionDto[];
}
