import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  POINT_VALUES,
  PointEventType,
  UserPointsEntity,
} from '../../database/entities/user-points.entity';

@Injectable()
export class GamificationService {
  private readonly log = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(UserPointsEntity)
    private readonly points: Repository<UserPointsEntity>,
  ) {}

  /**
   * Начислить очки за событие.
   * Идемпотентно для одноразовых событий (PROFILE_COMPLETED и т.п.) —
   * не начисляем повторно, если событие уже было.
   */
  async award(
    userId: string,
    event: PointEventType,
    meta?: Record<string, unknown>,
  ): Promise<UserPointsEntity | null> {
    const once = this.isOneTimeEvent(event);
    if (once) {
      const existing = await this.points.findOne({ where: { userId, event } });
      if (existing) return null;
    }

    const value = POINT_VALUES[event];
    const entry = this.points.create({ userId, event, points: value, meta: meta ?? null });
    const saved = await this.points.save(entry);
    this.log.log(`Points awarded userId=${userId} event=${event} points=${value}`);
    return saved;
  }

  /** Суммарные очки пользователя */
  async total(userId: string): Promise<number> {
    const result = await this.points
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.points), 0)', 'total')
      .where('p.user_id = :userId', { userId })
      .getRawOne<{ total: string }>();
    return parseInt(result?.total ?? '0', 10);
  }

  /** История начислений */
  async history(userId: string, limit = 50): Promise<UserPointsEntity[]> {
    return this.points.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /** Лидерборд — топ-10 пользователей */
  async leaderboard(limit = 10): Promise<Array<{ userId: string; total: number }>> {
    const rows = await this.points
      .createQueryBuilder('p')
      .select('p.user_id', 'userId')
      .addSelect('COALESCE(SUM(p.points), 0)::int', 'total')
      .groupBy('p.user_id')
      .orderBy('total', 'DESC')
      .limit(limit)
      .getRawMany<{ userId: string; total: number }>();
    return rows;
  }

  private isOneTimeEvent(event: PointEventType): boolean {
    const onceEvents: PointEventType[] = [
      PointEventType.PROFILE_COMPLETED,
      PointEventType.FIRST_APPLICATION,
      PointEventType.FIRST_HIRE,
      PointEventType.RESUME_CREATED,
      PointEventType.SCHEDULE_UPLOADED,
      PointEventType.GITHUB_LINKED,
      PointEventType.TELEGRAM_LINKED,
    ];
    return onceEvents.includes(event);
  }
}
