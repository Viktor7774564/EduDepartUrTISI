"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLocalNetworkOrigin = isLocalNetworkOrigin;
exports.getLocalIpAddresses = getLocalIpAddresses;
const node_os_1 = require("node:os");
function isLocalNetworkOrigin(origin) {
    if (!origin) {
        return true;
    }
    try {
        const { hostname } = new URL(origin);
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
    catch {
        return false;
    }
}
function getLocalIpAddresses() {
    const interfaces = (0, node_os_1.networkInterfaces)();
    const addresses = new Set();
    for (const entries of Object.values(interfaces)) {
        for (const entry of entries ?? []) {
            if (entry.family === 'IPv4' && !entry.internal) {
                addresses.add(entry.address);
            }
        }
    }
    return [...addresses];
}
//# sourceMappingURL=network.js.map