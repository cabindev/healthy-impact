'use server'

import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/auth'
import { PROVINCE_ZONE } from '@/app/lib/province-zone'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcrypt'
import { validPassword } from '@/app/lib/security-input'

export type RoleValue = 'MEMBER' | 'ADMIN' | 'SUPERADMIN'
const ROLES: RoleValue[] = ['MEMBER', 'ADMIN', 'SUPERADMIN']

export interface UserInput {
  firstName: string
  lastName: string
  email: string
  password?: string // create: จำเป็น · edit: เว้นว่าง = ไม่เปลี่ยน
  role: RoleValue
  /** จังหวัดที่สังกัด — ภาคถูก derive จากจังหวัดให้อัตโนมัติ ไม่ต้องกรอกแยก */
  province?: string
}

// สังกัด: เก็บจังหวัด แล้วเติมภาคจาก PROVINCE_ZONE ให้ตรงกันเสมอ (เว้นว่าง = ไม่ระบุสังกัด)
function areaOf(province?: string) {
  const p = province?.trim()
  if (!p) return { province: null, zone: null }
  return { province: p, zone: PROVINCE_ZONE[p] ?? null }
}

// เปลี่ยนสิทธิ์ผู้ใช้ — SUPERADMIN แก้ได้ทุกคน (ยกเว้นตนเอง)
// ADMIN แก้ได้เฉพาะผู้ใช้ที่ปัจจุบันเป็น MEMBER และตั้งได้แค่ MEMBER/ADMIN เท่านั้น (กัน privilege escalation ไป SUPERADMIN)
export async function updateUserRole(userId: number, role: RoleValue) {
  const session = await requireAdmin()
  if (!Number.isInteger(userId) || userId <= 0 || !ROLES.includes(role)) throw new Error('ข้อมูลไม่ถูกต้อง')
  if (session.user.id === userId) throw new Error('ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้')

  if (session.user.role !== 'SUPERADMIN') {
    if (role === 'SUPERADMIN') throw new Error('ไม่มีสิทธิ์ตั้งเป็น SUPERADMIN')
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!target || target.role !== 'MEMBER') throw new Error('ไม่มีสิทธิ์แก้ไขผู้ใช้นี้')
  }

  await prisma.user.update({ where: { id: userId, ...(session.user.role !== 'SUPERADMIN' ? { role: 'MEMBER' as const } : {}) }, data: { role, lastPasswordReset: new Date() } })
  revalidatePath('/dashboard/users')
}

function validate(d: UserInput, requirePassword: boolean): string | null {
  if (!d.firstName?.trim() || !d.lastName?.trim()) return 'กรุณากรอกชื่อและนามสกุล'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email?.trim() ?? '')) return 'อีเมลไม่ถูกต้อง'
  if (!ROLES.includes(d.role)) return 'สิทธิ์ไม่ถูกต้อง'
  if (requirePassword || (d.password ?? '').length > 0) {
    if (!validPassword(d.password)) return 'รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร และไม่เกิน 72 ไบต์'
  }
  return null
}

// เพิ่มผู้ใช้ใหม่ — เฉพาะ SUPERADMIN
export async function createUser(data: UserInput): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (session.user.role !== 'SUPERADMIN') throw new Error('Unauthorized')
  const err = validate(data, true)
  if (err) return { error: err }

  const email = data.email.trim().toLowerCase()
  if (await prisma.user.findUnique({ where: { email } })) return { error: 'มีอีเมลนี้แล้วในระบบ' }

  await prisma.user.create({
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email,
      password: await bcrypt.hash(data.password!, 12),
      role: data.role,
      ...areaOf(data.province),
    },
  })
  revalidatePath('/dashboard/users')
  return {}
}

// แก้ไขผู้ใช้ — เฉพาะ SUPERADMIN (เว้น password = ไม่เปลี่ยน · ห้ามลดสิทธิ์ตนเอง)
export async function updateUser(userId: number, data: UserInput): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (session.user.role !== 'SUPERADMIN') throw new Error('Unauthorized')
  const err = validate(data, false)
  if (err) return { error: err }
  if (session.user.id === userId && data.role !== 'SUPERADMIN') {
    return { error: 'ไม่สามารถลดสิทธิ์ของตนเองได้' }
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!target) return { error: 'ไม่พบผู้ใช้งาน' }
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
      ...areaOf(data.province),
      ...(data.password ? { password: await bcrypt.hash(data.password, 12), resetToken: null, resetTokenExpiresAt: null } : {}),
      // Password and role changes invalidate existing sessions, including when changed back.
      ...((data.password || target?.role !== data.role) ? { lastPasswordReset: new Date() } : {}),
    },
  })
  revalidatePath('/dashboard/users')
  return {}
}

export interface MyProfileInput {
  firstName: string
  lastName: string
  tambon?: string
  amphoe?: string
  province?: string
}

// แก้ข้อมูลส่วนตัวของตนเอง — ผู้ใช้ทุกคนที่เข้าแดชบอร์ดได้ แก้ได้เฉพาะ record ของตัวเอง
// (ไม่มี role/email/password ในชุดนี้โดยตั้งใจ — สิทธิ์ต้องให้ SUPERADMIN ตั้ง, อีเมล/รหัสผ่านใช้ flow แยก)
export async function updateMyProfile(data: MyProfileInput): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (!data.firstName?.trim() || !data.lastName?.trim()) return { error: 'กรุณากรอกชื่อและนามสกุล' }

  const province = data.province?.trim()
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      // เลือกตำบลด้วย TambonPicker ตัวเดียวกับในแบบสอบถาม → ได้ ตำบล/อำเภอ/จังหวัด พร้อมกัน
      // ล้างตำบลก็ล้างทั้งชุด ไม่ให้เหลือพื้นที่ครึ่ง ๆ กลาง ๆ
      district: province ? (data.tambon?.trim() || null) : null,
      amphoe: province ? (data.amphoe?.trim() || null) : null,
      ...areaOf(province),
    },
  })

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard/users')
  return {}
}

// ลบผู้ใช้ — เฉพาะ SUPERADMIN (ห้ามลบตนเอง · ปลด creatorId ของแบบสอบถามก่อนกัน FK)
export async function deleteUser(userId: number): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (session.user.role !== 'SUPERADMIN') throw new Error('Unauthorized')
  if (session.user.id === userId) return { error: 'ไม่สามารถลบบัญชีของตนเองได้' }

  await prisma.$transaction([
    prisma.survey.updateMany({ where: { creatorId: userId }, data: { creatorId: null } }),
    prisma.user.delete({ where: { id: userId } }),
  ])
  revalidatePath('/dashboard/users')
  return {}
}
