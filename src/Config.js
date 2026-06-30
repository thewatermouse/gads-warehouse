/**
 * Config.js — DEFAULTS. You normally never edit this.
 *
 * Plug-and-play path: use the "⚙ gads-warehouse → Setup" menu in the Sheet.
 * It stores per-account values as CFG_* Script Properties, which are merged
 * over these defaults by applyConfigOverrides_() at the bottom — so a copied
 * template needs zero code edits. Secrets live in Script Properties too.
 *
 * Power-user path: you can still hardcode values here and deploy via clasp.
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

/**
 * Merge Setup-dialog values (CFG_* Script Properties) over the defaults above.
 * Runs at load so every function sees the per-account config without code edits.
 * Wrapped in try/catch so the file still loads in contexts without Properties.
 */
(function applyConfigOverrides_() {
  try {
    const p = PropertiesService.getScriptProperties();
    const str = ['customerId', 'loginCustomerId', 'oauthClientId', 'spreadsheetId', 'apiVersion'];
    const num = ['lookbackDays', 'targetRoas', 'anomalyThreshold', 'minSpendForAnomaly'];
    str.forEach(k => { const v = p.getProperty('CFG_' + k); if (v) CONFIG[k] = v; });
    num.forEach(k => { const v = p.getProperty('CFG_' + k); if (v !== null && v !== '') CONFIG[k] = Number(v); });
    if (CONFIG.loginCustomerId && /^X+$/.test(CONFIG.loginCustomerId) && CONFIG.customerId) {
      CONFIG.loginCustomerId = CONFIG.customerId; // default MCC to the account
    }
  } catch (e) { /* no Properties available in this context; defaults stand */ }
})();
