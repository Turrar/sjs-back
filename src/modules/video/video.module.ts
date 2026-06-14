import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from '../../database/entities/application.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationEntity]),
    NotificationsModule,
  ],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
