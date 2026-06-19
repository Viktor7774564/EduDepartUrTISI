# Modules

Держи каждый домен в отдельной папке:

- `auth`
- `users`
- `schedule`
- `consultations`

Для каждого домена обычно хватает таких файлов:

- `*.module.ts`
- `*.service.ts`
- `*.controller.ts`
- `dto/`
- `entities/`

Если логика общая для нескольких доменов, выноси её в `src/common`.
