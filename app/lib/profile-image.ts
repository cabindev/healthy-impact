import sharp from 'sharp'
import { RequestError } from '@/app/lib/security-request'

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
export async function profileImage(file: File): Promise<Buffer> {
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new RequestError('รูปภาพต้องมีขนาดไม่เกิน 2 MB')
  const bytes = Buffer.from(await file.arrayBuffer())
  // Check signatures before invoking a decoder, excluding SVG, HTML, AVIF and other formats.
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  if (!jpeg && !png && !webp) throw new RequestError('รองรับเฉพาะรูป JPEG, PNG หรือ WebP')
  try {
    return await sharp(bytes, { limitInputPixels: 16_000_000, failOn: 'warning' })
      .rotate().resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
  } catch { throw new RequestError('ไฟล์รูปภาพไม่ถูกต้องหรือมีความละเอียดสูงเกินกำหนด') }
}
