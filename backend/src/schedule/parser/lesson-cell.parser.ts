export interface ParsedLessonPart {
    subject: string;
    lessonType: string;
    subgroup: number | null;
    teacherPosition: string;
    teacherName: string;
    isSameCellParallel: boolean;
}

const TEACHER_POSITIONS = [
    'ст. преподаватель',
    'доцент',
    'профессор',
    'преподаватель',
] as const;

const TEACHER_NAME_PATTERN = /([А-ЯЁ][а-яё-]+)([А-ЯЁ]\.[А-ЯЁ]\.?)$/u;

function normalizeLessonType(raw: string): string {
    const value = raw.trim().replace(/;$/, '').toLowerCase();

    if (value.startsWith('лек')) return 'Лекция';
    if (value.startsWith('практ')) return 'Практика';
    if (value.startsWith('лаб')) return 'Лаб. раб.';
    if (value.includes('зач')) return 'Зачет';

    return raw.trim().replace(/;$/, '');
}

function formatTeacherName(raw: string): string {
    const match = raw.trim().match(TEACHER_NAME_PATTERN);
    if (!match) {
        return raw.trim();
    }

    return `${match[1]} ${match[2]}`;
}

function isFullLessonSegment(segment: string): boolean {
    const semicolonIndex = segment.indexOf(';');
    if (semicolonIndex === -1) {
        return false;
    }

    const colonIndex = segment.indexOf(':');
    return colonIndex === -1 || semicolonIndex < colonIndex;
}

function extractSubgroupFromText(text: string): { cleaned: string; subgroup: number | null } {
    const beforeMatch = text.match(/(\d+)\s*п\/гр\.?/i);
    if (beforeMatch) {
        return {
            subgroup: Number(beforeMatch[1]),
            cleaned: text.replace(beforeMatch[0], '').replace(/\s+/g, ' ').trim(),
        };
    }

    const afterMatch = text.match(/п\/гр\.?\s*:?\s*(\d+)/i);
    if (afterMatch) {
        return {
            subgroup: Number(afterMatch[1]),
            cleaned: text.replace(afterMatch[0], '').replace(/\s+/g, ' ').trim(),
        };
    }

    return {
        cleaned: text,
        subgroup: null,
    };
}

function extractPositionAndTeacher(part: string): {
    teacherPosition: string;
    teacherName: string;
    subgroup: number | null;
} {
    let text = part.trim().replace(/\s+/g, ' ');

    let subgroup: number | null = null;
    const subgroupMatch = text.match(/п\/гр\.?\s*:?\s*(\d+)/i);
    if (subgroupMatch) {
        subgroup = Number(subgroupMatch[1]);
        text = text.replace(subgroupMatch[0], '').trim();
    }

    const beforeSubgroupMatch = text.match(/(\d+)\s*п\/гр\.?/i);
    if (beforeSubgroupMatch) {
        subgroup = Number(beforeSubgroupMatch[1]);
        text = text.replace(beforeSubgroupMatch[0], '').trim();
    }

    let teacherPosition = '';
    for (const position of TEACHER_POSITIONS) {
        if (text.toLowerCase().startsWith(position)) {
            teacherPosition = position;
            text = text.slice(position.length).trim();
            break;
        }
    }

    return {
        teacherPosition,
        teacherName: formatTeacherName(text),
        subgroup,
    };
}

function parseLessonBlock(block: string): ParsedLessonPart[] {
    const text = block.replace(/\s+/g, ' ').trim();
    const semicolonIndex = text.indexOf(';');
    if (semicolonIndex === -1) {
        return [];
    }

    const subject = text.slice(0, semicolonIndex).trim();
    const rest = text.slice(semicolonIndex + 1).trim();
    const colonIndex = rest.indexOf(':');
    if (colonIndex === -1) {
        return [];
    }

    const typePart = rest.slice(0, colonIndex).trim();
    const { cleaned: cleanedType, subgroup: typeSubgroup } = extractSubgroupFromText(typePart);
    const lessonType = normalizeLessonType(cleanedType);
    const teachersPart = rest.slice(colonIndex + 1).trim();
    const teacherParts = teachersPart
        .split(/\s*\/\s*/)
        .map((part) => part.trim())
        .filter(Boolean);

    if (teacherParts.length === 0) {
        return [];
    }

    return teacherParts.map((part, index) => {
        const extracted = extractPositionAndTeacher(part);

        return {
            subject,
            lessonType,
            subgroup: extracted.subgroup ?? typeSubgroup ?? (teacherParts.length > 1 ? index + 1 : null),
            teacherPosition: extracted.teacherPosition,
            teacherName: extracted.teacherName,
            isSameCellParallel: false,
        };
    });
}

const SUBGROUP_SLASH_PLACEHOLDER = '§';

function protectSubgroupSlash(text: string): string {
    return text.replace(/п\s*\/\s*гр/gi, `п${SUBGROUP_SLASH_PLACEHOLDER}гр`);
}

function restoreSubgroupSlash(text: string): string {
    return text.replace(new RegExp(`п${SUBGROUP_SLASH_PLACEHOLDER}гр`, 'gi'), 'п/гр');
}

function splitLessonBlocks(rawText: string): string[] {
    const text = protectSubgroupSlash(rawText).replace(/\s+/g, ' ').trim();
    const segments = text.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
    const blocks: string[] = [];
    let currentBlock = '';

    for (const segment of segments) {
        const restoredSegment = restoreSubgroupSlash(segment);

        if (isFullLessonSegment(restoredSegment)) {
            if (currentBlock) {
                blocks.push(restoreSubgroupSlash(currentBlock));
            }
            currentBlock = restoredSegment;
            continue;
        }

        if (!currentBlock) {
            continue;
        }

        currentBlock = `${currentBlock} / ${restoredSegment}`;
    }

    if (currentBlock) {
        blocks.push(restoreSubgroupSlash(currentBlock));
    }

    return blocks;
}

export function parseLessonCell(rawText: string): ParsedLessonPart[] {
    const text = rawText.replace(/\s+/g, ' ').trim();

    if (/^час\s+куратора\.?$/i.test(text)) {
        return [{
            subject: 'Час куратора',
            lessonType: 'Кураторский час',
            subgroup: null,
            teacherPosition: '',
            teacherName: '',
            isSameCellParallel: false,
        }];
    }

    const blocks = splitLessonBlocks(rawText);
    if (blocks.length === 0) {
        return [];
    }

    const hasParallelDisciplines = blocks.length > 1;
    const subjects = new Set(
        blocks
            .map((block) => block.slice(0, block.indexOf(';')).trim())
            .filter(Boolean),
    );
    const isParallelPair = hasParallelDisciplines && subjects.size > 1;

    const parts = blocks.flatMap((block) =>
        parseLessonBlock(block).map((part) => ({
            ...part,
            isSameCellParallel: isParallelPair,
        })),
    );

    const subgroups = parts
        .map((part) => part.subgroup)
        .filter((subgroup): subgroup is number => subgroup !== null);
    const hasDistinctSubgroups = subgroups.length === parts.length
        && new Set(subgroups).size === parts.length;

    if (isParallelPair && hasDistinctSubgroups) {
        return parts.map((part) => ({
            ...part,
            isSameCellParallel: false,
        }));
    }

    return parts;
}

export function isDistanceRoom(room: string | null | undefined): boolean {
    if (!room) {
        return false;
    }

    return /дист/i.test(room);
}

export function isAuditoriumRoomLabel(room: string | null | undefined): boolean {
    if (!room?.trim()) {
        return false;
    }

    const normalized = room
        .trim()
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .replace(/,/g, ' ');

    if (/^С\.?$/.test(normalized)) {
        return true;
    }

    if (/\bС\s*\/\s*З\b/.test(normalized)) {
        return true;
    }

    if (/\bТ\s*\/\s*З\b/.test(normalized)) {
        return true;
    }

    if (/^V\s*Р\.?$/.test(normalized)) {
        return true;
    }

    return false;
}

export function isSharedMultiHallRoom(room: string | null | undefined): boolean {
    return isAuditoriumRoomLabel(room);
}

export function splitRoomForSubgroups(
    room: string | null | undefined,
    partsCount: number,
): (string | null)[] {
    const count = Math.max(partsCount, 1);

    if (!room?.trim()) {
        return Array.from({ length: count }, () => null);
    }

    const trimmed = room.trim();

    if (isAuditoriumRoomLabel(trimmed)) {
        return Array.from({ length: count }, () => trimmed);
    }

    if (count <= 1) {
        return [trimmed];
    }

    const slashParts = trimmed
        .split(/\s*\/\s*/)
        .map((part) => part.trim())
        .filter(Boolean);

    if (slashParts.length === count && !slashParts.some((part) => isAuditoriumRoomLabel(part))) {
        return slashParts;
    }

    return Array.from({ length: count }, () => trimmed);
}
