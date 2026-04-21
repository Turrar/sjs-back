import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApplicationEntity } from './application.entity';
import { MessageEntity } from './message.entity';

@Entity({ name: 'chat_rooms' })
export class ChatRoomEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'application_id', type: 'uuid', unique: true })
  applicationId!: string;

  @OneToOne(() => ApplicationEntity, (a) => a.chatRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application!: ApplicationEntity;

  @OneToMany(() => MessageEntity, (m) => m.room)
  messages?: MessageEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
