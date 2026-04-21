# AiModule: контракты и очереди

Типы TypeScript: [`src/modules/ai/contracts/ai-contracts.ts`](../src/modules/ai/contracts/ai-contracts.ts).  
Имена очередей: [`src/modules/ai/queues/ai-queue.constants.ts`](../src/modules/ai/queues/ai-queue.constants.ts).

## Очереди (BullMQ — подключить позже)

| Константа                    | Назначение                         |
| ---------------------------- | ---------------------------------- |
| `ai-parse-schedule`          | Vision + LLM → JSON занятий → слоты |
| `ai-embeddings`              | Чанки текста → pgvector            |
| `ai-score-application`       | Скоринг отклика 0–100              |
| `ai-resume-generate`         | Свободный текст → структура резюме |
| `ai-ocr-generic`             | Прочий OCR                         |

Продюсер: HTTP-хендлеры или доменные сервисы после коммита транзакции. Консьюмер: отдельный worker-процесс или тот же Nest с `@Processor`.

## Контракты

### Расписание (Vision)

- **Вход job:** `ParseScheduleJobPayload` — `scheduleSourceId`, `storageKey`, `mimeType`.
- **Выход:** `ParseScheduleVisionResult` — массив `lessons` с `dayOfWeek`, `startMinute`, `endMinute`, опционально `label`.
- После успеха: `ScheduleModule` пишет `ScheduleSlot` и ставит `ScheduleParseStatus.READY`.

### Embeddings (pgvector)

- **Вход:** `EmbeddingJobPayload` — `target` (`student_profile` | `job` | `resume_draft`), `entityId`, `textChunks`.
- Воркер обновляет соответствующую таблицу/колонку вектора (миграция с `vector` типом — отдельный шаг).

### Скоринг отклика

- **Вход:** `ScoreApplicationPayload` — идентификаторы отклика, вакансии, студента.
- **Выход:** `ScoreApplicationResult` — `score` 0–100, опционально `rationale` для UI.

## Ошибки и retry

- Временные ошибки API: retry с backoff, idempotency по `scheduleSourceId` / `applicationId`.
- Невалидный JSON от модели: `FAILED`, пользователю — предложение загрузить снова или править вручную.
