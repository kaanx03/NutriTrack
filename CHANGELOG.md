# Changelog

All notable changes to this project. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); this project is pre-1.0.

## [Unreleased] — 2026-06

A full professional audit pass (UI/UX, design system, motion, accessibility,
testing, security). All work landed as small themed commits; 63 automated tests
green throughout.

### Added
- **Test suites** — Backend Jest + supertest (18 tests: auth 401 / validation 400 /
  rate-limit 429 / new-user journey) and frontend Jest + RNTL (45 tests: math,
  formatters, validation, context, primitives).
- **CI** — GitHub Actions running lint + both suites (backend with a Postgres
  service) on every PR / push to `main`.
- **ESLint** — Lean flat config (no TypeScript dep), JSX-aware, lints `src` + `backend/src`.
- **Design system** — Two-layer token palette (core ramps → semantic), all pairings
  WCAG AA; shared primitives `Button`, `Card`, `ListRow`, `SectionHeader`,
  `EmptyState`, `ErrorState`, `OfflineBanner`, `Skeleton`.
- **UX states** — Loading skeletons, empty states, and offline/error states with retry
  on Home, Insights, Tracker, Activity; inline form validation across weight modals
  and all signup steps (replacing `Alert`).
- **Motion** — reanimated worklets (button press, calorie ring fill, chart-bar mount,
  water gauge, goal celebration), all honoring OS **reduce motion**.
- **Accessibility** — roles + labels on tabs, headers, controls, pickers; text
  alternatives for the calorie ring and Insights charts; decorative SVG/skeletons
  hidden from screen readers.
- **Utilities** — `format` (kcal/g/mL/kg/BMI/date), `nutritionMath` (Mifflin BMR +
  macros + BMI), `validation`, `motion` (`useReducedMotion`).
- **Backend** — saved meals, password reset (email), account export/delete, Groq AI
  proxy endpoints (documented; shipped earlier, now committed in themed history).

### Changed
- **Calorie goal is now a single source of truth** (`user_daily_targets`): Home,
  Profile, and Insights all read the same value (was 2990 / 2974 / 2986). Today's row
  syncs to the current target; historical days are never rewritten.
- Color hex → theme tokens across all screens (~745 literals); palette refined to an
  accessible, coherent system.
- Calorie/macro/BMI math extracted from LoginScreen/SignUpScreen10/WeightContext into
  the shared `nutritionMath` util (guarded by a parity test).
- Dockerfile uses `npm ci --omit=dev`; `docker-compose.yml` drops the obsolete
  `version` key.

### Fixed
- **Security (OWASP):** removed an `insights` error-detail leak and a debug endpoint
  that dumped user data; verified clean on secrets, SQL injection, broken auth, IDOR.
- **Backend Docker build** — pinned `jest` to 29 (jest 30 pulled a WASM resolver that
  broke `npm ci` across npm 10/11); regenerated a clean lockfile.
- Removed fake/stale Notifications sample data (Jan 2025, non-existent features) →
  honest empty state.
- Latent `ReferenceError` in `settings.js` (a `catch` referenced a `try`-scoped var).
- Coach input no longer floats above the tab bar (double safe-area inset).

### Deferred (intentional — see README Roadmap)
- Refresh-token rotation/revocation (currently a 30-day JWT).
- `CHART.*` secondary/series token set for chart tints.
- Device-only a11y checks (dynamic type at 200 %+, full focus-order pass).
- `FlatList` add/remove exit animations (Fabric reliability).
