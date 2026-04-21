import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ChatRoomEntity } from './chat-room.entity';

@Entity({ name: 'messages' })
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @ManyToOne(() => ChatRoomEntity, (r) => r.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room!: ChatRoomEntity;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId!: string;

  @ManyToOne(() => UserEntity, (u) => u.messagesSent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: UserEntity;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
