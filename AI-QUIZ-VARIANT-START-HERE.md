# Temporary AI practice

Each original question has **สร้างแนวข้อสอบจากข้อนี้ / Create practice from this question**. Open a quiz through the Hub, select that button, and use Study Owl's question-specific conversation to request changed numbers, formula recall, a new situation or a harder question. Selecting a source only opens guidance; a request is sent after the student selects a style or sends a message.

The authored question, context, choices, answer and reference explanation are captured before MathJax rendering and before student evidence is mounted. TH/EN references are captured separately. Student identity, answers, scores, typed reasoning and notebook pages are not included. A source over 11,000 characters is rejected visibly rather than silently truncated.

The existing Worker is used in its documented `text_chat` mode. The request still contains only `mode`, `userMessage`, and `conversation`. A pinned reference supplies the source and HTML template independently of chat history trimming. There are no new model keys, Worker modes or backend deployments.

## Output contract and transport

`public/content/templates/ai-quiz-variant-template.txt` is the exact template sent to AI. Ordinary replies remain inert text. A completed question must be enclosed in `<!-- learning-hub-practice:start -->` / `<!-- learning-hub-practice:end -->` markers. Exactly one `.question-step` with a valid choice or numeric answer and a nonempty `.feedback-box` is required.

HTML is parsed off-document, rejected if active content or external resources appear, and rebuilt through the existing question-bank allowlist and central question model. Static SVG is supported through the existing SVG sanitizer. AI output is never assigned to a live `innerHTML` container. Valid output opens `quiz-player.html?temporary=1` in a native modal. The parent and child exchange `learning-hub-temporary-quiz-ready` / `learning-hub-temporary-quiz-content` messages, checking both origin and the exact window. Temporary content is never placed in a URL, registered in the catalog, or attached to the Hub storage bridge.

The shared engine's temporary mode bypasses local restore/save, cloud restore/save and notebook initialization. Score, hints and retries exist only in RAM. Private placeholder identifiers satisfy the existing model but are never registered or saved. Normal quizzes retain their existing persistence behavior.

## Lifetime

- Close practice: remove the iframe, destroy its state and release its HTML. Return to the source-specific AI conversation. The raw generated HTML is not retained in conversation history.
- Close the AI panel: cancel its pending request, discard its source-specific history, and restore the previous general conversation.
- Switch source: cancel the previous generation and start a fresh source-specific conversation.
- Close the source tool or switch identity: cancel generation and close temporary practice.
- Late responses after cancellation cannot open another practice window.

## Images and correctness

The chat Worker receives text, not image pixels. Authored static SVG is decoded to readable source code. Raster image URLs/alt text are references only; the prompt explicitly asks for missing essential visual information rather than pretending to see an image. No screenshot/vision integration is claimed. Generated practice supports text, formulas, tables and self-contained static SVG; external generated images are rejected.

The structural validator checks the answer format and that a choice key exists. It cannot establish scientific correctness. The authoring prompt requires recalculation and explanation; teachers should review representative generated questions. The engine grades against the AI-supplied key.

## Files and checks

- `public/shared/quiz-variant-model.js`: reference capture, prompt/template, strict HTML parsing, temporary handshake.
- `js/companion.js`, `js/companion-model.js`: question-specific conversation and pinned source.
- `js/workspace.js`, `js/app.js`: requests from live owned Quiz frames only; source-tool lifetime.
- `js/quiz-variant-preview.js`: temporary modal and one-way HTML delivery.
- `public/shared/quiz-core.js`: per-question button and memory-only engine mode.
- `scripts/quiz-variant.test.mjs`: parser, source, privacy boundaries and messaging.
- `scripts/test-quiz-variant-browser.mjs`: actual Hub, Owl and central player with mocked AI/Firebase. Instrumentation rejects storage writes and IndexedDB opens in temporary players.

Run `pnpm test:unit`, `pnpm build`, then `QA_BUILT=1 PLAYWRIGHT_MODULE=<installed-playwright> pnpm test:variant:browser`. The PR browser workflow installs an isolated Chromium and also runs existing companion browser regressions. Browser tests do not call the live AI or write real student data. Real iPad Safari/Apple Pencil behavior still needs device verification.

Live service smoke checks on 28 October 2026 used two synthetic force questions, including the production client with a pinned source/template; both replies parsed successfully into central-engine content. No real student data was sent.
