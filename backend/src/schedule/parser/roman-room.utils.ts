export const ROMAN_BUILDING = 'Римская';

/** Римские аудитории в УК5: I, III, IV (и 1, 3, 4). */
export function isRomanRoomUk5(room: string): boolean {
    const normalized = room.trim().toUpperCase();

    return normalized.startsWith('III')
        || normalized.startsWith('IV')
        || normalized.startsWith('I ')
        || normalized.startsWith('1 ')
        || normalized.startsWith('3 ')
        || normalized.startsWith('4 ');
}

/** Римские аудитории в УК3: II, V, VI, VII, VIII (и 2, 5, 6, 7, 8). */
export function isRomanRoomUk3(room: string): boolean {
    const normalized = room.trim().toUpperCase();

    return normalized.startsWith('VIII')
        || normalized.startsWith('VII')
        || normalized.startsWith('VI ')
        || normalized.startsWith('V ')
        || normalized.startsWith('II ')
        || normalized.startsWith('8 ')
        || normalized.startsWith('7 ')
        || normalized.startsWith('6 ')
        || normalized.startsWith('5 ')
        || normalized.startsWith('2 ');
}

export function isRomanRoom(room: string): boolean {
    const normalized = room.trim().toUpperCase();

    if (!normalized || normalized.includes('УК')) {
        return false;
    }

    return isRomanRoomUk3(normalized) || isRomanRoomUk5(normalized);
}

export function getRomanBuilding(room: string): 'УК3' | 'УК5' | null {
    if (isRomanRoomUk5(room)) {
        return 'УК5';
    }

    if (isRomanRoomUk3(room)) {
        return 'УК3';
    }

    return null;
}
