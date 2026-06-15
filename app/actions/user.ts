'use server'

import { prisma } from '@/app/lib/prisma'
import { requireSuperAdmin } from '@/app/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcrypt'

export type RoleValue = 'MEMBER' | 'ADMIN' | 'SUPERADMIN'
const ROLES: RoleValue[] = ['MEMBER', 'ADMIN', 'SUPERADMIN']

export interface UserInput {
  firstName: string
  lastName: string
  email: string
  password?: string // create: จำเป็น · edit: เว้นว่าง = ไม่เปลี่ยน
  role: RoleValue
}

// เปลี่ยนสิทธิ์ผู้ใช้ — เฉพาะ SUPERADMIN และห้ามแก้สิทธิ์ของตนเอง
export async function updateUserRole(userId: number, role: RoleValue) {
  const session = await requireSuperAdmin()
  if (session.user.id === userId) throw new Error('ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้')

  await prisma.user.update({ where: { id: userId }, data: { role } })
  revalidatePath('/dashboard/users')
}

function validate(d: UserInput, requirePassword: boolean): string | null {
  if (!d.firstName?.trim() || !d.lastName?.trim()) return 'กรุณากรอกชื่อและนามสกุล'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email?.trim() ?? '')) return 'อีเมลไม่ถูกต้อง'
  if (!ROLES.includes(d.role)) return 'สิทธิ์ไม่ถูกต้อง'
  if (requirePassword || (d.password ?? '').length > 0) {
    if ((d.password ?? '').length < 5) return 'รหัสผ่านต้องมีอย่างน้อย 5 ตัวอักษร'
  }
  return null
}

// เพิ่มผู้ใช้ใหม่ — เฉพาะ SUPERADMIN
export async function createUser(data: UserInput): Promise<{ error?: string }> {
  await requireSuperAdmin()
  const err = validate(data, true)
  if (err) return { error: err }

  const email = data.email.trim().toLowerCase()
  if (await prisma.user.findUnique({ where: { email } })) return { error: 'มีอีเมลนี้แล้วในระบบ' }

  await prisma.user.create({
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      password: bcrypt.hashSync(data.password!, 10),
      role: data.role,
    },
  })
  revalidatePath('/dashboard/users')
  return {}
}

// แก้ไขผู้ใช้ — เฉพาะ SUPERADMIN (เว้น password = ไม่เปลี่ยน · ห้ามลดสิทธิ์ตนเอง)
export async function updateUser(userId: number, data: UserInput): Promise<{ error?: string }> {
  const session = await requireSuperAdmin()
  const err = validate(data, false)
  if (err) return { error: err }
  if (session.user.id === userId && data.role !== 'SUPERADMIN') {
    return { error: 'ไม่สามารถลดสิทธิ์ของตนเองได้' }
  }

  const email = data.email.trim().toLowerCase()
  const dup = await prisma.user.findUnique({ where: { email } })
  if (dup && dup.id !== userId) return { error: 'มีอีเมลนี้แล้วในระบบ' }

  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      role: data.role,
      ...(data.password ? { password: bcrypt.hashSync(data.password, 10) } : {}),
    },
  })
  revalidatePath('/dashboard/users')
  return {}
}

// ลบผู้ใช้ — เฉพาะ SUPERADMIN (ห้ามลบตนเอง · ปลด creatorId ของแบบสอบถามก่อนกัน FK)
export async function deleteUser(userId: number): Promise<{ error?: string }> {
  const session = await requireSuperAdmin()
  if (session.user.id === userId) return { error: 'ไม่สามารถลบบัญชีของตนเองได้' }

  await prisma.$transaction([
    prisma.survey.updateMany({ where: { creatorId: userId }, data: { creatorId: null } }),
    prisma.user.delete({ where: { id: userId } }),
  ])
  revalidatePath('/dashboard/users')
  return {}
}
