import { ScheduleItem } from '../entities/schedule-item.entity';

export interface SchedulePeriodMeta {
    academicYearLabel: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    periodLabel: string | null;
}

export function parseScheduleDate(value: string): Date {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const [year, month, day] = trimmed.slice(0, 10).split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    const dottedMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (dottedMatch) {
        return new Date(
            Number(dottedMatch[3]),
            Number(dottedMatch[2]) - 1,
            Number(dottedMatch[1]),
        );
    }

    return new Date(trimmed);
}

export function getAcademicYearStartFromDate(referenceDate: Date): number {
    const month = referenceDate.getMonth();
    const year = referenceDate.getFullYear();

    if (month >= 7) {
        return year;
    }

    return year - 1;
}

export function formatAcademicYearLabel(validFrom: string): string {
    const startYear = getAcademicYearStartFromDate(parseScheduleDate(validFrom));

    return `${startYear}/${String(startYear + 1).slice(-2)}`;
}

function formatScheduleDateLabel(value: string): string {
    const date = parseScheduleDate(value);
    const pad = (part: number) => String(part).padStart(2, '0');

    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function formatPeriodLabel(validFrom: string, validTo: string): string {
    return `${formatScheduleDateLabel(validFrom)} — ${formatScheduleDateLabel(validTo)}`;
}

export function resolveSchedulePeriodMeta(items: ScheduleItem[]): SchedulePeriodMeta {
    const empty: SchedulePeriodMeta = {
        academicYearLabel: null,
        periodStart: null,
        periodEnd: null,
        periodLabel: null,
    };

    if (items.length === 0) {
        return empty;
    }

    const schedules = new Map<number, { validFrom: string; validTo: string }>();

    for (const item of items) {
        const schedule = item.schedule;

        if (!schedule?.validFrom || !schedule?.validTo) {
            continue;
        }

        schedules.set(schedule.id, {
            validFrom: String(schedule.validFrom),
            validTo: String(schedule.validTo),
        });
    }

    if (schedules.size === 0) {
        return empty;
    }

    let earliestStart: string | null = null;
    let latestEnd: string | null = null;

    for (const { validFrom, validTo } of schedules.values()) {
        if (
            !earliestStart
            || parseScheduleDate(validFrom) < parseScheduleDate(earliestStart)
        ) {
            earliestStart = validFrom;
        }

        if (
            !latestEnd
            || parseScheduleDate(validTo) > parseScheduleDate(latestEnd)
        ) {
            latestEnd = validTo;
        }
    }

    if (!earliestStart || !latestEnd) {
        return empty;
    }

    return {
        academicYearLabel: formatAcademicYearLabel(earliestStart),
        periodStart: earliestStart,
        periodEnd: latestEnd,
        periodLabel: formatPeriodLabel(earliestStart, latestEnd),
    };
}
