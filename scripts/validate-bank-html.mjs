import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { DOMParser, parseHTML } from 'linkedom';
import { adaptLegacyBank } from '../public/shared/question-bank-adapter.js';
import { readQuizContent } from '../public/shared/quiz-content-adapter.js';
import { bankSnapshotBody, validateBankSnapshot } from '../public/shared/question-bank-model.js';

// Offline authoring check. No Sheet, Apps Script, account or attempt is written.
try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    subject: { type: 'string', default: 'chemistry' },
    'bank-key': { type: 'string', default: 'b-' + '0'.repeat(24) },
  } });
  if (positionals.length !== 1) throw Error('Usage: node scripts/validate-bank-html.mjs draft.html|snapshot.json [--subject chemistry|physics] [--bank-key b-…]');
  const filename = positionals[0], source = await readFile(filename, 'utf8');
  let snapshot;
  if (filename.toLowerCase().endsWith('.json')) {
    const value = JSON.parse(source); snapshot = value.data || value;
  } else {
    snapshot = { schemaVersion: 1, subjectId: values.subject, bankKey: values['bank-key'],
      legacyId: 'Offline authoring validation', title: basename(filename), rows: [{ rowNumber: 2, html: source }] };
    snapshot.revision = createHash('sha256').update(JSON.stringify(bankSnapshotBody(snapshot))).digest('hex');
  }
  await validateBankSnapshot(snapshot, snapshot.subjectId, snapshot.bankKey);
  const parsed = snapshot.rows.map(row => new DOMParser().parseFromString(row.html, 'text/html'));
  for (let i = 0; i < parsed.length; i++) {
    const doc = parsed[i];
    if (doc.querySelector('script,style,iframe,object,embed,canvas,audio,video,form,button,select,textarea'))
      throw Error(`Row ${snapshot.rows[i].rowNumber}: authoring markup contains scripts, extra controls or embedded media`);
    if ([...doc.querySelectorAll('*')].some(node => [...node.attributes].some(attr => /^on/i.test(attr.name))))
      throw Error(`Row ${snapshot.rows[i].rowNumber}: event handlers are not allowed`);
  }
  const { document } = parseHTML('<!doctype html><html><body></body></html>');
  const root = adaptLegacyBank(snapshot, { document, Parser: DOMParser });
  const { questions, errors } = readQuizContent(root);
  if (errors.length || !questions.length) throw Error(errors.join(' ') || 'No questions');
  const extraHeadings = parsed.reduce((n, doc) => n + [...doc.querySelectorAll('.question-step')]
    .reduce((sum, q) => sum + Math.max(0, q.querySelectorAll('h3').length - 1), 0), 0);
  console.log(JSON.stringify({ status: 'PASS', file: filename, questions: questions.length,
    choice: questions.filter(q => q.type === 'choice').length,
    numeric: questions.filter(q => q.type === 'number').length,
    svgImages: root.querySelectorAll('img[data-bank-svg]').length,
    additionalHeadingsPreserved: extraHeadings,
    note: 'Structural check only. Verify scientific accuracy, image decoding, mobile layout and worksheet/answer printing separately. No publication or progress changes.' }, null, 2));
} catch (error) {
  console.error('FAIL:', error.message);
  process.exitCode = 1;
}
