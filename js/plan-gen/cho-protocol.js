// js/plan-gen/cho-protocol.js
// CHO Training Protocol module — personalised carbohydrate targets around training
// (pre / during / post), per sport / age / sex / session load. Pure functions only,
// NO load-time execution. Nothing here is wired into genPlan() yet (Phase 1 =
// display-only inside buildDayTgtHtml). See design/cho-protocol/design-doc.md.
//
// Public surface:
//   computeCHOTargets(c, t, dayIdx)  -> object | null   (§2 of the design doc)
//   choProtocolCheck(c, proceedFn)   -> void            (gate, defined but NOT wired in Phase 1)
//   CHO_TIMING_BY_SPORT, CHO_LOAD_BANDS                  (data / tunables)
//
// Depends (all load earlier, all guarded with typeof): calcTDEE, calcMETkcal
// (js/calc/plan-energy.js), getCarbLoadDayIndexes (js/client-editor/day-targets.js),
// showConfirmDialog (js/app-part2.js — runtime only). SPORT_PROFILES / SPORT_PROTOCOLS
// are read indirectly only; this module keeps its own structured numbers so it never
// needs to touch js/data/protocols.js.

/* ─────────────────────────────────────────────────────────────────────────────
   1. Structured per-sport CHO timing data
   All values are g CHO per kg body weight, EXCEPT `during.gPerHr*` which is g/hour.
   running / football / judo mirror SPORT_PROTOCOLS.*.mealTiming numerically
   (js/data/protocols.js:94-98 / :121-126 / :160-163) — single source of truth kept.
   The other 8 come from the bibliographic reference (Ricci 2025 ISSN combat;
   Collins 2021 UEFA team; Thomas 2016 ACSM/AND/DC endurance; Kerksick 2017 ISSN
   strength). `confidence`: 'a' auto default · 'b' suggested default, override-friendly.
   ───────────────────────────────────────────────────────────────────────────── */
var CHO_TIMING_BY_SPORT = {
  // ── Endurance ──────────────────────────────────────────────────────────────
  running: {
    category: 'endurance', confidence: 'a', sourceTag: 'Thomas2016 / SPORT_PROTOCOLS.running',
    dailyGPerKg: { lo: 6, hi: 10 },
    pre:   { gPerKgLo: 1, gPerKgHi: 4, leadMinLo: 120, leadMinHi: 180 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 90 },
    post:  { gPerKgLo: 0.8, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  cycling: {
    category: 'endurance', confidence: 'a', sourceTag: 'Thomas2016',
    dailyGPerKg: { lo: 6, hi: 10 },
    pre:   { gPerKgLo: 1, gPerKgHi: 4, leadMinLo: 60, leadMinHi: 240 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 90 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  swimming: {
    category: 'endurance', confidence: 'a', sourceTag: 'Thomas2016',
    dailyGPerKg: { lo: 6, hi: 10 },
    pre:   { gPerKgLo: 1, gPerKgHi: 4, leadMinLo: 60, leadMinHi: 240 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 60 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  // ── Team / intermittent high-intensity ────────────────────────────────────
  football: {
    category: 'team', confidence: 'a', sourceTag: 'Collins2021 / SPORT_PROTOCOLS.football',
    dailyGPerKg: { lo: 5, hi: 7 },
    pre:   { gPerKgLo: 1, gPerKgHi: 4, leadMinLo: 180, leadMinHi: 240 },
    preTopUp: { gLo: 50, gHi: 100, leadMin: 60 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 60 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  basketball: {
    category: 'team', confidence: 'a', sourceTag: 'Collins2021',
    dailyGPerKg: { lo: 5, hi: 7 },
    pre:   { gPerKgLo: 1, gPerKgHi: 3, leadMinLo: 180, leadMinHi: 240 },
    preTopUp: { gLo: 30, gHi: 60, leadMin: 60 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 60 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  // ── Combat / weight-category ──────────────────────────────────────────────
  judo: {
    category: 'combat', confidence: 'b', sourceTag: 'Ricci2025 / SPORT_PROTOCOLS.judo',
    dailyGPerKg: { lo: 5, hi: 7 }, campFloorGPerKg: 3.5,
    pre:   { gPerKgLo: 1.5, gPerKgHi: 3.0, leadMinLo: 120, leadMinHi: 180 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 75 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  bjj: {
    category: 'combat', confidence: 'b', sourceTag: 'Ricci2025',
    dailyGPerKg: { lo: 5, hi: 7 }, campFloorGPerKg: 3.5,
    pre:   { gPerKgLo: 1, gPerKgHi: 2, leadMinLo: 120, leadMinHi: 180 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 75 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  boxing: {
    category: 'combat', confidence: 'b', sourceTag: 'Ricci2025',
    dailyGPerKg: { lo: 5, hi: 7 }, campFloorGPerKg: 3.5,
    pre:   { gPerKgLo: 1, gPerKgHi: 2, leadMinLo: 120, leadMinHi: 180 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 60 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3,
             noteTag: 'postWeighIn' }
  },
  mma: {
    category: 'combat', confidence: 'b', sourceTag: 'Ricci2025',
    dailyGPerKg: { lo: 5, hi: 7 }, campFloorGPerKg: 3.75,
    pre:   { gPerKgLo: 1, gPerKgHi: 2, leadMinLo: 120, leadMinHi: 180 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 60 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  // ── Strength / power ─────────────────────────────────────────────────────
  weightlifting: {
    category: 'strength', confidence: 'b', sourceTag: 'Kerksick2017',
    dailyGPerKg: { lo: 4, hi: 7 }, campFloorGPerKg: 3.5,
    pre:   { gPerKgLo: 0.5, gPerKgHi: 1.5, leadMinLo: 60, leadMinHi: 120 },
    during:{ gPerHrLo: 15, gPerHrHi: 30, minDurationMin: 45 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 60, ratioCHOtoPRO: 3 }
  },
  crossfit: {
    category: 'power', confidence: 'b', sourceTag: 'Kerksick2017 / Thomas2016',
    dailyGPerKg: { lo: 4, hi: 7 },
    pre:   { gPerKgLo: 0.5, gPerKgHi: 1.5, leadMinLo: 60, leadMinHi: 120 },
    preTopUp: { gLo: 30, gHi: 60, leadMin: 45 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 45 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },

  // ── Category fallbacks (fallback level 2) ─────────────────────────────────
  __endurance: {
    category: 'endurance', confidence: 'a', sourceTag: 'Thomas2016',
    dailyGPerKg: { lo: 6, hi: 10 },
    pre:   { gPerKgLo: 1, gPerKgHi: 4, leadMinLo: 120, leadMinHi: 240 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 90 },
    post:  { gPerKgLo: 0.8, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  __team: {
    category: 'team', confidence: 'a', sourceTag: 'Collins2021',
    dailyGPerKg: { lo: 5, hi: 7 },
    pre:   { gPerKgLo: 1, gPerKgHi: 3, leadMinLo: 180, leadMinHi: 240 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 60 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  __combat: {
    category: 'combat', confidence: 'b', sourceTag: 'Ricci2025',
    dailyGPerKg: { lo: 5, hi: 7 }, campFloorGPerKg: 3.5,
    pre:   { gPerKgLo: 1, gPerKgHi: 2, leadMinLo: 120, leadMinHi: 180 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 75 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  __strength: {
    category: 'strength', confidence: 'b', sourceTag: 'Kerksick2017',
    dailyGPerKg: { lo: 4, hi: 7 },
    pre:   { gPerKgLo: 0.5, gPerKgHi: 1.5, leadMinLo: 60, leadMinHi: 120 },
    during:{ gPerHrLo: 15, gPerHrHi: 30, minDurationMin: 45 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 60, ratioCHOtoPRO: 3 }
  },
  __power: {
    category: 'power', confidence: 'b', sourceTag: 'Kerksick2017',
    dailyGPerKg: { lo: 4, hi: 7 },
    pre:   { gPerKgLo: 0.5, gPerKgHi: 1.5, leadMinLo: 60, leadMinHi: 120 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 45 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  },
  // ── Master generic framework (fallback level 3) ───────────────────────────
  __generic: {
    category: 'endurance', confidence: 'b', sourceTag: 'Thomas2016 (generic)',
    dailyGPerKg: { lo: 5, hi: 8 },
    pre:   { gPerKgLo: 1, gPerKgHi: 3, leadMinLo: 120, leadMinHi: 180 },
    during:{ gPerHrLo: 30, gPerHrHi: 60, minDurationMin: 75 },
    post:  { gPerKgLo: 1.0, gPerKgHi: 1.2, windowMin: 30, ratioCHOtoPRO: 3 }
  }
};

// sport -> category, for the fallback chain
var CHO_SPORT_CATEGORY = {
  running: 'endurance', cycling: 'endurance', swimming: 'endurance',
  football: 'team', basketball: 'team',
  bjj: 'combat', boxing: 'combat', mma: 'combat', judo: 'combat',
  weightlifting: 'strength', crossfit: 'power'
};

/* ─────────────────────────────────────────────────────────────────────────────
   2. LOAD_BANDS — maps the day's MET exercise load onto a position (0..1) inside
   the sport's g/kg range.

   `loadPerKg` = calcMETkcal().byDay[d] / bodyweight. For a non-pregnant client
   the weight cancels out, so it reduces to  MET × minutes × 0.0175  ≈  MET-hours
   of training that day. The thresholds below are therefore read as MET-hours:
     ≤3    ≤~30 min easy / skill work
     3–7   ~30–60 min easy–moderate
     7–12  ~1 h moderate, or ~45 min hard
     12–18 ~60–90 min mod-high, hard combat/team session
     18–26 ~2 h+ endurance / long hard session
     >26   2.5 h+ / stage / ultra-endurance

   Tuned 2026-09-01 from the first-pass estimates (was 4/9/14 → 0.15/0.45/0.75/1.0):
   the old curve pushed an ordinary ~1 h steady session to "high" (pos 0.75) and
   compressed everything ≥14 MET-h into pos 1.0, so a 2 h ride and a 5 h ultra got
   identical treatment. This curve keeps ~45–90 min sessions "moderate" and leaves
   headroom between a hard 2 h day and a true ultra day. Grounded in the ACSM/AND/DC
   daily-CHO tiers (Thomas 2016: 3–5 / 5–7 / 6–10 / 8–12 g/kg by training volume),
   not yet validated against a sample of real FYH athlete plans.
   ───────────────────────────────────────────────────────────────────────────── */
var CHO_LOAD_BANDS = [
  { maxLoadPerKg: 3,          pos: 0.10, tag: 'low'  },
  { maxLoadPerKg: 7,          pos: 0.30, tag: 'low'  },
  { maxLoadPerKg: 12,         pos: 0.50, tag: 'mod'  },
  { maxLoadPerKg: 18,         pos: 0.70, tag: 'high' },
  { maxLoadPerKg: 26,         pos: 0.88, tag: 'high' },
  { maxLoadPerKg: Infinity,   pos: 1.00, tag: 'high' }
];
// loadPerKg (≈ MET-hours) at/above this, AND a match day, auto-promotes intensity to 'race'
var CHO_RACE_LOAD_PER_KG = 20;
// manual tag -> position inside the range
var CHO_MANUAL_POS = { low: 0.05, mod: 0.50, high: 0.95, race: 1.00 };
// gross-bucket start times when only c.matchTimeBucket is known (mirrors plan.html MATCH_TIME_H)
var CHO_MATCH_TIME_H = { 'πρωί': '09:00', 'μεσημέρι': '13:00', 'απόγευμα': '17:00', 'βράδυ': '20:00' };
// post-exercise "keep topping up" guidance, identical across sports (1.0-1.2 g/kg/h up to ~4h)
var CHO_POST_EXTENDED = { gPerKgPerHrLo: 1.0, gPerKgPerHrHi: 1.2, hours: 4 };

/* ── small pure helpers ──────────────────────────────────────────────────── */
function choLerp(lo, hi, pos){
  var p = pos < 0 ? 0 : (pos > 1 ? 1 : pos);
  return lo + (hi - lo) * p;
}
function choPickLoadBand(loadPerKg){
  for(var i = 0; i < CHO_LOAD_BANDS.length; i++){
    if(loadPerKg <= CHO_LOAD_BANDS[i].maxLoadPerKg) return CHO_LOAD_BANDS[i];
  }
  return CHO_LOAD_BANDS[CHO_LOAD_BANDS.length - 1];
}
function choAddMinutes(hhmm, delta){
  if(!hhmm) return null;
  var p = String(hhmm).split(':');
  var h = parseInt(p[0], 10), m = parseInt(p[1], 10) || 0;
  if(isNaN(h)) return null;
  var tot = (((h * 60 + m + delta) % 1440) + 1440) % 1440;
  return String(Math.floor(tot / 60)).padStart(2, '0') + ':' + String(tot % 60).padStart(2, '0');
}
// c.trainIntensityByDay may be missing / short / hold junk — always hand back a clean 7-slot array
function normalizeIntensityByDay(arr){
  var out = [null, null, null, null, null, null, null];
  if(Array.isArray(arr)){
    for(var i = 0; i < 7; i++){
      var v = arr[i];
      out[i] = (v === 'low' || v === 'mod' || v === 'high' || v === 'race') ? v : null;
    }
  }
  return out;
}
function choCategoryOf(sport){ return CHO_SPORT_CATEGORY[sport] || 'endurance'; }
// fallback chain: exact sport -> '__'+category -> '__generic'  (design §2.3)
function choResolveTiming(sport){
  if(CHO_TIMING_BY_SPORT[sport]) return { data: CHO_TIMING_BY_SPORT[sport], key: sport, level: 1 };
  var cat = choCategoryOf(sport);
  if(CHO_TIMING_BY_SPORT['__' + cat]) return { data: CHO_TIMING_BY_SPORT['__' + cat], key: '__' + cat, level: 2 };
  return { data: CHO_TIMING_BY_SPORT['__generic'], key: '__generic', level: 3 };
}
// session start: explicit per-day time wins, else the match-time bucket, else null
function choSessionStart(c, d, isMatchDay){
  var times = c.trainTimesByDay || [];
  if(times[d]) return times[d];
  if(isMatchDay) return CHO_MATCH_TIME_H[c.matchTimeBucket || 'απόγευμα'] || '17:00';
  return null;
}
// ── meal-role classification (Phase 2: feeds allocateMealTargets) ─────────────
// Mirrors the default meal clock in initializeMealTiming (js/plan-gen/meal-slots.js:493-498).
var CHO_DEFAULT_MEAL_TIMES = { breakfast: '08:00', snack: '15:30', lunch: '13:00', dinner: '20:00', other: '12:00' };
function choHHMMtoMin(hhmm){
  if(!hhmm) return null;
  var p = String(hhmm).split(':');
  var h = parseInt(p[0], 10), m = parseInt(p[1], 10) || 0;
  return isNaN(h) ? null : h * 60 + m;
}
function choMealClock(name, c){
  var mt = (c && c.mealTimes) || {};
  var slot = (typeof classifyMealSlot === 'function') ? classifyMealSlot(name) : 'other';
  if(slot === 'breakfast') return mt.breakfast || CHO_DEFAULT_MEAL_TIMES.breakfast;
  if(slot === 'lunch')     return mt.lunch     || CHO_DEFAULT_MEAL_TIMES.lunch;
  if(slot === 'dinner')    return mt.dinner    || CHO_DEFAULT_MEAL_TIMES.dinner;
  if(slot === 'snack')     return mt.snack     || CHO_DEFAULT_MEAL_TIMES.snack;
  return CHO_DEFAULT_MEAL_TIMES.other;
}
// Role per meal, parallel to `meals`: 'pre' | 'post' | 'regular'. At most ONE meal per role.
// Order of evidence: (1) an already-stamped meal.mealTiming wins outright; otherwise (2) the
// single meal whose clock sits closest to the ideal pre / post time and inside a plausible
// window becomes that role. (3) No sessionStart → all 'regular' (redistribution stays inert;
// computeCHOTargets has already raised sessionTimeMissing).
function choMealRoles(meals, sessionStart, c){
  meals = meals || [];
  var startMin = choHHMMtoMin(sessionStart);
  var roles = meals.map(function(m){
    var mt = (m && typeof m === 'object' && m.mealTiming) ? m.mealTiming : null;
    if(mt === 'pre-workout') return 'pre';
    if(mt === 'post-workout' || mt === 'recovery') return 'post';
    return 'regular';
  });
  if(startMin == null) return roles;

  var preIdeal = startMin - 120, postIdeal = startMin + 30;
  var bestPre = -1, bestPreD = Infinity, bestPost = -1, bestPostD = Infinity;
  meals.forEach(function(m, i){
    if(roles[i] !== 'regular') return;                 // stamped meals already claimed
    var name = (typeof m === 'string') ? m : (m && m.name);
    var cm = choHHMMtoMin(choMealClock(name, c));
    if(cm == null) return;
    if(cm >= startMin - 210 && cm <= startMin - 45){
      var dp = Math.abs(cm - preIdeal);
      if(dp < bestPreD){ bestPreD = dp; bestPre = i; }
    }
    if(cm >= startMin - 15 && cm <= startMin + 150){
      var dq = Math.abs(cm - postIdeal);
      if(dq < bestPostD){ bestPostD = dq; bestPost = i; }
    }
  });
  // don't let the same meal be both; pre keeps it (closer, earlier need)
  if(bestPost === bestPre) bestPost = -1;
  if(roles.indexOf('pre') === -1 && bestPre !== -1) roles[bestPre] = 'pre';
  if(roles.indexOf('post') === -1 && bestPost !== -1) roles[bestPost] = 'post';
  return roles;
}

function choMkFlag(code, severity, title, detail, extra){
  extra = extra || {};
  return {
    code: code, severity: severity, title: title, detail: detail,
    blocking: severity === 'block',
    dismissible: !!extra.dismissible,
    triggeredBy: extra.triggeredBy || ''
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. buildCHOFlags — warnings for one day's result (design §4).
   Phase 1: shown in the panel only. Phase 2: block/alert/warn drive choProtocolCheck.
   ───────────────────────────────────────────────────────────────────────────── */
function buildCHOFlags(c, t, x){
  var f = [];
  var cp = c.choProtocol || {};
  var ov = cp.overrides || {};

  // youthRestrictionBlock — minor + any target that implies energy/CHO restriction
  if(x.isMinor){
    var youthFloor = (x.resolved.data.category === 'endurance') ? 6 : 5;
    var restrictive =
      (cp.dailyTargetGPerKg != null && cp.dailyTargetGPerKg < youthFloor) ||
      (cp.mode === 'manual' && ov.gPerKgPre != null && ov.gPerKgPre < 1) ||
      (t && t.ea != null && t.ea < 45);
    if(restrictive){
      f.push(choMkFlag('youthRestrictionBlock', 'block',
        'Νεαρός αθλητής — χωρίς περιορισμό CHO/θερμίδων',
        'Ηλικία <18: EA ≥ 45 kcal/kg FFM/ημέρα, κατά την άσκηση ≤ ~1 g/min, καμία ενεργειακή ή CHO στέρηση (Desbrow 2014). Χρειάζεται ρητή επιβεβαίωση για συνέχεια.',
        { dismissible: false, triggeredBy: 'age<18 + restrictive target' }));
    }
  }

  // redsAlert — EA below threshold; dedupe against calcTDEE's own warnings[]
  if(t && t.ea != null && (t.ea < 30 || (x.isMinor && t.ea < 45))){
    var dup = (t.warnings || []).some(function(w){
      return /EA=|RED-S|ενεργειακή διαθεσιμότητα/i.test(w.msg || '');
    });
    if(!dup){
      f.push(choMkFlag('redsAlert', 'alert',
        'Χαμηλή ενεργειακή διαθεσιμότητα',
        'EA=' + t.ea + ' kcal/kgLBM — κάτω από το κατώφλι. Το πρωτόκολλο CHO δεν υποκαθιστά τη διόρθωση του ενεργειακού ισοζυγίου.',
        { dismissible: false, triggeredBy: 't.ea' }));
    }
  }

  // weightCutSupervision — combat/weight-class + race/match day + daily CHO under camp floor
  var COMBAT = { bjj: 1, boxing: 1, mma: 1, judo: 1, weightlifting: 1 };
  if(COMBAT[c.sport] && (x.intensity === 'race' || x.isMatchDay) && x.dailyGPerKg < 4){
    var ack = !!cp.weightCutAcknowledged;
    f.push(choMkFlag('weightCutSupervision', ack ? 'info' : 'warn',
      'Weight-cut — ιατρική επίβλεψη',
      'Ημερήσιο CHO ' + x.dailyGPerKg.toFixed(1) + ' g/kg κάτω από το camp floor (3–4 g/kg). Μετά τη ζύγιση: ενυδάτωση πριν από υδατάνθρακες (Ricci 2025).',
      { dismissible: true, triggeredBy: 'combat + race/match + dailyGPerKg<4' }));
  }

  // experimentalDuringRate — only reachable with experimentalDuringHighRate opt-in
  if(x.duringGPerHr > 90){
    f.push(choMkFlag('experimentalDuringRate', 'info',
      'Πειραματικός ρυθμός κατά την άσκηση',
      x.duringGPerHr + ' g/h > 90 — μόνο gut-trained αθλητές αντοχής, 0.8:1 φρουκτόζη:γλυκόζη (tier c).',
      { dismissible: false, triggeredBy: 'experimentalDuringHighRate' }));
  }

  // noStructuredProtocol — fell back to a category / generic framework
  if(x.resolved.level > 1){
    f.push(choMkFlag('noStructuredProtocol', 'info',
      'Χωρίς ειδικό πρωτόκολλο αθλήματος',
      'Χρήση γενικού πλαισίου «' + x.resolved.key + '» (Thomas 2016). Τα νούμερα είναι επιπέδου κατηγορίας, όχι αθλήματος.',
      { dismissible: false, triggeredBy: 'fallback level ' + x.resolved.level }));
  }

  // sessionTimeMissing — training day but no start time -> grams only, no clock labels
  if(x.isTrainingDay && !x.sessionStart){
    f.push(choMkFlag('sessionTimeMissing', 'warn',
      'Λείπει η ώρα προπόνησης',
      'Χωρίς ώρα έναρξης εμφανίζονται μόνο γραμμάρια, χωρίς ώρες pre/post. Συμπλήρωσε 🕐 Ώρα σε αυτή την ημέρα.',
      { dismissible: false, triggeredBy: 'trainTimesByDay[' + x.dayIdx + '] κενό' }));
  }

  // intensityUnset — training day with NO MET load AND no explicit tag AND no hours
  if(x.isTrainingDay && x.loadPerKg == null && x.intensitySource === 'default'){
    f.push(choMkFlag('intensityUnset', 'info',
      'Ένταση χωρίς σήμα',
      'Ημέρα προπόνησης χωρίς φορτίο MET, χωρίς ρητή ένταση και χωρίς ώρες — χρησιμοποιείται μέση θέση. Πρόσθεσε MET δραστηριότητα ή όρισε ένταση.',
      { dismissible: false, triggeredBy: 'no MET / no tag / no hours' }));
  }

  // femaleLeanMassScaling — F without any lean-mass input
  if(c.sex === 'F' && !(c.lbm > 0) && !(c.leanmass > 0) && !((c.bf || 0) > 0)){
    f.push(choMkFlag('femaleLeanMassScaling', 'info',
      'Κλιμάκωση σε σωματικό βάρος',
      'Χωρίς άλιπη μάζα (LBM ή BF%) η κλιμάκωση γίνεται σε σωματικό βάρος. Ο στόχος ~12 g/kg LBM/ημέρα δεν υπολογίζεται (Sims 2023).',
      { dismissible: false, triggeredBy: 'sex F + no LBM' }));
  }

  // carbLoadOverlap — day already inside a carb-loading window
  if(x.carbLoadOverlap){
    f.push(choMkFlag('carbLoadOverlap', 'info',
      'Επικάλυψη με καρβοφόρτωση',
      'Αυτή η ημέρα είναι ήδη σε παράθυρο καρβοφόρτωσης — το ημερήσιο σύνολο το χειρίζεται η υπάρχουσα λογική, το module κρατά μόνο το pre/κατά/post timing.',
      { dismissible: false, triggeredBy: 'getCarbLoadDayIndexes' }));
  }

  // pregnancyCHOInteraction — sport protocols not validated in pregnancy
  if(c.pregnant){
    f.push(choMkFlag('pregnancyCHOInteraction', 'warn',
      'Εγκυμοσύνη — μη επικυρωμένο',
      'Τα CHO-timing πρωτόκολλα αθλημάτων δεν είναι επικυρωμένα σε εγκυμοσύνη. Το ημερήσιο ελάχιστο 175 g (GDM) υπερισχύει — έλεγξέ το χειροκίνητα.',
      { dismissible: false, triggeredBy: 'c.pregnant' }));
  }

  return f;
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. computeCHOTargets(c, t, dayIdx) — the core (design §2). Pure: does not write
   to c, call save(), or touch the DOM. Returns null when the module is off / the
   day is not a training or match day / no real sport is selected.
   ───────────────────────────────────────────────────────────────────────────── */
function computeCHOTargets(c, t, dayIdx){
  if(!c || !c.choProtocol || !c.choProtocol.enabled) return null;
  if(!c.sport || c.sport === 'custom') return null;

  if(!t && typeof calcTDEE === 'function'){ try { t = calcTDEE(c); } catch(e){ t = null; } }
  if(!t) return null;

  var d = dayIdx | 0;
  var cp = c.choProtocol;
  var ov = cp.overrides || {};

  // weight basis: pre-pregnancy weight while pregnant, else current weight (matches calcTDEE)
  var wBasis = (c.pregnant && c.prePregnancyWeight > 0) ? c.prePregnancyWeight : (c.weight || 0);
  if(!wBasis) return null;

  // MET exercise load for the day — the PRIMARY intensity signal.
  // t.byDay is already calcMETkcal(c).byDay (plan-energy.js:295); recompute only if absent.
  var byDay = (t.byDay && t.byDay.length === 7)
    ? t.byDay
    : (typeof calcMETkcal === 'function' ? (calcMETkcal(c).byDay || [0,0,0,0,0,0,0]) : [0,0,0,0,0,0,0]);
  var metKcalDay = byDay[d] || 0;

  var trainDays = c.trainDays || [];
  var matchDays = c.matchDays || [];
  var isMatchDay = matchDays[d] === true;
  var isTrainingDay = (trainDays[d] === true) || (metKcalDay > 0);
  if(!isTrainingDay && !isMatchDay) return null;

  // ── intensity / position inside the sport's g/kg range (design §2.2) ──
  var manualTag = normalizeIntensityByDay(c.trainIntensityByDay)[d];
  var loadPerKg = metKcalDay > 0 ? +(metKcalDay / wBasis).toFixed(2) : null;
  var trainHrsByDay = c.trainHoursByDay || [];
  var dayHrs = (trainHrsByDay[d] != null) ? (+trainHrsByDay[d] || 0) : 0;

  var intensity, intensitySource, pos;
  if(manualTag){
    intensity = manualTag; intensitySource = 'manual'; pos = CHO_MANUAL_POS[manualTag];
  } else if(loadPerKg != null){
    var band = choPickLoadBand(loadPerKg);
    intensity = band.tag; intensitySource = 'met-load'; pos = band.pos;
    if(loadPerKg >= CHO_RACE_LOAD_PER_KG && isMatchDay){ intensity = 'race'; pos = 1.0; }
  } else if(dayHrs > 0){
    intensitySource = 'duration-proxy';
    pos = Math.max(0.15, Math.min(0.9, dayHrs / 3));
    intensity = pos < 0.35 ? 'low' : (pos < 0.70 ? 'mod' : 'high');
  } else {
    intensity = isMatchDay ? 'race' : 'mod';
    intensitySource = 'default';
    pos = isMatchDay ? 1.0 : 0.5;
  }

  var resolved = choResolveTiming(c.sport);
  var P = resolved.data;
  var manual = cp.mode === 'manual';

  var sessionStart = choSessionStart(c, d, isMatchDay);
  var sessionEnd = (sessionStart && dayHrs > 0)
    ? choAddMinutes(sessionStart, Math.round(dayHrs * 60))
    : null;

  var isMinor = !!(t.isMinor) || (c.age != null && c.age > 0 && c.age < 18);

  // ── PRE ──
  // Grams are graded mostly by how far ahead the meal sits (Thomas 2016: ~1 g/kg an hour out …
  // ~4 g/kg ~4 h out — a GI-tolerance ceiling), with a smaller lift for session load/intensity.
  var preLeadMin = (ov.preLeadMin != null) ? ov.preLeadMin : Math.round(choLerp(P.pre.leadMinLo, P.pre.leadMinHi, pos));
  var leadSpan = Math.max(1, P.pre.leadMinHi - P.pre.leadMinLo);
  var leadFrac = Math.max(0, Math.min(1, (preLeadMin - P.pre.leadMinLo) / leadSpan));
  var prePos = 0.65 * leadFrac + 0.35 * pos;
  var preGPerKg = (manual && ov.gPerKgPre != null) ? +ov.gPerKgPre : choLerp(P.pre.gPerKgLo, P.pre.gPerKgHi, prePos);
  var preGrams = Math.round(preGPerKg * wBasis);
  var preTime = sessionStart ? choAddMinutes(sessionStart, -preLeadMin) : null;

  // ── DURING ──
  var duringApplicable = (dayHrs * 60) >= P.during.minDurationMin;
  var duringGPerHr = (manual && ov.gPerHrDuring != null) ? +ov.gPerHrDuring : choLerp(P.during.gPerHrLo, P.during.gPerHrHi, pos);
  duringGPerHr = Math.round(duringGPerHr);
  var duringCeil = cp.experimentalDuringHighRate ? 120 : 90;
  if(duringGPerHr > duringCeil) duringGPerHr = duringCeil;
  if(isMinor && duringGPerHr > 60) duringGPerHr = 60;   // youth: ≤ ~1 g/min absolute
  var duringTotal = duringApplicable ? Math.round(duringGPerHr * (dayHrs || 0)) : 0;

  // ── POST ──
  var postWindowMin = (ov.postWindowMin != null) ? ov.postWindowMin : (P.post.windowMin || 30);
  var postGPerKg = (manual && ov.gPerKgPost != null) ? +ov.gPerKgPost : choLerp(P.post.gPerKgLo, P.post.gPerKgHi, pos);
  var postGrams = Math.round(postGPerKg * wBasis);
  var postAnchor = sessionEnd || (sessionStart ? choAddMinutes(sessionStart, Math.round((dayHrs || 1) * 60)) : null);
  var postTime = postAnchor ? choAddMinutes(postAnchor, postWindowMin) : null;

  // ── daily CHO (informational in Phase 1) ──
  var dailyGPerKg = choLerp(P.dailyGPerKg.lo, P.dailyGPerKg.hi, pos);
  var dailyTarget = Math.round(dailyGPerKg * wBasis);
  // Phase 1 is strictly per-meal kcal-neutral: the module never shifts the day's CHO total,
  // so deltaVsBaselineG stays 0. Phase 2 may honour cp.dailyTargetGPerKg here (see design §2.5).
  var deltaVsBaselineG = 0;

  var carbLoadIdxs = (typeof getCarbLoadDayIndexes === 'function') ? getCarbLoadDayIndexes(c) : [];
  var carbLoadOverlap = carbLoadIdxs.indexOf(d) !== -1;

  var flagCtx = {
    dayIdx: d, intensity: intensity, intensitySource: intensitySource,
    isMatchDay: isMatchDay, isTrainingDay: isTrainingDay,
    dailyGPerKg: dailyGPerKg, duringGPerHr: duringGPerHr,
    sessionStart: sessionStart, isMinor: isMinor,
    carbLoadOverlap: carbLoadOverlap, resolved: resolved,
    loadPerKg: loadPerKg, dayHrs: dayHrs
  };
  var flags = buildCHOFlags(c, t, flagCtx);

  return {
    dayIdx: d,
    isTrainingDay: isTrainingDay,
    isMatchDay: isMatchDay,
    intensity: intensity,
    intensitySource: intensitySource,
    loadPerKg: loadPerKg,
    weightBasisKg: wBasis,
    sessionStart: sessionStart,
    pre: {
      grams: preGrams, gPerKg: +preGPerKg.toFixed(2),
      timeLabel: preTime, leadMin: preLeadMin, note: ''
    },
    during: {
      gramsPerHour: duringGPerHr, totalGrams: duringTotal,
      applicable: duringApplicable, minDurationMin: P.during.minDurationMin, note: ''
    },
    post: {
      grams: postGrams, gPerKg: +postGPerKg.toFixed(2),
      timeLabel: postTime, windowMin: postWindowMin,
      ratioCHOtoPRO: P.post.ratioCHOtoPRO || 3,
      extended: CHO_POST_EXTENDED, note: ''
    },
    dailyCHO: {
      gramsTarget: dailyTarget, gPerKg: +dailyGPerKg.toFixed(2),
      deltaVsBaselineG: deltaVsBaselineG
    },
    // Scaffold for the future allocateMealTargets 3rd arg (design §2.6). perMeal is
    // attached by the Phase 2 genPlan hook, which has the actual meals array. Ignored today.
    mealTimingArg: {
      kcalNeutral: true,
      dayCHOTotalG: dailyTarget,
      sessionStart: sessionStart,
      preChoG: preGrams, preTimeLabel: preTime,
      duringChoPerHr: duringGPerHr, duringTotalG: duringTotal,
      postChoG: postGrams, postTimeLabel: postTime
    },
    flags: flags,
    source: manual ? 'manual' : 'auto',
    _derivedFrom: resolved.key
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. choProtocolCheck(c, proceedFn) — gate in the style of pregnancyBlockCheck /
   calorieConsistencyCheck. DEFINED HERE but NOT wired into genPlanWithUndo() in
   Phase 1 — wiring it is a one-line change in js/plan-gen/gen-plan.js for Phase 2.
   No-op unless the module is enabled.
   ───────────────────────────────────────────────────────────────────────────── */
function choProtocolCheck(c, proceedFn){
  if(!c || !c.choProtocol || !c.choProtocol.enabled){ proceedFn(); return; }

  var t = (typeof calcTDEE === 'function') ? calcTDEE(c) : null;
  var all = [];
  for(var d = 0; d < 7; d++){
    var r = computeCHOTargets(c, t, d);
    if(r && r.flags && r.flags.length) all = all.concat(r.flags);
  }
  // one row per distinct code
  var seen = {}, uniq = [];
  all.forEach(function(fl){ if(!seen[fl.code]){ seen[fl.code] = 1; uniq.push(fl); } });

  var blocking = uniq.filter(function(fl){ return fl.blocking; });
  var alerts = uniq.filter(function(fl){ return fl.severity === 'alert' || fl.severity === 'warn'; });

  function toItem(fl){ return { type: fl.severity === 'alert' ? 'alert' : 'warn', msg: fl.title + ' — ' + fl.detail }; }
  function runAlerts(){
    if(alerts.length && typeof showConfirmDialog === 'function'){
      showConfirmDialog(
        alerts.map(function(fl){ return fl.title; }).join('\n') + '\n\nΣυνέχεια με αυτό το πρωτόκολλο CHO;',
        proceedFn,
        { icon: '🥤', confirmLabel: 'Συνέχεια', items: alerts.map(toItem),
          itemsFooter: 'Συνέχεια με αυτό το πρωτόκολλο CHO;' });
    } else {
      proceedFn();
    }
  }

  if(blocking.length && typeof showConfirmDialog === 'function'){
    var msg = '🥤 ' + blocking.map(function(fl){ return fl.title + ' — ' + fl.detail; }).join('\n\n')
      + '\n\nΘέλεις να συνεχίσεις ούτως ή άλλως (π.χ. υπό ιατρική επίβλεψη);';
    showConfirmDialog(msg, runAlerts, { icon: '🥤', confirmLabel: 'Συνέχεια ούτως ή άλλως' });
    return;
  }
  runAlerts();
}
