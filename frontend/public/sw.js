self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== APP_SHELL_CACHE && key !== STATIC_CACHE)
        .map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  )
})

const CACHE_VERSION = 'v1'
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`
const STATIC_CACHE = `static-${CACHE_VERSION}`
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
  '/sw.js',
]

function isSuccessfulResponse(response) {
  return Boolean(response && response.ok)
}

function isStaticAssetRequest(request, url) {
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return false
  }

  return (
    request.destination === 'style'
    || request.destination === 'script'
    || request.destination === 'worker'
    || request.destination === 'image'
    || request.destination === 'font'
    || url.pathname.startsWith('/assets/')
  )
}

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request)

    if (isSuccessfulResponse(response)) {
      const cache = await caches.open(APP_SHELL_CACHE)
      await cache.put(request, response.clone())
    }

    return response
  } catch {
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    return caches.match('/index.html')
  }
}

async function handleStaticAssetRequest(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    void fetch(request).then(async (response) => {
      if (!isSuccessfulResponse(response)) {
        return
      }

      const cache = await caches.open(STATIC_CACHE)
      await cache.put(request, response.clone())
    }).catch(() => {
      // Оставляем уже сохраненную копию ресурса.
    })

    return cachedResponse
  }

  const response = await fetch(request)

  if (isSuccessfulResponse(response)) {
    const cache = await caches.open(STATIC_CACHE)
    await cache.put(request, response.clone())
  }

  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  if (isStaticAssetRequest(request, url)) {
    event.respondWith(handleStaticAssetRequest(request))
  }
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
