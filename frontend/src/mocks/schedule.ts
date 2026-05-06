export type LessonType = 'Лекция' | 'Практика' | 'Лаб. раб.' | 'Зачет'

export interface ScheduleItem {
    id: number
    day: 'ПН' | 'ВТ' | 'СР' | 'ЧТ' | 'ПТ' | 'СБ'
    startTime: string
    endTime: string
    subject: string
    teacher: string
    type: LessonType
    room: string
}

export const weeklySchedules: Record<string, ScheduleItem[]> = {
    '20.04 - 26.04': [
        { id: 1, day: 'ПН', startTime: '10:15', endTime: '11:45', subject: 'Сетевое и системное администрирование', teacher: 'Плеханов С.М.', type: 'Лекция', room: '5 римс' },
        { id: 2, day: 'ПН', startTime: '12:00', endTime: '13:30', subject: 'Анализ данных', teacher: 'Казанцев М.Ю.', type: 'Лекция', room: '213 УК1' },
        { id: 3, day: 'ПН', startTime: '14:15', endTime: '15:45', subject: 'Проектная деятельность', teacher: 'Казанцев М.Ю.', type: 'Практика', room: '303 УК1' },
        { id: 4, day: 'ВТ', startTime: '10:15', endTime: '11:45', subject: 'Проектная деятельность', teacher: 'Салимова А.Р.', type: 'Практика', room: '304 УК1' },
        { id: 5, day: 'ВТ', startTime: '12:00', endTime: '13:30', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 6, day: 'ВТ', startTime: '14:15', endTime: '15:45', subject: 'Сетевое и системное администрирование', teacher: 'Плеханов С.М.', type: 'Лаб. раб.', room: '202 УК3' },
        { id: 7, day: 'ВТ', startTime: '16:00', endTime: '17:30', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 8, day: 'СР', startTime: '08:30', endTime: '10:00', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 9, day: 'СР', startTime: '10:15', endTime: '11:45', subject: 'Технологии разработки ПО', teacher: 'Ермоленко О.М.', type: 'Практика', room: '308 УК1' },
        { id: 10, day: 'СР', startTime: '12:00', endTime: '13:30', subject: 'Сетевое и системное администрирование', teacher: 'Плеханов С.М.', type: 'Лаб. раб.', room: '202 УК3' },
        { id: 11, day: 'ЧТ', startTime: '12:00', endTime: '13:30', subject: 'Проектная деятельность', teacher: 'Бурумбаев Д.И.', type: 'Практика', room: '301 УК1' },
        { id: 12, day: 'ЧТ', startTime: '14:15', endTime: '15:45', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 13, day: 'ЧТ', startTime: '16:00', endTime: '17:30', subject: 'Экономика отрасли', teacher: 'Евдакова Л.Н.', type: 'Практика', room: '207 УК1' },
        { id: 14, day: 'СБ', startTime: '12:00', endTime: '13:30', subject: 'Основы работы в среде 1С', teacher: 'Салимова А.Р.', type: 'Практика', room: 'дист.' },
        { id: 15, day: 'СБ', startTime: '14:15', endTime: '15:45', subject: 'Теория массового обслуживания', teacher: 'Тупицын К.М.', type: 'Практика', room: 'дист.' },
    ],
    '27.04 - 03.05': [
        { id: 16, day: 'ПН', startTime: '08:30', endTime: '10:00', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 17, day: 'ПН', startTime: '10:15', endTime: '11:45', subject: 'Сетевое и системное администрирование', teacher: 'Плеханов С.М.', type: 'Лекция', room: '5 римс' },
        { id: 18, day: 'ПН', startTime: '12:00', endTime: '13:30', subject: 'Анализ данных', teacher: 'Казанцев М.Ю.', type: 'Лекция', room: '213 УК1' },
        { id: 19, day: 'ПН', startTime: '14:15', endTime: '15:45', subject: 'Проектная деятельность', teacher: 'Казанцев М.Ю.', type: 'Практика', room: '303 УК1' },
        { id: 20, day: 'ВТ', startTime: '10:15', endTime: '11:45', subject: 'Проектная деятельность', teacher: 'Салимова А.Р.', type: 'Практика', room: '304 УК1' },
        { id: 21, day: 'ВТ', startTime: '12:00', endTime: '13:30', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 22, day: 'ВТ', startTime: '14:15', endTime: '15:45', subject: 'Сетевое и системное администрирование', teacher: 'Плеханов С.М.', type: 'Лаб. раб.', room: '202 УК3' },
        { id: 23, day: 'ВТ', startTime: '16:00', endTime: '17:30', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 24, day: 'СР', startTime: '08:30', endTime: '10:00', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 25, day: 'СР', startTime: '10:15', endTime: '11:45', subject: 'Технологии разработки ПО', teacher: 'Ермоленко О.М.', type: 'Практика', room: '308 УК1' },
        { id: 26, day: 'СР', startTime: '14:15', endTime: '15:45', subject: 'Технологии разработки ПО', teacher: 'Ермоленко О.М.', type: 'Лекция', room: '307 УК1' },
        { id: 27, day: 'ПТ', startTime: '08:30', endTime: '10:00', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 28, day: 'ПТ', startTime: '10:15', endTime: '11:45', subject: 'Анализ данных', teacher: 'Казанцев М.Ю.', type: 'Практика', room: '303 УК1' },
        { id: 29, day: 'ПТ', startTime: '12:00', endTime: '13:30', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 30, day: 'СБ', startTime: '12:00', endTime: '13:30', subject: 'Основы работы в среде 1С', teacher: 'Салимова А.Р.', type: 'Практика', room: 'дист.' },
        { id: 31, day: 'СБ', startTime: '14:15', endTime: '15:45', subject: 'Теория массового обслуживания', teacher: 'Тупицын К.М.', type: 'Практика', room: 'дист.' },
    ],
    '04.05 - 10.05': [
        { id: 32, day: 'ПН', startTime: '10:15', endTime: '11:45', subject: 'Сетевое и системное администрирование', teacher: 'Плеханов С.М.', type: 'Лекция', room: '5 римс' },
        { id: 33, day: 'ПН', startTime: '12:00', endTime: '13:30', subject: 'Проектная деятельность (лекция)', teacher: 'Казанцев М.Ю.', type: 'Лекция', room: '213 УК1' },
        { id: 34, day: 'ПН', startTime: '14:15', endTime: '15:45', subject: 'Проектная деятельность', teacher: 'Казанцев М.Ю.', type: 'Практика', room: '303 УК1' },
        { id: 35, day: 'ВТ', startTime: '10:15', endTime: '11:45', subject: 'Проектная деятельность', teacher: 'Салимова А.Р.', type: 'Практика', room: '304 УК1' },
        { id: 36, day: 'ВТ', startTime: '12:00', endTime: '13:30', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 37, day: 'ВТ', startTime: '14:15', endTime: '15:45', subject: 'Сетевое и системное администрирование', teacher: 'Плеханов С.М.', type: 'Лаб. раб.', room: '202 УК3' },
        { id: 38, day: 'СР', startTime: '08:30', endTime: '10:00', subject: 'Проектная деятельность', teacher: 'Бурумбаев Д.И.', type: 'Практика', room: '301 УК1' },
        { id: 39, day: 'СР', startTime: '10:15', endTime: '11:45', subject: 'Технологии разработки ПО', teacher: 'Ермоленко О.М.', type: 'Практика', room: '308 УК1' },
        { id: 40, day: 'СР', startTime: '12:00', endTime: '13:30', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 41, day: 'ЧТ', startTime: '12:00', endTime: '13:30', subject: 'Проектная деятельность', teacher: 'Бурумбаев Д.И.', type: 'Практика', room: '301 УК1' },
        { id: 42, day: 'ЧТ', startTime: '14:15', endTime: '15:45', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 43, day: 'ЧТ', startTime: '16:00', endTime: '17:30', subject: 'Экономика отрасли', teacher: 'Евдакова Л.Н.', type: 'Практика', room: '207 УК1' },
        { id: 44, day: 'ПТ', startTime: '08:30', endTime: '10:00', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 45, day: 'ПТ', startTime: '10:15', endTime: '11:45', subject: 'Анализ данных', teacher: 'Казанцев М.Ю.', type: 'Практика', room: '303 УК1' },
        { id: 46, day: 'ПТ', startTime: '12:00', endTime: '13:30', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 47, day: 'ПТ', startTime: '14:15', endTime: '15:45', subject: 'Анализ данных', teacher: 'Казанцев М.Ю.', type: 'Практика', room: '303 УК1' },
        { id: 48, day: 'СБ', startTime: '10:15', endTime: '11:45', subject: 'Основы работы в среде 1С', teacher: 'Салимова А.Р.', type: 'Практика', room: 'дист.' },
        { id: 49, day: 'СБ', startTime: '12:00', endTime: '13:30', subject: 'Основы работы в среде 1С', teacher: 'Салимова А.Р.', type: 'Практика', room: 'дист.' },
        { id: 50, day: 'СБ', startTime: '14:15', endTime: '15:45', subject: 'Теория массового обслуживания', teacher: 'Тупицын К.М.', type: 'Практика', room: 'дист.' },
    ],
    '11.05 - 17.05': [
        { id: 51, day: 'ВТ', startTime: '10:15', endTime: '11:45', subject: 'Проектная деятельность', teacher: 'Салимова А.Р.', type: 'Зачет', room: '304 УК1' },
        { id: 52, day: 'ВТ', startTime: '12:00', endTime: '13:30', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 53, day: 'ВТ', startTime: '14:15', endTime: '15:45', subject: 'Сетевое и системное администрирование', teacher: 'Плеханов С.М.', type: 'Лаб. раб.', room: '202 УК3' },
        { id: 54, day: 'СР', startTime: '08:30', endTime: '10:00', subject: 'Проектная деятельность', teacher: 'Казанцев М.Ю.', type: 'Практика', room: '303 УК1' },
        { id: 55, day: 'СР', startTime: '10:15', endTime: '11:45', subject: 'Технологии разработки ПО', teacher: 'Ермоленко О.М.', type: 'Практика', room: '308 УК1' },
        { id: 56, day: 'СР', startTime: '12:00', endTime: '13:30', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 57, day: 'СР', startTime: '14:15', endTime: '15:45', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 58, day: 'ПТ', startTime: '08:30', endTime: '10:00', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 59, day: 'ПТ', startTime: '10:15', endTime: '11:45', subject: 'Анализ данных', teacher: 'Казанцев М.Ю.', type: 'Практика', room: '303 УК1' },
        { id: 60, day: 'ПТ', startTime: '12:00', endTime: '13:30', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 61, day: 'СБ', startTime: '12:00', endTime: '13:30', subject: 'Основы работы в среде 1С', teacher: 'Салимова А.Р.', type: 'Практика', room: 'дист.' },
    ],
    '18.05 - 24.05': [
        { id: 62, day: 'ПН', startTime: '08:30', endTime: '10:00', subject: 'Проектная деятельность', teacher: 'Бурумбаев Д.И.', type: 'Зачет', room: '301 УК1' },
        { id: 63, day: 'ВТ', startTime: '12:00', endTime: '13:30', subject: 'Экономика отрасли', teacher: 'Евдакова Л.Н.', type: 'Зачет', room: '207 УК1' },
        { id: 64, day: 'ВТ', startTime: '14:15', endTime: '15:45', subject: 'Сетевое и системное администрирование', teacher: 'Плеханов С.М.', type: 'Лаб. раб.', room: '202 УК3' },
        { id: 65, day: 'СР', startTime: '10:15', endTime: '11:45', subject: 'Технологии разработки ПО', teacher: 'Ермоленко О.М.', type: 'Практика', room: '308 УК1' },
        { id: 66, day: 'СР', startTime: '12:00', endTime: '13:30', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 67, day: 'ЧТ', startTime: '12:00', endTime: '13:30', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Практика', room: '311 УК1' },
        { id: 68, day: 'ЧТ', startTime: '14:15', endTime: '15:45', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 69, day: 'ЧТ', startTime: '16:00', endTime: '17:30', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 70, day: 'ПТ', startTime: '10:15', endTime: '11:45', subject: 'Анализ данных', teacher: 'Казанцев М.Ю.', type: 'Зачет', room: '303 УК1' },
        { id: 71, day: 'ПТ', startTime: '12:00', endTime: '13:30', subject: 'Разработка игр и интерактивных приложений', teacher: 'Кириленко А.А.', type: 'Зачет', room: '311 УК1' },
        { id: 72, day: 'СБ', startTime: '12:00', endTime: '13:30', subject: 'Основы работы в среде 1С', teacher: 'Салимова А.Р.', type: 'Зачет', room: 'дист.' },
    ],
    '25.05 - 31.05': [
        { id: 73, day: 'ПН', startTime: '10:15', endTime: '11:45', subject: 'Анализ данных', teacher: 'Казанцев М.Ю.', type: 'Практика', room: '303 УК1' },
        { id: 74, day: 'ПН', startTime: '12:00', endTime: '13:30', subject: 'Проектная деятельность', teacher: 'Казанцев М.Ю.', type: 'Зачет', room: '303 УК1' },
        { id: 75, day: 'СР', startTime: '10:15', endTime: '11:45', subject: 'Технологии разработки ПО', teacher: 'Ермоленко О.М.', type: 'Зачет', room: '308 УК1' },
        { id: 76, day: 'СР', startTime: '12:00', endTime: '13:30', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Практика', room: 'С/З, Т/З' },
        { id: 77, day: 'ПТ', startTime: '14:15', endTime: '15:45', subject: 'Элективные дисциплины по физ. культуре', teacher: 'Чащихин А.В.', type: 'Зачет', room: 'С/З, Т/З' },
    ]
}