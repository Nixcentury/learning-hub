import { getDatabase, ref, get, update, onValue, serverTimestamp, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseApp } from "./firebase-config.js";
import { classroomRoot } from "./classroom-model.js";
import { createClassroomEnrollment } from "./classroom-enrollment.js";
import { createClassroomService } from "./classroom-service.js";

export function createFirebaseClassrooms(onChange) {
  const database = getDatabase(firebaseApp);
  const at = path => ref(database, classroomRoot + "/" + path);
  const io = {
      get: async path => { const snapshot = await get(at(path)); return snapshot.exists() ? snapshot.val() : null; },
      watch: (path, value, error) => onValue(at(path), snapshot => value(snapshot.exists() ? snapshot.val() : null), error),
      update: patch => update(ref(database, classroomRoot), patch),
      timestamp: serverTimestamp,
      watchInvitations: (field, value, next, error) => onValue(query(at("invitations"), orderByChild(field), equalTo(value)), snapshot => next(snapshot.val()), error),
  };
  const service = createClassroomService({ onChange, io });
  const enrollment = createClassroomEnrollment({ io });
  return { ...service,
    setContext(session, role, active) { enrollment.setContext(session, role); service.setContext(session, role, active); },
    dispose() { enrollment.dispose(); service.dispose(); },
  };
}
