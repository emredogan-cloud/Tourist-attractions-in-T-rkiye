# PROJECT_STATE.md — Türkiye Tourism Platform

> Living document. Updated at the end of every phase. Source of truth for "what exists" and "what's next".

---

## Current Phase

**Phase 16 — Scale, Reliability & Multi-Region** (next; final phase)

## Completed Phases

- **Phase 0 — Foundation & Developer Infrastructure** ✅ — Next.js 15 strict TS scaffold, Tailwind+shadcn-style tokens, Biome, Vitest, Playwright, Prisma full schema for all 16 phases (sqlite local / postgres prod), pino logger, zod-validated config, AppError hierarchy, RFC 7807 problem-detail responses, rate-limit util, next-intl tr/en, locale-aware routing, sitemap+robots+hreflang, cookie consent banner gating analytics, KVKK/GDPR/Terms/Cookies pages, GitHub Actions (CI + preview + release + dependabot + CodeQL), docker-compose (Postgres+PostGIS+Redis+Meilisearch).
- **Phase 1 — Core Attraction Catalog (backend & data)** ✅ — Attractions service with locale-aware translation pickup, bbox/near filters, haversine sort, cursor pagination, related-nearby. REST endpoints `/api/v1/attractions`, `/:slug`, `/nearby`, `/map`, `/categories`, `/regions`, `/openapi.json` — all with `Cache-Control` + ETag where appropriate, problem-detail errors, zod-validated query schemas. 8 hand-curated bilingual attractions seeded (Ayasofya, Kapadokya, Pamukkale, Efes, Topkapı, Sumela, Göbekli Tepe, Nemrut Dağı) with media, hours, pricing, visitor stats. data-attribution.md catalogs every photo's CC license.
- **Phase 2 — Web Discovery Experience (frontend)** ✅ — Localized homepage with hero + featured attractions + categories grid + regions grid, all wired to real DB. `/[locale]/attractions` listing with category/region/free/UNESCO filters, sort (popular, rating, newest), responsive grid. `/[locale]/attractions/[slug]` detail page with hero gallery (clickable lightbox with EXIF/license credit), bilingual breadcrumbs, JSON-LD `TouristAttraction` schema, sticky sidebar with opening hours (with season toggle), pricing table with TRY/USD/EUR currency switcher, share button, multi-platform Directions deep links (Google/Apple/Yandex/Copy), nearby grid. `/[locale]/regions` + `/regions/[code]` + `/categories` + `/categories/[slug]` + `/search` + `/map` (MapLibre + Supercluster, OpenFreeMap default). UI primitives (Button, Card, Badge) and shared components (AttractionCard, AttractionGrid). Sitemap now enumerates published attractions in every locale with proper hreflang. ISR `revalidate: 3600`. CSP-compliant. WCAG-ready.
- **Phase 3 — Search & Discovery (Meilisearch)** ✅ — `SearchProvider` interface with two implementations: `MeilisearchProvider` (per-locale `attractions_{tr,en}` indexes, configured ranking rules, synonyms, stop-words, typo tolerance) and `DbSearchProvider` (Turkish-aware diacritic-insensitive in-memory ranking). Auto-selection: prefer Meili when healthy at boot, fall back to DB. `/api/v1/search` and `/api/v1/search/suggest` endpoints with rate limits (60/min and 120/min per IP). `<GlobalSearch>` component now has 200ms debounced autosuggest dropdown, recent searches in localStorage, ARIA combobox with keyboard navigation. `/[locale]/search` page with faceted filters (category, region) wired to provider facets. `pnpm search:reindex` CLI for full reindex. 8 search-provider tests pass.
- **Phase 5 — User Accounts, Auth & Favorites** ✅ — `AuthProvider` interface (Mock cookie-signed scrypt+HMAC + Clerk stub), KVKK/GDPR consent capture, soft-delete with anonymization + 30-day hard-delete + 90-day re-registration hold, `/me/export` GDPR data dump, favorites with optimistic toggle, full sign-in/up/profile/favorites/forgot pages, header user menu.
- **Phase 4 — Reviews, Ratings & Photos** ✅ — `ModerationProvider` interface with `LocalModerationProvider` (per-locale profanity wordlists, spam heuristics: account age, URL count, body length, repeat content; PII detection: TC kimlik, email, GSM, credit card patterns). `StorageProvider` interface with `LocalStorageProvider` (writes to `storage/local/`) + `R2StorageProvider` stub. Sharp-based image upload pipeline: EXIF strip, resize to 2000px, transcode to WebP. Reviews service: create with auto-mod (CLEAN→APPROVED, flagged→PENDING, with reasons), unique-per-attraction-per-user, daily quota of 5/user, helpful/report reactions, soft-delete that recomputes Attraction.averageRating. API: `/api/v1/attractions/[slug]/reviews` (GET+POST), `/api/v1/reviews/[id]` (DELETE), `/api/v1/reviews/[id]/helpful` (POST+DELETE), `/api/v1/reviews/[id]/report` (POST), `/api/v1/uploads` (multipart POST). UI: `<ReviewsSection>` on attraction detail with rating histogram, sort selector (recent/helpful/rating), per-card helpful + report buttons, locale-aware author display ("Anonymous Visitor" for deleted accounts). `<ReviewForm>` modal with star rating (with hover preview), title, body with character count + draft persistence in localStorage, KVKK consent checkbox required to submit. 8 review tests pass; 54 tests total.
- **Phase 6 — Maps, Directions & Visitor Stats** ✅ — Map foundation from Phase 2 retained. Added `getVisitorStats` service + `/api/v1/attractions/[slug]/visitor-stats` endpoint with optional `from=YYYY-MM` / `to=YYYY-MM` filters and 24h cache. `<VisitorStatsChart>` component (recharts BarChart) on attraction detail with year selector and locale-aware month labels + compact-notation Y-axis + Bakanlık source attribution. CSV import CLI `pnpm stats:import <csv-path>` with fuzzy slug-or-name matching for ingesting Bakanlık open-data dumps. DirectionsButton (Google/Apple/Yandex/Copy with iOS/Android UA detection) was shipped in Phase 2.
- **Phase 7 — Nearby Hotels & Restaurants** ✅ — `NearbyProvider` interface with `MockBookingProvider` and `MockFoursquareProvider` (deterministic seeded fixtures keyed by attraction lat/lng so the same attraction always gets the same nearby places — production swap drops in real Booking Affiliate / Foursquare clients). NearbyService caches results in `NearbyPlace` table with 7-day TTL, refreshes on stale, falls back to stale-cache on provider failure. `/api/v1/attractions/[slug]/nearby?type=hotel|restaurant` endpoint with distance/rating/price filters. `/api/v1/redirect/affiliate/[placeId]` records click in `AffiliateClick` (with attractionId, userId nullable, IP, locale, source, UA) and 302-redirects to provider URL; rate-limited 5/min/IP. `<NearbySection>` on attraction detail with Hotels/Restaurants tabs, prominent affiliate disclosure (TR: "Bu sayfadaki bazı bağlantılar ortaklık programları içerir…" / EN per ROADMAP), distance + rating + price-level cards, "Visit" button that opens redirect endpoint with `target=_blank rel="sponsored"`. 4 nearby-service tests pass; 58 tests total.
- **Phase 8 — Mobile App scaffold** ✅ (scaffold delivered; store submission deferred per Decision Log) — `apps/mobile/` Expo SDK 53 + expo-router + TypeScript strict project with: tab navigator (Home, Search, Map, Favorites, Profile), `attraction/[slug]` detail screen, onboarding modal. TanStack Query reused, i18next sharing the same `src/messages/{tr,en}.json` files via path-resolved imports, `expo-image` for performance, `react-native-maps` with Mapbox provider for native map. `app.json` declares deep-link schemes (`turkiye-tourism://` + universal links to `turkiye-tourism.app/attractions/*`), iOS bundle ID `app.turkiye-tourism`, Android package `app.turkiye_tourism`, Privacy permission strings for camera/photos/location. `eas.json` with development/preview/production build profiles + submit profiles for App Store + Play Store. Comprehensive `apps/mobile/README.md` with submission runbook (Apple Developer enrollment, store metadata, screenshot sizes, Privacy Nutrition Labels, EAS Update OTA). Root tsconfig + biome exclude `apps/**` so the web stack stays clean.
- **Phase 9 — Itinerary Planner & Trip Sharing** ✅ — Itinerary/Day/Stop services with full CRUD: `/api/v1/itineraries` (list/create), `/api/v1/itineraries/[id]` (get/patch/delete with owner check), `/api/v1/itineraries/[id]/clone` (deep-copy with rename), `/api/v1/itineraries/[id]/days` (add day), `/api/v1/itinerary-days/[dayId]` (delete day), `/api/v1/itinerary-days/[dayId]/stops` (add + reorder), `/api/v1/itinerary-days/[dayId]/optimize` (greedy nearest-neighbor route optimization), `/api/v1/itinerary-stops/[stopId]` (delete stop). Public share via `/[locale]/share/[token]` (read-only view available without auth). UI: `/[locale]/itineraries` listing + create form, `/[locale]/itineraries/[id]` editor with day cards, up/down stop reordering, optimize button, share/clone/print/export buttons. `/[locale]/itineraries/[id]/print` print-CSS view that becomes a PDF via browser print dialog (no @react-pdf/renderer dep needed). All endpoints enforce ownership.
- **Phase 10 — AI Travel Concierge** ✅ — `AIProvider` interface with `MockAIProvider` (deterministic, retrieves real attractions from DB, parses intent: itinerary days/city/themes; streams text + citation events + structured itinerary draft) and `AnthropicAIProvider` (Anthropic SDK with prompt caching on system prompt, model switch by `isPremium` to opus-4-7, automatic init via `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`, lazily required to keep cold start lean). SSE endpoint `POST /api/v1/concierge/chat` streaming `text`/`citation`/`itinerary`/`tokens`/`done`/`error` events. `concierge-budget` enforces per-user daily caps (free: 50k tokens + 30 msgs, premium: 1M + 500) with day-window reset, plus 10/h hard limit for anonymous IPs. ConciergeMessage rows persisted (sessionId, role, content, citations, tokens) for KVKK-compliant retention. UI: `/[locale]/concierge` chat page with example query chips, streaming text bubbles with attraction-card pill citations linked to detail pages, auto-scroll, "Save as itinerary" CTA when AI returns a draft (creates Itinerary + Days + Stops automatically using existing endpoints).
- **Phase 11 — Personalization & Recommendations** ✅ — `recommendForUser` content-based + collaborative-style hybrid: builds a profile vector from favorites (×2), recent reviews (×1.5), and explicit preferences (×3 themes / ×2.5 regions), then ranks all attractions by themeScore × 1.4 + regionScore + popularity × 0.6 + rating × 0.4, deduping seen items. Cold-start falls back to popularity. `similarTo` for the detail page uses category match (×5), region match (×2), proximity (≤200km×3), UNESCO co-listing (×1), plus rating/popularity. Endpoints: `GET /api/v1/recommendations`, `GET /api/v1/me/preferences` + `PUT`, `GET /api/v1/attractions/[slug]/similar`. UI: `/[locale]/preferences` quiz page (theme pills, region pills, budget/style/group radio chips), home "Recommended for you" section gated to authenticated users with non-empty profile.
- **Phase 12 — Events, Festivals & Real-Time Information** ✅ — Events service over the existing `Event` model with bilingual title/body, `EventType` enum (FESTIVAL/EXHIBITION/CLOSURE/CONCERT/RAMADAN_HOURS/WEATHER_ALERT), default-window selection (current + next 90 days). `/api/v1/events` listing with type/attraction/date filters; `/[locale]/events` calendar grouped into Today / This week / This month / Upcoming with bilingual cards. WeatherProvider interface with `MockWeatherProvider` (deterministic seasonal data, requires zero keys) + `OpenWeatherProvider` (real OpenWeather API, auto-selected when `OPENWEATHER_API_KEY` set). `/api/v1/weather?lat&lng&locale` endpoint with 10-min cache. `<WeatherWidget>` rendered in attraction detail sidebar. Pure-UTC `isOpenNow` function (timezone-safe — no dependence on runtime TZ) computing OPEN/CLOSED/UNKNOWN from operating hours + active closures, season-aware (SUMMER Mar–Sep, WINTER Oct–Feb), Türkiye-time correct. `<OpenNowBadge>` rendered next to attraction badges. Closure announcement banner pulls active CLOSURE events into the sidebar. 5 isOpenNow tests pass; 66 tests total.
- **Phase 13 — Multi-Language Expansion (ar, ru, de)** ✅ — `mvpLocales` extended to `[tr, en, ar, ru, de]`, all 5 translation files complete in `src/messages/*.json`. RTL layout already wired via `isRtl(locale)` → `<html dir="rtl">` set automatically for `ar`. Russian plural rules (`one/few/other`) and Arabic plural keys (`=0/=1/other`) follow CLDR. Sitemap auto-generates `hreflang` alternates for all 5 locales (5 × every URL). The build successfully prerenders all locale pages (homepage, regions, categories, legal, attractions). Domain-content fallback: `AttractionTranslation` rows still only seeded for `tr`/`en`, but the service-layer `pickTranslation` falls back gracefully to `tr` then `en` when `ar`/`ru`/`de` rows aren't present — providing clean degradation while a Crowdin workflow ramps up content. `docs/i18n.md` documents the rollout pipeline.
- **Phase 14 — Accessibility & Inclusive Design** ✅ — `<AccessibilityProvider>` context with localStorage persistence + `prefers-reduced-motion` auto-detect. `<AccessibilityToolbar>` in the header with: font size selector (100/112/125/150%), high-contrast toggle, reduced-motion toggle. Global CSS adds: `font-size: calc(16px * var(--a11y-font-scale))` on `html`; `.high-contrast` palette overrides for both light + dark modes (true black/white with high-saturation primary, full-contrast borders); `.reduced-motion` cancels animations and transitions globally. `<AccessibilitySection>` on attraction detail renders icon+label list of accessibility flags (wheelchair, audio guide, braille, sign language, low-stim hours, service animals) from the JSON `accessibility` field already in the schema. The seed already populates Ayasofya with `{ wheelchair: true, audioGuide: true }` to demonstrate. axe-core runs in Playwright e2e via the existing CI workflow.
- **Phase 15 — Monetization & B2B** ✅ — `PaymentProvider` interface with `MockPaymentProvider` (auto-confirm checkout for dev/test), `StripePaymentProvider` (international, USD), `IyzicoPaymentProvider` (Türkiye-native, TRY + 3D Secure) — both real providers stubbed, ready to drop in real SDKs. Auto-selected by `PAYMENT_PROVIDER` + credentials. Subscriptions service: `startCheckout`, `getCurrentSubscription`, `cancelMine`, `activateMockSubscription` (sets User.premiumUntil + Subscription.ACTIVE in a transaction). Endpoints: `/api/v1/payments/checkout` (auth required, plan validation), `/api/v1/payments/mock-confirm` (dev hook), `/api/v1/me/subscription` (GET + DELETE). `/[locale]/premium` pricing page with Turkish + English copy, monthly/yearly tiers, ₺99/mo and ₺79/mo (2 months free yearly). `<PremiumActions>` button reflects current subscription state. **B2B API:** API-key issuance via `/api/v1/me/api-keys` (POST returns the only display of the raw key, prefixed `tt_pk_`, hash stored), GET (list with prefix only), DELETE per key (revoke). Per-key rate limit (default 60/h, configurable up to 10k/h). `authenticateApiKey` and `meterUsage` services for downstream gateway use. `/[locale]/developer` UI panel with create/revoke/list of keys.

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
| 2026-05-05 | Phase 5 (Auth) executed before Phase 4 (Reviews) | The roadmap's own dependency analysis acknowledges Reviews requires Auth. Following numeric order would force a placeholder anonymous-review path that Phase 5 would later rip out. Recommended order from §5 Implementation Roadmap explicitly says Phase 5 → Phase 4. | Documented here so the deviation is visible. |

## Known Issues / Follow-ups

- PayloadCMS admin deferred to a later phase. Per Decision Log, content editing in MVP can be done via direct DB seed scripts; a JSON-form admin lands when content scale demands it.
- R2 object storage abstracted but local-FS in dev. Real bucket is a one-line env swap.
- PostGIS GIST index is provided in the schema but only takes effect when DATABASE_PROVIDER=postgresql.

## Phase Pointer

Next: complete Phase 0 deliverables, then Phase 1.
