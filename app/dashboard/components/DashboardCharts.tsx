'use client'

import { Bar, BarChart, CartesianGrid, Cell, Label, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig,
} from '@/app/components/ui/chart'

export type Named = { name: string; value: number; color?: string }
export type Trend = { date: string; count: number }

export interface ChartsData {
  risk: Named[]
  smoke: Named[]
  site: Named[]
  age: Named[]
  province: Named[]
  trend: Trend[]
  gender: Named[]
  bmi: Named[]
}

const toConfig = (arr: Named[]): ChartConfig =>
  Object.fromEntries(arr.map((d) => [d.name, { label: d.name, color: d.color }]))

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

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-[3px]">
        {/* แถวป้ายเดือน */}
        <div className="flex gap-[3px]">
          <div className="w-7 shrink-0" />
          {monthLabels.map((m, wi) => (
            <div key={wi} className="w-3 shrink-0 text-[10px] leading-none text-gray-400 whitespace-nowrap">{m}</div>
          ))}
        </div>
        {/* ป้ายวัน + ตารางสัปดาห์ */}
        <div className="flex gap-[3px]">
          <div className="w-7 shrink-0 flex flex-col gap-[3px]">
            {DAY_LABEL.map((d, di) => (
              <div key={di} className="h-3 text-[9px] leading-3 text-gray-400 text-right pr-1">{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px] shrink-0">
              {Array.from({ length: 7 }).map((_, di) => {
                const cell = week[di]
                if (!cell) return <div key={di} className="w-3 h-3" />
                const lv = heatLevel(cell.count, max)
                const label = `${cell.dt.getDate()} ${TH_MONTH[cell.dt.getMonth()]} · ${cell.count} แบบสอบถาม`
                return (
                  <div
                    key={di}
                    title={label}
                    className="w-3 h-3 rounded-[3px] ring-1 ring-black/[0.04]"
                    style={{ background: HEAT_COLORS[lv] }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function Donut({ data, sub, title }: { data: Named[]; title: string; sub?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <Card title={title} sub={sub}>
      <ChartContainer config={toConfig(data)} className="mx-auto aspect-square h-[250px]">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} strokeWidth={3} paddingAngle={2}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            <LabelList dataKey="value" stroke="none" fontSize={12} className="fill-white font-semibold" formatter={(v: number) => (v > 0 ? v : '')} />
            <Label content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">{total}</tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">คน</tspan>
                  </text>
                )
              }
            }} />
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-mt-1 flex-wrap gap-x-3 [&>*]:basis-auto" />
        </PieChart>
      </ChartContainer>
    </Card>
  )
}

function BarVertical({ data, title, sub, distributed, color }: { data: Named[]; title: string; sub?: string; distributed?: boolean; color?: string }) {
  return (
    <Card title={title} sub={sub}>
      <ChartContainer config={{ value: { label: 'คน', color: color ?? 'var(--chart-1)' } }} className="aspect-auto h-[210px] w-full">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} fontSize={11} />
          <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={distributed ? undefined : 'var(--color-value)'}>
            {distributed && data.map((d) => <Cell key={d.name} fill={d.color} />)}
            <LabelList dataKey="value" position="top" offset={6} fontSize={11} className="fill-gray-600" formatter={(v: number) => (v > 0 ? v : '')} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </Card>
  )
}

function BarHorizontal({ data, title, sub, distributed, color }: { data: Named[]; title: string; sub?: string; distributed?: boolean; color?: string }) {
  return (
    <Card title={title} sub={sub}>
      <ChartContainer config={{ value: { label: 'คน', color: color ?? 'var(--chart-4)' } }} className="aspect-auto h-[210px] w-full">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={92} fontSize={11} />
          <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]} fill={distributed ? undefined : 'var(--color-value)'}>
            {distributed && data.map((d) => <Cell key={d.name} fill={d.color} />)}
            <LabelList dataKey="value" position="right" offset={6} fontSize={11} className="fill-gray-600" formatter={(v: number) => (v > 0 ? v : '')} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </Card>
  )
}

// BMI เวอร์ชันมินิ — ไม่มีการ์ดขาว ใช้วางในแผงเทาคู่กับ heatmap
export function BmiMini({ data }: { data: Named[] }) {
  return (
    <div>
      <h3 className="text-[13px] font-medium text-gray-600">
        การกระจาย BMI <span className="font-normal text-gray-400">· เกณฑ์ Asia-Pacific</span>
      </h3>
      <ChartContainer config={{ value: { label: 'คน' } }} className="mt-2 aspect-auto h-[118px] w-full">
        <BarChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} interval={0} fontSize={10} />
          <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} fontSize={10} />
          <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={34}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            <LabelList dataKey="value" position="top" offset={5} fontSize={10} className="fill-gray-600" formatter={(v: number) => (v > 0 ? v : '')} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}

export default function DashboardCharts({ data }: { data: ChartsData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Donut data={data.risk} title="ระดับความเสี่ยงการดื่ม (AUDIT)" sub="ตามเกณฑ์ WHO / ศวส." />
      <Donut data={data.gender} title="เพศของผู้ตอบ" />
      <BarHorizontal data={data.smoke} title="สถานะการสูบบุหรี่" distributed />
      <BarVertical data={data.age} title="ช่วงอายุผู้ตอบ" distributed />
      <BarHorizontal data={data.province} title="พื้นที่เก็บข้อมูล (จังหวัด)" sub="กระจายตามจังหวัด" color="#16A34A" />
    </div>
  )
}
