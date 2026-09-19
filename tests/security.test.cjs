const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { createHash } = require('node:crypto')

// Load the real TS entry points with explicit side-effect boundaries. No real DB/mail/filesystem writes.
function loader(mocks = {}) {
  const cache = new Map()
  function load(file) {
    file = path.resolve(file)
    if (cache.has(file)) return cache.get(file)
    const box = { exports: {}, console, Buffer, process: { env: { NEXTAUTH_URL: 'https://example.invalid', NODE_ENV: 'test' }, cwd: () => '/isolated-test' }, Date, TextEncoder, TextDecoder, Request, Response, File, Blob, FormData, Uint8Array, URL }
    cache.set(file, box.exports)
    box.require = name => {
      if (Object.hasOwn(mocks, name)) return mocks[name]
      if (name.startsWith('./')) return load(path.resolve(path.dirname(file), name) + '.ts')
      if (name.startsWith('@/')) return load(name.slice(2) + '.ts')
      if (name === 'next/server') return { NextResponse: { json: (data, options = {}) => Response.json(data, options) } }
      if (name === '@/app/lib/prisma' || name === '@prisma/client') throw Error('DB access forbidden in tests')
      return require(name)
    }
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, box, { filename: file })
    return box.exports
  }
  return load
}
const rawToken = 'a'.repeat(64)
const digest = createHash('sha256').update(rawToken).digest('hex')
const jsonRequest = body => new Request('https://example.invalid/api', { method: 'POST', body: JSON.stringify(body) })
const mockLimits = { '@/app/lib/rate-limit': { rateLimit: async () => {} } }

test('reset rejects absent/null/object/short tokens before querying a user', async () => {
  let queries = 0
  const load = loader({ ...mockLimits, '@/app/lib/prisma': { prisma: { user: { findFirst: async () => { queries++; return null } } } } })
  const { POST } = load('app/api/auth/reset-password/route.ts')
  for (const token of [undefined, null, {}, { not: null }, '', 'abc']) assert.equal((await POST(jsonRequest({ token, password: 'long-password-123' }))).status, 400)
  assert.equal(queries, 0)
})

test('reset hashes token, rejects weak passwords, atomically prevents replay and expires sessions', async () => {
  let count = 1, update
  const load = loader({ ...mockLimits, bcrypt: { hash: async () => 'new-hash' }, '@/app/lib/prisma': { prisma: { user: {
    findFirst: async ({ where }) => { assert.equal(where.resetToken, digest); assert.ok(where.resetTokenExpiresAt.gt); return { id: 2 } },
    updateMany: async args => { update = args; const result = count; count = 0; return { count: result } },
  } } } })
  const { POST } = load('app/api/auth/reset-password/route.ts')
  assert.equal((await POST(jsonRequest({ token: rawToken, password: 'weak' }))).status, 400)
  const results = await Promise.all([POST(jsonRequest({ token: rawToken, password: 'long-password-123' })), POST(jsonRequest({ token: rawToken, password: 'long-password-123' }))])
  assert.deepEqual(results.map(r => r.status).sort(), [200, 400])
  assert.equal(update.where.resetToken, digest)
  assert.equal(update.data.resetToken, null)
  assert.ok(update.data.lastPasswordReset instanceof Date)
})

test('forgot password has identical response for missing and existing accounts and stores only digest', async () => {
  let count = 0, data, sent = 0, message
  const load = loader({ ...mockLimits, nodemailer: { createTransport: () => ({ sendMail: async mail => { sent++; message = mail.text } }) }, '@/app/lib/prisma': { prisma: { user: { updateMany: async args => { data = args.data; return { count } } } } } })
  const { POST } = load('app/api/auth/forgot-password/route.ts')
  const missing = await POST(jsonRequest({ email: 'audit@example.invalid' }))
  count = 1
  const existing = await POST(jsonRequest({ email: 'audit@example.invalid' }))
  assert.equal(missing.status, existing.status)
  assert.deepEqual(await missing.json(), await existing.json())
  assert.equal(sent, 1)
  const token = message.match(/token=([a-f0-9]{64})/)[1]
  assert.equal(data.resetToken, createHash('sha256').update(token).digest('hex'))
  assert.notEqual(data.resetToken, token)
})

test('session rejects legacy/deleted/revoked accounts and ignores client role/name updates', async () => {
  let current = { id: 1, role: 'ADMIN', firstName: 'Real', lastName: 'Name', email: 'audit@example.invalid', lastPasswordReset: null }
  const load = loader({ ...mockLimits, '@/app/lib/prisma': { prisma: { user: { findUnique: async () => current } } }, '@/app/lib/telegram': { sendTelegram: async () => {} } })
  const { callbacks } = load('app/lib/configs/auth/authOptions.ts').default
  let token = await callbacks.jwt({ token: { id: 1, role: 'ADMIN' } })
  assert.equal(token.invalid, true)
  token = await callbacks.jwt({ token: { id: 1, role: 'ADMIN', sessionVersion: 0 }, trigger: 'update', session: { role: 'SUPERADMIN', firstName: 'Fake' } })
  assert.equal(token.role, 'ADMIN'); assert.equal(token.firstName, 'Real')
  current.lastPasswordReset = new Date()
  assert.equal((await callbacks.jwt({ token })).invalid, true)
  current = null
  assert.equal((await callbacks.jwt({ token })).invalid, true)
})

test('profile images reject HTML/SVG/AVIF and oversized uploads; real PNG becomes WebP', async () => {
  const load = loader()
  const { profileImage } = load('app/lib/profile-image.ts')
  for (const text of ['<html>test</html>', '<svg/>', '....ftypavif']) await assert.rejects(profileImage(new File([text], 'fake.png', { type: 'image/png' })))
  await assert.rejects(profileImage(new File([Buffer.alloc(2 * 1024 * 1024 + 1)], 'large.jpg')))
  const sharp = require('sharp')
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#00ff00' } }).png().toBuffer()
  const output = await profileImage(new File([png], 'image.png'))
  assert.equal((await sharp(output).metadata()).format, 'webp')
})

test('request body is bounded even without Content-Length', async () => {
  const { boundedBody, readJson } = loader()('app/lib/security-request.ts')
  await assert.rejects(boundedBody(new Request('https://example.invalid', { method: 'POST', body: 'x'.repeat(30) }), 10), e => e.status === 413)
  await assert.rejects(readJson(jsonRequest(null)), e => e.status === 400)
})

test('all survey write operations enforce ownership, including bulk writes', async () => {
  const writes = []
  const prisma = { survey: { update: async args => { writes.push(args); return {} }, updateMany: async args => { writes.push(args); return { count: 2 } } } }
  prisma.$transaction = callback => callback(prisma)
  const load = loader({ '@/app/lib/prisma': { prisma }, '@/app/lib/auth': { requireAdmin: async () => ({ user: { id: 17, role: 'ADMIN', firstName: 'Audit', lastName: 'Test' } }), canManageSurvey: () => true }, 'next/cache': { revalidatePath: () => {} }, 'next/navigation': { redirect: () => {} } })
  const actions = load('app/actions/survey.ts')
  await actions.updateSurvey(22, { siteType: 'VILLAGE' })
  await actions.verifySurvey(22)
  await actions.unverifySurvey(22)
  await actions.setSurveyArea([22, 23], { tambon: 'test', amphoe: '', province: 'test' })
  assert.equal(writes.length, 4)
  writes.forEach(args => assert.equal(args.where.creatorId, 17))
  assert.equal(writes[0].data.verifiedAt, null)
  assert.equal(writes[3].data.verifiedAt, null)
})

test('rate limit enforces shared DB count and never stores raw account names', async () => {
  let count = 0, key
  const tx = { securityRateLimit: { upsert: async args => { key = args.where.key; count++; return { count } } } }
  const load = loader({ '@/app/lib/prisma': { prisma: { $transaction: cb => cb(tx), $executeRaw: async () => 0 } } })
  const { rateLimit } = load('app/lib/rate-limit.ts')
  await rateLimit('test', 'person@example.invalid', 1, 60_000)
  await assert.rejects(rateLimit('test', 'person@example.invalid', 1, 60_000), e => e.status === 429)
  assert.match(key, /^[a-f0-9]{64}$/)
})

test('Excel export preserves Thai text/numbers, treats formula-like text as text, and enforces authorization', async () => {
  let authorized = false, queries = 0
  const load = loader({
    '@/app/lib/auth': { requireAdmin: async () => { if (!authorized) throw Error('Unauthorized') } },
    '@/app/lib/prisma': { prisma: { survey: { findMany: async () => { queries++; return [{}] } } } },
    '@/app/lib/survey-export': { SURVEY_INCLUDE: {}, labeledSurvey: () => ({ 'ชื่อ': 'ทดสอบ', 'คะแนน': 7, 'ข้อความ': '=1+1' }) },
  })
  const { GET } = load('app/api/report/export/route.ts')
  assert.equal((await GET(new Request('https://example.invalid/api/report/export'))).status, 401)
  assert.equal(queries, 0)
  authorized = true
  assert.equal((await GET(new Request('https://example.invalid/api/report/export?ids=invalid'))).status, 400)
  assert.equal(queries, 0)
  const response = await GET(new Request('https://example.invalid/api/report/export?ids=1'))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  const { unzipSync, strFromU8 } = require('fflate')
  const zip = unzipSync(new Uint8Array(await response.arrayBuffer()))
  const xml = Object.values(zip).map(bytes => strFromU8(bytes)).join('\n')
  assert.match(xml, /ทดสอบ/)
  assert.match(xml, /=1\+1/)
  assert.match(xml, /<v>7<\/v>/)
  assert.doesNotMatch(xml, /<f[ >]/)
})
