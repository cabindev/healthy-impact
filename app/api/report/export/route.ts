import { prisma } from '@/app/lib/prisma'
import { requireAdmin } from '@/app/lib/auth'
import { labeledSurvey, SURVEY_INCLUDE } from '@/app/lib/survey-export'
import { buildSurveyWhere } from '@/app/lib/survey-filters'
import writeExcelFile from 'write-excel-file/node'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try { await requireAdmin() } catch { return new Response('Unauthorized', { status: 401 }) }

  const params = new URL(req.url).searchParams

  // ?ids=1,2,3 → export เฉพาะที่เลือก (ตัดหน้าตัวกรองอื่น เพราะเป็นการเลือกเจาะจงแล้ว)
  const idsParam = params.get('ids')
  const ids = idsParam
    ? idsParam.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : null

  if (idsParam !== null && (!ids?.length || ids.length > 1000 || idsParam.split(',').some(n => !/^[1-9][0-9]*$/.test(n)))) return new Response('Invalid ids', { status: 400 })

  // ไม่มี ids → export ตามตัวกรอง/คำค้นที่ส่งมาจากหน้ารายการ (ให้ตรงกับที่เห็นบนจอ)
  const filtered = ['q', 'zone', 'province', 'amphoe', 'tambon', 'village', 'noArea', 'creator'].some((k) => params.get(k))
  const where = ids && ids.length
    ? { id: { in: ids } }
    : buildSurveyWhere({
        q: params.get('q'),
        zone: params.get('zone'),
        province: params.get('province'),
        amphoe: params.get('amphoe'),
        tambon: params.get('tambon'),
        village: params.get('village'),
        noArea: params.get('noArea') === '1',
        creator: params.get('creator'),
      })

  const surveys = await prisma.survey.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: SURVEY_INCLUDE,
  })

  const rows = surveys.map(labeledSurvey)

  const columns = rows.length ? Object.keys(rows[0]) : []
  const data = [columns, ...rows.map(row => columns.map(column => row[column] ?? ''))]
  const buf = await writeExcelFile(data, { sheet: 'แบบสอบถาม' }).toBuffer()

  const suffix = ids ? '-selected' : filtered ? '-filtered' : ''
  const filename = `healthy-impact${suffix}-${new Date().toISOString().slice(0, 10)}.xlsx`
  return new Response(new Uint8Array(buf), {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
