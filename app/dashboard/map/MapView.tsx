'use client'

// แผนที่ความเข้มข้นการเก็บข้อมูลรายจังหวัด — ระบายสี polygon ตามจำนวนแบบสอบถาม
// ปักชื่อจังหวัด + จำนวนชิ้นงานไว้กลาง polygon ของตัวเอง — เฉพาะจังหวัดที่มีข้อมูล
// (ถ้าปักครบ 77 จังหวัดตัวหนังสือจะทับกันจนอ่านไม่ออกที่ระดับซูมทั้งประเทศ)
// จังหวัดที่ยังไม่มีข้อมูลดูชื่อได้จาก hover — ชี้แล้วขึ้น tooltip และแถวในแผงอันดับสว่างตาม
// ใช้ Leaflet ล้วน โหลดใน useEffect เพื่อเลี่ยง SSR

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Map as LeafletMap, GeoJSON as GeoJSONLayer, LatLngBounds, Marker, Path } from 'leaflet'
import { Expand, MapPin, Maximize2, Shrink, Search, X, ArrowUpRight, MousePointer2, Layers, CheckCheck, ClipboardList, CircleCheck } from 'lucide-react'
import Link from 'next/link'
import { PROVINCE_ZONE } from '@/app/lib/province-zone'
import 'leaflet/dist/leaflet.css'
import thailandGeo from '@/app/data/thailand.json'
import { HEAT_EMPTY, HEAT_RAMP, heatColor, isDarkStep, type ProvinceStat } from '@/app/lib/map-heat'

export type { ProvinceStat }

type Metric = 'total' | 'eligible' | 'verified'
const METRICS = [
  { value: 'total', label: 'ทั้งหมด', icon: ClipboardList },
  { value: 'eligible', label: 'เข้าเกณฑ์', icon: CircleCheck },
  { value: 'verified', label: 'ตรวจสอบแล้ว', icon: CheckCheck },
] as const
const PROVINCES = thailandGeo.features.map(f => f.properties.name_th).sort((a, b) => a.localeCompare(b, 'th'))

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
  const [query, setQuery] = useState('')
  const [zone, setZone] = useState('')
  const [coverage, setCoverage] = useState('all')

  const byProvince = useMemo(() => new Map(stats.map((s) => [s.province, s])), [stats])
  const max = useMemo(() => Math.max(1, ...stats.map((s) => s[metric])), [stats, metric])
  const ranked = useMemo(() => PROVINCES.map(province => byProvince.get(province) ?? { province, total: 0, eligible: 0, verified: 0 })
    .filter(s => s.province.includes(query.trim()) && (!zone || PROVINCE_ZONE[s.province] === zone) && (coverage === 'all' || (coverage === 'with' ? s[metric] > 0 : s[metric] === 0)))
    .sort((a, b) => b[metric] - a[metric] || a.province.localeCompare(b.province, 'th')), [byProvince, query, zone, coverage, metric])
  const metricLabel = METRICS.find(m => m.value === metric)!.label


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
      const map = mapRef.current
      if (!map) return
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
    if (!mapReady || !mapElRef.current) return
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize())
    observer.observe(mapElRef.current)
    return () => observer.disconnect()
  }, [mapReady])

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

  const selectedStat = selected ? byProvince.get(selected) ?? { province: selected, total: 0, eligible: 0, verified: 0 } : undefined

  return (
    <div className={fullscreen
      ? 'fixed inset-0 z-[60] overflow-auto bg-gray-50 p-3 sm:p-5'
      : ''}>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="แผนที่รายจังหวัด" className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
            <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1" aria-label="ข้อมูลที่แสดงบนแผนที่">
              {METRICS.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={metric === value} onClick={() => setMetric(value)} className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs transition-colors sm:text-sm ${metric === value ? 'bg-white font-semibold text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}><Icon aria-hidden="true" className="size-4" />{label}</button>)}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setSelected(''); if (fullBoundsRef.current) mapRef.current?.fitBounds(fullBoundsRef.current, { padding: [16, 16] }) }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50"><Maximize2 aria-hidden="true" className="size-4" />ดูทั้งประเทศ</button>
              <button type="button" aria-pressed={fullscreen} onClick={() => setFullscreen(v => !v)} title={fullscreen ? 'ออกจากโหมดเต็มจอ (Esc)' : 'แสดงแผนที่เต็มจอ'} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50">{fullscreen ? <Shrink aria-hidden="true" className="size-4" /> : <Expand aria-hidden="true" className="size-4" />}{fullscreen ? 'ย่อลง' : 'เต็มจอ'}</button>
            </div>
          </div>
          <div className="relative">
            {/* Keep this element's classes stable: Leaflet owns its additional classes. */}
            <div className={fullscreen ? 'h-[72dvh] min-h-[360px]' : 'h-[58vh] min-h-[360px] sm:h-[64vh] sm:min-h-[460px]'}><div ref={mapElRef} aria-label="แผนที่ประเทศไทย เลือกจังหวัดได้จากรายชื่อด้านข้าง" className="h-full w-full" /></div>
            {!mapReady && <div role="status" className="absolute inset-0 z-[500] flex items-center justify-center bg-gray-50 text-sm text-gray-500">กำลังเตรียมแผนที่...</div>}
            <div className="absolute left-3 top-3 z-[500] max-w-[calc(100%-1.5rem)] rounded-xl border border-gray-100 bg-white/95 px-3 py-2 shadow-sm backdrop-blur"><p className="flex items-center gap-2 text-xs font-medium text-gray-700"><Layers aria-hidden="true" className="size-4 text-green-600" />{selected || 'ภาพรวมประเทศไทย'}<span className="text-gray-400">· {metricLabel}</span></p></div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
            <div><p className="mb-1.5 text-xs font-medium text-gray-600">จำนวนแบบสอบถาม · {metricLabel}</p><div className="flex flex-wrap items-center gap-1 text-[10px] text-gray-500"><span className="mr-1">น้อย</span>{HEAT_RAMP.map(c => <span key={c} className="h-2.5 w-6 rounded-sm" style={{ backgroundColor: c }} />)}<span className="ml-1">มาก (สูงสุด {max === 1 && !stats.some(s => s[metric] > 0) ? 0 : max.toLocaleString()})</span><span className="ml-3 h-2.5 w-3 rounded-sm border border-gray-200" style={{ backgroundColor: HEAT_EMPTY }} /><span>0 รายการ</span></div></div>
            <p className="flex items-center gap-1.5 text-[11px] text-gray-400"><MousePointer2 aria-hidden="true" className="size-3.5" />คลิกจังหวัดเพื่อดูรายละเอียด</p>
          </div>
        </section>
        <aside className="flex min-w-0 flex-col gap-4">
          <section aria-label="รายละเอียดจังหวัด" aria-live="polite" className="rounded-2xl border border-green-100 bg-green-50/60 p-4">
            {selectedStat ? <>
              <div className="flex items-start justify-between gap-2"><div><p className="mb-1 text-xs text-green-700">จังหวัดที่เลือก · {PROVINCE_ZONE[selectedStat.province] ? `ภาค${PROVINCE_ZONE[selectedStat.province]}` : 'ไม่ระบุภาค'}</p><h2 className="text-lg font-semibold text-gray-800">{selectedStat.province}</h2></div><button aria-label="ยกเลิกเลือกจังหวัด" onClick={() => setSelected('')} className="rounded-lg p-2 text-green-700 hover:bg-green-100"><X className="size-4" /></button></div>
              <dl className="mt-4 grid grid-cols-3 gap-2">{METRICS.map(({ value, label }) => <div key={value} className="rounded-xl bg-white p-2.5"><dt className="text-[10px] text-gray-500">{label}</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-gray-800">{selectedStat[value].toLocaleString()}</dd></div>)}</dl>
              {selectedStat.total > 0 ? <Link href={`/dashboard/surveys?province=${encodeURIComponent(selectedStat.province)}`} className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-green-600 px-3 text-sm font-medium text-white hover:bg-green-700">ดูแบบสอบถามในจังหวัด<ArrowUpRight aria-hidden="true" className="size-4" /></Link> : <p className="mt-3 text-xs text-gray-500">จังหวัดนี้ยังไม่มีข้อมูลแบบสอบถาม</p>}
            </> : <div className="flex items-start gap-3"><span className="rounded-xl bg-white p-2.5 text-green-600"><MapPin aria-hidden="true" className="size-5" /></span><div><h2 className="text-sm font-semibold text-gray-800">สำรวจข้อมูลรายจังหวัด</h2><p className="mt-1 text-xs leading-relaxed text-gray-500">เลือกพื้นที่บนแผนที่หรือจากรายชื่อ เพื่อดูสรุปและเปิดแบบสอบถามของจังหวัดนั้น</p></div></div>}
          </section>
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
            <div className="space-y-3 border-b border-gray-100 p-4">
              <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-gray-800">รายชื่อจังหวัด</h2><span role="status" className="text-xs text-gray-400">{ranked.length} / {PROVINCES.length}</span></div>
              <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-gray-400" /><input aria-label="ค้นหาจังหวัดในรายชื่อ" value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหาจังหวัด..." className="min-h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" /></div>
              <div className="grid grid-cols-2 gap-2"><select aria-label="กรองรายชื่อตามภาค" value={zone} onChange={e => setZone(e.target.value)} className="min-h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-2 text-xs"><option value="">ทุกภาค</option>{[...new Set(Object.values(PROVINCE_ZONE))].map(z => <option key={z} value={z}>ภาค{z}</option>)}</select><select aria-label="กรองรายชื่อตามจำนวนข้อมูล" value={coverage} onChange={e => setCoverage(e.target.value)} className="min-h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-2 text-xs"><option value="all">ทุกจังหวัด</option><option value="with">มีข้อมูล</option><option value="without">ไม่มีข้อมูล</option></select></div>
              <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400"><p>เรียงตาม{metricLabel} · ตัวกรองใช้กับรายชื่อ</p>{(query || zone || coverage !== 'all') && <button onClick={() => { setQuery(''); setZone(''); setCoverage('all') }} className="shrink-0 rounded px-1 py-1 text-green-700 hover:bg-green-50">ล้างตัวกรอง</button>}</div>
            </div>
            <ul className="max-h-[380px] divide-y divide-gray-50 overflow-y-auto xl:max-h-[440px]">
              {ranked.map(s => <li key={s.province}><button type="button" aria-pressed={selected === s.province} onClick={() => setSelected(prev => prev === s.province ? '' : s.province)} onMouseEnter={() => setHovered(s.province)} onMouseLeave={() => setHovered('')} onFocus={() => setHovered(s.province)} onBlur={() => setHovered('')} className={`w-full px-4 py-3 text-left transition-colors ${selected === s.province ? 'bg-green-50' : hovered === s.province ? 'bg-gray-100' : 'hover:bg-gray-50'}`}><div className="flex items-center gap-2"><span className="size-2.5 shrink-0 rounded-sm border border-black/5" style={{ backgroundColor: heatColor(s[metric], max) }} /><span className="flex-1 truncate text-sm text-gray-700">{s.province}</span><span className={`text-sm font-semibold tabular-nums ${s[metric] ? 'text-gray-800' : 'text-gray-300'}`}>{s[metric].toLocaleString()}</span></div><div className="ml-4 mt-2 h-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-green-500" style={{ width: `${s[metric] / max * 100}%` }} /></div></button></li>)}
              {ranked.length === 0 && <li className="px-4 py-10 text-center"><Search aria-hidden="true" className="mx-auto size-7 text-gray-300" /><p className="mt-2 text-sm text-gray-500">ไม่พบจังหวัดที่ตรงกับเงื่อนไข</p><p className="mt-1 text-xs text-gray-400">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p></li>}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
