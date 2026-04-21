import { IsIn } from 'class-validator';
import { JobStatus } from '../../../common/enums/job-status.enum';

export class ModerateJobDto {
  @IsIn([JobStatus.PAUSED, JobStatus.ARCHIVED])
  status!: JobStatus.PAUSED | JobStatus.ARCHIVED;
}
