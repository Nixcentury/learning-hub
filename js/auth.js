/* ==============================================================
   ระบบบัญชีกลางของ Learning Hub
   ดูแล Google Sign-In, Guest, Logout และการจำบัญชีเท่านั้น
   ระบบคนออนไลน์จะแยกไปอยู่ใน presence.js ในรอบถัดไป
================================================================ */

import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { firebaseApp } from "./firebase-config.js";

const guestStorageKey = "learning-hub-guest-session";
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const subscribers = new Set();

googleProvider.setCustomParameters({ prompt: "select_account" });

let currentSession = Object.freeze({
  status: "loading",
  isGuest: false,
  user: null,
});

function readGuestSession() {
  try {
    return sessionStorage.getItem(guestStorageKey) === "1";
  } catch {
    return false;
  }
}

function writeGuestSession(enabled) {
  try {
    if (enabled) {
      sessionStorage.setItem(guestStorageKey, "1");
    } else {
      sessionStorage.removeItem(guestStorageKey);
    }
  } catch {
    // Guest ยังใช้ได้ในหน้าปัจจุบัน แม้เบราว์เซอร์ปิด Session Storage
  }
}

function toHubUser(user) {
  if (!user) return null;

  return Object.freeze({
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
  });
}

function publishSession(status, user = null) {
  currentSession = Object.freeze({
    status,
    isGuest: status === "guest",
    user: toHubUser(user),
  });

  subscribers.forEach((subscriber) => subscriber(currentSession));
  document.dispatchEvent(
    new CustomEvent("hub-auth-change", { detail: currentSession }),
  );
}

const persistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Learning Hub could not set Firebase persistence.", error);
});

persistenceReady.finally(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      writeGuestSession(false);
      publishSession("signed-in", user);
      return;
    }

    publishSession(readGuestSession() ? "guest" : "signed-out");
  });
});

export function getAuthSession() {
  return currentSession;
}

export function waitForAuthSession() {
  if (currentSession.status !== "loading") {
    return Promise.resolve(currentSession);
  }

  return new Promise((resolve) => {
    const unsubscribe = subscribeAuth((session) => {
      if (session.status === "loading") return;
      unsubscribe();
      resolve(session);
    });
  });
}

export function subscribeAuth(subscriber) {
  subscribers.add(subscriber);
  subscriber(currentSession);
  return () => subscribers.delete(subscriber);
}

export async function signInWithGoogle() {
  if (location.protocol === "file:") {
    const error = new Error("Google Sign-In requires GitHub Pages or localhost.");
    error.code = "hub/file-protocol";
    throw error;
  }

  writeGuestSession(false);
  publishSession("loading");

  try {
    await persistenceReady;
    const result = await signInWithPopup(auth, googleProvider);
    publishSession("signed-in", result.user);
    return getAuthSession();
  } catch (error) {
    publishSession("signed-out");
    throw error;
  }
}

export async function continueAsGuest() {
  writeGuestSession(true);

  if (auth.currentUser) {
    await firebaseSignOut(auth);
  }

  publishSession("guest");
  return getAuthSession();
}

export async function signOutFromHub() {
  writeGuestSession(false);

  if (auth.currentUser) {
    await firebaseSignOut(auth);
  }

  publishSession("signed-out");
}

window.HubAuth = Object.freeze({
  getSession: getAuthSession,
  waitForSession: waitForAuthSession,
  subscribe: subscribeAuth,
  signInWithGoogle,
  continueAsGuest,
  signOut: signOutFromHub,
});
