/** Learning Hub manual CSV bridge. Install in a NEW, private, bound spreadsheet.
 * Enable the Advanced Google Classroom service (identifier: Classroom).
 * No Web App, triggers, student credentials or Firebase secrets are required.
 * @OnlyCurrentDoc
 */
var HUB_HEADERS_ = {
  HubAssignments: ['RoomID','RoomName','AssignmentID','AssignmentTitle','Instructions','ContentID','HubURL','DueAt','AssignmentStatus','ExportedAt','ImportDigest','CourseID','CourseWorkID','MaxPoints','BoundCourseID','BoundWorkID'],
  HubResults: ['RoomID','AssignmentID','StudentUID','StudentName','Status','Score','MaxScore','Percent','SubmittedAt','SubmissionRevision','SubmissionID'],
  HubUsers: ['StudentUID','StudentName','ClassroomEmail'],
  HubCourses: ['CourseID','CourseName','Section','State'],
  HubReview: ['RoomID','AssignmentID','CourseID','CourseName','CourseWorkID','StudentUID','StudentName','ClassroomEmail','GoogleUserID','GoogleSubmissionID','Score','MaxPoints','PreviousDraftGrade','Status'],
  HubSyncLog: ['Timestamp','RoomID','AssignmentID','CourseID','CourseWorkID','StudentUID','ClassroomEmail','GoogleUserID','SubmissionRevision','Score','Status','Token']
};
var HUB_CSV_HEADERS_ = ['ExportVersion','ExportedAt','RowType','RoomID','RoomName','AssignmentID','AssignmentTitle','Instructions','ContentID','HubURL','DueAt','AssignmentStatus','StudentUID','StudentName','Status','Score','MaxScore','Percent','SubmittedAt','SubmissionRevision','SubmissionID'];
var HUB_ROOM_ = /^r_[a-f0-9]{32}$/;
var HUB_ASSIGNMENT_ = /^a_[a-f0-9]{32}$/;
var HUB_REVIEW_LIMIT_ = 25;
var HUB_REVIEW_KEY_ = 'hub-classroom-review-v1';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Learning Hub')
    .addItem('1. เตรียมแท็บตัวกลาง', 'hubSetup')
    .addItem('2. นำเข้า CSV จาก Hub', 'hubOpenImport')
    .addItem('3. โหลดรายชื่อห้อง Google Classroom', 'hubListCourses')
    .addSeparator()
    .addItem('4. สร้าง/ตรวจงานของแถวที่เลือก', 'hubCreateCoursework')
    .addItem('5. ตรวจคะแนนก่อนส่ง', 'hubReview')
    .addItem('6. ส่งคะแนนฉบับร่างที่ตรวจแล้ว', 'hubPushDraftGrades')
    .addToUi();
}
function hubAssert_(ok, message) { if (!ok) throw new Error(message); }
function hubDigest_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(value), Utilities.Charset.UTF_8)
    .map(function (n) { return ('0' + ((n + 256) % 256).toString(16)).slice(-2); }).join('');
}
function hubLock_(fn) {
  var lock = LockService.getDocumentLock();
  hubAssert_(lock && lock.tryLock(10000), 'มีการทำงานอื่นอยู่ กรุณาลองใหม่');
  try { return fn(); } finally { lock.releaseLock(); }
}
function hubMenu_(fn) {
  try { var message = fn(); if (message) SpreadsheetApp.getUi().alert(message); }
  catch (error) { SpreadsheetApp.getUi().alert('ทำรายการไม่สำเร็จ: ' + error.message); }
}
// A visible-as-text zero-width prefix avoids formula execution without relying
// on Sheets' special handling of leading apostrophes. Escape the prefix itself.
function hubSheetText_(value) {
  var text = String(value == null ? '' : value);
  return /^(?:\s*[=+@-]|['\t\r\n\u200b])/.test(text) ? '\u200b' + text : text;
}
function hubReadText_(value) {
  var text = String(value == null ? '' : value);
  return text.charAt(0) === '\u200b' ? text.slice(1) : text;
}
function hubTable_(name, setup) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), headers = HUB_HEADERS_[name];
  hubAssert_(headers, 'ไม่รู้จักแท็บ');
  var sheet = ss.getSheetByName(name);
  if (!sheet && setup) sheet = ss.insertSheet(name);
  hubAssert_(sheet, 'กรุณาใช้เมนู 1 เพื่อเตรียมแท็บก่อน');
  if (!sheet.getLastRow() && setup) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e8effa');
  }
  var width = Math.max(sheet.getLastColumn(), headers.length);
  var range = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), width);
  hubAssert_(!range.getFormulas().some(function (r) { return r.some(Boolean); }), name + ': ห้ามใช้สูตรในแท็บตัวกลาง');
  var values = range.getValues();
  hubAssert_(JSON.stringify(values[0]) === JSON.stringify(headers), name + ': หัวคอลัมน์ไม่ตรง ห้ามลบหรือสลับคอลัมน์');
  var rows = values.slice(1).filter(function (r) { return r.some(function (v) { return v !== ''; }); }).map(function (r) {
    var item = {}; headers.forEach(function (key, i) { item[key] = hubReadText_(r[i]); }); return item;
  });
  return { sheet: sheet, headers: headers, rows: rows };
}
function hubWrite_(name, rows) {
  var table = hubTable_(name), sheet = table.sheet, width = table.headers.length;
  var values = rows.map(function (item) { return table.headers.map(function (key) { return hubSheetText_(item[key]); }); });
  if (sheet.getMaxRows() < values.length + 1) sheet.insertRowsAfter(sheet.getMaxRows(), values.length + 1 - sheet.getMaxRows());
  if (values.length) sheet.getRange(2, 1, values.length, width).setNumberFormat('@').setValues(values);
  if (sheet.getLastRow() > values.length + 1) sheet.getRange(values.length + 2, 1, sheet.getLastRow() - values.length - 1, width).clearContent();
}
function hubAppend_(table, item) {
  var row = table.sheet.getLastRow() + 1;
  if (table.sheet.getMaxRows() < row) table.sheet.insertRowsAfter(table.sheet.getMaxRows(), row - table.sheet.getMaxRows());
  table.sheet.getRange(row, 1, 1, table.headers.length).setNumberFormat('@').setValues([table.headers.map(function (key) { return hubSheetText_(item[key]); })]);
}
function hubUnique_(rows, key, label) {
  var seen = Object.create(null);
  rows.forEach(function (row) { var id = key(row); hubAssert_(!seen[id], label + ': มีรายการซ้ำ'); seen[id] = true; });
}
function hubKey_(row) { return row.RoomID + '/' + row.AssignmentID; }
function hubSetup() {
  hubMenu_(function () { return hubLock_(function () {
    // Inspect every existing tab before creating any missing ones.
    Object.keys(HUB_HEADERS_).forEach(function (name) {
      if (SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)) hubTable_(name, true);
    });
    Object.keys(HUB_HEADERS_).forEach(function (name) { hubTable_(name, true); });
    return 'เตรียมแท็บแล้ว ใช้เมนู 2 เพื่อนำเข้า CSV จาก Learning Hub';
  }); });
}
function hubOpenImport() {
  hubMenu_(function () {
    hubTable_('HubAssignments');
    SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutputFromFile('ImportCsv').setWidth(480).setHeight(340), 'นำเข้า CSV จาก Learning Hub');
  });
}
function hubImportCsv(csv) { return hubLock_(function () { return hubImport_(csv); }); }
function hubCsv_(csv) {
  hubAssert_(typeof csv === 'string' && csv.length <= 4000000, 'ไฟล์ CSV ใหญ่เกินไป (สูงสุด 4 ล้านตัวอักษร)');
  var text = csv.replace(/^\uFEFF/, ''), rows = [], row = [], cell = '', quoted = false, closed = false, started = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    if (quoted) {
      if (ch === '"' && text.charAt(i + 1) === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else cell += ch;
    } else if (ch === ',' || ch === '\r' || ch === '\n') {
      row.push(cell); cell = ''; closed = false; started = false;
      if (ch !== ',') { rows.push(row); row = []; if (ch === '\r' && text.charAt(i + 1) === '\n') i++; }
    } else if (ch === '"' && !started) { quoted = true; started = true; }
    else { hubAssert_(!closed && ch !== '"', 'CSV มีเครื่องหมายคำพูดไม่ถูกต้อง'); cell += ch; started = true; }
    hubAssert_(rows.length <= 2002 && row.length <= HUB_CSV_HEADERS_.length && cell.length <= 50000, 'CSV มีข้อมูลมากเกินไป');
  }
  hubAssert_(!quoted, 'CSV ปิดเครื่องหมายคำพูดไม่ครบ');
  if (started || closed || row.length) { row.push(cell); rows.push(row); }
  hubAssert_(rows.length >= 2 && JSON.stringify(rows[0]) === JSON.stringify(HUB_CSV_HEADERS_), 'รูปแบบ CSV ไม่ตรง กรุณาส่งออกใหม่จาก Hub');
  return rows.slice(1).map(function (cells) {
    hubAssert_(cells.length === HUB_CSV_HEADERS_.length, 'CSV มีจำนวนคอลัมน์ไม่ตรง');
    var item = {};
    HUB_CSV_HEADERS_.forEach(function (key, index) {
      var value = cells[index];
      if (value.charAt(0) === "'") {
        value = value.slice(1);
        hubAssert_(/^(?:\s*[=+@-]|['\t\r\n])/.test(value), 'CSV มีข้อความเข้ารหัสไม่ถูกต้อง');
      }
      hubAssert_(!/[\u0000\u0008\u000b\u000c]/.test(value), 'CSV มีอักขระที่ไม่รองรับ');
      item[key] = value;
    });
    return item;
  });
}
function hubIso_(text) { return typeof text === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(text) && Number.isFinite(Date.parse(text)) && new Date(text).toISOString() === text; }
function hubUid_(uid) { return typeof uid === 'string' && uid.length > 0 && uid.length <= 128 && !/[\u0000-\u001f\/.#$\[\]]/.test(uid); }
function hubNumber_(text) { return typeof text === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text) ? Number(text) : NaN; }
function hubValidateCsv_(csv) {
  var data = hubCsv_(csv), a = data[0];
  hubAssert_(a.ExportVersion === '1' && a.RowType === 'assignment' && HUB_ROOM_.test(a.RoomID) && HUB_ASSIGNMENT_.test(a.AssignmentID), 'ข้อมูลการบ้านไม่ถูกต้อง');
  hubAssert_(hubIso_(a.ExportedAt) && Date.parse(a.ExportedAt) > 0 && (!a.DueAt || hubIso_(a.DueAt)), 'วันที่ไม่ถูกต้อง');
  hubAssert_(a.AssignmentTitle.trim() && a.AssignmentTitle.length <= 3000 && a.Instructions.length <= 26000 && /^[a-z0-9][a-z0-9_-]{0,159}$/i.test(a.ContentID), 'ชื่อหรือเนื้อหาการบ้านไม่ถูกต้อง');
  hubAssert_(['published','closed'].indexOf(a.AssignmentStatus) >= 0, 'ส่งออกได้เฉพาะงานที่ประกาศแล้ว');
  // Apps Script V8 does not provide the browser URL constructor.
  hubAssert_(/^https:\/\/[a-z0-9.-]+(?::\d+)?\/[^?#\s]*#classroom\//i.test(a.HubURL) && a.HubURL.slice(a.HubURL.indexOf('#')) === '#classroom/' + a.RoomID + '/' + a.AssignmentID, 'ลิงก์ Hub ไม่ตรงกับการบ้าน');
  var baseKeys = HUB_CSV_HEADERS_.slice(0, 12).filter(function (key) { return key !== 'RowType'; });
  var resultKeys = HUB_CSV_HEADERS_.slice(12);
  hubAssert_(resultKeys.every(function (key) { return a[key] === ''; }), 'แถวข้อมูลการบ้านต้องไม่มีคะแนนนักเรียน');
  var rows = data.slice(1);
  hubUnique_(rows, function (r) { return r.StudentUID; }, 'StudentUID');
  rows.forEach(function (r) {
    hubAssert_(r.RowType === 'student' && baseKeys.every(function (key) { return r[key] === a[key]; }) && hubUid_(r.StudentUID), 'ข้อมูลนักเรียนไม่ตรงกับการบ้าน');
    hubAssert_(['submitted','not_submitted','grading_error'].indexOf(r.Status) >= 0, 'สถานะนักเรียนไม่ถูกต้อง');
    if (r.Status !== 'submitted') {
      hubAssert_(resultKeys.slice(3).every(function (key) { return r[key] === ''; }), 'งานที่ยังไม่มีคะแนนต้องเว้นคะแนนว่าง');
      return;
    }
    var score = hubNumber_(r.Score), max = hubNumber_(r.MaxScore), percent = hubNumber_(r.Percent), revision = hubNumber_(r.SubmissionRevision);
    hubAssert_(Number.isFinite(score) && Number.isFinite(max) && max > 0 && score <= max && percent === Math.round(score / max * 10000) / 100 && Number.isSafeInteger(revision) && revision >= 1 && /^[a-f0-9]{32}$/.test(r.SubmissionID) && hubIso_(r.SubmittedAt) && Date.parse(r.SubmittedAt) > 0, 'คะแนนหรือรอบส่งไม่ถูกต้อง');
  });
  return { assignment: a, rows: rows, digest: hubDigest_(data) };
}
function hubImport_(csv) {
  var input = hubValidateCsv_(csv), a = input.assignment, key = hubKey_(a);
  var assignments = hubTable_('HubAssignments').rows, results = hubTable_('HubResults').rows, users = hubTable_('HubUsers').rows;
  hubUnique_(assignments, hubKey_, 'การบ้าน');
  hubUnique_(results, function (r) { return hubKey_(r) + '/' + r.StudentUID; }, 'ผลการบ้าน');
  hubUnique_(users, function (r) { return r.StudentUID; }, 'ผู้ใช้');
  var old = assignments.find(function (r) { return hubKey_(r) === key; });
  if (old) {
    hubAssert_(hubIso_(old.ExportedAt), 'วันที่นำเข้าเดิมเสียหาย');
    if (a.ExportedAt < old.ExportedAt) return 'ข้ามไฟล์เก่า: มีไฟล์ส่งออกที่ใหม่กว่าในชีทแล้ว';
    if (a.ExportedAt === old.ExportedAt) {
      hubAssert_(input.digest === old.ImportDigest, 'ไฟล์เวลาเดียวกันแต่ข้อมูลต่างกัน กรุณาส่งออกใหม่');
      return 'ไฟล์นี้นำเข้าแล้ว ไม่มีการแก้ข้อมูลซ้ำ';
    }
    hubAssert_(a.ContentID === old.ContentID && a.HubURL === old.HubURL, 'การบ้านเดิมเปลี่ยนเนื้อหาหรือต้นทาง กรุณาตรวจสอบ');
  }
  var next = Object.assign({}, old || { CourseID:'', CourseWorkID:'', MaxPoints:'100', BoundCourseID:'', BoundWorkID:'' });
  HUB_HEADERS_.HubAssignments.slice(0, 10).forEach(function (field) { next[field] = a[field]; });
  next.ImportDigest = input.digest;
  var oldResults = new Map(results.filter(function (r) { return hubKey_(r) === key; }).map(function (r) { return [r.StudentUID, r]; }));
  var added = input.rows.map(function (r) {
    var prev = oldResults.get(r.StudentUID), revision = Number(prev && prev.SubmissionRevision) || 0;
    if (r.Status === 'submitted' && revision) {
      hubAssert_(Number(r.SubmissionRevision) >= revision, 'ไฟล์มีรอบส่งย้อนหลัง: ' + r.StudentUID);
      if (Number(r.SubmissionRevision) === revision) {
        hubAssert_(['SubmissionID','Score','MaxScore','Percent','SubmittedAt'].every(function (field) { return r[field] === prev[field]; }), 'คะแนนรอบส่งเดิมขัดแย้ง: ' + r.StudentUID);
      } else hubAssert_(r.SubmissionID !== prev.SubmissionID && r.SubmittedAt >= prev.SubmittedAt, 'รอบส่งใหม่มีรหัสหรือเวลาขัดแย้ง');
    }
    var row = {}; HUB_HEADERS_.HubResults.forEach(function (field) { row[field] = r[field]; });
    // Keep the high-water revision while suppressing invalid/missing grades.
    if (r.Status !== 'submitted' && prev) ['Score','MaxScore','Percent','SubmittedAt','SubmissionRevision','SubmissionID'].forEach(function (field) { row[field] = prev[field]; });
    oldResults.delete(r.StudentUID);
    if (!users.some(function (u) { return u.StudentUID === r.StudentUID; })) users.push({StudentUID:r.StudentUID, StudentName:r.StudentName, ClassroomEmail:''});
    return row;
  });
  oldResults.forEach(function (r) { added.push(Object.assign({}, r, {Status:'not_in_export'})); });
  if (old) assignments[assignments.indexOf(old)] = next; else assignments.push(next);
  // Assignment timestamp is the commit marker. If interrupted, importing again
  // reapplies the same result rows and user mapping before advancing the marker.
  hubWrite_('HubUsers', users);
  hubWrite_('HubResults', results.filter(function (r) { return hubKey_(r) !== key; }).concat(added));
  hubWrite_('HubAssignments', assignments);
  return 'นำเข้า ' + a.AssignmentTitle + ' แล้ว (' + input.rows.length + ' คน) เติม ClassroomEmail ใน HubUsers และ CourseID ใน HubAssignments';
}
function hubPages_(read, field) {
  var rows = [], token = '', seen = {};
  do {
    var page = read(token) || {}; rows = rows.concat(page[field] || []); token = page.nextPageToken || '';
    hubAssert_(!token || !seen[token], 'Google ส่งหน้าข้อมูลซ้ำ กรุณาลองใหม่'); seen[token] = true;
  } while (token);
  return rows;
}
function hubListCourses() {
  hubMenu_(function () { return hubLock_(function () {
    var courses = hubPages_(function (token) { return Classroom.Courses.list({teacherId:'me',courseStates:['ACTIVE'],pageSize:100,pageToken:token}); }, 'courses');
    hubWrite_('HubCourses', courses.map(function (c) { return {CourseID:c.id,CourseName:c.name,Section:c.section || '',State:c.courseState}; }));
    return 'โหลด ' + courses.length + ' ห้องแล้ว คัดลอก CourseID ไปใส่แถวการบ้านใน HubAssignments';
  }); });
}
function hubSelected_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet(), range = sheet.getActiveRange();
  hubAssert_(sheet.getName() === 'HubAssignments' && range && range.getRow() >= 2 && range.getNumRows() === 1, 'เลือกหนึ่งแถวการบ้านใน HubAssignments ก่อน');
  // Table data must stay contiguous; locate by actual row rather than title.
  var table = hubTable_('HubAssignments'), values = sheet.getRange(range.getRow(), 1, 1, table.headers.length).getValues()[0], a = {};
  table.headers.forEach(function (key, i) { a[key] = hubReadText_(values[i]); });
  hubAssert_(HUB_ROOM_.test(a.RoomID) && HUB_ASSIGNMENT_.test(a.AssignmentID), 'แถวที่เลือกไม่ใช่การบ้าน');
  hubUnique_(table.rows, hubKey_, 'การบ้าน');
  return a;
}
function hubAssignment_(key) {
  var rows = hubTable_('HubAssignments').rows; hubUnique_(rows, hubKey_, 'การบ้าน');
  var a = rows.find(function (r) { return hubKey_(r) === key; }); hubAssert_(a, 'ไม่พบการบ้าน'); return a;
}
function hubCourse_(a) {
  hubAssert_(/^\d+$/.test(a.CourseID), 'กรอก CourseID จาก HubCourses ก่อน');
  var c = Classroom.Courses.get(a.CourseID);
  hubAssert_(String(c.id) === a.CourseID && c.courseState === 'ACTIVE', 'ห้อง Google Classroom ไม่พร้อมใช้งาน'); return c;
}
function hubMarker_(a) { return '[LearningHub:v1:' + hubKey_(a) + ']'; }
function hubWork_(a, work) {
  var markers = String(work && work.description || '').split('\n').filter(function (line) { return /^\[LearningHub:v1:/.test(line); });
  hubAssert_(markers.length === 1 && markers[0] === hubMarker_(a), 'รหัส Hub ในคำอธิบาย Google ไม่ตรงหรือมีซ้ำ');
  hubAssert_(work && String(work.courseId) === a.CourseID && /^\d+$/.test(String(work.id)) && work.associatedWithDeveloper === true && work.workType === 'ASSIGNMENT' && work.state === 'PUBLISHED' && String(work.description || '').split('\n').indexOf(hubMarker_(a)) >= 0, 'งานไม่ตรงกับ Hub หรือไม่ได้สร้างผ่านโปรเจกต์นี้');
  hubAssert_(Number.isSafeInteger(work.maxPoints) && work.maxPoints > 0, 'งาน Google ต้องมีคะแนนเต็มเป็นจำนวนเต็มมากกว่า 0');
  return work;
}
function hubBound_(a) {
  hubAssert_(a.CourseID === a.BoundCourseID && a.CourseWorkID === a.BoundWorkID && /^\d+$/.test(a.CourseWorkID), 'รหัสงานที่ผูกไว้ถูกเปลี่ยน กรุณาตรวจสอบ');
  return hubWork_(a, Classroom.Courses.CourseWork.get(a.CourseID, a.CourseWorkID));
}
function hubCreate_(key, expected) {
  var a = hubAssignment_(key); hubAssert_(hubDigest_(a) === expected, 'ข้อมูลเปลี่ยนระหว่างยืนยัน กรุณาเริ่มใหม่');
  hubCourse_(a);
  if (a.CourseWorkID || a.BoundWorkID || a.BoundCourseID) { hubBound_(a); return 'งานเดิมยังผูกถูกต้อง ไม่มีการสร้างซ้ำ'; }
  var max = hubNumber_(a.MaxPoints); hubAssert_(Number.isSafeInteger(max) && max > 0 && max <= 1000000, 'MaxPoints ต้องเป็นจำนวนเต็ม 1–1000000');
  var matches = hubPages_(function (token) { return Classroom.Courses.CourseWork.list(a.CourseID, {pageSize:100,pageToken:token,courseWorkStates:['PUBLISHED','DRAFT','DELETED']}); }, 'courseWork')
    .filter(function (w) { return String(w.description || '').split('\n').indexOf(hubMarker_(a)) >= 0; });
  hubAssert_(matches.length <= 1, 'พบงานที่มีรหัส Hub ซ้ำ กรุณาตรวจใน Classroom');
  var work = matches[0];
  if (!work) {
    hubAssert_(!/^\[LearningHub:v1:/m.test(a.Instructions), 'คำชี้แจงมีรหัส Hub สงวนไว้ กรุณาลบข้อความรหัสดังกล่าวจากต้นทาง');
    var body = {title:a.AssignmentTitle,description:a.Instructions + '\n\nทำและแก้คำตอบที่ Learning Hub: ' + a.HubURL + '\n' + hubMarker_(a),workType:'ASSIGNMENT',state:'PUBLISHED',maxPoints:max,materials:[{link:{url:a.HubURL}}]};
    if (a.DueAt) {
      hubAssert_(hubIso_(a.DueAt), 'กำหนดส่งไม่ถูกต้อง');
      var date = new Date(a.DueAt);
      body.dueDate = {year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate()};
      body.dueTime = {hours:date.getUTCHours(),minutes:date.getUTCMinutes(),seconds:date.getUTCSeconds()};
    }
    work = Classroom.Courses.CourseWork.create(body, a.CourseID);
    // Re-read to verify the actual owner project and persisted work.
    work = Classroom.Courses.CourseWork.get(a.CourseID, work.id);
  }
  hubWork_(a, work);
  var rows = hubTable_('HubAssignments').rows;
  rows[rows.findIndex(function (r) { return hubKey_(r) === key; })] = Object.assign({}, a, {CourseWorkID:String(work.id),BoundCourseID:a.CourseID,BoundWorkID:String(work.id),MaxPoints:String(work.maxPoints)});
  hubWrite_('HubAssignments', rows);
  return 'ผูกงานแล้ว: ' + work.title + '\nCourseWorkID: ' + work.id;
}
function hubCreateCoursework() {
  hubMenu_(function () {
    var a = hubSelected_(), c = hubCourse_(a), expected = hubDigest_(a), ui = SpreadsheetApp.getUi();
    var answer = ui.alert('สร้าง/ตรวจงาน Google Classroom', 'ห้อง: ' + c.name + '\nงาน: ' + a.AssignmentTitle + '\nคะแนนเต็ม: ' + a.MaxPoints + '\nงานใหม่จะประกาศให้ทั้งห้องเห็นทันที พร้อมลิงก์ Hub\nยืนยันหรือไม่?', ui.ButtonSet.YES_NO);
    if (answer !== ui.Button.YES) return;
    return hubLock_(function () { return hubCreate_(hubKey_(a), expected); });
  });
}
function hubToken_(a, row, email, max) { return hubDigest_([a.CourseID,a.CourseWorkID,row.StudentUID,email,row.SubmissionID,row.SubmissionRevision,row.Score,row.MaxScore,max]); }
function hubPlan_(key) {
  var a = hubAssignment_(key), course = hubCourse_(a), work = hubBound_(a);
  var users = hubTable_('HubUsers').rows, all = hubTable_('HubResults').rows, logs = hubTable_('HubSyncLog').rows;
  hubUnique_(users, function (r) { return r.StudentUID; }, 'ผู้ใช้');
  hubUnique_(all, function (r) { return hubKey_(r) + '/' + r.StudentUID; }, 'ผลการบ้าน');
  var counts = Object.create(null), mappings = new Map(), sent = new Set(logs.filter(function (r) { return r.Status === 'SENT'; }).map(function (r) { return r.Token; }));
  users.forEach(function (u) { var email = u.ClassroomEmail.trim().toLowerCase(); mappings.set(u.StudentUID, email); if (email) counts[email] = (counts[email] || 0) + 1; });
  var lookups = 0;
  var inputFingerprint = hubDigest_([a, all, users]);
  var rows = all.filter(function (r) { return hubKey_(r) === key; }).map(function (r) {
    var email = mappings.get(r.StudentUID) || '', row = {RoomID:a.RoomID,AssignmentID:a.AssignmentID,CourseID:a.CourseID,CourseName:course.name,CourseWorkID:a.CourseWorkID,StudentUID:r.StudentUID,StudentName:r.StudentName,ClassroomEmail:email,GoogleUserID:'',GoogleSubmissionID:'',Score:'',MaxPoints:String(work.maxPoints),PreviousDraftGrade:'',Status:'',Token:'',SubmissionRevision:r.SubmissionRevision};
    if (r.Status !== 'submitted') { row.Status = r.Status.toUpperCase(); return row; }
    var score = hubNumber_(r.Score), max = hubNumber_(r.MaxScore), revision = hubNumber_(r.SubmissionRevision);
    hubAssert_(hubUid_(r.StudentUID) && Number.isFinite(score) && Number.isFinite(max) && max > 0 && score <= max && Number.isSafeInteger(revision) && revision >= 1 && /^[a-f0-9]{32}$/.test(r.SubmissionID), 'ข้อมูลคะแนนในชีทไม่ถูกต้อง กรุณานำเข้า CSV ใหม่');
    row.Score = String(Math.round(score / max * work.maxPoints * 100) / 100);
    row.Token = hubToken_(a, r, email, work.maxPoints);
    if (!email) row.Status = 'MISSING_EMAIL';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) row.Status = 'INVALID_EMAIL';
    else if (counts[email] !== 1) row.Status = 'DUPLICATE_EMAIL';
    else if (sent.has(row.Token)) {
      row.Status = 'ALREADY_SENT';
      var last = logs.find(function (log) { return log.Status === 'SENT' && log.Token === row.Token; });
      row.GoogleUserID = last.GoogleUserID || '';
    }
    else if (lookups >= HUB_REVIEW_LIMIT_) row.Status = 'NEXT_BATCH';
    else {
      lookups++;
      try {
        var matches = hubPages_(function (token) { return Classroom.Courses.CourseWork.StudentSubmissions.list(a.CourseID,a.CourseWorkID,{userId:email,pageSize:100,pageToken:token}); }, 'studentSubmissions');
        if (matches.length !== 1) row.Status = matches.length ? 'AMBIGUOUS_SUBMISSION' : 'NO_SUBMISSION';
        else {
          var sub = matches[0];
          hubAssert_(String(sub.courseId) === a.CourseID && String(sub.courseWorkId) === a.CourseWorkID && sub.associatedWithDeveloper === true && /^\d+$/.test(String(sub.userId)) && /^[a-z0-9_-]+$/i.test(String(sub.id)), 'รายการ Google ไม่ตรงกับงาน');
          row.GoogleUserID = String(sub.userId); row.GoogleSubmissionID = String(sub.id);
          row.PreviousDraftGrade = sub.draftGrade == null ? '' : String(sub.draftGrade); row.Status = 'READY';
        }
      } catch (error) { row.Status = 'API_ERROR: ' + String(error.message).slice(0,300); }
    }
    return row;
  });
  // A duplicate Google user ID is also ambiguous even when two email aliases differ.
  var googleIds = new Map();
  function remember(row) {
    if (!row.GoogleUserID) return;
    if (!googleIds.has(row.GoogleUserID)) googleIds.set(row.GoogleUserID, new Set());
    googleIds.get(row.GoogleUserID).add(row.StudentUID);
  }
  logs.filter(function (r) { return r.Status === 'SENT' && r.CourseID === a.CourseID && r.CourseWorkID === a.CourseWorkID; }).forEach(remember);
  rows.forEach(remember);
  rows.forEach(function (r) { if (r.GoogleUserID && googleIds.get(r.GoogleUserID).size > 1) r.Status = 'DUPLICATE_GOOGLE_USER'; });
  return {assignment:a, rows:rows, inputFingerprint:inputFingerprint, fingerprint:hubDigest_([a, work.maxPoints, work.title, rows])};
}
function hubReview() {
  hubMenu_(function () {
    var a = hubSelected_();
    return hubLock_(function () {
      var plan = hubPlan_(hubKey_(a)); hubWrite_('HubReview', plan.rows);
      PropertiesService.getUserProperties().setProperty(HUB_REVIEW_KEY_, JSON.stringify({key:hubKey_(a),fingerprint:plan.fingerprint,at:Date.now()}));
      return 'ตรวจแล้ว: พร้อมส่ง ' + plan.rows.filter(function (r) { return r.Status === 'READY'; }).length + ' คน\nดู HubReview และตรวจห้อง ชื่องาน อีเมล คะแนน และ PreviousDraftGrade ก่อนส่ง\nส่งครั้งละไม่เกิน 25 คน แล้วตรวจใหม่เพื่อทำชุดถัดไป';
    });
  });
}
function hubPush_(key, preview) {
  hubAssert_(preview && preview.key === key && Date.now() - preview.at >= 0 && Date.now() - preview.at <= 10 * 60 * 1000, 'การตรวจหมดอายุ กรุณาใช้เมนู 5 ใหม่');
  var plan = hubPlan_(key);
  hubAssert_(plan.fingerprint === preview.fingerprint, 'คะแนน การจับคู่อีเมล หรืองาน Google เปลี่ยน กรุณาตรวจใหม่ด้วยเมนู 5');
  PropertiesService.getUserProperties().deleteProperty(HUB_REVIEW_KEY_);
  var ready = plan.rows.filter(function (r) { return r.Status === 'READY'; }), count = 0, failed = 0;
  var logTable = hubTable_('HubSyncLog');
  ready.forEach(function (r) {
    var status;
    try {
      hubAssert_(hubDigest_([hubAssignment_(key), hubTable_('HubResults').rows, hubTable_('HubUsers').rows]) === plan.inputFingerprint, 'คะแนนหรืออีเมลในชีทเปลี่ยนระหว่างส่ง');
      var current = hubAssignment_(key); hubAssert_(hubDigest_(current) === hubDigest_(plan.assignment), 'ข้อมูลการบ้านเปลี่ยนระหว่างส่ง');
      var work = hubBound_(current); hubAssert_(String(work.maxPoints) === r.MaxPoints, 'คะแนนเต็มเปลี่ยนระหว่างส่ง');
      var sub = Classroom.Courses.CourseWork.StudentSubmissions.get(r.CourseID,r.CourseWorkID,r.GoogleSubmissionID);
      hubAssert_(sub.associatedWithDeveloper === true && String(sub.userId) === r.GoogleUserID && String(sub.id) === r.GoogleSubmissionID && String(sub.courseId) === r.CourseID && String(sub.courseWorkId) === r.CourseWorkID && (sub.draftGrade == null ? '' : String(sub.draftGrade)) === r.PreviousDraftGrade, 'คะแนน Google เปลี่ยนหลังตรวจ กรุณาตรวจใหม่');
      Classroom.Courses.CourseWork.StudentSubmissions.patch({draftGrade:Number(r.Score)},r.CourseID,r.CourseWorkID,r.GoogleSubmissionID,{updateMask:'draftGrade'});
      status = 'SENT'; count++;
    } catch (error) { status = 'ERROR: ' + String(error.message).slice(0,300); failed++; }
    // Commit each outcome immediately; re-running an interrupted batch can only
    // retry the same draft value, never publish grades or turn in work.
    hubAppend_(logTable, Object.assign({}, r, {Timestamp:new Date().toISOString(),Status:status}));
  });
  return 'ส่ง draftGrade แล้ว ' + count + ' คน; ไม่สำเร็จ ' + failed + ' คน\nตรวจ HubSyncLog แล้วใช้เมนู 5 ใหม่สำหรับรายการที่เหลือ\nครูตรวจและคืนงานให้นักเรียนใน Google Classroom ตามปกติ';
}
function hubPushDraftGrades() {
  hubMenu_(function () {
    var a = hubSelected_(), preview = JSON.parse(PropertiesService.getUserProperties().getProperty(HUB_REVIEW_KEY_) || 'null'), ui = SpreadsheetApp.getUi();
    hubAssert_(preview && preview.key === hubKey_(a), 'เลือกงานที่ตรวจแล้ว หรือใช้เมนู 5 ก่อน');
    var answer = ui.alert('ยืนยันส่งคะแนนฉบับร่าง', 'งาน: ' + a.AssignmentTitle + '\nCourseID: ' + a.CourseID + '\nCourseWorkID: ' + a.CourseWorkID + '\nจะเขียนทับ draftGrade ของรายการ READY ใน HubReview (สูงสุด 25 คน)\nยืนยันหรือไม่?', ui.ButtonSet.YES_NO);
    if (answer !== ui.Button.YES) return;
    return hubLock_(function () { return hubPush_(hubKey_(a), preview); });
  });
}
