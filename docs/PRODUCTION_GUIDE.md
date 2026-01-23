# Power Lunch - Production Implementation Guide

Complete checklist to transition from prototype to secure, production-ready platform.

**Priority:** 🔒 Data Safety & Payment Security

---

## Phase 1: Environment Setup

### ✅ Development Environment
- [ ] Install Node.js 18+ and npm/yarn
- [ ] Install Git and set up version control
- [ ] Create GitHub repository (private)
- [ ] Install VS Code with recommended extensions
- [ ] Set up `.env.local` file template (DO NOT commit)

### ✅ Service Accounts
- [x] Create Cloudflare account (for Pages)
- [x] Create Supabase account (free tier)
- [ ] Create Stripe account (Japan)
- [x] Create SendGrid account (free tier)
- [ ] Enable 2FA on ALL accounts 🔒

> [!IMPORTANT]
> **Living Plan**: This guide is a high-level roadmap. For current technical implementation details and recent changes, always refer to **[AI_INSTRUCTIONS.md](file:///g:/My%20Drive/AI%20Platforms/Power%20Lunch/AI_INSTRUCTIONS.md)**.

---

## Phase 2: Security Foundation (CRITICAL)

### 🔒 Stripe Security Setup
- [ ] Set up Stripe Connect (NOT standard payments)
- [ ] Enable SCA (Strong Customer Authentication)
- [ ] Configure webhook endpoints with signature verification
- [ ] Set up separate TEST and LIVE API keys
- [ ] **NEVER store payment card data** - use Stripe.js
- [ ] Implement 3D Secure for payments
- [ ] Set up fraud detection rules
- [ ] Configure payout schedules for hosts
- [ ] Test in Stripe Test Mode thoroughly

**Documentation:** https://stripe.com/docs/connect

### 🔒 Data Protection (GDPR/APPI Compliant)
- [ ] Create privacy policy (required in Japan)
- [ ] Create terms of service
- [ ] Implement cookie consent banner
- [ ] Set up data encryption at rest (Supabase default)
- [ ] Enable SSL/HTTPS (Vercel automatic)
- [ ] Implement Row Level Security (RLS) in Supabase
- [ ] Set up automated database backups
- [ ] Create data deletion workflow (GDPR right to be forgotten)
- [ ] Hash all passwords (Supabase Auth handles this)
- [ ] Sanitize all user inputs to prevent XSS

### 🔒 Authentication Security
- [ ] Enable email verification (Supabase Auth)
- [ ] Implement rate limiting for login attempts
- [ ] Add CAPTCHA for registration/login
- [ ] Set up password strength requirements (min 8 chars)
- [ ] Enable multi-factor authentication (optional for users)
- [ ] Create session timeout (30 days default)
- [ ] Implement secure password reset flow
- [ ] Log all authentication events

---

## Phase 3: Database Setup

### Supabase Project Initialization
- [ ] Create new Supabase project (Tokyo region for Japan)
- [ ] Enable Row Level Security on ALL tables
- [ ] Set up database backups (automatic on paid tier)
- [ ] Configure connection pooling
- [ ] Create database roles (authenticated, anon, service)

### Database Schema Design

#### Core Tables
```sql
-- Users table (managed by Supabase Auth)
- [ ] Create user profiles table (extends auth.users)
  - id (uuid, references auth.users)
  - full_name
  - avatar_url
  - language_preference (en/ja)
  - created_at
  - updated_at

-- Host profiles
- [ ] Create hosts table
  - user_id (uuid, references users)
  - bio
  - topics (array)
  - rating_average
  - total_sessions
  - response_rate
  - stripe_account_id (encrypted) 🔒
  - is_verified
  - created_at

-- Listings
- [ ] Create listings table
  - id (uuid)
  - host_id (references hosts)
  - title
  - description
  - price_yen
  - duration_minutes
  - location_lat
  - location_lng
  - venue_options (jsonb)
  - is_active
  - created_at

-- Availability
- [ ] Create availability_slots table
  - listing_id (references listings)
  - day_of_week (0-6)
  - start_time
  - end_time

-- Bookings
- [ ] Create bookings table
  - id (uuid)
  - listing_id
  - guest_id (references users)
  - host_id (references hosts)
  - booking_date
  - start_time
  - end_time
  - status (pending/confirmed/completed/cancelled)
  - venue_selected
  - guest_note
  - qr_code_hash 🔒
  - stripe_payment_intent_id
  - created_at

-- Payments
- [ ] Create transactions table
  - id (uuid)
  - booking_id
  - amount_yen
  - platform_fee_yen
  - host_payout_yen
  - stripe_charge_id
  - stripe_transfer_id
  - status (pending/completed/refunded)
  - created_at

-- Reviews
- [ ] Create reviews table
  - booking_id (unique)
  - reviewer_id
  - reviewee_id
  - rating (1-5)
  - comment
  - created_at

-- Messages
- [ ] Create messages table
  - booking_id
  - sender_id
  - message_text (encrypted) 🔒
  - is_read
  - created_at
```

### Row Level Security Policies
```sql
-- Examples (create for each table)
- [ ] Users can only read their own profile
- [ ] Users can only update their own profile
- [ ] Anyone can read active listings
- [ ] Only hosts can create/update their own listings
- [ ] Only booking participants can view booking details
- [ ] Only booking participants can send messages
- [ ] Admins can read all tables
```

---

## Phase 4: Next.js Application Setup

### Project Initialization
- [ ] Create Next.js 14+ project with TypeScript
- [ ] Install dependencies:
  ```bash
  npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
  npm install @stripe/stripe-js stripe
  npm install react-query
  npm install zod (validation)
  npm install bcrypt (additional hashing if needed)
  ```
- [x] Set up folder structure:
  ```
  /app (Next.js 14 app directory - Edge Runtime)
    /api (API routes)
    /auth (login, signup)
    /profile (Centralized hub: Edit, My Plans, Hosting, Wallet)
    /search (listings)
    /listing/[id] (listing details)
    /host/locations/new (Event creation)
  /components
  /lib (utilities)
    /supabase (client)
    /stripe (helpers)
  /types (TypeScript types)
  ```

### Environment Variables (🔒 CRITICAL)
```env
- [ ] Create .env.local file
- [ ] Add to .gitignore (verify!)
- [ ] Set up variables:
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY= (server-side only)
  STRIPE_PUBLISHABLE_KEY=
  STRIPE_SECRET_KEY= (server-side only)
  STRIPE_WEBHOOK_SECRET=
  SENDGRID_API_KEY=
  NEXT_PUBLIC_SITE_URL=
```

### Migrate HTML to Components
- [ ] Convert landing.html → /app/page.tsx
- [ ] Convert search.html → /app/search/page.tsx
- [ ] Convert listing_details.html → /app/listing/[id]/page.tsx
- [ ] Reuse existing CSS (import styles.css)
- [ ] Add TypeScript types
- [ ] Replace mock data with Supabase queries

---

## Phase 5: Authentication Implementation

### Supabase Auth Integration
- [ ] Set up Supabase Auth helpers
- [ ] Create login page with email/password
- [ ] Create signup page with email verification
- [ ] Implement password reset flow
- [ ] Add Google OAuth (optional)
- [ ] Create protected route middleware
- [ ] Implement session management
- [ ] Add "Remember Me" functionality
- [ ] Create logout functionality
- [ ] Test auth flow end-to-end

### Security Checklist
- [ ] Hash passwords (Supabase default) 🔒
- [ ] Validate email format
- [ ] Implement CSRF protection
- [ ] Add rate limiting (10 attempts/hour)
- [ ] Log failed login attempts
- [ ] Send email on suspicious activity

---

## Phase 6: Payment Integration (🔒 HIGH SECURITY)

### Stripe Connect Setup
- [x] Create Stripe Connect account
- [x] Set up Express or Standard accounts for hosts
- [x] Implement host onboarding flow
  - Collect bank account info (Stripe handles) 🔒
  - Verify identity documents
  - Accept terms of service
- [x] Build payment intent creation API (Upfront Authorization)
- [x] Integrate Stripe.js (client-side, PCI compliant)
- [x] Set up webhook listeners:
  - payment_intent.amount_capturable_updated (Auth)
  - payment_intent.succeeded (Capture)
  - payment_intent.payment_failed
  - account.updated (host verification)
- [x] Implement refund logic (Automatic on cancellation)
- [x] Calculate platform fee (15%)
- [ ] Set up automatic payouts to hosts
- [ ] Test with Stripe test cards

### Payment Security 🔒
- [ ] **NEVER touch card data** - use Stripe Elements
- [ ] Verify webhook signatures
- [ ] Use HTTPS only (Vercel enforces)
- [ ] Implement idempotency keys
- [ ] Log all payment transactions
- [ ] Set up fraud detection
- [ ] Enable 3D Secure
- [ ] Handle failed payments gracefully
- [ ] Store only Stripe IDs, never payment details

---

## Phase 7: Core Features Development

### Listing Management
- [ ] Create listing creation form
- [ ] Implement image upload (Supabase Storage)
- [ ] Add map picker for location
- [ ] Create availability scheduler (multiple time slots)
- [ ] Build listing edit/delete functionality
- [ ] Add listing activation/deactivation

### Booking Flow
- [ ] Create booking request UI
- [ ] Implement payment processing
- [ ] Generate unique QR codes (use uuid + hash) 🔒
- [ ] Send booking confirmation emails
- [ ] Create booking management dashboard
- [ ] Build cancellation flow
- [ ] Implement no-show reporting
- [ ] Handle refunds automatically

### QR Code System
- [ ] Generate secure QR codes
  ```javascript
  // Example
  const qrData = `${bookingId}:${hash(bookingId + secret)}`
  ```
- [ ] Create QR verification API
- [ ] Build host scanner page
- [ ] Implement session start tracking
- [ ] Add manual code entry fallback

### Messaging System
- [ ] Create chat UI (day-of only)
- [ ] Implement real-time updates (Supabase Realtime)
- [ ] Encrypt messages at rest 🔒
- [ ] Add message notifications
- [ ] Prevent spam/abuse

### Review System
- [ ] Create review submission form
- [ ] Calculate average ratings
- [ ] Display reviews on host profiles
- [ ] Implement review moderation
- [ ] Prevent duplicate reviews

---

## Phase 8: Email Notifications

### SendGrid Setup
- [ ] Configure DKIM/SPF for domain
- [ ] Create email templates:
  - Welcome email
  - Email verification
  - Booking confirmation
  - Booking reminder (24h before)
  - QR code delivery
  - Review request
  - Payment receipt
  - Payout notification
- [ ] Implement email queue
- [ ] Add unsubscribe functionality
- [ ] Test all email flows

---

## Phase 9: Security Hardening (🔒 CRITICAL)

### Application Security
- [ ] Implement input validation (Zod)
- [ ] Sanitize all user inputs
- [ ] Add CORS configuration
- [ ] Set security headers:
  ```javascript
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Strict-Transport-Security: max-age=31536000
  ```
- [ ] Implement rate limiting on API routes
- [ ] Add SQL injection protection (Supabase ORM safe)
- [ ] Prevent XSS attacks
- [ ] Enable Content Security Policy (CSP)
- [ ] Add logging for security events

### Data Privacy
- [ ] Encrypt sensitive data fields 🔒
- [ ] Implement data access logging
- [ ] Create privacy settings page
- [ ] Add account deletion functionality
- [ ] Export user data (GDPR compliance)
- [ ] Anonymize deleted user data
- [ ] Set up data retention policies

### PCI Compliance (for payments)
- [ ] Use Stripe.js (Level 1 PCI compliant)
- [ ] Never log card numbers
- [ ] Implement secure transmission
- [ ] Complete Stripe compliance questionnaire

---

## Phase 10: Testing

### Security Testing 🔒
- [ ] SQL injection testing
- [ ] XSS vulnerability testing
- [ ] CSRF testing
- [ ] Authentication bypass testing
- [ ] Rate limit testing
- [ ] Payment flow testing (test mode)
- [ ] Webhook signature verification testing

### Functional Testing
- [ ] User registration flow
- [ ] Login/logout flow
- [ ] Listing creation
- [ ] Booking flow
- [ ] Payment processing (test mode)
- [ ] QR code generation/scanning
- [ ] Review submission
- [ ] Email delivery
- [ ] Mobile responsiveness

### Load Testing
- [ ] Test concurrent users (100+)
- [ ] Test database queries under load
- [ ] Monitor API response times

---

## Phase 11: Deployment

### Cloudflare Deployment
- [ ] Connect GitHub repository to Cloudflare Pages
- [ ] Configure environment variables in Cloudflare dashboard
- [ ] Set up production domain
- [ ] Enable automatic deployments
- [ ] Set up Cloudflare Web Analytics

### Database Migration
- [ ] Export schema from development
- [ ] Apply to production Supabase
- [ ] Run data migrations
- [ ] Verify RLS policies
- [ ] Test database connectivity

### Post-Deployment
- [ ] Switch Stripe to LIVE mode
- [ ] Update webhook URLs to production
- [ ] Test payment flow in production
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure error tracking (Sentry optional)
- [ ] Set up uptime monitoring

---

## Phase 12: Legal & Compliance

### Japan-Specific Requirements
- [ ] Register business (株式会社 or 合同会社)
- [ ] Obtain necessary licenses
- [ ] Register with tax authorities
- [ ] Set up payment processing entity
- [ ] Comply with APPI (Japan's privacy law)
- [ ] Create Japanese privacy policy
- [ ] Create Japanese terms of service

### Platform Policies
- [ ] Create community guidelines
- [ ] Set up content moderation
- [ ] Create dispute resolution process
- [ ] Define refund policy
- [ ] Create host/guest conduct rules

---

## Phase 13: Monitoring & Maintenance

### Monitoring Setup
- [ ] Set up Vercel Analytics
- [ ] Monitor Supabase usage
- [ ] Track Stripe dashboard
- [ ] Set up error alerts
- [ ] Monitor uptime
- [ ] Track key metrics:
  - New signups
  - Active listings
  - Bookings per day
  - Revenue
  - Conversion rate

### Backup & Recovery
- [ ] Enable Supabase automatic backups (paid tier)
- [ ] Test database restore
- [ ] Document recovery procedures
- [ ] Create incident response plan

---

## 🔒 Security Checklist Summary

**CRITICAL - Verify Before Launch:**
- [ ] All passwords hashed (Supabase Auth ✓)
- [ ] HTTPS enabled (Vercel ✓)
- [ ] No secrets in code/Git
- [ ] Row Level Security enabled on ALL tables
- [ ] Stripe webhook signatures verified
- [ ] Never store payment card data
- [ ] Input validation on ALL forms
- [ ] Rate limiting implemented
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Email verification required
- [ ] 3D Secure enabled for payments
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Data encryption at rest
- [ ] Audit logs for sensitive actions

---

## 📊 Success Metrics

**Launch Criteria:**
- [ ] 5 test bookings completed successfully
- [ ] Payment processing 100% successful in test mode
- [ ] All security tests passed
- [ ] Mobile responsive on iOS/Android
- [ ] Email delivery working
- [ ] QR code system functional
- [ ] Privacy policy live
- [ ] Terms of service live

**Post-Launch Monitoring:**
- [ ] Zero payment failures
- [ ] Zero security incidents
- [ ] < 100ms API response time
- [ ] 99.9% uptime
- [ ] < 5% booking cancellation rate

---

## 🚀 Estimated Timeline

**Week 1-2:** Setup & Security Foundation  
**Week 3-4:** Database & Auth  
**Week 5-6:** Payment Integration  
**Week 7-8:** Core Features  
**Week 9:** Testing & Security Audit  
**Week 10:** Deployment & Legal  

**Total: 10 weeks to production-ready MVP**

---

## 💰 Cost Tracking

| Service | Free Tier Limit | When to Upgrade | Paid Cost |
|---------|----------------|-----------------|-----------|
| Cloudflare | Unlimited bandwidth | High traffic | ~$20/mo |
| Supabase | 500MB DB | 500+ listings | $25/mo |
| Stripe | Pay-per-transaction | Always | 2.9% + ¥30 |
| SendGrid | 100 emails/day | 40K emails/mo | $15/mo |

**Stay on free tier until:**
- 100+ bookings/month
- 500+ registered users
- Generating ¥150,000+/month revenue

---

## 📚 Resources

**Documentation:**
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Stripe Connect: https://stripe.com/docs/connect
- Vercel: https://vercel.com/docs

**Security:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Stripe Security: https://stripe.com/docs/security
- PCI Compliance: https://stripe.com/docs/security/guide

---

**Last Updated:** 2026-01-09  
**Status:** Ready to implement  
**Next Step:** Phase 1 - Environment Setup
