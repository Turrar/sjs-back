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
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateResumeDraftDto } from './dto/create-resume-draft.dto';
import { UpdateResumeDraftDto } from './dto/update-resume-draft.dto';
import { ResumeService } from './resume.service';

@Controller('resume')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class ResumeController {
  constructor(private readonly resume: ResumeService) {}

  @Get('drafts')
  list(@CurrentUser() user: JwtPayload) {
    return this.resume.list(user.sub);
  }

  @Post('drafts')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateResumeDraftDto) {
    return this.resume.create(user.sub, dto);
  }

  @Get('drafts/:id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resume.findOne(user.sub, id);
  }

  @Patch('drafts/:id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResumeDraftDto,
  ) {
    return this.resume.update(user.sub, id, dto);
  }

  @Delete('drafts/:id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resume.remove(user.sub, id);
  }

  /** AI-советы по улучшению черновика резюме. */
  @Get('drafts/:id/suggestions')
  suggestions(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('language') language?: 'ru' | 'kk' | 'en',
  ) {
    return this.resume.getSuggestions(user.sub, id, language);
  }
}
