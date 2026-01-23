# Power Lunch

A micro-session marketplace connecting hosts and guests over lunch in Japan.

## ⚠️ Critical: Development Note

This project is stored on **Google Drive**, which causes sync conflicts with `npm`. 

> [!CAUTION]
> **DO NOT run `npm install` locally.** It will cause "bad file descriptor" errors and sync issues.

### How to Develop & Deploy
1. **Edit code** directly in your editor.
2. **Push to GitHub** to trigger an automatic build.
3. **Test on the live/preview environment** on Cloudflare Pages (~2-3 min deploy time).

---

## Quick Reference

| Item | Value |
|------|-------|
| **Framework** | Next.js 14.1 (App Router) |
| **Deployment** | Cloudflare Pages |
| **Database** | Supabase (Tokyo Region) |
| **Payments** | Stripe Connect |
| **Maps** | Leaflet (CDN) |

---

## Project Structure

```
Power Lunch/
├── docs/                    # Documentation (Implementation Guide, etc.)
├── prototype/               # Original HTML prototypes
├── src/                     # Next.js application
│   ├── app/                # Pages (Consolidated Profile, Search, Host tools)
│   ├── components/         # Shared React components
│   ├── lib/                # Utilities (Supabase, Stripe, i18n)
│   └── types/              # TypeScript types
├── supabase/               # Database migrations
└── AI_INSTRUCTIONS.md      # Primary technical reference for AI agents
```

## Key Pages
- **Search**: `/search` - Map-based discovery.
- **Profile**: `/profile` - Centralized hub with 4 tabs:
  1. **Edit Profile**: Bio and contact info.
  2. **My Plans**: Guest bookings.
  3. **Hosting**: Host event management.
  4. **Wallet**: Payment setup and balance.
- **Host Tools**: `/host/locations/new` - Event creation wizard.

## Third-Party Services

| Service | Purpose | Hosting |
|---------|---------|-----------|
| **Cloudflare** | Hosting + CDN | Production |
| **Supabase** | Database + Auth | Production |
| **Stripe** | Payments | Production |

## Living Documentation
For the most up-to-date technical details, check **[AI_INSTRUCTIONS.md](file:///AI_INSTRUCTIONS.md)**.
