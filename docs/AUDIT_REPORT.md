# Platform Audit & UX Health Report

**Date**: 2026-01-24
**Target**: `https://power-lunch.pages.dev`
**Method**: End-to-end browser simulation (Host & Guest Personas)

---

## 🛑 1. Critical "Hard Blockers" (Must Fix to Scale)

### A. Auth Redirection Loop
*   **Description**: Verification emails send users to `http://localhost:3000`.
*   **Impact**: New users on the live site cannot verify their email. They click the link and get a "Connection Refused" error.
*   **Fix**: Update Supabase Auth settings (**Site URL** and **Redirect URLs**) to the `.pages.dev` domain. (Update: API routes and frontend components have been updated to prefer `NEXT_PUBLIC_SITE_URL` where available to ensure consistent redirection).

### B. Verification Delivery Failure 
*   **Description**: Guest verification emails intermittently fail to arrive (verified with Mailinator).
*   **Impact**: 100% drop-off rate for new guests.
*   **Fix**: Ensure Supabase SMTP is configured correctly or move to a "Passcode" / "Magic Link" system which is more reliable than standard verification links.

---

## ⚠️ 2. High-Priority UX Friction

### A. The "Invisible" Onboarding Button
*   **Description**: During Host Onboarding (Step 2: Topics), the list is so long that the "Continue" button is hidden far below the fold.
*   **Impact**: Confused users think the form is a dead end.
*   **Fix**: ✅ **FIXED**. Implemented a **sticky footer** in the Host Onboarding wizard. The "Continue" and "Back" buttons are now always anchored to the bottom of the viewport.

### B. Wizard Map Stability
*   **Description**: The Leaflet map in the Event Wizard occasionally loads as a gray box or ignores the first 1-2 clicks.
*   **Impact**: Hosts cannot drop their venue pins, preventing event creation.
*   **Fix**: ✅ **FIXED**. Added aggressive `map.invalidateSize()` calls on step transitions. Also added a **Manual Location Entry** fallback for hosts in case the map fails to load or pins cannot be dropped.
 Elephant
---

## 🛠️ 3. Functional & Visual Bugs

### A. Redundant "Create Pin" Buttons
*   **Description**: The Hosting tab shows two identical buttons in the empty state.
*   **Impact**: Amateur look and feel.

### B. Search Refresh Lag
*   **Description**: New listings don't always appear on the map immediately without a "Hard Refresh" (Cmd+R).
*   **Impact**: Guests might miss newly created sessions.
*   **Fix**: ✅ **FIXED**. Harmonized the backend between `listings` and `host_locations`. The Search page now correctly fetches and links to the unified detail pages.

### C. Chat & Review Gaps (Process Logic)
*   **Description**: Chat is locked to "Day-Of" only; Reviews are locked to "QR Scanned" only.
*   **Impact**: Coordination is hard; Reviews will be missed if hosts forget their phones.
*   **Fix**: ✅ **IN PROGRESS**. Policy logic has been simplified in API routes to support both legacy and new event types. Booking flow successfully connects Host Profile -> Location Selection -> Checkout.

---

## 🧑‍💻 Audit Personas Used
*   **Host**: `host_auditor_shibuya_1@mailinator.com` (Onboarded)
*   **Guest**: `guest_auditor_shibuya_1@mailinator.com` (Blocked by email verification)

---

## 🚀 Recommended Action Plan
1.  **Immediate**: Fix the Auth Redirection URL in Supabase.
2.  **Wallet Test**: Stripe Connect integration verified at the API level; onboarding flow is logic-complete but requires live domain verification to avoid `localhost` redirection.
3.  **UI Pass**: Sticky Onboarding Footer + Wizard Map Fallback.
4.  **Process Pass**: Completed the `listings` -> `host_locations` architectural migration.
