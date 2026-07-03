<script setup lang="ts">
import { useConfirmDialogStore } from '@/stores/confirmDialog'

const dialog = useConfirmDialogStore()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="dialog.visible"
      class="confirm-dialog-overlay"
      @click="dialog.dismiss"
    >
      <div
        class="confirm-dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'confirm-dialog-title'"
        @click.stop
      >
        <h2 id="confirm-dialog-title" class="confirm-dialog__title">
          {{ dialog.title }}
        </h2>

        <p class="confirm-dialog__message">
          {{ dialog.message }}
        </p>

        <ul v-if="dialog.details.length > 0" class="confirm-dialog__details">
          <li v-for="(detail, index) in dialog.details" :key="index">
            {{ detail }}
          </li>
        </ul>

        <div class="confirm-dialog__actions">
          <button
            v-if="dialog.mode === 'confirm'"
            type="button"
            class="confirm-dialog__button confirm-dialog__button--secondary"
            @click="dialog.dismiss"
          >
            {{ dialog.cancelText }}
          </button>

          <button
            type="button"
            class="confirm-dialog__button"
            :class="dialog.variant === 'danger'
              ? 'confirm-dialog__button--danger'
              : 'confirm-dialog__button--primary'"
            @click="dialog.accept"
          >
            {{ dialog.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
