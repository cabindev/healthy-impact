import Link from 'next/link'
import { getServerSession } from 'next-auth'
import authOptions from '@/app/lib/configs/auth/authOptions'
import { canManageSurvey } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { Plus } from 'lucide-react'
import SearchBox from './SearchBox'
import AreaFilter, { type GeoCombo } from './AreaFilter'
import SurveyTable, { type SurveyRow } from './SurveyTable'
import { buildSurveyWhere } from '@/app/lib/survey-filters'

export const dynamic = 'force-dynamic'

const SITE_LABEL: Record<string, string> = { VILLAGE: 'หมู่บ้าน', WORKPLACE: 'สถานประกอบการ', SCHOOL: 'สถานศึกษา' }

type SurveysSearchParams = { q?: string; zone?: string; province?: string; amphoe?: string; tambon?: string; village?: string; noArea?: string }

export default async function SurveysPage({ searchParams }: { searchParams: Promise<SurveysSearchParams> }) {
  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const zone = sp.zone?.trim() ?? ''
  const province = sp.province?.trim() ?? ''
  const amphoe = sp.amphoe?.trim() ?? ''
  const tambon = sp.tambon?.trim() ?? ''
  const village = sp.village?.trim() ?? ''
  const noArea = sp.noArea === '1'

  const where = buildSurveyWhere({ q, zone, province, amphoe, tambon, village, noArea })
  const session = await getServerSession(authOptions)

  const [surveys, geoCombos] = await Promise.all([
    prisma.survey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        alcohol: { select: { auditScore: true, riskLevel: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
      take: 100,
    }),
    prisma.survey.findMany({
      select: { province: true, amphoe: true, tambon: true, villageName: true },
      distinct: ['province', 'amphoe', 'tambon', 'villageName'],
    }),
  ])

  // นับรายการที่ยังไม่ระบุพื้นที่ทั้งระบบ — ข้อมูลเก่าก่อนบังคับกรอกพื้นที่ ต้องไล่เติมย้อนหลัง
  const noAreaCount = await prisma.survey.count({ where: { OR: [{ province: null }, { province: '' }] } })
  const combos: GeoCombo[] = geoCombos

  const rows: SurveyRow[] = surveys.map((s) => ({
    id: s.id,
    no: s.questionnaireNo || `#${s.id}`,
    name: [s.prefix, s.firstName, s.lastName].filter(Boolean).join(' ') || '—',
    site: SITE_LABEL[s.siteType],
    area: [s.tambon, s.amphoe, s.province].filter(Boolean).join(' · ') || '—',
    audit: s.alcohol?.auditScore ?? null,
    risk: s.alcohol?.riskLevel ?? null,
    eligible: s.eligible,
    reason: s.ineligibleReason,
    verified: !!s.verifiedAt,
    recorder: s.creator ? `${s.creator.firstName} ${s.creator.lastName}`.trim() : null,
    canDelete: canManageSurvey(session?.user, s.creatorId),
  }))

  const filtered = !!(q || zone || province || amphoe || tambon || village || noArea)
  const filterQuery = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(zone ? { zone } : {}),
    ...(province ? { province } : {}),
    ...(amphoe ? { amphoe } : {}),
    ...(tambon ? { tambon } : {}),
    ...(village ? { village } : {}),
    ...(noArea ? { noArea: '1' } : {}),
  }).toString()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">แบบสอบถาม</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered ? `พบ ${rows.length.toLocaleString()} รายการ` : `ทั้งหมด ${rows.length.toLocaleString()} รายการ`}
            {rows.length === 100 && <span className="text-gray-300"> · แสดง 100 รายการแรก</span>}
          </p>
        </div>
        <Link href="/dashboard/surveys/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> เพิ่มแบบสอบถาม
        </Link>
      </div>

      {noAreaCount > 0 && !noArea && (
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-800">
            มี <b className="tabular-nums">{noAreaCount.toLocaleString()}</b> รายการที่ยังไม่ระบุพื้นที่ — ไม่ถูกนับในแผนที่และตัวกรองพื้นที่
          </p>
          <Link href="/dashboard/surveys?noArea=1"
            className="text-sm font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2 shrink-0">
            ไปแก้ไข
          </Link>
        </div>
      )}

      <div className="print:hidden space-y-2">
        <SearchBox initial={q} />
        <AreaFilter combos={combos} />
      </div>
      <SurveyTable rows={rows} q={q} filterQuery={filterQuery} />
    </div>
  )
}
