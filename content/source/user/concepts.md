---
title: Concepts
status: draft (describes the planned API; nothing is live yet)
updated: 2026-11-17
---

# Concepts

| Section | Read it when |
|---|---|
| [API keys and test mode](#api-keys-and-test-mode) | Setting up, or testing without sending real email |
| [Streams](#streams-transactional-and-broadcast) | You send newsletters or campaigns |
| [Domains](#domains) | Going live |
| [Email statuses](#email-statuses) | Showing delivery status or debugging |
| [Suppressions](#suppressions) | An address stopped receiving your email |
| [Idempotency](#idempotency) | Retrying requests safely |
| [Limits](#limits) | Sending a lot |

## API keys and test mode

- Send keys in the `Authorization: Bearer <key>` header.
- **Live keys** (`mm_live_`) deliver real email from verified domains.
- **Test keys** (`mm_test_`) never deliver. Any `from` address is allowed. Emails move through realistic statuses, and webhooks fire as usual.

In test mode, the recipient address picks the outcome:

| Send to | Result |
|---|---|
| any address | `delivered` |
| `bounced@test.mailmeow.dev` | `bounced` |
| `complained@test.mailmeow.dev` | `complained` |
| `delayed@test.mailmeow.dev` | `delivery_delayed`, then `delivered` |

Keep keys on your server. Never put them in browser or mobile app code.

## Keep your key on the server

Code that runs in a browser can be read by anyone who opens your site, so a key in it is a key you have given away. mailmeow refuses any request that arrives from a browser (one with an `Origin` header) with `403 browser_request_blocked`. The key is not revoked, and nothing is sent.

To send from a website, make your own server code send the email. In Next.js, that is a route handler. The browser calls your route, and the route calls mailmeow with the key from an environment variable (`MAILMEOW_API_KEY`):

```ts
// app/api/contact/route.ts
import { MailMeow } from "mailmeow";

const meow = new MailMeow(); // reads MAILMEOW_API_KEY

export async function POST(request: Request) {
  const { message } = await request.json();
  await meow.emails.send({
    from: "Acme <hello@acme.com>",
    to: ["you@acme.com"],
    subject: "New contact message",
    text: message,
  });
  return Response.json({ ok: true });
}
```

If a key was already used in browser code, revoke it and create a new one.

## Streams: transactional and broadcast

Every key belongs to one stream. You choose it when you create the key.

| Stream | For | Example |
|---|---|---|
| `transactional` (default) | Email a user expects right now | Login link, receipt, password reset |
| `broadcast` | Email you send to many people at once | Newsletter, product update, campaign |

The two streams never share a queue, so a big campaign can't delay a login email. If you send both kinds, create two keys.

Broadcast emails must include an unsubscribe link. Add the `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers so Gmail and Outlook show their own unsubscribe button.

## Domains

To send live email from `you@acme.com`, prove you own `acme.com` by adding DNS records. The dashboard shows the exact values with copy buttons.

| Record | Type | What it does |
|---|---|---|
| 3 × `<token>._domainkey.acme.com` | CNAME | **DKIM**: signs your email so receivers trust it |
| `bounce.acme.com` | MX | **Return path**: where bounce reports go |
| `bounce.acme.com` | TXT `v=spf1 include:amazonses.com ~all` | **SPF**: lists who may send for you |
| `_dmarc.acme.com` | TXT `v=DMARC1; p=none;` | **DMARC**: tells receivers what to do with failures |

Verification usually takes a few minutes, and up to 72 hours if your DNS is slow. Already have a DMARC record? Keep yours. Moving from Resend? Its records use `send.acme.com`; ours use `bounce.acme.com`, so you can add ours without removing Resend's until you finish switching.

## Email statuses

`last_event` on an email is one of:

| Status | Meaning |
|---|---|
| `queued` | Accepted; waiting to send |
| `sent` | Handed to the receiving mail server |
| `delivered` | The receiving server accepted it |
| `delivery_delayed` | The receiver asked us to retry later; we keep trying |
| `bounced` | The address can't receive mail. Permanent bounces are suppressed |
| `complained` | The recipient marked it as spam. The address is suppressed |
| `failed` | We couldn't send it (for example, the domain isn't verified) |
| `suppressed` | Not sent, because the address is on your suppression list |

Statuses only move forward. A late `sent` event never replaces `delivered`.

## Suppressions

When an address bounces permanently or marks you as spam, we stop sending to it. This protects your domain's reputation: repeated sends to bad addresses are the fastest way into the spam folder.

- Suppressions are per account.
- Sending to a suppressed address still returns an `id`. The email gets status `suppressed`, and a `email.suppressed` webhook fires.
- To remove an address (for example, a typo that got fixed), use the dashboard.

## Idempotency

Send an `Idempotency-Key` header (any unique string, up to 256 characters) to make retries safe:

- Same key + same body within 24 hours → the first response comes back, and nothing is sent twice.
- Same key + a different body → `409 invalid_idempotent_request`.

The `mailmeow` Node SDK adds a key for you and reuses it when it retries.

## Limits

These numbers are provisional for the beta.

| Limit | Value |
|---|---|
| Requests per second, per key | 10 |
| Recipients per email (`to` + `cc` + `bcc`) | 50 |
| Email size (`html` + `text` + headers) | 1 MB |

Going over the rate limit returns `429 rate_limit_exceeded` with a `retry-after` header in seconds.
