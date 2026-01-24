# 🤖 AI Agent Instructions - Power Lunch

> **IMPORTANT**: This file is the primary reference for AI agents working on this project.  
> **UPDATE THIS FILE** when you make significant changes to the project structure, add new features, or change deployment processes.

---

## 🗺️ Documentation Strategy

To avoid contradictions, the project uses a three-tier documentation system:

1. **[AI_INSTRUCTIONS.md](file:///g:/My%20Drive/AI%20Platforms/Power%20Lunch/AI_INSTRUCTIONS.md)** (This file): **The Living Source of Truth.** Contains immediate technical rules, recent architectural shifts, and agent-specific constraints.
2. **[README.md](file:///g:/My%20Drive/AI%20Platforms/Power%20Lunch/README.md)**: **The Developer Onboarding.** Summarizes how to work with the repo, critical development warnings, and the current project layout.
3. **[PRODUCTION_GUIDE.md](file:///g:/My%20Drive/AI%20Platforms/Power%20Lunch/docs/PRODUCTION_GUIDE.md)**: **The Master Roadmap.** Outlines the long-term path to launch, including compliance, safety phases, and production checklists.

---

## 🚀 Current Project Focus

**Next Major Goal:** Phase 7 - Core Features Development (QR Verification, Reviews, Testing).

**Recently Completed (Phase 6 - Payment Integration):**
- [x] Upfront payment flow with authorization holds
- [x] Host response deadline (72h or 2h before event)
- [x] Auto-expiry system for unresponsive hosts
- [x] Email notifications via SendGrid for booking lifecycle
- [x] Stripe webhook handling for payment events

**Current Active Tasks (from [PRODUCTION_GUIDE.md](file:///g:/My%20Drive/AI%20Platforms/Power%20Lunch/docs/PRODUCTION_GUIDE.md)):**
- [x] QR Code verification system for session check-in
- [x] Review and rating system post-session
- [x] Real-time messaging (day-of chat)
- [x] End-to-end testing with Stripe test keys (Simulated/Verified flow logic)

> [!TIP]
> **AI Agents**: When starting a session, review this section first. Mark tasks as done here AND in the `PRODUCTION_GUIDE.md` when completed.

---

## 📝 Recent Changes Log

> **AI Agents**: Add your significant changes here!

### 2026-01-23
- **Flow Consolidation**: Harmonized legacy `listings` and newer `host_locations` systems.
- **Search Fix**: Map markers and list items now link to unified detail page `/listing/[id]`.
- **API Polymorphism**: `/api/listings/[id]` and `/api/bookings` now support both systems.
- **Host Profile Booking**: Completed the booking-to-checkout flow on host profile pages.
- **E2E Verification**: Verified all payment/booking states are connected and compatible.

### 2026-01-22
- **Payment Integration Hardening**: Completed Phase 6
  - Added `/api/bookings/[id]/accept/route.ts` - Host accepts pending booking, creates Payment Intent
  - Added `/api/bookings/[id]/cancel/route.ts` - Cancel with automatic refund processing
  - Added `CheckoutForm.tsx` - Stripe Elements payment form component
  - Added `/bookings/[id]/page.tsx` - Booking detail page with payment flow
  - Updated documentation strategy and consolidated conflicting plans

- **Upfront Payment Flow (Major Refactor)**: Changed booking flow so guests pay first
  - Guest pays upfront → money held (authorization)
  - Host has deadline to accept (72h or 2h before event)

---

## 📋 Quick Reference

| Item | Value |
|------|-------|
| **Framework** | Next.js 14.1 (App Router) |
| **Deployment** | Cloudflare Pages (auto-deploy from GitHub) |
| **Database** | Supabase (PostgreSQL) |
| **Payments** | Stripe Connect |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Maps** | Leaflet (loaded from CDN) |

---

## ⚠️ Critical: Local Development Limitations

### npm install DOES NOT WORK locally

The project files are stored on **Google Drive**, which causes file sync conflicts with npm:

```
npm warn tar TAR_ENTRY_ERROR UNKNOWN: unknown error, write
npm error EBADF: bad file descriptor, write
```

### ✅ How to Deploy & Test

1. **Make code changes** directly to the files
2. **Push to GitHub** using git commands:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. **Cloudflare automatically builds and deploys** from the GitHub repo
4. **Test on the live site** after deployment completes (~2-3 minutes)

### Git Commands That Work
```bash
# Check status
git status

# Add and commit
git add .
git commit -m "Your message"

# Push to trigger Cloudflare deploy
git push
```

---

## 📁 Project Structure

```
Power Lunch/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes (Edge Runtime)
│   │   │   ├── auth/          # Auth callbacks
│   │   │   ├── bookings/      # Booking CRUD
│   │   │   ├── host-locations/ # Host location pins
│   │   │   ├── hosts/         # Host management
│   │   │   ├── listings/      # Public listings
│   │   │   └── webhooks/      # Stripe webhooks
│   │   ├── auth/              # Login/signup pages
│   │   ├── host/              # Host dashboard & tools
│   │   │   ├── locations/new/ # Event/location creation ⭐
│   │   │   └── onboard/       # Host onboarding
│   │   ├── profile/           # User profile (has host tab)
│   │   ├── search/            # Search page with map
│   │   ├── listing/[id]/      # Individual listing view
│   │   ├── bookings/          # User's bookings
│   │   └── wallet/            # Payment/wallet management
│   ├── components/            # Shared React components
│   │   ├── Header.tsx
│   │   ├── FooterNav.tsx
│   │   ├── HostingTab.tsx
│   │   └── ProfileCard.tsx
│   └── lib/                   # Utilities & configs
│       ├── supabase/          # Supabase client (client + server)
│       ├── stripe/            # Stripe config
│       ├── i18n/              # Translations (EN/JA)
│       └── types/             # TypeScript types
├── supabase/
│   └── migrations/            # Database schema SQL files
├── middleware.ts              # Auth middleware
├── next.config.js             # Next.js + Cloudflare config
└── package.json
```

---

## 🗄️ Database Schema (Supabase)

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles (synced with Supabase Auth) |
| `hosts` | Host records (users who can create events) |
| `host_locations` | Event/location pins created by hosts |
| `bookings` | Reservations made by guests |
| `availability_slots` | Time slots for each location |

### host_locations Table (Important)
```sql
- id: uuid
- host_id: uuid (FK to hosts)
- name: text
- description: text
- location_area: text (for search)
- location_lat: float
- location_lng: float
- session_type: 'in_person' | 'online' | 'both'
- meet_link: text (for online sessions)
- venue_options: jsonb (array of {id, name, lat, lng})
- price_yen: integer
- duration_minutes: integer
- availability: jsonb (weekly schedule)
- blocked_dates: text[]
- is_active: boolean
```

---

## 🗺️ Maps Implementation

### Leaflet (Not MapLibre)
The project uses **Leaflet** loaded from CDN, NOT the maplibre-gl package in package.json.

```typescript
// How maps are loaded (in page components)
useEffect(() => {
    const linkEl = document.createElement('link')
    linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(linkEl)

    const scriptEl = document.createElement('script')
    scriptEl.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    document.head.appendChild(scriptEl)
}, [])
```

### Map Tile Provider
Using CartoDB Light tiles: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`

---

## 🌐 Internationalization (i18n)

The app supports English and Japanese. Translations are in:
- `src/lib/i18n/translations.ts`

Usage:
```typescript
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'

const { t, language } = useTranslation()
// t('key') returns translated string
```

---

## 🔑 API Routes Pattern

All API routes use **Edge Runtime** for Cloudflare compatibility:

```typescript
// src/app/api/example/route.ts
export const runtime = 'edge'

export async function GET(request: NextRequest) {
    // Use createServerClient for auth
    const supabase = createServerClient()
    // ...
}
```

---

## 📝 Recent Changes Log

> **AI Agents**: Add your significant changes here!

### 2026-01-22
- **Payment Integration Hardening**: Completed Phase 6
  - Added `/api/bookings/[id]/accept/route.ts` - Host accepts pending booking, creates Payment Intent
  - Added `/api/bookings/[id]/cancel/route.ts` - Cancel with automatic refund processing
  - Added `CheckoutForm.tsx` - Stripe Elements payment form component
  - Added `/bookings/[id]/page.tsx` - Booking detail page with payment flow
  - Updated documentation strategy and consolidated conflicting plans

- **Upfront Payment Flow (Major Refactor)**: Changed booking flow so guests pay first
  - Guest pays upfront → money held (authorization)
  - Host has deadline to accept (72h or 2h before event)
  - Host accepts → payment captured
  - Host declines → payment released
  - Auto-expire for unresponsive hosts
  - New files:
    - `src/lib/email/index.ts` - SendGrid email service
    - `src/app/api/bookings/[id]/decline/route.ts` - Host decline
    - `src/app/api/bookings/expire/route.ts` - Auto-expiry cron
    - `supabase/migrations/20260122_upfront_payment_flow.sql` - New DB columns
  - Updated files:
    - `src/lib/stripe/index.ts` - Added `createPaymentIntentWithHold`, `capturePayment`, `cancelPaymentIntent`
    - `src/app/api/bookings/route.ts` - Upfront payment on creation
    - `src/app/api/bookings/[id]/accept/route.ts` - Captures held payment
    - `src/app/api/bookings/[id]/cancel/route.ts` - Handles refund/release
    - `src/app/api/webhooks/stripe/route.ts` - New events for auth flow

### 2026-01-20
- **Profile Page Restructure**: Consolidated into 4 tabs
  - Tab 1: Edit Profile (inline form - moved from settings)
  - Tab 2: My Plans (bookings as guest)
  - Tab 3: Hosting (simplified - just events, no profile creation)
  - Tab 4: Wallet (inline - moved from /wallet page)
  - Removed Edit Profile from settings page
  - File: `src/app/profile/page.tsx`

- **Event Creation Redesign**: Combined 4-step wizard into 2 steps
  - Step 1: Location + Venues (with 1km radius circle, click-to-add venue pins)
  - Step 2: Schedule + Pricing
  - Added online meeting toggle with Google Meet link
  - File: `src/app/host/locations/new/page.tsx`

---

## 🚀 Deployment Checklist

When making changes:

1. ✅ Make code changes
2. ✅ Test syntax by reviewing the code (can't run locally)
3. ✅ Commit with descriptive message
4. ✅ Push to GitHub
5. ✅ Wait for Cloudflare build (~2-3 min)
6. ✅ Test on live site
7. ✅ **Update this README** if you changed project structure or added major features

---

## 🔧 Common Tasks

### Adding a New Page
1. Create folder in `src/app/[page-name]/`
2. Add `page.tsx` with `'use client'` directive if needed
3. Use existing components from `src/components/`

### Adding a New API Route
1. Create folder in `src/app/api/[route-name]/`
2. Add `route.ts` with `export const runtime = 'edge'`
3. Use `createServerClient` for authenticated routes

### Modifying Database
1. Update SQL in `supabase/migrations/`
2. Run SQL manually in Supabase Dashboard (SQL Editor)
3. Update types if needed

---

## 📞 Third-Party Services

| Service | Dashboard | Purpose |
|---------|-----------|---------|
| Cloudflare | dash.cloudflare.com | Hosting, CDN |
| Supabase | supabase.com/dashboard | Database, Auth |
| Stripe | dashboard.stripe.com | Payments |
| GitHub | github.com | Source control |

---

## ⚡ Performance Notes

- Images are unoptimized (`next.config.js`) - Cloudflare CDN handles caching
- API routes use Edge Runtime for low latency
- Maps loaded from CDN to reduce bundle size
- Tailwind CSS purges unused styles in production
