import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  /**
   * Публичная страница компании — без авторизации.
   */
  @Get('employer/:userId')
  getEmployerPublic(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.profiles.getPublicEmployerProfile(userId);
  }

  /**
   * Публичный профиль студента — без авторизации.
   * Работодатель открывает /api/profiles/:userId и видит CV студента.
   */
  @Get(':userId')
  getPublic(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.profiles.getPublicProfile(userId);
  }
}
