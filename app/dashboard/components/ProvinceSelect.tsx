'use client'

import { useRouter } from 'next/navigation'
import { Combobox } from '@base-ui-components/react/combobox'
import { ChevronDown, MapPin } from 'lucide-react'

export type ProvinceOption = { name: string; zone: string; count: number }

// เลือกจังหวัดบนหน้าภาพรวม → ?province= ให้ KPI/กราฟทั้งหน้าเป็นของจังหวัดนั้น (แชร์ลิงก์ต่อได้)
// 77 จังหวัดยาวเกินจะไล่หาใน <select> — ใช้ Base UI Combobox พิมพ์ค้นหาได้ (ชื่อจังหวัดหรือภาค)
// จังหวัดที่มีข้อมูลขึ้นก่อน ที่เหลือจางไว้ท้ายรายการ
export default function ProvinceSelect({ value, options }: { value: string; options: ProvinceOption[] }) {
  const router = useRouter()
  const selected = options.find((o) => o.name === value) ?? null

  return (
    // key: เปลี่ยนจังหวัดผ่าน URL (เช่นกด "ทั้งประเทศ") แล้วให้ช่องรีเซ็ตตาม
    <Combobox.Root<ProvinceOption>
      key={value}
      items={options}
      defaultValue={selected}
      autoHighlight // พิมพ์แล้วกด Enter เลือกตัวแรกได้เลย
      onValueChange={(o) => router.push(o ? `/dashboard?province=${encodeURIComponent(o.name)}` : '/dashboard')}
      itemToStringLabel={(o) => o.name}
      isItemEqualToValue={(a, b) => a.name === b.name}
      filter={(o, query) => {
        const q = query.trim()
        return !q || o.name.includes(q) || o.zone.includes(q)
      }}
    >
      <div className="relative w-64 max-w-full">
        <MapPin aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-green-600" />
        <Combobox.Input
          aria-label="เลือกจังหวัด"
          placeholder="ทุกจังหวัด — พิมพ์ค้นหา"
          className="min-h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
        <Combobox.Trigger aria-label="แสดงรายชื่อจังหวัด" className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:text-gray-600">
          <ChevronDown aria-hidden="true" className="size-4" />
        </Combobox.Trigger>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} align="end" className="z-[60] w-[var(--anchor-width)] min-w-64">
          <Combobox.Popup className="max-h-80 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg outline-none">
            <Combobox.Empty className="px-3 py-2 text-sm text-gray-400">ไม่พบจังหวัดที่ค้นหา</Combobox.Empty>
            <Combobox.List>
              {(o: ProvinceOption) => (
                <Combobox.Item
                  key={o.name}
                  value={o}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm data-[highlighted]:bg-green-50 data-[selected]:font-semibold"
                >
                  <span className={`flex-1 truncate ${o.count ? 'text-gray-800' : 'text-gray-400'}`}>{o.name}</span>
                  <span className="text-[11px] text-gray-400">{o.zone}</span>
                  <span className={`w-10 text-right text-xs tabular-nums ${o.count ? 'font-medium text-green-700' : 'text-gray-300'}`}>{o.count.toLocaleString()}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
