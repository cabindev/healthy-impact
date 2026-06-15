import { getServerSession } from 'next-auth'
import authOptions from '@/app/lib/configs/auth/authOptions'
import { prisma } from '@/app/lib/prisma'
import RoleSelect from './RoleSelect'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">ผู้ใช้งาน</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {isSuperAdmin ? 'เปลี่ยนสิทธิ์ผู้ใช้งานได้จากเมนูในคอลัมน์สิทธิ์' : 'จัดการสิทธิ์ผู้ใช้งานระบบ (เฉพาะ SUPERADMIN เท่านั้นที่แก้ไขได้)'}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-medium px-4 py-3">ชื่อ</th>
              <th className="text-left font-medium px-4 py-3">อีเมล</th>
              <th className="text-left font-medium px-4 py-3">สิทธิ์</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">ยังไม่มีผู้ใช้งาน</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-gray-700">{u.firstName} {u.lastName}{u.id === meId && <span className="text-gray-400 text-xs ml-1">(คุณ)</span>}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <RoleSelect userId={u.id} role={u.role as RoleValue} disabled={!isSuperAdmin || u.id === meId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
