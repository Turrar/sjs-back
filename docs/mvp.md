# MVP: модули и эндпоинты первого релиза

Цель первого релиза: студент может зарегистрироваться, заполнить профиль, загрузить расписание (фото), увидеть вакансии с фильтром по совместимости графика, откликнуться и переписываться в чате. Работодатель — создать компанию, опубликовать вакансию с окнами работы, просматривать отклики.

## Модули в MVP

| Модуль            | В MVP | Примечание                                      |
| ----------------- | ----- | ----------------------------------------------- |
| AuthModule        | да    | register, login, refresh, JWT                   |
| UsersModule       | да    | CRUD профиля студента / работодателя            |
| JobsModule        | да    | CRUD вакансий, список с фильтром по графику     |
| ApplicationsModule | да | создать отклик, смена статуса (работодатель)    |
| ScheduleModule    | да    | загрузка → очередь парсинга → слоты, ручная правка |
| AiModule          | частично | Vision JSON + embeddings очередь; без полного скоринга |
| UploadModule      | да    | presigned URL, сохранение ключа                 |
| ChatModule        | да    | комната на отклик, WebSocket + история          |
| NotificationsModule | базово | in-app + заглушка email                         |
| ResumeModule      | нет   | второй релиз                                    |
| AdminModule       | нет   | минимум: только тех. админ через SQL/скрипт      |
| AnalyticsModule   | нет   | второй релиз                                    |

## Эндпоинты (черновик контракта)

### Auth

- `POST /auth/register` — роль + credentials + базовые поля профиля.
- `POST /auth/login` — access + refresh токены.
- `POST /auth/refresh` — обновление access.
- `POST /auth/logout` — инвалидация refresh (если храните в БД).

### Users

- `GET/PATCH /users/me` — текущий пользователь и профиль.
- `GET /users/me/profile` — студент или работодатель (расширенно).

### Jobs

- `GET /jobs` — публичный список (`PUBLISHED`), query: поиск, локация, **совместимость с текущим расписанием** (флаг).
- `POST /jobs` — работодатель; `GET/PATCH/DELETE /jobs/:id`.

### Applications

- `POST /jobs/:id/applications` — студент.
- `GET /employer/applications` или `/jobs/:id/applications` — работодатель.
- `PATCH /applications/:id/status` — работодатель.

### Schedule

- `POST /schedule/sources` — создать запись + получить URL загрузки.
- `GET /schedule/slots` — слоты студента (занятость).
- `PATCH /schedule/slots/:id` — правка после AI.

### Upload

- `POST /upload/presign` — ключ и URL для клиента.

### Chat

- WebSocket namespace `/chat` — join по `roomId` / токену.
- `GET /chat/rooms/:applicationId/messages` — история.

### Notifications

- `GET /notifications` — список; `PATCH /notifications/:id/read`.

Текущая заготовка в коде: `GET /<module>/health` на каждом модуле для проверки сборки.
