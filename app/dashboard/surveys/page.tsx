import { requireAdminPage } from '@/app/lib/auth'
import Link from 'next/link'
import { canManageSurvey } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { Plus, ClipboardList, CircleCheck, CheckCheck, Clock3, SlidersHorizontal } from 'lucide-react'
import SearchBox from './SearchBox'
import AreaFilter, { type GeoCombo, type AdminOption } from './AreaFilter'
import SurveyTable, { type SurveyRow } from './SurveyTable'
import Pagination from './Pagination'
import AssignCreatorDialog, { type AdminChoice } from './AssignCreatorDialog'
import { buildSurveyWhere } from '@/app/lib/survey-filters'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

const SITE_LABEL: Record<string, string> = { VILLAGE: 'หมู่บ้าน', WORKPLACE: 'สถานประกอบการ', SCHOOL: 'สถานศึกษา' }

type SurveysSearchParams = { q?: string; zone?: string; province?: string; amphoe?: string; tambon?: string; village?: string; noArea?: string; creator?: string; page?: string }

export default async function SurveysPage({ searchParams }: { searchParams: Promise<SurveysSearchParams> }) {
  const session = await requireAdminPage()
  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const zone = sp.zone?.trim() ?? ''
  const province = sp.province?.trim() ?? ''
  const amphoe = sp.amphoe?.trim() ?? ''
  const tambon = sp.tambon?.trim() ?? ''
  const village = sp.village?.trim() ?? ''
  const noArea = sp.noArea === '1'
  const creator = sp.creator?.trim() ?? ''
  const requestedPage = Math.max(1, Math.floor(Number(sp.page)) || 1)

  const where = buildSurveyWhere({ q, zone, province, amphoe, tambon, village, noArea, creator })

  // นับก่อนเพื่อ clamp หน้า — กันกรณีลิงก์เก่าชี้ไปหน้าที่เกินจำนวนจริง (เช่น หลังลบรายการ)
  const total = await prisma.survey.count({ where })
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount)
  const offset = (page - 1) * PAGE_SIZE

  const [surveys, geoCombos, recorders] = await Promise.all([
    prisma.survey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        alcohol: { select: { auditScore: true, riskLevel: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
      skip: offset,
      take: PAGE_SIZE,
    }),
    prisma.survey.findMany({
      select: { province: true, amphoe: true, tambon: true, villageName: true },
      distinct: ['province', 'amphoe', 'tambon', 'villageName'],
    }),
    // ตัวเลือก "adminทั้งหมด" — เฉพาะผู้ใช้ที่เคยบันทึกแบบสอบถามจริง
    prisma.user.findMany({
      where: { surveys: { some: {} } },
      select: { id: true, firstName: true, lastName: true, _count: { select: { surveys: true } } },
      orderBy: { firstName: 'asc' },
    }),
  ])
  const admins: AdminOption[] = recorders.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    count: u._count.surveys,
  }))

  // นับรายการที่ยังไม่ระบุพื้นที่ทั้งระบบ — ข้อมูลเก่าก่อนบังคับกรอกพื้นที่ ต้องไล่เติมย้อนหลัง
  const [noAreaCount, eligibleCount, verifiedCount] = await Promise.all([
    prisma.survey.count({ where: { OR: [{ province: null }, { province: '' }] } }),
    prisma.survey.count({ where: { AND: [where, { eligible: true }] } }),
    prisma.survey.count({ where: { AND: [where, { verifiedAt: { not: null } }] } }),
  ])
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

  const filtered = !!(q || zone || province || amphoe || tambon || village || noArea || creator)

  // SUPERADMIN: กำหนดผู้บันทึกย้อนหลังให้ข้อมูลเก่า — ต้องกรองก่อนเสมอ กันเผลอยกทั้งระบบให้คนเดียว
  const isSuperAdmin = session?.user?.role === 'SUPERADMIN'
  let unattributed = 0
  let adminChoices: AdminChoice[] = []
  if (isSuperAdmin && filtered && !creator) {
    ;[unattributed, adminChoices] = await Promise.all([
      prisma.survey.count({ where: { AND: [where, { creatorId: null }] } }),
      prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { firstName: 'asc' },
      }).then((us) => us.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), email: u.email }))),
    ])
  }
  const filterLabel = [
    q && `คำค้น “${q}”`,
    zone && `ภาค${zone}`,
    province && `จังหวัด${province}`,
    amphoe && `อำเภอ${amphoe}`,
    tambon && `ตำบล${tambon}`,
    village && `หมู่บ้าน${village}`,
    noArea && 'ไม่ระบุพื้นที่',
    creator && `ผู้บันทึก: ${admins.find(a => String(a.id) === creator)?.name ?? creator}`,
  ].filter(Boolean).join(' · ')
  const filterQuery = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(zone ? { zone } : {}),
    ...(province ? { province } : {}),
    ...(amphoe ? { amphoe } : {}),
    ...(tambon ? { tambon } : {}),
    ...(village ? { village } : {}),
    ...(noArea ? { noArea: '1' } : {}),
    ...(creator ? { creator } : {}),
  }).toString()

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800">แบบสอบถาม</h1>
          <p className="mt-1 text-sm text-gray-500">ค้นหา ตรวจสอบ และจัดการข้อมูลแบบสอบถามในที่เดียว</p>
        </div>
        <Link href="/dashboard/surveys/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shrink-0">
          <Plus className="w-4 h-4" /> เพิ่มแบบสอบถาม
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 print:hidden">
        {[
          { label: filtered ? 'รายการตามตัวกรอง' : 'แบบสอบถามทั้งหมด', value: total, icon: ClipboardList, color: 'bg-blue-50 text-blue-700' },
          { label: 'เข้าเกณฑ์', value: eligibleCount, icon: CircleCheck, color: 'bg-green-50 text-green-700' },
          { label: 'ตรวจสอบแล้ว', value: verifiedCount, icon: CheckCheck, color: 'bg-violet-50 text-violet-700' },
          { label: 'รอตรวจสอบ', value: total - verifiedCount, icon: Clock3, color: 'bg-amber-50 text-amber-700' },
        ].map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5"><div className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm"><span className={`rounded-lg p-2 ${color}`}><Icon aria-hidden="true" className="size-4" /></span>{label}</div><p className="mt-3 text-2xl font-semibold tabular-nums text-gray-800">{value.toLocaleString()} <span className="text-xs font-normal text-gray-400">รายการ</span></p></div>)}
      </div>
      {filtered && <p className="text-xs text-gray-500 print:hidden">ยอดสรุปทั้งหมดคำนวณตามคำค้นหาและตัวกรองที่เลือก</p>}

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

      <section aria-label="ค้นหาและกรองแบบสอบถาม" className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 print:hidden">
        <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800"><SlidersHorizontal aria-hidden="true" className="size-4 text-green-600" />ค้นหาและกรองข้อมูล</h2>{filtered && <Link href="/dashboard/surveys" className="rounded-lg px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50">ล้างทั้งหมด</Link>}</div>
        <SearchBox key={q} initial={q} />
        <AreaFilter combos={combos} admins={admins} />
        {filtered && <p className="border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">กำลังแสดง: {filterLabel}</p>}
      </section>

      {unattributed > 0 && (
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-sm text-slate-700">
            <b className="tabular-nums">{unattributed.toLocaleString()}</b> รายการในตัวกรองนี้ยังไม่รู้ว่า admin คนไหนบันทึก (ข้อมูลก่อน 12 ก.ย. 2569)
          </p>
          <AssignCreatorDialog
            filter={{ q, zone, province, amphoe, tambon, village, noArea }}
            filterLabel={filterLabel}
            count={unattributed}
            admins={adminChoices}
          />
        </div>
      )}
      {/* ล้างรายการที่เลือกเมื่อเปลี่ยนหน้า ตัวกรอง หรือชุดข้อมูล */}
      <SurveyTable key={`${page}-${filterQuery}-${rows.map(r => r.id).join(',')}`} rows={rows} q={q} filterQuery={filterQuery} offset={offset} total={total} />
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 print:hidden"><p>หน้า {page.toLocaleString()} จาก {pageCount.toLocaleString()} · หน้าละ {PAGE_SIZE} รายการ</p><Pagination page={page} pageCount={pageCount} params={filterQuery} /></div>
    </div>
  )
}
