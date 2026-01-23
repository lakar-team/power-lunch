# Power Lunch - Compliance & Regulations Guide

This document outlines the key regulations and compliance requirements for operating Power Lunch as a marketplace platform in Japan.

---

## 1. Stripe Connect Compliance

### Platform Requirements
As a Stripe Connect platform, Power Lunch must:
- **Complete platform verification** before creating Connected Accounts for hosts
- **Maintain accurate business information** in the Stripe Dashboard
- **Keep API keys secure** (never expose `STRIPE_SECRET_KEY` in client code)

### Host (Connected Account) Onboarding
Stripe handles KYC (Know Your Customer) requirements for hosts:
- Identity verification (passport, driver's license, My Number card)
- Bank account verification for payouts
- Business/individual information collection

**Power Lunch does NOT store any of this data** - Stripe handles it securely.

### Payment Flow Requirements
- All payments must go through Stripe (required for platform fee collection)
- 15% platform fee is automatically deducted before host payout
- Refunds must be processed through Stripe's refund API

---

## 2. Japanese Installment Sales Act (割賦販売法)

### Credit Card Security (Required)
Power Lunch must implement:

| Requirement | Our Implementation |
|-------------|-------------------|
| No storing card numbers on our servers | ✅ Stripe Elements handles all card data |
| 3D Secure support | ✅ Stripe enables automatically |
| CVC verification | ✅ Required by Stripe Elements |
| Fraud detection | ✅ Stripe Radar (automatic) |

### Statement Descriptors
Customers see these on their credit card statements:
- **Japanese cards**: `パワーランチ` (Katakana)
- **International cards**: `POWER LUNCH` (Romaji)

---

## 3. Specified Commercial Transactions Act (特定商取引法)

### Required Disclosures
The following must be displayed on the website (typically in Terms of Service or a dedicated page):

| Item | Requirement |
|------|-------------|
| Business name | Legal entity name or individual name |
| Address | Physical business address |
| Phone number | Customer support contact |
| Representative | Name of business owner/representative |
| Price display | Clear display of fees including tax |
| Payment timing | When customers are charged |
| Delivery/service timing | When service is provided |
| Cancellation policy | Conditions for refunds |
| Return policy | Not applicable (services, not goods) |

### Current Implementation
Our `/terms` page includes most of these disclosures. Ensure this page stays updated with accurate business information.

---

## 4. Japan Tax Regulations

### Consumption Tax (消費税)
- Current rate: **10%** on all goods/services
- **Invoicing requirement**: From October 2023, the "Qualified Invoice System" (適格請求書等保存方式) applies
- Hosts earning over ¥10,000,000/year must register as a taxable business

### Platform Tax Responsibilities
**Power Lunch (as the platform):**
- Must issue receipts/invoices for the platform fee portion
- Does NOT withhold taxes on behalf of hosts
- Hosts are responsible for their own tax reporting

**Hosts (as service providers):**
- Must report income from Power Lunch sessions
- Responsible for consumption tax collection if above threshold
- Must issue receipts to guests if requested

### Record Keeping
Both platform and hosts should retain:
- Transaction records for **7 years** (tax law requirement)
- All booking/payment data is stored in Supabase

---

## 5. Data Protection (個人情報保護法)

### Personal Information Handling
Power Lunch collects and stores:
- User email addresses
- User names
- Profile information (bio, expertise)
- Booking history

### Required Practices
- **Privacy policy** must be displayed and accepted at signup
- Users must be able to **request data deletion**
- Data must be **secured** (Supabase RLS, HTTPS)
- **No selling** of personal data to third parties

### Third-Party Services
We share data with:
- **Stripe** - Payment processing (PCI compliant)
- **Supabase** - Database hosting (SOC 2 compliant)
- **Vercel** - Web hosting (SOC 2 compliant)

---

## 6. Platform Fee Structure

### Current Configuration
| Component | Amount |
|-----------|--------|
| Session price | Set by host |
| Platform fee | 15% of session price |
| Host payout | 85% of session price |
| Stripe processing fee | ~3.6% (deducted from Power Lunch's 15%) |

### Disclosure Requirements
The 15% fee must be clearly disclosed to hosts:
- During onboarding (Terms acceptance)
- In the Terms of Service
- Optionally in the host dashboard

---

## 7. Dispute & Chargeback Policy

### Stripe Chargeback Protection
- Stripe automatically handles chargeback disputes
- Evidence must be provided within **7 days** of dispute
- Session confirmation (QR code scan) serves as proof of service delivery

### Power Lunch Dispute Process
1. Guest reports issue through platform
2. Host has 48 hours to respond
3. If unresolved, Power Lunch mediates
4. Refunds issued through Stripe if warranted

---

## 8. Ongoing Compliance Checklist

### Monthly
- [ ] Review Stripe Dashboard for any compliance alerts
- [ ] Check for chargebacks/disputes requiring attention

### Quarterly
- [ ] Update Terms of Service if business practices change
- [ ] Review privacy policy accuracy
- [ ] Verify business information in Stripe is current

### Annually
- [ ] Tax reporting (確定申告) for platform revenue
- [ ] Review and update this compliance document
- [ ] Security audit of access credentials

---

## 9. Key Contacts & Resources

### Stripe
- Dashboard: https://dashboard.stripe.com
- Support: https://support.stripe.com
- Japan documentation: https://stripe.com/docs/japan

### Japanese Tax Authority
- National Tax Agency: https://www.nta.go.jp
- Consumption tax info: https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/senkoku.htm

### Legal
Consider consulting a Japanese lawyer or tax accountant (税理士) for:
- Proper business registration
- Consumption tax registration
- Annual tax filing

---

*Last updated: January 2026*
