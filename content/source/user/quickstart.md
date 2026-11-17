---
title: Quickstart
status: draft (describes the planned API; nothing is live yet)
updated: 2026-11-16
---

# Quickstart: your first email

You need an API key. That's it. You can send with a **test key** before your domain is set up.

## 1. Get an API key

Keys look like this:

| Key | Prefix | What happens |
|---|---|---|
| Test | `mm_test_...` | Nothing is delivered. Emails get realistic statuses so you can build and test safely. |
| Live | `mm_live_...` | Real delivery. Needs a verified domain. |

Create keys in the dashboard under **API keys**. You see the full key once, so copy it somewhere safe. During the private beta, ask your mailmeow admin for a key.

Save it as an environment variable:

```bash
export MAILMEOW_API_KEY=mm_test_xxxxxxxxxxxx
```

## 2. Send an email

**cURL**

```bash
curl -X POST https://api.mailmeow.dev/emails \
  -H "Authorization: Bearer $MAILMEOW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Acme <hello@acme.com>",
    "to": "you@example.com",
    "subject": "Hello from mailmeow",
    "html": "<p>It works!</p>"
  }'
```

**Node.js**

```bash
npm install mailmeow
```

```ts
import { MailMeow } from 'mailmeow';

const meow = new MailMeow(); // reads MAILMEOW_API_KEY

const { data, error } = await meow.emails.send({
  from: 'Acme <hello@acme.com>',
  to: 'you@example.com',
  subject: 'Hello from mailmeow',
  html: '<p>It works!</p>',
});

if (error) {
  console.error(error.name, error.message);
} else {
  console.log('Sent:', data.id);
}
```

Already using the `resend` package? Keep it. See [Migrate from Resend](migrate-from-resend.md).

## 3. Check what happened

The easiest way: open **Emails** in the dashboard and pick the email. Each one shows where it got to.

From code, you can read an email back with a **Full access** key. New keys are **Send only** by default (safer if a key leaks), and a Send only key gets `403 restricted_api_key` here. To follow statuses from code with a Send only key, use a [webhook](webhooks.md) instead.

```bash
curl https://api.mailmeow.dev/emails/<id> \
  -H "Authorization: Bearer $MAILMEOW_API_KEY"
```

`last_event` tells you where the email is: `queued`, `sent`, `delivered`, `bounced`, and so on. See [Concepts](concepts.md#email-statuses).

## 4. Go live

1. [Verify your domain](concepts.md#domains) by adding the DNS records we show you.
2. Swap your `mm_test_` key for an `mm_live_` key.
3. Optional: [add a webhook](webhooks.md) so your app hears about bounces and complaints.

That's it. Go build the fun part.
