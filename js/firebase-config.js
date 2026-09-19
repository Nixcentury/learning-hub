/* ==============================================================
   Firebase กลางของ Learning Hub
   ทุกหน้า HTML ลูกต้อง import ไฟล์นี้แทนการตั้งค่า Firebase ซ้ำ
================================================================ */

import {
  getApps,
  initializeApp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfkxDDnbzLUv85yDwqSpZwPCORx_eCGuo",
  authDomain: "examateapp-1007d.firebaseapp.com",
  databaseURL:
    "https://examateapp-1007d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "examateapp-1007d",
  storageBucket: "examateapp-1007d.firebasestorage.app",
  messagingSenderId: "791216427108",
  appId: "1:791216427108:web:ccf63a9cc416650877cf71",
  measurementId: "G-0HPEFRXYW5",
};

const hubAppName = "learningHub";
const existingApp = getApps().find((app) => app.name === hubAppName);

export const firebaseApp = existingApp ?? initializeApp(firebaseConfig, hubAppName);
