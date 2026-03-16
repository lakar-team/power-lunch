# 🥗 POWER LUNCH: SKILL-SHARING ECOSYSTEM

![Version](https://img.shields.io/badge/Version-1.1.0--BETA-green)
![Stack](https://img.shields.io/badge/Stack-Next.js_14-black)
![Database](https://img.shields.io/badge/Database-Supabase-blue)
![Payments](https://img.shields.io/badge/Payments-Stripe-blueviolet)

**Power Lunch** is a peer-to-peer skill-sharing platform that transforms your lunch break into a high-value learning session. Connect with experts, learn new skills over a 30-minute meal, or monetize your own knowledge by becoming a host.

## 🍱 The Concept

"ランチを、学び（Learning）に" — Power Lunch is designed for the modern professional. 

- 🤝 **Micro-Sessions**: Compact 30-minute meetings designed to fit perfectly into a standard lunch break.
- 🗺️ **Proximity Pairing**: Intuitive search and map integration to find hosts and sessions near your current location.
- 💳 **Seamless Transactions**: Integrated **Stripe** payment engine for secure booking and easy monetization for hosts.
- 🔐 **Secure Identity**: Robust authentication and user management powered by **Supabase**.

## ✨ Features for Users

- 🎯 **Curated Learning**: Browse categories from English conversation and coding to design and culinary arts.
- 📅 **One-Click Booking**: Simple scheduling system to lock in your next session.
- 💬 **Trust System**: Verified reviews and transparent host profiles to ensure high-quality interactions.

## 🚀 Features for Hosts

- 💰 **Monetize Your Skills**: Turn your lunch hour into a secondary income stream.
- 🛡️ **Flexible Control**: Manage your availability, pricing, and topics with a dedicated host dashboard.
- 💼 **Professional Networking**: Build your reputation within your industry one meal at a time.

## 🚀 Technical Architecture

- **Core**: Next.js 14 (App Router) / TypeScript
- **Auth & Database**: Supabase
- **Payments**: Stripe SDK
- **Styling**: Tailwind CSS
- **Platform**: Optimized for deployment on Vercel.

## 🛠️ Quick Start

### 1. Installation
```bash
npm install
```

### 2. Configuration
Setup your `.env.local` with Supabase and Stripe keys:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
STRIPE_SECRET_KEY=...
```

### 3. Execution
```bash
npm run dev
```

---
&copy; 2026 Lakar Lab / Advanced Agency Framework
