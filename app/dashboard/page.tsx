import { prisma } from '@/app/lib/prisma'
import { thaiAge, calcBMI, bmiCategory } from '@/app/lib/health'
import { DatabaseZap } from 'lucide-react'
import DashboardCharts, { type ChartsData, TrendHeatmap, BmiMini } from './components/DashboardCharts'

export const dynamic = 'force-dynamic'

const SITE_LABEL: Record<string, string> = { VILLAGE: 'หมู่บ้าน', WORKPLACE: 'สถานประกอบการ', SCHOOL: 'สถานศึกษา' }
// โทนเขียว–ดำ–เทา: ไล่เฉดเขียว→เข้ม→ดำ ตามความรุนแรง, เทาสำหรับกลุ่มกลาง
const RISK_COLOR: Record<string, string> = {
  'ไม่ดื่ม': '#9CA3AF',           // เทา
  'ผู้ดื่มแบบเสี่ยงต่ำ': '#86EFAC', // เขียวอ่อน
  'ผู้ดื่มแบบเสี่ยง': '#22C55E',    // เขียว
  'ผู้ดื่มแบบอันตราย': '#15803D',   // เขียวเข้ม
  'ผู้ดื่มแบบติด': '#111827',       // ดำ (รุนแรงสุด)
}
const GENDER_COLOR: Record<string, string> = { 'ชาย': '#15803D', 'หญิง': '#4ADE80', 'อื่นๆ': '#9CA3AF' }
const BMI_COLOR: Record<string, string> = {
  'น้ำหนักน้อย': '#9CA3AF', 'ปกติ': '#16A34A', 'ท้วม': '#6B7280', 'อ้วน': '#374151', 'อ้วนมาก': '#111827',
}
const AGE_COLOR = ['#BBF7D0', '#4ADE80', '#22C55E', '#16A34A', '#15803D'] // ไล่เฉดเขียวตามอายุ

function ageGroup(age: number | null): string | null {
  if (age == null) return null
  if (age < 25) return '15–24'
  if (age < 35) return '25–34'
  if (age < 45) return '35–44'
  if (age < 60) return '45–59'
  return '60+'
}

// นับเป็น array {name,value} ตามลำดับ order ที่กำหนด (รวมค่าที่เป็น 0)
function tally(items: (string | null)[], order: string[]): { name: string; value: number }[] {
  const m = new Map<string, number>()
  for (const it of items) if (it) m.set(it, (m.get(it) ?? 0) + 1)
  return order.map((name) => ({ name, value: m.get(name) ?? 0 }))
}

type SurveyRows = Awaited<ReturnType<typeof loadSurveys>>

async function loadSurveys() {
  return prisma.survey.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      tobacco: { select: { smokeStatus: true } },
      alcohol: { select: { q1Frequency: true, auditScore: true, riskLevel: true } },
    },
  })
}

export default async function DashboardHome() {
  let surveys: SurveyRows
  try {
    surveys = await loadSurveys()
  } catch (err) {
    console.warn('[dashboard] เชื่อมต่อฐานข้อมูลไม่ได้:', err instanceof Error ? err.message : err)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">ภาพรวม</h1>
          <p className="text-sm text-gray-400 mt-0.5">สรุปข้อมูลผลกระทบด้านสุขภาวะ</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <DatabaseZap className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="mt-3 text-sm font-medium text-amber-800">เชื่อมต่อฐานข้อมูลไม่ได้ในขณะนี้</p>
          <p className="mt-1 text-xs text-amber-600">
            ระบบไม่สามารถดึงข้อมูลแบบสอบถามได้ กรุณาตรวจสอบว่าฐานข้อมูลทำงานอยู่ แล้วลองรีเฟรชหน้านี้อีกครั้ง
          </p>
        </div>
      </div>
    )
  }

  const eligible = surveys.filter((s) => s.eligible)
  const ineligibleCount = surveys.length - eligible.length

  // KPI
  const smokers = eligible.filter((s) => s.tobacco && ['1', '2'].includes(s.tobacco.smokeStatus ?? '')).length
  const drinkers = eligible.filter((s) => (s.alcohol?.q1Frequency ?? 0) > 0).length
  const highRisk = eligible.filter((s) => (s.alcohol?.auditScore ?? 0) >= 8).length
  const drinkDrive = eligible.filter((s) => ['2', '3', '4'].includes(s.ddDroveAfterDrink ?? '')).length

  const cards = [
    { label: 'แบบสอบถามทั้งหมด', value: surveys.length },
    { label: 'เข้าเกณฑ์', value: eligible.length },
    { label: 'สูบบุหรี่ปัจจุบัน', value: smokers },
    { label: 'ดื่มแอลกอฮอล์', value: drinkers },
    { label: 'เสี่ยงสูง (AUDIT ≥ 8)', value: highRisk },
    { label: 'เคยเมาแล้วขับ', value: drinkDrive },
  ]

  // ── charts ──
  const riskOrder = ['ไม่ดื่ม', 'ผู้ดื่มแบบเสี่ยงต่ำ', 'ผู้ดื่มแบบเสี่ยง', 'ผู้ดื่มแบบอันตราย', 'ผู้ดื่มแบบติด']
  const risk = tally(
    eligible.map((s) => (!s.alcohol || (s.alcohol.q1Frequency ?? 0) === 0 ? 'ไม่ดื่ม' : s.alcohol.riskLevel)),
    riskOrder,
  ).filter((d) => d.value > 0).map((d) => ({ ...d, color: RISK_COLOR[d.name] }))

  const smokeBucket = (st?: string | null) =>
    st === '1' || st === '2' ? 'สูบปัจจุบัน' : st === '6' ? 'ไม่เคยสูบ' : st ? 'เคยสูบ/เลิกแล้ว' : null
  const SMOKE_COLOR: Record<string, string> = { 'สูบปัจจุบัน': '#111827', 'เคยสูบ/เลิกแล้ว': '#9CA3AF', 'ไม่เคยสูบ': '#16A34A' }
  const smoke = tally(eligible.map((s) => smokeBucket(s.tobacco?.smokeStatus)), ['สูบปัจจุบัน', 'เคยสูบ/เลิกแล้ว', 'ไม่เคยสูบ'])
    .map((d) => ({ ...d, color: SMOKE_COLOR[d.name] }))

  const site = tally(eligible.map((s) => SITE_LABEL[s.siteType]), ['หมู่บ้าน', 'สถานประกอบการ', 'สถานศึกษา'])

  const age = tally(eligible.map((s) => ageGroup(thaiAge(s.birthDate))), ['15–24', '25–34', '35–44', '45–59', '60+'])
    .map((d, i) => ({ ...d, color: AGE_COLOR[i] }))

  const genderBucket = (g?: string | null) => (g === 'ชาย' ? 'ชาย' : g === 'หญิง' ? 'หญิง' : g ? 'อื่นๆ' : null)
  const gender = tally(eligible.map((s) => genderBucket(s.gender)), ['ชาย', 'หญิง', 'อื่นๆ'])
    .filter((d) => d.value > 0).map((d) => ({ ...d, color: GENDER_COLOR[d.name] }))

  const bmi = tally(
    eligible.map((s) => {
      const b = calcBMI(s.weightKg ? Number(s.weightKg) : null, s.heightCm ? Number(s.heightCm) : null)
      return b != null ? bmiCategory(b) : null
    }),
    ['น้ำหนักน้อย', 'ปกติ', 'ท้วม', 'อ้วน', 'อ้วนมาก'],
  ).map((d) => ({ ...d, color: BMI_COLOR[d.name] }))

  // province — เรียงมาก→น้อย เอา top 8
  const provMap = new Map<string, number>()
  for (const s of eligible) if (s.province) provMap.set(s.province, (provMap.get(s.province) ?? 0) + 1)
  const province = [...provMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  // trend รายวัน — ช่วง 180 วันล่าสุดแบบต่อเนื่อง (รวมวันที่ count=0) สำหรับ heatmap
  const TREND_DAYS = 180
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const dayCount = new Map<string, number>()
  for (const s of surveys) dayCount.set(iso(new Date(s.createdAt)), (dayCount.get(iso(new Date(s.createdAt))) ?? 0) + 1)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const trend = Array.from({ length: TREND_DAYS }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (TREND_DAYS - 1 - i))
    const key = iso(d)
    return { date: key, count: dayCount.get(key) ?? 0 }
  })

  const charts: ChartsData = { risk, smoke, site, age, province, trend, gender, bmi }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">ภาพรวม</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          สรุปข้อมูลผลกระทบด้านสุขภาวะ · {surveys.length.toLocaleString()} รายการ
          {ineligibleCount > 0 && <span className="text-gray-400"> (ไม่เข้าเกณฑ์ {ineligibleCount})</span>}
        </p>
      </div>

      {/* แผงสรุปแบบ Claude: stat boxes + heatmap ในกล่องเทาเดียว */}
      <div className="bg-gray-100/70 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          {cards.map(({ label, value }) => (
            <div key={label} className="bg-gray-200/60 rounded-xl px-4 py-3">
              <span className="block text-[13px] text-gray-500 truncate">{label}</span>
              <p className="mt-0.5 text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          <div className="lg:col-span-3">
            <TrendHeatmap data={trend} />
          </div>
          <div className="lg:col-span-2">
            <BmiMini data={bmi} />
          </div>
        </div>
        <p className="text-[13px] text-gray-400">
          เก็บข้อมูล {trend.reduce((s, d) => s + d.count, 0).toLocaleString()} แบบสอบถามในช่วง 180 วันล่าสุด
        </p>
      </div>

      {surveys.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
          ยังไม่มีข้อมูล — เริ่มที่เมนู <span className="font-medium text-gray-600">แบบสอบถาม</span>
        </div>
      ) : (
        <DashboardCharts data={charts} />
      )}
    </div>
  )
}
