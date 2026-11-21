(() => {
  'use strict';
  const model = globalThis.DoubleSlitLabModel;
  const { A, B, C } = model.presets;
  const trials = {
    A1: { label: 'A · 1 m', config: A },
    B1: { label: 'B · 1 m', config: B },
    C1: { label: 'C · 1 m', config: C },
    B2: { label: 'B · 2 m', config: { ...B, distance: 2 } },
    C2: { label: 'C · 2 m', config: { ...C, distance: 2 } },
  };
  const comparisons = [
    { id: 'slits', pair: ['A1', 'B1'], th: 'เมื่อใช้แสงเดิมและฉากอยู่ที่เดิม พอขยับสองช่องให้ห่างกัน แถบสว่างตรงกลางเปลี่ยนอย่างไร?', en: 'With the same light and screen position, how did the central bright fringe change when the two slits were moved farther apart?' },
    { id: 'colour', pair: ['B1', 'C1'], th: 'เมื่อสองช่องและฉากอยู่ที่เดิม พอเปลี่ยนแสงจากเขียวเป็นแดง แถบสว่างตรงกลางเปลี่ยนอย่างไร?', en: 'With the same slits and screen position, how did the central bright fringe change when the light changed from green to red?' },
    { id: 'screen', pair: ['B1', 'B2'], th: 'เมื่อใช้แสงเดิมและสองช่องอยู่ที่เดิม พอเลื่อนฉากออกไปอีก แถบสว่างตรงกลางเปลี่ยนอย่างไร?', en: 'With the same light and slits, how did the central bright fringe change when the screen was moved farther away?' },
  ];
  const width = record => model.measurement(record.cursors).toFixed(2);
  const surroundsCentre = ({ left, right }) => left < 0 && right > 0;
  function trialKey(config) {
    return Object.keys(trials).find(key => Object.entries(trials[key].config).every(([name, value]) => config[name] === value));
  }
  function latestReadings(records) {
    const readings = {};
    for (const record of records) {
      if (record.phase || record.source === 'model' || !surroundsCentre(record.cursors)) continue;
      const key = trialKey(record.config);
      if (key) readings[key] = record;
    }
    return readings;
  }
  function evidence(comparison, readings) {
    const records = comparison.pair.map(key => readings[key]);
    if (records.some(record => !record)) return null;
    const [first, second] = records.map(record => Number(width(record)));
    const trend = second > first ? 'wider' : second < first ? 'narrower' : 'same';
    return { trend, key: records.map(record => [record.id, record.cursors.left, record.cursors.right].join(':')).join('/') };
  }
  const firstTrials = ['A1', 'B1', 'C1', 'B2'];
  function trialStep(key, state) {
    const { label, config } = trials[key];
    const set = key[0];
    if (state.config.color !== config.color || state.config.slit !== config.slit ||
        (config.distance === 1 && state.config.distance !== 1)) {
      return { target: 'preset-' + set, label, th: 'เลือกชุด ' + set, en: 'Select set ' + set };
    }
    if (state.config.distance !== config.distance) {
      return { target: 'distance', label, th: 'ปรับระยะฉากเป็น 2 m', en: 'Set the screen distance to 2 m' };
    }
    if (!state.moved.left || state.cursors.left >= 0) {
      return { target: 'handle-left', label, th: 'ลากตัววัด L ไปที่ขอบมืดติดกับแถบกลางด้านซ้าย', en: 'Drag L to the nearest dark edge on the left of the central bright fringe' };
    }
    if (!state.moved.right || state.cursors.right <= 0) {
      return { target: 'handle-right', label, th: 'ลากตัววัด R ไปที่ขอบมืดติดกับแถบกลางด้านขวา', en: 'Drag R to the nearest dark edge on the right of the central bright fringe' };
    }
    if (state.records.length >= 30) {
      return { target: 'records-heading', label, th: 'ลบบันทึกที่ไม่ใช้ก่อนเพิ่มผลวัดใหม่', en: 'Delete an unused record before adding another measurement' };
    }
    return { target: 'record', label, th: 'ตรวจตัววัดทั้งสองแล้วกดบันทึกความกว้าง', en: 'Check both markers and record the width' };
  }

  function guideStep(state, readings, afterLesson) {
    if (afterLesson && !readings.C2) return trialStep('C2', state);
    const missing = firstTrials.find(key => !readings[key]);
    if (missing) return trialStep(missing, state);
    const unanswered = comparisons.find(comparison => {
      const observed = evidence(comparison, readings);
      const answer = state.checkout[comparison.id];
      return answer?.key !== observed.key || answer.value !== observed.trend;
    });
    if (unanswered) {
      return { target: 'trend-' + unanswered.id, label: 'Check-out', th: 'อ่านความกว้างสองค่าแล้วเลือกสิ่งที่เปลี่ยนจากที่วัดได้', en: 'Read both widths and choose the change shown by your measurements' };
    }
    if (!readings.C2) {
      return { target: 'return-heading', th: 'ใช้ผล C ที่ 1 m ทำนายใน Classroom Note แล้วกลับมาวัด C ที่ 2 m', en: 'Use the C reading at 1 m to predict in the Classroom Note, then return to measure C at 2 m' };
    }
    return { target: 'records-heading', th: 'เก็บผลครบแล้ว ใช้ผล C ที่ 2 m เทียบกับที่ทำนายไว้ใน Classroom Note', en: 'Measurements complete. Compare your C reading at 2 m with your prediction in the Classroom Note' };
  }

  globalThis.DoubleSlitLightActivity = { trials, comparisons, firstTrials, width, surroundsCentre, trialKey, latestReadings, evidence, guideStep };
})();
