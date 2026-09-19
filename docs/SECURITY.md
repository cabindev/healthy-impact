# Security update — 2026-09-19

## Deployment

1. Install the committed lockfile with `npm ci` (Node.js >= 22).
2. Run `npx prisma migrate deploy` before starting the new application. This adds only `SecurityRateLimit`; it does not rewrite user/survey data.
3. Run `npm run test:security` and `npm run build`, then restart the Next.js/custom-server process.
4. Set `NEXTAUTH_URL` to the real HTTPS origin in production, and retain a strong `NEXTAUTH_SECRET` in secret storage.

The migration has been applied to the local `healthy-impact` database. Production deployment/migration has not been performed.

Existing sessions must sign in again: old JWTs have no `sessionVersion`. Existing reset links must be requested again because only SHA-256 token digests are accepted now. New/changed passwords need at least 6 characters and at most 72 UTF-8 bytes (bcrypt limit); existing passwords can still sign in.

## Controls

- Every dashboard page and the server layout check the live authenticated role before loading data. Proxy is an additional check only; malformed tokens fail closed.
- Each JWT refresh reads the user from MySQL. Deleted accounts and changed `lastPasswordReset` versions are rejected. Role/password changes update that timestamp. Client session updates cannot set names or privileges.
- Reset tokens must be 64 lowercase hexadecimal characters, are generated with 32 random bytes, are stored as SHA-256 digests, expire after one hour, and are consumed by a conditional update (concurrent use/replay fails).
- Forgot-password responses do not reveal whether the account exists. SMTP errors are also generic. Reset messages use plain text, trusted origin configuration and TLS.
- Rate limiting is shared across application workers/servers via MySQL, not process memory or untrusted forwarded IP headers. It fails closed on database errors. Global endpoint budgets supplement per-email/token budgets. Fixed windows may allow up to twice the limit across a window boundary. Tune budgets for legitimate traffic; malicious flooding can temporarily exhaust a global budget, so production edge-level throttling is still useful.
- Upload requests are bounded while streaming. Profile images are limited to 2 MiB and 16 million pixels, signature checked for JPEG/PNG/WebP, re-encoded to WebP, stripped of metadata and assigned UUID filenames. SVG/HTML/AVIF are rejected. Legacy `/img` files get sandbox CSP and attachment headers in both Next.js and `server.js`.
- ADMIN can edit, verify, unverify, assign area and delete only surveys they created. SUPERADMIN can manage all. Bulk assignment rolls back if any selected record is unauthorized. Content/area changes clear the verification stamp. Administrators still retain the existing application permission to read/export surveys across the system.
- Excel output uses `write-excel-file` instead of the vulnerable npm `xlsx` package. Empty/invalid explicit ID selections fail rather than falling back to all records. Downloads use `private, no-store`.

## Dependencies

Next.js/eslint-config-next 16.3.5; NextAuth 4.24.15; React 19.3.0; Nodemailer 10.0.10; sharp 0.35.4. The lockfile also updates transitive dependencies.

Two deliberate overrides:

- `next-auth > nodemailer`: uses the patched root Nodemailer. This application uses CredentialsProvider only, not NextAuth's EmailProvider. The application's reset email uses Nodemailer's SMTP API directly. Reassess compatibility if an email auth provider is introduced.
- `deepmerge-ts` 8.0.2: replaces the vulnerable Prisma-config dependency without downgrading Prisma. Prisma generation, migration and build are verified with this override.

`npm audit` reported zero vulnerabilities after the dependency update. This is a registry scan at this point in time, not a guarantee of absence of vulnerabilities.

## Verification

`npm run test:security` uses actual application entry points with mocked DB/mail/file-write boundaries. It covers malformed reset tokens, replay/concurrency guards, generic reset responses, session invalidation and client-claim rejection, real image decoding, request size limits, ownership predicates, shared-limit handling, and actual XLSX serialization (Thai text, numbers and formula-like text).

No user passwords, health records or production accounts are changed by these tests. SMTP delivery and production proxy/TLS/WAF configuration require deployment-environment checks.
