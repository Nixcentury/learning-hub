import { getDatabase, ref, onValue, update, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { firebaseApp } from './firebase-config.js';
import { createClassroomTeachers } from './classroom-teacher-service.js';
export function createFirebaseClassroomTeachers(onChange) {
  const database = getDatabase(firebaseApp);
  return createClassroomTeachers({ onChange, io: {
    watch: (path, next, error) => onValue(ref(database, path === '.info/connected' ? path : 'learningHub/' + path), snap => next(snap.val()), error),
    update: patch => update(ref(database, 'learningHub'), patch), timestamp: serverTimestamp,
  } });
}
