# EduDepartUrTISI

Монорепозиторий для фронтенда и NestJS-бэкенда.

## Запуск из корня

- `npm run dev` — запускает фронтенд из `frontend`
- `npm run dev:api` — запускает NestJS из `backend`

## Где хранить NestJS-код

- `backend/src/modules/<domain>` — модули по предметным областям
- `backend/src/modules/<domain>/<domain>.module.ts` — модуль
- `backend/src/modules/<domain>/<domain>.service.ts` — бизнес-логика
- `backend/src/modules/<domain>/<domain>.controller.ts` — HTTP-слой
- `backend/src/common` — общие guard/pipe/filter/interceptor/helper
- `backend/src/config` — конфиг, env-настройки, фабрики

Рекомендация: не складывать все сервисы в одну папку. Лучше держать сервис рядом с модулем, к которому он относится.
