'use server'

import { prisma } from '@/app/lib/prisma'
import { requireSuperAdmin } from '@/app/lib/auth'
import { revalidatePath } from 'next/cache'

export type RoleValue = 'MEMBER' | 'ADMIN' | 'SUPERADMIN'

// เปลี่ยนสิทธิ์ผู้ใช้ — เฉพาะ SUPERADMIN และห้ามแก้สิทธิ์ของตนเอง
export async function updateUserRole(userId: number, role: RoleValue) {
  const session = await requireSuperAdmin()
  if (session.user.id === userId) throw new Error('ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้')

  await prisma.user.update({ where: { id: userId }, data: { role } })
  revalidatePath('/dashboard/users')
}
