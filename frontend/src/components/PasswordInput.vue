<script setup lang="ts">
import { ref } from 'vue'
import showIcon from '@/assets/eye-password-show.svg'
import hideIcon from '@/assets/eye-password-hide.svg'

withDefaults(defineProps<{
  id?: string
  placeholder?: string
  disabled?: boolean
  error?: boolean
  variant?: 'admin' | 'login'
}>(), {
  variant: 'admin',
})

const model = defineModel<string>({ default: '' })

const isVisible = ref(false)
</script>

<template>
  <div class="password-field" :class="[`password-field--${variant}`]">
    <input
      :id="id"
      v-model="model"
      :type="isVisible ? 'text' : 'password'"
      :class="variant === 'admin' ? ['form-input', 'password-field__input', { error }] : 'password-field__input'"
      :placeholder="placeholder"
      :disabled="disabled"
    />
    <button
      type="button"
      class="password-field__toggle"
      :disabled="disabled"
      :aria-label="isVisible ? 'Скрыть пароль' : 'Показать пароль'"
      @click="isVisible = !isVisible"
    >
      <img
        :src="isVisible ? showIcon : hideIcon"
        alt=""
        aria-hidden="true"
      />
    </button>
  </div>
</template>
