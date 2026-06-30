# gads-warehouse

Nightly Google Ads → Google Sheets warehouse. A single Apps Script project that
pulls campaign-level daily performance from the Google Ads API into one
normalized sheet, then builds a week-over-week anomaly tab on top of it.

This is the **foundation repo** of the performance-marketing systems family.
Other repos (`gads-guardrails`, `gads-audit`, …) read from the `Main` tab
this produces. Same pattern can be forked to `meta-warehouse` by swapping the
API client.

## What it produces

A Google Sheet with two tabs:

| Tab | Contents |
|-----|----------|
| `Main` | One row per `date × campaign`, normalized columns (see [schema.md](schema.md)). Idempotent upsert — re-running never duplicates rows. |
| `Anomalies` | Last-7-days vs prior-7-days deltas per campaign (spend, CPA, ROAS), flagged when the swing crosses your thresholds. |

## Design principles

- **Config-driven.** The only file you edit per account is [`src/Config.js`](src/Config.js).
  Secrets never live in the repo or the sheet — they go in Script Properties via `setup()`.
- **Idempotent.** Each run re-pulls a lookback window and upserts by `date|campaign_id`.
  Safe to run hourly or daily; safe to re-run after a failure.
- **Portable.** Clone → drop into a Claude project → follow [CLAUDE.md](CLAUDE.md) → live in minutes.

## Two ways to deploy

- **Plug-and-play (no code)** — open a copy of the template Sheet and use the
  **⚙ gads-warehouse** menu: *Setup → Check connection → Run now*. No clasp, no
  editor. See [TEMPLATE.md](TEMPLATE.md) to build/share the template.
- **Power user (clasp)** — clone and deploy as in Quick start below.

## Quick start

1. **Get API credentials** (one-time, full walkthrough in [CREDENTIALS.md](CREDENTIALS.md)):
   developer token, OAuth client ID/secret, refresh token.
2. `npm i -g @google/clasp && clasp login`
3. `clasp create --type standalone --title "gads-warehouse"` (creates `.clasp.json`)
4. Edit [`src/Config.js`](src/Config.js) — customer ID, login customer ID, targets, thresholds.
5. `clasp push`
6. In the Apps Script editor, run `setup()` once — paste secrets when prompted in the
   Script Properties (instructions in [`src/Setup.js`](src/Setup.js)), then run
   `installTriggers()` to schedule the nightly sync.
7. Run `dailySync()` manually once to backfill and confirm rows land in the sheet.

## Files

```
gads-warehouse/
├── README.md
├── CLAUDE.md              # how a Claude project deploys/operates this
├── CREDENTIALS.md         # one-time walkthrough to mint API access
├── schema.md              # normalized column definitions
├── .clasp.json.example    # copy to .clasp.json (clasp create writes the real one)
├── .gitignore
├── appsscript.json        # Apps Script manifest (scopes, timezone)
└── src/
    ├── Config.js          # ← the only per-account file you edit
    ├── Setup.js           # store secrets + install the time trigger
    ├── GoogleAdsClient.js # OAuth + GAQL searchStream wrapper
    ├── Warehouse.js       # pull → normalize → upsert into the sheet
    └── Anomaly.js         # week-over-week anomaly tab
```
