// Shared PDF contract: optional common/TH/EN links, no account or Quiz data.
export const pdfContentIdPattern = /^[a-z][a-z0-9-]{0,127}$/;

export function resolveAuthoredPdfLinks(root, baseUrl) {
  root?.querySelectorAll('a[data-hub-pdf]').forEach(link => {
    const inline = ['data-pdf-common', 'data-pdf-th', 'data-pdf-en'].some(name => link.hasAttribute(name));
    if (inline) {
      for (const name of ['data-pdf-common', 'data-pdf-th', 'data-pdf-en']) {
        const value = link.getAttribute(name);
        if (value?.trim()) link.setAttribute(name, new URL(value, baseUrl).href);
      }
      return;
    }
    const attribute = link.hasAttribute('data-pdf-src') ? 'data-pdf-src' : 'href';
    const value = link.getAttribute(attribute);
    if (value) link.setAttribute(attribute, new URL(value, baseUrl).href);
  });
}

// undefined means the older descriptor-link format; {} is a valid draft.
export function inlinePdfSources(attributes) {
  const names = ['common', 'th', 'en'];
  if (!names.some(key => Object.hasOwn(attributes, `data-pdf-${key}`))) return undefined;
  if (attributes['data-pdf-src']?.trim()) throw Error('Do not mix inline PDF links with a descriptor path.');
  return Object.fromEntries(names.filter(key => Object.hasOwn(attributes, `data-pdf-${key}`))
    .map(key => [key, attributes[`data-pdf-${key}`]]));
}

export function createInlinePdfManifest(sources, contentId, baseUrl, hubUrl) {
  if (!sources || typeof sources !== 'object' || Array.isArray(sources) ||
      Object.keys(sources).some(key => !['common', 'th', 'en'].includes(key))) throw Error('Inline PDF sources must be common/th/en.');
  return createPdfManifest({ 'data-learning-pdf': '1', 'data-activity-id': contentId,
    ...Object.fromEntries(Object.entries(sources).map(([key, value]) => [`data-pdf-${key}`, value])) }, [], baseUrl, hubUrl);
}

export function safePdfLink(value, baseUrl) {
  if (typeof value !== 'string' || !value.trim() || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const base = new URL(baseUrl), url = new URL(value.trim(), base);
    if (url.username || url.password || (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && url.origin === base.origin))) return null;
    return url.href;
  } catch { return null; }
}

export function resolvePdfSource(value, descriptorUrl, hubUrl) {
  const href = safePdfLink(value, descriptorUrl);
  if (!href) throw Error('PDF source must be an HTTPS URL or a local PDF path.');
  const url = new URL(href), hub = new URL(hubUrl);
  if (url.hostname === 'drive.google.com') {
    const match = url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]{10,200})\/(?:view|preview)\/?$/);
    if (!match || url.protocol !== 'https:' || url.port) throw Error('Use a Google Drive /file/d/FILE_ID/view link.');
    const preview = new URL(`https://drive.google.com/file/d/${match[1]}/preview`);
    const original = new URL(`https://drive.google.com/file/d/${match[1]}/view`);
    const key = url.searchParams.get('resourcekey');
    if (key) {
      if (!/^[a-zA-Z0-9_-]{1,200}$/.test(key)) throw Error('Invalid Drive resource key.');
      preview.searchParams.set('resourcekey', key); original.searchParams.set('resourcekey', key);
    }
    return { kind: 'drive', url: preview.href, originalUrl: original.href };
  }
  if (!/\.pdf$/i.test(url.pathname) || url.hash || /%(?:2e|2f|5c|25|00)/i.test(url.pathname))
    throw Error('Use a direct .pdf URL without a fragment, or a Google Drive file link.');
  if (url.origin === hub.origin && (!url.pathname.startsWith(new URL('content/', hub).pathname) || url.search))
    throw Error('Local PDFs must be under content/ without query parameters.');
  return { kind: 'pdf', url: url.href, originalUrl: url.href };
}

// attributes and links are plain data; this function never executes descriptor HTML.
export function createPdfManifest(attributes, links, descriptorUrl, hubUrl) {
  if (attributes['data-learning-pdf'] !== '1' || !pdfContentIdPattern.test(attributes['data-activity-id'] || ''))
    throw Error('PDF descriptor needs data-learning-pdf="1" and a stable data-activity-id.');
  const sources = {};
  for (const key of ['common', 'th', 'en']) {
    const name = `data-pdf-${key}`, legacyName = key === 'common' ? 'data-pdf-src' : `data-pdf-src-${key}`;
    const value = attributes[name], oldValue = attributes[legacyName];
    if (value?.trim() && oldValue?.trim() && value.trim() !== oldValue.trim()) throw Error(`Conflicting ${key} PDF links.`);
    const candidate = value?.trim() ? value : oldValue;
    if (candidate !== undefined && typeof candidate !== 'string') throw Error('PDF links must be strings.');
    if (candidate?.trim()) sources[key] = resolvePdfSource(candidate, descriptorUrl, hubUrl);
  }
  const defaultLanguage = Object.keys(sources)[0] || null;
  const resources = links.map(link => {
    const url = safePdfLink(link.href, descriptorUrl);
    if (!url || !link['data-th']?.trim() || !link['data-en']?.trim())
      throw Error('PDF resource links need a safe web URL and data-th/data-en labels.');
    return { url, titleTh: link['data-th'].trim().slice(0, 180), titleEn: link['data-en'].trim().slice(0, 180) };
  });
  if (resources.length > 20) throw Error('PDF descriptor supports at most 20 resource links.');
  return { contentId: attributes['data-activity-id'], sources, defaultLanguage,
    source: sources[defaultLanguage] || null, ready: defaultLanguage !== null, resources };
}

export function selectPdfVariant(manifest, language) {
  const requested = language === 'en' ? 'en' : 'th';
  const key = manifest.sources[requested] ? requested : manifest.sources.common ? 'common' : manifest.defaultLanguage;
  return { key, source: manifest.sources[key] || null, fallback: !!key && key !== 'common' && key !== requested };
}

// Native downloads work for same-origin files. Cross-origin PDF.js documents
// can supply bytes for a Blob download after loading; Drive keeps its own UI.
export function pdfDownloadAction(source, hubUrl, filename) {
  const kind = source.kind === 'drive' ? 'provider'
    : new URL(source.url).origin === new URL(hubUrl).origin ? 'native' : 'blob';
  return { kind, url: source.originalUrl, filename };
}
