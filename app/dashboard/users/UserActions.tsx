'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@base-ui-components/react/dialog'
import { UserPlus, SquarePen, Trash2, X, Loader2 } from 'lucide-react'
import { createUser, updateUser, deleteUser, type RoleValue, type UserInput } from '@/app/actions/user'
import { PROVINCE_ZONE } from '@/app/lib/province-zone'

const ROLES: RoleValue[] = ['MEMBER', 'ADMIN', 'SUPERADMIN']
const PROVINCES = Object.keys(PROVINCE_ZONE).sort((a, b) => a.localeCompare(b, 'th'))

export type UserLite = { id: number; firstName: string; lastName: string; email: string; role: RoleValue; province?: string | null }

const field = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-green-500'
const label = 'block text-xs font-medium text-gray-500 mb-1'

function UserFormDialog({
  mode, user, isSelf, triggerClassName, children,
}: { mode: 'create' | 'edit'; user?: UserLite; isSelf?: boolean; triggerClassName: string; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const formId = useId()
  const blank: UserInput = { firstName: '', lastName: '', email: '', password: '', role: 'MEMBER', province: '' }
  const [form, setForm] = useState<UserInput>(blank)

  const onOpenChange = (o: boolean) => {
    if (pending) return
    setOpen(o)
    if (o) {
      setError('')
      setForm(mode === 'edit' && user
        ? { firstName: user.firstName, lastName: user.lastName, email: user.email, password: '', role: user.role, province: user.province ?? '' }
        : blank)
    }
  }

  const set = (k: keyof UserInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    start(async () => {
      try {
        const res = mode === 'create' ? await createUser(form) : await updateUser(user!.id, form)
        if (res?.error) { setError(res.error); return }
        setOpen(false)
        router.refresh()
      } catch { setError('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง') }
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger aria-label={mode === 'create' ? 'เพิ่มผู้ใช้งาน' : `แก้ไข ${user?.firstName} ${user?.lastName}`} className={triggerClassName}>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 max-h-[calc(100dvh-2rem)] overflow-y-auto w-[440px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl outline-none">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <Dialog.Title className="text-sm font-semibold text-gray-800">
              {mode === 'create' ? 'เพิ่มผู้ใช้งาน' : 'แก้ไขผู้ใช้งาน'}
            </Dialog.Title>
            <Dialog.Close aria-label="ปิด" className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${formId}-firstName`} className={label}>ชื่อ</label>
                <input id={`${formId}-firstName`} required className={field} value={form.firstName} onChange={set('firstName')} autoFocus />
              </div>
              <div>
                <label htmlFor={`${formId}-lastName`} className={label}>นามสกุล</label>
                <input id={`${formId}-lastName`} required className={field} value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>
            <div>
              <label htmlFor={`${formId}-email`} className={label}>อีเมล</label>
              <input id={`${formId}-email`} required type="email" className={field} value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label htmlFor={`${formId}-password`} className={label}>
                รหัสผ่าน {mode === 'edit' && <span className="font-normal text-gray-400">(เว้นว่างถ้าไม่เปลี่ยน)</span>}
              </label>
              <input id={`${formId}-password`} required={mode === 'create'} minLength={6} type="password" autoComplete="new-password" className={field}
                value={form.password} onChange={set('password')} placeholder={mode === 'edit' ? '••••••' : ''} />
            </div>
            <div>
              <label htmlFor={`${formId}-province`} className={label}>
                จังหวัดที่สังกัด <span className="font-normal text-gray-400">(ภาคเติมให้อัตโนมัติ)</span>
              </label>
              <select id={`${formId}-province`} className={field} value={form.province ?? ''} onChange={set('province')}>
                <option value="">ไม่ระบุสังกัด</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {form.province && (
                <p className="mt-1 text-[11px] text-gray-400">ภาค: {PROVINCE_ZONE[form.province] ?? 'ไม่ทราบ'}</p>
              )}
            </div>
            <div>
              <label htmlFor={`${formId}-role`} className={label}>สิทธิ์</label>
              <select id={`${formId}-role`} className={field} value={form.role} onChange={set('role')} disabled={isSelf}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {isSelf && <p className="mt-1 text-[11px] text-gray-400">เปลี่ยนสิทธิ์ของตนเองไม่ได้</p>}
            </div>

            {error && <p role="alert" className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">ยกเลิก</Dialog.Close>
              <button type="submit" disabled={pending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'create' ? 'เพิ่มผู้ใช้' : 'บันทึก'}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function AddUserButton() {
  return (
    <UserFormDialog mode="create"
      triggerClassName="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
      <UserPlus className="w-4 h-4" /> เพิ่มผู้ใช้
    </UserFormDialog>
  )
}

export function EditUserButton({ user, isSelf }: { user: UserLite; isSelf?: boolean }) {
  return (
    <UserFormDialog mode="edit" user={user} isSelf={isSelf}
      triggerClassName="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs text-gray-600 hover:border-green-200 hover:bg-green-50 hover:text-green-700 transition-colors">
      <SquarePen aria-hidden="true" className="w-3.5 h-3.5" /> แก้ไข
    </UserFormDialog>
  )
}

export function DeleteUserButton({ user }: { user: UserLite }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  const onDelete = () => {
    setError('')
    start(async () => {
      try {
        const res = await deleteUser(user.id)
        if (res?.error) { setError(res.error); return }
        setOpen(false)
        router.refresh()
      } catch { setError('ลบไม่สำเร็จ กรุณาลองอีกครั้ง') }
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (pending) return; setOpen(o); if (o) setError('') }}>
      <Dialog.Trigger aria-label={`ลบ ${user.firstName} ${user.lastName}`} title="ลบผู้ใช้"
        className="inline-flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
        <Trash2 className="w-4 h-4" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl outline-none p-5">
          <Dialog.Title className="text-sm font-semibold text-gray-800">ลบผู้ใช้งาน</Dialog.Title>
          <p className="mt-2 text-sm text-gray-500">
            ต้องการลบ <b className="text-gray-800">{user.firstName} {user.lastName}</b> ({user.email})? การลบนี้ย้อนกลับไม่ได้
          </p>
          {error && <p role="alert" className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">ยกเลิก</Dialog.Close>
            <button type="button" onClick={onDelete} disabled={pending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50">
              {pending && <Loader2 className="w-4 h-4 animate-spin" />} ลบ
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
