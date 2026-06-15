import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/auth'
import { labeledSurvey, SURVEY_INCLUDE } from '@/app/lib/survey-export'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  await requireAdmin()

  // ?ids=1,2,3 → export เฉพาะที่เลือก; ไม่มี = export ทั้งหมด (เดิม)
  const idsParam = new URL(req.url).searchParams.get('ids')
  const ids = idsParam
    ? idsParam.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : null

  const surveys = await prisma.survey.findMany({
    where: ids && ids.length ? { id: { in: ids } } : undefined,
    orderBy: { createdAt: 'asc' },
    include: SURVEY_INCLUDE,
  })

  const rows = surveys.map(labeledSurvey)

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'แบบสอบถาม')
  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const filename = `healthy-impact${ids ? '-selected' : ''}-${new Date().toISOString().slice(0, 10)}.xlsx`
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
