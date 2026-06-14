import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationKind } from '../../common/enums/notification-kind.enum';
import {
  ApplicationEntity,
  ChatRoomEntity,
  JobEntity,
  MessageEntity,
} from '../../database/entities';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let notifications: jest.Mocked<Pick<NotificationsService, 'create'>>;
  let applications: jest.Mocked<Pick<Repository<ApplicationEntity>, 'findOne'>>;
  let rooms: jest.Mocked<Pick<Repository<ChatRoomEntity>, 'findOne'>>;
  let messages: jest.Mocked<
    Pick<Repository<MessageEntity>, 'save' | 'findOne' | 'create'>
  >;

  const employerUserId = 'emp-1';
  const studentUserId = 'stu-1';
  const applicationId = 'app-1';
  const jobId = 'job-1';
  const roomId = 'room-1';

  const job = {
    id: jobId,
    employerUserId,
  } as JobEntity;

  const application = {
    id: applicationId,
    studentUserId,
    jobId,
    job,
  } as ApplicationEntity;

  beforeEach(async () => {
    notifications = { create: jest.fn().mockResolvedValue(undefined) };
    applications = {
      findOne: jest.fn().mockResolvedValue(application),
    };
    rooms = {
      findOne: jest.fn().mockResolvedValue({
        id: roomId,
        applicationId,
      }),
    };
    const savedMsg = {
      id: 'msg-1',
      roomId,
      senderId: studentUserId,
      body: 'hi',
    };
    messages = {
      create: jest
        .fn()
        .mockImplementation((x: Partial<MessageEntity>) => x as MessageEntity),
      save: jest.fn().mockResolvedValue(savedMsg),
      findOne: jest.fn().mockResolvedValue({
        ...savedMsg,
        sender: { id: studentUserId, email: 'stu@test.local' },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: NotificationsService, useValue: notifications },
        {
          provide: getRepositoryToken(ApplicationEntity),
          useValue: applications,
        },
        { provide: getRepositoryToken(ChatRoomEntity), useValue: rooms },
        { provide: getRepositoryToken(MessageEntity), useValue: messages },
      ],
    }).compile();

    service = module.get(ChatService);
  });

  it('notifies employer when student sends a message', async () => {
    await service.createMessage(studentUserId, applicationId, 'hello there');

    expect(notifications.create).toHaveBeenCalledWith(
      employerUserId,
      NotificationKind.CHAT_MESSAGE,
      expect.objectContaining({
        applicationId,
        messageId: 'msg-1',
        preview: 'hello there',
      }),
    );
  });

  it('notifies student when employer sends a message', async () => {
    await service.createMessage(employerUserId, applicationId, 'reply');

    expect(notifications.create).toHaveBeenCalledWith(
      studentUserId,
      NotificationKind.CHAT_MESSAGE,
      expect.objectContaining({
        applicationId,
        preview: 'reply',
      }),
    );
  });

  it('truncates long message preview', async () => {
    const long = 'a'.repeat(250);
    await service.createMessage(studentUserId, applicationId, long);

    expect(notifications.create).toHaveBeenCalledWith(
      employerUserId,
      NotificationKind.CHAT_MESSAGE,
      expect.objectContaining({
        preview: `${'a'.repeat(200)}…`,
      }),
    );
  });
});
