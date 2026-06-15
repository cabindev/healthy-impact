'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
      } else {
        setError(data.error)
      }
    } catch {
      setError('เกิดข้อผิดพลาด โปรดลองอีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">ลืมรหัสผ่าน</h2>
          <p className="mt-2 text-sm text-gray-500">กรอกอีเมลของคุณ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">อีเมล</label>
            <input
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-bold transition-colors ${
              isLoading
                ? 'bg-green-200 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isLoading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link href="/auth/signin" className="font-medium text-gray-700 hover:text-green-600 underline underline-offset-2">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  )
}
