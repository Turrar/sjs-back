import type { NameI18n } from '../../../common/types/name-i18n.type';

export type CitySeedRow = {
  slug: string;
  nameI18n: NameI18n;
  sortOrder: number;
};

/** Крупные и часто встречаемые города Казахстана (ру / қаз / en). */
export const KZ_CITIES_SEED: CitySeedRow[] = [
  { slug: 'astana', nameI18n: { ru: 'Астана', kk: 'Астана', en: 'Astana' }, sortOrder: 0 },
  { slug: 'almaty', nameI18n: { ru: 'Алматы', kk: 'Алматы', en: 'Almaty' }, sortOrder: 1 },
  { slug: 'shymkent', nameI18n: { ru: 'Шымкент', kk: 'Шымкент', en: 'Shymkent' }, sortOrder: 2 },
  { slug: 'karaganda', nameI18n: { ru: 'Караганда', kk: 'Қарағанды', en: 'Karaganda' }, sortOrder: 3 },
  { slug: 'aktobe', nameI18n: { ru: 'Актобе', kk: 'Ақтөбе', en: 'Aktobe' }, sortOrder: 4 },
  { slug: 'taraz', nameI18n: { ru: 'Тараз', kk: 'Тараз', en: 'Taraz' }, sortOrder: 5 },
  { slug: 'pavlodar', nameI18n: { ru: 'Павлодар', kk: 'Павлодар', en: 'Pavlodar' }, sortOrder: 6 },
  { slug: 'oskemen', nameI18n: { ru: 'Өскемен', kk: 'Өскемен', en: 'Oskemen' }, sortOrder: 7 },
  { slug: 'semey', nameI18n: { ru: 'Семей', kk: 'Семей', en: 'Semey' }, sortOrder: 8 },
  { slug: 'kostanay', nameI18n: { ru: 'Костанай', kk: 'Қостанай', en: 'Kostanay' }, sortOrder: 9 },
  { slug: 'kyzylorda', nameI18n: { ru: 'Кызылорда', kk: 'Қызылорда', en: 'Kyzylorda' }, sortOrder: 10 },
  { slug: 'petropavl', nameI18n: { ru: 'Петропавловск', kk: 'Петропавл', en: 'Petropavl' }, sortOrder: 11 },
  { slug: 'atyrau', nameI18n: { ru: 'Атырау', kk: 'Атырау', en: 'Atyrau' }, sortOrder: 12 },
  { slug: 'turkestan', nameI18n: { ru: 'Туркестан', kk: 'Түркістан', en: 'Turkestan' }, sortOrder: 13 },
  { slug: 'oral', nameI18n: { ru: 'Уральск', kk: 'Орал', en: 'Oral' }, sortOrder: 14 },
  { slug: 'temirtau', nameI18n: { ru: 'Темиртау', kk: 'Теміртау', en: 'Temirtau' }, sortOrder: 15 },
  { slug: 'aktau', nameI18n: { ru: 'Актау', kk: 'Ақтау', en: 'Aktau' }, sortOrder: 16 },
  { slug: 'zhezkazgan', nameI18n: { ru: 'Жезказган', kk: 'Жезқазған', en: 'Zhezkazgan' }, sortOrder: 17 },
  { slug: 'taldykorgan', nameI18n: { ru: 'Талдыкорган', kk: 'Талдықорған', en: 'Taldykorgan' }, sortOrder: 18 },
  { slug: 'qonaev', nameI18n: { ru: 'Конаев', kk: 'Қонаев', en: 'Konaev' }, sortOrder: 19 },
  { slug: 'ekibastuz', nameI18n: { ru: 'Экибастуз', kk: 'Екібастұз', en: 'Ekibastuz' }, sortOrder: 20 },
  { slug: 'rudny', nameI18n: { ru: 'Рудный', kk: 'Рудный', en: 'Rudny' }, sortOrder: 21 },
  { slug: 'kokshetau', nameI18n: { ru: 'Кокшетау', kk: 'Көкшетау', en: 'Kokshetau' }, sortOrder: 22 },
  { slug: 'stepnogorsk', nameI18n: { ru: 'Степногорск', kk: 'Степногорск', en: 'Stepnogorsk' }, sortOrder: 23 },
  { slug: 'balkhash', nameI18n: { ru: 'Балхаш', kk: 'Балқаш', en: 'Balkhash' }, sortOrder: 24 },
  { slug: 'satpayev', nameI18n: { ru: 'Сатпаев', kk: 'Сәтбаев', en: 'Satpayev' }, sortOrder: 25 },
  { slug: 'kaskelen', nameI18n: { ru: 'Каскелен', kk: 'Қаскелең', en: 'Kaskelen' }, sortOrder: 26 },
  { slug: 'kapshagay', nameI18n: { ru: 'Капшагай', kk: 'Қапшағай', en: 'Kapshagay' }, sortOrder: 27 },
  { slug: 'ridder', nameI18n: { ru: 'Риддер', kk: 'Риддер', en: 'Ridder' }, sortOrder: 28 },
  { slug: 'kyzylzhar', nameI18n: { ru: 'Кызылжар', kk: 'Қызылжар', en: 'Kyzylzhar' }, sortOrder: 29 },
];
