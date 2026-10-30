import * as sdk from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { firebaseApp } from './firebase-config.js';
import { assignmentRoot } from './classroom-assignment-model.js';
import { createClassroomAssignments } from './classroom-assignment-service.js';

export function createFirebaseClassroomAssignments(options) {
  const database = sdk.getDatabase(firebaseApp);
  const target = path => sdk.ref(database, path.startsWith('@classroom/') ? 'classroomV1/' + path.slice(11) : assignmentRoot + '/' + path);
  return createClassroomAssignments({ ...options, io: {
    get: async path => (await sdk.get(target(path))).val(),
    watch: (path, value, error) => sdk.onValue(target(path), snapshot => value(snapshot.val()), error),
    connected: value => sdk.onValue(sdk.ref(database, '.info/connected'), snapshot => value(snapshot.val() === true), () => value(false)),
    update: patch => sdk.update(sdk.ref(database, assignmentRoot), patch),
    timestamp: sdk.serverTimestamp,
    transaction: async (path, transform) => {
      const result = await sdk.runTransaction(target(path), transform, { applyLocally: false });
      return { committed: result.committed };
    },
  } });
}
