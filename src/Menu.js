/**
 * Menu.js — the no-code surface. When this script is BOUND to a Google Sheet
 * (the plug-and-play path), onOpen() adds a "⚙ gads-warehouse" menu so a
 * non-technical user never opens the code editor.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙ gads-warehouse')
    .addItem('1. Setup (enter credentials)…', 'openSetup')
    .addItem('2. Check connection (preflight)', 'runPreflightDialog')
    .addItem('3. Run now (sync data)', 'dailySync')
    .addSeparator()
    .addItem('Install daily schedule', 'installTriggers')
    .addToUi();
}

/** Open the setup form (Setup.html) as a sidebar. */
function openSetup() {
  const html = HtmlService.createHtmlOutputFromFile('Setup')
    .setTitle('gads-warehouse setup');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Called from Setup.html on submit. Stores secrets + per-account config.
 * Secrets go to Script Properties (NOT copied when a user copies the sheet, so
 * each deployment stays isolated). Per-account values go to CFG_* properties
 * that Config.js merges over its defaults — so no code editing, ever.
 */
function saveSetup(form) {
  const props = PropertiesService.getScriptProperties();

  // Secrets — only overwrite if a value was provided (lets you re-open setup
  // and edit just the account ID without re-pasting tokens).
  if (form.developerToken) props.setProperty(SECRET_KEYS.developerToken, form.developerToken.trim());
  if (form.oauthClientSecret) props.setProperty(SECRET_KEYS.oauthClientSecret, form.oauthClientSecret.trim());
  if (form.refreshToken) props.setProperty(SECRET_KEYS.refreshToken, form.refreshToken.trim());

  // Per-account, non-secret.
  const setCfg = (k, v) => { if (v !== undefined && v !== '') props.setProperty('CFG_' + k, String(v).trim()); };
  setCfg('customerId', form.customerId);
  setCfg('loginCustomerId', form.loginCustomerId || form.customerId);
  setCfg('oauthClientId', form.oauthClientId);
  setCfg('targetRoas', form.targetRoas);

  return 'Saved. Next: run "2. Check connection (preflight)".';
}

/** Return current values to pre-fill the form (secrets shown only as ●●● if set). */
function loadSetup() {
  const p = PropertiesService.getScriptProperties();
  const has = k => (p.getProperty(k) ? '••••••••' : '');
  return {
    developerToken: has(SECRET_KEYS.developerToken),
    oauthClientSecret: has(SECRET_KEYS.oauthClientSecret),
    refreshToken: has(SECRET_KEYS.refreshToken),
    customerId: p.getProperty('CFG_customerId') || '',
    loginCustomerId: p.getProperty('CFG_loginCustomerId') || '',
    oauthClientId: p.getProperty('CFG_oauthClientId') || CONFIG.oauthClientId || '',
    targetRoas: p.getProperty('CFG_targetRoas') || CONFIG.targetRoas || '',
  };
}

/** Run preflight and show the result in a dialog. */
function runPreflightDialog() {
  const report = preflight();
  SpreadsheetApp.getUi().alert('Connection check', report, SpreadsheetApp.getUi().ButtonSet.OK);
}
