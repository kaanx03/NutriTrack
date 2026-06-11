# NutriTrack

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Expo](https://img.shields.io/badge/Expo-52-blue)](https://expo.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org)

A full-stack mobile nutrition and fitness tracking app built with **React Native (Expo)** for the frontend and **Node.js + Express + PostgreSQL** for the backend.

---

## Features

- **Food Tracking** — Log meals (breakfast, lunch, dinner, snack) with full macro breakdown; USDA food database integration
- **Activity Tracking** — Log workouts, search from a built-in library or create custom activities
- **Water Intake** — Track hydration with per-log add/remove and a daily goal
- **Weight Tracking** — Record weight over time with BMI calculation and goal progress
- **Insights Dashboard** — Weekly charts for calories, water, weight, and macro split
- **10-Step Onboarding** — Personalised calorie and macro targets via the Mifflin-St Jeor equation
- **Articles** — Built-in knowledge base with bookmarking
- **JWT Authentication** — Secure signup, login, and token-based sessions

---

## Screenshots

| Onboarding 1 | Onboarding 2 | Onboarding 3 |
|:---:|:---:|:---:|
| ![Onboarding boat](assets/images/onboarding1_boat.png) | ![Onboarding hiking](assets/images/onboarding2_hiking.png) | ![Onboarding picnic](assets/images/onboarding3_picnic.png) |

> Add real app screenshots to `assets/images/` and update this table.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native 0.76, Expo 52 |
| Navigation | React Navigation 7 (native stack) |
| Charts & Graphics | Shopify Skia, D3.js |
| State management | React Context API |
| Backend | Node.js 20, Express 4 |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| External food data | USDA FoodData Central API |

---

## Architecture

```
┌────────────────────────────────────────────────┐
│          React Native / Expo App               │
│  (iOS · Android · physical device / emulator) │
│                                                │
│  Contexts  ──►  NutritionService / AuthService │
│                         │                      │
│                   HTTP (port 3001)             │
└────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────┐
│          Express API  (backend/)               │
│  /api/auth   /api/nutrition   /api/tracker     │
│  /api/food   /api/activity    /api/insights    │
│  /api/user   /api/settings    /api/articles    │
└────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────┐
│              PostgreSQL 16                     │
│  users · food_entries · activity_logs          │
│  water_logs · weight_logs · user_daily_data    │
│  user_daily_targets · user_settings · …        │
└────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [PostgreSQL 16](https://www.postgresql.org/download/) **or** [Docker + Docker Compose](https://docs.docker.com/compose/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- Android emulator (Android Studio) or Expo Go on a physical device

---

### Option A — Local setup (no Docker)

#### 1. Clone and install

```bash
git clone https://github.com/your-username/NutriTrack.git
cd NutriTrack

# Frontend dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..
```

#### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, DATABASE_URL, JWT_SECRET
```

#### 3. Create and seed the database

```bash
psql -U postgres -c "CREATE DATABASE nutritrack;"
psql -U postgres -d nutritrack -f backend/schema.sql
```

#### 4. Start the backend

```bash
cd backend
npm run dev
# API running at http://localhost:3001
# Health check: http://localhost:3001/api/health
```

#### 5. Start the mobile app

```bash
cd ..
npx expo start
```

Press **a** for Android emulator, **i** for iOS simulator, or scan the QR code with **Expo Go**.

> **Physical device:** Replace `10.0.2.2` with your machine's local IP in
> `src/services/AuthService.js` and `src/services/NutritionService.js`.

---

### Option B — Docker (backend + database only)

> The mobile app runs on a device/emulator — Docker covers only the Express backend and PostgreSQL.

#### 1. Clone and configure

```bash
git clone https://github.com/your-username/NutriTrack.git
cd NutriTrack
cp .env.example .env
# Set POSTGRES_PASSWORD and JWT_SECRET
```

#### 2. Start containers

```bash
docker-compose up --build
```

This builds the backend image, starts PostgreSQL, auto-applies `schema.sql`, and exposes the API on **port 3001**.

#### 3. Start the mobile app

```bash
npm install
npx expo start
```

#### Useful Docker commands

```bash
docker-compose down          # stop containers
docker-compose down -v       # stop + delete DB volume
docker-compose logs backend  # stream backend logs
```

---

## Project Structure

```
NutriTrack/
├── App.js                     # Root — wraps all context providers
├── index.js                   # Expo registration
├── app.json                   # Expo configuration
├── docker-compose.yml         # Docker services (db + backend)
├── .env.example               # Environment variable template
├── assets/                    # Fonts, images, icons
├── src/
│   ├── navigation/AppNavigator.js   # 43 screens, native-stack
│   ├── screens/               # Onboarding · Auth · Main · Settings
│   ├── context/               # Auth · Meals · Activity · Water · Weight · Insights
│   ├── services/
│   │   ├── AuthService.js          # Login / signup / token management
│   │   └── NutritionService.js     # All nutrition / activity API calls
│   └── data/                  # Static food & activity libraries
└── backend/
    ├── Dockerfile
    ├── schema.sql             # Full PostgreSQL schema (all tables)
    └── src/
        ├── index.js           # Express server entry
        ├── db.js              # pg connection pool
        ├── middleware/auth.js # JWT validation
        └── routes/            # auth · nutrition · food · activity · insights …
```

---

## Roadmap

### v1.1 — Stability *(current)*
- [x] Fix hardcoded dates in Insights dashboard
- [x] Complete PostgreSQL schema (all 13 tables)
- [x] Docker support for backend + database
- [x] CORS fix for physical device testing
- [x] Persist water goal to backend
- [x] Fix JWT token race condition on cold start
- [ ] Automated tests

### v1.2 — Polish
- [ ] Real in-app screenshots in README
- [ ] Functional forgot-password email flow
- [ ] Push notifications (expo-notifications)
- [ ] Input range validation on all settings screens

### v1.3 — Features
- [ ] Apple Sign-In & Google OAuth (expo-auth-session already wired)
- [ ] Barcode scanner for food logging
- [ ] CSV / PDF export of nutrition history
- [ ] Weekly summary email digest

### v2.0 — Scale
- [ ] Multi-language support (i18n)
- [ ] Offline-first with sync (SQLite local cache)
- [ ] Apple Health / Google Fit integration
- [ ] Dietitian / coach shared-tracking mode

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes following conventional commits (`feat:`, `fix:`, etc.)
4. Open a Pull Request — keep it focused on a single concern

---

## License

```
MIT License

Copyright (c) 2025 Kaan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
