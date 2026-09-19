import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs/promises'
import { prisma } from '@/app/lib/prisma'
import { sendTelegram } from '@/app/lib/telegram'
import { normalizedEmail, validPassword, escapeHtml } from '@/app/lib/security-input'
import { boundedBody, requestError, RequestError } from '@/app/lib/security-request'
import { profileImage, MAX_IMAGE_BYTES } from '@/app/lib/profile-image'
import { rateLimit } from '@/app/lib/rate-limit'

export async function POST(req: Request) {
  let savedPath: string | undefined
  let created = false
  try {
    await rateLimit('signup-global', 'all', 10, 60_000)
    const bytes = await boundedBody(req, MAX_IMAGE_BYTES + 32_768)
    let form: FormData
    try { form = await new Response(new Blob([bytes as BlobPart]), { headers: { 'Content-Type': req.headers.get('content-type') ?? '' } }).formData() }
    catch { throw new RequestError('ข้อมูลไม่ถูกต้อง') }
    const text = (key: string) => { const value = form.get(key); return typeof value === 'string' ? value.trim() : '' }
    const firstName = text('firstName'), lastName = text('lastName')
    const email = normalizedEmail(form.get('email'))
    const password = form.get('password')
    if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100 || !email) throw new RequestError('กรุณาตรวจสอบชื่อ นามสกุล และอีเมล')
    if (!validPassword(password)) throw new RequestError('รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร และไม่เกิน 72 ไบต์')
    await rateLimit('signup-email', email, 3, 3_600_000)
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) throw new RequestError('ไม่สามารถสมัครด้วยข้อมูลนี้ได้ กรุณาเข้าสู่ระบบหรือใช้เมนูลืมรหัสผ่าน')
    const image = form.get('image')
    let imagePath: string | null = null
    let encoded: Buffer | undefined
    if (image !== null) {
      if (!(image instanceof File)) throw new RequestError('รูปภาพไม่ถูกต้อง')
      if (image.size) encoded = await profileImage(image)
    }
    const hash = await bcrypt.hash(password, 12)
    if (encoded) {
      const filename = `${randomUUID()}.webp`
      const directory = path.join(process.cwd(), 'public/img')
      await fs.mkdir(directory, { recursive: true })
      savedPath = path.join(directory, filename)
      await fs.writeFile(savedPath, encoded, { flag: 'wx' })
      imagePath = `/img/${filename}`
    }
    await prisma.user.create({ data: { firstName, lastName, email, password: hash, image: imagePath, role: 'MEMBER' } })
    created = true
    await sendTelegram(`○ <b>สมัครสมาชิก</b>\n${escapeHtml(firstName)} ${escapeHtml(lastName)}\n<i>${escapeHtml(email)}</i>`)
    return NextResponse.json({ message: 'ลงทะเบียนสำเร็จ' })
  } catch (error) {
    if (savedPath && !created) await fs.unlink(savedPath).catch(() => {})
    return requestError(error)
  }
}
