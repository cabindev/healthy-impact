'use client'

// กำหนด "โดย admin" ย้อนหลังให้รายการในตัวกรองที่ยังไม่รู้ผู้บันทึก (SUPERADMIN เท่านั้น)
// ใช้ตัวกรองแทนการติ๊กเลือก — ข้อมูลเก่าหนึ่งพื้นที่มีเป็นพันใบ ติ๊กทีละหน้า (50) ไม่ไหว

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@base-ui-components/react/dialog'
import { UserRoundCheck, X } from 'lucide-react'
import { assignSurveyCreator } from '@/app/actions/survey'
import type { SurveyFilterParams } from '@/app/lib/survey-filters'

export type AdminChoice = { id: number; name: string; email: string }

export default function AssignCreatorDialog({ filter, filterLabel, count, admins }: {
  filter: SurveyFilterParams
  /** สรุปตัวกรองให้อ่านรู้เรื่อง เช่น "จังหวัดพะเยา" */
  filterLabel: string
  count: number
  admins: AdminChoice[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = (v: boolean) => {
    setOpen(v)
    if (!v) { setUserId(''); setError(null) }
  }

  const save = async () => {
    setError(null)
    if (!userId) { setError('กรุณาเลือก admin'); return }
    setSaving(true)
    try {
      const res = await assignSurveyCreator(filter, Number(userId))
      if (!res.ok) { setError(res.error); return }
      close(false)
      router.refresh()
    } catch {
      setError('บันทึกไม่สำเร็จ โปรดลองอีกครั้ง')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Trigger className="text-sm font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2 shrink-0 inline-flex items-center gap-1.5">
        <UserRoundCheck className="w-4 h-4" /> กำหนดผู้บันทึก
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div>
              <Dialog.Title className="text-sm font-semibold text-gray-800">กำหนดผู้บันทึก (โดย admin)</Dialog.Title>
              <p className="text-xs text-gray-400 mt-0.5">
                {filterLabel} · <b className="text-gray-600 tabular-nums">{count.toLocaleString()}</b> รายการที่ยังไม่รู้ผู้บันทึก
              </p>
            </div>
            <Dialog.Close aria-label="ปิด" className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="px-5 py-4 space-y-3">
            <label htmlFor="assign-creator" className="block text-sm font-medium text-gray-700">
              admin ผู้บันทึก <span className="text-red-400">*</span>
            </label>
            <select id="assign-creator" value={userId} onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-green-500">
              <option value="">เลือก admin</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>{a.name} · {a.email}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 leading-relaxed">
              รายการที่มีผู้บันทึกอยู่แล้วจะไม่ถูกเปลี่ยน · admin ที่เลือกจะนับเป็นเจ้าของรายการเหล่านี้ และ<b>ลบได้</b>
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <Dialog.Close className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">ยกเลิก</Dialog.Close>
            <button type="button" onClick={save} disabled={saving}
              className={`px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {saving ? 'กำลังบันทึก...' : `กำหนดให้ ${count.toLocaleString()} รายการ`}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
