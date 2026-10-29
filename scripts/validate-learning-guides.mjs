import { readFile, readdir, realpath } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseHTML } from 'linkedom';
import { catalogFromRepository } from './build-route-catalog.mjs';
import { GUIDE_MAX_BYTES, guideUrl, validateGuide, validateGuideTargets } from '../js/learning-guide-model.js';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
export const guideFingerprint = source => createHash('sha256').update(source).digest('hex');
async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? filesUnder(resolve(directory, entry.name)) : resolve(directory, entry.name)))).flat();
}
export async function validateLearningGuides({ root = repositoryRoot } = {}) {
  const publicRoot = await realpath(resolve(root, 'public'));
  const files = await filesUnder(resolve(publicRoot, 'content'));
  const catalog = await catalogFromRepository(root);
  const errors = [], referenced = new Set();
  let count = 0;
  for (const file of files.filter(file => file.endsWith('.html'))) {
    const source = await readFile(file, 'utf8');
    if (!source.includes('data-sheet-guide')) continue;
    const { document } = parseHTML(source), html = document.documentElement;
    if (!html.hasAttribute('data-sheet-guide')) continue;
    const fail = message => errors.push(`${relative(root, file)}: ${message}`);
    count++;
    try {
      if (!html.hasAttribute('data-learning-sheet')) throw new Error('Only learning sheets can declare a guide');
      const sourcePath = relative(publicRoot, file).split('\\').join('/');
      const entry = catalog.contents.find(entry => entry.source === sourcePath);
      if (!entry) throw new Error('Guide sheet must have a catalog contentId');
      const revision = html.getAttribute('data-sheet-revision');
      if (!revision) throw new Error('data-sheet-revision required');
      const url = new URL(guideUrl(html.getAttribute('data-sheet-guide'), `https://guide.test/${sourcePath}`));
      const guidePath = await realpath(resolve(publicRoot, '.' + url.pathname));
      if (!guidePath.startsWith(resolve(publicRoot, 'content') + '/')) throw new Error('Guide resolves outside content/');
      referenced.add(guidePath);
      const data = await readFile(guidePath);
      if (data.length > GUIDE_MAX_BYTES) throw new Error('Guide exceeds 128 KiB');
      const guide = JSON.parse(data.toString('utf8'));
      const problems = validateGuide(guide, { contentId: entry.id, revision });
      if (!problems.length) problems.push(...validateGuideTargets(guide, document));
      if (guide.source?.sha256 !== guideFingerprint(source)) problems.push('Source changed: review the guide, update revision and source.sha256');
      problems.forEach(fail);
    } catch (error) { fail(error.message); }
  }
  for (const file of files.filter(file => file.endsWith('.guide.json'))) if (!referenced.has(file)) errors.push(`${relative(root, file)}: guide is not linked from a sheet`);
  return { count, errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (process.argv[2] === '--fingerprint') {
    const path = resolve(repositoryRoot, process.argv[3] || '');
    console.log(guideFingerprint(await readFile(path, 'utf8')));
  } else {
    const result = await validateLearningGuides();
    for (const error of result.errors) console.error(error);
    console.log(`Learning guides: ${result.count} sheet(s), ${result.errors.length} error(s)`);
    if (result.errors.length) process.exitCode = 1;
  }
}
