import Link from 'next/link'
import { Download, Wine } from 'lucide-react'
import { RISK_COLORS, type RiskLevel } from '@/app/lib/audit'
import { DRINK_SHORT as SHORT } from '@/app/lib/drink-groups'
import { AREA_LABEL, DRINK_GROUPS, UNSPECIFIED, type DrinkSummary, type DrinkSummaryRow } from '@/app/lib/drink-summary'

const drinkers = (r: DrinkSummaryRow) => r.total - r.counts['ไม่ดื่ม']

// ตารางสรุปจำนวนผู้ดื่มแต่ละกลุ่ม AUDIT ตามพื้นที่ — กดชื่อพื้นที่เพื่อเจาะลงระดับถัดไป
export default function DrinkSummaryTable({ summary, filterQuery }: { summary: DrinkSummary; filterQuery: string }) {
  const { level, rows, totals } = summary
  const drillHref = (name: string) => {
    const params = new URLSearchParams(filterQuery)
    params.set(level, name)
    params.delete('page')
    return `/dashboard/surveys?${params.toString()}`
  }
  const exportHref = filterQuery ? `/api/report/drink-summary?${filterQuery}` : '/api/report/drink-summary'
  const num = (v: number) => (v ? v.toLocaleString() : <span className="text-gray-300">0</span>)

  return (
    <details open className="group rounded-2xl border border-gray-200/80 bg-white print:hidden">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Wine aria-hidden="true" className="size-4 text-green-600" />
            สรุปผู้ดื่มตาม{AREA_LABEL[level]}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            นับเฉพาะผู้เข้าเกณฑ์ {totals.total.toLocaleString()} คน · แบ่งกลุ่มตามคะแนน AUDIT
            {level !== 'village' && ` · กดชื่อ${AREA_LABEL[level]}เพื่อดูระดับถัดไป`}
          </p>
        </div>
        <span className="text-xs font-medium text-green-700 group-open:hidden">แสดงตาราง</span>
        <span className="hidden text-xs font-medium text-gray-500 group-open:inline">ซ่อน</span>
      </summary>

      <div className="border-t border-gray-100 px-4 pb-4 sm:px-5 sm:pb-5">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">ไม่มีผู้เข้าเกณฑ์ในตัวกรองนี้</p>
        ) : (
          <>
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-xs text-gray-500">
                  <tr className="border-b border-gray-100">
                    <th scope="col" className="px-3 py-3 text-left font-medium">{AREA_LABEL[level]}</th>
                    {DRINK_GROUPS.map((g) => (
                      <th scope="col" key={g} className="px-2 py-3 text-right font-medium">
                        {g === 'ไม่ดื่ม'
                          ? SHORT[g]
                          : <span className={`rounded-md px-1.5 py-0.5 ${RISK_COLORS[g as RiskLevel]}`}>{SHORT[g]}</span>}
                      </th>
                    ))}
                    <th scope="col" className="px-2 py-3 text-right font-medium">รวมผู้ดื่ม</th>
                    <th scope="col" className="px-3 py-3 text-right font-medium">รวมทั้งหมด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 tabular-nums">
                  {rows.map((r) => (
                    <tr key={r.name} className="hover:bg-gray-50/60">
                      <th scope="row" className="px-3 py-2.5 text-left font-normal">
                        {r.name === UNSPECIFIED
                          ? <span className="text-gray-400">{UNSPECIFIED}</span>
                          : <Link href={drillHref(r.name)} className="font-medium text-green-700 hover:underline">{r.name}</Link>}
                      </th>
                      {DRINK_GROUPS.map((g) => <td key={g} className="px-2 py-2.5 text-right text-gray-700">{num(r.counts[g])}</td>)}
                      <td className="px-2 py-2.5 text-right font-medium text-gray-800">{num(drinkers(r))}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-800">{r.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="tabular-nums">
                  <tr className="border-t-2 border-gray-200 bg-gray-50/80 font-semibold text-gray-800">
                    <th scope="row" className="px-3 py-3 text-left">รวม</th>
                    {DRINK_GROUPS.map((g) => <td key={g} className="px-2 py-3 text-right">{totals.counts[g].toLocaleString()}</td>)}
                    <td className="px-2 py-3 text-right">{drinkers(totals).toLocaleString()}</td>
                    <td className="px-3 py-3 text-right">{totals.total.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-3 flex justify-end">
              <a href={exportHref} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Download aria-hidden="true" className="size-3.5" /> ดาวน์โหลดตารางสรุป (Excel)
              </a>
            </div>
          </>
        )}
      </div>
    </details>
  )
}
