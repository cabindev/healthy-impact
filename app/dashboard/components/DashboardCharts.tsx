'use client'

import { Fragment } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/app/components/ui/chart'

export type Named = { name: string; value: number; color?: string }
export type Trend = { date: string; count: number }

// heatmap แบบ contribution-graph — โทนเขียวไล่เฉดตามจำนวนที่บันทึกต่อวัน
const HEAT_COLORS = ['#E3E3E1', '#BBF7D0', '#4ADE80', '#16A34A', '#15803D']
const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function heatLevel(count: number, max: number): number {
  if (count <= 0) return 0
  const r = count / max
  return r > 0.75 ? 4 : r > 0.5 ? 3 : r > 0.25 ? 2 : 1
}

// ป้ายวันในสัปดาห์ (แถว 0=อา. … 6=ส.) โชว์เฉพาะ จ./พ./ศ. แบบ GitHub
const DAY_LABEL = ['', 'จ.', '', 'พ.', '', 'ศ.', '']

export function TrendHeatmap({ data }: { data: Trend[] }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const cells = data.map((d) => {
    const dt = new Date(d.date + 'T00:00:00')
    return { ...d, dt }
  })
  // เติมช่องว่างต้นสัปดาห์แรกให้คอลัมน์เริ่มที่วันอาทิตย์
  const lead = cells[0]?.dt.getDay() ?? 0
  const padded: (typeof cells[number] | null)[] = [...Array(lead).fill(null), ...cells]
  const weeks: (typeof cells[number] | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))

  // ป้ายเดือน: โชว์เหนือสัปดาห์แรกของแต่ละเดือน
  const monthLabels = weeks.map((week, wi) => {
    const first = week.find((c) => c)
    if (!first) return ''
    const prev = wi > 0 ? weeks[wi - 1].find((c) => c) : null
    return prev && prev.dt.getMonth() === first.dt.getMonth() ? '' : TH_MONTH[first.dt.getMonth()]
  })

  // ช่องยืดเต็มความกว้างกล่อง (คอลัมน์ละ 1 สัปดาห์ ช่องสี่เหลี่ยมจัตุรัส) — เดิมล็อก 12px เหลือที่ว่างครึ่งกล่อง
  // จอแคบ (มือถือ) ช่องไม่เล็กกว่า 10px แล้วเลื่อนแนวนอนแทน
  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-1">
      <div className="grid min-w-max gap-[3px] sm:min-w-0" style={{ gridTemplateColumns: `1.75rem repeat(${weeks.length}, minmax(10px, 1fr))` }}>
        {/* แถวป้ายเดือน — ล้นไปทางขวาได้ เพราะคอลัมน์ถัดไปมักว่าง */}
        <div />
        {monthLabels.map((m, wi) => (
          <div key={`m${wi}`} className="h-4 overflow-visible whitespace-nowrap text-[10px] leading-4 text-gray-400">{m}</div>
        ))}
        {/* ป้ายวัน + ตารางสัปดาห์ — วางทีละแถว (วัน) ข้ามทุกสัปดาห์ */}
        {DAY_LABEL.map((d, di) => (
          <Fragment key={`d${di}`}>
            <div className="self-center pr-1 text-right text-[10px] text-gray-400">{d}</div>
            {weeks.map((week, wi) => {
              const cell = week[di]
              if (!cell) return <div key={wi} className="aspect-square" />
              const lv = heatLevel(cell.count, max)
              return (
                <div
                  key={wi}
                  title={`${cell.dt.getDate()} ${TH_MONTH[cell.dt.getMonth()]} · ${cell.count} แบบสอบถาม`}
                  className="aspect-square rounded-[3px] ring-1 ring-black/[0.04]"
                  style={{ background: HEAT_COLORS[lv] }}
                />
              )
            })}
          </Fragment>
        ))}
      </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-gray-400">
        <span className="mr-1">น้อย</span>
        {HEAT_COLORS.map((c) => <span key={c} className="size-3 rounded-[3px] ring-1 ring-black/[0.04]" style={{ background: c }} />)}
        <span className="ml-1">มาก</span>
      </div>
    </div>
  )
}

export function BarVertical({ data, distributed, color, height = 210 }: { data: Named[]; distributed?: boolean; color?: string; height?: number }) {
  return (
    <>
      <ChartContainer config={{ value: { label: 'คน', color: color ?? 'var(--chart-1)' } }} className="aspect-auto w-full" style={{ height }}>
        <BarChart data={data} margin={{ top: 22, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
          <YAxis hide allowDecimals={false} />
          <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={distributed ? undefined : 'var(--color-value)'}>
            {distributed && data.map((d) => <Cell key={d.name} fill={d.color} />)}
            <LabelList dataKey="value" position="top" offset={6} fontSize={11} className="fill-gray-600" formatter={(v: number) => (v > 0 ? v.toLocaleString() : '')} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </>
  )
}

export function BarHorizontal({ data, distributed, color, height = 210 }: { data: Named[]; distributed?: boolean; color?: string; height?: number }) {
  return (
    <>
      <ChartContainer config={{ value: { label: 'คน', color: color ?? 'var(--chart-4)' } }} className="aspect-auto w-full" style={{ height }}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={92} fontSize={11} />
          <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={22} fill={distributed ? undefined : 'var(--color-value)'}>
            {distributed && data.map((d) => <Cell key={d.name} fill={d.color} />)}
            <LabelList dataKey="value" position="right" offset={6} fontSize={11} className="fill-gray-600" formatter={(v: number) => (v > 0 ? v.toLocaleString() : '')} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </>
  )
}

// BMI เวอร์ชันมินิ — ไม่มีการ์ดขาว ใช้วางในแผงเทาคู่กับ heatmap
