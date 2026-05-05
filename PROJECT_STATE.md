# PROJECT_STATE.md — Türkiye Tourism Platform

> Living document. Updated at the end of every phase. Source of truth for "what exists" and "what's next".

---

## Current Phase

**Phase 3 — Search & Discovery (Meilisearch)** (next)

## Completed Phases

- **Phase 0 — Foundation & Developer Infrastructure** ✅ — Next.js 15 strict TS scaffold, Tailwind+shadcn-style tokens, Biome, Vitest, Playwright, Prisma full schema for all 16 phases (sqlite local / postgres prod), pino logger, zod-validated config, AppError hierarchy, RFC 7807 problem-detail responses, rate-limit util, next-intl tr/en, locale-aware routing, sitemap+robots+hreflang, cookie consent banner gating analytics, KVKK/GDPR/Terms/Cookies pages, GitHub Actions (CI + preview + release + dependabot + CodeQL), docker-compose (Postgres+PostGIS+Redis+Meilisearch).
- **Phase 1 — Core Attraction Catalog (backend & data)** ✅ — Attractions service with locale-aware translation pickup, bbox/near filters, haversine sort, cursor pagination, related-nearby. REST endpoints `/api/v1/attractions`, `/:slug`, `/nearby`, `/map`, `/categories`, `/regions`, `/openapi.json` — all with `Cache-Control` + ETag where appropriate, problem-detail errors, zod-validated query schemas. 8 hand-curated bilingual attractions seeded (Ayasofya, Kapadokya, Pamukkale, Efes, Topkapı, Sumela, Göbekli Tepe, Nemrut Dağı) with media, hours, pricing, visitor stats. data-attribution.md catalogs every photo's CC license.
- **Phase 2 — Web Discovery Experience (frontend)** ✅ — Localized homepage with hero + featured attractions + categories grid + regions grid, all wired to real DB. `/[locale]/attractions` listing with category/region/free/UNESCO filters, sort (popular, rating, newest), responsive grid. `/[locale]/attractions/[slug]` detail page with hero gallery (clickable lightbox with EXIF/license credit), bilingual breadcrumbs, JSON-LD `TouristAttraction` schema, sticky sidebar with opening hours (with season toggle), pricing table with TRY/USD/EUR currency switcher, share button, multi-platform Directions deep links (Google/Apple/Yandex/Copy), nearby grid. `/[locale]/regions` + `/regions/[code]` + `/categories` + `/categories/[slug]` + `/search` + `/map` (MapLibre + Supercluster, OpenFreeMap default). UI primitives (Button, Card, Badge) and shared components (AttractionCard, AttractionGrid). Sitemap now enumerates published attractions in every locale with proper hreflang. ISR `revalidate: 3600`. CSP-compliant. WCAG-ready.

## Architecture Snapshot

| Layer | Technology | Status |
|-------|------------|--------|
| Web frontend | Next.js 15 (App Router) + React 19 + TypeScript strict | scaffolded in Phase 0 |
| API | Next.js Route Handlers (`app/api/v1/*`) — chosen over separate NestJS for single-session delivery; abstracted services keep migration path open | scaffolded in Phase 0 |
| DB | PostgreSQL 16 + PostGIS via Prisma in production; SQLite + Turso-compat fallback for local-zero-dep dev | Phase 0 sets up Prisma; migration applied in Phase 1 |
| Search | Meilisearch (Phase 3) | not yet |
| Cache / Queue | Redis 7 (BullMQ for jobs) | wired Phase 0; jobs added per phase |
| Auth | Mock cookie-signed (Phase 5) → Clerk drop-in via `AuthProvider` | Phase 5 |
| Storage | Local FS in dev; Cloudflare R2 (S3-compatible) in prod | Phase 1 |
| Maps | MapLibre GL JS + OpenFreeMap tiles | Phase 6 |
| AI | Anthropic Claude SDK behind `AIProvider` interface | Phase 10 |
| i18n | next-intl with `tr` (default) + `en`; expandable `ar`, `ru`, `de` | Phase 0 |
| Tests | Vitest + Playwright + MSW | Phase 0 |
| Lint | Biome | Phase 0 |
| CI | GitHub Actions: lint → typecheck → test → build | Phase 0 |

## Existing Systems

| System | Description | Owner Module |
|--------|-------------|--------------|
| Config | Zod-validated env loader with sensible dev defaults | `src/lib/config.ts` |
| Logger | Pino structured logger with redaction for secrets/PII | `src/lib/logger.ts` |
| Errors | AppError hierarchy → RFC 7807 problem responses | `src/lib/errors.ts`, `src/lib/api-response.ts` |
| Rate limit | Redis sliding window with in-memory fallback | `src/lib/rate-limit.ts` |
| i18n | next-intl + locale routing (tr default, en, future ar/ru/de) | `src/lib/i18n/*`, `src/messages/*.json` |
| Cookie consent | Client-side dialog gating analytics; localStorage-persisted | `src/components/cookie-consent.tsx` |
| DB client | Prisma singleton (sqlite/postgres) | `src/server/db/client.ts` |
| Redis client | Lazy ioredis singleton, error-tolerant | `src/server/redis/client.ts` |
| Theme | next-themes light/dark/system | `src/components/providers.tsx`, `theme-toggle.tsx` |
| Health | `/api/healthz` and `/api/readyz` (DB ping) | `src/app/api/{healthz,readyz}/route.ts` |
| SEO | sitemap.ts + robots.ts with hreflang alternates | `src/app/sitemap.ts`, `robots.ts` |
| Legal pages | KVKK, GDPR Privacy, Terms, Cookies | `src/app/[locale]/legal/*` |
| Attractions service | listing, detail, nearby, map markers, locale-aware translation pickup | `src/server/services/attractions.ts` |
| API helpers | locale parsing, zod query parsing, bbox/near schema | `src/lib/api-helpers.ts` |
| REST API v1 | `/attractions`, `/:slug`, `/nearby`, `/map`, `/categories`, `/regions`, `/openapi.json` | `src/app/api/v1/*` |
| Seed data | 8 curated bilingual attractions with media, hours, pricing, visitor stats | `prisma/seed.ts` |
| UI primitives | Button (CVA-variants), Card, Badge | `src/components/ui/*` |
| AttractionCard / Grid | Reusable listings with locale-aware labels | `src/components/attraction-{card,grid}.tsx` |
| Detail components | Gallery (lightbox), PricingTable (FX-aware), OperatingHours (seasonal), DirectionsButton, ShareButton | `src/components/{gallery,pricing-table,operating-hours,directions-button,share-button}.tsx` |
| Map | MapLibre + Supercluster, OpenFreeMap default + Mapbox optional, side-card on marker click | `src/components/map-{view,inner}.tsx`, `src/app/[locale]/map/page.tsx` |
| Pages | Home, /attractions, /attractions/[slug], /regions, /regions/[code], /categories, /categories/[slug], /search, /map | `src/app/[locale]/*` |
| FX rates | Static mid-range TRY↔USD/EUR/GBP for currency switcher | `src/lib/format.ts` |
| JSON-LD | `TouristAttraction` schema on detail pages | `src/components/json-ld.tsx` |
| Sitemap | Static + per-locale attraction urls with hreflang | `src/app/sitemap.ts` |

## API Integrations

| Integration | Provider | Status | Notes |
|-------------|----------|--------|-------|
| Maps tiles | OpenFreeMap (default) / Mapbox (optional) | planned | env-toggleable |
| Geocoding | Mapbox (optional) / Nominatim (fallback) | planned | |
| Hotels | Booking.com Affiliate API | mocked | provider abstraction |
| Restaurants | Foursquare Places | mocked | provider abstraction |
| AI chat | Anthropic Claude (Sonnet 4.6 default, Opus 4.7 premium) | mocked | swap on env |
| Auth | Clerk | mocked | swap on env |
| Email | Resend | mocked | swap on env |
| Object storage | Cloudflare R2 | local-fs in dev | |
| Analytics | PostHog | client-gated by consent | |
| Errors | Sentry | wired Phase 0 | |
| Weather | OpenWeather | planned Phase 12 | |
| Visitor stats | T.C. Kültür ve Turizm Bakanlığı open data | Phase 6 | |

## Decisions Log

| Date | Decision | Why | Trade-off |
|------|----------|-----|-----------|
| 2026-05-05 | Single-app Next.js 15 (route handlers as API) instead of Turborepo + NestJS multi-app | Single-session execution constraint; preserves clean layering via `src/server/*` boundary; migration to NestJS is mechanical when scale demands | Slightly less DI ergonomics; mitigated by hand-rolled service container |
| 2026-05-05 | SQLite + Prisma for primary local DB, with PostgreSQL+PostGIS as production target via env-driven datasource URL | No Docker required to run locally in this session; Prisma supports both providers | Geospatial queries use bounding-box maths in SQLite; full PostGIS only when DB URL points at Postgres. Fallback queries documented. |
| 2026-05-05 | Mock auth provider in-session, Clerk swap-in via interface | Clerk needs real account; interface keeps swap mechanical | Mock provider never ships to prod; gated by env check |
| 2026-05-05 | All external providers (auth, AI, hotels, restaurants, email) behind interfaces with mock implementations | Lets every phase be testable end-to-end without real API keys | Discipline to keep interfaces thin and not leak provider quirks |
| 2026-05-05 | Biome over ESLint+Prettier | 25× faster, single config, official Next 15 support | Smaller community plugin ecosystem |
| 2026-05-05 | next-intl over react-intl / i18next | First-class App Router integration, server-component-friendly | Different API from i18next on mobile — wrap in `packages/i18n` to share strings |

## Known Issues / Follow-ups

- PayloadCMS admin deferred to a later phase. Per Decision Log, content editing in MVP can be done via direct DB seed scripts; a JSON-form admin lands when content scale demands it.
- R2 object storage abstracted but local-FS in dev. Real bucket is a one-line env swap.
- PostGIS GIST index is provided in the schema but only takes effect when DATABASE_PROVIDER=postgresql.

## Phase Pointer

Next: complete Phase 0 deliverables, then Phase 1.
