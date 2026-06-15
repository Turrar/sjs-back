import { generateTelegramLinkCode, extractStartCodeFromDeepLink } from './telegram-link-code.util';

describe('telegram-link-code.util', () => {
  it('generateTelegramLinkCode fits Telegram start limit', () => {
    const code = generateTelegramLinkCode();
    expect(code.length).toBe(32);
    expect(code.length).toBeLessThanOrEqual(64);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('extractStartCodeFromDeepLink parses start param', () => {
    const code = 'Ab12_xY';
    const deepLink = `https://t.me/MyBot?start=${code}`;
    expect(extractStartCodeFromDeepLink(deepLink)).toBe(code);
  });
});
