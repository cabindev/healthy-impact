// คำนวณ BMI และอายุ — pure functions ใช้ได้ทั้ง client และ server

export function calcBMI(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm) return null
  const m = heightCm / 100
  if (m <= 0) return null
  const bmi = weightKg / (m * m)
  if (!isFinite(bmi) || bmi <= 0) return null
  return Math.round(bmi * 10) / 10
}

// เกณฑ์ Asia-Pacific (คนไทย)
export function bmiCategory(bmi: number | null): string {
  if (bmi == null) return '—'
  if (bmi < 18.5) return 'น้ำหนักน้อย'
  if (bmi < 23) return 'ปกติ'
  if (bmi < 25) return 'ท้วม'
  if (bmi < 30) return 'อ้วน'
  return 'อ้วนมาก'
}

// ปี พ.ศ. ปัจจุบัน (อิงเวลาเครื่อง)
export const CURRENT_BE_YEAR = new Date().getFullYear() + 543

// ดึงปี พ.ศ. จากสตริงวันเกิด (รองรับ dd/mm/yyyy, yyyy ฯลฯ)
export function parseBEYear(birth?: string | null): number | null {
  if (!birth) return null
  const nums = birth.match(/\d+/g)
  if (!nums) return null
  const year = nums.map(Number).find((n) => n >= 2400 && n <= CURRENT_BE_YEAR)
  return year ?? null
}

// อายุโดยประมาณจากปีเกิด (พ.ศ.) — null = แปลงไม่ได้
export function thaiAge(birth?: string | null): number | null {
  const y = parseBEYear(birth)
  return y == null ? null : CURRENT_BE_YEAR - y
}

// กลุ่มเป้าหมาย: อายุ ≥ 15 ปี (เกิด ≤ พ.ศ. 2554)
export const MIN_AGE = 15
