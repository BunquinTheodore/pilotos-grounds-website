# Contact Form Email Setup

How a booking request on `contact.html` actually gets delivered, and how to fix it
when it breaks.

## The pipeline

1. **Formspree** (`https://formspree.io/f/mljeppan`) is the form's native POST
   target. It's the primary lead capture and notifies **hello@pilotos.ph**.
   Free-plan Formspree only supports one notification recipient per form.
2. **EmailJS** (`assets/js/main.js`) fires two additional, best-effort sends
   right after Formspree succeeds:
   - `template_r7g1ych` — customer-facing auto-reply. "To Email" is
     `{{email}}`, i.e. whatever the customer typed. This is what confirms
     "we've received your request" back to the customer.
   - `template_hd64d6d` — internal team notification. "To Email" is hard-coded
     to `hello@pilotos.ph, kyle@pilotos.ph`, so both addresses get an
     identical copy of every new lead (name, email, event date, pax, booking
     type, package, location, message). This exists specifically to work
     around Formspree's one-recipient limit.

Both EmailJS sends go through the same **Email Service**, `service_ualuejb`,
which is a Gmail account connection (currently `hello@pilotos.ph`). If that
Gmail connection breaks, **both** EmailJS emails stop sending — the customer
auto-reply and the internal team notification fail together, even though
Formspree keeps working normally (Formspree doesn't depend on EmailJS at all).

## Known failure mode: "412 Gmail_API: Invalid grant"

**Symptom:** EmailJS's request log (Email Services → Gmail service → history,
or a template's "Test It" panel) shows:

```
412 Gmail_API: Invalid grant. Please reconnect your Gmail account
```

**Cause:** The OAuth token EmailJS uses to send through the connected Gmail
account expired or was revoked. This happens when:
- The Gmail account's password was changed
- Google's account security settings changed (2FA, "less secure app access",
  revoked third-party app access under Google Account → Security →
  Third-party access)
- Google auto-expired a long-idle refresh token

**This is not a code problem.** Nothing in `main.js`, `contact.html`, or the
EmailJS templates needs to change for this — it's purely an account
re-authorization step in the EmailJS dashboard.

### Fix

1. In EmailJS, go to **Email Services**.
2. Open the Gmail service with ID `service_ualuejb`.
3. Click **Disconnect** (clears the stale/expired grant — the panel may still
   claim "Connected as hello@pilotos.ph" even though it's broken).
4. Click **Connect Gmail** (or equivalent) to start a fresh OAuth flow.
5. Sign in as **hello@pilotos.ph** — it must be this same account, since both
   templates are built to send through it.
6. On the Google permissions screen, approve **"Send email on your behalf"**.
   If this scope is declined or dropped, the same 412 error will recur.
7. Leave "Send test email to verify configuration" checked, then
   **Update Service**.
8. Confirm the fix: open either template's "Test It" panel and click
   **Send Test Email** — it should return `200 OK` instead of `412`.

## Reference IDs

| Purpose | ID |
|---|---|
| EmailJS service (Gmail: hello@pilotos.ph) | `service_ualuejb` |
| EmailJS public key | `0hqVQvboxMxbDlIpd` |
| Customer auto-reply template | `template_r7g1ych` |
| Internal team notification template (hello@ + kyle@) | `template_hd64d6d` |
| Formspree form (hello@pilotos.ph only) | `mljeppan` |

## If you add a third team recipient later

Edit `template_hd64d6d` in the EmailJS dashboard — add the address to the
**To Email** field as another comma-separated entry
(`hello@pilotos.ph, kyle@pilotos.ph, newperson@pilotos.ph`). No code change
needed; `main.js` just points at the template ID and doesn't know or care how
many recipients it fans out to.
