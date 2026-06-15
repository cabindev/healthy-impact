'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { compressImage } from '@/app/lib/compressImage'

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  image: File | null
  zone: string
  province: string
  amphoe: string
  district: string
}

export default function SignUpForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '', lastName: '', email: '', password: '',
    image: null, zone: '', province: '', amphoe: '', district: '',  // location set by admin later
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('กรุณาอัพโหลดไฟล์รูปภาพ (JPG, PNG, WEBP)'); return
    }
    try {
      const compressed = await compressImage(file)
      setFormData(prev => ({ ...prev, image: compressed }))
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(compressed)
      setError(null)
    } catch { setError('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ') }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true); setError(null)
    try {
      const data = new FormData()
      data.append('firstName', formData.firstName)
      data.append('lastName', formData.lastName)
      data.append('email', formData.email)
      data.append('password', formData.password)
      if (formData.image)    data.append('image', formData.image)
      if (formData.zone)     data.append('zone', formData.zone)
      if (formData.province) data.append('province', formData.province)
      if (formData.amphoe)   data.append('amphoe', formData.amphoe)
      if (formData.district) data.append('district', formData.district)

      const res = await fetch('/api/auth/signup', { method: 'POST', body: data })
      if (res.ok) {
        await signIn('credentials', { email: formData.email, password: formData.password, callbackUrl: '/' })
      } else {
        const result = await res.json()
        setError(result.error || 'เกิดข้อผิดพลาด')
      }
    } catch { setError('เกิดข้อผิดพลาดในการเชื่อมต่อ') }
    finally { setIsLoading(false) }
  }

  const inputClass = 'block w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 bg-white transition-colors'
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-8 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-green-600 px-8 py-6">
          <h2 className="text-2xl font-black text-white">สมัครสมาชิก</h2>
          <p className="text-sm text-green-50 mt-0.5">Healthy Impact — แบบสอบถามผลกระทบด้านสุขภาวะ</p>
        </div>

        <form className="px-8 py-6 space-y-4" onSubmit={handleSubmit}>

          {/* ชื่อ - นามสกุล */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>ชื่อ</label>
              <input type="text" required className={inputClass} placeholder="ชื่อ"
                value={formData.firstName}
                onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>นามสกุล</label>
              <input type="text" required className={inputClass} placeholder="นามสกุล"
                value={formData.lastName}
                onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))} />
            </div>
          </div>

          {/* อีเมล */}
          <div>
            <label className={labelClass}>อีเมล</label>
            <input type="email" required className={inputClass} placeholder="your@email.com"
              value={formData.email}
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
          </div>

          {/* รหัสผ่าน */}
          <div>
            <label className={labelClass}>รหัสผ่าน</label>
            <input type="password" required className={inputClass} placeholder="อย่างน้อย 5 ตัวอักษร"
              value={formData.password}
              onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
          </div>

          {/* รูปโปรไฟล์ */}
          <div>
            <label className={labelClass}>รูปโปรไฟล์ <span className="text-gray-400 font-normal">(ไม่บังคับ)</span></label>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-green-50 flex items-center justify-center flex-shrink-0 border-2 border-green-300">
                {imagePreview
                  ? <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
                  : <span className="text-green-300 text-xl">👤</span>
                }
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange}
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading}
            className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors bg-green-600 hover:bg-green-700 text-white ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}>
            {isLoading ? 'กำลังดำเนินการ...' : 'สมัครสมาชิก'}
          </button>

          <p className="text-center text-sm text-gray-500">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/auth/signin" className="font-semibold text-gray-800 hover:text-green-600 underline underline-offset-2">
              เข้าสู่ระบบ
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
