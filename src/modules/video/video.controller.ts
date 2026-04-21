import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { VideoService } from './video.service';

@Controller('video')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(private readonly video: VideoService) {}

  /**
   * Создать видеокомнату для собеседования по заявке.
   * Вернёт URL Daily.co комнаты (живёт 2 часа).
   * POST /api/video/rooms/:applicationId
   */
  @Post('rooms/:applicationId')
  createRoom(@Param('applicationId', ParseUUIDPipe) applicationId: string) {
    return this.video.createRoom(applicationId);
  }
}
