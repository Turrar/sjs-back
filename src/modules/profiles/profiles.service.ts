import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  EmployerProfileEntity,
  EmployerReviewEntity,
  JobEntity,
  SkillBadgeEntity,
  StudentProfileEntity,
  UserEntity,
} from '../../database/entities';
import { JobStatus } from '../../common/enums/job-status.enum';
import { normalizeNameI18n } from '../../common/utils/catalog-i18n.util';
import { UploadService } from '../upload/upload.service';
import { GitHubService } from './github.service';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(StudentProfileEntity)
    private readonly profiles: Repository<StudentProfileEntity>,
    @InjectRepository(SkillBadgeEntity)
    private readonly badges: Repository<SkillBadgeEntity>,
    @InjectRepository(EmployerProfileEntity)
    private readonly employerProfiles: Repository<EmployerProfileEntity>,
    @InjectRepository(EmployerReviewEntity)
    private readonly employerReviews: Repository<EmployerReviewEntity>,
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly github: GitHubService,
    private readonly upload: UploadService,
  ) {}

  /**
   * Публичный профиль студента — доступен без JWT.
   */
  async getPublicProfile(userId: string) {
    const profile = await this.profiles.findOne({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const repos = profile.githubUsername
      ? await this.github.getTopRepos(profile.githubUsername)
      : [];

    const badgeRows = await this.badges.find({
      where: { studentUserId: userId },
      order: { earnedAt: 'DESC' },
    });

    const avatarUrl = await this.upload.resolvePublicUrl(profile.avatarStorageKey);

    return {
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      university: profile.university,
      specialty: profile.specialty,
      bio: profile.bio,
      portfolioUrl: profile.portfolioUrl,
      avatarUrl,
      githubUsername: profile.githubUsername,
      githubRepos: repos,
      badges: badgeRows.map((b) => ({
        id: b.id,
        skill: b.skill,
        scorePercent: b.scorePercent,
        earnedAt: b.earnedAt,
      })),
      createdAt: profile.createdAt,
    };
  }

  /**
   * Публичная страница компании — без JWT.
   */
  async getPublicEmployerProfile(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.EMPLOYER) {
      throw new NotFoundException('Employer not found');
    }

    const profile = await this.employerProfiles.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Employer not found');

    const stats = await this.employerReviews
      .createQueryBuilder('r')
      .select('COUNT(*)', 'reviewCount')
      .addSelect('AVG(r.rating)', 'avgRating')
      .where('r.employer_user_id = :userId', { userId })
      .getRawOne<{ reviewCount: string; avgRating: string | null }>();

    const reviewCount = parseInt(stats?.reviewCount ?? '0', 10);
    const avgRating =
      reviewCount > 0 && stats?.avgRating != null
        ? Math.round(parseFloat(stats.avgRating) * 10) / 10
        : null;

    const logoUrl = await this.upload.resolvePublicUrl(profile.logoStorageKey);

    const reviewRows = await this.employerReviews.find({
      where: { employerUserId: userId },
      relations: ['studentUser', 'studentUser.studentProfile'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const publishedJobs = await this.jobs.find({
      where: { employerUserId: userId, status: JobStatus.PUBLISHED },
      relations: ['city'],
      order: { isPremium: 'DESC', createdAt: 'DESC' },
      take: 20,
    });
    const publishedJobsCount = await this.jobs.count({
      where: { employerUserId: userId, status: JobStatus.PUBLISHED },
    });

    return {
      userId: profile.userId,
      companyName: profile.companyName,
      description: profile.description,
      website: profile.website,
      logoUrl,
      verificationStatus: profile.verificationStatus,
      avgRating,
      reviewCount,
      recentReviews: reviewRows.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        isAnonymous: r.isAnonymous,
        createdAt: r.createdAt,
        reviewer: r.isAnonymous
          ? null
          : {
              firstName: r.studentUser?.studentProfile?.firstName ?? null,
              lastName: r.studentUser?.studentProfile?.lastName ?? null,
            },
      })),
      publishedJobsCount: publishedJobs.length,
      publishedJobs: publishedJobs.map((job) => {
        if (job.city) {
          Object.assign(job.city, normalizeNameI18n(job.city));
        }
        return {
          id: job.id,
          title: job.title,
          city: job.city
            ? { id: job.city.id, name: job.city.name, nameI18n: job.city.nameI18n }
            : null,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          isPremium: job.isPremium,
          source: job.source,
          createdAt: job.createdAt,
        };
      }),
      createdAt: profile.createdAt,
    };
  }
}
