export function createPwaUpdates({ registration, serviceWorker, document, window, beforeReload }) {
  const checkButton = document.querySelector('#hub-check-update');
  const notice = document.querySelector('#hub-update-notice');
  const message = notice.querySelector('[data-update-message]');
  const applyButton = notice.querySelector('[data-update-apply]');
  const laterButton = notice.querySelector('[data-update-later]');
  const watched = new WeakSet();
  let shownWorker, checking = false, applying = false, requestedWorker, timeout;
  const copy = {
    ready: ['Hub มีเวอร์ชันใหม่ กดอัปเดตเมื่อพร้อม ระบบจะตรวจการบันทึกงานก่อนเปิดใหม่', 'A new Hub version is ready. Update when convenient; the Hub will check your work before reopening.'],
    checking: ['กำลังตรวจอัปเดต…', 'Checking for updates…'],
    installing: ['กำลังเตรียมเวอร์ชันใหม่ ทำงานต่อได้ตามปกติ', 'Preparing the new version. You can keep working.'],
    latest: ['กำลังใช้เวอร์ชันล่าสุด', 'You are using the latest version.'],
    offline: ['ยังตรวจอัปเดตไม่ได้ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง', 'Connect to the internet and check again.'],
    error: ['ตรวจหรือเปิดเวอร์ชันใหม่ไม่สำเร็จ งานยังเปิดอยู่ ลองอีกครั้งได้', 'The update could not complete. Your work is still open; you can try again.'],
    applying: ['กำลังบันทึกงานและเปิดเวอร์ชันใหม่…', 'Saving your work and opening the new version…'],
  };
  function text(element, pair) {
    [element.dataset.th, element.dataset.en] = pair;
    element.textContent = pair[document.documentElement.lang === 'en' ? 1 : 0];
  }
  function waiting() {
    return registration.active && registration.waiting?.state === 'installed' ? registration.waiting : null;
  }
  function render(kind, show = true) {
    const ready = !!waiting();
    text(message, copy[kind]);
    text(checkButton, ready ? ['อัปเดตและเปิดใหม่', 'Update & reopen'] : ['ตรวจอัปเดต', 'Check updates']);
    checkButton.dataset.ariaTh = checkButton.dataset.th;
    checkButton.dataset.ariaEn = checkButton.dataset.en;
    checkButton.setAttribute('aria-label', checkButton.textContent);
    checkButton.setAttribute('title', checkButton.textContent);
    checkButton.disabled = checking || applying;
    checkButton.setAttribute('aria-busy', String(checking || applying));
    applyButton.hidden = !ready;
    applyButton.disabled = applying;
    laterButton.disabled = applying;
    if (show) notice.hidden = false;
  }
  function resetRequest() {
    window.clearTimeout(timeout);
    requestedWorker = null;
    applying = false;
  }
  function reopen() {
    if (!requestedWorker || requestedWorker.state !== 'activated') return;
    resetRequest();
    window.location.reload();
  }
  function watchInstall() {
    const worker = registration.installing;
    if (worker && !watched.has(worker)) {
      watched.add(worker);
      worker.addEventListener('statechange', () => {
        if (waiting()) showWaiting();
        else if (worker.state === 'redundant' && !notice.hidden) render('error');
        else if (worker.state === 'activated' && !applying && !notice.hidden) render('latest');
      });
    }
    showWaiting();
  }
  function showWaiting() {
    const worker = waiting();
    if (!worker || worker === shownWorker || applying) return;
    shownWorker = worker;
    render('ready');
  }
  async function apply() {
    if (checking || applying) return;
    if (!waiting()) return check();
    applying = true;
    render('applying');
    try {
      if (!await beforeReload()) {
        applying = false;
        render('ready');
        return;
      }
      // Another tab may activate this worker while the workspace is saving.
      requestedWorker = waiting();
      if (!requestedWorker) {
        applying = false;
        render('latest');
        return;
      }
      requestedWorker.addEventListener('statechange', reopen);
      timeout = window.setTimeout(() => { resetRequest(); render('error'); }, 15000);
      requestedWorker.postMessage({ type: 'HUB_APPLY_UPDATE' });
    } catch {
      resetRequest();
      render('error');
    }
  }
  async function check() {
    if (checking || applying) return;
    if (waiting()) return apply();
    if (!window.navigator.onLine) { render('offline'); return; }
    checking = true;
    render('checking');
    try {
      await registration.update();
      watchInstall();
      render(waiting() ? 'ready' : registration.installing ? 'installing' : 'latest');
    } catch { render('error'); }
    finally {
      checking = false;
      checkButton.disabled = false;
      checkButton.setAttribute('aria-busy', 'false');
    }
  }
  checkButton.hidden = false;
  render(waiting() ? 'ready' : 'latest', false);
  checkButton.addEventListener('click', check);
  applyButton.addEventListener('click', apply);
  laterButton.addEventListener('click', () => { notice.hidden = true; });
  registration.addEventListener('updatefound', watchInstall);
  serviceWorker.addEventListener('controllerchange', reopen);
  watchInstall();
  return { check };
}
