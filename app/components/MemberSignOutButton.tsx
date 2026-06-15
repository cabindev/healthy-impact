'use client'

import { signOut } from 'next-auth/react'

export default function MemberSignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="w-full py-2 px-4 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-200"
    >
      ออกจากระบบ
    </button>
  )
}
