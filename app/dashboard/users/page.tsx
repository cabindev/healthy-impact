import { getServerSession } from 'next-auth'
import authOptions from '@/app/lib/configs/auth/authOptions'
import { prisma } from '@/app/lib/prisma'
import RoleSelect from './RoleSelect'
import { AddUserButton, EditUserButton, DeleteUserButton } from './UserActions'
import type { RoleValue } from '@/app/actions/user'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  const isSuperAdmin = session?.user.role === 'SUPERADMIN'
  const meId = session?.user.id

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
  })

  // เรียงตามสิทธิ์: SUPERADMIN → ADMIN → MEMBER (ในกลุ่มเดียวกันคงลำดับใหม่สุดก่อนตาม createdAt)
  const ROLE_RANK: Record<string, number> = { SUPERADMIN: 0, ADMIN: 1, MEMBER: 2 }
  users.sort((a, b) => (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">ผู้ใช้งาน</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isSuperAdmin ? 'เพิ่ม/แก้ไข/ลบ และเปลี่ยนสิทธิ์ผู้ใช้งานได้' : 'จัดการสิทธิ์ผู้ใช้งานระบบ (เฉพาะ SUPERADMIN เท่านั้นที่แก้ไขได้)'}
          </p>
        </div>
        {isSuperAdmin && <AddUserButton />}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-medium px-4 py-3">ชื่อ</th>
              <th className="text-left font-medium px-4 py-3">อีเมล</th>
              <th className="text-left font-medium px-4 py-3">สิทธิ์</th>
              {isSuperAdmin && <th className="px-4 py-3 w-24"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr><td colSpan={isSuperAdmin ? 4 : 3} className="px-4 py-8 text-center text-gray-400">ยังไม่มีผู้ใช้งาน</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-gray-700">{u.firstName} {u.lastName}{u.id === meId && <span className="text-gray-400 text-xs ml-1">(คุณ)</span>}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <RoleSelect userId={u.id} role={u.role as RoleValue} disabled={!isSuperAdmin || u.id === meId} />
                </td>
                {isSuperAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <EditUserButton user={{ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role as RoleValue }} isSelf={u.id === meId} />
                      {u.id !== meId && <DeleteUserButton user={{ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role as RoleValue }} />}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
