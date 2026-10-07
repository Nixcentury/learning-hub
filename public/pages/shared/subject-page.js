/* ==============================================================
   โครงหน้ารายวิชากลางของ Learning Hub
   - ชื่อวิชาและรายการบทอยู่ใน HTML ของแต่ละวิชา
   - บทเดิมใช้ Navigation 3 ชั้น; data-chapter-src เปิดเมนู HTML แบบ 4 ชั้น
   - Activity Core โหลด HTML เนื้อหาและปริ้นรูปแบบกลางได้แล้ว แต่ยังไม่ตรวจคะแนน
================================================================ */

const subjectRoot = document.querySelector("[data-subject-page]");
const chapterTemplate = document.querySelector("#subject-chapters");
const contentNavigationUrl = new URL("subject-content-nav.js", document.currentScript.src).href;
const bankNavigationUrl = new URL("subject-bank-nav.js", document.currentScript.src).href;

function setLocalizedText(element, thai, english) {
  element.dataset.th = thai;
  element.dataset.en = english;
  element.textContent = document.documentElement.lang === "en" ? english : thai;
}

function readLocalizedText(element, fallbackThai, fallbackEnglish) {
  return {
    th: element?.dataset.th?.trim() || element?.textContent?.trim() || fallbackThai,
    en: element?.dataset.en?.trim() || fallbackEnglish,
  };
}

function buildSubjectPage() {
  if (!subjectRoot || !(chapterTemplate instanceof HTMLTemplateElement)) return;

  const subject = {
    id: subjectRoot.dataset.subjectId || "subject",
    icon: subjectRoot.dataset.subjectIcon || "◇",
    titleTh: subjectRoot.dataset.subjectTitleTh || "รายวิชา",
    titleEn: subjectRoot.dataset.subjectTitleEn || "Subject",
  };

  subjectRoot.innerHTML = `
    <header class="page-heading subject-heading">
      <span class="page-icon" id="subject-icon" aria-hidden="true"></span>
      <div>
        <small data-th="รายวิชา" data-en="Subject">รายวิชา</small>
        <h1 id="subject-title"></h1>
      </div>
      <span
        class="prototype-badge"
        data-th="โครงระบบ · ยังไม่มีเนื้อหาจริง"
        data-en="System prototype · No live content yet"
      >โครงระบบ · ยังไม่มีเนื้อหาจริง</span>
    </header>

    <nav
      class="stage-path"
      data-aria-th="ลำดับการเปิดเนื้อหา"
      data-aria-en="Content opening steps"
      aria-label="ลำดับการเปิดเนื้อหา"
    >
      <div class="stage is-active" data-stage="1">
        <strong>1</strong>
        <span data-th="เลือกบทและเรื่อง" data-en="Choose chapter">เลือกบทและเรื่อง</span>
      </div>
      <div class="stage" data-stage="2">
        <strong>2</strong>
        <span data-th="เลือกงานหรือเครื่องมือ" data-en="Choose activity">เลือกงานหรือเครื่องมือ</span>
      </div>
      <div class="stage" data-stage="3">
        <strong>3</strong>
        <span data-th="เปิดหน้าต่างงาน" data-en="Open tool window">เปิดหน้าต่างงาน</span>
      </div>
      <div class="stage" data-stage="4" hidden>
        <strong>4</strong>
        <span data-th="เปิดใช้งาน" data-en="Open workspace">เปิดใช้งาน</span>
      </div>
    </nav>

    <section id="chapter-view" aria-labelledby="chapter-view-title">
      <div class="section-intro">
        <div>
          <small class="eyebrow" data-th="ชั้นที่ 1" data-en="Layer 1">ชั้นที่ 1</small>
          <h2 id="chapter-view-title" data-th="เลือกบทที่ต้องการ" data-en="Choose a chapter">
            เลือกบทที่ต้องการ
          </h2>
        </div>
        <p
          data-th="การ์ดทั้ง 4 ใบเป็นช่องว่างสำหรับเนื้อหาใหม่ กดเพื่อทดลองชั้นเลือกงาน"
          data-en="These four cards are reserved for new content. Select one to test the activity layer."
        >การ์ดทั้ง 4 ใบเป็นช่องว่างสำหรับเนื้อหาใหม่ กดเพื่อทดลองชั้นเลือกงาน</p>
      </div>
      <div class="chapter-grid" id="chapter-grid"></div>
      ${
        subject.id === "test"
          ? `<aside class="authoring-kit surface">
              <div>
                <small data-th="ชุดสร้าง Quiz" data-en="Quiz authoring kit">ชุดสร้าง Quiz</small>
                <strong data-th="มีแม่แบบ HTML และ Prompt พร้อมส่งให้ AI" data-en="HTML template and an AI-ready prompt">มีแม่แบบ HTML และ Prompt พร้อมส่งให้ AI</strong>
              </div>
              <div class="authoring-kit-actions">
                <a href="../content/templates/quiz-template.html" download data-th="ดาวน์โหลด HTML Template" data-en="Download HTML template">ดาวน์โหลด HTML Template</a>
                <a href="../content/templates/quiz-ai-prompt.txt" download data-th="ดาวน์โหลด Prompt สำหรับ AI" data-en="Download AI prompt">ดาวน์โหลด Prompt สำหรับ AI</a>
                <a href="../content/templates/quiz-drag-template.html" download data-th="แม่แบบ HTML ลากวาง" data-en="Drag-fill HTML template">แม่แบบ HTML ลากวาง</a>
                <a href="../content/templates/quiz-drag-ai-prompt.txt" download data-th="Prompt ควิซลากวาง" data-en="Drag-fill AI prompt">Prompt ควิซลากวาง</a>
              </div>
            </aside>`
          : ""
      }
    </section>

    <section class="activity-view" id="activity-view" aria-labelledby="activity-view-title" hidden>
      <header class="activity-heading surface">
        <button class="back-button" id="back-to-chapters" type="button">
          <span aria-hidden="true">←</span>
          <span data-th="กลับไปเลือกบท" data-en="Back to chapters">กลับไปเลือกบท</span>
        </button>
        <div>
          <small class="eyebrow" data-th="ชั้นที่ 2 · รายการงาน" data-en="Layer 2 · Activities">
            ชั้นที่ 2 · รายการงาน
          </small>
          <h2 id="activity-view-title" tabindex="-1"></h2>
          <p
            data-th="ทดลองเปิดหลายงานพร้อมกัน แล้วใช้ปุ่มสีด้านบนหรือแถบงานด้านล่าง"
            data-en="Open several tools, then use the colored controls or the bottom taskbar."
          >ทดลองเปิดหลายงานพร้อมกัน แล้วใช้ปุ่มสีด้านบนหรือแถบงานด้านล่าง</p>
        </div>
      </header>

      <div class="activity-grid">
        ${
          subject.id === "test"
            ? `<button class="activity-card" type="button" data-tool-kind="quiz">
                <span class="activity-icon" aria-hidden="true">✓</span>
                <span class="activity-copy">
                  <small data-th="Quiz Engine" data-en="Quiz Engine">Quiz Engine</small>
                  <strong data-th="เปิด Quiz Template" data-en="Open Quiz Template">เปิด Quiz Template</strong>
                  <span data-th="ทดลองข้อสอบตัวอย่างผ่านระบบกลางก่อนสร้างชุดจริง" data-en="Try the sample quiz in the shared engine before creating a real set">ทดลองข้อสอบตัวอย่างผ่านระบบกลางก่อนสร้างชุดจริง</span>
                </span>
                <b aria-hidden="true">↗</b>
              </button>`
            : ""
        }
        <button class="activity-card accent-mint" type="button" data-tool-kind="simulation">
          <span class="activity-icon" aria-hidden="true">◉</span>
          <span class="activity-copy">
            <small data-th="ห้องทดลอง" data-en="Simulation">ห้องทดลอง</small>
            <strong data-th="Simulation ตัวอย่างเปล่า" data-en="Blank simulation sample">
              Simulation ตัวอย่างเปล่า
            </strong>
            <span
              data-th="ทดสอบพื้นที่กว้างสำหรับเครื่องมือจำลองในอนาคต"
              data-en="Tests a wide canvas for future simulations."
            >ทดสอบพื้นที่กว้างสำหรับเครื่องมือจำลองในอนาคต</span>
          </span>
          <b aria-hidden="true">↗</b>
        </button>

        <button class="activity-card accent-violet" type="button" data-tool-kind="notebook">
          <span class="activity-icon" aria-hidden="true">▱</span>
          <span class="activity-copy">
            <small data-th="สมุดบันทึก" data-en="Notebook">สมุดบันทึก</small>
            <strong data-th="สมุดเขียนกลาง · รอบ 5A" data-en="Notebook Core · Round 5A">
              สมุดเขียนกลาง · รอบ 5A
            </strong>
            <span
              data-th="เขียน ลบ เลื่อน และซูมได้แล้ว ส่วนหลายหน้าและ Save/Load จะตามมา"
              data-en="Write, erase, pan, and zoom now; pages and Save/Load arrive next."
            >เขียน ลบ เลื่อน และซูมได้แล้ว ส่วนหลายหน้าและ Save/Load จะตามมา</span>
          </span>
          <b aria-hidden="true">↗</b>
        </button>
      </div>

      <p class="prototype-note">
        <span aria-hidden="true">◇</span>
        <span
          data-th="แม่พิมพ์ Quiz และระบบปริ้นเป็นเครื่องมือหลังบ้าน จึงไม่แสดงในรายการนักเรียนจนกว่าจะมีเนื้อหาจริง"
          data-en="Quiz templates and printing are authoring tools, so they stay hidden from students until real content is ready."
        >แม่พิมพ์ Quiz และระบบปริ้นเป็นเครื่องมือหลังบ้าน จึงไม่แสดงในรายการนักเรียนจนกว่าจะมีเนื้อหาจริง</span>
      </p>
    </section>
  `;

  const subjectIcon = subjectRoot.querySelector("#subject-icon");
  const subjectTitle = subjectRoot.querySelector("#subject-title");
  const chapterGrid = subjectRoot.querySelector("#chapter-grid");
  const chapterView = subjectRoot.querySelector("#chapter-view");
  const activityView = subjectRoot.querySelector("#activity-view");
  const activityTitle = subjectRoot.querySelector("#activity-view-title");
  const backButton = subjectRoot.querySelector("#back-to-chapters");
  const stageItems = [...subjectRoot.querySelectorAll("[data-stage]")];
  const chapterDefinitions = [...chapterTemplate.content.querySelectorAll("[data-chapter]")];
  let selectedChapter = chapterDefinitions[0]?.dataset.chapter || "1";
  const hasContentMenus = chapterDefinitions.some((entry) => entry.dataset.chapterSrc);
  let contentNavigation = null;
  let contentNavigationPromise = null;
  let bankNavigation = null;
  let navigationVersion = 0;
  let orbitControl = null;
  const pageId = crypto.randomUUID();
  let routeCommand = null;
  function requestSelection(selection) {
    if (!routeCommand || parent === window) return false;
    parent.postMessage({ type: 'learning-hub-navigation-request', pageId, commandId: routeCommand,
      selection: { subjectId: subject.id, ...selection } }, location.origin);
    return true;
  }
  subjectRoot.classList.toggle("has-content-menus", hasContentMenus);
  const bankNavigationPromise = ['physics', 'chemistry'].includes(subject.id)
    ? import(bankNavigationUrl).then(({ createSubjectBankNavigation }) => {
      bankNavigation = createSubjectBankNavigation({ root: subjectRoot, subject, setStage,
        requestNavigation: requestSelection, backToChapters: () => showChapters() });
      return bankNavigation;
    }) : Promise.resolve(null);

  function setNavigationMode(fourLayers) {
    subjectRoot.classList.toggle("is-four-layer", fourLayers);
    const labels = fourLayers
      ? [["เลือกบท", "Choose chapter"], ["เลือกเรื่องย่อย", "Choose topic"], ["เลือกงาน", "Choose activity"], ["เปิดใช้งาน", "Open workspace"]]
      : [["เลือกบทและเรื่อง", "Choose chapter"], ["เลือกงานหรือเครื่องมือ", "Choose activity"], ["เปิดหน้าต่างงาน", "Open tool window"]];
    stageItems.forEach((stage, index) => {
      stage.hidden = index >= labels.length;
      if (labels[index]) setLocalizedText(stage.querySelector("span"), ...labels[index]);
    });
  }
  setNavigationMode(hasContentMenus);

  subjectIcon.textContent = subject.icon;
  setLocalizedText(subjectTitle, subject.titleTh, subject.titleEn);
  chapterGrid.dataset.ariaTh = `โครงบท${subject.titleTh}`;
  chapterGrid.dataset.ariaEn = `${subject.titleEn} chapter placeholders`;
  chapterGrid.setAttribute("aria-label", chapterGrid.dataset.ariaTh);

  chapterDefinitions.forEach((definition, index) => {
    const chapterId = definition.dataset.chapter || String(index + 1);
    const title = readLocalizedText(
      definition.querySelector("[data-chapter-title]"),
      "รอตั้งชื่อบท",
      "Chapter title pending",
    );
    const description = readLocalizedText(
      definition.querySelector("[data-chapter-description]"),
      "พื้นที่สำหรับเรื่องและหัวข้อย่อย",
      "Space for topics and subtopics",
    );
    const button = document.createElement("button");
    const chapterNumber = String(chapterId).padStart(2, "0");

    button.className = "chapter-card";
    button.type = "button";
    button.dataset.chapter = chapterId;
    button.innerHTML = `
      <span class="chapter-number"></span>
      <small class="chapter-label"></small>
      <h3 class="chapter-title"></h3>
      <p class="chapter-description"></p>
      <span class="chapter-action">
        <span data-th="กำลังเตรียมเนื้อหา" data-en="Content in preparation">กำลังเตรียมเนื้อหา</span>
        <b aria-hidden="true">→</b>
      </span>
    `;

    button.querySelector(".chapter-number").textContent = chapterNumber;
    setLocalizedText(
      button.querySelector(".chapter-label"),
      `บทที่ ${chapterId}`,
      `Chapter ${chapterId}`,
    );
    setLocalizedText(button.querySelector(".chapter-title"), title.th, title.en);
    setLocalizedText(
      button.querySelector(".chapter-description"),
      description.th,
      description.en,
    );
    if (definition.dataset.chapterSrc) {
      setLocalizedText(button.querySelector(".chapter-action span"), "เลือกเรื่องย่อย", "Choose a topic");
    }
    chapterGrid.append(button);
  });

  function setStage(activeStage) {
    stageItems.forEach((stage) => {
      const stageNumber = Number(stage.dataset.stage);
      stage.classList.toggle("is-active", stageNumber === activeStage);
      stage.classList.toggle("is-complete", stageNumber < activeStage);
    });
  }

  function updateActivityTitle() {
    if (window.LearningHubSubjectOrbit) {
      const chapter = chapterDefinitions.find((item) => item.dataset.chapter === selectedChapter);
      const title = readLocalizedText(chapter?.querySelector("[data-chapter-title]"), `บทที่ ${selectedChapter}`, `Chapter ${selectedChapter}`);
      setLocalizedText(activityTitle, title.th, title.en);
      return;
    }
    setLocalizedText(
      activityTitle,
      `${subject.titleTh} · งานตัวอย่าง · บทที่ ${selectedChapter}`,
      `${subject.titleEn} · Sample tools · Chapter ${selectedChapter}`,
    );
  }

  async function showActivities(chapter, route = null) {
    if (!route && requestSelection({ chapterId: String(chapter) })) return true;
    selectedChapter = String(chapter);
    const definition = chapterDefinitions.find((entry) => entry.dataset.chapter === selectedChapter);
    if (!definition) return false;
    orbitControl?.selectChapter(selectedChapter);
    const version = ++navigationVersion;
    contentNavigation?.hide();
    bankNavigation?.hide();
    if (definition.hasAttribute('data-chapter-src') || definition.dataset.status === 'draft') {
      setNavigationMode(true);
      chapterView.hidden = true;
      activityView.hidden = true;
      if (!contentNavigationPromise) {
        contentNavigationPromise = import(contentNavigationUrl).then(({ createSubjectContentNavigation }) => {
          contentNavigation = createSubjectContentNavigation({ root: subjectRoot, subject, setStage,
            backToChapters: () => showChapters(), requestNavigation: requestSelection });
          return contentNavigation;
        }).catch((error) => { contentNavigationPromise = null; throw error; });
      }
      try {
        const navigation = await contentNavigationPromise;
        if (version !== navigationVersion) return false;
        return await navigation.open(definition, route?.topicId, route?.status === 'preparing');
      } catch {
        if (version !== navigationVersion) return false;
        showChapters(true);
        if (!route) window.alert(document.documentElement.lang === 'en'
          ? 'Cannot load the topic menu. Please refresh and try again.'
          : 'โหลดเมนูเรื่องย่อยไม่สำเร็จ กรุณารีเฟรชแล้วลองอีกครั้ง');
        return false;
      }
    }
    setNavigationMode(false);
    updateActivityTitle();
    chapterView.hidden = true;
    activityView.hidden = false;
    activityView.querySelector('.activity-grid').hidden = route?.status === 'preparing';
    setStage(2);
    activityTitle.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    return true;
  }

  function showChapters(fromRoute = false) {
    if (!fromRoute && requestSelection({})) return true;
    ++navigationVersion;
    contentNavigation?.hide();
    bankNavigation?.hide();
    setNavigationMode(hasContentMenus);
    activityView.hidden = true;
    chapterView.hidden = false;
    setStage(1);
    subjectRoot.querySelector(`[data-chapter="${selectedChapter}"]`)?.focus();
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    return true;
  }

  async function showBank(route) {
    const version = ++navigationVersion;
    contentNavigation?.hide(); chapterView.hidden = true; activityView.hidden = true;
    setNavigationMode(true);
    const labels = [['เลือกวิชา', 'Choose subject'], ['เลือกชุดข้อสอบ', 'Choose set'], ['เลือกเครื่องมือ', 'Choose tool'], ['เปิดใช้งาน', 'Open workspace']];
    stageItems.forEach((stage, i) => setLocalizedText(stage.querySelector('span'), ...labels[i]));
    const navigation = await bankNavigationPromise;
    if (version !== navigationVersion || !navigation) return false;
    return navigation.open(route.bankKey);
  }

  if (window.LearningHubSubjectOrbit) {
    orbitControl = window.LearningHubSubjectOrbit.mount({ root: subjectRoot, grid: chapterGrid, subject, onOpen: showActivities });
  } else {
    chapterGrid.querySelectorAll("[data-chapter]").forEach((button) => {
      button.addEventListener("click", () => showActivities(button.dataset.chapter));
    });
  }

  subjectRoot.querySelectorAll("[data-tool-kind]").forEach((button) => {
    button.addEventListener("click", () => {
      const toolId = `${subject.id}-c${selectedChapter}-${button.dataset.toolKind}`;
      const targetOrigin = location.origin === "null" ? "*" : location.origin;
      parent.postMessage({ type: "learning-hub-open-tool", toolId }, targetOrigin);
      setStage(3);
    });
  });

  backButton.addEventListener("click", () => showChapters());
  updateActivityTitle();

  window.addEventListener('message', async event => {
    const data = event.data;
    if (parent === window || event.source !== parent || event.origin !== location.origin ||
        data?.type !== 'learning-hub-navigate' || data.pageId !== pageId ||
        typeof data.commandId !== 'string' || data.commandId.length > 160 ||
        data.commandId === routeCommand || data.route?.subjectId !== subject.id) return;
    routeCommand = data.commandId;
    subjectRoot.inert = true;
    let ok = false;
    try { ok = data.route.bank ? await showBank(data.route)
      : data.route.chapterId ? await showActivities(data.route.chapterId, data.route) : showChapters(true); }
    finally {
      if (routeCommand === data.commandId) {
        subjectRoot.inert = false;
        subjectRoot.dataset.navigationReady = ok ? 'ready' : 'error';
        const focusTarget = data.route.chapterId
          ? subjectRoot.querySelector('.content-menu-view:not([hidden]) [data-menu-title], #activity-view:not([hidden]) h2')
          : chapterGrid.querySelector('.is-selected') || chapterGrid.querySelector('button');
        focusTarget?.focus({ preventScroll: true });
        parent.postMessage({ type: 'learning-hub-navigation-result', pageId, commandId: data.commandId, ok }, location.origin);
      }
    }
  });
  if (parent !== window && location.origin !== 'null') parent.postMessage({ type: 'learning-hub-navigation-ready', pageId, subjectId: subject.id }, location.origin);
}

buildSubjectPage();
