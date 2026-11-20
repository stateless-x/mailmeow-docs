---
title: API reference
status: draft (describes the planned API; nothing is live yet)
updated: 2026-11-20
---

# API reference

Base URL: `https://api.mailmeow.dev`
Auth: `Authorization: Bearer <api key>`
Format: JSON request and response bodies. Field names are `snake_case`.

| Endpoint | What it does |
|---|---|
| [`POST /emails`](#send-an-email) | Send an email |
| [`GET /emails/{id}`](#get-an-email) | Get one email and its status |
| [`GET /emails`](#list-emails) | List emails, newest first |
| [Errors](#errors) | Error format and names |

The API matches Resend's for these endpoints, so the `resend` SDK works too.

## Send an email

`POST /emails`

| Field | Type | Required | Notes |
|---|---|---|---|
| `from` | string | yes | `"Name <hello@acme.com>"` or `"hello@acme.com"`. Live keys need a verified domain |
| `to` | string or string[] | yes | Max 50 recipients across `to`, `cc` and `bcc` |
| `subject` | string | yes | |
| `html` | string | one of `html` or `text` | |
| `text` | string | one of `html` or `text` | Recommended alongside `html` |
| `cc`, `bcc` | string or string[] | no | |
| `reply_to` | string or string[] | no | |
| `headers` | object | no | Custom email headers, for example `List-Unsubscribe` |
| `tags` | array of `{ name, value }` | no | Your own labels; returned on the email and in webhooks. ASCII letters, numbers, `_` and `-` |
| `attachments` | array of files | no | Up to 20 files, 10 MB in total. See [Attachments](#attachments) |

Not supported yet: `scheduled_at`, `template`, `topic_id`. Sending any of them returns `422 validation_error` that names the field, so nothing is silently ignored.

Optional request header: `Idempotency-Key` (see [Idempotency](concepts.md#idempotency)).

```bash
curl -X POST https://api.mailmeow.dev/emails \
  -H "Authorization: Bearer mm_live_xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: welcome-user-123" \
  -d '{
    "from": "Acme <hello@acme.com>",
    "to": ["you@example.com"],
    "subject": "Welcome!",
    "html": "<p>Glad you are here.</p>",
    "text": "Glad you are here.",
    "tags": [{ "name": "type", "value": "welcome" }]
  }'
```

Response `200`:

```json
{ "id": "4ef9a417-02e9-4d39-ad75-9611e0fcc33c" }
```

`200` means the email is accepted and queued, not delivered yet. Track delivery with [Get an email](#get-an-email) or [webhooks](webhooks.md).

### Attachments

Each item in `attachments` is a file:

| Field | Type | Required | Notes |
|---|---|---|---|
| `filename` | string | yes | Shown to the person who gets the email, for example `invoice.pdf` |
| `content` | string | yes | The file as base64 |
| `content_type` | string | no | For example `application/pdf`. Taken from the file name when missing |
| `content_id` | string | no | Makes the file an inline image. See below |

- Send the file as base64 in `content`. `path` (a URL to fetch the file from) is not supported yet and returns `422`. With the `resend` package, a Node `Buffer` as `content` works as is.
- Limits: 10 MB of files in total per email (before base64), and at most 20 files. Over either limit returns `422` with the limit in `message`.
- Files that email providers block, such as `.exe`, `.bat`, `.js`, `.msi` and `.vbs`, return `422` naming the file.
- The file content is deleted once the email is sent (or fails), and at the latest after 7 days. The name, type and size stay with the email ([Retention](concepts.md#retention)).

To show an image inside the email, give the file a `content_id` and point to it from `html` with `cid:`:

```json
{
  "from": "Acme <hello@acme.com>",
  "to": ["you@example.com"],
  "subject": "Your invoice",
  "html": "<img src=\"cid:logo\"><p>Invoice attached.</p>",
  "attachments": [
    { "filename": "invoice.pdf", "content": "JVBERi0xLjQK..." },
    { "filename": "logo.png", "content": "iVBORw0KGgo...", "content_id": "logo" }
  ]
}
```

## Get an email

`GET /emails/{id}`

Response `200`:

```json
{
  "object": "email",
  "id": "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
  "from": "Acme <hello@acme.com>",
  "to": ["you@example.com"],
  "cc": null,
  "bcc": null,
  "reply_to": null,
  "subject": "Welcome!",
  "html": "<p>Glad you are here.</p>",
  "text": "Glad you are here.",
  "tags": [{ "name": "type", "value": "welcome" }],
  "last_event": "delivered",
  "created_at": "2026-11-16T09:30:00.000Z",
  "attachments": [
    { "filename": "invoice.pdf", "content_type": "application/pdf", "size": 48210 }
  ]
}
```

`attachments` lists the files sent with the email: name, type and `size` in bytes. It is `[]` when there are none. The file content is never returned, because it is deleted once the email is sent. [List emails](#list-emails) does not include `attachments`.

Test keys only see test emails; live keys only see live emails.

`last_event` values are listed in [Email statuses](concepts.md#email-statuses). Email bodies are kept for 7 days on the Free plan and 30 days on paid plans; after that `html` and `text` return `null`. The email itself is deleted after 90 days on every plan ([Retention](concepts.md#retention)).

## List emails

`GET /emails?limit=20&after=<id>`

| Query | Default | Notes |
|---|---|---|
| `limit` | 20 | 1 to 100 |
| `after` | | Return emails older than this id (next page) |
| `before` | | Return emails newer than this id |

Response `200`:

```json
{
  "object": "list",
  "has_more": true,
  "data": [
    {
      "id": "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
      "from": "Acme <hello@acme.com>",
      "to": ["you@example.com"],
      "subject": "Welcome!",
      "last_event": "delivered",
      "created_at": "2026-11-16T09:30:00.000Z"
    }
  ]
}
```

To get the next page, pass the last item's `id` as `after`.

## Errors

Errors always have this shape:

```json
{
  "statusCode": 422,
  "name": "validation_error",
  "message": "The `scheduled_at` field is not supported yet."
}
```

| Status | `name` | What to do |
|---|---|---|
| 400 | `invalid_request` | Fix the JSON or a query parameter |
| 401 | `missing_api_key` | Add the `Authorization: Bearer` header |
| 403 | `invalid_api_key` | Check the key; it may be revoked, or its workspace may have been deleted |
| 403 | `invalid_from_address` | Verify the `from` domain, or use a test key |
| 403 | `browser_request_blocked` | The key was used from a browser. Call mailmeow from your server instead ([why](https://docs.mailmeow.dev/concepts#keep-your-key-on-the-server)) |
| 403 | `restricted_api_key` | This key can only send emails. Use a key with full access to read emails |
| 403 | `account_paused` | Your account is paused, so it cannot send live email (test keys still work). mailmeow pauses an account on its own when too many emails bounce or are reported as spam; contact support to ask for a review |
| 404 | `not_found` | Check the id |
| 405 | `method_not_allowed` | Use the method shown in the docs for this endpoint |
| 409 | `invalid_idempotent_request` | You reused an `Idempotency-Key` with a different body |
| 409 | `concurrent_idempotent_requests` | The same key is still being processed; retry shortly |
| 422 | `validation_error` | Read `message`; it names the field |
| 429 | `rate_limit_exceeded` | Wait for the `retry-after` seconds, then retry |
| 429 | `daily_quota_exceeded` | This email would pass the account's daily limit (100 emails a day to start). Every `to`, `cc` and `bcc` address counts as one email, so an email to 5 people uses 5. An email that lands exactly on the limit is sent. Nothing was saved. In test mode the same code means 1,000 recipients a day. Don't retry until the time in `message`: midnight UTC, 07:00 in Thailand. Contact us to raise the limit |
| 429 | `monthly_quota_exceeded` | This email would pass a Free account's monthly limit. Recipients count as above. Nothing was saved. Sending starts again on the 1st (00:00 UTC), or upgrade. Paid plans keep sending past their monthly limit |
| 500 | `application_error` | Our fault. Retry with the same `Idempotency-Key` |

A field we don't know is never ignored: `422 validation_error` says `Unknown field` and names it.

Every response includes `ratelimit-limit`, `ratelimit-remaining` and `ratelimit-reset` headers.
