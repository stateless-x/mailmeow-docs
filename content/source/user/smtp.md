---
title: Send with SMTP
status: draft (describes the planned SMTP relay; host and port are shown in the dashboard)
updated: 2026-11-20
---

# Send with SMTP

Use SMTP when a tool can only send through SMTP. The most common case is Supabase Auth: its built-in email is limited to a few emails an hour and is meant for testing, so login codes, OTPs and magic links stop arriving. Point Supabase at mailmeow and they go out again.

## Settings

Open the dashboard, go to **API keys**, and find **Connect with SMTP**. Copy Host and Port from there.

| Setting | Value |
|---|---|
| Host | Copy from **Connect with SMTP** |
| Port | Copy from **Connect with SMTP** |
| Username | `mailmeow` (any value works) |
| Password | Your mailmeow API key (`mm_test_...` or `mm_live_...`) |
| Encryption | STARTTLS |
| Sender email address | An address on your verified domain, like `hello@acme.com` |

Every message goes through the same path as `POST /emails`, so the same limits, statuses and [webhooks](webhooks.md) apply.

## Set up Supabase

1. Create an API key in the mailmeow dashboard and start with a test key (`mm_test_...`).
2. Open Supabase's SMTP settings: [supabase.com/dashboard/project/_/auth/smtp](https://supabase.com/dashboard/project/_/auth/smtp) and pick your project. In the menu it is under **Authentication** → **Emails** → **SMTP Settings**.
3. Turn on **Enable custom SMTP**.
4. Fill in the fields:
   - **Sender email address**: `hello@acme.com` (any address on your domain)
   - **Sender name**: your app's name
   - **Host** and **Port number**: copied from **Connect with SMTP**
   - **Username**: `mailmeow`
   - **Password**: your mailmeow API key
5. Click **Save changes**.
6. Sign up with a new email in your app. With a test key, the email shows in the mailmeow dashboard under test mode and does not reach a real inbox.

Want the sign-in emails (confirm sign up, magic link, reset password) in Thai or English? Copy ready-made ones from [Email templates](templates.md).

## Raise Supabase's email rate limit

After you turn on custom SMTP, Supabase keeps a low limit of 30 emails an hour. Open [Rate Limits](https://supabase.com/dashboard/project/_/auth/rate-limits) (**Authentication** → **Rate Limits**) in Supabase and raise **Rate limit for sending emails** to fit your app.

## Go live

1. [Set up your domain](concepts.md#domains) and wait until it is verified.
2. Create a live key (`mm_live_...`) and put it in Supabase's **Password** field.
3. Check that **Sender email address** is on the verified domain.

A live key refuses a From or Sender address on a domain that is not verified.

## Limits and what is not supported yet

- Each message can be up to 16 MB and have up to 50 recipients.
- Attachments: up to 10 MB of files and 20 files per email. Some file types, such as `.exe`, are refused.
- A message with only Bcc recipients (for example `To: undisclosed-recipients:;`) is sent as one email per recipient, each showing only that person's address. Each copy counts toward your limits, and the dashboard lists each one.
- A retry is safe. mailmeow uses the Message-ID header and the recipients to recognise the same message, so it is not sent twice.

## Troubleshooting

Supabase only shows "Error sending ... email". To see why, open **API keys** in the mailmeow dashboard: the key shows the last refusal ("SMTP refused an email ...").

| Reply from mailmeow | What to do |
|---|---|
| Authentication failed. Use a mailmeow API key as the password. | Put a mailmeow API key in Password. Check that you copied the whole key. |
| This API key was revoked. | Create a new API key and use it. |
| The From domain is not verified for this account. | [Verify the domain](concepts.md#domains), or use a test key. |
| This account is paused, so it cannot send live email. | Use a test key, or contact us. |
| Sent to N of M recipients, then stopped: ... | Some Bcc copies went out before a limit was reached. Fix the reason; a retry sends only the rest. |
| Sending these files to each Bcc recipient separately would store ... | Send to fewer recipients at a time, or with smaller files. |
| The file ... can't be sent. / Too many attachments. / Attachments are too large. | Remove the file type that is refused (such as `.exe`), or send fewer and smaller files: 10 MB and 20 files per email. |
| The message is larger than 16 MB. | Make the message smaller. |
| The account's limit of ... emails a day / this month. | Wait for the reset time in the message, or contact us to send more. Test mode limits start again at 00:00 UTC (07:00 in Thailand). |
| Too many failed sign-ins / too many connections from your address. | Wait a minute and try again. |
| Temporary error. Try again. | Try again. Most tools retry on their own. |

Other errors are listed in [Errors](api-reference.md#errors).

## WordPress

A WordPress guide is coming soon.
