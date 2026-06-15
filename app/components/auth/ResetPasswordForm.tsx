'use client'

import { useState, FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }
    if (password.length < 5) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 5 ตัวอักษร')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('รีเซ็ตรหัสผ่านสำเร็จ กำลังนำคุณไปหน้าเข้าสู่ระบบ...')
        setTimeout(() => { window.location.href = '/auth/signin' }, 2000)
      } else {
        setError(data.error)
      }
    } catch {
      setError('เกิดข้อผิดพลาด โปรดลองอีกครั้ง')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-2xl text-center">
          <p className="text-red-600">ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">รีเซ็ตรหัสผ่าน</h2>
          <p className="mt-2 text-sm text-gray-500">กรอกรหัสผ่านใหม่ของคุณ</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
            <input
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? 'กำลังดำเนินการ...' : 'รีเซ็ตรหัสผ่าน'}
          </button>
        </form>
      </div>
    </div>
  )
}
