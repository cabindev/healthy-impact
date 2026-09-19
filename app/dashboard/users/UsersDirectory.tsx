'use client'

import { useState } from 'react'
import { Users, ShieldCheck, UserRound, Search, MapPin, ClipboardList, ChevronLeft, ChevronRight, SlidersHorizontal, SearchX } from 'lucide-react'
import RoleSelect from './RoleSelect'
import { AddUserButton, EditUserButton, DeleteUserButton, type UserLite } from './UserActions'

type DirectoryUser = UserLite & { zone: string | null; createdAt: string; _count: { surveys: number } }
const control = 'min-h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500'

export default function UsersDirectory({ users, meId, isSuperAdmin, isAdmin }: { users: DirectoryUser[]; meId?: number; isSuperAdmin: boolean; isAdmin: boolean }) {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [province, setProvince] = useState('')
  const [sort, setSort] = useState('role')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const provinces = [...new Set(users.flatMap(u => u.province ? [u.province] : []))].sort((a, b) => a.localeCompare(b, 'th'))
  const search = query.trim().toLocaleLowerCase('th')
  const filtered = users.filter(u => (!role || u.role === role) && (!province || (province === 'unset' ? !u.province : u.province === province)) && `${u.firstName} ${u.lastName} ${u.email} ${u.province ?? ''}`.toLocaleLowerCase('th').includes(search))
  filtered.sort((a, b) => sort === 'name' ? `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'th') : sort === 'surveys' ? b._count.surveys - a._count.surveys : sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : 0)
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize)
  const hasFilters = Boolean(query || role || province)
  const reset = () => { setQuery(''); setRole(''); setProvince(''); setPage(1) }
  const stats = [
    { label: 'ผู้ใช้ทั้งหมด', count: users.length, icon: Users, color: 'bg-green-50 text-green-700' },
    { label: 'ผู้ดูแลระบบ', count: users.filter(u => u.role !== 'MEMBER').length, icon: ShieldCheck, color: 'bg-violet-50 text-violet-700' },
    { label: 'สมาชิก', count: users.filter(u => u.role === 'MEMBER').length, icon: UserRound, color: 'bg-blue-50 text-blue-700' },
  ]
  return (
    <div className="mx-auto max-w-7xl space-y-6 text-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-semibold tracking-tight">จัดการผู้ใช้งาน</h1><p className="mt-1 text-sm text-gray-500">ค้นหาผู้ใช้ ตรวจสอบสังกัด และจัดการสิทธิ์การเข้าถึง</p></div>
        {isSuperAdmin && <AddUserButton />}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(({ label, count, icon: Icon, color }) => <div key={label} className="flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white p-5"><span className={`rounded-xl p-3 ${color}`}><Icon aria-hidden="true" className="size-5" /></span><div><p className="text-sm text-gray-500">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{count.toLocaleString('th-TH')} <span className="text-xs font-normal text-gray-400">คน</span></p></div></div>)}
      </div>
      <section aria-label="รายชื่อผู้ใช้งาน" className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="space-y-4 border-b border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">รายชื่อผู้ใช้งาน <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">{users.length}</span></h2><span className="text-xs text-gray-400">เฉพาะบัญชีที่คุณมีสิทธิ์เห็น</span></div>
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-5 text-gray-400" /><input aria-label="ค้นหาผู้ใช้งาน" placeholder="ค้นหาชื่อ อีเมล หรือจังหวัด..." value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} className={`${control} w-full pl-10`} /></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select aria-label="กรองตามสิทธิ์" className={control} value={role} onChange={e => { setRole(e.target.value); setPage(1) }}><option value="">ทุกสิทธิ์</option><option value="MEMBER">สมาชิก</option><option value="ADMIN">ผู้ดูแลระบบ</option>{isSuperAdmin && <option value="SUPERADMIN">ผู้ดูแลระบบสูงสุด</option>}</select>
              <select aria-label="กรองตามจังหวัด" className={control} value={province} onChange={e => { setProvince(e.target.value); setPage(1) }}><option value="">ทุกจังหวัด</option><option value="unset">ไม่ระบุสังกัด</option>{provinces.map(p => <option key={p}>{p}</option>)}</select>
              <select aria-label="เรียงลำดับผู้ใช้งาน" className={control} value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}><option value="role">เรียงตามสิทธิ์</option><option value="newest">สมัครล่าสุด</option><option value="name">ชื่อ ก–ฮ</option><option value="surveys">จำนวนงานมากที่สุด</option></select>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500"><p role="status" className="flex items-center gap-2"><SlidersHorizontal aria-hidden="true" className="size-3.5" />พบ {filtered.length.toLocaleString('th-TH')} คน{hasFilters && ' ตามเงื่อนไขที่เลือก'}</p>{hasFilters && <button onClick={reset} className="rounded-lg px-2 py-1 font-medium text-green-700 hover:bg-green-50">ล้างตัวกรอง</button>}</div>
        </div>
        {visible.length === 0 ? <div className="flex flex-col items-center px-4 py-16 text-center"><SearchX aria-hidden="true" className="mb-4 size-10 text-gray-300" /><h3 className="font-semibold">{users.length ? 'ไม่พบผู้ใช้ที่ตรงกับการค้นหา' : 'ยังไม่มีผู้ใช้งาน'}</h3><p className="mt-2 text-sm text-gray-500">{users.length ? 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองเพื่อดูรายชื่อทั้งหมด' : 'เมื่อมีผู้ใช้ในระบบ รายชื่อจะแสดงที่นี่'}</p>{hasFilters && <button onClick={reset} className="mt-4 rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-green-700">แสดงผู้ใช้ทั้งหมด</button>}</div> :
          <table className="block w-full text-sm md:table">
            <caption className="sr-only">รายชื่อผู้ใช้ สังกัด จำนวนแบบสอบถาม และสิทธิ์การเข้าถึง</caption>
            <thead className="hidden bg-gray-50/80 text-xs text-gray-500 md:table-header-group"><tr>{['ผู้ใช้งาน', 'สังกัด', 'แบบสอบถาม', 'สิทธิ์การเข้าถึง', ...(isSuperAdmin ? ['จัดการ'] : [])].map(t => <th key={t} scope="col" className="px-5 py-3 text-left font-medium">{t}</th>)}</tr></thead>
            <tbody className="block divide-y divide-gray-100 md:table-row-group">{visible.map(u => <tr key={u.id} className="grid grid-cols-2 gap-3 p-4 transition-colors hover:bg-gray-50/60 md:table-row md:p-0">
              <td className="col-span-2 md:px-5 md:py-4"><div className="flex items-center gap-3"><span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full font-semibold ${u.role === 'MEMBER' ? 'bg-green-50 text-green-700' : 'bg-violet-50 text-violet-700'}`}>{u.firstName.slice(0, 1)}</span><div className="min-w-0"><p className="font-medium">{u.firstName} {u.lastName}{u.id === meId && <span className="ml-2 rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] text-green-700">คุณ</span>}</p><p className="mt-1 break-all text-xs text-gray-500">{u.email}</p></div></div></td>
              <td className="md:px-5 md:py-4"><p className="flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-3.5 shrink-0 text-gray-400" />{u.province || 'ไม่ระบุสังกัด'}</p>{u.zone && <p className="mt-1 pl-5 text-xs text-gray-400">ภาค{u.zone}</p>}</td>
              <td className="md:px-5 md:py-4"><span className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 tabular-nums"><ClipboardList aria-hidden="true" className="size-3.5 text-gray-400" />{u._count.surveys.toLocaleString('th-TH')} <span className="text-xs text-gray-400">รายการ</span></span></td>
              <td className="md:px-5 md:py-4"><RoleSelect key={`${u.id}-${u.role}`} userId={u.id} role={u.role} disabled={u.id === meId || !(isSuperAdmin || (isAdmin && u.role === 'MEMBER'))} roles={isSuperAdmin ? undefined : ['MEMBER', 'ADMIN']} /></td>
              {isSuperAdmin && <td className="md:px-5 md:py-4"><div className="flex items-center justify-end gap-2 md:justify-start"><EditUserButton user={u} isSelf={u.id === meId} />{u.id !== meId && <DeleteUserButton user={u} />}</div></td>}
            </tr>)}</tbody>
          </table>}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
          <div className="flex flex-wrap items-center gap-3"><span>แสดง {filtered.length ? (current - 1) * pageSize + 1 : 0}–{Math.min(current * pageSize, filtered.length)} จาก {filtered.length} คน</span><select aria-label="จำนวนผู้ใช้ต่อหน้า" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className="min-h-9 rounded-lg border border-gray-200 bg-white px-2">{[10, 25, 50].map(n => <option key={n} value={n}>{n} / หน้า</option>)}</select></div>
          <nav aria-label="แบ่งหน้ารายชื่อผู้ใช้" className="flex items-center gap-3"><button aria-label="หน้าก่อนหน้า" disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-30"><ChevronLeft className="size-4" /></button><span>หน้า {current} / {pages}</span><button aria-label="หน้าถัดไป" disabled={current === pages} onClick={() => setPage(current + 1)} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-30"><ChevronRight className="size-4" /></button></nav>
        </div>
      </section>
      <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500"><ShieldCheck aria-hidden="true" className="size-4 shrink-0" />{isSuperAdmin ? 'จัดการข้อมูลและสิทธิ์ได้จากแต่ละรายการ โดยไม่สามารถเปลี่ยนสิทธิ์หรือลบบัญชีของตนเองได้' : 'คุณสามารถเปลี่ยนสิทธิ์ของสมาชิกเป็นผู้ดูแลระบบได้ การแก้ไขข้อมูลและลบบัญชีเป็นสิทธิ์ของผู้ดูแลระบบสูงสุด'}</p>
    </div>
  )
}
