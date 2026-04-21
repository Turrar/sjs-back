import { Injectable } from '@nestjs/common';
import type { JobWorkWindowJson } from '../../database/entities/job.entity';

/** One closed-open interval on a single day, minutes from midnight [0, 1440). */
export type MinuteInterval = { startMinute: number; endMinute: number };

export type WeeklyBusySlot = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

/**
 * Computes whether a student's weekly free time can satisfy all employer work windows.
 * Rules: busy slots are merged per day; free time is complement within [0, 1440).
 * A job window is satisfied if it lies entirely inside one free interval on that day.
 */
@Injectable()
export class ScheduleCompatibilityService {
  isJobCompatible(
    busySlots: WeeklyBusySlot[],
    jobWindows: JobWorkWindowJson[] | null | undefined,
  ): boolean {
    if (!jobWindows?.length) {
      return true;
    }
    const freeByDay = this.freeIntervalsByDay(busySlots);
    return jobWindows.every((w) =>
      this.intervalCoveredByUnion(
        freeByDay.get(w.dayOfWeek) ?? fullDayFree(),
        w.startMinute,
        w.endMinute,
      ),
    );
  }

  /** Merge overlaps, return free intervals per day of week */
  freeIntervalsByDay(
    busySlots: WeeklyBusySlot[],
  ): Map<number, MinuteInterval[]> {
    const byDay = new Map<number, WeeklyBusySlot[]>();
    for (const s of busySlots) {
      const list = byDay.get(s.dayOfWeek) ?? [];
      list.push(s);
      byDay.set(s.dayOfWeek, list);
    }
    const result = new Map<number, MinuteInterval[]>();
    for (const [day, slots] of byDay) {
      const merged = mergeBusy(slots);
      result.set(day, complementDay(merged));
    }
    return result;
  }

  private intervalCoveredByUnion(
    free: MinuteInterval[],
    start: number,
    end: number,
  ): boolean {
    if (start >= end || start < 0 || end > 1440) {
      return false;
    }
    return free.some((f) => f.startMinute <= start && f.endMinute >= end);
  }
}

function fullDayFree(): MinuteInterval[] {
  return [{ startMinute: 0, endMinute: 1440 }];
}

function mergeBusy(slots: WeeklyBusySlot[]): MinuteInterval[] {
  const sorted = [...slots].sort((a, b) => a.startMinute - b.startMinute);
  const out: MinuteInterval[] = [];
  for (const s of sorted) {
    const cur = { startMinute: s.startMinute, endMinute: s.endMinute };
    const last = out[out.length - 1];
    if (!last || cur.startMinute > last.endMinute) {
      out.push(cur);
    } else {
      last.endMinute = Math.max(last.endMinute, cur.endMinute);
    }
  }
  return out;
}

function complementDay(busyMerged: MinuteInterval[]): MinuteInterval[] {
  if (!busyMerged.length) {
    return fullDayFree();
  }
  const free: MinuteInterval[] = [];
  let cursor = 0;
  for (const b of busyMerged) {
    if (cursor < b.startMinute) {
      free.push({ startMinute: cursor, endMinute: b.startMinute });
    }
    cursor = Math.max(cursor, b.endMinute);
  }
  if (cursor < 1440) {
    free.push({ startMinute: cursor, endMinute: 1440 });
  }
  return free;
}
