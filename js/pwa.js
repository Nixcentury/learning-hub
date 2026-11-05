import "../css/pwa.css";
import { createPwaUpdates } from './pwa-updates.js';
import { prepareHubReload } from './pwa-reload.js';

async function startOnlineFirst() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  // Resolve from the HTML, not the bundled JS in assets/.
  const scope = new URL("./", document.baseURI);
  const registration = await navigator.serviceWorker.register(new URL("sw.js", scope), {
    scope: scope.href,
    updateViaCache: "none",
  });

  createPwaUpdates({ registration, serviceWorker: navigator.serviceWorker,
    document, window, beforeReload: prepareHubReload });

  // Background checks only notify; they never reload an open workspace.
  const check = () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      registration.update().catch(() => {});
    }
  };
  document.addEventListener("visibilitychange", check);
  window.addEventListener("online", check);
  window.setInterval(check, 15 * 60 * 1000);
}

// Browsing the Hub still works when a browser disallows registration.
startOnlineFirst().catch(() => {});
