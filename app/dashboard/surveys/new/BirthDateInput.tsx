'use client'

const inputCls = 'block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 bg-white'
const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

// พิมพ์ตัวเลขล้วน แล้วใส่ "/" อัตโนมัติ → เก็บค่า "DD/MM/พ.ศ." (เร็วสุดสำหรับคีย์ข้อมูล ไม่ต้องใช้เมาส์)
export default function BirthDateInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const format = (raw: string) => {
    const v = raw.replace(/\D/g, '').slice(0, 8) // ddmmyyyy
    let out = v.slice(0, 2)
    if (v.length > 2) out += '/' + v.slice(2, 4)
    if (v.length > 4) out += '/' + v.slice(4, 8)
    return out
  }

  // ตรวจ + แปลงเป็นข้อความอ่านง่ายเพื่อกันพิมพ์ผิด
  const [dd, mm, yy] = (value ?? '').split('/')
  const d = Number(dd), m = Number(mm)
  const valid = yy?.length === 4 && d >= 1 && d <= 31 && m >= 1 && m <= 12
  const readable = valid ? `${d} ${TH_MONTHS[m - 1]} ${yy}` : ''
  const badFormat = (value ?? '').length === 10 && !valid // กรอกครบ 10 ตัวอักษรแต่ค่าไม่ถูกต้อง

  return (
    <div>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(format(e.target.value))}
        inputMode="numeric"
        placeholder="วว/ดด/ปปปป (พ.ศ.) — พิมพ์เลข เช่น 01052540"
        className={inputCls}
      />
      {readable && <p className="mt-1 text-xs text-green-600">✓ {readable}</p>}
      {badFormat && <p className="mt-1 text-xs text-red-500">วันที่ไม่ถูกต้อง ตรวจสอบ วัน(1–31)/เดือน(1–12)/ปี พ.ศ.</p>}
    </div>
  )
}
