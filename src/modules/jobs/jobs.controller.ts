import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateJobDto } from './dto/create-job.dto';
import { RecommendedJobsDto } from './dto/recommended-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Req() req: { user?: JwtPayload },
    @Query('compatibleWithSchedule') compatibleWithSchedule?: string,
    @Query('excludeApplied') excludeApplied?: string,
    @Query('q') q?: string,
    @Query('location') location?: string,
    @Query('cityId') cityId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('tagId') tagId?: string,
  ) {
    return this.jobs.findPublished({
      compatibleWithSchedule: compatibleWithSchedule === 'true',
      excludeApplied: excludeApplied !== 'false',
      user: req.user,
      q,
      location,
      cityId,
      categoryId,
      tagId,
    });
  }

  /** Рекомендованные вакансии для студента по сходству профиля (AI). */
  @Get('recommended')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  recommended(@CurrentUser() user: JwtPayload, @Query() dto: RecommendedJobsDto) {
    return this.jobs.findRecommended({
      userId: user.sub,
      limit: dto.limit,
      compatibleWithSchedule: dto.compatibleWithSchedule,
    });
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  listMine(@CurrentUser() user: JwtPayload) {
    return this.jobs.listMine(user.sub);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user?: JwtPayload },
  ) {
    return this.jobs.findOne(id, req.user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateJobDto) {
    return this.jobs.create(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobs.update(id, user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.jobs.remove(id, user.sub);
  }
}
