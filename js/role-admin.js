/* ==============================================================
   งานหลังบ้านสำหรับอนุมัติสิทธิ์ครู
   ไฟล์นี้ทำงานเฉพาะเมื่อ roles.js ยืนยันว่าเป็นแอดมินแล้ว
================================================================ */

import {
  getDatabase,
  onValue,
  ref,
  serverTimestamp,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAuthSession } from "./auth.js";
import { firebaseApp } from "./firebase-config.js";
import { getRoleState } from "./roles.js";

const database = getDatabase(firebaseApp);
const roleRoot = "learningHub";

function requireAdmin() {
  const session = getAuthSession();
  const role = getRoleState();

  if (session.status === "signed-in" && session.user && role.status === "ready" && role.uid === session.user.uid && role.isAdmin) {
    return session.user;
  }

  const error = new Error("Admin access is required.");
  error.code = "hub/admin-required";
  throw error;
}

function toEntries(value) {
  return value && typeof value === "object" ? Object.entries(value) : [];
}

function normalizeAdminData(requestsValue, approvalsValue, profilesValue) {
  const profiles = profilesValue || {};
  const requests = toEntries(requestsValue)
    .map(([uid, request]) => ({
      uid,
      displayName: request?.displayName || profiles[uid]?.displayName || "",
      email: request?.email || profiles[uid]?.email || "",
      school: request?.school || "",
      subjects: request?.subjects || "",
      note: request?.note || "",
      status: request?.status || "pending",
      requestedAt: Number(request?.requestedAt) || 0,
      reviewedAt: Number(request?.reviewedAt) || 0,
    }))
    .sort((a, b) => b.requestedAt - a.requestedAt);

  const teachers = toEntries(approvalsValue)
    .filter(([, approval]) => Boolean(approval) && (approval === true || approval.enabled !== false))
    .map(([uid, approval]) => ({
      uid,
      displayName: profiles[uid]?.displayName || "",
      email: profiles[uid]?.email || "",
      approvedAt: Number(approval?.approvedAt) || 0,
      approvedBy: approval?.approvedBy || "",
    }))
    .sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email));

  return {
    requests,
    pendingRequests: requests.filter((request) => request.status === "pending"),
    teachers,
  };
}

export function subscribeAdminDirectory(subscriber) {
  requireAdmin();

  let requestsValue = {};
  let approvalsValue = {};
  let profilesValue = {};
  let readyCount = 0;
  const readySources = new Set();
  const errors = new Set();

  function publish() {
    subscriber({
      status: readyCount === 3 ? "ready" : "loading",
      ...normalizeAdminData(requestsValue, approvalsValue, profilesValue),
      error: [...errors].join(","),
    });
  }

  function watch(source, path, assign) {
    return onValue(
      ref(database, path),
      (snapshot) => {
        assign(snapshot.exists() ? snapshot.val() : {});
        if (!readySources.has(source)) {
          readySources.add(source);
          readyCount += 1;
        }
        errors.delete(source);
        publish();
      },
      (error) => {
        console.warn(`Learning Hub admin could not read ${source}.`, error);
        if (!readySources.has(source)) {
          readySources.add(source);
          readyCount += 1;
        }
        errors.add(source);
        publish();
      },
    );
  }

  publish();
  const unsubscribers = [
    watch("requests", `${roleRoot}/teacherRequests`, (value) => {
      requestsValue = value;
    }),
    watch("approvals", `${roleRoot}/teacherApprovals`, (value) => {
      approvalsValue = value;
    }),
    watch("profiles", `${roleRoot}/profiles`, (value) => {
      profilesValue = value;
    }),
  ];

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

export async function approveTeacher(uid) {
  const admin = requireAdmin();
  const cleanUid = String(uid || "").trim();
  if (!cleanUid) throw new Error("Missing user uid.");

  await update(ref(database, roleRoot), {
    [`teacherApprovals/${cleanUid}`]: {
      enabled: true,
      approvedAt: serverTimestamp(),
      approvedBy: admin.uid,
    },
    [`teacherRequests/${cleanUid}/status`]: "approved",
    [`teacherRequests/${cleanUid}/reviewedAt`]: serverTimestamp(),
    [`teacherRequests/${cleanUid}/reviewedBy`]: admin.uid,
  });
}

export async function rejectTeacher(uid) {
  const admin = requireAdmin();
  const cleanUid = String(uid || "").trim();
  if (!cleanUid) throw new Error("Missing user uid.");

  await update(ref(database, roleRoot), {
    [`teacherRequests/${cleanUid}/status`]: "rejected",
    [`teacherRequests/${cleanUid}/reviewedAt`]: serverTimestamp(),
    [`teacherRequests/${cleanUid}/reviewedBy`]: admin.uid,
  });
}

export async function revokeTeacher(uid) {
  const admin = requireAdmin();
  const cleanUid = String(uid || "").trim();
  if (!cleanUid) throw new Error("Missing user uid.");

  await update(ref(database, roleRoot), {
    [`teacherApprovals/${cleanUid}`]: null,
    [`teacherRequests/${cleanUid}/status`]: "revoked",
    [`teacherRequests/${cleanUid}/reviewedAt`]: serverTimestamp(),
    [`teacherRequests/${cleanUid}/reviewedBy`]: admin.uid,
  });
}
