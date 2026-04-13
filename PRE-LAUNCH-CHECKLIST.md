# Collabi — Pre-Launch Checklist

Things to complete before selling to real users.

---

## Domain & Hosting

- [ ] Buy a custom domain (e.g. `collabi.io` or `collabi.co`)
- [ ] Connect custom domain to Replit deployment
- [ ] Confirm HTTPS/SSL is working on custom domain

---

## Authentication (Clerk + Google OAuth)

- [ ] Deploy Clerk app to production (Dashboard → "Deploy your app to production")
  - Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in Replit Secrets with the new production keys
- [ ] Add custom domain to Clerk's allowed domains
- [ ] In Google Cloud Console → OAuth consent screen → **Publish App** (moves from Testing to Production)
- [ ] In Google Cloud Console → OAuth 2.0 Credentials:
  - Add custom domain to **Authorized JavaScript origins**
  - Add Clerk production callback URL to **Authorized redirect URIs**
- [ ] Test full sign-up flow with Google on the live domain
- [ ] Test full sign-up flow with email/password on the live domain

---

## Payments (Stripe)

- [ ] Create Stripe account
- [ ] Set up a £29/month product + price in Stripe dashboard
- [ ] Add Stripe keys to Replit Secrets
- [ ] Build checkout flow (sign-up → payment → dashboard)
- [ ] Set up Stripe webhook to activate/deactivate user access on payment events
- [ ] Test payment end-to-end with Stripe test cards
- [ ] Switch Stripe to live mode before launch

---

## Email (Gmail OAuth for sending)

- [ ] Register your custom domain in Google Cloud Console as an authorised origin
- [ ] Test Gmail connect flow on live domain
- [ ] Test Outlook/Microsoft connect flow on live domain

---

## App Polish

- [ ] Seed demo data for new users so the dashboard isn't empty on first login
- [ ] Test full onboarding flow (sign up → connect email → profile → dashboard)
- [ ] Check mobile layout on landing page and key app screens
- [ ] Update landing page with real custom domain URL in mockup (`collabi.io/dashboard`)

---

## Legal & Trust

- [x] Add Privacy Policy page (`/privacy`)
- [x] Add Terms of Service page (`/terms`)
- [x] Add Data Removal request page (`/data-removal`)
- [x] Link all three from footer of landing page
- [ ] Update `hello@collabi.io` in `/privacy` and `/terms` to your real email address once domain is live
- [ ] Add cookie notice if needed (UK/GDPR)

---

## Creator Capacity & Urgency

- [x] Add creator type selection to onboarding (Foodie / Lifestyle / Beauty / Fitness)
- [x] Store `creator_type` in `user_settings` Supabase table
- [ ] Build dynamic capacity bars pulling real signup counts per vertical
- [x] Set capacity limits per vertical — managed via admin dashboard, persisted in `creator_capacity` table
- [x] Urgency bars on landing page now fetch from DB — update via Admin → Dashboard

---

## Database — Contacts

- [ ] Re-import food contacts CSV through admin — new import now auto-detects subcategory from Apollo keywords (Beer & Brewing, Drinks, Coffee & Tea etc.)
- [ ] Import Lifestyle contacts CSV (next vertical)
- [ ] Import Beauty contacts CSV
- [ ] Import Fitness contacts CSV
- [ ] Run `supabase/migrations/006_fix_contact_categories.sql` in Supabase SQL editor after re-import to tidy any remaining legacy category values

---

## App UI & Features — Backlog

- [x] **Deal Pipeline** — add drag-and-drop between stages (currently static cards)
- [x] **Remove Trend Monitor** — `/trends` page and sidebar link to be deleted
- [ ] **Meta Ad Alerts** — improve the `/ads` page (better UI, more actionable data)
- [ ] **Sidebar** — restructure into cleaner sections, easier to navigate
- [ ] **Sidebar Outreach section** — tidy up items (review labels, order, remove clutter)

---

## Pre-Launch

- [ ] Send test emails from a real connected inbox to confirm deliverability
- [ ] Do a full end-to-end run-through as a new user
- [ ] Share with 2–3 beta testers before opening up broadly
