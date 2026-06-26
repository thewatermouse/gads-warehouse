/**
 * Config.js — THE ONLY FILE YOU EDIT PER ACCOUNT.
 *
 * Non-secret knobs only. The three secrets (developer token, OAuth client
 * secret, refresh token) live in Script Properties — see Setup.js.
 */
const CONFIG = {
  // ── Account ────────────────────────────────────────────────────────────
  customerId: 'XXXXXXXXXX',        // Google Ads account, digits only (no dashes)
  loginCustomerId: 'XXXXXXXXXX',   // MCC if you use one; otherwise = customerId

  // ── OAuth (non-secret half) ────────────────────────────────────────────
  oauthClientId: 'XXXXXXXXXXXX-xxxx.apps.googleusercontent.com',

  // ── API ────────────────────────────────────────────────────────────────
  apiVersion: 'v18',               // bump when Google deprecates a version

  // ── Destination sheet ──────────────────────────────────────────────────
  // Leave spreadsheetId empty to use the spreadsheet this script is bound to.
  // For a standalone script, paste the target spreadsheet ID.
  spreadsheetId: '',
  mainTab: 'Main',
  anomaliesTab: 'Anomalies',

  // ── Pull window ────────────────────────────────────────────────────────
  lookbackDays: 14,                // re-pull this many days each run (upsert, no dupes)

  // ── Targets (used by Anomalies + downstream repos) ─────────────────────
  targetRoas: 3.0,                 // your account ROAS goal
  targetCpa: null,                 // set a number if you steer on CPA instead

  // ── Anomaly flagging ───────────────────────────────────────────────────
  anomalyThreshold: 0.20,          // flag week-over-week swings ≥ 20%
  minSpendForAnomaly: 50,          // ignore campaigns spending < $50 in the recent week
};
