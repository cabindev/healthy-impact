import { DRINK_COLOR, DRINK_GROUPS, DRINK_SHORT, type DrinkCounts } from '@/app/lib/drink-groups'

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)

// โปรไฟล์การดื่มของจังหวัด: อัตราผู้ดื่มเทียบทั้งประเทศ + แถบสัดส่วน 5 กลุ่ม + ตัวเลขรายกลุ่ม
export default function DrinkProfile({ drink, national }: { drink: DrinkCounts; national: DrinkCounts }) {
  const total = DRINK_GROUPS.reduce((s, g) => s + drink[g], 0)
  if (!total) return <p className="mt-4 rounded-xl bg-white p-3 text-xs text-gray-500">ยังไม่มีผู้เข้าเกณฑ์ที่ตอบส่วนการดื่ม</p>

  const drinkers = total - drink['ไม่ดื่ม']
  // AUDIT ≥ 8 = เสี่ยง + อันตราย + ติด (จุดตัดผิดปกติ)
  const highRisk = drink['ผู้ดื่มแบบเสี่ยง'] + drink['ผู้ดื่มแบบอันตราย'] + drink['ผู้ดื่มแบบติด']
  const natTotal = DRINK_GROUPS.reduce((s, g) => s + national[g], 0)
  const natRate = pct(natTotal - national['ไม่ดื่ม'], natTotal)
  const rate = pct(drinkers, total)
  const diff = rate - natRate

  return (
    <div className="mt-4 rounded-xl bg-white p-3.5">
      <p className="text-xs font-medium text-gray-700">การดื่มแอลกอฮอล์ <span className="font-normal text-gray-400">· ผู้เข้าเกณฑ์ {total.toLocaleString()} คน</span></p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-gray-500">อัตราผู้ดื่ม</p>
          <p className="text-2xl font-semibold tabular-nums text-gray-800">{rate}<span className="text-sm">%</span></p>
          <p className={`text-[10px] ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-700' : 'text-gray-400'}`}>
            {diff === 0 ? 'เท่ากับ' : diff > 0 ? `สูงกว่า ${diff}% จาก` : `ต่ำกว่า ${-diff}% จาก`}ภาพรวม ({natRate}%)
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">เสี่ยงขึ้นไป (AUDIT ≥ 8)</p>
          <p className="text-2xl font-semibold tabular-nums text-gray-800">{highRisk.toLocaleString()} <span className="text-sm font-normal text-gray-400">คน</span></p>
          <p className="text-[10px] text-gray-400">{pct(highRisk, drinkers)}% ของผู้ดื่ม {drinkers.toLocaleString()} คน</p>
        </div>
      </div>

      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-gray-100" role="img"
        aria-label={DRINK_GROUPS.map((g) => `${DRINK_SHORT[g]} ${drink[g]} คน`).join(', ')}>
        {DRINK_GROUPS.map((g) => drink[g] > 0 && (
          <span key={g} style={{ width: `${(drink[g] / total) * 100}%`, backgroundColor: DRINK_COLOR[g] }} />
        ))}
      </div>

      <ul className="mt-3 space-y-1.5">
        {DRINK_GROUPS.map((g) => (
          <li key={g} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: DRINK_COLOR[g] }} />
            <span className="flex-1 text-gray-600">{g}</span>
            <span className="font-semibold tabular-nums text-gray-800">{drink[g].toLocaleString()}</span>
            <span className="w-9 text-right tabular-nums text-gray-400">{pct(drink[g], total)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
