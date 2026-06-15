'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardProvider } from './context/DashboardContext'
import DashboardClient from './components/DashboardClient'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN'

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status === 'authenticated' && !isAdmin) router.push('/auth/signin')
  }, [status, isAdmin, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin || !session) return null

  return (
    <DashboardProvider>
      <DashboardClient user={session.user}>{children}</DashboardClient>
    </DashboardProvider>
  )
}
