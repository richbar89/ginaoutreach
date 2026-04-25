# Collabi — Pre-Launch Checklist

Things to complete before selling to real users.

---

## Domain & Hosting

- [x] Buy a custom domain (`collabi.io`)
- [x] Connect custom domain to Vercel
- [ ] Confirm HTTPS/SSL is working on custom domain
- [ ] **Meta Access Token** — replace `META_ACCESS_TOKEN` in Vercel env vars with a non-expiring System User token:
  1. Go to business.facebook.com → Settings → Users → System Users
  2. Create a system user, assign to your Meta app with required permissions
  3. Generate token → update `META_ACCESS_TOKEN` in Vercel → redeploy

---

## Authentication (Clerk + Google OAuth)

- [ ] Deploy Clerk app to production (Dashboard → "Deploy your app to production")
  - Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in Vercel env vars with the new production keys
- [ ] Add custom domain to Clerk's allowed domains
- [ ] In Google Cloud Console → OAuth consent screen → **Publish App** (moves from Testing to Production)
- [ ] In Google Cloud Console → OAuth 2.0 Credentials:
  - Add custom domain to **Authorized JavaScript origins**
  - Add Clerk production callback URL to **Authorized redirect URIs**
- [ ] Test full sign-up flow with Google on the live domain
- [ ] Test full sign-up flow with email/password on the live domain

---

## Payments (Stripe) — POST-BETA

> Beta is free — skip until after beta closes.

- [ ] Create Stripe account
- [ ] Set up a £29/month product + price in Stripe dashboard
- [ ] Add Stripe keys to Vercel env vars
- [ ] Build checkout flow (sign-up → payment → dashboard)
- [ ] Set up Stripe webhook to activate/deactivate user access on payment events
- [ ] Test payment end-to-end with Stripe test cards
- [ ] Switch Stripe to live mode before paid launch

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

## Visual & Design Polish

- [ ] Perfect overall app aesthetic — spacing, card styling, typography hierarchy
- [ ] Dark sidebar (deep charcoal + white labels + orange accent)
- [ ] Review every page for consistency — padding, font weights, button styles
- [ ] Empty states — every page needs a good empty state (not just blank)
- [ ] Loading states — skeletons or spinners where data loads async
- [ ] Mobile layout — landing page at minimum, app screens if time allows

---

## Email Sequences & Automated Campaigns

Core feature — influencers select contacts, build a sequence, system sends automatically with rate limiting.

### Build
- [ ] **Campaign builder** — select contacts from list, give campaign a name/niche
- [ ] **Sequence editor** — write emails with placeholders: `{{firstName}}`, `{{companyName}}`, `{{position}}`
- [ ] **Multi-step sequences** — Step 1 (initial pitch), Step 2 (follow-up if no reply, e.g. +4 days), Step 3 (final bump, e.g. +7 days)
- [ ] **Send queue** — store pending sends in Supabase (`campaign_queue` table) with status: pending / sent / failed / skipped
- [ ] **Rate limiting** — cap at 40 emails/day per user, send one every 5–10 mins via Vercel Cron
- [ ] **Auto-pause on reply** — when inbox detects a reply, mark contact as replied and skip remaining steps
- [ ] **Unsubscribe link** — legally required (UK GDPR); one-click opt-out that suppresses future sends

### Analytics
- [ ] **Campaign stats** — sent count, open rate, reply rate, bounce rate per campaign
- [ ] **Open tracking** — tracking pixel in emails to detect opens
- [ ] **Per-contact status** — show each contact's journey through the sequence

---

## Data Collection & Market Intelligence

> The long-term moat. Every deal logged makes the platform smarter for every user. Anonymised + aggregated = network effect.

### Deal & Rate Data (collect from day 1)
- [ ] **Structured deal logging** — when a deal moves to Contracted/Paid, capture: brand, content type (post/reel/story/YouTube/TikTok), agreed amount, follower count at time of deal, niche, platform
- [ ] **Offer tracking** — log opening offer vs final agreed amount to build negotiation intelligence over time
- [ ] **Payment timing** — log invoice date and payment received date to flag slow-paying brands

### Benchmarking Insights (build once enough data exists)
- [ ] **Rate benchmarking** — "Creators with 25K–75K followers in food & drink typically earn £400–£900 for an Instagram Reel" — anonymised aggregate across all users
- [ ] **Brand reputation scores** — community-sourced: paid on time, clear brief, good to work with (Glassdoor for brands)
- [ ] **Negotiation intelligence** — "Brands in this niche typically increase their offer by X% when countered"
- [ ] **Response rate benchmarks** — "Your reply rate is 11% vs platform average of 7%"
- [ ] **Seasonal spend patterns** — highlight when brands in each niche are most active (Q4 gifting, Jan fitness etc.)

### Data Strategy Notes
- All rate/deal data should be stored server-side in Supabase (not IndexedDB) so it's aggregatable
- Anonymise before any aggregation — never expose individual user's deal values
- This dataset becomes a significant competitive moat — start collecting from beta day 1 even if insights UI comes later

---

## Deal Management — Completing the Workflow

- [ ] **Invoice generator** — when a deal hits "Paid", auto-generate a professional PDF invoice (creator name, brand, deliverables, amount, date). Self-employed creators need this for every deal
- [ ] **Brief storage** — attach the brand's creative brief to each deal card. Single source of truth — no more digging through emails
- [ ] **Deliverables checklist** — structured list per deal: e.g. "2x Instagram Reels, 3x Stories, 1x TikTok". Tick off as delivered. Shows at a glance what's outstanding
- [ ] **Content calendar** — calendar view of all active deals showing when content is due to go live. Filter by platform, niche, status

---

## Creator Profile & Stats

- [ ] **Instagram stats pull** — connect Instagram account via API and pull real follower count, engagement rate, average reach into the media kit automatically
- [ ] **TikTok stats pull** — same for TikTok: followers, average views, engagement rate
- [ ] Note: both require OAuth app approval from Meta/TikTok — start the approval process early as it can take weeks

---

## Tax & Earnings Tracker

- [ ] **Annual earnings summary** — pull all "Paid" deals for the tax year, total income by month, exportable as CSV for accountant/self-assessment
- [ ] **Expense notes** — simple field to log deductible expenses against deals (equipment, props, travel)
- [ ] **Tax year toggle** — UK tax year (April–April) view vs calendar year

---

## Additional Feature Ideas

- [ ] **AI first-line personalisation** — Claude generates a personalised opening line per contact based on their company/role. Lemlist charges extra for this
- [ ] **Media kit auto-attach** — option to attach media kit link to outreach emails automatically
- [ ] **Inbox rotation** — connect multiple Gmail/Outlook accounts and distribute sends across them (improves deliverability)
- [ ] **Sponsored Content Monitor** — twice-weekly Apify scrape of a watchlist of influencers, detecting `#ad`/`#sponsored` in captions. Alert admin when detected. Possible page: `/influencer-intel`
- [ ] **Meta Ad Alerts** — improve the `/ads` page (better UI, more actionable data)

---

## App UI & Features — Backlog

- [x] **Deal Pipeline** — add drag-and-drop between stages
- [x] **Remove Trend Monitor** — `/trends` page and sidebar link deleted
- [ ] **Sidebar** — restructure into cleaner sections once dark sidebar is done

---

## Pre-Launch

- [ ] Send test emails from a real connected inbox to confirm deliverability
- [ ] Do a full end-to-end run-through as a new user
- [ ] Share with 2–3 beta testers before opening up broadly
