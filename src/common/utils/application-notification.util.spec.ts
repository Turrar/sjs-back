import { ApplicationStatus } from '../enums/application-status.enum';
import {
  formatApplicationUpdateTelegram,
  applicationStatusLabel,
} from './application-notification.util';

describe('application-notification.util', () => {
  describe('formatApplicationUpdateTelegram', () => {
    it('new application to employer', () => {
      const text = formatApplicationUpdateTelegram({
        jobTitle: 'Backend',
        message: 'New application received',
      });
      expect(text).toContain('📬');
      expect(text).toContain('Новый отклик');
      expect(text).toContain('Backend');
    });

    it('reviewing status', () => {
      const text = formatApplicationUpdateTelegram({
        jobTitle: 'Backend',
        status: ApplicationStatus.REVIEWING,
      });
      expect(text).toContain('👀');
      expect(text).toContain('рассматривает');
      expect(text).not.toContain('Новый отклик');
    });

    it('shortlisted status', () => {
      const text = formatApplicationUpdateTelegram({
        jobTitle: 'Backend',
        status: ApplicationStatus.SHORTLISTED,
      });
      expect(text).toContain('⭐');
      expect(text).toContain('списке кандидатов');
    });

    it('interview status', () => {
      const text = formatApplicationUpdateTelegram({
        jobTitle: 'Backend',
        status: ApplicationStatus.INTERVIEW,
      });
      expect(text).toContain('🗓');
      expect(text).toContain('собеседование');
    });

    it('offer status', () => {
      const text = formatApplicationUpdateTelegram({
        jobTitle: 'Backend',
        status: ApplicationStatus.OFFER,
      });
      expect(text).toContain('🎉');
      expect(text).toContain('оффер');
    });

    it('withdrawal to employer', () => {
      const text = formatApplicationUpdateTelegram({
        jobTitle: 'Backend',
        status: ApplicationStatus.WITHDRAWN,
        message: 'Application withdrawn by student',
      });
      expect(text).toContain('↩️');
      expect(text).toContain('отозвал');
      expect(text).not.toContain('Новый отклик');
    });

    it('video room', () => {
      const text = formatApplicationUpdateTelegram({
        jobTitle: 'Backend',
        videoRoom: true,
      });
      expect(text).toContain('🎥');
      expect(text).toContain('Видеособеседование');
    });
  });

  describe('applicationStatusLabel', () => {
    it('maps known status', () => {
      expect(applicationStatusLabel(ApplicationStatus.HIRED)).toBe(
        'Принят на работу',
      );
      expect(applicationStatusLabel(ApplicationStatus.SHORTLISTED)).toBe(
        'В списке кандидатов',
      );
    });
  });
});
