/* ==============================================================
   ที่เก็บความคืบหน้า Quiz กลางของ Learning Hub
   - Quiz ลูกส่งคำขอผ่าน postMessage โดยไม่ตั้งค่า Firebase ซ้ำ
   - เก็บ Draft ล่าสุดสำหรับกลับมาทำต่อ และผลคะแนนล่าสุดเท่านั้น
================================================================ */

import {
  get,
  getDatabase,
  ref,
  serverTimestamp,
  set,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseApp } from "./firebase-config.js";
import { getAuthSession, subscribeAuth } from "./auth.js";
import { isWorkspaceQuizSource } from "./workspace.js";

const database = getDatabase(firebaseApp);
const safeIdPattern = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const messageTypes = new Set(["learning-hub-quiz-load", "learning-hub-quiz-save"]);
let sessionRevision = 0;
let previousSessionIdentity = null;

subscribeAuth((session) => {
  const identity = session.status === "signed-in" ? session.user?.uid : null;
  if (identity !== previousSessionIdentity) sessionRevision += 1;
  previousSessionIdentity = identity;
});

function reply(target, requestId, result) {
  const targetOrigin = location.origin === "null" ? "*" : location.origin;
  target?.postMessage(
    {
      type: "learning-hub-quiz-storage-result",
      requestId,
      ...result,
    },
    targetOrigin,
  );
}

function cleanRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("quiz-progress/invalid-record");
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > 80_000) throw new Error("quiz-progress/payload-too-large");
  return JSON.parse(serialized);
}

window.addEventListener("message", async (event) => {
  const trustedOrigin = location.origin === "null" || event.origin === location.origin;
  const message = event.data;
  if (!trustedOrigin || !messageTypes.has(message?.type) || !isWorkspaceQuizSource(event.source)) return;

  const requestId = String(message.requestId || "");
  const contentId = String(message.contentId || "").trim().toLowerCase();
  const requestedUid = String(message.uid || "");
  const session = getAuthSession();
  const uid = session.status === "signed-in" ? session.user?.uid : "";
  const requestRevision = sessionRevision;
  const respond = (result) => {
    if (!isWorkspaceQuizSource(event.source)) return;
    reply(event.source, requestId, { uid: requestedUid, contentId, ...result });
  };
  const sessionIsCurrent = () => {
    const current = getAuthSession();
    return requestRevision === sessionRevision &&
      current.status === "signed-in" && current.user?.uid === uid;
  };

  if (!requestId || requestId.length > 128 || !safeIdPattern.test(contentId)) {
    respond({ ok: false, code: "quiz-progress/invalid-request" });
    return;
  }
  if (!uid) {
    respond({ ok: false, code: "quiz-progress/sign-in-required" });
    return;
  }
  if (requestedUid !== uid) {
    respond({ ok: false, code: "quiz-progress/session-changed" });
    return;
  }

  const progressRef = ref(database, `quizProgress/${uid}/${contentId}`);
  try {
    if (message.type === "learning-hub-quiz-load") {
      const snapshot = await get(progressRef);
      if (!sessionIsCurrent()) {
        respond({ ok: false, code: "quiz-progress/session-changed" });
        return;
      }
      respond({
        ok: true,
        action: "load",
        value: snapshot.exists() ? snapshot.val() : null,
      });
      return;
    }

    const record = cleanRecord(message.value);
    await set(progressRef, {
      ...record,
      uid,
      contentId,
      updatedAt: serverTimestamp(),
    });
    respond(sessionIsCurrent()
      ? { ok: true, action: "save" }
      : { ok: false, code: "quiz-progress/session-changed" });
  } catch (error) {
    console.warn("Learning Hub could not sync quiz progress.", error);
    respond({
      ok: false,
      code: error?.code || error?.message || "quiz-progress/request-failed",
    });
  }
});
