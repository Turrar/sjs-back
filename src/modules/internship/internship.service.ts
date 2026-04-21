import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  ApplicationEntity,
  InternshipEntity,
  InternshipLogEntryEntity,
  InternshipTaskEntity,
  InternshipStatus,
} from '../../database/entities';
import { PointEventType } from '../../database/entities/user-points.entity';
import { GamificationService } from '../gamification/gamification.service';
import {
  AddLogEntryDto,
  CompleteInternshipDto,
  CreateInternshipDto,
  CreateTaskDto,
  UpdateTaskDto,
} from './dto/internship.dto';

@Injectable()
export class InternshipService {
  constructor(
    @InjectRepository(InternshipEntity)
    private readonly internships: Repository<InternshipEntity>,
    @InjectRepository(InternshipLogEntryEntity)
    private readonly logEntries: Repository<InternshipLogEntryEntity>,
    @InjectRepository(InternshipTaskEntity)
    private readonly tasks: Repository<InternshipTaskEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    private readonly gamification: GamificationService,
  ) {}

  /** Открыть трекер стажировки — только работодатель, только для HIRED-отклика */
  async open(employerUserId: string, dto: CreateInternshipDto): Promise<InternshipEntity> {
    const app = await this.applications.findOne({
      where: { id: dto.applicationId },
      relations: ['job'],
    });
    if (!app) throw new NotFoundException('Application not found');
    if (app.job.employerUserId !== employerUserId) throw new ForbiddenException();
    if (app.status !== ApplicationStatus.HIRED) {
      throw new BadRequestException('Internship can only be opened for HIRED applications');
    }

    const existing = await this.internships.findOne({
      where: { applicationId: dto.applicationId },
    });
    if (existing) return existing;

    const internship = await this.internships.save(
      this.internships.create({
        applicationId: dto.applicationId,
        studentUserId: app.studentUserId,
        employerUserId,
        startedAt: new Date(),
      }),
    );
    return internship;
  }

  async findOne(userId: string, id: string): Promise<InternshipEntity> {
    const i = await this.internships.findOne({
      where: { id },
      relations: ['logEntries', 'tasks'],
    });
    if (!i) throw new NotFoundException();
    if (i.studentUserId !== userId && i.employerUserId !== userId) throw new ForbiddenException();
    return i;
  }

  async myInternships(userId: string, role: UserRole): Promise<InternshipEntity[]> {
    const where =
      role === UserRole.STUDENT
        ? { studentUserId: userId }
        : { employerUserId: userId };
    return this.internships.find({ where, order: { createdAt: 'DESC' } });
  }

  /** Добавить запись в журнал часов (студент) */
  async addLogEntry(
    studentUserId: string,
    internshipId: string,
    dto: AddLogEntryDto,
  ): Promise<InternshipLogEntryEntity> {
    const i = await this.internships.findOne({ where: { id: internshipId, studentUserId } });
    if (!i) throw new NotFoundException();
    if (i.status !== InternshipStatus.ACTIVE) {
      throw new BadRequestException('Internship is not active');
    }
    return this.logEntries.save(
      this.logEntries.create({
        internshipId,
        date: dto.date,
        hours: dto.hours,
        description: dto.description ?? null,
      }),
    );
  }

  /** Суммарные часы по стажировке */
  async totalHours(internshipId: string): Promise<number> {
    const result = await this.logEntries
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.hours), 0)', 'total')
      .where('e.internship_id = :id', { id: internshipId })
      .getRawOne<{ total: string }>();
    return parseFloat(result?.total ?? '0');
  }

  /** Добавить задачу (работодатель) */
  async createTask(
    employerUserId: string,
    internshipId: string,
    dto: CreateTaskDto,
  ): Promise<InternshipTaskEntity> {
    const i = await this.internships.findOne({ where: { id: internshipId, employerUserId } });
    if (!i) throw new NotFoundException();
    return this.tasks.save(
      this.tasks.create({
        internshipId,
        title: dto.title,
        description: dto.description ?? null,
        dueDate: dto.dueDate ?? null,
      }),
    );
  }

  /** Обновить статус задачи (студент или работодатель) */
  async updateTask(
    userId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<InternshipTaskEntity> {
    const task = await this.tasks.findOne({ where: { id: taskId }, relations: ['internship'] });
    if (!task) throw new NotFoundException();
    if (
      task.internship.studentUserId !== userId &&
      task.internship.employerUserId !== userId
    ) {
      throw new ForbiddenException();
    }
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate;
    return this.tasks.save(task);
  }

  /** Завершить стажировку с отзывом (работодатель) */
  async complete(
    employerUserId: string,
    internshipId: string,
    dto: CompleteInternshipDto,
  ): Promise<InternshipEntity> {
    const i = await this.internships.findOne({ where: { id: internshipId, employerUserId } });
    if (!i) throw new NotFoundException();
    if (i.status !== InternshipStatus.ACTIVE) {
      throw new BadRequestException('Internship is not active');
    }
    i.status = InternshipStatus.COMPLETED;
    i.employerFeedback = dto.employerFeedback;
    i.employerRating = dto.employerRating;
    i.endedAt = new Date();
    const saved = await this.internships.save(i);
    this.gamification
      .award(i.studentUserId, PointEventType.FIRST_HIRE)
      .catch(() => null);
    return saved;
  }
}
