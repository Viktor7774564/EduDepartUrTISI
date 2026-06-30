import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LessonTypeCode } from './entities/lesson-type.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import {
    areLinkedSharedLessonItems,
    extractLinkedGroupNames,
    isSharedMultiGroupLessonItem,
} from './linked-lecture.utils';

@Injectable()
export class LinkedLessonService {
    constructor(
        @InjectRepository(ScheduleItem)
        private readonly itemsRepository: Repository<ScheduleItem>,
    ) {}

    async findLinkedSharedLessonItems(item: ScheduleItem): Promise<ScheduleItem[]> {
        if (!isSharedMultiGroupLessonItem(item)) {
            return [item];
        }

        const groupName = item.schedule?.group?.name;

        if (!groupName) {
            return [item];
        }

        const query = this.itemsRepository
            .createQueryBuilder('item')
            .innerJoinAndSelect('item.schedule', 'schedule')
            .innerJoinAndSelect('schedule.group', 'group')
            .innerJoinAndSelect('item.subject', 'subject')
            .innerJoinAndSelect('item.lessonType', 'lessonType')
            .leftJoinAndSelect('item.teacher', 'teacher')
            .leftJoinAndSelect('item.room', 'room')
            .leftJoinAndSelect('item.subgroup', 'subgroup')
            .where('item.isDisabled = false')
            .andWhere('schedule.isActive = true')
            .andWhere('item.weekStart = :weekStart', { weekStart: item.weekStart })
            .andWhere('item.dayOfWeek = :dayOfWeek', { dayOfWeek: item.dayOfWeek })
            .andWhere('item.startTime = :startTime', { startTime: item.startTime })
            .andWhere('item.endTime = :endTime', { endTime: item.endTime })
            .andWhere('item.subjectId = :subjectId', { subjectId: item.subjectId })
            .andWhere('item.lessonTypeId = :lessonTypeId', { lessonTypeId: item.lessonTypeId })
            .andWhere('item.subgroupId IS NOT DISTINCT FROM :subgroupId', {
                subgroupId: item.subgroupId,
            })
            .andWhere('lessonType.code IN (:...lessonTypeCodes)', {
                lessonTypeCodes: [LessonTypeCode.LECTURE, LessonTypeCode.SPECIAL],
            });

        if (item.teacherId) {
            query.andWhere('item.teacherId = :teacherId', { teacherId: item.teacherId });
        } else {
            query.andWhere('item.legacyTeacherName IS NOT DISTINCT FROM :legacyTeacherName', {
                legacyTeacherName: item.legacyTeacherName,
            });
        }

        if (item.roomId) {
            query.andWhere('item.roomId = :roomId', { roomId: item.roomId });
        } else {
            query.andWhere('item.roomId IS NULL');
        }

        const candidates = await query.getMany();

        return candidates.filter((candidate) => areLinkedSharedLessonItems(item, candidate));
    }

    async buildLinkedGroupsMap(items: ScheduleItem[]): Promise<Map<number, string[]>> {
        const linkedGroupsMap = new Map<number, string[]>();
        const slotCache = new Map<string, string[]>();

        for (const item of items) {
            const groupName = item.schedule?.group?.name ?? '';

            if (!isSharedMultiGroupLessonItem(item)) {
                linkedGroupsMap.set(item.id, groupName ? [groupName] : []);
                continue;
            }

            const slotKey = [
                item.weekStart,
                item.dayOfWeek,
                item.startTime,
                item.endTime,
                item.subjectId,
                item.lessonTypeId,
                item.teacherId ?? '',
                item.legacyTeacherName ?? '',
                item.roomId ?? '',
                item.subgroupId ?? '',
            ].join('|');

            let groupNames = slotCache.get(slotKey);

            if (!groupNames) {
                const linkedItems = await this.findLinkedSharedLessonItems(item);
                groupNames = extractLinkedGroupNames(linkedItems);
                slotCache.set(slotKey, groupNames);
            }

            linkedGroupsMap.set(item.id, groupNames);
        }

        return linkedGroupsMap;
    }
}
