// Seed ~50 แบบสอบถามทดลอง (สมจริง) สำหรับ dashboard
// รัน: node prisma/seed.mjs
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CURRENT_BE = new Date().getFullYear() + 543

const rnd = (n) => Math.floor(Math.random() * n)
const pick = (arr) => arr[rnd(arr.length)]
const chance = (p) => Math.random() < p
const range = (a, b) => a + rnd(b - a + 1)

const GEO = [
  { province: 'เชียงใหม่', amphoe: 'เมืองเชียงใหม่', tambon: 'สุเทพ' },
  { province: 'เชียงใหม่', amphoe: 'สันทราย', tambon: 'หนองหาร' },
  { province: 'ร้อยเอ็ด', amphoe: 'เมืองสรวง', tambon: 'กกกุง' },
  { province: 'ขอนแก่น', amphoe: 'เมืองขอนแก่น', tambon: 'ในเมือง' },
  { province: 'นครราชสีมา', amphoe: 'ปากช่อง', tambon: 'หนองสาหร่าย' },
  { province: 'สงขลา', amphoe: 'หาดใหญ่', tambon: 'คอหงส์' },
  { province: 'พระนครศรีอยุธยา', amphoe: 'บางไทร', tambon: 'กกแก้วบูรพา' },
  { province: 'เชียงราย', amphoe: 'เมืองเชียงราย', tambon: 'รอบเวียง' },
]
const FIRST_M = ['สมชาย', 'วิชัย', 'ประสิทธิ์', 'อนุชา', 'ธนากร', 'เกรียงไกร', 'นพดล']
const FIRST_F = ['สมหญิง', 'มาลี', 'วันดี', 'ปราณี', 'สุดา', 'กนกวรรณ', 'อรทัย']
const LAST = ['ใจดี', 'แสงทอง', 'รักไทย', 'ศรีสุข', 'บุญมี', 'พงษ์ไพร', 'วงศ์คำ', 'มั่นคง']
const SITES = ['VILLAGE', 'WORKPLACE', 'SCHOOL']

function evalAudit(a) {
  const n = (v) => (typeof v === 'number' ? v : 0)
  const q2vals = []
  if (a.beerDrink) q2vals.push(n(a.beerAmt))
  if (a.liquorDrink) q2vals.push(n(a.liquorAmt))
  if (a.wineDrink) q2vals.push(n(a.wineAmt))
  const q2 = q2vals.length ? Math.max(...q2vals) : 0
  const score = n(a.q1Frequency) + q2 + n(a.q3Binge) + n(a.q4CannotStop) + n(a.q5FailNormal) +
    n(a.q6Morning) + n(a.q7Guilt) + n(a.q8Blackout) + n(a.q9Injury) + n(a.q10Advised)
  const risk = score <= 7 ? 'ผู้ดื่มแบบเสี่ยงต่ำ' : score <= 15 ? 'ผู้ดื่มแบบเสี่ยง'
    : score <= 19 ? 'ผู้ดื่มแบบอันตราย' : 'ผู้ดื่มแบบติด'
  return { score, risk }
}

function makeAlcohol() {
  const drinks = chance(0.55) // 55% ดื่มในรอบ 3 เดือน
  if (!drinks) {
    return { q1Frequency: 0, beerDrink: false, liquorDrink: false, wineDrink: false,
      q3Binge: 0, q4CannotStop: 0, q5FailNormal: 0, q6Morning: 0, q7Guilt: 0, q8Blackout: 0, q9Injury: 0, q10Advised: 0 }
  }
  // bias ให้คนส่วนใหญ่คะแนนต่ำ บางคนสูง
  const heavy = chance(0.25)
  const lo = () => (heavy ? range(1, 4) : rnd(2))
  const ever = () => pick([0, 0, 2, 4])
  const beerDrink = chance(0.6), liquorDrink = chance(0.4), wineDrink = chance(0.15)
  return {
    q1Frequency: range(1, 4),
    beerDrink, beerAmt: beerDrink ? lo() : null,
    liquorDrink, liquorAmt: liquorDrink ? lo() : null,
    wineDrink, wineAmt: wineDrink ? lo() : null,
    q3Binge: lo(), q4CannotStop: lo(), q5FailNormal: lo(), q6Morning: heavy ? lo() : 0,
    q7Guilt: lo(), q8Blackout: lo(), q9Injury: ever(), q10Advised: ever(),
  }
}

function makeTobacco() {
  const status = pick(['1', '1', '2', '3', '5', '6', '6', '6']) // bias ไม่สูบ/เคยสูบ
  const current = status === '1' || status === '2'
  return {
    homeSmoking: pick(['นานๆครั้ง', 'ค่อนข้างบ่อย', 'ทุกวัน', 'ไม่เคย', 'ไม่เคย']),
    smokeStatus: status,
    everFactory: status !== '6' ? chance(0.7) : false,
    everRolled: status !== '6' ? chance(0.3) : false,
    everEcig: status !== '6' ? chance(0.2) : false,
    everSmokeless: false, everOther: false,
    curFactory: current ? chance(0.7) : false,
    curFactoryAmt: current ? range(3, 20) : null,
    curRolled: current ? chance(0.3) : false,
    curRolledAmt: current ? range(2, 10) : null,
    curEcig: current ? chance(0.2) : false, curEcigAmt: current ? range(1, 10) : null,
    curSmokeless: false, curOther: false,
    firstCigTime: current ? pick(['ภายใน 5 นาที', '6-30 นาที', '31-60 นาที', 'มากกว่า 60 นาที']) : null,
    quitAttempt: current ? pick(['ไม่เคยคิด', 'เคยคิด', 'พยายาม 1-2 ครั้ง']) : null,
  }
}

async function main() {
  console.log('ลบข้อมูลแบบสอบถามเดิม...')
  await prisma.surveyTobacco.deleteMany()
  await prisma.surveyAlcohol.deleteMany()
  await prisma.survey.deleteMany()

  const TOTAL = 50
  const INELIGIBLE = 6

  for (let i = 0; i < TOTAL; i++) {
    const daysAgo = rnd(60)
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - rnd(86400000))
    const geo = pick(GEO)
    const ineligible = i < INELIGIBLE

    if (ineligible) {
      const reason = pick([
        'พักอาศัยน้อยกว่า 6 เดือน (ข้อ 1.6)',
        'อายุต่ำกว่า 15 ปี (ข้อ 1.11)',
        'ไม่ยินยอมเข้าร่วม (ข้อ 1.7)',
      ])
      const created = await prisma.survey.create({
        data: {
          siteType: pick(SITES), ...geo, villageNo: String(range(1, 12)),
          collectorName: pick([...FIRST_M, ...FIRST_F]) + ' ' + pick(LAST),
          consentGiven: false, eligible: false, ineligibleReason: reason, createdAt,
        },
      })
      await prisma.survey.update({ where: { id: created.id }, data: { questionnaireNo: `HI-${String(created.id).padStart(5, '0')}` } })
      continue
    }

    const isMale = chance(0.48)
    const age = range(15, 72)
    const birthYear = CURRENT_BE - age
    const heightCm = isMale ? range(160, 182) : range(150, 168)
    const weightKg = Math.round((heightCm - 100 - (isMale ? 5 : 8) + range(-12, 22)) * 10) / 10
    const waistCm = Math.round((weightKg * 0.85 + range(-6, 10)) * 10) / 10
    const diseases = chance(0.65) ? ['ไม่มี'] : [pick(['เบาหวาน', 'ความดันโลหิตสูง', 'หัวใจและหลอดเลือด', 'ไตเรื้อรัง'])]
    const alcohol = makeAlcohol()
    const audit = evalAudit(alcohol)
    const drinks = alcohol.q1Frequency > 0

    const created = await prisma.survey.create({
      data: {
        siteType: pick(SITES), ...geo, villageNo: String(range(1, 12)), villageName: 'บ้าน' + pick(['หนองบัว', 'ทุ่งกว้าง', 'ดอนแก้ว', 'ป่าสัก']),
        residence6Months: true, consentGiven: true, consentAt: createdAt,
        collectorName: pick([...FIRST_M, ...FIRST_F]) + ' ' + pick(LAST),
        prefix: isMale ? 'นาย' : pick(['นาง', 'นางสาว']),
        firstName: isMale ? pick(FIRST_M) : pick(FIRST_F), lastName: pick(LAST),
        gender: isMale ? 'ชาย' : 'หญิง',
        birthDate: `${String(range(1, 28)).padStart(2, '0')}/${String(range(1, 12)).padStart(2, '0')}/${birthYear}`,
        religion: pick(['พุทธ', 'พุทธ', 'พุทธ', 'อิสลาม', 'คริสต์']),
        rights: JSON.stringify(['บัตรประชาชนไทย']),
        weightKg, heightCm, waistCm,
        diseases: JSON.stringify(diseases),
        eduStatus: age < 23 && chance(0.5) ? 'กำลังศึกษา' : 'ไม่ได้อยู่ในระบบ',
        eduLevel: pick(['ประถม', 'มัธยมต้น', 'มัธยมปลาย', 'ปวช.', 'ปริญญาตรี']),
        ddDroveAfterDrink: drinks ? pick(['1', '2', '2', '3', '5']) : '1',
        ddInjured: drinks && chance(0.15) ? pick(['2', '3']) : '1',
        eligible: true, createdAt,
        tobacco: { create: makeTobacco() },
        alcohol: { create: { ...alcohol, auditScore: audit.score, riskLevel: audit.risk } },
      },
    })
    await prisma.survey.update({ where: { id: created.id }, data: { questionnaireNo: `HI-${String(created.id).padStart(5, '0')}` } })
  }

  const n = await prisma.survey.count()
  console.log(`✓ สร้างข้อมูลทดลอง ${n} รายการ (เข้าเกณฑ์ ${n - INELIGIBLE} · ไม่เข้าเกณฑ์ ${INELIGIBLE})`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
