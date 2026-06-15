import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { RISK_COLORS, RISK_ADVICE, type RiskLevel } from '@/app/lib/audit'
import * as O from '@/app/lib/survey-options'
import { calcBMI, bmiCategory } from '@/app/lib/health'
import { ArrowLeft } from 'lucide-react'
import SurveyActions from './SurveyActions'
import VerifyButton from './VerifyButton'
import AuditExplainModal from '@/app/components/AuditExplainModal'
import BmiTip from '@/app/components/BmiTip'

export const dynamic = 'force-dynamic'

// ───────── helpers แสดงผล ─────────

function Section({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
        <span className="w-7 h-7 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">{no}</span>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      <dl className="divide-y divide-gray-50">{children}</dl>
    </section>
  )
}

function Row({ label, children }: { label: React.ReactNode; children?: React.ReactNode }) {
  const empty = children === null || children === undefined || children === '' || children === '—'
  return (
    <div className="px-5 py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`text-sm sm:col-span-2 ${empty ? 'text-gray-300' : 'text-gray-800'}`}>{empty ? '—' : children}</dd>
    </div>
  )
}

const fmtDate = (d?: Date | null) => (d ? new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—')
const dec = (v: unknown) => (v === null || v === undefined ? '—' : Number(v).toString())
const parseArr = (s?: string | null): string[] => {
  if (!s) return []
  try { const a = JSON.parse(s); return Array.isArray(a) ? a : [] } catch { return [] }
}
const labelsFrom = (opts: O.Opt[], values: string[]) => values.map((v) => O.labelOf(opts, v)).join(', ')

const SITE_LABEL: Record<string, string> = { VILLAGE: 'หมู่บ้าน', WORKPLACE: 'สถานประกอบการ', SCHOOL: 'สถานศึกษา' }

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const surveyId = Number(id)
  if (!Number.isInteger(surveyId)) notFound()

  const s = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: { tobacco: true, alcohol: true, creator: { select: { firstName: true, lastName: true } } },
  })
  if (!s) notFound()

  const t = s.tobacco
  const a = s.alcohol
  const risk = a?.riskLevel as RiskLevel | undefined
  const name = [s.prefix, s.firstName, s.lastName].filter(Boolean).join(' ') || '—'
  const rights = parseArr(s.rights)
  const diseases = parseArr(s.diseases)
  const bmi = calcBMI(s.weightKg ? Number(s.weightKg) : null, s.heightCm ? Number(s.heightCm) : null)

  const tobaccoEver: Record<string, boolean | null | undefined> = {
    Factory: t?.everFactory, Rolled: t?.everRolled, Ecig: t?.everEcig, Smokeless: t?.everSmokeless, Other: t?.everOther,
  }
  const tobaccoCur: Record<string, boolean | null | undefined> = {
    Factory: t?.curFactory, Rolled: t?.curRolled, Ecig: t?.curEcig, Smokeless: t?.curSmokeless, Other: t?.curOther,
  }
  const tobaccoCurAmt: Record<string, number | null | undefined> = {
    Factory: t?.curFactoryAmt, Rolled: t?.curRolledAmt, Ecig: t?.curEcigAmt, Smokeless: t?.curSmokelessAmt, Other: t?.curOtherAmt,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/surveys" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-1">
            <ArrowLeft className="w-4 h-4" /> กลับไปรายการ
          </Link>
          <h1 className="text-xl font-semibold text-gray-800">{s.questionnaireNo || `แบบสอบถาม #${s.id}`}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{name} · {SITE_LABEL[s.siteType]}</p>
        </div>
        <SurveyActions id={s.id} editable={s.eligible} />
      </div>

      <Section no="◆" title="ข้อมูลการเก็บแบบสอบถาม">
        <Row label="ประเภทสถานที่">{SITE_LABEL[s.siteType]}</Row>
        <Row label="เลขที่แบบสอบถาม">{s.questionnaireNo}</Row>
        <Row label="ผู้เก็บข้อมูล">{[s.collectorName, s.collectorPhone].filter(Boolean).join(' · ')}</Row>
        <Row label="วันที่เก็บข้อมูล">{fmtDate(s.createdAt)}</Row>
        <Row label="การตรวจสอบ">
          <VerifyButton id={s.id} verified={!!s.verifiedAt} verifierName={s.verifierName} verifiedAt={s.verifiedAt ? fmtDate(s.verifiedAt) : null} />
        </Row>
      </Section>

      {!s.eligible ? (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="bg-red-50 px-5 py-3 border-b border-red-100">
            <h2 className="text-base font-semibold text-red-600">ไม่เข้าเกณฑ์ — จบการสัมภาษณ์</h2>
          </div>
          <dl className="divide-y divide-gray-50">
            <Row label="เหตุผล">{s.ineligibleReason}</Row>
            <Row label="พื้นที่">{[s.villageNo && `หมู่ ${s.villageNo}`, s.villageName, s.tambon, s.amphoe, s.province].filter(Boolean).join(' · ')}</Row>
            <Row label="ผู้เก็บข้อมูล">{[s.collectorName, s.collectorPhone].filter(Boolean).join(' · ')}</Row>
          </dl>
          <p className="px-5 py-3 text-xs text-gray-400">ไม่มีการเก็บข้อมูลส่วนตัว/สุขภาพสำหรับผู้ไม่เข้าเกณฑ์</p>
        </div>
      ) : (
      <>
      <Section no="1" title="ข้อมูลทั่วไป">
        <Row label="1.1–1.5 พื้นที่">{[s.villageNo && `หมู่ ${s.villageNo}`, s.villageName, s.tambon, s.amphoe, s.province].filter(Boolean).join(' · ')}</Row>
        <Row label="1.6 พักอาศัย > 6 เดือน">{s.residence6Months ? 'ใช่' : 'ไม่ใช่'}</Row>
        <Row label="1.7 ลงนามใบยินยอม">{s.consentGiven ? 'ยินยอม' : 'ไม่ยินยอม'}</Row>
        <Row label="1.8 เลขบัตรประชาชน">{s.nationalId}</Row>
        <Row label="1.9 ชื่อ-สกุล">{name}</Row>
        <Row label="เบอร์โทรศัพท์">{s.phone}</Row>
        <Row label="1.10 เพศ">{s.gender === 'อื่นๆ' ? s.genderOther : O.labelOf(O.GENDERS, s.gender)}</Row>
        <Row label="1.11 วัน/เดือน/ปีเกิด">{s.birthDate}</Row>
        <Row label="1.12 ศาสนา">{s.religion === 'อื่นๆ' ? s.religionOther : O.labelOf(O.RELIGIONS, s.religion)}</Row>
        <Row label="1.13 บัตร/สิทธิ">{rights.length ? labelsFrom(O.RIGHTS, rights) : undefined}</Row>
        <Row label="1.14 น้ำหนัก (กก.)">{dec(s.weightKg)}</Row>
        <Row label="1.15 ส่วนสูง (ซม.)">{dec(s.heightCm)}</Row>
        <Row label="1.16 เส้นรอบเอว (ซม.)">{dec(s.waistCm)}</Row>
        <Row label={<span className="inline-flex items-center gap-1">BMI (คำนวณ) <BmiTip /></span>}>{bmi != null ? `${bmi} kg/m² · ${bmiCategory(bmi)}` : undefined}</Row>
        <Row label="1.17 โรคที่วินิจฉัย">{diseases.length ? [labelsFrom(O.DISEASES, diseases), diseases.includes('อื่นๆ') ? s.diseaseOther : null].filter(Boolean).join(' · ') : undefined}</Row>
        <Row label="1.18 สถานภาพการศึกษา">{O.labelOf(O.EDU_STATUS, s.eduStatus)}</Row>
        <Row label="1.19 ระดับการศึกษา">{O.labelOf(O.EDU_LEVELS, s.eduLevel)}</Row>
      </Section>

      <Section no="2" title="การสูบบุหรี่">
        <Row label="2.1 การสูบในที่พักอาศัย">{O.labelOf(O.HOME_SMOKING, t?.homeSmoking)}</Row>
        <Row label="2.2 สถานะการสูบ">{O.labelOf(O.SMOKE_STATUS, t?.smokeStatus)}</Row>
        <Row label="2.3 เคยสูบประเภท">{O.TOBACCO_TYPES.filter((x) => tobaccoEver[x.key]).map((x) => x.label).join(', ') || undefined}</Row>
        <Row label="2.4 ปัจจุบันสูบประเภท">
          {O.TOBACCO_TYPES.filter((x) => tobaccoCur[x.key]).map((x) => `${x.label} (${tobaccoCurAmt[x.key] ?? '?'} ${x.unit})`).join(', ') || undefined}
        </Row>
        <Row label="2.5 มวนแรกหลังตื่นนอน">{O.labelOf(O.FIRST_CIG_TIME, t?.firstCigTime)}</Row>
        <Row label="2.6 ความพยายามเลิก">{O.labelOf(O.QUIT_ATTEMPT, t?.quitAttempt)}</Row>
      </Section>

      <Section no="3" title="การดื่มเครื่องดื่มแอลกอฮอล์ (AUDIT)">
        <Row label="3.1 ความถี่การดื่ม">{O.labelOf(O.AUDIT_Q1, a?.q1Frequency != null ? String(a.q1Frequency) : null)}</Row>
        <Row label="3.2 เบียร์">{a?.beerDrink ? O.labelOf(O.BEER_AMT, a.beerAmt != null ? String(a.beerAmt) : null) : 'ไม่ดื่ม'}</Row>
        <Row label="3.2 เหล้า">{a?.liquorDrink ? O.labelOf(O.LIQUOR_AMT, a.liquorAmt != null ? String(a.liquorAmt) : null) : 'ไม่ดื่ม'}</Row>
        <Row label="3.2 ไวน์">{a?.wineDrink ? O.labelOf(O.WINE_AMT, a.wineAmt != null ? String(a.wineAmt) : null) : 'ไม่ดื่ม'}</Row>
        <Row label="3.3 ดื่มหนักในคราวเดียว">{O.labelOf(O.AUDIT_FREQ, a?.q3Binge != null ? String(a.q3Binge) : null)}</Row>
        <Row label="3.4 หยุดดื่มไม่ได้">{O.labelOf(O.AUDIT_FREQ, a?.q4CannotStop != null ? String(a.q4CannotStop) : null)}</Row>
        <Row label="3.5 ทำสิ่งปกติไม่ได้">{O.labelOf(O.AUDIT_FREQ, a?.q5FailNormal != null ? String(a.q5FailNormal) : null)}</Row>
        <Row label="3.6 ต้องรีบดื่มตอนเช้า">{O.labelOf(O.AUDIT_FREQ, a?.q6Morning != null ? String(a.q6Morning) : null)}</Row>
        <Row label="3.7 รู้สึกผิด/เสียใจ">{O.labelOf(O.AUDIT_FREQ, a?.q7Guilt != null ? String(a.q7Guilt) : null)}</Row>
        <Row label="3.8 จำเหตุการณ์ไม่ได้">{O.labelOf(O.AUDIT_FREQ, a?.q8Blackout != null ? String(a.q8Blackout) : null)}</Row>
        <Row label="3.9 เคยบาดเจ็บจากการดื่ม">{O.labelOf(O.AUDIT_EVER, a?.q9Injury != null ? String(a.q9Injury) : null)}</Row>
        <Row label="3.10 เคยได้รับคำแนะนำให้เลิก">{O.labelOf(O.AUDIT_EVER, a?.q10Advised != null ? String(a.q10Advised) : null)}</Row>
        <Row label="คะแนน AUDIT รวม">
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800">{a?.auditScore ?? '—'}/40</span>
            {risk && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[risk]}`}>{risk}</span>}
            <AuditExplainModal />
          </span>
        </Row>
        {risk && <Row label="คำแนะนำ">{RISK_ADVICE[risk]}</Row>}
      </Section>

      <Section no="4" title="การบาดเจ็บจากอุบัติเหตุจราจรที่เกิดจากการดื่ม">
        <Row label="4.1 ดื่มแล้วขับ (12 เดือน)">{O.labelOf(O.DD_DROVE, s.ddDroveAfterDrink)}</Row>
        <Row label="4.2 บาดเจ็บจากอุบัติเหตุ">{O.labelOf(O.DD_INJURED, s.ddInjured)}</Row>
      </Section>
      </>
      )}

      <p className="text-xs text-gray-400 text-center">
        บันทึกเมื่อ {fmtDate(s.createdAt)}{s.creator ? ` · โดย ${s.creator.firstName} ${s.creator.lastName}` : ''}
      </p>
    </div>
  )
}
