'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@base-ui-components/react/dialog'
import { Printer, X, Loader2 } from 'lucide-react'
import { getSurveySlip } from '@/app/actions/survey'

type Slip = { no: string; name: string; eligible: boolean; fields: [string, string | number][] }

function sectionOf(label: string): string | null {
  if (label.startsWith('2.')) return 'ส่วนที่ 2 การสูบบุหรี่'
  if (label.startsWith('3.')) return 'ส่วนที่ 3 การดื่มแอลกอฮอล์'
  if (label.startsWith('4.')) return 'ส่วนที่ 4 เมาแล้วขับ'
  return null
}

function group(fields: [string, string | number][]) {
  const groups: { title: string; rows: [string, string | number][] }[] = [{ title: 'ข้อมูลทั่วไป', rows: [] }]
  let cur = 'ข้อมูลทั่วไป'
  for (const f of fields) {
    const sec = sectionOf(f[0])
    if (sec && sec !== cur) { cur = sec; groups.push({ title: sec, rows: [] }) }
    groups[groups.length - 1].rows.push(f)
  }
  return groups
}

const esc = (s: string | number) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

// สร้างเอกสาร A4 แบบสมบูรณ์ในตัว — พิมพ์ผ่าน iframe (ไม่พึ่ง DOM/CSS ของแอป)
function buildPrintDoc(slip: Slip): string {
  const sections = group(slip.fields).map((g) => `
    <section>
      <h2>${esc(g.title)}</h2>
      ${g.rows.map(([k, v]) => `<div class="row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}
    </section>`).join('')
  return `<!doctype html><html lang="th"><head><meta charset="utf-8">
<title>${esc(slip.no)} ${esc(slip.name)}</title>
<style>
  @page { size: A4; margin: 1.2cm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: #000; font-size: 10.5pt; line-height: 1.5;
    font-family: 'Sukhumvit Set', 'Sarabun', 'Thonburi', system-ui, -apple-system, sans-serif; }
  header { text-align: center; border-bottom: 1.5pt solid #111; padding-bottom: .35cm; margin-bottom: .6cm; }
  header .org { font-size: 17pt; font-weight: 700; }
  header .doc { font-size: 9pt; color: #666; }
  header .meta { font-size: 12pt; margin-top: 3pt; }
  main { columns: 2; column-gap: 1cm; column-rule: .5pt solid #d1d5db; }
  section { break-inside: avoid; margin-bottom: 6pt; }
  h2 { font-size: 10pt; font-weight: 700; color: #111; border-top: .5pt solid #9ca3af;
    padding-top: 3pt; margin: 0 0 2pt; }
  .row { display: flex; justify-content: space-between; gap: 10pt; padding: 1.5pt 0;
    border-bottom: .3pt dotted #e5e7eb; }
  .k { color: #4b5563; flex: none; }
  .v { color: #000; text-align: right; word-break: break-word; }
  footer { text-align: center; color: #888; font-size: 9pt; margin-top: .5cm; }
</style></head>
<body>
  <header>
    <div class="org">Healthy Impact</div>
    <div class="doc">รายละเอียดแบบสอบถาม</div>
    <div class="meta">${esc(slip.no)} · ${esc(slip.name)}</div>
  </header>
  <main>${sections}</main>
  <footer>— จบ —</footer>
</body></html>`
}

function printSlip(slip: Slip) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  iframe.onload = () => {
    const win = iframe.contentWindow
    if (!win) return
    win.focus()
    win.print()
    // ลบ iframe หลังพิมพ์ (เผื่อ dialog print แบบ async)
    setTimeout(() => iframe.remove(), 1000)
  }
  document.body.appendChild(iframe)
  iframe.srcdoc = buildPrintDoc(slip)
}

export default function PrintSlipButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false)
  const [slip, setSlip] = useState<Slip | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || slip) return
    setLoading(true)
    getSurveySlip(id).then((d) => { setSlip(d as Slip | null); setLoading(false) })
  }, [open, id, slip])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger aria-label="พิมพ์สลิป" title="พิมพ์สลิป"
        className="inline-flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors">
        <Printer className="w-4 h-4" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[360px] max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-auto bg-white rounded-xl shadow-2xl outline-none">
          {/* แถบควบคุม */}
          <div className="sticky top-0 flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
            <span className="text-xs text-gray-500">สลิปแบบสอบถาม</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => slip && printSlip(slip)} disabled={!slip}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors">
                <Printer className="w-3.5 h-3.5" /> พิมพ์
              </button>
              <Dialog.Close aria-label="ปิด" className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
          </div>

          {/* เนื้อสลิป (preview บนจอ) — ตัวบาง เล็ก สไตล์ใบเสร็จ */}
          <div className="px-5 py-4 font-light text-[11px] leading-relaxed text-gray-800">
            {loading || !slip ? (
              <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลด…</> : 'ไม่พบข้อมูล'}
              </div>
            ) : (
              <>
                <div className="text-center mb-3">
                  <div className="text-sm font-semibold text-gray-900">Healthy Impact</div>
                  <div className="text-[10px] text-gray-400">รายละเอียดแบบสอบถาม</div>
                  <Dialog.Title className="mt-1 text-xs font-medium text-gray-700">{slip.no} · {slip.name}</Dialog.Title>
                </div>
                {group(slip.fields).map((g) => (
                  <div key={g.title}>
                    <div className="mt-3 mb-1 pt-1.5 border-t border-dashed border-gray-200 text-[10px] font-medium tracking-wide text-gray-500">{g.title}</div>
                    {g.rows.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 py-0.5">
                        <span className="text-gray-400 shrink-0">{k}</span>
                        <span className="text-gray-800 text-right break-words">{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="mt-3 pt-2 border-t border-dashed border-gray-200 text-center text-[10px] text-gray-400">— จบ —</div>
              </>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
