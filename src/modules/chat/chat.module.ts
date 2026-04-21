import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApplicationEntity,
  ChatRoomEntity,
  MessageEntity,
} from '../../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationEntity,
      ChatRoomEntity,
      MessageEntity,
    ]),
    NotificationsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
