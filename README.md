# NutriTrack

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Expo](https://img.shields.io/badge/Expo-56-blue)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.85-61dafb)](https://reactnative.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org)

A full-stack mobile nutrition & fitness tracker. **React Native (Expo)** frontend, **Node.js + Express + PostgreSQL** backend, **Groq AI** for food-photo recognition and a nutrition coach.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Screens & Navigation](#screens--navigation)
- [Getting Started](#getting-started)
- [Running on a Device](#running-on-a-device)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [Backend API](#backend-api)
- [Security](#security)
- [Testing](#testing)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

### Tracking
- **Food logging** — Meals (breakfast/lunch/dinner/snack) with full macro breakdown. USDA food search, **barcode scanner** (OpenFoodFacts lookup), **AI photo recognition**, custom foods, favorites, recent-foods history, and reusable **saved meals**.
- **Activity logging** — 55-activity built-in library (sports, cardio, strength, combat, outdoor), custom activities, favorites, duration-based calorie calculation.
- **Water intake** — Animated gauge, per-log add/remove with haptics, daily goal, celebration on completion, **local reminders** with custom sounds.
- **Weight tracking** — History with automatic BMI, goal-progress bar, profile sync, and **progress photos** (local gallery + side-by-side compare).

### Intelligence
- **Insights dashboard** — Weekly / monthly (4 weeks) / yearly (12 months) charts for calories, water, and weight. Swipe-friendly, tap a column to inspect.
- **AI Photo** — Snap a plate → Groq vision model estimates calories & macros → prefills the food form.
- **AI Coach** — Chat tab; the coach sees your last 7 days of data, weight, and profile and answers nutrition questions (conversation stored on-device).
- **Personalised plan** — 10-step onboarding computes calorie/macro targets via Mifflin-St Jeor; recalculated when weight changes.
- **Calorie-overflow ring** — Home ring shows excess intake in a darker shade once the goal is passed.

### Platform & UX
- **Swipeable bottom tabs** — Home · Tracker · Insights · Articles · Coach · Profile. Swipe horizontally between them (Instagram-style) with smooth color crossfade on the bar.
- **Biometric login** — Face/fingerprint unlock when enabled.
- **Profile photo** — Take/pick a photo (stored locally).
- **Haptics** — Tactile feedback on key actions and every toast.
- **Local notifications** — Water reminders with 5 bundled ringtones, vibration, and "stop at goal".
- **Design system** — Central tokens + shared `ScreenHeader`, `BottomNavigation`/`MainTabs`, `OptionPicker`, `AppToast`.
- **Articles** — Knowledge base with categories, search, bookmarking, and native share sheet.
- **JWT auth** — Signup, login, 30-day sessions, bcrypt (cost 12), rate-limited endpoints.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native 0.85, Expo SDK 56 (New Architecture / Fabric) |
| Navigation | React Navigation 7 — native stack + **material-top-tabs** (swipeable) |
| Animation / keyboard | react-native-reanimated 4 (`useAnimatedKeyboard`) |
| Charts & graphics | react-native-svg, Shopify Skia, D3 |
| State | React Context API (8 providers) |
| Storage | AsyncStorage (data/cache, photos metadata), SecureStore (JWT), expo-file-system (photo files) |
| Device | expo-camera, expo-image-picker, expo-haptics, expo-local-authentication, expo-notifications |
| Backend | Node.js 20, Express 4, helmet, express-rate-limit |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| External data | USDA FoodData Central, OpenFoodFacts, **Groq** (Llama 4 Scout vision + Llama 3.3 70B chat) |

---

## Architecture

```
┌───────────────────────────────────────────────┐
│        React Native / Expo App                │
│  Screens → Contexts → NutritionService /      │
│                       AuthService             │
│            │ HTTP (LAN IP or localhost:3001)  │
└───────────────────────────────────────────────┘
                    │
┌───────────────────▼───────────────────────────┐
│        Express API  (backend/)                │
│  /api/auth /api/nutrition /api/tracker        │
│  /api/food /api/activity  /api/insights       │
│  /api/user /api/settings  /api/articles       │
│  /api/ai (Groq proxy — key server-side only)  │
└───────────────────────────────────────────────┘
                    │
┌───────────────────▼───────────────────────────┐
│        PostgreSQL 16                          │
│  users · food_entries · activity_logs         │
│  water_logs · weight_logs · user_daily_data   │
│  user_daily_targets · user_settings           │
│  favorite/custom_foods · saved_meals · …      │
└───────────────────────────────────────────────┘
```

**Data-flow conventions**
- Screens never `fetch` nutrition data directly — they go through a Context → the `NutritionService` singleton (`request(path, options)` with JWT).
- PostgreSQL `NUMERIC` columns come back as **strings** from `pg`. Always `parseFloat()` + round before rendering.
- Backend code is **baked into the Docker image** — after backend changes run `docker-compose up -d --build backend`. Frontend changes only need a Metro reload.
- AI requests always go through `/api/ai` so the Groq key never reaches the client.

---

## Screens & Navigation

The 6 primary tabs live in a swipeable **material-top-tabs** navigator (`src/navigation/MainTabs.js`) with a custom bottom bar:

```
Home → Tracker → Insights → Articles → Coach → Profile
```

Everything else (food/activity detail, settings sub-pages, barcode scanner, progress photos, onboarding, auth) are stack screens pushed on top with a slide-from-right animation. All headers use the shared `ScreenHeader` for consistent top spacing and safe-area handling.

---

## Getting Started

### Prerequisites
- [Node.js 20+](https://nodejs.org)
- [Docker + Docker Compose](https://docs.docker.com/compose/) **or** local PostgreSQL 16
- Android emulator (Android Studio) or a physical device with Expo Go (SDK 56)

### Quick start (Docker — recommended)
```bash
git clone https://github.com/your-username/NutriTrack.git
cd NutriTrack
cp .env.example .env          # set POSTGRES_PASSWORD, JWT_SECRET, GROQ_API_KEY

docker-compose up --build     # PostgreSQL + Express API on :3001
npm install
npx expo start                # press "a" for Android emulator
```
Schema (`backend/schema.sql`) auto-applies on first DB start.
Health check: <http://localhost:3001/api/health>

### Local backend (no Docker)
```bash
cd backend && npm install
psql -U postgres -c "CREATE DATABASE nutritrack;"
psql -U postgres -d nutritrack -f schema.sql
npm run dev
```

---

## Running on a Device

### Android emulator
`npx expo start` then press **a**. Expo CLI auto-installs the matching Expo Go. Backend is reached via `adb reverse tcp:3001 tcp:3001` + `EXPO_PUBLIC_API_URL=http://localhost:3001/api`.

### Physical phone (Expo Go, same Wi-Fi)
1. The Play Store Expo Go must match the project SDK. If it shows "incompatible", install the SDK-56 build from <https://expo.dev/go?sdkVersion=56&platform=android&device=true>.
2. Set `EXPO_PUBLIC_API_URL=http://<YOUR_PC_LAN_IP>:3001/api` in `.env` (find it with `ipconfig`).
3. Allow inbound TCP 3001 through Windows Firewall (admin):
   ```powershell
   New-NetFirewallRule -DisplayName "NutriTrack Backend 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -Profile Private,Public
   ```
4. Start Metro in LAN mode: `npx expo start --lan` and scan the QR.
5. Phone + PC must stay on the same Wi-Fi with the backend running.

> **Note:** Custom notification sounds, reliable notifications, and `react-native-keyboard-controller`-style features need a **development build** (`npx expo run:android` or EAS Build). In Expo Go they degrade gracefully (e.g. system default sound).

---

## Environment Variables

`.env` at the project root (read by both Docker and Expo):

| Variable | Used by | Purpose |
|---|---|---|
| `POSTGRES_PASSWORD` | db | Postgres password |
| `DATABASE_URL` | backend | Connection string |
| `JWT_SECRET` | backend | Token signing (server refuses to start without it) |
| `PORT` | backend | API port (default 3001) |
| `GROQ_API_KEY` | backend | Groq AI (food-photo + coach). Blank → AI returns 503 |
| `CORS_ORIGIN` | backend | Allowed origin in production |
| `SMTP_*` | backend | Forgot-password email (optional; blank logs token) |
| `EXPO_PUBLIC_API_URL` | **app** | Client API base URL (`EXPO_PUBLIC_` is bundled into the app) |

---

## Project Structure

```
NutriTrack/
├── App.js                     # Root — 8 context providers + ToastHost
├── app.json                   # Expo config (plugins: splash, secure-store, notifications)
├── docker-compose.yml         # db + backend
├── .env.example
├── assets/
│   ├── fonts/                 # Roboto family
│   └── sounds/                # 5 notification ringtones (WAV)
├── src/
│   ├── theme.js               # Design tokens (COLORS/SPACING/RADIUS/SHADOWS/TYPOGRAPHY)
│   ├── config.js              # API base URL resolution
│   ├── navigation/
│   │   ├── AppNavigator.js     # Native stack (auth, detail, settings screens)
│   │   └── MainTabs.js         # Swipeable 6-tab navigator + custom bottom bar
│   ├── components/
│   │   ├── ScreenHeader.js     # Unified safe-area header (centered title)
│   │   ├── BottomNavigation.js # Bottom bar for detail screens (→ MainTabs)
│   │   ├── OptionPicker.js     # Centered selection modal
│   │   ├── AppToast.js         # showToast(msg, type) + haptics
│   │   └── CaloriesProgressCircle.js
│   ├── context/               # Auth · SignUp · Meals · Activity · Water · Weight · Insights · Bookmark
│   ├── services/
│   │   ├── AuthService.js
│   │   ├── NutritionService.js     # all food/activity/AI API calls (singleton)
│   │   ├── NotificationService.js  # reminders, ringtones, channels (lazy-loaded)
│   │   ├── PhotoStorage.js         # local profile + progress photos
│   │   └── UsdaFoodApiService.js
│   ├── utils/haptics.js
│   ├── screens/               # onboarding · auth · main (home/tracker/insights/coach)
│   │                          # · food · activity · articles · settings
│   └── data/                  # sampleActivities (55), articles, notifications
└── backend/
    ├── Dockerfile
    ├── schema.sql             # Full schema (incl. saved_meals, bmi/weight columns)
    └── src/
        ├── index.js           # Express entry: helmet, CORS, rate limits, routes
        ├── db.js              # pg pool + transaction helpers
        ├── middleware/auth.js # JWT validation (no fallback secret)
        └── routes/            # auth · nutrition · food · activity · activityLogs
                                # · tracker · insights · user · settings · articles · ai
```

---

## Design System

All visual constants in [`src/theme.js`](src/theme.js):

| Token group | Values |
|---|---|
| Brand colors | primary `#63A4F4` · success `#A1CE50` · water `#1A96F0` · warning `#FDCD55` · danger `#E74C3C` · weight `#FF5726` |
| Spacing | 4 / 8 / 12 / 16 / 20 / 24 |
| Radius | sm 8 · md 12 · lg 16 · pill |
| Shadows | `card`, `header` presets |
| Typography | headerTitle 18/600 · sectionTitle 16/600 · body 14 · caption 12 |

Enforced conventions:
- Every page header is `ScreenHeader` (or aligned to its 8px top metric).
- Success feedback uses `showToast(...)`, never blocking `Alert` popups.
- Selection lists use the centered `OptionPicker` modal.
- Bottom buttons respect `useSafeAreaInsets().bottom` so they never sit under system nav.
- `console.log` is banned in `src/` (only `console.error` in catch blocks).

---

## Backend API

| Group | Endpoints (selected) |
|---|---|
| `/api/auth` | `POST /signup`, `POST /login`, `GET /profile`, `POST /forgot-password` |
| `/api/nutrition` | `GET /daily/:date`, `POST /food`, `DELETE /food/:id`, `POST /activity` |
| `/api/food` | `GET/POST /favorites`, `/custom`, `/recent`, **`GET/POST/DELETE /meals`** (saved meals) |
| `/api/activity` | `/favorites`, `/custom`, `/recent`, `/search`, `/stats` |
| `/api/tracker` | `POST/DELETE /water`, `GET /water/daily/:date`, `POST/PUT/DELETE /weight` |
| `/api/insights` | `GET /dashboard?period=weekly|monthly|yearly` (server-side aggregation) |
| `/api/user` | `GET/PUT /profile`, `GET/PUT /daily-targets` |
| `/api/settings` | `GET /`, `PUT /calorie`, `PUT /water` |
| `/api/ai` | `POST /food-photo` (vision), `POST /coach` (chat) — Groq proxy, rate-limited 10/min |

Every protected route uses the `authenticateToken` middleware and parameterized SQL.

---

## Security
- Passwords hashed with bcrypt (cost 12); **plaintext password is never written to disk** on the client.
- JWT secret comes only from the environment — server refuses to start without it.
- All SQL is parameterized.
- Rate limiting: 10 logins / 15 min, 5 signups / hour, 10 AI calls / min, 200 req/min general.
- helmet headers; CORS open in dev, restricted via `CORS_ORIGIN` in production.
- Groq API key stays server-side; never bundled into the app.
- Request logging never includes bodies.

---

## Testing
No automated suite yet. Current practice:
- **Backend smoke tests** — PowerShell/curl scripts exercising every endpoint (auth, food, activity, water, weight, insights, settings, ai) + a full new-user journey. Last full run: all PASS.
- **Static checks** — every `src/` file is Babel parse-checked and the full Android bundle is compiled after refactors.

---

## Known Limitations
- **Notifications** — Custom ringtones and reliable Android notifications require a development build; Expo Go falls back to the system sound.
- **Photos** — Profile and progress photos are stored **locally** (lost on reinstall / not synced across devices).
- **Home-only backend** — On a physical phone the backend lives on your PC, reachable only on the same Wi-Fi. For anywhere-access, deploy the backend to the cloud.
- **AI** — Requires a `GROQ_API_KEY`; without it the AI endpoints return 503 and the UI shows a friendly message.

---

## Roadmap
- [ ] Automated tests (Jest + supertest)
- [ ] Deploy backend to the cloud (Render/Railway) for off-Wi-Fi use
- [ ] EAS Build / OTA updates
- [ ] Apple Sign-In & Google OAuth (deps installed)
- [ ] Dark mode (theme tokens are ready)
- [ ] Micronutrient tracking, recipe builder, pedometer (`expo-sensors`)
- [ ] i18n (TR/EN)

---

## License
MIT — see [LICENSE](LICENSE). Copyright (c) 2025 Kaan
