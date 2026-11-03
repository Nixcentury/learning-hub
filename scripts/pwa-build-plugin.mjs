import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export function pwaBuildPlugin() {
  const worker = readFileSync(new URL("./pwa-worker.js", import.meta.url), "utf8");
  const offlinePage = readFileSync(new URL("./pwa-offline.html", import.meta.url), "utf8");

  return {
    name: "learning-hub-online-first",
    apply: "build",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        // Keep the URL stable; a new build changes the worker bytes instead.
        const revision = createHash("sha256")
          .update(JSON.stringify([process.env.GITHUB_SHA ?? "", Object.keys(bundle).sort()]))
          .digest("hex");
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: `// Hub build ${revision}\nconst OFFLINE_PAGE = ${JSON.stringify(offlinePage)};\n${worker}`,
        });
      },
    },
  };
}
