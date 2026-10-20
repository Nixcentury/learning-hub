import { readFile, realpath, readdir } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildRouteCatalog } from './route-catalog.mjs';

export const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
// Only these optional files create bank tool placements. Content itself stays
// in the existing subject folders; no network/Sheet access is needed for build.
export async function discoverBankMenus(publicRoot) {
  const folder = resolve(publicRoot, 'content/bank');
  async function entries(path) {
    try { return await readdir(path, { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  }
  const files = [];
  for (const subject of await entries(folder)) {
    if (subject.isFile() && !subject.name.endsWith('.html')) continue;
    if (!subject.isDirectory() || !['physics', 'chemistry'].includes(subject.name))
      throw Error('Bank menus must be under content/bank/physics or content/bank/chemistry');
    for (const file of await entries(resolve(folder, subject.name))) {
      if (file.isFile() && !file.name.endsWith('.html')) continue;
      if (!file.isFile() || !/^b-[a-f0-9]{24}\.html$/.test(file.name))
        throw Error('Bank menu filename must be <bankKey>.html (no nested folders or symlinks)');
      files.push(`content/bank/${subject.name}/${file.name}`);
    }
  }
  return files.sort();
}

export async function catalogFromRepository(root = repositoryRoot) {
  const publicRoot = await realpath(resolve(root, 'public'));
  return buildRouteCatalog({ bankMenus: await discoverBankMenus(publicRoot), read: async name => {
    const base = name === 'index.html' ? await realpath(root) : publicRoot;
    const target = await realpath(resolve(base, name));
    const local = relative(base, target);
    if (isAbsolute(local) || local === '..' || local.startsWith('..\\') || local.startsWith('../')) throw Error('Catalog source escapes repository');
    return readFile(target, 'utf8');
  } });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const catalog = await catalogFromRepository();
    const count = kind => catalog.routes.filter(route => route.kind === kind).length;
    console.log(`Route catalog V1 passed: ${count('section')} sections, ${count('chapter')} chapters, ${count('topic')} topics, ${catalog.contents.length} HTML-menu contents, ${count('legacy-tool') / 2} legacy tool placements.`);
    console.log('Catalog checked without changing browser navigation, accounts, or saved work.');
  } catch (error) { console.error(`Route catalog validation failed:\n${error.message}`); process.exitCode = 1; }
}
