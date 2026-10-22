// กลุ่มการดื่ม (ไม่ดื่ม + 4 กลุ่ม AUDIT) — ไม่แตะ prisma จึงใช้ฝั่ง client ได้ (แผนที่/กราฟ)

export const DRINK_GROUPS = ['ไม่ดื่ม', 'ผู้ดื่มแบบเสี่ยงต่ำ', 'ผู้ดื่มแบบเสี่ยง', 'ผู้ดื่มแบบอันตราย', 'ผู้ดื่มแบบติด'] as const
export type DrinkGroup = (typeof DRINK_GROUPS)[number]
export type DrinkCounts = Record<DrinkGroup, number>

export const DRINK_SHORT: Record<DrinkGroup, string> = {
  'ไม่ดื่ม': 'ไม่ดื่ม',
  'ผู้ดื่มแบบเสี่ยงต่ำ': 'เสี่ยงต่ำ',
  'ผู้ดื่มแบบเสี่ยง': 'เสี่ยง',
  'ผู้ดื่มแบบอันตราย': 'อันตราย',
  'ผู้ดื่มแบบติด': 'ติด',
}

// โทนเขียว–ดำ–เทา: ไล่เฉดเขียว→เข้ม→ดำ ตามความรุนแรง, เทาสำหรับไม่ดื่ม (ชุดเดียวกับโดนัทหน้าภาพรวม)
export const DRINK_COLOR: Record<DrinkGroup, string> = {
  'ไม่ดื่ม': '#9CA3AF',
  'ผู้ดื่มแบบเสี่ยงต่ำ': '#86EFAC',
  'ผู้ดื่มแบบเสี่ยง': '#22C55E',
  'ผู้ดื่มแบบอันตราย': '#15803D',
  'ผู้ดื่มแบบติด': '#111827',
}

export const emptyDrinkCounts = () => Object.fromEntries(DRINK_GROUPS.map((g) => [g, 0])) as DrinkCounts

// ไม่มีส่วน 3 หรือ 3.1 = ไม่เคยดื่ม → ไม่ดื่ม; riskLevel ที่ไม่รู้จักคืน null (ไม่นับ)
export function drinkGroupOf(alcohol: { q1Frequency: number | null; riskLevel: string | null } | null | undefined): DrinkGroup | null {
  if (!alcohol || (alcohol.q1Frequency ?? 0) === 0) return 'ไม่ดื่ม'
  return (DRINK_GROUPS as readonly string[]).includes(alcohol.riskLevel ?? '') ? (alcohol.riskLevel as DrinkGroup) : null
}
