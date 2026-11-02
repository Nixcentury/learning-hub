import * as sdk from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { firebaseApp } from './firebase-config.js';
import { createClassroomSubmissions } from './classroom-submission-service.js';
import { submissionRoot } from '../public/shared/classroom-submission-model.js';
export function createFirebaseClassroomSubmissions(options) {
  const database = sdk.getDatabase(firebaseApp);
  let offset = 0;
  const target = path => sdk.ref(database, path.startsWith('@classroom/') ? 'classroomV1/' + path.slice(11)
    : path.startsWith('@assignments/') ? 'classroomAssignmentsV1/' + path.slice(13) : submissionRoot + '/' + path);
  return createClassroomSubmissions({ ...options, io: {
    assistEnabled: true,
    serverOffset: () => offset,
    get: async path => (await sdk.get(target(path))).val(),
    watch: (path, success, error) => sdk.onValue(target(path), value => success(value.val()), error),
    connected: success => {
      const stopOffset=sdk.onValue(sdk.ref(database,'.info/serverTimeOffset'),value=>{offset=Number(value.val()) || 0;});
      const stop=sdk.onValue(sdk.ref(database,'.info/connected'), value => success(value.val() === true), () => success(false));
      return ()=>{stop();stopOffset();};
    },
    timestamp: sdk.serverTimestamp,
    update: values => sdk.update(sdk.ref(database, submissionRoot), values),
    transaction: async (path, transform) => {
      const result = await sdk.runTransaction(target(path), transform, { applyLocally: false });
      return { committed: result.committed };
    },
  } });
}
