import type {
  JobEntity,
  ResumeDraftEntity,
  StudentProfileEntity,
} from '../../database/entities';

export function buildStudentProfileText(p: StudentProfileEntity): string {
  const parts = [
    p.firstName,
    p.lastName,
    p.university,
    p.specialty,
    p.bio,
    p.portfolioUrl,
  ].filter((x): x is string => typeof x === 'string' && x.length > 0);
  return parts.join('\n');
}

export function buildJobEmbeddingText(job: JobEntity): string {
  return `${job.title}\n\n${job.description}`;
}

export function buildResumeDraftText(d: ResumeDraftEntity): string {
  const title = d.title?.trim();
  const json = JSON.stringify(d.contentJson ?? {});
  return [title, json].filter(Boolean).join('\n\n');
}

/** Text used for job–candidate similarity (profile + latest resume when present). */
export function buildStudentScoringText(
  profile: StudentProfileEntity,
  resumeDraft?: ResumeDraftEntity | null,
): string {
  const profileText = buildStudentProfileText(profile);
  const resumeText = resumeDraft
    ? buildResumeDraftText(resumeDraft).trim()
    : '';
  if (!profileText.trim() && resumeText) {
    return resumeText;
  }
  if (!profileText.trim()) {
    return '';
  }
  if (!resumeText) {
    return profileText;
  }
  return `${profileText}\n\n--- Resume ---\n\n${resumeText}`;
}
