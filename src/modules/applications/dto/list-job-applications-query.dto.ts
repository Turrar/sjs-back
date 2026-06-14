import { IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from '../../../common/enums/application-status.enum';

export class ListJobApplicationsQueryDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
