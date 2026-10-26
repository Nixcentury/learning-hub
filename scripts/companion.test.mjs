import assert from 'node:assert/strict';
import test from 'node:test';
import { armGesture, beginGesture, clampPoint, createCompanionClient, gestureOutcome,
  moveGesture, normalizePoint, readCompanionPreferences, restorePoint } from '../js/companion-model.js';

const event = (pointerType = 'mouse', x = 40, y = 50) => ({ pointerId: 1, pointerType, clientX: x, clientY: y });

test('dragging an owl never becomes a chat click, including release at the start position', () => {
  const state = beginGesture(event(), { x: 100, y: 100 });
  assert.equal(gestureOutcome(state), 'tap');
  assert.deepEqual(moveGesture(state, event('mouse', 80, 90)), { x: 140, y: 140 });
  moveGesture(state, event());
  assert.equal(gestureOutcome(state), 'drag');
});

test('touch and pen require a hold; cancelled scrolling and another pointer cannot move the owl', () => {
  for (const type of ['touch', 'pen']) {
    const cancelled = beginGesture(event(type), { x: 100, y: 100 });
    assert.equal(moveGesture(cancelled, event(type, 100, 100)), null);
    assert.equal(armGesture(cancelled), false);
    assert.equal(gestureOutcome(cancelled), 'none');
    const held = beginGesture(event(type), { x: 100, y: 100 });
    armGesture(held);
    assert.equal(moveGesture(held, { ...event(type, 100, 100), pointerId: 2 }), null);
    assert.equal(gestureOutcome(held), 'none');
    assert.deepEqual(moveGesture(held, event(type, 80, 90)), { x: 140, y: 140 });
    assert.equal(gestureOutcome(held), 'drag');
  }
});

test('positions stay in the visual viewport after rotation and opening the keyboard', () => {
  const old = { x: 0, y: 0, width: 1300, height: 900 };
  const saved = normalizePoint({ x: 1100, y: 700 }, old, 112, 112);
  const small = { x: 0, y: 35, width: 320, height: 330 };
  const next = restorePoint(saved, small, 94, 94);
  assert.ok(next.x + 94 <= 312 && next.y + 94 <= 357);
  assert.deepEqual(clampPoint({ x: -50, y: -50 }, small, 94, 94), { x: 8, y: 43 });
  assert.deepEqual(readCompanionPreferences('not JSON'), { position: null, panelPosition: null, hidden: false, motion: true });
  assert.deepEqual(readCompanionPreferences('{"position":{"x":-2,"y":8},"hidden":true,"chat":"private"}'),
    { position: { x: 0, y: 1 }, panelPosition: null, hidden: true, motion: true });
});

test('chat sends only bounded conversation and language, without cookies or user identity', async () => {
  let sent;
  const client = createCompanionClient({ endpoint: 'https://example.test/chat', fetcher: async (url, options) => {
    sent = { url, options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({ reply: '  คำตอบจริง  ' }));
  } });
  const reply = await client.ask({ message: 'ทำไม?', language: 'en', uid: 'private-account',
    history: [{ role: 'system', content: 'untrusted instruction' }, { role: 'assistant', content: 'previous', email: 'private@example.test' }] });
  assert.equal(reply, 'คำตอบจริง');
  assert.equal(sent.options.credentials, 'omit');
  assert.deepEqual(sent.body, { mode: 'text_chat', userMessage: 'Please reply in English.\n\nทำไม?',
    conversation: [{ role: 'assistant', text: 'previous' }] });
  assert.equal(JSON.stringify(sent.body).includes('private'), false);
});

test('chat never substitutes grading results or sample text for an unavailable AI reply', async () => {
  const empty = createCompanionClient();
  assert.equal(empty.ready, false);
  await assert.rejects(empty.ask({ message: 'hi' }), { code: 'not-configured' });
  for (const data of [{ status: 'correct', feedback_th: 'correct' }, { reply: '' }, null]) {
    const client = createCompanionClient({ endpoint: 'https://example.test', fetcher: async () => new Response(JSON.stringify(data)) });
    await assert.rejects(client.ask({ message: 'hi' }), { code: 'invalid-response' });
  }
  const limited = createCompanionClient({ endpoint: 'https://example.test', fetcher: async () => new Response('{}', { status: 429 }) });
  await assert.rejects(limited.ask({ message: 'hi' }), { code: 'rate-limit', status: 429 });
});

test('chat cancellation and timeout finish without retrying a paid AI call', async () => {
  let calls = 0;
  const fetcher = (_, { signal }) => { calls++; return new Promise((resolve, reject) => {
    if (signal.aborted) reject(new DOMException('Aborted', 'AbortError'));
    else signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }); };
  const client = createCompanionClient({ endpoint: 'https://example.test', timeoutMs: 20, fetcher });
  await assert.rejects(client.ask({ message: 'hi' }), { code: 'timeout' });
  const controller = new AbortController();
  const pending = client.ask({ message: 'hi', signal: controller.signal }); controller.abort();
  await assert.rejects(pending, { code: 'cancelled' });
  assert.equal(calls, 2);
});

test('chat rejects unsafe endpoints and bounds conversation before sending', async () => {
  const unsafe = createCompanionClient({ endpoint: 'http://example.test' });
  await assert.rejects(unsafe.ask({ message: 'hi' }), { code: 'invalid-endpoint' });
  let body;
  const client = createCompanionClient({ endpoint: 'http://127.0.0.1/chat', fetcher: async (_, options) => {
    body = JSON.parse(options.body); return new Response('{"reply":"ok"}');
  } });
  await client.ask({ message: 'hi', history: Array.from({ length: 50 }, () => ({ role: 'user', content: 'x'.repeat(10000) })) });
  assert.ok(body.conversation.length <= 12 && body.conversation.reduce((total, entry) => total + entry.text.length, 0) <= 18000);
});
