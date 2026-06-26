/**
 * GoogleAdsClient.js — thin wrapper over the Google Ads REST API.
 * Handles OAuth refresh-token exchange and GAQL searchStream.
 *
 * To port this family to another platform, this is the file you replace.
 */

/** Exchange the stored refresh token for a short-lived access token. */
function getAccessToken_() {
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      client_id: CONFIG.oauthClientId,
      client_secret: getSecret_(SECRET_KEYS.oauthClientSecret),
      refresh_token: getSecret_(SECRET_KEYS.refreshToken),
      grant_type: 'refresh_token',
    },
  });
  const body = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200 || !body.access_token) {
    throw new Error('OAuth token refresh failed: ' + res.getContentText());
  }
  return body.access_token;
}

/**
 * Run a GAQL query via googleAds:searchStream and return a flat array of
 * result objects (REST JSON, camelCase fields).
 */
function gaqlSearch_(query) {
  const url = 'https://googleads.googleapis.com/' + CONFIG.apiVersion +
    '/customers/' + CONFIG.customerId + '/googleAds:searchStream';

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + getAccessToken_(),
      'developer-token': getSecret_(SECRET_KEYS.developerToken),
      'login-customer-id': CONFIG.loginCustomerId,
    },
    payload: JSON.stringify({ query: query }),
  });

  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code !== 200) {
    throw new Error('Google Ads API error ' + code + ': ' + text);
  }

  // searchStream returns an array of batches, each with a results[] array.
  const batches = JSON.parse(text);
  const rows = [];
  batches.forEach(b => (b.results || []).forEach(r => rows.push(r)));
  return rows;
}
