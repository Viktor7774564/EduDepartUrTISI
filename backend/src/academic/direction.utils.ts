const DIRECTION_CODE_PATTERN = /^(\d{2}\.\d{2}\.\d{2})\s+(.+)$/;

export function extractDirectionCode(name: string): string | null {
    const trimmed = name.trim();
    const match = trimmed.match(/^(\d{2}\.\d{2}\.\d{2})/);

    return match ? match[1] : null;
}

export function normalizeDirectionTitle(name: string): string {
    return name
        .replace(/^\d{2}\.\d{2}\.\d{2}\s*/, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

export function buildDirectionDisplayName(rawName: string): string {
    const trimmed = rawName.trim();
    const code = extractDirectionCode(trimmed);
    const title = trimmed.replace(/^\d{2}\.\d{2}\.\d{2}\s*/, '').replace(/\s+/g, ' ').trim();

    if (code && title) {
        return `${code} ${title}`;
    }

    return trimmed;
}

export function buildDirectionStorageCode(rawName: string): string {
    const code = extractDirectionCode(rawName.trim());

    if (code) {
        return code.replace(/\./g, '_');
    }

    return rawName
        .toLowerCase()
        .replace(/[^a-zа-я0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 50) || `direction_${Date.now()}`;
}

export function validateDirectionInput(rawName: string): {
    valid: boolean;
    message?: string;
} {
    const trimmed = rawName.trim();

    if (!trimmed) {
        return { valid: false, message: 'Укажите направление' };
    }

    if (!DIRECTION_CODE_PATTERN.test(trimmed)) {
        return {
            valid: false,
            message: 'Формат: код в начале и название через пробел, например 09.03.01 Информатика и вычислительная техника',
        };
    }

    return { valid: true };
}

export function directionsMatchByIdentity(leftName: string, rightName: string): boolean {
    const leftCode = extractDirectionCode(leftName);
    const rightCode = extractDirectionCode(rightName);

    return Boolean(leftCode && rightCode && leftCode === rightCode);
}
