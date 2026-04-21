import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user-role.enum';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { SkillTestsService } from './skill-tests.service';
import { SubmitTestDto } from './dto/submit-test.dto';

@Controller('skill-tests')
export class SkillTestsController {
  constructor(private readonly skillTests: SkillTestsService) {}

  /** Список доступных тестов — без авторизации */
  @Get()
  listTests() {
    return this.skillTests.listTests();
  }

  /** Мои бейджи — авторизован студент (до GET :id, иначе :id перехватывает «badges») */
  @Get('badges/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  myBadges(@CurrentUser() u: JwtPayload) {
    return this.skillTests.getBadges(u.sub);
  }

  /** Публичные бейджи студента по userId */
  @Get('badges/user/:userId')
  publicBadges(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.skillTests.getBadges(userId);
  }

  /** История попыток текущего студента */
  @Get('results/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  myResults(
    @CurrentUser() u: JwtPayload,
    @Query('testId') testId?: string,
  ) {
    return this.skillTests.myResults(u.sub, testId);
  }

  /** Тест с вопросами (правильные ответы скрыты) — без авторизации */
  @Get(':id')
  getTest(@Param('id', ParseUUIDPipe) id: string) {
    return this.skillTests.getTest(id);
  }

  /** Отправить ответы и получить результат (только студент) */
  @Post('submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  submit(@CurrentUser() u: JwtPayload, @Body() dto: SubmitTestDto) {
    return this.skillTests.submit(u.sub, dto.testId, dto.answers);
  }
}
