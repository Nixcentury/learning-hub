import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClassroomSheetCsv, classroomCsvText } from '../public/shared/classroom-sheet-export.js';
const script = await readFile(new URL('../integrations/google-classroom/HubClassroomSheetBridge.gs', import.meta.url), 'utf8');
const rid = 'r_' + 'a'.repeat(32), aid = 'a_' + 'b'.repeat(32), key = rid + '/' + aid;
const item = {id:aid,title:'คลื่น, "ทดลอง"\nฝึกซ้ำ',instructions:'=IMPORTXML("x")',contentId:'waves-quiz',status:'published',dueAt:Date.parse('2026-11-10T10:30:00Z')};
const time = Date.parse('2026-10-31T04:00:00Z');
const student = (uid='s1', revision=1, score=1) => ({uid,name:'นักเรียน '+uid,submitted:true,submissionId:String(revision).padStart(32,'0'),grade:{score,maxScore:3,percent:Math.round(score/3*10000)/100,submittedAt:time+revision,submissionRevision:revision}});
const csv = (rows=[student()], changes={}) => createClassroomSheetCsv({roomId:rid,roomName:'ฟิสิกส์',item,hubUrl:'https://nixcentury.github.io/learning-hub/?x=1#other',rows,exportedAt:time,...changes});
function fixture() {
  const sheets = new Map(), patches = [], created = [], alerts = [], properties = new Map(), works = new Map(), submissions = new Map();
  let active, locked=false, createLost=false;
  class Range {
    constructor(sheet,r,c,h,w){Object.assign(this,{sheet,r,c,h,w});}
    getValues(){return Array.from({length:this.h},(_,ri)=>Array.from({length:this.w},(_,ci)=>this.sheet.data[this.r-1+ri]?.[this.c-1+ci]??''));}
    getFormulas(){return this.getValues().map(r=>r.map(v=>typeof v==='string'&&v.startsWith('=')?v:''));}
    setValues(values){assert.equal(values.length,this.h);for(let ri=0;ri<this.h;ri++){assert.equal(values[ri].length,this.w);const at=this.sheet.data[this.r-1+ri]||=[];for(let ci=0;ci<this.w;ci++)at[this.c-1+ci]=values[ri][ci];}return this;}
    clearContent(){return this.setValues(Array.from({length:this.h},()=>Array(this.w).fill('')));}
    setNumberFormat(){return this;}setFontWeight(){return this;}setBackground(){return this;}
    getRow(){return this.r;}getNumRows(){return this.h;}
  }
  class Sheet {
    constructor(name){this.name=name;this.data=[];this.max=1000;this.selected=2;}
    getName(){return this.name;}getLastRow(){return this.data.findLastIndex(r=>r?.some(v=>v!==''))+1;}
    getLastColumn(){return this.data.reduce((max,r)=>Math.max(max,r.findLastIndex(v=>v!=='')+1),0);}
    getRange(r,c,h,w){return new Range(this,r,c,h,w);}setFrozenRows(){}getMaxRows(){return this.max;}insertRowsAfter(_,n){this.max+=n;}
    getActiveRange(){return this.getRange(this.selected,1,1,1);}
  }
  const ss={getSheetByName:name=>sheets.get(name),insertSheet(name){const s=new Sheet(name);sheets.set(name,s);active||=s;return s;},getActiveSheet:()=>active};
  const ui={alert(...args){assert.equal(locked,false,'No UI suspension while document lock is held');alerts.push(args);return 'YES';},ButtonSet:{YES_NO:'YES_NO'},Button:{YES:'YES'},createMenu(){return {addItem(){return this;},addSeparator(){return this;},addToUi(){}};}};
  const api={
    Courses:{get:id=>({id,name:'ฟิสิกส์ ม.5',courseState:'ACTIVE'}),list:()=>({courses:[]}),CourseWork:{
      list:(id,_options)=>({courseWork:[...works.values()].filter(w=>w.courseId===id)}),
      create(body,id){const work={...body,id:String(900+works.size),courseId:id,associatedWithDeveloper:true};works.set(work.id,work);created.push(body);if(createLost){createLost=false;throw Error('lost acknowledgement');}return structuredClone(work);},
      get:(cid,id)=>structuredClone(works.get(id)),
      StudentSubmissions:{
        list:(cid,wid,options)=>({studentSubmissions:submissions.has(options.userId)?[structuredClone(submissions.get(options.userId))]:[]}),
        get:(cid,wid,id)=>structuredClone([...submissions.values()].find(s=>s.id===id)),
        patch(body,cid,wid,id,options){patches.push({body,cid,wid,id,options});const sub=[...submissions.values()].find(s=>s.id===id);Object.assign(sub,body);return structuredClone(sub);}
      }
    }}
  };
  const scope=vm.createContext({Date,JSON,Map,Set,Number,Classroom:api,
    SpreadsheetApp:{getActiveSpreadsheet:()=>ss,getUi:()=>ui},
    LockService:{getDocumentLock:()=>({tryLock(){assert.equal(locked,false);locked=true;return true;},releaseLock(){locked=false;}})},
    PropertiesService:{getUserProperties:()=>({getProperty:k=>properties.get(k),setProperty(k,v){properties.set(k,v);},deleteProperty:k=>properties.delete(k)})},
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,value)=>[...createHash('sha256').update(value).digest()]}
  });
  vm.runInContext(script,scope);scope.hubSetup();assert.equal(sheets.size,6);
  const read=name=>scope.hubTable_(name).rows;
  const write=(name,rows)=>scope.hubWrite_(name,rows);
  const create=()=>{const rows=read('HubAssignments');rows[0].CourseID='123';write('HubAssignments',rows);return scope.hubCreate_(key,scope.hubDigest_(rows[0]));};
  const map=(uid,email)=>{const rows=read('HubUsers');rows.find(r=>r.StudentUID===uid).ClassroomEmail=email;write('HubUsers',rows);};
  const sub=(email='s1@school.test',id='g1',userId='1001')=>{const a=read('HubAssignments')[0];submissions.set(email,{courseId:'123',courseWorkId:a.CourseWorkID,id,userId,associatedWithDeveloper:true});};
  const preview=()=>{const plan=scope.hubPlan_(key);return {key,fingerprint:plan.fingerprint,at:Date.now()};};
  return {scope,read,write,create,map,sub,preview,api,sheets,patches,created,alerts,works,submissions,properties,select(name='HubAssignments'){active=sheets.get(name);},loseCreate(){createLost=true;}};
}

test('Hub CSV round-trips Thai, quotes, newlines and formula-like text through the actual Apps Script importer',()=>{
  const f=fixture();const rows=[student(),{uid:'s2',name:"' +SUM(A1)",submitted:false},{uid:'s3',name:'\u200b=unsafe',submitted:true,grade:{error:'invalid'}}];
  const file=csv(rows);assert.ok(file.startsWith('\uFEFF'));const parsed=f.scope.hubValidateCsv_(file);
  assert.equal(parsed.assignment.AssignmentTitle,item.title);assert.equal(parsed.assignment.Instructions,item.instructions);
  assert.equal(parsed.rows[1].StudentName,rows[1].name);assert.equal(parsed.rows[2].Score,'');
  f.scope.hubImportCsv(file);
  assert.equal(f.read('HubAssignments')[0].Instructions,item.instructions);
  assert.equal(f.read('HubResults')[1].StudentName,rows[1].name);
  for(const sheet of f.sheets.values())assert.ok(!sheet.getRange(1,1,sheet.getLastRow(),sheet.getLastColumn()).getFormulas().flat().some(Boolean));
  assert.equal(classroomCsvText('  =1'),"'  =1");assert.equal(classroomCsvText("'abc"),"''abc");
  for(const value of ['=1','+1','-1','@x',"'abc",'\ttext','\u200btext','safe'])assert.equal(f.scope.hubReadText_(f.scope.hubSheetText_(value)),value);
});
test('metadata-only CSV imports and creates homework before any student submits',()=>{
  const f=fixture();f.scope.hubImportCsv(csv([]));f.create();assert.equal(f.created.length,1);assert.equal(f.read('HubResults').length,0);
  const body=f.created[0];assert.equal(body.state,'PUBLISHED');assert.equal(body.maxPoints,100);assert.equal(body.materials[0].link.url,`https://nixcentury.github.io/learning-hub/#classroom/${rid}/${aid}`);
  assert.deepEqual(structuredClone(body.dueDate),{year:2026,month:11,day:10});assert.deepEqual(structuredClone(body.dueTime),{hours:10,minutes:30,seconds:0});
});
test('CSV validation rejects corruption, conflicting metadata, duplicates and invalid numeric values before any writes',()=>{
  const f=fixture(), good=csv();
  const bad=[good.replace('ExportVersion','other'),good+'"unfinished',good.replace('"33.33"','"99"'),good.replace('"1","3","33.33"','"NaN","3","33.33"'),good.replace('"submitted"','"other"'),good.replace('https://nixcentury.github.io','javascript://x'),good.replace('"student"','"assignment"'),good.replace('"1","00000000000000000000000000000001"','"0","bad"'),good+'a,b\n'];
  for(const text of bad)assert.throws(()=>f.scope.hubImportCsv(text));
  const raw=f.scope.hubCsv_(good);const cells=[...raw,raw[1]];const encode=rows=>'\uFEFF'+[f.scope.HUB_CSV_HEADERS_,...rows.map(r=>f.scope.HUB_CSV_HEADERS_.map(k=>classroomCsvText(r[k])))].map(r=>r.map(x=>'"'+x.replaceAll('"','""')+'"').join(',')).join('\r\n');
  assert.throws(()=>f.scope.hubImportCsv(encode(cells)),/ซ้ำ/);assert.equal(f.read('HubAssignments').length,0);
});
test('export rejects invalid result metadata, duplicate students and unsafe URL credentials',()=>{
  for(const rows of [[student(),student()],[{...student(),uid:'bad/path'}],[{...student(),grade:{...student().grade,percent:99}}],[{...student(),grade:{...student().grade,submittedAt:NaN}}]])assert.throws(()=>csv(rows));
  assert.throws(()=>csv([],{hubUrl:'https://user:password@example.test/'}));assert.throws(()=>csv([],{hubUrl:'http://example.test/'}));
});
test('import is idempotent, preserves email/course mappings and refuses stale or conflicting revisions',()=>{
  const f=fixture();f.scope.hubImportCsv(csv());f.map('s1','s1@school.test');f.create();const bound=f.read('HubAssignments')[0].CourseWorkID;
  assert.match(f.scope.hubImportCsv(csv()),/นำเข้าแล้ว/);
  f.scope.hubImportCsv(csv([student('s1',2,2)],{exportedAt:time+100}));
  assert.equal(f.read('HubResults')[0].SubmissionRevision,'2');assert.equal(f.read('HubAssignments')[0].CourseWorkID,bound);assert.equal(f.read('HubUsers')[0].ClassroomEmail,'s1@school.test');
  assert.match(f.scope.hubImportCsv(csv()),/ไฟล์เก่า/);
  assert.throws(()=>f.scope.hubImportCsv(csv([student('s1',2,1)],{exportedAt:time+100})),/เวลาเดียวกัน/);
  assert.throws(()=>f.scope.hubImportCsv(csv([student('s1',1,1)],{exportedAt:time+200})),/ย้อนหลัง/);
  assert.throws(()=>f.scope.hubImportCsv(csv([student('s1',2,1)],{exportedAt:time+200})),/ขัดแย้ง/);
  assert.equal(f.read('HubResults')[0].Score,'2');
});
test('removed and invalid results are suppressed while retaining the high-water revision',()=>{
  const f=fixture();f.scope.hubImportCsv(csv([student('s1',2,2)]));f.scope.hubImportCsv(csv([],{exportedAt:time+100}));
  assert.equal(f.read('HubResults')[0].Status,'not_in_export');
  f.scope.hubImportCsv(csv([{uid:'s1',name:'error',submitted:true,grade:{error:'bad'}}],{exportedAt:time+200}));
  assert.equal(f.read('HubResults')[0].Status,'grading_error');assert.equal(f.read('HubResults')[0].SubmissionRevision,'2');
  assert.throws(()=>f.scope.hubImportCsv(csv([student('s1',1)],{exportedAt:time+300})),/ย้อนหลัง/);
});
test('same quiz in another room/assignment never shares coursework binding',()=>{
  const f=fixture();f.scope.hubImportCsv(csv());f.create();const first=f.read('HubAssignments')[0].CourseWorkID;
  const aid2='a_'+'c'.repeat(32),key2=rid+'/'+aid2;
  f.scope.hubImportCsv(csv([student()],{item:{...item,id:aid2}}));
  const rows=f.read('HubAssignments');rows[1].CourseID='123';f.write('HubAssignments',rows);f.scope.hubCreate_(key2,f.scope.hubDigest_(rows[1]));
  assert.notEqual(f.read('HubAssignments')[1].CourseWorkID,first);assert.equal(f.created.length,2);
});
test('lost create acknowledgement recovers the exact marker without a duplicate task',()=>{
  const f=fixture();f.scope.hubImportCsv(csv());f.loseCreate();assert.throws(()=>f.create(),/lost/);assert.equal(f.created.length,1);
  f.create();assert.equal(f.created.length,1);f.create();assert.equal(f.created.length,1);
  f.works.values().next().value.associatedWithDeveloper=false;assert.throws(()=>f.create(),/โปรเจกต์/);
});
test('foreign, duplicate-marker, changed-binding and ungraded coursework fail closed',()=>{
  const f=fixture();f.scope.hubImportCsv(csv());f.create();const a=f.read('HubAssignments')[0],work=f.works.get(a.CourseWorkID);
  for(const change of [{associatedWithDeveloper:false},{description:'same title but another task'},{courseId:'999'},{maxPoints:0},{state:'DRAFT'}]){const original={...work};Object.assign(work,change);assert.throws(()=>f.scope.hubPlan_(key));Object.assign(work,original);}
  a.CourseWorkID='999';f.write('HubAssignments',[a]);assert.throws(()=>f.scope.hubPlan_(key),/ถูกเปลี่ยน/);assert.equal(f.patches.length,0);
  const g=fixture();g.scope.hubImportCsv(csv());g.create();const row=g.read('HubAssignments')[0];g.works.set('999',{...g.works.get(row.CourseWorkID),id:'999'});Object.assign(row,{CourseWorkID:'',BoundWorkID:'',BoundCourseID:''});g.write('HubAssignments',[row]);assert.throws(()=>g.create(),/ซ้ำ/);
});
test('dry-run resolves school email and scales against live maxPoints without writing grades',()=>{
  const f=fixture();f.scope.hubImportCsv(csv());f.create();f.map('s1','S1@School.test');f.sub();f.works.values().next().value.maxPoints=30;
  const plan=f.scope.hubPlan_(key);assert.equal(plan.rows[0].Score,'10');assert.equal(plan.rows[0].Status,'READY');assert.equal(f.patches.length,0);
  const preview=f.preview();f.scope.hubPush_(key,preview);
  assert.equal(f.patches.length,1);assert.deepEqual(structuredClone(f.patches[0].body),{draftGrade:10});assert.deepEqual(structuredClone(f.patches[0].options),{updateMask:'draftGrade'});
  assert.equal(f.read('HubSyncLog')[0].Status,'SENT');assert.equal(f.scope.hubPlan_(key).rows[0].Status,'ALREADY_SENT');
  f.scope.hubPush_(key,f.preview());assert.equal(f.patches.length,1);
});
test('missing, invalid and duplicate emails, API failures and unsubmitted results never become zero grades',()=>{
  const f=fixture();f.scope.hubImportCsv(csv([student('s1'),student('s2'),student('s3'),student('s4'),{uid:'s5',name:'missing',submitted:false}]));f.create();
  f.map('s2','bad');f.map('s3','same@school.test');f.map('s4','same@school.test');
  assert.deepEqual(Array.from(f.scope.hubPlan_(key).rows,r=>r.Status),['MISSING_EMAIL','INVALID_EMAIL','DUPLICATE_EMAIL','DUPLICATE_EMAIL','NOT_SUBMITTED']);
  f.map('s1','s1@school.test');assert.equal(f.scope.hubPlan_(key).rows[0].Status,'NO_SUBMISSION');
  f.api.Courses.CourseWork.StudentSubmissions.list=()=>{throw Error('denied');};assert.match(f.scope.hubPlan_(key).rows[0].Status,/API_ERROR/);assert.equal(f.patches.length,0);
});
test('a genuine submitted zero is sent; a newer lower score replaces the previous draft on explicit review',()=>{
  const f=fixture();f.scope.hubImportCsv(csv([student('s1',1,2)]));f.create();f.map('s1','s1@school.test');f.sub();f.scope.hubPush_(key,f.preview());
  f.scope.hubImportCsv(csv([student('s1',2,0)],{exportedAt:time+100}));f.scope.hubPush_(key,f.preview());assert.equal(f.patches.at(-1).body.draftGrade,0);assert.equal(f.read('HubSyncLog').length,2);
});
test('preview expires and is invalidated by changed scores, maps, targets or Google draft grades',()=>{
  for(const change of ['expired','score','email','max','draft']){
    const f=fixture();f.scope.hubImportCsv(csv());f.create();f.map('s1','s1@school.test');f.sub();const p=f.preview();
    if(change==='expired')p.at-=11*60*1000;
    if(change==='score'){const rows=f.read('HubResults');rows[0].Score='2';f.write('HubResults',rows);}
    if(change==='email')f.map('s1','different@school.test');
    if(change==='max')f.works.values().next().value.maxPoints=10;
    if(change==='draft')f.submissions.values().next().value.draftGrade=90;
    assert.throws(()=>f.scope.hubPush_(key,p));assert.equal(f.patches.length,0,change);
  }
});
test('per-student failures are logged and do not block other grades; retry sends only the failed revision',()=>{
  const f=fixture();f.scope.hubImportCsv(csv([student('s1'),student('s2')]));f.create();for(const [uid,id,gid] of [['s1','g1','1001'],['s2','g2','1002']]){f.map(uid,uid+'@school.test');f.sub(uid+'@school.test',id,gid);}
  const patch=f.api.Courses.CourseWork.StudentSubmissions.patch.bind(null);
  f.api.Courses.CourseWork.StudentSubmissions.patch=(body,cid,wid,id,opts)=>{if(id==='g1')throw Error('rate limited');return patch(body,cid,wid,id,opts);};
  f.scope.hubPush_(key,f.preview());assert.equal(f.patches.length,1);assert.match(f.read('HubSyncLog')[0].Status,/ERROR/);assert.equal(f.read('HubSyncLog')[1].Status,'SENT');
  f.api.Courses.CourseWork.StudentSubmissions.patch=patch;f.scope.hubPush_(key,f.preview());assert.equal(f.patches.length,2);assert.equal(f.patches.at(-1).id,'g1');
});
test('different email aliases resolving to the same Google user are blocked, including across batches',()=>{
  const f=fixture();f.scope.hubImportCsv(csv([student('s1'),student('s2')]));f.create();f.map('s1','a@school.test');f.map('s2','b@school.test');f.sub('a@school.test','g1','1001');f.sub('b@school.test','g1','1001');
  assert.ok(f.scope.hubPlan_(key).rows.every(r=>r.Status==='DUPLICATE_GOOGLE_USER'));assert.equal(f.patches.length,0);
});
test('menu confirmation never holds a lock and setup preserves existing data/schema',()=>{
  const f=fixture();f.scope.hubImportCsv(csv());f.select();const rows=f.read('HubAssignments');rows[0].CourseID='123';f.write('HubAssignments',rows);f.scope.hubCreateCoursework();assert.equal(f.created.length,1);
  f.map('s1','s1@school.test');f.sub();f.scope.hubReview();f.scope.hubPushDraftGrades();assert.equal(f.patches.length,1);
  f.scope.hubSetup();assert.equal(f.read('HubAssignments').length,1);
  f.sheets.get('HubUsers').data[0][0]='unexpected';assert.throws(()=>f.scope.hubImportCsv(csv()),/หัวคอลัมน์/);
});
test('pagination is complete, repeated page tokens fail, and a large class advances in bounded batches',()=>{
  const f=fixture();let pages=0;assert.equal(f.scope.hubPages_(token=>{pages++;return token?{items:[2]}:{items:[1],nextPageToken:'next'};},'items').length,2);assert.equal(pages,2);
  assert.throws(()=>f.scope.hubPages_(()=>({items:[],nextPageToken:'repeat'}),'items'),/ซ้ำ/);
  const rows=Array.from({length:26},(_,i)=>student('s'+i));f.scope.hubImportCsv(csv(rows));f.create();
  rows.forEach((r,i)=>{f.map(r.uid,r.uid+'@school.test');f.sub(r.uid+'@school.test','g'+i,String(1000+i));});
  assert.equal(f.scope.hubPlan_(key).rows.filter(r=>r.Status==='READY').length,25);
  f.scope.hubPush_(key,f.preview());assert.equal(f.patches.length,25);
  f.scope.hubPush_(key,f.preview());assert.equal(f.patches.length,26);
});


test('a second Hub marker cannot bind two assignments to one Google task',()=>{
  const f=fixture();f.scope.hubImportCsv(csv());f.create();f.works.values().next().value.description+='\n[LearningHub:v1:another-task]';
  assert.throws(()=>f.scope.hubPlan_(key),/รหัส Hub/);assert.equal(f.patches.length,0);
});
test('live submission changes after review are logged without patching the wrong student or draft',()=>{
  const f=fixture();f.scope.hubImportCsv(csv());f.create();f.map('s1','s1@school.test');f.sub();
  const get=f.api.Courses.CourseWork.StudentSubmissions.get;
  f.api.Courses.CourseWork.StudentSubmissions.get=(...args)=>({...get(...args),userId:'9999'});
  f.scope.hubPush_(key,f.preview());assert.equal(f.patches.length,0);assert.match(f.read('HubSyncLog')[0].Status,/ERROR/);
});
test('manual changes during a batch stop subsequent writes and keep the earlier outcome logged',()=>{
  const f=fixture();f.scope.hubImportCsv(csv([student('s1'),student('s2')]));f.create();
  for(const [i,uid] of ['s1','s2'].entries()){f.map(uid,uid+'@school.test');f.sub(uid+'@school.test','g'+i,String(1000+i));}
  const patch=f.api.Courses.CourseWork.StudentSubmissions.patch.bind(null);
  f.api.Courses.CourseWork.StudentSubmissions.patch=(...args)=>{const result=patch(...args);f.map('s2','changed@school.test');return result;};
  f.scope.hubPush_(key,f.preview());assert.equal(f.patches.length,1);assert.match(f.read('HubSyncLog')[1].Status,/ERROR/);
});
