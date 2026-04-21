/** URL-safe slug from human-readable string. */
export function slugify(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
  return s || 'item';
}
