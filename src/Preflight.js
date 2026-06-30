/**
 * Preflight.js — a plain-English connection check so first-run failures are
 * diagnosable without reading stack traces. preflight() returns a multi-line
 * report and, where it can, auto-fixes (e.g. finds a working API version).
 */

function preflight() {
  const lines = [];
  const ok = s => lines.push('✅ ' + s);
  const bad = s => lines.push('❌ ' + s);
  const warn = s => lines.push('⚠️ ' + s);

  // 1. Secrets present
  const p = PropertiesService.getScriptProperties();
  const missing = Object.entries(SECRET_KEYS).filter(([, k]) => !p.getProperty(k)).map(([n]) => n);
  if (missing.length) { bad('Missing secret(s): ' + missing.join(', ') + ' — run Setup.'); return lines.join('\n'); }
  ok('Secrets present.');

  // 2. Per-account config present
  if (!CONFIG.customerId || /^X+$/.test(CONFIG.customerId)) { bad('Customer ID not set — run Setup.'); return lines.join('\n'); }
  ok('Customer ID: ' + CONFIG.customerId + (CONFIG.loginCustomerId !== CONFIG.customerId ? ' (via MCC ' + CONFIG.loginCustomerId + ')' : ''));

  // 3. OAuth refresh
  try { getAccessToken_(); ok('OAuth token refresh works.'); }
  catch (e) { bad('OAuth failed: ' + e.message + ' — check Client ID/Secret + Refresh Token.'); return lines.join('\n'); }

  // 4. API reachable + version. Try configured version, then known fallbacks.
  const candidates = [CONFIG.apiVersion].concat(['v18', 'v19', 'v17', 'v20', 'v16']
    .filter(v => v !== CONFIG.apiVersion));
  let working = null;
  for (const v of candidates) {
    try { probeVersion_(v); working = v; break; } catch (e) { /* try next */ }
  }
  if (!working) { bad('Could not reach the Google Ads API on any known version. Check developer-token access (needs Basic, not test).'); return lines.join('\n'); }
  if (working === CONFIG.apiVersion) ok('API reachable on ' + working + '.');
  else { warn('Configured version ' + CONFIG.apiVersion + ' failed; ' + working + ' works — saving it.');
    PropertiesService.getScriptProperties().setProperty('CFG_apiVersion', working); }

  // 5. Sheet writable
  try { ss_for_preflight_(); ok('Spreadsheet is writable.'); }
  catch (e) { bad('Sheet problem: ' + e.message); }

  lines.push('');
  lines.push('All set — run "3. Run now" to pull data.');
  return lines.join('\n');
}

/** Minimal query to confirm a version + permissions respond. */
function probeVersion_(version) {
  const url = 'https://googleads.googleapis.com/' + version +
    '/customers/' + CONFIG.customerId + '/googleAds:searchStream';
  const res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + getAccessToken_(),
      'developer-token': getSecret_(SECRET_KEYS.developerToken),
      'login-customer-id': CONFIG.loginCustomerId,
    },
    payload: JSON.stringify({ query: 'SELECT customer.id FROM customer LIMIT 1' }),
  });
  if (res.getResponseCode() !== 200) throw new Error(res.getResponseCode() + ': ' + res.getContentText());
}

function ss_for_preflight_() {
  const ss = CONFIG.spreadsheetId
    ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet bound. Use this script from inside a Sheet, or set spreadsheetId.');
  return ss;
}
