// Revalidate the owned player assets before navigating. This updates the HTTP
// cache, including static module dependencies; it never clears site storage.
export async function warmQuizEngine(playerUrl = location.href) {
  const next = new URL(playerUrl);
  next.searchParams.set("quizRefresh", `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const base = new URL("../../", next);
  const seen = new Map();
  const owned = url => url.origin === next.origin &&
    ["shared/", "pages/tools/"].some(path => url.pathname.startsWith(new URL(path, base).pathname));
  async function read(url) {
    const response = await fetch(url, { cache: "reload", credentials: "same-origin", signal: controller.signal });
    if (!response.ok) throw new Error(`Update request failed (${response.status})`);
    return response.text();
  }
  function visit(url) {
    if (!owned(url) || !/\.(?:js|css)$/.test(url.pathname)) return Promise.resolve();
    if (seen.has(url.href)) return Promise.resolve();
    if (seen.size >= 80) throw new Error("Too many quiz assets");
    const task = read(url).then(async source => {
      if (!url.pathname.endsWith(".js")) return;
      const imports = [...source.matchAll(/^\s*(?:import|export)\s+(?:[^;"']*?\s+from\s*)?["']([^"']+)["']/gm)];
      await Promise.all(imports.filter(match => match[1].startsWith(".")).map(match => visit(new URL(match[1], url))));
    });
    seen.set(url.href, task);
    return task;
  }
  try {
    const html = new DOMParser().parseFromString(await read(next), "text/html");
    if (!html.querySelector("[data-quiz-shell]")) throw new Error("The updated quiz player is unavailable");
    await Promise.all([...html.querySelectorAll("script[src], link[rel=stylesheet][href]")]
      .map(node => visit(new URL(node.getAttribute("src") || node.getAttribute("href"), next))));
    return next.href;
  } finally { clearTimeout(timeout); }
}
