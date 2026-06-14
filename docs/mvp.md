# MVP: модули и эндпоинты

Актуально на апрель 2026. Полный контракт — Swagger `/api/docs` и файлы `docs/*_API_AND_FEATURES.txt`.

## Модули

| Модуль | Статус | Примечание |
|--------|--------|------------|
| AuthModule | да | register (STUDENT/EMPLOYER), login, refresh, logout; ADMIN только через seed |
| UsersModule | да | GET/PATCH /users/me |
| JobsModule | да | CRUD, фильтры, recommended (STUDENT) |
| ApplicationsModule | да | отклик, список для работодателя, статусы |
| ScheduleModule | да | sources, slots, AI-парсинг (OpenAI) |
| AiModule | да | embeddings, score, cover letter, interview prep (нужен OPENAI_API_KEY) |
| UploadModule | да | presigned URL |
| ChatModule | да | HTTP + WebSocket `/chat` |
| NotificationsModule | да | in-app + email/Telegram/SMS при настройке |
| ResumeModule | да | черновики + AI suggestions |
| AdminModule | да | users, catalog CRUD, skill-tests CRUD, HH import |
| AnalyticsModule | да | platform (ADMIN), employer/me |
| JobAlerts, Profiles, Reviews, Gamification, Internship, SkillTests, Video, Calendar, Payments, HhImport | да | см. role-specific docs |

## Seeds

```bash
npm run migration:run
npm run seed:catalog
npm run seed:skill-tests
npm run seed:bootstrap   # ADMIN + HH system employer (env BOOTSTRAP_*)
```

## Интеграции

См. [INTEGRATIONS.md](./INTEGRATIONS.md).
