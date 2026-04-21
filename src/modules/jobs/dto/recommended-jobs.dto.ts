import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class RecommendedJobsDto {
  /** Сколько вакансий вернуть (1..50, по умолчанию 10). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  /** true — дополнительно отфильтровать по совместимости с расписанием студента. */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  compatibleWithSchedule?: boolean;
}
