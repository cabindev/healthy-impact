'use client'

import { useState, useTransition } from 'react'
import { updateUserRole, type RoleValue } from '@/app/actions/user'

const ROLES: RoleValue[] = ['MEMBER', 'ADMIN', 'SUPERADMIN']

export default function RoleSelect({ userId, role, disabled }: { userId: number; role: RoleValue; disabled?: boolean }) {
  const [value, setValue] = useState<RoleValue>(role)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)

  if (disabled) {
    return <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{role}</span>
  }

  const change = (next: RoleValue) => {
    const prev = value
    setValue(next)
    setError(false)
    startTransition(async () => {
      try {
        await updateUserRole(userId, next)
      } catch {
        setValue(prev)
        setError(true)
      }
    })
  }

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => change(e.target.value as RoleValue)}
      className={`text-xs px-2 py-1 rounded-lg border bg-white font-medium focus:outline-none focus:border-green-500 ${
        error ? 'border-red-300 text-red-600' : 'border-gray-200 text-gray-700'
      } ${pending ? 'opacity-50' : ''}`}>
      {ROLES.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  )
}
