import {
  Body,
  Controller,
  Delete,
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
import { JobAlertsService } from './job-alerts.service';
import { CreateJobAlertDto, UpdateJobAlertDto } from './dto/create-job-alert.dto';

@Controller('job-alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class JobAlertsController {
  constructor(private readonly jobAlerts: JobAlertsService) {}

  /** Создать подписку на новые вакансии */
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateJobAlertDto) {
    return this.jobAlerts.create(user.sub, dto);
  }

  /** Список подписок текущего студента */
  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.jobAlerts.list(user.sub);
  }

  /** Обновить параметры или деактивировать подписку */
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobAlertDto,
  ) {
    return this.jobAlerts.update(user.sub, id, dto);
  }

  /** Удалить подписку */
  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.jobAlerts.remove(user.sub, id);
  }
}
