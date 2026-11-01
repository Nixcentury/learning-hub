// Add only roster-management permissions to the reviewed, closed full Rules.
// Never deploys or changes scores, submissions, assignments, links or profiles.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const teacher = "(root.child('learningHub/admins').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).child('enabled').val() === true)";
const signed = 'auth != null';
const ownerAt = path => `${signed} && ${teacher} && root.child('classroomV1/rooms').child(${path}).child('ownerUid').val() === auth.uid`;
const owner = ownerAt('$roomId');
const verified = `${signed} && auth.token.email_verified === true && auth.token.email != null`;
const email = 'auth.token.email.toLowerCase()';
const proposed = 'newData.parent().parent().parent()'; // classroomV1 for members/room/uid and removed/room/uid
const oldMember = "root.child('classroomV1/members').child($roomId).child($uid)";
const oldRemoved = "root.child('classroomV1/removed').child($roomId).child($uid)";
const archived = oldRemoved + ".child('member')";
const nextMember = `${proposed}.child('members').child($roomId).child($uid)`;
const nextIndex = `${proposed}.child('userRooms').child($uid).child($roomId)`;
const nextRemoved = `${proposed}.child('removed').child($roomId).child($uid)`;
const sameFields = (a,b) => ['displayName','joinedAt','joinCode','email','invitationId'].map(key => `${a}.child('${key}').val() === ${b}.child('${key}').val()`).join(' && ');
const sameMemberCore = ['displayName','joinedAt','joinCode'].map(key => `newData.child('${key}').val() === data.child('${key}').val()`).join(' && ') + ['email','invitationId'].map(key => ` && (!data.child('${key}').exists() || newData.child('${key}').val() === data.child('${key}').val())`).join('');
const none = { '.validate': false };
const emailRule = { '.validate': `(${verified}) && newData.isString() && newData.val() === ${email} && newData.val().length <= 254` };
export function mergeRosterRules(base) {
  if (base.rules?.['.read'] !== false || base.rules?.['.write'] !== false || !base.rules.classroomV1?.members || !base.rules.classroomLinksV1 || base.rules.classroomV1.invitations || base.rules.classroomV1.removed) throw Error('Expected reviewed full links Rules without roster extension. Nothing overwritten.');
  const result = structuredClone(base), rules = result.rules.classroomV1;
  const member = rules.members.$roomId.$uid;
  const code = "newData.child('joinCode').val() === root.child('classroomV1/rooms').child($roomId).child('joinCode').val() && root.child('classroomV1/joinCodes').child(newData.child('joinCode').val()).child('roomId').val() === $roomId";
  const selfJoin = `${signed} && auth.uid === $uid && newData.exists() && !${oldRemoved}.exists() && root.child('classroomV1/rooms').child($roomId).exists() && root.child('classroomV1/rooms').child($roomId).child('ownerUid').val() !== auth.uid && ${code}`;
  const remove = `(${owner}) && data.exists() && !newData.exists() && ${nextRemoved}.exists() && !${nextIndex}.exists()`;
  const restore = `(${owner}) && !data.exists() && newData.exists() && ${oldRemoved}.exists() && !${nextRemoved}.exists() && ${sameFields('newData',archived)}`;
  member['.write'] = `(${selfJoin}) || (${remove}) || (${restore})`;
  member['.validate'] = `$roomId.matches(/^r_[a-f0-9]{32}$/) && newData.hasChildren(['displayName','joinedAt','joinCode']) && ${nextIndex}.val() === 'student' && ((!data.exists() && auth.uid === $uid) || (data.exists() && ${sameMemberCore}) || (${restore}))`;
  member.joinedAt['.validate'] = `newData.isNumber() && (newData.val() === now || (data.exists() && newData.val() === data.val()) || ((${owner}) && newData.val() === ${archived}.child('joinedAt').val()))`;
  member.email = { '.validate': `(${emailRule['.validate']}) || ((${owner}) && newData.val() === ${archived}.child('email').val())` };
  const invite = "root.child('classroomV1/invitations').child(newData.val())";
  member.invitationId = { '.validate': `newData.isString() && newData.val().matches(/^i_[a-f0-9]{64}$/) && ((((${verified}) && ${invite}.child('email').val() === ${email} && ${invite}.child('roomId').val() === $roomId && ${invite}.child('ownerUid').val() === root.child('classroomV1/rooms').child($roomId).child('ownerUid').val())) || (data.exists() && newData.val() === data.val()) || ((${owner}) && newData.val() === ${archived}.child('invitationId').val()))` };
  const index = rules.userRooms.$uid.$roomId;
  const indexProposed = 'newData.parent().parent().parent()';
  const indexMember = `${indexProposed}.child('members').child($roomId).child($uid)`;
  const indexRemoved = `${indexProposed}.child('removed').child($roomId).child($uid)`;
  index['.write'] = `(${index['.write']}) || ((${owner}) && $uid !== auth.uid && ((!newData.exists() && data.val() === 'student' && !${indexMember}.exists() && ${indexRemoved}.exists()) || (newData.val() === 'student' && ${oldRemoved}.exists() && ${indexMember}.exists() && !${indexRemoved}.exists())))`;
  index['.validate'] = index['.validate'].replace("child(auth.uid).exists()", "child($uid).exists()").replace("val() !== auth.uid", "val() !== $uid");
  const inviteOwner = ownerAt("data.child('roomId').val()");
  const newInviteOwner = ownerAt("newData.child('roomId').val()");
  const inviteEmail = `(${verified}) && data.child('email').val() === ${email}`;
  rules.invitations = {
    '.indexOn': ['email', 'roomId'],
    '.read': `((${verified}) && query.orderByChild === 'email' && query.equalTo === ${email}) || (query.orderByChild === 'roomId' && query.equalTo != null && (${ownerAt('query.equalTo')}))`,
    '$invitationId': {
      '.read': `(${inviteOwner}) || (${inviteEmail})`,
      '.write': `data.exists() ? (${inviteOwner}) : (${newInviteOwner})`,
      '.validate': "$invitationId.matches(/^i_[a-f0-9]{64}$/) && newData.hasChildren(['roomId','ownerUid','email','joinCode','createdAt']) && newData.child('ownerUid').val() === auth.uid && (!data.exists() || (newData.child('roomId').val() === data.child('roomId').val() && newData.child('email').val() === data.child('email').val())) && newData.child('joinCode').val() === root.child('classroomV1/rooms').child(newData.child('roomId').val()).child('joinCode').val()",
      roomId: { '.validate': 'newData.isString() && newData.val().matches(/^r_[a-f0-9]{32}$/)' },
      ownerUid: { '.validate': 'newData.val() === auth.uid' },
      email: { '.validate': 'newData.isString() && newData.val().length <= 254 && newData.val() === newData.val().toLowerCase() && newData.val().matches(/^[^ @]+@[^ @]+\\.[^ @]+$/)' },
      joinCode: { '.validate': 'newData.isString() && newData.val().matches(/^[A-HJ-NP-Z2-9]{8}$/)' },
      createdAt: { '.validate': 'newData.isNumber() && (data.exists() ? newData.val() === data.val() : newData.val() === now)' },
      '$other': none,
    },
  };
  const memberFields = structuredClone(member);
  delete memberFields['.read']; delete memberFields['.write'];
  memberFields['.validate'] = `newData.hasChildren(['displayName','joinedAt','joinCode']) && ${sameFields('newData',oldMember)}`;
  for (const key of ['displayName','joinedAt','joinCode','email','invitationId']) memberFields[key] = { '.validate': `newData.val() === ${oldMember}.child('${key}').val()` };
  rules.removed = { '$roomId': {
    '.read': owner,
    '$uid': {
      '.read': `${signed} && auth.uid === $uid`,
      '.write': `(${owner}) && $uid !== auth.uid && (newData.exists() ? !data.exists() && ${oldMember}.exists() : data.exists() && ${nextMember}.exists() && ${nextIndex}.val() === 'student')`,
      '.validate': `newData.hasChildren(['member','removedAt']) && !${nextMember}.exists() && !${nextIndex}.exists()`,
      member: memberFields,
      removedAt: { '.validate': 'newData.val() === now' },
      '$other': none,
    },
  } };
  return result;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const baseline = process.argv[2] || fileURLToPath(new URL('../firebase/classroom-links.merged-draft.json', import.meta.url));
  const output = process.argv[3] || fileURLToPath(new URL('../firebase/classroom-roster.merged-draft.json', import.meta.url));
  await writeFile(output, JSON.stringify(mergeRosterRules(JSON.parse(await readFile(baseline, 'utf8'))), null, 2) + '\n');
  console.log('Full roster Rules generated locally; nothing deployed.');
}
