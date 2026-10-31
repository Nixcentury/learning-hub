import * as sdk from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { firebaseApp } from './firebase-config.js';
import { linksRoot } from '../public/shared/classroom-links-model.js';
import { createClassroomLinks } from './classroom-links-service.js';
export function createFirebaseClassroomLinks(onChange) {
  const database = sdk.getDatabase(firebaseApp);
  const at = path => sdk.ref(database, path.startsWith('@classroom/') ? 'classroomV1/' + path.slice(11) : linksRoot + '/' + path);
  return createClassroomLinks({ onChange, io: {
    watch: (path, value, error) => sdk.onValue(at(path), snapshot => value(snapshot.val()), error),
    connected: value => sdk.onValue(sdk.ref(database, '.info/connected'), snapshot => value(snapshot.val() === true), () => value(false)),
    transaction: async (path, transform) => {
      const result = await sdk.runTransaction(at(path), transform, { applyLocally: false });
      return { committed: result.committed };
    },
    timestamp: sdk.serverTimestamp,
  } });
}
