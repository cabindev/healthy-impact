import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/app/lib/prisma';
import { rateLimit } from '@/app/lib/rate-limit';
import { normalizedEmail, escapeHtml } from '@/app/lib/security-input';
import bcrypt from 'bcrypt';
import { sendTelegram } from '@/app/lib/telegram';



interface Credentials {
  email: string;
  password: string;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      image?: string;
      province?: string;
      amphoe?: string;
      district?: string;
      zone?: string;
    };
  }

  interface User {
    id: number;
    role: string;
    sessionVersion: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number;
    sessionVersion?: number;
    invalid?: boolean;
    firstName: string;
    lastName: string;
    role: string;
    picture?: string;
    province?: string;
    amphoe?: string;
    district?: string;
    zone?: string;
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Credentials | undefined) {
        await rateLimit('login-global', 'all', 100, 60_000)
        const email = normalizedEmail(credentials?.email)
        const password = credentials?.password
        if (!email || typeof password !== 'string' || !password || Buffer.byteLength(password) > 72) return null
        await rateLimit('login-email', email, 10, 900_000)
        const user = await prisma.user.findUnique({ where: { email } })
        // Constant-cost comparison even for an unknown account; same message for both failures.
        const valid = await bcrypt.compare(password, user?.password ?? '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW')
        if (!user || !valid) return null

        const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
        await sendTelegram(
          `◉ <b>เข้าสู่ระบบ</b>\n` +
          `${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}  ·  <code>${user.role}</code>\n` +
          `<i>${escapeHtml(user.email)}</i>\n` +
          `<code>${now}</code>`
        )

        return {
          id: user.id,
          sessionVersion: user.lastPasswordReset?.getTime() ?? 0,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          image: user.image ?? undefined,
          province: user.province ?? undefined,
          amphoe: user.amphoe ?? undefined,
          district: user.district ?? undefined,
          zone: user.zone ?? undefined,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: 'healthy-impact.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = Number(user.id)
        token.sessionVersion = user.sessionVersion
      }
      // Missing versions invalidate all pre-hardening JWTs. Never trust useSession.update payloads.
      if (token.invalid || typeof token.sessionVersion !== 'number' || !Number.isInteger(token.id)) {
        return { ...token, role: '', invalid: true }
      }
      const current = await prisma.user.findUnique({ where: { id: token.id } })
      if (!current || token.sessionVersion !== (current.lastPasswordReset?.getTime() ?? 0)) {
        return { ...token, role: '', invalid: true }
      }
      token.firstName = current.firstName
      token.lastName = current.lastName
      token.email = current.email
      token.role = current.role
      token.picture = current.image ?? undefined
      token.province = current.province ?? undefined
      token.amphoe = current.amphoe ?? undefined
      token.district = current.district ?? undefined
      token.zone = current.zone ?? undefined
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.invalid ? 0 : token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.role = token.invalid ? '' : token.role;
        session.user.image = token.picture;
        session.user.province = token.province;
        session.user.amphoe = token.amphoe;
        session.user.district = token.district;
        session.user.zone = token.zone;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export default authOptions;
