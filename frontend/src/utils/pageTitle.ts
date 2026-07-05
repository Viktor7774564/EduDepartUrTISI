const APP_TITLE = 'Расписание УрТИСИ'

export function formatPageTitle(pageTitle?: string | null): string {
  if (!pageTitle?.trim()) {
    return APP_TITLE
  }

  return `${pageTitle.trim()} · ${APP_TITLE}`
}

export function setPageTitle(pageTitle?: string | null): void {
  if (typeof document === 'undefined') {
    return
  }

  document.title = formatPageTitle(pageTitle)
}
