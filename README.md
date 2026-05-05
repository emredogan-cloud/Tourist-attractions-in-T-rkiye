# 🇹🇷 Türkiye Tourism Platform

> A bilingual (Turkish / English) discovery platform for every notable tourist attraction in Türkiye — built end-to-end from the [ROADMAP](./ROADMAP.md).

[![CI](https://img.shields.io/badge/ci-passing-success)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)
[![Node](https://img.shields.io/badge/node-22%20LTS-green)](https://nodejs.org)

---

## What's inside

A single Next.js 15 application with strict layered architecture, delivering the full feature set of all 16 ROADMAP phases:

- **Catalog** — bilingual attractions with rich media, opening hours, ticket pricing, geospatial queries
- **Search** — Meilisearch-powered with Turkish-aware typo tolerance + DB fallback
- **Reviews** — auto-moderation pipeline (profanity + spam + AI moderation) with photo uploads
- **Auth** — provider-abstracted (mock + Clerk drop-in), KVKK-/GDPR-compliant data export & deletion
- **Maps** — MapLibre GL with supercluster, deep-link directions, visitor stats from Bakanlık open data
- **Nearby** — Booking.com / Foursquare provider abstraction with affiliate disclosure
- **Itineraries** — drag-and-drop builder, share links, PDF export
- **AI Concierge** — Claude-powered chat with citation enforcement and per-user budget
- **Personalization** — preference quiz + content-based + collaborative recommendations
- **Events** — festivals, exhibitions, weather warnings, "open now" badges
- **Accessibility** — WCAG 2.1 AA targets, accessibility flags per attraction
- **Multi-language** — TR (default) + EN; expandable to AR (RTL), RU, DE
- **Monetization** — Türkiye+ premium tier, Stripe + Iyzico abstractions, B2B API keys

See [`PROJECT_STATE.md`](./PROJECT_STATE.md) for the live architecture snapshot and decision log, and [`CLAUDE.md`](./CLAUDE.md) for the engineering charter.

---

## Quickstart (< 5 minutes, zero external services)

Requirements: **Node 22+**, **pnpm 9+**.

```bash
git clone https://github.com/emredogan-cloud/Tourist-attractions-in-T-rkiye
cd Tourist-attractions-in-Türkiye
pnpm install
cp .env.example .env
pnpm db:push            # creates SQLite at prisma/dev.db with the full schema
pnpm db:seed            # 5 curated attractions, bilingual, with images
pnpm dev                # http://localhost:3000
```

Out of the box, everything works locally without a single API key:
- **Database:** SQLite (`prisma/dev.db`)
- **Cache / queue:** in-memory fallback (Redis is optional)
- **Search:** DB ILIKE fallback (Meilisearch is optional)
- **Auth:** mock cookie-signed sessions
- **AI / Maps / Hotels / Restaurants / Email / Payments:** mock providers behind interfaces

Switch any provider to its production counterpart by setting the corresponding env var (see `.env.example`).

### Optional: full prod-parity stack

```bash
docker compose up -d   # Postgres+PostGIS, Redis, Meilisearch
# Then in .env:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/turkiye_tourism?schema=public
# DATABASE_PROVIDER=postgresql
pnpm db:migrate
pnpm db:seed
pnpm search:reindex
```

---

## Scripts

| Script | What it does |
|--------|--------------|
| `pnpm dev` | Next.js dev server with HMR |
| `pnpm build` | Production build (runs Prisma generate first) |
| `pnpm start` | Run the production build |
| `pnpm lint` | Biome lint + organize imports |
| `pnpm typecheck` | TypeScript strict typecheck |
| `pnpm test` | Vitest unit + integration |
| `pnpm test:e2e` | Playwright end-to-end |
| `pnpm db:push` | Apply schema to SQLite without migration history |
| `pnpm db:migrate` | Create + apply a Prisma migration (Postgres) |
| `pnpm db:seed` | Insert 5 curated bilingual attractions + visitor stats |
| `pnpm search:reindex` | Bulk-reindex Meilisearch from Postgres |
| `pnpm stats:import <csv>` | Import Bakanlık visitor-stats CSV |

---

## Architecture

```
src/
├── app/                  # Next.js App Router (route handlers, pages, layouts)
│   ├── api/v1/*          # Public REST API (versioned, OpenAPI documented)
│   ├── api/internal/*    # Auth-only admin routes
│   └── [locale]/*        # Localized pages (tr default, en, …)
├── components/           # React UI (shadcn/ui-style; a11y-first)
├── server/               # Server-only domain code
│   ├── services/         # Business logic — pure, testable
│   ├── providers/        # External integrations behind interfaces
│   │   ├── auth/           # MockAuth + ClerkAuth
│   │   ├── ai/             # MockAI + AnthropicAI
│   │   ├── nearby/         # MockHotels + Booking, MockRestaurants + Foursquare
│   │   ├── search/         # MockSearch + Meilisearch
│   │   ├── email/          # MockEmail + Resend
│   │   ├── storage/        # LocalStorage + R2
│   │   └── payments/       # MockPayments + Stripe + Iyzico
│   ├── jobs/             # BullMQ background workers
│   └── db/               # Prisma client + repositories
├── lib/                  # Shared cross-cutting utilities
│   ├── config.ts         # Zod-validated env
│   ├── logger.ts         # pino structured logger
│   ├── errors.ts         # AppError hierarchy + Problem Details
│   ├── i18n/             # next-intl integration
│   ├── api-response.ts   # NextResponse wrappers (cached, problem)
│   ├── rate-limit.ts     # Redis sliding window with in-memory fallback
│   └── utils.ts          # Geo, slug, normalize, format helpers
├── messages/             # Locale JSONs (tr.json, en.json, …)
└── types/                # Cross-cutting TS types & DTOs
```

Provider lookup is selected by `*_PROVIDER` env vars and resolved through factories in `src/server/providers/index.ts`. Swapping the mock for a real provider is a one-line env change.

---

## Quality gates

Every PR runs:

1. **Biome** — formatting + linting (a11y rules enforced)
2. **TypeScript strict** — `noUncheckedIndexedAccess`, `noImplicitOverride`
3. **Vitest** — unit + integration with happy-dom
4. **Playwright** — Chromium e2e covering golden flows
5. **CodeQL** — SAST for JS/TS
6. **`pnpm build`** — full Next.js production build

Lighthouse CI thresholds (against staging): **Performance ≥ 90, A11y ≥ 95, SEO ≥ 95, Best Practices ≥ 95**.

---

## Privacy, KVKK & GDPR

- Cookie consent banner is shown before any analytics SDK initializes.
- KVKK Aydınlatma Metni and GDPR notice published at `/[locale]/legal/privacy` and `/[locale]/legal/kvkk`.
- Account deletion is a soft-delete that anonymizes reviews ("Anonymous Visitor") and schedules a hard-delete after 30 days; re-registration is held for 90 days.
- Data export endpoint `GET /api/v1/me/export` returns a complete JSON of user-owned data.
- Photo metadata records license and attribution; UGC images are EXIF-stripped server-side via `sharp`.
- All providers respect a "no PII to third parties" rule; affiliate redirects strip referrer details.

---

## License

MIT for the codebase. Attraction content sources are credited in [`docs/data-attribution.md`](./docs/data-attribution.md). Mapbox / Cloudflare / Booking.com / Foursquare data and trademarks remain under their respective licenses.

> Hayırlı yolculuklar 🇹🇷
