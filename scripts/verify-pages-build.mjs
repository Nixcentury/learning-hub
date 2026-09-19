import assert from 'node:assert/strict';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
async function list(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? list(join(folder, entry.name)) : join(folder, entry.name)))).flat();
}
const publicRoot = join(root, 'public');
const publicFiles = await list(publicRoot);
for (const path of publicFiles) {
  const name = relative(publicRoot, path);
  assert.ok((await readFile(path)).equals(await readFile(join(dist, name))), `Published content differs: ${name}`);
}
for (const name of ['index.html', 'admin.html', 'pages/tools/quiz-player.html', 'pages/tools/notebook-preview.html', 'shared/quiz-core.js']) {
  assert.ok((await stat(join(dist, name))).isFile(), `Missing entry: ${name}`);
}
const base = new URL('https://example.test/learning-hub/');
for (const path of await list(dist)) {
  const name = relative(dist, path).replaceAll('\\', '/');
  assert.ok(!name.split('/').some(part => part === '.git' || part === 'node_modules' || part.startsWith('.env')), `Private/build source in artifact: ${name}`);
  assert.ok(!/^(?:firebase|scripts)\//.test(name), `Source-only folder in artifact: ${name}`);
  if (!name.endsWith('.html')) continue;
  const html = await readFile(path, 'utf8');
  for (const match of html.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/gi)) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), new URL(name, base));
    if (url.origin !== base.origin) continue;
    assert.ok(url.pathname.startsWith(base.pathname), `Resource escapes new site base: ${name} -> ${url.pathname}`);
    assert.ok((await stat(join(dist, decodeURIComponent(url.pathname.slice(base.pathname.length))))).isFile(), `Missing resource in ${name}: ${match[1]}`);
  }
}
await writeFile(join(dist, '.nojekyll'), '');
await writeFile(join(dist, 'deployment.json'), JSON.stringify({
  repository: process.env.GITHUB_REPOSITORY || 'Nixcentury/learning-hub',
  commit: process.env.GITHUB_SHA || null,
  buildTime: new Date().toISOString(),
  publicFiles: publicFiles.length,
}, null, 2) + '\n');
console.log(`Pages artifact verified: ${publicFiles.length} public files are identical; HTML resources stay under /learning-hub/.`);
