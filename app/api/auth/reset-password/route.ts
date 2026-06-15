import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุแล้ว' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenCreatedAt: null,
        resetTokenExpiresAt: null,
        lastPasswordReset: new Date(),
      },
    });

    return NextResponse.json({ message: 'รีเซ็ตรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' }, { status: 500 });
  }
}
