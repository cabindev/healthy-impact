import Link from 'next/link'
import { prisma } from '@/app/lib/prisma'
import { Plus } from 'lucide-react'
import SearchBox from './SearchBox'
import SurveyTable, { type SurveyRow } from './SurveyTable'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const SITE_LABEL: Record<string, string> = { VILLAGE: 'หมู่บ้าน', WORKPLACE: 'สถานประกอบการ', SCHOOL: 'สถานศึกษา' }

export default async function SurveysPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() ?? ''
  const where: Prisma.SurveyWhereInput = q
    ? {
        OR: [
          { questionnaireNo: { contains: q } },
          { prefix: { contains: q } },
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { tambon: { contains: q } },
          { amphoe: { contains: q } },
          { province: { contains: q } },
          { collectorName: { contains: q } },
        ],
      }
    : {}

  const surveys = await prisma.survey.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { alcohol: { select: { auditScore: true, riskLevel: true } } },
    take: 100,
  })

  const rows: SurveyRow[] = surveys.map((s) => ({
    id: s.id,
    no: s.questionnaireNo || `#${s.id}`,
    name: [s.prefix, s.firstName, s.lastName].filter(Boolean).join(' ') || '—',
    site: SITE_LABEL[s.siteType],
    area: [s.tambon, s.amphoe, s.province].filter(Boolean).join(' · ') || '—',
    audit: s.alcohol?.auditScore ?? null,
    risk: s.alcohol?.riskLevel ?? null,
    eligible: s.eligible,
    verified: !!s.verifiedAt,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">แบบสอบถาม</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {q ? `พบ ${rows.length.toLocaleString()} รายการ จากคำค้น “${q}”` : `ทั้งหมด ${rows.length.toLocaleString()} รายการ`}
            {rows.length === 100 && <span className="text-gray-300"> · แสดง 100 รายการแรก</span>}
          </p>
        </div>
        <Link href="/dashboard/surveys/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> เพิ่มแบบสอบถาม
        </Link>
      </div>

      <div className="print:hidden">
        <SearchBox initial={q} />
      </div>
      <SurveyTable rows={rows} q={q} />
    </div>
  )
}
