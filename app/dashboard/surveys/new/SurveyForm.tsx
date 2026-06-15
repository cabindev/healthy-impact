'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createSurvey, updateSurvey, createIneligible, type SurveyPayload } from '@/app/actions/survey'
import { evaluateAudit, RISK_COLORS, RISK_ADVICE } from '@/app/lib/audit'
import * as O from '@/app/lib/survey-options'
import { calcBMI, bmiCategory, thaiAge, MIN_AGE } from '@/app/lib/health'
import TambonPicker from './TambonPicker'
import BirthDateInput from './BirthDateInput'
import ConsentModal from './ConsentModal'
import { Loader2 } from 'lucide-react'
import AuditExplainModal from '@/app/components/AuditExplainModal'
import BmiTip from '@/app/components/BmiTip'

// ───────── field helpers ─────────

function Section({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
        <span className="w-7 h-7 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">{no}</span>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </section>
  )
}

function Field({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 bg-white'

function Text({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
}

function Radio({ options, value, onChange, cols = 1 }: { options: O.Opt[]; value: string; onChange: (v: string) => void; cols?: number }) {
  return (
    <div className={`grid gap-2 ${cols === 2 ? 'sm:grid-cols-2' : ''}`}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button key={o.value} type="button" onClick={() => onChange(active ? '' : o.value)}
            className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
              active ? 'border-green-500 bg-green-50 text-gray-900 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Checks({ options, value, onChange, cols = 1 }: { options: O.Opt[]; value: string[]; onChange: (v: string[]) => void; cols?: number }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  return (
    <div className={`grid gap-2 ${cols === 2 ? 'sm:grid-cols-2' : ''}`}>
      {options.map((o) => {
        const active = value.includes(o.value)
        return (
          <button key={o.value} type="button" onClick={() => toggle(o.value)}
            className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors flex items-center gap-2 ${
              active ? 'border-green-500 bg-green-50 text-gray-900 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${active ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300'}`}>{active ? '✓' : ''}</span>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ───────── main form ─────────

const RESIDENCE: O.Opt[] = [
  { value: '1', label: 'น้อยกว่า 6 เดือน (จบการสัมภาษณ์)' },
  { value: '2', label: 'มากกว่า 6 เดือน' },
]
const YESNO: O.Opt[] = [
  { value: '1', label: 'ใช่' },
  { value: '2', label: 'ไม่ใช่' },
]

// 1.17 "ไม่มี" exclusive กับโรคอื่น: เลือกไม่มี → เหลือไม่มีอย่างเดียว / เลือกโรค → เอาไม่มีออก
function exclusiveNone(prev: string[], next: string[]): string[] {
  const addedNone = next.includes('ไม่มี') && !prev.includes('ไม่มี')
  if (addedNone) return ['ไม่มี']
  if (next.includes('ไม่มี') && next.length > 1) return next.filter((x) => x !== 'ไม่มี')
  return next
}

export default function SurveyForm({
  initial,
  initialEver = {},
  initialCur = {},
  initialCurAmt = {},
  surveyId,
}: {
  initial?: SurveyPayload
  initialEver?: Record<string, boolean>
  initialCur?: Record<string, boolean>
  initialCurAmt?: Record<string, string>
  surveyId?: number
} = {}) {
  const router = useRouter()
  const isEdit = typeof surveyId === 'number'
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdpaDone, setPdpaDone] = useState(isEdit) // แก้ไข = ยินยอมไปแล้ว ไม่ต้องถามซ้ำ

  const [f, setF] = useState<SurveyPayload>(initial ?? { siteType: 'VILLAGE', rights: [], diseases: [] })
  const [ever, setEver] = useState<Record<string, boolean>>(initialEver)
  const [cur, setCur] = useState<Record<string, boolean>>(initialCur)
  const [curAmt, setCurAmt] = useState<Record<string, string>>(initialCurAmt)

  const set = <K extends keyof SurveyPayload>(k: K, v: SurveyPayload[K]) => setF((p) => ({ ...p, [k]: v }))

  // live AUDIT score
  const audit = useMemo(() => {
    const nz = (v?: string) => (v ? Number(v) : null)
    return evaluateAudit({
      q1Frequency: nz(f.q1Frequency),
      beerDrink: f.beerDrink, beerAmt: nz(f.beerAmt),
      liquorDrink: f.liquorDrink, liquorAmt: nz(f.liquorAmt),
      wineDrink: f.wineDrink, wineAmt: nz(f.wineAmt),
      q3Binge: nz(f.q3Binge), q4CannotStop: nz(f.q4CannotStop), q5FailNormal: nz(f.q5FailNormal),
      q6Morning: nz(f.q6Morning), q7Guilt: nz(f.q7Guilt), q8Blackout: nz(f.q8Blackout),
      q9Injury: nz(f.q9Injury), q10Advised: nz(f.q10Advised),
    })
  }, [f])

  const isSmoker = f.smokeStatus && f.smokeStatus !== '6'
  const isCurrentSmoker = f.smokeStatus === '1' || f.smokeStatus === '2'
  const neverDrink = f.q1Frequency === '0'

  const age = thaiAge(f.birthDate)
  const bmi = calcBMI(Number(f.weightKg) || null, Number(f.heightCm) || null)

  // คัดกรอง "ไม่เข้าเกณฑ์" → จบการสัมภาษณ์ (เฉพาะตอนเพิ่มใหม่)
  const ineligibleReason =
    f.residence6Months === '1' ? 'พักอาศัยน้อยกว่า 6 เดือน (ข้อ 1.6)'
    : age != null && age < MIN_AGE ? `อายุประมาณ ${age} ปี ต่ำกว่า ${MIN_AGE} ปี (ข้อ 1.11)`
    : f.consentGiven === '2' ? 'ไม่ยินยอมเข้าร่วม (ข้อ 1.7)'
    : null
  const ineligible = !isEdit && ineligibleReason != null

  const isRedirect = (e: unknown) =>
    e != null && typeof e === 'object' && 'digest' in e && String((e as { digest?: string }).digest).startsWith('NEXT_REDIRECT')

  const submitIneligible = async () => {
    setError(null)
    if (!f.collectorName) { setError('กรุณากรอกชื่อผู้เก็บข้อมูล'); return }
    setSaving(true)
    try {
      await createIneligible({
        siteType: f.siteType,
        villageNo: f.villageNo, villageName: f.villageName,
        province: f.province, amphoe: f.amphoe, tambon: f.tambon,
        collectorName: f.collectorName, collectorPhone: f.collectorPhone,
        reason: ineligibleReason!,
      })
    } catch (e) {
      if (isRedirect(e)) return
      setError('บันทึกไม่สำเร็จ โปรดลองอีกครั้ง')
      setSaving(false)
    }
  }

  const submit = async () => {
    setError(null)
    // gating คัดออกตามเกณฑ์กลุ่มเป้าหมาย
    if (f.residence6Months === '1') { setError('ผู้ตอบพักอาศัย < 6 เดือน — ไม่อยู่ในกลุ่มเป้าหมาย จบการสัมภาษณ์ (ข้อ 1.6)'); return }
    if (age != null && age < MIN_AGE) { setError(`อายุประมาณ ${age} ปี — ต่ำกว่า ${MIN_AGE} ปี ไม่อยู่ในกลุ่มเป้าหมาย (ข้อ 1.11)`); return }
    if (!f.collectorName) { setError('กรุณากรอกชื่อผู้เก็บข้อมูล'); return }
    if (f.consentGiven !== '1') { setError('ต้องได้รับการยินยอม (ข้อ 1.7) จึงจะบันทึกได้'); return }
    if (f.nationalId && !/^\d{13}$/.test(f.nationalId.trim())) { setError('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก (ข้อ 1.8)'); return }
    // ข้อ 2.4 ระบุจำนวน ห้ามเว้นว่าง
    if (isCurrentSmoker) {
      const missing = O.TOBACCO_TYPES.find((t) => cur[t.key] && !(curAmt[t.key] && curAmt[t.key].trim() !== ''))
      if (missing) { setError(`ข้อ 2.4 กรุณาระบุจำนวนที่สูบของ “${missing.label}” (ห้ามเว้นว่าง)`); return }
    }
    // ข้อ 3.2 เลือกดื่ม → ต้องระบุปริมาณ
    if (!neverDrink) {
      if (f.beerDrink && !f.beerAmt) { setError('ข้อ 3.2 เลือกดื่มเบียร์ — กรุณาระบุปริมาณการดื่ม'); return }
      if (f.liquorDrink && !f.liquorAmt) { setError('ข้อ 3.2 เลือกดื่มเหล้า — กรุณาระบุปริมาณการดื่ม'); return }
      if (f.wineDrink && !f.wineAmt) { setError('ข้อ 3.2 เลือกดื่มไวน์ — กรุณาระบุปริมาณการดื่ม'); return }
    }
    setSaving(true)
    try {
      if (isEdit) await updateSurvey(surveyId!, { ...f, ever, cur, curAmt })
      else await createSurvey({ ...f, ever, cur, curAmt })
    } catch (e) {
      // redirect() throws NEXT_REDIRECT — ปล่อยผ่าน
      if (e && typeof e === 'object' && 'digest' in e && String((e as { digest?: string }).digest).startsWith('NEXT_REDIRECT')) return
      setError('บันทึกไม่สำเร็จ โปรดลองอีกครั้ง')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-24">
      {!pdpaDone && (
        <ConsentModal
          onConfirm={() => { set('consentGiven', '1'); setPdpaDone(true) }}
          onDecline={() => { set('consentGiven', '2'); setPdpaDone(true) }}
        />
      )}

      {/* meta */}
      <Section no="◆" title="ข้อมูลการเก็บแบบสอบถาม">
        <Field label="ประเภทสถานที่เก็บข้อมูล" required>
          <Radio options={O.SITE_TYPES} value={f.siteType} onChange={(v) => set('siteType', (v || 'VILLAGE') as SurveyPayload['siteType'])} cols={2} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="ชื่อผู้เก็บข้อมูล" required><Text value={f.collectorName ?? ''} onChange={(v) => set('collectorName', v)} /></Field>
          <Field label="เบอร์โทรผู้เก็บข้อมูล"><Text value={f.collectorPhone ?? ''} onChange={(v) => set('collectorPhone', v)} /></Field>
        </div>
        <p className="text-xs text-gray-400">การตรวจสอบข้อมูลทำผ่านปุ่ม “ยืนยันการตรวจสอบ” ที่หน้าแบบสอบถามรายตัวหลังบันทึก</p>
      </Section>

      {/* ส่วนที่ 1 */}
      <Section no="1" title="ข้อมูลทั่วไป">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="1.1 หมู่ที่"><Text value={f.villageNo ?? ''} onChange={(v) => set('villageNo', v)} /></Field>
          <Field label="1.2 ชื่อหมู่บ้าน"><Text value={f.villageName ?? ''} onChange={(v) => set('villageName', v)} /></Field>
        </div>
        <Field label="1.3–1.5 ตำบล / อำเภอ / จังหวัด" hint="(เลือกตำบล แล้วอำเภอ-จังหวัดเติมอัตโนมัติ)">
          <TambonPicker
            value={{ tambon: f.tambon, amphoe: f.amphoe, province: f.province }}
            onChange={(g) => setF((p) => ({ ...p, tambon: g.tambon, amphoe: g.amphoe, province: g.province }))}
          />
        </Field>
        {/* ── คัดกรองกลุ่มเป้าหมาย (always visible) ── */}
        <Field label="1.6 พักอาศัยในหมู่บ้านมานานเท่าไหร่">
          <Radio options={RESIDENCE} value={f.residence6Months ?? ''} onChange={(v) => set('residence6Months', v)} cols={2} />
        </Field>
        <Field label="1.11 วัน/เดือน/ปีเกิด (พ.ศ.)" hint={age != null ? `(อายุ ~${age} ปี)` : undefined}>
          <BirthDateInput value={f.birthDate} onChange={(v) => set('birthDate', v)} />
        </Field>
        <Field label="1.7 ลงนามในใบยินยอมด้วยความสมัครใจ" required>
          <Radio options={YESNO} value={f.consentGiven ?? ''} onChange={(v) => set('consentGiven', v)} cols={2} />
        </Field>

        {ineligible && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-600">ไม่เข้าเกณฑ์ — จบการสัมภาษณ์</p>
            <p className="text-sm text-red-500 mt-0.5">เหตุผล: {ineligibleReason}</p>
            <p className="text-xs text-red-400 mt-2">ระบบจะไม่เก็บข้อมูลส่วนตัว/สุขภาพ — บันทึกเฉพาะพื้นที่ ผู้เก็บ และเหตุผล เพื่อใช้นับสัดส่วนผู้ไม่เข้าเกณฑ์</p>
          </div>
        )}

        {!ineligible && (
        <>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="1.8 เลขบัตรประชาชน" hint="(ไม่บังคับ)"><Text value={f.nationalId ?? ''} onChange={(v) => set('nationalId', v)} /></Field>
          <Field label="1.9 คำนำหน้า"><Text value={f.prefix ?? ''} onChange={(v) => set('prefix', v)} /></Field>
          <Field label="ชื่อ"><Text value={f.firstName ?? ''} onChange={(v) => set('firstName', v)} /></Field>
          <Field label="นามสกุล"><Text value={f.lastName ?? ''} onChange={(v) => set('lastName', v)} /></Field>
          <Field label="เบอร์โทรศัพท์"><Text value={f.phone ?? ''} onChange={(v) => set('phone', v)} /></Field>
        </div>
        <Field label="1.10 เพศ">
          <Radio options={O.GENDERS} value={f.gender ?? ''} onChange={(v) => set('gender', v)} cols={2} />
          {f.gender === 'อื่นๆ' && <div className="mt-2"><Text value={f.genderOther ?? ''} onChange={(v) => set('genderOther', v)} placeholder="ระบุ" /></div>}
        </Field>
        <Field label="1.12 ศาสนา">
          <Radio options={O.RELIGIONS} value={f.religion ?? ''} onChange={(v) => set('religion', v)} cols={2} />
          {f.religion === 'อื่นๆ' && <div className="mt-2"><Text value={f.religionOther ?? ''} onChange={(v) => set('religionOther', v)} placeholder="ระบุ" /></div>}
        </Field>
        <Field label="1.13 บัตร/สิทธิที่มี" hint="(ตอบได้มากกว่า 1)">
          <Checks options={O.RIGHTS} value={f.rights ?? []} onChange={(v) => set('rights', v)} cols={2} />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="1.14 น้ำหนัก (กก.)"><Text type="number" value={f.weightKg ?? ''} onChange={(v) => set('weightKg', v)} /></Field>
          <Field label="1.15 ส่วนสูง (ซม.)"><Text type="number" value={f.heightCm ?? ''} onChange={(v) => set('heightCm', v)} /></Field>
          <Field label="1.16 เส้นรอบเอว (ซม.)"><Text type="number" value={f.waistCm ?? ''} onChange={(v) => set('waistCm', v)} /></Field>
        </div>
        {bmi != null && (
          <p className="text-xs text-gray-500 inline-flex items-center gap-1">BMI = <span className="font-semibold text-gray-700">{bmi}</span> kg/m² ({bmiCategory(bmi)}) <BmiTip /></p>
        )}
        <Field label="1.17 โรคที่ได้รับการวินิจฉัย" hint="(ตอบได้มากกว่า 1)">
          <Checks options={O.DISEASES} value={f.diseases ?? []} onChange={(v) => set('diseases', exclusiveNone(f.diseases ?? [], v))} cols={2} />
          {f.diseases?.includes('อื่นๆ') && <div className="mt-2"><Text value={f.diseaseOther ?? ''} onChange={(v) => set('diseaseOther', v)} placeholder="ระบุ" /></div>}
        </Field>
        <Field label="1.18 สถานภาพการศึกษาปัจจุบัน">
          <Radio options={O.EDU_STATUS} value={f.eduStatus ?? ''} onChange={(v) => set('eduStatus', v)} />
        </Field>
        <Field label="1.19 ระดับการศึกษาล่าสุด">
          <Radio options={O.EDU_LEVELS} value={f.eduLevel ?? ''} onChange={(v) => set('eduLevel', v)} cols={2} />
        </Field>
        </>
        )}
      </Section>

      {!ineligible && (
      <>

      {/* ส่วนที่ 2 */}
      <Section no="2" title="การสูบบุหรี่">
        <Field label="2.1 ในรอบ 30 วัน มีการสูบบุหรี่ในที่พักอาศัยบ่อยเพียงใด">
          <Radio options={O.HOME_SMOKING} value={f.homeSmoking ?? ''} onChange={(v) => set('homeSmoking', v)} cols={2} />
        </Field>
        <Field label="2.2 ตลอดช่วงชีวิต ท่านเคยสูบบุหรี่หรือไม่">
          <Radio options={O.SMOKE_STATUS} value={f.smokeStatus ?? ''} onChange={(v) => set('smokeStatus', v)} />
        </Field>

        {isSmoker && (
          <Field label="2.3 ตลอดช่วงชีวิต เคยสูบบุหรี่ประเภทใดบ้าง">
            <div className="space-y-2">
              {O.TOBACCO_TYPES.map((t) => (
                <label key={t.key} className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <span className="text-gray-600">{t.label}</span>
                  <button type="button" onClick={() => setEver((p) => ({ ...p, [t.key]: !p[t.key] }))}
                    className={`px-3 py-1 rounded-md text-xs font-medium ${ever[t.key] ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {ever[t.key] ? 'เคยสูบ' : 'ไม่เคย'}
                  </button>
                </label>
              ))}
            </div>
          </Field>
        )}

        {isCurrentSmoker && (
          <Field label="2.4 ปัจจุบันสูบบุหรี่ประเภทใดบ้าง + จำนวนต่อวัน">
            <div className="space-y-2">
              {O.TOBACCO_TYPES.map((t) => (
                <div key={t.key} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <span className="flex-1 text-gray-600">{t.label}</span>
                  <button type="button" onClick={() => setCur((p) => ({ ...p, [t.key]: !p[t.key] }))}
                    className={`px-3 py-1 rounded-md text-xs font-medium shrink-0 ${cur[t.key] ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {cur[t.key] ? 'สูบ' : 'ไม่สูบ'}
                  </button>
                  {cur[t.key] && (
                    <input type="number" value={curAmt[t.key] ?? ''} onChange={(e) => setCurAmt((p) => ({ ...p, [t.key]: e.target.value }))}
                      placeholder={t.unit} className="w-28 px-2 py-1 border border-gray-200 rounded-md text-xs shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </Field>
        )}

        {isCurrentSmoker && (
          <>
            <Field label="2.5 สูบบุหรี่มวนแรกของวันเมื่อใดหลังตื่นนอน">
              <Radio options={O.FIRST_CIG_TIME} value={f.firstCigTime ?? ''} onChange={(v) => set('firstCigTime', v)} cols={2} />
            </Field>
            <Field label="2.6 เคยพยายามเลิกสูบบุหรี่หรือไม่">
              <Radio options={O.QUIT_ATTEMPT} value={f.quitAttempt ?? ''} onChange={(v) => set('quitAttempt', v)} cols={2} />
            </Field>
          </>
        )}
      </Section>

      {/* ส่วนที่ 3 */}
      <Section no="3" title="การดื่มเครื่องดื่มแอลกอฮอล์ (AUDIT)">
        <div className="rounded-lg bg-blue-50/60 border border-blue-100 px-4 py-3 text-xs text-gray-600 leading-relaxed">
          <p>{O.ALCOHOL_DEF}</p>
          <p className="mt-1.5 text-gray-500">{O.ALCOHOL_EXAMPLES}</p>
        </div>
        <Field label="3.1 ในรอบ 3 เดือน ดื่มเครื่องดื่มแอลกอฮอล์บ่อยเพียงใด">
          <Radio options={O.AUDIT_Q1} value={f.q1Frequency ?? ''}
            onChange={(v) => {
              if (v === '0') {
                // ไม่เคยดื่ม → ล้างคำตอบ 3.2–3.10 (คะแนน 0) แล้วข้ามไปส่วน 4
                setF((p) => ({
                  ...p, q1Frequency: v,
                  beerDrink: false, beerAmt: undefined, liquorDrink: false, liquorAmt: undefined, wineDrink: false, wineAmt: undefined,
                  q3Binge: undefined, q4CannotStop: undefined, q5FailNormal: undefined, q6Morning: undefined,
                  q7Guilt: undefined, q8Blackout: undefined, q9Injury: undefined, q10Advised: undefined,
                }))
              } else set('q1Frequency', v)
            }} cols={2} />
        </Field>

        {neverDrink ? (
          <p className="text-sm text-gray-400 px-1">ไม่เคยดื่ม — ข้ามข้อ 3.2–3.10 (คะแนน AUDIT = 0) ไปตอบส่วนที่ 4</p>
        ) : (
        <>
        <Field label="3.2 ชนิดที่ดื่ม และปริมาณต่อวัน">
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-3">
              <button type="button" onClick={() => set('beerDrink', !f.beerDrink)}
                className={`px-3 py-1 rounded-md text-xs font-medium mb-2 ${f.beerDrink ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                เบียร์ {f.beerDrink ? '— ระบุปริมาณ' : '(ไม่ดื่ม)'}
              </button>
              {f.beerDrink && <Radio options={O.BEER_AMT} value={f.beerAmt ?? ''} onChange={(v) => set('beerAmt', v)} />}
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <button type="button" onClick={() => set('liquorDrink', !f.liquorDrink)}
                className={`px-3 py-1 rounded-md text-xs font-medium mb-2 ${f.liquorDrink ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                เหล้า {f.liquorDrink ? '— ระบุปริมาณ' : '(ไม่ดื่ม)'}
              </button>
              {f.liquorDrink && <Radio options={O.LIQUOR_AMT} value={f.liquorAmt ?? ''} onChange={(v) => set('liquorAmt', v)} />}
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <button type="button" onClick={() => set('wineDrink', !f.wineDrink)}
                className={`px-3 py-1 rounded-md text-xs font-medium mb-2 ${f.wineDrink ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                ไวน์ {f.wineDrink ? '— ระบุปริมาณ' : '(ไม่ดื่ม)'}
              </button>
              {f.wineDrink && <Radio options={O.WINE_AMT} value={f.wineAmt ?? ''} onChange={(v) => set('wineAmt', v)} />}
            </div>
          </div>
        </Field>

        <Field label="3.3 ดื่มหนักในคราวเดียว (ตามเกณฑ์เพศ) บ่อยเพียงใด">
          <div className="mb-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700 space-y-0.5">
            {f.gender === 'ชาย' && <p>{O.BINGE_MALE}</p>}
            {f.gender === 'หญิง' && <p>{O.BINGE_FEMALE}</p>}
            {f.gender !== 'ชาย' && f.gender !== 'หญิง' && (<><p>{O.BINGE_MALE}</p><p>{O.BINGE_FEMALE}</p></>)}
          </div>
          <Radio options={O.AUDIT_FREQ} value={f.q3Binge ?? ''} onChange={(v) => set('q3Binge', v)} cols={2} />
        </Field>
        <Field label="3.4 ไม่สามารถหยุดดื่มได้เมื่อเริ่มดื่มแล้ว"><Radio options={O.AUDIT_FREQ} value={f.q4CannotStop ?? ''} onChange={(v) => set('q4CannotStop', v)} cols={2} /></Field>
        <Field label="3.5 ทำสิ่งที่ควรทำตามปกติไม่ได้เพราะการดื่ม"><Radio options={O.AUDIT_FREQ} value={f.q5FailNormal ?? ''} onChange={(v) => set('q5FailNormal', v)} cols={2} /></Field>
        <Field label="3.6 ต้องรีบดื่มในตอนเช้าเพื่อถอนอาการ"><Radio options={O.AUDIT_FREQ} value={f.q6Morning ?? ''} onChange={(v) => set('q6Morning', v)} cols={2} /></Field>
        <Field label="3.7 รู้สึกผิด/เสียใจจากสิ่งที่ทำขณะดื่ม"><Radio options={O.AUDIT_FREQ} value={f.q7Guilt ?? ''} onChange={(v) => set('q7Guilt', v)} cols={2} /></Field>
        <Field label="3.8 จำเหตุการณ์คืนที่ดื่มไม่ได้"><Radio options={O.AUDIT_FREQ} value={f.q8Blackout ?? ''} onChange={(v) => set('q8Blackout', v)} cols={2} /></Field>
        <Field label="3.9 ท่านหรือผู้อื่นเคยบาดเจ็บจากการดื่มของท่าน"><Radio options={O.AUDIT_EVER} value={f.q9Injury ?? ''} onChange={(v) => set('q9Injury', v)} /></Field>
        <Field label="3.10 เคยได้รับคำแนะนำให้ลด/เลิกดื่ม"><Radio options={O.AUDIT_EVER} value={f.q10Advised ?? ''} onChange={(v) => set('q10Advised', v)} /></Field>
        </>
        )}

        <div className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">คะแนน AUDIT รวม</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold text-gray-800">{audit.score}<span className="text-sm text-gray-400">/40</span></span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${RISK_COLORS[audit.risk]}`}>{audit.risk}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-gray-400">แนะนำ: {RISK_ADVICE[audit.risk]}</p>
            <AuditExplainModal />
          </div>
        </div>
      </Section>

      {/* ส่วนที่ 4 */}
      <Section no="4" title="การบาดเจ็บจากอุบัติเหตุจราจรที่เกิดจากการดื่ม">
        <Field label="4.1 ในรอบ 12 เดือน ดื่มแล้วขับรถยนต์/จักรยานยนต์หรือไม่">
          <Radio options={O.DD_DROVE} value={f.ddDroveAfterDrink ?? ''} onChange={(v) => set('ddDroveAfterDrink', v)} />
        </Field>
        <Field label="4.2 ในรอบ 12 เดือน เคยบาดเจ็บจากอุบัติเหตุจราจรที่เกิดจากการดื่มหรือไม่">
          <Radio options={O.DD_INJURED} value={f.ddInjured ?? ''} onChange={(v) => set('ddInjured', v)} />
        </Field>
      </Section>
      </>
      )}

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-4 sticky bottom-0 bg-gray-50/80 backdrop-blur py-3">
        {(() => {
          const label = ineligible ? 'บันทึกเป็นผู้ไม่เข้าเกณฑ์' : isEdit ? 'บันทึกการแก้ไข' : 'บันทึกแบบสอบถาม'
          const ring = ineligible ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'
          return (
            <button type="button" onClick={ineligible ? submitIneligible : submit} disabled={saving}
              aria-label={label} title={label}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-colors ${ring} ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'บันทึก'}
            </button>
          )
        })()}
        <button type="button" onClick={() => router.push(isEdit ? `/dashboard/surveys/${surveyId}` : '/dashboard/surveys')} className="ml-auto px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">
          ยกเลิก
        </button>
      </div>
    </div>
  )
}
