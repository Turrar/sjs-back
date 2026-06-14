import { BadRequestException } from '@nestjs/common';
import { ApplicationStatus } from '../enums/application-status.enum';

const EMPLOYER_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.SUBMITTED]: [
    ApplicationStatus.REVIEWING,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.REVIEWING]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.INTERVIEW]: [
    ApplicationStatus.OFFER,
    ApplicationStatus.HIRED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.OFFER]: [ApplicationStatus.HIRED, ApplicationStatus.REJECTED],
  [ApplicationStatus.HIRED]: [],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};

const STUDENT_WITHDRAW_ALLOWED_FROM: ApplicationStatus[] = [
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
];

export function assertStudentWithdraw(from: ApplicationStatus): void {
  if (!STUDENT_WITHDRAW_ALLOWED_FROM.includes(from)) {
    throw new BadRequestException(
      `Cannot withdraw application in status ${from}`,
    );
  }
}

export function assertEmployerStatusTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): void {
  if (to === ApplicationStatus.WITHDRAWN) {
    throw new BadRequestException('Employer cannot set WITHDRAWN status');
  }
  const allowed = EMPLOYER_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Cannot transition application from ${from} to ${to}`,
    );
  }
}
