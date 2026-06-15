'use client'

import InfoTip from './InfoTip'

// อธิบายเกณฑ์ BMI (Asia-Pacific สำหรับคนไทย)
export default function BmiTip({ align = 'center' }: { align?: 'center' | 'right' }) {
  return (
    <InfoTip label="อธิบาย BMI" align={align}>
      <p className="text-xs font-semibold text-gray-700">BMI — ดัชนีมวลกาย</p>
      <p className="text-[11px] text-gray-500 mt-0.5 mb-2">BMI = น้ำหนัก(กก.) ÷ ส่วนสูง(ม.)² · เกณฑ์ Asia-Pacific</p>
      <ul className="text-[11px] text-gray-500 space-y-0.5">
        <li><span className="font-mono">&lt; 18.5</span> — น้ำหนักน้อย</li>
        <li><span className="font-mono">18.5–22.9</span> — ปกติ</li>
        <li><span className="font-mono">23–24.9</span> — ท้วม</li>
        <li><span className="font-mono">25–29.9</span> — อ้วน</li>
        <li><span className="font-mono">≥ 30</span> — อ้วนมาก</li>
      </ul>
    </InfoTip>
  )
}
