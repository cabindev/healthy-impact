---
name: Healthy Impact
description: ระบบเก็บข้อมูลผลกระทบด้านสุขภาวะ — ฟอร์มภาคสนามที่กรอกเร็ว ผิดยาก น่าเชื่อถือ
colors:
  field-green: "#16A34A"
  field-green-deep: "#15803D"
  field-green-focus: "#22C55E"
  field-green-wash: "#F0FDF4"
  ink-night: "#111827"
  ink: "#1F2937"
  ink-soft: "#374151"
  muted: "#6B7280"
  faint: "#9CA3AF"
  line: "#F3F4F6"
  line-strong: "#E5E7EB"
  canvas: "#F9FAFB"
  surface: "#FFFFFF"
  risk-low: "#059669"
  risk-low-wash: "#ECFDF5"
  risk-warn: "#D97706"
  risk-warn-wash: "#FFFBEB"
  risk-danger: "#EA580C"
  risk-danger-wash: "#FFF7ED"
  risk-critical: "#DC2626"
  risk-critical-wash: "#FEF2F2"
  info-wash: "#EFF6FF"
typography:
  headline:
    fontFamily: "system sans (Arial, Helvetica, Thai system fallback)"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  title:
    fontFamily: "system sans (Arial, Helvetica, Thai system fallback)"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "system sans (Arial, Helvetica, Thai system fallback)"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system sans (Arial, Helvetica, Thai system fallback)"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  numeric:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.field-green}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.field-green-deep}"
    textColor: "{colors.surface}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  badge-risk:
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: Healthy Impact

## 1. Overview

**Creative North Star: "สมุดบันทึกภาคสนาม (The Field Ledger)"**

ระบบนี้คือคลิปบอร์ดดิจิทัลที่ อสม. และเจ้าหน้าที่ถือลงพื้นที่ — เปิดบนมือถือกลางแดด กรอกขณะยืน สัญญาณไม่แน่นอน ทุกหน้าจอจึงต้อง **เป็นระเบียบ ตัวเลขชัด กรอกไว และไว้ใจได้** เหมือนแบบฟอร์มสาธารณสุขที่ดีที่สุด แต่เร็วและฉลาดกว่ากระดาษ ความน่าเชื่อถือมาจากความสะอาดและโครงสร้างที่อ่านง่าย ไม่ใช่จากการตกแต่ง

พื้นหลังเทาอ่อน (`canvas` #F9FAFB) คั่นการ์ดสีขาวที่ขอบบางคมชัด สีเขียวสาธารณสุข (`field-green` #16A34A) ปรากฏเฉพาะจุดที่มีความหมาย — ปุ่มหลัก เมนูที่เลือกอยู่ สถานะสำเร็จ — ไม่ละเลงทั้งจอ ตัวเลข (คะแนน AUDIT, BMI, ปริมาณ) ใช้ฟอนต์ monospace เพื่อให้กวาดสายตาเทียบกันได้

ระบบนี้ **ปฏิเสธ**: หน้าตาราชการเก่าที่แน่นทึบอ่านยาก, สีสันฉูดฉาดแบบการ์ตูน, เอฟเฟกต์หรูหรา (glassmorphism, gradient, เงาฟุ้ง), และเทมเพลต SaaS ฝรั่ง (hero-metric, card grid ซ้ำ ๆ, eyebrow ตัวพิมพ์เล็กทุก section)

**Key Characteristics:**
- แบนเป็นค่าเริ่มต้น — แยกชั้นด้วยเส้นขอบและพื้นเทา ไม่ใช่เงา
- เขียวคือสำเนียง ไม่ใช่พื้น — accent ที่ใช้อย่างจำกัด
- ตัวเลขเป็น monospace เสมอ
- contrast สูง ตัวอักษรอ่านออกกลางแดด ปุ่มใหญ่แตะด้วยนิ้วโป้ง
- คำอธิบาย (tooltip/modal) ช่วยให้คนไม่ถนัดเทคเข้าใจศัพท์ AUDIT/BMI

## 2. Colors

พาเลตต์เป็นเทากลางจำนวนมาก + เขียวสาธารณสุขหนึ่งเดียว + สเกลความเสี่ยง 4 ขั้นที่สื่อความหมายทางคลินิก

### Primary
- **เขียวสาธารณสุข / Field Green** (#16A34A): ปุ่มหลัก เมนูที่เลือกอยู่ โลโก้ HI สถานะสำเร็จ เส้นโฟกัส input ใช้อย่างจำกัด ≤10% ของพื้นที่จอ
- **Field Green Deep** (#15803D): สถานะ hover ของปุ่มหลักเท่านั้น
- **Field Green Focus** (#22C55E): เส้นขอบ input ตอน focus
- **Field Green Wash** (#F0FDF4): พื้นอ่อนของตัวเลือกที่ถูกเลือก (radio/checkbox pill)

### Neutral
- **Ink Night** (#111827): พื้น sidebar เข้ม
- **Ink** (#1F2937): หัวข้อ ตัวเลขเด่น
- **Ink Soft** (#374151): ข้อความเนื้อหา
- **Muted** (#6B7280): ป้ายกำกับ ข้อความรอง
- **Faint** (#9CA3AF): placeholder, hint — ห้ามใช้กับ body text
- **Line** (#F3F4F6): เส้นขอบการ์ด เส้นคั่น
- **Line Strong** (#E5E7EB): เส้นขอบ input
- **Canvas** (#F9FAFB): พื้นหลังหน้า
- **Surface** (#FFFFFF): พื้นการ์ด

### Tertiary (สเกลความเสี่ยง — clinical semantic)
- **Risk Low** (#059669 / wash #ECFDF5): เสี่ยงต่ำ / ผ่าน / ตรวจสอบแล้ว
- **Risk Warn** (#D97706 / wash #FFFBEB): เสี่ยง / เกณฑ์ดื่มหนัก
- **Risk Danger** (#EA580C / wash #FFF7ED): อันตราย
- **Risk Critical** (#DC2626 / wash #FEF2F2): ติดสุรา / ไม่เข้าเกณฑ์ / error
- **Info Wash** (#EFF6FF): กล่องคำอธิบาย (นิยามเครื่องดื่มแอลกอฮอล์)

### Named Rules
**The One-Green Rule.** เขียวมีเสียงเดียว ใช้กับ "การกระทำหลัก/สถานะบวก" เท่านั้น ห้ามใช้เขียวเป็นพื้นหลังกว้าง หรือทาเขียวหลายเฉดในจอเดียวเพื่อความสวย ความหายากของมันคือสิ่งที่ทำให้มันมีความหมาย

**The Clinical-Color Rule.** สี risk-* สื่อ "ระดับ" ไม่ใช่ "ตกแต่ง" — ใช้เฉพาะกับผลคะแนน/สถานะที่มีเกณฑ์จริงเท่านั้น ห้ามหยิบ amber/orange/red มาใช้พล่อย ๆ

## 3. Typography

**Body/UI Font:** System sans (Arial, Helvetica + ฟอนต์ไทยของระบบ) — ผ่าน `--font-geist-sans` ที่ผูกไว้แต่ body bind เป็น system stack
**Numeric Font:** Geist Mono (ui-monospace fallback)

**Character:** เรียบ เป็นกลาง อ่านง่ายทุกขนาดหน้าจอ ไม่มีบุคลิกฟอนต์ที่แย่งความสนใจ — งานคือให้อ่านข้อมูลออกเร็ว ไม่ใช่อวดตัวอักษร ตัวเลขแยกไปใช้ monospace เพื่อการเทียบค่าในแนวตั้ง

### Hierarchy
- **Headline** (600, 1.25rem / text-xl, lh 1.4): ชื่อหน้า ("แบบสอบถาม", "คะแนน AUDIT")
- **Title** (600, 1rem / text-base, lh 1.4): หัว section ในฟอร์ม, หัว modal
- **Body** (400, 0.875rem / text-sm, lh 1.5): ข้อความ UI ส่วนใหญ่ คำตอบในฟอร์ม
- **Label** (500, 0.75rem / text-xs): ป้ายฟิลด์ หัวตาราง badge
- **Numeric** (Geist Mono, 0.75–1.5rem): คะแนน AUDIT, BMI, ช่วงคะแนน, ปริมาณ

### Named Rules
**The Numbers-Are-Mono Rule.** ตัวเลขที่ต้องเทียบ/อ่านแม่น (คะแนน ช่วงเกณฑ์ ปริมาณ) ใช้ monospace เสมอ เพื่อให้หลักตรงกันและกวาดสายตาได้

**The No-Faint-Body Rule.** `faint` (#9CA3AF) ใช้ได้แค่ placeholder/hint ห้ามใช้กับเนื้อหาจริง — body ต้อง `ink-soft` ขึ้นไปเพื่อ contrast ≥4.5:1 (อ่านกลางแดด)

## 4. Elevation

ระบบนี้ **แบนโดยค่าเริ่มต้น** ความลึกมาจากการแยกชั้นด้วยสี (พื้นเทา `canvas` ดันการ์ดขาว `surface` ขึ้นมา) และเส้นขอบบาง ไม่ใช่เงา การ์ดทั้งหมดใช้ `border` สี `line` ไม่มี box-shadow เงาปรากฏ **เฉพาะของที่ลอยเหนือ flow จริง ๆ** เท่านั้น — modal, popover/tooltip, dropdown

### Shadow Vocabulary
- **Overlay Float** (`box-shadow: 0 10px 25px rgba(0,0,0,0.10)` / shadow-xl): tooltip, dropdown ตำบล
- **Modal Lift** (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)` / shadow-2xl): popup "วิธีคิดคะแนน"

### Named Rules
**The Flat-Ledger Rule.** การ์ด section, แถวข้อมูล, badge — แบนหมด แยกด้วยเส้นขอบ `line` + พื้น `canvas` เงาคือสัญญาณ "ลอยอยู่ชั่วคราว" (overlay) ไม่ใช่เครื่องประดับการ์ด ถ้าใส่เงาใต้การ์ดนิ่ง = ผิด

## 5. Components

### Buttons
- **Shape:** มุมโค้งนุ่ม (8px / rounded-lg)
- **Primary:** พื้น `field-green` ตัวอักษรขาว, padding 10px 24px (px-6 py-2.5), font-semibold — ใช้กับการกระทำหลักหนึ่งเดียวต่อหน้าจอ
- **Hover / Focus:** พื้นเข้มขึ้นเป็น `field-green-deep`, `transition-colors`
- **Ghost / Cancel:** ไม่มีพื้น ตัวอักษร `muted` hover เป็น `ink-soft` — ปุ่มรอง เช่น "ยกเลิก"
- **Destructive:** พื้น `risk-critical` (#DC2626) สำหรับ "บันทึกเป็นผู้ไม่เข้าเกณฑ์"; ปุ่มลบใช้ขอบ+ตัวอักษรแดง ไม่มีพื้น

### Inputs / Fields
- **Style:** พื้น `surface`, ขอบ `line-strong` (#E5E7EB) 1px, มุม 8px, padding 8px 12px, ตัวอักษร `ink`
- **Focus:** ขอบเปลี่ยนเป็น `field-green-focus` (#22C55E), ไม่มี glow — `focus:outline-none focus:border-green-500`
- **Choice pills (radio/checkbox):** ปุ่มขอบ `line-strong`; ตอนเลือก = ขอบ `field-green-focus` + พื้น `field-green-wash` + ตัวอักษรเข้ม
- **Error / hint:** ข้อความเล็กใต้ฟิลด์ — แดง `risk-critical` สำหรับ error, `risk-low` สำหรับยืนยันค่าที่ถูก

### Cards / Containers (Section)
- **Corner:** 12px (rounded-xl)
- **Background:** `surface` ขาว บนพื้น `canvas`
- **Border:** `line` (#F3F4F6) 1px — **ไม่มีเงา**
- **Header:** มี badge เลขกลม `field-green` พื้นขาว + หัวข้อ title
- **Internal Padding:** 20px (p-5)

### Badges / Chips
- **Style:** มุมกลมเต็ม (rounded-full), text-[11px], pad 2px 8px
- **Risk:** ตัวอักษร+พื้น wash ตามสเกล risk-* (เช่น เสี่ยงต่ำ = `risk-low` บน `risk-low-wash`)
- **Status:** ✓ เขียวสำหรับ "ตรวจสอบแล้ว", แดงอ่อนสำหรับ "ไม่เข้าเกณฑ์", role = เทากลาง

### Navigation (Sidebar)
- **Style:** พื้น `ink-night` (#111827) ตัวอักษรขาวจาง; รายการที่เลือก = พื้น `field-green` ตัวอักษรขาว font-semibold
- **Collapsible:** ย่อ (w-16, ไอคอนกลาง + tooltip ชื่อ) / ขยาย (w-64, ไอคอน + ชื่อ + คำอธิบาย), `transition-all duration-300`
- **Mobile:** เลื่อนเข้า/ออกด้วยปุ่ม hamburger + overlay ดำคลิกปิด

### Overlays (Tooltip / Modal — signature)
- **Tooltip ℹ️:** popover เปิดผ่าน **portal ไป body** + clamp ขอบจอ (หนีกรอบ overflow-hidden ของการ์ด), เงา Overlay Float
- **Modal "วิธีคิดคะแนน":** การ์ดกลางจอ มุม 16px (rounded-2xl), เงา Modal Lift, backdrop `rgba(0,0,0,0.40)`, ปิดด้วย X / คลิกพื้นหลัง / Esc

## 6. Do's and Don'ts

### Do:
- **Do** ใช้ `field-green` กับการกระทำหลัก/สถานะบวกเท่านั้น (≤10% ของจอ) — The One-Green Rule
- **Do** แยกชั้นด้วยเส้นขอบ `line` + พื้น `canvas` การ์ดแบนไม่มีเงา — The Flat-Ledger Rule
- **Do** ใช้ `ink-soft` ขึ้นไปกับ body text เสมอ; `faint` แค่ placeholder/hint (contrast ≥4.5:1 อ่านกลางแดด)
- **Do** ใช้ monospace กับตัวเลขที่ต้องเทียบ (คะแนน/ปริมาณ/เกณฑ์)
- **Do** ทำปุ่ม/target ใหญ่พอแตะด้วยนิ้วโป้ง (≥44px) ออกแบบมือถือก่อนค่อยขยายเดสก์ท็อป
- **Do** render tooltip/modal ผ่าน portal เพื่อหนี overflow-hidden ของการ์ด
- **Do** ใส่ปุ่มอธิบาย (ℹ️/modal) ข้างศัพท์เทคนิค (AUDIT/BMI) เสมอ

### Don't:
- **Don't** ทำหน้าตา **ราชการเก่า แน่น อ่านยาก** — ตารางทึบ ตัวอักษรเล็ก ยัดทุกอย่างหน้าเดียว ช่องว่างน้อย
- **Don't** ใช้สี **ฉูดฉาด/การ์ตูน** — สีจัดหลายสี ไอคอนเยอะเกิน
- **Don't** ใช้ **glassmorphism, gradient text, เงาฟุ้ง** หรือเอฟเฟกต์ตกแต่งที่รบกวนการอ่าน/กรอก
- **Don't** หยิบเทมเพลต **SaaS ฝรั่ง** — hero-metric, identical card grid, eyebrow ตัวพิมพ์เล็กทุก section
- **Don't** ใส่เงาใต้การ์ดที่นิ่ง — เงาสงวนไว้สำหรับ overlay ที่ลอยจริงเท่านั้น
- **Don't** ทาเขียวเป็นพื้นกว้างหรือหลายเฉดในจอเดียว
- **Don't** ใช้สี risk-* (amber/orange/red) กับอะไรที่ไม่ใช่ผลคะแนน/สถานะที่มีเกณฑ์จริง
