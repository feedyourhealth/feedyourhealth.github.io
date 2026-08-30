// js/lib/bf-norms.js
// Single source of truth for the %BF reference-band model + the per-client goal
// target. Consumed by bfGaugeHtml (js/lib/helpers.js — the dietitian tracker gauge)
// and both PDF exporters (js/reports/exports.js: exportLipometriaPDF /
// exportBodyCompPDF). Before this module the same five thresholds were hand-copied
// in 4 places (helpers.js, exports.js ×2, plan.html) and had already drifted in
// shape (some had `lo`, some only `hi`); now the numbers live here once.
//
// plan.html (the standalone client portal, no shared <script> scope) keeps its OWN
// mirrors of BOTH models — bfBands() and GALLAGHER_BF/bfHealthByAge()/bfBandsChart().
// If you change a number here, change it there too (grep "GALLAGHER_BF" in plan.html).
//
// MODELS:
//  - BF_BANDS: the 5-band Essential/Athletic/Fitness/Acceptable/Obesity split — the
//    widely-published ACE/ACSM 5-category classification. NOT age-adjusted. Used as
//    a fixed reference ruler and as the fallback when a client's age is unknown.
//  - bfHealthByAge (Gallagher et al. 2000): age×sex healthy %BF ranges. This is the
//    age-adjusted verdict shown to the dietitian/client when age is known.
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

// ── Age-adjusted healthy %BF ranges — Gallagher et al. 2000 ───────────────────
// Gallagher D, et al. "Healthy percentage body fat ranges: an approach for developing
// guidelines based on body mass index." Am J Clin Nutr 2000;72(3):694-701 (Table 4).
// The healthy / overfat / obese bands are the %BF equivalents of the NIH/WHO BMI
// thresholds (healthy <25, overweight 25-30, obese >=30) at the midpoint of each
// 20-year age band. Age brackets: 20-39 / 40-59 / 60-79. Two independent published
// reproductions agree on every value (verified 2026-08-30). These are provisional
// population guidelines, not diagnostic cut-offs.
//   healthy: [lo, hi] inclusive · below lo = "low" (below the healthy range) ·
//   above hi and below obeseLo = "overfat" · >= obeseLo = "obese".
var GALLAGHER_BF = {
  M: [
    { ageLo:20, ageHi:39, healthy:[8, 19],  obeseLo:25 },
    { ageLo:40, ageHi:59, healthy:[11, 21], obeseLo:28 },
    { ageLo:60, ageHi:79, healthy:[13, 24], obeseLo:30 }
  ],
  F: [
    { ageLo:20, ageHi:39, healthy:[21, 32], obeseLo:39 },
    { ageLo:40, ageHi:59, healthy:[23, 33], obeseLo:40 },
    { ageLo:60, ageHi:79, healthy:[24, 35], obeseLo:42 }
  ]
};

// eslint-disable-next-line no-unused-vars
var GALLAGHER_ZONE_KEYS = ['low', 'healthy', 'overfat', 'obese'];

// Language-neutral zone descriptors (callers map key -> localized label).
var GALLAGHER_ZONES = {
  low:     { key:'low',     col:'#1565C0' },
  healthy: { key:'healthy', col:'#2e7d32' },
  overfat: { key:'overfat', col:'#f57c00' },
  obese:   { key:'obese',   col:'#c62828' }
};

// Age-adjusted %BF verdict. Returns { key, col, healthy:[lo,hi], obeseLo, ageBand }
// or null when it cannot apply (no %BF, or no usable age — the caller then falls back
// to the non-age-adjusted bfBandFor()). Ages <20 clamp to the 20-39 bracket and >79
// to 60-79 (Gallagher's published brackets stop there).
function bfHealthByAge(bf, sex, age){
  if(!(bf > 0) || !(age > 0)) return null;
  var rows = GALLAGHER_BF[sex === 'F' ? 'F' : 'M'];
  var a = age < 20 ? 20 : (age > 79 ? 79 : age);
  var row = null;
  for(var i = 0; i < rows.length; i++){ if(a >= rows[i].ageLo && a <= rows[i].ageHi){ row = rows[i]; break; } }
  if(!row) row = rows[rows.length - 1];
  var z;
  if(bf < row.healthy[0])       z = 'low';
  else if(bf <= row.healthy[1]) z = 'healthy';
  else if(bf < row.obeseLo)     z = 'overfat';
  else                          z = 'obese';
  return {
    key: GALLAGHER_ZONES[z].key,
    col: GALLAGHER_ZONES[z].col,
    healthy: row.healthy.slice(),
    obeseLo: row.obeseLo,
    ageBand: row.ageLo + '–' + row.ageHi
  };
}

// The 4 colour-boundary stops for an age-adjusted %BF range bar / arc, given a
// bfHealthByAge() result. [{v, col}] low->high, same shape the range bars already take.
function bfHealthBoundaries(gv){
  if(!gv) return null;
  return [
    { v: 0,               col: GALLAGHER_ZONES.low.col },
    { v: gv.healthy[0],    col: GALLAGHER_ZONES.healthy.col },
    { v: gv.healthy[1] + 1, col: GALLAGHER_ZONES.overfat.col },
    { v: gv.obeseLo,      col: GALLAGHER_ZONES.obese.col }
  ];
}
