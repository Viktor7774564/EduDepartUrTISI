import * as XLSX from 'xlsx';

import { extractGroupNameFromTitle } from './group-parallel.utils';
import { isDistanceRoom, parseLessonCell } from './lesson-cell.parser';
import type { ScheduleLessonSlot } from './schedule-conflict.validator';

const DAY_NAMES: Record<string, number> = {
    ПОНЕДЕЛЬНИК: 1,
    ВТОРНИК: 2,
    СРЕДА: 3,
    ЧЕТВЕРГ: 4,
    ПЯТНИЦА: 5,
    СУББОТА: 6,
    ВОСКРЕСЕНЬЕ: 7,
};

const DAY_LABELS: Record<number, string> = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
    7: 'ВС',
};

const MONTHS: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const BLOCK_WIDTH = 14;

const PAIR_TIMES: Record<number, { startTime: string; endTime: string }> = {
    1: { startTime: '08:30', endTime: '10:00' },
    2: { startTime: '10:15', endTime: '11:45' },
    3: { startTime: '12:00', endTime: '13:30' },
    4: { startTime: '14:15', endTime: '15:45' },
    5: { startTime: '16:00', endTime: '17:30' },
    6: { startTime: '17:40', endTime: '19:05' },
    7: { startTime: '19:15', endTime: '20:40' },
};

export interface ParseScheduleResult {
    groupName: string;
    lessons: ScheduleLessonSlot[];
    warnings: string[];
    periodStart: string | null;
    periodEnd: string | null;
}

export interface SchedulePeriod {
    start: Date;
    end: Date;
}

function cellValue(grid: unknown[][], row: number, col: number): string {
    const value = grid[row]?.[col];
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).replace(/\r/g, '').trim();
}

function isDayName(value: string): boolean {
    return Object.prototype.hasOwnProperty.call(DAY_NAMES, value.toUpperCase());
}

function getDayOfWeek(value: string): number {
    return DAY_NAMES[value.toUpperCase()];
}

function isWeekDate(value: string): boolean {
    const trimmed = value.trim();
    return /^\d{1,2}-[A-Za-z]{3}$/.test(trimmed) || /^\d{5,6}$/.test(trimmed);
}

function isAudHeader(value: string): boolean {
    return /^АУД\.?$/i.test(value.trim());
}

function normalizeYear(value: number): number {
    if (value < 100) {
        return 2000 + value;
    }

    return value;
}

function parseSchedulePeriod(grid: unknown[][]): SchedulePeriod | null {
    for (let row = 0; row < Math.min(grid.length, 15); row += 1) {
        for (let col = 0; col < Math.min(grid[row]?.length ?? 0, 5); col += 1) {
            const value = cellValue(grid, row, col);
            const match = value.match(
                /на\s+период\s+с\s+(\d{2})\.(\d{2})\.(\d{2,4})\s*г?\.?\s+по\s+(\d{2})\.(\d{2})\.(\d{2,4})\s*г?\.?/i,
            );

            if (!match) {
                continue;
            }

            const start = new Date(
                normalizeYear(Number(match[3])),
                Number(match[2]) - 1,
                Number(match[1]),
            );
            const end = new Date(
                normalizeYear(Number(match[6])),
                Number(match[5]) - 1,
                Number(match[4]),
            );
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            return { start, end };
        }
    }

    return null;
}

function parseExcelSerialDate(value: string): Date | null {
    if (!/^\d{5,6}$/.test(value.trim())) {
        return null;
    }

    const parsed = XLSX.SSF.parse_date_code(Number(value));
    if (!parsed) {
        return null;
    }

    return new Date(parsed.y, parsed.m - 1, parsed.d);
}

function parseWeekDate(value: string, period: SchedulePeriod | null = null): Date | null {
    const trimmed = value.trim();

    const serialDate = parseExcelSerialDate(trimmed);
    if (serialDate) {
        serialDate.setHours(0, 0, 0, 0);
        return serialDate;
    }

    const match = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})$/);
    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = MONTHS[match[2].toLowerCase()];
    if (month === undefined) {
        return null;
    }

    let year = period?.start.getFullYear() ?? new Date().getFullYear();
    if (!period && month >= 0 && month <= 5) {
        year += 1;
    }

    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date;
}

function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}.${date.getFullYear()}`;
}

function getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
}

function getWeekStartLabel(date: Date, period: SchedulePeriod | null = null): string {
    const monday = getWeekStart(date);

    if (period && monday < period.start) {
        return formatDate(period.start);
    }

    return formatDate(monday);
}

function parsePairTime(value: string): { pairNumber: number; startTime: string; endTime: string } | null {
    const normalized = value.replace(/\s+/g, ' ');
    const match = normalized.match(/(\d+)\s*\(?\s*(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    if (match) {
        return {
            pairNumber: Number(match[1]),
            startTime: match[2],
            endTime: match[3],
        };
    }

    const pairOnly = normalized.match(/^(\d+)/);
    if (pairOnly) {
        const pairNumber = Number(pairOnly[1]);
        const fallback = PAIR_TIMES[pairNumber];
        if (fallback) {
            return { pairNumber, ...fallback };
        }
    }

    return null;
}

function findGroupName(grid: unknown[][]): string | null {
    for (let row = 0; row < Math.min(grid.length, 20); row += 1) {
        for (let col = 0; col < Math.min(grid[row]?.length ?? 0, 50); col += 1) {
            const value = cellValue(grid, row, col);
            if (/РАСПИСАНИЕ\s+гр\./i.test(value)) {
                return extractGroupNameFromTitle(value);
            }
        }
    }

    return null;
}

function findBlockStarts(grid: unknown[][]): number[] {
    const starts: number[] = [];

    for (let row = 0; row < Math.min(grid.length, 20); row += 1) {
        for (let col = 0; col < (grid[row]?.length ?? 0); col += 1) {
            if (cellValue(grid, row, col).toUpperCase() === 'ВРЕМЯ' && !starts.includes(col)) {
                starts.push(col);
            }
        }
    }

    return starts.sort((a, b) => a - b);
}

function collectWeekColumns(
    grid: unknown[][],
    blockStart: number,
    dayRow: number,
    isMonday: boolean,
): Map<number, string> {
    const weekColumns = new Map<number, string>();

    if (isMonday) {
        for (let col = blockStart + 4; col < blockStart + BLOCK_WIDTH; col += 2) {
            const dateValue = cellValue(grid, dayRow - 1, col);
            if (isWeekDate(dateValue)) {
                weekColumns.set(col, dateValue);
            }
        }
        return weekColumns;
    }

    for (let col = blockStart + 2; col < blockStart + BLOCK_WIDTH; col += 2) {
        const dateValue = cellValue(grid, dayRow, col);
        if (isWeekDate(dateValue)) {
            weekColumns.set(col, dateValue);
        }
    }

    return weekColumns;
}

function parseSheetGrid(
    grid: unknown[][],
    groupName: string,
    period: SchedulePeriod | null,
    warnings: string[],
): ScheduleLessonSlot[] {
    const lessons: ScheduleLessonSlot[] = [];
    const blockStarts = findBlockStarts(grid);

    for (const blockStart of blockStarts) {
        const timeCol = blockStart + 1;
        let row = 0;

        while (row < grid.length) {
            const firstCell = cellValue(grid, row, blockStart);
            if (!isDayName(firstCell)) {
                row += 1;
                continue;
            }

            const dayOfWeek = getDayOfWeek(firstCell);
            const isMonday = dayOfWeek === 1;
            const weekColumns = collectWeekColumns(grid, blockStart, row, isMonday);

            row += 1;

            while (row < grid.length) {
                const nextDayCell = cellValue(grid, row, blockStart);
                if (isDayName(nextDayCell)) {
                    break;
                }

                const pairCell = cellValue(grid, row, timeCol);
                const pairTime = parsePairTime(pairCell);
                if (!pairTime) {
                    row += 1;
                    continue;
                }

                for (const [lessonCol, weekDateRaw] of weekColumns.entries()) {
                    const lessonRaw = cellValue(grid, row, lessonCol);
                    if (!lessonRaw || isWeekDate(lessonRaw) || isAudHeader(lessonRaw)) {
                        continue;
                    }

                    const roomCol = lessonCol + 1;
                    const roomRaw = cellValue(grid, row, roomCol);
                    const room = roomRaw && !isAudHeader(roomRaw) ? roomRaw : null;
                    const weekDate = parseWeekDate(weekDateRaw, period);
                    if (!weekDate) {
                        warnings.push(`Не удалось распознать дату недели: ${weekDateRaw}`);
                        continue;
                    }

                    if (period && (weekDate < period.start || weekDate > period.end)) {
                        continue;
                    }

                    const weekStart = getWeekStartLabel(weekDate, period);
                    const parsedParts = parseLessonCell(lessonRaw);
                    if (parsedParts.length === 0) {
                        warnings.push(`Не удалось разобрать ячейку: ${lessonRaw.slice(0, 80)}`);
                        continue;
                    }

                    if (
                        parsedParts.some((part) => part.isSameCellParallel)
                        && parsedParts.length > 1
                    ) {
                        const subjects = [...new Set(parsedParts.map((part) => part.subject))];
                        warnings.push(
                            `Параллельные пары в одной ячейке (${DAY_LABELS[dayOfWeek] ?? dayOfWeek}, `
                            + `${pairTime.startTime}, неделя ${weekStart}): `
                            + subjects.join(' / '),
                        );
                    }

                    const roomParts = room
                        ? room.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean)
                        : [];

                    for (const [index, part] of parsedParts.entries()) {
                        lessons.push({
                            groupName,
                            dayOfWeek,
                            startTime: pairTime.startTime,
                            endTime: pairTime.endTime,
                            weekStart,
                            subgroup: part.subgroup,
                            isDistance: isDistanceRoom(roomParts[index] ?? room),
                            isSameCellParallel: part.isSameCellParallel,
                            subject: part.subject,
                            lessonType: part.lessonType,
                            teacherPosition: part.teacherPosition,
                            teacherName: part.teacherName,
                            room: roomParts[index] ?? room,
                        });
                    }
                }

                row += 1;
            }
        }
    }

    return lessons;
}

export function parseScheduleWorkbook(buffer: Buffer): ParseScheduleResult {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error('Файл не содержит листов');
    }

    const sheet = workbook.Sheets[sheetName];
    const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: null,
        raw: false,
    });

    const period = parseSchedulePeriod(grid);
    const groupName = findGroupName(grid);
    if (!groupName) {
        throw new Error('Не удалось определить группу из заголовка "РАСПИСАНИЕ гр."');
    }

    const warnings: string[] = [];
    if (!period) {
        warnings.push('Не удалось определить период расписания из шапки файла');
    }

    const lessons = parseSheetGrid(grid, groupName, period, warnings);

    if (lessons.length === 0) {
        throw new Error('В файле не найдено занятий для импорта');
    }

    return {
        groupName,
        lessons,
        warnings,
        periodStart: period ? formatDate(period.start) : null,
        periodEnd: period ? formatDate(period.end) : null,
    };
}
