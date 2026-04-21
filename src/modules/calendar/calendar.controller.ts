import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { CalendarService } from './calendar.service';

@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  /**
   * GET /api/calendar/schedule.ics
   * Скачать расписание в формате iCal — импортируется в Google Calendar / Outlook одним кликом.
   */
  @Get('schedule.ics')
  async downloadIcal(@CurrentUser() u: JwtPayload, @Res() res: Response) {
    const ical = await this.calendar.generateIcal(u.sub);
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="schedule.ics"',
    });
    res.send(ical);
  }
}
