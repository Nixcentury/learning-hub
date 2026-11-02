import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { access } from 'node:fs/promises';
const jar=resolve(process.env.CLASSROOM_EMULATOR_JAR || 'work/monitor-qa/firebase-database-emulator.jar');
await access(jar);
const origin='http://127.0.0.1:9021';
const emulator=spawn('java',['-jar',jar,'--host','127.0.0.1','--port','9021'],{stdio:['ignore','pipe','pipe']});
let log='',exited=false;for(const stream of [emulator.stdout,emulator.stderr])stream.on('data',chunk=>{log=(log+chunk).slice(-12000);});
emulator.on('exit',()=>{exited=true;});
try {
 let ready=false;
 for(let i=0;i<120;i++) {if(exited)throw Error(log);try{await fetch(origin+'/.json?ns=demo-classroom-phase1',{signal:AbortSignal.timeout(500)});ready=true;break;}catch{}await new Promise(done=>setTimeout(done,200));}
 if(!ready)throw Error('Emulator not reachable: '+log);
 const tests=['scripts/classroom-assist-rules.test.mjs','scripts/classroom-room-teachers-rules.test.mjs','scripts/classroom-teachers-rules.test.mjs','scripts/classroom-roster-rules.test.mjs','scripts/classroom-rules.test.mjs','scripts/classroom-links-rules.test.mjs','scripts/classroom-monitor-rules.test.mjs','scripts/classroom-assignment-rules.test.mjs','scripts/classroom-submission-rules.test.mjs'];
 for(const file of tests){
  const child=spawn(process.execPath,['--test',file],{stdio:'inherit',env:{...process.env,CLASSROOM_EMULATOR_ORIGIN:origin,CLASSROOM_TEST_ROSTER:'1',CLASSROOM_TEST_ROOM_TEACHERS:'1',CLASSROOM_TEST_ASSIST:'1'}});
  const code=await new Promise((done,reject)=>{child.on('error',reject);child.on('exit',done);});if(code)throw Error('QA failed: '+file);
 }
} catch(error) {console.error(error.message);process.exitCode=1;} finally {emulator.kill('SIGTERM');}
