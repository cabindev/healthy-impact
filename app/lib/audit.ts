// คำนวณคะแนน AUDIT (Alcohol Use Disorders Identification Test)
// 10 ข้อ ข้อละ 0-4 คะแนน รวม 0-40
// ส่วนที่ 3.2 ของแบบสอบถามแยกตามชนิดเครื่องดื่ม (เบียร์/เหล้า/ไวน์)
// → ใช้คะแนนสูงสุดของชนิดที่ดื่มเป็นคะแนนข้อ 2 (ปริมาณต่อครั้ง)

export interface AuditAnswers {
  q1Frequency?: number | null
  beerDrink?: boolean | null
  beerAmt?: number | null
  liquorDrink?: boolean | null
  liquorAmt?: number | null
  wineDrink?: boolean | null
  wineAmt?: number | null
  q3Binge?: number | null
  q4CannotStop?: number | null
  q5FailNormal?: number | null
  q6Morning?: number | null
  q7Guilt?: number | null
  q8Blackout?: number | null
  q9Injury?: number | null
  q10Advised?: number | null
}

export type RiskLevel = 'ผู้ดื่มแบบเสี่ยงต่ำ' | 'ผู้ดื่มแบบเสี่ยง' | 'ผู้ดื่มแบบอันตราย' | 'ผู้ดื่มแบบติด'

const n = (v: number | null | undefined) => (typeof v === 'number' && !isNaN(v) ? v : 0)

// คะแนนข้อ 2 = ปริมาณสูงสุดในบรรดาชนิดที่ระบุว่าดื่ม
export function computeQ2(a: AuditAnswers): number {
  const vals: number[] = []
  if (a.beerDrink) vals.push(n(a.beerAmt))
  if (a.liquorDrink) vals.push(n(a.liquorAmt))
  if (a.wineDrink) vals.push(n(a.wineAmt))
  return vals.length ? Math.max(...vals) : 0
}

export function computeAuditScore(a: AuditAnswers): number {
  return (
    n(a.q1Frequency) +
    computeQ2(a) +
    n(a.q3Binge) +
    n(a.q4CannotStop) +
    n(a.q5FailNormal) +
    n(a.q6Morning) +
    n(a.q7Guilt) +
    n(a.q8Blackout) +
    n(a.q9Injury) +
    n(a.q10Advised)
  )
}

// เกณฑ์ AUDIT ฉบับไทย (WHO / ศูนย์วิจัยปัญหาสุรา ศวส. / กรมสุขภาพจิต — สสส. สนับสนุน)
// 0-7 เสี่ยงต่ำ · 8-15 เสี่ยง · 16-19 อันตราย · 20-40 ติดสุรา (จุดตัดผิดปกติ ≥ 8)
export function classifyRisk(score: number): RiskLevel {
  if (score <= 7) return 'ผู้ดื่มแบบเสี่ยงต่ำ'
  if (score <= 15) return 'ผู้ดื่มแบบเสี่ยง'
  if (score <= 19) return 'ผู้ดื่มแบบอันตราย'
  return 'ผู้ดื่มแบบติด'
}

export function evaluateAudit(a: AuditAnswers): { score: number; risk: RiskLevel } {
  const score = computeAuditScore(a)
  return { score, risk: classifyRisk(score) }
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  'ผู้ดื่มแบบเสี่ยงต่ำ': 'text-emerald-600 bg-emerald-50',
  'ผู้ดื่มแบบเสี่ยง': 'text-amber-600 bg-amber-50',
  'ผู้ดื่มแบบอันตราย': 'text-orange-600 bg-orange-50',
  'ผู้ดื่มแบบติด': 'text-red-600 bg-red-50',
}

// ช่วงคะแนน + กลุ่ม (สำหรับแสดงคำอธิบาย/tooltip)
export const RISK_BANDS: { range: string; level: RiskLevel }[] = [
  { range: '0–7', level: 'ผู้ดื่มแบบเสี่ยงต่ำ' },
  { range: '8–15', level: 'ผู้ดื่มแบบเสี่ยง' },
  { range: '16–19', level: 'ผู้ดื่มแบบอันตราย' },
  { range: '20–40', level: 'ผู้ดื่มแบบติด' },
]

// คำแนะนำการจัดการตามกลุ่ม (brief intervention ตามแนวทาง ศวส./WHO)
export const RISK_ADVICE: Record<RiskLevel, string> = {
  'ผู้ดื่มแบบเสี่ยงต่ำ': 'ให้ความรู้/ชื่นชม คงพฤติกรรมเสี่ยงต่ำต่อไป',
  'ผู้ดื่มแบบเสี่ยง': 'ให้คำแนะนำแบบสั้น (brief advice) เพื่อลดการดื่ม',
  'ผู้ดื่มแบบอันตราย': 'ให้คำปรึกษาแบบสั้น + ติดตามผลซ้ำ',
  'ผู้ดื่มแบบติด': 'ส่งต่อผู้เชี่ยวชาญ/สถานพยาบาลเพื่อบำบัดรักษา',
}
