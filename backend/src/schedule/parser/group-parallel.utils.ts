export function getParallelKey(groupName: string): string | null {
    const normalized = groupName.trim().toUpperCase();

    const higherMatch = normalized.match(/^([А-ЯA-Z]+)-(\d)/);
    if (higherMatch) {
        return `${higherMatch[1]}-${higherMatch[2]}`;
    }

    const spoMatch = normalized.match(/^(\d{2})\d$/);
    if (spoMatch) {
        return spoMatch[1];
    }

    return null;
}

export function areParallelGroups(first: string, second: string): boolean {
    const firstKey = getParallelKey(first);
    const secondKey = getParallelKey(second);

    return firstKey !== null && firstKey === secondKey && first !== second;
}

export function extractGroupNameFromTitle(title: string): string | null {
    const match = title.match(/РАСПИСАНИЕ\s+гр\.?\s*(.+?)\s*$/i);
    return match?.[1]?.trim() ?? null;
}
