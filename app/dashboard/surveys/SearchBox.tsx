'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

export default function SearchBox({ initial = '' }: { initial?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initial)
  const [pending, startTransition] = useTransition()
  const search = (query: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (query.trim()) params.set('q', query.trim())
    else params.delete('q')
    params.delete('page')
    startTransition(() => router.replace(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false }))
  }
  return (
    <form role="search" onSubmit={e => { e.preventDefault(); search(value) }} className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input aria-label="ค้นหาแบบสอบถาม" value={value} onChange={e => setValue(e.target.value)} placeholder="เลขที่ ชื่อผู้ตอบ พื้นที่ หรือผู้เก็บข้อมูล..." className="min-h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
        {value && <button type="button" aria-label="ล้างคำค้นหา" onClick={() => { setValue(''); search('') }} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:bg-gray-50"><X className="size-4" /></button>}
      </div>
      <button disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">{pending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}ค้นหา</button>
      <span role="status" className="sr-only">{pending ? 'กำลังค้นหา' : ''}</span>
    </form>
  )
}
