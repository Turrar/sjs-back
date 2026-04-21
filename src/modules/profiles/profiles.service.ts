import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfileEntity } from '../../database/entities';
import { GitHubService } from './github.service';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(StudentProfileEntity)
    private readonly profiles: Repository<StudentProfileEntity>,
    private readonly github: GitHubService,
  ) {}

  /**
   * Публичный профиль студента — доступен без JWT.
   * userId используется как slug (в будущем можно добавить кастомный slug).
   */
  async getPublicProfile(userId: string) {
    const profile = await this.profiles.findOne({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const repos = profile.githubUsername
      ? await this.github.getTopRepos(profile.githubUsername)
      : [];

    return {
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      university: profile.university,
      specialty: profile.specialty,
      bio: profile.bio,
      portfolioUrl: profile.portfolioUrl,
      avatarStorageKey: profile.avatarStorageKey,
      githubUsername: profile.githubUsername,
      githubRepos: repos,
      createdAt: profile.createdAt,
    };
  }
}
