// Start emulator and tests in one process tree; never contacts a real Firebase project.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { access } from 'node:fs/promises';
const jar = resolve(process.env.CLASSROOM_EMULATOR_JAR || 'work/monitor-qa/firebase-database-emulator.jar');
await access(jar);
const port = 9018;
const emulator = spawn(process.env.JAVA || 'java', ['-jar', jar, '--host', '127.0.0.1', '--port', String(port)], { stdio: ['ignore','pipe','pipe'] });
let log = '', exitCode = null;
emulator.stdout.on('data', chunk => { log = (log + chunk).slice(-12000); }); emulator.stderr.on('data', chunk => { log = (log + chunk).slice(-12000); });
emulator.on('exit', code => { exitCode = code; });
process.env.CLASSROOM_EMULATOR_ORIGIN = `http://127.0.0.1:${port}`;
try {
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    if (exitCode !== null) throw Error('Emulator stopped: ' + log);
    try { await fetch(process.env.CLASSROOM_EMULATOR_ORIGIN + '/.json?ns=demo-classroom-phase1', { signal: AbortSignal.timeout(500) }); ready = true; break; } catch {}
    await new Promise(done => setTimeout(done, 200));
  }
  if (!ready) throw Error('Emulator startup timed out: ' + log);
  const scripts = process.argv.includes('--browser') ? [['scripts/test-classroom-monitor-browser.mjs']]
    : process.argv.includes('--sdk') ? [['scripts/test-classroom-monitor-sdk.mjs']]
    : [['--test','scripts/classroom-monitor-rules.test.mjs'], ['--test','scripts/classroom-rules.test.mjs']];
  for (const args of scripts) {
    const child = spawn(process.execPath, args, { stdio: 'inherit', env: process.env });
    const code = await new Promise((done, reject) => { child.on('error', reject); child.on('exit', done); });
    if (code) throw Error('QA failed: ' + args.join(' '));
  }
} catch (failure) { console.error(failure.message); if (log.includes('ERROR') || log.includes('Exception')) console.error(log); process.exitCode = 1; }
finally { emulator.kill('SIGTERM'); }
