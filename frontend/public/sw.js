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

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetPath = event.notification.data?.url ?? '/notifications'
  const targetUrl = new URL(targetPath, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
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
