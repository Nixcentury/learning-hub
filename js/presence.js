/* ==============================================================
   ระบบสถานะออนไลน์กลางของ Learning Hub
   - แยกการเชื่อมต่อแต่ละแท็บ แล้วรวมผลตาม uid เพื่อไม่นับคนซ้ำ
   - เก็บเฉพาะสถานะและตำแหน่งใน Hub ไม่เก็บชื่อ อีเมล หรือรูป
================================================================ */

import {
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { subscribeAuth } from "./auth.js";
import { firebaseApp } from "./firebase-config.js";

const presenceScope = "learning-hub";
const idleAfterMs = 5 * 60 * 1000;
const offlineVisibleForMs = 6 * 60 * 60 * 1000;
const database = getDatabase(firebaseApp);
const subscribers = new Set();
const connectionId = createConnectionId();

let currentUser = null;
let connectionRef = null;
let disconnectRegistration = null;
let connectionUnsubscribe = null;
let presenceUnsubscribe = null;
let currentStatus = "OFFLINE";
let connectedAt = Date.now();
let lastActivityAt = Date.now();
let context = { sectionId: "overview" };
let presenceTask = Promise.resolve();
let readError = "";
let writeError = "";
let presenceState = Object.freeze({
  connectionStatus: "OFFLINE",
  rows: [],
  counts: Object.freeze({ online: 0, idle: 0, visible: 0, active: 0 }),
  error: "",
});

function createConnectionId() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanText(value, maximumLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function publishPresence(nextState) {
  presenceState = Object.freeze({
    ...presenceState,
    ...nextState,
  });

  subscribers.forEach((subscriber) => subscriber(presenceState));
  document.dispatchEvent(
    new CustomEvent("hub-presence-change", { detail: presenceState }),
  );
}

function emptyCounts() {
  return Object.freeze({ online: 0, idle: 0, visible: 0, active: 0 });
}

function currentError() {
  return writeError || readError;
}

function normalizePresence(rawPresence) {
  const cutoff = Date.now() - offlineVisibleForMs;
  const rows = [];

  Object.entries(rawPresence || {}).forEach(([uid, userConnections]) => {
    const records = userConnections?.status
      ? [userConnections]
      : Object.values(userConnections || {}).filter(
          (record) => record && typeof record === "object",
        );

    const recentRecords = records.filter((record) => {
      const status = cleanText(record.status, 12).toUpperCase();
      const lastActiveAt = Number(record.lastActiveAt || 0);
      return status !== "OFFLINE" || !lastActiveAt || lastActiveAt >= cutoff;
    });

    if (!recentRecords.length) return;

    const newestRecord = [...recentRecords].sort(
      (first, second) =>
        Number(second.lastActiveAt || 0) - Number(first.lastActiveAt || 0),
    )[0];

    const status = recentRecords.some((record) => record.status === "ONLINE")
      ? "ONLINE"
      : recentRecords.some((record) => record.status === "IDLE")
        ? "IDLE"
        : "OFFLINE";

    rows.push(
      Object.freeze({
        uid,
        status,
        sectionId: cleanText(newestRecord.sectionId, 48) || "overview",
        lastActiveAt: Math.max(
          ...recentRecords.map((record) => Number(record.lastActiveAt || 0)),
        ),
        isCurrentUser: uid === currentUser?.uid,
      }),
    );
  });

  const statusOrder = { ONLINE: 0, IDLE: 1, OFFLINE: 2 };
  rows.sort(
    (first, second) =>
      (statusOrder[first.status] ?? 9) - (statusOrder[second.status] ?? 9) ||
      second.lastActiveAt - first.lastActiveAt,
  );

  const online = rows.filter((row) => row.status === "ONLINE").length;
  const idle = rows.filter((row) => row.status === "IDLE").length;

  return {
    rows: Object.freeze(rows),
    counts: Object.freeze({
      online,
      idle,
      visible: rows.length,
      active: online + idle,
    }),
  };
}

async function writePresence(status = currentStatus) {
  if (!currentUser || !connectionRef) return;

  const normalizedStatus = ["ONLINE", "IDLE", "OFFLINE"].includes(status)
    ? status
    : "OFFLINE";

  currentStatus = normalizedStatus;
  publishPresence({ connectionStatus: normalizedStatus, error: currentError() });

  try {
    await set(connectionRef, {
      status: normalizedStatus,
      sectionId: cleanText(context.sectionId, 48) || "overview",
      connectedAt,
      lastActiveAt: serverTimestamp(),
    });
    writeError = "";
    publishPresence({ error: currentError() });
  } catch (error) {
    console.warn("Learning Hub could not write presence.", error);
    currentStatus = "OFFLINE";
    writeError = error?.code || "presence/write-failed";
    publishPresence({
      connectionStatus: "OFFLINE",
      error: currentError(),
    });
  }
}

async function startPresence(user) {
  if (!user?.uid || currentUser?.uid === user.uid) return;

  await stopPresence();
  currentUser = user;
  connectedAt = Date.now();
  lastActivityAt = Date.now();
  currentStatus = "OFFLINE";
  connectionRef = ref(
    database,
    `quizPresence/${presenceScope}/${user.uid}/${connectionId}`,
  );

  presenceUnsubscribe = onValue(
    ref(database, `quizPresence/${presenceScope}`),
    (snapshot) => {
      const normalized = normalizePresence(snapshot.val());
      readError = "";
      publishPresence({ ...normalized, error: currentError() });
    },
    (error) => {
      console.warn("Learning Hub could not read presence.", error);
      readError = error?.code || "presence/read-failed";
      publishPresence({
        rows: [],
        counts: emptyCounts(),
        error: currentError(),
      });
    },
  );

  connectionUnsubscribe = onValue(ref(database, ".info/connected"), (snapshot) => {
    if (snapshot.val() !== true) {
      currentStatus = "OFFLINE";
      publishPresence({ connectionStatus: "OFFLINE" });
      return;
    }

    disconnectRegistration = onDisconnect(connectionRef);
    disconnectRegistration
      .remove()
      .then(() => {
        const shouldBeIdle =
          document.visibilityState === "hidden" ||
          Date.now() - lastActivityAt >= idleAfterMs;
        return writePresence(shouldBeIdle ? "IDLE" : "ONLINE");
      })
      .catch((error) => {
        console.warn("Learning Hub could not register disconnect presence.", error);
        writeError = error?.code || "presence/disconnect-failed";
        publishPresence({
          connectionStatus: "OFFLINE",
          error: currentError(),
        });
      });
  });
}

export async function stopPresence() {
  const previousRef = connectionRef;
  const previousDisconnect = disconnectRegistration;
  const wasActive = ["ONLINE", "IDLE"].includes(currentStatus);

  connectionUnsubscribe?.();
  presenceUnsubscribe?.();
  connectionUnsubscribe = null;
  presenceUnsubscribe = null;
  connectionRef = null;
  disconnectRegistration = null;

  if (previousRef && currentUser && wasActive) {
    try {
      await remove(previousRef);
      await previousDisconnect?.cancel();
    } catch (error) {
      console.warn("Learning Hub could not close presence cleanly.", error);
    }
  }

  currentUser = null;
  currentStatus = "OFFLINE";
  readError = "";
  writeError = "";
  publishPresence({
    connectionStatus: "OFFLINE",
    rows: [],
    counts: emptyCounts(),
    error: "",
  });
}

export function setPresenceContext(nextContext = {}) {
  context = {
    ...context,
    sectionId: cleanText(nextContext.sectionId || context.sectionId, 48),
  };

  if (currentUser && ["ONLINE", "IDLE"].includes(currentStatus)) {
    void writePresence(currentStatus);
  }
}

export function getPresenceState() {
  return presenceState;
}

export function subscribePresence(subscriber) {
  subscribers.add(subscriber);
  subscriber(presenceState);
  return () => subscribers.delete(subscriber);
}

function markActive() {
  if (!currentUser) return;
  lastActivityAt = Date.now();
  if (currentStatus !== "ONLINE") void writePresence("ONLINE");
}

["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
  document.addEventListener(eventName, markActive, { passive: true });
});

document.addEventListener("visibilitychange", () => {
  if (!currentUser) return;

  if (document.visibilityState === "hidden") {
    void writePresence("IDLE");
  } else {
    markActive();
  }
});

setInterval(() => {
  if (
    currentUser &&
    Date.now() - lastActivityAt >= idleAfterMs &&
    currentStatus !== "IDLE"
  ) {
    void writePresence("IDLE");
  }
}, 30_000);

setInterval(() => {
  if (currentUser && currentStatus === "ONLINE") {
    void writePresence("ONLINE");
  }
}, 60_000);

subscribeAuth((session) => {
  presenceTask = presenceTask
    .then(() =>
      session.status === "signed-in" && session.user
        ? startPresence(session.user)
        : stopPresence(),
    )
    .catch((error) => {
      console.warn("Learning Hub presence transition failed.", error);
      writeError = error?.code || "presence/transition-failed";
      publishPresence({
        connectionStatus: "OFFLINE",
        error: currentError(),
      });
    });
});

window.HubPresence = Object.freeze({
  getState: getPresenceState,
  subscribe: subscribePresence,
  setContext: setPresenceContext,
  stop: stopPresence,
});
