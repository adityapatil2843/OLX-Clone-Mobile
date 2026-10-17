# Mandi Live — Mobile Client

> Video-First Free Marketplace for India (Classifieds, Reels, Profiles, Chat & Location Discovery)

Built with **Expo SDK 57**, **React Native 0.86**, **React 19**, **TypeScript**, and **Expo Router**.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm / npx

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```
> **Security Reminder:** Variables with `EXPO_PUBLIC_*` are bundled into client code. Never store private keys or secrets here.

### 4. Run Development Server
```bash
npm run start
```
- Press `a` for Android Emulator
- Press `i` for iOS Simulator
- Press `w` for Web Browser

---

## 🛠️ Verification & Quality Checks

Run all quality checks before committing:

```bash
# 1. Diagnose Expo SDK & dependencies
npx expo-doctor

# 2. Strict TypeScript typecheck
npm run typecheck

# 3. Code linting
npm run lint

# 4. Jest unit tests
npm run test
```

---

## 📁 Architecture Overview

- `src/app/`: Expo Router file-based route definitions (`(tabs)`, `(auth)`, `listing/`, `reel/`, `chat/`, etc.)
- `src/components/ui/`: Reusable UI design system primitives (`AppButton`, `AppInput`, `Card`, `Badge`, `EmptyState`, etc.)
- `src/config/`: Runtime environment configuration with Zod validation (`env.ts`)
- `src/constants/`: Semantic design tokens (`tokens.ts`, `theme.ts`)
- `src/i18n/`: Multilingual localization for English (`en`), Hindi (`hi`), and Marathi (`mr`)
- `src/services/`: Typed API client (`api-client.ts`) and honest service integration boundaries (`auth.service.ts`, `media.service.ts`, `socket.service.ts`)
- `src/stores/`: Zustand state management (`useAppStore.ts`, `useAuthStore.ts`)
- `src/types/`: Shared TypeScript data schemas (`listing.ts`, `reel.ts`, `user.ts`, etc.)
- `src/utils/`: Safe diagnostics logging (`logger.ts`) and Indian currency/date formatters (`formatters.ts`)
- `tests/`: Automated unit tests covering env validation, logger sanitization, formatters, i18n, and service boundaries.

Detailed documentation is available in [docs/mobile-phase-0.md](docs/mobile-phase-0.md).
