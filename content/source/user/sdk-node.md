---
title: Node.js SDK
status: draft (the `mailmeow` package is not published yet)
updated: 2026-11-17
---

# Node.js SDK

```bash
npm install mailmeow
```

Works on Node 18+, Bun, Deno and edge runtimes (Vercel, Cloudflare Workers). No dependencies.

## Set up

```ts
import { MailMeow } from 'mailmeow';

const meow = new MailMeow(); // reads MAILMEOW_API_KEY
// or: new MailMeow('mm_live_xxxxxxxxxxxx')
```

| Option | Env variable | Default |
|---|---|---|
| API key (first argument) | `MAILMEOW_API_KEY` | none, required |
| `baseUrl` | `MAILMEOW_BASE_URL` | `https://api.mailmeow.dev` |
| `fetch` | none | the global `fetch` (set it to use your own, for example in tests) |

`new MailMeow()` throws right away when no key is found. It is the only thing the SDK throws for a setup mistake.

## Results, not exceptions

Every call returns `{ data, error, headers }`. One of `data` or `error` is set:

```ts
const { data, error } = await meow.emails.send({ /* ... */ });

if (error) {
  // error.name is one of the names in the API reference, e.g. 'validation_error'
  console.error(error.name, error.message);
  return;
}
console.log(data.id);
```

If no response comes back at all (network down), you get `error.name === 'application_error'` with `error.statusCode === null`, and `headers` is `null`.

## Send

```ts
await meow.emails.send({
  from: 'Acme <hello@acme.com>',
  to: ['you@example.com'],
  subject: 'Welcome!',
  html: '<p>Glad you are here.</p>',
  text: 'Glad you are here.',
  replyTo: 'support@acme.com',
  tags: [{ name: 'type', value: 'welcome' }],
});
```

Fields use camelCase (`replyTo`). The SDK converts them for the API.

**Safe retries are built in.** The SDK gives every send an idempotency key and retries network errors, `429` and `5xx` up to 2 times with the same key, so a retry never sends twice. It waits 0.5 s, then 1 s, or the `retry-after` seconds the API sends (at most 30 s). `get` and `list` retry the same way. Pass your own key when the email is tied to something in your app:

```ts
await meow.emails.send(payload, { idempotencyKey: `welcome-${user.id}` });
```

## Get and list

```ts
const { data: email } = await meow.emails.get('4ef9a417-02e9-4d39-ad75-9611e0fcc33c');
console.log(email.last_event); // 'delivered'

const { data: page } = await meow.emails.list({ limit: 50 });
if (page.has_more) {
  const last = page.data[page.data.length - 1];
  await meow.emails.list({ limit: 50, after: last.id });
}
```

## Verify webhooks

```ts
const event = meow.webhooks.verify({ payload: rawBody, headers, secret });
```

It needs no network and returns the parsed event. It throws `WebhookVerificationError` for a wrong or expired signature (more than 5 minutes from now) and for missing headers. `headers` can be a `Headers` object or a plain object, with `svix-*` or `webhook-*` names. (Resend's own `webhooks.verify` takes `{ payload, headers: { id, timestamp, signature }, webhookSecret }` and also accepts our signatures.)

Details in [Webhooks](webhooks.md#verify-the-signature).

## Coming later
- `react` option to send React Email components directly.
- Batch send, domains and API keys.
