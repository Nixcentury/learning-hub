import { getDatabase, ref, get, update, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseApp } from "./firebase-config.js";
import { classroomRoot } from "./classroom-model.js";
import { createClassroomService } from "./classroom-service.js";

export function createFirebaseClassrooms(onChange) {
  const database = getDatabase(firebaseApp);
  const at = path => ref(database, classroomRoot + "/" + path);
  return createClassroomService({
    onChange,
    io: {
      get: async path => { const snapshot = await get(at(path)); return snapshot.exists() ? snapshot.val() : null; },
      watch: (path, value, error) => onValue(at(path), snapshot => value(snapshot.exists() ? snapshot.val() : null), error),
      update: patch => update(ref(database, classroomRoot), patch),
      timestamp: serverTimestamp,
    },
  });
}
