import { join } from 'node:path';

export function getStorageRoot(): string {
    return join(__dirname, '..', '..', 'storage');
}

export function getAvatarsDir(): string {
    return join(getStorageRoot(), 'avatars');
}

export function getSchedulesDir(): string {
    return join(getStorageRoot(), 'schedules');
}
