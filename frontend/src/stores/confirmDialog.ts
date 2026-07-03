import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ConfirmDialogOptions = {
  title?: string
  message: string
  details?: string[]
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
}

export type AlertDialogOptions = {
  title?: string
  message: string
  details?: string[]
  confirmText?: string
}

type DialogMode = 'confirm' | 'alert'

const DEFAULT_CONFIRM_TITLE = 'Подтвердите действие'
const DEFAULT_ALERT_TITLE = 'Сообщение'

function normalizeConfirmOptions(
  input: string | ConfirmDialogOptions,
): Required<Omit<ConfirmDialogOptions, 'details'>> & Pick<ConfirmDialogOptions, 'details'> {
  if (typeof input === 'string') {
    return {
      title: DEFAULT_CONFIRM_TITLE,
      message: input,
      confirmText: 'Подтвердить',
      cancelText: 'Отмена',
      variant: 'default',
    }
  }

  return {
    title: input.title ?? DEFAULT_CONFIRM_TITLE,
    message: input.message,
    details: input.details,
    confirmText: input.confirmText ?? 'Подтвердить',
    cancelText: input.cancelText ?? 'Отмена',
    variant: input.variant ?? 'default',
  }
}

function normalizeAlertOptions(
  input: string | AlertDialogOptions,
): Required<Omit<AlertDialogOptions, 'details'>> & Pick<AlertDialogOptions, 'details'> {
  if (typeof input === 'string') {
    return {
      title: DEFAULT_ALERT_TITLE,
      message: input,
      confirmText: 'OK',
    }
  }

  return {
    title: input.title ?? DEFAULT_ALERT_TITLE,
    message: input.message,
    details: input.details,
    confirmText: input.confirmText ?? 'OK',
  }
}

export const useConfirmDialogStore = defineStore('confirmDialog', () => {
  const visible = ref(false)
  const mode = ref<DialogMode>('confirm')
  const title = ref(DEFAULT_CONFIRM_TITLE)
  const message = ref('')
  const details = ref<string[]>([])
  const confirmText = ref('Подтвердить')
  const cancelText = ref('Отмена')
  const variant = ref<'default' | 'danger'>('default')

  let resolvePromise: ((value: boolean) => void) | null = null

  function resetPromise() {
    resolvePromise = null
  }

  function confirm(input: string | ConfirmDialogOptions): Promise<boolean> {
    const options = normalizeConfirmOptions(input)

    if (resolvePromise) {
      resolvePromise(false)
    }

    mode.value = 'confirm'
    title.value = options.title
    message.value = options.message
    details.value = options.details ?? []
    confirmText.value = options.confirmText
    cancelText.value = options.cancelText
    variant.value = options.variant
    visible.value = true

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  function alert(input: string | AlertDialogOptions): Promise<void> {
    const options = normalizeAlertOptions(input)

    if (resolvePromise) {
      resolvePromise(false)
    }

    mode.value = 'alert'
    title.value = options.title
    message.value = options.message
    details.value = options.details ?? []
    confirmText.value = options.confirmText
    cancelText.value = 'Отмена'
    variant.value = 'default'
    visible.value = true

    return new Promise<void>((resolve) => {
      resolvePromise = (value) => {
        if (value) {
          resolve()
        }
      }
    })
  }

  function accept() {
    visible.value = false
    resolvePromise?.(true)
    resetPromise()
  }

  function dismiss() {
    visible.value = false
    resolvePromise?.(false)
    resetPromise()
  }

  return {
    visible,
    mode,
    title,
    message,
    details,
    confirmText,
    cancelText,
    variant,
    confirm,
    alert,
    accept,
    dismiss,
  }
})
