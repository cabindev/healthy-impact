'use client'

// แก้ข้อมูลส่วนตัวของตนเอง — ใช้ TambonPicker ตัวเดียวกับแบบสอบถาม
// เลือกตำบลแล้วอำเภอ/จังหวัดเติมอัตโนมัติ (ภาคคำนวณต่อฝั่ง server จากจังหวัด)

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Dialog } from '@base-ui-components/react/dialog'
import { Loader2, SquarePen, X } from 'lucide-react'
import TambonPicker from '../surveys/new/TambonPicker'
import { updateMyProfile } from '@/app/actions/user'

const field = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-green-500'
const label = 'block text-xs font-medium text-gray-500 mb-1'

export type MyProfile = {
  firstName: string
  lastName: string
  tambon: string
  amphoe: string
  province: string
}

export default function ProfileEditDialog({ profile }: { profile: MyProfile }) {
  const router = useRouter()
  const { update } = useSession()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState<MyProfile>(profile)

  const onOpenChange = (o: boolean) => {
    setOpen(o)
    if (o) { setError(''); setForm(profile) }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    start(async () => {
      const res = await updateMyProfile(form)
      if (res?.error) { setError(res.error); return }
      // อัปเดต JWT ด้วย ไม่งั้นชื่อบน sidebar/topnav ยังเป็นของเดิมจนกว่าจะ login ใหม่
      await update({ firstName: form.firstName, lastName: form.lastName, province: form.province })
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <Dialog.Trigger className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0">
        <SquarePen className="w-4 h-4" /> แก้ไขข้อมูล
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div>
              <Dialog.Title className="text-sm font-semibold text-gray-800">แก้ไขข้อมูลส่วนตัว</Dialog.Title>
              <p className="text-xs text-gray-400 mt-0.5">อีเมล สิทธิ์ และรหัสผ่าน แก้ที่นี่ไม่ได้</p>
            </div>
            <Dialog.Close aria-label="ปิด" className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>ชื่อ</label>
                <input className={field} value={form.firstName} autoFocus
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <label className={label}>นามสกุล</label>
                <input className={field} value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className={label}>
                พื้นที่ที่รับผิดชอบ <span className="font-normal text-gray-400">(เลือกตำบล แล้วอำเภอ-จังหวัดเติมอัตโนมัติ)</span>
              </label>
              <TambonPicker
                value={{ tambon: form.tambon, amphoe: form.amphoe, province: form.province }}
                onChange={(g) => setForm((f) => ({ ...f, ...g }))}
              />
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">ยกเลิก</Dialog.Close>
              <button type="submit" disabled={pending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                {pending && <Loader2 className="w-4 h-4 animate-spin" />} บันทึก
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
