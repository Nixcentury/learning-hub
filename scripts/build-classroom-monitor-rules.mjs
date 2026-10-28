import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export function buildMonitorRules() {
  const signed = 'auth != null';
  const teacher = `(root.child('learningHub/admins').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).child('enabled').val() === true)`;
  const owner = `${signed} && ${teacher} && root.child('classroomV1/rooms').child($roomId).child('ownerUid').val() === auth.uid`;
  const member = `${signed} && root.child('classroomV1/members').child($roomId).child(auth.uid).exists()`;
  const meta = `root.child('classroomMonitorV1/sessions').child($roomId)`;
  const active = `${meta}.child('id').val() === $sessionId && ${meta}.child('active').val() === true && ${meta}.child('endsAt').val() > now`;
  const self = `${member} && auth.uid === $uid`;
  const enrolled = `root.child('classroomMonitorV1/participants').child($roomId).child($sessionId).child(auth.uid).child('joined').val() === true`;
  const none = { '.validate': false };
  const str = (n, empty = false) => ({ '.validate': `newData.isString() && newData.val().length ${empty ? '>=' : '>'} 0 && newData.val().length <= ${n}` });
  const stamp = { '.validate': 'newData.isNumber() && (newData.val() === now || (data.exists() && newData.val() === data.val()))' };
  const receipt = { '.validate': 'newData.isNumber() && ((data.exists() && newData.val() === data.val()) || ((!data.exists() || data.val() === 0) && (newData.val() === 0 || newData.val() === now)))' };
  const roomValid = "$roomId.matches(/^r_[a-f0-9]{32}$/)";
  const sessionValid = "$sessionId.matches(/^s_[a-f0-9]{32}$/)";
  const fieldEqual = names => names.map(name => `newData.child('${name}').val() === data.child('${name}').val()`).join(' && ');
  const branches = {};
  branches.sessions = { '$roomId': {
    '.read': `(${owner}) || (${member})`,
    '.write': owner,
    '.validate': `${roomValid} && newData.hasChildren(['id','ownerUid','active','startedAt','endsAt']) && newData.child('ownerUid').val() === auth.uid && ((!data.exists() || data.child('active').val() !== true || data.child('endsAt').val() <= now) && newData.child('active').val() === true && newData.child('startedAt').val() === now && (!data.exists() || newData.child('id').val() !== data.child('id').val()) || (data.exists() && ${fieldEqual(['id','ownerUid','startedAt','endsAt'])} && newData.child('active').val() === false))`,
    id: { '.validate': "newData.isString() && newData.val().matches(/^s_[a-f0-9]{32}$/)" },
    ownerUid: str(128), active: { '.validate': 'newData.isBoolean()' }, startedAt: stamp,
    endsAt: { '.validate': "newData.isNumber() && newData.val() > newData.parent().child('startedAt').val() && newData.val() <= newData.parent().child('startedAt').val() + 10800000" }, '$other': none,
  } };
  const cleanup = `(${owner}) && !newData.exists()`;
  const forRoom = child => ({ '$roomId': { '.write': cleanup, '$sessionId': { '.write': cleanup, ...child } } });
  branches.participants = forRoom({
    '.read': `(${owner}) && (${active})`,
    '$uid': { '.read': `(${self}) && (${active})`, '.write': `(${self}) && (${active}) && newData.exists()`,
      '.validate': `${roomValid} && ${sessionValid} && newData.hasChildren(['joined','joinedAt','updatedAt'])`,
      joined: { '.validate': 'newData.isBoolean()' }, joinedAt: stamp,
      updatedAt: { '.validate': 'newData.val() === now' }, '$other': none,
    },
  });
  branches.connections = forRoom({
    '.read': `(${owner}) && (${active})`,
    '$uid': { '.read': `(${self}) && (${active})`,
      '$connectionId': { '.write': `(${self}) && (!newData.exists() || ((${active}) && ${enrolled}))`,
        '.validate': `${roomValid} && ${sessionValid} && $connectionId.matches(/^c_[a-f0-9]{32}$/) && newData.hasChildren(['connected','visible','changedAt','updatedAt','sequence','location'])`,
        connected: { '.validate': 'newData.isBoolean()' }, visible: { '.validate': 'newData.isBoolean()' },
        changedAt: { '.validate': `newData.isNumber() && newData.val() >= ${meta}.child('startedAt').val() - 5000 && newData.val() <= now + 5000` },
        updatedAt: { '.validate': 'newData.val() === now' },
        sequence: { '.validate': 'newData.isNumber() && newData.val() >= 0 && newData.val() <= 1000000000 && (!data.exists() || newData.val() >= data.val())' },
        location: { '.validate': "newData.hasChildren(['hash','titleTh','titleEn','subjectId'])",
          hash: { '.validate': "newData.isString() && newData.val().matches(/^#[a-zA-Z0-9/_-]{1,300}$/)" },
          titleTh: str(200), titleEn: str(200), subjectId: str(48, true), '$other': none,
        }, '$other': none,
      },
    },
  });
  branches.incidents = forRoom({
    '.read': `(${owner}) && (${active})`,
    '$uid': { '.read': `(${self}) && (${active})`,
      '.write': `(${active}) && ((${owner}) || ((${self}) && ${enrolled} && data.exists() && newData.exists() && ${fieldEqual(['id','type','createdAt','resolvedAt'])}))`,
      '.validate': `${roomValid} && ${sessionValid} && newData.hasChildren(['id','type','createdAt','resolvedAt','ackAt']) && ((${owner}) ? ((!data.exists() || data.child('resolvedAt').val() > 0) && newData.child('createdAt').val() === now && newData.child('resolvedAt').val() === 0 && newData.child('ackAt').val() === 0 || (data.exists() && ${fieldEqual(['id','type','createdAt','ackAt'])} && newData.child('resolvedAt').val() === now)) : true)`,
      id: { '.validate': "newData.isString() && newData.val().matches(/^i_[a-f0-9]{32}$/)" },
      type: { '.validate': "newData.val() === 'hidden' || newData.val() === 'unreachable'" },
      createdAt: stamp, resolvedAt: { '.validate': 'newData.isNumber() && (newData.val() === 0 || newData.val() === now || newData.val() === data.val())' },
      ackAt: { '.validate': `(${receipt['.validate']}) || (newData.val() === 0 && newData.parent().child('id').val() !== data.parent().child('id').val())` }, '$other': none,
    },
  });
  branches.notices = forRoom({
    '.read': `(${owner}) && (${active})`,
    '$uid': { '.read': `(${self}) && (${active})`,
      '$noticeId': {
        '.write': `(${active}) && (((${owner}) && !data.exists() && newData.exists() && root.child('classroomV1/members').child($roomId).child($uid).exists() && root.child('classroomMonitorV1/participants').child($roomId).child($sessionId).child($uid).child('joined').val() === true) || ((${self}) && ${enrolled} && data.exists() && newData.exists() && ${fieldEqual(['text','senderUid','createdAt'])}))`,
        '.validate': `${roomValid} && ${sessionValid} && $noticeId.matches(/^n_[a-f0-9]{32}$/) && newData.hasChildren(['text','senderUid','createdAt','deliveredAt','ackAt','reply','repliedAt']) && (!data.exists() ? newData.child('senderUid').val() === auth.uid && newData.child('deliveredAt').val() === 0 && newData.child('ackAt').val() === 0 && newData.child('reply').val() === '' && newData.child('repliedAt').val() === 0 : true)`,
        text: str(300), senderUid: str(128), createdAt: stamp, deliveredAt: receipt, ackAt: receipt,
        reply: str(300, true), repliedAt: { '.validate': "newData.isNumber() && (newData.val() === now || newData.val() === data.val() || (!data.exists() && newData.val() === 0)) && (newData.parent().child('reply').val() === '' || newData.val() > 0)" },
        '$other': none,
      },
    },
  });
  return { '.read': false, '.write': false, ...branches, '$other': none };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(new URL('../firebase/classroom-monitor.rules.json', import.meta.url), JSON.stringify({ rules: { classroomMonitorV1: buildMonitorRules() } }, null, 2) + '\n');
  if (process.argv[2]) {
    const base = JSON.parse(await readFile(process.argv[2], 'utf8'));
    if (!base.rules?.classroomV1 || base.rules.classroomMonitorV1) throw Error('Expected reviewed current Rules with classroomV1 and without classroomMonitorV1.');
    await writeFile(new URL('../firebase/classroom-monitor.merged-draft.json', import.meta.url), JSON.stringify({ rules: { ...base.rules, classroomMonitorV1: buildMonitorRules() } }, null, 2) + '\n');
  }
  console.log('Monitoring Rules generated locally; nothing deployed.');
}
