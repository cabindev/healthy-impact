'use client'

import { Popover } from '@base-ui-components/react/popover'
import { Info } from 'lucide-react'

// ไอคอน ℹ️ ชี้/แตะแล้วแสดงคำอธิบาย — ใช้ Base UI Popover
// Base UI จัดการให้ในตัว: portal (หลุด overflow การ์ด) · clamp ขอบจอ (collision avoidance)
// · ปิดเมื่อคลิกนอก/ESC/scroll · เปิดเมื่อ hover (เดสก์ท็อป) และ tap/click (มือถือ)
export default function InfoTip({ children, label = 'อธิบาย', align = 'center', widthPx = 256 }: {
  children: React.ReactNode
  label?: string
  align?: 'center' | 'right'
  widthPx?: number
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={label}
        openOnHover
        delay={0}
        closeDelay={150}
        className="inline-flex items-center justify-center align-middle text-gray-400 hover:text-green-600 transition-colors cursor-help focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align={align === 'right' ? 'end' : 'center'}
          sideOffset={6}
          collisionPadding={8}
          className="z-50"
        >
          <Popover.Popup
            style={{ width: widthPx }}
            className="max-h-[70vh] overflow-auto rounded-lg border border-gray-200 bg-white p-3 shadow-xl text-left outline-none"
          >
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
