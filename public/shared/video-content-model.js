// Shared video links are data, not arbitrary iframe URLs or executable embeds.
export const videoContentIdPattern = /^[a-z][a-z0-9-]{0,127}$/;
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const hosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com']);

function seconds(value) {
  if (value === null || value === '') return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  return match && match[0] ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0) : NaN;
}

export function normalizeVideoSource(value) {
  if (typeof value !== 'string') throw Error('Use a YouTube HTTPS link.');
  if (!value.trim()) return null; // A blank button is a valid draft.
  for (const char of value.trim()) {
    if (char === '\\' || char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127) throw Error('Invalid video link.');
  }
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || !hosts.has(url.hostname) || url.username || url.password || url.port)
    throw Error('Use a YouTube HTTPS link.');
  const parts = url.pathname.split('/').filter(Boolean);
  const id = url.hostname === 'youtu.be' && parts.length === 1 ? parts[0]
    : url.pathname === '/watch' && url.hostname !== 'www.youtube-nocookie.com' ? url.searchParams.get('v')
    : ['embed', 'shorts', 'live'].includes(parts[0]) && parts.length === 2 ? parts[1] : null;
  if (!videoIdPattern.test(id || '')) throw Error('Use a link to one YouTube video.');
  const start = seconds(url.searchParams.get('start') ?? url.searchParams.get('t') ??
    (url.hash.startsWith('#t=') ? url.hash.slice(3) : null));
  if (!Number.isSafeInteger(start) || start < 0 || start > 604800) throw Error('Invalid video start time.');
  const original = new URL('https://www.youtube.com/watch');
  original.searchParams.set('v', id);
  if (start) original.searchParams.set('t', String(start));
  return { provider: 'youtube', videoId: id, start, url: original.href };
}

export function createVideoManifest(value, contentId) {
  if (!videoContentIdPattern.test(contentId || '')) throw Error('Video needs a stable content ID.');
  const source = normalizeVideoSource(value);
  return { contentId, source, ready: source !== null };
}

export function videoEmbedUrl(source, origin, language = 'th') {
  if (!videoIdPattern.test(source?.videoId || '') || !Number.isSafeInteger(source.start) || source.start < 0)
    throw Error('Invalid video source.');
  const site = new URL(origin);
  if (!['https:', 'http:'].includes(site.protocol)) throw Error('Open the video through Learning Hub.');
  const url = new URL(`https://www.youtube.com/embed/${source.videoId}`);
  for (const [key, value] of Object.entries({ enablejsapi: 1, origin: site.origin, playsinline: 1,
    autoplay: 0, hl: language === 'en' ? 'en' : 'th', start: source.start })) url.searchParams.set(key, value);
  return url.href;
}
