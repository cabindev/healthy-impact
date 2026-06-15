'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@base-ui-components/react/dialog'
import { UserPlus, SquarePen, Trash2, X, Loader2 } from 'lucide-react'
import { createUser, updateUser, deleteUser, type RoleValue, type UserInput } from '@/app/actions/user'

const ROLES: RoleValue[] = ['MEMBER', 'ADMIN', 'SUPERADMIN']

export type UserLite = { id: number; firstName: string; lastName: string; email: string; role: RoleValue }

const field = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-green-500'
const label = 'block text-xs font-medium text-gray-500 mb-1'

function UserFormDialog({
  mode, user, isSelf, triggerClassName, children,
}: { mode: 'create' | 'edit'; user?: UserLite; isSelf?: boolean; triggerClassName: string; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const blank: UserInput = { firstName: '', lastName: '', email: '', password: '', role: 'MEMBER' }
  const [form, setForm] = useState<UserInput>(blank)

  const onOpenChange = (o: boolean) => {
    setOpen(o)
    if (o) {
      setError('')
      setForm(mode === 'edit' && user
        ? { firstName: user.firstName, lastName: user.lastName, email: user.email, password: '', role: user.role }
        : blank)
    }
  }

  const set = (k: keyof UserInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    start(async () => {
      const res = mode === 'create' ? await createUser(form) : await updateUser(user!.id, form)
      if (res?.error) { setError(res.error); return }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger className={triggerClassName}>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[400px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl outline-none">
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
                <label className={label}>ชื่อ</label>
                <input className={field} value={form.firstName} onChange={set('firstName')} autoFocus />
              </div>
              <div>
                <label className={label}>นามสกุล</label>
                <input className={field} value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>
            <div>
              <label className={label}>อีเมล</label>
              <input type="email" className={field} value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className={label}>
                รหัสผ่าน {mode === 'edit' && <span className="font-normal text-gray-400">(เว้นว่างถ้าไม่เปลี่ยน)</span>}
              </label>
              <input type="password" autoComplete="new-password" className={field}
                value={form.password} onChange={set('password')} placeholder={mode === 'edit' ? '••••••' : ''} />
            </div>
            <div>
              <label className={label}>สิทธิ์</label>
              <select className={field} value={form.role} onChange={set('role')} disabled={isSelf}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {isSelf && <p className="mt-1 text-[11px] text-gray-400">เปลี่ยนสิทธิ์ของตนเองไม่ได้</p>}
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

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
      triggerClassName="inline-flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors">
      <SquarePen className="w-4 h-4" />
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
      const res = await deleteUser(user.id)
      if (res?.error) { setError(res.error); return }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (o) setError('') }}>
      <Dialog.Trigger aria-label="ลบ" title="ลบ"
        className="inline-flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors">
        <Trash2 className="w-4 h-4" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl outline-none p-5">
          <Dialog.Title className="text-sm font-semibold text-gray-800">ลบผู้ใช้งาน</Dialog.Title>
          <p className="mt-2 text-sm text-gray-500">
            ต้องการลบ <b className="text-gray-800">{user.firstName} {user.lastName}</b> ({user.email})? การลบนี้ย้อนกลับไม่ได้
          </p>
          {error && <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
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
