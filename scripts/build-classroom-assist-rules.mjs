import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Extend the reviewed complete co-teacher Rules, preserving every other root.
export function mergeClassroomAssistRules(base) {
  if (base.rules?.['.read']!==false || base.rules?.['.write']!==false || !base.rules.classroomV1?.teachers || base.rules.classroomSubmissionsV1?.assists) throw Error('Expected closed, complete room co-teacher Rules.');
  const result=structuredClone(base),s=result.rules.classroomSubmissionsV1;
  const staff=s.results.$roomId['.read'];
  const lease="root.child('classroomSubmissionsV1/assists').child($roomId).child($assignmentId).child($uid)";
  const live=`${lease}.child('status').val() === 'active' && ${lease}.child('expiresAt').val() > now`;
  const member="root.child('classroomV1/members').child($roomId).child($uid).exists() && root.child('classroomV1/userRooms').child($uid).child($roomId).val() === 'student'";
  const item="root.child('classroomAssignmentsV1/items').child($roomId).child($assignmentId)";
  const quiz="root.child('classroomSubmissionsV1/quizzes').child($roomId).child($assignmentId)";
  const delegate=`auth != null && (${staff}) && (${member}) && (${live}) && ${lease}.child('actorUid').val() === auth.uid`;
  const self=`auth != null && auth.uid === $uid && (${member}) && !(${live})`;
  const writer=`((${self}) && !newData.child('assistedByUid').exists() && !newData.child('assistId').exists()) || ((${delegate}) && newData.child('assistedByUid').val() === auth.uid && newData.child('assistId').val() === ${lease}.child('id').val())`;
  const none={'.validate':false};
  const meta=['assistedByUid','assistId','handoffId'];
  const same=(a,b)=>meta.map(k=>`${a}.child('${k}').val() === ${b}.child('${k}').val()`).join(' && ');
  const epoch=`(!${lease}.exists() ? !newData.child('handoffId').exists() : newData.child('handoffId').val() === ${lease}.child('id').val())`;
  for (const kind of ['attempts','results']) {
    const node=s[kind].$roomId.$assignmentId.$uid;
    const suffix=node['.write'].slice(node['.write'].indexOf(" && root.child('classroomAssignmentsV1/items')"));
    if (!suffix) throw Error('Unrecognized submission writer.');
    node['.write']=`((${writer}))${suffix}`;
    if(kind==='attempts')node['.read']=`(${node['.read']}) || (${delegate})`;
    node['.validate']+=` && ${epoch}`;
    for(const key of meta)node[key]={'.validate':key==='assistedByUid'?"newData.isString() && newData.val().length > 0 && newData.val().length <= 128":"newData.isString() && newData.val().matches(/^e_[a-f0-9]{32}$/)"};
  }
  const archive="newData.parent().parent().parent().parent().child('history').child($roomId).child($assignmentId).child($uid).child(data.child('submissionId').val())";
  s.results.$roomId.$assignmentId.$uid['.validate']=s.results.$roomId.$assignmentId.$uid['.validate'].replace(`${archive}.exists()`,`${archive}.exists() && ${same(archive,'data')}`);
  const h=s.history.$roomId.$assignmentId.$uid.$submissionId;
  h['.write']=`((${self}) || (${delegate})) && ${item}.child('status').val() === 'published' && !data.exists() && newData.exists()`;
  const previous="root.child('classroomSubmissionsV1/results').child($roomId).child($assignmentId).child($uid)";
  h['.validate']+=` && ${same('newData',previous)}`;
  for(const key of meta)h[key]={'.validate':true};
  const scope=`auth != null && (${staff}) && (${member}) && ${item}.child('status').val() === 'published' && ${quiz}.exists()`;
  const owner="auth != null && root.child('classroomV1/rooms').child($roomId).child('ownerUid').val() === auth.uid";
  const sameLease="newData.child('id').val() === data.child('id').val() && newData.child('actorUid').val() === data.child('actorUid').val() && newData.child('startedAt').val() === data.child('startedAt').val()";
  const available="!data.exists() || data.child('status').val() === 'ended' || data.child('expiresAt').val() <= now";
  s.assists={'$roomId':{'$assignmentId':{'$uid':{
    '.read':`auth != null && (auth.uid === $uid || (${staff}))`,
    '.write':`newData.exists() && ((((${scope}) && newData.child('status').val() === 'active' && newData.child('actorUid').val() === auth.uid) && (((${available}) && newData.child('id').val() !== data.child('id').val() && newData.child('startedAt').val() === now) || (data.child('status').val() === 'active' && data.child('expiresAt').val() > now && data.child('actorUid').val() === auth.uid && ${sameLease}))) || (auth != null && data.child('status').val() === 'active' && newData.child('status').val() === 'ended' && ${sameLease} && (auth.uid === data.child('actorUid').val() || auth.uid === $uid || (${owner}))))`,
    '.validate':"$roomId.matches(/^r_[a-f0-9]{32}$/) && $assignmentId.matches(/^a_[a-f0-9]{32}$/) && newData.hasChildren(['version','id','actorUid','status','startedAt','updatedAt','expiresAt']) && newData.child('actorUid').val() !== $uid && (newData.child('status').val() === 'active' ? newData.child('expiresAt').val() > now && newData.child('expiresAt').val() <= now + 180000 : newData.child('expiresAt').val() <= now)",
    version:{'.validate':'newData.val() === 1'},id:{'.validate':"newData.isString() && newData.val().matches(/^e_[a-f0-9]{32}$/)"},
    actorUid:{'.validate':"newData.isString() && newData.val().length > 0 && newData.val().length <= 128"},
    status:{'.validate':"newData.val() === 'active' || newData.val() === 'ended'"},
    startedAt:{'.validate':'newData.isNumber() && newData.val() <= now'},updatedAt:{'.validate':'newData.val() === now'},expiresAt:{'.validate':'newData.isNumber()'},'$other':none,
  }}}};
  const proposed="newData.parent().parent().parent().parent().parent().child('assists').child($roomId).child($assignmentId).child($uid)";
  s.assistEvents={'$roomId':{'$assignmentId':{'$uid':{
    '.read':`auth != null && (auth.uid === $uid || (${staff}))`,
    '$eventId':{
      '.write':`auth != null && !data.exists() && newData.exists() && newData.child('actorUid').val() === auth.uid && newData.child('assistId').val() === ${proposed}.child('id').val() && ((newData.child('action').val() === 'started' && (${scope}) && ${proposed}.child('actorUid').val() === auth.uid && ${proposed}.child('status').val() === 'active' && ${proposed}.child('startedAt').val() === now) || (newData.child('action').val() === 'submitted' && (${delegate})) || (${lease}.child('status').val() === 'active' && ${proposed}.child('status').val() === 'ended' && ${proposed}.child('id').val() === ${lease}.child('id').val() && ((auth.uid === $uid && newData.child('action').val() === 'reclaimed') || ((auth.uid === ${lease}.child('actorUid').val() || (${owner})) && newData.child('action').val() === 'ended'))))`,
      '.validate':"$eventId.matches(/^v_[a-f0-9]{32}$/) && newData.hasChildren(['actorUid','assistId','action','createdAt'])",
      actorUid:{'.validate':'newData.isString()'},assistId:{'.validate':"newData.isString() && newData.val().matches(/^e_[a-f0-9]{32}$/)"},action:{'.validate':"newData.val() === 'started' || newData.val() === 'submitted' || newData.val() === 'ended' || newData.val() === 'reclaimed'"},createdAt:{'.validate':'newData.val() === now'},'$other':none,
    },
  }}}};
  return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const base=JSON.parse(await readFile(new URL('../firebase/classroom-room-teachers.merged-draft.json',import.meta.url),'utf8'));
  await writeFile(new URL('../firebase/classroom-assist.merged-draft.json',import.meta.url),JSON.stringify(mergeClassroomAssistRules(base),null,2)+'\n');
  console.log('Complete emergency-assistance Rules generated locally; nothing deployed.');
}
