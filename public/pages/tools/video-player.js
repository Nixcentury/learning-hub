import { createVideoManifest, videoEmbedUrl } from '../../shared/video-content-model.js';

const params = new URLSearchParams(location.search);
const title = document.getElementById('video-title');
const status = document.getElementById('video-status');
const original = document.getElementById('video-original');
const frame = document.getElementById('video-frame');
let player, disposed = false, failed = false, visible = true, timeout;
const language = () => document.documentElement.lang === 'en' ? 'en' : 'th';
function message(th, en, error = false) {
  status.dataset.th = th; status.dataset.en = en;
  status.textContent = language() === 'en' ? en : th;
  status.classList.toggle('is-error', error); status.hidden = false;
}
function pause() { try { player?.pauseVideo?.(); } catch { /* The frame may still be loading. */ } }
function error() {
  failed = true; clearTimeout(timeout); pause();
  if (!player) { frame.removeAttribute('src'); frame.hidden = true; }
  message('เล่นคลิปในหน้านี้ไม่ได้ ลองกด “เปิดใน YouTube”', 'This video cannot play here. Try “Open in YouTube”.', true);
}

try {
  const manifest = createVideoManifest(params.get('video') || '', params.get('id'));
  for (const lang of ['th', 'en']) title.dataset[lang] = (params.get(`title-${lang}`) || title.dataset[lang]).slice(0, 180);
  title.textContent = title.dataset[language()];
  if (!manifest.ready) {
    message('กำลังเตรียมวิดีโอ', 'Video in preparation.');
  } else {
    original.href = manifest.source.url; original.hidden = false;
    timeout = setTimeout(error, 20000);
    window.onYouTubeIframeAPIReady = () => {
      if (disposed || failed) return;
      frame.src = videoEmbedUrl(manifest.source, location.origin, language()); frame.hidden = false;
      player = new window.YT.Player('video-frame', { events: {
        onReady() {
          if (disposed || failed) { pause(); return; }
          clearTimeout(timeout);
          if (!visible || document.hidden) pause();
          message('กดเล่นบนวิดีโอเพื่อเริ่มรับชม', 'Press play on the video to start.');
        },
        onError: error,
        onAutoplayBlocked() { message('แตะปุ่มเล่นบนวิดีโอเพื่อเริ่มรับชม', 'Tap play on the video to start.'); },
      } });
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api'; script.async = true; script.onerror = error;
    document.head.append(script);
  }
} catch {
  frame.removeAttribute('src'); frame.hidden = true;
  message('เปิดวิดีโอไม่ได้ กรุณาตรวจรหัสเนื้อหาและลิงก์ YouTube', 'Cannot open video. Check the content ID and YouTube link.', true);
}

window.addEventListener('message', event => {
  if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'learning-hub-tool-visibility') return;
  visible = event.data.visible === true;
  if (!visible) pause();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pagehide', () => {
  disposed = true; clearTimeout(timeout); pause(); player?.destroy?.();
});
if (parent !== window) parent.postMessage({ type: 'learning-hub-tool-ready' }, location.origin);
