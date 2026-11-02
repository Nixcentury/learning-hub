import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const signed = 'auth != null';
const approved = "(root.child('learningHub/admins').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).child('enabled').val() === true)";
const roomAt = id => "root.child('classroomV1/rooms').child(" + id + ")";
const ownerAt = id => signed + ' && ' + approved + ' && ' + roomAt(id) + ".child('ownerUid').val() === auth.uid";
const owner = ownerAt('$roomId'), room = roomAt('$roomId');
const ownTeacher = "root.child('classroomV1/teachers').child($roomId).child(auth.uid)";
const boundInvite = "root.child('classroomV1/teacherInvitations').child(" + ownTeacher + ".child('invitationId').val())";
const coTeacher = signed + ' && ' + ownTeacher + ".exists() && " + boundInvite + ".child('acceptedUid').val() === auth.uid && " + boundInvite + ".child('roomId').val() === $roomId && " + boundInvite + ".child('email').val() === " + ownTeacher + ".child('email').val()";
const staff = '((' + owner + ') || (' + coTeacher + '))';
const verified = signed + ' && auth.token.email_verified === true && auth.token.email != null';
const email = 'auth.token.email.toLowerCase()';
const no = {'.validate':false};
const text = max => ({'.validate':'newData.isString() && newData.val().length > 0 && newData.val().length <= '+max});
const fieldsSame = names => names.map(n => "newData.child('"+n+"').val() === data.child('"+n+"').val()").join(' && ');
function mapStrings(value, transform) {
  if(typeof value === 'string') return transform(value);
  if(Array.isArray(value)) return value.map(v=>mapStrings(v,transform));
  if(value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,mapStrings(v,transform)]));
  return value;
}
export function mergeRoomTeacherRules(base) {
  if(base.rules?.['.read'] !== false || base.rules?.['.write'] !== false || !base.rules.classroomV1?.invitations || base.rules.classroomV1.teachers)
    throw Error('Expected the reviewed closed roster Rules without room-teacher branches.');
  const result = structuredClone(base), c = result.rules.classroomV1;
  c.rooms.$roomId['.read'] = '('+c.rooms.$roomId['.read']+') || ('+coTeacher+')';
  c.members.$roomId['.read'] = staff;
  // Expand only the existing room-owner operations for work/grades/links.
  // Keep monitoring, student drafts, score ownership and all unrelated roots.
  for(const key of ['classroomAssignmentsV1','classroomSubmissionsV1','classroomLinksV1']) {
    result.rules[key] = mapStrings(result.rules[key],v=>v.replaceAll(owner,staff));
  }
  result.rules.classroomAssignmentsV1 = mapStrings(result.rules.classroomAssignmentsV1,v=>v.replaceAll("newData.child('ownerUid').val() === auth.uid","newData.child('ownerUid').val() === "+room+".child('ownerUid').val()"));
  result.rules.classroomSubmissionsV1 = mapStrings(result.rules.classroomSubmissionsV1,v=>v.replaceAll("newData.child('ownerUid').val() === auth.uid","newData.child('ownerUid').val() === "+room+".child('ownerUid').val()"));
  const proposed = 'newData.parent().parent().parent()';
  const oldTeacher = "root.child('classroomV1/teachers').child($roomId).child($uid)";
  const nextTeacher = proposed+".child('teachers').child($roomId).child($uid)";
  const oldMember = "root.child('classroomV1/members').child($roomId).child($uid)";
  const oldInvite = "root.child('classroomV1/teacherInvitations').child(newData.child('invitationId').val())";
  const nextInvite = proposed+".child('teacherInvitations').child(newData.child('invitationId').val())";
  const newIndex = proposed+".child('userRooms').child($uid).child($roomId)";
  const revokedInvite = proposed+".child('teacherInvitations').child(data.child('invitationId').val())";
  const claim = '('+verified+') && auth.uid === $uid && '+oldInvite+".child('email').val() === "+email+' && '+oldInvite+".child('roomId').val() === $roomId && "+nextInvite+".child('acceptedUid').val() === $uid && "+newIndex+".val() === 'teacher'";
  const revoke = '('+owner+') && data.exists() && !newData.exists() && !'+revokedInvite+".exists() && ("+oldMember+".exists() ? "+newIndex+".val() === 'student' : !"+newIndex+".exists())";
  c.teachers = {'$roomId':{'.read':staff,'$uid':{
    '.read':signed+' && auth.uid === $uid',
    '.write':'(('+claim+') && newData.exists() && (!data.exists() || '+fieldsSame(['email','displayName','joinedAt','invitationId'])+')) || ('+revoke+')',
    '.validate':"$roomId.matches(/^r_[a-f0-9]{32}$/) && newData.hasChildren(['email','displayName','joinedAt','invitationId']) && $uid !== "+room+".child('ownerUid').val()",
    email:{'.validate':'newData.isString() && newData.val() === '+email+' && newData.val().length <= 254'},
    displayName:text(120),joinedAt:{'.validate':'newData.isNumber() && (data.exists() ? newData.val() === data.val() : newData.val() === now)'},
    invitationId:{'.validate':"newData.isString() && newData.val().matches(/^t_[a-f0-9]{64}$/)"},'$other':no,
  }}};
  const ip = 'newData.parent().parent()', ir = "data.child('roomId').val()", nr = "newData.child('roomId').val()";
  const inviteOwner = ownerAt(ir), newInviteOwner = ownerAt(nr);
  const claimedUid = "newData.child('acceptedUid').val()";
  const validClaim = '('+verified+") && data.child('email').val() === "+email+" && "+claimedUid+" === auth.uid && (data.child('acceptedUid').val() === '' || data.child('acceptedUid').val() === auth.uid) && "+ip+".child('teachers').child("+nr+").child(auth.uid).child('invitationId').val() === $invitationId && "+ip+".child('userRooms').child(auth.uid).child("+nr+").val() === 'teacher'";
  const revokeAccepted = "data.child('acceptedUid').val() === '' || (!"+ip+".child('teachers').child("+ir+").child(data.child('acceptedUid').val()).exists() && "+ip+".child('userRooms').child(data.child('acceptedUid').val()).child("+ir+").val() !== 'teacher')";
  c.teacherInvitations = {
    '.indexOn':['email','roomId'],
    '.read':'(('+verified+") && query.orderByChild === 'email' && query.equalTo === "+email+") || (query.orderByChild === 'roomId' && query.equalTo != null && ("+ownerAt('query.equalTo')+'))',
    '$invitationId':{
      '.read':'('+inviteOwner+') || (('+verified+") && data.child('email').val() === "+email+')',
      '.write':'(!data.exists() && newData.exists() && ('+newInviteOwner+")) || (data.exists() && !newData.exists() && ("+inviteOwner+') && ('+revokeAccepted+')) || (data.exists() && newData.exists() && ('+validClaim+'))',
      '.validate':"$invitationId.matches(/^t_[a-f0-9]{64}$/) && newData.hasChildren(['roomId','ownerUid','email','createdAt','acceptedUid']) && newData.child('ownerUid').val() === "+roomAt(nr)+".child('ownerUid').val() && (data.exists() ? ("+fieldsSame(['roomId','ownerUid','email','createdAt'])+") : newData.child('acceptedUid').val() === '')",
      roomId:{'.validate':"newData.isString() && newData.val().matches(/^r_[a-f0-9]{32}$/)"},
      ownerUid:text(128),
      email:{'.validate':"newData.isString() && newData.val().length <= 254 && newData.val() === newData.val().toLowerCase() && newData.val().matches(/^[^ @]+@[^ @]+\\.[^ @]+$/)"},
      createdAt:{'.validate':'newData.isNumber() && (data.exists() ? newData.val() === data.val() : newData.val() === now)'},
      acceptedUid:{'.validate':"newData.isString() && newData.val().length <= 128 && ((!data.exists() && newData.val() === '') || newData.val() === data.val() || (newData.val() === auth.uid && data.val() === ''))"},'$other':no,
    },
  };
  const index = c.userRooms.$uid.$roomId;
  const indexInvite = proposed+".child('teacherInvitations').child("+nextTeacher+".child('invitationId').val())";
  const oldIndexInvite = proposed+".child('teacherInvitations').child("+oldTeacher+".child('invitationId').val())";
  const teacherIndex = "newData.val() === 'teacher' && "+nextTeacher+".exists() && "+indexInvite+".child('acceptedUid').val() === $uid && "+indexInvite+".child('roomId').val() === $roomId && $uid !== "+room+".child('ownerUid').val()";
  const removeIndex = '('+owner+') && '+oldTeacher+".exists() && !"+nextTeacher+".exists() && !"+oldIndexInvite+".exists() && ("+oldMember+".exists() ? newData.val() === 'student' : !newData.exists())";
  index['.write'] = '(('+index['.write']+') && (!'+oldTeacher+".exists() || newData.val() === 'teacher')) || ("+removeIndex+')';
  index['.validate'] = '(('+index['.validate']+') && !'+nextTeacher+'.exists()) || ('+teacherIndex+')';
  return result;
}
if(process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = JSON.parse(await readFile(process.argv[2] || new URL('../firebase/classroom-roster.merged-draft.json',import.meta.url),'utf8'));
  await writeFile(process.argv[3] || new URL('../firebase/classroom-room-teachers.merged-draft.json',import.meta.url),JSON.stringify(mergeRoomTeacherRules(base),null,2)+'\n');
  console.log('Full room-teacher Rules generated; nothing deployed.');
}
