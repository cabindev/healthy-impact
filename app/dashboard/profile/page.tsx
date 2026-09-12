import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import authOptions from '@/app/lib/configs/auth/authOptions'
import { prisma } from '@/app/lib/prisma'
import { RISK_COLORS, type RiskLevel } from '@/app/lib/audit'
import { CheckCircle2, ClipboardList, MapPin, Plus, ShieldCheck, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const SITE_LABEL: Record<string, string> = { VILLAGE: 'หมู่บ้าน', WORKPLACE: 'สถานประกอบการ', SCHOOL: 'สถานศึกษา' }
const ROLE_LABEL: Record<string, string> = { SUPERADMIN: 'ผู้ดูแลระบบสูงสุด', ADMIN: 'ผู้ดูแลระบบ', MEMBER: 'สมาชิก' }

const fmtDate = (d?: Date | null) =>
  d ? new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

// การ์ดตัวเลขสรุป — ใช้โทนเดียวกับ stat box ที่หน้าภาพรวม
function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="bg-gray-200/60 rounded-xl px-4 py-3">
      <span className="block text-[13px] text-gray-500 truncate">{label}</span>
      <p className="mt-0.5 text-2xl font-bold text-gray-900 tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {hint && <span className="block text-xs text-gray-400 mt-0.5 truncate">{hint}</span>}
    </div>
  )
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      {children}
    </section>
  )
}

// แถบสัดส่วนแนวนอน — อ่านง่ายกว่ากราฟเต็มรูปแบบสำหรับข้อมูลชุดเล็ก
function BarList({ items }: { items: { name: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  if (items.length === 0) return <p className="px-5 py-6 text-sm text-gray-300">ยังไม่มีข้อมูล</p>
  return (
    <ul className="px-5 py-4 space-y-2.5">
      {items.map(({ name, value }) => (
        <li key={name} className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-40 shrink-0 truncate">{name}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 rounded-full" style={{ width: `${(value / max) * 100}%` }} />
          </div>
          <span className="text-sm text-gray-700 tabular-nums w-10 text-right">{value.toLocaleString()}</span>
        </li>
      ))}
    </ul>
  )
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  const meId = session.user.id
  const isSuperAdmin = session.user.role === 'SUPERADMIN'

  const [me, mine] = await Promise.all([
    prisma.user.findUnique({
      where: { id: meId },
      select: { firstName: true, lastName: true, email: true, role: true, createdAt: true, province: true, amphoe: true, zone: true },
    }),
    prisma.survey.findMany({
      where: { creatorId: meId },
      orderBy: { createdAt: 'desc' },
      include: { alcohol: { select: { auditScore: true, riskLevel: true } } },
    }),
  ])
  if (!me) redirect('/auth/signin')

  const eligible = mine.filter((s) => s.eligible)
  const verified = mine.filter((s) => s.verifiedAt)
  const pending = eligible.length - eligible.filter((s) => s.verifiedAt).length

  // นับเฉพาะ 30 วันล่าสุด เพื่อให้เห็นจังหวะการทำงานปัจจุบัน ไม่ใช่ยอดสะสมอย่างเดียว
  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)
  const last30 = mine.filter((s) => new Date(s.createdAt) >= since30).length

  const tallyBy = (keys: (string | null)[]) => {
    const m = new Map<string, number>()
    for (const k of keys) if (k) m.set(k, (m.get(k) ?? 0) + 1)
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }

  const bySite = tallyBy(mine.map((s) => SITE_LABEL[s.siteType]))
  const byArea = tallyBy(mine.map((s) => [s.tambon, s.amphoe, s.province].filter(Boolean).join(' · ') || null)).slice(0, 8)
  const byRisk = tallyBy(
    eligible.map((s) => (!s.alcohol || (s.alcohol.auditScore ?? 0) === 0 ? 'ไม่ดื่ม / คะแนน 0' : s.alcohol.riskLevel)),
  )

  const recent = mine.slice(0, 10)
  const areaCount = new Set(mine.map((s) => [s.province, s.amphoe, s.tambon].filter(Boolean).join('|')).filter(Boolean)).size

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">โปรไฟล์ของฉัน</h1>
        <p className="text-sm text-gray-400 mt-0.5">ข้อมูลบัญชี สิทธิ์การใช้งาน และงานเก็บแบบสอบถามที่คุณเป็นผู้บันทึก</p>
      </div>

      {/* การ์ดบัญชี */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-white">
              {me.firstName.charAt(0)}{me.lastName.charAt(0)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-gray-900 truncate">{me.firstName} {me.lastName}</p>
            <p className="text-sm text-gray-500 truncate">{me.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                <ShieldCheck className="w-3 h-3" /> {ROLE_LABEL[me.role] ?? me.role}
              </span>
              <span className="text-xs text-gray-400">เข้าร่วมเมื่อ {fmtDate(me.createdAt)}</span>
              {(me.province || me.amphoe) && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" /> {[me.amphoe, me.province].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          </div>
          <Link href="/dashboard/surveys/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shrink-0">
            <Plus className="w-4 h-4" /> เพิ่มแบบสอบถาม
          </Link>
        </div>

        {/* สิทธิ์การลบ — บอกให้ชัดว่าลบอะไรได้บ้าง */}
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 px-4 py-3">
          <Trash2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500">
            {isSuperAdmin
              ? 'สิทธิ์ผู้ดูแลระบบสูงสุด — ลบและแก้ไขแบบสอบถามได้ทุกใบในระบบ'
              : 'คุณลบได้เฉพาะแบบสอบถามที่คุณเป็นผู้บันทึกเท่านั้น ใบที่ผู้อื่นบันทึกจะไม่มีปุ่มลบ'}
          </p>
        </div>
      </div>

      {/* สรุปงานของฉัน */}
      <div className="bg-gray-100/70 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          <Stat label="แบบสอบถามที่บันทึก" value={mine.length} />
          <Stat label="เข้าเกณฑ์" value={eligible.length} hint={`ไม่เข้าเกณฑ์ ${(mine.length - eligible.length).toLocaleString()}`} />
          <Stat label="ตรวจสอบแล้ว" value={verified.length} hint={`รอตรวจสอบ ${pending.toLocaleString()}`} />
          <Stat label="30 วันล่าสุด" value={last30} />
          <Stat label="พื้นที่ที่ลงเก็บ" value={areaCount} hint="ตำบล/อำเภอ/จังหวัด" />
          <Stat label="บันทึกล่าสุด" value={mine[0] ? fmtDate(mine[0].createdAt) : '—'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="แยกตามประเภทสถานที่" desc="นับจากแบบสอบถามที่คุณบันทึกทั้งหมด">
          <BarList items={bySite} />
        </Card>
        <Card title="แยกตามระดับความเสี่ยง AUDIT" desc="นับเฉพาะผู้ที่เข้าเกณฑ์">
          <BarList items={byRisk} />
        </Card>
      </div>

      <Card title="พื้นที่ที่ลงเก็บบ่อยที่สุด" desc="สูงสุด 8 พื้นที่">
        <BarList items={byArea} />
      </Card>

      {/* รายการล่าสุด — กดเข้าไปตรวจสอบรายใบได้ */}
      <Card title="แบบสอบถามล่าสุดของฉัน" desc="กดที่แถวเพื่อเปิดดูรายละเอียดและตรวจสอบ">
        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ClipboardList className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="mt-3 text-sm text-gray-400">คุณยังไม่ได้บันทึกแบบสอบถาม</p>
            <Link href="/dashboard/surveys/new" className="mt-3 inline-block text-sm font-medium text-green-600 hover:text-green-700">
              เริ่มบันทึกแบบสอบถามแรก
            </Link>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-50">
              {recent.map((s) => {
                const risk = s.alcohol?.riskLevel as RiskLevel | null
                const name = [s.prefix, s.firstName, s.lastName].filter(Boolean).join(' ')
                return (
                  <li key={s.id}>
                    <Link href={`/dashboard/surveys/${s.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                      <span className="text-sm text-gray-500 w-24 shrink-0 tabular-nums">
                        {s.questionnaireNo || `#${s.id}`}
                      </span>
                      <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">
                        {s.eligible
                          ? name || '—'
                          : <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">ไม่เข้าเกณฑ์</span>}
                      </span>
                      <span className="hidden sm:block text-sm text-gray-400 w-48 truncate">
                        {[s.tambon, s.amphoe].filter(Boolean).join(' · ') || '—'}
                      </span>
                      {risk && s.eligible ? (
                        <span className={`hidden md:inline-block text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${RISK_COLORS[risk]}`}>{risk}</span>
                      ) : null}
                      {s.verifiedAt && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-label="ตรวจสอบแล้ว" />}
                      <span className="text-xs text-gray-400 w-24 text-right shrink-0">{fmtDate(s.createdAt)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            {mine.length > recent.length && (
              <div className="px-5 py-3 border-t border-gray-100">
                <Link href="/dashboard/surveys" className="text-sm font-medium text-green-600 hover:text-green-700">
                  ดูแบบสอบถามทั้งหมด ({mine.length.toLocaleString()} รายการ)
                </Link>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
