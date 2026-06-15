import type {
  ApplicationEntity,
  JobEntity,
  ResumeDraftEntity,
} from '../../database/entities';

export type ApplicationJobSummary = {
  id: string;
  title: string;
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency: string;
  requiresResume?: boolean;
  requiresCoverLetter?: boolean;
  city?: { id: string; name: string; slug?: string | null } | null;
};

export type ApplicationStudentSummary = {
  id: string;
  email: string;
};

export type ApplicationStudentProfileSummary = {
  firstName?: string | null;
  lastName?: string | null;
  university?: string | null;
  specialty?: string | null;
};

export type ApplicationResumeSummary = {
  id: string;
  title?: string | null;
  pdfStorageKey?: string | null;
  pdfUrl?: string | null;
};

export type ApplicationResponse = {
  id: string;
  jobId: string;
  studentUserId: string;
  studentProfileId: string;
  status: ApplicationEntity['status'];
  coverLetter?: string | null;
  resumeDraftId?: string | null;
  resume?: ApplicationResumeSummary | null;
  employerScore?: number | null;
  hasReviewed?: boolean;
  createdAt: Date;
  updatedAt: Date;
  job?: ApplicationJobSummary;
  student?: ApplicationStudentSummary;
  studentProfile?: ApplicationStudentProfileSummary;
};

export function mapJobSummary(job: JobEntity): ApplicationJobSummary {
  return {
    id: job.id,
    title: job.title,
    location: job.location,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    requiresResume: job.requiresResume,
    requiresCoverLetter: job.requiresCoverLetter,
    city: job.city
      ? {
          id: job.city.id,
          name: job.city.name,
          slug: job.city.slug,
        }
      : null,
  };
}

export function mapResumeSummary(
  draft: ResumeDraftEntity | null | undefined,
  pdfUrl?: string | null,
): ApplicationResumeSummary | null {
  if (!draft) return null;
  return {
    id: draft.id,
    title: draft.title ?? null,
    pdfStorageKey: draft.pdfStorageKey ?? null,
    ...(pdfUrl !== undefined ? { pdfUrl } : {}),
  };
}

export function mapApplication(
  app: ApplicationEntity,
  extras?: { hasReviewed?: boolean; resumePdfUrl?: string | null },
): ApplicationResponse {
  return {
    id: app.id,
    jobId: app.jobId,
    studentUserId: app.studentUserId,
    studentProfileId: app.studentProfileId,
    status: app.status,
    coverLetter: app.coverLetter,
    resumeDraftId: app.resumeDraftId ?? null,
    resume: mapResumeSummary(app.resumeDraft, extras?.resumePdfUrl),
    employerScore: app.employerScore,
    ...(extras?.hasReviewed !== undefined
      ? { hasReviewed: extras.hasReviewed }
      : {}),
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    job: app.job ? mapJobSummary(app.job) : undefined,
    student: app.student
      ? { id: app.student.id, email: app.student.email }
      : undefined,
    studentProfile: app.studentProfile
      ? {
          firstName: app.studentProfile.firstName,
          lastName: app.studentProfile.lastName,
          university: app.studentProfile.university,
          specialty: app.studentProfile.specialty,
        }
      : undefined,
  };
}
