# CREDENTIALS.md — minting Google Ads API access (one-time)

The code is the easy part. This is the fiddly part. Do it once per Google Ads
account (or once per MCC if you pull child accounts through a manager account).

You end up with **5 values**:

| Value | Lands in | Secret? |
|-------|----------|---------|
| Developer token | Script Property `GADS_DEVELOPER_TOKEN` | yes |
| OAuth client ID | `CONFIG.oauthClientId` | no |
| OAuth client secret | Script Property `GADS_OAUTH_CLIENT_SECRET` | yes |
| Refresh token | Script Property `GADS_REFRESH_TOKEN` | yes |
| Customer ID / Login customer ID | `CONFIG.customerId` / `CONFIG.loginCustomerId` | no |

---

## 1. Developer token

Google Ads UI → **Tools → API Center** (you must be on a manager/MCC account to
see it). Copy the developer token. A **test** token works only against test
accounts; for live data you need at least **Basic access** (apply in the same
screen — usually approved fast).

## 2. OAuth client (ID + secret)

[Google Cloud Console](https://console.cloud.google.com/) → pick or create a
project → **APIs & Services**:

1. **Enable the Google Ads API** (APIs & Services → Library → "Google Ads API" → Enable).
2. **OAuth consent screen** → External → add your email as a **Test user**
   (test users skip the verification wait).
3. **Credentials → Create credentials → OAuth client ID → Application type:
   Desktop app**. Copy the **Client ID** and **Client secret**.

## 3. Refresh token (via OAuth Playground)

This is the step people get stuck on. Using
[OAuth 2.0 Playground](https://developers.google.com/oauthplayground/):

1. Click the **gear (⚙) top-right** → check **"Use your own OAuth credentials"**
   → paste the Client ID + Client secret from step 2.
2. In the left **"Input your own scopes"** box, enter exactly:
   ```
   https://www.googleapis.com/auth/adwords
   ```
   Click **Authorize APIs** → sign in with the Google account that has access to
   the Ads account → approve.
3. On **Step 2**, click **"Exchange authorization code for tokens"**.
4. Copy the **Refresh token** (starts with `1//`). This is the value for
   `GADS_REFRESH_TOKEN`.

> The refresh token is long-lived but can be revoked if you change the OAuth
> consent screen back to "Testing" after publishing, or if unused for 6 months.
> If pulls suddenly 401, re-mint here.

## 4. Customer IDs

- **Customer ID** = the Google Ads account you want data from, **digits only**
  (the `123-456-7890` in the UI becomes `1234567890`).
- **Login customer ID** = your **MCC/manager** account ID (digits only) if you
  access the account through a manager. If you log in directly to the account
  with no manager above it, set it equal to the Customer ID.

---

## Where each value goes

**Non-secret** → edit `src/Config.js`:
```js
customerId: '1234567890',
loginCustomerId: '9876543210',
oauthClientId: '....apps.googleusercontent.com',
```

**Secret** → Apps Script editor → **Project Settings (gear) → Script Properties
→ Add property**:
```
GADS_DEVELOPER_TOKEN       = <developer token>
GADS_OAUTH_CLIENT_SECRET   = <client secret>
GADS_REFRESH_TOKEN         = <1//... refresh token>
```

Then run `setup()` — it confirms all three are present — followed by
`installTriggers()` and a manual `dailySync()` to verify rows land in `Main`.

## Quick sanity checks if the first run fails

| Symptom | Likely cause |
|---------|--------------|
| `OAuth token refresh failed` | client ID/secret mismatch, or refresh token revoked |
| `error 401 / UNAUTHENTICATED` | developer token missing or still a test token on a live account |
| `error 403 / developer-token not approved` | apply for Basic access in API Center |
| `error 404` on the request URL | `CONFIG.apiVersion` is deprecated — bump it (e.g. `v18` → `v19`) |
| `USER_PERMISSION_DENIED` | `loginCustomerId` isn't a manager of `customerId`, or wrong account |
| Empty `Main` tab, no error | account had no spend in the lookback window, or wrong `customerId` |
