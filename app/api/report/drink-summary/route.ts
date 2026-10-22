import { requireAdmin } from '@/app/lib/auth'
import { buildSurveyWhere } from '@/app/lib/survey-filters'
import { AREA_LABEL, DRINK_GROUPS, getDrinkSummary, nextLevel } from '@/app/lib/drink-summary'
import writeExcelFile from 'write-excel-file/node'

export const dynamic = 'force-dynamic'

// ตารางสรุปผู้ดื่มตามพื้นที่ — ตัวกรองเดียวกับหน้ารายการ ให้ตัวเลขตรงกับที่เห็นบนจอ
export async function GET(req: Request) {
  try { await requireAdmin() } catch { return new Response('Unauthorized', { status: 401 }) }

  const params = new URL(req.url).searchParams
  const get = (k: string) => params.get(k)?.trim() ?? ''
  const where = buildSurveyWhere({
    q: get('q'),
    zone: get('zone'),
    province: get('province'),
    amphoe: get('amphoe'),
    tambon: get('tambon'),
    village: get('village'),
    creator: get('creator'),
  })
  const { level, rows, totals } = await getDrinkSummary(where, nextLevel({ province: get('province'), amphoe: get('amphoe'), tambon: get('tambon') }))

  const scope = [
    get('zone') && `ภาค${get('zone')}`,
    get('province') && `จังหวัด${get('province')}`,
    get('amphoe') && `อำเภอ${get('amphoe')}`,
    get('tambon') && `ตำบล${get('tambon')}`,
    get('village') && `หมู่บ้าน${get('village')}`,
    get('q') && `คำค้น “${get('q')}”`,
  ].filter(Boolean).join(' · ') || 'ทั้งหมด'

  const header = [AREA_LABEL[level], ...DRINK_GROUPS, 'รวมผู้ดื่ม', 'รวมทั้งหมด']
  const line = (r: typeof totals) => [r.name, ...DRINK_GROUPS.map((g) => r.counts[g]), r.total - r.counts['ไม่ดื่ม'], r.total]
  const data = [
    [`สรุปผู้ดื่มตาม${AREA_LABEL[level]} (เฉพาะผู้เข้าเกณฑ์, จัดกลุ่มตามคะแนน AUDIT) — ${scope}`],
    [],
    header,
    ...rows.map(line),
    line(totals),
  ]
  const buf = await writeExcelFile(data, { sheet: 'สรุปผู้ดื่ม' }).toBuffer()

  const filename = `healthy-impact-drink-summary-${new Date().toISOString().slice(0, 10)}.xlsx`
  return new Response(new Uint8Array(buf), {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
