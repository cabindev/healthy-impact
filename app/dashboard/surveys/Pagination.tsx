import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// เลขหน้าที่จะโชว์: หน้าแรก/สุดท้าย + รอบ ๆ หน้าปัจจุบัน ที่เหลือยุบเป็น …
function pageList(page: number, pageCount: number): (number | '…')[] {
  const keep = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount))
  const sorted = [...keep].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

// ลิงก์ธรรมดา (server) — คงตัวกรอง/คำค้นเดิมไว้ใน query string
export default function Pagination({ page, pageCount, params }: { page: number; pageCount: number; params: string }) {
  if (pageCount <= 1) return null
  const href = (p: number) => {
    const qs = new URLSearchParams(params)
    if (p > 1) qs.set('page', String(p))
    const s = qs.toString()
    return s ? `/dashboard/surveys?${s}` : '/dashboard/surveys'
  }
  const base = 'inline-flex items-center justify-center min-w-10 h-10 px-3 rounded-lg text-sm tabular-nums transition-colors'
  const idle = `${base} text-gray-600 border border-gray-200 bg-white hover:bg-gray-50`
  const off = `${base} text-gray-300 border border-gray-100 bg-white pointer-events-none`

  return (
    <nav aria-label="เลือกหน้า" className="print:hidden flex flex-wrap items-center justify-center gap-1.5">
      {page > 1
        ? <Link href={href(page - 1)} className={idle} aria-label="หน้าก่อนหน้า"><ChevronLeft className="w-4 h-4" /></Link>
        : <span className={off} aria-hidden><ChevronLeft className="w-4 h-4" /></span>}
      {pageList(page, pageCount).map((p, i) =>
        p === '…'
          ? <span key={`gap-${i}`} className="px-1 text-gray-300">…</span>
          : p === page
            ? <span key={p} aria-current="page" className={`${base} bg-green-600 text-white font-semibold`}>{p}</span>
            : <Link key={p} href={href(p)} className={idle}>{p}</Link>
      )}
      {page < pageCount
        ? <Link href={href(page + 1)} className={idle} aria-label="หน้าถัดไป"><ChevronRight className="w-4 h-4" /></Link>
        : <span className={off} aria-hidden><ChevronRight className="w-4 h-4" /></span>}
    </nav>
  )
}
