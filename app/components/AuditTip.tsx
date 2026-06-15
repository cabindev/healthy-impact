'use client'

import InfoTip from './InfoTip'
import { RISK_BANDS, RISK_ADVICE, RISK_COLORS } from '@/app/lib/audit'

// อธิบายคะแนน AUDIT: โครงสร้าง + เกณฑ์ + แนวคิดยุบข้อ 3.2 ด้วย max (ตาม WHO / ศวส. — สสส.)
export default function AuditTip({ align = 'right' }: { align?: 'center' | 'right' }) {
  return (
    <InfoTip label="อธิบายคะแนน AUDIT" align={align} widthPx={300}>
      <p className="text-xs font-semibold text-gray-700">คะแนน AUDIT (เต็ม 40)</p>
      <p className="text-[11px] text-gray-500 mt-0.5">
        นับเฉพาะ <span className="font-medium">ส่วนที่ 3</span> — 10 ข้อ (3.1–3.10) ข้อละ 0–4 คะแนน
        <span className="text-gray-400"> (ส่วน 1/2/4 ไม่นับ)</span>
      </p>

      {/* เกณฑ์ความเสี่ยง */}
      <ul className="mt-2 space-y-1.5">
        {RISK_BANDS.map((b) => (
          <li key={b.level} className="text-[11px] flex gap-2">
            <span className="font-mono text-gray-500 w-12 shrink-0">{b.range}</span>
            <span className="flex-1">
              <span className={`px-1.5 py-0.5 rounded font-medium ${RISK_COLORS[b.level]}`}>{b.level}</span>
              <span className="block text-gray-400 mt-0.5">{RISK_ADVICE[b.level]}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-gray-400 mt-1.5">จุดตัดผิดปกติ (ควรช่วยเหลือ): ตั้งแต่ 8 คะแนนขึ้นไป</p>

      {/* แนวคิดยุบข้อ 3.2 ด้วย max */}
      <div className="mt-2.5 pt-2.5 border-t border-gray-100">
        <p className="text-[11px] font-semibold text-gray-600">ข้อ 3.2 ดื่มหลายชนิด → ใช้คะแนนสูงสุด (max)</p>
        <p className="text-[11px] text-gray-500 mt-1">
          เช่น เบียร์ <span className="font-mono">2</span> + เหล้า <span className="font-mono">4</span> →
          ข้อ 3.2 ได้ <span className="font-semibold text-gray-700">4</span> คะแนน
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">(สะท้อนปริมาณที่ดื่มหนักสุดต่อวัน ตามเจตนา AUDIT ข้อ 2)</p>
      </div>
    </InfoTip>
  )
}
