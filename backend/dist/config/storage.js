"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorageRoot = getStorageRoot;
exports.getAvatarsDir = getAvatarsDir;
const node_path_1 = require("node:path");
function getStorageRoot() {
    return (0, node_path_1.join)(__dirname, '..', '..', 'storage');
}
function getAvatarsDir() {
    return (0, node_path_1.join)(getStorageRoot(), 'avatars');
}
//# sourceMappingURL=storage.js.map