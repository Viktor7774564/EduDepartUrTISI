import { networkInterfaces } from 'node:os';

const NGROK_HOST_SUFFIXES = [
    '.ngrok-free.dev',
    '.ngrok-free.app',
    '.ngrok.io',
    '.ngrok.app',
];

function parseOriginHostname(origin: string): string | null {
    try {
        return new URL(origin).hostname;
    } catch {
        return null;
    }
}

function isNgrokHostname(hostname: string): boolean {
    return NGROK_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

function getExtraAllowedOrigins(): string[] {
    const raw = process.env.CORS_EXTRA_ORIGINS?.trim();

    if (!raw) {
        return [];
    }

    return raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

export function isLocalNetworkOrigin(origin?: string): boolean {
    if (!origin) {
        return true;
    }

    const hostname = parseOriginHostname(origin);

    if (!hostname) {
        return false;
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
    }

    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return true;
    }

    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return true;
    }

    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return true;
    }

    return false;
}

export function isAllowedCorsOrigin(origin?: string): boolean {
    if (!origin) {
        return true;
    }

    if (isLocalNetworkOrigin(origin)) {
        return true;
    }

    const hostname = parseOriginHostname(origin);

    if (hostname && isNgrokHostname(hostname)) {
        return true;
    }

    return getExtraAllowedOrigins().includes(origin);
}

export function getLocalIpAddresses(): string[] {
    const interfaces = networkInterfaces();

    const addresses = new Set<string>();

    for (const entries of Object.values(interfaces)) {
        for (const entry of entries ?? []) {
            if (entry.family === 'IPv4' && !entry.internal) {
                addresses.add(entry.address);
            }
        }
    }

    return [...addresses];
}
