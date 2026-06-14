import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController, MediaController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
