import { getWorkspaceHomework } from './workspace.js';
export function installHomeworkBridge({ submissions, getSession, onBack, onFinish = onBack }) {
  window.addEventListener('message', async event => {
    if (event.origin !== location.origin || !['learning-hub-homework-load','learning-hub-homework-save','learning-hub-homework-submit','learning-hub-homework-back','learning-hub-homework-finish','learning-hub-homework-reclaim'].includes(event.data?.type)) return;
    const binding = getWorkspaceHomework(event.source), message = event.data;
    const current = () => binding && getWorkspaceHomework(event.source) === binding && getSession()?.status === 'signed-in' && getSession()?.user?.uid === (binding.actorUid || binding.uid);
    if (!current() || message.uid !== binding.uid) return;
    if (message.type === 'learning-hub-homework-back') { onBack(binding); return; }
    if (typeof message.requestId !== 'string' || !message.requestId || message.requestId.length > 128) return;
    const respond = result => { if (current()) event.source.postMessage({ type: 'learning-hub-quiz-storage-result', requestId: message.requestId, uid: binding.uid, contentId: message.contentId, ...result }, event.origin); };
    try {
      const action = message.type.slice('learning-hub-homework-'.length);
      const result = action === 'finish' && binding.assistId ? await submissions.finishAssist(binding)
        : action === 'reclaim' && !binding.assistId ? await submissions.reclaim(binding.id)
        : await submissions.quizCommand(action, binding, message);
      respond({ ok: true, action, ...result });
      if (action === 'finish') onFinish(binding);
    } catch (failure) { respond({ ok: false, code: String(failure?.code || failure?.message || 'homework/unavailable') }); }
  });
}
