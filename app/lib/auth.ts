import { getServerSession } from 'next-auth'
import authOptions from '@/app/lib/configs/auth/authOptions'

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) throw new Error('Unauthorized')
  return session
}

export async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') throw new Error('Unauthorized')
  return session
}
