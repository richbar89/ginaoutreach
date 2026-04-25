# Collabi — 36-Day Beta Sprint Plan
**Start:** April 25, 2026 → **Beta launch:** May 30, 2026

> 💻 = Build (coding)  👤 = Your action (dashboard/console)  🧪 = Testing

---

## Week 1 — Foundation: Infrastructure + Visual (Apr 25–May 1)

| Day | Date | Task | Type |
|-----|------|------|------|
| 1 | Fri Apr 25 | Merge `feature/dashboard-update` → `main` → live on `collabi.io`. Confirm HTTPS/SSL working | 👤 |
| 2 | Sat Apr 26 | Dark sidebar — deep charcoal background, white labels, orange active accent | 💻 |
| 3 | Sun Apr 27 | Visual consistency pass — review every page: spacing, padding, font weights, button styles | 💻 |
| 4 | Mon Apr 28 | Empty states — every page gets a proper empty state (not just blank) | 💻 |
| 5 | Tue Apr 29 | Loading states — skeletons or spinners wherever data loads async | 💻 |
| 6 | Wed Apr 30 | Clerk: switch to production keys, update Vercel env vars, test sign-up on collabi.io | 👤 |
| 7 | Thu May 1 | Google OAuth: publish app to production, add `collabi.io` as authorised origin + redirect URI | 👤 |

---

## Week 2 — Auth + Contacts + Campaign Foundation (May 2–8)

| Day | Date | Task | Type |
|-----|------|------|------|
| 8 | Fri May 2 | Test Gmail connect + Outlook connect on `collabi.io`. Fix any redirect issues | 🧪 |
| 9 | Sat May 3 | Update `/privacy` + `/terms` with real email. Get Meta System User token | 👤 |
| 10 | Sun May 4 | Import all contacts CSVs (Food, Lifestyle, Beauty, Fitness) via admin. Run SQL migration | 👤 |
| 11 | Mon May 5 | Migrate deals from IndexedDB → Supabase (server-side, aggregatable, multi-device) | 💻 |
| 12 | Tue May 6 | Campaign builder UI — select contacts from list, name the campaign, set niche | 💻 |
| 13 | Wed May 7 | Sequence editor — write email template with `{{firstName}}`, `{{companyName}}`, `{{position}}` placeholders | 💻 |
| 14 | Thu May 8 | Multi-step sequences UI — add steps with day delays (Step 1 now, Step 2 +4 days, Step 3 +7 days) | 💻 |

---

## Week 3 — Campaign Engine (May 9–15)

| Day | Date | Task | Type |
|-----|------|------|------|
| 15 | Fri May 9 | Send queue — `campaign_queue` Supabase table, API to enqueue sends with status tracking | 💻 |
| 16 | Sat May 10 | Rate limiting — Vercel Cron job: 1 email per 5–10 mins, 40 emails/day cap per user | 💻 |
| 17 | Sun May 11 | Auto-pause on reply — detect reply in inbox, mark contact as replied, skip remaining steps | 💻 |
| 18 | Mon May 12 | Unsubscribe link — one-click opt-out footer in every campaign email, suppression list | 💻 |
| 19 | Tue May 13 | Campaign analytics — sent count, reply rate, skipped count per campaign | 💻 |
| 20 | Wed May 14 | Open tracking — invisible pixel in emails, log opens per contact per campaign | 💻 |
| 21 | Thu May 15 | End-to-end campaign test — create → send → follow-up → reply detection → analytics | 🧪 |

---

## Week 4 — Deal Management + Data Collection (May 16–22)

| Day | Date | Task | Type |
|-----|------|------|------|
| 22 | Fri May 16 | Brief storage — attach brand's creative brief (text/link) to each deal card | 💻 |
| 23 | Sat May 17 | Deliverables checklist — structured list per deal (e.g. 2x Reels, 3x Stories), tick off as delivered | 💻 |
| 24 | Sun May 18 | Structured deal data capture — log: content type, agreed amount, follower count, niche, platform | 💻 |
| 25 | Mon May 19 | Invoice generator — auto-generate PDF when deal hits "Paid" (creator, brand, deliverables, amount, date) | 💻 |
| 26 | Tue May 20 | Content calendar — calendar view of active deals by content due date, filter by platform/status | 💻 |
| 27 | Wed May 21 | Tax & earnings tracker — annual income summary by month, UK tax year toggle, CSV export | 💻 |
| 28 | Thu May 22 | Seed demo data — new users see a populated dashboard on first login, not an empty screen | 💻 |

---

## Week 5 — Polish + Launch Prep (May 23–29)

| Day | Date | Task | Type |
|-----|------|------|------|
| 29 | Fri May 23 | AI first-line personalisation — Claude generates a personalised opening line per contact at send time | 💻 |
| 30 | Sat May 24 | Landing page — update URL mockups to `collabi.io/dashboard`, review all copy | 💻 |
| 31 | Sun May 25 | Cookie notice + GDPR banner (UK law requirement) | 💻 |
| 32 | Mon May 26 | Full end-to-end run-through as a brand new user (sign up → connect email → campaign → deal) | 🧪 |
| 33 | Tue May 27 | Fix all issues found in Day 32 run-through | 💻 |
| 34 | Wed May 28 | Flip landing page — replace waitlist form with beta sign-up via Clerk | 💻 |
| 35 | Thu May 29 | Private beta — share with 2–3 hand-picked testers, gather first feedback | 👤 |

---

## Day 36 — Launch

| Day | Date | Task | Type |
|-----|------|------|------|
| 36 | Fri May 30 | Fix any critical tester feedback. Final deploy. **Beta is live. ✅** | 💻 👤 |

---

## Post-Beta Roadmap (June onwards)

- Stripe payments (£29/month)
- Rate benchmarking insights (once enough deal data collected)
- Brand reputation scores
- Inbox rotation
- Sponsored Content Monitor (Apify)
- Chrome extension
