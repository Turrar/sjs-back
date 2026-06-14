import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationKind } from '../../common/enums/notification-kind.enum';
import {
  ApplicationEntity,
  ChatRoomEntity,
  MessageEntity,
} from '../../database/entities';
import { NotificationsService } from '../notifications/notifications.service';
import { mapMessage, mapMessages } from './chat.mapper';

const MAX_MESSAGE_LENGTH = 8000;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(ChatRoomEntity)
    private readonly rooms: Repository<ChatRoomEntity>,
    @InjectRepository(MessageEntity)
    private readonly messages: Repository<MessageEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  private validateMessageBody(body: string): string {
    const trimmed = body?.trim();
    if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message body must be 1-${MAX_MESSAGE_LENGTH} characters`,
      );
    }
    return trimmed;
  }

  async assertCanAccessApplication(applicationId: string, userId: string) {
    const app = await this.applications.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });
    if (!app) {
      throw new NotFoundException();
    }
    if (app.studentUserId !== userId && app.job.employerUserId !== userId) {
      throw new ForbiddenException();
    }
    return app;
  }

  async getRoomByApplicationId(applicationId: string) {
    const room = await this.rooms.findOne({ where: { applicationId } });
    if (!room) {
      throw new NotFoundException();
    }
    return room;
  }

  async listMessages(applicationId: string, userId: string) {
    await this.assertCanAccessApplication(applicationId, userId);
    const room = await this.getRoomByApplicationId(applicationId);
    const rows = await this.messages.find({
      where: { roomId: room.id },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
      take: 200,
    });
    return mapMessages(rows);
  }

  async createMessage(
    senderUserId: string,
    applicationId: string,
    body: string,
  ) {
    const text = this.validateMessageBody(body);
    const application = await this.assertCanAccessApplication(
      applicationId,
      senderUserId,
    );
    const room = await this.getRoomByApplicationId(applicationId);
    const msg = await this.messages.save(
      this.messages.create({
        roomId: room.id,
        senderId: senderUserId,
        body: text,
      }),
    );
    const recipientId =
      senderUserId === application.studentUserId
        ? application.job.employerUserId
        : application.studentUserId;
    const preview = text.length > 200 ? `${text.slice(0, 200)}…` : text;
    await this.notifications.create(
      recipientId,
      NotificationKind.CHAT_MESSAGE,
      {
        applicationId,
        messageId: msg.id,
        preview,
      },
    );
    const saved = await this.messages.findOne({
      where: { id: msg.id },
      relations: ['sender'],
    });
    if (!saved) {
      throw new NotFoundException();
    }
    return mapMessage(saved);
  }
}
