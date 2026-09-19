'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, FileSpreadsheet, Eye, SquarePen, Trash2, SearchX, MapPin, Clock3, Loader2, X } from 'lucide-react'
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
  canDelete: boolean
}

export default function SurveyTable({ rows, q, filterQuery = '', offset = 0, total }: { rows: SurveyRow[]; q: string; filterQuery?: string; offset?: number; total: number }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const n = selected.size
  const allSelected = rows.length > 0 && n === rows.length
  // มีติ๊กเลือกแถวอยู่ → ปุ่ม export บนขวาต้อง export เฉพาะที่เลือก ไม่ใช่ export ตามตัวกรองทั้งก้อน
  const exportTopHref = n > 0
    ? `/api/report/export?ids=${[...selected].join(',')}`
    : filterQuery ? `/api/report/export?${filterQuery}` : '/api/report/export'
  const exportTopLabel = n > 0 ? `ส่งออกที่เลือก (${n})` : filterQuery ? 'ส่งออกตามตัวกรอง' : 'ส่งออกทั้งหมด'

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  const exportSelected = () => {
    if (n > 0) window.location.href = `/api/report/export?ids=${[...selected].join(',')}`
  }
  const remove = async (id: number, no: string) => {
    if (!confirm(`ยืนยันการลบแบบสอบถาม ${no}? การลบไม่สามารถย้อนกลับได้`)) return
    setError('')
    setDeletingId(id)
    try {
      const res = await deleteSurvey(id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      router.refresh()
    } catch {
      setError('ลบไม่สำเร็จ โปรดลองอีกครั้ง')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <section aria-label="รายการแบบสอบถาม" className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 sm:px-5">
          <div><h2 className="font-semibold text-gray-800">รายการแบบสอบถาม <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">{total.toLocaleString()}</span></h2><p className="mt-1 text-xs text-gray-500">แสดง {rows.length ? (offset + 1).toLocaleString() : 0}–{(offset + rows.length).toLocaleString()} จาก {total.toLocaleString()} รายการ</p></div>
          {total > 0 && <a href={exportTopHref} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-xs font-medium text-gray-600 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-700"><FileSpreadsheet aria-hidden="true" className="size-4" />{exportTopLabel} · Excel</a>}
        </div>
        {error && <div role="alert" className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}<button aria-label="ปิดข้อความผิดพลาด" onClick={() => setError('')} className="rounded-lg p-2 hover:bg-red-100"><X className="size-4" /></button></div>}
        {rows.length === 0 ? <div className="px-4 py-16 text-center"><SearchX aria-hidden="true" className="mx-auto mb-4 size-10 text-gray-300" /><h3 className="font-medium text-gray-800">{filterQuery ? 'ไม่พบแบบสอบถามที่ตรงกับเงื่อนไข' : 'ยังไม่มีแบบสอบถาม'}</h3><p className="mt-2 text-sm text-gray-500">{q ? `ลองเปลี่ยนคำค้นหา “${q}” หรือล้างตัวกรอง` : filterQuery ? 'ลองเลือกพื้นที่หรือผู้บันทึกใหม่' : 'เริ่มบันทึกข้อมูลแบบสอบถามรายการแรกได้เลย'}</p><Link href={filterQuery ? '/dashboard/surveys' : '/dashboard/surveys/new'} className="mt-4 inline-flex rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-green-700">{filterQuery ? 'ล้างตัวกรองทั้งหมด' : 'เพิ่มแบบสอบถาม'}</Link></div> : <>
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 text-xs text-gray-500 xl:hidden"><label className="flex min-h-10 items-center gap-2"><input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = n > 0 && !allSelected }} onChange={toggleAll} className="size-4 accent-green-600" />เลือกทั้งหมดในหน้านี้</label><span>{rows.length} รายการ</span></div>
          <table className="block w-full text-sm xl:table">
            <caption className="sr-only">แบบสอบถาม ผู้ตอบ พื้นที่ สถานะการตรวจสอบ และความเสี่ยง AUDIT</caption>
            <thead className="hidden bg-gray-50/80 text-xs text-gray-500 xl:table-header-group"><tr>
              <th scope="col" className="w-12 px-3 py-3"><input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = n > 0 && !allSelected }} onChange={toggleAll} aria-label="เลือกทั้งหมดในหน้านี้" className="size-4 accent-green-600" /></th>
              {['แบบสอบถาม / ผู้ตอบ', 'พื้นที่ / สถานที่', 'ผู้บันทึก', 'สถานะ'].map(label => <th scope="col" key={label} className="px-3 py-3 text-left font-medium">{label}</th>)}
              <th scope="col" className="px-3 py-3 text-left font-medium"><span className="inline-flex items-center gap-1">AUDIT <AuditTip align="center" /></span></th><th scope="col" className="px-3 py-3 text-right font-medium">จัดการ</th>
            </tr></thead>
            <tbody className="block divide-y divide-gray-100 xl:table-row-group">{rows.map((r, i) => {
              const risk = r.risk as RiskLevel | null
              const checked = selected.has(r.id)
              return <tr key={r.id} className={`grid grid-cols-2 gap-3 p-4 transition-colors xl:table-row xl:p-0 ${checked ? 'bg-green-50/60' : 'hover:bg-gray-50/60'}`}>
                <td className="col-span-2 xl:px-3 xl:py-4"><label className="inline-flex min-h-9 items-center gap-2 xl:flex xl:justify-center"><input type="checkbox" checked={checked} onChange={() => toggle(r.id)} aria-label={`เลือก ${r.no}`} className="size-4 accent-green-600" /><span className="text-xs text-gray-400 xl:hidden">รายการที่ {offset + i + 1}</span></label></td>
                <td className="col-span-2 xl:px-3 xl:py-4"><Link href={`/dashboard/surveys/${r.id}`} className="font-semibold text-green-700 hover:underline">{r.no}</Link><p className="mt-1 break-words text-gray-700">{r.name}</p></td>
                <td className="col-span-2 xl:max-w-[240px] xl:px-3 xl:py-4"><div className="flex items-start gap-1.5"><MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-gray-400" />{r.area === '—' ? <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-700">ไม่ระบุพื้นที่</span> : <span className="text-xs leading-relaxed text-gray-600">{r.area}</span>}</div><p className="mt-1 pl-5 text-[11px] text-gray-400">{r.site}</p></td>
                <td className="xl:px-3 xl:py-4"><p className="mb-1 text-[10px] text-gray-400 xl:hidden">ผู้บันทึก</p><span className="text-xs text-gray-600">{r.recorder || 'ไม่ระบุผู้บันทึก'}</span></td>
                <td className="xl:px-3 xl:py-4"><div className="flex flex-col items-start gap-1.5"><span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${r.eligible ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{r.eligible ? 'เข้าเกณฑ์' : 'ไม่เข้าเกณฑ์'}</span><span className={`inline-flex items-center gap-1 text-[10px] ${r.verified ? 'text-green-600' : 'text-gray-400'}`}>{r.verified ? <CheckCircle2 aria-hidden="true" className="size-3" /> : <Clock3 aria-hidden="true" className="size-3" />}{r.verified ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}</span>{!r.eligible && r.reason && <span className="max-w-40 text-[10px] text-gray-400">{r.reason}</span>}</div></td>
                <td className="xl:px-3 xl:py-4"><p className="mb-1 text-[10px] text-gray-400 xl:hidden">AUDIT / ความเสี่ยง</p><div className="flex flex-wrap items-center gap-1.5"><span className="font-semibold tabular-nums text-gray-700">{r.audit ?? '—'}</span>{risk && <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${RISK_COLORS[risk]}`}>{risk}</span>}</div></td>
                <td className="col-span-2 border-t border-gray-100 pt-3 xl:border-0 xl:px-3 xl:py-4"><div className="flex items-center justify-end gap-1.5">
                  <Link href={`/dashboard/surveys/${r.id}`} aria-label={`ดูแบบสอบถาม ${r.no}`} title="ดูรายละเอียด" className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-gray-200 px-2 text-xs text-gray-600 hover:bg-green-50 hover:text-green-700"><Eye aria-hidden="true" className="size-4" />ดู</Link>
                  {r.eligible && r.canDelete && <Link href={`/dashboard/surveys/${r.id}/edit`} aria-label={`แก้ไขแบบสอบถาม ${r.no}`} title="แก้ไข" className="inline-flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-700"><SquarePen className="size-4" /></Link>}
                  <span className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-gray-100"><PrintSlipButton id={r.id} /></span>
                  {r.canDelete && <button type="button" onClick={() => remove(r.id, r.no)} disabled={deletingId !== null} aria-label={`ลบแบบสอบถาม ${r.no}`} title="ลบ" className="inline-flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40">{deletingId === r.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</button>}
                </div></td>
              </tr>
            })}</tbody>
          </table>
        </>}
      </section>
      {n > 0 && <div className="sticky bottom-4 z-30 flex justify-center print:hidden"><div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-3 py-2 shadow-lg"><span role="status" className="px-2 text-sm text-gray-600">เลือกแล้ว <b className="tabular-nums text-green-700">{n}</b> รายการ</span><button type="button" onClick={() => setSelected(new Set())} className="rounded-xl px-3 py-2 text-xs text-gray-500 hover:bg-gray-50">ยกเลิกเลือก</button>{rows.filter(r => selected.has(r.id)).every(r => r.canDelete) && <AssignAreaDialog ids={[...selected]} onDone={() => setSelected(new Set())} />}<button type="button" onClick={exportSelected} className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"><FileSpreadsheet aria-hidden="true" className="size-4" />ส่งออกที่เลือก</button></div></div>}
    </>
  )
}
