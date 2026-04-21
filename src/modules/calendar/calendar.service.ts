import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ScheduleSlotEntity,
  StudentProfileEntity,
} from '../../database/entities';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Формирует iCal-строку (.ics) из недельных слотов расписания студента. */
@Injectable()
export class CalendarService {
  private readonly log = new Logger(CalendarService.name);

  constructor(
    @InjectRepository(ScheduleSlotEntity)
    private readonly slots: Repository<ScheduleSlotEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly profiles: Repository<StudentProfileEntity>,
  ) {}

  /**
   * Возвращает iCal (.ics) строку расписания занятий студента.
   * Каждый слот становится повторяющимся еженедельным событием.
   * Пользователь импортирует файл в Google Calendar / Outlook одним кликом.
   */
  async generateIcal(userId: string): Promise<string> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) return this.emptyCalendar();

    const slots = await this.slots.find({
      where: { studentProfileId: profile.id },
      order: { dayOfWeek: 'ASC', startMinute: 'ASC' },
    });

    if (!slots.length) return this.emptyCalendar();

    // Базовая дата: ближайший понедельник
    const base = this.nextMonday();
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SJS//Student Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Моё расписание (SJS)',
      'X-WR-TIMEZONE:UTC',
    ];

    for (const slot of slots) {
      const startDate = new Date(base);
      startDate.setDate(base.getDate() + slot.dayOfWeek);
      const endDate = new Date(startDate);

      const [sh, sm] = this.minutesToHM(slot.startMinute);
      const [eh, em] = this.minutesToHM(slot.endMinute);

      startDate.setHours(sh, sm, 0, 0);
      endDate.setHours(eh, em, 0, 0);

      const uid = `sjs-${slot.id}@sjs.app`;
      const summary = slot.label ?? `Занятие (${DAY_NAMES[slot.dayOfWeek] ?? slot.dayOfWeek})`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${this.formatDate(startDate)}`,
        `DTEND:${this.formatDate(endDate)}`,
        `RRULE:FREQ=WEEKLY`,
        `SUMMARY:${this.escapeIcal(summary)}`,
        'END:VEVENT',
      );
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  private emptyCalendar(): string {
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SJS//Student Schedule//EN',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  private nextMonday(): Date {
    const d = new Date();
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private minutesToHM(minutes: number): [number, number] {
    return [Math.floor(minutes / 60), minutes % 60];
  }

  private formatDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
      `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
    );
  }

  private escapeIcal(s: string): string {
    return s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  }
}
