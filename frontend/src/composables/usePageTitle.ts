import { type MaybeRefOrGetter, toValue, watch } from 'vue'
import { setPageTitle } from '@/utils/pageTitle'

export function usePageTitle(title: MaybeRefOrGetter<string | undefined | null>) {
  watch(
    () => toValue(title),
    (value) => setPageTitle(value),
    { immediate: true },
  )
}
