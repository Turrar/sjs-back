import { IsEnum } from 'class-validator';
import { EmployerVerificationStatus } from '../../../common/enums/employer-verification-status.enum';

export class UpdateEmployerVerificationDto {
  @IsEnum(EmployerVerificationStatus)
  status!: EmployerVerificationStatus;
}
