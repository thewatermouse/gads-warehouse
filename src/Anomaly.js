/**
 * Anomaly.js — build the Anomalies tab: trailing 7d vs prior 7d, per campaign.
 * Entry point: buildAnomalies_() (called by dailySync).
 */

const ANOMALY_HEADERS = ['campaign_name', 'metric', 'prior', 'recent', 'pct_change', 'flag'];

function buildAnomalies_() {
  const ss = CONFIG.spreadsheetId
    ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
  const wh = ss.getSheetByName(CONFIG.mainTab);
  if (!wh) throw new Error('Main tab not found — run dailySync first.');

  const data = wh.getDataRange().getValues();
  data.shift(); // header
  if (!data.length) return;

  // Column indices in MAIN_HEADERS.
  const C = { date: 0, campName: 4, spend: 6, conv: 9, value: 10 };

  // Define the two 7-day windows off the latest date present.
  const dates = data.map(r => r[C.date]).filter(Boolean).sort();
  const latest = new Date(dates[dates.length - 1]);
  const recentStart = addDays_(latest, -6);
  const priorEnd = addDays_(latest, -7);
  const priorStart = addDays_(latest, -13);

  // Aggregate spend/conv/value per campaign per window.
  const agg = {}; // name -> { recent:{...}, prior:{...} }
  data.forEach(r => {
    const d = new Date(r[C.date]);
    const name = r[C.campName];
    let win = null;
    if (inRange_(d, recentStart, latest)) win = 'recent';
    else if (inRange_(d, priorStart, priorEnd)) win = 'prior';
    if (!win) return;

    agg[name] = agg[name] || { recent: blank_(), prior: blank_() };
    agg[name][win].spend += num_(r[C.spend]);
    agg[name][win].conv += num_(r[C.conv]);
    agg[name][win].value += num_(r[C.value]);
  });

  // Build flagged rows for spend, cpa, roas.
  const out = [];
  Object.keys(agg).forEach(name => {
    const a = agg[name];
    pushMetric_(out, name, 'spend', a.prior.spend, a.recent.spend, a.recent.spend);
    pushMetric_(out, name, 'cpa', cpa_(a.prior), cpa_(a.recent), a.recent.spend);
    pushMetric_(out, name, 'roas', roas_(a.prior), roas_(a.recent), a.recent.spend);
  });

  // Keep only flagged, sort by |pct_change| desc.
  const flagged = out.filter(r => r[5] !== '')
    .sort((x, y) => Math.abs(y[4]) - Math.abs(x[4]));

  const sheet = getOrCreateSheet_(CONFIG.anomaliesTab, ANOMALY_HEADERS);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, ANOMALY_HEADERS.length).setValues([ANOMALY_HEADERS]);
  if (flagged.length) {
    sheet.getRange(2, 1, flagged.length, ANOMALY_HEADERS.length).setValues(flagged);
  }
}

/** Append one metric row with a flag if it crosses thresholds. */
function pushMetric_(out, name, metric, prior, recent, recentSpend) {
  if (!prior || !recent) return; // need both windows to compare
  const pct = (recent - prior) / prior;
  let flag = '';
  if (Math.abs(pct) >= CONFIG.anomalyThreshold && recentSpend >= CONFIG.minSpendForAnomaly) {
    flag = pct >= 0 ? '▲' : '▼';
  }
  out.push([name, metric, round2_(prior), round2_(recent), round2_(pct), flag]);
}

// ── helpers ─────────────────────────────────────────────────────────────
function blank_() { return { spend: 0, conv: 0, value: 0 }; }
function cpa_(w) { return w.conv > 0 ? w.spend / w.conv : 0; }
function roas_(w) { return w.spend > 0 ? w.value / w.spend : 0; }
function num_(v) { return Number(v) || 0; }
function round2_(n) { return Math.round(n * 100) / 100; }
function addDays_(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function inRange_(d, start, end) { return d >= stripTime_(start) && d <= stripTime_(end); }
function stripTime_(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
