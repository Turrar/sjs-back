import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import type { WeeklyBusySlot } from './schedule-compatibility.service';
import {
  ScheduleSlotEntity,
  ScheduleSourceEntity,
  StudentProfileEntity,
} from '../../database/entities';
import { AiService } from '../ai/ai.service';
import { CreateScheduleSourceDto } from './dto/create-schedule-source.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';

@Injectable()
export class ScheduleService {
  private readonly log = new Logger(ScheduleService.name);

  constructor(
    @InjectRepository(ScheduleSourceEntity)
    private readonly sources: Repository<ScheduleSourceEntity>,
    @InjectRepository(ScheduleSlotEntity)
    private readonly slots: Repository<ScheduleSlotEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly students: Repository<StudentProfileEntity>,
    @Inject(forwardRef(() => AiService))
    private readonly ai: AiService,
  ) {}

  private async getStudentProfileOrThrow(userId: string) {
    const profile = await this.students.findOne({ where: { userId } });
    if (!profile) {
      throw new ForbiddenException('Student profile required');
    }
    return profile;
  }

  async createSource(
    userId: string,
    role: UserRole,
    dto: CreateScheduleSourceDto,
  ) {
    if (role !== UserRole.STUDENT) {
      throw new ForbiddenException();
    }
    const profile = await this.getStudentProfileOrThrow(userId);
    const source = await this.sources.save(
      this.sources.create({
        studentProfileId: profile.id,
        storageKey: dto.storageKey,
        mimeType: dto.mimeType,
      }),
    );
    this.log.log(
      `ScheduleSource created id=${source.id} studentProfileId=${profile.id}`,
    );
    await this.ai.enqueueParseSchedule({
      scheduleSourceId: source.id,
      storageKey: dto.storageKey,
      mimeType: dto.mimeType,
    });
    return source;
  }

  async listSources(userId: string, role: UserRole) {
    if (role !== UserRole.STUDENT) {
      throw new ForbiddenException();
    }
    const profile = await this.getStudentProfileOrThrow(userId);
    return this.sources.find({
      where: { studentProfileId: profile.id },
      order: { createdAt: 'DESC' },
    });
  }

  async listSlots(userId: string, role: UserRole) {
    if (role !== UserRole.STUDENT) {
      throw new ForbiddenException();
    }
    const profile = await this.getStudentProfileOrThrow(userId);
    return this.slots.find({
      where: { studentProfileId: profile.id },
      order: { dayOfWeek: 'ASC', startMinute: 'ASC' },
    });
  }

  async getBusySlotsForStudentUser(userId: string): Promise<WeeklyBusySlot[]> {
    const profile = await this.students.findOne({ where: { userId } });
    if (!profile) {
      return [];
    }
    const rows = await this.slots.find({
      where: { studentProfileId: profile.id },
    });
    return rows.map((r) => ({
      dayOfWeek: r.dayOfWeek,
      startMinute: r.startMinute,
      endMinute: r.endMinute,
    }));
  }

  async updateSlot(
    userId: string,
    role: UserRole,
    slotId: string,
    dto: UpdateScheduleSlotDto,
  ) {
    if (role !== UserRole.STUDENT) {
      throw new ForbiddenException();
    }
    const profile = await this.getStudentProfileOrThrow(userId);
    const slot = await this.slots.findOne({
      where: { id: slotId, studentProfileId: profile.id },
    });
    if (!slot) {
      throw new NotFoundException();
    }
    if (dto.dayOfWeek !== undefined) slot.dayOfWeek = dto.dayOfWeek;
    if (dto.startMinute !== undefined) slot.startMinute = dto.startMinute;
    if (dto.endMinute !== undefined) slot.endMinute = dto.endMinute;
    if (dto.label !== undefined) slot.label = dto.label;
    return this.slots.save(slot);
  }
}
