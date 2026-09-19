/* ==============================================================
   สัญญาบริบทกลางของ Learning Hub
   - กำหนดรหัสของเนื้อหาให้ Quiz, Simulation และ Notebook ใช้ร่วมกัน
   - ข้อมูลนี้ช่วยระบุตำแหน่งงาน แต่ไม่ใช่หลักฐานยืนยันตัวตนสำหรับ Cloud
================================================================ */

export const hubContextVersion = 1;

const supportedLanguages = new Set(["th", "en"]);
const supportedRoles = new Set(["student", "teacher", "admin"]);
const safeContextIdPattern = /^[a-z0-9][a-z0-9_-]{0,127}$/;

function normalizeContextId(value, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return safeContextIdPattern.test(normalized) ? normalized : fallback;
}

export function createContentContext({
  subjectId,
  chapterId,
  toolKind,
  contentId,
  itemId = "main",
  pageId = "page-001",
}) {
  const safeSubjectId = normalizeContextId(subjectId, "subject");
  const safeChapterId = normalizeContextId(chapterId, "1");
  const safeToolKind = normalizeContextId(toolKind, "activity");
  const defaultContentId = `${safeSubjectId}-c${safeChapterId}-${safeToolKind}`;

  return Object.freeze({
    subjectId: safeSubjectId,
    chapterId: safeChapterId,
    toolKind: safeToolKind,
    contentId: normalizeContextId(contentId, defaultContentId),
    itemId: normalizeContextId(itemId, "main"),
    pageId: normalizeContextId(pageId, "page-001"),
  });
}

export function createIdentityContext(session) {
  const uid =
    session?.status === "signed-in" ? String(session.user?.uid ?? "").trim() : "";
  const isSignedIn = Boolean(uid);
  const isGuest = session?.status === "guest" || session?.isGuest === true;

  return Object.freeze({
    status: isSignedIn ? "signed-in" : isGuest ? "guest" : "signed-out",
    uid: isSignedIn ? uid : null,
    isGuest,
  });
}

export function createHubContextMessage({
  language,
  role,
  identity,
  content = null,
}) {
  const safeIdentity = identity ?? createIdentityContext(null);

  return {
    type: "learning-hub-context",
    version: hubContextVersion,
    language: supportedLanguages.has(language) ? language : "th",
    role: supportedRoles.has(role) ? role : "student",
    identity: {
      status: safeIdentity.status,
      uid: safeIdentity.uid,
      isGuest: safeIdentity.isGuest === true,
    },
    content: content ? { ...content } : null,
  };
}
