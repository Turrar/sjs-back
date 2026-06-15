import { JobStatus } from '../../../common/enums/job-status.enum';
import { EmployerVerificationStatus } from '../../../common/enums/employer-verification-status.enum';
import type { JobWorkWindowJson } from '../../entities/job.entity';

export type DemoEmployerKey = 'it' | 'retail' | 'horeca';

export type DemoEmployerSeedRow = {
  key: DemoEmployerKey;
  /** Env var name for email (value read in runner). */
  emailEnv: string;
  companyName: string;
  description: string;
  website: string;
  verificationStatus: EmployerVerificationStatus;
};

export type JobSeedRow = {
  seedKey: string;
  employerKey: DemoEmployerKey;
  title: string;
  description: string;
  status: JobStatus;
  citySlug: string;
  location?: string;
  categorySlugs: string[];
  tagSlugs: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  requiredWeeklyHours?: number;
  workWindows?: JobWorkWindowJson[];
  isPremium?: boolean;
  requiresResume?: boolean;
  requiresCoverLetter?: boolean;
};

/** dayOfWeek: 0 = понедельник … 6 = воскресенье */
const weekdayEvenings: JobWorkWindowJson[] = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
  dayOfWeek,
  startMinute: 18 * 60,
  endMinute: 21 * 60,
}));

const friSatEvenings: JobWorkWindowJson[] = [4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  startMinute: 17 * 60,
  endMinute: 22 * 60,
}));

const weekdayMornings: JobWorkWindowJson[] = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
  dayOfWeek,
  startMinute: 7 * 60,
  endMinute: 11 * 60,
}));

export const DEMO_EMPLOYERS_SEED: DemoEmployerSeedRow[] = [
  {
    key: 'it',
    emailEnv: 'BOOTSTRAP_DEMO_IT_EMAIL',
    companyName: 'Kaspi Lab',
    description:
      'IT-продуктовая команда в Алматы: мобильные и веб-сервисы для студентов и молодых специалистов. Стажировки с ментором, code review и реальные задачи в продакшене.',
    website: 'https://demo-kaspi-lab.example.kz',
    verificationStatus: EmployerVerificationStatus.VERIFIED,
  },
  {
    key: 'retail',
    emailEnv: 'BOOTSTRAP_DEMO_RETAIL_EMAIL',
    companyName: 'Magnum Student Jobs',
    description:
      'Сеть гипермаркетов: подработка для студентов на кассе, в зале и на складе. Гибкие смены, обучение на месте, оформление по ТК при долгосрочном сотрудничестве.',
    website: 'https://demo-magnum.example.kz',
    verificationStatus: EmployerVerificationStatus.VERIFIED,
  },
  {
    key: 'horeca',
    emailEnv: 'BOOTSTRAP_DEMO_HORECA_EMAIL',
    companyName: 'Coffee Boom',
    description:
      'Сеть кофеен в Астане: бариста, помощники на кухне и официанты. Подходит для первой работы, вечерних и утренних смен совместимых с учёбой.',
    website: 'https://demo-coffee-boom.example.kz',
    verificationStatus: EmployerVerificationStatus.PENDING,
  },
];

export const JOBS_SEED: JobSeedRow[] = [
  // --- IT (Kaspi Lab) ---
  {
    seedKey: 'junior-frontend-intern',
    employerKey: 'it',
    title: 'Стажёр Frontend (JavaScript / React)',
    description: `Кого ищем
Студент 2–4 курса (IT, математика, прикладная информатика), готовый учиться и писать код на JavaScript.

Задачи
• Верстка экранов по макетам (HTML, CSS, адаптив)
• Мелкие фичи на React под присмотром ментора
• Исправление багов, участие в code review
• Написание unit-тестов на Jest

Требования
• Базовый JavaScript: типы, массивы, async/await, работа с API
• Понимание Git (commit, branch, pull request)
• Желательно: основы React и TypeScript
• Английский — чтение документации

Условия
• Оплачиваемая стажировка, менторство, удалённый формат с созвонами 3 раза в неделю
• После 3 месяцев — возможность part-time оффера

График
Вечерние слоты пн–пт, ~15 часов в неделю, совместимо с парами.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, удалённо',
    categorySlugs: ['internships', 'it-support-junior'],
    tagSlugs: [
      'for-students',
      'paid-internship',
      'remote',
      'it-tech',
      'beginner-friendly',
      'scholarship-compatible',
    ],
    salaryMin: 120_000,
    salaryMax: 180_000,
    currency: 'KZT',
    requiredWeeklyHours: 15,
    workWindows: weekdayEvenings,
    requiresResume: true,
    requiresCoverLetter: true,
  },
  {
    seedKey: 'react-part-time-dev',
    employerKey: 'it',
    title: 'React-разработчик (part-time)',
    description: `Кого ищем
Студент или выпускник с опытом pet-проектов на React, ищущий подработку 20 ч/нед.

Задачи
• Разработка внутренних админ-экранов на React + TypeScript
• Интеграция REST API, формы, таблицы, фильтры
• Рефакторинг legacy-компонентов

Требования
• React 18+, hooks, React Query или аналог
• TypeScript на уровне интерфейсов и generics
• Git, code style, ESLint
• Excel — для сверки выгрузок (базовые формулы приветствуются)

Условия
• Гибрид: 1 день в офисе (Алматы, БЦ у метро), остальное удалённо
• Зарплата по итогам собеседования

График
Гибкий, согласуем с расписанием пар.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, гибрид',
    categorySlugs: ['it-digital'],
    tagSlugs: ['part-time', 'hybrid', 'flex-schedule', 'near-university', 'it-tech'],
    salaryMin: 200_000,
    salaryMax: 350_000,
    currency: 'KZT',
    requiredWeeklyHours: 20,
  },
  {
    seedKey: 'qa-intern',
    employerKey: 'it',
    title: 'Стажёр QA (ручное тестирование)',
    description: `Кого ищем
Внимательный студент без коммерческого опыта, интересующийся качеством ПО.

Задачи
• Ручное тестирование веб и мобильных сценариев
• Составление чек-листов и баг-репортов в Jira
• Регресс перед релизами

Требования
• Аккуратность, базовая грамотность в баг-репортах
• Понимание жизненного цикла задачи в agile
• Будет плюсом: Postman, DevTools

Условия
• Стажировка 2–3 месяца, онлайн-собеседование
• Тестовое задание: 5 тест-кейсов на учебный сайт

График
15–20 ч/нед, в основном вечером.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы',
    categorySlugs: ['internships', 'it-support-junior'],
    tagSlugs: ['for-students', 'beginner-friendly', 'test-task', 'interview-online', 'remote'],
    salaryMin: 100_000,
    salaryMax: 150_000,
    currency: 'KZT',
    requiredWeeklyHours: 18,
  },
  {
    seedKey: 'data-analyst-python',
    employerKey: 'it',
    title: 'Стажёр Data Analyst (Python)',
    description: `Кого ищем
Студент с интересом к аналитике данных и Python для продуктовой команды.

Задачи
• Сбор и очистка данных из PostgreSQL и CSV
• Построение дашбордов (Metabase / Excel)
• A/B-отчёты для product-менеджера
• Ad-hoc выгрузки для маркетинга

Требования
• Python: pandas, основы SQL
• Excel: сводные таблицы, VLOOKUP
• Английский — intermediate для документации
• Статистика на уровне курса — плюс

Условия
• Удалённо, premium-вакансия в ленте
• Ментор из data-team

График
Гибкий, ориентир 20 ч/нед.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, удалённо',
    categorySlugs: ['it-digital', 'internships'],
    tagSlugs: ['remote', 'english', 'it-tech', 'paid-internship', 'for-students'],
    salaryMin: 150_000,
    salaryMax: 220_000,
    currency: 'KZT',
    requiredWeeklyHours: 20,
    isPremium: true,
  },
  {
    seedKey: 'draft-backend-vacancy',
    employerKey: 'it',
    title: 'Backend Node.js (черновик)',
    description: `Черновик вакансии — не публикуется в каталоге.
Планируем стажёра на NestJS + PostgreSQL.`,
    status: JobStatus.DRAFT,
    citySlug: 'almaty',
    categorySlugs: ['it-digital'],
    tagSlugs: ['it-tech'],
  },

  // --- Retail (Magnum) ---
  {
    seedKey: 'cashier-evening-mall',
    employerKey: 'retail',
    title: 'Кассир в ТРЦ (вечерние смены)',
    description: `Кого ищем
Студент от 16 лет для работы на кассе в торговом центре.

Задачи
• Обслуживание покупателей на кассе
• Сканирование товаров, безналичная оплата
• Сдача смены кассиру-наставнику

Требования
• Внимательность, вежливость
• Готовность к вечерним сменам пт–сб
• Медкнижка оформляется за счёт компании

Условия
• Почасовая оплата + премии за смену
• Обучение 2 дня

График
Пятница и суббота 17:00–22:00, ~10 ч/нед.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, ТРЦ Mega',
    categorySlugs: ['retail-cashier'],
    tagSlugs: ['evening-shift', 'mall', '16-plus', 'for-students', 'training-provided'],
    salaryMin: 1_500,
    salaryMax: 2_000,
    currency: 'KZT',
    requiredWeeklyHours: 10,
    workWindows: friSatEvenings,
  },
  {
    seedKey: 'sales-weekend',
    employerKey: 'retail',
    title: 'Продавец-консультант (выходные)',
    description: `Кого ищем
Студент для работы в зале электроники по выходным.

Задачи
• Консультация покупателей
• Выкладка товара, ценники
• Участие в промо-акциях

Требования
• Коммуникабельность
• Базовый русский и казахский
• Опыт не обязателен

Условия
• Официальное оформление при смене >3 месяцев
• Чаевые от клиентов в рамках акций

График
Суббота и воскресенье, 8 ч/день.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, рядом с КБТУ',
    categorySlugs: ['retail-cashier'],
    tagSlugs: ['weekend', 'near-university', 'tips', 'no-experience', 'for-students'],
    salaryMin: 120_000,
    salaryMax: 180_000,
    currency: 'KZT',
    requiredWeeklyHours: 16,
  },
  {
    seedKey: 'warehouse-picker',
    employerKey: 'retail',
    title: 'Комплектовщик на складе',
    description: `Кого ищем
Студент для физической работы на складе интернет-заказов.

Задачи
• Сбор заказов по накладным
• Упаковка, маркировка
• Работа с ТСД

Требования
• Физическая выносливость
• Внимательность к артикулам
• Сменный график

Условия
• Еженедельная выплата на карту
• Спецодежда и обед

График
Смены по 8–10 ч, 2–3 раза в неделю.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, промзона',
    categorySlugs: ['warehouse'],
    tagSlugs: ['physical-work', 'shift-work', 'weekly-pay', '18-plus', 'food-included'],
    salaryMin: 1_800,
    salaryMax: 2_500,
    currency: 'KZT',
    requiredWeeklyHours: 24,
  },
  {
    seedKey: 'premium-sales-lead',
    employerKey: 'retail',
    title: 'Старший продавец (student lead)',
    description: `Кого ищем
Активный студент с опытом в рознице для координации смены из 3–4 человек.

Задачи
• Помощь новичкам на смене
• Контроль выкладки и кассовой дисциплины
• Отчёт смены менеджеру

Требования
• Опыт в retail от 3 месяцев
• Лидерские качества
• Готовность к быстрому выходу на работу

Условия
• Повышенная ставка, premium в выдаче
• Карьерный рост до assistant manager

График
Гибкий, обсуждаем на собеседовании.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы',
    categorySlugs: ['retail-cashier'],
    tagSlugs: ['fast-hiring', 'for-students', 'official-employment', 'career-start'],
    salaryMin: 250_000,
    salaryMax: 320_000,
    currency: 'KZT',
    isPremium: true,
  },

  // --- HoReCa (Coffee Boom) ---
  {
    seedKey: 'barista-part-time',
    employerKey: 'horeca',
    title: 'Бариста (part-time)',
    description: `Кого ищем
Студент для утренних смен в кофейне у кампуса.

Задачи
• Приготовление эспрессо, капучино, альтернативы
• Обслуживание гостей, касса
• Чистота рабочей зоны

Требования
• Желание учиться (обучение латте-арт)
• Аккуратность, стрессоустойчивость в час пик
• Опыт не обязателен

Условия
• Чаевые, бесплатный кофе на смене
• Униформа

График
Пн–пт 07:00–11:00, ~20 ч/нед.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'astana',
    location: 'Астана, ул. Кабанбай батыра',
    categorySlugs: ['horeca'],
    tagSlugs: ['coffee-tea', 'part-time', 'morning-shift', 'tips', 'training-provided', 'for-students'],
    salaryMin: 130_000,
    salaryMax: 170_000,
    currency: 'KZT',
    requiredWeeklyHours: 20,
    workWindows: weekdayMornings,
  },
  {
    seedKey: 'kitchen-helper',
    employerKey: 'horeca',
    title: 'Помощник на кухне',
    description: `Кого ищем
Студент от 16 лет для поддержки кухни fast-casual формата.

Задачи
• Подготовка ингредиентов, мытьё посуды
• Сборка простых позиций по чек-листу
• Соблюдение санитарных норм

Требования
• Медкнижка (поможем оформить)
• Физическая выносливость
• Без опыта — обучим

Условия
• Питание на смене
• Стабильный график на семестр

График
Смены 6–8 ч, 3–4 дня в неделю.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'astana',
    location: 'Астана',
    categorySlugs: ['horeca'],
    tagSlugs: ['food-included', '16-plus', 'training-provided', 'fast-food', 'no-experience'],
    salaryMin: 110_000,
    salaryMax: 140_000,
    currency: 'KZT',
    requiredWeeklyHours: 22,
  },
  {
    seedKey: 'waiter-evening',
    employerKey: 'horeca',
    title: 'Официант (вечерние смены)',
    description: `Кого ищем
Студент с хорошим русским и базовым казахским для вечерней смены в ресторане.

Задачи
• Приём заказов, подача блюд
• Работа с POS-системой
• Рекомендации по меню

Требования
• Грамотная речь, вежливость
• Английский — приветствие гостей
• Казахский — базовые фразы

Условия
• Чаевые 100% официанту
• Форма предоставляется

График
Чт–вс 18:00–23:00.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'astana',
    location: 'Астана, центр',
    categorySlugs: ['horeca'],
    tagSlugs: ['evening-shift', 'english', 'kazakh-lang', 'tips', 'weekend'],
    salaryMin: 140_000,
    salaryMax: 200_000,
    currency: 'KZT',
    requiredWeeklyHours: 18,
  },
  {
    seedKey: 'seasonal-host-paused',
    employerKey: 'horeca',
    title: 'Хостес на мероприятие (сезон)',
    description: `Сезонная позиция — вакансия на паузе, не отображается в публичном каталоге.
План: промо-мероприятия летом.`,
    status: JobStatus.PAUSED,
    citySlug: 'astana',
    categorySlugs: ['events-promo'],
    tagSlugs: ['seasonal', 'short-term'],
  },
];

export function seedExternalId(seedKey: string): string {
  return `seed:${seedKey}`;
}
