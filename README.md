# EduDepartUrTISI

## Запуск из корня

- `npm run dev` — запускает фронтенд из `frontend`
- `npm run dev:api` — запускает NestJS из `backend`

## Что храниться NestJS
- `backend/src/modules/<domain>` — модули по предметным областям
- `backend/src/modules/<domain>/<domain>.module.ts` — модуль
- `backend/src/modules/<domain>/<domain>.service.ts` — бизнес-логика
- `backend/src/modules/<domain>/<domain>.controller.ts` — HTTP-слой
- `backend/src/common` — общие guard/pipe/filter/interceptor/helper
- `backend/src/config` — конфиг, env-настройки, фабрики

