import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งานในระบบ' }, { status: 404 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenCreatedAt: new Date(),
        resetTokenExpiresAt: expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รีเซ็ตรหัสผ่าน - Healthy Impact</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td>
        <h2 style="color: #2563eb;">รีเซ็ตรหัสผ่านของคุณ</h2>
        <p>เรียน คุณ${user.firstName},</p>
        <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณที่ Healthy Impact</p>
        <p>คลิกที่ปุ่มด้านล่างเพื่อรีเซ็ตรหัสผ่านของคุณ:</p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">รีเซ็ตรหัสผ่าน</a>
            </td>
          </tr>
        </table>
        <p>ลิงก์นี้จะหมดอายุภายใน 1 ชั่วโมง</p>
        <p>ขอแสดงความนับถือ,<br>ทีมงาน Healthy Impact</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: '"Healthy Impact" <noreply@healthy-impact.local>',
      to: email,
      subject: 'รีเซ็ตรหัสผ่าน - Healthy Impact',
      html: htmlContent,
    });

    return NextResponse.json({ message: 'ลิงก์สำหรับรีเซ็ตรหัสผ่านได้ถูกส่งไปยังอีเมลของคุณแล้ว' });
  } catch (error) {
    console.error('Error occurred:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการส่งอีเมล โปรดลองอีกครั้ง' }, { status: 500 });
  }
}
