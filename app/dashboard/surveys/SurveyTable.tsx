'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, FileSpreadsheet, Eye, SquarePen } from 'lucide-react'
import { RISK_COLORS, type RiskLevel } from '@/app/lib/audit'
import AuditTip from '@/app/components/AuditTip'
import PrintSlipButton from './PrintSlipButton'

export type SurveyRow = {
  id: number
  no: string
  name: string
  site: string
  area: string
  audit: number | null
  risk: string | null
  eligible: boolean
  verified: boolean
}

export default function SurveyTable({ rows, q }: { rows: SurveyRow[]; q: string }) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const n = selected.size
  const allSelected = rows.length > 0 && n === rows.length

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  const exportSelected = () => {
    if (n > 0) window.location.href = `/api/report/export?ids=${[...selected].join(',')}`
  }

  return (
    <>
      {/* toolbar — export ทั้งหมด (ผูกกับตารางที่ค้นได้) */}
      <div className="flex justify-end">
        <a href="/api/report/export"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <FileSpreadsheet className="w-4 h-4" /> Export ทั้งหมด
        </a>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="w-12 px-2 py-3">
                <label className="flex items-center justify-center min-h-[44px] cursor-pointer">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="เลือกทั้งหมด"
                    className="accent-green-600 w-4 h-4" />
                </label>
              </th>
              <th className="text-right font-medium px-4 py-3 w-12">ลำดับ</th>
              <th className="text-left font-medium px-4 py-3">เลขที่</th>
              <th className="text-left font-medium px-4 py-3">ผู้ตอบ</th>
              <th className="text-left font-medium px-4 py-3">สถานที่</th>
              <th className="text-left font-medium px-4 py-3">พื้นที่</th>
              <th className="text-right font-medium px-4 py-3">AUDIT</th>
              <th className="text-left font-medium px-4 py-3"><span className="inline-flex items-center gap-1">ความเสี่ยง <AuditTip align="center" /></span></th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                {q ? `ไม่พบแบบสอบถามที่ตรงกับ “${q}”` : 'ยังไม่มีแบบสอบถาม — กด “เพิ่มแบบสอบถาม” เพื่อเริ่ม'}
              </td></tr>
            ) : rows.map((r, i) => {
              const risk = r.risk as RiskLevel | null
              const checked = selected.has(r.id)
              return (
                <tr key={r.id} className={`transition-colors ${checked ? 'bg-green-50/60' : 'hover:bg-gray-50/60'}`}>
                  <td className="px-2 py-0">
                    <label className="flex items-center justify-center min-h-[44px] cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => toggle(r.id)}
                        aria-label={`เลือก ${r.no}`} className="accent-green-600 w-4 h-4" />
                    </label>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      {r.no}
                      {r.verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-label="ตรวจสอบแล้ว" />}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.eligible ? r.name : <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">ไม่เข้าเกณฑ์</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.site}</td>
                  <td className="px-4 py-3 text-gray-500">{r.area}</td>
                  <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{r.audit ?? '—'}</td>
                  <td className="px-4 py-3">
                    {risk ? <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[risk]}`}>{risk}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/dashboard/surveys/${r.id}`} aria-label="ดู" title="ดู"
                        className="inline-flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {r.eligible && (
                        <Link href={`/dashboard/surveys/${r.id}/edit`} aria-label="แก้ไข" title="แก้ไข"
                          className="inline-flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors">
                          <SquarePen className="w-4 h-4" />
                        </Link>
                      )}
                      <PrintSlipButton id={r.id} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* action bar — เลือกหลายรายการเพื่อ Export Excel */}
      <div className={`sticky bottom-4 z-30 flex justify-center transition-all duration-200 ease-out motion-reduce:transition-none ${
        n > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full shadow-lg pl-5 pr-2 py-2">
          <span className="text-sm text-gray-600">เลือกแล้ว <b className="text-gray-900 tabular-nums">{n}</b></span>
          <button type="button" onClick={() => setSelected(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-full">ล้าง</button>
          <button type="button" onClick={exportSelected}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-full hover:bg-green-700 transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Export ที่เลือก
          </button>
        </div>
      </div>
    </>
  )
}
