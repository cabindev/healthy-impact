import type { ReactNode } from 'react'

// ชิ้นส่วนหน้าภาพรวมที่ไม่ต้องใช้ Recharts — render ฝั่ง server ได้เลย

export const pct = (n: number, d: number) => (d ? (n / d) * 100 : 0)
const fmtPct = (v: number) => `${v.toFixed(v >= 10 || v === 0 ? 0 : 1)}%`

export function SectionHeading({ no, title, sub }: { no: string; title: string; sub?: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-green-600 text-xs font-semibold text-white">{no}</span>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export function Panel({ title, sub, action, children, className = '' }: { title: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-gray-100 bg-white p-5 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

// การ์ดอัตรา: ตัวเลขหลักเป็น % (ตัวชี้วัด สสส. คือความชุก ไม่ใช่จำนวนคน) + จำนวนจริง + เทียบภาพรวม
// ทุกตัวชี้วัดในหน้านี้ "สูง = แย่" จึงให้ขึ้นเป็นแดง ลงเป็นเขียว
export function RateCard({ label, n, base, baseLabel, compare, compareLabel }: {
  label: string
  n: number
  base: number
  baseLabel: string
  /** อัตราอ้างอิง (%) เช่น ภาพรวมประเทศ — ไม่ส่งมาเมื่อดูทั้งประเทศอยู่แล้ว */
  compare?: number
  compareLabel?: string
}) {
  const rate = pct(n, base)
  const diff = compare == null ? null : rate - compare
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
      <p className="text-[13px] text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-gray-900">{base ? fmtPct(rate) : '—'}</p>
      <p className="mt-1 text-xs tabular-nums text-gray-500">
        {n.toLocaleString()} จาก {base.toLocaleString()} {baseLabel}
      </p>
      {diff != null && base > 0 && (
        <p className={`mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${
          Math.abs(diff) < 0.5 ? 'bg-gray-100 text-gray-500' : diff > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
        }`}>
          {Math.abs(diff) < 0.5 ? '≈ เท่ากับ' : diff > 0 ? `▲ ${Math.abs(diff).toFixed(1)} จุด สูงกว่า` : `▼ ${Math.abs(diff).toFixed(1)} จุด ต่ำกว่า`}{compareLabel} ({fmtPct(compare!)})
        </p>
      )}
    </div>
  )
}

export type Share = { name: string; value: number; color: string; hint?: string }

// แถบสัดส่วน 100% + รายการตัวเลข — อ่านง่ายกว่าโดนัทเมื่อมีหลายกลุ่มหรือบางกลุ่มเล็กมาก
export function ShareBar({ items, unit = 'คน', compact = false }: { items: Share[]; unit?: string; compact?: boolean }) {
  const total = items.reduce((s, d) => s + d.value, 0)
  if (!total) return <p className="py-6 text-center text-sm text-gray-400">ยังไม่มีข้อมูล</p>
  return (
    <div>
      <div className={`flex overflow-hidden rounded-full bg-gray-100 ${compact ? 'h-2.5' : 'h-4'}`} role="img"
        aria-label={items.map((d) => `${d.name} ${d.value} ${unit}`).join(', ')}>
        {items.map((d) => d.value > 0 && (
          <span key={d.name} title={`${d.name} ${d.value.toLocaleString()} ${unit}`}
            className="border-r-2 border-white last:border-r-0" style={{ width: `${pct(d.value, total)}%`, backgroundColor: d.color }} />
        ))}
      </div>
      <ul className={compact ? 'mt-3 space-y-1.5' : 'mt-4 space-y-2'}>
        {items.map((d) => (
          <li key={d.name} className="flex items-center gap-2.5 text-sm">
            <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="flex-1 text-gray-600">{d.name}{d.hint && <span className="ml-1.5 text-xs text-gray-400">{d.hint}</span>}</span>
            <span className="font-semibold tabular-nums text-gray-800">{d.value.toLocaleString()}</span>
            <span className="w-12 text-right text-xs tabular-nums text-gray-400">{fmtPct(pct(d.value, total))}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
