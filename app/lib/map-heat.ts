// เฉดสีและการจับคู่ค่า → สี ของแผนที่ความเข้มข้นรายจังหวัด
// ใช้ร่วมกันระหว่างหน้าแผนที่เต็ม (dashboard/map) กับแผนที่ย่อบนหน้าภาพรวม

import { drinkGroupOf, emptyDrinkCounts, type DrinkCounts } from './drink-groups'

export type ProvinceStat = {
  province: string
  total: number
  eligible: number
  verified: number
  /** ผู้เข้าเกณฑ์ที่ดื่ม (ทุกกลุ่ม AUDIT ยกเว้นไม่ดื่ม) */
  drinkers: number
  /** ผู้เข้าเกณฑ์แยกตามกลุ่มการดื่ม */
  drink: DrinkCounts
}

export const emptyProvinceStat = (province: string): ProvinceStat =>
  ({ province, total: 0, eligible: 0, verified: 0, drinkers: 0, drink: emptyDrinkCounts() })

type StatSource = {
  province: string | null
  eligible: boolean
  verifiedAt: Date | null
  alcohol: { q1Frequency: number | null; riskLevel: string | null } | null
}

// นับทุกใบรวมที่ไม่เข้าเกณฑ์ (total) แต่ตัวเลขการดื่มนับเฉพาะผู้เข้าเกณฑ์ — ใช้ร่วมกันระหว่างแผนที่เต็มกับแผนที่ย่อ
export function buildProvinceStats(rows: StatSource[]): ProvinceStat[] {
  const m = new Map<string, ProvinceStat>()
  for (const r of rows) {
    const p = r.province?.trim()
    if (!p) continue
    const s = m.get(p) ?? emptyProvinceStat(p)
    s.total += 1
    if (r.verifiedAt) s.verified += 1
    if (r.eligible) {
      s.eligible += 1
      const g = drinkGroupOf(r.alcohol)
      if (g) {
        s.drink[g] += 1
        if (g !== 'ไม่ดื่ม') s.drinkers += 1
      }
    }
    m.set(p, s)
  }
  return [...m.values()].sort((a, b) => b.total - a.total)
}

// ไล่เฉดเขียวตามธีม 5 ขั้น · จังหวัดที่ยังไม่มีข้อมูลเป็นเทาอ่อน ให้เห็น "ช่องว่าง" ชัด
export const HEAT_RAMP = ['#DCFCE7', '#BBF7D0', '#4ADE80', '#22C55E', '#15803D']
export const HEAT_EMPTY = '#F3F4F6'

export function heatColor(value: number, max: number) {
  if (value <= 0) return HEAT_EMPTY
  const idx = Math.min(HEAT_RAMP.length - 1, Math.ceil((value / max) * HEAT_RAMP.length) - 1)
  return HEAT_RAMP[Math.max(0, idx)]
}

// ตัวเลขบนพื้นเขียวเข้มต้องเป็นสีขาวถึงจะอ่านออก
export const isDarkStep = (value: number, max: number) => value > 0 && value / max > 0.6
