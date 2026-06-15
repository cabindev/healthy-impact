'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { verifySurvey, unverifySurvey } from '@/app/actions/survey'
import { CheckCircle2, ShieldCheck } from 'lucide-react'

export default function VerifyButton({ id, verified, verifierName, verifiedAt }: {
  id: number
  verified: boolean
  verifierName?: string | null
  verifiedAt?: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)

  const run = (fn: (id: number) => Promise<void>) => {
    setError(false)
    startTransition(async () => {
      try { await fn(id); router.refresh() } catch { setError(true) }
    })
  }

  if (verified) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>ตรวจสอบแล้ว{verifierName ? ` โดย ${verifierName}` : ''}{verifiedAt ? ` · ${verifiedAt}` : ''}</span>
        </div>
        <button type="button" onClick={() => run(unverifySurvey)} disabled={pending}
          className={`text-xs text-emerald-700 hover:text-emerald-900 font-medium shrink-0 ${pending ? 'opacity-50' : ''}`}>
          ยกเลิก
        </button>
      </div>
    )
  }

  return (
    <div>
      <button type="button" onClick={() => run(verifySurvey)} disabled={pending}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <ShieldCheck className="w-4 h-4" /> {pending ? 'กำลังยืนยัน...' : 'ยืนยันการตรวจสอบ'}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">ทำรายการไม่สำเร็จ โปรดลองอีกครั้ง</p>}
    </div>
  )
}
