/**
 * Регистрация webhook у Telegram (production / ngrok).
 *
 *   TELEGRAM_WEBHOOK_URL=https://xxx.ngrok-free.app/api/telegram/webhook npm run telegram:set-webhook
 */
import 'dotenv/config';
import axios from 'axios';

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const url = process.env.TELEGRAM_WEBHOOK_URL?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}
if (!url) {
  console.error('TELEGRAM_WEBHOOK_URL is required (public HTTPS URL ending with /api/telegram/webhook)');
  process.exit(1);
}

async function main() {
  const body: Record<string, unknown> = { url, allowed_updates: ['message'] };
  if (secret) {
    body.secret_token = secret;
  }
  const res = await axios.post(
    `https://api.telegram.org/bot${token}/setWebhook`,
    body,
  );
  console.log(JSON.stringify(res.data, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
