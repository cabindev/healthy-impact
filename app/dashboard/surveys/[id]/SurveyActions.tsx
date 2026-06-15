'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteSurvey } from '@/app/actions/survey'
import { Pencil, Trash2 } from 'lucide-react'

export default function SurveyActions({ id, editable = true }: { id: number; editable?: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    if (!confirm('ยืนยันการลบแบบสอบถามนี้? การลบไม่สามารถย้อนกลับได้')) return
    setBusy(true)
    try {
      await deleteSurvey(id)
      router.push('/dashboard/surveys')
    } catch {
      setBusy(false)
      alert('ลบไม่สำเร็จ โปรดลองอีกครั้ง')
    }
  }

  return (
    <div className="flex items-center gap-2">
      {editable && (
        <Link href={`/dashboard/surveys/${id}/edit`}
          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors">
          <Pencil className="w-4 h-4" /> แก้ไข
        </Link>
      )}
      <button type="button" onClick={remove} disabled={busy}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <Trash2 className="w-4 h-4" /> {busy ? 'กำลังลบ...' : 'ลบ'}
      </button>
    </div>
  )
}
