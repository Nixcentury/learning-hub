/* ==============================================================
   สิทธิ์บัญชีกลางของ Learning Hub
   - บัญชีใหม่เป็นนักเรียนเสมอ
   - สิทธิ์ครูและแอดมินอ่านจาก Firebase เท่านั้น
   - ผู้ใช้ส่งคำขอเป็นครูได้ แต่อนุมัติตัวเองไม่ได้
================================================================ */

import {
  get,
  getDatabase,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAuthSession, subscribeAuth } from "./auth.js";
import { firebaseApp } from "./firebase-config.js";

const database = getDatabase(firebaseApp);
const roleRoot = "learningHub";
const subscribers = new Set();

let activeUser = null;
let activeGeneration = 0;
let roleUnsubscribers = [];
let roleValues = { admin: false, teacher: false, request: null };
let readyKeys = new Set();
let roleErrors = new Set();

let currentRole = Object.freeze({
  uid: null,
  status: "signed-out",
  systemRole: "student",
  isAdmin: false,
  isTeacher: false,
  requestStatus: "none",
  request: null,
  error: "",
});

function publishRole(nextRole) {
  currentRole = Object.freeze(nextRole);
  subscribers.forEach((subscriber) => subscriber(currentRole));
  document.dispatchEvent(new CustomEvent("hub-role-change", { detail: currentRole }));
}

function clearRoleListeners() {
  roleUnsubscribers.forEach((unsubscribe) => unsubscribe());
  roleUnsubscribers = [];
}

function isEnabled(value) {
  return value === true || (value !== null && typeof value === "object" && value.enabled === true);
}

function publishSignedInRole() {
  const denied = roleErrors.has("admin") || roleErrors.has("teacher");
  const ready = readyKeys.size === 3 && !denied;
  // The admin marker is boolean true in the existing Rules; malformed values
  // and partially loaded/failed permissions never grant privileged UI access.
  const isAdmin = ready && roleValues.admin === true;
  const isTeacher = ready && (isAdmin || isEnabled(roleValues.teacher));
  const systemRole = isAdmin ? "admin" : isTeacher ? "teacher" : "student";
  const requestStatus = isTeacher
    ? "approved"
    : roleValues.request?.status || "none";

  publishRole({
    uid: activeUser?.uid || null,
    status: denied ? "error" : ready ? "ready" : "loading",
    systemRole,
    isAdmin,
    isTeacher,
    requestStatus,
    request: roleValues.request,
    error: [...roleErrors].join(","),
  });
}

function watchRoleValue(key, path, generation) {
  const unsubscribe = onValue(
    ref(database, path),
    (snapshot) => {
      if (generation !== activeGeneration) return;
      roleValues[key] = snapshot.exists() ? snapshot.val() : key === "request" ? null : false;
      readyKeys.add(key);
      roleErrors.delete(key);
      publishSignedInRole();
    },
    (error) => {
      if (generation !== activeGeneration) return;
      console.warn(`Learning Hub could not read ${key} role data.`, error);
      roleValues[key] = key === "request" ? null : false;
      readyKeys.add(key);
      roleErrors.add(key);
      publishSignedInRole();
    },
  );

  roleUnsubscribers.push(unsubscribe);
}

async function ensureUserProfile(user, generation) {
  const profileRef = ref(database, `${roleRoot}/profiles/${user.uid}`);

  try {
    const snapshot = await get(profileRef);
    if (generation !== activeGeneration) return;

    const profile = {
      displayName: user.displayName || "",
      email: user.email || "",
      updatedAt: serverTimestamp(),
    };

    if (!snapshot.exists()) profile.createdAt = serverTimestamp();
    await update(profileRef, profile);
    if (generation !== activeGeneration) return;
    if (roleErrors.delete("profile")) publishSignedInRole();
  } catch (error) {
    if (generation !== activeGeneration) return;
    console.warn("Learning Hub could not update the user profile.", error);
    roleErrors.add("profile");
    publishSignedInRole();
  }
}

function startRoleSession(user) {
  activeGeneration += 1;
  const generation = activeGeneration;
  clearRoleListeners();

  activeUser = user;
  roleValues = { admin: false, teacher: false, request: null };
  readyKeys = new Set();
  roleErrors = new Set();
  publishSignedInRole();

  watchRoleValue("admin", `${roleRoot}/admins/${user.uid}`, generation);
  watchRoleValue(
    "teacher",
    `${roleRoot}/teacherApprovals/${user.uid}`,
    generation,
  );
  watchRoleValue(
    "request",
    `${roleRoot}/teacherRequests/${user.uid}`,
    generation,
  );

  void ensureUserProfile(user, generation);
}

function stopRoleSession(status = "signed-out") {
  activeGeneration += 1;
  clearRoleListeners();
  activeUser = null;
  roleValues = { admin: false, teacher: false, request: null };
  readyKeys = new Set();
  roleErrors = new Set();
  publishRole({
    uid: null,
    status,
    systemRole: status === "guest" ? "guest" : "student",
    isAdmin: false,
    isTeacher: false,
    requestStatus: "none",
    request: null,
    error: "",
  });
}

function cleanField(value, maximumLength) {
  return String(value || "").trim().slice(0, maximumLength);
}

function requireSignedInUser() {
  const session = getAuthSession();
  if (session.status === "signed-in" && activeUser?.uid === session.user?.uid) return activeUser;

  const error = new Error("A Google account is required.");
  error.code = "hub/role-sign-in-required";
  throw error;
}

export function getRoleState() {
  return currentRole;
}

export function subscribeRoles(subscriber) {
  subscribers.add(subscriber);
  subscriber(currentRole);
  return () => subscribers.delete(subscriber);
}

export function retryRoleCheck() {
  const session = getAuthSession();
  if (session.status === "signed-in" && session.user) startRoleSession(session.user);
}

export async function requestTeacherAccess({ school, subjects, note = "" }) {
  const user = requireSignedInUser();
  const cleanSchool = cleanField(school, 120);
  const cleanSubjects = cleanField(subjects, 160);
  const cleanNote = cleanField(note, 300);

  if (!cleanSchool || !cleanSubjects) {
    const error = new Error("School and subjects are required.");
    error.code = "hub/role-request-incomplete";
    throw error;
  }

  if (currentRole.isTeacher) {
    const error = new Error("This account already has teacher access.");
    error.code = "hub/role-already-approved";
    throw error;
  }

  await set(ref(database, `${roleRoot}/teacherRequests/${user.uid}`), {
    status: "pending",
    displayName: user.displayName || "",
    email: user.email || "",
    school: cleanSchool,
    subjects: cleanSubjects,
    note: cleanNote,
    requestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function cancelTeacherRequest() {
  const user = requireSignedInUser();

  if (currentRole.requestStatus !== "pending") return;
  await remove(ref(database, `${roleRoot}/teacherRequests/${user.uid}`));
}

subscribeAuth((session) => {
  if (session.status === "signed-in" && session.user) {
    if (activeUser?.uid !== session.user.uid) startRoleSession(session.user);
    return;
  }

  stopRoleSession(session.status === "guest" ? "guest" : "signed-out");
});

window.HubRoles = Object.freeze({
  getState: getRoleState,
  subscribe: subscribeRoles,
  requestTeacherAccess,
  cancelTeacherRequest,
  retry: retryRoleCheck,
});
