import api from '@/api/client'

type VapidPublicKeyResponse = {
  publicKey: string | null
  enabled: boolean
}

type PushServerStatusResponse = {
  subscribed: boolean
}

export type PushBlockReason =
  | 'ok'
  | 'insecure'
  | 'no-service-worker'
  | 'no-push-api'

export type PushSubscriptionStatus = {
  supported: boolean
  blockReason: PushBlockReason
  hint: string
  serverEnabled: boolean
  permission: NotificationPermission | 'unsupported'
  subscribed: boolean
  browserSubscribed: boolean
}

export type PushActionResult = {
  success: boolean
  message?: string
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

function hasPushApi(): boolean {
  if ('PushManager' in window) {
    return true
  }

  return 'ServiceWorkerRegistration' in window
    && 'pushManager' in ServiceWorkerRegistration.prototype
}

function hasAccessToken(): boolean {
  return Boolean(localStorage.getItem('access_token'))
}

export function getPushAvailability(): Pick<PushSubscriptionStatus, 'supported' | 'blockReason' | 'hint'> {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      blockReason: 'no-service-worker',
      hint: 'Push-уведомления недоступны в этом окружении.',
    }
  }

  if (!window.isSecureContext) {
    return {
      supported: false,
      blockReason: 'insecure',
      hint: 'Push работают только по HTTPS. На телефоне нельзя открывать сайт по адресу http://192.168... — нужен https:// с SSL-сертификатом. На компьютере push доступны только на localhost.',
    }
  }

  if (!('serviceWorker' in navigator)) {
    return {
      supported: false,
      blockReason: 'no-service-worker',
      hint: 'Ваш браузер не поддерживает service worker. Попробуйте Chrome, Firefox или Safari.',
    }
  }

  if (!hasPushApi()) {
    return {
      supported: false,
      blockReason: 'no-push-api',
      hint: 'Web Push не поддерживается этим браузером. На iPhone нужны iOS 16.4+ и Safari (или Chrome на Android).',
    }
  }

  return {
    supported: true,
    blockReason: 'ok',
    hint: '',
  }
}

export function isPushSupported(): boolean {
  return getPushAvailability().supported
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!isPushSupported()) {
    return undefined
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js')

  if (existingRegistration) {
    return existingRegistration
  }

  return navigator.serviceWorker.register('/sw.js')
}

async function getBrowserPushSubscription(): Promise<PushSubscription | null> {
  const registration = await getServiceWorkerRegistration()

  if (!registration) {
    return null
  }

  await navigator.serviceWorker.ready

  return registration.pushManager.getSubscription()
}

async function isSubscribedOnServer(endpoint: string): Promise<boolean> {
  if (!hasAccessToken()) {
    return false
  }

  try {
    const response = await api.get<PushServerStatusResponse>('/notifications/push/status', {
      params: { endpoint },
    })

    return response.data.subscribed
  } catch {
    return false
  }
}

async function syncSubscriptionWithServer(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON()

  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Invalid push subscription')
  }

  await api.post('/notifications/push/subscribe', {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  })
}

async function createBrowserPushSubscription(publicKey: string): Promise<PushSubscription> {
  const registration = await getServiceWorkerRegistration()

  if (!registration) {
    throw new Error('Service worker is not available')
  }

  await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    return subscription
  }

  if (Notification.permission === 'denied') {
    throw new Error('denied')
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission()

    if (permission === 'denied') {
      throw new Error('denied')
    }

    if (permission !== 'granted') {
      throw new Error('not-granted')
    }
  }

  try {
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  } catch {
    const staleSubscription = await registration.pushManager.getSubscription()
    await staleSubscription?.unsubscribe()

    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }
}

export async function getPushSubscriptionStatus(): Promise<PushSubscriptionStatus> {
  const availability = getPushAvailability()

  if (!availability.supported) {
    return {
      ...availability,
      serverEnabled: false,
      permission: 'unsupported',
      subscribed: false,
      browserSubscribed: false,
    }
  }

  try {
    const { enabled } = await api
      .get<VapidPublicKeyResponse>('/notifications/push/vapid-public-key')
      .then((response) => response.data)

    const browserSubscription = await getBrowserPushSubscription()
    const browserSubscribed = Boolean(browserSubscription)
    let subscribed = false

    if (browserSubscription?.endpoint) {
      subscribed = await isSubscribedOnServer(browserSubscription.endpoint)
    }

    return {
      supported: true,
      blockReason: 'ok',
      hint: '',
      serverEnabled: enabled,
      permission: Notification.permission,
      subscribed,
      browserSubscribed,
    }
  } catch {
    return {
      supported: true,
      blockReason: 'ok',
      hint: '',
      serverEnabled: false,
      permission: Notification.permission,
      subscribed: false,
      browserSubscribed: false,
    }
  }
}

export async function registerPushSubscription(): Promise<PushActionResult> {
  const availability = getPushAvailability()

  if (!availability.supported) {
    return {
      success: false,
      message: availability.hint,
    }
  }

  if (!hasAccessToken()) {
    return {
      success: false,
      message: 'Войдите в аккаунт, чтобы включить push-уведомления.',
    }
  }

  try {
    const { publicKey, enabled } = await api
      .get<VapidPublicKeyResponse>('/notifications/push/vapid-public-key')
      .then((response) => response.data)

    if (!enabled || !publicKey) {
      return {
        success: false,
        message: 'Push-уведомления на сервере не настроены. Администратору нужно добавить VAPID-ключи в backend/.env.',
      }
    }

    const subscription = await createBrowserPushSubscription(publicKey)
    await syncSubscriptionWithServer(subscription)

    return {
      success: true,
      message: 'Push-уведомления включены.',
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'denied') {
        return {
          success: false,
          message: 'Разрешите уведомления в настройках браузера.',
        }
      }

      if (error.message === 'not-granted') {
        return {
          success: false,
          message: 'Разрешение на уведомления не получено.',
        }
      }
    }

    return {
      success: false,
      message: 'Не удалось включить push-уведомления.',
    }
  }
}

export async function unregisterPushSubscription(): Promise<PushActionResult> {
  if (!isPushSupported()) {
    return {
      success: true,
      message: 'Push-уведомления выключены.',
    }
  }

  try {
    const subscription = await getBrowserPushSubscription()
    const endpoint = subscription?.endpoint

    if (endpoint && hasAccessToken()) {
      try {
        await api.delete('/notifications/push/unsubscribe', {
          data: { endpoint },
        })
      } catch {
        // Если сервер недоступен, всё равно отключаем подписку в браузере.
      }
    }

    if (subscription) {
      await subscription.unsubscribe()
    }

    return {
      success: true,
      message: 'Push-уведомления выключены.',
    }
  } catch {
    return {
      success: false,
      message: 'Не удалось выключить push-уведомления.',
    }
  }
}
