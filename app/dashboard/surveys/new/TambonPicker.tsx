'use client'

import { Combobox } from '@base-ui-components/react/combobox'
import { useTambonSearch, type TambonEntry } from '@/app/hooks/useTambonSearch'

type Geo = { tambon?: string; amphoe?: string; province?: string }

const inputCls = 'block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 bg-white'

// เลือกตำบลแล้วเติม อำเภอ/จังหวัด อัตโนมัติ (แบบ cm-local)
// ใช้ Base UI Combobox — ได้ keyboard nav (↑↓/Enter), ARIA combobox, click-outside/portal
// (เรากรองเอง min 2 ตัวอักษร/3 ฟิลด์ → ส่ง items ที่กรองแล้ว + filter={null})
export default function TambonPicker({ value, onChange }: { value: Geo; onChange: (v: { tambon: string; amphoe: string; province: string }) => void }) {
  const initial = value.tambon
    ? { TAMBON_T: value.tambon, AMPHOE_T: value.amphoe ?? '', CHANGWAT_T: value.province ?? '' }
    : null

  const { search, setSearch, selected, setSelected, filtered, selectTambon } = useTambonSearch(initial)

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2 border border-green-200 bg-green-50 rounded-lg">
        <div className="text-sm">
          <span className="font-medium text-gray-900">ต.{selected.TAMBON_T}</span>
          <span className="text-gray-500"> · อ.{selected.AMPHOE_T} · จ.{selected.CHANGWAT_T}</span>
        </div>
        <button type="button" onClick={() => { setSelected(null); setSearch(''); onChange({ tambon: '', amphoe: '', province: '' }) }}
          className="text-xs text-green-700 hover:text-green-900 font-medium shrink-0">เปลี่ยน</button>
      </div>
    )
  }

  return (
    <Combobox.Root<TambonEntry>
      items={filtered}
      filter={null}
      onValueChange={(t) => {
        if (!t) return
        selectTambon(t)
        onChange({ tambon: t.TAMBON_T, amphoe: t.AMPHOE_T, province: t.CHANGWAT_T })
      }}
      onInputValueChange={(v) => setSearch(v)}
      itemToStringLabel={(t) => `ต.${t.TAMBON_T} · อ.${t.AMPHOE_T} · จ.${t.CHANGWAT_T}`}
    >
      <Combobox.Input placeholder="พิมพ์ชื่อตำบล / อำเภอ / จังหวัด (อย่างน้อย 2 ตัวอักษร)" className={inputCls} />
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-30 w-[var(--anchor-width)]">
          <Combobox.Popup className="max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg outline-none">
            <Combobox.Empty className="px-3 py-2 text-sm text-gray-400">
              {search.length >= 2 ? 'ไม่พบตำบลที่ค้นหา' : 'พิมพ์อย่างน้อย 2 ตัวอักษร'}
            </Combobox.Empty>
            <Combobox.List>
              {(t: TambonEntry, i: number) => (
                <Combobox.Item
                  key={`${t.TAMBON_T}-${t.AMPHOE_T}-${i}`}
                  value={t}
                  className="cursor-pointer px-3 py-2 text-sm border-b border-gray-50 last:border-0 data-[highlighted]:bg-green-50"
                >
                  <span className="text-gray-800">ต.{t.TAMBON_T}</span>{' '}
                  <span className="text-gray-400">อ.{t.AMPHOE_T} · จ.{t.CHANGWAT_T}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
