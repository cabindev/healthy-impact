'use client'

import InfoTip from './InfoTip'
import { ELIGIBILITY_RULES } from '@/app/lib/eligibility'

// อธิบายว่า "เข้าเกณฑ์" คืออะไร และไม่เข้าเกณฑ์แล้วระบบทำอะไรต่อ
export default function EligibilityTip({ align = 'center' }: { align?: 'center' | 'right' }) {
  return (
    <InfoTip label="อธิบายเกณฑ์คัดเข้า" align={align} widthPx={300}>
      <p className="text-xs font-semibold text-gray-700">เกณฑ์คัดเข้ากลุ่มเป้าหมาย</p>
      <p className="text-[11px] text-gray-500 mt-0.5">
        ต้องผ่าน <span className="font-medium">ครบทั้ง 3 ข้อ</span> จึงสัมภาษณ์ต่อจนจบ 4 ส่วน
      </p>

      <ul className="mt-2 space-y-1.5">
        {ELIGIBILITY_RULES.map((r) => (
          <li key={r.key} className="text-[11px] flex gap-2">
            <span className="font-mono text-gray-400 w-12 shrink-0">{r.question}</span>
            <span className="flex-1">
              <span className="text-gray-700">{r.pass}</span>
              <span className="block text-red-400 mt-0.5">ถ้าไม่ผ่าน: {r.fail} → จบการสัมภาษณ์</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2.5 pt-2.5 border-t border-gray-100">
        <p className="text-[11px] text-gray-500">
          ผู้ไม่เข้าเกณฑ์จะถูกบันทึกไว้เฉพาะ <span className="font-medium text-gray-700">พื้นที่ · ผู้เก็บข้อมูล · เหตุผล</span>
          {' '}เพื่อให้รู้ว่าลงพื้นที่ไปกี่ราย และคัดออกด้วยเหตุใด
        </p>
        <p className="text-[10px] text-gray-400 mt-1">ไม่มีการเก็บข้อมูลส่วนตัวหรือข้อมูลสุขภาพของผู้ไม่เข้าเกณฑ์</p>
      </div>
    </InfoTip>
  )
}
