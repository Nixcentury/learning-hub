import { resolve } from "node:path";
import { defineConfig } from "vite";

/*
  แต่ละหน้าหลักเป็น HTML แยกไฟล์และ Build ไปด้วยกัน
  เพิ่มหน้าใหม่ภายหลังได้โดยใส่ชื่อและไฟล์ใน input นี้
*/
export default defineConfig({
  // ใช้ path แบบ relative เพื่อให้เปิดได้ทั้ง localhost และ GitHub Pages ที่อยู่ใต้ /Physic-subject/
  base: "./",
  build: {
    rolldownOptions: {
      input: {
        hub: resolve(import.meta.dirname, "index.html"),
        admin: resolve(import.meta.dirname, "admin.html"),
      },
    },
  },
});
