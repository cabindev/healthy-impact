# SSS Impact

ระบบเก็บข้อมูล **ผลกระทบตามตัวชี้วัด สสส.** จากแบบสอบถามประชาชนไทยอายุ 15 ปีขึ้นไป
(พักอาศัยต่อเนื่อง > 6 เดือน) — เก็บได้ 3 ประเภทสถานที่: **หมู่บ้าน / สถานประกอบการ / สถานศึกษา**

> โปรเจกต์พี่น้องกับ `cm-local` (โครงการ กพร.) — reuse โครงสร้าง auth/infra แต่แยก DB และ domain
> ที่มา: แบบสอบถามเก็บข้อมูลผลกระทบตามตัวชี้วัด สสส. (4 ส่วน)

---

## เริ่มใช้งาน (Quick start)

```bash
cd /Applications/MAMP/htdocs/sss-impact
npm run dev          # http://localhost:3000
```

สร้างผู้ดูแลระบบ: สมัครผ่านหน้า `/auth/signup` แล้วตั้ง role เป็น `SUPERADMIN` ใน DB (เช่น `npx prisma studio`)

> ⚠️ ห้ามใส่ email/password จริงลงใน README หรือ repo — ตั้งรหัสผ่านที่รัดกุมเสมอ

เส้นทางหลัก: `/dashboard` → เมนู **แบบสอบถาม** → **เพิ่มแบบสอบถาม**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.4 (Turbopack, App Router) |
| Auth | NextAuth v4 (Credentials, JWT) |
| ORM | Prisma + MySQL |
| UI | Tailwind CSS v4 + Lucide React |
| Charts | Recharts |
| Export | xlsx |
| Notifications | Telegram Bot API |

---

## Commands

```bash
npm run dev              # dev server (port 3000)
npm run build            # production build — ต้องผ่านก่อน push เสมอ
npm run start            # production
npx prisma migrate dev   # สร้าง/อัปเดต migration
npx prisma studio        # ดู/แก้ข้อมูลใน DB
npx prisma generate      # regenerate client หลังแก้ schema
```

---

## โครงสร้างแบบสอบถาม → Prisma models

| ส่วน | เนื้อหา | Model / ฟิลด์ |
|------|---------|---------------|
| **1** ข้อมูลทั่วไป | demographics, consent, น้ำหนัก/ส่วนสูง/รอบเอว (Decimal), โรค NCDs, การศึกษา | `Survey` |
| **2** การสูบบุหรี่ | สถานะการสูบ, ประเภท + ปริมาณ, Fagerström | `SurveyTobacco` |
| **3** แอลกอฮอล์ | **AUDIT 10 ข้อ + คะแนน + ระดับเสี่ยง** | `SurveyAlcohol` |
| **4** เมาแล้วขับ | ดื่มแล้วขับ / บาดเจ็บ | `Survey.ddDroveAfterDrink`, `Survey.ddInjured` |

`siteType` (enum `CollectionSite`): `VILLAGE` | `WORKPLACE` | `SCHOOL`

### AUDIT scoring (`app/lib/audit.ts`)
- 10 ข้อ ข้อละ 0-4 → รวม 0-40
- **ข้อ 2 (ปริมาณ)** = `max` ของคะแนน เบียร์/เหล้า/ไวน์ เฉพาะชนิดที่ระบุว่า "ดื่ม"
- เกณฑ์ระดับเสี่ยง: `0-7` ต่ำ · `8-15` เสี่ยง · `16-19` อันตราย · `20+` ติด/พึ่งพา
- คำนวณทั้ง **live ในฟอร์ม** และตอน **บันทึกลง DB** (`auditScore`, `riskLevel`)

---

## ไฟล์สำคัญ (โค้ดที่เขียนเองสำหรับโปรเจกต์นี้)

```
prisma/schema.prisma                    # User, Survey, SurveyTobacco, SurveyAlcohol
app/lib/audit.ts                        # คำนวณคะแนน AUDIT + จัดระดับเสี่ยง
app/lib/survey-options.ts               # ตัวเลือกทุกข้อ (label/value ตาม PDF)
app/actions/survey.ts                   # createSurvey() / deleteSurvey() (server action)
app/dashboard/surveys/page.tsx          # รายการแบบสอบถาม
app/dashboard/surveys/new/page.tsx      # หน้าเพิ่มแบบสอบถาม
app/dashboard/surveys/new/SurveyForm.tsx# ฟอร์ม 4 ส่วน (client) + live AUDIT score
app/dashboard/page.tsx                  # dashboard KPI
app/dashboard/layout.tsx + components/  # Sidebar, TopNav
```

### Reuse จาก cm-local (ไม่ต้องแก้ ทำงานได้เลย)
- `server.js`, `proxy.ts`, config ทั้งหมด
- `app/lib/{prisma,telegram,auth,province-zone,compressImage}.ts`
- `app/lib/configs/auth/authOptions.ts` (เปลี่ยน cookie name แล้ว)
- `app/api/auth/**` (nextauth, signup, forgot/reset password)
- `app/components/auth/**`, `app/auth/**`
- `app/data/tambon.json` + `app/hooks/useTambonSearch.ts` (geo picker — ยังไม่ได้ต่อเข้าฟอร์ม)

---

## กติกาสำคัญ (อ่าน `AGENTS.md` / `CLAUDE.md` ก่อนแก้โค้ด)

- **ห้ามสร้าง `middleware.ts`** — ใช้ `proxy.ts` เท่านั้น (มีทั้งคู่ = build พัง)
- Cookie name = **`sss-impact.session-token`** (ต่างจาก cm-local เพื่อให้ login แยกกัน) — ทุก `getToken()` ต้องระบุ
- Server action ที่แก้ข้อมูลต้องขึ้นต้นด้วย `requireAdmin()` + เรียก `revalidatePath()`
- รัน `npm run build` ให้ผ่านก่อน commit/push เสมอ

---

## สถานะปัจจุบัน

### ✅ เสร็จแล้ว
- Schema + DB + migration (`init`) + seed admin
- Auth ครบชุด (signin/signup/forgot/reset)
- ฟอร์มแบบสอบถาม 4 ส่วน พร้อม skip logic (ส่วน 2) + live AUDIT score (ส่วน 3)
- บันทึกลง DB พร้อมคำนวณคะแนน, หน้ารายการ, dashboard KPI
- `npm run build` ผ่าน (TypeScript + ทุก route)

### 🔲 ยังไม่ได้ทำ (next steps)
1. **หน้าดู/แก้ไขแบบสอบถามรายตัว** (`app/dashboard/surveys/[id]/`)
2. **Export Excel** (`app/api/report/export/`) — มี `xlsx` ติดตั้งแล้ว
3. **Role toggle ที่หน้า users** (ตอนนี้แสดงอย่างเดียว) — ดูตัวอย่างจาก cm-local `app/actions/user.ts`
4. ต่อ **geo picker** (`useTambonSearch`) เข้าช่อง จังหวัด/อำเภอ/ตำบล ในฟอร์ม
5. กรอง/ค้นหาในหน้ารายการ + แบ่งหน้า (pagination)
6. ทดสอบ end-to-end จริง (กรอก → บันทึก → ตรวจคะแนนใน DB ด้วย `prisma studio`)

### ⚠️ ยังไม่ได้ทำการทดสอบ
build ผ่านแล้ว แต่ **ยังไม่ได้รันทดสอบกรอก-บันทึกจริงผ่านเบราว์เซอร์** — ควรทดสอบ flow เพิ่มแบบสอบถามก่อนใช้งานจริง

---

## Deployment (อนาคต — อ้างอิงจาก cm-local)

Production แบบ cm-local คือ Plesk Node.js, startup file = `server.js`, ตั้ง env ใน Plesk panel
ถ้า deploy โปรเจกต์นี้: ตั้ง `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (ตรง domain จริง),
`EMAIL_*`, `TELEGRAM_*` — และอย่าลืม URL-encode รหัสผ่าน DB ที่มี `@`/`/`
# healthy-impact
