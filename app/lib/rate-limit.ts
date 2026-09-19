import { createHash } from 'node:crypto'
import { prisma } from '@/app/lib/prisma'
import { RequestError } from '@/app/lib/security-request'

// Fixed windows use atomic MySQL upserts. Never trust a client-supplied IP header.
// A global route budget also bounds attempts against arbitrarily many account names.
export async function rateLimit(scope: string, subject: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = Math.floor(now / windowMs)
  const key = createHash('sha256').update(`${scope}:${subject}:${bucket}`).digest('hex')
  await prisma.$transaction(async tx => {
    const row = await tx.securityRateLimit.upsert({
      where: { key },
      create: { key, count: 1, expiresAt: new Date((bucket + 2) * windowMs) },
      update: { count: { increment: 1 } },
    })
    if (row.count > limit) throw new RequestError('ทำรายการบ่อยเกินไป กรุณาลองใหม่ภายหลัง', 429)
  })
  // Indexed, bounded cleanup; avoids an ever-growing table without a cron dependency.
  await prisma.$executeRaw`DELETE FROM SecurityRateLimit WHERE expiresAt < NOW() LIMIT 100`
}
