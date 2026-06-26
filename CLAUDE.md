# CLAUDE.md — gads-warehouse

Instructions for a Claude project that has been handed this repo and needs to
deploy or operate it. Read this top to bottom before acting.

## What this is

An Apps Script project (managed locally via `clasp`) that pulls Google Ads
campaign data into a Google Sheet on a schedule. There is **no server** — it
runs on Google's Apps Script triggers. All code is in `src/*.js` and is pushed
to a standalone Apps Script project with `clasp push`.

## Deploy checklist

1. **Tooling**: ensure `clasp` is installed (`npm i -g @google/clasp`) and the
   user is logged in (`clasp login`). The user must have an Apps Script project
   or let `clasp create --type standalone` make one (this writes `.clasp.json`).
2. **Config**: open `src/Config.js`. Fill in `CONFIG.customerId` (the Google Ads
   account, no dashes), `CONFIG.loginCustomerId` (the MCC if used, else same as
   customerId), the spreadsheet target, and the targets/thresholds. This is the
   ONLY file that changes per account.
3. **Push**: `clasp push`.
4. **Secrets**: have the user run `setup()` from the Apps Script editor, then
   add the three secret values (developer token, OAuth client secret, refresh
   token) to **Project Settings → Script Properties**. Never commit these.
   `Setup.js` lists the exact property keys.
5. **Schedule**: run `installTriggers()` to create the daily time trigger.
6. **Verify**: run `dailySync()` once. Confirm the `Main` tab populates and
   `Anomalies` builds without error (check Executions log for failures).

## Credentials (one-time, lives outside this repo)

The Google Ads API needs four things. The first three are secrets (Script
Properties); the customer IDs are non-secret config.

| Item | Where it goes | How to get it |
|------|---------------|---------------|
| Developer token | Script Property `GADS_DEVELOPER_TOKEN` | Google Ads → Tools → API Center |
| OAuth client ID | `CONFIG.oauthClientId` in Config.js | Google Cloud Console → Credentials → OAuth client (Desktop) |
| OAuth client secret | Script Property `GADS_OAUTH_CLIENT_SECRET` | same OAuth client |
| Refresh token | Script Property `GADS_REFRESH_TOKEN` | OAuth playground or a one-time consent flow with scope `https://www.googleapis.com/auth/adwords` |
| Customer ID / Login customer ID | `CONFIG.customerId` / `CONFIG.loginCustomerId` | the Google Ads account / MCC, digits only |

## Common operations

- **Backfill more history**: temporarily raise `CONFIG.lookbackDays`, run
  `dailySync()`, then set it back. Upsert means no duplicates.
- **Add a metric/dimension**: edit the GAQL in `Warehouse.js` (`buildQuery`) and
  the row mapping in `normalizeRow`, then update `schema.md`. Bump nothing else.
- **Bump API version**: change `CONFIG.apiVersion` (e.g. `"v18"` → `"v19"`).
- **Change schedule**: edit `installTriggers()` in `Setup.js`.

## Guardrails when editing

- Keep `Main` writes idempotent — always upsert by `date|campaign_id`, never
  blind-append.
- Never write secrets into `Config.js`, `schema.md`, or any committed file.
- Cost is `cost_micros / 1e6`. Don't forget the divide.
- This repo is READ-ONLY against Google Ads (reporting only). Any write-back to
  campaigns belongs in `gads-guardrails`, not here.
