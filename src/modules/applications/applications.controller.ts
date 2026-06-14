import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListJobApplicationsQueryDto } from './dto/list-job-applications-query.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  apply(@CurrentUser() user: JwtPayload, @Body() dto: CreateApplicationDto) {
    return this.applications.apply(user.sub, dto);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  listMine(@CurrentUser() user: JwtPayload) {
    return this.applications.listMine(user.sub);
  }

  @Get('job/:jobId')
  @Roles(UserRole.EMPLOYER)
  listForJob(
    @CurrentUser() user: JwtPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query() query: ListJobApplicationsQueryDto,
  ) {
    return this.applications.listForJob(user.sub, jobId, query.status);
  }

  @Get(':id')
  @Roles(UserRole.STUDENT, UserRole.EMPLOYER)
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applications.findOne(user.sub, user.role as UserRole, id);
  }

  @Patch(':id/withdraw')
  @Roles(UserRole.STUDENT)
  withdraw(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applications.withdraw(user.sub, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.EMPLOYER)
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applications.updateStatus(user.sub, id, dto.status);
  }
}
