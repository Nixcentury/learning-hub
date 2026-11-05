import { resolve } from 'node:path';
import { build } from 'vite';

// Build the real UI with only its SDK transport replaced; never overwrite dist/.
export async function buildFirebaseBrowserFixture({ root, name, auth, database }) {
  const modules = {
    'firebase/app': 'export const getApps=()=>[];export const initializeApp=()=>({});',
    'firebase/auth': auth,
    'firebase/database': database,
  };
  const prefix = '\0qa-firebase:';
  const outDir = resolve(root, 'work', name);
  await build({ root, configFile: resolve(root, 'vite.config.js'), logLevel: 'error',
    plugins: [{ name: 'qa-firebase-transport', enforce: 'pre',
      resolveId(source) {
        const name = source.match(/^https:\/\/www\.gstatic\.com\/firebasejs\/10\.12\.5\/firebase-(app|auth|database)\.js$/)?.[1];
        const key = name ? 'firebase/' + name : source;
        if (Object.hasOwn(modules, key)) return prefix + key;
      },
      load(id) { if (id.startsWith(prefix)) return modules[id.slice(prefix.length)]; },
    }], build: { outDir, emptyOutDir: true } });
  return outDir;
}
