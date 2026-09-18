'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { MapPin, MapPinOff, UserRound, X } from 'lucide-react'
import { PROVINCE_ZONE } from '@/app/lib/province-zone'

export type AdminOption = { id: number; name: string; count: number }

export type GeoCombo = { province: string | null; amphoe: string | null; tambon: string | null; villageName: string | null }

const LEVELS = ['zone', 'province', 'amphoe', 'tambon', 'village'] as const
type Level = (typeof LEVELS)[number]

const LABEL: Record<Level, string> = { zone: 'ภาค', province: 'จังหวัด', amphoe: 'อำเภอ', tambon: 'ตำบล', village: 'หมู่บ้าน' }

function uniqSorted(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, 'th'))
}

// ตัวกรองพื้นที่แบบไล่ระดับ: โซน → จังหวัด → อำเภอ → ตำบล → หมู่บ้าน — สร้างตัวเลือกจากข้อมูลที่มีอยู่จริงในระบบ
export default function AreaFilter({ combos, admins = [] }: { combos: GeoCombo[]; admins?: AdminOption[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const current: Record<Level, string> = {
    zone: searchParams.get('zone') ?? '',
    province: searchParams.get('province') ?? '',
    amphoe: searchParams.get('amphoe') ?? '',
    tambon: searchParams.get('tambon') ?? '',
    village: searchParams.get('village') ?? '',
  }
  const noArea = searchParams.get('noArea') === '1'
  const creator = searchParams.get('creator') ?? ''
  const active = LEVELS.some((l) => current[l]) || noArea || !!creator

  // เลือกดู "ไม่ระบุพื้นที่" แล้วตัวกรองไล่ระดับใช้ไม่ได้ (ไม่มีค่าให้กรอง) — ล้างทิ้งพร้อมกัน
  const toggleNoArea = () => {
    const params = new URLSearchParams(searchParams.toString())
    LEVELS.forEach((l) => params.delete(l))
    if (noArea) params.delete('noArea')
    else params.set('noArea', '1')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  const options = useMemo(() => {
    const byZone = current.zone ? combos.filter((c) => c.province && PROVINCE_ZONE[c.province] === current.zone) : combos
    const byProvince = current.province ? byZone.filter((c) => c.province === current.province) : byZone
    const byAmphoe = current.amphoe ? byProvince.filter((c) => c.amphoe === current.amphoe) : byProvince
    const byTambon = current.tambon ? byAmphoe.filter((c) => c.tambon === current.tambon) : byAmphoe

    return {
      zone: uniqSorted(combos.map((c) => (c.province ? PROVINCE_ZONE[c.province] : null))),
      province: uniqSorted(byZone.map((c) => c.province)),
      amphoe: uniqSorted(byProvince.map((c) => c.amphoe)),
      tambon: uniqSorted(byAmphoe.map((c) => c.tambon)),
      village: uniqSorted(byTambon.map((c) => c.villageName)),
    }
  }, [combos, current.zone, current.province, current.amphoe, current.tambon])

  const change = (level: Level, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    // เปลี่ยนระดับบน ต้องล้างระดับล่างทั้งหมด (เลือกใหม่แล้วของเดิมอาจไม่อยู่ในกลุ่มเดียวกัน)
    const clearFrom = LEVELS.indexOf(level)
    LEVELS.slice(clearFrom).forEach((l) => params.delete(l))
    if (value) params.set(level, value)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  const changeCreator = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('creator', value)
    else params.delete('creator')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    LEVELS.forEach((l) => params.delete(l))
    params.delete('noArea')
    params.delete('creator')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
        <MapPin className="w-3.5 h-3.5" /> กรองพื้นที่
      </span>
      {LEVELS.map((level) => (
        <select
          key={level}
          value={current[level]}
          onChange={(e) => change(level, e.target.value)}
          disabled={noArea || options[level].length === 0}
          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white focus:outline-none focus:border-green-500 disabled:opacity-40 disabled:cursor-not-allowed">
          <option value="">{LABEL[level]}ทั้งหมด</option>
          {options[level].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      ))}
      <button type="button" onClick={toggleNoArea}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
          noArea ? 'border-amber-300 bg-amber-50 text-amber-700 font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
        }`}>
        <MapPinOff className="w-3.5 h-3.5" /> ไม่ระบุพื้นที่
      </button>
      {admins.length > 0 && (
        <label className="inline-flex items-center gap-1.5">
          <UserRound className="w-3.5 h-3.5 text-gray-400" aria-hidden />
          <span className="sr-only">กรองตาม admin ผู้บันทึก</span>
          <select
            value={creator}
            onChange={(e) => changeCreator(e.target.value)}
            className={`px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:border-green-500 ${
              creator ? 'border-green-300 text-green-700 font-medium' : 'border-gray-200 text-gray-700'
            }`}>
            <option value="">adminทั้งหมด</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.count.toLocaleString()})</option>
            ))}
          </select>
        </label>
      )}
      {active && (
        <button type="button" onClick={clearAll}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 px-1.5 py-1.5">
          <X className="w-3.5 h-3.5" /> ล้างตัวกรอง
        </button>
      )}
    </div>
  )
}
