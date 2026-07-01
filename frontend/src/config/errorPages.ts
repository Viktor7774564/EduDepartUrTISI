import illustration404 from '@/assets/errors/404.svg'
import illustration403 from '@/assets/errors/403.svg'
import illustration500 from '@/assets/errors/500.svg'
import illustrationDefault from '@/assets/errors/default.svg'

export type ErrorCode = '404' | '403' | '500' | 'default'

export type ErrorPageConfig = {
  code: ErrorCode
  title: string
  description: string
  illustration: string
  illustrationAlt: string
  actionLabel: string
  actionTo: string
}

const ERROR_PAGES: Record<ErrorCode, Omit<ErrorPageConfig, 'code'>> = {
  '404': {
    title: 'Упс! Страница не найдена',
    description: 'Запрашиваемая страница не существует или была перемещена.',
    illustration: illustration404,
    illustrationAlt: 'Страница не найдена',
    actionLabel: 'Вернуться на главную',
    actionTo: '/',
  },
  '403': {
    title: 'Доступ запрещён',
    description: 'У вас нет прав для просмотра этой страницы.',
    illustration: illustration403,
    illustrationAlt: 'Доступ запрещён',
    actionLabel: 'Вернуться на главную',
    actionTo: '/',
  },
  '500': {
    title: 'Ошибка сервера',
    description: 'Что-то пошло не так на сервере. Попробуйте обновить страницу позже.',
    illustration: illustration500,
    illustrationAlt: 'Ошибка сервера',
    actionLabel: 'Вернуться на главную',
    actionTo: '/',
  },
  default: {
    title: 'Что-то пошло не так',
    description: 'Произошла непредвиденная ошибка. Попробуйте вернуться на главную.',
    illustration: illustrationDefault,
    illustrationAlt: 'Ошибка',
    actionLabel: 'Вернуться на главную',
    actionTo: '/',
  },
}

export function resolveErrorCode(raw?: string | null): ErrorCode {
  if (raw === '404' || raw === '403' || raw === '500') {
    return raw
  }

  return 'default'
}

export function getErrorPageConfig(
  rawCode?: string | null,
  customDescription?: string | null,
): ErrorPageConfig {
  const code = resolveErrorCode(rawCode)
  const base = ERROR_PAGES[code]

  return {
    code,
    ...base,
    description: customDescription?.trim() || base.description,
  }
}

export function getErrorRoute(code: ErrorCode | string, message?: string) {
  const resolvedCode = resolveErrorCode(code)

  return {
    name: 'error' as const,
    params: { code: resolvedCode === 'default' ? 'unknown' : resolvedCode },
    query: message ? { message } : undefined,
  }
}
