// Classroom monitoring is a lesson-scoped signal, never an attention score.
export const monitorRoot = 'classroomMonitorV1';
export const monitorTiming = Object.freeze({ heartbeat: 30_000, fresh: 90_000, hiddenGrace: 15_000, duration: 60 * 60_000 });
export const roomPattern = /^r_[a-f0-9]{32}$/;
export const sessionPattern = /^s_[a-f0-9]{32}$/;
export const cleanMonitorText = (value, limit = 200) => String(value || '').replace(/\p{Cc}/gu, '').replace(/\s+/g, ' ').trim().slice(0, limit);
export const monitorError = code => Object.assign(new Error(code), { code });
export const monitorId = prefix => prefix + '_' + crypto.randomUUID().replaceAll('-', '');
export function monitorLocation(value = {}) {
  const hash = /^#[a-zA-Z0-9/_-]{1,300}$/.test(value.hash || '') ? value.hash : '#overview';
  return { hash, titleTh: cleanMonitorText(value.titleTh) || 'Learning Hub', titleEn: cleanMonitorText(value.titleEn) || 'Learning Hub', subjectId: cleanMonitorText(value.subjectId, 48) };
}
export function liveLesson(value, now = Date.now()) {
  return Boolean(value && sessionPattern.test(value.id) && value.active === true && Number(value.endsAt) > now && Number(value.startedAt) <= now + 5000);
}
export function participantState(participant, connections, now = Date.now()) {
  if (!participant) return { status: 'not-joined', since: 0, lastSeenAt: 0, location: null, windows: 0 };
  const records = Object.values(connections || {}).filter(value => value && typeof value === 'object');
  const fresh = records.filter(value => value.connected === true && now - Number(value.updatedAt || 0) <= monitorTiming.fresh);
  const uncertain = records.some(value => value.connected === true && now - Number(value.updatedAt || 0) > monitorTiming.fresh);
  const visible = fresh.filter(value => value.visible === true);
  const lastSeenAt = Math.max(Number(participant.updatedAt || 0), ...records.map(value => Number(value.updatedAt || 0)));
  const newest = [...(visible.length ? visible : records)].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0];
  const common = { lastSeenAt, location: newest?.location ? monitorLocation(newest.location) : null, windows: fresh.length };
  if (participant.joined !== true) return { ...common, status: 'left', since: Number(participant.updatedAt || 0) };
  if (visible.length) return { ...common, status: 'visible', since: Math.max(...visible.map(value => Number(value.changedAt || value.updatedAt || 0))) };
  if (uncertain) return { ...common, status: 'stale', since: lastSeenAt };
  if (fresh.length) return { ...common, status: 'hidden', since: Math.max(...fresh.map(value => Number(value.changedAt || value.updatedAt || 0))) };
  return { ...common, status: 'disconnected', since: lastSeenAt };
}
export function incidentNeeded(row, now = Date.now()) {
  if (row.status === 'hidden' && now - row.since >= monitorTiming.hiddenGrace) return 'hidden';
  if (['stale', 'disconnected'].includes(row.status) && row.lastSeenAt && now - row.lastSeenAt >= monitorTiming.fresh) return 'unreachable';
  return '';
}
export function cleanNudge(value) {
  const text = cleanMonitorText(value, 301);
  if (!text || text.length > 300) throw monitorError('monitor/invalid-message');
  return text;
}
