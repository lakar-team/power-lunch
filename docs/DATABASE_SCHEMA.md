# Power Lunch Database Schema

**Last Updated**: 2026-01-24

---

## Tables Overview

| Table | Purpose | RLS Enabled |
|-------|---------|-------------|
| `profiles` | User profile info | ✅ Yes |
| `hosts` | Host accounts (linked to users) | ✅ Yes |
| `host_locations` | Event listings (pins) | ✅ Yes |
| `bookings` | Reservations | ✅ Yes |
| `transactions` | Payment records | ✅ Yes |
| `reviews` | Session ratings | ✅ Yes |
| `messages` | Real-time chat | ✅ Yes |

---

## Core Tables

### `profiles`
User profile information (extends Supabase auth.users).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | FK → auth.users |
| `full_name` | TEXT | |
| `avatar_url` | TEXT | |
| `bio` | TEXT | |
| `location` | TEXT | |
| `updated_at` | TIMESTAMPTZ | |

**Protected Data**: User PII (name, bio). Cannot be bulk-exported.

---

### `hosts`
Host accounts for users who can create events.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `stripe_account_id` | TEXT | Stripe Connect ID |
| `rating_average` | NUMERIC | 0-5 stars |
| `total_sessions` | INTEGER | Count |
| `created_at` | TIMESTAMPTZ | |

**Protected Data**: `stripe_account_id` - never expose to clients.

---

### `host_locations`
Event listings (Power Lunch pins).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `host_id` | UUID | FK → hosts |
| `title` | TEXT | |
| `description` | TEXT | |
| `price_yen` | INTEGER | Stored in JPY |
| `session_type` | TEXT | in_person / online / hybrid |
| `location_lat` | NUMERIC | Coordinates |
| `location_lng` | NUMERIC | |
| `central_address` | TEXT | General area name |
| `venue_options` | JSONB | Array of venue pins |
| `meet_link` | TEXT | Google Meet URL |
| `availability` | JSONB | Weekly slots |
| `created_at` | TIMESTAMPTZ | |

---

### `bookings`
Reservations between guests and hosts.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `listing_id` | UUID | FK → host_locations |
| `host_id` | UUID | FK → hosts |
| `guest_id` | UUID | FK → auth.users |
| `status` | TEXT | See status values below |
| `booking_date` | DATE | |
| `start_time` | TIME | |
| `end_time` | TIME | |
| `venue_selected` | TEXT | |
| `qr_code_hash` | TEXT | Check-in code (PL-XXXX-JP) |
| `stripe_payment_intent_id` | TEXT | |
| `host_response_deadline` | TIMESTAMPTZ | |
| `payment_authorized_at` | TIMESTAMPTZ | |
| `verified_at` | TIMESTAMPTZ | QR scanned |
| `completed_at` | TIMESTAMPTZ | |
| `cancelled_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

**Status Values**:
- `pending_payment` - Awaiting guest payment
- `pending_host` - Payment held, awaiting host response
- `confirmed` - Host accepted, payment captured
- `declined` - Host declined
- `expired` - Host didn't respond in time
- `cancelled` - Cancelled by guest or host
- `completed` - Session finished

**Protected Data**: `stripe_payment_intent_id`, `qr_code_hash`

---

### `transactions`
Payment records for auditing.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `booking_id` | UUID | FK → bookings |
| `stripe_payment_intent_id` | TEXT | |
| `amount_yen` | INTEGER | |
| `status` | TEXT | pending / captured / refunded |
| `created_at` | TIMESTAMPTZ | |

**Protected Data**: Entire table - financial records.

---

### `reviews`
Session ratings and feedback.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `booking_id` | UUID | FK → bookings (UNIQUE per reviewer) |
| `reviewer_id` | UUID | FK → auth.users |
| `reviewee_id` | UUID | FK → auth.users |
| `rating` | INTEGER | 1-5 |
| `comment` | TEXT | Optional |
| `created_at` | TIMESTAMPTZ | |

**Constraints**: One review per booking per user. No self-reviews.

---

### `messages`
Real-time chat between booking participants.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `booking_id` | UUID | FK → bookings |
| `sender_id` | UUID | FK → auth.users |
| `message_text` | TEXT | |
| `is_read` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

**Realtime Enabled**: Yes (supabase_realtime publication)

**Protected Data**: Messages are private to booking participants only.

---

## Row Level Security (RLS) Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own only | Own only | Own only | ❌ |
| hosts | Public | Own only | Own only | ❌ |
| host_locations | Public | Host only | Host only | Host only |
| bookings | Participant | Guest | Participant | ❌ |
| reviews | Public | Participant | ❌ | ❌ |
| messages | Participant | Participant | ❌ | ❌ |

---

## Sensitive Data Matrix

| Data | Storage | API Exposed? | Admin Only? |
|------|---------|--------------|-------------|
| User email | auth.users | ❌ Never | ✅ |
| Stripe IDs | hosts, transactions | ❌ Never | ✅ |
| Payment Intent | bookings | ❌ Never | ✅ |
| QR Hash | bookings | To guest only | ❌ |
| Messages | messages | Participants only | ❌ |
| Location coords | host_locations | Public (approx) | ❌ |

---

## Migration History

| File | Date | Description |
|------|------|-------------|
| `20260112_host_locations.sql` | 2026-01-12 | Initial schema |
| `add_host_profiles.sql` | 2026-01-15 | Host profiles |
| `20260122_upfront_payment_flow.sql` | 2026-01-22 | Payment statuses |
| `20260122_verification_completion.sql` | 2026-01-22 | QR verification columns |
| `20260122_reviews_table.sql` | 2026-01-22 | Reviews table |
| `20260124_messages_table.sql` | 2026-01-24 | Messages table |
