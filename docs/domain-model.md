# Domain model: ER и статусы (SJS)

Реализация в TypeORM: [`src/database/entities/`](../src/database/entities/).

## Роли (`UserRole`)

| Значение   | Назначение                          |
| ---------- | ----------------------------------- |
| `STUDENT`  | Студент; профиль `StudentProfile`     |
| `EMPLOYER` | Работодатель; профиль `EmployerProfile` |
| `ADMIN`    | Администратор платформы             |

Один пользователь — одна роль; профили студента и работодателя взаимоисключающие.

## Сущности и связи

- **User** — email, `passwordHash`, `role`, `isActive`.
- **StudentProfile** 1:1 **User**; **EmployerProfile** 1:1 **User**.
- **Job** N:1 **EmployerProfile** (+ денормализованный `employerUserId` для запросов).
- **Application** N:1 **Job**, N:1 **StudentProfile** / **User** (студент).
- **ScheduleSource** N:1 **StudentProfile** (файл в S3, статус парсинга); **ScheduleSlot** N:1 **StudentProfile**, опционально N:1 **ScheduleSource**.
- **ChatRoom** 1:1 **Application**; **Message** N:1 **ChatRoom**, N:1 **User** (отправитель).
- **Notification** N:1 **User**.
- **ResumeDraft** N:1 **StudentProfile**.

## Статусы вакансии (`JobStatus`)

`DRAFT` → `PUBLISHED` | `PAUSED` → `CLOSED` → `ARCHIVED` (логика переходов в сервисе).

## Статусы отклика (`ApplicationStatus`)

`SUBMITTED`, `REVIEWING`, `SHORTLISTED`, `INTERVIEW`, `OFFER`, `REJECTED`, `WITHDRAWN`.

## Парсинг расписания (`ScheduleParseStatus`)

`PENDING` → `PROCESSING` → `READY` | `FAILED`.

## Верификация работодателя (`EmployerVerificationStatus`)

`PENDING` → `VERIFIED` | `REJECTED`.

## Уведомления (`NotificationKind`)

`APPLICATION_UPDATE`, `CHAT_MESSAGE`, `SCHEDULE_READY`, `SYSTEM`.
