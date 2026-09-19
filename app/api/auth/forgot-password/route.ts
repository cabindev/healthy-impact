import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import nodemailer from 'nodemailer'
import { prisma } from '@/app/lib/prisma'
import { normalizedEmail } from '@/app/lib/security-input'
import { readJson, requestError, RequestError } from '@/app/lib/security-request'
import { rateLimit } from '@/app/lib/rate-limit'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
})
const accepted = () => NextResponse.json({ message: 'หากอีเมลนี้มีบัญชีในระบบ คุณจะได้รับลิงก์สำหรับรีเซ็ตรหัสผ่าน' }, { headers: { 'Cache-Control': 'no-store' } })

export async function POST(req: Request) {
  try {
    await rateLimit('forgot-global', 'all', 30, 60_000)
    const email = normalizedEmail((await readJson(req)).email)
    if (!email) throw new RequestError('อีเมลไม่ถูกต้อง')
    await rateLimit('forgot-email', email, 3, 3_600_000)
    const rawToken = randomBytes(32).toString('hex')
    const digest = createHash('sha256').update(rawToken).digest('hex')
    const now = new Date()
    // No account-existence response difference; cooldown cannot be raced across workers.
    const { count } = await prisma.user.updateMany({
      where: { email, OR: [{ resetTokenCreatedAt: null }, { resetTokenCreatedAt: { lt: new Date(now.getTime() - 60_000) } }] },
      data: { resetToken: digest, resetTokenCreatedAt: now, resetTokenExpiresAt: new Date(now.getTime() + 3_600_000) },
    })
    if (!count) return accepted()
    try {
      const base = process.env.NEXTAUTH_URL
      if (!base) throw new Error('Missing NEXTAUTH_URL')
      const resetUrl = new URL('/auth/reset-password', base)
      if (process.env.NODE_ENV === 'production' && resetUrl.protocol !== 'https:') throw new Error('HTTPS required')
      resetUrl.searchParams.set('token', rawToken)
      await transporter.sendMail({
        from: process.env.EMAIL_USER, to: email, subject: 'รีเซ็ตรหัสผ่าน - Healthy Impact',
        text: `คุณสามารถตั้งรหัสผ่านใหม่ได้ที่ ${resetUrl.toString()}\nลิงก์หมดอายุใน 1 ชั่วโมง หากไม่ได้ร้องขอ คุณไม่จำเป็นต้องดำเนินการใด ๆ`,
      })
    } catch {
      // Do not leak account existence or a token through errors/logs.
      console.error('[forgot-password] Unable to send reset email')
      await prisma.user.updateMany({ where: { email, resetToken: digest }, data: { resetToken: null, resetTokenExpiresAt: null } })
    }
    return accepted()
  } catch (error) { return requestError(error) }
}
