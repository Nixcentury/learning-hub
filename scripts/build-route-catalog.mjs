import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildRouteCatalog } from './route-catalog.mjs';

export const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
export async function catalogFromRepository(root = repositoryRoot) {
  const publicRoot = await realpath(resolve(root, 'public'));
  return buildRouteCatalog({ read: async name => {
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
