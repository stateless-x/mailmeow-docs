// "AI integration guide": written for AI agents. Every fact comes from docs/user/* or from
// docs/copy/ai-prompts.md ("Rules" and "How we tested").
export const AI_GUIDE = `Rules for an AI agent that writes code to send email with mailmeow. Read them top to bottom. Each rule is stated once.

## Facts

- Base URL: \`https://api.mailmeow.dev\`
- Auth: \`Authorization: Bearer <api key>\`
- Bodies: JSON, \`snake_case\` field names
- Send: \`POST /emails\`. Read: \`GET /emails/{id}\`, \`GET /emails\`
- Success: \`200 { "id": "..." }\`. This means accepted and queued, not delivered.
- mailmeow is compatible with Resend. The \`resend\` npm package works by changing its base URL.
- The \`mailmeow\` npm package is not published. Do not install it or import it. Use \`resend\` or plain \`fetch\`.

## Rules

### 1. Send from the server only

- A request that arrives from a browser (it carries an \`Origin\` header) is refused with \`403 browser_request_blocked\`. Nothing is sent, and the key is not revoked.
- Call mailmeow only from server code: a route handler, server action, Edge Function or backend. Client code calls your own route.
- In Next.js, start the module that holds the client with \`import "server-only"\`. Then importing it from a client component fails the build.
- If a key was ever used in browser code, revoke it and create a new one.

### 2. Environment variables

- \`MAILMEOW_API_KEY\`: the API key.
- \`MAILMEOW_BASE_URL\`: the base URL, default \`https://api.mailmeow.dev\`.
- \`MAILMEOW_WEBHOOK_SECRET\`: the webhook signing secret (starts with \`whsec_\`). Only needed for webhooks.
- Never prefix them with \`NEXT_PUBLIC_\` or \`VITE_\`: that puts them in the browser bundle.
- Never write a real key in code, in chat or in a committed file. Tell the user to paste it into the project's env or secrets settings.
- Put the keys in \`.env.local\` and check that it is git-ignored. Put the same names, empty, in \`.env.example\`.
- Restart the dev server after changing env.

### 3. Do not build an open relay

- Hard-code \`from\` on the server. Never take \`from\` from the request body.
- Do not let anonymous callers choose \`to\` freely. Ask the user who may call the route, and enforce it.

### 4. Idempotency keys come from the caller

- Send an \`Idempotency-Key\` header on every send: any unique string, up to 256 characters.
- Same key and same body within 24 hours: the first response comes back and nothing is sent twice.
- Same key and a different body: \`409 invalid_idempotent_request\`.
- Take the key from the caller, tied to the thing the email is about (for example \`welcome-\${user.id}\`). Fall back to \`crypto.randomUUID()\` only when the caller gives none.
- Reuse the same key on every retry. A fresh random key per attempt makes a retry send twice.
- With the \`resend\` package, pass it as the second argument: \`resend.emails.send(payload, { idempotencyKey })\`.

### 5. Errors and retries

Errors always look like this:

\`\`\`json
{ "statusCode": 422, "name": "validation_error", "message": "The \`scheduled_at\` field is not supported yet." }
\`\`\`

Branch on \`name\`, not on \`message\`. If \`fetch\` throws (no response at all), treat it as a network error.

Retry network errors and 5xx. Do not retry 4xx, with the two exceptions marked below.

| Status | \`name\` | Retry? |
|---|---|---|
| none (network error) | none | Yes, with the same \`Idempotency-Key\`. If you return an error to your own client, use 502. |
| 500 | \`application_error\` | Yes, with the same \`Idempotency-Key\`. |
| 429 | \`rate_limit_exceeded\` | Exception: yes, after the \`retry-after\` header (seconds). |
| 409 | \`concurrent_idempotent_requests\` | Exception: yes, shortly. The same key is still being processed. |
| 429 | \`daily_quota_exceeded\` | No. The email would pass the account's daily limit (100 a day to start; every \`to\`, \`cc\` and \`bcc\` address counts as one). Nothing was saved. Do not retry until the time in \`message\` (midnight UTC). Tell the user. |
| 429 | \`monthly_quota_exceeded\` | No. A Free account reached its monthly limit. Nothing was saved. Sending starts again on the 1st (00:00 UTC), or the user upgrades. Tell the user. |
| 409 | \`invalid_idempotent_request\` | No. Same key, different body. |
| 422 | \`validation_error\` | No. \`message\` names the field. |
| 400 | \`invalid_request\` | No. Fix the JSON or the query. |
| 401 | \`missing_api_key\` | No. Add the \`Authorization: Bearer\` header. |
| 403 | \`invalid_api_key\`, \`invalid_from_address\`, \`browser_request_blocked\`, \`restricted_api_key\`, \`account_paused\` | No. See rules 1, 6 and 7, and [Errors](/en/errors/). |
| 404 | \`not_found\` | No. Check the id. |
| 405 | \`method_not_allowed\` | No. |

Do not retry forever. Retry a small number of times (the plain-\`fetch\` prompt retries \`application_error\` once with the same key; the planned SDK retries up to 2 times, waiting 0.5 s then 1 s).

### 6. Test keys and test addresses

- Start with a test key (\`mm_test_\`). It never delivers, allows any \`from\`, and moves emails through realistic statuses. Webhooks still fire.
- A live key (\`mm_live_\`) delivers real email and needs a verified domain. Going live is a key swap.
- Test recipients: any address gives \`delivered\`. \`bounced@test.mailmeow.dev\` gives \`bounced\`. \`complained@test.mailmeow.dev\` gives \`complained\`. \`delayed@test.mailmeow.dev\` gives \`delivery_delayed\`, then \`delivered\`.
- Test keys see only test emails. Live keys see only live emails.

### 7. A send-only key cannot read status

- A key that can only send gets \`403 restricted_api_key\` from \`GET /emails/{id}\` and \`GET /emails\`. New keys default to send only.
- Do not write code that reads status back after sending. \`200\` with an \`id\` proves acceptance, not delivery.
- To learn what happened, use webhooks (rule 8), or ask the user for a key with full access.

### 8. Verify webhooks

- Verify before trusting the body, using the raw body string (\`await request.text()\`), never re-serialized JSON.
- Headers: \`svix-id\`, \`svix-timestamp\`, \`svix-signature\`. The same values also arrive as \`webhook-id\`, \`webhook-timestamp\`, \`webhook-signature\`. Use either set.
- Reject a timestamp more than 5 minutes (300 seconds) from now. This stops replays.
- The signature is HMAC-SHA256, base64, over \`\${id}.\${timestamp}.\${rawBody}\`. The key is the secret without its \`whsec_\` prefix, base64-decoded.
- The signature header can hold several signatures (\`v1,abc v1,def\`) during secret rotation. Accept if any \`v1\` one matches. Compare in constant time.
- The same event can arrive more than once: skip repeats by \`svix-id\`. Events can arrive out of order: sort by the top-level \`created_at\`.
- Return any \`2xx\` within 15 seconds. Do slow work after you respond.
- The scheme is the same one Resend uses, so a Resend webhook verifier works unchanged. Full code: [Webhooks](/en/webhooks/#verify-the-signature).

### 9. Resend SDK compatibility

- Create the client with the base URL: \`new Resend(process.env.MAILMEOW_API_KEY, { baseUrl: process.env.MAILMEOW_BASE_URL ?? "https://api.mailmeow.dev" })\`. The package also reads \`RESEND_BASE_URL\`.
- \`emails.send\`, \`get\` and \`list\` work.
- Attachments work: \`attachments: [{ filename, content }]\`, with \`content\` as base64 (a Node \`Buffer\` works as is). At most 20 files and 10 MB in total per email. \`path\` is not supported yet. Blocked file types such as \`.exe\` return \`422\`.
- Not supported yet: \`scheduled_at\`, \`template\`, \`topic_id\`. Sending one returns \`422 validation_error\` that names the field. An unknown field also returns \`422\`, with \`Unknown field\` and its name. Nothing is silently ignored. Do not send these fields.
- Not supported yet: opens and clicks tracking, batch send, the Audiences API and the Broadcasts API.
- At most 50 recipients across \`to\`, \`cc\` and \`bcc\`. Requests per second: 10 per key. Email size: 1 MB. These limits are provisional.
- Newsletters and campaigns need their own key on the \`broadcast\` stream, with an unsubscribe link and the \`List-Unsubscribe\` headers. Login and receipt emails use the default \`transactional\` stream.
`;
