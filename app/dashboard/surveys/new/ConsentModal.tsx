'use client'

import { useState } from 'react'
import { AlertDialog } from '@base-ui-components/react/alert-dialog'
import { ShieldCheck } from 'lucide-react'

// แจ้งสิทธิ์ PDPA + ขอความยินยอม ก่อนเริ่มกรอกแบบสอบถาม (อ้างอิงแนวทาง cm-local)
// ใช้ Base UI AlertDialog — เป็น gate บังคับเลือก: ปิดด้วยคลิกนอก/ESC ไม่ได้
// (parent mount ไว้ตอน !pdpaDone, controlled open + onOpenChange เปล่า → ปิดได้เฉพาะปุ่ม)
export default function ConsentModal({ onConfirm, onDecline }: { onConfirm: () => void; onDecline: () => void }) {
  const [purpose, setPurpose] = useState(true)
  const [sensitive, setSensitive] = useState(true)
  const ready = purpose && sensitive

  return (
    <AlertDialog.Root open onOpenChange={() => {}}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl outline-none">
          <div className="bg-green-600 text-white px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <div>
                <AlertDialog.Title className="font-bold text-lg">แจ้งสิทธิ์ตาม PDPA</AlertDialog.Title>
                <AlertDialog.Description className="text-xs text-white/80 mt-0.5">กรุณาอ่านและยืนยันก่อนเก็บข้อมูล</AlertDialog.Description>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <section>
              <h3 className="text-sm font-bold text-gray-800 mb-1">วัตถุประสงค์การเก็บข้อมูล</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                ระบบนี้เก็บข้อมูลส่วนบุคคลเพื่อ<strong>ติดตามและประเมินผลกระทบด้านสุขภาวะ</strong>ตามตัวชี้วัด
                โดยไม่นำไปใช้เพื่อวัตถุประสงค์อื่น
              </p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-800 mb-1.5">ข้อมูลที่เก็บรวบรวม</h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                  ชื่อ-นามสกุล เพศ วัน/เดือน/ปีเกิด และเลขบัตรประชาชน (ไม่บังคับ)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5 shrink-0">•</span>
                  <span>
                    <strong className="text-orange-700">ข้อมูลสุขภาพ (ข้อมูลอ่อนไหว)</strong> — น้ำหนัก/ส่วนสูง/รอบเอว
                    โรคประจำตัว การสูบบุหรี่ การดื่มแอลกอฮอล์ และการดื่มแล้วขับ
                  </span>
                </li>
              </ul>
            </section>

            <section className="bg-gray-50 rounded-xl p-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 font-medium mb-0.5">ระยะเวลาเก็บข้อมูล</p>
                  <p className="text-gray-700">ตลอดระยะโครงการ และไม่เกิน 5 ปีหลังสิ้นสุดโครงการ</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-0.5">ผู้ควบคุมข้อมูล</p>
                  <p className="text-gray-600 font-light">โครงการเก็บข้อมูลผลกระทบด้านสุขภาวะ</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-800 mb-1">สิทธิ์ของเจ้าของข้อมูล</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                เจ้าของข้อมูลมีสิทธิ์ขอดู แก้ไข ลบ หรือถอนความยินยอมได้ทุกเมื่อ โดยแจ้งต่อเจ้าหน้าที่โครงการ
              </p>
            </section>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={purpose} onChange={(e) => setPurpose(e.target.checked)}
                  className="accent-green-600 w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700 leading-relaxed">
                  ข้าพเจ้าได้<strong>แจ้งวัตถุประสงค์</strong>การเก็บข้อมูลแก่เจ้าของข้อมูลแล้ว และเจ้าของข้อมูลรับทราบ
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)}
                  className="accent-green-600 w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700 leading-relaxed">
                  เจ้าของข้อมูล<strong>ยินยอมโดยชัดแจ้ง</strong>ให้เก็บ ใช้ และเปิดเผย
                  <span className="text-orange-700 font-semibold"> ข้อมูลสุขภาพ </span>
                  เพื่อวัตถุประสงค์ของโครงการ
                </span>
              </label>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-2">
            <button type="button" disabled={!ready} onClick={onConfirm}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm">
              {ready ? 'ยินยอม — ดำเนินการต่อ' : 'กรุณาติ๊กยืนยันทั้ง 2 ข้อ'}
            </button>
            <button type="button" onClick={onDecline}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ไม่ยินยอม — จบการสัมภาษณ์
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
