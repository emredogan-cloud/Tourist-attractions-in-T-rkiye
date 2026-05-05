# CLAUDE.md — Engineering Charter

> Türkiye Tourism Platform. This file is the **non-negotiable contract** for every code change in this repository. Read before every phase. Update when discipline drifts.

---

## 1. Engineering Rules (Strict)

1. **No duplication.** If a function, type, or pattern already exists, use it. Search before writing. Shared code lives in `packages/*` (or `src/lib/*` for monolithic mode).
2. **Phase-based discipline.** Implement one ROADMAP phase at a time. Do not start a phase before its dependencies are merged. Do not pull features forward.
3. **Production-grade only.** Every line is shippable: typed, validated, error-handled, observable. No `// TODO`, no `any`, no `console.log` in app code.
4. **Justify every decision.** When the roadmap allows two paths, log the choice and rationale in `PROJECT_STATE.md → Decisions Log`. Surprising choices need a one-liner reason.
5. **No cleanup commits.** Don't refactor unrelated code while doing a phase. File a follow-up entry in PROJECT_STATE.md.
6. **No half-implementations.** A phase is done when build passes, types pass, tests pass, and the feature is exercisable end-to-end (UI → API → DB → back).
7. **One commit per phase.** Commit message: `phase(N): <name> completed`. Push after every phase.

---

## 2. Anti-Duplication Protocol

Before adding new code, in this order:
1. Grep the repo for the symbol or behavior.
2. Read the surrounding module — extend, don't fork.
3. If two implementations would diverge, write **one** with a parameter, not two.
4. Reuse `prisma` client, `apiClient` HTTP wrapper, `logger`, `redis`, `i18n`, `auth`, `config` singletons. Never re-instantiate.

---

## 3. Production-Grade Code Requirements

- **TypeScript strict.** `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. No `any`, no `// @ts-ignore`.
- **Validation at every boundary.** Inbound HTTP via `zod` schemas. Outbound APIs typed via DTOs.
- **Error handling.** Throw typed `AppError` subclasses; HTTP layer maps them to RFC 7807 problem responses. Never swallow errors.
- **Logging.** Structured (`pino`), with `requestId`, `userId?`, `route`, `latency`. Never log secrets or full request bodies.
- **Idempotency.** Any mutating endpoint that can be retried (webhooks, payments, push) accepts an `Idempotency-Key`.
- **Caching.** All public reads ship with `Cache-Control` + `ETag`. Cache invalidation is event-driven, not time-bombed.
- **Migrations.** All schema changes via Prisma migrations. Never `prisma db push` in any branch except local dev.

---

## 4. Security Standards

- **Headers:** Helmet defaults + strict CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimized.
- **Auth:** Sessions are httpOnly + secure + sameSite=lax cookies. CSRF on state-changing endpoints (double-submit cookie). Tokens short-lived; refresh rotates.
- **Authorization:** Default deny. Every handler asserts the caller's permission explicitly. No "is admin" checks via implicit role string match.
- **Input:** Zod-validated. SQL via Prisma — no raw queries except PostGIS / pgvector with parameterised inputs.
- **Output:** HTML user content sanitized with `isomorphic-dompurify`. Never `dangerouslySetInnerHTML` without sanitization.
- **Secrets:** `.env` is gitignored. `.env.example` lists keys with empty values. Never commit credentials.
- **PII / KVKK:** Personal data flows logged with purpose tag. Soft-delete with anonymization on user deletion.

---

## 5. Performance Standards

- **API p95 < 300ms** on cached reads, < 800ms on DB-bound reads.
- **Web LCP < 2.5s, INP < 200ms, CLS < 0.1** on 4G.
- **Bundle:** Per-route JS budget 180kB gzipped. Maps and editor code-split via `next/dynamic`.
- **Images:** Always `next/image` with explicit width/height; AVIF/WebP via Cloudflare loader.
- **Indexes:** Every WHERE / JOIN column gets an index. Geo via GIST, vector via HNSW.
- **N+1:** Forbidden. Use Prisma `include` / `select` deliberately; review query counts in tests.

---

## 6. Error Handling Standards

- One `AppError` hierarchy in `src/lib/errors.ts`. Domain errors extend it (`NotFoundError`, `ValidationError`, `AuthError`, `RateLimitError`, `UpstreamError`).
- Controllers/route handlers wrap calls in try/catch only to translate domain errors to HTTP. Service layer throws — never returns `null` to mean "missing".
- External API calls use a circuit breaker (`@upstash/ratelimit` + retry-after) and a 3-second hard timeout.
- All errors observable in Sentry with breadcrumbs. PII scrubbed.

---

## 7. Layered Separation

```
src/
├── app/          # Next.js App Router (route handlers, pages, layouts)
├── components/   # React UI components (shadcn/ui based)
├── server/       # Server-only: services, repositories, jobs, providers
│   ├── services/   # Business logic — pure, testable
│   ├── providers/  # External integrations (Mapbox, Booking, Clerk, AI, …)
│   ├── jobs/       # Background workers
│   ├── auth/       # Auth abstraction
│   └── db/         # Prisma client, repositories, transaction helpers
├── lib/          # Shared utilities (errors, logger, config, i18n, http)
├── types/        # Cross-cutting TS types & DTOs
└── messages/     # i18n translation files (tr.json, en.json, …)
```

- **Frontend** depends on `lib/`, `components/`, `types/`, `messages/`. Never imports from `server/`.
- **Backend** (`server/`) never imports from `components/` or `app/`.
- **Providers** are interface-first. Concrete provider classes live behind a factory selected by env (`MOCK_PROVIDERS=true` for local).

---

## 8. Decision Discipline

- Every non-obvious technical choice → one line in `PROJECT_STATE.md → Decisions Log`. Format: `YYYY-MM-DD — Decision: X. Why: Y. Trade-off: Z.`
- "Random" or unjustified choices are forbidden. If two options are equivalent, pick the one cheapest to migrate away from.
- Roadmap deviations require a Decision Log entry referencing the phase.

---

## 9. Definition of Done (per phase)

A phase is **done** only when:
- [ ] All ROADMAP tasks for the phase are implemented (no TODOs)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes (unit + integration)
- [ ] `pnpm build` succeeds
- [ ] Manual smoke test of the new feature works against local stack
- [ ] `PROJECT_STATE.md` updated (current phase, completed list, systems, decisions)
- [ ] Git commit `phase(N): <name> completed` created and pushed
- [ ] No regressions in earlier-phase smoke tests

If any check fails, the phase is **not** done. Fix forward.

---

## 10. Forbidden

- Skipping phases or reordering without Decision Log entry
- Asking the user "should I continue?"
- Leaving `// TODO` markers instead of implementing
- Placeholder strings like "lorem ipsum" in seed data — use real curated content
- Catching errors and returning empty arrays / `null` to "make it pass"
- Adding a feature flag to ship broken code
- Reaching outside the layer boundaries above
- Committing without running typecheck + build

---

## 11. Pragmatic Adaptations (Single-Session Constraint)

Since this codebase is being built in one autonomous session without access to provisioning external SaaS:

- **Auth (Clerk):** abstracted behind `AuthProvider` interface. A `MockAuthProvider` (cookie-signed sessions, in-memory user store backed by Prisma) ships in this branch. Clerk integration is a drop-in swap when keys are available.
- **Maps (Mapbox):** MapLibre GL renders OpenFreeMap tiles by default. Mapbox token wired but optional.
- **Booking / Foursquare:** providers behind an interface. Mock provider returns deterministic fixture data for testing. Real keys swap in via env.
- **AI (Anthropic):** chat endpoint shipped with a `MockAIProvider` returning canned cited responses; real Claude wired when `ANTHROPIC_API_KEY` is set.
- **Mobile (Phase 8):** project scaffold with Expo config + screen wireframes. Store submission is out of session scope.
- **Deployment (Phase 0/16):** infra-as-code files + CI workflows authored. Provisioning to Vercel/Railway/AWS is out of session scope.

These adaptations are recorded in `PROJECT_STATE.md → Decisions Log`. They preserve the architecture so production swap-in is mechanical.
