import { ApplicationStatus } from '../enums/application-status.enum';

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.SUBMITTED]: 'Отправлен',
  [ApplicationStatus.REVIEWING]: 'На рассмотрении',
  [ApplicationStatus.SHORTLISTED]: 'В списке кандидатов',
  [ApplicationStatus.INTERVIEW]: 'Собеседование',
  [ApplicationStatus.OFFER]: 'Оффер',
  [ApplicationStatus.HIRED]: 'Принят на работу',
  [ApplicationStatus.REJECTED]: 'Отклонён',
  [ApplicationStatus.WITHDRAWN]: 'Отозван',
};

/** Telegram: отдельный текст и иконка для каждого статуса (уведомление студенту). */
const STUDENT_STATUS_TELEGRAM: Record<
  ApplicationStatus,
  (jobTitle: string) => string
> = {
  [ApplicationStatus.SUBMITTED]: (job) =>
    `📤 Отклик на <b>${job}</b> отправлен`,
  [ApplicationStatus.REVIEWING]: (job) =>
    `👀 Работодатель рассматривает ваш отклик на <b>${job}</b>`,
  [ApplicationStatus.SHORTLISTED]: (job) =>
    `⭐ Вы в списке кандидатов на вакансию <b>${job}</b>`,
  [ApplicationStatus.INTERVIEW]: (job) =>
    `🗓 Вас пригласили на собеседование по вакансии <b>${job}</b>`,
  [ApplicationStatus.OFFER]: (job) =>
    `🎉 Вам сделали оффер по вакансии <b>${job}</b>!`,
  [ApplicationStatus.HIRED]: (job) =>
    `✅ Поздравляем! Вы приняты на вакансию <b>${job}</b>`,
  [ApplicationStatus.REJECTED]: (job) =>
    `😔 К сожалению, отклик на <b>${job}</b> не прошёл отбор`,
  [ApplicationStatus.WITHDRAWN]: (job) =>
    `↩️ Отклик на <b>${job}</b> отозван`,
};

const STUDENT_STATUS_EMAIL: Record<
  ApplicationStatus,
  (jobTitle: string) => { subject: string; html: string }
> = {
  [ApplicationStatus.SUBMITTED]: (job) => ({
    subject: `Отклик на «${job}» отправлен`,
    html: `<h2>Отклик отправлен</h2><p>Ваш отклик на вакансию <b>${job}</b> успешно отправлен.</p>`,
  }),
  [ApplicationStatus.REVIEWING]: (job) => ({
    subject: `Отклик на «${job}» на рассмотрении`,
    html: `<h2>На рассмотрении</h2><p>Работодатель начал рассматривать ваш отклик на <b>${job}</b>.</p>`,
  }),
  [ApplicationStatus.SHORTLISTED]: (job) => ({
    subject: `Вы в списке кандидатов — «${job}»`,
    html: `<h2>В списке кандидатов</h2><p>Вы попали в shortlist по вакансии <b>${job}</b>. Ждите следующих шагов.</p>`,
  }),
  [ApplicationStatus.INTERVIEW]: (job) => ({
    subject: `Приглашение на собеседование — «${job}»`,
    html: `<h2>Собеседование</h2><p>Вас пригласили на собеседование по вакансии <b>${job}</b>. Откройте приложение для деталей.</p>`,
  }),
  [ApplicationStatus.OFFER]: (job) => ({
    subject: `Оффер по вакансии «${job}»`,
    html: `<h2>Оффер</h2><p>Вам сделали предложение по вакансии <b>${job}</b>. Откройте приложение, чтобы ответить.</p>`,
  }),
  [ApplicationStatus.HIRED]: (job) => ({
    subject: `Вы приняты на «${job}»`,
    html: `<h2>Поздравляем!</h2><p>Вы приняты на вакансию <b>${job}</b>.</p>`,
  }),
  [ApplicationStatus.REJECTED]: (job) => ({
    subject: `Отклик на «${job}» отклонён`,
    html: `<h2>Отклик отклонён</h2><p>К сожалению, ваш отклик на <b>${job}</b> не прошёл отбор. Не сдавайтесь — попробуйте другие вакансии.</p>`,
  }),
  [ApplicationStatus.WITHDRAWN]: (job) => ({
    subject: `Отклик на «${job}» отозван`,
    html: `<h2>Отклик отозван</h2><p>Ваш отклик на вакансию <b>${job}</b> отозван.</p>`,
  }),
};

const STUDENT_STATUS_SMS: Record<ApplicationStatus, (jobTitle: string) => string> = {
  [ApplicationStatus.SUBMITTED]: (job) =>
    `SJS: Отклик на «${job}» отправлен.`,
  [ApplicationStatus.REVIEWING]: (job) =>
    `SJS: Работодатель рассматривает отклик на «${job}».`,
  [ApplicationStatus.SHORTLISTED]: (job) =>
    `SJS: Вы в списке кандидатов на «${job}».`,
  [ApplicationStatus.INTERVIEW]: (job) =>
    `SJS: Приглашение на собеседование — «${job}».`,
  [ApplicationStatus.OFFER]: (job) =>
    `SJS: Оффер по вакансии «${job}»! Откройте приложение.`,
  [ApplicationStatus.HIRED]: (job) =>
    `SJS: Поздравляем! Вы приняты на «${job}».`,
  [ApplicationStatus.REJECTED]: (job) =>
    `SJS: Отклик на «${job}» не прошёл отбор.`,
  [ApplicationStatus.WITHDRAWN]: (job) =>
    `SJS: Отклик на «${job}» отозван.`,
};

function isApplicationStatus(status: unknown): status is ApplicationStatus {
  return (
    typeof status === 'string' &&
    Object.values(ApplicationStatus).includes(status as ApplicationStatus)
  );
}

export function applicationStatusLabel(status: unknown): string {
  if (isApplicationStatus(status)) {
    return APPLICATION_STATUS_LABELS[status];
  }
  return typeof status === 'string' ? status : '';
}

export function formatApplicationUpdateTelegram(
  payload: Record<string, unknown>,
): string {
  const jobTitle = String(payload['jobTitle'] ?? 'вакансию');

  if (payload['videoRoom'] === true) {
    return (
      `🎥 Видеособеседование по <b>${jobTitle}</b>\n` +
      `Работодатель создал комнату — присоединяйтесь в приложении.`
    );
  }

  if (payload['message'] === 'New application received') {
    return (
      `📬 Новый отклик на вакансию <b>${jobTitle}</b>\n` +
      `Посмотрите профиль кандидата в приложении.`
    );
  }

  if (payload['message'] === 'Application withdrawn by student') {
    return (
      `↩️ Кандидат отозвал отклик на вакансию <b>${jobTitle}</b>\n` +
      `Отклик больше не активен.`
    );
  }

  const status = payload['status'];
  if (isApplicationStatus(status)) {
    return STUDENT_STATUS_TELEGRAM[status](jobTitle);
  }

  return `🔔 Обновление по отклику на вакансию <b>${jobTitle}</b>`;
}

export function formatApplicationUpdateEmail(payload: Record<string, unknown>): {
  subject: string;
  html: string;
} {
  const jobTitle = String(payload['jobTitle'] ?? '');

  if (payload['videoRoom'] === true) {
    return {
      subject: `Видеособеседование — «${jobTitle}»`,
      html: `
        <h2>Видеособеседование</h2>
        <p>Работодатель создал видеокомнату для собеседования по вакансии <b>${jobTitle}</b>.</p>
        <p>Откройте приложение, чтобы присоединиться.</p>
      `,
    };
  }

  if (payload['message'] === 'New application received') {
    return {
      subject: `Новый отклик на «${jobTitle}»`,
      html: `
        <h2>Новый отклик</h2>
        <p>Студент откликнулся на вашу вакансию <b>${jobTitle}</b>.</p>
        <p>Откройте приложение, чтобы посмотреть профиль кандидата.</p>
      `,
    };
  }

  if (payload['message'] === 'Application withdrawn by student') {
    return {
      subject: `Кандидат отозвал отклик — «${jobTitle}»`,
      html: `
        <h2>Отклик отозван</h2>
        <p>Кандидат отозвал отклик на вакансию <b>${jobTitle}</b>.</p>
      `,
    };
  }

  const status = payload['status'];
  if (isApplicationStatus(status)) {
    return STUDENT_STATUS_EMAIL[status](jobTitle);
  }

  return {
    subject: `Обновление по отклику — «${jobTitle}»`,
    html: `
      <h2>Обновление отклика</h2>
      <p>Есть обновление по вашему отклику на вакансию <b>${jobTitle}</b>.</p>
    `,
  };
}

export function formatApplicationUpdateSms(
  payload: Record<string, unknown>,
): string {
  const jobTitle = String(payload['jobTitle'] ?? '');

  if (payload['videoRoom'] === true) {
    return `SJS: Видеособеседование по «${jobTitle}». Присоединяйтесь в приложении.`;
  }

  if (payload['message'] === 'New application received') {
    return `SJS: Новый отклик на «${jobTitle}». Откройте приложение.`;
  }

  if (payload['message'] === 'Application withdrawn by student') {
    return `SJS: Кандидат отозвал отклик на «${jobTitle}».`;
  }

  const status = payload['status'];
  if (isApplicationStatus(status)) {
    return STUDENT_STATUS_SMS[status](jobTitle);
  }

  return `SJS: Обновление по отклику на «${jobTitle}». Откройте приложение.`;
}
