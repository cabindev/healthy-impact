---
target: รายการแบบสอบถาม + Export flow (/dashboard/surveys)
total_score: 26
p0_count: 0
p1_count: 3
timestamp: 2026-06-14T15-10-29Z
slug: app-dashboard-surveys
---
# Critique: รายการแบบสอบถาม + Export flow (/dashboard/surveys)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | export ไม่มี progress/feedback ตอนดาวน์โหลด |
| 2 | Match System / Real World | 3 | "เลือก Export" vs "รายงาน/Export" สองเมนูแยกไม่ออก |
| 3 | User Control and Freedom | 3 | เลือกข้ามหน้าไม่ได้, ล้าง/แก้ selection ต้องอยู่หน้าเดียว |
| 4 | Consistency and Standards | 2 | ตารางแบบสอบถามเดียวกันทำงานต่างกัน 3 หน้า (ลิงก์ "ดู" vs คลิกเลือก); 2 เมนู Export |
| 5 | Error Prevention | 3 | n/a มาก — ไม่มี action ทำลายข้อมูล |
| 6 | Recognition Rather Than Recall | 2 | ต้องจำว่าหน้าไหนค้นหา หน้าไหนเลือก (hidden navigation) |
| 7 | Flexibility and Efficiency | 2 | งานเดียว (หา→เลือก→export) ถูกตัดครึ่งคนละหน้า; หน้าค้นหาเลือกไม่ได้ หน้าเลือกค้นไม่ได้ |
| 8 | Aesthetic and Minimalist | 3 | sidebar 6 เมนู + หน้า export แยก = nav ไม่ minimal (ตัวตารางเองสะอาด) |
| 9 | Error Recovery | 2 | ไม่มี state จัดการ export ล้มเหลว |
| 10 | Help and Documentation | 3 | tooltip/modal ที่อื่นดี; flow นี้ไม่มีจุดต้องอธิบาย |
| **Total** | | **26/40** | **Acceptable — ต้องปรับโครงสร้างก่อนผู้ใช้พอใจ** |

## Anti-Patterns Verdict
**LLM:** ไม่ใช่ AI slop เชิงภาพ — flat-ledger, one-green, mono numbers ตรง DESIGN.md. ปัญหาไม่ใช่ความสวย แต่เป็น **information architecture**: แก้ปัญหา "เลือก export" ด้วยการสร้างหน้าใหม่ (separate-page-as-first-thought) แทนที่จะเสริมความสามารถในตารางที่มีอยู่ — แบบเดียวกับ anti-pattern "modal as first thought" ของ product register.
**Deterministic scan:** `detect.mjs` → `[]` (สะอาด ทั้ง 4 ไฟล์). ไม่มี side-stripe/gradient-text/eyebrow/glass.
**Visual overlay:** ไม่ได้รัน (หน้า auth-gated) — ใช้ source review แทน.

## Overall Impression
ตัวตารางและ search ทำได้ดีและ on-brand แต่ **flow แตกเป็น 3 หน้า** (/surveys ค้นหา · /surveys/export เลือก · /report สถิติ+export ทั้งหมด) สำหรับสิ่งที่ในหัวผู้ใช้คือ "บัญชีแบบสอบถามเล่มเดียว". โอกาสใหญ่สุด: ยุบ "หา→เลือก→export" ให้จบในตารางเดียวที่ /surveys แล้วลด sidebar ให้ลีน.

## What's Working
- **Search บน /surveys** — debounce, URL `?q=`, ค้น 8 ฟิลด์, ปุ่มล้าง ✕ ครบ แชร์ลิงก์ได้
- **ตาราง flat-ledger** — badge ความเสี่ยง, ตัวเลข mono, ✓ ตรวจสอบแล้ว, ไม่เข้าเกณฑ์ chip — ตรง DESIGN.md
- **Export route รับ `ids`** — backend พร้อมต่อยอด (เลือก/ทั้งหมด) แบบ backward-compatible

## Priority Issues

**[P1] ตารางเดียวกัน 3 หน้า → ผู้ใช้ต้องสร้างแผนที่ในหัว**
- Why: supervisor ที่จะ "หาแบบสอบถาม X แล้ว export" ต้องค้นที่ /surveys → ไป /surveys/export (ซึ่ง**ค้นหาไม่ได้**) → หาใหม่จาก 500 แถว → เลือก → export. context-switch + memory-bridge เต็ม ๆ
- Fix: ยุบ selection+export เข้า /surveys, ลบหน้า /surveys/export
- Command: `/impeccable craft` (selectable list) → `/impeccable distill`

**[P1] Sidebar บวม + 2 เมนู "Export" แยกไม่ออก**
- Why: 6 เมนู เกิน Miller (~5); "เพิ่มแบบสอบถาม" ซ้ำปุ่ม + บนหน้า list (nav ควรเป็น "ที่" ไม่ใช่ "การกระทำ"); "เลือก Export" กับ "รายงาน/Export" Jordan แยกไม่ออก
- Fix: เหลือ 4 — ภาพรวม/แบบสอบถาม/รายงาน/ผู้ใช้งาน
- Command: `/impeccable distill`

**[P1] field-first พัง: ตาราง export กว้าง + target เล็ก**
- Why: หน้า export 7 คอลัมน์+checkbox บนมือถือแย่; checkbox ~16px ต่ำกว่า 44px มาก; ปุ่ม Export มุมขวาบน นอก thumb zone
- Insight: จริง ๆ "เลือก export" เป็นงานของ **supervisor บนเดสก์ท็อป** (ตาม PRODUCT.md) — field worker บนมือถือแค่ "เพิ่ม/ดู". การออกแบบควรสะท้อนสิ่งนี้: list สะอาดเร็วบนมือถือ, affordance เลือก+export เด่นบนเดสก์ท็อปแต่ไม่เกะกะมือถือ
- Command: `/impeccable adapt`

**[P2] affordance แถวไม่สม่ำเสมอข้ามหน้า**
- Why: /surveys แถวมีลิงก์ "ดู" ขวาสุด; /surveys/export แถวคลิก=เลือก — หน้าตาเหมือนกันแต่ทำคนละอย่าง (Nielsen #4)
- Fix: row click = ดูรายละเอียด (เหมือนเดิม), checkbox = เลือก แยกชัด, target ≥44px
- Command: `/impeccable craft`

## Persona Red Flags

**สมพร (อสม. ภาคสนาม, มือถือกลางแดด — project persona):** เปิด /surveys เพื่อเพิ่ม/ดู แต่เจอ sidebar ยาวขึ้น + เมนู "เลือก Export" ที่ไม่เกี่ยวกับงานเขาเลย → noise; ถ้าเผลอเข้า /surveys/export ตารางกว้าง checkbox จิ๋วบนมือถือ กดยาก

**หัวหน้าโครงการ (supervisor, เดสก์ท็อป — project persona):** อยาก export เฉพาะ "อำเภอเมือง ที่ตรวจสอบแล้ว" → ค้นได้ที่ /surveys แต่เลือกไม่ได้; ไปหน้า export เลือกได้แต่ค้นไม่ได้ → ต้องไล่ทีละแถวจาก 500 รายการ. งานหลักของ user รองทำได้แย่สุด

**Alex (power user):** ไม่มี bulk จากผลค้นหา ("เลือกผลที่ค้นทั้งหมด"), ไม่มี shortcut, ต้องสลับหน้า — ช้า

## Minor Observations
- export ไม่มี loading/feedback — กดแล้วเงียบจนไฟล์เด้ง (P3)
- /report ก็มีปุ่ม export-all อีกที่ — ทับซ้อนกับ "Export ทั้งหมด" ที่ควรอยู่บน list (P2)
- "ลำดับ" เป็น index ของผลลัพธ์ (รีนัมเบอร์ตอนค้น) — โอเค แต่ควรสื่อว่าไม่ใช่เลขถาวร

## Questions to Consider
- ถ้า "เลือก export" คืองานของ supervisor บนเดสก์ท็อป — มันควรเป็น mode บนตารางเดียว ไม่ใช่หน้าแยกใช่ไหม?
- /report ควรเหลือแค่ "สถิติภาพรวม" แล้วย้าย export ทั้งหมด/เลือกไปอยู่กับ list ที่ค้นได้ไหม?
- ตารางเดียวที่ค้น+เลือก+export ได้ ลด cognitive load ลงเท่าไรเทียบกับสลับ 3 หน้า?
