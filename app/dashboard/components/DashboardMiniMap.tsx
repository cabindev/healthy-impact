'use client'

// แผนที่ย่อบนหน้าภาพรวม — อ่านอย่างเดียว ไม่ให้ลาก/ซูม (กันแย่ง scroll ของหน้า)
// ไม่ใส่ตัวหนังสือบนแผนที่ ให้ดูสะอาด — ตัวเลขรายจังหวัดอ่านจากกราฟแท่งที่อยู่ข้างกัน
// กดที่การ์ดเพื่อไปหน้าแผนที่เต็ม

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Map as LeafletMap } from 'leaflet'
import { ArrowUpRight } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import thailandGeo from '@/app/data/thailand.json'
import { heatColor, type ProvinceStat } from '@/app/lib/map-heat'

export default function DashboardMiniMap({ stats }: { stats: ProvinceStat[] }) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const [ready, setReady] = useState(false)

  const covered = stats.filter((s) => s.total > 0).length
  const max = Math.max(1, ...stats.map((s) => s.total))

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !mapElRef.current || mapRef.current) return

      const map = L.map(mapElRef.current, {
        zoomSnap: 0.25,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      })

      const byProvince = new Map(stats.map((s) => [s.province, s]))

      const geoLayer = L.geoJSON(thailandGeo as GeoJSON.GeoJsonObject, {
        interactive: false,
        style: (feature) => {
          const value = byProvince.get(feature?.properties?.name_th as string)?.total ?? 0
          return { fillColor: heatColor(value, max), fillOpacity: 0.9, color: '#ffffff', weight: 0.75 }
        },
      }).addTo(map)

      map.fitBounds(geoLayer.getBounds(), { padding: [8, 8] })
      mapRef.current = map
      setReady(true)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [stats, max])

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">แผนที่การขับเคลื่อน</h3>
          <p className="text-xs text-gray-400 mt-0.5">ครอบคลุม {covered} จาก 77 จังหวัด</p>
        </div>
        <Link href="/dashboard/map"
          className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 shrink-0">
          ดูแผนที่เต็ม <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <Link href="/dashboard/map" aria-label="เปิดหน้าแผนที่เต็ม" className="relative block flex-1">
        <div className="h-[250px] rounded-lg overflow-hidden bg-white">
          <div ref={mapElRef} className="h-full w-full" />
        </div>
        {!ready && <span className="absolute inset-0 rounded-lg bg-gray-50 animate-pulse" />}
      </Link>
    </div>
  )
}
