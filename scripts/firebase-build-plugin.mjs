const version = '10.12.5';
const modules = new Map(['app', 'auth', 'database'].map(name =>
  [`https://www.gstatic.com/firebasejs/${version}/firebase-${name}.js`, `firebase/${name}`]));

// Raw-source fixtures keep their SDK URLs; production uses the locked local SDK.
export function firebaseBuildPlugin() {
  return {
    name: 'learning-hub-bundle-firebase',
    apply: 'build',
    enforce: 'pre',
    async resolveId(source, importer) {
      const target = modules.get(source);
      if (target) return this.resolve(target, importer, { skipSelf: true });
    },
  };
}
