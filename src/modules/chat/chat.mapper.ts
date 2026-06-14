import type { MessageEntity } from '../../database/entities';

export type ChatMessageResponse = {
  id: string;
  roomId: string;
  senderId: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
  sender?: { id: string; email: string };
};

export function mapMessage(msg: MessageEntity): ChatMessageResponse {
  return {
    id: msg.id,
    roomId: msg.roomId,
    senderId: msg.senderId,
    body: msg.body,
    readAt: msg.readAt ?? null,
    createdAt: msg.createdAt,
    sender: msg.sender
      ? { id: msg.sender.id, email: msg.sender.email }
      : undefined,
  };
}

export function mapMessages(messages: MessageEntity[]): ChatMessageResponse[] {
  return messages.map(mapMessage);
}
