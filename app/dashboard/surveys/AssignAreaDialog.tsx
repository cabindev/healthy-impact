'use client'

// เติมพื้นที่ให้รายการที่เลือกไว้พร้อมกัน — ใช้ไล่แก้ข้อมูลเก่าที่ยังไม่ระบุจังหวัด
// (ผู้เก็บข้อมูลคนเดียวมักลงพื้นที่ตำบลเดียวทั้งชุด จึงกำหนดทีเดียวได้)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@base-ui-components/react/dialog'
import { MapPin, X } from 'lucide-react'
import TambonPicker from './new/TambonPicker'
import { setSurveyArea } from '@/app/actions/survey'

type Geo = { tambon: string; amphoe: string; province: string }

export default function AssignAreaDialog({ ids, onDone }: { ids: number[]; onDone: () => void }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [geo, setGeo] = useState<Geo>({ tambon: '', amphoe: '', province: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = (v: boolean) => {
    setOpen(v)
    if (!v) { setGeo({ tambon: '', amphoe: '', province: '' }); setError(null) }
  }

  const save = async () => {
    setError(null)
    if (!geo.tambon || !geo.province) { setError('กรุณาเลือกตำบล'); return }
    setSaving(true)
    try {
      const res = await setSurveyArea(ids, geo)
      if (!res.ok) { setError(res.error); setSaving(false); return }
      close(false)
      onDone()
      router.refresh()
    } catch {
      setError('บันทึกไม่สำเร็จ โปรดลองอีกครั้ง')
    } finally {
      setSaving(false)
    }
  }

  return (
    // disablePointerDismissal: รายการของ TambonPicker เป็น portal นอก Dialog.Popup
    // ถ้าปล่อยให้ปิดด้วยการคลิกนอกกรอบ การ "เลือกตำบล" จะกลายเป็นการปิด dialog ทิ้ง
    <Dialog.Root open={open} onOpenChange={close} disablePointerDismissal>
      <Dialog.Trigger className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
        <MapPin className="w-4 h-4" /> กำหนดพื้นที่
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div>
              <Dialog.Title className="text-sm font-semibold text-gray-800">กำหนดพื้นที่ให้รายการที่เลือก</Dialog.Title>
              <p className="text-xs text-gray-400 mt-0.5">{ids.length.toLocaleString()} รายการ · เขียนทับ ตำบล/อำเภอ/จังหวัด เดิม</p>
            </div>
            <Dialog.Close aria-label="ปิด" className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="px-5 py-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              ตำบล / อำเภอ / จังหวัด <span className="text-red-400">*</span>
            </label>
            <TambonPicker value={geo} onChange={setGeo} />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <Dialog.Close className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">ยกเลิก</Dialog.Close>
            <button type="button" onClick={save} disabled={saving}
              className={`px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกพื้นที่'}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
