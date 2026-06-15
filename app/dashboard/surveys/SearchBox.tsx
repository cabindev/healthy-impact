'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

// ช่องค้นหารายการแบบสอบถาม — อัปเดต ?q= แบบ debounce (replace ไม่สแปม history)
export default function SearchBox({ initial = '' }: { initial?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState(initial)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    const t = setTimeout(() => {
      const q = value.trim()
      router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname)
    }, 300)
    return () => clearTimeout(t)
  }, [value, pathname, router])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ค้นหา เลขที่ / ชื่อ-นามสกุล / ตำบล-อำเภอ-จังหวัด / ผู้เก็บ"
        className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 bg-white"
      />
      {value && (
        <button type="button" onClick={() => setValue('')} aria-label="ล้างคำค้นหา"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
