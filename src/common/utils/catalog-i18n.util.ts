import type { NameI18n } from '../types/name-i18n.type';

/** Если в БД нет name_i18n — подставляем три копии name (обратная совместимость). */
export function normalizeNameI18n<T extends { name: string; nameI18n?: NameI18n | null }>(
  row: T,
): T & { nameI18n: NameI18n } {
  const n = row.nameI18n;
  if (n?.ru && n.kk && n.en) {
    return { ...row, nameI18n: n };
  }
  const fallback: NameI18n = { ru: row.name, kk: row.name, en: row.name };
  return { ...row, nameI18n: fallback };
}
