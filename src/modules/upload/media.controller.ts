import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { assertStorageKeyOwned } from '../../common/utils/storage-key.util';
import { UploadService } from './upload.service';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly upload: UploadService) {}

  /**
   * Presigned GET URL для файла пользователя (avatar, logo и т.д.).
   * GET /api/media/url?storageKey=uploads/{userId}/...
   */
  @Get('url')
  getUrl(
    @CurrentUser() user: JwtPayload,
    @Query('storageKey') storageKey?: string,
  ) {
    const key = storageKey?.trim();
    if (!key) {
      throw new BadRequestException('storageKey query parameter is required');
    }
    assertStorageKeyOwned(user.sub, key);
    return this.upload.createPresignedGet(key);
  }
}
