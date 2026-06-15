import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { sendTelegram } from '@/app/lib/telegram';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const image = formData.get('image') as File | null;
    const province = formData.get('province') as string | null;
    const amphoe = formData.get('amphoe') as string | null;
    const district = formData.get('district') as string | null;
    const zone = formData.get('zone') as string | null;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'มีอีเมลนี้แล้วในระบบ' }, { status: 400 });
    }

    if (password.length < 5) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 5 ตัวอักษร' }, { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    let imagePath = '';
    if (image && image.size > 0) {
      const imgDir = path.join(process.cwd(), 'public/img');
      await fs.mkdir(imgDir, { recursive: true });
      const bufferData = Buffer.from(await image.arrayBuffer());
      const timestamp = new Date().getTime();
      const fileExtension = path.extname(image.name) || '.jpg';
      const fileName = `${timestamp}${fileExtension}`;
      const imageSavePath = path.join(imgDir, fileName);
      await fs.writeFile(imageSavePath, bufferData);
      imagePath = `/img/${fileName}`;
    }

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        image: imagePath || null,
        province: province || null,
        amphoe: amphoe || null,
        district: district || null,
        zone: zone || null,
      },
    });

    const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
    await sendTelegram(
      `○ <b>สมัครสมาชิก</b>\n` +
      `${firstName} ${lastName}\n` +
      `<i>${email}</i>\n` +
      `<code>${now}</code>`
    )

    return NextResponse.json({ message: 'ลงทะเบียนสำเร็จ', userId: newUser.id }, { status: 200 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้ โปรดลองอีกครั้ง' }, { status: 500 });
  }
}
