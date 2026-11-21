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
  globalThis.DoubleSlitLightActivity = { trials, comparisons, width, surroundsCentre, trialKey, latestReadings, evidence };
})();
