import { ScheduleItem } from './entities/schedule-item.entity';
import { LessonTypeCode } from './entities/lesson-type.entity';
import { areParallelGroups } from './parser/group-parallel.utils';

export function isLectureScheduleItem(item: ScheduleItem): boolean {
    return item.lessonType?.code === LessonTypeCode.LECTURE;
}

export function isSharedMultiGroupLessonItem(item: ScheduleItem): boolean {
    return item.lessonType?.code === LessonTypeCode.LECTURE
        || item.lessonType?.code === LessonTypeCode.SPECIAL;
}

export function areLinkedSharedLessonItems(first: ScheduleItem, second: ScheduleItem): boolean {
    if (first.id === second.id) {
        return true;
    }

    if (!isSharedMultiGroupLessonItem(first) || !isSharedMultiGroupLessonItem(second)) {
        return false;
    }

    if (first.lessonType?.code !== second.lessonType?.code) {
        return false;
    }

    if (first.isDisabled || second.isDisabled) {
        return false;
    }

    const firstGroupName = first.schedule?.group?.name;
    const secondGroupName = second.schedule?.group?.name;

    if (!firstGroupName || !secondGroupName) {
        return false;
    }

    if (first.lessonType.code === LessonTypeCode.LECTURE
        && !areParallelGroups(firstGroupName, secondGroupName)) {
        return false;
    }

    if (String(first.weekStart) !== String(second.weekStart)) {
        return false;
    }

    if (first.dayOfWeek !== second.dayOfWeek) {
        return false;
    }

    if (String(first.startTime) !== String(second.startTime)) {
        return false;
    }

    if (String(first.endTime) !== String(second.endTime)) {
        return false;
    }

    if (first.subjectId !== second.subjectId) {
        return false;
    }

    if (first.subgroupId !== second.subgroupId) {
        return false;
    }

    if (first.teacherId !== second.teacherId) {
        return false;
    }

    if (first.legacyTeacherName !== second.legacyTeacherName) {
        return false;
    }

    if (first.roomId !== second.roomId) {
        return false;
    }

    return true;
}

export function areLinkedLectureItems(first: ScheduleItem, second: ScheduleItem): boolean {
    return areLinkedSharedLessonItems(first, second);
}

export function findLinkedLectureItemsInList(
    item: ScheduleItem,
    candidates: ScheduleItem[],
): ScheduleItem[] {
    if (!isSharedMultiGroupLessonItem(item)) {
        return [item];
    }

    const linkedItems = candidates.filter((candidate) =>
        areLinkedSharedLessonItems(item, candidate),
    );

    return linkedItems.length > 0 ? linkedItems : [item];
}

export function extractLinkedGroupNames(items: ScheduleItem[]): string[] {
    return items
        .map((entry) => entry.schedule?.group?.name ?? '')
        .filter(Boolean)
        .sort((left, right) =>
            left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true }),
        );
}

export function buildLinkedGroupsMap(items: ScheduleItem[]): Map<number, string[]> {
    const linkedGroupsMap = new Map<number, string[]>();
    const activeItems = items.filter((item) => !item.isDisabled);

    for (const item of activeItems) {
        if (!isSharedMultiGroupLessonItem(item) || linkedGroupsMap.has(item.id)) {
            continue;
        }

        const linkedItems = findLinkedLectureItemsInList(item, activeItems);
        const groupNames = extractLinkedGroupNames(linkedItems);

        for (const linkedItem of linkedItems) {
            linkedGroupsMap.set(linkedItem.id, groupNames);
        }
    }

    return linkedGroupsMap;
}
