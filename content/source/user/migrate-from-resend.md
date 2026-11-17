---
title: Migrate from Resend
status: draft (describes the planned API; nothing is live yet)
updated: 2026-11-16
---

# Migrate from Resend

Your code can stay the same.

## Using the `resend` package

1. [Verify your domain](concepts.md#domains) on mailmeow. Your Resend DNS records don't carry over.
2. Create a mailmeow API key.
3. Change two environment variables:

```bash
RESEND_BASE_URL=https://api.mailmeow.dev
RESEND_API_KEY=mm_live_xxxxxxxxxxxx
```

That's it. `resend.emails.send`, `get` and `list` now go to mailmeow. (The `resend` package reads `RESEND_BASE_URL`; you can also pass `baseUrl` to its constructor.)

## Calling the API directly

Change the URL from `https://api.resend.com` to `https://api.mailmeow.dev` and use a mailmeow key. Request and response bodies are the same.

## Webhooks

Add your endpoint again in mailmeow and use the new `whsec_` secret. The signature scheme and payload shape are the same, so your verifier keeps working.

## What's different

| | Resend | mailmeow |
|---|---|---|
| Newsletters and campaigns | Same key | Use a separate key with the `broadcast` stream, so campaigns never delay login emails. [Why](concepts.md#streams-transactional-and-broadcast) |
| `attachments`, `scheduled_at`, `template`, `topic_id` | Supported | Not yet. Returns `422` naming the field |
| Opens and clicks | Tracked | Not tracked yet |
| Batch send, Audiences, Broadcasts API | Supported | Not yet |
| Test addresses | `delivered@resend.dev` and others | Use a `mm_test_` key; see [test mode](concepts.md#api-keys-and-test-mode) |

## Roll back

Switch the two environment variables back to your Resend values. Nothing else changes.
