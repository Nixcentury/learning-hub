// Shared, side-effect-free rules for the floating study companion.
export const maxChatMessage = 2000;

export function beginGesture(event, origin) {
  return { id: event.pointerId, startX: event.clientX, startY: event.clientY,
    origin: { ...origin }, armed: event.pointerType === 'mouse',
    dragged: false, cancelled: false, held: false };
}
export function armGesture(state) {
  if (!state || state.cancelled) return false;
  state.armed = true; state.held = true; return true;
}
export function moveGesture(state, event) {
  if (!state || state.id !== event.pointerId || state.cancelled) return null;
  const dx = event.clientX - state.startX, dy = event.clientY - state.startY;
  if (Math.hypot(dx, dy) < 7 && !state.dragged) return null;
  if (!state.armed) { state.cancelled = true; return null; }
  state.dragged = true;
  return { x: state.origin.x + dx, y: state.origin.y + dy };
}
export const gestureOutcome = state => state.dragged ? 'drag' : !state.cancelled && !state.held ? 'tap' : 'none';

export function clampPoint(point, view, width, height) {
  return {
    x: Math.max(view.x + 8, Math.min(view.x + Math.max(8, view.width - width - 8), point.x)),
    y: Math.max(view.y + 8, Math.min(view.y + Math.max(8, view.height - height - 8), point.y)),
  };
}
export function normalizePoint(point, view, width, height) {
  return { x: Math.max(0, Math.min(1, (point.x - view.x - 8) / Math.max(1, view.width - width - 16))),
    y: Math.max(0, Math.min(1, (point.y - view.y - 8) / Math.max(1, view.height - height - 16))) };
}
export function restorePoint(point, view, width, height) {
  return clampPoint({ x: view.x + 8 + point.x * Math.max(0, view.width - width - 16),
    y: view.y + 8 + point.y * Math.max(0, view.height - height - 16) }, view, width, height);
}

export function readCompanionPreferences(value) {
  try {
    const input = JSON.parse(value || '{}');
    const position = item => Number.isFinite(item?.x) && Number.isFinite(item?.y)
      ? { x: Math.max(0, Math.min(1, item.x)), y: Math.max(0, Math.min(1, item.y)) } : null;
    return { position: position(input?.position), panelPosition: position(input?.panelPosition),
      hidden: input?.hidden === true, motion: input?.motion !== false };
  } catch { return { position: null, panelPosition: null, hidden: false, motion: true }; }
}

export function chatError(code, status) {
  return Object.assign(new Error(code), { code, status });
}
export function createCompanionClient({ endpoint = '', fetcher = (...args) => fetch(...args), timeoutMs = 45000 } = {}) {
  return {
    ready: Boolean(endpoint),
    async ask({ message, history = [], language = 'th', signal, reference = '' }) {
      if (!endpoint) throw chatError('not-configured');
      const url = new URL(endpoint);
      if (url.username || url.password || url.hash ||
        (url.protocol !== 'https:' && !(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.protocol === 'http:'))) {
        throw chatError('invalid-endpoint');
      }
      const text = typeof message === 'string' ? message.trim() : '';
      if (!text || text.length > maxChatMessage) throw chatError('invalid-message');
      if (typeof reference !== 'string' || reference.length > 16000) throw chatError('invalid-reference');
      const turns = history.filter(item => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string')
        .slice(-12).map(item => ({ role: item.role, content: item.content.slice(0, 6000) }));
      while (turns.reduce((size, item) => size + item.content.length, 0) + reference.length > 18000) turns.shift();
      if (reference) turns.unshift({ role: 'user', content: reference });
      const controller = new AbortController();
      const abort = () => controller.abort(signal?.reason);
      if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => controller.abort(chatError('timeout')), timeoutMs);
      try {
        const response = await fetcher(url.href, {
          method: 'POST', credentials: 'omit', signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'text_chat',
            userMessage: `${language === 'en' ? 'Please reply in English.' : 'โปรดตอบเป็นภาษาไทย'}\n\n${text}`,
            conversation: turns.map(item => ({ role: item.role, text: item.content })),
          }),
        });
        if (!response.ok) throw chatError(response.status === 429 ? 'rate-limit' : 'service-error', response.status);
        const raw = await response.text();
        if (raw.length > 100000) throw chatError('invalid-response');
        let data; try { data = JSON.parse(raw); } catch { throw chatError('invalid-response'); }
        // Only a genuine chat reply is accepted, never a grading stamp or a demo.
        if (typeof data?.reply !== 'string' || !data.reply.trim() || data.reply.length > 24000) throw chatError('invalid-response');
        return data.reply.trim();
      } catch (error) {
        if (controller.signal.aborted) {
          if (signal?.aborted) throw chatError('cancelled');
          throw chatError('timeout');
        }
        if (error.code) throw error;
        throw chatError('network-error');
      } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
    },
  };
}
