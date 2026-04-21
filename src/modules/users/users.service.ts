import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  EmployerProfileEntity,
  StudentProfileEntity,
  UserEntity,
} from '../../database/entities';
import { AiService } from '../ai/ai.service';
import { buildStudentProfileText } from '../ai/embedding-text.util';
import { GamificationService } from '../gamification/gamification.service';
import { PointEventType } from '../../database/entities/user-points.entity';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  private readonly log = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly students: Repository<StudentProfileEntity>,
    @InjectRepository(EmployerProfileEntity)
    private readonly employers: Repository<EmployerProfileEntity>,
    private readonly ai: AiService,
    private readonly gamification: GamificationService,
  ) {}

  async findMe(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['studentProfile', 'employerProfile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.serializeUser(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['studentProfile', 'employerProfile'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === UserRole.STUDENT && user.studentProfile) {
      const p = user.studentProfile;
      if (dto.firstName !== undefined) p.firstName = dto.firstName;
      if (dto.lastName !== undefined) p.lastName = dto.lastName;
      if (dto.phone !== undefined) p.phone = dto.phone;
      if (dto.university !== undefined) p.university = dto.university;
      if (dto.specialty !== undefined) p.specialty = dto.specialty;
      if (dto.bio !== undefined) p.bio = dto.bio;
      if (dto.portfolioUrl !== undefined) p.portfolioUrl = dto.portfolioUrl;
      if (dto.timezone !== undefined) p.timezone = dto.timezone;
      if (dto.avatarStorageKey !== undefined) {
        p.avatarStorageKey = dto.avatarStorageKey;
      }
      const hadGithub = !!p.githubUsername;
      const hadTelegram = !!p.telegramChatId;
      if (dto.githubUsername !== undefined) {
        p.githubUsername = dto.githubUsername;
      }
      if (dto.telegramChatId !== undefined) {
        p.telegramChatId = dto.telegramChatId;
      }
      await this.students.save(p);
      // Очки за связку GitHub / Telegram (только при первом добавлении)
      if (!hadGithub && p.githubUsername) {
        this.gamification.award(userId, PointEventType.GITHUB_LINKED).catch(() => null);
      }
      if (!hadTelegram && p.telegramChatId) {
        this.gamification.award(userId, PointEventType.TELEGRAM_LINKED).catch(() => null);
      }
      // Очки за полностью заполненный профиль
      const profileFull = !!(p.firstName && p.lastName && p.university && p.specialty && p.bio);
      if (profileFull) {
        this.gamification.award(userId, PointEventType.PROFILE_COMPLETED).catch(() => null);
      }
      try {
        await this.ai.enqueueEmbedding({
          target: 'student_profile',
          entityId: p.id,
          textChunks: [buildStudentProfileText(p)],
        });
      } catch (e) {
        this.log.warn(
          `Could not enqueue profile embedding: ${e instanceof Error ? e.message : e}`,
        );
      }
    } else if (user.role === UserRole.EMPLOYER && user.employerProfile) {
      const p = user.employerProfile;
      if (dto.companyName !== undefined) p.companyName = dto.companyName;
      if (dto.companyDescription !== undefined)
        p.description = dto.companyDescription;
      if (dto.website !== undefined) p.website = dto.website;
      if (dto.logoStorageKey !== undefined) {
        p.logoStorageKey = dto.logoStorageKey;
      }
      if (dto.telegramChatId !== undefined) {
        p.telegramChatId = dto.telegramChatId;
      }
      await this.employers.save(p);
    }
    return this.findMe(userId);
  }

  private serializeUser(user: UserEntity) {
    const base = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
    if (user.role === UserRole.STUDENT && user.studentProfile) {
      const p = user.studentProfile;
      return {
        ...base,
        profile: {
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          university: p.university,
          specialty: p.specialty,
          bio: p.bio,
          portfolioUrl: p.portfolioUrl,
          timezone: p.timezone,
          avatarStorageKey: p.avatarStorageKey,
          githubUsername: p.githubUsername,
          telegramChatId: p.telegramChatId ? '***linked***' : null,
        },
      };
    }
    if (user.role === UserRole.EMPLOYER && user.employerProfile) {
      const p = user.employerProfile;
      return {
        ...base,
        profile: {
          companyName: p.companyName,
          description: p.description,
          website: p.website,
          verificationStatus: p.verificationStatus,
          logoStorageKey: p.logoStorageKey,
          telegramChatId: p.telegramChatId ? '***linked***' : null,
        },
      };
    }
    return base;
  }
}
