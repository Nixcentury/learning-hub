(() => {
  'use strict';
  const ns = 'http://www.w3.org/2000/svg';
  const { hScaled, metals, signed } = Photoelectric;

  function plot(svg, options) {
    const { x, y, points = [], lines = [], xLabel, yLabel, title } = options;
    const left = 74, right = 454, top = 22, bottom = 206;
    const px = value => left + (value - x[0]) * (right - left) / (x.at(-1) - x[0]);
    const py = value => bottom - (value - y[0]) * (bottom - top) / (y.at(-1) - y[0]);
    function draw(tag, attributes, text) {
      const node = document.createElementNS(ns, tag);
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
      if (text !== undefined) node.textContent = text;
      svg.append(node);
    }
    svg.replaceChildren();
    svg.setAttribute('viewBox', '0 0 474 260');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', title);
    draw('title', {}, title);
    for (const tick of x) {
      draw('line', { x1: px(tick), x2: px(tick), y1: top, y2: bottom, class: 'gridline' });
      draw('text', { x: px(tick), y: bottom + 20, 'text-anchor': 'middle' }, options.formatX?.(tick) ?? tick);
    }
    for (const tick of y) {
      draw('line', { x1: left, x2: right, y1: py(tick), y2: py(tick), class: 'gridline' });
      draw('text', { x: left - 9, y: py(tick) + 4, 'text-anchor': 'end' }, tick);
    }
    draw('path', { d: `M${left},${top}V${bottom}H${right}`, class: 'axis' });
    draw('text', { x: (left + right) / 2, y: 250, 'text-anchor': 'middle' }, xLabel);
    draw('text', { transform: 'translate(21 115) rotate(-90)', 'text-anchor': 'middle' }, yLabel);
    for (const line of lines) {
      draw('polyline', { points: line.data.map(point => `${px(point[0])},${py(point[1])}`).join(' '), class: line.className || 'series' });
      if (line.label) {
        const last = line.data.at(-1);
        draw('text', { x: px(last[0]) - 10, y: py(last[1]) - 8, 'text-anchor': 'end', class: 'series-label' }, line.label);
      }
    }
    for (const [xValue, yValue] of points) {
      draw('circle', { cx: px(xValue), cy: py(yValue), r: 4.5, class: 'point' });
    }
  }

  function current(svg, rows, { title, practice = false } = {}) {
    const maxCurrent = Math.max(2, Math.ceil(Math.max(0, ...rows.map(row => row.current))));
    const x = practice ? [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2] : [-1, -0.75, -0.50, -0.25, 0, 0.25, 0.50, 0.75, 1];
    plot(svg, { x, y: [0, maxCurrent / 2, maxCurrent], xLabel: 'V (V)', yLabel: 'I (µA)', title,
      formatX: value => value === 0 ? '0' : signed(value, 2),
      points: rows.map(row => [row.voltage, row.current]),
    });
  }
  function kinetic(svg, title, practice = false) {
    const line = (material, label, className) => ({ className, label, data: [
      [metals[material] / hScaled, 0],
      [9, 9 * hScaled - metals[material]],
    ] });
    plot(svg, {
      x: [5, 6, 7, 8, 9, 10], y: [0, 0.5, 1, 1.5, 2], title,
      xLabel: 'f (10¹⁴ Hz)', yLabel: 'Kₘₐₓ (eV)',
      lines: practice
        ? [{ data: [[7, 0], [9, 0.8], [10, 1.2]], className: 'series' }]
        : [line('A', 'A', 'series'), line('B', 'B', 'series second')],
      points: practice ? [[8, 0.4], [9, 0.8]] : [],
    });
  }
  globalThis.PhotoelectricPlots = { current, kinetic };
})();
