(() => {
  'use strict';
  const B = globalThis.DoubleSlitLabBridge,
    Q = globalThis.InterferenceMissions,
    M = globalThis.DoubleSlitLabModel;
  const $ = (id) => document.getElementById(id),
    T = (th, en) => (B.language() === 'th' ? th : en);
  const node = (tag, text) => {
    const n = document.createElement(tag);
    n.textContent = text;
    return n;
  };
  const answerText = (value) =>
    ({
      node: T('บัพ', 'Node'),
      antinode: T('ปฏิบัพ', 'Antinode'),
      between: T('อยู่ระหว่างแนว', 'Between loci'),
      far: T('ฉากไกลเมื่อเทียบกับ d', 'Screen far compared with d'),
      small: T('มุมเล็ก', 'Small angle'),
      half: T('ประมาณครึ่งหนึ่ง', 'Approximately half'),
      C: T('ชุด C', 'Set C'),
    })[value] || value;
  const fraction = (values) =>
    `${values.filter((v) => v === true).length}/${values.length}`;
  function render() {
    const s = B.read(),
      m = s.missions,
      score = Q.scores(m),
      panel = $('lab-report');
    panel.hidden = !s.reportOpen;
    $('report-open').textContent = T('ดูรายงาน / คะแนน', 'Report / scores');
    if (!s.reportOpen) return;
    $('report-title').textContent = T(
      'รายงานผลการทดลองสลิตคู่',
      'Double-slit lab report',
    );
    $('report-name-label').textContent = T('ชื่อ–นามสกุล', 'Student name');
    $('report-class-label').textContent = T('ชั้น / ห้อง', 'Class');
    $('report-name').value = s.student.name;
    $('report-class').value = s.student.className;
    $('report-print-name').textContent =
      T('ชื่อ: ', 'Name: ') +
      (s.student.name || '________________') +
      ' · ' +
      T('ชั้น: ', 'Class: ') +
      (s.student.className || '________');
    $('report-date').textContent =
      T('วันที่เริ่มกิจกรรม: ', 'Activity started: ') + s.student.date;
    const metrics = $('report-metrics');
    metrics.replaceChildren();
    for (const [label, percent, count] of [
      [T('ความคืบหน้า', 'Progress'), score.progress, `${score.completed}/6`],
      [
        T('คะแนนครั้งแรก', 'First attempt'),
        score.firstPercent,
        `${score.firstCorrect}/12`,
      ],
      [
        T('Mastery หลังแก้ไข', 'Mastery after retries'),
        score.mastery,
        `${score.mastered}/12`,
      ],
    ]) {
      const box = node('div', '');
      box.append(
        node('strong', `${percent.toFixed(1)}%`),
        node('span', `${label} · ${count}`),
      );
      metrics.append(box);
    }
    $('report-score-note').textContent = T(
      `ตรวจครั้งแรกแล้ว ${score.firstChecked}/12 ข้อ ข้อที่ยังไม่ตรวจยังไม่เป็นคะแนนผิด ใช้ผู้ช่วยและคำใบ้ไม่หักคะแนน คะแนนครั้งแรกไม่เปลี่ยนเมื่อแก้ไขหรือทบทวน`,
      `${score.firstChecked}/12 questions have a first check. Unchecked questions are pending. Guidance and hints carry no penalty. Retries and reviews do not overwrite first-attempt scores.`,
    );
    const table = $('report-missions');
    table.replaceChildren();
    const head = document.createElement('tr');
    for (const label of [
      T('ภารกิจ', 'Mission'),
      T('สถานะ', 'Status'),
      T('ครั้งแรก', 'First'),
      T('Mastery', 'Mastery'),
    ])
      head.append(node('th', label));
    table.append(head);
    Q.titles.forEach((title, id) => {
      const tr = document.createElement('tr');
      for (const text of [
        T(...title),
        m.completed.includes(id)
          ? T('✓ ผ่าน', '✓ Passed')
          : T('ยังไม่ผ่าน', 'Pending'),
        m.first[id].every((v) => v === null)
          ? T('ยังไม่ตรวจ', 'Unchecked')
          : fraction(m.first[id]),
        fraction(m.mastered[id]),
      ])
        tr.append(node('td', text));
      table.append(tr);
    });
    const records = $('report-records');
    records.replaceChildren();
    $('report-records-title').textContent = T(
      'ผลการวัดที่บันทึก',
      'Recorded measurements',
    );
    if (!s.records.length)
      records.append(node('p', T('ยังไม่มีผลวัด', 'No measurements yet.')));
    else {
      const table = document.createElement('table');
      table.className = 'report-table';
      const header = document.createElement('tr');
      for (const text of [
        T('ครั้ง / ชุด', 'Trial / set'),
        'λ (nm)',
        'd (μm)',
        'L (m)',
        'φ₀',
        T('วัดได้ (mm)', 'Measured (mm)'),
        T('วิธีวัด', 'Method'),
      ])
        header.append(node('th', text));
      table.append(header);
      for (const r of s.records) {
        const row = document.createElement('tr');
        for (const text of [
          `${r.id} · ${M.preset(r.config) || T('กำหนดเอง', 'Custom')}`,
          M.wavelengths[r.config.color],
          r.config.slit,
          r.config.distance.toFixed(1),
          `${r.phase ?? 0}°`,
          M.measurement(r.cursors).toFixed(2),
          r.source === 'model' ? T('แบบจำลอง', 'Model') : T('ลากวัด', 'Manual'),
        ])
          row.append(node('td', String(text)));
        table.append(row);
      }
      records.append(table);
    }
    const details = $('report-answers');
    details.replaceChildren();
    $('report-answers-title').textContent = T(
      'คำตอบที่ตรวจและข้อมูลคำนวณ',
      'Checked answers and calculation data',
    );
    Q.titles.forEach((title, id) => {
      const checked = m.lastChecks[id];
      if (!checked) return;
      const section = document.createElement('details');
      section.open = true;
      section.append(node('summary', T(...title)));
      const list = document.createElement('ol');
      checked.items.forEach((item, i) => {
        const li = node('li', T(...item.text));
        const latest = node(
          'p',
          T('คำตอบที่ตรวจล่าสุด: ', 'Latest checked answer: ') +
            answerText(item.answer) +
            (item.unit ? ' ' + item.unit : '') +
            ' · ' +
            (checked.results[i]
              ? T('ถูก', 'Correct')
              : T('ลองใหม่', 'Try again')),
        );
        latest.className = 'report-answer';
        li.append(latest);
        const first = m.firstChecks[id]?.items[i];
        if (first)
          li.append(
            node(
              'p',
              T('ครั้งแรก: ', 'First check: ') +
                answerText(first.answer) +
                (first.unit ? ' ' + first.unit : '') +
                ' · ' +
                (m.first[id][i]
                  ? T('ถูก', 'Correct')
                  : T('ยังไม่ถูก', 'Incorrect')),
            ),
          );
        list.append(li);
      });
      section.append(list);
      details.append(section);
    });
    $('report-print').textContent = T('พิมพ์รายงาน A4', 'Print A4 report');
    $('report-review').textContent = T('ทบทวนภารกิจ', 'Review missions');
    $('report-return').textContent = T('กลับไปทำต่อ', 'Continue experiment');
    $('report-open').textContent = T('ดูรายงาน / คะแนน', 'Report / scores');
    $('report-legacy').hidden = !m.legacyCompleted.length;
    $('report-legacy').textContent = T(
      'กู้คืนงานรุ่นเดิมแล้ว: เก็บคำตอบและผลวัดเดิมไว้ ข้อเพิ่มเติมต้องทำให้ครบ และไม่มีการสร้างคะแนนครั้งแรกย้อนหลัง',
      'Legacy work restored: original answers and measurements are retained. Complete the added questions; first-attempt scores are not invented retrospectively.',
    );
  }
  function open() {
    B.change((s) => {
      s.reportOpen = true;
      s.water.running = false;
    }, true);
    $('lab-report').scrollIntoView({ block: 'start' });
    $('report-title').focus({ preventScroll: true });
  }
  $('report-name').oninput = () =>
    B.change((s) => (s.student.name = $('report-name').value.slice(0, 100)));
  $('report-class').oninput = () =>
    B.change(
      (s) => (s.student.className = $('report-class').value.slice(0, 60)),
    );
  $('report-open').onclick = open;
  $('report-return').onclick = () => B.change((s) => (s.reportOpen = false));
  $('report-review').onclick = () => {
    B.change((s) => {
      s.reportOpen = false;
      s.missions.enabled = true;
    });
    $('mission-select').focus();
    $('mission-card').scrollIntoView({ block: 'start' });
  };
  $('report-print').onclick = () => {
    render();
    window.print();
  };
  globalThis.DoubleSlitReport = { render, open };
})();
