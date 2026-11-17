---
type: CONTENT
status: draft
updated: 2026-11-17
owner: purin
---

# mailmeow app copy: "Set up with AI" prompts (B-3a)

One ready prompt per tool, for the Get started page and the screen after a key is created (PHASE1-PLAN row B-3). The user pastes it into their AI tool and the AI wires up sending.

## Rules for every prompt

- The prompt is English, because AI tools follow English best. The one-line intro above each prompt is Thai, for the human. Thai says "คีย์", never "key" (glossary §Decisions 1).
- **The key is never in a prompt.** The dashboard fills `{{BASE_URL}}` and nothing else. Env var names are literal: `MAILMEOW_API_KEY`, `MAILMEOW_BASE_URL`. Production value of `{{BASE_URL}}`: `https://api.mailmeow.dev` (not live yet; locally `http://localhost:8080`).
- The `resend` package or plain `fetch` only. The own `mailmeow` SDK is not on npm yet; when it ships, swap it in here.
- Each prompt stays under about 250 words.
- Prompts start the user on a test key (`mm_test_`). Going live is a key swap, covered in [quickstart](../user/quickstart.md#4-go-live), not in the prompt.
- Do not promise reading status back. The default key is Send only, so `GET /emails/{id}` returns `403 restricted_api_key` (glossary §Decisions 2).
- `daily_quota_exceeded` and `monthly_quota_exceeded` come from the sending limits. The prompts handle both by name.

## Claude Code

TH intro: วางใน Claude Code ที่เปิดอยู่ในโฟลเดอร์โปรเจกต์ แล้วให้มันทำให้เลย

````text
Add email sending to this Next.js app with mailmeow, an email API that is compatible with Resend. Use the `resend` npm package.

1. Install `resend@latest` (older versions ignore `baseUrl`) and `server-only`.
2. Create `lib/mailmeow.ts`, starting with `import "server-only"`. Export one client: `new Resend(process.env.MAILMEOW_API_KEY, { baseUrl: process.env.MAILMEOW_BASE_URL ?? "{{BASE_URL}}" })`. Throw if MAILMEOW_API_KEY is missing.
3. Create `app/api/send-email/route.ts`: POST, JSON body `{ idempotencyKey? }`. Hard-code `from` on the server (placeholder `Acme <hello@yourdomain.com>`). Send with `{ idempotencyKey }` as the second argument: the key from the body, else `crypto.randomUUID()`. Default: only signed-in callers, sending to their own address or to one fixed recipient, with a fixed `subject` and `html`; never take `to`, `subject` or `html` from the request unless I ask.
4. On error, return `{ error: error.name, message: error.message }` with `error.statusCode` as the HTTP status (502 if null). Handle by name: `validation_error` (422), `rate_limit_exceeded` (429, retry later), `daily_quota_exceeded` (429, daily limit used up: tell the user, don't retry), `monthly_quota_exceeded` (429, monthly limit used up: tell the user, don't retry; it resets on the 1st, or the owner upgrades), `application_error` (500).
5. Put MAILMEOW_API_KEY and MAILMEOW_BASE_URL in `.env.local` (check it is git-ignored) and the same names, empty, in `.env.example`. Never write a real key in code, chat or a committed file: I paste it myself. No NEXT_PUBLIC_ prefix.
6. Never call mailmeow, or import `lib/mailmeow.ts`, from a client component or browser code: mailmeow refuses browser calls with 403 `browser_request_blocked`. Client code only calls `/api/send-email`.
7. I start with an `mm_test_` key. Test with `delivered@test.mailmeow.dev` and `bounced@test.mailmeow.dev`; nothing reaches an inbox. Don't read status back: Send only keys get 403 `restricted_api_key`.
8. Only if I ask: a webhook route that checks the raw body (`await request.text()`) with `resend.webhooks.verify`, the `svix-id`, `svix-timestamp`, `svix-signature` headers and `MAILMEOW_WEBHOOK_SECRET`.

Restart the dev server after changing env, then give me one curl command to test the route.
````

## Cursor

TH intro: เปิด Agent mode ใน Cursor แล้ววางตรงนี้ ใช้กับโปรเจกต์ Next.js ได้เลย

````text
Add email sending to this Next.js app with mailmeow, an email API that is compatible with Resend. Use the `resend` npm package.

1. Install `resend@latest` (older versions ignore `baseUrl`) and `server-only`.
2. Create `lib/mailmeow.ts`, starting with `import "server-only"`. Export one client: `new Resend(process.env.MAILMEOW_API_KEY, { baseUrl: process.env.MAILMEOW_BASE_URL ?? "{{BASE_URL}}" })`. Throw if MAILMEOW_API_KEY is missing.
3. Create `app/api/send-email/route.ts`: POST, JSON body `{ idempotencyKey? }`. Hard-code `from` on the server (placeholder `Acme <hello@yourdomain.com>`). Send with `{ idempotencyKey }` as the second argument: the key from the body, else `crypto.randomUUID()`. Default: only signed-in callers, sending to their own address or to one fixed recipient, with a fixed `subject` and `html`; never take `to`, `subject` or `html` from the request unless I ask.
4. On error, return `{ error: error.name, message: error.message }` with `error.statusCode` as the HTTP status (502 if null). Handle by name: `validation_error` (422), `rate_limit_exceeded` (429, retry later), `daily_quota_exceeded` (429, daily limit used up: tell the user, don't retry), `monthly_quota_exceeded` (429, monthly limit used up: tell the user, don't retry; it resets on the 1st, or the owner upgrades), `application_error` (500).
5. Put MAILMEOW_API_KEY and MAILMEOW_BASE_URL in `.env.local` (check it is git-ignored) and the same names, empty, in `.env.example`. Never write a real key in code, chat or a committed file: I paste it myself. No NEXT_PUBLIC_ prefix.
6. Never call mailmeow, or import `lib/mailmeow.ts`, from a client component or browser code: mailmeow refuses browser calls with 403 `browser_request_blocked`. Client code only calls `/api/send-email`.
7. I start with an `mm_test_` key. Test with `delivered@test.mailmeow.dev` and `bounced@test.mailmeow.dev`; nothing reaches an inbox. Don't read status back: Send only keys get 403 `restricted_api_key`.
8. Only if I ask: a webhook route that checks the raw body (`await request.text()`) with `resend.webhooks.verify`, the `svix-id`, `svix-timestamp`, `svix-signature` headers and `MAILMEOW_WEBHOOK_SECRET`.
````

## Lovable

TH intro: วางในแชตของ Lovable มันจะสร้างฟังก์ชันฝั่ง server ให้ แล้วถามให้เราใส่คีย์เอง

````text
Add email sending with mailmeow, an email API that is compatible with Resend. My UI runs in the browser, so the key may only exist inside a Supabase Edge Function.

1. Create an Edge Function `send-email` (Deno, plain `fetch`, no SDK). The React app calls it with `supabase.functions.invoke("send-email", { body })`. Never call mailmeow from React code: mailmeow refuses browser calls with 403 `browser_request_blocked`.
2. The function reads the secrets `MAILMEOW_API_KEY` and `MAILMEOW_BASE_URL` with `Deno.env.get` (base URL default `{{BASE_URL}}`). Ask me to add both through the secrets form. Never hard-code a key, never use a VITE_ variable, never ask me to type the key in chat.
3. The function POSTs to `{base}/emails` with headers `Authorization: Bearer <key>`, `Content-Type: application/json` and `Idempotency-Key` (from the request body, else `crypto.randomUUID()`). JSON body: `from`, `to`, `subject`, `html`. Hard-code `from` in the function (placeholder `Acme <hello@yourdomain.com>`). Default: only signed-in callers, sending to their own address or to one fixed recipient, with a fixed `subject` and `html`; never take `to`, `subject` or `html` from the request unless I ask.
4. Success is 200 `{ "id": "..." }`. Errors are JSON `{ statusCode, name, message }`: return `name` and `message` with the same status. Show friendly UI text for `validation_error`, `rate_limit_exceeded`, `daily_quota_exceeded` (daily limit used up, don't retry) and `monthly_quota_exceeded` (monthly limit used up, don't retry; it resets on the 1st, or the owner upgrades). If `fetch` throws, return 502.
5. I start with an `mm_test_` key. Test with `delivered@test.mailmeow.dev` and `bounced@test.mailmeow.dev`; nothing reaches an inbox. Don't read status back: Send only keys get 403 `restricted_api_key`.
6. Optional, only if I ask: a second function that verifies webhooks from the raw body with the `svix-id`, `svix-timestamp` and `svix-signature` headers and the secret `MAILMEOW_WEBHOOK_SECRET`.
````

Note for the team (not part of the prompt): Lovable's Supabase wiring is not tested. Unverified: that Lovable asks for secrets through a form when the prompt says so, and whether its Edge Functions require a signed-in caller by default (`verify_jwt`). The prompt asks the AI to settle the second with the user instead of guessing.

## Bolt

TH intro: วางในแชตของ Bolt ถ้าโปรเจกต์มี server อยู่แล้วมันจะใช้อันนั้น ถ้าไม่มีมันจะใช้ฟังก์ชันฝั่ง server แทน

````text
Add email sending with mailmeow, an email API that is compatible with Resend. The key may only exist in server-side code, never in the browser bundle.

1. If this project has server routes (Next.js, Remix, Astro or SvelteKit), add a server route `/api/send-email`. If it is a client-only app (for example Vite + React), use a Supabase Edge Function `send-email` instead. Say which one you chose. Use plain `fetch`, no SDK.
2. Read the key from the env var `MAILMEOW_API_KEY` and the base URL from `MAILMEOW_BASE_URL` (default `{{BASE_URL}}`). Never hard-code a key, never use a VITE_ or NEXT_PUBLIC_ prefix, and never ask me to type the key in chat. Tell me where to paste it myself.
3. Never call mailmeow from browser code: mailmeow refuses browser calls with 403 `browser_request_blocked`. The page calls only your route or function.
4. POST `{base}/emails` with headers `Authorization: Bearer <key>`, `Content-Type: application/json` and `Idempotency-Key` (from the request body, else `crypto.randomUUID()`). JSON body: `from`, `to`, `subject`, `html`. Hard-code `from` on the server (placeholder `Acme <hello@yourdomain.com>`). Default: only signed-in callers, sending to their own address or to one fixed recipient, with a fixed `subject` and `html`; never take `to`, `subject` or `html` from the request unless I ask.
5. Success is 200 `{ "id": "..." }`. Errors are JSON `{ statusCode, name, message }`: return `name` and `message` with the same status. Show friendly UI text for `validation_error`, `rate_limit_exceeded`, `daily_quota_exceeded` (daily limit used up, don't retry) and `monthly_quota_exceeded` (monthly limit used up, don't retry; it resets on the 1st, or the owner upgrades). If `fetch` throws, return 502.
6. I start with an `mm_test_` key. Test with `delivered@test.mailmeow.dev` and `bounced@test.mailmeow.dev`; nothing reaches an inbox. Don't read status back: Send only keys get 403 `restricted_api_key`.
7. Optional, only if I ask: a webhook route that verifies the raw body with the `svix-id`, `svix-timestamp` and `svix-signature` headers and `MAILMEOW_WEBHOOK_SECRET`.
````

Note for the team: untested on Bolt. Unverified: whether Bolt's WebContainer preview can make outbound calls from a server route, and how Bolt passes secrets to a deployed site. The prompt tells the AI to say where the key goes instead of guessing.

## Any other AI tool

TH intro: ใช้กับเครื่องมือ AI ตัวอื่นก็ได้ ไม่ว่าภาษาหรือเฟรมเวิร์กอะไร วางในแชตของมันได้เลย

````text
Add email sending to my web app with mailmeow, an email API that is compatible with Resend. Use plain `fetch`, no SDK, in this project's own language and framework.

1. Send only from server-side code: an API route, server action or backend function. Never from browser code: mailmeow refuses browser calls with 403 `browser_request_blocked`.
2. Read the key from the env var `MAILMEOW_API_KEY` and the base URL from `MAILMEOW_BASE_URL` (default `{{BASE_URL}}`). Never hard-code the key, never expose it to the browser (no NEXT_PUBLIC_, VITE_ or similar prefix), and never write it in chat or a committed file. I will paste it myself into the project's env or secrets settings.
3. Request: POST `{base}/emails`, headers `Authorization: Bearer <key>`, `Content-Type: application/json`, `Idempotency-Key: <unique per email, reused when retrying>`. JSON body (snake_case): `from`, `to`, `subject`, `html`. Hard-code `from` on the server (placeholder `Acme <hello@yourdomain.com>`). Default: only signed-in callers, sending to their own address or to one fixed recipient, with a fixed `subject` and `html`; never take `to`, `subject` or `html` from the request unless I ask.
4. Success is 200 `{ "id": "..." }`. Errors are JSON `{ statusCode, name, message }`: return `name` and `message` with the same status. Handle `validation_error` (422), `rate_limit_exceeded` (429, wait `retry-after` seconds), `daily_quota_exceeded` (429, daily limit used up, don't retry), `monthly_quota_exceeded` (429, monthly limit used up, don't retry; it resets on the 1st, or the owner upgrades) and `application_error` (500, retry once, same Idempotency-Key). If `fetch` throws, return 502.
5. I start with an `mm_test_` key. Test with `delivered@test.mailmeow.dev` and `bounced@test.mailmeow.dev`; nothing reaches an inbox. Don't read status back: Send only keys get 403 `restricted_api_key`.
6. Optional, only if I ask: a webhook endpoint that verifies the raw body (before any JSON parsing) with the `svix-id`, `svix-timestamp` and `svix-signature` headers and `MAILMEOW_WEBHOOK_SECRET`, using a Svix or Standard Webhooks library.

Restart the server after changing env, then give me one curl command to test it.
````

## How we tested

Date 2026-11-17. Scratch app: fresh `bunx create-next-app@latest app --ts --app --no-tailwind --no-eslint --no-src-dir --yes` (Next.js 16.4.6, `resend` 6.38.1, Bun 1.2.5) in the session scratchpad, pointed at the local dev stack with a **test** key (`MAILMEOW_BASE_URL=http://localhost:8080`, key in `.env.local`, which `.gitignore` covers). The "AI tool" was a person following each prompt literally and writing down every guess. The `{{BASE_URL}}` placeholder was replaced by the production URL in the code, and the env var overrode it locally.

### What had to change after the first pass

The first draft of the Claude Code prompt was shorter. Following it literally forced these guesses, and each became a line in the prompt:

| Guess | Fix in the prompt |
|---|---|
| Which package guards against client imports. Without `server-only`, nothing stops a client component importing the key | Step 1 and 2: install `server-only`, start `lib/mailmeow.ts` with it |
| Shape of the route body, and where `from` comes from (a free `from` from the client is an open relay) | Step 3: body `{ to, subject, html, idempotencyKey? }`, `from` hard-coded on the server |
| Idempotency key: a fresh `randomUUID()` on every request makes retries send twice | Step 3: use the caller's key, fall back to `randomUUID()` |
| Error status when the SDK has none (network down) | Step 4: 502 when `statusCode` is null |
| Where the key goes, and whether `.env.local` is ignored (this app's `.gitignore` has `.env*`, so `.env.example` is ignored too) | Step 5: `.env.local`, check it is git-ignored, empty names in `.env.example` |
| Reading status back to prove delivery | Step 7: do not; Send only keys get 403 `restricted_api_key` |
| The dev server must restart after env changes | Closing line |
| Anyone on the internet could POST to the route with any `to` | Step 3: ask who may call it |

Other facts checked in the `resend` source: the constructor takes `{ baseUrl }` as its second argument, and it also reads `RESEND_BASE_URL`; `emails.send(payload, { idempotencyKey })` sets the `Idempotency-Key` header.

### Claude Code prompt (the `resend` package) on `/api/send-email`

```bash
curl -s -X POST localhost:3457/api/send-email -H 'content-type: application/json' \
  -d '{"to":"delivered@test.mailmeow.dev","subject":"hi","html":"<p>hi</p>","idempotencyKey":"b3-proof-1"}'
# 200 {"id":"bec28ab2-abd5-4260-8558-8ebdcff2027d"}
# same command again            -> 200, the same id (no second email)
# same key, subject "DIFFERENT" -> 409 {"error":"invalid_idempotent_request",...}
# to bounced@test.mailmeow.dev  -> 200 {"id":"8fedf910-11f9-4953-ba1a-6c30df177420"}
# to "nope"                     -> 422 {"error":"validation_error","message":"The `to` field has an invalid email address: \"nope\"."}
# MAILMEOW_BASE_URL=http://localhost:9 (nothing there) -> 502 {"error":"application_error","message":"Unable to fetch data. The request could not be resolved."}
```

Status read-back, same key (this is the Send only default):

```bash
curl -i http://localhost:8080/emails/bec28ab2-abd5-4260-8558-8ebdcff2027d -H "Authorization: Bearer $MAILMEOW_API_KEY"
# 403 {"statusCode":403,"name":"restricted_api_key","message":"This API key can only send emails."}
```

So **`delivered` was not confirmed** by `GET /emails/{id}`: the key is Send only. That is why every prompt says not to read status back. To see the status, use a Full access key, the dashboard, or a webhook. The 200 with an id proves acceptance only.

### "Any other AI tool" prompt (plain `fetch`) on `/api/send-fetch`

```bash
curl -s -X POST localhost:3457/api/send-fetch -H 'content-type: application/json' \
  -d '{"to":"delivered@test.mailmeow.dev","subject":"hi","html":"<p>hi</p>","idempotencyKey":"b3-fetch-1"}'
# 200 {"id":"1e1e5b67-4858-433a-a709-0cb686576cd3"}; repeating it returns the same id
# to bounced@test.mailmeow.dev -> 200 {"id":"656b2e7e-df27-468e-a707-4e597c3e7a0c"}
# to "nope"                    -> 422 {"error":"validation_error",...}
```

No guesses were left on the second pass beyond the ones above.

### Browser block

A client component that calls the API directly with the key, run in a real browser (Next.js page, `fetch("http://localhost:8080/emails", { headers: { Authorization: "Bearer mm_test_..." } })`):

```text
403 {"statusCode":403,"name":"browser_request_blocked","message":"This API key was used from a browser, so mailmeow blocked the request. ..."}
```

The same request with `curl -H "Origin: http://localhost:3457"` returns the same 403. The CORS preflight succeeds (204, `Access-Control-Allow-Origin: *`), so a browser reaches the 403 and sees its body.

How the prompt prevents it, each proved:

- Importing `lib/mailmeow.ts` from a client component fails the Next.js build, because of `import "server-only"` (step 2 and 6).
- A client component calling only `/api/send-email` works: in the browser it got `200 {"id":"fe7dfcea-bac7-407c-803e-3693c4c2ec5c"}` (step 6).
- The key sits in `MAILMEOW_API_KEY` with no `NEXT_PUBLIC_` prefix, so it never reaches the bundle (step 5).

### Not tested

- Cursor: the prompt shares its steps with Claude Code and was not run in Cursor itself.
- Lovable and Bolt: not run. Platform details we are not sure of are in the notes under each prompt.
- Webhook verification (optional step) was not run. `resend.webhooks.verify` is documented in [sdk-node](../user/sdk-node.md#verify-webhooks).
- `daily_quota_exceeded` cannot be triggered yet (L-1 is not built). The prompts handle it by name from [ARCHITECTURE](../ARCHITECTURE.md).
- The `{{BASE_URL}}` placeholder and the production URL: `https://api.mailmeow.dev` is not live, so no prompt was run against it.
