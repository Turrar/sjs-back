import { Controller, Get, UseGuards } from '@nestjs/common';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('platform')
  @Roles(UserRole.ADMIN)
  platform() {
    return this.analytics.platformSummary();
  }

  @Get('employer/me')
  @Roles(UserRole.EMPLOYER)
  employerMe(@CurrentUser() user: JwtPayload) {
    return this.analytics.employerSummary(user.sub);
  }
}
