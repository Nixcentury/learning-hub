(() => {
  'use strict';
  const ns = 'http://www.w3.org/2000/svg';
  // Approximate screen RGB along the visible band, with separate guide colors for invisible light.
  const visibleStops = [
    [380, [155, 104, 255]], [435, [132, 123, 255]], [480, [60, 193, 255]],
    [510, [73, 235, 142]], [560, [201, 246, 78]], [580, [255, 224, 64]],
    [600, [255, 162, 64]], [635, [255, 90, 81]], [700, [232, 75, 85]],
  ];
  function spectrum(frequency) {
    const wavelength = 2997.92458 / frequency; // Frequency input uses 10¹⁴ Hz, wavelength is in nm.
    if (wavelength < 380) return { wavelength, region: 'uv', color: '#cbb4ff' };
    if (wavelength > 700) return { wavelength, region: 'ir', color: '#ffae9a' };
    const upper = visibleStops.findIndex(([nm]) => nm >= wavelength);
    const [lowNm, low] = visibleStops[Math.max(0, upper - 1)];
    const [highNm, high] = visibleStops[upper];
    const fraction = highNm === lowNm ? 0 : (wavelength - lowNm) / (highNm - lowNm);
    const rgb = low.map((value, index) => Math.round(value + (high[index] - value) * fraction));
    return { wavelength, region: 'visible', color: `rgb(${rgb.join(', ')})` };
  }
  const overlays = Object.freeze(['beam', 'velocity', 'field', 'current', 'arrival']);
  function connect() {
    const beam = document.getElementById('beam-layer');
    const arrival = document.getElementById('arrival-layer');
    const layer = document.getElementById('electron-layer');
    const velocity = document.getElementById('velocity-layer');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const parts = Array.from({ length: 18 }, (_, index) => {
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('r', '4.2');
      layer.append(dot);
      const energyFraction = ((index * 7) % 18 + 0.5) / 18;
      return { dot, energyFraction, phase: index / 18, y: 86 + (index * 19) % 66 };
    });
    const arrow = document.createElementNS(ns, 'path');
    arrow.setAttribute('marker-end', 'url(#arrow)');
    velocity.append(arrow);
    let reading, setup, frame;

    function paint(time = 600) {
      if (!reading) return;
      const count = reading.emission ? Math.max(1, Math.ceil(parts.length * setup.intensity / 100)) : 0;
      const bias = setup.voltage;
      for (const [index, part] of parts.entries()) {
        const { dot, energyFraction, phase, y } = part;
        dot.style.display = index < count ? '' : 'none';
        if (index >= count) continue;
        const energy = index === 0 && reading.current > 0 && bias < 0
          ? Math.max(reading.maximum * energyFraction, (reading.maximum - bias) / 2)
          : reading.maximum * energyFraction;
        const speed = Math.sqrt(energy);
        const stops = bias < 0 && energy <= -bias;
        const duration = stops ? 4 * speed / -bias : 2 / (speed + Math.sqrt(Math.max(0, energy + bias)));
        const elapsed = ((time / 1450 / duration + phase) % 1) * duration;
        const position = Math.min(1, Math.max(0, speed * elapsed + bias * elapsed * elapsed / 4));
        const x = 142 + 276 * position;
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        if (index === 0) {
          const direction = speed + bias * elapsed / 2 < 0 ? -1 : 1;
          arrow.setAttribute('d', `M${x},${y}h${direction * 24}`);
        }
      }
    }
    function tick(time) {
      if (document.hidden || !reading?.emission || reducedMotion.matches) { frame = undefined; return; }
      paint(time);
      frame = requestAnimationFrame(tick);
    }
    function animate() {
      paint();
      if (frame === undefined && reading?.emission && !document.hidden && !reducedMotion.matches)
        frame = requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', animate);
    reducedMotion.addEventListener('change', animate);
    return (nextSetup, nextReading, light) => {
      setup = nextSetup;
      reading = nextReading;
      const show = (id, on) => { document.getElementById(id).style.display = on ? '' : 'none'; };
      const overlays = setup.overlays;
      show('beam-layer', setup.light && setup.intensity > 0 && overlays.includes('beam'));
      beam.ownerSVGElement.style.setProperty('--light-color', light.color);
      beam.style.opacity = String(Math.sqrt(setup.intensity / 100));
      show('visible-beam', light.region === 'visible');
      show('invisible-beam', light.region !== 'visible');
      show('arrival-layer', reading.current > 0 && overlays.includes('arrival'));
      arrival.style.opacity = String(0.34 + 0.66 * Math.min(1, reading.rawCurrent / 4));
      show('velocity-layer', reading.emission && overlays.includes('velocity'));
      show('field-layer', setup.voltage !== 0 && overlays.includes('field'));
      show('current-layer', reading.current > 0 && overlays.includes('current'));
      document.getElementById('e-field').setAttribute('d', setup.voltage > 0 ? 'M350 64H252' : 'M252 64H350');
      document.getElementById('e-force').setAttribute('d', setup.voltage > 0 ? 'M252 173H350' : 'M350 173H252');
      animate();
    };
  }
  globalThis.PhotoelectricTube = { connect, spectrum, overlays };
})();
