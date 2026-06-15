'use client'

import { useSession } from 'next-auth/react'
import { useDashboard } from '../context/DashboardContext'
import { Menu } from 'lucide-react'

export default function TopNav() {
  const { data: session } = useSession()
  const { toggleMobileSidebar } = useDashboard()

  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 gap-4 sticky top-0 z-20 print:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => toggleMobileSidebar()} className="lg:hidden p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100">
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm text-gray-400 truncate">ระบบเก็บข้อมูลผลกระทบด้านสุขภาวะ</span>
      </div>
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        <span className="text-sm font-medium text-gray-700">{session?.user?.firstName} {session?.user?.lastName}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{session?.user?.role}</span>
      </div>
    </header>
  )
}
