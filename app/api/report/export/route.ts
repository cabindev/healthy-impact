import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/auth'
import { labeledSurvey, SURVEY_INCLUDE } from '@/app/lib/survey-export'
import { buildSurveyWhere } from '@/app/lib/survey-filters'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  await requireAdmin()

  const params = new URL(req.url).searchParams

  // ?ids=1,2,3 → export เฉพาะที่เลือก (ตัดหน้าตัวกรองอื่น เพราะเป็นการเลือกเจาะจงแล้ว)
  const idsParam = params.get('ids')
  const ids = idsParam
    ? idsParam.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : null

  // ไม่มี ids → export ตามตัวกรอง/คำค้นที่ส่งมาจากหน้ารายการ (ให้ตรงกับที่เห็นบนจอ)
  const filtered = ['q', 'zone', 'province', 'amphoe', 'tambon', 'village'].some((k) => params.get(k))
  const where = ids && ids.length
    ? { id: { in: ids } }
    : buildSurveyWhere({
        q: params.get('q'),
        zone: params.get('zone'),
        province: params.get('province'),
        amphoe: params.get('amphoe'),
        tambon: params.get('tambon'),
        village: params.get('village'),
      })

  const surveys = await prisma.survey.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: SURVEY_INCLUDE,
  })

  const rows = surveys.map(labeledSurvey)

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'แบบสอบถาม')
  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const suffix = ids ? '-selected' : filtered ? '-filtered' : ''
  const filename = `healthy-impact${suffix}-${new Date().toISOString().slice(0, 10)}.xlsx`
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
