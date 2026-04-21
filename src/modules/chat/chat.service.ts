import {
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
    return this.messages.find({
      where: { roomId: room.id },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
      take: 200,
    });
  }

  async createMessage(
    senderUserId: string,
    applicationId: string,
    body: string,
  ) {
    const application = await this.assertCanAccessApplication(
      applicationId,
      senderUserId,
    );
    const room = await this.getRoomByApplicationId(applicationId);
    const msg = await this.messages.save(
      this.messages.create({
        roomId: room.id,
        senderId: senderUserId,
        body,
      }),
    );
    const recipientId =
      senderUserId === application.studentUserId
        ? application.job.employerUserId
        : application.studentUserId;
    const preview = body.length > 200 ? `${body.slice(0, 200)}…` : body;
    await this.notifications.create(
      recipientId,
      NotificationKind.CHAT_MESSAGE,
      {
        applicationId,
        messageId: msg.id,
        preview,
      },
    );
    return this.messages.findOne({
      where: { id: msg.id },
      relations: ['sender'],
    });
  }
}
