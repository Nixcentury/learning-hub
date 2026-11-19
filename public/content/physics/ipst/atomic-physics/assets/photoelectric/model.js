(() => {
  'use strict';

  const charge = 1.602176634e-19;
  const h = 6.62607015e-34;
  const hScaled = h * 1e14 / charge; // eV per unit of 10¹⁴ Hz
  const metals = Object.freeze({ A: 2.50, B: 2.80 });
  const teaching = Object.freeze({
    metal: 'A', energy: 3, frequency: 3 / hScaled, intensity: 50,
    collectVoltage: 1, lowFrequency: 6, highFrequency: 6.1,
    strongIntensity: 80, sweep: Object.freeze([1, 0, -0.25, -0.45, -0.50, -0.65]),
  });
  const initial = () => ({
    light: false, metal: teaching.metal, frequency: teaching.frequency,
    intensity: teaching.intensity, voltage: teaching.collectVoltage, overlays: ['beam'],
  });
  function measure(setup) {
    const energy = hScaled * setup.frequency;
    const excess = energy - metals[setup.metal];
    const emission = setup.light && setup.intensity > 0 && excess > 1e-10;
    const maximum = emission ? excess : 0;
    // In the ideal 1D tube, take the longitudinal emission energies as uniform.
    // A retarding voltage filters out electrons with insufficient energy.
    const fraction = emission
      ? Math.max(0, Math.min(1, (maximum + Math.min(0, setup.voltage)) / maximum))
      : 0;
    const rawCurrent = fraction > 1e-10 ? setup.intensity * 0.04 * fraction : 0;
    // Keep positive readings distinct from the model's physical zero.
    const current = rawCurrent > 0 ? Math.max(0.01, Math.round(rawCurrent * 100) / 100) : 0;
    return { energy, maximum, emission, current, rawCurrent };
  }
  function signed(value, places = 2) {
    return (value > 0 ? '+' : value < 0 ? '−' : '') + Math.abs(value).toFixed(places);
  }
  globalThis.Photoelectric = Object.freeze({ charge, h, hScaled, metals, teaching, initial, measure, signed });
})();
