import {
  Body,
  Controller,
  Get,
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
import { AiService } from './ai.service';
import { StudentAiService } from './student-ai.service';
import { CoverLetterDto } from './dto/cover-letter.dto';
import { InterviewPrepDto } from './dto/interview-prep.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly studentAi: StudentAiService,
  ) {}

  @Get('health')
  health() {
    return this.ai.health();
  }

  /**
   * Сгенерировать сопроводительное письмо для указанной вакансии.
   * Использует профиль студента и описание вакансии как контекст.
   */
  @Post('cover-letter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async coverLetter(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CoverLetterDto,
  ) {
    const text = await this.studentAi.generateCoverLetter({
      studentUserId: user.sub,
      ...dto,
    });
    return { text };
  }

  /**
   * Список вопросов для подготовки к собеседованию по вакансии.
   * Доступен любому авторизованному пользователю.
   */
  @Get('interview-prep')
  @UseGuards(JwtAuthGuard)
  async interviewPrep(@Query() dto: InterviewPrepDto) {
    const questions = await this.studentAi.getInterviewQuestions(dto);
    return { questions };
  }
}
