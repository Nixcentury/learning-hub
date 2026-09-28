import { createContentContext } from "./content-context.js";

// Existing legacy window/storage IDs, shared by the workspace and route catalog.
// Do not replace these with the activity ID inside the sample HTML.
const toolTypes = {
  quiz: {
    icon: "✓",
    page: "pages/tools/quiz-player.html?content=../../content/templates/quiz-template.html",
    titleTh: "Quiz Template",
    titleEn: "Quiz Template",
    accent: "blue",
  },
  activity: {
    icon: "✎",
    page: "pages/tools/activity-preview.html",
    titleTh: "กิจกรรม",
    titleEn: "Activity",
    accent: "blue",
  },
  simulation: {
    icon: "◉",
    page: "pages/tools/simulation-preview.html",
    titleTh: "ห้องทดลองตัวอย่าง",
    titleEn: "Simulation workspace",
    accent: "mint",
  },
  notebook: {
    icon: "▱",
    page: "pages/tools/notebook-preview.html",
    titleTh: "สมุดเขียนกลาง",
    titleEn: "Notebook Core",
    accent: "violet",
  },
};

const subjects = {
  physics: { titleTh: "ฟิสิกส์", titleEn: "Physics", chapterCount: 20 },
  chemistry: { titleTh: "เคมี", titleEn: "Chemistry", chapterCount: 14 },
  biology: { titleTh: "ชีววิทยา", titleEn: "Biology", chapterCount: 25 },
  "lower-science": {
    titleTh: "วิทยาศาสตร์ ม.ต้น",
    titleEn: "Lower Secondary Science",
  },
  "science-ep": { titleTh: "วิทยาศาสตร์ EP", titleEn: "Science EP" },
  "math-ep": { titleTh: "คณิตศาสตร์ EP", titleEn: "Mathematics EP" },
  "upper-math": {
    titleTh: "คณิตศาสตร์ ม.ปลาย",
    titleEn: "Upper Secondary Mathematics",
  },
  test: { titleTh: "ทดสอบ", titleEn: "Test" },
};

function buildToolCatalog() {
  const catalog = {};

  Object.entries(subjects).forEach(([subjectId, subject]) => {
    for (let chapter = 1; chapter <= (subject.chapterCount || 4); chapter += 1) {
      Object.entries(toolTypes).forEach(([typeId, type]) => {
        const id = `${subjectId}-c${chapter}-${typeId}`;
        catalog[id] = {
          ...type,
          id,
          context: createContentContext({
            subjectId,
            chapterId: chapter,
            toolKind: typeId,
            contentId: id,
          }),
          titleTh: `${type.titleTh} · ${subject.titleTh} · บทที่ ${chapter}`,
          titleEn: `${type.titleEn} · ${subject.titleEn} · Chapter ${chapter}`,
        };
      });
    }
  });

  return catalog;
}

export const toolCatalog = buildToolCatalog();
// A separate content ID keeps numeric QA work apart from the original MCQ demo.
Object.assign(toolCatalog["test-c2-quiz"], {
  page: "pages/tools/quiz-player.html?content=../../content/samples/numeric-input-demo.html",
  titleTh: "เติมคำตอบและแป้นคณิต", titleEn: "Numeric answers and math keyboard",
});
Object.assign(toolCatalog["test-c3-quiz"], {
  page: "pages/tools/quiz-player.html?content=../../content/samples/drag-drop-demo.html",
  titleTh: "ลากเติมและจับคู่", titleEn: "Drag-fill and matching",
});
