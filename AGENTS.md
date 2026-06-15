# Agent Rules — healthy-impact

โปรเจกต์นี้ตั้งต้นจากโครงสร้างของ `cm-local` (reuse: auth, server.js, libs)
จึงสืบทอดกติกาเดิมส่วนใหญ่ — โปรดอ่านให้ครบก่อนแก้โค้ด

## Next.js Version Warning
ใช้ Next.js **16.2.4** (Turbopack, App Router) — มี breaking changes
อ่าน `node_modules/next/dist/docs/` ก่อนเขียนโค้ดใหม่เสมอ

## Critical Rules

### proxy.ts — ห้ามสร้าง middleware.ts
ใช้ `proxy.ts` แทน `middleware.ts` สำหรับ route protection
มีทั้งสองไฟล์พร้อมกัน = build ล้มเหลว

### Cookie Name
NextAuth ใช้ custom cookie ชื่อ **`healthy-impact.session-token`**
(ต่างจาก cm-local ที่ใช้ `conmunity.session-token` — เพื่อให้ login แยกกันได้)
ทุกที่ที่ใช้ `getToken()` ต้องระบุ `cookieName: 'healthy-impact.session-token'`

### Server Actions
ทุก server action ที่แก้ไขข้อมูลต้องขึ้นต้นด้วย `requireAdmin()` จาก `@/app/lib/auth`

### DATABASE_URL บน Production
รหัสผ่านที่มี `@` หรือ `/` ต้อง URL-encode: `@` → `%40`, `/` → `%2F`

### Telegram
ใช้ `sendTelegram()` จาก `app/lib/telegram.ts` — มี error handling ภายในแล้ว

## Build Requirement
รัน `npm run build` ก่อน commit/push ทุกครั้ง — build error = ห้าม push
