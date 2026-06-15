'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useDashboard } from '../context/DashboardContext'
import { LayoutDashboard, ClipboardList, Users, Menu, X, ChevronRight, LogOut } from 'lucide-react'

const NAV = [
  { href: '/dashboard',         label: 'ภาพรวม',     icon: LayoutDashboard,  desc: 'สรุปข้อมูล KPI' },
  { href: '/dashboard/surveys', label: 'แบบสอบถาม',  icon: ClipboardList,    desc: 'ค้นหา · เลือก · Export · พิมพ์' },
  { href: '/dashboard/users',   label: 'ผู้ใช้งาน',   icon: Users,            desc: 'จัดการสิทธิ์' },
]

interface SidebarProps {
  user: { firstName?: string; lastName?: string; email?: string; role?: string }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, isMobileSidebarOpen, toggleMobileSidebar } = useDashboard()

  // ไฮไลต์เมนูที่ href เป็น prefix ตรงและ "ยาวสุด" (เช่น /surveys/new ชนะ /surveys)
  const activeHref = NAV
    .map((n) => n.href)
    .filter((h) => (h === '/dashboard' ? pathname === h : pathname === h || pathname.startsWith(`${h}/`)))
    .sort((a, b) => b.length - a.length)[0]

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) toggleMobileSidebar(false)
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 bg-gray-900 text-white flex flex-col transition-all duration-300 print:hidden
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Logo + toggles */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06]">
        {!sidebarCollapsed ? (
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0" onClick={handleNavClick}>
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-black text-[10px]">HI</span>
            </div>
            <span className="font-semibold tracking-tight text-sm truncate">Healthy Impact</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto" onClick={handleNavClick}>
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-[10px]">HI</span>
            </div>
          </Link>
        )}
        <button onClick={() => toggleMobileSidebar(false)} className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06]">
          <X className="w-5 h-5" />
        </button>
        <button onClick={toggleSidebar} className="hidden lg:block p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.06]">
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon, desc }) => {
          const active = href === activeHref
          return (
            <Link key={href} href={href} onClick={handleNavClick} title={sidebarCollapsed ? label : ''}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors
                ${active ? 'bg-green-600 text-white font-semibold' : 'text-white/55 hover:text-white hover:bg-white/[0.04]'}
                ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <Icon className={`shrink-0 ${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
              {!sidebarCollapsed && (
                <div className="ml-3 min-w-0">
                  <div>{label}</div>
                  <div className={`text-xs ${active ? 'text-white/70' : 'text-white/35'}`}>{desc}</div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + signout */}
      <div className="border-t border-white/[0.06] p-4">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
          )}
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} title={sidebarCollapsed ? 'ออกจากระบบ' : ''}
          className={`mt-3 flex items-center w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <LogOut className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="ml-3">ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  )
}
