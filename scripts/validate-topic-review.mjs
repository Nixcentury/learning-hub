import assert from 'node:assert/strict';
import {readFile, readdir, realpath} from 'node:fs/promises';
import {resolve, relative, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DOMParser, parseHTML} from 'linkedom';
import {reviewDocument, reviewExamNumber} from '../public/shared/topic-review-model.js';
import {catalogFromRepository} from './build-route-catalog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = resolve(root, 'public');
const reviewsRoot = resolve(publicRoot, 'content/reviews');
const site = new URL('https://review-validation.invalid/learning-hub/');
const args = process.argv.slice(2);
const all = args.includes('--all');
const contentOnly = args.includes('--content-only');
const paths = args.filter(arg => !arg.startsWith('--'));
const unknown = args.filter(arg => arg.startsWith('--') && !['--all', '--content-only'].includes(arg));
if (unknown.length || (all ? paths.length > 0 : !paths.length)) {
  console.error('Usage: node scripts/validate-topic-review.mjs [--content-only] public/content/reviews/<subject>/<file>.html\n       node scripts/validate-topic-review.mjs --all');
  process.exit(1);
}

function inside(parent, child) {
  const local = relative(parent, child);
  return !isAbsolute(local) && local !== '..' && !local.startsWith('../') && !local.startsWith('..\\');
}
async function discover(folder) {
  const result = [];
  for (const entry of await readdir(folder, {withFileTypes:true})) {
    const path = resolve(folder, entry.name);
    if (entry.isDirectory()) result.push(...await discover(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(path);
  }
  return result.sort();
}

async function validate(path, catalog) {
  const absolute = await realpath(resolve(root, path));
  assert.ok(inside(reviewsRoot, absolute), 'Content must be under public/content/reviews/');
  const source = relative(publicRoot, absolute).replaceAll('\\', '/');
  const html = await readFile(absolute, 'utf8');
  assert.ok(!/__[A-Z][A-Z0-9_]*__/.test(html), 'Replace every template placeholder');
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  assert.equal(parsed.querySelectorAll('[data-topic-review-document]').length, 1, 'One review document root is required');
  const main = parsed.querySelector('[data-topic-review-document]');
  const examBank = main.dataset.reviewQuizBank;
  if (examBank !== undefined) assert.match(examBank, /^b-[a-f0-9]{24}$/, 'Exam review must declare its actual bank key');
  const languageRoots = [...main.querySelectorAll('[data-content-lang]')];
  assert.equal(languageRoots.length, 2, 'Use exactly two complete language sections');
  assert.deepEqual(languageRoots.map(node => node.dataset.contentLang), ['th', 'en'], 'Thai full section, then English full section');
  assert.equal(main.querySelectorAll('script,style,iframe,canvas,form,input,button,select,textarea,math,audio,video,object,embed,template').length, 0,
    'Do not author active or discarded elements inside the review document');
  for (const node of main.querySelectorAll('*')) {
    assert.ok(![...node.attributes].some(attr => /^on/i.test(attr.name)), 'Remove event handler attributes');
    if (node.hasAttribute('hidden')) assert.ok(node.hasAttribute('data-review-answer'), 'Only answers may start hidden');
  }
  for (const img of main.querySelectorAll('img')) {
    assert.ok(img.getAttribute('alt')?.trim(), 'Every figure needs meaningful alt text');
    const raw = img.getAttribute('src');
    assert.ok(raw?.trim(), 'Every image needs src');
    const url = new URL(raw, new URL(source, site));
    assert.ok(!url.username && !url.password && url.protocol === 'https:', 'Use a local image or credential-free HTTPS image');
    if (url.origin === site.origin) {
      assert.ok(url.pathname.startsWith(site.pathname), 'Image must stay inside the site');
      const imagePath = await realpath(resolve(publicRoot, decodeURIComponent(url.pathname.slice(site.pathname.length))));
      assert.ok(inside(publicRoot, imagePath), 'Image must stay inside public/');
    }
  }

  const {document} = parseHTML('<html><body></body></html>');
  const reports = [];
  for (const language of ['th', 'en']) {
    const languageRoot = languageRoots.find(node => node.dataset.contentLang === language);
    const questions = [...languageRoot.querySelectorAll('[data-review-question]')];
    const examSections = [...languageRoot.querySelectorAll('[data-review-exam-question]')];
    const examNumbers = examSections.map(section => reviewExamNumber(section.dataset.reviewExamQuestion));
    if (examSections.length) {
      assert.ok(examBank, 'Exam sections need a declared bank key');
      assert.ok(examNumbers.every(Boolean), 'Exam question numbers must be integers from 1 to 1000');
      assert.equal(new Set(examNumbers).size, examNumbers.length, 'Do not duplicate an exam question in one language');
      assert.ok(examSections.every(section => section.localName === 'section' && section.querySelector('h2') && !section.querySelector('[data-review-exam-question]')), 'Use independent exam sections with h2 headings');
    }
    assert.ok(questions.length, `${language}: supply recall questions`);
    const counts = [];
    questions.forEach((question, index) => {
      assert.equal(question.querySelectorAll('[data-review-question]').length, 0, 'Do not nest recall questions');
      const heading = question.querySelector('h3,h4');
      assert.ok(heading?.textContent.trim(), 'Every recall question needs a heading');
      const prefix = language === 'th' ? 'คำถาม' : 'Question';
      assert.match(heading.textContent.trim(), new RegExp(`^${prefix}\\s+${index+1}(?!\\d)`), 'Use continuous question numbering in each language');
      const answers = [...question.querySelectorAll('[data-review-answer]')];
      assert.equal(answers.length, 1, 'Use one answer container per question');
      assert.ok(answers[0].hasAttribute('hidden'), 'Answers must start hidden');
      assert.ok(answers[0].textContent.trim(), 'Answer containers cannot be empty');
      const blanks = [...question.querySelectorAll('[data-review-blank]')];
      assert.ok(blanks.length, 'Every question needs student writing space');
      assert.ok(blanks.every(blank => !blank.contains(answers[0]) && !answers[0].contains(blank)), 'Keep answers and student blanks separate');
      counts.push(blanks.length);
    });
    const rendered = reviewDocument(html, new URL(source, site), {document, Parser:DOMParser, language});
    assert.equal(rendered.querySelectorAll('[data-review-question]').length, questions.length, 'All questions must survive the player sanitizer');
    const answers = [...rendered.querySelectorAll('[data-review-answer]')];
    assert.equal(answers.length, questions.length);
    assert.ok(answers.every(answer => answer.hidden), 'The player must keep every answer hidden');
    assert.equal(rendered.querySelectorAll('img').length, languageRoot.querySelectorAll('img,svg').length, 'Every figure must survive the sanitizer');
    assert.deepEqual([...rendered.querySelectorAll('[data-review-exam-question]')].map(section => reviewExamNumber(section.dataset.reviewExamQuestion)), examNumbers, 'Exam sections must survive the sanitizer');
    reports.push({language, questions:questions.length, blanks:counts.reduce((a,b)=>a+b,0), blanksByQuestion:counts, images:rendered.querySelectorAll('img').length, ...(examBank ? {examNumbers} : {})});
  }
  assert.deepEqual(reports[0].blanksByQuestion, reports[1].blanksByQuestion, 'TH/EN question counts and writing-space counts must match');
  assert.deepEqual(reports[0].examNumbers, reports[1].examNumbers, 'TH/EN must cover the same exam questions');
  let routes = [];
  if (!contentOnly) {
    const entries = catalog.contents.filter(item => item.source === source);
    assert.equal(entries.length, 1, 'Register one content identity for this source in an HTML bank menu');
    routes = catalog.routes.filter(route => route.contentId === entries[0].id && route.toolKey === 'review' && route.kind === 'content' && route.status === 'ready');
    assert.ok(routes.length, 'The content needs a ready bank review route');
    assert.ok(routes.every(route => /^b-[a-f0-9]{24}$/.test(route.bankKey || '')), 'Review routes must use real-format bank keys');
    if (examBank) assert.ok(routes.every(route => route.bankKey === examBank), 'Exam review must be registered under its declared bank key');
  }
  console.log(JSON.stringify({source, languages:reports, routes:routes.map(route => ({subjectId:route.subjectId,bankKey:route.bankKey})), registrationChecked:!contentOnly}));
}

try {
  const files = all ? await discover(reviewsRoot) : paths;
  assert.ok(files.length, 'No review files found');
  const catalog = contentOnly ? null : await catalogFromRepository(root);
  for (const file of files) await validate(file, catalog);
  console.log(`PASS: ${files.length} review file(s). Review factual accuracy, live catalog IDs, subpart spacing, browser layout and print states separately.`);
} catch (error) {
  console.error(`Review validation failed: ${error.message}`);
  process.exitCode = 1;
}
