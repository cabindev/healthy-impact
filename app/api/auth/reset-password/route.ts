import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import bcrypt from 'bcrypt'
import { prisma } from '@/app/lib/prisma'
import { validPassword, validResetToken } from '@/app/lib/security-input'
import { readJson, requestError, RequestError } from '@/app/lib/security-request'
import { rateLimit } from '@/app/lib/rate-limit'

export async function POST(req: Request) {
  try {
    await rateLimit('reset-global', 'all', 100, 60_000)
    const { token, password } = await readJson(req)
    if (!validResetToken(token)) throw new RequestError('รหัสยืนยันไม่ถูกต้องหรือหมดอายุแล้ว')
    if (!validPassword(password)) throw new RequestError('รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร และไม่เกิน 72 ไบต์')
    const digest = createHash('sha256').update(token).digest('hex')
    await rateLimit('reset-token', digest, 5, 900_000)
    const user = await prisma.user.findFirst({ where: { resetToken: digest, resetTokenExpiresAt: { gt: new Date() } }, select: { id: true } })
    if (!user) throw new RequestError('รหัสยืนยันไม่ถูกต้องหรือหมดอายุแล้ว')
    const hash = await bcrypt.hash(password, 12)
    // Compare-and-swap consumes the token once, including concurrent requests.
    const { count } = await prisma.user.updateMany({
      where: { id: user.id, resetToken: digest, resetTokenExpiresAt: { gt: new Date() } },
      data: { password: hash, resetToken: null, resetTokenCreatedAt: null, resetTokenExpiresAt: null, lastPasswordReset: new Date() },
    })
    if (count !== 1) throw new RequestError('รหัสยืนยันไม่ถูกต้องหรือหมดอายุแล้ว')
    return NextResponse.json({ message: 'รีเซ็ตรหัสผ่านสำเร็จ' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return requestError(error) }
}
