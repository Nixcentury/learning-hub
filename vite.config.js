import { resolve } from "node:path";
import { defineConfig } from "vite";

/*
  แต่ละหน้าหลักเป็น HTML แยกไฟล์และ Build ไปด้วยกัน
  เพิ่มหน้าใหม่ภายหลังได้โดยใส่ชื่อและไฟล์ใน input นี้
*/
export default defineConfig({
  // ใช้เส้นทาง relative เพื่อเปิดได้ทั้ง localhost และ GitHub Pages /learning-hub/
  base: "./",
  build: {
    // Always rebuild the complete artifact so removed content cannot linger.
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        hub: resolve(import.meta.dirname, "index.html"),
        admin: resolve(import.meta.dirname, "admin.html"),
      },
    },
  },
});
