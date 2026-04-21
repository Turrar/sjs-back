import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { GamificationService } from './gamification.service';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  /** Суммарные очки и история текущего пользователя */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async myPoints(@CurrentUser() user: JwtPayload) {
    const [total, history] = await Promise.all([
      this.gamification.total(user.sub),
      this.gamification.history(user.sub),
    ]);
    return { total, history };
  }

  /** Публичный лидерборд — топ-N пользователей по очкам */
  @Get('leaderboard')
  leaderboard(@Query('limit') limit?: string) {
    return this.gamification.leaderboard(limit ? parseInt(limit, 10) : 10);
  }
}
