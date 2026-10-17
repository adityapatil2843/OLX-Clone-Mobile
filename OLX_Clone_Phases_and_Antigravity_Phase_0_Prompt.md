# OLX-Clone Mobile App --- Phased Roadmap & Antigravity Execution Prompt

**Project:** Free Video-First Marketplace for India\
**Client reference:** Developer Requirement & Product Blueprint, Version
1.0\
**Mobile stack preference:** Expo + React Native + TypeScript\
**Backend target:** Node.js + Express.js, PostgreSQL, Redis, search
service, object storage/CDN, Socket.IO\
**Initial languages:** English, Hindi, Marathi\
**Document purpose:** Define implementation phases and provide a
controlled, copy-paste prompt for Antigravity to execute Phase 0 only.

------------------------------------------------------------------------

## 1. Product direction

Build an original, video-first marketplace for India combining
classifieds, vertical Reels, listings, user/business profiles, chat,
jobs, services and location-based discovery. Core consumer use should
remain free. Reels are a first-class discovery experience, not merely an
attachment to listings.

Primary journey:

**Watch → Discover → View details → Chat → Negotiate → Buy / Sell /
Connect**

The UI may use familiar interaction patterns, but must have its own
visual identity rather than copying OLX, TikTok or Instagram.

## 2. Development phases

### Phase 0 --- Engineering foundation (execute now)

**Goal:** Establish a clean, maintainable and verifiable mobile
application foundation without pretending that the backend or
marketplace features already exist.

Scope: 1. Inspect the repository, package manager, current Expo SDK, app
configuration and existing screens before editing. 2. Preserve useful
starter code and scripts; do not run destructive reset commands or
overwrite files blindly. 3. Confirm a compatible Expo + React Native +
TypeScript setup. Use Expo Router and file-based routes, consistent with
the proposed `app/` structure. 4. Establish the folder structure in
Section 3, adapting only where the existing project or Expo conventions
require it. 5. Add a small, original design system: semantic colors,
spacing, typography, radii, elevation and reusable UI primitives. 6.
Configure environment-variable handling and a safe `.env.example`; never
commit real secrets. 7. Create a typed API client foundation with base
URL configuration, request timeout, consistent error handling and safe
logging. Do not invent production endpoints. 8. Set up an appropriate
state-management approach and query/cache layer only if justified; avoid
unnecessary dependencies. 9. Set up localization foundations for
English, Hindi and Marathi, with English as the fallback. 10. Establish
shared TypeScript types, constants, utilities and feature-module
conventions. 11. Add baseline linting, formatting, type checking and
tests using tooling compatible with the detected Expo SDK. 12. Add
loading, empty, error and not-found UI patterns. 13. Add concise project
documentation: setup, scripts, environment variables, folder conventions
and current limitations. 14. Run all available quality checks and report
exact results.

**Not in Phase 0:** real OTP delivery, production authentication, real
listing CRUD, video upload/transcoding, real-time chat, push
notifications, payment integration, admin panel, recommendation AI or
production backend deployment. These require later phases and/or backend
services.

**Phase 0 exit criteria:** - App starts using documented commands. -
Expo Router routes render without route errors. - TypeScript checks
pass. - Lint and formatting checks pass, if configured. - Automated
baseline tests pass. - No secrets are committed or placed in client
code. - Environment configuration fails clearly and safely when required
values are missing. - Existing project behavior has not been
unintentionally broken. - README explains setup and checks. -
Antigravity supplies a summary of files created/changed, commands run,
results, unresolved issues and next recommended phase. - No Phase 1
feature work begins without explicit approval.

### Phase 1 --- MVP marketplace

**Goal:** Deliver the first end-to-end usable marketplace.

Feature areas: - Registration/login, OTP verification integration,
session handling and profile basics. - Home/discovery and vertical Reels
feed. - Reel playback and upload flow integrated with a backend media
pipeline. - Categories and category-aware listing creation. - Listing
detail pages, media, price, seller information and contact CTA. -
Search, filters, sorting and location selection. - Favorites/saved
listings. - Buyer--seller text chat and listing sharing. - Notifications
for important events. - Report/block flows and basic verification. -
Minimal admin web panel and moderation workflow (separate web
deliverable, coordinated with backend). - Analytics events and error
monitoring baseline.

**Exit criteria:** Demonstrate an end-to-end journey: a user creates a
listing and Reel, another user discovers it, opens the listing, contacts
the seller, saves or reports content, and receives the relevant
notification. Backend and media operations must be real integrations in
the environments where they are claimed to work; clearly label any
development-only mocks.

### Phase 2 --- Growth

**Goal:** Improve trust, seller engagement and discovery.

Feature areas: - Business profiles and storefronts. - Follow/follower
system. - Comments, ratings and reviews. - Make Offer / accept / reject
/ counter-offer workflow. - Saved searches and matching alerts. -
Map-based discovery. - AI-assisted listing creation and recommendations,
introduced behind measurable and safe service boundaries. - More
advanced moderation and fraud/spam signals. - Dealer and professional
accounts. - Expanded product analytics.

**Exit criteria:** Business/profile and negotiation flows are
integrated, abuse controls and audit events are in place, and
recommendation/AI features are measurable, monitored and safe to
disable.

### Phase 3 --- Advanced platform

**Goal:** Expand into a richer commerce and business platform after
validating demand and operational readiness.

Feature areas: - AI-assisted Reel creation from listing photos and
metadata. - Advanced personalization and recommendation systems. - Live
video/live selling. - Voice/video calling. - Payments and transaction
services where legally appropriate. - Delivery/shipping integrations. -
Business analytics and advertising tools. - Sponsored Reels, featured
business profiles and optional business subscriptions. - Expanded
multilingual support.

**Exit criteria:** Each capability receives separate product, privacy,
security, legal, performance and cost review before release. Payments
and transaction services must not be enabled merely because UI screens
exist.

------------------------------------------------------------------------

## 3. Target mobile folder structure

Use this as the target architecture, not as a mandate to duplicate files
that already exist. Keep Expo-required files and any existing files
still referenced by the app.

``` text
mobile/
├── app/
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── verify-otp.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── reels.tsx
│   │   ├── create.tsx
│   │   ├── chats.tsx
│   │   └── account.tsx
│   ├── listing/
│   │   ├── [id].tsx
│   │   └── create.tsx
│   ├── reel/
│   │   └── [id].tsx
│   ├── business/
│   │   └── [id].tsx
│   ├── chat/
│   │   └── [conversationId].tsx
│   ├── search/
│   │   └── index.tsx
│   ├── profile/
│   │   └── [id].tsx
│   └── settings/
│       └── index.tsx
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── reels/
│   │   ├── listings/
│   │   ├── chat/
│   │   └── forms/
│   ├── features/
│   │   ├── auth/
│   │   ├── reels/
│   │   ├── listings/
│   │   ├── chat/
│   │   ├── search/
│   │   ├── location/
│   │   ├── notifications/
│   │   └── profile/
│   ├── services/
│   │   ├── api-client.ts
│   │   ├── auth.service.ts
│   │   ├── media.service.ts
│   │   └── socket.service.ts
│   ├── hooks/
│   ├── stores/
│   ├── providers/
│   ├── constants/
│   ├── config/
│   ├── i18n/
│   ├── types/
│   └── utils/
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── components/       # Keep if the existing Expo template uses it
├── constants/        # Keep if referenced by existing starter screens
├── scripts/          # Keep existing scripts such as reset-project.js
├── tests/
├── app.json
├── package.json
├── tsconfig.json
├── eas.json
└── .env.example
```

**Routing note:** Expo Router route files should be thin. Put reusable
UI, domain logic and API access in `src/`. Do not create duplicate route
systems or move/remove starter files without verifying imports and Expo
conventions.

------------------------------------------------------------------------

## 4. Copy-paste prompt for Antigravity --- Phase 0 only

Paste the full prompt below into Antigravity while its workspace is
opened at the repository root (or the mobile project root if that is how
the workspace is organized).

------------------------------------------------------------------------

### ANTIGRAVITY PROMPT START

You are the senior mobile engineer responsible for the foundation of a
production-oriented India-focused video-first marketplace called
OLX-Clone. Your task is to execute **Phase 0 only: Mobile Engineering
Foundation**.

#### Product context

The product combines classifieds, first-class vertical Reels, listings,
profiles/business profiles, chat, jobs, services and location-based
discovery. Initial app languages are English, Hindi and Marathi. Core
consumer usage should remain free. The mobile app should be built with
Expo, React Native and TypeScript, using Expo Router if compatible with
the current repository.

The backend target is Node.js + Express.js, PostgreSQL, Redis, a search
engine, object storage/transcoding/CDN, and Socket.IO. These are
architectural targets, not permission to pretend services are already
available.

#### Non-negotiable operating rules

1.  **Inspect first.** Before editing, inspect the repository tree,
    `package.json`, lockfile, Expo SDK version,
    `app.json`/`app.config.*`, TypeScript config, routing conventions,
    scripts, existing screens and tests.
2.  Report a short plan and important compatibility risks before making
    changes.
3.  Work only within Phase 0. Do not implement Phase 1 marketplace
    features.
4.  Do not overwrite or delete files blindly. Preserve working code,
    existing assets, reset scripts and useful template conventions.
    Never run destructive cleanup or reset commands unless explicitly
    approved.
5.  Do not upgrade Expo/React Native or replace the package manager
    without a demonstrated need. Choose versions compatible with the
    detected Expo SDK.
6.  Do not invent API endpoints, backend response shapes, credentials,
    environment values or integration status.
7.  Never put secrets in source code or client-side environment
    variables. Treat anything bundled into a mobile app as public. Use
    `.env.example` with placeholders only.
8.  Do not claim a check passed unless you ran it and saw the result. If
    the environment cannot run a check, say so.
9.  Keep changes small, modular, type-safe and reviewable. Avoid
    unnecessary dependencies and premature abstractions.
10. Do not begin Phase 1 automatically. Stop after Phase 0, report
    results and wait for approval.

#### Tasks to execute

**A. Repository assessment** - Identify the actual mobile root and
package manager. - Determine whether Expo Router is already
installed/configured. - Identify broken scripts, incompatible
dependencies or existing conventions that affect implementation. - Avoid
making changes until the assessment is complete. - If the project is not
an Expo app, do not silently convert it. Explain the findings and make
only safe, approved-by-context foundation changes; ask for clarification
if conversion would be destructive or materially change the stack.

**B. Folder architecture** - Align the project with the target structure
in the accompanying roadmap. - Create only the missing folders/files
that are useful now. - Keep route files thin and feature/domain code in
`src/`. - Keep existing Expo template folders such as `components/` or
`constants/` if they are referenced. Do not create duplicate competing
design systems. - Do not create empty files for every future feature
just to match a tree. Add meaningful files only where they establish the
foundation. - Route placeholders may be created for the agreed route
structure, but must be honest, accessible and clearly identified as
not-yet-implemented screens. Do not imply authentication, listings, chat
or media integrations are functional.

**C. Navigation and app shell** - Ensure the root layout and not-found
route work with the detected Expo Router version. - Establish a coherent
app shell and tab navigation for Home, Reels, Create, Chats and Account
if doing so is compatible with the current setup. - Use an original
marketplace design identity; do not copy OLX, TikTok or Instagram
screens. - Add safe-area handling and accessible touch targets. - Avoid
unnecessary custom animations or video playback in Phase 0. - Ensure
route groups and dynamic routes do not conflict.

**D. Design-system foundation** - Define semantic design tokens for
colors, spacing, typography, border radii and elevation. - Add a small
set of reusable primitives appropriate to the existing app, such as a
screen/container, button, text/input styles, loading state, empty state
and error state. - Support light/dark mode only if it can be added
cleanly without overbuilding. - Use accessible contrast and readable
typography. Do not fabricate brand assets or use unlicensed fonts. -
Keep design tokens centralized and avoid scattered hardcoded style
values where tokens are appropriate.

**E. Configuration and environment** - Create or refine `.env.example`
with placeholder variables such as `EXPO_PUBLIC_API_BASE_URL` only where
needed. - Document that `EXPO_PUBLIC_*` variables are bundled into the
client and must never contain secrets. - Add a centralized, typed
configuration module with clear validation and safe error messages. - Do
not put real URLs, tokens, OTP credentials, signing keys or other
secrets in source control. - Ensure the app has a predictable
development configuration and does not silently fall back to a
production service. - If no backend URL exists yet, support an explicit
local/development configuration without pretending the API is connected.

**F. API and service foundations** - Establish a typed API client only
to the degree justified by this phase. - Include a configurable base
URL, request timeout, typed error handling, and safe diagnostic logging
that excludes tokens, personal information and request bodies containing
sensitive data. - Define a consistent response/error convention only as
an internal client convention; do not assert it matches a backend
contract that has not been supplied. - Keep authentication token storage
and refresh behavior unimplemented unless an existing real auth contract
is available. Do not invent a token flow. - Add `auth.service.ts`,
`media.service.ts` and `socket.service.ts` only as honest, typed
integration boundaries if useful. Unimplemented methods must fail
clearly or be explicitly marked as not configured; they must not return
fake successful results. - Do not connect to real sockets or upload
media in Phase 0.

**G. State, providers and localization** - Choose a minimal
state-management strategy based on actual app needs. Explain the
trade-off and avoid adding multiple overlapping state libraries. - Add
app-level providers only where needed and ensure they compose cleanly. -
Establish English, Hindi and Marathi localization resources with a
reliable fallback. Translate only foundation-level strings in this
phase; do not attempt to translate all future product copy. - Keep
user-facing strings out of core UI components where practical. - Do not
request location permission automatically. Location is a future feature
and should require clear user intent and OS permission.

**H. Code quality and testing** - Configure or repair TypeScript,
linting and formatting using versions compatible with the detected
stack. - Add a small set of meaningful unit/component tests for the
foundation, such as config validation, a reusable UI component or a
basic route/screen render. - Add or verify package scripts for start,
typecheck, lint, format-check and test where supported. - Avoid brittle
tests that depend on network access or a live backend. - Use async/await
for asynchronous code and handle errors deliberately. - Verify imports,
route names and path aliases; do not add aliases that conflict with
Expo/TypeScript configuration.

**I. Documentation** Update the README or add `docs/mobile-phase-0.md`
documenting: - Prerequisites and local setup. - How to install
dependencies using the existing package manager. - How to configure
environment variables. - Commands to start the app and run checks. -
High-level folder responsibilities. - What is implemented versus
deliberately deferred. - Known limitations and prerequisites for Phase
1.

#### Required validation

Run the checks that are actually available in the environment, using the
existing package manager: 1. Dependency/install validation only if safe
and appropriate for the current lockfile. 2. TypeScript check. 3. Lint.
4. Formatting check. 5. Tests. 6. Expo configuration or route validation
where supported. 7. App startup or platform bundle check if the
environment supports it.

Do not claim that the app was tested on a physical device or emulator
unless that actually happened. If a check fails, fix failures caused by
your changes, rerun the check, and report any remaining failures
honestly.

#### Acceptance criteria

Phase 0 is complete only when: - The current repository has been
assessed and existing useful work preserved. - The app shell and agreed
routes work with the installed Expo setup. - The target folder
architecture is established without pointless empty scaffolding. -
TypeScript and configured quality checks pass, or any blockers are
clearly documented. - The API/config foundation is typed and safe
without fabricated backend behavior. - `.env.example` contains
placeholders only and no secrets are committed. - English/Hindi/Marathi
localization foundations exist with fallback behavior. - Basic reusable
UI states and design tokens are available. - Setup and validation
instructions are documented. - No real auth, upload, chat, payments or
marketplace backend feature is falsely presented as complete.

#### Final response format

When finished, return:

1.  **Status:** Complete / Partially complete / Blocked.
2.  **Repository findings:** Existing stack and any compatibility
    decisions.
3.  **Files created or modified:** Grouped by purpose, with concise
    explanations.
4.  **Commands executed:** Exact command and actual result for each.
5.  **Tests and validation:** Pass/fail/not run, with reasons.
6.  **Security and configuration notes:** Confirm no secrets were added;
    mention any remaining risks.
7.  **Deferred work:** Explicit Phase 1 items not implemented.
8.  **Known issues/blockers:** Be direct.
9.  **Recommended next step:** Propose Phase 1 planning, but do not
    execute it.

Start with repository inspection. Then implement the smallest complete
Phase 0 foundation, validate it, document it and stop. Do not proceed to
Phase 1 without explicit approval.

### ANTIGRAVITY PROMPT END

------------------------------------------------------------------------

## 5. Suggested execution workflow

1.  Open Antigravity at the repository root and ensure the working tree
    is committed or backed up.
2.  Paste the Phase 0 prompt above.
3.  Review its initial assessment and plan before allowing broad
    changes.
4.  Review the diff before accepting changes, especially package files,
    Expo configuration, routing and environment configuration.
5.  Run the documented checks locally and start the app on at least one
    target platform.
6.  Resolve Phase 0 blockers before beginning authentication or
    marketplace functionality.
7.  Tag or commit the completed foundation so Phase 1 begins from a
    known-good baseline.

## 6. Phase 1 readiness checklist

Do not start full feature implementation until the team has clarified: -
Backend repository/base URL and API contract ownership. - OTP provider,
rate limits, resend/cooldown rules and verification behavior. -
Access/refresh-token strategy and secure mobile session storage. - Media
provider, signed upload approach, transcoding pipeline, CDN and upload
limits. - Socket.IO authentication, event contract, reconnect behavior
and delivery semantics. - Category schema, listing attributes and
search/filter contract. - Location permissions, manual location
selection and geospatial search behavior. - Push-notification provider
and device-token lifecycle. - Reporting/moderation policy and admin
workflow. - Privacy, retention, consent and applicable Indian legal
requirements.

These are planning dependencies, not reasons to fake integrations in
Phase 0.

## 7. Architecture trade-offs to keep explicit

-   **Expo Router vs custom navigation:** Expo Router aligns with the
    requested file-based structure and is a strong default for an Expo
    app. Keep an existing working navigation setup if migrating would
    add risk without clear benefit.
-   **State management:** Use local React state for local UI, a small
    shared store for cross-screen client state only when needed, and a
    query/cache layer for server state when Phase 1 APIs arrive. Avoid
    duplicating server state in a global store.
-   **Localization:** Use stable translation keys and locale fallback
    now; translate full product workflows as features are implemented.
-   **Video architecture:** The mobile client should request a secure
    upload workflow from the backend and upload to object storage;
    transcoding and CDN delivery belong to the media pipeline. Do not
    send large video files through the general API unless the designed
    backend explicitly requires it.
-   **Mock data:** Use fixtures only for explicitly labeled previews or
    tests. Do not present fixture-driven screens as working production
    features.
-   **Observability:** Establish safe logging conventions now. Add
    production crash reporting, analytics, alerting and release
    monitoring as integrations are selected and privacy-reviewed.

------------------------------------------------------------------------

**Source alignment:** This roadmap follows the supplied product
blueprint's product vision, core navigation, Reels-first requirement,
listing/chat/search/location needs, technical architecture, safety
requirements and three-stage development roadmap. Phase 0 implementation
details are engineering recommendations to make the mobile foundation
safe and verifiable; they are not represented as verbatim client
requirements.
