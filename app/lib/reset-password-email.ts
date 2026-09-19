import { escapeHtml } from '@/app/lib/security-input'

/** Self-contained email: inline styles, table layout and no remote images or tracking. */
export function resetPasswordEmail(resetUrl: string) {
  const url = new URL(resetUrl)
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid reset URL')
  const href = escapeHtml(url.toString())
  return {
    subject: 'ตั้งรหัสผ่านใหม่ | Healthy Impact Survey',
    text: `Healthy Impact Survey\n\nตั้งรหัสผ่านใหม่ของคุณ\nเราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ\n\nเปิดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่:\n${url.toString()}\n\nลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุภายใน 1 ชั่วโมง\nรหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร\n\nหากคุณไม่ได้ส่งคำขอนี้ สามารถละเว้นอีเมลฉบับนี้ได้ รหัสผ่านของคุณจะยังไม่เปลี่ยนแปลง\n\nHealthy Impact Survey\nระบบแบบสอบถามเพื่อสุขภาวะที่ดี`,
    html: `<!doctype html>
<html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ตั้งรหัสผ่านใหม่ | Healthy Impact Survey</title></head>
<body style="margin:0;padding:0;background-color:#f3f6f4;color:#24352c;font-family:Tahoma,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">ตั้งรหัสผ่านใหม่อย่างปลอดภัย ลิงก์ของคุณมีอายุ 1 ชั่วโมง</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f6f4;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
<tr><td style="padding:28px 28px 24px;background-color:#14532d;border-radius:20px 20px 0 0;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td valign="middle" style="width:46px;height:46px;background-color:#dcfce7;border-radius:12px;text-align:center;font-size:18px;font-weight:bold;color:#14532d;">HI</td><td style="padding-left:14px;"><p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">Healthy Impact</p><p style="margin:4px 0 0;color:#bbf7d0;font-size:12px;letter-spacing:3px;">SURVEY</p></td></tr></table>
</td></tr>
<tr><td style="padding:32px 28px;background-color:#ffffff;border-left:1px solid #e3ebe5;border-right:1px solid #e3ebe5;">
<p style="margin:0 0 14px;color:#15803d;font-size:12px;font-weight:bold;letter-spacing:1px;">ดูแลความปลอดภัยของบัญชีคุณ</p>
<h1 style="margin:0 0 16px;font-size:28px;line-height:1.4;color:#163c26;">เริ่มต้นใหม่<br>ด้วยรหัสผ่านใหม่ของคุณ</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.9;color:#59685e;">เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณใน Healthy Impact Survey กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่และกลับไปใช้งานได้เลย</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" bgcolor="#15803d" style="border-radius:12px;mso-padding-alt:16px 24px;"><a href="${href}" style="display:block;padding:16px 24px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;text-align:center;border-radius:12px;">ตั้งรหัสผ่านใหม่ &rarr;</a></td></tr></table>
<p style="margin:14px 0 24px;font-size:12px;text-align:center;color:#68766d;">รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:16px 18px;background-color:#f0fdf4;border:1px solid #dcfce7;border-radius:12px;"><p style="margin:0 0 4px;font-size:14px;font-weight:bold;color:#166534;">ลิงก์นี้มีอายุ 1 ชั่วโมง</p><p style="margin:0;font-size:12px;line-height:1.8;color:#52665a;">ใช้ได้เพียงครั้งเดียว หากลิงก์หมดอายุ คุณสามารถขอลิงก์ใหม่ได้จากหน้าเข้าสู่ระบบ</p></td></tr></table>
<p style="margin:24px 0 8px;font-size:12px;line-height:1.8;color:#68766d;">หากกดปุ่มไม่ได้ ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
<p style="margin:0;font-size:11px;line-height:1.8;word-break:break-all;overflow-wrap:anywhere;"><a href="${href}" style="color:#15803d;text-decoration:underline;word-break:break-all;">${href}</a></p>
</td></tr>
<tr><td style="padding:20px 28px;background-color:#f9fbfa;border:1px solid #e3ebe5;border-radius:0 0 20px 20px;"><p style="margin:0;font-size:12px;line-height:1.9;color:#68766d;"><strong style="color:#43594b;">ไม่ได้เป็นผู้ส่งคำขอนี้?</strong><br>คุณสามารถละเว้นอีเมลฉบับนี้ได้ รหัสผ่านของคุณจะยังไม่เปลี่ยนแปลง กรุณาอย่าส่งต่อลิงก์นี้ให้ผู้อื่น</p></td></tr>
<tr><td align="center" style="padding:22px 16px;"><p style="margin:0;font-size:12px;font-weight:bold;color:#53695b;">Healthy Impact Survey</p><p style="margin:6px 0 0;font-size:11px;color:#7b8980;">ระบบแบบสอบถามเพื่อสุขภาวะที่ดี</p></td></tr>
</table></td></tr></table>
</body></html>`,
  }
}
