// This hint controls the startup view only; it never contains an identity or role.
const resumeKey = "learning-hub-resume-view";

export function rememberHubView(session) {
  if (session.status === "loading") return;
  try {
    if (session.status === "signed-in") localStorage.setItem(resumeKey, "1");
    else localStorage.removeItem(resumeKey);
  } catch { /* Restoring an account still works when storage is unavailable. */ }
}

export function shouldResumeHub() {
  try {
    if (localStorage.getItem(resumeKey) === "1") return true;
  } catch { /* Try the existing guest session separately. */ }
  try { return sessionStorage.getItem("learning-hub-guest-session") === "1"; }
  catch { return false; }
}

export function canOpenHubWorkspace(session) {
  return session.status === "signed-in" || session.status === "guest";
}

export function renderHubSessionView({ session, restoring, resume, loginView, hubView, pendingNotice }) {
  const pending = session.status === "loading" && restoring && resume;
  const showHub = pending || canOpenHubWorkspace(session);
  loginView.hidden = showHub;
  hubView.hidden = !showHub;
  pendingNotice.hidden = !pending;
  return { pending, showHub };
}
