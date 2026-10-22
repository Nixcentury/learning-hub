import { createTopicReviewBrowser } from './topic-review.js?v=topic-review-library-20261023-1';
import { bankSubjects } from './question-bank-model.js';

const params = new URLSearchParams(location.search);
const printButton = document.querySelector('[data-topic-review-print]');
const content = document.querySelector('[data-topic-review-content]');
let printing = false;
function setLanguage(value) {
  document.documentElement.lang = value === 'en' ? 'en' : 'th';
  document.querySelectorAll('[data-th][data-en]').forEach(node => { if (!node.children.length) node.textContent = node.dataset[document.documentElement.lang]; });
  document.querySelectorAll('[data-review-language]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.reviewLanguage === document.documentElement.lang)));
  browser?.refreshLanguage();
}
const browser = createTopicReviewBrowser({ root: document.querySelector('[data-topic-review-browser]'), content, printButton,
  onChange(selection) {
    const subject = selection?.subjectId || params.get('subject');
    if (Object.hasOwn(bankSubjects, subject)) document.querySelector('[data-review-back]').href = `../../index.html#${subject}/bank`;
  },
});
document.querySelectorAll('[data-review-language]').forEach(button => button.addEventListener('click', () => { if (!printing) setLanguage(button.dataset.reviewLanguage); }));
printButton.addEventListener('click', async () => {
  if (printing || printButton.disabled) return;
  printing = true; browser.setPrinting(true);
  try { await window.LearningHubPrint.printReview({ content, title: document.documentElement.lang === 'en' ? 'Topic review' : 'ทวนเนื้อหา' }); }
  finally { printing = false; browser.setPrinting(false); }
});
setLanguage(params.get('lang'));
void browser.open({ subjectId: params.get('subject'), preferred: [params.get('topic')] });
