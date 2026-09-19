// A presentation snapshot, never a replacement for Firebase Database Rules.
// Bind role results to their UID so a late result cannot decorate another account.
export function createClassroomAccess(session, role) {
  const user = session?.status === "signed-in" ? session.user : null;
  const uid = user?.uid || null;
  const base = { uid, displayName: user?.displayName || "", email: user?.email || "", requestStatus: "none" };
  if (session?.status === "loading") return { ...base, state: "loading" };
  if (!uid) return { ...base, state: "guest" };
  if (role?.uid !== uid) return { ...base, state: "loading" };
  if (role.status === "error") return { ...base, state: "error" };
  if (role.status !== "ready") return { ...base, state: "loading" };
  const teacher = role.isTeacher === true && ["teacher", "admin"].includes(role.systemRole);
  return {
    ...base,
    state: teacher ? "teacher" : "student",
    requestStatus: ["pending", "rejected", "revoked"].includes(role.requestStatus) ? role.requestStatus : "none",
    warning: Boolean(role.error),
  };
}
