# ส่งต่องาน Learning Hub จากแชทเดิม

บันทึก 7 ตุลาคม 2026 (เวลาไทย) สำหรับเปิดแชทบนเครื่องใหม่แล้วทำงานต่อ
เอกสารนี้สรุปบริบทสำคัญ ไม่ใช่สำเนาประวัติแชททั้งหมด

## สถานะก่อนสร้างบันทึกนี้

- Repository: https://github.com/Nixcentury/learning-hub — branch `main`
- เครื่องเดิม: `C:/Users/USER/Documents/GitHub/learning-hub`
- HEAD และ `refs/heads/main` บน GitHub ตรงกันที่ `f637d39ca4f2cb1a38fdb0a6506782386ea10876` ชื่อ Commit `10-7` ตรวจแบบอ่านจริงแล้ว
- ก่อนเพิ่มบันทึกนี้ ไม่มีไฟล์ค้างแก้หรือไฟล์ใหม่ที่ยังไม่ Commit
- Commit นี้รวมซิมเสียงและระบบเมนู Draft ด้านล่างแล้ว ไม่ต้องสร้างสองงานนี้ใหม่
- ตัวบันทึก CHAT-HANDOFF.md เพิ่งเพิ่มหลัง Commit ข้างต้น ต้อง Commit/Push หรือคัดลอกแยกไปเครื่องใหม่
- ยังไม่ได้ตรวจผลรัน GitHub Actions/หน้าเว็บจริงหลัง Commit นี้ จึงไม่ถือว่ายืนยัน Deployment สำเร็จ

## สิ่งที่ผู้ใช้ต้องการให้รักษา

- คง CSS สี ฟอนต์ การ์ด และหน้าต่างเครื่องมือเดิมของ Learning Hub
- โครงหน้า: วิชา/บท → เรื่องย่อย → เครื่องมือ → หน้าทำงาน
- ทำเนื้อหาเป็น Draft ได้ ไม่บังคับสร้างทุกไฟล์พร้อมกัน
- รหัส contentId / activityId / questionId เดิมใช้ผูกคำตอบ ห้ามเปลี่ยนโดยไม่วางแผนย้ายข้อมูล
- ใบเรียนรู้/Quiz ต้องคำนึงถึงพิมพ์ชุดเปล่าและพิมพ์เฉลย
- สื่อสารภาษาไทย กระชับ ระวังใช้ลิมิตกับงานตรวจซ้ำที่ไม่จำเป็น
- เรื่องมาสคอต AI เคยออกแบบในแชทเก่า แต่ยังไม่มีไฟล์ยืนยันในบริบทนี้ อย่าอ้างว่ากู้กลับมาแล้ว

## งานล่าสุด 1: ซิมธรรมชาติของเสียง

ไฟล์จริง: `public/content/physics/sound/12-1/12-1-1-sound-particle-sim.html`
ID เดิม: `phys-sound-12-1-1-particle-sim`
เชื่อมจากบท 12 → 12.1 ธรรมชาติของเสียงแล้ว

- ผู้ใช้เลือกคง 4 ภารกิจ แต่แก้ความถูกต้องและเพิ่มการสังเกต ปัจจุบันมี 10 คำถาม
- ใช้แบบจำลองเดียวกันกับภาพอนุภาคและกราฟ: s=A cos(kx−ωt), Δp=−B∂s/∂x, λ=c/f
- แก้การหยุดภาพที่ส่วนอัด ส่วนขยาย และจุดกลับตัว รวมถึงแสดง feedback ที่เดิมถูกซ่อน
- แสดงหน่วยจริง การซูมตามความยาวคลื่น การขยายการสั่น และการชะลอเวลาอย่างชัดเจน
- เพิ่มใต้เสียง/ย่านการได้ยิน/เหนือเสียง ข้อจำกัดของคนและสัตว์ และการไม่มีตัวกลางในสุญญากาศ
- เป็นภาพจำลอง ไม่มีเสียงจริง และบันทึกภารกิจเฉพาะเครื่อง ไม่ได้อ้างว่าซิงก์ Cloud
- ทดสอบสมการ ภารกิจ และการบันทึก 10 รายการผ่านด้วย `node --test scripts/sound-simulation.test.mjs`
- ยังไม่ได้ตรวจหน้าตา/การกดจริงในเบราว์เซอร์รอบล่าสุด เพราะเครื่องมือเบราว์เซอร์ไม่พร้อม ควรตรวจส่วนนี้ก่อนปรับหรือประกาศพร้อมใช้กับนักเรียน
- HTML นี้ใช้งานได้ในตัวเอง ไฟล์แยกที่ใช้ประกอบอยู่ใน `work/sound-sim/` (Git ignore) เป็นเพียงไฟล์ทำงาน ไม่จำเป็นต่อการรันหรือ Build บนเครื่องใหม่

## งานล่าสุด 2: ลดการบล็อกงาน Draft

อ่านคู่มือ `CONTENT-DRAFTS.md`

- เมนูไม่มี href หรือปลายทางยังไม่มีไฟล์: Warning; การ์ดกำลังเตรียมเนื้อหาและกดไม่ได้
- `data-status="draft"` บนรายการ <a> หรือหัวบท <article data-chapter> พักไว้ได้แม้มีไฟล์แล้ว
- เมื่อพร้อมสร้างไฟล์ ใส่ href และเอา data-status="draft" ออก โดยเก็บ ID เดิม
- ลิงก์ไม่ปลอดภัย รหัสผิด/ซ้ำ โครงสร้าง HTML ผิด และสคริปต์ในเมนู/Quiz/HTML แบบอ่าน ยังเป็น Error
- Validator แสดงไฟล์:บรรทัด พร้อม GitHub annotations, Job summary และรายงาน JSON
- ระบบ route catalog และเมนูหน้าเว็บใช้สถานะเตรียมเนื้อหาตรงกัน; ลิงก์แชร์ Draft กลับไปหน้าเมนูได้
- คืน 4 กิจกรรมที่ยังไม่พร้อมในเมนูบทเสียงเป็นการ์ด Draft แล้ว
- ผลตรวจล่าสุด: `pnpm test:unit` ผ่าน 234 รายการ; `pnpm build` ผ่าน มี 16 Draft warnings และ 0 errors
- จำลองรายงาน GitHub Actions ในเครื่องผ่าน แต่ไม่ได้รัน Actions จริงจากแชทนี้

ไฟล์หลัก: `scripts/validate-activity-content.mjs`, `scripts/content-diagnostics.mjs`,
`scripts/route-catalog.mjs`, `scripts/route-html-metadata.mjs`,
`public/pages/shared/menu-availability.js`, `subject-content-nav.js`, `subject-page.js`,
`.github/workflows/pages.yml`; ชุดทดสอบใหม่ `scripts/content-drafts.test.mjs`

## ระบบคลังข้อสอบที่ทำไว้ก่อนหน้า

อ่าน `QUESTION-BANK-START-HERE.md` และโค้ดจริงก่อนเปลี่ยนการเชื่อมต่อ
ข้อความในคู่มือนั้นที่ว่า Build ติดไฟล์เสียงยังไม่ครบ/งานล่าสุดยังไม่ได้ Push เป็นบันทึกเก่า
ส่วนปัญหา Build ดังกล่าวแก้แล้ว และตรวจ GitHub HEAD ตามสถานะด้านบน

- ใช้ Sheet เดิมของผู้ใช้เป็นแหล่งจัด ID/ข้อสอบ ผ่านบริการ Apps Script ใหม่ แยกจากเว็บเก่า
- วิชา → คลังข้อสอบ → ID ชุด → เครื่องมือ → Quiz ใช้กระบวนการเพิ่มเนื้อหาใน Sheet เดิมได้
- เก็บ revision ของชุดใน Drive เพื่อเปิดงานที่นักเรียนเคยทำด้วยโจทย์รุ่นเดิม ไม่เลื่อนข้อไปมาเมื่อครูแก้ Sheet
- บริการจริงเปิดเฉพาะฟิสิกส์ เคมียังไม่ได้เปิดใช้งาน
- ตามบันทึกก่อนหน้า ทดสอบ Guest/localhost อ่านจริงได้ 10 ชุด; ชุด SI มี 14 ข้อ ณ ตอนทดสอบ จำนวนปัจจุบันอาจเปลี่ยน
- ต้องตรวจ GitHub Pages, Firebase Rules/การซิงก์บัญชีจริง และ iPad Safari เพิ่มก่อนประกาศพร้อมใช้นักเรียน
- Apps Script/Sheet/Drive อยู่ในบัญชี Google ไม่ต้องสร้างบริการใหม่เพราะเปลี่ยนคอม; ล็อกอินบัญชีเจ้าของเดิมเมื่อจะจัดการ

## คู่มือในโปรเจกต์

- `START-HERE.txt` และ `public/content/chemistry/START-HERE.txt`: โครงหน้า 4 ชั้น
- `CHAPTER-OVERVIEW-START-HERE.txt`: ผลการเรียนรู้และสรุปบท
- `LEARNING-SHEET-START-HERE.txt`, `PRINTING-START-HERE.txt`: ใบเรียนรู้และการพิมพ์
- `CONTENT-DRAFTS.md`: กติกา Draft ใหม่
- `QUESTION-BANK-START-HERE.md`: คลังข้อสอบและ Apps Script

## ขั้นตอนบนเครื่องใหม่

ส่วนนี้เป็นคู่มือตั้งค่า ยังไม่ได้ติดตั้งหรือทดสอบบนเครื่องใหม่ ตัวอย่างคำสั่งใช้ Windows PowerShell
ตรวจเวอร์ชันจาก `package.json`, `.node-version` และ `.github/workflows/pages.yml` เมื่อ 7 ตุลาคม 2026

### 1. โปรแกรมที่ต้องเตรียม

| โปรแกรม | ใช้ทำอะไร / สิ่งที่ต้องตั้งค่า |
| --- | --- |
| Codex desktop | ลงชื่อเข้าใช้บัญชีเดิม แล้วเปิดโฟลเดอร์ `learning-hub` ที่ Clone บนเครื่องใหม่เป็นโปรเจกต์ ให้แชทอ่านเอกสารนี้ก่อนทำงาน |
| [GitHub Desktop](https://desktop.github.com/download/) | ลงชื่อเข้าใช้บัญชีที่เข้าถึง `Nixcentury/learning-hub` ได้ ใช้ Clone, Fetch, Commit และ Push ตามเดิม |
| [Git for Windows](https://git-scm.com/install/windows) | ให้คำสั่ง `git` ใช้ได้จาก Terminal/Codex ถ้า `git --version` ใช้ได้อยู่แล้ว ไม่ต้องลงซ้ำ; อย่าอาศัยว่า Git ภายใน GitHub Desktop จะอยู่ใน PATH เสมอ |
| [Node.js 24.x](https://nodejs.org/en/download) พร้อม npm | เลือกสาย 24 ให้ตรงกับ `.node-version` และ Actions; `package.json` กำหนดขั้นต่ำ 24 เลือกตัวติดตั้งให้ตรงระบบและสถาปัตยกรรมเครื่อง |
| pnpm **11.19.0** | ใช้เวอร์ชันที่โปรเจกต์ล็อกไว้ ติดตั้งตามคำสั่งด้านล่าง ไม่อัปเกรดเวอร์ชันหรือแก้ lockfile เพียงเพราะย้ายเครื่อง |
| Chrome หรือ Edge | เปิดเว็บ ทดสอบหน้าจอ และดูตัวอย่างก่อนพิมพ์/Save as PDF; Edge ที่มีอยู่แล้วใช้ตรวจด้วยมือได้ |
| [GitHub CLI (`gh`)](https://cli.github.com/) — เมื่อจะใช้ GitHub จากแชท | ช่วยยืนยันบัญชีให้ Git ผ่าน HTTPS และดู Actions; GitHub Desktop ใช้งานของตัวเองได้โดยไม่ต้องมี `gh` |

หลังติดตั้งโปรแกรม ให้ปิดแล้วเปิด Terminal/Codex ใหม่เพื่อรับ PATH ใหม่ ใช้โฟลเดอร์ใดก็ได้บนเครื่องใหม่ ไม่ต้องสร้างชื่อผู้ใช้หรือพาธให้เหมือนเครื่องเก่า
ตัวแก้ไขไฟล์อย่าง VS Code เป็นทางเลือก ไม่ใช่เงื่อนไขสำหรับเปิดเว็บนี้

### 2. Clone และเปิดเว็บในเครื่อง

1. เครื่องเก่า: Commit/Push บันทึกนี้ให้เรียบร้อย หรือคัดลอกไฟล์นี้แยกไปด้วย
2. เครื่องใหม่: GitHub Desktop → Clone repository → `Nixcentury/learning-hub` → ใช้ branch `main` ล่าสุด
3. เปิดโฟลเดอร์ที่ Clone จริงใน Codex และเปิด Terminal ในโฟลเดอร์นั้น
4. ตรวจและติดตั้งตามลำดับด้านล่าง คำสั่ง `npm.cmd`/`pnpm.cmd` ใช้บน Windows เพื่อเลี่ยงปัญหา PowerShell บล็อกไฟล์ `.ps1`; ไม่ต้องลด Execution Policy ทั้งเครื่อง

```powershell
node --version
npm.cmd --version
git --version
npm.cmd install --global pnpm@11.19.0
pnpm.cmd --version
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev --host 127.0.0.1 --strictPort
```

ควรเห็น Node `v24.x` และ pnpm `11.19.0` ถ้ามี pnpm เวอร์ชันนี้แล้ว ข้ามคำสั่งติดตั้ง global ได้
วิธีติดตั้งผ่าน npm อ้างอิง [คู่มือ pnpm](https://pnpm.io/installation); เวอร์ชันข้างต้นเลือกตามโปรเจกต์ ไม่ใช่ตามค่า latest ของเว็บไซต์
React, Vite, TypeScript, Tailwind และไลบรารีที่ประกาศไว้จะติดตั้งพร้อม `pnpm install` ไม่ต้องลง global ทีละตัว
บน macOS ใช้ `npm`/`pnpm` แทนชื่อที่ลงท้าย `.cmd` และติดตั้ง Git/Node สำหรับ macOS

เปิด [เว็บในเครื่อง](http://127.0.0.1:3000/) หรือ [ฟิสิกส์บทเสียง](http://127.0.0.1:3000/#physics/12)
ปล่อย Terminal นี้ทำงานไว้; กด Ctrl+C เมื่อต้องการหยุดเว็บ หากพอร์ต 3000 ถูกใช้ คำสั่งนี้จะหยุดและแจ้งเตือน ให้ตรวจโปรแกรมที่ใช้พอร์ตก่อน ไม่ปิดโปรแกรมอื่นโดยเดา
ใช้ชื่อโฮสต์และพอร์ตเดิมตลอดการทดสอบ: `localhost` กับ `127.0.0.1` หรือคนละพอร์ตมีพื้นที่บันทึกในเบราว์เซอร์แยกกัน
อย่าเปิด `index.html` ด้วยการดับเบิลคลิกเป็น `file://` เพราะการโหลดเนื้อหาและ Google Login ต้องทำผ่านเว็บเซิร์ฟเวอร์

### 3. ให้ Fetch / Commit / Push จากเครื่องใหม่ได้

- ใน GitHub Desktop ตรวจบัญชีและชื่อ/อีเมลผู้ทำ Commit ให้เป็นของผู้ใช้ ใช้อีเมล GitHub แบบปกปิดได้ ไม่คัดลอกชื่อบัญชีจากตัวอย่างในคู่มือเก่า
- ใน Terminal ใช้ `git status` และ `git remote -v` ตรวจว่าอยู่ใน repo ที่ถูกต้อง; origin ควรเป็น `Nixcentury/learning-hub` บน GitHub
- ถ้าต้องการให้แชทใช้คำสั่ง Git ผ่าน HTTPS ให้ติดตั้ง `gh` แล้วตั้งค่าบนเครื่องใหม่ตามนี้ โดยผู้ใช้ยืนยันบัญชีในเบราว์เซอร์ด้วยตนเอง:

```powershell
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git --hostname github.com
gh auth status
git ls-remote origin refs/heads/main
```

อ้างอิง [การลงชื่อเข้าใช้ GitHub CLI](https://cli.github.com/manual/gh_auth_login) และ [การเชื่อม credentials กับ Git](https://cli.github.com/manual/gh_auth_setup-git)
การ Login ของ GitHub Desktop, CLI และตัวเชื่อม GitHub ใน Codex เป็นคนละส่วน ตรวจเฉพาะทางที่จะใช้งาน
ขั้นตอนข้างต้นยังไม่ได้ Push งาน; การอ่าน remote สำเร็จยืนยันว่าอ่านได้ แต่ไม่ได้รับรองสิทธิ์เขียน โดยเฉพาะ repo สาธารณะ
ใช้รหัสยืนยันใหม่ที่ระบบสร้างครั้งนั้น ไม่ใช้รหัส device login เก่าจากแชท และไม่ส่งออก token เพื่อย้ายเครื่อง

Push เข้า `main` จะเรียก workflow เดิม: [Learning Hub Pages / Actions](https://github.com/Nixcentury/learning-hub/actions/workflows/pages.yml)
ไม่ต้องตั้ง GitHub Pages ใหม่หรือเปิดเซิร์ฟเวอร์เครื่องตัวเองทิ้งไว้ให้เว็บจริงทำงาน

### 4. บัญชีและบริการเดิมที่ต้องเข้าถึง

| บริการ | สิ่งที่ต้องมีบนเครื่องใหม่ |
| --- | --- |
| GitHub | บัญชีที่มีสิทธิ์ repo เดิม สำหรับ Fetch/Push และดู Actions |
| Google Sheet / Apps Script / Drive | Login บัญชีเจ้าของเดิมเมื่อต้องเพิ่มข้อสอบหรือแก้บริการ อ่านรายละเอียดใน `QUESTION-BANK-START-HERE.md` |
| Firebase | ใช้โปรเจกต์เดิม `examateapp-1007d`; ถ้าต้องดูสิทธิ์หรือฐานข้อมูล ให้เข้าบัญชีที่มีสิทธิ์ใน Firebase Console ส่วนเข้าเว็บทดสอบใช้บัญชีครู/นักเรียนเดิมตามบทบาท |
| Cloudflare AI Worker | เว็บยังเรียกบริการเดิมจาก `public/shared/quiz-evidence.js`; ต้องเข้าบัญชีเจ้าของ Worker เฉพาะเมื่อแก้หลังบ้าน AI |

จากโค้ดปัจจุบัน การเปิดเว็บและ Build ไม่ต้องสร้าง `.env` ใหม่: ค่าเชื่อมหน้าเว็บอยู่ใน `js/firebase-config.js` และ `public/shared/question-bank-config.js` แล้ว
บริการบัญชี คลังข้อสอบ และ AI ต้องมีอินเทอร์เน็ต การ Build ผ่านไม่ได้ยืนยันว่าบริการจริงและสิทธิ์ทุกอย่างใช้ได้
การย้ายคอมไม่ต้องสร้าง Sheet/Apps Script/Firebase/Worker ใหม่ ไม่ต้องรัน `setupBankArchive` ซ้ำ และไม่ต้องเผยแพร่ Rules หรือ Deployment ใหม่
ถ้าจะพัฒนาหลังบ้านเพิ่มเติม ค่อยตรวจสิทธิ์ บริการ และเครื่องมือเฉพาะงานนั้น; `clasp`, Wrangler, Firebase CLI, Python, Docker และฐานข้อมูลในเครื่องไม่ใช่ข้อบังคับของการแก้เนื้อหา/รันเว็บ/Build ปัจจุบัน
ถ้า Google Login แจ้ง `auth/unauthorized-domain` ให้ตรวจโดเมนทดสอบใน Firebase Authentication ของโปรเจกต์เดิมก่อน ไม่แก้ข้อมูลคำตอบหรือสร้างโปรเจกต์ใหม่เพื่อแก้ข้อความนี้

### 5. เครื่องมือทดสอบเสริม — ติดตั้งเมื่อต้องใช้

**ทดสอบทั่วไป:** มี Node/pnpm และติดตั้ง dependencies แล้วก็รันได้ เลือกตามงานที่แก้ ไม่ต้องรันทุกคำสั่งเพียงเพราะเปิดแชทใหม่

```powershell
pnpm.cmd validate:content
pnpm.cmd test:unit
pnpm.cmd build
node --test scripts/sound-simulation.test.mjs
```

`pnpm build` รวมการตรวจเนื้อหา ตรวจ TypeScript สร้างเว็บและตรวจไฟล์เผยแพร่; การทดสอบซิมเสียงเป็นคำสั่งแยก ยังไม่ได้อยู่ใน `test:unit`
ถ้าต้องดูผล Build ใช้ `pnpm.cmd preview` แล้วเปิด URL ที่แสดงใน Terminal

**ทดสอบเบราว์เซอร์อัตโนมัติ:** ใช้ Playwright + Chromium เฉพาะคำสั่ง `test:*:browser` และ `test:pages`
Playwright ยังไม่ได้อยู่ใน dependencies ของ repo และบางสคริปต์มี fallback เป็นพาธ `C:/Users/Sattawat.b/...` ของเครื่องเก่า
ต้องกำหนด `PLAYWRIGHT_MODULE` เป็นพาธจริงของเครื่องใหม่ มิฉะนั้นอาจหาโมดูลไม่พบ แม้เว็บเปิดได้ตามปกติ
ถ้า Codex มี runtime ให้ใช้เครื่องมือค้นหา Workspace Dependencies แล้วกำหนดพาธ Playwright จากผลจริง ไม่คัดลอกพาธ cache เครื่องเก่าตามตัวอักษร

ทางเลือกติดตั้งแยกใน `work/` ซึ่ง Git ignore ไว้แล้ว โดยไม่แก้ package.json/lockfile ของเว็บ (เวอร์ชัน 1.62.1 ตรงกับแพ็กเกจใน runtime เครื่องเดิมที่ตรวจพบ ไม่ใช่การรับรองว่าทดสอบบนเครื่องใหม่แล้ว):

```powershell
New-Item -ItemType Directory -Force -Path .\work\qa-tools | Out-Null
npm.cmd install --prefix .\work\qa-tools --no-save --package-lock=false playwright@1.62.1
$env:PLAYWRIGHT_MODULE = (Resolve-Path .\work\qa-tools\node_modules\playwright).Path
node "$env:PLAYWRIGHT_MODULE/cli.js" install chromium
pnpm.cmd test:bank:browser
```

รันจากโฟลเดอร์ repo และตั้ง `PLAYWRIGHT_MODULE` ใหม่เมื่อเปิด Terminal ใหม่ ติดตั้ง Chromium ให้ตรงกับ Playwright ที่ใช้ ตาม [คู่มือ Playwright](https://playwright.dev/docs/browsers)
การติดตั้ง Playwright สำหรับชุดทดสอบนี้ไม่ได้เปิดความสามารถควบคุมแท็บของ Codex โดยอัตโนมัติ; แชทใหม่ต้องตรวจว่ามีเครื่องมือเบราว์เซอร์ให้ใช้จริงหรือไม่

**ทดสอบ Rules ของ Classroom:** ต้องมี Java และ Firebase Realtime Database Emulator เพิ่ม จึงค่อยติดตั้งเมื่อทำงานสิทธิ์ Classroom
บันทึก QA เดิมใช้ Temurin JRE 21 กับ database emulator 4.11.2; ขั้นตอนและคำสั่งอยู่ใน `firebase/CLASSROOM-PHASE1.md` และ [คู่มือ Emulator ทางการ](https://firebase.google.com/docs/emulator-suite/install_and_configure)
สคริปต์คาดหวัง emulator ที่ `http://127.0.0.1:9017` กับ namespace `demo-classroom-phase1`; เปลี่ยนพอร์ตได้ผ่าน `CLASSROOM_EMULATOR_ORIGIN`
เมื่อ emulator พร้อมจึงรัน `pnpm.cmd test:classroom:rules` ตามด้วย `pnpm.cmd test:classroom:rooms`; ตัวหลังต้องมี Playwright ด้วย ทั้งสองใช้ข้อมูลจำลอง ไม่ชี้ไปฐานข้อมูลจริง

### 6. เช็กพร้อมทำงานแบบสั้น

- เปิด repo ถูกตัวบน branch `main`, อ่านเอกสารนี้ และตรวจไฟล์ค้างแก้ก่อนเริ่ม
- Node/pnpm ตรงรุ่น, ติดตั้ง dependencies สำเร็จ และเปิดหน้า Hub ผ่านพอร์ต 3000 ได้
- ทดสอบเฉพาะเส้นทางงานถัดไป; หน้าซิมเสียงและการ์ด Draft ยังควรตรวจด้วยเบราว์เซอร์ก่อนประกาศพร้อมใช้
- เมื่อต้องส่งงานค่อยตรวจตามขอบเขตที่แก้ แล้ว Commit/Push ตามคำสั่งผู้ใช้
- เก็บต้นฉบับ/งาน Guest ที่ต้องการไปด้วยตามรายการท้ายเอกสาร การ Clone ไม่ได้ย้ายข้อมูลเหล่านี้ให้

ไฟล์ใน Downloads/Temp, ภาพมาสคอต, .env, work/, outputs/, qa-output/ และข้อมูล Guest/localStorage
ไม่ได้ย้ายไปด้วยเพียง Clone Git เก็บเฉพาะต้นฉบับหรือข้อมูลที่ยังต้องการแยกไว้
ไม่ต้องคัดลอก node_modules หรือ dist เพราะสร้างใหม่ได้ และอย่าใส่รหัสลับ/ประวัติแชทส่วนตัวลง GitHub
บันทึกนี้ไม่ยืนยันว่าประวัติแชท Local ทั้งหมดจะซิงก์ไปเครื่องใหม่; มีไว้ให้เริ่มแชทใหม่แล้วต่อโปรเจกต์ได้
