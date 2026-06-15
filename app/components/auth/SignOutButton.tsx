'use client'

import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="px-4 py-1.5 border border-gray-600 text-gray-300 rounded-lg text-sm hover:border-gray-400 hover:text-white transition-colors"
    >
      ออกจากระบบ
    </button>
  )
}
