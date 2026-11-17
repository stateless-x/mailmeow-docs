---
title: Webhooks
status: draft (describes the planned API; nothing is live yet)
updated: 2026-11-16
---

# Webhooks

Webhooks tell your app when something happens to an email: delivered, bounced, marked as spam. Use them to stop emailing dead addresses and to show delivery status in your app.

## Set one up

1. In the dashboard, open **Webhooks**, add your endpoint URL (HTTPS), and choose events.
2. Copy the signing secret. It starts with `whsec_`.
3. Return any `2xx` status within 15 seconds. Do slow work after you respond.

## Events

| Event | When |
|---|---|
| `email.sent` | Handed to the receiving mail server |
| `email.delivered` | The receiving server accepted it |
| `email.delivery_delayed` | Delivery is being retried |
| `email.bounced` | The address can't receive mail |
| `email.complained` | The recipient marked it as spam |
| `email.failed` | We couldn't send it |
| `email.suppressed` | Not sent; the address is on your suppression list |

## Payload

```json
{
  "type": "email.bounced",
  "created_at": "2026-11-16T09:31:12.000Z",
  "data": {
    "email_id": "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
    "from": "Acme <hello@acme.com>",
    "to": ["you@example.com"],
    "subject": "Welcome!",
    "tags": [{ "name": "type", "value": "welcome" }],
    "created_at": "2026-11-16T09:30:00.000Z",
    "bounce": { "type": "permanent", "message": "Mailbox does not exist" }
  }
}
```

`bounce` appears only on `email.bounced`. The same event may arrive more than once, so use the `svix-id` header to skip duplicates. Events can also arrive out of order (an `email.bounced` before its `email.sent`), so sort by the top-level `created_at`, which is when the event happened.

## Verify the signature

Every request is signed so you know it came from us. Check it before trusting the body.

Headers (both sets carry the same values; use either):

| Header | Also sent as |
|---|---|
| `svix-id` | `webhook-id` |
| `svix-timestamp` | `webhook-timestamp` |
| `svix-signature` | `webhook-signature` |

**With the SDK**

```ts
import { MailMeow } from 'mailmeow';

const meow = new MailMeow();

// rawBody must be the exact request body string, not re-serialized JSON
const event = meow.webhooks.verify({
  payload: rawBody,
  headers: request.headers,
  secret: process.env.MAILMEOW_WEBHOOK_SECRET,
}); // throws if the signature is wrong
```

**Without the SDK (Node, no dependencies)**

```ts
import crypto from 'node:crypto';

export function verify(rawBody: string, headers: Record<string, string>, secret: string): boolean {
  const id = headers['svix-id'] ?? headers['webhook-id'];
  const ts = headers['svix-timestamp'] ?? headers['webhook-timestamp'];
  const sigHeader = headers['svix-signature'] ?? headers['webhook-signature'];
  if (!id || !ts || !sigHeader) return false;

  // reject anything older or newer than 5 minutes (stops replays)
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${ts}.${rawBody}`).digest('base64');

  // the header can hold several signatures, e.g. "v1,abc v1,def" during secret rotation
  return sigHeader.split(' ').some((part) => {
    const [version, sig] = part.split(',');
    return version === 'v1' && sig?.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  });
}
```

This is the same scheme Resend uses, so an existing Resend webhook verifier works unchanged.

## Retries

If your endpoint doesn't return `2xx`, we retry after about 5 seconds, 5 minutes, 30 minutes, 2 hours, 5 hours and 10 hours. After that the delivery is marked failed and shown in the dashboard. (Schedule is provisional for the beta.)
