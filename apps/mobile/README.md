# Türkiye Tourism — Mobile App (Expo / React Native)

This directory holds the React Native + Expo mobile app for the Türkiye Tourism platform.
It reuses the same backend at `/api/v1/*` from the web application and consumes the same
DTOs from the root project's `src/types`.

## Status

**Phase 8 — scaffold delivered. Store submission is out of single-session scope** and is
the work expected to follow:

- ✅ Project structure with Expo SDK 53 + expo-router
- ✅ Screen wireframes for Home, Search, Map, Attraction Detail, Favorites, Profile, Onboarding
- ✅ TanStack Query + i18next + locale routing wired
- ✅ EAS configuration (`eas.json`) and app metadata (`app.json`)
- ⬜ Native build via `eas build` — requires Apple Developer + Google Play Console
- ⬜ App Store + Google Play submissions — out of scope; runbook below

## Why a separate `apps/` directory

The web app at the root is a single-app Next.js codebase (per Decision Log). The mobile
app sits in `apps/mobile/` so the workspace can grow into a Turborepo without disruption.
The two apps share types via path-resolved imports.

## Quickstart

Requirements: Node 22, pnpm 9, Expo CLI (`pnpm dlx expo`).

```bash
cd apps/mobile
pnpm install
pnpm dlx expo start            # opens Expo Dev Tools
pnpm dlx expo run:ios          # iOS simulator
pnpm dlx expo run:android      # Android emulator
```

## Configuration

Set the API base URL in `app.json` `expo.extra.apiBaseUrl` or via `EXPO_PUBLIC_API_BASE_URL`.
The default points at `http://localhost:3000` for local dev.

## Architecture

```
apps/mobile/
├── app/                      # expo-router file-based routes
│   ├── (tabs)/               # Tab navigator
│   │   ├── index.tsx         # Home
│   │   ├── search.tsx
│   │   ├── map.tsx
│   │   ├── favorites.tsx
│   │   └── profile.tsx
│   ├── attraction/[slug].tsx # Detail
│   ├── onboarding.tsx        # First-launch flow
│   └── _layout.tsx           # Root layout (Providers, deep links)
├── src/
│   ├── api/                  # fetch wrapper + endpoints (typed)
│   ├── lib/i18n.ts           # i18next config (tr default + en)
│   ├── components/           # NativeBase / Tamagui-themed components
│   ├── hooks/                # useFavorites, useOfflineCache
│   └── store/                # zustand for transient UI state
├── assets/
├── app.json
├── eas.json
└── package.json
```

## Submission runbook (post-Phase-8)

1. **Apple Developer enrollment** ($99/yr) → bundle ID `app.turkiye-tourism`.
2. **Google Play Console enrollment** ($25 one-time) → package `app.turkiye_tourism`.
3. App icons (1024×1024) + splash screens for both platforms.
4. Store metadata in TR + EN: short description, full description, screenshots in 6 device
   sizes (iPhone 15 Pro Max, iPhone 13, iPhone 8 Plus, iPad Pro 12.9", iPad Pro 11", Android phone).
5. Privacy policy URL → `https://turkiye-tourism.app/[locale]/legal/privacy`.
6. iOS Privacy Nutrition Labels: collected = email, name, optional location, app usage;
   linked to user = account; not linked = anonymous analytics.
7. Google Play Data Safety form: same.
8. `eas build --profile production --platform ios` → upload to App Store Connect via Transporter.
9. `eas build --profile production --platform android` → upload AAB to Play Console.
10. Submit for review. Expect 1–3 days iOS, 24–48h Android.
11. Configure EAS Update for OTA: `eas update --branch production`.

## KVKK / GDPR notes

- Push notifications: opt-in toggle at first launch. Token stored only with consent.
- Tokens stored in `expo-secure-store` (Keychain on iOS, Keystore on Android).
- Certificate pinning planned for production builds (out of scaffold scope).
- All flows preserve current locale through onboarding → auth → main.

## Reuse path

When the codebase moves to a Turborepo, the following will become shared packages:

- `packages/types` — DTOs (currently at `../../src/types`)
- `packages/i18n` — locale files (currently at `../../src/messages`)
- `packages/api-client` — typed fetch wrapper around `/api/v1/*`

Until then, mobile files import from the root via relative paths.
