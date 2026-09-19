'use server'

import { prisma } from '@/app/lib/prisma'
import { requireAdmin, canManageSurvey } from '@/app/lib/auth'
import { buildSurveyWhere, type SurveyFilterParams } from '@/app/lib/survey-filters'
import { evaluateAudit } from '@/app/lib/audit'
import { labeledSurvey, SURVEY_INCLUDE } from '@/app/lib/survey-export'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type DeleteResult = { ok: true } | { ok: false; error: string }

// ข้อมูลเต็มของ 1 แบบสอบถาม (label ไทย:ค่า) สำหรับสลิปพิมพ์รายคน
export async function getSurveySlip(id: number) {
  await requireAdmin()
  const s = await prisma.survey.findUnique({ where: { id }, include: SURVEY_INCLUDE })
  if (!s) return null
  const labeled = labeledSurvey(s)
  const fields = Object.entries(labeled).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  return {
    no: String(labeled['เลขที่แบบสอบถาม']),
    name: [s.prefix, s.firstName, s.lastName].filter(Boolean).join(' ') || (s.eligible ? '—' : 'ผู้ไม่เข้าเกณฑ์'),
    eligible: s.eligible,
    fields: fields as [string, string | number][],
  }
}

// payload จาก client — ค่าทั้งหมดเป็น string|string[]|boolean ตามฟอร์ม
export interface SurveyPayload {
  // meta
  questionnaireNo?: string
  collectorName?: string
  collectorPhone?: string
  collectedAt?: string
  verifierName?: string
  verifierPhone?: string
  verifiedAt?: string
  siteType: 'VILLAGE' | 'WORKPLACE' | 'SCHOOL'
  // ส่วนที่ 1
  villageNo?: string
  villageName?: string
  province?: string
  amphoe?: string
  tambon?: string
  residence6Months?: string // '1' (<6) | '2' (>6)
  consentGiven?: string // '1' | '2'
  nationalId?: string
  prefix?: string
  firstName?: string
  lastName?: string
  phone?: string
  gender?: string
  genderOther?: string
  birthDate?: string
  religion?: string
  religionOther?: string
  rights?: string[]
  weightKg?: string
  heightCm?: string
  waistCm?: string
  diseases?: string[]
  diseaseOther?: string
  eduStatus?: string
  eduLevel?: string
  // ส่วนที่ 2
  homeSmoking?: string
  smokeStatus?: string
  ever?: Record<string, boolean>
  cur?: Record<string, boolean>
  curAmt?: Record<string, string>
  firstCigTime?: string
  quitAttempt?: string
  // ส่วนที่ 3 (AUDIT)
  q1Frequency?: string
  beerDrink?: boolean
  beerAmt?: string
  liquorDrink?: boolean
  liquorAmt?: string
  wineDrink?: boolean
  wineAmt?: string
  q3Binge?: string
  q4CannotStop?: string
  q5FailNormal?: string
  q6Morning?: string
  q7Guilt?: string
  q8Blackout?: string
  q9Injury?: string
  q10Advised?: string
  // ส่วนที่ 4
  ddDroveAfterDrink?: string
  ddInjured?: string
}

const str = (v?: string) => (v && v.trim() !== '' ? v.trim() : null)
const num = (v?: string) => (v && v.trim() !== '' && !isNaN(Number(v)) ? Number(v) : null)
const json = (v?: string[]) => (v && v.length ? JSON.stringify(v) : null)

// ───────── ตัวสร้าง data object (ใช้ร่วมกันระหว่าง create / update) ─────────

function buildScalars(data: SurveyPayload) {
  return {
    // questionnaireNo รันอัตโนมัติใน createSurvey — ไม่รับจากฟอร์ม และไม่แตะตอน update
    collectorName: str(data.collectorName),
    collectorPhone: str(data.collectorPhone),
    // verifier* ไม่รับจากฟอร์ม — stamp ผ่าน verifySurvey() แทน
    siteType: data.siteType,

    villageNo: str(data.villageNo),
    villageName: str(data.villageName),
    province: str(data.province),
    amphoe: str(data.amphoe),
    tambon: str(data.tambon),
    residence6Months: data.residence6Months === '2',
    consentGiven: data.consentGiven === '1',
    consentAt: data.consentGiven === '1' ? new Date() : null,
    nationalId: str(data.nationalId),
    prefix: str(data.prefix),
    firstName: str(data.firstName),
    lastName: str(data.lastName),
    phone: str(data.phone),
    gender: str(data.gender),
    genderOther: str(data.genderOther),
    birthDate: str(data.birthDate),
    religion: str(data.religion),
    religionOther: str(data.religionOther),
    rights: json(data.rights),
    weightKg: num(data.weightKg),
    heightCm: num(data.heightCm),
    waistCm: num(data.waistCm),
    diseases: json(data.diseases),
    diseaseOther: str(data.diseaseOther),
    eduStatus: str(data.eduStatus),
    eduLevel: str(data.eduLevel),

    ddDroveAfterDrink: str(data.ddDroveAfterDrink),
    ddInjured: str(data.ddInjured),
  }
}

function buildTobacco(data: SurveyPayload) {
  const ever = data.ever ?? {}
  const cur = data.cur ?? {}
  const curAmt = data.curAmt ?? {}
  return {
    homeSmoking: str(data.homeSmoking),
    smokeStatus: str(data.smokeStatus),
    everFactory: ever.Factory ?? false,
    everRolled: ever.Rolled ?? false,
    everEcig: ever.Ecig ?? false,
    everSmokeless: ever.Smokeless ?? false,
    everOther: ever.Other ?? false,
    curFactory: cur.Factory ?? false,
    curFactoryAmt: num(curAmt.Factory),
    curRolled: cur.Rolled ?? false,
    curRolledAmt: num(curAmt.Rolled),
    curEcig: cur.Ecig ?? false,
    curEcigAmt: num(curAmt.Ecig),
    curSmokeless: cur.Smokeless ?? false,
    curSmokelessAmt: num(curAmt.Smokeless),
    curOther: cur.Other ?? false,
    curOtherAmt: num(curAmt.Other),
    firstCigTime: str(data.firstCigTime),
    quitAttempt: str(data.quitAttempt),
  }
}

function buildAlcohol(data: SurveyPayload) {
  const audit = evaluateAudit({
    q1Frequency: num(data.q1Frequency),
    beerDrink: data.beerDrink,
    beerAmt: num(data.beerAmt),
    liquorDrink: data.liquorDrink,
    liquorAmt: num(data.liquorAmt),
    wineDrink: data.wineDrink,
    wineAmt: num(data.wineAmt),
    q3Binge: num(data.q3Binge),
    q4CannotStop: num(data.q4CannotStop),
    q5FailNormal: num(data.q5FailNormal),
    q6Morning: num(data.q6Morning),
    q7Guilt: num(data.q7Guilt),
    q8Blackout: num(data.q8Blackout),
    q9Injury: num(data.q9Injury),
    q10Advised: num(data.q10Advised),
  })
  return {
    q1Frequency: num(data.q1Frequency),
    beerDrink: data.beerDrink ?? false,
    beerAmt: num(data.beerAmt),
    liquorDrink: data.liquorDrink ?? false,
    liquorAmt: num(data.liquorAmt),
    wineDrink: data.wineDrink ?? false,
    wineAmt: num(data.wineAmt),
    q3Binge: num(data.q3Binge),
    q4CannotStop: num(data.q4CannotStop),
    q5FailNormal: num(data.q5FailNormal),
    q6Morning: num(data.q6Morning),
    q7Guilt: num(data.q7Guilt),
    q8Blackout: num(data.q8Blackout),
    q9Injury: num(data.q9Injury),
    q10Advised: num(data.q10Advised),
    auditScore: audit.score,
    riskLevel: audit.risk,
  }
}

export async function createSurvey(data: SurveyPayload) {
  const session = await requireAdmin()

  const created = await prisma.survey.create({
    data: {
      ...buildScalars(data),
      creatorId: session.user.id,
      tobacco: { create: buildTobacco(data) },
      alcohol: { create: buildAlcohol(data) },
    },
  })

  // เลขที่แบบสอบถามรันอัตโนมัติจาก id (เช่น HI-00001) — unique เสมอ
  await prisma.survey.update({
    where: { id: created.id },
    data: { questionnaireNo: `HI-${String(created.id).padStart(5, '0')}` },
  })

  revalidatePath('/dashboard/surveys')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
  redirect('/dashboard/surveys')
}

// บันทึกผู้ "ไม่เข้าเกณฑ์" (จบการสัมภาษณ์) — เก็บเฉพาะพื้นที่/ผู้เก็บ/เหตุผล ไม่เก็บข้อมูลส่วนตัว/สุขภาพ
export async function createIneligible(data: {
  siteType: 'VILLAGE' | 'WORKPLACE' | 'SCHOOL'
  villageNo?: string
  villageName?: string
  province?: string
  amphoe?: string
  tambon?: string
  collectorName?: string
  collectorPhone?: string
  reason: string
}) {
  const session = await requireAdmin()

  const created = await prisma.survey.create({
    data: {
      siteType: data.siteType,
      creatorId: session.user.id,
      villageNo: str(data.villageNo),
      villageName: str(data.villageName),
      province: str(data.province),
      amphoe: str(data.amphoe),
      tambon: str(data.tambon),
      collectorName: str(data.collectorName),
      collectorPhone: str(data.collectorPhone),
      consentGiven: false,
      eligible: false,
      ineligibleReason: data.reason,
    },
  })

  await prisma.survey.update({
    where: { id: created.id },
    data: { questionnaireNo: `HI-${String(created.id).padStart(5, '0')}` },
  })

  revalidatePath('/dashboard/surveys')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
  redirect('/dashboard/surveys')
}

export async function updateSurvey(id: number, data: SurveyPayload) {
  const session = await requireAdmin()

  const tobacco = buildTobacco(data)
  const alcohol = buildAlcohol(data)

  await prisma.survey.update({
    where: { id, ...(session.user.role === 'SUPERADMIN' ? {} : { creatorId: session.user.id }) },
    data: {
      ...buildScalars(data),
      verifiedAt: null, verifierName: null, verifierPhone: null,
      // upsert เผื่อแบบสอบถามเดิมยังไม่มี record รายส่วน
      tobacco: { upsert: { create: tobacco, update: tobacco } },
      alcohol: { upsert: { create: alcohol, update: alcohol } },
    },
  })

  revalidatePath('/dashboard/surveys')
  revalidatePath(`/dashboard/surveys/${id}`)
  revalidatePath('/dashboard')
  redirect(`/dashboard/surveys/${id}`)
}

// ยืนยันการตรวจสอบ — stamp วันที่ + ผู้ตรวจ (= ผู้ใช้ที่ล็อกอิน)
export async function verifySurvey(id: number) {
  const session = await requireAdmin()
  await prisma.survey.update({
    where: { id, ...(session.user.role === 'SUPERADMIN' ? {} : { creatorId: session.user.id }) },
    data: {
      verifiedAt: new Date(),
      verifierName: `${session.user.firstName} ${session.user.lastName}`.trim(),
    },
  })
  revalidatePath('/dashboard/surveys')
  revalidatePath(`/dashboard/surveys/${id}`)
}

// ยกเลิกการตรวจสอบ (เผื่อ stamp ผิด)
export async function unverifySurvey(id: number) {
  const session = await requireAdmin()
  await prisma.survey.update({
    where: { id, ...(session.user.role === 'SUPERADMIN' ? {} : { creatorId: session.user.id }) },
    data: { verifiedAt: null, verifierName: null, verifierPhone: null },
  })
  revalidatePath('/dashboard/surveys')
  revalidatePath(`/dashboard/surveys/${id}`)
}

// เติมพื้นที่ให้หลายรายการพร้อมกัน — ใช้ไล่แก้ข้อมูลเก่าที่ province เป็น null
export async function setSurveyArea(
  ids: number[],
  area: { tambon: string; amphoe: string; province: string },
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  const session = await requireAdmin()

  const clean = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))]
  if (clean.length === 0) return { ok: false, error: 'ยังไม่ได้เลือกรายการ' }
  if (!area.tambon?.trim() || !area.province?.trim()) return { ok: false, error: 'กรุณาเลือกตำบล' }

  const count = await prisma.$transaction(async tx => {
    const allowed = { id: { in: clean }, ...(session.user.role === 'SUPERADMIN' ? {} : { creatorId: session.user.id }) }
    const result = await tx.survey.updateMany({
      where: allowed,
      data: { tambon: area.tambon.trim(), amphoe: area.amphoe.trim() || null, province: area.province.trim(), verifiedAt: null, verifierName: null, verifierPhone: null },
    })
    if (result.count !== clean.length) throw new Error('แก้ไขได้เฉพาะแบบสอบถามที่คุณเป็นผู้บันทึกเท่านั้น')
    return result.count
  })

  revalidatePath('/dashboard/surveys')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/map')
  return { ok: true, updated: count }
}

// กำหนดผู้บันทึกย้อนหลังให้ทุกรายการในตัวกรอง — ข้อมูลก่อนมี creatorId (ก่อน 12 ก.ย. 2569) ไม่รู้ว่าใครลง
// SUPERADMIN เท่านั้น เพราะผู้บันทึกได้สิทธิ์ลบใบนั้นด้วย (canManageSurvey); แตะเฉพาะใบที่ creatorId = null ไม่เขียนทับของเดิม
export async function assignSurveyCreator(
  filter: SurveyFilterParams,
  userId: number,
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  const session = await requireAdmin()
  if (session.user.role !== 'SUPERADMIN') throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return { ok: false, error: 'ผู้ใช้นี้ไม่ใช่ admin' }
  }

  const where = buildSurveyWhere(filter)
  if (Object.keys(where).length === 0) return { ok: false, error: 'ต้องกรองรายการก่อน (เช่น เลือกจังหวัด)' }

  const { count } = await prisma.survey.updateMany({
    where: { AND: [where, { creatorId: null }] },
    data: { creatorId: userId },
  })

  revalidatePath('/dashboard/surveys')
  revalidatePath('/dashboard/users')
  revalidatePath('/dashboard/profile')
  return { ok: true, updated: count }
}

// ลบแบบสอบถาม — ADMIN ลบได้เฉพาะใบที่ตนเองบันทึก, SUPERADMIN ลบได้ทุกใบ
export async function deleteSurvey(id: number): Promise<DeleteResult> {
  const session = await requireAdmin()

  const survey = await prisma.survey.findUnique({ where: { id }, select: { creatorId: true } })
  if (!survey) return { ok: false, error: 'ไม่พบแบบสอบถามนี้ (อาจถูกลบไปแล้ว)' }
  if (!canManageSurvey(session.user, survey.creatorId)) {
    return { ok: false, error: 'ลบได้เฉพาะแบบสอบถามที่คุณเป็นผู้บันทึกเท่านั้น' }
  }

  await prisma.survey.delete({ where: { id, ...(session.user.role === 'SUPERADMIN' ? {} : { creatorId: session.user.id }) } })
  revalidatePath('/dashboard/surveys')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profile')
  return { ok: true }
}
