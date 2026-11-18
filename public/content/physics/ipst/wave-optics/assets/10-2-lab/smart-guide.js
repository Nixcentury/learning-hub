(() => {
  'use strict';
  const B = globalThis.DoubleSlitLabBridge,
    Q = globalThis.InterferenceMissions;
  const $ = (id) => document.getElementById(id);
  const T = (th, en) => (B.language() === 'th' ? th : en);
  let highlighted = null,
    highlightTimer,
    resizeFrame;

  function measurementTarget(state, preset, distance = 1) {
    if (
      state.config.color !== (preset === 'C' ? 'red' : 'green') ||
      state.config.slit !== (preset === 'A' ? 50 : 100) ||
      state.lightPhase !== 0
    )
      return [
        'preset-' + preset,
        T(`เลือกชุด ${preset}`, `Choose set ${preset}`),
      ];
    if (state.config.distance !== distance)
      return [
        'distance-number',
        T(
          `ตั้งระยะฉาก L = ${distance.toFixed(1)} m`,
          `Set screen distance L = ${distance.toFixed(1)} m`,
        ),
      ];
    if (state.records.length >= 30)
      return [
        'records-body',
        T(
          'ครบ 30 บันทึกแล้ว ลบรายการที่ไม่ใช้ก่อนวัดเพิ่ม',
          '30 records reached. Delete an unused record before adding another.',
        ),
      ];
    if (!state.moved.left)
      return [
        'handle-left',
        T(
          'ลากเส้นซ้ายไปยังตำแหน่งมืดที่ติดกับแถบสว่างกลางด้านซ้าย',
          'Move the left marker to the minimum immediately left of the central bright fringe.',
        ),
      ];
    if (!state.moved.right)
      return [
        'handle-right',
        T(
          'ลากเส้นขวาไปยังตำแหน่งมืดที่ติดกับแถบสว่างกลางด้านขวา',
          'Move the right marker to the minimum immediately right of the central bright fringe.',
        ),
      ];
    if (state.cursors.left >= state.cursors.right)
      return [
        'handle-left',
        T(
          'วางเส้นซ้ายให้อยู่ทางซ้ายของเส้นขวา',
          'Place the left marker to the left of the right marker.',
        ),
      ];
    return [
      'record',
      T(
        `กดบันทึกผลชุด ${preset} ที่ L = ${distance.toFixed(1)} m`,
        `Record set ${preset} at L = ${distance.toFixed(1)} m`,
      ),
    ];
  }

  function step(state) {
    const id = state.missions.current,
      w = state.water;
    const requirements = Q.requirements(state);
    const order =
      id === 2 ? [2, 3, 4, 5, 0, 1, 6] : requirements.map((_, i) => i);
    const index = order.find((i) => !requirements[i][0]);
    const done = requirements.filter(([v]) => v).length;
    const position =
      index === undefined ? requirements.length : order.indexOf(index) + 1;
    const observation = [
      [
        'สังเกต P บนแนวกลางหลายจังหวะ: สั่นหรืออยู่นิ่ง? สีผิวเป็นการกระจัด ณ ขณะนั้น',
        'Watch centre-line P over several cycles: does it oscillate or stay still? Surface colour is instantaneous displacement.',
      ],
      [
        'เทียบ P ตำแหน่งเดิมกับภารกิจแรก เมื่อเปลี่ยนเฟสเริ่มต้น',
        'Compare the same P with mission 1 after reversing the initial phase.',
      ],
      [
        'อ่าน r₁ และ r₂ ของ P เดียวกัน บัพ–ปฏิบัพพิจารณาจากผลต่างทางเดินร่วมกับเฟส',
        'Read both paths to the same P. Locus type depends on path difference and source phase.',
      ],
      [
        'เทียบค่าจริงกับค่าประมาณทั้งสองวิธี โดยดู L/d และมุม θ ประกอบ',
        'Compare exact and estimated paths together with L/d and angle θ.',
      ],
      [
        'วัดแถบกลางหนึ่งแถบ ระหว่างตำแหน่งมืดที่ติดกันสองข้าง ไม่ใช่ทั้งกลุ่มแถบ',
        'Measure one central bright fringe between its immediate minima, not the whole fringe group.',
      ],
      [
        'ใช้ค่าจากบันทึกที่โจทย์ระบุ แปลงหน่วยให้ตรงกันก่อนคำนวณ λ',
        'Use the record named in the question and align length units before calculating λ.',
      ],
    ][id];
    if (state.missions.completed.includes(id))
      return {
        done,
        position,
        total: requirements.length,
        action: 'next',
        text: T(
          id === 5
            ? 'ผ่านภารกิจสุดท้ายแล้ว ดูรายงานผลได้เลย'
            : 'ผ่านภารกิจนี้แล้ว พร้อมไปภารกิจถัดไป',
          id === 5
            ? 'Final mission passed. View your report.'
            : 'Mission passed. Continue to the next mission.',
        ),
        observation: T(...observation),
      };
    if (index === undefined && state.missions.answerOpen) {
      const questions = Q.questions(id, state),
        answers = state.missions.answers[id];
      const blank = questions.findIndex(
        (_, i) => !(answers['q' + i] || '').trim(),
      );
      const wrong = state.missions.attempted[id]
        ? state.missions.lastChecks[id]?.results.findIndex((value) => !value)
        : -1;
      const question = blank >= 0 ? blank : wrong;
      if (question >= 0)
        return {
          done,
          position,
          total: requirements.length,
          action: 'answer',
          target:
            questions[question].type === 'number'
              ? `mission-number-${question}`
              : `checkout-choice-${question}`,
          text:
            blank >= 0
              ? T(
                  `ตอบคำถามข้อ ${question + 1} แล้วจึงตรวจคำตอบ`,
                  `Answer question ${question + 1}, then check your answers.`,
                )
              : T(
                  `ทบทวนคำตอบข้อ ${question + 1} จากผลทดลอง แล้วลองตรวจใหม่`,
                  `Review question ${question + 1} using your observations, then check again.`,
                ),
          observation: T(...observation),
        };
    }
    if (index === undefined)
      return {
        done,
        position,
        total: requirements.length,
        action: state.missions.answerOpen ? 'check' : 'checkout',
        text: T(
          state.missions.answerOpen
            ? 'ตอบคำถามให้ครบ แล้วกดตรวจคำตอบ'
            : 'ทดลองครบแล้ว พร้อมทำ Check-out',
          state.missions.answerOpen
            ? 'Answer every question, then check your answers.'
            : 'Experiment steps complete. Open check-out.',
        ),
        observation: T(...observation),
      };
    let target;
    if (id === 0)
      target =
        index === 0
          ? ['water-play', T('กดปุ่ม “เล่นคลื่น”', 'Press Play waves')]
          : w.phase !== 0
            ? ['water-phase', T('ตั้งเฟสเริ่มต้นเป็น 0°', 'Set initial phase to 0°')]
            : ['water-center', T('กด P กลาง', 'Press Centre P')];
    if (id === 1)
      target = [
        [
          'water-phase',
          T('เปลี่ยนเฟสเริ่มต้นเป็น 180°', 'Set the initial phase to 180°'),
        ],
        ['layer-nodes', T('เปิดแนวบัพ N', 'Show nodal lines N')],
        ['water-center', T('กด P กลาง', 'Press Centre P')],
        ['water-play', T('กดปุ่ม “เล่นคลื่น”', 'Press Play waves')],
      ][index];
    if (id === 2)
      target = [
        ['layer-paths', T('เปิดเส้นทาง r₁/r₂', 'Show paths r₁/r₂')],
        [
          'water-example',
          T(
            'กด P ตัวอย่าง หรือเลื่อน P ออกจากแนวกลาง',
            'Choose Example P or move P off centre',
          ),
        ],
        [
          'water-wavelength-number',
          T(
            'พิมพ์ λ = 2 cm แล้วออกจากช่องกรอก',
            'Enter λ = 2 cm, then leave the field',
          ),
        ],
        ['water-separation-number', T('พิมพ์ d = 8 cm', 'Enter d = 8 cm')],
        ['water-L-number', T('พิมพ์ L = 12 cm', 'Enter L = 12 cm')],
        ['water-phase', T('ตั้งเฟสเริ่มต้นเป็น 0°', 'Set initial phase to 0°')],
        [
          'water-example',
          T(
            'กด P ตัวอย่าง Δr = λ/2 เพื่อเก็บกรณีที่ตั้งไว้',
            'Choose Example P: Δr = λ/2 to capture this case',
          ),
        ],
      ][index];
    if (id === 3) {
      if (index < 2)
        target = [
          index === 0 ? 'mission-near' : 'mission-far',
          T(
            index === 0
              ? 'กด “ดูกรณีใกล้ / มุมมาก” เพื่อเก็บกรณีแรก'
              : 'กด “ดูกรณีไกล / มุมเล็ก” แล้วเปรียบเทียบ',
            index === 0
              ? 'Press Near / large-angle case to capture the first case'
              : 'Press Far / small-angle case, then compare',
          ),
        ];
      else
        target =
          w.separation !== 8
            ? ['water-separation-number', T('ตั้ง d = 8 cm', 'Set d = 8 cm')]
            : w.L !== 60
              ? ['water-L-number', T('ตั้ง L = 60 cm', 'Set L = 60 cm')]
              : w.x !== 6
                ? ['water-x-number', T('ตั้ง x = 6 cm', 'Set x = 6 cm')]
                : [
                    'layer-formulas',
                    T('เปิดสูตรและค่าทั้งสามวิธี', 'Show all three formulas'),
                  ];
    }
    if (id === 4) target = measurementTarget(state, ['A', 'B', 'C'][index]);
    if (id === 5) target = measurementTarget(state, 'C', 2);
    if (target[0] === 'water-example' && $('water-example').disabled)
      target = [
        'water-L-number',
        T(
          'P ตัวอย่างอยู่นอกฉาก ตั้ง L = 12 cm แล้วลองใหม่',
          'Example P is outside the screen. Set L = 12 cm and try again.',
        ),
      ];
    return {
      done,
      position,
      total: requirements.length,
      action: 'tool',
      target: target[0],
      text: target[1],
      observation: T(...observation),
    };
  }

  function clearHighlight() {
    if (highlighted) highlighted.classList.remove('smart-target');
    highlighted = null;
    $('smart-arrow').hidden = true;
    clearTimeout(highlightTimer);
  }
  function placeArrow() {
    if (!highlighted) return;
    const rect = highlighted.getBoundingClientRect(),
      arrow = $('smart-arrow');
    arrow.style.left = `${Math.max(8, Math.min(innerWidth - 36, rect.left + rect.width / 2 - 14))}px`;
    arrow.style.top = `${Math.max(4, rect.top - 33)}px`;
  }
  function focus(target) {
    const control = $(target);
    if (!control || control.closest('[hidden]')) return;
    clearHighlight();
    control.scrollIntoView({
      block: 'center',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
    // Keep the mobile keyboard closed until the learner touches a numeric field.
    if (!control.matches('input')) control.focus({ preventScroll: true });
    highlighted = control;
    control.classList.add('smart-target');
    $('smart-arrow').hidden = false;
    placeArrow();
    highlightTimer = setTimeout(clearHighlight, 3500);
  }
  function act() {
    const state = B.read(),
      current = step(state),
      guided = globalThis.GuidedInterference;
    if (current.action === 'next') return guided.next();
    if (current.action === 'checkout') return guided.openCheckout();
    if (current.action === 'answer') {
      guided.openCheckout();
      return focus(current.target);
    }
    if (current.action === 'check') {
      guided.openCheckout();
      return focus('mission-check');
    }
    guided.returnToExperiment(current.target);
  }
  function render() {
    const state = B.read(),
      guide = $('smart-guide'),
      current = step(state);
    guide.hidden =
      !state.missions.enabled ||
      state.reportOpen ||
      state.guideMode === 'hidden';
    guide.classList.toggle('is-mini', state.guideMode === 'mini');
    $('smart-reopen').hidden = !(
      state.guideMode === 'hidden' && !state.reportOpen
    );
    $('smart-heading').textContent = T(
      `🎯 ภารกิจ ${state.missions.current + 1}/6`,
      `🎯 Mission ${state.missions.current + 1}/6`,
    );
    $('smart-step').textContent = T(
      `ขั้นตอน ${current.position}/${current.total} · ทำแล้ว ${current.done}`,
      `Step ${current.position}/${current.total} · ${current.done} done`,
    );
    $('smart-instruction').textContent = current.text;
    $('smart-observation').textContent =
      T('👀 สังเกต: ', '👀 Observe: ') + current.observation;
    $('smart-primary').textContent =
      current.action === 'next'
        ? T(
            state.missions.current === 5 ? 'จบกิจกรรมและดูรายงาน' : 'ภารกิจถัดไป',
            state.missions.current === 5
              ? 'Finish and view report'
              : 'Next mission',
          )
        : current.action === 'answer'
          ? T('พาไปยังคำถาม', 'Go to question')
          : current.action === 'checkout'
            ? T('ไปทำ Check-out', 'Open check-out')
            : current.action === 'check'
              ? T('พาไปตรวจคำตอบ', 'Go to answer check')
              : T('พาไปยังเครื่องมือ', 'Show the control');
    if (
      state.missions.current === 5 &&
      state.missions.completed.includes(5) &&
      state.missions.completed.length < 6
    ) {
      $('smart-primary').textContent = T(
        'กลับไปทำภารกิจที่ยังไม่ผ่าน',
        'Continue unfinished missions',
      );
      $('smart-instruction').textContent = T(
        'ภารกิจนี้ผ่านแล้ว ยังมีภารกิจที่ต้องทำให้ครบ',
        'This mission passed. Complete the remaining missions.',
      );
    }
    $('mission-next-action').textContent = $('smart-primary').textContent;
    $('smart-mini').textContent =
      state.guideMode === 'mini' ? T('ขยาย', 'Expand') : T('ย่อ', 'Minimise');
    $('smart-mini').ariaExpanded = String(state.guideMode !== 'mini');
    $('smart-hide').textContent = T('ซ่อน', 'Hide');
    $('smart-reopen').textContent = T('🎯 เรียกผู้ช่วย', '🎯 Show guide');
    $('smart-dock').hidden = guide.hidden && $('smart-reopen').hidden;
    resize();
    $('smart-history').replaceChildren(
      ...Q.requirements(state).map(([done, words]) => {
        const li = document.createElement('li');
        li.textContent = (done ? '✓ ' : '○ ') + T(...words);
        return li;
      }),
    );
  }
  function resize() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty(
        '--smart-height',
        $('smart-dock').hidden
          ? '0px'
          : `${$('smart-dock').getBoundingClientRect().height}px`,
      );
      placeArrow();
    });
  }
  $('smart-primary').onclick = act;
  $('smart-mini').onclick = () =>
    B.change(
      (s) => (s.guideMode = s.guideMode === 'mini' ? 'expanded' : 'mini'),
    );
  $('smart-hide').onclick = () => B.change((s) => (s.guideMode = 'hidden'));
  $('smart-reopen').onclick = () =>
    B.change((s) => {
      s.guideMode = 'expanded';
      s.missions.enabled = true;
    });
  addEventListener('scroll', placeArrow, { passive: true });
  addEventListener('resize', resize);
  new ResizeObserver(resize).observe($('smart-guide'));
  globalThis.SmartLabGuide = { render, act, focus, step, clearHighlight };
})();
