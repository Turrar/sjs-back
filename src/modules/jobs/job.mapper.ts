import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { JobEntity } from '../../database/entities';

export type StudentApplicationRef = {
  id: string;
  status: ApplicationStatus;
};

export function mapJobResponse(
  job: JobEntity,
  extras?: {
    matchScore?: number | null;
    application?: StudentApplicationRef | null;
  },
) {
  const application = extras?.application;
  const base = {
    ...job,
    ...(extras?.matchScore !== undefined ? { matchScore: extras.matchScore } : {}),
  };
  if (application === undefined) {
    return base;
  }
  return {
    ...base,
    hasApplied: !!application,
    applicationId: application?.id ?? null,
    applicationStatus: application?.status ?? null,
  };
}
