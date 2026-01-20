# 🤖 AI Agent Instructions - Power Lunch

> **IMPORTANT**: This file is the primary reference for AI agents working on this project.  
> **UPDATE THIS FILE** when you make significant changes to the project structure, add new features, or change deployment processes.

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
