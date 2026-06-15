'use client'

import { useState, FormEvent } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [welcome, setWelcome] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      } else {
        const session = await getSession()
        const firstName = (session?.user as any)?.firstName ?? ''
        const role = session?.user?.role
        setWelcome(firstName)
        const dest = (role === 'ADMIN' || role === 'SUPERADMIN') ? '/dashboard' : '/'
        setTimeout(() => router.replace(dest), 1500)
      }
    } catch {
      setError('เกิดข้อผิดพลาด โปรดลองอีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }

  if (welcome !== null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-3">
          <p className="text-gray-400 text-sm tracking-widest uppercase">Welcome back</p>
          <p className="text-white text-3xl font-bold">{welcome}</p>
          <div className="w-8 h-0.5 bg-green-600 mx-auto mt-4 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Healthy Impact</h2>
          <p className="text-sm text-gray-500">เข้าสู่ระบบเพื่อใช้งาน</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">อีเมล</label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_white_inset]"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <input
                id="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_white_inset]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link href="/auth/forgot-password" className="text-sm font-medium text-gray-600 hover:text-green-600 underline underline-offset-2">
              ลืมรหัสผ่าน?
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-bold transition-colors bg-green-600 text-white hover:bg-green-700 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-500">ยังไม่มีบัญชี? </span>
          <Link href="/auth/signup" className="font-medium text-gray-800 hover:text-green-600 underline underline-offset-2">
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  )
}
