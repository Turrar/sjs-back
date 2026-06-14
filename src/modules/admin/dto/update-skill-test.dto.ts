import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSkillTestDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  skill?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  passThreshold?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
