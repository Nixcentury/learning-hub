# Firebase Rules — Round 3 Account Roles

ไฟล์นี้เป็น **คู่มือเตรียมกฎ** เท่านั้น ระบบยังไม่ได้นำกฎไปใช้กับ Firebase จริง เพราะต้องใช้สิทธิ์เจ้าของโครงการหรือผู้ดูแล Firebase

อย่าแทนที่ Rules เดิมทั้งไฟล์ เพราะ Quiz และ Simulation เดิมอาจใช้เส้นทางอื่นอยู่ ให้เพิ่มเฉพาะกิ่ง `learningHub` ต่อไปนี้เข้าไปใต้ `rules` เดิม

**ก่อนใช้กับ Classroom:** ต้องตรวจ Rules ปัจจุบันรวมถึงกิ่งแม่ด้วย การใส่ `.read: false` / `.write: false` ที่กิ่งลูกไม่ถอนสิทธิ์ที่กิ่งแม่เปิดไว้แล้ว ตาม [หลักการสืบทอดสิทธิ์ของ Firebase](https://firebase.google.com/docs/database/security/core-syntax) อย่าเปิดกิ่งแม่ให้ทุกคนอ่าน/เขียนเพื่อแก้ปัญหา permission denied ดูรายการทดสอบจริงใน `CLASSROOM-PHASE0.txt`; การทดสอบหน้าจอจำลองไม่ใช่การทดสอบ Rules ที่ติดตั้งจริง

```json
"learningHub": {
  ".read": false,
  ".write": false,

  "admins": {
    "$uid": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": false,
      ".validate": "newData.val() === true"
    }
  },

  "profiles": {
    ".read": "auth != null && root.child('learningHub/admins').child(auth.uid).val() === true",
    "$uid": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": "auth != null && auth.uid === $uid",
      ".validate": "!newData.exists() || newData.hasChildren(['displayName', 'email', 'createdAt', 'updatedAt'])",
      "displayName": {
        ".validate": "newData.isString() && newData.val().length <= 120"
      },
      "email": {
        ".validate": "newData.isString() && newData.val() === auth.token.email && newData.val().length <= 254"
      },
      "createdAt": {
        ".validate": "newData.isNumber()"
      },
      "updatedAt": {
        ".validate": "newData.isNumber()"
      },
      "$other": {
        ".validate": false
      }
    }
  },

  "teacherRequests": {
    ".read": "auth != null && root.child('learningHub/admins').child(auth.uid).val() === true",
    "$uid": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": "auth != null && (root.child('learningHub/admins').child(auth.uid).val() === true || (auth.uid === $uid && !root.child('learningHub/teacherApprovals').child($uid).exists() && ((!newData.exists() && data.child('status').val() === 'pending') || (newData.exists() && newData.child('status').val() === 'pending'))))",
      ".validate": "!newData.exists() || newData.hasChildren(['status', 'displayName', 'email', 'school', 'subjects', 'note', 'requestedAt', 'updatedAt'])",
      "status": {
        ".validate": "newData.isString() && (newData.val() === 'pending' || newData.val() === 'approved' || newData.val() === 'rejected' || newData.val() === 'revoked')"
      },
      "displayName": {
        ".validate": "newData.isString() && newData.val().length <= 120"
      },
      "email": {
        ".validate": "newData.isString() && newData.val().length <= 254 && (root.child('learningHub/admins').child(auth.uid).val() === true || newData.val() === auth.token.email)"
      },
      "school": {
        ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 120"
      },
      "subjects": {
        ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 160"
      },
      "note": {
        ".validate": "newData.isString() && newData.val().length <= 300"
      },
      "requestedAt": {
        ".validate": "newData.isNumber()"
      },
      "updatedAt": {
        ".validate": "newData.isNumber()"
      },
      "reviewedAt": {
        ".validate": "newData.isNumber()"
      },
      "reviewedBy": {
        ".validate": "newData.isString()"
      },
      "$other": {
        ".validate": false
      }
    }
  },

  "teacherApprovals": {
    ".read": "auth != null && root.child('learningHub/admins').child(auth.uid).val() === true",
    "$uid": {
      ".read": "auth != null && auth.uid === $uid",
      ".write": "auth != null && root.child('learningHub/admins').child(auth.uid).val() === true",
      ".validate": "!newData.exists() || (newData.hasChildren(['enabled', 'approvedAt', 'approvedBy']) && newData.child('enabled').val() === true)",
      "enabled": {
        ".validate": "newData.isBoolean()"
      },
      "approvedAt": {
        ".validate": "newData.isNumber()"
      },
      "approvedBy": {
        ".validate": "newData.isString()"
      },
      "$other": {
        ".validate": false
      }
    }
  }
}
```

## ตั้งแอดมินคนแรก

1. Login ด้วยบัญชี Google ที่จะเป็นแอดมินอย่างน้อยหนึ่งครั้ง
2. ดู UID ของบัญชีนั้นจาก Firebase Authentication หรือจากหน้า `admin.html`
3. ใน Firebase Realtime Database เพิ่มค่า:

```text
learningHub/admins/{uid} = true
```

4. กลับมาโหลด `admin.html` ใหม่ เมนูอนุมัติครูจึงจะเปิด

หน้าเว็บไม่มีปุ่มเพิ่มแอดมินให้ตัวเอง และ Rules ไม่อนุญาตให้เว็บเขียนกิ่ง `admins` เพื่อลดความเสี่ยงจากการยกระดับสิทธิ์

## ก่อนนำขึ้นใช้งานจริง

- สำรอง Rules เดิมก่อนทุกครั้ง
- Merge เฉพาะกิ่ง `learningHub`
- ทดสอบบัญชีนักเรียนว่าเขียน `teacherApprovals` ไม่ได้
- ทดสอบบัญชีครูว่าอ่านรายการคำขอทั้งหมดไม่ได้
- ทดสอบแอดมินว่าอนุมัติ ปฏิเสธ และถอนสิทธิ์ได้
- ตรวจว่า Quiz และ Simulation เดิมยังอ่าน/เขียนเส้นทางของตนได้
