const NOTEBOOK_SCHEMA = 'HUB_NOTEBOOK_CORE_V1';
const PAGE_WIDTH = 1400;
const PAGE_HEIGHT = 900;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.15;

const toolMessages = {
  pen: { th: 'ปากกาพร้อมเขียน', en: 'Pen ready' },
  eraser: { th: 'แตะเส้นเพื่อลบทั้งเส้น', en: 'Touch a stroke to erase it' },
  hand: { th: 'ลากเพื่อเลื่อนกระดาษ', en: 'Drag to pan the page' },
};

const colorMessages = {
  '#111827': { th: 'สีดำพร้อมเขียน', en: 'Black pen ready' },
  '#2563eb': { th: 'สีน้ำเงินพร้อมเขียน', en: 'Blue pen ready' },
  '#dc3545': { th: 'สีแดงพร้อมเขียน', en: 'Red pen ready' },
};

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0)
    return Math.hypot(point.x - start.x, point.y - start.y);

  const ratio = clamp(
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy),
    0,
    1,
  );
  return Math.hypot(
    point.x - (start.x + ratio * dx),
    point.y - (start.y + ratio * dy),
  );
}

function strokeTouchesPoint(stroke, point, radius) {
  if (!stroke.points.length) return false;
  if (stroke.points.length === 1) {
    return (
      Math.hypot(point.x - stroke.points[0].x, point.y - stroke.points[0].y) <=
      radius
    );
  }

  for (let index = 1; index < stroke.points.length; index += 1) {
    if (
      distanceToSegment(
        point,
        stroke.points[index - 1],
        stroke.points[index],
      ) <= radius
    ) {
      return true;
    }
  }
  return false;
}

function drawStroke(context, stroke) {
  if (!stroke.points.length) return;

  context.save();
  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = stroke.width;

  if (stroke.points.length === 1) {
    const point = stroke.points[0];
    context.beginPath();
    context.arc(point.x, point.y, stroke.width / 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  context.beginPath();
  context.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let index = 1; index < stroke.points.length - 1; index += 1) {
    const point = stroke.points[index];
    const next = stroke.points[index + 1];
    context.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + next.x) / 2,
      (point.y + next.y) / 2,
    );
  }
  const last = stroke.points[stroke.points.length - 1];
  context.lineTo(last.x, last.y);
  context.stroke();
  context.restore();
}

function snapshotStrokes(strokes) {
  return [...strokes];
}

export class NotebookCore {
  constructor(root, options = {}) {
    this.root = root;
    this.canvas = root.querySelector('[data-notebook-canvas]');
    this.viewport = root.querySelector('[data-notebook-viewport]');
    this.page = root.querySelector('[data-notebook-page]');
    this.context = this.canvas?.getContext('2d', { alpha: false });

    if (!this.canvas || !this.viewport || !this.page || !this.context) {
      throw new Error('Notebook Core markup is incomplete.');
    }

    this.state = {
      tool: 'pen',
      fingerDraws: false,
      zoom: 1,
      color: options.color || '#111827',
      width: Number(options.width) || 3.2,
      strokes: [],
      activeStroke: null,
      pointer: null,
      revision: 0,
      eraseChanged: false,
      eraseSnapshot: null,
    };
    this.contextInfo = options.context ? { ...options.context } : null;
    this.onHubContextChange = (event) => {
      this.setContext(event.detail?.content);
      this.refreshLocalizedControls();
    };

    this.history = {
      undo: [],
      redo: [],
      limit: 100,
    };

    this.elements = {
      tools: [...root.querySelectorAll('[data-notebook-tool]')],
      colors: [...root.querySelectorAll('[data-notebook-color]')],
      finger: root.querySelector('[data-notebook-finger]'),
      fingerLabel: root.querySelector('[data-notebook-finger-label]'),
      undo: root.querySelector('[data-notebook-undo]'),
      redo: root.querySelector('[data-notebook-redo]'),
      zoom: root.querySelector('[data-notebook-zoom]'),
      zoomIn: root.querySelector('[data-notebook-zoom-in]'),
      zoomOut: root.querySelector('[data-notebook-zoom-out]'),
      fit: root.querySelector('[data-notebook-fit]'),
      clear: root.querySelector('[data-notebook-clear]'),
      status: root.querySelector('[data-notebook-status] span'),
      pageKey: root.querySelector('[data-notebook-page-key]'),
    };

    this.onContextMenu = (event) => event.preventDefault();
    this.onTouchGesture = (event) => event.preventDefault();

    this.bindControls();
    this.bindCanvas();
    this.paint();
    this.setTool('pen');
    this.updateHistoryControls();
    this.root.classList.add('is-touch-panning');

    requestAnimationFrame(() => this.fitToViewport());
  }

  get language() {
    return document.documentElement.lang === 'en' ? 'en' : 'th';
  }

  label(thai, english) {
    return this.language === 'en' ? english : thai;
  }

  bindControls() {
    this.elements.tools.forEach((button) => {
      button.addEventListener('click', () =>
        this.setTool(button.dataset.notebookTool),
      );
    });
    this.elements.colors.forEach((button) => {
      button.addEventListener('click', () =>
        this.setColor(button.dataset.notebookColor),
      );
    });
    this.elements.finger?.addEventListener('click', () =>
      this.toggleFingerMode(),
    );
    this.elements.undo?.addEventListener('click', () => this.undo());
    this.elements.redo?.addEventListener('click', () => this.redo());
    this.elements.zoomIn?.addEventListener('click', () =>
      this.setZoom(this.state.zoom + ZOOM_STEP),
    );
    this.elements.zoomOut?.addEventListener('click', () =>
      this.setZoom(this.state.zoom - ZOOM_STEP),
    );
    this.elements.fit?.addEventListener('click', () => this.fitToViewport());
    this.elements.clear?.addEventListener('click', () => this.requestClear());

    this.root.addEventListener('keydown', (event) =>
      this.onHistoryShortcut(event),
    );

    document.addEventListener(
      'learning-hub-context-change',
      this.onHubContextChange,
    );
  }

  bindCanvas() {
    this.canvas.addEventListener('pointerdown', (event) =>
      this.onPointerDown(event),
    );
    this.canvas.addEventListener('pointermove', (event) =>
      this.onPointerMove(event),
    );
    this.canvas.addEventListener('pointerup', (event) =>
      this.onPointerEnd(event),
    );
    this.canvas.addEventListener('pointercancel', (event) =>
      this.onPointerEnd(event),
    );
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
    this.canvas.addEventListener('touchstart', this.onTouchGesture, {
      passive: false,
    });
    this.canvas.addEventListener('touchmove', this.onTouchGesture, {
      passive: false,
    });
    this.canvas.addEventListener('gesturestart', this.onTouchGesture);
    this.root.addEventListener('contextmenu', this.onContextMenu);
    this.root.addEventListener('selectstart', this.onContextMenu);
    this.root.addEventListener('dragstart', this.onContextMenu);
  }

  refreshLocalizedControls() {
    document
      .querySelectorAll('[data-label-th][data-label-en]')
      .forEach((element) => {
        const label =
          element.dataset[`label${this.language === 'en' ? 'En' : 'Th'}`];
        if (label) element.setAttribute('aria-label', label);
      });
    this.elements.colors.forEach((button) => {
      const label =
        button.dataset[`color${this.language === 'en' ? 'En' : 'Th'}`];
      if (label) button.setAttribute('aria-label', label);
    });
    this.updateFingerLabel();
    this.updateHistoryControls();
    this.setStatus(toolMessages[this.state.tool]);
  }

  onHistoryShortcut(event) {
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable="true"]')
    )
      return;

    if ((!event.ctrlKey && !event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    let changed = false;
    if (key === 'z') changed = event.shiftKey ? this.redo() : this.undo();
    else if (key === 'y' && !event.shiftKey) changed = this.redo();
    if (changed) event.preventDefault();
  }

  updatePageKey(content) {
    if (!this.elements.pageKey || !content) return;
    this.elements.pageKey.textContent = `${content.itemId || 'main'} / ${content.pageId || 'page-001'}`;
  }

  setContext(content) {
    if (!content) return;
    this.contextInfo = { ...content };
    this.updatePageKey(this.contextInfo);
  }

  setTool(tool) {
    if (!['pen', 'eraser', 'hand'].includes(tool)) return;
    this.state.tool = tool;
    this.root.dataset.tool = tool;
    this.elements.tools.forEach((button) => {
      const isActive = button.dataset.notebookTool === tool;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    this.setStatus(toolMessages[tool]);
  }

  setColor(color) {
    if (!colorMessages[color]) return;
    this.state.color = color;
    this.elements.colors.forEach((button) => {
      const isActive = button.dataset.notebookColor === color;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    this.setTool('pen');
    this.setStatus(colorMessages[color]);
  }

  toggleFingerMode() {
    this.state.fingerDraws = !this.state.fingerDraws;
    this.elements.finger?.classList.toggle('is-active', this.state.fingerDraws);
    this.elements.finger?.setAttribute(
      'aria-pressed',
      String(this.state.fingerDraws),
    );
    this.root.classList.toggle('is-touch-panning', !this.state.fingerDraws);
    this.updateFingerLabel();
    this.setStatus(
      this.state.fingerDraws
        ? { th: 'นิ้วพร้อมเขียนบนกระดาษ', en: 'Finger drawing enabled' }
        : { th: 'นิ้วใช้เลื่อนกระดาษ', en: 'Finger input pans the page' },
    );
  }

  updateFingerLabel() {
    if (!this.elements.fingerLabel) return;
    const thai = this.state.fingerDraws ? 'นิ้ว: เขียน' : 'นิ้ว: เลื่อน';
    const english = this.state.fingerDraws ? 'Finger: draw' : 'Finger: pan';
    this.elements.fingerLabel.dataset.th = thai;
    this.elements.fingerLabel.dataset.en = english;
    this.elements.fingerLabel.textContent = this.label(thai, english);
  }

  setStatus(message) {
    if (!this.elements.status || !message) return;
    this.elements.status.textContent =
      this.language === 'en' ? message.en : message.th;
  }

  canvasPoint(event) {
    const bounds = this.canvas.getBoundingClientRect();
    return {
      x: clamp(
        ((event.clientX - bounds.left) / bounds.width) * PAGE_WIDTH,
        0,
        PAGE_WIDTH,
      ),
      y: clamp(
        ((event.clientY - bounds.top) / bounds.height) * PAGE_HEIGHT,
        0,
        PAGE_HEIGHT,
      ),
      pressure: event.pressure > 0 ? event.pressure : 0.5,
    };
  }

  shouldPan(event) {
    return (
      this.state.tool === 'hand' ||
      (event.pointerType === 'touch' && !this.state.fingerDraws)
    );
  }

  onPointerDown(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;

    this.canvas.setPointerCapture(event.pointerId);

    if (this.shouldPan(event)) {
      this.state.pointer = {
        type: 'pan',
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        scrollLeft: this.viewport.scrollLeft,
        scrollTop: this.viewport.scrollTop,
      };
      this.root.classList.add('is-panning');
      event.preventDefault();
      return;
    }

    const point = this.canvasPoint(event);
    if (this.state.tool === 'eraser') {
      this.state.pointer = { type: 'erase', id: event.pointerId };
      this.state.eraseChanged = false;
      this.state.eraseSnapshot = snapshotStrokes(this.state.strokes);
      this.eraseAt(point);
      event.preventDefault();
      return;
    }

    this.state.activeStroke = {
      color: this.state.color,
      width: this.state.width,
      points: [point],
    };
    this.state.pointer = { type: 'draw', id: event.pointerId };
    this.root.classList.add('has-ink');
    this.paint();
    event.preventDefault();
  }

  onPointerMove(event) {
    const pointer = this.state.pointer;
    if (!pointer || pointer.id !== event.pointerId) return;

    if (pointer.type === 'pan') {
      this.viewport.scrollLeft =
        pointer.scrollLeft - (event.clientX - pointer.x);
      this.viewport.scrollTop = pointer.scrollTop - (event.clientY - pointer.y);
      event.preventDefault();
      return;
    }

    const point = this.canvasPoint(event);
    if (pointer.type === 'erase') {
      this.eraseAt(point);
      event.preventDefault();
      return;
    }

    const stroke = this.state.activeStroke;
    const previous = stroke?.points[stroke.points.length - 1];
    if (
      !stroke ||
      !previous ||
      Math.hypot(point.x - previous.x, point.y - previous.y) < 0.8
    )
      return;
    stroke.points.push(point);
    this.paint();
    event.preventDefault();
  }

  onPointerEnd(event) {
    const pointer = this.state.pointer;
    if (!pointer || pointer.id !== event.pointerId) return;

    if (pointer.type === 'draw' && this.state.activeStroke) {
      this.pushUndoState(this.state.strokes);
      this.state.strokes = [...this.state.strokes, this.state.activeStroke];
      this.state.activeStroke = null;
      this.commitChange('draw');
    } else if (pointer.type === 'erase' && this.state.eraseChanged) {
      this.pushUndoState(this.state.eraseSnapshot || []);
      this.commitChange('erase');
    }

    this.state.eraseSnapshot = null;
    this.root.classList.remove('is-panning');
    this.state.pointer = null;
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.paint();
  }

  eraseAt(point) {
    const radius = 24 / this.state.zoom;
    const before = this.state.strokes.length;
    this.state.strokes = this.state.strokes.filter(
      (stroke) => !strokeTouchesPoint(stroke, point, radius + stroke.width / 2),
    );
    if (this.state.strokes.length !== before) {
      this.state.eraseChanged = true;
      this.root.classList.toggle('has-ink', this.state.strokes.length > 0);
      this.paint();
    }
  }

  paintGrid() {
    this.context.fillStyle = '#fff';
    this.context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    this.context.save();
    this.context.strokeStyle = '#edf2f8';
    this.context.lineWidth = 1;
    for (let x = 32; x < PAGE_WIDTH; x += 32) {
      this.context.beginPath();
      this.context.moveTo(x + 0.5, 0);
      this.context.lineTo(x + 0.5, PAGE_HEIGHT);
      this.context.stroke();
    }
    for (let y = 32; y < PAGE_HEIGHT; y += 32) {
      this.context.beginPath();
      this.context.moveTo(0, y + 0.5);
      this.context.lineTo(PAGE_WIDTH, y + 0.5);
      this.context.stroke();
    }
    this.context.restore();
  }

  paint() {
    this.paintGrid();
    this.state.strokes.forEach((stroke) => drawStroke(this.context, stroke));
    if (this.state.activeStroke)
      drawStroke(this.context, this.state.activeStroke);
  }

  setZoom(value) {
    const previousZoom = this.state.zoom;
    const nextZoom = clamp(Math.round(value * 100) / 100, MIN_ZOOM, MAX_ZOOM);
    if (nextZoom === previousZoom) return;

    const centerX =
      (this.viewport.scrollLeft + this.viewport.clientWidth / 2) / previousZoom;
    const centerY =
      (this.viewport.scrollTop + this.viewport.clientHeight / 2) / previousZoom;
    this.state.zoom = nextZoom;
    this.page.style.width = `${PAGE_WIDTH * nextZoom}px`;
    this.page.style.height = `${PAGE_HEIGHT * nextZoom}px`;
    if (this.elements.zoom)
      this.elements.zoom.textContent = `${Math.round(nextZoom * 100)}%`;

    requestAnimationFrame(() => {
      this.viewport.scrollLeft =
        centerX * nextZoom - this.viewport.clientWidth / 2;
      this.viewport.scrollTop =
        centerY * nextZoom - this.viewport.clientHeight / 2;
    });
  }

  fitToViewport() {
    const availableWidth = Math.max(280, this.viewport.clientWidth - 60);
    const availableHeight = Math.max(260, this.viewport.clientHeight - 60);
    const fit = Math.min(
      availableWidth / PAGE_WIDTH,
      availableHeight / PAGE_HEIGHT,
      1,
    );
    this.setZoom(clamp(fit, MIN_ZOOM, MAX_ZOOM));
    requestAnimationFrame(() => {
      this.viewport.scrollLeft = Math.max(
        0,
        (this.page.offsetWidth - this.viewport.clientWidth) / 2,
      );
      this.viewport.scrollTop = Math.max(
        0,
        (this.page.offsetHeight - this.viewport.clientHeight) / 2,
      );
    });
  }

  requestClear() {
    if (!this.state.strokes.length && !this.state.activeStroke) return;
    const accepted = window.confirm(
      this.label(
        'ล้างลายเขียนทั้งหมดในหน้าปัจจุบันหรือไม่',
        'Clear all writing on the current page?',
      ),
    );
    if (accepted) this.clear();
  }

  get canUndo() {
    return this.history.undo.length > 0;
  }

  get canRedo() {
    return this.history.redo.length > 0;
  }

  pushUndoState(strokes = this.state.strokes) {
    this.history.undo.push(snapshotStrokes(strokes));
    if (this.history.undo.length > this.history.limit) this.history.undo.shift();
    this.history.redo = [];
    this.updateHistoryControls();
  }

  applyStrokeState(strokes) {
    this.state.strokes = snapshotStrokes(strokes);
    this.state.activeStroke = null;
    this.state.eraseChanged = false;
    this.state.eraseSnapshot = null;
    this.root.classList.toggle('has-ink', this.state.strokes.length > 0);
    this.paint();
  }

  loadSnapshot(snapshot) {
    const strokes = Array.isArray(snapshot?.strokes)
      ? snapshot.strokes
          .filter(
            (stroke) =>
              stroke &&
              typeof stroke.color === 'string' &&
              Number.isFinite(Number(stroke.width)) &&
              Array.isArray(stroke.points),
          )
          .map((stroke) => ({
            color: stroke.color,
            width: Number(stroke.width),
            points: stroke.points
              .filter(
                (point) =>
                  point &&
                  Number.isFinite(Number(point.x)) &&
                  Number.isFinite(Number(point.y)),
              )
              .map((point) => ({ x: Number(point.x), y: Number(point.y) })),
          }))
      : [];

    this.history.undo = [];
    this.history.redo = [];
    this.state.revision = Math.max(0, Number(snapshot?.revision) || 0);
    this.applyStrokeState(strokes);
    this.updateHistoryControls();
    if (snapshot?.context) this.setContext(snapshot.context);
    this.setStatus(
      strokes.length
        ? { th: 'โหลดลายเขียนของหน้านี้แล้ว', en: 'Writing restored for this page' }
        : toolMessages[this.state.tool],
    );
    return strokes.length;
  }

  get hasInk() {
    return this.state.strokes.length > 0 || Boolean(this.state.activeStroke);
  }

  get strokeCount() {
    return this.state.strokes.length + (this.state.activeStroke ? 1 : 0);
  }

  updateHistoryControls() {
    if (this.elements.undo) this.elements.undo.disabled = !this.canUndo;
    if (this.elements.redo) this.elements.redo.disabled = !this.canRedo;
  }

  undo() {
    if (!this.canUndo || this.state.pointer) return false;
    const previous = this.history.undo.pop();
    this.history.redo.push(snapshotStrokes(this.state.strokes));
    this.applyStrokeState(previous);
    this.updateHistoryControls();
    this.commitChange('undo');
    this.setStatus({ th: 'ย้อนการแก้ไขล่าสุดแล้ว', en: 'Last change undone' });
    return true;
  }

  redo() {
    if (!this.canRedo || this.state.pointer) return false;
    const next = this.history.redo.pop();
    this.history.undo.push(snapshotStrokes(this.state.strokes));
    this.applyStrokeState(next);
    this.updateHistoryControls();
    this.commitChange('redo');
    this.setStatus({ th: 'ทำการแก้ไขซ้ำแล้ว', en: 'Last change redone' });
    return true;
  }

  clear() {
    if (!this.state.strokes.length && !this.state.activeStroke) return false;
    this.pushUndoState(this.state.strokes);
    this.state.strokes = [];
    this.state.activeStroke = null;
    this.root.classList.remove('has-ink');
    this.paint();
    this.commitChange('clear');
    this.setStatus({ th: 'ล้างหน้าปัจจุบันแล้ว', en: 'Current page cleared' });
    return true;
  }

  commitChange(action) {
    this.state.revision += 1;
    this.root.dispatchEvent(
      new CustomEvent('notebook-core-change', {
        detail: {
          action,
          revision: this.state.revision,
          strokeCount: this.state.strokes.length,
          canUndo: this.canUndo,
          canRedo: this.canRedo,
        },
      }),
    );
  }

  exportSnapshot() {
    const hub = window.HubContext?.get?.();
    return {
      schema: NOTEBOOK_SCHEMA,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      revision: this.state.revision,
      context: this.contextInfo
        ? { ...this.contextInfo }
        : hub?.content
          ? { ...hub.content }
          : null,
      strokes: this.state.strokes.map((stroke) => ({
        color: stroke.color,
        width: stroke.width,
        points: stroke.points.map((point) => ({ ...point })),
      })),
    };
  }

  exportImage(type = 'image/png', quality) {
    return this.canvas.toDataURL(type, quality);
  }

  destroy() {
    document.removeEventListener(
      'learning-hub-context-change',
      this.onHubContextChange,
    );
  }
}

const notebookInstances = [
  ...document.querySelectorAll('[data-notebook-core]'),
].map((root) => new NotebookCore(root));

window.LearningHubNotebook = Object.freeze({
  schema: NOTEBOOK_SCHEMA,
  instances: notebookInstances,
  get primary() {
    return notebookInstances[0] || null;
  },
  get canUndo() {
    return notebookInstances[0]?.canUndo || false;
  },
  get canRedo() {
    return notebookInstances[0]?.canRedo || false;
  },
  undo() {
    return notebookInstances[0]?.undo() || false;
  },
  redo() {
    return notebookInstances[0]?.redo() || false;
  },
});
