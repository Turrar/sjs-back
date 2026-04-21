import type {
  ResumeDraftEntity,
  StudentProfileEntity,
} from '../../database/entities';
import {
  buildStudentScoringText,
  buildStudentProfileText,
} from './embedding-text.util';

describe('buildStudentScoringText', () => {
  const profile = {
    firstName: 'Ann',
    lastName: 'Doe',
    university: 'MIT',
    specialty: 'CS',
    bio: 'Backend',
    portfolioUrl: null,
  } as unknown as StudentProfileEntity;

  it('merges profile and resume', () => {
    const draft = {
      title: 'CV',
      contentJson: { skills: ['Go'] },
    } as ResumeDraftEntity;
    const t = buildStudentScoringText(profile, draft);
    expect(t).toContain('Ann');
    expect(t).toContain('--- Resume ---');
    expect(t).toContain('Go');
  });

  it('uses resume only when profile text is empty', () => {
    const empty = {
      firstName: null,
      lastName: null,
      university: null,
      specialty: null,
      bio: null,
      portfolioUrl: null,
    } as unknown as StudentProfileEntity;
    expect(buildStudentProfileText(empty)).toBe('');
    const draft = {
      title: 'X',
      contentJson: { a: 1 },
    } as ResumeDraftEntity;
    expect(buildStudentScoringText(empty, draft)).toContain('X');
  });
});
