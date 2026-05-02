# Future Features

Features parked intentionally — to be revisited once there are users.

## Gmail Inbox in App
- **What:** Show received emails inside Collabi so users can read replies without leaving the app.
- **Why parked:** Requires `gmail.readonly` OAuth scope → Google security review (4–6 weeks, restricted scope).
- **Current approach:** Users send via SMTP App Password; replies go to their Gmail directly.
- **When to revisit:** Post-Google-verification, or if users consistently request it.

## Reply Tracking / Response Analytics
- **What:** Detect when a brand replies to an outreach email, auto-update deal status to "Replied", track reply rates per template.
- **How it works:** Set `Reply-To: track+{dealId}@collabi.io` on outgoing emails. Inbound email webhook (Postmark / Mailgun inbound routing) catches replies and updates the deal.
- **Why parked:** Requires inbound email infrastructure (MX record, webhook handler). No users yet to validate demand.
- **When to revisit:** Once reply-rate analytics become a requested feature.

## Gmail OAuth Connect (Full)
- **What:** OAuth-based Gmail connection (no App Password needed), with full inbox read/send via Gmail API.
- **Why parked:** Requires Google app verification for restricted scopes (`gmail.send`, `gmail.readonly`). Time-consuming review process.
- **Current approach:** SMTP App Password (simpler, no Google review needed).
- **When to revisit:** When scaling beyond beta and Google verification is worth the effort.
