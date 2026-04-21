import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateScheduleSlotDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  startMinute?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  endMinute?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string | null;
}
