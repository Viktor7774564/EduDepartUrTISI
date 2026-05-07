export type ConsultationType = 'Консультация' | 'Онлайн-консультация'

export interface ConsultationItem {
  id: number
  day: 'ПН' | 'ВТ' | 'СР' | 'ЧТ' | 'ПТ' | 'СБ'
  startTime: string
  endTime: string
  subject: string
  teacher: string
  type: ConsultationType
  room: string
}

export const consultationSchedules: Record<string, Record<string, ConsultationItem[]>> = {
  'Плеханов С.М.': {
    '04.05 - 10.05': [
      {
        id: 1,
        day: 'ПН',
        startTime: '08:30',
        endTime: '10:00',
        subject: 'Технологии баз данных',
        teacher: 'Плеханов С.М.',
        type: 'Консультация',
        room: 'Аудитория 103',
      },
      {
        id: 2,
        day: 'ПН',
        startTime: '12:00',
        endTime: '13:30',
        subject: 'Web-технологии',
        teacher: 'Плеханов С.М.',
        type: 'Консультация',
        room: 'Аудитория 203',
      },
      {
        id: 3,
        day: 'ВТ',
        startTime: '10:15',
        endTime: '11:45',
        subject: 'Web-технологии',
        teacher: 'Плеханов С.М.',
        type: 'Онлайн-консультация',
        room: 'Онлайн',
      },
    ],
    '11.05 - 17.05': [
      {
        id: 4,
        day: 'СР',
        startTime: '12:00',
        endTime: '13:30',
        subject: 'Технологии баз данных',
        teacher: 'Плеханов С.М.',
        type: 'Консультация',
        room: 'Аудитория 103',
      },
      {
        id: 5,
        day: 'ПТ',
        startTime: '14:15',
        endTime: '15:45',
        subject: 'Технологии баз данных',
        teacher: 'Плеханов С.М.',
        type: 'Онлайн-консультация',
        room: 'Онлайн',
      },
    ],
  },
  'Ермоленко О.М.': {
    '04.05 - 10.05': [
      {
        id: 6,
        day: 'ВТ',
        startTime: '08:30',
        endTime: '10:00',
        subject: 'Технологии разработки ПО',
        teacher: 'Ермоленко О.М.',
        type: 'Консультация',
        room: '308 УК1',
      },
      {
        id: 7,
        day: 'ЧТ',
        startTime: '16:00',
        endTime: '17:30',
        subject: 'Технологии разработки ПО',
        teacher: 'Ермоленко О.М.',
        type: 'Онлайн-консультация',
        room: 'Онлайн',
      },
    ],
  },
  'Кириленко А.А.': {
    '04.05 - 10.05': [
      {
        id: 8,
        day: 'СР',
        startTime: '10:15',
        endTime: '11:45',
        subject: 'Разработка игр и интерактивных приложений',
        teacher: 'Кириленко А.А.',
        type: 'Консультация',
        room: '311 УК1',
      },
      {
        id: 9,
        day: 'СБ',
        startTime: '12:00',
        endTime: '13:30',
        subject: 'Разработка игр и интерактивных приложений',
        teacher: 'Кириленко А.А.',
        type: 'Онлайн-консультация',
        room: 'Онлайн',
      },
    ],
  },
}
