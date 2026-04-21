import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import { EmployerReviewsService } from './employer-reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class EmployerReviewsController {
  constructor(private readonly reviews: EmployerReviewsService) {}

  /** Оставить анонимный отзыв о работодателе (только STUDENT) */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.sub, dto);
  }

  /** Публичный список отзывов о работодателе — без авторизации */
  @Get('employer/:employerUserId')
  getForEmployer(@Param('employerUserId', ParseUUIDPipe) employerUserId: string) {
    return this.reviews.getForEmployer(employerUserId);
  }
}
