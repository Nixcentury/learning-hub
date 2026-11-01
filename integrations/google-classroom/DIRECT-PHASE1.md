# เชื่อม Google Classroom โดยตรง — รอบ 1

รอบนี้ให้ครูเลือกบัญชี Google โรงเรียนและอ่านรายชื่อห้อง **ACTIVE ที่ตนเป็นครู** จาก Hub เท่านั้น ใช้บัญชี Gmail ส่วนตัวดูแล Cloud/Firebase ตามเดิม ไม่เปลี่ยนบัญชี Firebase ที่ล็อกอิน Hub ไม่โหลดรายชื่อนักเรียน ไม่ผูกห้อง ไม่สร้างงาน และไม่ส่งคะแนนในรอบนี้

## ตั้งค่า Google Cloud ครั้งแรก

ใช้บัญชีส่วนตัวที่ดูแลโปรเจกต์ และโปรเจกต์ที่ตั้งใจจะใช้กับตัวเชื่อมตรงระยะยาว การเปิด Cloud Console ไม่สำเร็จด้วยบัญชีโรงเรียนยังไม่บอกผลการอนุญาต Classroom API ของแอปภายนอก ต้องทดสอบขั้นเชื่อมบัญชีจริงด้วย

1. เปิด [Google Cloud Console](https://console.cloud.google.com/) เลือกโปรเจกต์ของตัวเองที่ต้องการใช้กับ Hub ตรวจชื่อโปรเจกต์ก่อนแก้ค่า ไม่เปลี่ยนโปรเจกต์ของ Apps Script/ชีทเดิม
2. ไป APIs & Services → Library → **Google Classroom API** → Enable
3. ไป **Google Auth platform** ตั้งค่า Branding ของแอปและอีเมลติดต่อ สำหรับโปรเจกต์ที่บัญชี Gmail ส่วนตัวดูแล ให้เลือก Audience **External** ระหว่างทดสอบใช้ Testing และเพิ่มเมลครูโรงเรียนที่จะเชื่อมเป็น **Test user**
4. ใน Data Access เพิ่มเฉพาะขอบเขตที่ใช้รอบนี้:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
5. ไป Clients → Create client → **Web application** ตั้งชื่อ เช่น Learning Hub Classroom
6. ใส่ **Authorized JavaScript origins** ตาม origin ของ Hub ที่ใช้จริง เปิดหน้าต่างเชื่อมใน Hub → ตั้งค่าการเชื่อมต่อครั้งแรก จะเห็นค่าให้คัดลอก เช่น `https://nixcentury.github.io` สำหรับเว็บใต้ `/learning-hub/` ให้ใส่เฉพาะ origin ไม่มี path หรือเครื่องหมาย `/` ท้ายค่า ถ้าใช้โดเมนของตัวเองให้เพิ่ม origin นั้นด้วย
7. คัดลอก **Client ID** ที่ลงท้าย `.apps.googleusercontent.com` ไม่ต้องใช้ Client secret ในรอบนี้ ห้ามวาง secret หรือ JSON credentials ในหน้าเว็บ, GitHub หรือข้อความสนทนา

ชื่อเมนูอาจแสดงเป็น OAuth consent screen / Credentials ในบางหน้าของ Console ดู [คู่มือตั้งค่า Google Identity Services](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid) ประกอบ ไม่ต้องตั้ง redirect URI สำหรับ token-popup flow นี้

## ทดลองใน Hub

1. Merge PR และรอเว็บอัปเดต เปิด Hub ด้วยบัญชีที่ได้รับอนุมัติเป็นครู → Classroom จะมีแผง **Google Classroom** เหนือรายการห้อง
2. กด **เชื่อม Google Classroom** → ขยาย **ตั้งค่าการเชื่อมต่อครั้งแรก** วาง Client ID → **เตรียมการเชื่อมต่อ**
3. เมื่อพร้อม กด **เลือกบัญชีครูโรงเรียน** ในหน้าต่างบน Hub โดยตรง เพื่อให้เบราว์เซอร์เปิดป๊อปอัป Google ได้ เลือก **เมลโรงเรียน** และอนุญาตสิทธิ์อ่านห้อง/อีเมลที่แสดง บัญชีนี้แยกจากบัญชีที่เข้า Hub
4. ตรวจอีเมลที่แผงแสดงว่าตรงกับบัญชีครู จะเห็นห้อง ACTIVE ทั้งหมดที่บัญชีนี้เป็นครู รวมหน้าถัดไปหากมีหลายหน้า
5. กด **เปิดใน Google Classroom** เพื่อตรวจห้องจริงได้ การเปิดห้องใน Google ไม่ใช่การผูกห้อง Hub กับ Google ขั้นผูกห้อง TEST #1 จะทำรอบ 2
6. ลอง **โหลดรายชื่อห้องอีกครั้ง**, **เปลี่ยนบัญชี Google**, และ **ยกเลิกการเชื่อมต่อครั้งนี้** เมื่อนักเรียนเปิดหน้าเดียวกันต้องไม่เห็นแผงนี้หรือข้อมูลบัญชีครู

ค่าที่วางและ access token ใช้เฉพาะหน่วยความจำของแท็บ ไม่มี refresh token, client secret หรือ token ใน localStorage, sessionStorage, Firebase, URL หรือข้อความ postMessage เปิดหน้าใหม่ เปลี่ยนบัญชี/สิทธิ์ Hub ออกจาก Classroom หรือ token หมดอายุ ต้องเชื่อมใหม่ ยกเลิกการเชื่อมต่อครั้งนี้ล้างสิทธิ์ที่แท็บถืออยู่ ไม่ถอนความยินยอมของแอปจากบัญชี Google ทั้งหมด

## ตั้ง Client ID กลางหลังทดลองสำเร็จ (ไม่บังคับ)

Client ID เป็นข้อมูลสาธารณะ ถ้าต้องการให้ครูไม่ต้องวางเองทุกครั้ง ให้เจ้าของ repository ไป Settings → Secrets and variables → Actions → **Variables** สร้าง `GOOGLE_CLASSROOM_CLIENT_ID` ด้วย Client ID นี้ แล้วรัน workflow **Learning Hub Pages** ใหม่ (หรือ deploy จาก main ครั้งถัดไป) Build อ่านเป็น `VITE_GOOGLE_CLASSROOM_CLIENT_ID` แล้วเติมค่าให้หน้าต่างเชื่อมโดยอัตโนมัติ ไม่ใช้ Client secret เป็นตัวแปรนี้

## เมื่อเชื่อมไม่ผ่าน

| อาการ | ตรวจอะไร |
| --- | --- |
| ป๊อปอัปไม่เปิด | อนุญาตป๊อปอัปของ Hub แล้วกดเลือกบัญชีอีกครั้ง |
| ปิดหน้าต่าง / ปฏิเสธ | กลับมากดเลือกบัญชีได้ ไม่มีการส่งข้อมูล Classroom ไปบันทึก |
| `origin_mismatch` / `invalid_client` | Web application Client ID และ Authorized JavaScript origins ต้องตรงกับเว็บที่เปิดจริง |
| `access_denied` / แอปถูกผู้ดูแลบล็อก | ตรวจ Test user, บัญชีที่เลือก และนโยบายแอปภายนอกของโรงเรียน ถ้าโรงเรียนบล็อกให้ผู้ดูแลตรวจ client ID กับ scopes นี้ การใช้โปรเจกต์ส่วนตัวไม่ข้ามนโยบายโรงเรียน |
| ยังไม่เปิด API | เปิด Classroom API ในโปรเจกต์เดียวกับ Client ID แล้วกดโหลดอีกครั้ง |
| เชื่อมแล้วไม่พบห้อง | ตรวจอีเมลที่เชื่อม บัญชีต้องเป็นครูในห้อง ACTIVE ห้องที่เข้าร่วมเป็นนักเรียนหรือถูกเก็บถาวรจะไม่แสดง |
| สิทธิ์หมดอายุ / 401 | กดเชื่อมใหม่ ไม่มีการต่ออายุเงียบ ๆ เบื้องหลัง |
| Google จำกัดคำขอ / 429 | รอสักครู่แล้วกดโหลดใหม่ |

## ขอบเขตและการตรวจสอบ

ยังใช้ Firebase แพ็กเกจเดิม ไม่มี Cloud Functions และไม่แก้ Rules คะแนน คำตอบ การบ้าน การส่งซ้ำ และกล่องลิงก์เดิมคงไว้ทั้งหมด การอ่านทดสอบไม่เขียนข้อมูลกลับ Google และยังไม่มีการจับคู่นักเรียน

Unit tests ครอบคลุมการขอสิทธิ์ตามบทบาท การเปลี่ยนบัญชี/เพิกถอนสิทธิ์ การหมดอายุ คำตอบเก่าที่มาช้า scope ไม่ครบ ป๊อปอัปปิด การแบ่งหน้ารายชื่อ ความปลอดภัยของ URL/ข้อความ และการไม่ใส่ token ใน snapshot CI browser ใช้ Google จำลองกับ production Hub เพื่อทดสอบปุ่มจริงและการคงบัญชี Hub เดิม การทดสอบนี้ยังไม่ยืนยันว่าโรงเรียนอนุญาต OAuth ของโปรเจกต์จริง ต้องทำขั้นทดลองด้วยบัญชีครูโรงเรียน

อ่านประกอบ: [Token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [GIS JavaScript API](https://developers.google.com/identity/oauth2/web/reference/js-reference), [courses.list](https://developers.google.com/workspace/classroom/reference/rest/v1/courses/list), [เลือก scopes](https://developers.google.com/workspace/classroom/guides/auth)
