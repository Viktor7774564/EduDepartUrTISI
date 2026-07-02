import { ref } from 'vue'
import { defineStore } from 'pinia'

export type AppTheme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'edu-depart-theme'

function isAppTheme(value: unknown): value is AppTheme {
    return value === 'dark' || value === 'light'
}

function readStoredTheme(): AppTheme {
    if (typeof window === 'undefined') {
        return 'light'
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)

    return isAppTheme(stored) ? stored : 'light'
}

function applyTheme(theme: AppTheme) {
    const root = document.documentElement

    if (theme === 'dark') {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }
}

export function bootstrapTheme() {
    applyTheme(readStoredTheme())
}

export const useThemeStore = defineStore('theme', () => {
    const theme = ref<AppTheme>(readStoredTheme())

    function setTheme(nextTheme: AppTheme) {
        theme.value = nextTheme
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
        applyTheme(nextTheme)
    }

    function initializeTheme() {
        applyTheme(theme.value)
    }

    return {
        theme,
        setTheme,
        initializeTheme,
    }
})