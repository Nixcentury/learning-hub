import { validVariantSource, variantReference, extractVariantHtml } from '../public/shared/quiz-variant-model.js';
import { createVariantPreview } from './quiz-variant-preview.js';
import { companionConfig } from './companion-config.js';
import { armGesture, beginGesture, clampPoint, createCompanionClient, gestureOutcome,
  maxChatMessage, moveGesture, normalizePoint, readCompanionPreferences, restorePoint } from './companion-model.js';

const preferenceKey = 'learning-hub-companion-preferences-v1';
const copy = {
  name: ['น้องนกฮูก', 'Study Owl'], subtitle: ['เพื่อนช่วยเรียน', 'Your study companion'],
  open: ['คุยกับน้องนกฮูก · ลากเพื่อย้าย', 'Chat with Study Owl · drag to move'],
  hide: ['ซ่อนน้อง', 'Hide owl'], recall: ['เรียกน้องนกฮูก', 'Show Study Owl'],
  greeting: ['สงสัยตรงไหน ถามได้เลยครับ', 'Something puzzling? Ask me!'],
  drag: ['แตะค้างแล้วลากย้ายได้', 'Hold and drag to move'],
  close: ['ปิดแชท', 'Close chat'], clear: ['เริ่มคุยใหม่', 'New conversation'],
  motion: ['เปิด/ปิดการเคลื่อนไหว', 'Toggle animation'],
  reset: ['คืนตำแหน่ง', 'Reset position'],
  grip: ['ย้ายกล่องคุย · ลากหรือใช้ปุ่มลูกศร', 'Move chat · drag or use arrow keys'],
  help: ['แตะเพื่อคุย แตะค้างเพื่อลาก ใช้ปุ่มลูกศรย้าย และ Escape เพื่อปิดแชท', 'Tap to chat, hold to drag, use arrow keys to move, and Escape to close chat.'],
  notice: ['AI อาจตอบผิดได้ ตรวจสอบกับบทเรียนหรือคุณครูด้วยนะครับ', 'AI can make mistakes. Check answers with your lesson or teacher.'],
  welcome: ['สวัสดีครับ 🦉 อยากให้ช่วยอธิบายเรื่องไหน ลองพิมพ์คำถามได้เลยครับ', 'Hello! 🦉 What would you like to understand? Type a question below.'],
  input: ['คำถามของคุณ', 'Your question'], placeholder: ['ถามเรื่องที่อยากเข้าใจ…', 'What would you like to understand?'],
  send: ['ส่งคำถาม', 'Send question'], stop: ['หยุดคำตอบ', 'Stop response'],
  thinking: ['กำลังคิดคำตอบ…', 'Thinking…'], you: ['คุณ', 'You'], ai: ['น้องนกฮูก · AI', 'Study Owl · AI'],
  retry: ['ลองอีกครั้ง', 'Try again'], stopped: ['หยุดแล้ว คุณส่งคำถามใหม่ได้ครับ', 'Stopped. You can send another question.'],
  private: ['จำบทสนทนาเฉพาะหน้านี้ ไม่บันทึกลงบัญชี', 'Conversation stays in this page and is not saved to your account.'],
  unavailable: ['แชท AI ยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง', 'AI chat is not available yet. Please try again later.'],
  timeout: ['รอคำตอบนานเกินไป ลองส่งใหม่ได้ครับ', 'The reply took too long. Please try again.'],
  network: ['เชื่อมต่อ AI ไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองอีกครั้งครับ', 'Could not reach AI. Check your connection and try again.'],
  rate: ['มีคำถามเข้ามามาก รอสักครู่แล้วลองอีกครั้งครับ', 'Too many requests. Wait a moment and try again.'],
};

export function createCompanion({ mount = document.body, language = 'th', client = createCompanionClient(companionConfig) } = {}) {
  let preferences; try { preferences = readCompanionPreferences(localStorage.getItem(preferenceKey)); }
  catch { preferences = readCompanionPreferences(null); }
  let lang = language === 'en' ? 'en' : 'th';
  const text = key => copy[key][lang === 'en' ? 1 : 0];
  let active = false, identity = '', panelOpen = false, generation = 0, request = null;
  let history = [], point = { x: 0, y: 0 }, panelPoint = { x: 0, y: 0 }, gesture = null;
  let greetingTimer, poseTimer, holdTimer, lastGreeting = -Infinity, ignoreClickUntil = 0;
  let busy = false, requestedPose = 'idle';
  let variant = null, normalChat = null;
  const preview = createVariantPreview({ language: () => lang });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.createElement('div'); root.className = 'hub-companion'; root.hidden = true;
  root.innerHTML = `
    <div class="companion-shield" hidden></div>
    <button class="companion-recall" type="button" data-copy="recall" hidden></button>
    <div class="companion-pet" data-pose="idle">
      <p class="companion-bubble" data-copy="greeting" hidden></p>
      <button class="companion-hide" type="button" data-label="hide">×</button>
      <button class="companion-trigger" type="button" data-label="open" aria-controls="companion-chat" aria-describedby="companion-help" aria-expanded="false">
        <span class="companion-art" aria-hidden="true"><img data-owl-pose="idle" alt="" draggable="false"><img data-owl-pose="greeting" alt="" draggable="false"><img data-owl-pose="thinking" alt="" draggable="false"><img data-owl-pose="happy" alt="" draggable="false"></span>
      </button>
    </div>
    <aside id="companion-chat" class="companion-chat" role="dialog" aria-modal="false" aria-labelledby="companion-title" hidden>
      <header class="companion-header">
        <div class="companion-grip" tabindex="0" role="button" data-label="grip"><span aria-hidden="true">⠿</span><div><h2 id="companion-title" data-copy="name"></h2><p data-copy="subtitle"></p></div></div>
        <button type="button" class="companion-motion" data-label="motion" aria-pressed="true">◌</button>
        <button type="button" class="companion-close" data-label="close">×</button>
      </header>
      <section class="companion-variant" hidden>
        <strong data-variant-title></strong>
        <p data-variant-image-note hidden></p>
        <div class="companion-variant-styles"></div>
      </section>
      <p class="companion-notice" data-copy="notice"></p>
      <div class="companion-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
      <p class="companion-availability" role="status" hidden></p>
      <form class="companion-form"><label class="companion-sr" for="companion-message" data-copy="input"></label><textarea id="companion-message" rows="2" maxlength="${maxChatMessage}"></textarea><button class="companion-send" type="submit" data-label="send">↑</button><button class="companion-stop" type="button" data-label="stop" hidden>■</button></form>
      <footer class="companion-footer"><button type="button" class="companion-clear" data-copy="clear"></button><button type="button" class="companion-reset" data-copy="reset"></button><small data-copy="private"></small></footer>
    </aside>
    <p id="companion-help" class="companion-sr" data-copy="help"></p>
  `;
  mount.append(root);
  const find = selector => root.querySelector(selector);
  const pet = find('.companion-pet'), trigger = find('.companion-trigger'), panel = find('.companion-chat');
  const bubble = find('.companion-bubble'), recall = find('.companion-recall'), shield = find('.companion-shield');
  const input = find('textarea'), messages = find('.companion-messages'), form = find('form');
  const send = find('.companion-send'), stop = find('.companion-stop'), availability = find('.companion-availability');
  const assets = new URL('assets/companion/', document.baseURI);
  const images = new Map([...root.querySelectorAll('[data-owl-pose]')].map(img => [img.dataset.owlPose, img]));
  function pose(name, duration = 0) {
    clearTimeout(poseTimer); requestedPose = name;
    const image = images.get(name);
    if (!image.src) {
      image.onload = () => { if (requestedPose === name) pet.dataset.pose = name; };
      image.src = new URL(`owl-${name}.png`, assets).href;
    }
    if (image.complete && image.naturalWidth) pet.dataset.pose = name;
    if (duration) poseTimer = setTimeout(() => pose(busy ? 'thinking' : 'idle'), duration);
  }
  function view() {
    const v = window.visualViewport;
    return { x: v?.offsetLeft || 0, y: v?.offsetTop || 0, width: v?.width || innerWidth, height: v?.height || innerHeight };
  }
  function savePreferences() {
    try { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); } catch { /* Display still works without storage. */ }
  }
  function placePet(next) {
    const v = view(), size = pet.offsetWidth || 112;
    point = clampPoint(next, v, size, size); pet.style.transform = `translate3d(${point.x}px,${point.y}px,0)`;
    pet.classList.toggle('bubble-below', point.y - v.y < 75);
    const center = Math.max(v.x + 110, Math.min(v.x + v.width - 110, point.x + size / 2));
    bubble.style.left = `${center - point.x}px`;
    if (panelOpen && !preferences.panelPosition) positionPanel();
  }
  function placePanel(next) {
    panelPoint = clampPoint(next, view(), panel.offsetWidth, panel.offsetHeight);
    panel.style.left = `${panelPoint.x}px`; panel.style.top = `${panelPoint.y}px`;
  }
  function positionPanel() {
    const v = view();
    panel.style.width = `${Math.min(392, v.width - 16)}px`;
    panel.style.height = `${Math.min(560, v.height - 16)}px`;
    if (preferences.panelPosition) placePanel(restorePoint(preferences.panelPosition, v, panel.offsetWidth, panel.offsetHeight));
    else {
      let x = point.x - panel.offsetWidth - 10;
      if (x < v.x + 8) x = point.x + pet.offsetWidth + 10;
      if (v.width < 650) x = v.x + (v.width - panel.offsetWidth) / 2;
      placePanel({ x, y: point.y + pet.offsetHeight - panel.offsetHeight });
    }
  }
  function restorePosition() {
    const v = view(), size = pet.offsetWidth || 112;
    const taskbar = document.querySelector('.hub-taskbar:not([hidden])');
    const barTop = taskbar?.getBoundingClientRect().top;
    const defaultY = Number.isFinite(barTop) && barTop > v.y ? barTop - size - 12 : v.y + v.height - size - 90;
    placePet(preferences.position ? restorePoint(preferences.position, v, size, size)
      : { x: v.x + v.width - size - 18, y: defaultY });
    if (panelOpen) positionPanel();
  }
  function applyMotion() {
    root.classList.toggle('companion-motion-on', preferences.motion && !reduced.matches);
    find('.companion-motion').setAttribute('aria-pressed', String(preferences.motion));
  }
  function clearGreeting() { clearTimeout(greetingTimer); bubble.hidden = true; }
  function greet() {
    if (!active || preferences.hidden || gesture || panelOpen || performance.now() - lastGreeting < 15000) return;
    lastGreeting = performance.now(); bubble.hidden = false; pose('greeting', 2200); placePet(point);
    greetingTimer = setTimeout(clearGreeting, 2600);
  }
  function setBusy(value) {
    busy = value; stop.hidden = !value; send.hidden = value;
    send.disabled = !client.ready || !input.value.trim();
    form.setAttribute('aria-busy', String(value));
    if (value) pose('thinking'); else if (requestedPose === 'thinking') pose('idle');
  }
  function welcome() {
    messages.replaceChildren();
    if (variant) {
      messageNode('assistant', lang === 'en' ? 'What would you like to practise? Change the numbers, recall the formula, or try a new situation. You can also type your own request.' : 'อยากฝึกแบบไหนครับ? เปลี่ยนตัวเลข ทวนสูตร หรือเปลี่ยนสถานการณ์ เลือกปุ่มด้านบนหรือพิมพ์บอกได้เลย');
      return;
    }
    const node = document.createElement('p'); node.className = 'companion-welcome'; node.dataset.copy = 'welcome'; node.textContent = text('welcome');
    messages.append(node);
  }
  function errorText(error) {
    if (error.code === 'not-configured' || error.code === 'invalid-endpoint') return text('unavailable');
    if (error.code === 'rate-limit') return text('rate');
    if (error.code === 'timeout') return text('timeout');
    if (error.code === 'cancelled') return text('stopped');
    if (['invalid-quiz', 'unsafe-quiz'].includes(error.code || error.message)) return lang === 'en' ? 'The practice format was incomplete or unsupported. Try again or request a simpler question.' : 'รูปแบบข้อฝึกยังไม่ครบหรือไม่รองรับ ลองอีกครั้งหรือขอเป็นโจทย์ข้อความได้ครับ';
    return text('network');
  }
  function messageNode(role, content) {
    const entry = document.createElement('div'); entry.className = `companion-message is-${role}`;
    const heading = document.createElement('small'); heading.dataset.copy = role === 'user' ? 'you' : 'ai'; heading.textContent = text(heading.dataset.copy);
    const body = document.createElement('p'); body.textContent = content;
    entry.append(heading, body); messages.append(entry);
    while (messages.children.length > 28) messages.firstElementChild.remove();
    messages.scrollTop = messages.scrollHeight;
    return entry;
  }
  async function ask(message, existing = null) {
    if (busy || !active || !message.trim() || message.length > maxChatMessage) return;
    if (!client.ready) { availability.textContent = text('unavailable'); availability.hidden = false; return; }
    const revision = generation;
    if (!existing) messageNode('user', message);
    const entry = existing || messageNode('assistant', text('thinking'));
    entry.classList.remove('is-error'); entry.querySelector('p').textContent = text('thinking');
    entry.querySelector('button')?.remove();
    input.value = ''; setBusy(true);
    const controller = new AbortController(); request = controller;
    try {
      const reply = await client.ask({ message, history, language: lang, signal: controller.signal, reference: variant?.reference || '' });
      if (generation !== revision || controller.signal.aborted) return;
      let rememberedReply = reply;
      if (variant) {
        const html = extractVariantHtml(reply);
        if (html) {
          preview.open(html);
          rememberedReply = lang === 'en' ? 'A temporary practice question was created. The student can request another variant.' : 'สร้างข้อฝึกชั่วคราวแล้ว นักเรียนขอปรับหรือสร้างข้อใหม่ต่อได้';
        }
      }
      entry.querySelector('p').textContent = rememberedReply;
      history.push({ role: 'user', content: message }, { role: 'assistant', content: rememberedReply }); history = history.slice(-12);
      pose('happy', 1800);
    } catch (error) {
      if (generation !== revision) return;
      entry.classList.add('is-error'); entry.querySelector('p').textContent = errorText(error);
      if (error.code !== 'cancelled') {
        const retry = document.createElement('button'); retry.type = 'button'; retry.dataset.copy = 'retry'; retry.textContent = text('retry');
        retry.addEventListener('click', () => void ask(message, entry)); entry.append(retry);
      }
    } finally {
      if (generation === revision) { request = null; setBusy(false); messages.scrollTop = messages.scrollHeight; }
    }
  }
  function openChat() {
    if (!active) return;
    preferences.hidden = false; pet.hidden = false; recall.hidden = true; savePreferences();
    panelOpen = true; panel.hidden = false; clearGreeting(); trigger.setAttribute('aria-expanded', 'true');
    positionPanel(); input.focus({ preventScroll: true });
  }
  function closeChat(focus = true) {
    endVariant();
    panelOpen = false; panel.hidden = true; trigger.setAttribute('aria-expanded', 'false');
    if (focus && active) (preferences.hidden ? recall : trigger).focus({ preventScroll: true });
  }
  function variantLabels() {
    const section = find('.companion-variant'); section.hidden = !variant;
    if (!variant) return;
    find('[data-variant-title]').textContent = `${lang === 'en' ? 'Practice from question' : 'สร้างแนวจากข้อ'} ${variant.source.number} · ${variant.source.title}`;
    const note = find('[data-variant-image-note]'); note.hidden = !variant.source.hasImages;
    note.textContent = lang === 'en' ? 'This source has an image. Describe any essential visual details when asked.' : 'ต้นฉบับมีภาพ หาก AI ถามข้อมูลในภาพ ช่วยอธิบายจุดสำคัญเพิ่มเติมได้ครับ';
    const styles = find('.companion-variant-styles'); styles.replaceChildren();
    for (const [th, en] of [['เปลี่ยนตัวเลข', 'Change numbers'], ['ทวนสูตร', 'Recall the formula'], ['เปลี่ยนสถานการณ์', 'New situation'], ['ยากขึ้น', 'Make it harder']]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = lang === 'en' ? en : th;
      button.addEventListener('click', () => void ask(lang === 'en' ? `Create one practice question: ${en}` : `สร้างข้อฝึกหนึ่งข้อ: ${th}`)); styles.append(button);
    }
  }
  function endVariant(restore = true) {
    if (!variant) return;
    generation++; request?.abort(); request = null; preview.close(); variant = null; setBusy(false);
    history = restore ? normalChat?.history || [] : [];
    input.value = restore ? normalChat?.input || '' : '';
    if (restore && normalChat) messages.replaceChildren(...normalChat.nodes); else welcome();
    normalChat = null; variantLabels(); setBusy(false);
  }
  function startVariant(source, owner = null) {
    if (!active || !validVariantSource(source)) return false;
    const reference = variantReference(source);
    if (busy && !variant) {
      const pending = messages.querySelector('.companion-message.is-assistant:last-child p');
      if (pending) pending.textContent = text('stopped');
    }
    generation++; request?.abort(); request = null; preview.close(); setBusy(false);
    if (!variant) normalChat = { history, input: input.value, nodes: [...messages.childNodes] };
    variant = { source: { title: source.title, number: source.number, hasImages: source.hasImages }, reference, owner };
    history = []; input.value = ''; welcome(); variantLabels(); setBusy(false); openChat(); return true;
  }
  function cancelGesture(restore = false) {
    if (!gesture) return;
    const old = gesture; gesture = null; clearTimeout(holdTimer); shield.hidden = true;
    root.classList.remove('is-dragging');
    if (restore) (old.kind === 'pet' ? placePet : placePanel)(old.origin);
    if (old.target.hasPointerCapture(old.id)) old.target.releasePointerCapture(old.id);
    ignoreClickUntil = performance.now() + 400;
  }
  function bindDrag(target, kind) {
    target.addEventListener('pointerdown', event => {
      if (!active || gesture || !event.isPrimary || event.button !== 0) return;
      clearGreeting();
      gesture = Object.assign(beginGesture(event, kind === 'pet' ? point : panelPoint), { kind, target });
      target.setPointerCapture(event.pointerId);
      if (event.pointerType !== 'mouse') {
        const current = gesture;
        holdTimer = setTimeout(() => { if (gesture === current) armGesture(current); }, 320);
      }
    });
    target.addEventListener('pointermove', event => {
      if (!gesture || gesture.target !== target) return;
      const next = moveGesture(gesture, event);
      if (!next) return;
      event.preventDefault(); shield.hidden = false; root.classList.add('is-dragging');
      (kind === 'pet' ? placePet : placePanel)(next);
    });
    target.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId || gesture.target !== target) return;
      const outcome = gestureOutcome(gesture); cancelGesture();
      if (outcome === 'drag') {
        preferences[kind === 'pet' ? 'position' : 'panelPosition'] = normalizePoint(kind === 'pet' ? point : panelPoint,
          view(), kind === 'pet' ? pet.offsetWidth : panel.offsetWidth, kind === 'pet' ? pet.offsetHeight : panel.offsetHeight);
        savePreferences();
      } else if (outcome === 'tap' && kind === 'pet') openChat();
    });
    target.addEventListener('pointercancel', () => cancelGesture(true));
    target.addEventListener('lostpointercapture', () => cancelGesture());
    target.addEventListener('contextmenu', event => event.preventDefault());
    target.addEventListener('dragstart', event => event.preventDefault());
    target.addEventListener('keydown', event => {
      const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (!direction) return;
      event.preventDefault(); const current = kind === 'pet' ? point : panelPoint;
      const distance = event.shiftKey ? 32 : 16;
      (kind === 'pet' ? placePet : placePanel)({ x: current.x + direction[0] * distance, y: current.y + direction[1] * distance });
      preferences[kind === 'pet' ? 'position' : 'panelPosition'] = normalizePoint(kind === 'pet' ? point : panelPoint,
        view(), kind === 'pet' ? pet.offsetWidth : panel.offsetWidth, kind === 'pet' ? pet.offsetHeight : panel.offsetHeight);
      savePreferences();
    });
  }
  bindDrag(trigger, 'pet'); bindDrag(find('.companion-grip'), 'panel');
  trigger.addEventListener('click', event => {
    if (event.detail === 0 && performance.now() >= ignoreClickUntil) openChat(); else event.preventDefault();
  });
  trigger.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openChat(); }
  });
  trigger.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') greet(); });
  find('.companion-hide').addEventListener('click', () => {
    cancelGesture(); clearGreeting(); closeChat(false); preferences.hidden = true; pet.hidden = true; recall.hidden = false;
    savePreferences(); recall.focus({ preventScroll: true });
  });
  recall.addEventListener('click', () => {
    preferences.hidden = false; pet.hidden = false; recall.hidden = true; restorePosition(); savePreferences(); trigger.focus({ preventScroll: true }); greet();
  });
  find('.companion-close').addEventListener('click', () => closeChat());
  find('.companion-clear').addEventListener('click', () => {
    generation++; request?.abort(); request = null; history = []; setBusy(false); welcome(); input.focus({ preventScroll: true });
  });
  find('.companion-reset').addEventListener('click', () => {
    preferences.position = null; preferences.panelPosition = null; restorePosition(); savePreferences();
  });
  find('.companion-motion').addEventListener('click', () => { preferences.motion = !preferences.motion; applyMotion(); savePreferences(); });
  stop.addEventListener('click', () => request?.abort());
  input.addEventListener('input', () => { send.disabled = busy || !client.ready || !input.value.trim(); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', event => { event.preventDefault(); void ask(input.value.trim()); });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (gesture) cancelGesture(true); else if (panelOpen) closeChat(); else clearGreeting();
    event.preventDefault(); event.stopPropagation();
  });
  function resize() { cancelGesture(); if (active) restorePosition(); }
  window.addEventListener('resize', resize);
  window.addEventListener('blur', () => cancelGesture(true));
  window.visualViewport?.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('scroll', resize);
  reduced.addEventListener('change', applyMotion);
  function setLanguage(value) {
    lang = value === 'en' ? 'en' : 'th';
    root.querySelectorAll('[data-copy]').forEach(node => { node.textContent = text(node.dataset.copy); });
    root.querySelectorAll('[data-label]').forEach(node => { node.setAttribute('aria-label', text(node.dataset.label)); node.title = text(node.dataset.label); });
    input.placeholder = text('placeholder'); availability.textContent = text('unavailable'); variantLabels();
  }
  welcome(); setLanguage(lang); applyMotion();
  return {
    setLanguage, startVariant,
    closeVariantFor(owner) { if (variant?.owner === owner) endVariant(); },
    setSession(session) {
      const nextActive = ['signed-in', 'guest'].includes(session?.status);
      const nextIdentity = nextActive ? `${session.status}:${session.user?.uid || ''}` : '';
      if (nextIdentity !== identity) {
        endVariant(false); preview.close();
        generation++; request?.abort(); request = null; history = []; input.value = ''; setBusy(false); welcome(); closeChat(false);
      }
      identity = nextIdentity; active = nextActive; root.hidden = !active;
      if (!active) { cancelGesture(); clearGreeting(); return; }
      pet.hidden = preferences.hidden; recall.hidden = !preferences.hidden;
      availability.hidden = client.ready; input.disabled = !client.ready;
      pose('idle'); restorePosition();
    },
  };
}
