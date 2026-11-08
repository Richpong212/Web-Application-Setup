"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePermissions = exports.defaultPermissions = exports.permissionNames = void 0;
// Farm administration stays owner-only. These grants cover operational work only.
exports.permissionNames = [
    "dashboard.read",
    "flocks.read",
    "flocks.write",
    "records.read",
    "records.write",
    "records.correct",
    "records.import",
    "feed.read",
    "feed.write",
    "health.read",
    "health.write",
    "health.complete",
    "tasks.read",
    "tasks.write",
    "tasks.complete",
    "reports.read",
];
exports.defaultPermissions = {
    // Importing history is an explicit owner-delegated grant, including for managers.
    Manager: exports.permissionNames.filter(name => name !== "records.import"),
    Worker: [
        "dashboard.read",
        "flocks.read",
        "records.read",
        "records.write",
        "feed.read",
        "health.read",
        "health.complete",
        "tasks.read",
        "tasks.complete",
    ],
};
const resolvePermissions = (role, grants) => {
    const permissions = new Set((grants !== null && grants !== void 0 ? grants : exports.defaultPermissions[role === "Manager" ? "Manager" : "Worker"]));
    for (const name of [...permissions]) {
        if (name.endsWith(".write") ||
            name.endsWith(".correct") ||
            name.endsWith(".import") ||
            name.endsWith(".complete"))
            permissions.add(`${name.split(".")[0]}.read`);
    }
    if (permissions.has("records.read") ||
        permissions.has("health.read") ||
        permissions.has("feed.read") ||
        permissions.has("reports.read"))
        permissions.add("flocks.read");
    return exports.permissionNames.filter((name) => permissions.has(name));
};
exports.resolvePermissions = resolvePermissions;
