"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParallelKey = getParallelKey;
exports.areParallelGroups = areParallelGroups;
exports.extractGroupNameFromTitle = extractGroupNameFromTitle;
function getParallelKey(groupName) {
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
function areParallelGroups(first, second) {
    const firstKey = getParallelKey(first);
    const secondKey = getParallelKey(second);
    return firstKey !== null && firstKey === secondKey && first !== second;
}
function extractGroupNameFromTitle(title) {
    const match = title.match(/РАСПИСАНИЕ\s+гр\.?\s*(.+?)\s*$/i);
    return match?.[1]?.trim() ?? null;
}
//# sourceMappingURL=group-parallel.utils.js.map