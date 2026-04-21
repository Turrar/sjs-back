import type { NameI18n } from '../../../common/types/name-i18n.type';

export type JobCategorySeedRow = {
  slug: string;
  nameI18n: NameI18n;
  sortOrder: number;
  /** Slug родительской категории (если есть). */
  parentSlug?: string | null;
};

/**
 * Категории под студентов, стажировки и гибкий график.
 * Сначала в массиве — родители (без parentSlug), затем дочерние (с parentSlug).
 */
export const STUDENT_JOB_CATEGORIES_SEED: JobCategorySeedRow[] = [
  {
    slug: 'student-flex',
    nameI18n: {
      ru: 'Подработка и гибкий график',
      kk: 'Қосымша жұмыс және икемді кесте',
      en: 'Part-time and flexible schedule',
    },
    sortOrder: 0,
  },
  {
    slug: 'internships',
    nameI18n: {
      ru: 'Стажировки',
      kk: 'Тәжірибе',
      en: 'Internships',
    },
    sortOrder: 1,
  },
  {
    slug: 'it-digital',
    nameI18n: {
      ru: 'IT и цифровые профессии',
      kk: 'IT және цифрлық мамандықтар',
      en: 'IT and digital',
    },
    sortOrder: 2,
  },
  {
    slug: 'it-support-junior',
    nameI18n: {
      ru: 'Техподдержка и junior IT',
      kk: 'Техникалық қолдау және junior IT',
      en: 'Tech support and junior IT',
    },
    sortOrder: 3,
    parentSlug: 'it-digital',
  },
  {
    slug: 'office-admin',
    nameI18n: {
      ru: 'Офис, администратор, ресепшн',
      kk: 'Кеңсе, әкімші, ресепшн',
      en: 'Office, admin, reception',
    },
    sortOrder: 4,
  },
  {
    slug: 'retail-cashier',
    nameI18n: {
      ru: 'Розница, касса, продавец',
      kk: 'Бөлшек сауда, касса, сатушы',
      en: 'Retail, cashier, sales',
    },
    sortOrder: 5,
  },
  {
    slug: 'horeca',
    nameI18n: {
      ru: 'Кафе, рестораны, кухня',
      kk: 'Кафе, ресторан, асхана',
      en: 'Cafes, restaurants, kitchen',
    },
    sortOrder: 6,
  },
  {
    slug: 'delivery-courier',
    nameI18n: {
      ru: 'Доставка и курьер',
      kk: 'Жеткізу және курьер',
      en: 'Delivery and courier',
    },
    sortOrder: 7,
  },
  {
    slug: 'warehouse',
    nameI18n: {
      ru: 'Склад, комплектация',
      kk: 'Қойма, жинау',
      en: 'Warehouse, picking',
    },
    sortOrder: 8,
  },
  {
    slug: 'call-center',
    nameI18n: {
      ru: 'Колл-центр, горячая линия',
      kk: 'Колл-орталық, жедел желі',
      en: 'Call center, hotline',
    },
    sortOrder: 9,
  },
  {
    slug: 'events-promo',
    nameI18n: {
      ru: 'Промо, мероприятия, хостес',
      kk: 'Промо, іс-шаралар',
      en: 'Promo, events, host',
    },
    sortOrder: 10,
  },
  {
    slug: 'tutoring-education',
    nameI18n: {
      ru: 'Репетиторство, образование',
      kk: 'Репетиторлық, білім',
      en: 'Tutoring, education',
    },
    sortOrder: 11,
  },
  {
    slug: 'marketing-content',
    nameI18n: {
      ru: 'Маркетинг, SMM, контент',
      kk: 'Маркетинг, SMM, контент',
      en: 'Marketing, SMM, content',
    },
    sortOrder: 12,
  },
  {
    slug: 'finance-junior',
    nameI18n: {
      ru: 'Финансы, банк (junior)',
      kk: 'Қаржы, банк (junior)',
      en: 'Finance, banking (junior)',
    },
    sortOrder: 13,
  },
  {
    slug: 'logistics',
    nameI18n: {
      ru: 'Логистика, диспетчер',
      kk: 'Логистика, диспетчер',
      en: 'Logistics, dispatcher',
    },
    sortOrder: 14,
  },
  {
    slug: 'manufacturing',
    nameI18n: {
      ru: 'Производство, смены',
      kk: 'Өндіріс, ауысымдар',
      en: 'Manufacturing, shifts',
    },
    sortOrder: 15,
  },
  {
    slug: 'remote',
    nameI18n: {
      ru: 'Удалённая работа',
      kk: 'Қашықтан жұмыс',
      en: 'Remote work',
    },
    sortOrder: 16,
  },
  {
    slug: 'hospitality',
    nameI18n: {
      ru: 'Гостиницы, сервис',
      kk: 'Қонақ үйлер, сервис',
      en: 'Hospitality, service',
    },
    sortOrder: 17,
  },
  {
    slug: 'beauty-fitness',
    nameI18n: {
      ru: 'Красота, фитнес',
      kk: 'Сұлулық, фитнес',
      en: 'Beauty, fitness',
    },
    sortOrder: 18,
  },
  {
    slug: 'lab-research',
    nameI18n: {
      ru: 'Лаборатории, исследования (помощник)',
      kk: 'Зертханалар, зерттеу (көмекші)',
      en: 'Labs, research (assistant)',
    },
    sortOrder: 19,
  },
  {
    slug: 'social-ngo',
    nameI18n: {
      ru: 'НКО, социальные проекты',
      kk: 'ҚҚ, әлеуметтік жобалар',
      en: 'NGO, social projects',
    },
    sortOrder: 20,
  },
  {
    slug: 'copywriting',
    nameI18n: {
      ru: 'Копирайтинг, переводы',
      kk: 'Копирайтинг, аударма',
      en: 'Copywriting, translation',
    },
    sortOrder: 21,
  },
];
