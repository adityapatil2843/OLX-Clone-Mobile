# Phase 0: Mobile Engineering Foundation

**Product:** Mandi Live (Free Video-First Marketplace for India)  
**Status:** Complete  
**Stack:** Expo SDK 57, React Native 0.86, React 19, TypeScript, Expo Router v57  
**Date:** October 2026  

---

## 1. Overview & Objective

Phase 0 establishes the production-grade engineering foundation for the mobile app without fabricating backend services or marketplace data. The app provides:
- A distinct, modern, India-first design identity with original palette and typography.
- An honest application shell featuring bottom tabs (`Home`, `Reels`, `Create`, `Chats`, `Account`).
- Verified navigation and typed route structure using Expo Router.
- Semantic design tokens, reusable UI primitives, and light/dark theme support.
- Fully typed environment variable validation with safe defaults and `.env.example`.
- A typed API client and explicit integration boundaries for Auth, Media, and Sockets with sensitive data masking.
- Multilingual localization foundations for English (`en`), Hindi (`hi`), and Marathi (`mr`).
- Full test and quality toolchain (TypeScript strict, ESLint 9 with expo config, Jest, expo-doctor).

---

## 2. Directory Architecture

The repository adheres to the target architecture:

```text
mobile/
├── .env.example              # Environment variables template with public bundling warnings
├── app.json                  # Expo SDK 57 configuration
├── eslint.config.js          # ESLint flat configuration with Expo rules
├── jest.config.js            # Jest testing configuration (jest-expo)
├── package.json              # Dependencies and scripts (start, test, typecheck, lint)
├── tsconfig.json             # TypeScript configuration with path aliases (@/* -> ./src/*)
├── assets/                   # App icons and media assets
├── docs/                     # Engineering documentation
│   └── mobile-phase-0.md     # Phase 0 completion report and architecture guide
├── src/
│   ├── app/                  # Expo Router file-based screens and navigators
│   │   ├── _layout.tsx       # Root layout wrapping AppProviders, StatusBar & Stack
│   │   ├── +not-found.tsx    # Accessible 404 fallback screen
│   │   ├── index.tsx         # Redirects root path to /(tabs)
│   │   ├── (tabs)/           # Main bottom-tab navigator
│   │   │   ├── _layout.tsx   # 5-tab bar configuration
│   │   │   ├── index.tsx     # Home / Discovery feed
│   │   │   ├── reels.tsx     # Vertical video feed preview
│   │   │   ├── create.tsx    # Sell / Post listing or reel options
│   │   │   ├── chats.tsx     # Chats / Messages list
│   │   │   └── account.tsx   # Account, language switcher & settings
│   │   ├── (auth)/           # Authentication stack
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx     # Phone number input & OTP trigger
│   │   │   ├── register.tsx  # Registration placeholder
│   │   │   └── verify-otp.tsx# OTP input & preview session handler
│   │   ├── listing/
│   │   │   ├── [id].tsx      # Listing detail view placeholder
│   │   │   └── create.tsx    # Listing creation wizard placeholder
│   │   ├── reel/
│   │   │   └── [id].tsx      # Single reel view placeholder
│   │   ├── business/
│   │   │   └── [id].tsx      # Business storefront placeholder
│   │   ├── chat/
│   │   │   └── [conversationId].tsx # Real-time chat placeholder
│   │   ├── search/
│   │   │   └── index.tsx     # Search screen with popular searches
│   │   ├── profile/
│   │   │   └── [id].tsx      # Public user profile placeholder
│   │   └── settings/
│   │       └── index.tsx     # Settings, city selector, diagnostics
│   ├── components/
│   │   └── ui/               # Reusable UI primitives
│   │       ├── AppButton.tsx # Accessible buttons (primary, secondary, outline, ghost)
│   │       ├── AppHeader.tsx # Navigation header with back action
│   │       ├── AppInput.tsx  # Form input with validation and accessory support
│   │       ├── AppText.tsx   # Typography tokens wrapper
│   │       ├── Badge.tsx     # Semantic tags (verified, warning, brand)
│   │       ├── Card.tsx      # Elevated / outlined surfaces
│   │       ├── EmptyState.tsx# Accessible empty state component
│   │       ├── ErrorState.tsx# Error display with retry CTA
│   │       ├── LoadingState.tsx # Spinner indicator
│   │       ├── PlaceholderScreen.tsx # Honest indicator for planned features
│   │       ├── ScreenContainer.tsx # SafeArea and scrollable container
│   │       └── TabIcon.tsx   # Tab bar navigation icons
│   ├── config/
│   │   └── env.ts            # Typed Zod environment schema & safe defaults
│   ├── constants/
│   │   ├── tokens.ts         # Palette, spacing, radii, typography, shadows
│   │   └── theme.ts          # Semantic light/dark theme tokens
│   ├── i18n/
│   │   ├── index.ts          # i18next configuration
│   │   └── resources/        # Translations: en.json, hi.json, mr.json
│   ├── providers/
│   │   ├── AppProviders.tsx  # SafeAreaProvider + QueryClientProvider
│   │   └── QueryProvider.tsx # TanStack React Query setup
│   ├── services/
│   │   ├── api-client.ts     # Axios instance, timeout, error typing, logging
│   │   ├── auth.service.ts   # Auth service boundary (NotImplementedError)
│   │   ├── media.service.ts  # Media upload pipeline boundary
│   │   └── socket.service.ts # Socket.IO real-time boundary
│   ├── stores/
│   │   ├── useAppStore.ts    # Zustand store: locale, themeMode, selectedCity
│   │   └── useAuthStore.ts   # Zustand store: user session preview
│   ├── types/
│   │   ├── common.ts         # Shared API response, location and locale types
│   │   ├── listing.ts        # Listing schema
│   │   ├── reel.ts           # Video reel schema
│   │   └── user.ts           # User and business profile schema
│   └── utils/
│       ├── formatters.ts     # Indian Rupee (₹), compact counts, relative time
│       └── logger.ts         # Safe logger with automatic sensitive data redaction
└── tests/
    ├── env.test.ts           # Env loading and secret safety tests
    ├── formatters.test.ts    # Formatters unit tests
    ├── i18n.test.ts          # Translation key coverage tests
    ├── logger.test.ts        # Sensitive key redaction tests
    └── services.test.ts      # Service boundary contract tests
```

---

## 3. Environment & Configuration

Environment variables prefixed with `EXPO_PUBLIC_*` are bundled into client code. **Never store production secrets, private keys, or credentials here.**

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default variables:
- `EXPO_PUBLIC_API_BASE_URL`: Base URL for REST API (defaults to `http://localhost:5000/api/v1`)
- `EXPO_PUBLIC_SOCKET_URL`: URL for real-time WebSocket connection (defaults to `http://localhost:5000`)
- `EXPO_PUBLIC_APP_ENV`: `development` | `staging` | `production`
- `EXPO_PUBLIC_APP_NAME`: `OLX Clone Mobile`
- `EXPO_PUBLIC_DEFAULT_LOCALE`: `en` | `hi` | `mr`

---

## 4. Quality Commands & Validation

All baseline quality checks are verified and passing:

| Command | Purpose | Result |
|---|---|---|
| `npx expo-doctor` | Validates Expo SDK configuration and dependencies | **21/21 passed** |
| `npm run typecheck` | Strict TypeScript compilation (`tsc --noEmit`) | **Passed (0 errors)** |
| `npm run lint` | ESLint 9 validation (`expo lint`) | **Passed (0 warnings, 0 errors)** |
| `npm run test` | Jest test suite (`npx jest`) | **5/5 suites passed (13 tests)** |
| `npx expo export -p web` | Static bundler and route compilation | **26/26 routes bundled** |

---

## 5. What Is Implemented vs Deliberately Deferred

### Implemented in Phase 0:
- Complete file-based route scaffolding for all agreed routes.
- App shell with functional bottom navigation (`Home`, `Reels`, `Create`, `Chats`, `Account`).
- Interactive language toggle between English, Hindi, and Marathi.
- Safe diagnostic logging masking passwords, tokens, OTPs, and sensitive headers.
- Reusable UI primitives (`AppButton`, `AppInput`, `AppHeader`, `Card`, `Badge`, `EmptyState`, `ErrorState`, `LoadingState`, `ScreenContainer`).
- Indian localized utilities (`formatCurrencyINR`, `formatCompactCount`, `formatRelativeTime`).
- Honest placeholder screens with explicit Phase 1 indicators and non-blocking navigation.

### Deliberately Deferred to Phase 1:
- Real SMS OTP delivery and secure mobile session persistence with backend JWT.
- Live listing database queries and search engine indexing.
- Vertical video reel streaming via CDN and video upload/transcoding pipeline.
- Real-time buyer-seller chat over Socket.IO.
- Push notifications via Expo Notifications.
- In-app photo picker and camera capture upload.

---

## 6. Phase 1 Prerequisites & Readiness Checklist

Before starting Phase 1 implementation, the following specifications must be clarified:
1. **Backend API Contract:** Base URL and OpenAPI/Swagger schema for registration, listings, reels, and chat.
2. **Auth & OTP Strategy:** SMS provider (e.g. Twilio, MSG91, Firebase Auth), rate limits, and JWT refresh token storage via `expo-secure-store`.
3. **Media Pipeline:** S3/GCS signed upload endpoint, HLS video transcoding, and CDN streaming endpoints.
4. **Socket.IO Specification:** Authentication handshake, connection lifecycle, and message events.
5. **Search & Categories:** Master taxonomy schema for categories, attributes, and location bounds.
