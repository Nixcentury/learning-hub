import "../css/pwa.css";

async function startOnlineFirst() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  // Resolve from the HTML, not the bundled JS in assets/.
  const scope = new URL("./", document.baseURI);
  const registration = await navigator.serviceWorker.register(new URL("sw.js", scope), {
    scope: scope.href,
    updateViaCache: "none",
  });

  const notice = document.querySelector("#hub-update-notice");
  let shownWorker;
  const showWaiting = () => {
    const { active, waiting } = registration;
    if (!active || !waiting || waiting === shownWorker) return;
    shownWorker = waiting;
    notice.hidden = false;
  };
  const watchInstall = () => {
    registration.installing?.addEventListener("statechange", showWaiting);
    showWaiting();
  };
  notice.querySelector("button").addEventListener("click", () => { notice.hidden = true; });
  registration.addEventListener("updatefound", watchInstall);
  watchInstall();

  // Let the browser switch workers only after existing Hub clients close.
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
