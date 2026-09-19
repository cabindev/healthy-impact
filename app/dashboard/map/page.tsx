import { requireAdminPage } from '@/app/lib/auth'
import dynamicImport from 'next/dynamic'
import { prisma } from '@/app/lib/prisma'
import Link from 'next/link'
import { ClipboardList, CircleCheck, CheckCheck, MapPinned, Info } from 'lucide-react'
import type { ProvinceStat } from './MapView'

export const dynamic = 'force-dynamic'

// Leaflet ต้องมี window — ปิด SSR ของแผนที่
const MapView = dynamicImport(() => import('./MapView'), {
  loading: () => <div className="h-[68vh] min-h-[460px] rounded-xl border border-gray-100 bg-gray-50 animate-pulse" />,
})

export default async function MapPage() {
  await requireAdminPage()
  let rows: { province: string | null; eligible: boolean; verifiedAt: Date | null }[] = []
  let dbError = false
  try {
    rows = await prisma.survey.findMany({ select: { province: true, eligible: true, verifiedAt: true } })
  } catch (err) {
    console.warn('[map] เชื่อมต่อฐานข้อมูลไม่ได้:', err instanceof Error ? err.message : err)
    dbError = true
  }

  const m = new Map<string, ProvinceStat>()
  for (const r of rows) {
    const p = r.province?.trim()
    if (!p) continue
    const s = m.get(p) ?? { province: p, total: 0, eligible: 0, verified: 0 }
    s.total += 1
    if (r.eligible) s.eligible += 1
    if (r.verifiedAt) s.verified += 1
    m.set(p, s)
  }
  const stats = [...m.values()].sort((a, b) => b.total - a.total)
  const covered = stats.length
  const totalRecords = stats.reduce((sum, s) => sum + s.total, 0)
  const noProvince = rows.length - totalRecords

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-800">แผนที่การขับเคลื่อน</h1>
        <p className="mt-1 text-sm text-gray-500">ติดตามความครอบคลุมการเก็บข้อมูล และสำรวจผลการดำเนินงานรายจังหวัด</p>
      </div>

      {dbError ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <MapPinned className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="mt-3 text-sm font-medium text-amber-800">เชื่อมต่อฐานข้อมูลไม่ได้ในขณะนี้</p>
          <p className="mt-1 text-xs text-amber-600">ระบบดึงข้อมูลรายจังหวัดมาแสดงบนแผนที่ไม่ได้ กรุณาลองรีเฟรชอีกครั้ง</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: 'จังหวัดที่มีข้อมูล', value: covered, unit: '/ 77 จังหวัด', icon: MapPinned, color: 'bg-green-50 text-green-700' },
              { label: 'แบบสอบถามบนแผนที่', value: totalRecords, unit: 'รายการ', icon: ClipboardList, color: 'bg-blue-50 text-blue-700' },
              { label: 'เข้าเกณฑ์', value: stats.reduce((sum, s) => sum + s.eligible, 0), unit: 'รายการ', icon: CircleCheck, color: 'bg-amber-50 text-amber-700' },
              { label: 'ตรวจสอบแล้ว', value: stats.reduce((sum, s) => sum + s.verified, 0), unit: 'รายการ', icon: CheckCheck, color: 'bg-violet-50 text-violet-700' },
            ].map(({ label, value, unit, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5"><div className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm"><span className={`rounded-lg p-2 ${color}`}><Icon aria-hidden="true" className="size-4" /></span>{label}</div><p className="mt-3 text-2xl font-semibold tabular-nums text-gray-800">{value.toLocaleString()} <span className="text-xs font-normal text-gray-400">{unit}</span></p></div>)}
          </div>
          {noProvince > 0 && <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800"><Info aria-hidden="true" className="size-4 shrink-0" /><p>มีแบบสอบถามไม่ระบุจังหวัด {noProvince.toLocaleString()} รายการ ซึ่งไม่รวมในสรุปและแผนที่นี้ <Link href="/dashboard/surveys?noArea=1" className="ml-1 font-semibold underline underline-offset-2">ตรวจสอบรายการ</Link></p></div>}
          <MapView stats={stats} />
        </>
      )}
    </div>
  )
}
