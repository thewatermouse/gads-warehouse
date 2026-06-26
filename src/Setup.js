/**
 * Setup.js — one-time setup helpers. Run these from the Apps Script editor.
 */

/** Script Property keys that hold the three secrets. */
const SECRET_KEYS = {
  developerToken: 'GADS_DEVELOPER_TOKEN',
  oauthClientSecret: 'GADS_OAUTH_CLIENT_SECRET',
  refreshToken: 'GADS_REFRESH_TOKEN',
};

/**
 * Run once. Logs exactly which Script Properties to set. Apps Script doesn't
 * allow secret entry via a prompt safely, so set them in:
 *   Project Settings (gear) → Script Properties → Add property
 * using the keys below.
 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  const missing = Object.values(SECRET_KEYS).filter(k => !props.getProperty(k));

  if (missing.length === 0) {
    Logger.log('✅ All secrets present. You can run installTriggers() then dailySync().');
    return;
  }

  Logger.log('Add these Script Properties (Project Settings → Script Properties):');
  Logger.log('  ' + SECRET_KEYS.developerToken + '     = <Google Ads developer token>');
  Logger.log('  ' + SECRET_KEYS.oauthClientSecret + ' = <OAuth client secret>');
  Logger.log('  ' + SECRET_KEYS.refreshToken + '      = <OAuth refresh token (scope: adwords)>');
  Logger.log('Still missing: ' + missing.join(', '));
}

/** Read a required secret or throw a clear error. */
function getSecret_(key) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  if (!v) throw new Error('Missing Script Property: ' + key + ' — run setup() for instructions.');
  return v;
}

/**
 * Install the nightly trigger. Idempotent — clears any existing dailySync
 * triggers first so re-running never stacks duplicates.
 */
function installTriggers() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'dailySync')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('dailySync')
    .timeBased()
    .everyDays(1)
    .atHour(6) // 6am in the script's timezone (appsscript.json)
    .create();

  Logger.log('✅ Installed daily trigger for dailySync() at ~6am.');
}
