/* ==============================================================
   JavaScript ของ Learning Hub
   ดูแลภาษา หน้าหลัก แท็บ และนำสถานะจากระบบบัญชีกลางมาแสดง
   Firebase และขั้นตอน Login อยู่ใน auth.js เพื่อให้หน้าอื่นใช้ร่วมกันได้
================================================================ */

import {
  continueAsGuest,
  signInWithGoogle,
  signOutFromHub,
  subscribeAuth,
} from "./auth.js";
import {
  setPresenceContext,
  stopPresence,
  subscribePresence,
} from "./presence.js";
import {
  cancelTeacherRequest,
  requestTeacherAccess,
  retryRoleCheck,
  subscribeRoles,
} from "./roles.js";
import { createClassroomAccess } from "./classroom-access.js";
import { createFirebaseClassrooms } from "./classroom-firebase.js";
import {
  createHubContextMessage,
  createIdentityContext,
} from "./content-context.js";
import { createWorkspace } from "./workspace.js";
import "./quiz-progress.js";

const languageStorageKey = "learning-hub-language";

const loginView = document.querySelector("#login-view");
const hubView = document.querySelector("#hub-view");
const googleButton = document.querySelector("#google-button");
const guestButton = document.querySelector("#guest-button");
const signOutButton = document.querySelector("#sign-out-button");
const authNotice = document.querySelector("#auth-notice");
const authNoticeIcon = document.querySelector("#auth-notice-icon");
const authNoticeText = document.querySelector("#auth-notice-text");
const accountChip = document.querySelector("#account-chip");
const accountAvatar = document.querySelector("#account-avatar");
const accountName = document.querySelector("#account-name");
const accountDetail = document.querySelector("#account-detail");
const presenceButton = document.querySelector("#presence-button");
const presenceDot = document.querySelector("#presence-dot");
const presenceCount = document.querySelector("#presence-count");
const presenceBackdrop = document.querySelector("#presence-backdrop");
const presencePanel = document.querySelector("#presence-panel");
const presenceClose = document.querySelector("#presence-close");
const presenceOnlineTotal = document.querySelector("#presence-online-total");
const presenceIdleTotal = document.querySelector("#presence-idle-total");
const presenceVisibleTotal = document.querySelector("#presence-visible-total");
const presenceMessage = document.querySelector("#presence-message");
const presenceList = document.querySelector("#presence-list");
const roleButton = document.querySelector("#role-button");
const roleLabel = document.querySelector("#role-label");
const roleBackdrop = document.querySelector("#role-backdrop");
const rolePanel = document.querySelector("#role-panel");
const roleClose = document.querySelector("#role-close");
const roleSummaryIcon = document.querySelector("#role-summary-icon");
const roleStatusTitle = document.querySelector("#role-status-title");
const roleStatusDetail = document.querySelector("#role-status-detail");
const roleMessage = document.querySelector("#role-message");
const roleLoading = document.querySelector("#role-loading");
const roleApproved = document.querySelector("#role-approved");
const adminPageLink = document.querySelector("#admin-page-link");
const roleRequestStatus = document.querySelector("#role-request-status");
const cancelRoleRequest = document.querySelector("#cancel-role-request");
const teacherRequestForm = document.querySelector("#teacher-request-form");
const submitRoleRequest = document.querySelector("#submit-role-request");
const languageButtons = document.querySelectorAll("[data-language]");
const navButtons = document.querySelectorAll("[data-section]");
const pageFrame = document.querySelector("#hub-page-frame");
const pageFrameLoading = document.querySelector("#hub-frame-loading");
const workspaceWindowLayer = document.querySelector("#workspace-window-layer");
const hubTaskbar = document.querySelector("#hub-taskbar");
const taskbarItems = document.querySelector("#taskbar-items");
const workspaceCount = document.querySelector("#workspace-count");

const fallbackAvatar = accountAvatar.src;
let currentLanguage = readSavedLanguage();
let activeSession = { status: "loading", isGuest: false, user: null };
let activePresence = {
  connectionStatus: "OFFLINE",
  rows: [],
  counts: { online: 0, idle: 0, visible: 0, active: 0 },
  error: "",
};
let activeRole = {
  status: "signed-out",
  systemRole: "student",
  isAdmin: false,
  isTeacher: false,
  requestStatus: "none",
  request: null,
  error: "",
};
let presenceReturnFocus = null;
let roleReturnFocus = null;
let activeSectionId = "overview";
let classroomPageRevision = 0;
let classroomRooms = null;
const classrooms = createFirebaseClassrooms(snapshot => {
  classroomRooms = snapshot;
  postContextToPage();
});

function syncClassrooms() {
  classrooms.setContext(activeSession, activeRole, activeSectionId === "classroom");
}

function getWorkspaceIdentity() {
  return createIdentityContext(activeSession);
}

function getWorkspaceRole() {
  return createClassroomAccess(activeSession, activeRole).state === "teacher"
    ? activeRole.systemRole : "student";
}

const workspace = createWorkspace({
  windowLayer: workspaceWindowLayer,
  taskbar: hubTaskbar,
  taskbarItems,
  countElement: workspaceCount,
  getLanguage: () => currentLanguage,
  getIdentity: getWorkspaceIdentity,
  getRole: getWorkspaceRole,
  onToolClosed: (toolId) => pageFrame.contentWindow?.postMessage(
    { type: "learning-hub-tool-closed", toolId }, location.origin,
  ),
});

function readSavedLanguage() {
  try {
    return localStorage.getItem(languageStorageKey) === "en" ? "en" : "th";
  } catch {
    return "th";
  }
}

function saveLanguage(language) {
  try {
    localStorage.setItem(languageStorageKey, language);
  } catch {
    // หากเบราว์เซอร์ปิดการบันทึก ภาษาในหน้าปัจจุบันยังใช้งานได้ตามปกติ
  }
}

function postContextToPage() {
  const targetOrigin = location.origin === "null" ? "*" : location.origin;
  pageFrame.contentWindow?.postMessage(
    {
      ...createHubContextMessage({
        language: currentLanguage,
        role: getWorkspaceRole(),
        identity: getWorkspaceIdentity(),
      }),
      classroom: createClassroomAccess(activeSession, activeRole),
      classroomRooms: activeSectionId === "classroom" && classroomRooms?.uid === activeSession.user?.uid ? classroomRooms : null,
    },
    targetOrigin,
  );
}

function renderAccount(session) {
  accountChip.classList.remove("has-error");
  accountChip.removeAttribute("title");

  if (session.status === "signed-in" && session.user) {
    accountName.textContent =
      session.user.displayName || session.user.email || "Learning Hub user";
    accountDetail.textContent =
      session.user.email ||
      (currentLanguage === "th" ? "เชื่อมบัญชี Google แล้ว" : "Google account connected");
    accountAvatar.src = session.user.photoURL || fallbackAvatar;
    return;
  }

  accountName.textContent = currentLanguage === "th" ? "ผู้เยี่ยมชม" : "Guest";
  accountDetail.textContent =
    currentLanguage === "th" ? "ไม่บันทึกบน Cloud" : "Not saved to the cloud";
  accountAvatar.src = fallbackAvatar;
}

function closeRolePanel() {
  rolePanel.hidden = true;
  rolePanel.setAttribute("aria-hidden", "true");
  roleBackdrop.hidden = true;
  roleButton.setAttribute("aria-expanded", "false");
  roleReturnFocus?.focus();
  roleReturnFocus = null;
}

function openRolePanel() {
  if (roleButton.hidden) return;
  if (!presencePanel.hidden) closePresencePanel();
  roleReturnFocus = document.activeElement;
  rolePanel.hidden = false;
  rolePanel.setAttribute("aria-hidden", "false");
  roleBackdrop.hidden = false;
  roleButton.setAttribute("aria-expanded", "true");
  roleClose.focus();
}

function setRoleMessage(messageTh, messageEn, tone = "info") {
  roleMessage.textContent = currentLanguage === "th" ? messageTh : messageEn;
  roleMessage.classList.toggle("is-error", tone === "error");
  roleMessage.hidden = false;
}

function renderRole(role) {
  activeRole = role;
  syncClassrooms();
  const access = createClassroomAccess(activeSession, role);
  const ready = ["student", "teacher"].includes(access.state);
  role = {
    ...role,
    status: ready ? "ready" : access.state,
    systemRole: access.state === "teacher" ? role.systemRole : "student",
    isTeacher: access.state === "teacher",
    isAdmin: access.state === "teacher" && role.isAdmin === true,
  };
  postContextToPage();
  workspace.setContext();
  const isSignedIn = activeSession.status === "signed-in";
  roleButton.hidden = !isSignedIn;

  if (!isSignedIn) closeRolePanel();

  const labels = {
    student: ["นักเรียน", "Student", "♙"],
    teacher: ["ครู", "Teacher", "♜"],
    admin: ["แอดมิน", "Admin", "♛"],
  };
  const [labelTh, labelEn, icon] = labels[role.systemRole] || labels.student;
  roleLabel.textContent = currentLanguage === "th" ? labelTh : labelEn;
  roleSummaryIcon.textContent = icon;
  roleButton.querySelector(".role-button-icon").textContent = icon;

  roleLoading.hidden = role.status !== "loading";
  roleApproved.hidden = role.status !== "ready" || !role.isTeacher;
  adminPageLink.hidden = !role.isAdmin;
  roleRequestStatus.hidden =
    role.status !== "ready" || role.isTeacher || role.requestStatus !== "pending";
  teacherRequestForm.hidden =
    role.status !== "ready" || role.isTeacher || role.requestStatus === "pending";
  roleMessage.hidden = true;
  roleMessage.classList.remove("is-error");

  if (role.status === "loading") {
    roleLabel.textContent = currentLanguage === "th" ? "กำลังตรวจสิทธิ์" : "Checking access";
    roleStatusTitle.textContent = currentLanguage === "th" ? "กำลังตรวจสิทธิ์" : "Checking access";
    roleStatusDetail.textContent =
      currentLanguage === "th"
        ? "ระบบกำลังอ่านสิทธิ์จาก Firebase"
        : "Reading access from Firebase";
    return;
  }

  if (role.status === "error") {
    roleLabel.textContent = currentLanguage === "th" ? "ตรวจสิทธิ์ไม่สำเร็จ" : "Access unavailable";
    roleStatusTitle.textContent = roleLabel.textContent;
    roleStatusDetail.textContent = currentLanguage === "th"
      ? "ยังยืนยันสิทธิ์ไม่ได้ กรุณาลองตรวจใหม่ในแท็บห้องเรียน"
      : "Access could not be verified. Retry in the Classroom tab.";
    return;
  }

  roleStatusTitle.textContent = currentLanguage === "th" ? labelTh : labelEn;
  const detail = {
    student: [
      "ใช้บทเรียนและเข้าร่วมห้องเรียนได้",
      "Can use lessons and join classrooms",
    ],
    teacher: [
      "ได้รับอนุมัติให้ใช้เครื่องมือครู",
      "Approved to use teacher tools",
    ],
    admin: [
      "จัดการสิทธิ์ครูและระบบหลังบ้านได้",
      "Can manage teacher access and admin tools",
    ],
  }[role.systemRole] || ["", ""];
  roleStatusDetail.textContent = currentLanguage === "th" ? detail[0] : detail[1];

  if (role.error) {
    setRoleMessage(
      "ข้อมูลบัญชีบางส่วนยังไม่พร้อม กรุณาลองใหม่หรือตรวจการเชื่อมต่อและสิทธิ์ฐานข้อมูล",
      "Some account data is unavailable. Retry or check the connection and database permissions.",
      "error",
    );
  } else if (role.requestStatus === "rejected") {
    setRoleMessage(
      "คำขอก่อนหน้านี้ยังไม่ได้รับอนุมัติ คุณแก้ข้อมูลแล้วส่งใหม่ได้",
      "The previous request was not approved. You can update the details and submit again.",
    );
  } else if (role.requestStatus === "revoked") {
    setRoleMessage(
      "สิทธิ์ครูของบัญชีนี้ถูกถอน หากต้องการใช้อีกครั้งสามารถส่งคำขอใหม่ได้",
      "Teacher access was revoked. You can submit a new request if access is needed again.",
    );
  }
}

function closePresencePanel() {
  presencePanel.hidden = true;
  presencePanel.setAttribute("aria-hidden", "true");
  presenceBackdrop.hidden = true;
  presenceButton.setAttribute("aria-expanded", "false");
  presenceReturnFocus?.focus();
  presenceReturnFocus = null;
}

function openPresencePanel() {
  if (presenceButton.hidden) return;
  if (!rolePanel.hidden) closeRolePanel();
  presenceReturnFocus = document.activeElement;
  presencePanel.hidden = false;
  presencePanel.setAttribute("aria-hidden", "false");
  presenceBackdrop.hidden = false;
  presenceButton.setAttribute("aria-expanded", "true");
  presenceClose.focus();
}

function renderPresence(presence) {
  activePresence = presence;
  const isSignedIn = activeSession.status === "signed-in";
  presenceButton.hidden = !isSignedIn;

  if (!isSignedIn) {
    closePresencePanel();
  }

  const statusClass = presence.connectionStatus.toLowerCase();
  presenceDot.className = `presence-dot ${statusClass}`;
  presenceCount.textContent = String(presence.counts.active);
  presenceOnlineTotal.textContent = String(presence.counts.online);
  presenceIdleTotal.textContent = String(presence.counts.idle);
  presenceVisibleTotal.textContent = String(presence.counts.visible);

  presenceMessage.classList.toggle("is-error", Boolean(presence.error));

  if (presence.error) {
    presenceMessage.textContent =
      currentLanguage === "th"
        ? "ยังอ่านรายชื่อออนไลน์ไม่ได้ กรุณาตรวจสิทธิ์ Firebase ของ quizPresence"
        : "Online people are unavailable. Check Firebase permissions for quizPresence.";
  } else if (presence.connectionStatus === "OFFLINE") {
    presenceMessage.textContent =
      currentLanguage === "th"
        ? "กำลังเชื่อมต่อระบบคนออนไลน์"
        : "Connecting to live presence";
  } else {
    presenceMessage.textContent =
      currentLanguage === "th"
        ? `เชื่อมต่อแล้ว · กำลังใช้งาน ${presence.counts.active} คน`
        : `Connected · ${presence.counts.active} active`;
  }

  presenceList.replaceChildren();

  if (!presence.rows.length) {
    const empty = document.createElement("p");
    empty.className = "presence-empty";
    empty.textContent = presence.error
      ? currentLanguage === "th"
        ? "ระบบ Login ยังใช้ได้ตามปกติ แต่ต้องปรับ Database Rules ก่อนแสดงรายชื่อ"
        : "Login still works, but Database Rules must be updated before showing people."
      : currentLanguage === "th"
        ? "ยังไม่มีผู้ใช้ที่แสดงใน Learning Hub"
        : "No visible users in the Learning Hub yet.";
    presenceList.append(empty);
    return;
  }

  const lockedList = document.createElement("p");
  lockedList.className = "presence-empty";
  lockedList.textContent =
    currentLanguage === "th"
      ? "🔒 รายชื่อบุคคลจะเปิดเฉพาะบัญชีครูและแอดมินที่ได้รับอนุมัติ หลังเชื่อมระบบบทบาท"
      : "🔒 Names will be available only to approved teacher and admin accounts after roles are connected.";
  presenceList.append(lockedList);
}

function setLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-th][data-en]").forEach((element) => {
    element.textContent = element.dataset[language];
  });

  document.querySelectorAll("[data-aria-th][data-aria-en]").forEach((element) => {
    const label = language === "th" ? element.dataset.ariaTh : element.dataset.ariaEn;
    element.setAttribute("aria-label", label);
    element.setAttribute("title", label);
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.language === language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  const description =
    language === "th"
      ? "พื้นที่รวมบทเรียน ห้องเรียน แบบทดสอบ และห้องทดลองจำลองในที่เดียว"
      : "One place for lessons, classrooms, quizzes, and simulations.";

  document.querySelector('meta[name="description"]').setAttribute("content", description);
  renderAccount(activeSession);
  renderPresence(activePresence);
  renderRole(activeRole);
  postContextToPage();
  workspace.setLanguage(language);
  saveLanguage(language);
}

function showHub() {
  loginView.hidden = true;
  hubView.hidden = false;
  pageFrame.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showLogin(preserveNotice = false) {
  workspace.clear();
  hubView.hidden = true;
  loginView.hidden = false;
  if (!preserveNotice) authNotice.hidden = true;
  document.querySelector("#login-heading")?.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setAuthBusy(isBusy) {
  googleButton.disabled = isBusy;
  guestButton.disabled = isBusy;
  googleButton.setAttribute("aria-busy", String(isBusy));
  guestButton.setAttribute("aria-busy", String(isBusy));
}

function setAuthNotice(messageTh, messageEn, tone = "info") {
  authNoticeText.dataset.th = messageTh;
  authNoticeText.dataset.en = messageEn;
  authNoticeText.textContent = currentLanguage === "th" ? messageTh : messageEn;
  authNotice.classList.toggle("is-error", tone === "error");
  authNotice.classList.toggle("is-success", tone === "success");
  authNotice.setAttribute("role", tone === "error" ? "alert" : "status");
  authNotice.setAttribute("aria-live", tone === "error" ? "assertive" : "polite");
  authNoticeIcon.textContent = tone === "error" ? "!" : tone === "success" ? "✓" : "●";
  authNotice.hidden = false;
}

function authErrorMessage(error) {
  const code = error?.code || "unknown";

  const messages = {
    "hub/file-protocol": [
      "Google Login ต้องเปิดผ่าน localhost หรือ GitHub Pages",
      "Open the Hub through localhost or GitHub Pages to use Google Login.",
    ],
    "auth/popup-blocked": [
      "เบราว์เซอร์ปิดกั้นหน้าต่าง Google กรุณาอนุญาต Pop-up แล้วลองอีกครั้ง",
      "Your browser blocked the Google window. Allow pop-ups and try again.",
    ],
    "auth/popup-closed-by-user": [
      "ยกเลิกการเข้าสู่ระบบแล้ว คุณสามารถลองใหม่ได้เมื่อพร้อม",
      "Sign-in was cancelled. You can try again when ready.",
    ],
    "auth/cancelled-popup-request": [
      "มีหน้าต่างเข้าสู่ระบบเปิดอยู่แล้ว กรุณาใช้หน้าต่างนั้น",
      "A sign-in window is already open. Please continue there.",
    ],
    "auth/unauthorized-domain": [
      "Firebase ยังไม่อนุญาตโดเมนนี้ ต้องเพิ่มโดเมน GitHub Pages ใน Authorized Domains",
      "Firebase does not allow this domain yet. Add the GitHub Pages domain to Authorized Domains.",
    ],
    "auth/network-request-failed": [
      "เชื่อมต่อ Google ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง",
      "Could not reach Google. Check your connection and try again.",
    ],
  };

  return (
    messages[code] || [
      `เข้าสู่ระบบไม่สำเร็จ (${code}) กรุณาลองอีกครั้ง`,
      `Sign-in failed (${code}). Please try again.`,
    ]
  );
}

function renderSession(session) {
  if (activeSession.user?.uid !== session.user?.uid || activeSession.status !== session.status) {
    closeRolePanel();
    teacherRequestForm.reset();
    roleMessage.hidden = true;
    submitRoleRequest.disabled = false;
    cancelRoleRequest.disabled = false;
  }
  activeSession = session;
  renderAccount(session);
  renderPresence(activePresence);
  renderRole(activeRole);

  if (session.status === "loading") {
    showLogin(true);
    setAuthBusy(true);
    setAuthNotice(
      "กำลังตรวจสอบบัญชีที่เคยเข้าสู่ระบบ",
      "Checking your saved account",
    );
    return;
  }

  setAuthBusy(false);

  if (session.status === "signed-in" || session.status === "guest") {
    authNotice.hidden = true;
    showHub();
    return;
  }

  showLogin();
}

function showSection(sectionId, updateHistory = true) {
  const activeButton = [...navButtons].find(
    (button) => button.dataset.section === sectionId,
  );
  if (!activeButton) return;

  activeSectionId = sectionId;
  ++classroomPageRevision;
  syncClassrooms();
  navButtons.forEach((button) => {
    const isActive = button.dataset.section === sectionId;
    button.classList.toggle("is-active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  const pageUrl = new URL(activeButton.dataset.pageSrc, location.href);
  pageUrl.searchParams.set("lang", currentLanguage);
  pageFrameLoading.hidden = false;
  pageFrame.src = pageUrl.href;
  pageFrame.title = activeButton.textContent.trim();

  if (updateHistory) {
    history.pushState({ sectionId }, "", `#${sectionId}`);
  }

  setPresenceContext({ sectionId });
}

setLanguage(currentLanguage);

languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

googleButton.addEventListener("click", async () => {
  setAuthBusy(true);
  setAuthNotice("กำลังเปิดหน้าต่าง Google", "Opening Google Sign-In");

  try {
    await signInWithGoogle();
  } catch (error) {
    const [messageTh, messageEn] = authErrorMessage(error);
    setAuthBusy(false);
    setAuthNotice(messageTh, messageEn, "error");
  }
});

guestButton.addEventListener("click", async () => {
  setAuthBusy(true);
  try {
    await stopPresence();
    await continueAsGuest();
  } catch (error) {
    console.warn("Learning Hub could not start guest mode.", error);
    setAuthBusy(false);
    setAuthNotice(
      "เปิดโหมดผู้เยี่ยมชมไม่สำเร็จ กรุณาลองอีกครั้ง",
      "Could not start guest mode. Please try again.",
      "error",
    );
  }
});

signOutButton.addEventListener("click", async () => {
  signOutButton.disabled = true;
  try {
    if (!await workspace.prepareAllForClose()) return;
    await stopPresence();
    await signOutFromHub();
  } catch (error) {
    console.warn("Learning Hub could not sign out.", error);
    renderSession(activeSession);
    const message =
      currentLanguage === "th"
        ? "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง"
        : "Could not sign out. Please try again.";
    accountChip.classList.add("has-error");
    accountChip.setAttribute("title", message);
    accountDetail.textContent = message;
  } finally {
    signOutButton.disabled = false;
  }
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => showSection(button.dataset.section));
});

pageFrame.addEventListener("load", () => {
  pageFrameLoading.hidden = true;
  postContextToPage();
});

window.addEventListener("message", (event) => {
  const trustedOrigin = location.origin === "null" || event.origin === location.origin;
  if (!trustedOrigin || event.source !== pageFrame.contentWindow) return;
  if (event.data?.type === "learning-hub-page-ready") {
    postContextToPage();
    return;
  }
  if (event.data?.type === "learning-hub-classroom-action" && activeSectionId === "classroom") {
    if (event.data.action === "sign-in" && activeSession.status === "guest") googleButton.click();
    if (event.data.action === "account" && activeSession.status === "signed-in") openRolePanel();
    if (event.data.action === "retry" && activeSession.status === "signed-in") retryRoleCheck();
    return;
  }
  if (event.data?.type === "learning-hub-classroom-command" && activeSectionId === "classroom") {
    const { action, payload, uid, requestId } = event.data;
    if (typeof requestId !== "string" || requestId.length > 100 || uid !== activeSession.user?.uid) return;
    const revision = classroomPageRevision;
    const reply = result => {
      if (revision !== classroomPageRevision || activeSectionId !== "classroom" || activeSession.user?.uid !== uid) return;
      event.source.postMessage({ type: "learning-hub-classroom-result", requestId, uid, ...result }, event.origin);
    };
    void classrooms.command(action, payload, uid).then(
      result => reply({ ok: true, result }),
      error => reply({ ok: false, error: String(error?.code || error?.message || "classroom/unavailable") }),
    );
    return;
  }
  if (event.data?.type === "learning-hub-open-content") {
    const ok = workspace.openContent(event.data.content);
    event.source.postMessage({
      type: "learning-hub-content-opened", requestId: event.data.requestId, ok,
    }, event.origin === "null" ? "*" : event.origin);
    return;
  }
  if (event.data?.type !== "learning-hub-open-tool") return;

  workspace.open(event.data.toolId);
});

window.addEventListener("popstate", () => {
  const sectionId = location.hash.slice(1) || "overview";
  showSection(sectionId, false);
});

presenceButton.addEventListener("click", () => {
  if (presencePanel.hidden) {
    openPresencePanel();
  } else {
    closePresencePanel();
  }
});

presenceClose.addEventListener("click", closePresencePanel);
presenceBackdrop.addEventListener("click", closePresencePanel);

roleButton.addEventListener("click", () => {
  if (rolePanel.hidden) {
    openRolePanel();
  } else {
    closeRolePanel();
  }
});

roleClose.addEventListener("click", closeRolePanel);
roleBackdrop.addEventListener("click", closeRolePanel);

teacherRequestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const requestSession = activeSession;
  submitRoleRequest.disabled = true;

  try {
    const formData = new FormData(teacherRequestForm);
    await requestTeacherAccess({
      school: formData.get("school"),
      subjects: formData.get("subjects"),
      note: formData.get("note"),
    });
    if (activeSession !== requestSession) return;
    teacherRequestForm.reset();
    setRoleMessage(
      "ส่งคำขอแล้ว บัญชีจะยังเป็นนักเรียนระหว่างรอแอดมินตรวจสอบ",
      "Request submitted. The account remains a student while an admin reviews it.",
    );
  } catch (error) {
    if (activeSession !== requestSession) return;
    console.warn("Learning Hub could not submit the teacher request.", error);
    setRoleMessage(
      "ส่งคำขอไม่ได้ กรุณาตรวจ Firebase Rules ของรอบ 3 แล้วลองอีกครั้ง",
      "Could not submit the request. Check the Round 3 Firebase Rules and try again.",
      "error",
    );
  } finally {
    if (activeSession === requestSession) submitRoleRequest.disabled = false;
  }
});

cancelRoleRequest.addEventListener("click", async () => {
  const requestSession = activeSession;
  cancelRoleRequest.disabled = true;

  try {
    await cancelTeacherRequest();
  } catch (error) {
    if (activeSession !== requestSession) return;
    console.warn("Learning Hub could not cancel the teacher request.", error);
    setRoleMessage(
      "ยกเลิกคำขอไม่ได้ กรุณาลองอีกครั้ง",
      "Could not cancel the request. Please try again.",
      "error",
    );
  } finally {
    if (activeSession === requestSession) cancelRoleRequest.disabled = false;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !presencePanel.hidden) closePresencePanel();
  if (event.key === "Escape" && !rolePanel.hidden) closeRolePanel();
});

document.querySelectorAll(".brand").forEach((brandLink) => {
  brandLink.addEventListener("click", (event) => event.preventDefault());
});

accountAvatar.addEventListener("error", () => {
  if (accountAvatar.src !== fallbackAvatar) accountAvatar.src = fallbackAvatar;
});

subscribeAuth(renderSession);
subscribePresence(renderPresence);
subscribeRoles(renderRole);

const initialSectionId = location.hash.slice(1) || activeSectionId;
showSection(initialSectionId, false);

setInterval(() => {
  if (!presencePanel.hidden) renderPresence(activePresence);
}, 30_000);
