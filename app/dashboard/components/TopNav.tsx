'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useDashboard } from '../context/DashboardContext'
import { Map, Menu } from 'lucide-react'

// เมนูลัดบนแถบบน — เห็นเฉพาะ ADMIN ขึ้นไป
const ADMIN_LINKS = [{ href: '/dashboard/map', label: 'แผนที่', icon: Map }]

export default function TopNav() {
  const { data: session } = useSession()
  const { toggleMobileSidebar } = useDashboard()
  const pathname = usePathname()

  const role = session?.user?.role
  const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN'

  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 gap-4 sticky top-0 z-20 print:hidden">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => toggleMobileSidebar()} className="lg:hidden p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100">
          <Menu className="w-5 h-5" />
        </button>
        <span className="hidden md:block text-sm text-gray-400 truncate">ระบบเก็บข้อมูลผลกระทบด้านสุขภาวะ</span>

        {isAdmin && (
          <nav className="flex items-center gap-1">
            {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link key={href} href={href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-3 shrink-0">
        <span className="text-sm font-medium text-gray-700">{session?.user?.firstName} {session?.user?.lastName}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{role}</span>
      </div>
    </header>
  )
}
