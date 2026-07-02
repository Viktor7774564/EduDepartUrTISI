<script setup lang="ts">
import SettingsSectionLayout from '@/components/SettingsSectionLayout.vue'
import {useThemeStore, type AppTheme} from "@/stores/theme";
import DarkModeIcon from '@/assets/dark-mode.svg'
import lightModeIcon from '@/assets/light-mode.svg'

const themeStore = useThemeStore()

const options: {value: AppTheme; label: string; icon: string}[] = [
  {value: 'light', label: 'Светлая', icon: lightModeIcon},
  {value: "dark",label: 'Тёмная', icon: DarkModeIcon}
]

const selectTheme = (value: AppTheme) => {
  themeStore.setTheme(value)
}
</script>

<template>
  <SettingsSectionLayout title="Тема">
  <p class = 'settings-theme-hint'>
    Выберите оформление. Настройки сохранятся на этом устройстве.
  </p>
  <div class="settings-theme-options">
    <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="settings-theme-option"
        :class="{'settings-theme-option--active': themeStore.theme === option.value}"
        @click="selectTheme(option.value)"
    >
      <span class="settings-theme-option__icon-wrap">
        <img :src="option.icon" :alt="option.label" class="settings-theme-option__icon" />
      </span>
      <span class="settings-theme-option__label">{{ option.label }}</span>
    </button>
  </div>
  </SettingsSectionLayout>
</template>
