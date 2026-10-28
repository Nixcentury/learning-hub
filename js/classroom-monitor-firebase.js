import * as sdk from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { firebaseApp } from './firebase-config.js';
import { monitorRoot } from './classroom-monitor-model.js';
import { createClassroomMonitor } from './classroom-monitor-service.js';

export function createFirebaseClassroomMonitor(onChange) {
  const { getDatabase, ref, onValue, get, set, update, remove, runTransaction, onDisconnect, serverTimestamp } = sdk;
  const database = getDatabase(firebaseApp);
  const target = path => ref(database, path.startsWith('@classroom/') ? 'classroomV1/' + path.slice(11) : monitorRoot + '/' + path);
  let offset = 0;
  const stopOffset = onValue(ref(database, '.info/serverTimeOffset'), value => { offset = Number(value.val()) || 0; }, () => {});
  const monitor = createClassroomMonitor({ onChange, now: () => Date.now() + offset, io: {
    watch: (path, value, error) => onValue(target(path), snapshot => value(snapshot.val()), error),
    connected: value => onValue(ref(database, '.info/connected'), snapshot => value(snapshot.val() === true), () => value(false)),
    get: async path => (await get(target(path))).val(),
    set: (path, value) => set(target(path), value),
    update: value => update(ref(database, monitorRoot), value),
    remove: path => remove(target(path)),
    timestamp: serverTimestamp,
    transaction: async (path, transform) => {
      const result = await runTransaction(target(path), transform, { applyLocally: false });
      if (!result.committed) return { committed: false };
      return { committed: true, value: result.snapshot.val() };
    },
    disconnect: async (path, value) => {
      const registration = onDisconnect(target(path));
      await registration.update(value);
      return { cancel: () => registration.cancel() };
    },
  } });
  return { ...monitor, dispose() { stopOffset(); monitor.dispose(); } };
}
