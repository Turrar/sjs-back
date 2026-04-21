import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobStatus } from '../../common/enums/job-status.enum';
import {
  ApplicationEntity,
  JobEntity,
  UserEntity,
} from '../../database/entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
  ) {}

  async platformSummary() {
    const userCounts = await this.users
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.role')
      .getRawMany();
    const publishedJobs = await this.jobs.count({
      where: { status: JobStatus.PUBLISHED },
    });
    const totalApplications = await this.applications.count();
    return {
      usersByRole: userCounts,
      publishedJobs,
      totalApplications,
    };
  }

  async employerSummary(employerUserId: string) {
    const jobs = await this.jobs.find({
      where: { employerUserId },
      select: ['id'],
    });
    const ids = jobs.map((j) => j.id);
    if (!ids.length) {
      return { jobs: 0, applications: 0 };
    }
    const applications = await this.applications
      .createQueryBuilder('a')
      .where('a.job_id IN (:...ids)', { ids })
      .getCount();
    return {
      jobs: ids.length,
      applications,
    };
  }
}
