import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { access } from 'node:fs/promises';
const jar = resolve(process.env.CLASSROOM_EMULATOR_JAR || 'work/monitor-qa/firebase-database-emulator.jar');
await access(jar);
const origin = 'http://127.0.0.1:9019';
const emulator = spawn(process.env.JAVA || 'java', ['-jar', jar, '--host', '127.0.0.1', '--port', '9019'], { stdio: ['ignore','pipe','pipe'] });
let log = '', exited = false;
for (const stream of [emulator.stdout, emulator.stderr]) stream.on('data', chunk => { log = (log + chunk).slice(-12000); });
emulator.on('exit', () => { exited = true; });
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (exited) throw Error('Emulator stopped: ' + log);
    try { await fetch(origin + '/.json?ns=demo-classroom-phase1', { signal: AbortSignal.timeout(500) }); ready = true; break; } catch {}
    await new Promise(done => setTimeout(done, 200));
  }
  if (!ready) throw Error('Emulator startup timed out: ' + log);
  for (const script of ['scripts/classroom-assignment-rules.test.mjs', 'scripts/classroom-rules.test.mjs']) {
    const child = spawn(process.execPath, ['--test', script], { stdio: 'inherit', env: { ...process.env, CLASSROOM_EMULATOR_ORIGIN: origin } });
    const code = await new Promise((done, reject) => { child.on('error', reject); child.on('exit', done); });
    if (code) throw Error('QA failed: ' + script);
  }
} catch (failure) { console.error(failure.message); if (log.includes('ERROR') || log.includes('Exception')) console.error(log); process.exitCode = 1; }
finally { emulator.kill('SIGTERM'); }
