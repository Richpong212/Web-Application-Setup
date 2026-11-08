// Farm administration stays owner-only. These grants cover operational work only.
export const permissionNames = [
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
] as const;

export type Permission = (typeof permissionNames)[number];
export type TeamRole = "Manager" | "Worker";

export const defaultPermissions: Record<TeamRole, readonly Permission[]> = {
  // Importing history is an explicit owner-delegated grant, including for managers.
  Manager: permissionNames.filter(name => name !== "records.import"),
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

export const resolvePermissions = (
  role: string,
  grants: string[] | null,
): Permission[] => {
  const permissions = new Set<Permission>(
    (grants ??
      defaultPermissions[
        role === "Manager" ? "Manager" : "Worker"
      ]) as Permission[],
  );
  for (const name of [...permissions]) {
    if (
      name.endsWith(".write") ||
      name.endsWith(".correct") ||
      name.endsWith(".import") ||
      name.endsWith(".complete")
    )
      permissions.add(`${name.split(".")[0]}.read` as Permission);
  }
  if (
    permissions.has("records.read") ||
    permissions.has("health.read") ||
    permissions.has("feed.read") ||
    permissions.has("reports.read")
  )
    permissions.add("flocks.read");
  return permissionNames.filter((name) => permissions.has(name));
};
