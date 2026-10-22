import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { DRINK_GROUPS, drinkGroupOf, emptyDrinkCounts, type DrinkGroup } from './drink-groups'

// สรุปจำนวนผู้ดื่มแต่ละกลุ่ม (AUDIT) แยกตามพื้นที่ระดับถัดลงไปจากตัวกรองที่เลือก
// ใช้ร่วมกันระหว่างหน้ารายการแบบสอบถามและ export excel ให้ตัวเลขตรงกันเสมอ

export { DRINK_GROUPS, type DrinkGroup }

export type AreaLevel = 'province' | 'amphoe' | 'tambon' | 'village'
export const AREA_LABEL: Record<AreaLevel, string> = { province: 'จังหวัด', amphoe: 'อำเภอ', tambon: 'ตำบล', village: 'หมู่บ้าน' }

export type DrinkSummaryRow = { name: string; counts: Record<DrinkGroup, number>; total: number }
export type DrinkSummary = { level: AreaLevel; rows: DrinkSummaryRow[]; totals: DrinkSummaryRow }

export const UNSPECIFIED = 'ไม่ระบุ'

// เลือกจังหวัดแล้ว → แตกเป็นอำเภอ ฯลฯ; เลือกถึงหมู่บ้านแล้วไม่มีระดับต่ำกว่า จึงแสดงหมู่บ้านนั้นแถวเดียว
export function nextLevel(f: { province?: string; amphoe?: string; tambon?: string }): AreaLevel {
  if (f.tambon) return 'village'
  if (f.amphoe) return 'tambon'
  if (f.province) return 'amphoe'
  return 'province'
}

// นับเฉพาะผู้เข้าเกณฑ์ — ผู้ไม่เข้าเกณฑ์ไม่ได้ตอบส่วนที่ 3
export async function getDrinkSummary(where: Prisma.SurveyWhereInput, level: AreaLevel): Promise<DrinkSummary> {
  const surveys = await prisma.survey.findMany({
    where: { AND: [where, { eligible: true }] },
    select: {
      province: true, amphoe: true, tambon: true, villageName: true,
      alcohol: { select: { q1Frequency: true, riskLevel: true } },
    },
  })

  const map = new Map<string, DrinkSummaryRow>()
  const totals: DrinkSummaryRow = { name: 'รวม', counts: emptyDrinkCounts(), total: 0 }
  for (const s of surveys) {
    const group = drinkGroupOf(s.alcohol)
    if (!group) continue
    const name = (level === 'village' ? s.villageName : s[level])?.trim() || UNSPECIFIED
    const row = map.get(name) ?? { name, counts: emptyDrinkCounts(), total: 0 }
    row.counts[group]++
    row.total++
    map.set(name, row)
    totals.counts[group]++
    totals.total++
  }

  // มาก→น้อย, "ไม่ระบุ" ไว้ท้ายสุด
  const rows = [...map.values()].sort((a, b) =>
    a.name === UNSPECIFIED ? 1 : b.name === UNSPECIFIED ? -1 : b.total - a.total || a.name.localeCompare(b.name, 'th'),
  )
  return { level, rows, totals }
}
