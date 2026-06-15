import { getServerSession } from 'next-auth'
import authOptions from '@/app/lib/configs/auth/authOptions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, ClipboardList, Cigarette, Wine, Car } from 'lucide-react'
import SignOutButton from '@/app/components/auth/SignOutButton'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session?.user.role === 'ADMIN' || session?.user.role === 'SUPERADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-[10px]">HI</span>
          </div>
          <span className="font-semibold text-white tracking-tight">Healthy Impact</span>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/40">{session.user.firstName}</span>
              <SignOutButton />
            </div>
          ) : (
            <>
              <Link href="/auth/signin"
                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors">
                เข้าสู่ระบบ
              </Link>
              <Link href="/auth/signup"
                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors">
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center py-24">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
          Healthy Impact
          <br />
          <span className="text-green-400">Survey</span>
        </h1>

        <p className="text-white/40 text-lg max-w-md leading-relaxed mb-10">
          ระบบเก็บข้อมูลผลกระทบด้านสุขภาวะ — บุหรี่ แอลกอฮอล์ และอุบัติเหตุจราจร
        </p>

        {!session ? (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/auth/signin"
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors text-sm">
              เข้าสู่ระบบ
            </Link>
            <Link href="/auth/signup"
              className="px-8 py-3 border border-white/10 text-white/60 font-medium rounded-xl hover:border-white/20 hover:text-white/80 transition-colors text-sm">
              สมัครสมาชิก
            </Link>
          </div>
        ) : (
          <div className="border border-white/[0.08] rounded-xl px-6 py-4 text-center bg-white/[0.02]">
            <p className="text-white/40 text-sm mb-1">บัญชีของคุณยังรอการอนุมัติสิทธิ์</p>
            <p className="text-white/25 text-xs">กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
        )}
      </main>

      {/* Divider */}
      <div className="border-t border-white/[0.05] mx-8" />

      {/* Sections */}
      <section className="px-8 py-16 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: ClipboardList, label: 'ข้อมูลทั่วไป' },
            { icon: Cigarette,     label: 'การสูบบุหรี่' },
            { icon: Wine,          label: 'แอลกอฮอล์ (AUDIT)' },
            { icon: Car,           label: 'เมาแล้วขับ' },
          ].map(({ icon: Icon, label }) => (
            <div key={label}
              className="flex flex-col items-center gap-2.5 py-6 px-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
              <Icon className="w-5 h-5 text-green-400/70" />
              <span className="text-white/50 text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/20 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-600 rounded-md flex items-center justify-center">
            <span className="text-white font-black text-[7px]">HI</span>
          </div>
          <span>Healthy Impact</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          <span>เฉพาะผู้มีสิทธิ์เท่านั้น</span>
        </div>
      </footer>
    </div>
  )
}
