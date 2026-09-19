/* Chapter presentation only. Content stays in each subject's HTML template. */
(() => {
  const localize = (element, th, en) => {
    element.dataset.th = th;
    element.dataset.en = en;
    element.textContent = document.documentElement.lang === "en" ? en : th;
  };
  const cleanTitle = (title) => title.replace(/^(?:บทที่\s*\d+|Chapter\s*\d+)\s*[:·.\-–]?\s*/i, "");
  const drawings = {
    physics: '<ellipse cx="150" cy="150" rx="115" ry="43"/><ellipse cx="150" cy="150" rx="115" ry="43" transform="rotate(60 150 150)"/><ellipse cx="150" cy="150" rx="115" ry="43" transform="rotate(120 150 150)"/><circle cx="150" cy="150" r="10" fill="currentColor"/><circle cx="257" cy="168" r="8" fill="currentColor"/>',
    chemistry: '<path d="M87 105l57-33 57 33v66l-57 33-57-33zM201 105l43-25M201 171l43 25M87 105L48 82M87 171l-39 23M144 72V29M144 204v45"/><circle cx="144" cy="72" r="12"/><circle cx="201" cy="105" r="12"/><circle cx="201" cy="171" r="12"/><circle cx="144" cy="204" r="12"/><circle cx="87" cy="171" r="12"/><circle cx="87" cy="105" r="12"/>',
    biology: '<path d="M93 23c0 65 114 60 114 127S93 212 93 277M207 23c0 65-114 60-114 127s114 62 114 127M96 42h108M108 66h84M129 91h42M129 209h42M108 234h84M96 258h108M100 126h100M94 150h112M100 174h100"/>',
  };
  function illustration(subject) {
    return `<svg viewBox="0 0 300 300" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">${drawings[subject] || drawings.physics}</svg>`;
  }

  function mount({ root, grid, subject, onOpen }) {
    const cards = [...grid.querySelectorAll("[data-chapter]")];
    if (!cards.length) return;
    const chapters = cards.map((card) => ({
      id: card.dataset.chapter,
      th: cleanTitle(card.querySelector(".chapter-title").dataset.th),
      en: cleanTitle(card.querySelector(".chapter-title").dataset.en),
      description: { ...card.querySelector(".chapter-description").dataset },
      ready: Boolean(root.ownerDocument.querySelector("#subject-chapters")?.content.querySelector(`[data-chapter="${card.dataset.chapter}"][data-chapter-src]`)),
    }));
    const count = cards.length;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    let current = 0;
    let suppressClickUntil = 0;
    let gesture = null;
    let lastWheel = 0;
    let wheelDelta = 0;
    let lastWheelEvent = 0;

    localize(root.querySelector(".prototype-badge"), `${count} บทเรียน`, `${count} chapters`);
    localize(root.querySelector(".section-intro .eyebrow"), "สำรวจรายวิชา", "EXPLORE YOUR SUBJECT");
    localize(root.querySelector("#chapter-view-title"), "วันนี้ อยากเรียนรู้เรื่องไหน?", "Where will curiosity take you?");
    localize(root.querySelector(".section-intro > p"), "เลื่อนเพื่อสำรวจ · เลือกบทที่สนใจ", "Scroll to explore · Find your next chapter");

    const layout = document.createElement("div");
    layout.className = "orbit-layout";
    layout.innerHTML = `
      <div class="orbit-details">
        <div class="orbit-kicker"><span class="orbit-detail-number"></span><span data-th="บทที่เลือก" data-en="SELECTED CHAPTER">บทที่เลือก</span></div>
        <h2 class="orbit-detail-title"></h2>
        <p class="orbit-detail-description"></p>
        <p class="orbit-status"><i aria-hidden="true"></i><span data-th="กำลังเตรียมเนื้อหา" data-en="Content in preparation">กำลังเตรียมเนื้อหา</span></p>
        <button class="orbit-open orbit-magnetic" type="button"><span class="magnetic-content"><span data-th="สำรวจบทนี้" data-en="Explore chapter">สำรวจบทนี้</span><b aria-hidden="true">↗</b></span></button>
        <span class="orbit-caption" data-th="เลือกบทเพื่อดูพื้นที่และเครื่องมือ" data-en="Choose a chapter to find its workspace and tools">เลือกบทเพื่อดูพื้นที่และเครื่องมือ</span>
      </div>
      <div class="orbit-browser">
        <div class="orbit-stage"><div class="orbit-track" aria-hidden="true"></div><div class="orbit-shadow" aria-hidden="true">${illustration(subject.id)}</div></div>
        <div class="orbit-controls">
          <button class="orbit-arrow orbit-magnetic" type="button" data-direction="-1" data-aria-th="บทก่อนหน้า" data-aria-en="Previous chapter" aria-label="บทก่อนหน้า"><span class="magnetic-content" aria-hidden="true">↑</span></button>
          <div class="orbit-position"><strong class="orbit-counter">01</strong><span>/ ${String(count).padStart(2, "0")}</span></div>
          <button class="orbit-arrow orbit-magnetic" type="button" data-direction="1" data-aria-th="บทถัดไป" data-aria-en="Next chapter" aria-label="บทถัดไป"><span class="magnetic-content" aria-hidden="true">↓</span></button>
          <label class="orbit-jump"><span data-th="ไปยังบท" data-en="Jump to chapter">ไปยังบท</span><select class="orbit-select"></select></label>
        </div>
        <p class="orbit-help" data-th="เลื่อนเมาส์ · ปัดซ้าย–ขวา · หรือใช้ปุ่มลูกศร" data-en="Scroll · Swipe left or right · Or use the arrow buttons">เลื่อนเมาส์ · ปัดซ้าย–ขวา · หรือใช้ปุ่มลูกศร</p>
      </div>
      <span class="orbit-announcement" role="status" aria-live="polite" aria-atomic="true"></span>`;
    grid.before(layout);
    layout.querySelector(".orbit-stage").append(grid);
    grid.classList.add("orbit-cards");
    grid.setAttribute("role", "group");
    grid.dataset.ariaTh = `เลือกบท${subject.titleTh}`;
    grid.dataset.ariaEn = `Choose a ${subject.titleEn} chapter`;
    grid.setAttribute("aria-label", grid.dataset.ariaTh);
    const select = layout.querySelector("select");
    const stage = layout.querySelector(".orbit-stage");
    const details = layout.querySelector(".orbit-details");

    cards.forEach((card, index) => {
      const chapter = chapters[index];
      card.innerHTML = `<span class="orbit-card-art" aria-hidden="true">${illustration(subject.id)}</span><span class="orbit-card-top"><span class="orbit-card-subject"></span><span aria-hidden="true">✧</span></span><span class="orbit-card-number" aria-hidden="true">${chapter.id.padStart(2, "0")}</span><small class="orbit-card-label"></small><h3 class="orbit-card-title"></h3><span class="orbit-card-bottom"><span data-th="สำรวจบทเรียน" data-en="EXPLORE CHAPTER">สำรวจบทเรียน</span><b aria-hidden="true">↗</b></span>`;
      localize(card.querySelector(".orbit-card-subject"), subject.titleTh, subject.titleEn.toUpperCase());
      localize(card.querySelector(".orbit-card-label"), `บทที่ ${chapter.id}`, `Chapter ${chapter.id}`);
      localize(card.querySelector(".orbit-card-title"), chapter.th, chapter.en);
      card.dataset.ariaTh = `บทที่ ${chapter.id} ${chapter.th}`;
      card.dataset.ariaEn = `Chapter ${chapter.id} ${chapter.en}`;
      card.setAttribute("aria-label", card.dataset.ariaTh);
      card.addEventListener("click", () => {
        if (performance.now() < suppressClickUntil) return;
        if (current === index) onOpen(chapter.id);
        else choose(index, true);
      });
      const option = document.createElement("option");
      option.value = String(index);
      localize(option, `${chapter.id.padStart(2, "0")} · ${chapter.th}`, `${chapter.id.padStart(2, "0")} · ${chapter.en}`);
      select.append(option);
    });

    function choose(index, focus = false, announce = true) {
      current = ((index % count) + count) % count;
      const chapter = chapters[current];
      cards.forEach((card, cardIndex) => {
        let offset = (cardIndex - current + count) % count;
        if (offset > count / 2) offset -= count;
        const angle = Math.min(3, Math.abs(offset)) * 0.76;
        card.style.setProperty("--orbit-x", `${(1 - Math.cos(angle)) * 230}px`);
        card.style.setProperty("--orbit-y", `${Math.sin(angle) * 267 * Math.sign(offset)}px`);
        card.style.setProperty("--orbit-rotation", `${offset * 12}deg`);
        card.style.setProperty("--orbit-scale", offset === 0 ? "1" : ".7");
        card.style.zIndex = String(10 - Math.abs(offset));
        card.classList.toggle("is-selected", offset === 0);
        card.classList.toggle("is-neighbor", Math.abs(offset) === 1);
        card.tabIndex = offset === 0 ? 0 : -1;
        card.inert = Math.abs(offset) > 1;
        card.setAttribute("aria-hidden", String(Math.abs(offset) > 1));
        if (offset === 0) card.setAttribute("aria-current", "true");
        else card.removeAttribute("aria-current");
      });
      select.value = String(current);
      const number = chapter.id.padStart(2, "0");
      layout.querySelector(".orbit-counter").textContent = String(current + 1).padStart(2, "0");
      layout.querySelector(".orbit-detail-number").textContent = number;
      localize(layout.querySelector(".orbit-detail-title"), chapter.th, chapter.en);
      localize(layout.querySelector(".orbit-status span"), chapter.ready ? "มีเรื่องย่อยให้เลือก" : "กำลังเตรียมเนื้อหา", chapter.ready ? "Topics available" : "Content in preparation");
      localize(layout.querySelector(".orbit-detail-description"), chapter.description.th, chapter.description.en);
      if (announce) {
        localize(layout.querySelector(".orbit-announcement"), `บทที่ ${chapter.id} ${chapter.th}`, `Chapter ${chapter.id}: ${chapter.en}`);
        if (!reducedMotion.matches) details.animate([{ opacity: .35, transform: "translateY(7px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 260, easing: "ease-out" });
      }
      if (focus) cards[current].focus({ preventScroll: true });
    }
    layout.querySelectorAll("[data-direction]").forEach((button) => {
      button.addEventListener("click", () => choose(current + Number(button.dataset.direction)));
    });
    select.addEventListener("change", () => choose(Number(select.value)));
    layout.querySelector(".orbit-open").addEventListener("click", () => onOpen(chapters[current].id));
    grid.addEventListener("keydown", (event) => {
      const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (delta || event.key === "Home" || event.key === "End") {
        event.preventDefault();
        choose(event.key === "Home" ? 0 : event.key === "End" ? count - 1 : current + delta, true);
      }
    });
    stage.addEventListener("wheel", (event) => {
      if (event.ctrlKey || !finePointer.matches || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      // First allow the page to scroll the carousel into view, including its controls.
      const bounds = stage.getBoundingClientRect();
      if (bounds.top < 0 || bounds.bottom + 80 > window.innerHeight) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastWheelEvent > 180) wheelDelta = 0;
      lastWheelEvent = now;
      if (now - lastWheel < 480) return;
      wheelDelta += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 300 : 1);
      if (Math.abs(wheelDelta) >= 45) {
        choose(current + Math.sign(wheelDelta));
        lastWheel = now;
        wheelDelta = 0;
      }
    }, { passive: false });
    stage.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    window.addEventListener("pointerup", (event) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        suppressClickUntil = performance.now() + 350;
        choose(current + (dx < 0 ? 1 : -1));
      }
    });
    window.addEventListener("pointercancel", () => { gesture = null; });
    window.addEventListener("blur", () => { gesture = null; });

    // The hit target stays still; only the label follows the pointer slightly.
    root.querySelectorAll(".orbit-magnetic, .back-button, .activity-card").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "mouse" || !finePointer.matches || reducedMotion.matches) return;
        const rect = button.getBoundingClientRect();
        button.style.setProperty("--magnetic-x", `${Math.max(-5, Math.min(5, (event.clientX - rect.left - rect.width / 2) * .09))}px`);
        button.style.setProperty("--magnetic-y", `${Math.max(-4, Math.min(4, (event.clientY - rect.top - rect.height / 2) * .12))}px`);
      });
      const reset = () => { button.style.removeProperty("--magnetic-x"); button.style.removeProperty("--magnetic-y"); };
      button.addEventListener("pointerleave", reset);
      button.addEventListener("blur", reset);
      button.addEventListener("pointercancel", reset);
    });
    const simulation = root.querySelector('[data-tool-kind="simulation"]');
    const notebook = root.querySelector('[data-tool-kind="notebook"]');
    localize(simulation.querySelector("strong"), "พื้นที่ทดลองจำลอง", "Simulation workspace");
    localize(simulation.querySelector(".activity-copy > span"), "กำลังเตรียมเนื้อหา · เปิดดูพื้นที่ตัวอย่าง", "Content in preparation · Preview the workspace");
    localize(notebook.querySelector("strong"), "สมุดเขียนประจำบท", "Chapter notebook");
    localize(notebook.querySelector(".activity-copy > span"), "เปิดพื้นที่จด สรุป และทดวิธีคิดของคุณ", "A space for your notes, summaries and working");
    localize(root.querySelector(".activity-heading .eyebrow"), "พื้นที่ประจำบท", "CHAPTER WORKSPACE");
    localize(root.querySelector(".activity-heading p"), "เลือกเครื่องมือ แล้วเริ่มสำรวจบทเรียนไปด้วยกัน", "Choose a tool and make space for your next idea.");
    localize(root.querySelector(".prototype-note span:last-child"), "กำลังเตรียมเนื้อหาและแบบฝึกหัดสำหรับบทนี้", "Content and exercises for this chapter are in preparation.");
    choose(0, false, false);
  }

  window.LearningHubSubjectOrbit = { mount };
})();
