import { JobStatus } from '../../../common/enums/job-status.enum';
import { EmployerVerificationStatus } from '../../../common/enums/employer-verification-status.enum';
import type { JobWorkWindowJson } from '../../entities/job.entity';

export type DemoEmployerKey = 'it' | 'retail' | 'horeca' | 'agency' | 'edu';

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

const weekdayAfternoon: JobWorkWindowJson[] = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
  dayOfWeek,
  startMinute: 13 * 60,
  endMinute: 17 * 60,
}));

// ─────────────────────────────────────────────────────────────────
//  DEMO EMPLOYERS
//  Логин/пароль для фронта и демо:
//  ─ Kaspi Lab:         BOOTSTRAP_DEMO_IT_EMAIL     / BOOTSTRAP_DEMO_PASSWORD
//  ─ Magnum Student:    BOOTSTRAP_DEMO_RETAIL_EMAIL / BOOTSTRAP_DEMO_PASSWORD
//  ─ Coffee Boom:       BOOTSTRAP_DEMO_HORECA_EMAIL / BOOTSTRAP_DEMO_PASSWORD
//  ─ DigitalPulse:      BOOTSTRAP_DEMO_AGENCY_EMAIL / BOOTSTRAP_DEMO_PASSWORD
//  ─ BrightPath Edu:    BOOTSTRAP_DEMO_EDU_EMAIL    / BOOTSTRAP_DEMO_PASSWORD
// ─────────────────────────────────────────────────────────────────
export const DEMO_EMPLOYERS_SEED: DemoEmployerSeedRow[] = [
  {
    key: 'it',
    emailEnv: 'BOOTSTRAP_DEMO_IT_EMAIL',
    companyName: 'Kaspi Lab',
    description:
      'IT-продуктовая команда в Алматы: мобильные и веб-сервисы для студентов и молодых специалистов. Стажировки с ментором, code review и реальные задачи в продакшене с первого дня.',
    website: 'https://demo-kaspi-lab.example.kz',
    verificationStatus: EmployerVerificationStatus.VERIFIED,
  },
  {
    key: 'retail',
    emailEnv: 'BOOTSTRAP_DEMO_RETAIL_EMAIL',
    companyName: 'Magnum Student Jobs',
    description:
      'Крупнейшая сеть гипермаркетов Казахстана открывает гибкие позиции для студентов: касса, торговый зал, склад интернет-заказов. Официальное оформление, еженедельная оплата, обучение на месте.',
    website: 'https://demo-magnum.example.kz',
    verificationStatus: EmployerVerificationStatus.VERIFIED,
  },
  {
    key: 'horeca',
    emailEnv: 'BOOTSTRAP_DEMO_HORECA_EMAIL',
    companyName: 'Coffee Boom',
    description:
      'Сеть авторских кофеен в Астане и Алматы: бариста, официанты и помощники на кухне. Утренние и вечерние смены, совместимые с парами. Обучение латте-арту с нуля.',
    website: 'https://demo-coffee-boom.example.kz',
    verificationStatus: EmployerVerificationStatus.PENDING,
  },
  {
    key: 'agency',
    emailEnv: 'BOOTSTRAP_DEMO_AGENCY_EMAIL',
    companyName: 'DigitalPulse Agency',
    description:
      'Диджитал-агентство полного цикла: SMM, таргетинг, контент, ивент-маркетинг для казахстанских брендов. Берём студентов-стажёров с портфолио (даже из личных аккаунтов). Офис в центре Алматы, гибкий старт.',
    website: 'https://demo-digitalpulse.example.kz',
    verificationStatus: EmployerVerificationStatus.VERIFIED,
  },
  {
    key: 'edu',
    emailEnv: 'BOOTSTRAP_DEMO_EDU_EMAIL',
    companyName: 'BrightPath Education',
    description:
      'Сеть частных учебных центров в Алматы и Астане: подготовка к ЕНТ, школьная программа, курсы английского. Нанимаем студентов-репетиторов и администраторов с гибким расписанием под сессию.',
    website: 'https://demo-brightpath.example.kz',
    verificationStatus: EmployerVerificationStatus.VERIFIED,
  },
];

export const JOBS_SEED: JobSeedRow[] = [
  // ═══════════════════════════════════════════════════════════════
  //  Kaspi Lab — IT / digital
  // ═══════════════════════════════════════════════════════════════
  {
    seedKey: 'junior-frontend-intern',
    employerKey: 'it',
    title: 'Стажёр Frontend (JavaScript / React)',
    description: `Кого ищем
Студент 2–4 курса (IT, математика, прикладная информатика), готовый учиться и писать код на JavaScript. Языком общения внутри команды является русский, задачи ставятся в Jira.

Задачи
• Верстка экранов по макетам Figma (HTML, CSS, адаптив)
• Разработка небольших React-компонентов под присмотром ментора
• Исправление UI-багов, участие в code review
• Написание unit-тестов (Jest + Testing Library)

Требования
• Базовый JavaScript: типы данных, массивы, fetch/async-await, работа с REST API
• Понимание Git: commit, branch, pull request, конфликты
• Желательно: основы React (hooks, props, state) и TypeScript
• Английский — уровень чтения документации

Условия
• Оплачиваемая стажировка; после 3 месяцев — возможность part-time оффера
• Ментор из продуктовой команды, еженедельное 1:1
• Полностью удалённый формат, созвоны 3 раза в неделю

График
Вечерние слоты пн–пт 18:00–21:00, ~15 часов в неделю — совместимо с парами.`,
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
    title: 'React-разработчик (part-time, 20 ч/нед)',
    description: `Кого ищем
Студент или выпускник с опытом pet-проектов на React, ищущий стабильную подработку 20 часов в неделю в продуктовой компании.

Задачи
• Разработка внутренних CRM-экранов на React + TypeScript
• Интеграция REST API, формы, таблицы, фильтры
• Рефакторинг legacy-компонентов (class → functional, миграция на React Query)
• Участие в ревью PR команды

Требования
• React 18+, функциональные компоненты, hooks
• TypeScript: интерфейсы, generics, тип-guards
• React Query или SWR — базовый уровень
• Git, ESLint, Prettier
• Excel — приветствуется (сверка выгрузок)

Условия
• Гибрид: 1 день в офисе (Алматы, 5 мин от м. Абай), остальные дни — удалённо
• Зарплата обсуждается по итогам тестового задания
• Возможность перехода в full-time после выпуска

График
Гибкий, согласуем под расписание пар; ориентир — 20 ч/нед.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, гибрид (м. Абай)',
    categorySlugs: ['it-digital'],
    tagSlugs: ['part-time', 'hybrid', 'flex-schedule', 'near-university', 'it-tech', 'test-task'],
    salaryMin: 200_000,
    salaryMax: 350_000,
    currency: 'KZT',
    requiredWeeklyHours: 20,
    requiresResume: true,
  },
  {
    seedKey: 'qa-intern',
    employerKey: 'it',
    title: 'Стажёр QA (ручное тестирование)',
    description: `Кого ищем
Внимательный студент без коммерческого опыта, которому интересно обеспечение качества ПО. Опыт программирования — не обязателен, важны чёткость и критическое мышление.

Задачи
• Ручное тестирование веб и мобильных (iOS/Android) сценариев по чек-листу
• Составление подробных баг-репортов в Jira (шаги воспроизведения, приоритет, скриншоты)
• Участие в регрессионном тестировании перед релизами
• Помощь в ведении тест-плана спринта

Требования
• Аккуратность и внимание к деталям
• Понимание базового agile-процесса (Sprint, Backlog, Definition of Done)
• Будет плюсом: Postman, Chrome DevTools, Jira/Confluence
• Английский — чтение документации

Что даём
• Тестовое задание: описать 5 тест-кейсов на учебный сайт
• Стажировка 2–3 месяца с ментором из QA-команды
• Онлайн-собеседование, удалённый формат

График
15–20 ч/нед, преимущественно вечером.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, удалённо',
    categorySlugs: ['internships', 'it-support-junior'],
    tagSlugs: [
      'for-students',
      'beginner-friendly',
      'test-task',
      'interview-online',
      'remote',
      'paid-internship',
    ],
    salaryMin: 100_000,
    salaryMax: 150_000,
    currency: 'KZT',
    requiredWeeklyHours: 18,
    workWindows: weekdayEvenings,
  },
  {
    seedKey: 'data-analyst-python',
    employerKey: 'it',
    title: 'Стажёр Data Analyst (Python)',
    description: `Кого ищем
Студент с интересом к аналитике данных и базовым Python. Будете работать напрямую с продуктовой командой и помогать принимать решения на основе данных.

Задачи
• Сбор и очистка данных из PostgreSQL, внутренних CSV-выгрузок и BI-инструментов
• Построение оперативных дашбордов в Metabase и Excel
• Подготовка A/B-отчётов для product-менеджера
• Ad-hoc аналитика для маркетинга и поддержки

Требования
• Python: pandas, numpy — базовый уровень
• SQL: SELECT, GROUP BY, JOIN — уверенно
• Excel: сводные таблицы, ВПР / XLOOKUP
• Английский — upper-intermediate для документации
• Курс статистики или вероятности — будет плюсом

Условия
• Полностью удалённо, premium-вакансия в ленте платформы
• Ментор из data-команды, задачи на реальных данных
• Возможность дипломной работы на материалах стажировки

График
Гибкий, ориентир 20 ч/нед.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, удалённо',
    categorySlugs: ['it-digital', 'internships'],
    tagSlugs: [
      'remote',
      'english',
      'it-tech',
      'paid-internship',
      'for-students',
      'scholarship-compatible',
      'laptop-provided',
    ],
    salaryMin: 150_000,
    salaryMax: 220_000,
    currency: 'KZT',
    requiredWeeklyHours: 20,
    isPremium: true,
    requiresResume: true,
  },
  {
    seedKey: 'flutter-mobile-intern',
    employerKey: 'it',
    title: 'Стажёр Mobile Developer (Flutter / Dart)',
    description: `Кого ищем
Студент 3–4 курса специальности «мобильная разработка» или «программная инженерия», желающий получить реальный опыт в кросс-платформенном мобильном продакшене.

Задачи
• Разработка новых экранов и виджетов в существующем Flutter-приложении (iOS + Android)
• Интеграция API через Dio, state management на Riverpod
• Написание виджет-тестов
• Code review с senior-разработчиком

Требования
• Dart — уверенный синтаксис
• Flutter: StatelessWidget, StatefulWidget, Navigator 2.0
• Знакомство с Riverpod или Provider
• Git, базовая работа с Xcode / Android Studio
• Желательно: опубликованное приложение в App Store / Play Market (pet-project)

Условия
• Ноутбук / MacBook предоставляем на период стажировки
• Оплачиваемая, 3 месяца + возможность продления
• Офис Алматы (рядом с МУИТ) — 2 дня в неделю, остальное удалённо

График
Гибкий, 15–20 ч/нед; созвоны утром пн и ср.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, гибрид (рядом с МУИТ)',
    categorySlugs: ['internships', 'it-digital'],
    tagSlugs: [
      'for-students',
      'paid-internship',
      'hybrid',
      'it-tech',
      'laptop-provided',
      'near-university',
      'portfolio',
    ],
    salaryMin: 130_000,
    salaryMax: 200_000,
    currency: 'KZT',
    requiredWeeklyHours: 18,
    requiresResume: true,
    requiresCoverLetter: true,
  },
  {
    seedKey: 'draft-backend-vacancy',
    employerKey: 'it',
    title: 'Backend Node.js — черновик',
    description: `Черновик вакансии — не публикуется в каталоге.
Планируем стажёра на NestJS + PostgreSQL; согласуем требования с тимлидом.`,
    status: JobStatus.DRAFT,
    citySlug: 'almaty',
    categorySlugs: ['it-digital'],
    tagSlugs: ['it-tech'],
  },

  // ═══════════════════════════════════════════════════════════════
  //  Magnum Student Jobs — ритейл
  // ═══════════════════════════════════════════════════════════════
  {
    seedKey: 'cashier-evening-mall',
    employerKey: 'retail',
    title: 'Кассир в гипермаркете (вечерние смены, ТРЦ Mega)',
    description: `Кого ищем
Студент от 16 лет для работы на кассовой линии в торговом центре. Идеально для первой официальной работы — обучим всему с нуля.

Задачи
• Обслуживание покупателей на кассе самообслуживания и традиционной
• Сканирование товаров, безналичная и наличная оплата
• Сдача Z-отчёта кассиру-наставнику по окончании смены

Требования
• Внимательность, вежливость, стрессоустойчивость в час пик
• Готовность к вечерним сменам пт–сб
• Медицинская книжка — оформим за счёт компании за 3 дня

Условия
• Почасовая ставка + премия за смену
• Обучение 2 дня (оплачивается)
• Официальное оформление при смене от 3 месяцев

График
Пятница и суббота 17:00–22:00 (~10 ч/нед).`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, ТРЦ Mega Alma-Ata',
    categorySlugs: ['retail-cashier'],
    tagSlugs: [
      'evening-shift',
      'mall',
      '16-plus',
      'for-students',
      'training-provided',
      'first-job',
      'card-pay',
    ],
    salaryMin: 1_500,
    salaryMax: 2_000,
    currency: 'KZT',
    requiredWeeklyHours: 10,
    workWindows: friSatEvenings,
  },
  {
    seedKey: 'sales-weekend',
    employerKey: 'retail',
    title: 'Продавец-консультант электроники (выходные)',
    description: `Кого ищем
Студент для работы в отделе потребительской электроники по выходным дням. Опыт в продажах — плюс, но не обязателен: проведём вводный тренинг.

Задачи
• Консультация покупателей по ассортименту (смартфоны, ноутбуки, аксессуары)
• Выкладка товара и обновление ценников по промо-планам
• Участие в акциях и кросс-продажах

Требования
• Коммуникабельность, умение слушать и объяснять
• Базовый русский и казахский (разговорный уровень)
• Уверенное использование смартфона / гаджетов
• Опыт работы — не обязателен

Условия
• Официальное оформление при смене от 3 месяцев
• Скидка на покупки в магазине для сотрудников

График
Суббота и воскресенье, 09:00–17:00 (8 ч/день, ~16 ч/нед).`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, рядом с КБТУ',
    categorySlugs: ['retail-cashier'],
    tagSlugs: [
      'weekend',
      'near-university',
      'no-experience',
      'for-students',
      'training-provided',
      'official-employment',
      'sales',
    ],
    salaryMin: 120_000,
    salaryMax: 180_000,
    currency: 'KZT',
    requiredWeeklyHours: 16,
  },
  {
    seedKey: 'warehouse-picker',
    employerKey: 'retail',
    title: 'Комплектовщик склада интернет-заказов',
    description: `Кого ищем
Студент для физической работы на складе: сборка онлайн-заказов в системе WMS по штрих-кодам. Сменный график — удобно совмещать с учёбой по будням.

Задачи
• Сбор заказов по электронным накладным с помощью ТСД (терминал сбора данных)
• Упаковка в фирменную тару, маркировка и взвешивание
• Работа в зоне отгрузки: сортировка по курьерам

Требования
• Физическая выносливость (ходьба 8–10 км за смену, подъём до 15 кг)
• Внимательность к артикулам и количеству
• Готовность к сменному графику

Условия
• Еженедельная выплата на карту
• Горячее питание и спецодежда от компании
• Премия за выполнение нормы сборки

График
Смены 08:00–18:00 или 14:00–22:00, 2–3 раза в неделю.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, склад (промзона Алатау)',
    categorySlugs: ['warehouse'],
    tagSlugs: [
      'physical-work',
      'shift-work',
      'weekly-pay',
      '18-plus',
      'food-included',
      'industrial-zone',
    ],
    salaryMin: 1_800,
    salaryMax: 2_500,
    currency: 'KZT',
    requiredWeeklyHours: 24,
  },
  {
    seedKey: 'premium-sales-lead',
    employerKey: 'retail',
    title: 'Старший продавец — student team lead',
    description: `Кого ищем
Активный студент с опытом в рознице от 3 месяцев для координации студенческой смены из 3–4 человек. Подходит тем, кто умеет не только работать сам, но и организовывать других.

Задачи
• Постановка задач и помощь новым сотрудникам на смене
• Контроль выкладки ассортимента и кассовой дисциплины
• Итоговый отчёт менеджеру магазина по смене
• Решение нестандартных ситуаций с покупателями

Требования
• Опыт в retail или customer service от 3 месяцев
• Лидерские качества, уверенность в общении
• Готовность к быстрому выходу (в течение недели)

Условия
• Повышенная ставка относительно линейных продавцов
• Приоритет в карьерном росте до assistant manager
• Premium-размещение в ленте платформы

График
Гибкий, обсуждается на собеседовании; ориентир — 20 ч/нед.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы',
    categorySlugs: ['retail-cashier'],
    tagSlugs: [
      'fast-hiring',
      'for-students',
      'official-employment',
      'career-start',
      'customer-service',
      'teamwork',
    ],
    salaryMin: 250_000,
    salaryMax: 320_000,
    currency: 'KZT',
    isPremium: true,
  },

  // ═══════════════════════════════════════════════════════════════
  //  Coffee Boom — HoReCa
  // ═══════════════════════════════════════════════════════════════
  {
    seedKey: 'barista-part-time',
    employerKey: 'horeca',
    title: 'Бариста (утренние смены, part-time)',
    description: `Кого ищем
Студент для утренних смен в кофейне у кампуса НУ. Опыт не нужен — обучаем латте-арту с нуля за первую неделю работы.

Задачи
• Приготовление эспрессо, капучино, раф и альтернативных напитков
• Обслуживание гостей, работа с POS-кассой
• Поддержание чистоты рабочей зоны и оборудования

Требования
• Желание учиться и делать вкусный кофе
• Аккуратность и стрессоустойчивость в час пик (07:30–09:00)
• Опыт работы не обязателен

Условия
• Чаевые 100% достаются бариста
• Бесплатный кофе на смене (до 3 напитков)
• Фирменная форма

График
Пн–пт 07:00–11:00, ~20 ч/нед.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'astana',
    location: 'Астана, ул. Кабанбай батыра (у НУ)',
    categorySlugs: ['horeca'],
    tagSlugs: [
      'coffee-tea',
      'part-time',
      'morning-shift',
      'tips',
      'training-provided',
      'for-students',
      'near-university',
      'no-experience',
    ],
    salaryMin: 130_000,
    salaryMax: 170_000,
    currency: 'KZT',
    requiredWeeklyHours: 20,
    workWindows: weekdayMornings,
  },
  {
    seedKey: 'kitchen-helper',
    employerKey: 'horeca',
    title: 'Помощник повара / кухонный работник',
    description: `Кого ищем
Студент от 16 лет для поддержки кухни в формате fast-casual. Физическая нагрузка средняя, обучаем всему.

Задачи
• Подготовка ингредиентов: нарезка, порционирование по чек-листу
• Мытьё посуды и инвентаря, соблюдение санитарных норм
• Сборка простых позиций (боулы, сэндвичи) по рецептурным картам
• Помощь повару в час пик

Требования
• Санитарная медкнижка (поможем оформить за 2 дня)
• Физическая выносливость (стоячая работа 6–8 ч)
• Без опыта — обучим в первые 3 дня

Условия
• Горячее питание на смене
• Стабильный график на учебный семестр
• Официальное оформление при работе от 2 месяцев

График
Смены 6–8 ч, 3–4 дня в неделю (утро или обед).`,
    status: JobStatus.PUBLISHED,
    citySlug: 'astana',
    location: 'Астана',
    categorySlugs: ['horeca'],
    tagSlugs: [
      'food-included',
      '16-plus',
      'training-provided',
      'fast-food',
      'no-experience',
      'shift-work',
      'for-students',
    ],
    salaryMin: 110_000,
    salaryMax: 140_000,
    currency: 'KZT',
    requiredWeeklyHours: 22,
  },
  {
    seedKey: 'waiter-evening',
    employerKey: 'horeca',
    title: 'Официант (вечерние смены, чт–вс)',
    description: `Кого ищем
Студент с грамотной речью и базовым казахским для вечерней смены в ресторане авторской кухни. Подходит как для первой работы, так и для тех, кто уже работал в обслуживании.

Задачи
• Приём и подача заказов, работа с POS-системой (iiko)
• Рекомендации блюд и напитков, увеличение среднего чека
• Соблюдение стандартов сервиса (HACCP, тайминг подачи)

Требования
• Грамотный русский язык (разговорный и письменный)
• Казахский — базовые фразы приветствия и благодарности
• Английский — приветствие и базовые фразы для иностранных гостей
• Опыт официанта — приветствуется, не обязателен

Условия
• Чаевые 100% официанту (в среднем 15 000–30 000 тг за смену в пиковые дни)
• Форма предоставляется, чистка — за счёт заведения
• Бесплатный ужин на смене

График
Чт–вс 18:00–23:00 (~18 ч/нед).`,
    status: JobStatus.PUBLISHED,
    citySlug: 'astana',
    location: 'Астана, центр города',
    categorySlugs: ['horeca'],
    tagSlugs: [
      'evening-shift',
      'english',
      'kazakh-lang',
      'tips',
      'weekend',
      'city-center',
      'food-included',
      'customer-service',
    ],
    salaryMin: 140_000,
    salaryMax: 200_000,
    currency: 'KZT',
    requiredWeeklyHours: 18,
    workWindows: friSatEvenings,
  },
  {
    seedKey: 'seasonal-host-paused',
    employerKey: 'horeca',
    title: 'Хостес на летний промо-сезон',
    description: `Сезонная позиция — вакансия временно на паузе; планируем набор к маю.
Промо-мероприятия на открытых площадках Астаны: фуд-маркеты, корпоративы, городские праздники.`,
    status: JobStatus.PAUSED,
    citySlug: 'astana',
    categorySlugs: ['events-promo'],
    tagSlugs: ['seasonal', 'short-term', 'outdoor'],
  },

  // ═══════════════════════════════════════════════════════════════
  //  DigitalPulse Agency — маркетинг, SMM, контент, ивенты
  // ═══════════════════════════════════════════════════════════════
  {
    seedKey: 'smm-intern',
    employerKey: 'agency',
    title: 'Стажёр SMM-специалист (Instagram / TikTok)',
    description: `Кого ищем
Студент с творческим взглядом и пониманием того, как работают алгоритмы Instagram и TikTok. Если ведёшь личный блог или аккаунт для учебного проекта — это уже портфолио.

Задачи
• Разработка контент-плана на месяц для 2–3 клиентских аккаунтов
• Написание текстов (посты, сторис, reels-сценарии) на русском и казахском
• Базовая обработка фото/видео (Canva, CapCut или Figma)
• Анализ метрик ER, охватов, подписок в еженедельном отчёте
• Общение с клиентом под присмотром SM-менеджера

Требования
• Понимание алгоритмов Instagram и TikTok 2024/2025
• Грамотный русский, базовый казахский для текстов
• Насмотренность: пример любимых брендов в KZ и мире
• Canva / Figma / CapCut — хотя бы базовый уровень
• Портфолио приветствуется (даже личный аккаунт)

Условия
• Стажировка 2 месяца с перспективой перейти на позицию Junior SMM
• Офис в центре Алматы (12 мин пешком от м. Алатау), гибкий старт
• Обучение внутри агентства: клиентские брифы, OKR-отчёты

График
20 ч/нед; гибко, часть задач можно выполнять вечером из дома.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, центр (м. Алатау)',
    categorySlugs: ['marketing-content', 'internships'],
    tagSlugs: [
      'creative',
      'hybrid',
      'for-students',
      'paid-internship',
      'kazakh-lang',
      'portfolio',
      'career-start',
      'city-center',
    ],
    salaryMin: 80_000,
    salaryMax: 130_000,
    currency: 'KZT',
    requiredWeeklyHours: 20,
    requiresResume: true,
    requiresCoverLetter: true,
  },
  {
    seedKey: 'content-copywriter',
    employerKey: 'agency',
    title: 'Копирайтер / контент-редактор (part-time)',
    description: `Кого ищем
Студент-гуманитарий (журналистика, PR, реклама, филология) или технарь с лёгким пером для производства текстов для казахстанских FMCG и eCommerce брендов.

Задачи
• Написание постов, статей в блог, email-рассылок (русский / казахский)
• Редактирование брифов и текстов клиентских менеджеров
• SEO-оптимизация статей по ключевым словам (обучим)
• Взаимодействие с дизайнером для финального оформления публикаций

Требования
• Грамотный русский — обязательно; казахский (литературный) — очень желательно
• Умение писать ёмко и без воды
• Понимание структуры лендингов, CTA, заголовков
• Опыт ведения блога или студенческой газеты — преимущество
• ChatGPT/Gemini как помощник — ок, но текст должен звучать по-человечески

Условия
• Удалённо, сдельная оплата за 1000 знаков + ставка за проект
• Гибкий дедлайн (обсуждаем не менее чем за 2 дня)

График
10–15 ч/нед, полностью удалённо.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, удалённо',
    categorySlugs: ['copywriting', 'marketing-content'],
    tagSlugs: [
      'remote',
      'part-time',
      'flex-schedule',
      'kazakh-lang',
      'creative',
      'for-students',
      'solo-work',
      'scholarship-compatible',
    ],
    salaryMin: 60_000,
    salaryMax: 120_000,
    currency: 'KZT',
    requiredWeeklyHours: 12,
  },
  {
    seedKey: 'event-assistant',
    employerKey: 'agency',
    title: 'Помощник координатора мероприятий',
    description: `Кого ищем
Энергичный студент для поддержки event-команды агентства: корпоративы, городские фестивали, промо-активации в торговых центрах. Подходит тем, кто не боится общаться и умеет держать несколько задач одновременно.

Задачи
• Помощь в подготовке площадки: навигация, координация подрядчиков
• Регистрация участников на мероприятии (стойка, QR-сканер)
• Коммуникация с фотографами, кейтерингом, арт-командой на объекте
• Заполнение отчёта по мероприятию (excel-форма, фотоотчёт)

Требования
• Мобильность, стрессоустойчивость в динамичной обстановке
• Грамотный русский и казахский
• Смартфон с быстрым интернетом, возможность работать в выходные
• Опыт волонтёрства на мероприятиях — большой плюс

Условия
• Оплата за каждое мероприятие (разовая или месячная подработка)
• Участие в топовых городских событиях
• Возможность портфолио с реальными кейсами агентства

График
События в основном по выходным и праздникам; заранее оговариваем календарь на месяц.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы (объекты по городу)',
    categorySlugs: ['events-promo'],
    tagSlugs: [
      'weekend',
      'outdoor',
      'short-term',
      'for-students',
      'kazakh-lang',
      'teamwork',
      'fast-hiring',
      'portfolio',
    ],
    salaryMin: 15_000,
    salaryMax: 25_000,
    currency: 'KZT',
    requiredWeeklyHours: 8,
  },
  {
    seedKey: 'graphic-designer-draft',
    employerKey: 'agency',
    title: 'Стажёр-дизайнер (Figma / Canva) — черновик',
    description: `Черновик. Ищем стажёра для создания визуалов под соцсети и баннеры.
Требования уточняются с арт-директором.`,
    status: JobStatus.DRAFT,
    citySlug: 'almaty',
    categorySlugs: ['marketing-content'],
    tagSlugs: ['creative', 'hybrid'],
  },

  // ═══════════════════════════════════════════════════════════════
  //  BrightPath Education — репетиторство, образование, администрация
  // ═══════════════════════════════════════════════════════════════
  {
    seedKey: 'math-tutor-student',
    employerKey: 'edu',
    title: 'Репетитор математики / физики (наставник-студент)',
    description: `Кого ищем
Студент технического вуза (математика, физика, IT, инженерия) для подготовки школьников 9–11 классов к ЕНТ / НКТХ и текущей программе. Работаем по расписанию учебного центра.

Задачи
• Индивидуальные занятия или мини-группы (2–3 человека) по математике и/или физике
• Диагностика пробелов и составление плана занятий
• Ведение дневника прогресса ученика для родителей
• Участие в пробных ЕНТ-тестах (1 раз в месяц)

Требования
• Знание школьной программы 10–11 класс (алгебра, геометрия, начала анализа, механика)
• Умение объяснять понятно: терпение и педагогические навыки
• Средний балл в вузе от 3.5 / GPA 3.0
• Опыт репетиторства — преимущество, но не обязателен

Условия
• Почасовая ставка + бонус за рост среднего балла ученика
• Готовые методические материалы (ЕНТ-тренажёры, сборники задач)
• Гибкое расписание под пары — заявляешь слоты сам каждую неделю

График
Обычно 2–4 урока в неделю (40–60 мин каждый); дневные и вечерние слоты.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, учебный центр BrightPath (м. Байконур)',
    categorySlugs: ['tutoring-education'],
    tagSlugs: [
      'for-students',
      'flex-schedule',
      'part-time',
      'scholarship-compatible',
      'near-university',
      'exam-period-off',
      'long-term',
      'official-employment',
    ],
    salaryMin: 2_000,
    salaryMax: 3_500,
    currency: 'KZT',
    requiredWeeklyHours: 8,
    workWindows: weekdayAfternoon,
    requiresResume: true,
  },
  {
    seedKey: 'english-tutor-online',
    employerKey: 'edu',
    title: 'Репетитор английского языка (онлайн, уровень B2+)',
    description: `Кого ищем
Студент с уровнем английского B2 и выше (сертификат IELTS, TOEFL или уверенные навыки без сертификата) для онлайн-занятий со школьниками и взрослыми учениками.

Задачи
• Занятия 1:1 по Zoom / Google Meet: разговорная практика, грамматика, подготовка к IELTS
• Подготовка материалов занятия (10–15 мин до урока)
• Фидбек ученику и родителям после серии уроков
• Ведение прогресс-трекера в общей таблице центра

Требования
• Английский B2–C1: разговорный, письменный, понимание на слух
• Умение структурировать урок (даже без педагогического диплома — обучим)
• Стабильный интернет и ноутбук/ПК с камерой
• IELTS 7.0+ / TOEFL 100+ или подтверждённый C1 — будет большим плюсом

Условия
• Полностью удалённо — из любой точки Казахстана
• Гибкое расписание: самостоятельно заполняешь доступные слоты в CRM
• Оплата за урок; бонус за отзывы и продление курса учеником

График
От 4 до 12 уроков в неделю по 60 мин; старт с 1–2 учениками.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Удалённо (онлайн)',
    categorySlugs: ['tutoring-education', 'remote'],
    tagSlugs: [
      'remote',
      'english',
      'flex-schedule',
      'part-time',
      'for-students',
      'scholarship-compatible',
      'solo-work',
      'long-term',
    ],
    salaryMin: 2_500,
    salaryMax: 4_000,
    currency: 'KZT',
    requiredWeeklyHours: 8,
  },
  {
    seedKey: 'call-center-operator',
    employerKey: 'edu',
    title: 'Оператор колл-центра (исходящие звонки, вечер)',
    description: `Кого ищем
Студент с грамотной речью для обзвона потенциальных и текущих клиентов учебного центра. Работа по скрипту, но не роботизированная — нужно слушать и реагировать.

Задачи
• Исходящие звонки родителям школьников и взрослым ученикам по базе центра
• Рассказ о программах, акциях и расписании; ответы на типовые вопросы по скрипту
• Запись на пробный урок / консультацию в CRM-системе
• Ежедневный отчёт (звонки, конверсии, причины отказа)

Требования
• Грамотный русский язык обязательно; казахский — плюс
• Уверенный, приятный голос без акцента
• Стрессоустойчивость: работа с возражениями
• Опыт в продажах или колл-центре — преимущество, не обязателен

Условия
• Фиксированная ставка + бонус за каждую запись на пробный урок
• Официальное оформление при работе от 2 месяцев
• Обучение по скрипту 1 день (оплачивается)

График
Пн–пт 18:00–21:00, ~15 ч/нед.`,
    status: JobStatus.PUBLISHED,
    citySlug: 'almaty',
    location: 'Алматы, офис BrightPath (м. Байконур) / возможна удалёнка после испытательного',
    categorySlugs: ['call-center', 'office-admin'],
    tagSlugs: [
      'evening-shift',
      'for-students',
      'official-employment',
      'scholarship-compatible',
      'customer-service',
      'training-provided',
      'kazakh-lang',
      'russian-lang',
    ],
    salaryMin: 100_000,
    salaryMax: 160_000,
    currency: 'KZT',
    requiredWeeklyHours: 15,
    workWindows: weekdayEvenings,
  },
];

export function seedExternalId(seedKey: string): string {
  return `seed:${seedKey}`;
}
