import '../content/physics/ipst/wave-optics/assets/10-1-sim/missions.js';
export const waveAssessmentModel = globalThis.MiniWaveMissions;
export const waveAssessmentContentId = 'physics-ipst-wave-optics-10-1-mini-sim';
export const waveAssessmentStorageId = 'simulation-wave-10-1-assessment-20261107';
export function readWaveAssessmentPayload(value) {
  try { const parsed=JSON.parse(value?.payload||'null'); return waveAssessmentModel.validRecord(parsed)?parsed:null; } catch { return null; }
}
