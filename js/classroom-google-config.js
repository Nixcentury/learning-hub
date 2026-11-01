// Public OAuth client ID only. A session-only value can also be entered in the
// teacher connection dialog while testing; no credential is stored there.
export const googleClassroomClientId = String(import.meta.env?.VITE_GOOGLE_CLASSROOM_CLIENT_ID || '').trim();
