// เฉดสีและการจับคู่ค่า → สี ของแผนที่ความเข้มข้นรายจังหวัด
// ใช้ร่วมกันระหว่างหน้าแผนที่เต็ม (dashboard/map) กับแผนที่ย่อบนหน้าภาพรวม

export type ProvinceStat = {
  province: string
  total: number
  eligible: number
  verified: number
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
