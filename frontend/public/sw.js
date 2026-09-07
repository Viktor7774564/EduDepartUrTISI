const CACHE_PREFIX = 'app-shell-'
const STATIC_CACHE_PREFIX = 'static-'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) || key.startsWith(STATIC_CACHE_PREFIX))
        .map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  )
})

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Уведомление',
    body: '',
    data: {
      url: '/notifications',
    },
  }

  try {
    payload = {
      ...payload,
      ...(event.data ? event.data.json() : {}),
    }
  } catch {
    payload.body = event.data?.text() ?? ''
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: payload.data,
      tag: payload.data?.notificationId
        ? `notification-${payload.data.notificationId}`
        : undefined,
    }),
  )
})

function buildNotificationTargetPath(data) {
  const notificationId = data?.notificationId
  let targetPath = data?.url ?? '/notifications'

  if (!notificationId) {
    return targetPath
  }

  const url = new URL(targetPath, self.location.origin)

  if (!url.searchParams.has('id')) {
    url.searchParams.set('id', String(notificationId))
  }

  return `${url.pathname}${url.search}`
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data ?? {}
  const targetPath = buildNotificationTargetPath(data)
  const targetUrl = new URL(targetPath, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (!client.url.startsWith(self.location.origin)) {
          continue
        }

        client.postMessage({
          type: 'notification-click',
          url: targetPath,
          notificationId: data.notificationId ?? null,
        })

        if ('focus' in client) {
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      return undefined
    }),
  )
})
