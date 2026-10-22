import { requireAdminPage } from '@/app/lib/auth'
import { prisma } from '@/app/lib/prisma'
import { thaiAge, calcBMI, bmiCategory } from '@/app/lib/health'
import { DatabaseZap, X } from 'lucide-react'
import Link from 'next/link'
import { TrendHeatmap, BarVertical, BarHorizontal } from './components/DashboardCharts'
import DashboardMiniMap from './components/DashboardMiniMap'
import { Panel, RateCard, SectionHeading, ShareBar, pct, type Share } from './components/DashboardStats'
import ProvinceSelect, { type ProvinceOption } from './components/ProvinceSelect'
import { buildProvinceStats } from '@/app/lib/map-heat'
import { DRINK_COLOR, DRINK_GROUPS, drinkGroupOf } from '@/app/lib/drink-groups'
import { RISK_BANDS } from '@/app/lib/audit'
import { PROVINCE_ZONE } from '@/app/lib/province-zone'
import { tallyIneligible } from '@/app/lib/eligibility'
import EligibilityTip from '@/app/components/EligibilityTip'

export const dynamic = 'force-dynamic'

const GENDER_COLOR: Record<string, string> = { 'ชาย': '#15803D', 'หญิง': '#4ADE80', 'อื่นๆ': '#9CA3AF' }
const BMI_COLOR: Record<string, string> = {
  'น้ำหนักน้อย': '#9CA3AF', 'ปกติ': '#16A34A', 'ท้วม': '#6B7280', 'อ้วน': '#374151', 'อ้วนมาก': '#111827',
}
const AGE_COLOR = ['#BBF7D0', '#4ADE80', '#22C55E', '#16A34A', '#15803D'] // ไล่เฉดเขียวตามอายุ
const SMOKE_COLOR: Record<string, string> = { 'สูบปัจจุบัน': '#111827', 'เคยสูบ/เลิกแล้ว': '#9CA3AF', 'ไม่เคยสูบ': '#16A34A' }

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

// ตัวชี้วัดผลกระทบ (ส่วนที่ 2–4) — นับเฉพาะผู้เข้าเกณฑ์; แยกเป็นฟังก์ชันเพื่อคำนวณภาพรวมประเทศมาเทียบได้
function impactOf(rows: SurveyRows) {
  const eligible = rows.filter((s) => s.eligible)
  const groups = eligible.map((s) => drinkGroupOf(s.alcohol))
  const drinkers = groups.filter((g) => g && g !== 'ไม่ดื่ม').length
  return {
    eligible: eligible.length,
    drinkers,
    // AUDIT ≥ 8 = เสี่ยง + อันตราย + ติด
    highRisk: groups.filter((g) => g === 'ผู้ดื่มแบบเสี่ยง' || g === 'ผู้ดื่มแบบอันตราย' || g === 'ผู้ดื่มแบบติด').length,
    smokers: eligible.filter((s) => ['1', '2'].includes(s.tobacco?.smokeStatus ?? '')).length,
    // 4.1 ดื่มและเคยขับ (ตัวเลือก 2–4) — คิดเป็น % ของผู้ดื่ม เพราะคนไม่ดื่มไม่มีโอกาสเมาแล้วขับ
    drinkDrive: eligible.filter((s) => ['2', '3', '4'].includes(s.ddDroveAfterDrink ?? '')).length,
  }
}

export default async function DashboardHome({ searchParams }: { searchParams: Promise<{ province?: string }> }) {
  await requireAdminPage()
  const selectedProvince = (await searchParams).province?.trim() ?? ''
  let allSurveys: SurveyRows
  try {
    allSurveys = await loadSurveys()
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

  // เลือกจังหวัด → ทุกอย่างเป็นของจังหวัดนั้น เทียบกับภาพรวมประเทศ; แผนที่ย่อยังใช้ทั้งประเทศเพื่อเป็นบริบท
  // ตัวเลือกครบ 77 จังหวัด (มีข้อมูลขึ้นก่อน เรียงมาก→น้อย) — นับทุกใบให้ตรงกับแผนที่
  const provCount = new Map<string, number>()
  for (const s of allSurveys) { const p = s.province?.trim(); if (p) provCount.set(p, (provCount.get(p) ?? 0) + 1) }
  const provinceOptions: ProvinceOption[] = Object.entries(PROVINCE_ZONE)
    .map(([name, zone]) => ({ name, zone, count: provCount.get(name) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'th'))
  const surveys = selectedProvince ? allSurveys.filter((s) => s.province?.trim() === selectedProvince) : allSurveys

  const eligible = surveys.filter((s) => s.eligible)
  const ineligibleCount = surveys.length - eligible.length
  const verifiedCount = surveys.filter((s) => s.verifiedAt).length
  // แยกเหตุคัดออก เพื่อให้เจ้าหน้าที่เห็นว่าที่สัมภาษณ์ไม่จบเป็นเพราะอะไรบ้าง
  const ineligibleReasons = tallyIneligible(surveys.filter((s) => !s.eligible).map((s) => s.ineligibleReason))

  // ── ① ผลกระทบ ──
  const k = impactOf(surveys)
  const nat = selectedProvince ? impactOf(allSurveys) : null
  const cmp = (n: number, base: number) => (nat ? pct(n, base) : undefined)

  const auditRange = Object.fromEntries(RISK_BANDS.map((b) => [b.level, `AUDIT ${b.range}`]))
  const risk: Share[] = tally(eligible.map((s) => drinkGroupOf(s.alcohol)), [...DRINK_GROUPS])
    .map((d) => ({ ...d, color: DRINK_COLOR[d.name as keyof typeof DRINK_COLOR], hint: auditRange[d.name] }))

  const smokeBucket = (st?: string | null) =>
    st === '1' || st === '2' ? 'สูบปัจจุบัน' : st === '6' ? 'ไม่เคยสูบ' : st ? 'เคยสูบ/เลิกแล้ว' : null
  const smoke: Share[] = tally(eligible.map((s) => smokeBucket(s.tobacco?.smokeStatus)), ['สูบปัจจุบัน', 'เคยสูบ/เลิกแล้ว', 'ไม่เคยสูบ'])
    .map((d) => ({ ...d, color: SMOKE_COLOR[d.name] }))

  // ── ② ผู้ตอบ ──
  const genderBucket = (g?: string | null) => (g === 'ชาย' ? 'ชาย' : g === 'หญิง' ? 'หญิง' : g ? 'อื่นๆ' : null)
  const gender: Share[] = tally(eligible.map((s) => genderBucket(s.gender)), ['ชาย', 'หญิง', 'อื่นๆ'])
    .filter((d) => d.value > 0).map((d) => ({ ...d, color: GENDER_COLOR[d.name] }))

  const age = tally(eligible.map((s) => ageGroup(thaiAge(s.birthDate))), ['15–24', '25–34', '35–44', '45–59', '60+'])
    .map((d, i) => ({ ...d, color: AGE_COLOR[i] }))

  const bmi = tally(
    eligible.map((s) => {
      const b = calcBMI(s.weightKg ? Number(s.weightKg) : null, s.heightCm ? Number(s.heightCm) : null)
      return b != null ? bmiCategory(b) : null
    }),
    ['น้ำหนักน้อย', 'ปกติ', 'ท้วม', 'อ้วน', 'อ้วนมาก'],
  ).map((d) => ({ ...d, color: BMI_COLOR[d.name] }))

  // ── ③ การดำเนินงาน ──
  // พื้นที่ — เรียงมาก→น้อย เอา top 8; เลือกจังหวัดแล้วแตกเป็นอำเภอแทน
  const areaLabel = selectedProvince ? 'อำเภอ' : 'จังหวัด'
  const areaOf = (s: SurveyRows[number]) => (selectedProvince ? s.amphoe?.trim() : s.province?.trim())
  const areaMap = new Map<string, number>()
  for (const s of eligible) { const a = areaOf(s); if (a) areaMap.set(a, (areaMap.get(a) ?? 0) + 1) }
  const area = [...areaMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  // trend รายวัน — ย้อนหลัง 1 ปีแบบต่อเนื่อง (รวมวันที่ count=0) สำหรับ heatmap เต็มความกว้างหน้า
  const TREND_DAYS = 364
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

  // สถิติรายจังหวัดสำหรับแผนที่ย่อ — นับทุกใบรวมที่ไม่เข้าเกณฑ์ ให้ตรงกับหน้าแผนที่เต็ม
  const provinceStats = buildProvinceStats(allSurveys)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            ภาพรวม{selectedProvince && <span className="text-green-700"> · จังหวัด{selectedProvince}</span>}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {selectedProvince && PROVINCE_ZONE[selectedProvince] ? `ภาค${PROVINCE_ZONE[selectedProvince]} · ` : ''}
            สรุปข้อมูลผลกระทบด้านสุขภาวะ · {surveys.length.toLocaleString()} แบบสอบถาม
            {selectedProvince && ' · เทียบกับภาพรวมทุกจังหวัด'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProvinceSelect value={selectedProvince} options={provinceOptions} />
          {selectedProvince && (
            <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100">
              <X aria-hidden="true" className="size-3.5" /> ทั้งประเทศ
            </Link>
          )}
        </div>
      </div>

      {surveys.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
          {selectedProvince
            ? <>จังหวัด{selectedProvince}ยังไม่มีแบบสอบถาม — <Link href="/dashboard" className="font-medium text-green-700 hover:underline">ดูทั้งประเทศ</Link></>
            : <>ยังไม่มีข้อมูล — เริ่มที่เมนู <span className="font-medium text-gray-600">แบบสอบถาม</span></>}
        </div>
      ) : (
        <>
          {/* ① ผลกระทบ — สิ่งที่ สสส. วัด: ความชุกเป็น % ไม่ใช่จำนวนคน */}
          <section className="space-y-4">
            <SectionHeading no="1" title="ผลกระทบด้านสุขภาวะ" sub={`ผู้เข้าเกณฑ์ ${k.eligible.toLocaleString()} คน`} />
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <RateCard label="ดื่มแอลกอฮอล์" n={k.drinkers} base={k.eligible} baseLabel="คน"
                compare={nat ? cmp(nat.drinkers, nat.eligible) : undefined} compareLabel="ภาพรวม" />
              <RateCard label="ดื่มแบบเสี่ยงขึ้นไป (AUDIT ≥ 8)" n={k.highRisk} base={k.eligible} baseLabel="คน"
                compare={nat ? cmp(nat.highRisk, nat.eligible) : undefined} compareLabel="ภาพรวม" />
              <RateCard label="สูบบุหรี่ปัจจุบัน" n={k.smokers} base={k.eligible} baseLabel="คน"
                compare={nat ? cmp(nat.smokers, nat.eligible) : undefined} compareLabel="ภาพรวม" />
              <RateCard label="เมาแล้วขับ (12 เดือน)" n={k.drinkDrive} base={k.drinkers} baseLabel="ผู้ดื่ม"
                compare={nat ? cmp(nat.drinkDrive, nat.drinkers) : undefined} compareLabel="ภาพรวม" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <Panel title="ระดับความเสี่ยงการดื่ม (AUDIT)" sub="ตามเกณฑ์ WHO / ศวส. · จุดตัดผิดปกติ ≥ 8 คะแนน" className="lg:col-span-3">
                <ShareBar items={risk} />
              </Panel>
              <Panel title="สถานะการสูบบุหรี่" className="lg:col-span-2">
                <ShareBar items={smoke} />
              </Panel>
            </div>
          </section>

          {/* ② ผู้ตอบ */}
          <section className="space-y-4">
            <SectionHeading no="2" title="ผู้ตอบแบบสอบถาม" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Panel title="เพศ">
                <ShareBar items={gender} compact />
              </Panel>
              <Panel title="ช่วงอายุ">
                <BarVertical data={age} distributed height={180} />
              </Panel>
              <Panel title="ดัชนีมวลกาย (BMI)" sub="เกณฑ์ Asia-Pacific">
                <BarVertical data={bmi} distributed height={180} />
              </Panel>
            </div>
          </section>

          {/* ③ การดำเนินงาน */}
          <section className="space-y-4">
            <SectionHeading no="3" title="การดำเนินงานเก็บข้อมูล" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: 'แบบสอบถามทั้งหมด', value: surveys.length },
                  { label: 'เข้าเกณฑ์', value: eligible.length },
                  { label: 'คัดออก', value: ineligibleCount },
                  { label: 'ตรวจสอบแล้ว', value: verifiedCount, hint: `${Math.round(pct(verifiedCount, surveys.length))}%` },
                ].map(({ label, value, hint }) => (
                  <div key={label} className="rounded-xl bg-gray-100/80 px-4 py-3">
                    <span className="block text-[13px] text-gray-500">{label}</span>
                    <p className="mt-0.5 text-xl font-bold tabular-nums text-gray-900">
                      {value.toLocaleString()}{hint && <span className="ml-1.5 text-xs font-normal text-gray-500">{hint}</span>}
                    </p>
                  </div>
                ))}
              </div>

              <Panel title="การเก็บข้อมูลรายวัน" sub={`${trend.reduce((s, d) => s + d.count, 0).toLocaleString()} แบบสอบถามในรอบ 1 ปีที่ผ่านมา`}>
                <TrendHeatmap data={trend} />
              </Panel>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[13px] text-gray-500">
                เหตุคัดออก <EligibilityTip />
              </span>
              {ineligibleReasons.map((r) => (
                <span key={r.key} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white text-gray-600 border border-gray-200">
                  {r.label} <b className="tabular-nums text-gray-900">{r.count.toLocaleString()}</b>
                </span>
              ))}
              {ineligibleCount === 0 && <span className="text-xs text-gray-400">ยังไม่มีรายการที่ถูกคัดออก</span>}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title={`พื้นที่เก็บข้อมูล (${areaLabel})`} sub={`ผู้เข้าเกณฑ์ · ${areaLabel}ที่มากที่สุด 8 อันดับ`}>
                <BarHorizontal data={area} color="#16A34A" />
              </Panel>
              <DashboardMiniMap stats={provinceStats} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
