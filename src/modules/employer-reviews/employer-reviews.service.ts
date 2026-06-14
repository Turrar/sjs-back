import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  EmployerProfileEntity,
  EmployerReviewEntity,
  UserEntity,
} from '../../database/entities';
import { PointEventType } from '../../database/entities/user-points.entity';
import { GamificationService } from '../gamification/gamification.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class EmployerReviewsService {
  constructor(
    @InjectRepository(EmployerReviewEntity)
    private readonly reviews: Repository<EmployerReviewEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(EmployerProfileEntity)
    private readonly employerProfiles: Repository<EmployerProfileEntity>,
    private readonly gamification: GamificationService,
  ) {}

  async create(studentUserId: string, dto: CreateReviewDto) {
    const employer = await this.users.findOne({
      where: { id: dto.employerUserId, role: UserRole.EMPLOYER },
    });
    if (!employer) throw new NotFoundException('Employer not found');

    const existing = await this.reviews.findOne({
      where: { studentUserId, employerUserId: dto.employerUserId },
    });
    if (existing) throw new ConflictException('You have already reviewed this employer');

    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const review = this.reviews.create({
      studentUserId,
      employerUserId: dto.employerUserId,
      rating: dto.rating,
      comment: dto.comment ?? null,
      isAnonymous: dto.isAnonymous ?? true,
    });
    const saved = await this.reviews.save(review);
    this.gamification.award(studentUserId, PointEventType.REVIEW_WRITTEN).catch(() => null);
    return {
      id: saved.id,
      employerUserId: saved.employerUserId,
      rating: saved.rating,
      comment: saved.comment,
      isAnonymous: saved.isAnonymous,
      createdAt: saved.createdAt,
      ...(saved.isAnonymous ? {} : { studentUserId: saved.studentUserId }),
    };
  }

  async listMine(studentUserId: string) {
    const items = await this.reviews.find({
      where: { studentUserId },
      relations: ['employerUser', 'employerUser.employerProfile'],
      order: { createdAt: 'DESC' },
    });
    return {
      reviews: items.map((r) => ({
        id: r.id,
        employerUserId: r.employerUserId,
        companyName: r.employerUser?.employerProfile?.companyName ?? null,
        rating: r.rating,
        comment: r.comment,
        isAnonymous: r.isAnonymous,
        createdAt: r.createdAt,
      })),
    };
  }

  async hasReviewed(
    studentUserId: string,
    employerUserId: string,
  ): Promise<boolean> {
    const count = await this.reviews.count({
      where: { studentUserId, employerUserId },
    });
    return count > 0;
  }

  async hasReviewedEmployerIds(
    studentUserId: string,
    employerUserIds: string[],
  ): Promise<Set<string>> {
    const unique = [...new Set(employerUserIds.filter(Boolean))];
    if (unique.length === 0) return new Set();
    const rows = await this.reviews.find({
      where: { studentUserId, employerUserId: In(unique) },
      select: ['employerUserId'],
    });
    return new Set(rows.map((r) => r.employerUserId));
  }

  /**
   * Получить отзывы о работодателе с агрегированным рейтингом.
   * Публично доступен (без JWT).
   */
  async getForEmployer(employerUserId: string) {
    const employer = await this.employerProfiles.findOne({
      where: { userId: employerUserId },
    });
    if (!employer) throw new NotFoundException('Employer not found');

    const items = await this.reviews.find({
      where: { employerUserId },
      relations: ['studentUser', 'studentUser.studentProfile'],
      order: { createdAt: 'DESC' },
    });

    const avgRating =
      items.length > 0
        ? Math.round((items.reduce((s, r) => s + r.rating, 0) / items.length) * 10) / 10
        : null;

    return {
      employerUserId,
      companyName: employer.companyName,
      avgRating,
      reviewCount: items.length,
      reviews: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewer: r.isAnonymous
          ? null
          : {
              userId: r.studentUserId,
              firstName: r.studentUser?.studentProfile?.firstName,
              lastName: r.studentUser?.studentProfile?.lastName,
            },
      })),
    };
  }
}
