import { appendFile } from 'node:fs/promises';

export const lineAt = (source, offset = 0) => source.slice(0, Math.max(0, offset)).split('\n').length;
// Keep offsets/line numbers intact when comments are ignored by metadata checks.
export const withoutComments = source => source.replace(/<!--[\s\S]*?-->/g, text => text.replace(/[^\r\n]/g, ' '));
const escapeData = value => String(value).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
const escapeProperty = value => escapeData(value).replaceAll(':', '%3A').replaceAll(',', '%2C');
export function annotation(item) {
  return `::${item.level} file=${escapeProperty(item.file)},line=${item.line},title=Learning Hub content::${escapeData(item.message)}`;
}
export async function reportContentDiagnostics(items, { github = process.env.GITHUB_ACTIONS === 'true', summary = process.env.GITHUB_STEP_SUMMARY, log = console.log } = {}) {
  for (const item of items) {
    log(`${item.level === 'error' ? 'ERROR' : 'WARNING'} ${item.file}:${item.line}: ${item.message}`.replace(/[\r\n]/g, ' '));
    if (github) log(annotation(item));
  }
  const errors = items.filter(item => item.level === 'error').length;
  const warnings = items.length - errors;
  log(`Learning Hub: ${errors} error(s), ${warnings} draft warning(s). Drafts do not block the build.`);
  if (summary) {
    const cell = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('|', '&#124;').replace(/[\r\n]/g, ' ');
    const rows = items.map(item => `| ${item.level} | ${cell(item.file)}:${item.line} | ${cell(item.message)} |`);
    await appendFile(summary, `\n## ผลตรวจเนื้อหา Learning Hub\n\nข้อผิดพลาด ${errors} รายการ · Draft ${warnings} รายการ (ไม่บล็อกการสร้างเว็บ)\n\n` + (rows.length ? `| ระดับ | ไฟล์:บรรทัด | จุดที่ต้องแก้ |\n| --- | --- | --- |\n${rows.join('\n')}\n` : 'ตรวจผ่าน ไม่มีรายการที่ต้องแก้\n'));
  }
}
