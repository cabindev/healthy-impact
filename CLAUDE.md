@AGENTS.md

# Healthy Impact — healthy-impact

ระบบเก็บข้อมูล**ผลกระทบตามตัวชี้วัด สสส.** จากแบบสอบถามประชาชนไทยอายุ 15 ปีขึ้นไป
(พักอาศัยต่อเนื่อง > 6 เดือน) เก็บได้ 3 ประเภทสถานที่: หมู่บ้าน / สถานประกอบการ / สถานศึกษา

> โปรเจกต์พี่น้องกับ `cm-local` (กพร.) — reuse โครงสร้าง auth/infra แต่แยก DB และ domain

## 🎨 Design Context (impeccable)
- **Register:** `product` · อ่าน [`PRODUCT.md`](PRODUCT.md) (กลยุทธ์: ผู้ใช้/จุดประสงค์/หลักการ) และ [`DESIGN.md`](DESIGN.md) (ระบบภาพ: สี/ฟอนต์/คอมโพเนนต์) ก่อนทำงาน UI
- หลักการหลัก: กรอกเร็วผิดยาก · ภาคสนาม(มือถือ)มาก่อน · เข้าใจง่ายสำหรับคนไม่ถนัดเทค · น่าเชื่อถือไม่ราชการเก่า · ตรงมาตรฐาน สสส./AUDIT
- งานออกแบบ/ปรับ UI ใช้ `/impeccable <command>` (craft·critique·polish·layout·…)

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.4 (Turbopack, App Router) |
| Auth | NextAuth v4 (Credentials, JWT) |
| ORM | Prisma + MySQL |
| UI | Tailwind CSS + Lucide React |
| Charts | Recharts |
| Export | xlsx |
| Notifications | Telegram Bot API |

## Commands
```bash
npm run dev              # dev server (port 3000)
npm run build            # production build — รันก่อน push เสมอ
npx prisma migrate dev   # run migration
npx prisma studio        # DB GUI
```

## แบบสอบถาม (4 ส่วน) → Prisma models
- **ส่วนที่ 1 ข้อมูลทั่วไป** → `Survey` (demographics, consent, น้ำหนัก/ส่วนสูง/รอบเอว, โรค NCDs, การศึกษา)
- **ส่วนที่ 2 การสูบบุหรี่** → `SurveyTobacco`
- **ส่วนที่ 3 แอลกอฮอล์ (AUDIT 10 ข้อ + คะแนน)** → `SurveyAlcohol`
- **ส่วนที่ 4 เมาแล้วขับ** → ฟิลด์ `ddDroveAfterDrink` / `ddInjured` ใน `Survey`

`siteType` (enum `CollectionSite`): VILLAGE | WORKPLACE | SCHOOL

## Models
```
User, Survey, SurveyTobacco, SurveyAlcohol
```

## Reuse จาก cm-local (ไม่ต้องเขียนใหม่)
- `server.js`, `proxy.ts`, config ต่าง ๆ
- `app/lib/*` (prisma, telegram, auth, province-zone, compressImage)
- `app/lib/configs/auth/authOptions.ts` (เปลี่ยน cookie name แล้ว)
- `app/api/auth/**` (nextauth, signup, forgot/reset password)
- `app/components/auth/**`, `app/auth/**`
- `app/data/tambon.json` + `app/hooks/useTambonSearch.ts` (geo picker)

## เสร็จแล้ว
- ฟอร์มบันทึกแบบสอบถาม 4 ส่วน (`app/dashboard/surveys/new/SurveyForm.tsx`)
- ตรรกะคำนวณคะแนน AUDIT (`app/lib/audit.ts`) → `auditScore` / `riskLevel` (คำนวณ live + ตอนบันทึก)
- ตัวเลือกทั้งหมด (`app/lib/survey-options.ts`), server action (`app/actions/survey.ts`)
- หน้ารายการแบบสอบถาม + dashboard KPI

## เสร็จเพิ่ม (รอบล่าสุด)
- หน้าดูแบบสอบถามรายตัว `surveys/[id]/page.tsx` (read-only ครบ 4 ส่วน + ปุ่มแก้ไข/ลบ) + `SurveyActions.tsx`
- หน้าแก้ไข `surveys/[id]/edit/page.tsx` — reuse `SurveyForm` (รับ props `initial`/`surveyId`); action `updateSurvey()` (upsert tobacco/alcohol)
- Export Excel `app/api/report/export/route.ts` (xlsx, flatten ทุก field เป็น label ไทย) + หน้า `report` มีปุ่มดาวน์โหลด + สถิติแยกตามสถานที่
- Toggle role ที่หน้า users — `RoleSelect.tsx` + action `updateUserRole()` (เฉพาะ **SUPERADMIN**, ห้ามแก้สิทธิ์ตนเอง); helper `requireSuperAdmin()` ใน `app/lib/auth.ts`
- helper `labelOf()` ใน `survey-options.ts` (value → label สำหรับแสดงผล)

## เสร็จเพิ่ม (รอบปรับฟอร์ม)
- **เลขที่แบบสอบถาม** รันอัตโนมัติ `HI-00001` (gen จาก id ใน `createSurvey`), เอาช่องออกจากฟอร์ม, โชว์ในตาราง/หน้ารายตัว
- **วันที่เก็บข้อมูล** ใช้ `createdAt` แทน (เอา field `collectedAt` ออกจากฟอร์ม)
- **เลือกตำบล → เติมอำเภอ/จังหวัดอัตโนมัติ** — `TambonPicker.tsx` (ใช้ `useTambonSearch` + `tambon.json`)
- **Gating คัดออก**: พักอาศัย < 6 เดือน (1.6) / อายุ < 15 (1.11, เกิด > พ.ศ. 2554) → เตือน inline + บล็อกบันทึก
- **AUDIT ข้ามข้อ**: 3.1 = "ไม่เคยดื่ม" → ยุบ 3.2–3.10 (คะแนน 0) ไปส่วน 4
- **Validation**: consent ต้อง = ใช่, เลขบัตร 13 หลัก, ข้อ 2.4 ระบุจำนวนห้ามเว้นว่าง
- **BMI** (`app/lib/health.ts`: `calcBMI`/`bmiCategory`/`thaiAge`) โชว์ใน ฟอร์ม/หน้ารายตัว/export (เกณฑ์ Asia-Pacific)
- **Workflow ตรวจสอบ**: เอา field ผู้ตรวจ/วันที่ตรวจออกจากฟอร์ม → ใช้ปุ่ม `VerifyButton` ที่หน้ารายตัว (action `verifySurvey`/`unverifySurvey` stamp วันที่+ชื่อ user ที่ล็อกอิน); แสดง ✓ ในตาราง + คอลัมน์สถานะใน export

## เสร็จเพิ่ม (รอบ align ต้นฉบับ PDF + skip logic)
ผัง branch ตรงต้นฉบับครบ: 1.6 (<6ด.=จบ) · 2.2 (1,2→2.3-2.6 / 3,4,5→2.3เท่านั้น / 6→ข้าม) · 3.1 (ไม่ดื่ม→ข้าม 3.2-3.10)
- **Eligibility / จบการสัมภาษณ์**: schema เพิ่ม `eligible` + `ineligibleReason`. ถ้า 1.6<6ด. / อายุ<15 / ไม่ยินยอม → ฟอร์มเด้งแบนเนอร์ "ไม่เข้าเกณฑ์" ยุบ 1.8-1.19 + ส่วน 2/3/4 + ปุ่มเปลี่ยนเป็น "บันทึกเป็นผู้ไม่เข้าเกณฑ์" → `createIneligible()` เก็บเฉพาะพื้นที่/ผู้เก็บ/เหตุ (ไม่เก็บข้อมูลส่วนตัว/สุขภาพ). หน้ารายตัว/ตาราง/export/report แยกแสดงสถานะ; ซ่อนปุ่มแก้ไขเมื่อไม่เข้าเกณฑ์
- **3.3 เกณฑ์ตามเพศ**: โชว์ข้อความเกณฑ์ดื่มหนัก (ชาย 5 ดื่ม / หญิง 4 ดื่ม; เพศอื่นแสดงทั้งคู่) — `O.BINGE_MALE/FEMALE`
- **1.17 "ไม่มี" exclusive** กับโรคอื่น (`exclusiveNone` ใน SurveyForm)
- **3.2 ปริมาณ required** เมื่อเลือกดื่มเบียร์/เหล้า/ไวน์ (validation ใน submit)

## เสร็จเพิ่ม (เกณฑ์ทางการ + tooltip)
- เกณฑ์ AUDIT ยืนยันตรง WHO/ศวส./กรมสุขภาพจิต (สสส.): 0-7 / 8-15 / 16-19 / 20-40, จุดตัด ≥8 — ปรับชื่อกลุ่มเป็นทางการ (`ผู้ดื่มแบบเสี่ยงต่ำ/เสี่ยง/อันตราย/ติด`), เพิ่ม `RISK_ADVICE` + `RISK_BANDS` ใน `audit.ts`; recompute riskLevel record เดิมแล้ว
- **Tooltip ℹ️**: `app/components/InfoTip.tsx` (portal + clamp ขอบจอ, กว้างปรับได้ `widthPx`) + `AuditTip.tsx` (hover เล็ก) + `BmiTip.tsx`; **`AuditExplainModal.tsx`** = popup ใหญ่ "วิธีคิดคะแนน" (ตารางคะแนนนับจากข้อไหน + เกณฑ์ + ตัวอย่างนาย ก. คำนวณด้วย classifyRisk จริง) — ใช้ที่กล่องคะแนนในฟอร์ม + หน้ารายตัว

## เสร็จเพิ่ม (UI: dashboard ย่อขยาย + date picker)
- **Dashboard collapsible** (port จาก cm-local): `context/DashboardContext.tsx` (sidebarCollapsed/mobile) + `components/DashboardClient.tsx` (overlay + margin) + `Sidebar.tsx` (fixed, ย่อ w-16/ขยาย w-64, มี user+signout) + `TopNav.tsx` (ปุ่ม hamburger มือถือ) — ธีมเขียว; `layout.tsx` ห่อด้วย `DashboardProvider`
- **BirthDateInput** (`surveys/new/BirthDateInput.tsx`): พิมพ์เลขล้วน auto ใส่ `/` → `DD/MM/พ.ศ.` (เร็วสุดสำหรับคีย์ข้อมูล, โชว์วันที่อ่านง่ายยืนยัน) — แทน dropdown เดิม
- **ปุ่มบันทึก = วงกลม** "บันทึก" (w-16 h-16) ในแถบ sticky ล่าง — แดงเมื่อไม่เข้าเกณฑ์, มี aria-label เต็ม
- **PDPA ConsentModal** (`surveys/new/ConsentModal.tsx`, อ้างอิง cm-local): gate แจ้งสิทธิ์ PDPA + ติ๊กยืนยัน 2 ข้อ (วัตถุประสงค์ + ข้อมูลสุขภาพอ่อนไหว) ก่อนกรอก (เฉพาะเพิ่มใหม่ ไม่ถามตอน edit) → ยินยอมเซ็ต Q1.7=ใช่ / ไม่ยินยอมเซ็ต=ไม่ใช่ (เข้า flow ไม่เข้าเกณฑ์). ใช้ฟิลด์ `consentGiven`/`consentAt` เดิม ไม่ต้อง migrate

## 📊 Dashboard + Seed
- **Dashboard กราฟ** (`app/dashboard/page.tsx` aggregate + `components/DashboardCharts.tsx`): ใช้ **shadcn charts** (Recharts v2 + `components/ui/chart.tsx` + theme tokens ใน globals.css + `cn` ที่ `app/lib/utils.ts`). KPI 6 ใบ + area รายวัน, donut ความเสี่ยง AUDIT/เพศ (center total), bar บุหรี่/อายุ/BMI/จังหวัด. นับเฉพาะ eligible
  - **หมายเหตุ:** เคยลอง ApexCharts แต่ `react-apexcharts` พังกับ React 19 (`reading 'node'`) → ย้ายมา shadcn/Recharts v2 (อย่าใช้ react-apexcharts)
- **Seed ทดสอบ:** `node prisma/seed.mjs` → สร้าง 50 รายการสมจริง (44 เข้าเกณฑ์ + 6 ไม่เข้าเกณฑ์) **⚠️ ลบข้อมูล survey เดิมทั้งหมดก่อน seed**

## 🎨 impeccable (design context)
ติดตั้ง impeccable skills v3.5.0 ใน `.claude/skills/` + รัน init/document → มี `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json` (อ่านก่อนทำงาน UI). North Star: "สมุดบันทึกภาคสนาม" · register `product`

## ยังไม่ได้ทำ (next steps)
- ค้นหา/กรอง/แบ่งหน้า ในรายการแบบสอบถาม (ตอนนี้ `take: 100`)
- กรองช่วงเวลา/พื้นที่ ก่อน export

## AUDIT scoring
- 10 ข้อ ข้อละ 0-4 รวม 0-40; ข้อ 2 (ปริมาณ) = max ของ เบียร์/เหล้า/ไวน์ ที่ระบุว่าดื่ม
- เกณฑ์: 0-7 ต่ำ · 8-15 เสี่ยง · 16-19 อันตราย · 20+ ติด/พึ่งพา

## Environment Variables
| Variable | ใช้ที่ |
|----------|--------|
| `DATABASE_URL` | Prisma (DB: `healthy-impact`) |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | JWT / domain |
| `EMAIL_USER` / `EMAIL_PASS` | Reset password |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Notifications |
