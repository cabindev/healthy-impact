'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileSpreadsheet, Eye, SquarePen, Trash2 } from 'lucide-react'
import { RISK_COLORS, type RiskLevel } from '@/app/lib/audit'
import AuditTip from '@/app/components/AuditTip'
import PrintSlipButton from './PrintSlipButton'
import AssignAreaDialog from './AssignAreaDialog'
import { deleteSurvey } from '@/app/actions/survey'

export type SurveyRow = {
  id: number
  no: string
  name: string
  site: string
  area: string
  audit: number | null
  risk: string | null
  eligible: boolean
  /** เหตุที่ถูกคัดออก (เฉพาะ eligible = false) */
  reason: string | null
  verified: boolean
  /** ชื่อผู้ใช้ที่บันทึกเข้าระบบ (Survey.creator) — ข้อมูลเก่าก่อนมี creatorId เป็น null */
  recorder: string | null
  /** ผู้เก็บข้อมูลที่กรอกในฟอร์ม (อาจเป็นคนละคนกับผู้บันทึก) */
  collector: string | null
  canDelete: boolean
}

export default function SurveyTable({ rows, q, filterQuery = '' }: { rows: SurveyRow[]; q: string; filterQuery?: string }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const n = selected.size
  const allSelected = rows.length > 0 && n === rows.length
  // มีติ๊กเลือกแถวอยู่ → ปุ่ม export บนขวาต้อง export เฉพาะที่เลือก ไม่ใช่ export ตามตัวกรองทั้งก้อน
  const exportTopHref = n > 0
    ? `/api/report/export?ids=${[...selected].join(',')}`
    : filterQuery ? `/api/report/export?${filterQuery}` : '/api/report/export'
  const exportTopLabel = n > 0 ? `Export ที่เลือก (${n})` : filterQuery ? 'Export ที่กรอง' : 'Export ทั้งหมด'

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
  const remove = async (id: number, no: string) => {
    if (!confirm(`ยืนยันการลบแบบสอบถาม ${no}? การลบไม่สามารถย้อนกลับได้`)) return
    setDeletingId(id)
    try {
      const res = await deleteSurvey(id)
      if (!res.ok) {
        alert(res.error)
        return
      }
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      router.refresh()
    } catch {
      alert('ลบไม่สำเร็จ โปรดลองอีกครั้ง')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* toolbar — export ที่เลือกถ้ามีติ๊กไว้ ไม่งั้น export ตามตัวกรอง/คำค้นปัจจุบัน */}
      <div className="flex justify-end">
        <a href={exportTopHref}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <FileSpreadsheet className="w-4 h-4" /> {exportTopLabel}
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
              <th className="text-left font-medium px-4 py-3">โดย admin</th>
              <th className="text-right font-medium px-4 py-3">AUDIT</th>
              <th className="text-left font-medium px-4 py-3"><span className="inline-flex items-center gap-1">ความเสี่ยง <AuditTip align="center" /></span></th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">
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
                    {r.eligible ? r.name : (
                      <span className="inline-flex flex-col gap-0.5">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium self-start">ไม่เข้าเกณฑ์</span>
                        {r.reason && <span className="text-[11px] text-gray-400">{r.reason}</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.site}</td>
                  <td className="px-4 py-3">
                    {r.area === '—'
                      ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">ไม่ระบุพื้นที่</span>
                      : <span className="text-gray-500">{r.area}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.recorder
                      ? <span className="inline-flex flex-col gap-0.5">
                          <span className="text-gray-700">{r.recorder}</span>
                          {r.collector && r.collector !== r.recorder && <span className="text-[11px] text-gray-400">เก็บโดย {r.collector}</span>}
                        </span>
                      : <span className="text-gray-400" title="บันทึกก่อนระบบเริ่มเก็บชื่อผู้บันทึก">{r.collector ? `เก็บโดย ${r.collector}` : '—'}</span>}
                  </td>
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
                      {r.canDelete && (
                        <button type="button" onClick={() => remove(r.id, r.no)} disabled={deletingId === r.id}
                          aria-label="ลบ" title="ลบ"
                          className={`inline-flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors ${deletingId === r.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
          <AssignAreaDialog ids={[...selected]} onDone={() => setSelected(new Set())} />
          <button type="button" onClick={exportSelected}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-full hover:bg-green-700 transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Export ที่เลือก
          </button>
        </div>
      </div>
    </>
  )
}
