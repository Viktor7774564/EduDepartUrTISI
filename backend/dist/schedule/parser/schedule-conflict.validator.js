"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateScheduleConflicts = validateScheduleConflicts;
const group_parallel_utils_1 = require("./group-parallel.utils");
const lesson_cell_parser_1 = require("./lesson-cell.parser");
const schedule_slot_utils_1 = require("./schedule-slot.utils");
const DAY_LABELS = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
    7: 'ВС',
};
function slotKey(lesson) {
    const subgroup = lesson.subgroup ?? 'all';
    return [
        lesson.groupName,
        lesson.dayOfWeek,
        lesson.startTime,
        lesson.weekStart,
        subgroup,
    ].join('|');
}
function overlapsSameSlot(first, second) {
    return first.dayOfWeek === second.dayOfWeek
        && (0, schedule_slot_utils_1.normalizeTime)(first.startTime) === (0, schedule_slot_utils_1.normalizeTime)(second.startTime)
        && (0, schedule_slot_utils_1.normalizeWeekStart)(first.weekStart) === (0, schedule_slot_utils_1.normalizeWeekStart)(second.weekStart);
}
function subgroupsConflict(first, second) {
    if (first.subgroup === null || second.subgroup === null) {
        return true;
    }
    return first.subgroup === second.subgroup;
}
function hasSameRoom(first, second) {
    const firstRoom = (0, schedule_slot_utils_1.normalizeRoomValue)(first.room);
    const secondRoom = (0, schedule_slot_utils_1.normalizeRoomValue)(second.room);
    return Boolean(firstRoom && secondRoom && firstRoom === secondRoom);
}
function formatDayLabel(dayOfWeek) {
    return DAY_LABELS[dayOfWeek] ?? String(dayOfWeek);
}
function formatSameGroupConflict(first, second) {
    const subgroupNote = first.subgroup || second.subgroup
        ? `, п/гр ${first.subgroup ?? '—'}`
        : '';
    return `Конфликт очных пар: группа ${first.groupName}, `
        + `${formatDayLabel(first.dayOfWeek)}, ${(0, schedule_slot_utils_1.normalizeTime)(first.startTime)}, `
        + `неделя ${(0, schedule_slot_utils_1.normalizeWeekStart)(first.weekStart)}${subgroupNote}. `
        + `"${first.subject}" (${first.lessonType}) и "${second.subject}" (${second.lessonType})`;
}
function formatCrossGroupConflict(first, second) {
    return `Конфликт аудитории между группами: ${formatDayLabel(first.dayOfWeek)}, `
        + `${(0, schedule_slot_utils_1.normalizeTime)(first.startTime)}, неделя ${(0, schedule_slot_utils_1.normalizeWeekStart)(first.weekStart)}, ауд. ${first.room}. `
        + `Группа ${first.groupName}: "${first.subject}" (${first.lessonType}) и `
        + `группа ${second.groupName}: "${second.subject}" (${second.lessonType})`;
}
function validateScheduleConflicts(lessons, existingLessons = []) {
    const conflicts = [];
    const allLessons = [...existingLessons, ...lessons];
    for (let i = 0; i < allLessons.length; i += 1) {
        for (let j = i + 1; j < allLessons.length; j += 1) {
            const first = allLessons[i];
            const second = allLessons[j];
            if (!overlapsSameSlot(first, second)) {
                continue;
            }
            if (first.isDistance || second.isDistance) {
                continue;
            }
            if ((0, lesson_cell_parser_1.isSharedMultiHallRoom)(first.room) || (0, lesson_cell_parser_1.isSharedMultiHallRoom)(second.room)) {
                continue;
            }
            if (first.groupName !== second.groupName) {
                if ((0, group_parallel_utils_1.areParallelGroups)(first.groupName, second.groupName)) {
                    continue;
                }
                if (hasSameRoom(first, second)) {
                    conflicts.push({
                        message: formatCrossGroupConflict(first, second),
                        lessonA: first,
                        lessonB: second,
                    });
                }
                continue;
            }
            if (!subgroupsConflict(first, second)) {
                continue;
            }
            if (first.isSameCellParallel
                && second.isSameCellParallel
                && first.subject !== second.subject) {
                continue;
            }
            conflicts.push({
                message: formatSameGroupConflict(first, second),
                lessonA: first,
                lessonB: second,
            });
        }
    }
    const unique = new Map();
    for (const conflict of conflicts) {
        const key = [
            slotKey(conflict.lessonA),
            slotKey(conflict.lessonB),
            conflict.lessonA.subject,
            conflict.lessonB.subject,
        ].sort().join('::');
        if (!unique.has(key)) {
            unique.set(key, conflict);
        }
    }
    return [...unique.values()];
}
//# sourceMappingURL=schedule-conflict.validator.js.map