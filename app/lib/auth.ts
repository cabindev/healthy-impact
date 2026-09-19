import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import authOptions from '@/app/lib/configs/auth/authOptions'

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) throw new Error('Unauthorized')
  return session
}

export async function requireSuperAdmin() {
  const session = await requireAdmin()
  if (session.user.role !== 'SUPERADMIN') throw new Error('Unauthorized')
  return session
}

// สิทธิ์จัดการแบบสอบถามรายใบ — SUPERADMIN จัดการได้ทุกใบ,
// ADMIN จัดการได้เฉพาะใบที่ตนเองเป็นผู้บันทึก (ใบเก่าที่ไม่มีผู้บันทึกจึงเป็นของ SUPERADMIN เท่านั้น)
export function canManageSurvey(
  user: { id: number; role: string } | undefined,
  creatorId: number | null,
): boolean {
  if (!user) return false
  if (user.role === 'SUPERADMIN') return true
  return user.role === 'ADMIN' && creatorId !== null && creatorId === user.id
}

// Pages must check before fetching data, even when a layout/proxy also checks.
export async function requireAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) redirect('/auth/signin')
  return session
}
