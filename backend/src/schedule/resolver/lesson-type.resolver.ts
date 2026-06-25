import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LessonType, LessonTypeCode } from '../entities/lesson-type.entity';

@Injectable()
export class LessonTypeResolver {
    constructor(
        @InjectRepository(LessonType)
        private readonly lessonTypesRepository: Repository<LessonType>,
    ) {}

    private mapRawToCode(raw: string): LessonTypeCode {
        const value = raw.trim().toLowerCase();

        if (value.startsWith('лек')) return LessonTypeCode.LECTURE;
        if (value.startsWith('практ')) return LessonTypeCode.PRACTICE;
        if (value.startsWith('лаб')) return LessonTypeCode.LAB;
        if (value.includes('зач')) return LessonTypeCode.CREDIT;
        if (value.includes('куратор')) return LessonTypeCode.PRACTICE; // или отдельный code

        return LessonTypeCode.PRACTICE; // fallback
    }

    private mapCodeToName(code: LessonTypeCode, raw: string): string {
        if (raw.toLowerCase().includes('куратор')) {
            return 'Кураторский час';
        }

        switch (code) {
            case LessonTypeCode.LECTURE: return 'Лекция';
            case LessonTypeCode.PRACTICE: return 'Практика';
            case LessonTypeCode.LAB: return 'Лаб. раб.';
            case LessonTypeCode.CREDIT: return 'Зачёт';
            default: return raw.trim();
        }
    }

    async resolve(rawLessonType: string): Promise<LessonType> {
        const code = this.mapRawToCode(rawLessonType);
        const name = this.mapCodeToName(code, rawLessonType);

        let lessonType = await this.lessonTypesRepository.findOne({
            where: { name },
        });

        if (!lessonType) {
            lessonType = await this.lessonTypesRepository.findOne({
                where: { code },
            });
        }

        if (!lessonType) {
            lessonType = await this.lessonTypesRepository.save(
                this.lessonTypesRepository.create({ code, name }),
            );
        }

        return lessonType;
    }
}