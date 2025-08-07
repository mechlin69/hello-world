# Text-Only Customer Portal (GUI-less Mobile App)

A text-based customer portal for service businesses. Works over SMS/WhatsApp-style webhooks. Customers can book appointments, pay invoices via Stripe, and view statements using plain text commands.

## Features
- Text commands: BOOK, MY APPTS, CANCEL, PAY, STATEMENT, PROFILE
- SQLite storage via better-sqlite3
- Stripe Checkout links for payments
- Generic JSON webhook and Twilio-compatible webhook

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

Copy `.env.sample` to `.env` and set values as needed.

3. Seed sample data (optional):

```bash
npm run seed
```

4. Run the server:

```bash
npm run dev
```

The server listens on `http://localhost:3000`.

## Endpoints
- `POST /webhook/msg` JSON body `{ from: "+15551234567", to: "+15557654321", body: "BOOK 2025-01-31 14:00" }` → JSON reply `{ to, body }`
- `POST /webhook/twilio` form-encoded Twilio webhook with `From`, `To`, `Body` → TwiML response
- `POST /webhook/stripe` raw body Stripe webhook (set `STRIPE_WEBHOOK_SECRET` if validating)

## Commands
- `MENU` or `HELP`: show commands
- `PROFILE Your Name | you@example.com`: update profile
- `BOOK YYYY-MM-DD HH:MM`: book an appointment (60 minutes default)
- `MY APPTS`: list upcoming appointments
- `CANCEL <AppointmentId>`: cancel an appointment
- `PAY` or `PAY <InvoiceId>`: get payment link for open invoices
- `PAY AMOUNT 100.00`: ad-hoc payment link (creates an invoice)
- `STATEMENT`: see open balances and recent paid

## Configuration
Environment variables in `.env`:

```
PORT=3000
DEFAULT_BUSINESS_NAME=ServiceCo
SQLITE_PATH=./portal.sqlite
STRIPE_SECRET=sk_live_or_test
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_SUCCESS_URL=https://example.com/success
PUBLIC_CANCEL_URL=https://example.com/cancel
SEED_CUSTOMER_PHONE=+15555550123
```

## Connect SMS
- Use `ngrok` to expose your local server
- Point your Twilio Messaging webhook to `https://<ngrok>/webhook/twilio`

## Notes
- This MVP does simple date parsing and scheduling, without availability calendars.
- Stripe metadata links payments to invoices. Expand as needed to attach business/customer IDs.

