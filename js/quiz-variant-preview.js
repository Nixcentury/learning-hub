import { parseVariantHtml } from '../public/shared/quiz-variant-model.js';

export function createVariantPreview({ language = () => 'th' } = {}) {
  let dialog = null, html = null;
  const close = () => {
    if (!dialog) return;
    const old = dialog; dialog = null; html = null;
    old.querySelector('iframe')?.remove();
    old.close(); old.remove();
  };
  window.addEventListener('message', event => {
    const frame = dialog?.querySelector('iframe');
    if (!frame || event.origin !== location.origin || event.source !== frame.contentWindow ||
        event.data?.type !== 'learning-hub-temporary-quiz-ready') return;
    frame.contentWindow.postMessage({ type: 'learning-hub-temporary-quiz-content', html, language: language() }, location.origin);
  });
  return {
    close,
    open(content) {
      parseVariantHtml(content); // Fail before showing a window; child validates again.
      close(); html = content;
      dialog = document.createElement('dialog'); dialog.className = 'quiz-variant-preview';
      const header = document.createElement('header'), title = document.createElement('strong'), button = document.createElement('button');
      title.textContent = language() === 'en' ? 'Temporary practice · discarded on close' : 'ข้อฝึกชั่วคราว · ปิดแล้วหาย';
      button.type = 'button'; button.textContent = language() === 'en' ? 'Close practice ×' : 'ปิดข้อฝึก ×';
      button.addEventListener('click', close); header.append(title, button);
      const frame = document.createElement('iframe'); frame.title = title.textContent;
      frame.src = new URL(`pages/tools/quiz-player.html?temporary=1&lang=${language()}`, document.baseURI).href;
      dialog.append(header, frame); document.body.append(dialog);
      dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
      const current = dialog;
      dialog.addEventListener('close', () => { if (dialog === current) close(); });
      dialog.showModal();
    },
  };
}
