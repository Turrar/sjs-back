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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
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
  ) {
    return this.applications.listForJob(user.sub, jobId);
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
