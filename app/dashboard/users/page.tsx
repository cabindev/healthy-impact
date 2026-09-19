import { requireAdminPage } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import UsersDirectory from './UsersDirectory'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await requireAdminPage()
  const isSuperAdmin = session?.user.role === 'SUPERADMIN'
  const isAdmin = session?.user.role === 'ADMIN'
  const meId = session?.user.id

  // ซ่อนบัญชี SUPERADMIN คนอื่นจากทุกคน — เห็นได้เฉพาะตัวเขาเอง
  const users = await prisma.user.findMany({
    where: { OR: [{ role: { not: 'SUPERADMIN' } }, ...(meId ? [{ id: meId }] : [])] },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true,
      province: true, zone: true,
      // จำนวนแบบสอบถามที่ผู้ใช้คนนี้เป็นผู้บันทึก (ผูกจาก Survey.creatorId)
      _count: { select: { surveys: true } },
    },
  })

  // เรียงตามสิทธิ์: SUPERADMIN → ADMIN → MEMBER (ในกลุ่มเดียวกันคงลำดับใหม่สุดก่อนตาม createdAt)
  const ROLE_RANK: Record<string, number> = { SUPERADMIN: 0, ADMIN: 1, MEMBER: 2 }
  users.sort((a, b) => (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99))

  return <UsersDirectory users={users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() }))} meId={meId} isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />
}
