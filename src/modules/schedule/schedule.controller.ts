import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateScheduleSourceDto } from './dto/create-schedule-source.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Post('sources')
  @Roles(UserRole.STUDENT)
  createSource(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateScheduleSourceDto,
  ) {
    return this.schedule.createSource(user.sub, user.role, dto);
  }

  @Get('sources')
  @Roles(UserRole.STUDENT)
  listSources(@CurrentUser() user: JwtPayload) {
    return this.schedule.listSources(user.sub, user.role);
  }

  @Get('slots')
  @Roles(UserRole.STUDENT)
  listSlots(@CurrentUser() user: JwtPayload) {
    return this.schedule.listSlots(user.sub, user.role);
  }

  @Patch('slots/:id')
  @Roles(UserRole.STUDENT)
  updateSlot(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleSlotDto,
  ) {
    return this.schedule.updateSlot(user.sub, user.role, id, dto);
  }
}
