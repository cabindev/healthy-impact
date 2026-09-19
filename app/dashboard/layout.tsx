import { requireAdminPage } from '@/app/lib/auth'
import DashboardShell from './DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()
  return <DashboardShell>{children}</DashboardShell>
}
