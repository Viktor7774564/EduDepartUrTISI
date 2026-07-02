<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageFrame from '@/components/PageFrame.vue'
import { useAuthStore } from '@/stores/auth'
import { hasScheduleManageAccess } from '@/utils/educationDepartmentAccess'
import { getErrorRoute } from '@/config/errorPages'
import {
  deleteScheduleUpload,
  fetchScheduleUploads,
  formatFileSize,
  getScheduleFileUrl,
  uploadScheduleFile,
  type ScheduleUploadItem,
} from '@/api/scheduleUpload'
import {
  studentFacultySelectOptions,
} from '@/views/schedule/scheduleOptions'

const router = useRouter()
const authStore = useAuthStore()

const uploads = ref<ScheduleUploadItem[]>([])
const selectedFaculty = ref('')
const selectedGroup = ref('')
const selectedFile = ref<File | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const loadError = ref<string | null>(null)
const submitMessage = ref<{
  type: 'success' | 'error'
  text: string
  details?: string[]
  warnings?: string[]
} | null>(null)
const expandedWarningId = ref<number | null>(null)
const deletingId = ref<number | null>(null)

onMounted(async () => {
  if (!authStore.isAuthenticated || !hasScheduleManageAccess(authStore.currentUser)) {
    await router.replace(getErrorRoute('403', 'У вас нет доступа к загрузке расписания'))
    return
  }

  await loadUploads()
})

const selectedFileName = computed(() => {
  if (!selectedGroup.value.trim()) {
    return 'Сначала введите группу'
  }

  return selectedFile.value?.name ?? 'Файл не выбран'
})

const canSelectFile = computed(() => Boolean(selectedFaculty.value && selectedGroup.value.trim()))
const canUpload = computed(() => canSelectFile.value && Boolean(selectedFile.value) && !isSubmitting.value)

watch(selectedFaculty, () => {
  selectedGroup.value = ''
  selectedFile.value = null
  submitMessage.value = null

  const fileInput = document.getElementById('schedule-file') as HTMLInputElement | null
  if (fileInput) {
    fileInput.value = ''
  }
})

watch(selectedGroup, () => {
  selectedFile.value = null
  submitMessage.value = null

  const fileInput = document.getElementById('schedule-file') as HTMLInputElement | null
  if (fileInput) {
    fileInput.value = ''
  }
})

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function toStringList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const list = value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)

    return list.length > 0 ? list : undefined
  }

  if (typeof value === 'string' && value.trim()) {
    return [value]
  }

  return undefined
}

function getErrorPayload(data: unknown): {
  message?: unknown
  errors?: unknown
  warnings?: unknown
} {
  if (!data || typeof data !== 'object') {
    return {}
  }

  const payload = data as {
    message?: unknown
    errors?: unknown
    warnings?: unknown
  }

  if (
    payload.message
    && typeof payload.message === 'object'
    && !Array.isArray(payload.message)
  ) {
    const nested = payload.message as {
      message?: unknown
      errors?: unknown
      warnings?: unknown
    }

    return {
      message: nested.message ?? payload.message,
      errors: nested.errors ?? payload.errors,
      warnings: nested.warnings ?? payload.warnings,
    }
  }

  return payload
}

async function loadUploads() {
  isLoading.value = true
  loadError.value = null

  try {
    uploads.value = await fetchScheduleUploads()
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'Не удалось загрузить список файлов'
  } finally {
    isLoading.value = false
  }
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
  submitMessage.value = null
}

async function handleUpload() {
  submitMessage.value = null

  if (!selectedFaculty.value) {
    submitMessage.value = { type: 'error', text: 'Выберите факультет' }
    return
  }

  if (!selectedGroup.value.trim()) {
    submitMessage.value = { type: 'error', text: 'Введите группу' }
    return
  }

  if (!selectedFile.value) {
    submitMessage.value = { type: 'error', text: 'Выберите файл расписания' }
    return
  }

  isSubmitting.value = true

  try {
    const uploaded = await uploadScheduleFile(
      selectedFaculty.value,
      selectedGroup.value.trim(),
      selectedFile.value,
    )

    uploads.value = [
      uploaded,
      ...uploads.value.filter((item) => !(
        item.groupName === uploaded.groupName
        && item.periodStart === uploaded.periodStart
        && item.periodEnd === uploaded.periodEnd
      )),
    ]

    selectedFile.value = null

    const fileInput = document.getElementById('schedule-file') as HTMLInputElement | null
    if (fileInput) {
      fileInput.value = ''
    }

    submitMessage.value = {
      type: 'success',
      text: uploaded.periodStart && uploaded.periodEnd
        ? `Расписание группы ${uploaded.groupName ?? selectedGroup.value} за период ${uploaded.periodStart} — ${uploaded.periodEnd} загружено: ${uploaded.lessonsCount} занятий`
        : `Расписание группы ${uploaded.groupName ?? selectedGroup.value} загружено: ${uploaded.lessonsCount} занятий`,
      warnings: uploaded.parseWarnings?.length ? uploaded.parseWarnings : undefined,
    }
  } catch (err: any) {
    const data = getErrorPayload(err.response?.data)
    const details = toStringList(data.errors)
      ?? (Array.isArray(data.message) ? toStringList(data.message) : undefined)
    const warnings = toStringList(data.warnings)

    submitMessage.value = {
      type: 'error',
      text: typeof data.message === 'string'
        ? data.message
        : 'Не удалось загрузить файл',
      details,
      warnings,
    }
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(id: number) {
  if (!window.confirm('Удалить загруженный файл?')) {
    return
  }

  deletingId.value = id

  try {
    await deleteScheduleUpload(id)
    uploads.value = uploads.value.filter((item) => item.id !== id)
  } catch (err: any) {
    submitMessage.value = {
      type: 'error',
      text: err.response?.data?.message || 'Не удалось удалить файл',
    }
  } finally {
    deletingId.value = null
  }
}

const goBack = () => router.push({ name: 'home' })

const toggleUploadWarnings = (id: number) => {
  expandedWarningId.value = expandedWarningId.value === id ? null : id
}
</script>

<template>
  <PageFrame>
    <section class="admin-edit-page schedule-upload-page">
      <div class="admin-card">
        <div class="card-header">
          <button class="back-btn" type="button" @click="goBack" aria-label="Назад">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h1 class="card-title">Загрузка расписания</h1>
        </div>

        <p class="card-subtitle">
          Выберите факультет, введите группу и загрузите Excel-файл расписания.
          Период берётся из шапки файла — можно загружать части расписания отдельно.
          Повторная загрузка того же периода заменит только его, остальные периоды сохранятся.
        </p>

        <div v-if="submitMessage" :class="['submit-message', submitMessage.type]">
          <p>{{ submitMessage.text }}</p>

          <div v-if="submitMessage.details?.length" class="message-block">
            <strong>{{ submitMessage.type === 'error' ? 'Детали ошибки:' : 'Детали:' }}</strong>
            <ul class="message-list">
              <li v-for="(detail, index) in submitMessage.details" :key="index">
                {{ detail }}
              </li>
            </ul>
          </div>

          <div v-if="submitMessage.warnings?.length" class="message-block warnings-block">
            <strong>Предупреждения при разборе файла:</strong>
            <ul class="message-list">
              <li v-for="(warning, index) in submitMessage.warnings" :key="index">
                {{ warning }}
              </li>
            </ul>
          </div>
        </div>

        <form class="user-form" @submit.prevent="handleUpload">
          <div class="form-section">
            <h2 class="section-title">Новая загрузка</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="schedule-faculty" class="form-label">
                  Факультет <span class="required">*</span>
                </label>
                <select
                  id="schedule-faculty"
                  v-model="selectedFaculty"
                  class="form-select"
                  :disabled="isSubmitting"
                >
                  <option value="">Выберите факультет</option>
                  <option
                    v-for="option in studentFacultySelectOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="schedule-group" class="form-label">
                  Группа <span class="required">*</span>
                </label>
                <input
                  id="schedule-group"
                  v-model="selectedGroup"
                  type="text"
                  class="form-input"
                  placeholder="Например, ПЕ-31б или 381"
                  :disabled="!selectedFaculty || isSubmitting"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label for="schedule-file" class="form-label">
                  Файл Excel <span class="required">*</span>
                </label>
                <input
                  id="schedule-file"
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  class="form-input"
                  :disabled="!canSelectFile || isSubmitting"
                  @change="onFileSelected"
                />
                <span class="file-name-hint">{{ selectedFileName }}</span>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-primary" type="submit" :disabled="!canUpload">
                {{ isSubmitting ? 'Загрузка...' : 'Загрузить расписание' }}
              </button>
            </div>
          </div>
        </form>

        <div class="form-section uploads-section">
          <h2 class="section-title">Загруженные файлы</h2>

          <p v-if="isLoading" class="uploads-state">Загрузка списка...</p>
          <p v-else-if="loadError" class="uploads-state error">{{ loadError }}</p>
          <p v-else-if="uploads.length === 0" class="uploads-state">
            Пока нет загруженных файлов
          </p>

          <div v-else class="users-table uploads-table">
            <div class="table-header">
              <span class="col-faculty">Факультет</span>
              <span class="col-name">Группа / файл</span>
              <span class="col-created">Дата</span>
              <span class="col-role">Занятий</span>
              <span class="col-actions">Действия</span>
            </div>

            <div v-for="upload in uploads" :key="upload.id" class="table-row">
              <span class="col-faculty" data-label="Факультет">{{ upload.facultyName ?? '—' }}</span>
              <span class="col-name" data-label="Группа / файл">
                <strong v-if="upload.groupName">{{ upload.groupName }}</strong>
                <span v-if="upload.periodStart && upload.periodEnd" class="upload-period">
                  Период: {{ upload.periodStart }} — {{ upload.periodEnd }}
                </span>
                <a
                  class="file-link"
                  :href="getScheduleFileUrl(upload.fileUrl)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ upload.originalFileName }}
                </a>
                <span class="file-size">{{ formatFileSize(upload.fileSize) }}</span>
                <span v-if="upload.parseWarnings?.length" class="parse-warning">
                  <button
                    type="button"
                    class="warning-toggle"
                    @click="toggleUploadWarnings(upload.id)"
                  >
                    {{ upload.parseWarnings.length }} предупреждений
                    {{ expandedWarningId === upload.id ? '▲' : '▼' }}
                  </button>
                  <ul
                    v-if="expandedWarningId === upload.id"
                    class="upload-warning-list"
                  >
                    <li v-for="(warning, index) in upload.parseWarnings" :key="index">
                      {{ warning }}
                    </li>
                  </ul>
                </span>
              </span>
              <span class="col-created" data-label="Дата">{{ formatDate(upload.uploadedAt) }}</span>
              <span class="col-role" data-label="Занятий">{{ upload.lessonsCount }}</span>
              <span class="col-actions" data-label="Действия">
                <button
                  class="close-btn"
                  type="button"
                  :disabled="deletingId === upload.id"
                  @click="handleDelete(upload.id)"
                >
                  {{ deletingId === upload.id ? '...' : 'Удалить' }}
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </PageFrame>
</template>

<style scoped>
.schedule-upload-page .card-subtitle {
  margin: -16px 0 24px;
}

.file-name-hint {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  color: #5f6770;
}

:global(.dark) .file-name-hint {
  color: #9aa3ad;
}

.uploads-section {
  margin-top: 8px;
}

.uploads-state {
  margin: 0;
  color: #5f6770;
}

:global(.dark) .uploads-state {
  color: #9aa3ad;
}

.uploads-state.error {
  color: #b42318;
}

:global(.dark) .uploads-state.error {
  color: #f1948a;
}

.uploads-table .table-header,
.uploads-table .table-row {
  grid-template-columns: 1fr 1.6fr 1fr 0.8fr 0.8fr;
}

.file-link {
  color: #2f7fbf;
  text-decoration: none;
}

:global(.dark) .file-link {
  color: #6bb5e0;
}

.file-link:hover {
  text-decoration: underline;
}

.file-size {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #5f6770;
}

:global(.dark) .file-size {
  color: #9aa3ad;
}

.error-details,
.message-list {
  margin: 8px 0 0;
  padding-left: 18px;
}

.error-details li,
.message-list li {
  margin-top: 4px;
}

.message-block {
  margin-top: 12px;
}

.warnings-block {
  color: #7a5b00;
}

:global(.dark) .warnings-block {
  color: #d4a843;
}

.parse-warning {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #9a6700;
}

:global(.dark) .parse-warning {
  color: #d4a843;
}

.warning-toggle {
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
}

.upload-warning-list {
  margin: 8px 0 0;
  padding-left: 18px;
}

.upload-warning-list li {
  margin-top: 4px;
}

.col-name strong {
  display: block;
  margin-bottom: 4px;
}

.upload-period {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #355f8c;
}

:global(.dark) .upload-period {
  color: #9fd0ef;
}

.schedule-upload-page .close-btn {
  width: auto;
  height: auto;
  padding: 6px 12px;
  font-size: 13px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .schedule-upload-page.admin-edit-page {
    padding: 16px 10px;
    align-items: stretch;
  }

  .schedule-upload-page .admin-card {
    padding: 18px 14px;
    border-radius: 12px;
  }

  .schedule-upload-page .card-header {
    grid-template-columns: 38px 1fr 38px;
    gap: 10px;
    margin-bottom: 16px;
  }

  .schedule-upload-page .card-title {
    font-size: 20px;
    line-height: 1.25;
  }

  .schedule-upload-page .card-subtitle {
    margin: 0 0 18px;
    text-align: left;
    font-size: 14px;
    line-height: 1.45;
    padding-bottom: 14px;
  }

  .schedule-upload-page .form-section {
    padding: 16px 12px;
  }

  .schedule-upload-page .section-title {
    font-size: 16px;
    margin-bottom: 14px;
    padding-bottom: 10px;
  }

  .schedule-upload-page .form-row {
    grid-template-columns: 1fr;
    gap: 14px;
    margin-bottom: 14px;
  }

  .schedule-upload-page .form-actions {
    flex-direction: column;
    padding-top: 16px;
  }

  .schedule-upload-page .form-actions .btn {
    width: 100%;
  }

  .schedule-upload-page .submit-message {
    font-size: 13px;
    line-height: 1.45;
    word-break: break-word;
  }

  .schedule-upload-page .file-name-hint {
    font-size: 12px;
    line-height: 1.4;
    word-break: break-word;
  }

  .schedule-upload-page .uploads-table .table-header {
    display: none;
  }

  .schedule-upload-page .uploads-table .table-row {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px 12px;
    align-items: stretch;
  }

  .schedule-upload-page .uploads-table .table-row > [class^='col-'] {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }

  .schedule-upload-page .uploads-table .table-row > [class^='col-']::before {
    content: attr(data-label);
    display: block;
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #5f6975;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  :global(.dark) .schedule-upload-page .uploads-table .table-row > [class^='col-']::before {
    color: #9aa3ad;
  }

  .schedule-upload-page .col-actions {
    justify-content: flex-start;
    padding-top: 4px;
  }

  .schedule-upload-page .close-btn {
    width: auto !important;
    height: auto !important;
    min-height: 38px;
    padding: 8px 14px !important;
    font-size: 13px !important;
  }

  .schedule-upload-page .file-link {
    word-break: break-word;
  }
}

@media (max-width: 480px) {
  .schedule-upload-page.admin-edit-page {
    padding: 12px 8px;
  }

  .schedule-upload-page .admin-card {
    padding: 14px 12px;
  }

  .schedule-upload-page .card-title {
    font-size: 18px;
  }

  .schedule-upload-page .card-subtitle {
    font-size: 13px;
  }
}
</style>
