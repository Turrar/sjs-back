import { randomBytes } from 'crypto';

/** Telegram start param: A-Z a-z 0-9 _ - only, max 64 chars. */
const CODE_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

export function generateTelegramLinkCode(length = 32): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return code;
}

export function extractStartCodeFromDeepLink(deepLink: string): string | null {
  try {
    const url = new URL(deepLink);
    const start = url.searchParams.get('start');
    return start?.trim() || null;
  } catch {
    return null;
  }
}
