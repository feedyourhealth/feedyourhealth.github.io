// js/lib/bf-norms.js
// Single source of truth for the %BF reference-band model + the per-client goal
// target. Consumed by bfGaugeHtml (js/lib/helpers.js — the dietitian tracker gauge)
// and both PDF exporters (js/reports/exports.js: exportLipometriaPDF /
// exportBodyCompPDF). Before this module the same five thresholds were hand-copied
// in 4 places (helpers.js, exports.js ×2, plan.html) and had already drifted in
// shape (some had `lo`, some only `hi`); now the numbers live here once.
//
// plan.html keeps its OWN mirrored copy (function bfBands / rangeBar) because it is
// a standalone file served to clients with no shared <script> scope — if you change
// a number here, change it there too (grep "bfBands(sex)" in plan.html).
//
// MODEL: the 5-band Essential / Athletic / Fitness / Acceptable / Obesity split is
// the widely-published ACE / ACSM 5-category body-fat classification. It is NOT
// age-adjusted. An age×sex percentile upgrade (ACSM Guidelines percentile tables +
// McCarthy 2006 centiles for minors) is planned but pending source verification —
// until it lands, nothing here or downstream should claim age-adjusted output.
//
// Loads immediately before js/lib/helpers.js.

// eslint-disable-next-line no-unused-vars
var BF_BAND_KEYS = ['essential', 'athletic', 'fitness', 'acceptable', 'obesity'];

// Language-neutral bands: [{key, lo, hi, col}] low→high. Callers map `key` to a
// localized label (each owns its own T() closure). `lo` of band 0 and `hi` of the
// last band are display floor/ceiling, not clinical claims.
function BF_BANDS(sex){
  return (sex === 'F')
    ? [{key:'essential',  lo:10, hi:13, col:'#1565C0'},
       {key:'athletic',   lo:14, hi:20, col:'#2e7d32'},
       {key:'fitness',    lo:21, hi:24, col:'#558b2f'},
       {key:'acceptable', lo:25, hi:31, col:'#f57c00'},
       {key:'obesity',    lo:32, hi:60, col:'#c62828'}]
    : [{key:'essential',  lo:2,  hi:5,  col:'#1565C0'},
       {key:'athletic',   lo:6,  hi:13, col:'#2e7d32'},
       {key:'fitness',    lo:14, hi:17, col:'#558b2f'},
       {key:'acceptable', lo:18, hi:24, col:'#f57c00'},
       {key:'obesity',    lo:25, hi:60, col:'#c62828'}];
}

// Which band a %BF value lands in — returns the band object, or null when bf is
// missing/0. Same "last band whose lo is <= bf wins" scan the call sites used inline.
function bfBandFor(bf, sex){
  var bands = BF_BANDS(sex), hit = null;
  if(bf > 0){ bands.forEach(function(b){ if(bf >= b.lo) hit = b; }); }
  return hit;
}

// Goal marker for the %BF range bar / gauge. Uses the dietitian's real per-client
// target (c.goalBF, written by the publish modal) when set; otherwise falls back to
// the top of the "fitness" band — the previous hardcoded `bfRefs[2].hi` behaviour.
function bfGoalTarget(c){
  if(c && c.goalBF > 0) return c.goalBF;
  return BF_BANDS((c && c.sex) || 'M')[2].hi;
}
