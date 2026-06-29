import api from '@/api/client'

type VapidPublicKeyResponse = {
  publicKey: string | null
  enabled: boolean
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
}

export type PushActionResult = {
  success: boolean
  message?: string
}

let registeredEndpoint: string | null = null

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

export async function getPushSubscriptionStatus(): Promise<PushSubscriptionStatus> {
  const availability = getPushAvailability()

  if (!availability.supported) {
    return {
      ...availability,
      serverEnabled: false,
      permission: 'unsupported',
      subscribed: false,
    }
  }

  try {
    const { enabled } = await api
      .get<VapidPublicKeyResponse>('/notifications/push/vapid-public-key')
      .then((response) => response.data)

    const registration = await getServiceWorkerRegistration()
    await registration?.ready
    const subscription = await registration?.pushManager.getSubscription()

    if (subscription?.endpoint) {
      registeredEndpoint = subscription.endpoint
    }

    return {
      supported: true,
      blockReason: 'ok',
      hint: '',
      serverEnabled: enabled,
      permission: Notification.permission,
      subscribed: Boolean(subscription),
    }
  } catch {
    return {
      supported: true,
      blockReason: 'ok',
      hint: '',
      serverEnabled: false,
      permission: Notification.permission,
      subscribed: false,
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

    const registration = await getServiceWorkerRegistration()

    if (!registration) {
      return {
        success: false,
        message: 'Не удалось зарегистрировать service worker.',
      }
    }

    await registration.ready

    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const permission = await Notification.requestPermission()

      if (permission === 'denied') {
        return {
          success: false,
          message: 'Разрешите уведомления в настройках браузера.',
        }
      }

      if (permission !== 'granted') {
        return {
          success: false,
          message: 'Разрешение на уведомления не получено.',
        }
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    }

    const json = subscription.toJSON()

    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
      return {
        success: false,
        message: 'Не удалось создать подписку на уведомления.',
      }
    }

    if (registeredEndpoint !== json.endpoint) {
      await api.post('/notifications/push/subscribe', {
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      })
    }

    registeredEndpoint = json.endpoint

    return {
      success: true,
      message: 'Push-уведомления включены.',
    }
  } catch {
    return {
      success: false,
      message: 'Не удалось включить push-уведомления.',
    }
  }
}

export async function unregisterPushSubscription(): Promise<PushActionResult> {
  registeredEndpoint = null

  if (!isPushSupported()) {
    return { success: true }
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    const subscription = await registration?.pushManager.getSubscription()

    if (!subscription) {
      return {
        success: true,
        message: 'Push-уведомления уже выключены.',
      }
    }

    const endpoint = subscription.endpoint

    await subscription.unsubscribe()

    if (endpoint) {
      await api.delete('/notifications/push/unsubscribe', {
        data: { endpoint },
      })
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
