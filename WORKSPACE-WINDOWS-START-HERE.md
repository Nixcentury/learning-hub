# หน้าต่างลอยและแบ่งจอ / Floating windows and split view

หน้าต่างงานใช้ iframe เดิม การจัดคู่ สลับด้าน ลาก และปรับขนาดไม่โหลดเนื้อหาใหม่
Arranging, swapping, dragging and resizing retain the existing iframe documents.

1. กด **แบ่งจอ** บนแถบหน้าต่าง แล้วเลือกงานที่เปิดไว้ รวมถึงงานที่ย่ออยู่
   Use **Split view** in a window toolbar and choose another open or minimized activity.
2. หรือเลือก **เปิดงานอีกชิ้นจากเมนู** แล้วเปิด Simulator ใบเรียนรู้ หรือเครื่องมืออีกชิ้น
   Alternatively, choose **Open another activity**, then open a simulator, learning sheet or other tool.
3. กด **ยกเลิก** บนแถบแจ้งเตือนเพื่อกลับไปงานแรก
   Cancel partner selection from the notice to restore the first activity.
4. ปุ่มเดิมมี **สลับตำแหน่ง** และ **หน้าต่างลอย** เมื่อจัดคู่แล้ว
   Use the same button to **Swap sides** or return to **Floating windows**.
5. หน้าต่างลอยลากที่แถบชื่อเรื่อง และปรับขนาดที่มุมล่างขวาได้ เมื่อตั้งโฟกัสที่มุม ใช้ลูกศรปรับขนาด หรือ Shift + ลูกศรเพื่อปรับเร็วขึ้น
   Drag the title bar or the bottom-right resize handle. A focused resize handle also supports arrow keys and Shift + arrow keys.

พื้นที่จอกว้างแบ่งซ้าย–ขวาเท่ากัน จอกว้างไม่เกิน 700 px วางบน–ล่างเท่ากัน
Wider screens use equal side-by-side panes; screens up to 700 px wide use equal stacked panes.

การย่อหรือปิดสมาชิกของคู่จะคืนอีกงานเป็นหน้าต่างลอย ปุ่มขยายยังเปิดงานเดียวเต็มพื้นที่ได้
Minimizing or closing a paired window returns the other to floating mode. Maximize still expands one activity.

## Verification

- `pnpm test:unit`
- `pnpm build`
- `pnpm test:workspace:browser` (set `QA_BUILT=1` for production assets)
- `pnpm test:sheet:browser` for the existing worksheet controls and print flow

The layout browser checks use local fixtures, the real Workspace, stylesheet and iframe documents, with no live accounts or database writes. A physical iPad Safari smoke test remains useful for the device's native touch and keyboard behavior.
