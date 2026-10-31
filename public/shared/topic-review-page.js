import { createTopicReviewBrowser } from './topic-review.js?v=exam-review-20261031';
import { bankSubjects } from './question-bank-model.js';

const params = new URLSearchParams(location.search);
const printButton = document.querySelector('[data-topic-review-print]');
const content = document.querySelector('[data-topic-review-content]');
const embedded = params.get('embedded') === '1' && parent !== window;
if (embedded) document.body.dataset.reviewEmbedded = '';
let printing = false;
let applying = false, applyVersion = 0, commandId = null;
function setLanguage(value, refresh = true) {
  document.documentElement.lang = value === 'en' ? 'en' : 'th';
  document.querySelectorAll('[data-th][data-en]').forEach(node => { if (!node.children.length) node.textContent = node.dataset[document.documentElement.lang]; });
  document.querySelectorAll('[data-review-language]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.reviewLanguage === document.documentElement.lang)));
  if (refresh) browser?.refreshLanguage();
}
const browser = createTopicReviewBrowser({ root: document.querySelector('[data-topic-review-browser]'), content, printButton,
  allowEmptySubject: !embedded,
  onExamQuestion: embedded ? selection => {
    if (!printing && !applying && commandId !== null) parent.postMessage({
      type: 'learning-hub-review-practice', commandId, selection: browser.getSelection(), questionNumber: selection.questionNumber,
    }, location.origin);
  } : null,
  onChange(selection) {
    const current = selection || browser.getSelection();
    const subject = current.subjectId || params.get('subject');
    if (Object.hasOwn(bankSubjects, subject)) document.querySelector('[data-review-back]').href = `../../index.html#${subject}/bank${current.bankKey ? '/' + current.bankKey : ''}`;
    if (embedded && !applying && commandId !== null) parent.postMessage({ type: 'learning-hub-review-selection',
      commandId, selection: browser.getSelection() }, location.origin);
  },
});
document.querySelectorAll('[data-review-language]').forEach(button => button.addEventListener('click', () => {
  if (printing) return;
  setLanguage(button.dataset.reviewLanguage);
  if (embedded) parent.postMessage({ type: 'learning-hub-language-request', language: document.documentElement.lang }, location.origin);
}));
document.querySelector('[data-review-back]').addEventListener('click', event => {
  if (!embedded || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
  event.preventDefault();
  if (!printing && commandId !== null) parent.postMessage({ type: 'learning-hub-review-back', commandId }, location.origin);
});
printButton.addEventListener('click', async () => {
  if (printing || printButton.disabled) return;
  printing = true; browser.setPrinting(true);
  try { await window.LearningHubPrint.printReview({ content, metadata: browser.getPrintMetadata(), title: document.documentElement.lang === 'en' ? 'Topic review' : 'ทวนเนื้อหา' }); }
  finally { printing = false; browser.setPrinting(false); }
});
if (embedded) {
  window.addEventListener('message', async event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'learning-hub-review-select') return;
    const data = event.data, selection = data.selection;
    if (!Object.hasOwn(bankSubjects, selection?.subjectId) || !Number.isInteger(data.commandId) ||
        (selection.bankKey !== null && !/^b-[a-f0-9]{24}$/.test(selection.bankKey || ''))) return;
    if (commandId !== null && data.commandId <= commandId) return;
    commandId = data.commandId;
    const version = ++applyVersion;
    const previous = browser.getSelection();
    const changed = previous.subjectId !== selection.subjectId || previous.bankKey !== selection.bankKey || document.documentElement.lang !== data.language;
    applying = true;
    setLanguage(data.language, false);
    try {
      if (changed) await browser.open({ subjectId: selection.subjectId, preferred: selection.bankKey ? [selection.bankKey] : [], clearSelection: !selection.bankKey });
    } finally { if (version === applyVersion) applying = false; }
  });
  parent.postMessage({ type: 'learning-hub-review-ready' }, location.origin);
} else {
  setLanguage(params.get('lang'));
  void browser.open({ subjectId: params.get('subject'), preferred: [params.get('topic')] });
}
