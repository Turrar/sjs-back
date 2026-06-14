import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { JobStatus } from '../../common/enums/job-status.enum';
import { HhImportService } from '../hh-import/hh-import.service';
import { AdminService } from './admin.service';
import { CreateCityDto } from './dto/create-city.dto';
import { CreateJobCategoryDto } from './dto/create-job-category.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { ModerateJobDto } from './dto/moderate-job.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { UpdateEmployerVerificationDto } from './dto/update-employer-verification.dto';
import { UpdateJobCategoryDto } from './dto/update-job-category.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { CreateSkillTestDto } from './dto/create-skill-test.dto';
import { UpdateSkillTestDto } from './dto/update-skill-test.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly hhImport: HhImportService,
  ) {}

  @Get('users')
  listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: UserRole,
  ) {
    return this.admin.listUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      role,
    );
  }

  @Get('jobs')
  listJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: JobStatus,
  ) {
    return this.admin.listJobs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
    );
  }

  @Patch('users/:userId/status')
  setUserStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.admin.setUserActive(userId, dto.isActive);
  }

  @Patch('employers/:userId/verification')
  verifyEmployer(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateEmployerVerificationDto,
  ) {
    return this.admin.setEmployerVerification(userId, dto.status);
  }

  @Patch('jobs/:id/moderate')
  moderateJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ModerateJobDto,
  ) {
    return this.admin.moderateJob(id, body.status);
  }

  @Get('cities')
  listCities() {
    return this.admin.listCities();
  }

  @Get('job-categories')
  listJobCategories() {
    return this.admin.listJobCategories();
  }

  @Get('tags')
  listTags() {
    return this.admin.listTags();
  }

  @Post('cities')
  createCity(@Body() dto: CreateCityDto) {
    return this.admin.createCity(dto);
  }

  @Patch('cities/:id')
  updateCity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCityDto,
  ) {
    return this.admin.updateCity(id, dto);
  }

  @Delete('cities/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCity(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.removeCity(id);
  }

  @Post('job-categories')
  createJobCategory(@Body() dto: CreateJobCategoryDto) {
    return this.admin.createJobCategory(dto);
  }

  @Patch('job-categories/:id')
  updateJobCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobCategoryDto,
  ) {
    return this.admin.updateJobCategory(id, dto);
  }

  @Delete('job-categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeJobCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.removeJobCategory(id);
  }

  @Post('tags')
  createTag(@Body() dto: CreateTagDto) {
    return this.admin.createTag(dto);
  }

  @Patch('tags/:id')
  updateTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.admin.updateTag(id, dto);
  }

  @Delete('tags/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTag(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.removeTag(id);
  }

  @Get('skill-tests')
  listSkillTests() {
    return this.admin.listSkillTests();
  }

  @Post('skill-tests')
  createSkillTest(@Body() dto: CreateSkillTestDto) {
    return this.admin.createSkillTest(dto);
  }

  @Patch('skill-tests/:id')
  updateSkillTest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillTestDto,
  ) {
    return this.admin.updateSkillTest(id, dto);
  }

  @Delete('skill-tests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSkillTest(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.removeSkillTest(id);
  }

  /**
   * Ручной запуск импорта вакансий с HH.kz.
   * POST /api/admin/hh-import?text=стажировка&area=160
   * area: 160 = Казахстан, 2019 = Алматы, 1 = Москва
   */
  @Post('hh-import')
  runHhImport(
    @Query('text') text?: string,
    @Query('area') area?: string,
  ) {
    return this.hhImport.importVacancies(
      text ?? 'стажировка OR internship',
      area ?? '160',
    );
  }
}
