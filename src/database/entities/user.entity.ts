import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApplicationEntity } from './application.entity';
import { EmployerProfileEntity } from './employer-profile.entity';
import { MessageEntity } from './message.entity';
import { NotificationEntity } from './notification.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { StudentProfileEntity } from './student-profile.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToOne(() => StudentProfileEntity, (p) => p.user, { nullable: true })
  studentProfile?: StudentProfileEntity | null;

  @OneToOne(() => EmployerProfileEntity, (p) => p.user, { nullable: true })
  employerProfile?: EmployerProfileEntity | null;

  @OneToMany(() => ApplicationEntity, (a) => a.student)
  applications?: ApplicationEntity[];

  @OneToMany(() => MessageEntity, (m) => m.sender)
  messagesSent?: MessageEntity[];

  @OneToMany(() => NotificationEntity, (n) => n.user)
  notifications?: NotificationEntity[];

  @OneToMany(() => RefreshTokenEntity, (r) => r.user)
  refreshTokens?: RefreshTokenEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
