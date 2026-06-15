# Production integrations (sjs-back)

Checklist переменных окружения для полного функционала в production.

## Обязательно

| Variable | Назначение |
|----------|------------|
| `DATABASE_URL` | PostgreSQL |
| `JWT_SECRET` | мин. 32 символа |
| `REDIS_HOST` / `REDIS_PORT` | BullMQ (AI, очереди) |
| `S3_*` | загрузка файлов (presign) |

## OpenAI

```env
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_SCHEDULE_MODEL=gpt-4o-mini
```

Без ключа: нет эмбеддингов, matchScore, employer_score, cover letter, resume suggestions, парсинга расписания.

## HeadHunter import

```env
HH_IMPORT_ENABLED=true
HH_SYSTEM_EMPLOYER_USER_ID=<uuid работодателя-витрины>
HH_API_USER_AGENT="SJS-Back/1.0 (you@company.com)"
HH_APP_ACCESS_TOKEN=<access_token из https://dev.hh.ru/admin>
# или HH_APP_CLIENT_ID + HH_APP_CLIENT_SECRET (client_credentials)
```

Поиск вакансий (`GET /vacancies`) требует OAuth-токен приложения. Без него api.hh.ru отвечает `403 {"type":"forbidden"}`. User-Agent alone недостаточен.

Создание system employer и admin:

```bash
BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
BOOTSTRAP_ADMIN_PASSWORD='secure-password' \
BOOTSTRAP_HH_EMPLOYER_EMAIL=hh-import@example.com \
BOOTSTRAP_HH_EMPLOYER_PASSWORD='secure-password' \
BOOTSTRAP_HH_EMPLOYER_COMPANY='SJS HH Import' \
npm run seed:bootstrap
```

Скопируйте выведенный `HH_SYSTEM_EMPLOYER_USER_ID` в `.env`.

Skill-тесты после миграций:

```bash
npm run seed:skill-tests
```

Демо-вакансии (3 работодателя, фильтры, premium, workWindows):

```bash
BOOTSTRAP_DEMO_PASSWORD='secure-password' \
BOOTSTRAP_DEMO_IT_EMAIL=demo-it@example.com \
BOOTSTRAP_DEMO_RETAIL_EMAIL=demo-retail@example.com \
BOOTSTRAP_DEMO_HORECA_EMAIL=demo-horeca@example.com \
npm run seed:jobs
```

Порядок для локальной разработки:

```bash
npm run migration:run
npm run seed:catalog
npm run seed:skill-tests
npm run seed:jobs
npm run seed:bootstrap
```

## Kaspi Pay

```env
KASPI_MERCHANT_ID=
KASPI_API_KEY=
KASPI_PREMIUM_PRICE_KZT=9900
KASPI_RETURN_URL=https://your-frontend/employer/jobs
KASPI_WEBHOOK_SECRET=<random-string>
```

Webhook: `POST /api/payments/kaspi/webhook` с заголовком `X-Kaspi-Webhook-Secret`.

## Daily.co

```env
DAILY_API_KEY=
```

## SMTP / Twilio / Telegram

```env
SMTP_HOST= SMTP_PORT=587 SMTP_USER= SMTP_PASS= SMTP_FROM=

TWILIO_ACCOUNT_SID= TWILIO_AUTH_TOKEN= TWILIO_FROM_NUMBER=

TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=YourBotName
TELEGRAM_WEBHOOK_SECRET=<random-string>
```

Привязка Telegram:

1. `POST /api/telegram/link-token` (JWT) → `deepLink`
2. Пользователь открывает ссылку в Telegram
3. Webhook: `POST /api/telegram/webhook` (настройте через Bot API setWebhook)

## GitHub (публичные профили)

```env
GITHUB_TOKEN=
```
