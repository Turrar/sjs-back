import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post('presign')
  presign(@CurrentUser() user: JwtPayload, @Body() dto: PresignUploadDto) {
    return this.upload.createPresignedPut(
      user.sub,
      dto.filename,
      dto.contentType,
    );
  }
}
