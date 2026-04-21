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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { InternshipService } from './internship.service';
import {
  AddLogEntryDto,
  CompleteInternshipDto,
  CreateInternshipDto,
  CreateTaskDto,
  UpdateTaskDto,
} from './dto/internship.dto';

@Controller('internships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InternshipController {
  constructor(private readonly internship: InternshipService) {}

  /** Открыть трекер стажировки (работодатель, только HIRED) */
  @Post()
  @Roles(UserRole.EMPLOYER)
  open(@CurrentUser() u: JwtPayload, @Body() dto: CreateInternshipDto) {
    return this.internship.open(u.sub, dto);
  }

  /** Мои стажировки (студент или работодатель) */
  @Get('mine')
  @Roles(UserRole.STUDENT, UserRole.EMPLOYER)
  mine(@CurrentUser() u: JwtPayload) {
    return this.internship.myInternships(u.sub, u.role as UserRole);
  }

  /** Детали стажировки с журналом и задачами */
  @Get(':id')
  @Roles(UserRole.STUDENT, UserRole.EMPLOYER)
  findOne(@CurrentUser() u: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.internship.findOne(u.sub, id);
  }

  /** Добавить запись в журнал часов (студент) */
  @Post(':id/log')
  @Roles(UserRole.STUDENT)
  addLog(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddLogEntryDto,
  ) {
    return this.internship.addLogEntry(u.sub, id, dto);
  }

  /** Суммарные часы по стажировке */
  @Get(':id/total-hours')
  @Roles(UserRole.STUDENT, UserRole.EMPLOYER)
  totalHours(@Param('id', ParseUUIDPipe) id: string) {
    return this.internship.totalHours(id);
  }

  /** Добавить задачу (работодатель) */
  @Post(':id/tasks')
  @Roles(UserRole.EMPLOYER)
  createTask(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.internship.createTask(u.sub, id, dto);
  }

  /** Обновить задачу (студент или работодатель) */
  @Patch('tasks/:taskId')
  @Roles(UserRole.STUDENT, UserRole.EMPLOYER)
  updateTask(
    @CurrentUser() u: JwtPayload,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.internship.updateTask(u.sub, taskId, dto);
  }

  /** Завершить стажировку с итоговым отзывом (работодатель) */
  @Post(':id/complete')
  @Roles(UserRole.EMPLOYER)
  complete(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteInternshipDto,
  ) {
    return this.internship.complete(u.sub, id, dto);
  }
}
