/* global OFFLINE_PAGE */
const hub = new URL(self.registration.scope);
const entryPath = new URL("index.html", hub).pathname;

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  const url = new URL(request.url);
  if (url.origin !== hub.origin || (url.pathname !== hub.pathname && url.pathname !== entryPath)) return;

  // Only handle entry documents. Keep lesson, quiz, API and account requests
  // on their existing paths, and let the server's HTTP responses pass through.
  event.respondWith(fetch(request, { cache: "no-cache" }).catch(() => new Response(OFFLINE_PAGE, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })));
});
