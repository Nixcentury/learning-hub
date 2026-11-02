// A room teacher borrows one student's assignment; the Hub account stays the teacher's.
export const assistLifetime = 180000;
export const assistHeartbeat = 30000;
export const assistLive = (lease, now = Date.now()) => lease?.status === 'active' && Number(lease.expiresAt) > now;
export const homeworkActor = binding => binding?.actorUid || binding?.uid;
export const assistPath = (roomId, id, uid) => `assists/${roomId}/${id}/${uid}`;
export const assistError = code => Object.assign(new Error(code), { code });
