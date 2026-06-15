'use client'

import { Dialog } from '@base-ui-components/react/dialog'
import { Info, X } from 'lucide-react'
import { RISK_BANDS, RISK_ADVICE, RISK_COLORS, classifyRisk } from '@/app/lib/audit'

// AUDIT ข้อไหน = ข้อใดในแบบสอบถาม (นับเฉพาะส่วนที่ 3)
const MAP: { q: string; src: string; score: string }[] = [
  { q: 'ข้อ 1', src: '3.1 ความถี่การดื่ม', score: '0–4' },
  { q: 'ข้อ 2', src: '3.2 ปริมาณต่อวัน — เบียร์/เหล้า/ไวน์ (ดื่มหลายชนิดใช้ max)', score: '0–4' },
  { q: 'ข้อ 3', src: '3.3 ดื่มหนักคราวเดียว', score: '0–4' },
  { q: 'ข้อ 4', src: '3.4 หยุดดื่มไม่ได้', score: '0–4' },
  { q: 'ข้อ 5', src: '3.5 ทำสิ่งปกติไม่ได้', score: '0–4' },
  { q: 'ข้อ 6', src: '3.6 ดื่มตอนเช้า', score: '0–4' },
  { q: 'ข้อ 7', src: '3.7 รู้สึกผิด', score: '0–4' },
  { q: 'ข้อ 8', src: '3.8 จำเหตุการณ์ไม่ได้', score: '0–4' },
  { q: 'ข้อ 9', src: '3.9 บาดเจ็บจากการดื่ม', score: '0/2/4' },
  { q: 'ข้อ 10', src: '3.10 ได้รับคำแนะนำให้ลด/เลิก', score: '0/2/4' },
]

// ตัวอย่างจริง "นาย ก."
const EXAMPLE: { q: string; ans: string; score: number }[] = [
  { q: '3.1', ans: 'ดื่ม 2–3 ครั้ง/สัปดาห์', score: 3 },
  { q: '3.2', ans: 'เบียร์ (2) + เหล้า (4) → ใช้ max', score: 4 },
  { q: '3.3', ans: 'ดื่มหนัก สัปดาห์ละครั้ง', score: 3 },
  { q: '3.4', ans: 'หยุดไม่ได้ น้อยกว่าเดือนละครั้ง', score: 1 },
  { q: '3.5', ans: 'ทำงานปกติไม่ได้ ไม่เคยเลย', score: 0 },
  { q: '3.6', ans: 'ดื่มตอนเช้า ไม่เคยเลย', score: 0 },
  { q: '3.7', ans: 'รู้สึกผิด เดือนละครั้ง', score: 2 },
  { q: '3.8', ans: 'จำไม่ได้ น้อยกว่าเดือนละครั้ง', score: 1 },
  { q: '3.9', ans: 'เคยบาดเจ็บ แต่ไม่ใช่ใน 3 เดือน', score: 2 },
  { q: '3.10', ans: 'เคยได้รับคำแนะนำ และใน 3 เดือน', score: 4 },
]
const EXAMPLE_TOTAL = EXAMPLE.reduce((s, r) => s + r.score, 0)
const EXAMPLE_RISK = classifyRisk(EXAMPLE_TOTAL)

export default function AuditExplainModal({ className = '' }: { className?: string }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        className={`inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium ${className}`}>
        <Info className="w-3.5 h-3.5" /> วิธีคิดคะแนน
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-lg max-h-[85vh] overflow-auto bg-white rounded-2xl shadow-2xl outline-none">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <Dialog.Title className="text-base font-semibold text-gray-800">คะแนน AUDIT — วิธีคิด</Dialog.Title>
              <Dialog.Close aria-label="ปิด" className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            <div className="p-5 space-y-6">
              {/* 1) นับจากข้อไหนบ้าง */}
              <section>
                <h4 className="text-sm font-semibold text-gray-800">คะแนนนับจากข้อไหนบ้าง</h4>
                <p className="text-xs text-gray-500 mt-0.5 mb-2">
                  นับเฉพาะ <span className="font-medium">ส่วนที่ 3</span> · 10 ข้อ ข้อละ 0–4 = <span className="font-medium">เต็ม 40</span>
                  <span className="text-gray-400"> (ส่วน 1 ข้อมูลทั่วไป / ส่วน 2 บุหรี่ / ส่วน 4 เมาแล้วขับ ไม่นับ)</span>
                </p>
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left font-medium px-3 py-1.5 w-14">AUDIT</th>
                        <th className="text-left font-medium px-3 py-1.5">ข้อในแบบสอบถาม</th>
                        <th className="text-right font-medium px-3 py-1.5 w-14">คะแนน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {MAP.map((m) => (
                        <tr key={m.q}>
                          <td className="px-3 py-1.5 text-gray-500">{m.q}</td>
                          <td className="px-3 py-1.5 text-gray-700">{m.src}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-gray-500">{m.score}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold text-gray-700">
                        <td className="px-3 py-1.5" colSpan={2}>รวม</td>
                        <td className="px-3 py-1.5 text-right font-mono">0–40</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 2) เกณฑ์แปลผล */}
              <section>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">เกณฑ์แปลผล (WHO / ศวส.)</h4>
                <ul className="space-y-1.5">
                  {RISK_BANDS.map((b) => (
                    <li key={b.level} className="text-xs flex gap-2 items-start">
                      <span className="font-mono text-gray-500 w-12 shrink-0">{b.range}</span>
                      <span className="flex-1">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${RISK_COLORS[b.level]}`}>{b.level}</span>
                        <span className="text-gray-400"> — {RISK_ADVICE[b.level]}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-400 mt-2">จุดตัดผิดปกติ (ควรช่วยเหลือ): ตั้งแต่ 8 คะแนนขึ้นไป</p>
              </section>

              {/* 3) ตัวอย่าง */}
              <section>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">ตัวอย่าง — “นาย ก.”</h4>
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left font-medium px-3 py-1.5 w-12">ข้อ</th>
                        <th className="text-left font-medium px-3 py-1.5">คำตอบ</th>
                        <th className="text-right font-medium px-3 py-1.5 w-14">คะแนน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {EXAMPLE.map((r) => (
                        <tr key={r.q}>
                          <td className="px-3 py-1.5 text-gray-500">{r.q}</td>
                          <td className="px-3 py-1.5 text-gray-700">{r.ans}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-gray-700">{r.score}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold text-gray-800">
                        <td className="px-3 py-1.5" colSpan={2}>รวม</td>
                        <td className="px-3 py-1.5 text-right font-mono">{EXAMPLE_TOTAL}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ผลรวม {EXAMPLE_TOTAL} คะแนน →
                  <span className={`ml-1 px-1.5 py-0.5 rounded font-medium ${RISK_COLORS[EXAMPLE_RISK]}`}>{EXAMPLE_RISK}</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  * ข้อ 3.2 นาย ก. ดื่ม 2 ชนิด (เบียร์ 2, เหล้า 4) ระบบใช้คะแนนสูงสุด (max) = 4
                </p>
              </section>
            </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
