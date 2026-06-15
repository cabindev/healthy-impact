'use client'

import { createContext, useContext, useState } from 'react'

interface DashboardContextType {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  isMobileSidebarOpen: boolean
  toggleMobileSidebar: (open?: boolean) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev)

  const toggleMobileSidebar = (open?: boolean) => {
    if (typeof open === 'boolean') setIsMobileSidebarOpen(open)
    else setIsMobileSidebarOpen((prev) => !prev)
  }

  return (
    <DashboardContext.Provider value={{ sidebarCollapsed, toggleSidebar, isMobileSidebarOpen, toggleMobileSidebar }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider')
  return context
}
