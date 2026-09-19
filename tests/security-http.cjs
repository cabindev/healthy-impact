// Local smoke test only; no real account, email delivery or survey mutation.
const assert = require('node:assert/strict')
const base = 'http://127.0.0.1:3011'
async function main() {
  for (const route of ['/dashboard', '/dashboard/users', '/dashboard/map', '/dashboard/surveys', '/dashboard/surveys/1/edit']) {
    const res = await fetch(base + route, { redirect: 'manual' })
    assert.equal(res.status, 307, route)
    assert.match(res.headers.get('location'), /\/auth\/signin/)
    await res.body?.cancel()
  }
  const badAuth = await fetch(base + '/dashboard', { headers: { Authorization: 'Bearer %' }, redirect: 'manual' })
  assert.equal(badAuth.status, 307)
  await badAuth.body?.cancel()
  const exportRes = await fetch(base + '/api/report/export')
  assert.equal(exportRes.status, 401)
  await exportRes.body?.cancel()
  for (const token of [undefined, null, { not: null }, 'bad']) {
    const res = await fetch(base + '/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: 'test-only-password' }) })
    assert.equal(res.status, 400)
    await res.body?.cancel()
  }
  const image = await fetch(base + '/img/1781081266728.jpg', { method: 'HEAD' })
  assert.equal(image.headers.get('content-security-policy'), "default-src 'none'; sandbox")
  assert.equal(image.headers.get('content-disposition'), 'attachment')
  assert.equal(image.headers.get('x-content-type-options'), 'nosniff')
  console.log('Local HTTP security smoke checks passed: dashboard denial, malformed bearer, export denial, reset-token validation and legacy upload headers.')
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
