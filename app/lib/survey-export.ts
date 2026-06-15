import type { Prisma } from '@prisma/client'
import * as O from '@/app/lib/survey-options'
import { calcBMI, bmiCategory } from '@/app/lib/health'

export const SITE_LABEL: Record<string, string> = { VILLAGE: 'หมู่บ้าน', WORKPLACE: 'สถานประกอบการ', SCHOOL: 'สถานศึกษา' }

const dec = (v: unknown) => (v === null || v === undefined ? '' : Number(v))
const yn = (v?: boolean | null) => (v === true ? 'ใช่' : v === false ? 'ไม่ใช่' : '')
const dStr = (d?: Date | null) => (d ? new Date(d).toLocaleDateString('th-TH') : '')
const lbl = (opts: O.Opt[], v?: string | number | null) =>
  v === null || v === undefined || v === '' ? '' : O.labelOf(opts, String(v))
const arr = (s?: string | null, opts?: O.Opt[]): string => {
  if (!s) return ''
  try {
    const a = JSON.parse(s)
    if (!Array.isArray(a)) return ''
    return opts ? a.map((v: string) => O.labelOf(opts, v)).join(', ') : a.join(', ')
  } catch {
    return ''
  }
}

export type SurveyWithRelations = Prisma.SurveyGetPayload<{
  include: { tobacco: true; alcohol: true; creator: { select: { firstName: true; lastName: true } } }
}>

export const SURVEY_INCLUDE = {
  tobacco: true,
  alcohol: true,
  creator: { select: { firstName: true, lastName: true } },
} as const

// แปลง 1 แบบสอบถาม → object label ไทย:ค่า (ใช้ทั้ง Excel export และสลิปพิมพ์รายคน)
export function labeledSurvey(s: SurveyWithRelations): Record<string, string | number> {
  const t = s.tobacco
  const a = s.alcohol
  const bmi = calcBMI(s.weightKg ? Number(s.weightKg) : null, s.heightCm ? Number(s.heightCm) : null)
  return {
    'เลขที่แบบสอบถาม': s.questionnaireNo || `#${s.id}`,
    'สถานะคัดกรอง': s.eligible ? 'เข้าเกณฑ์' : 'ไม่เข้าเกณฑ์',
    'เหตุไม่เข้าเกณฑ์': s.ineligibleReason || '',
    'ประเภทสถานที่': SITE_LABEL[s.siteType],
    'ผู้เก็บข้อมูล': s.collectorName || '',
    'วันที่เก็บ': dStr(s.createdAt),
    'ผู้ตรวจสอบ': s.verifierName || '',
    'วันที่ตรวจสอบ': dStr(s.verifiedAt),
    // ส่วนที่ 1
    'หมู่ที่': s.villageNo || '',
    'ชื่อหมู่บ้าน': s.villageName || '',
    'จังหวัด': s.province || '',
    'อำเภอ': s.amphoe || '',
    'ตำบล': s.tambon || '',
    'พักอาศัย>6เดือน': yn(s.residence6Months),
    'ยินยอม': yn(s.consentGiven),
    'เลขบัตรประชาชน': s.nationalId || '',
    'คำนำหน้า': s.prefix || '',
    'ชื่อ': s.firstName || '',
    'นามสกุล': s.lastName || '',
    'เบอร์โทร': s.phone || '',
    'เพศ': s.gender === 'อื่นๆ' ? s.genderOther || 'อื่น ๆ' : lbl(O.GENDERS, s.gender),
    'วันเกิด': s.birthDate || '',
    'ศาสนา': s.religion === 'อื่นๆ' ? s.religionOther || 'อื่น ๆ' : lbl(O.RELIGIONS, s.religion),
    'บัตร/สิทธิ': arr(s.rights, O.RIGHTS),
    'น้ำหนัก(กก.)': dec(s.weightKg),
    'ส่วนสูง(ซม.)': dec(s.heightCm),
    'เส้นรอบเอว(ซม.)': dec(s.waistCm),
    'BMI': bmi ?? '',
    'เกณฑ์ BMI': bmi != null ? bmiCategory(bmi) : '',
    'โรคที่วินิจฉัย': [arr(s.diseases, O.DISEASES), s.diseaseOther].filter(Boolean).join(' · '),
    'สถานภาพการศึกษา': lbl(O.EDU_STATUS, s.eduStatus),
    'ระดับการศึกษา': lbl(O.EDU_LEVELS, s.eduLevel),
    // ส่วนที่ 2
    '2.1 สูบในบ้าน': lbl(O.HOME_SMOKING, t?.homeSmoking),
    '2.2 สถานะการสูบ': lbl(O.SMOKE_STATUS, t?.smokeStatus),
    '2.3 เคยสูบประเภท': O.TOBACCO_TYPES.filter((x) => (t as Record<string, unknown> | null)?.[`ever${x.key}`]).map((x) => x.label).join(', '),
    '2.4 ปัจจุบันสูบประเภท': O.TOBACCO_TYPES.filter((x) => (t as Record<string, unknown> | null)?.[`cur${x.key}`])
      .map((x) => `${x.label}(${(t as Record<string, unknown> | null)?.[`cur${x.key}Amt`] ?? '?'})`).join(', '),
    '2.5 มวนแรกหลังตื่น': lbl(O.FIRST_CIG_TIME, t?.firstCigTime),
    '2.6 ความพยายามเลิก': lbl(O.QUIT_ATTEMPT, t?.quitAttempt),
    // ส่วนที่ 3
    '3.1 ความถี่ดื่ม': lbl(O.AUDIT_Q1, a?.q1Frequency),
    '3.2 เบียร์': a?.beerDrink ? lbl(O.BEER_AMT, a.beerAmt) : 'ไม่ดื่ม',
    '3.2 เหล้า': a?.liquorDrink ? lbl(O.LIQUOR_AMT, a.liquorAmt) : 'ไม่ดื่ม',
    '3.2 ไวน์': a?.wineDrink ? lbl(O.WINE_AMT, a.wineAmt) : 'ไม่ดื่ม',
    '3.3 ดื่มหนัก': lbl(O.AUDIT_FREQ, a?.q3Binge),
    '3.4 หยุดไม่ได้': lbl(O.AUDIT_FREQ, a?.q4CannotStop),
    '3.5 ทำงานไม่ได้': lbl(O.AUDIT_FREQ, a?.q5FailNormal),
    '3.6 ดื่มตอนเช้า': lbl(O.AUDIT_FREQ, a?.q6Morning),
    '3.7 รู้สึกผิด': lbl(O.AUDIT_FREQ, a?.q7Guilt),
    '3.8 จำไม่ได้': lbl(O.AUDIT_FREQ, a?.q8Blackout),
    '3.9 บาดเจ็บ': lbl(O.AUDIT_EVER, a?.q9Injury),
    '3.10 ได้รับคำแนะนำ': lbl(O.AUDIT_EVER, a?.q10Advised),
    'คะแนน AUDIT': a?.auditScore ?? '',
    'ระดับความเสี่ยง': a?.riskLevel || '',
    // ส่วนที่ 4
    '4.1 ดื่มแล้วขับ': lbl(O.DD_DROVE, s.ddDroveAfterDrink),
    '4.2 บาดเจ็บอุบัติเหตุ': lbl(O.DD_INJURED, s.ddInjured),
    'สถานะตรวจสอบ': s.verifiedAt ? 'ตรวจสอบแล้ว' : 'ยังไม่ตรวจสอบ',
    'ผู้บันทึก': s.creator ? `${s.creator.firstName} ${s.creator.lastName}` : '',
  }
}
