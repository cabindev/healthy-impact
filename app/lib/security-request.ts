import { NextResponse } from 'next/server'

export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

// Read incrementally: Content-Length alone can be absent or dishonest.
export async function boundedBody(req: Request, maxBytes: number): Promise<Uint8Array> {
  const length = Number(req.headers.get('content-length'))
  if (length > maxBytes) throw new RequestError('ข้อมูลมีขนาดใหญ่เกินกำหนด', 413)
  const reader = req.body?.getReader()
  if (!reader) throw new RequestError('ข้อมูลไม่ถูกต้อง')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw new RequestError('ข้อมูลมีขนาดใหญ่เกินกำหนด', 413)
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return bytes
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(await boundedBody(req, 8192)))
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError('ข้อมูลไม่ถูกต้อง')
    return value as Record<string, unknown>
  } catch (error) {
    if (error instanceof RequestError) throw error
    throw new RequestError('ข้อมูลไม่ถูกต้อง')
  }
}

export function requestError(error: unknown) {
  const status = error instanceof RequestError ? error.status : 503
  return NextResponse.json({ error: error instanceof RequestError ? error.message : 'ระบบไม่พร้อมใช้งาน กรุณาลองอีกครั้ง' }, { status, headers: { 'Cache-Control': 'no-store' } })
}
