export const linksRoot = 'classroomLinksV1';
export const linkIdPattern = /^l_[a-f0-9]{32}$/;
export const linkRoomPattern = /^r_[a-f0-9]{32}$/;
export const newLinkId = () => 'l_' + crypto.randomUUID().replaceAll('-', '');
export const linkError = code => Object.assign(new Error(code), { code });
export function cleanLinkFields(value) {
  const title = String(value?.title || '').trim().replace(/\s+/g, ' ');
  if (!title || title.length > 180) throw linkError('links/invalid-title');
  const input = String(value?.url || '').trim();
  let url;
  try { url = new URL(input); } catch { throw linkError('links/invalid-url'); }
  if (!/^https?:$/.test(url.protocol) || !url.hostname || url.username || url.password || /[\s\u0000-\u001f\u007f]/.test(input) || !/^https?:\/\//i.test(input) || url.href.length > 2048)
    throw linkError('links/invalid-url');
  return { title, url: url.href };
}
