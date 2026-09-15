'use client'

// แผนที่ความเข้มข้นการเก็บข้อมูลรายจังหวัด — ระบายสี polygon ตามจำนวนแบบสอบถาม
// ปักชื่อจังหวัด + จำนวนชิ้นงานไว้กลาง polygon ของตัวเอง — เฉพาะจังหวัดที่มีข้อมูล
// (ถ้าปักครบ 77 จังหวัดตัวหนังสือจะทับกันจนอ่านไม่ออกที่ระดับซูมทั้งประเทศ)
// จังหวัดที่ยังไม่มีข้อมูลดูชื่อได้จาก hover — ชี้แล้วขึ้น tooltip และแถวในแผงอันดับสว่างตาม
// ใช้ Leaflet ล้วน โหลดใน useEffect เพื่อเลี่ยง SSR

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Map as LeafletMap, GeoJSON as GeoJSONLayer, LatLngBounds, Marker, Path } from 'leaflet'
import { Expand, MapPin, Maximize2, Shrink } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import thailandGeo from '@/app/data/thailand.json'
import { HEAT_EMPTY, HEAT_RAMP, heatColor, isDarkStep, type ProvinceStat } from '@/app/lib/map-heat'

export type { ProvinceStat }

type Metric = 'total' | 'eligible'

export default function MapView({ stats }: { stats: ProvinceStat[] }) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const geoLayerRef = useRef<GeoJSONLayer | null>(null)
  const layersRef = useRef<Map<string, Path>>(new Map())
  const labelsRef = useRef<Marker[]>([])
  const centersRef = useRef<Map<string, [number, number]>>(new Map())
  const boundsRef = useRef<Map<string, LatLngBounds>>(new Map())
  const fullBoundsRef = useRef<LatLngBounds | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [metric, setMetric] = useState<Metric>('total')
  const [selected, setSelected] = useState('')
  const [hovered, setHovered] = useState('')
  const [zoom, setZoom] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const byProvince = useMemo(() => new Map(stats.map((s) => [s.province, s])), [stats])
  const max = useMemo(() => Math.max(1, ...stats.map((s) => s[metric])), [stats, metric])
  const ranked = useMemo(
    () => [...stats].filter((s) => s[metric] > 0).sort((a, b) => b[metric] - a[metric]),
    [stats, metric],
  )

  // สร้างแผนที่ครั้งเดียว
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !mapElRef.current || mapRef.current) return

      // zoomSnap 0.25: ปล่อยให้ fitBounds ใช้ซูมเศษส่วนได้ ไม่งั้นมันปัดลงเป็นจำนวนเต็ม
      // แล้วประเทศไทยจะลอยเล็กอยู่กลางกรอบ เหลือทะเลว่างรอบ ๆ เยอะ
      const map = L.map(mapElRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        zoomSnap: 0.25,
      }).setView([13.5, 101], 6)
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        opacity: 0.35, // จางไว้ให้สี polygon เด่น แต่ยังเห็นภูมิประเทศเป็นบริบท
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      const geoLayer = L.geoJSON(thailandGeo as GeoJSON.GeoJsonObject, {
        style: { fillColor: HEAT_EMPTY, fillOpacity: 0.8, color: '#ffffff', weight: 1 },
        onEachFeature: (feature, layer) => {
          const name = feature?.properties?.name_th as string
          if (!name) return
          const bounds = (layer as GeoJSONLayer).getBounds()
          boundsRef.current.set(name, bounds)
          centersRef.current.set(name, [bounds.getCenter().lat, bounds.getCenter().lng])
          layersRef.current.set(name, layer as Path)
          layer.bindTooltip(name, { sticky: true })
          layer.on('click', () => setSelected((prev) => (prev === name ? '' : name)))
          layer.on('mouseover', () => setHovered(name))
          layer.on('mouseout', () => setHovered(''))
        },
      }).addTo(map)

      map.on('zoomend', () => setZoom(map.getZoom()))

      fullBoundsRef.current = geoLayer.getBounds()
      map.fitBounds(fullBoundsRef.current, { padding: [16, 16] })

      mapRef.current = map
      geoLayerRef.current = geoLayer
      setMapReady(true)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      geoLayerRef.current = null
    }
  }, [])

  const styleFor = useCallback((name: string, isHovered: boolean) => {
    const value = byProvince.get(name)?.[metric] ?? 0
    const isSelected = name === selected
    return {
      fillColor: heatColor(value, max),
      fillOpacity: isHovered ? 1 : 0.85,
      color: isSelected ? '#111827' : isHovered ? '#374151' : '#ffffff',
      weight: isSelected ? 2.5 : isHovered ? 2 : 1,
    }
  }, [byProvince, metric, max, selected])

  // ระบายสีใหม่เมื่อเกณฑ์/จังหวัดที่เลือกเปลี่ยน
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    ;(() => {
      geoLayerRef.current?.setStyle((feature) => styleFor(feature?.properties?.name_th as string, false))

      geoLayerRef.current?.eachLayer((layer) => {
        const feature = (layer as GeoJSONLayer & { feature?: GeoJSON.Feature }).feature
        const name = feature?.properties?.name_th as string
        if (!name) return
        const s = byProvince.get(name)
        layer.getTooltip()?.setContent(
          s
            ? `<b>${name}</b><br/>${s.total.toLocaleString()} ชิ้นงาน · เข้าเกณฑ์ ${s.eligible.toLocaleString()} · ตรวจสอบแล้ว ${s.verified.toLocaleString()}`
            : `<b>${name}</b><br/>ยังไม่มีข้อมูล`,
        )
      })
    })()
  }, [mapReady, byProvince, styleFor])

  // ไฮไลต์เฉพาะจังหวัดที่ชี้อยู่ — แตะแค่ 2 layer ไม่ต้อง setStyle ใหม่ทั้ง 77 จังหวัดทุกครั้งที่เมาส์ขยับ
  useEffect(() => {
    if (!mapReady) return
    const layer = hovered ? layersRef.current.get(hovered) : null
    layer?.setStyle(styleFor(hovered, true))
    return () => { layer?.setStyle(styleFor(hovered, false)) }
  }, [mapReady, hovered, styleFor])

  // ป้ายชื่อจังหวัด + จำนวน กลาง polygon — เฉพาะจังหวัดที่มีข้อมูล
  // แยกจาก effect ระบายสีโดยตั้งใจ: ไม่ผูกกับ selected/hovered จะได้ไม่สร้าง marker ใหม่ระหว่าง flyTo
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    ;(async () => {
      const L = (await import('leaflet')).default
      const map = mapRef.current!
      labelsRef.current.forEach((m) => m.remove())
      labelsRef.current = []
      byProvince.forEach((s, province) => {
        const value = s[metric]
        if (value <= 0) return
        const center = centersRef.current.get(province)
        const bounds = boundsRef.current.get(province)
        if (!center || !bounds) return

        // จังหวัดเล็ก ๆ (กรุงเทพฯ อยุธยา สมุทรฯ) ชื่อยาวกว่าตัว polygon — ที่ระดับซูมทั้งประเทศ
        // จะล้นไปทับจังหวัดข้างเคียง จึงโชว์แค่ตัวเลขก่อน แล้วค่อยมีชื่อเมื่อซูมจนกว้างพอ
        const widthPx =
          map.latLngToContainerPoint(bounds.getNorthEast()).x -
          map.latLngToContainerPoint(bounds.getNorthWest()).x
        // 26px คือจุดที่วัดจากของจริง: ระดับซูมทั้งประเทศจังหวัดใหญ่กว้างราว 30px+ (ได้ชื่อ)
        // ส่วนกรุงเทพฯ/อยุธยา ~12-15px (เหลือแค่ตัวเลข) แล้วค่อยมีชื่อเมื่อซูมเข้าไป
        const showName = widthPx >= 26

        const dark = isDarkStep(value, max)
        const marker = L.marker(center, {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: 'hi-prov-label',
            html: `<span class="hi-prov ${dark ? 'hi-prov-on-dark' : ''}">${
              showName ? `<b>${province}</b>` : ''
            }<i>${value.toLocaleString()}</i></span>`,
            iconSize: [0, 0],
          }),
        }).addTo(map)
        labelsRef.current.push(marker)
      })
    })()
  }, [mapReady, byProvince, metric, max, zoom])

  // สลับโหมดเต็มจอแล้วกรอบแผนที่เปลี่ยนขนาด — Leaflet ต้องถูกสั่งให้วัดใหม่ ไม่งั้นแผนที่เพี้ยน
  useEffect(() => {
    if (!mapReady) return
    const t = setTimeout(() => {
      mapRef.current?.invalidateSize()
      if (!selected && fullBoundsRef.current) mapRef.current?.fitBounds(fullBoundsRef.current, { padding: [16, 16] })
    }, 120)
    return () => clearTimeout(t)
  }, [mapReady, fullscreen, selected])

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', onKey)
    // กันหน้าเลื่อนอยู่ข้างหลังตอนแผนที่กินเต็มจอ
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [fullscreen])

  // ซูมตามจังหวัดที่เลือก กลับเป็นทั้งประเทศเมื่อยกเลิกเลือก
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current
    if (selected) {
      const bounds = boundsRef.current.get(selected)
      if (bounds) map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 9, duration: 0.6 })
      return
    }
    if (fullBoundsRef.current) map.fitBounds(fullBoundsRef.current, { padding: [16, 16] })
  }, [mapReady, selected])

  const selectedStat = selected ? byProvince.get(selected) : undefined

  return (
    <div className={fullscreen
      ? 'fixed inset-0 z-[60] bg-white p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-auto'
      : 'grid grid-cols-1 lg:grid-cols-4 gap-4'}>
      {/* แผนที่ */}
      <div className="lg:col-span-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
            {([['total', 'ทั้งหมด'], ['eligible', 'เฉพาะเข้าเกณฑ์']] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setMetric(value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  metric === value ? 'bg-green-600 text-white font-semibold' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {selected && (
              <button type="button" onClick={() => setSelected('')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
                <Maximize2 className="w-3.5 h-3.5" /> ดูทั้งประเทศ
              </button>
            )}
            <button type="button" onClick={() => setFullscreen((v) => !v)}
              title={fullscreen ? 'ออกจากโหมดเต็มจอ (Esc)' : 'แสดงแผนที่เต็มจอ'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white">
              {fullscreen ? <><Shrink className="w-3.5 h-3.5" /> ย่อลง</> : <><Expand className="w-3.5 h-3.5" /> เต็มจอ</>}
            </button>
          </div>
        </div>

        <div className="relative bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* ความสูงอยู่ที่ wrapper เท่านั้น — div ที่ Leaflet ถือต้องมี className คงที่
              ไม่งั้น React เขียนทับ class ที่ Leaflet ใส่ไว้เอง (leaflet-container ฯลฯ) แล้วแผนที่พัง */}
          <div className={fullscreen ? 'h-[calc(100vh-108px)] min-h-[380px]' : 'h-[68vh] min-h-[460px]'}>
            <div ref={mapElRef} className="h-full w-full" />
          </div>

          {/* คำอธิบายสี */}
          <div className="absolute bottom-3 left-3 z-[500] bg-white/95 backdrop-blur rounded-lg border border-gray-100 px-3 py-2 shadow-sm">
            <p className="text-[11px] font-medium text-gray-500 mb-1.5">ความเข้มข้นการเก็บข้อมูล</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-400">น้อย</span>
              {HEAT_RAMP.map((c) => (
                <span key={c} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
              <span className="text-[11px] text-gray-400">มาก ({max.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-6 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: HEAT_EMPTY }} />
              <span className="text-[11px] text-gray-400">ยังไม่มีข้อมูล</span>
            </div>
          </div>
        </div>
      </div>

      {/* อันดับจังหวัด */}
      <aside className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">จังหวัดที่ขับเคลื่อน</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {ranked.length > 0 ? `${ranked.length} จาก 77 จังหวัด · ชี้เพื่อไฮไลต์ · กดเพื่อซูม` : 'ยังไม่มีจังหวัดใดมีข้อมูล'}
          </p>
        </div>
        <ul className={`divide-y divide-gray-50 overflow-y-auto ${fullscreen ? 'max-h-[calc(100vh-220px)]' : 'max-h-[68vh]'}`}>
          {ranked.map((s, i) => (
            <li key={s.province}>
              <button type="button"
                onClick={() => setSelected((prev) => (prev === s.province ? '' : s.province))}
                onMouseEnter={() => setHovered(s.province)}
                onMouseLeave={() => setHovered('')}
                onFocus={() => setHovered(s.province)}
                onBlur={() => setHovered('')}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                  selected === s.province ? 'bg-green-50' : hovered === s.province ? 'bg-gray-100' : 'hover:bg-gray-50/60'
                }`}>
                <span className="text-xs text-gray-300 w-5 tabular-nums">{i + 1}</span>
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: heatColor(s[metric], max) }} />
                <span className="text-sm text-gray-700 flex-1 truncate">{s.province}</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{s[metric].toLocaleString()}</span>
              </button>
            </li>
          ))}
          {ranked.length === 0 && (
            <li className="px-4 py-10 text-center">
              <MapPin className="w-7 h-7 text-gray-200 mx-auto" />
              <p className="mt-2 text-sm text-gray-400">ยังไม่มีข้อมูลให้แสดงบนแผนที่</p>
            </li>
          )}
        </ul>
        {selectedStat && (
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/60">
            <p className="text-sm font-semibold text-gray-800">{selectedStat.province}</p>
            <dl className="mt-1.5 space-y-1 text-xs">
              <div className="flex justify-between"><dt className="text-gray-500">ชิ้นงานทั้งหมด</dt><dd className="text-gray-800 tabular-nums">{selectedStat.total.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">เข้าเกณฑ์</dt><dd className="text-gray-800 tabular-nums">{selectedStat.eligible.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">ตรวจสอบแล้ว</dt><dd className="text-gray-800 tabular-nums">{selectedStat.verified.toLocaleString()}</dd></div>
            </dl>
          </div>
        )}
      </aside>
    </div>
  )
}
