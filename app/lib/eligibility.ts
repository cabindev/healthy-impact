// เกณฑ์คัดเข้ากลุ่มเป้าหมาย — นิยามไว้ที่เดียว ใช้ทั้งคำอธิบายบนจอและการสรุปเหตุคัดออก
// (ข้อความเหตุผลที่บันทึกลง DB สร้างจาก SurveyForm จึงจับกลุ่มด้วยเลขข้อที่ติดมาในข้อความ)

export type EligibilityKey = 'RESIDENCE' | 'AGE' | 'CONSENT' | 'OTHER'

export const ELIGIBILITY_RULES: {
  key: Exclude<EligibilityKey, 'OTHER'>
  question: string
  pass: string
  fail: string
}[] = [
  { key: 'RESIDENCE', question: 'ข้อ 1.6',  pass: 'พักอาศัยในพื้นที่ต่อเนื่องเกิน 6 เดือน', fail: 'พักอาศัยไม่ถึง 6 เดือน' },
  { key: 'AGE',       question: 'ข้อ 1.11', pass: 'อายุ 15 ปีขึ้นไป (คำนวณจากวันเกิด)',     fail: 'อายุต่ำกว่า 15 ปี' },
  { key: 'CONSENT',   question: 'ข้อ 1.7',  pass: 'ลงนามยินยอมตาม PDPA',                    fail: 'ไม่ยินยอมเข้าร่วม' },
]

export const INELIGIBLE_LABEL: Record<EligibilityKey, string> = {
  RESIDENCE: 'พักอาศัยไม่ถึง 6 เดือน',
  AGE: 'อายุต่ำกว่า 15 ปี',
  CONSENT: 'ไม่ยินยอมเข้าร่วม',
  OTHER: 'อื่น ๆ / ไม่ระบุ',
}

export function classifyIneligible(reason?: string | null): EligibilityKey {
  if (!reason) return 'OTHER'
  return ELIGIBILITY_RULES.find((r) => reason.includes(r.question))?.key ?? 'OTHER'
}

// สรุปจำนวนผู้ถูกคัดออกแยกตามเหตุ — เรียงมาก→น้อย ตัดกลุ่มที่เป็น 0 ทิ้ง
export function tallyIneligible(reasons: (string | null | undefined)[]) {
  const m = new Map<EligibilityKey, number>()
  for (const r of reasons) {
    const k = classifyIneligible(r)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()]
    .map(([key, count]) => ({ key, label: INELIGIBLE_LABEL[key], count }))
    .sort((a, b) => b.count - a.count)
}
