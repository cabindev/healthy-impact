import dynamicImport from 'next/dynamic'
import { prisma } from '@/app/lib/prisma'
import { MapPinned } from 'lucide-react'
import type { ProvinceStat } from './MapView'

export const dynamic = 'force-dynamic'

// Leaflet ต้องมี window — ปิด SSR ของแผนที่
const MapView = dynamicImport(() => import('./MapView'), {
  loading: () => <div className="h-[68vh] min-h-[460px] rounded-xl border border-gray-100 bg-gray-50 animate-pulse" />,
})

export default async function MapPage() {
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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">แผนที่การขับเคลื่อน</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          ความเข้มข้นการเก็บข้อมูลรายจังหวัด · ครอบคลุม {covered} จาก 77 จังหวัด ·
          {' '}{totalRecords.toLocaleString()} ชิ้นงาน
          {noProvince > 0 && <span className="text-gray-300"> (ไม่ระบุจังหวัด {noProvince.toLocaleString()})</span>}
        </p>
      </div>

      {dbError ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <MapPinned className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="mt-3 text-sm font-medium text-amber-800">เชื่อมต่อฐานข้อมูลไม่ได้ในขณะนี้</p>
          <p className="mt-1 text-xs text-amber-600">ระบบดึงข้อมูลรายจังหวัดมาแสดงบนแผนที่ไม่ได้ กรุณาลองรีเฟรชอีกครั้ง</p>
        </div>
      ) : (
        <MapView stats={stats} />
      )}
    </div>
  )
}
