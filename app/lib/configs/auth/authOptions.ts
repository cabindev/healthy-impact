import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sendTelegram } from '@/app/lib/telegram';

const prisma = new PrismaClient();

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
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number;
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
        if (!credentials) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('ไม่พบบัญชีผู้ใช้นี้ในระบบ');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error('รหัสผ่านไม่ถูกต้อง');
        }

        const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
        await sendTelegram(
          `◉ <b>เข้าสู่ระบบ</b>\n` +
          `${user.firstName} ${user.lastName}  ·  <code>${user.role}</code>\n` +
          `<i>${user.email}</i>\n` +
          `<code>${now}</code>`
        )

        return {
          id: user.id,
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
        token.id = (user as PrismaUser).id;
        token.firstName = (user as PrismaUser).firstName;
        token.lastName = (user as PrismaUser).lastName;
        token.role = (user as PrismaUser).role;
        token.province = (user as PrismaUser).province ?? undefined;
        token.amphoe = (user as PrismaUser).amphoe ?? undefined;
        token.district = (user as PrismaUser).district ?? undefined;
        token.zone = (user as PrismaUser).zone ?? undefined;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.role = token.role;
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
