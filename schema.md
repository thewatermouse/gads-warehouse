# Warehouse schema

The `Main` tab. One row per `date × campaign`. Columns are deliberately
platform-neutral so a future `meta-warehouse` produces the same shape and
everything downstream (guardrails, audits, reporting) reads one schema.

| Column | Type | Source (Google Ads) | Notes |
|--------|------|---------------------|-------|
| `date` | YYYY-MM-DD | `segments.date` | Account timezone |
| `platform` | string | constant `"google"` | Lets rows from multiple platforms share one table later |
| `account_id` | string | `CONFIG.customerId` | Digits only |
| `campaign_id` | string | `campaign.id` | |
| `campaign_name` | string | `campaign.name` | |
| `channel_type` | string | `campaign.advertising_channel_type` | SEARCH / PERFORMANCE_MAX / DISPLAY / … |
| `spend` | number | `metrics.cost_micros / 1e6` | Account currency |
| `impressions` | int | `metrics.impressions` | |
| `clicks` | int | `metrics.clicks` | |
| `conversions` | number | `metrics.conversions` | Can be fractional |
| `conv_value` | number | `metrics.conversions_value` | Revenue, account currency |
| `cpa` | number | derived | `spend / conversions` (blank if conversions = 0) |
| `roas` | number | derived | `conv_value / spend` (blank if spend = 0) |
| `last_updated` | ISO datetime | run time | When this row was last upserted |

**Upsert key:** `date + "|" + campaign_id`. Re-running the sync re-pulls the
lookback window and overwrites matching rows in place.

## Anomalies tab

Built each run from the `Main` tab. Compares the trailing 7 days
(`recent`) against the 7 days before that (`prior`), per campaign.

| Column | Notes |
|--------|-------|
| `campaign_name` | |
| `metric` | one of `spend`, `cpa`, `roas` |
| `prior` | prior-7d value |
| `recent` | recent-7d value |
| `pct_change` | `(recent - prior) / prior` |
| `flag` | `▲`/`▼` when `|pct_change|` ≥ `CONFIG.anomalyThreshold` **and** recent spend ≥ `CONFIG.minSpendForAnomaly`; blank otherwise |

Only flagged rows are written, sorted by absolute % change descending — so the
tab is a ready-to-read "what moved this week" list.
