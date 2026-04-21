import { ScheduleCompatibilityService } from './schedule-compatibility.service';
import type { JobWorkWindowJson } from '../../database/entities/job.entity';

describe('ScheduleCompatibilityService', () => {
  let svc: ScheduleCompatibilityService;

  beforeEach(() => {
    svc = new ScheduleCompatibilityService();
  });

  it('returns true when job has no work windows', () => {
    expect(
      svc.isJobCompatible(
        [{ dayOfWeek: 0, startMinute: 0, endMinute: 600 }],
        [],
      ),
    ).toBe(true);
    expect(
      svc.isJobCompatible(
        [{ dayOfWeek: 0, startMinute: 0, endMinute: 600 }],
        null,
      ),
    ).toBe(true);
  });

  it('accepts job window fully inside a free block', () => {
    const busy = [
      { dayOfWeek: 0, startMinute: 9 * 60, endMinute: 12 * 60 },
      { dayOfWeek: 0, startMinute: 14 * 60, endMinute: 18 * 60 },
    ];
    const windows: JobWorkWindowJson[] = [
      { dayOfWeek: 0, startMinute: 13 * 60, endMinute: 14 * 60 },
    ];
    expect(svc.isJobCompatible(busy, windows)).toBe(true);
  });

  it('rejects job window spanning two free fragments', () => {
    const busy = [
      { dayOfWeek: 0, startMinute: 9 * 60, endMinute: 12 * 60 },
      { dayOfWeek: 0, startMinute: 14 * 60, endMinute: 18 * 60 },
    ];
    const windows: JobWorkWindowJson[] = [
      { dayOfWeek: 0, startMinute: 13 * 60, endMinute: 15 * 60 },
    ];
    expect(svc.isJobCompatible(busy, windows)).toBe(false);
  });

  it('treats a day with no busy slots as fully free', () => {
    const windows: JobWorkWindowJson[] = [
      { dayOfWeek: 3, startMinute: 10 * 60, endMinute: 12 * 60 },
    ];
    expect(svc.isJobCompatible([], windows)).toBe(true);
  });
});
