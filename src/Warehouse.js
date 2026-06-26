/**
 * Warehouse.js — pull → normalize → upsert into the Main tab.
 * Entry point: dailySync().
 */

const MAIN_HEADERS = [
  'date', 'platform', 'account_id', 'campaign_id', 'campaign_name',
  'channel_type', 'spend', 'impressions', 'clicks', 'conversions',
  'conv_value', 'cpa', 'roas', 'last_updated',
];

/** Main entry point. Pulls the lookback window, upserts, rebuilds anomalies. */
function dailySync() {
  const rows = pullCampaignRows_();
  upsertWarehouse_(rows);
  buildAnomalies_(); // defined in Anomaly.js
  Logger.log('✅ dailySync complete — ' + rows.length + ' rows pulled.');
}

/** GAQL for campaign daily metrics over the lookback window. */
function buildQuery_() {
  return [
    'SELECT',
    '  segments.date,',
    '  campaign.id,',
    '  campaign.name,',
    '  campaign.advertising_channel_type,',
    '  metrics.cost_micros,',
    '  metrics.impressions,',
    '  metrics.clicks,',
    '  metrics.conversions,',
    '  metrics.conversions_value',
    'FROM campaign',
    'WHERE segments.date DURING LAST_' + CONFIG.lookbackDays + '_DAYS',
  ].join(' ');
}

/** Pull and normalize into main-tab rows (arrays in MAIN_HEADERS order). */
function pullCampaignRows_() {
  // GAQL has no literal LAST_N_DAYS for arbitrary N, so use an explicit range.
  const query = buildQueryExplicitRange_();
  const results = gaqlSearch_(query);
  const now = new Date().toISOString();

  return results.map(r => {
    const spend = Number(r.metrics.costMicros || 0) / 1e6;
    const conv = Number(r.metrics.conversions || 0);
    const value = Number(r.metrics.conversionsValue || 0);
    return [
      r.segments.date,
      'google',
      CONFIG.customerId,
      String(r.campaign.id),
      r.campaign.name,
      r.campaign.advertisingChannelType,
      round_(spend, 2),
      Number(r.metrics.impressions || 0),
      Number(r.metrics.clicks || 0),
      round_(conv, 2),
      round_(value, 2),
      conv > 0 ? round_(spend / conv, 2) : '',
      spend > 0 ? round_(value / spend, 2) : '',
      now,
    ];
  });
}

/** Explicit BETWEEN range so any lookbackDays value works. */
function buildQueryExplicitRange_() {
  const tz = Session.getScriptTimeZone();
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - CONFIG.lookbackDays + 1);
  const fmt = d => Utilities.formatDate(d, tz, 'yyyy-MM-dd');

  return buildQuery_().replace(
    /WHERE segments\.date DURING LAST_\d+_DAYS/,
    "WHERE segments.date BETWEEN '" + fmt(start) + "' AND '" + fmt(end) + "'"
  );
}

/** Upsert rows into the Main tab keyed by date|campaign_id. */
function upsertWarehouse_(rows) {
  const sheet = getOrCreateSheet_(CONFIG.mainTab, MAIN_HEADERS);
  const existing = sheet.getDataRange().getValues();
  const header = existing.shift(); // drop header row

  const dateIdx = 0, campIdx = 3;
  const keyOf = r => r[dateIdx] + '|' + r[campIdx];

  // Index existing rows by key.
  const map = {};
  existing.forEach((r, i) => { if (r[campIdx]) map[keyOf(r)] = i; });

  // Merge: overwrite matches in place, collect new rows.
  const additions = [];
  rows.forEach(r => {
    const k = keyOf(r);
    if (k in map) existing[map[k]] = r;
    else additions.push(r);
  });

  const all = existing.concat(additions);
  all.sort((a, b) => (a[dateIdx] < b[dateIdx] ? 1 : a[dateIdx] > b[dateIdx] ? -1 : 0)); // newest first

  // Rewrite the data region.
  sheet.clearContents();
  sheet.getRange(1, 1, 1, header.length).setValues([header]);
  if (all.length) {
    sheet.getRange(2, 1, all.length, header.length).setValues(all);
  }
}

// ── small helpers ─────────────────────────────────────────────────────────

function getOrCreateSheet_(name, headers) {
  const ss = CONFIG.spreadsheetId
    ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet. Set CONFIG.spreadsheetId for a standalone script.');

  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function round_(n, dp) {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
