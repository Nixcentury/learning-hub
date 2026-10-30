import * as sdk from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { firebaseApp } from './firebase-config.js';
import { createClassroomSubmissions } from './classroom-submission-service.js';
import { submissionRoot } from '../public/shared/classroom-submission-model.js';
export function createFirebaseClassroomSubmissions(options) {
  const database = sdk.getDatabase(firebaseApp);
  const target = path => sdk.ref(database, path.startsWith('@classroom/') ? 'classroomV1/' + path.slice(11)
    : path.startsWith('@assignments/') ? 'classroomAssignmentsV1/' + path.slice(13) : submissionRoot + '/' + path);
  return createClassroomSubmissions({ ...options, io: {
    get: async path => (await sdk.get(target(path))).val(),
    watch: (path, success, error) => sdk.onValue(target(path), value => success(value.val()), error),
    connected: success => sdk.onValue(sdk.ref(database,'.info/connected'), value => success(value.val() === true), () => success(false)),
    timestamp: sdk.serverTimestamp,
    transaction: async (path, transform) => {
      const result = await sdk.runTransaction(target(path), transform, { applyLocally: false });
      return { committed: result.committed };
    },
  } });
}
