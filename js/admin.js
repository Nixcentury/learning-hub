import {
  getAuthSession,
  signInWithGoogle,
  signOutFromHub,
  subscribeAuth,
} from "./auth.js";
import {
  approveTeacher,
  rejectTeacher,
  revokeTeacher,
  subscribeAdminDirectory,
} from "./role-admin.js";
import { getRoleState, subscribeRoles } from "./roles.js";

const languageStorageKey = "learning-hub-language";
const fallbackAvatar = document.querySelector("#admin-avatar").src;

const loadingView = document.querySelector("#admin-loading");
const signedOutView = document.querySelector("#admin-signed-out");
const deniedView = document.querySelector("#admin-denied");
const dashboardView = document.querySelector("#admin-dashboard");
const googleButton = document.querySelector("#admin-google-button");
const loginFeedback = document.querySelector("#admin-login-feedback");
const deniedFeedback = document.querySelector("#admin-denied-feedback");
const account = document.querySelector("#admin-account");
const accountAvatar = document.querySelector("#admin-avatar");
const accountName = document.querySelector("#admin-account-name");
const signOutButton = document.querySelector("#admin-sign-out");
const currentUid = document.querySelector("#admin-current-uid");
const copyUidButton = document.querySelector("#copy-admin-uid");
const pendingCount = document.querySelector("#pending-count");
const teacherCount = document.querySelector("#teacher-count");
const pendingList = document.querySelector("#pending-list");
const teacherList = document.querySelector("#teacher-list");
const adminAlert = document.querySelector("#admin-alert");
const languageButtons = document.querySelectorAll("[data-language]");

let currentLanguage = readSavedLanguage();
let activeSession = getAuthSession();
let activeRole = getRoleState();
let activeDirectory = {
  status: "loading",
  pendingRequests: [],
  teachers: [],
  error: "",
};
let directoryUnsubscribe = null;
let directoryUid = "";

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
    // ภาษาในหน้าปัจจุบันยังใช้งานได้ แม้ปิด Local Storage
  }
}

function setLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-th][data-en]").forEach((element) => {
    element.textContent = element.dataset[language];
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.language === language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  saveLanguage(language);
  renderPage();
  renderDirectory(activeDirectory);
}

function hideAllViews() {
  loadingView.hidden = true;
  signedOutView.hidden = true;
  deniedView.hidden = true;
  dashboardView.hidden = true;
}

function showFeedback(element, messageTh, messageEn, isError = false) {
  element.textContent = currentLanguage === "th" ? messageTh : messageEn;
  element.classList.toggle("is-error", isError);
  element.hidden = false;
}

function stopDirectory() {
  directoryUnsubscribe?.();
  directoryUnsubscribe = null;
  directoryUid = "";
}

function startDirectory() {
  const uid = activeSession.user?.uid || "";
  if (!activeRole.isAdmin || !uid || directoryUid === uid) return;

  stopDirectory();
  directoryUid = uid;

  try {
    directoryUnsubscribe = subscribeAdminDirectory((directory) => {
      activeDirectory = directory;
      renderDirectory(directory);
    });
  } catch (error) {
    console.warn("Learning Hub could not open the admin directory.", error);
    showFeedback(
      adminAlert,
      "เปิดรายการสิทธิ์ไม่ได้ กรุณาตรวจ Firebase Rules ของรอบ 3",
      "Could not open access records. Check the Round 3 Firebase Rules.",
      true,
    );
  }
}

function renderAccount() {
  const user = activeSession.user;
  const isSignedIn = activeSession.status === "signed-in" && user;
  account.hidden = !isSignedIn;
  signOutButton.hidden = !isSignedIn;

  if (!isSignedIn) return;
  accountAvatar.src = user.photoURL || fallbackAvatar;
  accountName.textContent = user.displayName || user.email || "Learning Hub user";
}

function renderPage() {
  hideAllViews();
  renderAccount();

  if (activeSession.status === "loading") {
    loadingView.hidden = false;
    return;
  }

  if (activeSession.status !== "signed-in" || !activeSession.user) {
    stopDirectory();
    signedOutView.hidden = false;
    return;
  }

  if (activeRole.status === "loading") {
    loadingView.hidden = false;
    return;
  }

  if (!activeRole.isAdmin) {
    stopDirectory();
    deniedView.hidden = false;
    currentUid.textContent = activeSession.user.uid;

    if (activeRole.error) {
      showFeedback(
        deniedFeedback,
        "ยังอ่านสิทธิ์แอดมินไม่ได้ ต้องติดตั้ง Firebase Rules ของรอบ 3 ก่อน",
        "Admin access could not be read. Install the Round 3 Firebase Rules first.",
        true,
      );
    } else {
      deniedFeedback.hidden = true;
    }
    return;
  }

  dashboardView.hidden = false;
  startDirectory();
}

function formatDate(timestamp) {
  if (!timestamp) return currentLanguage === "th" ? "ไม่ระบุเวลา" : "No date";

  return new Intl.DateTimeFormat(currentLanguage === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function createElement(tagName, className, text = "") {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function createActionButton(action, uid, textTh, textEn, className) {
  const button = createElement(
    "button",
    className,
    currentLanguage === "th" ? textTh : textEn,
  );
  button.type = "button";
  button.dataset.action = action;
  button.dataset.uid = uid;
  return button;
}

function createRequestCard(request) {
  const card = createElement("article", "access-card");
  const person = createElement("div", "access-person");
  person.append(
    createElement(
      "strong",
      "",
      request.displayName || request.email || (currentLanguage === "th" ? "ไม่ระบุชื่อ" : "Unnamed user"),
    ),
    createElement("small", "", request.email || request.uid),
    createElement("small", "", formatDate(request.requestedAt)),
  );

  const actions = createElement("div", "access-actions");
  actions.append(
    createActionButton("approve", request.uid, "อนุมัติ", "Approve", "approve-button"),
    createActionButton("reject", request.uid, "ไม่อนุมัติ", "Reject", "reject-button"),
  );

  const details = createElement("div", "access-details");
  const schoolLabel = currentLanguage === "th" ? "โรงเรียน" : "School";
  const subjectLabel = currentLanguage === "th" ? "วิชาที่สอน" : "Subjects";
  details.append(
    createElement("div", "access-detail", `${schoolLabel}: ${request.school || "—"}`),
    createElement("div", "access-detail", `${subjectLabel}: ${request.subjects || "—"}`),
  );
  if (request.note) details.append(createElement("div", "access-detail is-wide", request.note));

  card.append(person, actions, details);
  return card;
}

function createTeacherCard(teacher) {
  const card = createElement("article", "access-card");
  const person = createElement("div", "access-person");
  person.append(
    createElement(
      "strong",
      "",
      teacher.displayName || teacher.email || (currentLanguage === "th" ? "บัญชีครู" : "Teacher account"),
    ),
    createElement("small", "", teacher.email || teacher.uid),
    createElement("small", "", formatDate(teacher.approvedAt)),
  );

  const actions = createElement("div", "access-actions");
  actions.append(
    createActionButton("revoke", teacher.uid, "ถอนสิทธิ์", "Revoke", "revoke-button"),
  );
  card.append(person, actions);
  return card;
}

function renderList(container, rows, createCard, emptyTh, emptyEn) {
  container.replaceChildren();
  if (!rows.length) {
    container.append(
      createElement("p", "admin-empty", currentLanguage === "th" ? emptyTh : emptyEn),
    );
    return;
  }

  rows.forEach((row) => container.append(createCard(row)));
}

function renderDirectory(directory) {
  pendingCount.textContent = String(directory.pendingRequests?.length || 0);
  teacherCount.textContent = String(directory.teachers?.length || 0);

  renderList(
    pendingList,
    directory.pendingRequests || [],
    createRequestCard,
    directory.status === "loading" ? "กำลังโหลดคำขอ" : "ไม่มีคำขอที่รอตรวจ",
    directory.status === "loading" ? "Loading requests" : "No pending requests",
  );
  renderList(
    teacherList,
    directory.teachers || [],
    createTeacherCard,
    directory.status === "loading" ? "กำลังโหลดบัญชีครู" : "ยังไม่มีบัญชีครูที่อนุมัติ",
    directory.status === "loading" ? "Loading teachers" : "No approved teachers yet",
  );

  if (directory.error) {
    showFeedback(
      adminAlert,
      "อ่านข้อมูลหลังบ้านไม่ครบ กรุณาตรวจ Firebase Rules ของรอบ 3",
      "Some admin data is unavailable. Check the Round 3 Firebase Rules.",
      true,
    );
  } else {
    adminAlert.hidden = true;
  }
}

async function runAdminAction(button) {
  const { action, uid } = button.dataset;
  if (!action || !uid) return;

  if (action === "revoke") {
    const confirmed = window.confirm(
      currentLanguage === "th"
        ? "ถอนสิทธิ์ครูของบัญชีนี้หรือไม่?"
        : "Revoke teacher access for this account?",
    );
    if (!confirmed) return;
  }

  button.disabled = true;
  try {
    if (action === "approve") await approveTeacher(uid);
    if (action === "reject") await rejectTeacher(uid);
    if (action === "revoke") await revokeTeacher(uid);
    showFeedback(
      adminAlert,
      "บันทึกการเปลี่ยนแปลงแล้ว",
      "The access change was saved.",
    );
  } catch (error) {
    console.warn("Learning Hub could not update teacher access.", error);
    showFeedback(
      adminAlert,
      "บันทึกไม่ได้ กรุณาตรวจสิทธิ์แอดมินและ Firebase Rules",
      "Could not save. Check admin access and Firebase Rules.",
      true,
    );
  } finally {
    button.disabled = false;
  }
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

googleButton.addEventListener("click", async () => {
  googleButton.disabled = true;
  loginFeedback.hidden = true;
  try {
    await signInWithGoogle();
  } catch (error) {
    console.warn("Learning Hub admin sign-in failed.", error);
    showFeedback(
      loginFeedback,
      "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
      "Sign-in failed. Please try again.",
      true,
    );
  } finally {
    googleButton.disabled = false;
  }
});

signOutButton.addEventListener("click", async () => {
  signOutButton.disabled = true;
  try {
    await signOutFromHub();
  } catch (error) {
    console.warn("Learning Hub admin sign-out failed.", error);
  } finally {
    signOutButton.disabled = false;
  }
});

copyUidButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(currentUid.textContent);
    showFeedback(deniedFeedback, "คัดลอก UID แล้ว", "UID copied");
  } catch {
    showFeedback(
      deniedFeedback,
      "คัดลอกอัตโนมัติไม่ได้ กรุณาเลือก UID ด้านบน",
      "Could not copy automatically. Select the UID above.",
      true,
    );
  }
});

pendingList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button) void runAdminAction(button);
});

teacherList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button) void runAdminAction(button);
});

accountAvatar.addEventListener("error", () => {
  if (accountAvatar.src !== fallbackAvatar) accountAvatar.src = fallbackAvatar;
});

subscribeAuth((session) => {
  activeSession = session;
  renderPage();
});

subscribeRoles((role) => {
  activeRole = role;
  renderPage();
});

setLanguage(currentLanguage);
