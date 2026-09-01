# CHO Training Protocol — Design Document

**Status:** **Phases 1 + 2 SHIPPED** (2026-09-01).
- Phase 1: `js/plan-gen/cho-protocol.js` (pure), `c.trainIntensityByDay` στο factory, display-only panel στο `buildDayTgtHtml`, χειριστές στο `form-controls.js`.
- Phase 2: `choMealRoles` (cho-protocol.js) + `redistributeCHOForTraining` patch στο `allocateMealTargets`
  (bounded, kcal-neutral carb shuffle προς pre/post-workout γεύματα, per-meal kcal + protein + day
  totals conserved exactly) + hook στο `genPlan()` (per-day `computeCHOTargets` → 3ο όρισμα του
  `allocateMealTargets`) + `choProtocolCheck` gate ως 3ος κρίκος στο `genPlanWithUndo()`.
  **Γνωστό όριο:** τα recipe-matching + `scalePlan` caps απορροφούν μέρος της ανακατανομής — το
  ορατό swing στο *παραγόμενο* πλάνο είναι μέτριο (~+10-15 g CHO στο pre snack). Μεγαλύτερο swing
  θέλει πραγματικό pre-workout meal slot στο template (follow-up).
- **Phase 3a SHIPPED** (2026-09-01): client portal + dietitian week-table.
  - `_buildSnapshot` (Dietologist.html): `CHO_TXT` dict (el/en/ru/tr) + `buildDayCho(d)` → βάζει
    μεταφρασμένο `cho` object στο `SNAP.days[d]` για κάθε ημέρα προπόνησης/αγώνα όταν `choProtocol.enabled`.
  - `plan.html`: `choCard(cho)` (pure render) στο `viewPlan()` (ανά ημέρα) + `viewHome()` («σήμερα»),
    3 στήλες Πριν/Κατά/Μετά + why/note/foot· null όταν δεν υπάρχει `cho` block (rest / off / παλιό link).
  - `js/plan-gen/week-table.js`: συμπαγής strip `🥤 Ν·Ν/h·Ν g` στην κεφαλίδα κάθε ημέρας προπόνησης.
  - Όλα display-only· `plan.html` καμία μαθηματική client-side.
- **Phase 3b SHIPPED** (2026-09-01): `js/reports/exports.js` — `exportPDF` παίρνει ενότητα
  «Υδατάνθρακες γύρω από την προπόνηση» (πίνακας class `st`, μία γραμμή ανά ημέρα προπόνησης,
  `page-break-inside:avoid`, μετά τον πίνακα πλάνου πριν τα συμπληρώματα, el/en). `exportWord`
  παίρνει το ίδιο ως απλές RTF παραγράφους (χωρίς πίνακα — κρατά ανέγγιχτη τη γεωμετρία RTF).
  Και τα δύο no-op χωρίς `choProtocol.enabled`.
- Mockup: `design/cho-protocol/mockup-phase3-surfaces.html` (και οι 4 επιφάνειες).
- **Improvement #1 SHIPPED** (2026-09-01): **weekly periodisation**. Το ημερήσιο CHO target
  πλέον κλιμακώνεται από (α) τη **φάση εβδομάδας** `c.choProtocol.weekPhase` (base/build/peak/
  taper/race, default 'build') και (β) το αν η ημέρα είναι η **κύρια συνεδρία** — η μοναδική
  σκληρότερη ημέρα (max MET load· match days + 'race'-tagged ημέρες μετράνε ως κύριες). Μόνο η
  κύρια φτάνει στην οροφή g/kg· οι δευτερεύουσες πλησιάζουν το κατώφλι ("fuel for the work
  required", Impey 2018). Pre/κατά/μετά **δεν** αγγίζονται. Νέα: `CHO_WEEK_PHASES`,
  `CHO_PHASE_SECONDARY/KEY/KEY_BONUS`, `choKeySessionIndex(c,t)` (cho-protocol.js)· `weekPhase`
  στο `ensureChoProtocol` + `setChoWeekPhase` (form-controls.js)· φάση-selector + «🔑 Κύρια» readout
  + νέα read-only γραμμή «🍚 CHO ημέρας» στο `buildDayTgtHtml` (day-targets.js)· smoke probe
  `cho.periodisation`. **Παραμένει display-only** — σύσταση στο grid, δεν ξαναγράφει το `eff[d].c`.
  Mockup: `design/cho-protocol/mockup-improvements.html`.

**CHO Training Protocol: Phases 1-3 COMPLETE + `LOAD_BANDS` + pre-CHO + daily-CHO κουρδισμένα &
validated έναντι πραγματικού marathon plan + improvement #1 (weekly periodisation) (2026-09-01).**
Ανοιχτά: improvement #3 (HIIT dampening)· improvement #2 (pre-workout meal slot / Phase 2 cleanup)·
combat daily range (non-cut δείγμα)· `judo`/SPORT_PROFILES.

**Βάση:** το read-only audit + verification pass (canonical repo
`C:\Users\steph\feedyourhealth-site`, git `main`, commit `bf4d15f`).

**Σκοπός module:** εξατομικευμένο πρωτόκολλο πρόσληψης υδατανθράκων (CHO) πριν / κατά / μετά την
προπόνηση, ανά άθλημα / ηλικία / φύλο / ένταση συνεδρίας — ως **προαιρετικό** βήμα μετά τον
υπολογισμό μακροθρεπτικών, χωρίς fork της μαθηματικής BMR/TDEE.

---

## 0. Ονοματολογία & θέση αρχείων (πρόταση, όχι υλοποίηση)

| Νέο αρχείο (μελλοντικό) | Ρόλος |
|---|---|
| `js/plan-gen/cho-protocol.js` | Το module: `CHO_TIMING_BY_SPORT` (structured data), `computeCHOTargets()`, `choProtocolCheck()` (gate), warning builders. Pure functions, καμία load-time εκτέλεση. Θα φόρτωνε μετά το `js/client-editor/day-targets.js` και πριν το `js/plan-gen/gen-plan.js`. |
| `design/cho-protocol/*` | Τα σημερινά παραδοτέα (doc + 2 mockups). |

Το `CHO_TIMING_BY_SPORT` σκόπιμα **δεν** ζει στο `js/data/protocols.js` προς το παρόν — μένει
self-contained στο module ώστε να μην αγγίζει υπάρχον αρχείο. Αν/όταν γίνει integration, οι 3
υπάρχουσες εγγραφές (`running`, `football`, `judo`) του `SPORT_PROTOCOLS.*.mealTiming`
(`js/data/protocols.js:75`) μπορούν να απορροφήσουν τα δομημένα πεδία και το module να διαβάζει
από εκεί.

---

## 1. Σχήμα δεδομένων

### 1.1 `c.trainIntensityByDay` — νέο top-level πεδίο πελάτη

Ακολουθεί τη σύμβαση των αδελφών του (`trainDays`, `trainHoursByDay`, `trainTimesByDay`,
`matchDays` — όλα ορίζονται στο factory `addClient()`, `js/core/state.js:336`).

| Χαρακτηριστικό | Τιμή |
|---|---|
| Τύπος | `Array` μήκους 7 |
| Indexing | `0 = Δευτέρα … 6 = Κυριακή` (ίδιο με `trainDays` / `weekPlan`) |
| Τιμές στοιχείου | `null` (= **auto**, το παράγει το module από το φορτίο MET) \| `'low'` \| `'mod'` \| `'high'` \| `'race'` (χειροκίνητο override) |
| Default (factory) | `[null,null,null,null,null,null,null]` → όλες οι ημέρες **auto** |
| Σημασιολογία | Έχει νόημα **μόνο** όταν η ημέρα είναι ημέρα προπόνησης (βλ. §2.2 — `trainDays[d] === true` **ή** `calcMETkcal().byDay[d] > 0`). `null` → η ένταση **παράγεται** από το φορτίο MET εκείνης της ημέρας (§2.2). Ρητή τιμή → **καρφώνει** τη θέση, αγνοεί τα kcal για εκείνη τη μέρα. `'race'` = ημέρα αγώνα / χρονομετρημένης προσπάθειας — πάνω άκρο εύρους + match-day timing (`matchTimeBucket`) + παράδοση ημ. συνόλου στην carb-loading αν `eventDate` κοντά. Σε ημέρα ανάπαυσης → αγνοείται. |
| Persistence | Μέσα στο ίδιο whole-blob (`fyh_clients` localStorage + `user_data.data` jsonb). Καμία DB migration — jsonb, missing = `undefined`, το module κάνει normalize σε 7άδα από `null`. |
| Opt-in / auto | **Προαιρετικό override.** Απουσία / `null` = πλήρης auto-derivation από MET. Ο διαιτολόγος το θέτει μόνο για να διορθώσει συγκεκριμένη μέρα (π.χ. intervals που τα kcal δείχνουν moderate, ή αγώνας). |

**Πώς προκύπτει η θέση μέσα στο εύρος του αθλήματος:**

Πρωτεύον = **φορτίο MET ανά κιλό, ανά ημέρα** (§2.2). Το χειροκίνητο tag είναι απλώς override:

| Τιμή | Πηγή | Θέση daily/pre/post CHO στο εύρος του αθλήματος |
|---|---|---|
| `null` (auto) | `calcMETkcal().byDay[d] / weight` → LOAD_BANDS (§2.2) | συνεχής θέση low↔high ανάλογα με το φορτίο |
| `'low'` | χειροκίνητο | κάτω άκρο εύρους |
| `'mod'` | χειροκίνητο | μέσο εύρους |
| `'high'` | χειροκίνητο | άνω άκρο εύρους |
| `'race'` | χειροκίνητο ή auto (πολύ υψηλό φορτίο **και** `matchDays[d]`) | άνω άκρο + carb-load awareness (βλ. §2.5) |

### 1.2 `c.choProtocol` — νέο opt-in αντικείμενο πελάτη

Γράφεται **μόνο** όταν ο διαιτολόγος ανοίξει το panel και αλλάξει κάτι. Απουσία του
αντικειμένου ⇒ το module είναι πλήρως αδρανές (ο hook στο `genPlan()` είναι no-op).

| Πεδίο | Τύπος | Default | Opt-in / auto | Περιγραφή |
|---|---|---|---|---|
| `enabled` | `boolean` | `false` | opt-in | Master switch. `false` ⇒ `computeCHOTargets()` επιστρέφει `null`, ο hook δεν τρέχει. |
| `mode` | `'auto'` \| `'manual'` | `'auto'` | opt-in | `auto` = παράγει g/kg από `CHO_TIMING_BY_SPORT` + ένταση. `manual` = χρησιμοποιεί τα `overrides.*`. |
| `overrides` | `object` | βλ. κάτω | opt-in | Συμβουλεύεται **μόνο** όταν `mode === 'manual'`. |
| `overrides.gPerKgPre` | `number` \| `null` | `null` | opt-in | g CHO ανά kg σωματικού βάρους, pre-exercise. |
| `overrides.gPerHrDuring` | `number` \| `null` | `null` | opt-in | g CHO ανά ώρα, during-exercise. |
| `overrides.gPerKgPost` | `number` \| `null` | `null` | opt-in | g CHO ανά kg, πρώτο post-exercise bolus. |
| `overrides.preLeadMin` | `number` | `120` | opt-in | Λεπτά πριν την έναρξη συνεδρίας (καθρέφτης του −2h στο `getMealTimingGuide`, `js/client-editor/day-targets.js:191`). |
| `overrides.postWindowMin` | `number` | `30` | opt-in | Λεπτά μετά τη λήξη για το post bolus. |
| `dailyTargetGPerKg` | `number` \| `null` | `null` | opt-in | Προαιρετικός ημερήσιος στόχος/κατώφλι CHO g/kg/ημέρα. `null` ⇒ το module **δεν** πειράζει το macro split του `calcTDEE`, μόνο ανακατανέμει ανά γεύμα (kcal-neutral). |
| `experimentalDuringHighRate` | `boolean` | `false` | opt-in (ρητό) | Επιτρέπει ρυθμό > 90 g/h (gut-trained αντοχή). **Ποτέ auto-set.** Χωρίς αυτό, το module clamp-άρει το during στα 90 g/h. |
| `weightCutAcknowledged` | `boolean` | `false` | opt-in | Ο διαιτολόγος έχει δει το `weightCutSupervision` flag — το κατεβάζει από `warn` σε `info`. |
| `_derivedFrom` | `string` | — | **auto** (cache) | Ποιο κλειδί `CHO_TIMING_BY_SPORT` / fallback κατηγορία χρησιμοποιήθηκε (audit trail, ίδιο πνεύμα με `t.bmrMethod`). Runtime-only· δεν είναι authoritative. |
| `_lastComputedAt` | `number` | — | auto (cache) | timestamp τελευταίου `computeCHOTargets`. |

**Ελάχιστη persisted επιφάνεια:** `enabled`, `mode`, `overrides`, `dailyTargetGPerKg`,
`experimentalDuringHighRate`, `weightCutAcknowledged`. Τα υπολογισμένα g / ώρες ανά ημέρα **δεν
αποθηκεύονται** στο blob — παράγονται on demand (κρατά το whole-blob μικρό, ίδιο σκεπτικό με το
`INTAKE_PAYLOAD_CACHE` runtime-only pattern).

### 1.3 Επίδραση στο factory `addClient()` (μελλοντικό, όχι τώρα)

Δύο προσθήκες στο literal του `js/core/state.js:336`:
`trainIntensityByDay:[null,null,null,null,null,null,null]` και **καμία** `choProtocol` (μένει
`undefined` μέχρι το πρώτο opt-in — έτσι το module ξέρει «ο διαιτολόγος δεν το άγγιξε ποτέ»).

---

## 2. `computeCHOTargets(c, t, dayIdx)` — signature & συμβόλαιο

> Pure function. Δεν γράφει στο `c`, δεν καλεί `save()`, δεν αγγίζει DOM. Ασφαλής να κληθεί από
> panel, PDF export, `_buildSnapshot`, ή τον hook του `genPlan()`. **Δεν** ξαναϋπολογίζει BMR/TDEE
> — δέχεται έτοιμο το `t`.

### 2.1 Είσοδοι

| Παράμετρος | Τύπος | Τι διαβάζεται |
|---|---|---|
| `c` | client object | `weight`, `sex`, `age` (ή `ageAtDate(c.birthDate)` — `js/client-editor/tracker.js:646`), `sport`, `trainDays[dayIdx]`, `trainHoursByDay[dayIdx]`, `trainTimesByDay[dayIdx]`, `trainIntensityByDay[dayIdx]`, `matchDays[dayIdx]`, `matchTimeBucket`, `choProtocol`, `eventDate` / `carbLoadDays` (awareness), `pregnant` / `prePregnancyWeight` (βάση βάρους), `lbm` / `leanmass` / `bf` (προαιρετική κλιμάκωση σε άλιπη μάζα). |
| `t` | αποτέλεσμα `calcTDEE(c)` (`js/calc/plan-energy.js:34`) | `t.target` (μέσος ημ. kcal), `t.trainTargetByDay[dayIdx]` (kcal εκείνης της ημέρας), `t.carb` (μέσα ημ. g CHO), `t.cPct` (CHO % ενέργειας), `t.usedMET`, `t.exerciseDaily`, `t.byDay[7]` (= `calcMETkcal().byDay`), `t.ea` (energy availability — για RED-S), `t.isMinor`, `t.protGperKg`, `t.pregTrimester`, `t.warnings` (για dedupe), `t.bmr` (μόνο ως kcal floor reference). **Verify:** όλα αυτά τα πεδία **επιστρέφονται ήδη** από το `calcTDEE` (γρ. 289-299) — καμία αλλαγή στο `plan-energy.js`. |
| `dayIdx` | `number` 0–6 | Δευτέρα…Κυριακή, ίδιο με `trainDays` / `weekPlan`. |
| *(εσωτ. κλήση)* | `calcMETkcal(c)` — pure fn (`js/calc/plan-energy.js:8`) | **Το πρωτεύον σήμα έντασης.** `byDay[7]` = kcal άσκησης ανά ημέρα (MET × λεπτά × βάρος), `perTrainDay`, `daily`, `weekly`. Το ίδιο `byDay[d]` που ήδη χρησιμοποιεί το `makeDayTgtDefaults` για τους per-day θερμιδικούς στόχους — **καμία δεύτερη, ανεξάρτητη πηγή φορτίου**. |

### 2.2 Ένταση ημέρας — παράγεται από το φορτίο MET (πρωτεύον σήμα)

Το `c.trainIntensityByDay[dayIdx]` **δεν** είναι η βασική είσοδος. Πρωτεύον είναι το **φορτίο
άσκησης ανά κιλό** εκείνης της ημέρας, που ενσωματώνει ήδη ένταση (τιμή MET) + διάρκεια (λεπτά)
+ σωματικό μέγεθος:

```
loadPerKg = calcMETkcal(c).byDay[dayIdx] / weightBasisKg      // kcal άσκησης ανά kg
```

**Ημέρα προπόνησης** = `c.trainDays[dayIdx] === true` **ή** `calcMETkcal(c).byDay[dayIdx] > 0`
(έτσι δεν χάνεται μέρα ορισμένη μόνο μέσω MET δραστηριότητας — λύνει το `trainDays` vs
`metActivities.days` mismatch).

**Χαρτογράφηση φορτίου → θέση στο εύρος g/kg του αθλήματος** — `LOAD_BANDS`, tunable const στο module.
Για μη-έγκυο πελάτη το βάρος απλοποιείται, οπότε `loadPerKg = MET × λεπτά × 0.0175 ≈ MET-ώρες` της
ημέρας. **Κουρδίστηκε 2026-09-01** (ήταν 4/9/14 → 0.15/0.45/0.75/1.0) — η παλιά καμπύλη έσπρωχνε μια
συνηθισμένη ~1ωρη προπόνηση στο «high» και συμπίεζε τα πάντα ≥14 MET-h στο pos 1.0· η νέα κρατά τα
45–90′ στο «moderate» και αφήνει περιθώριο ανάμεσα σε σκληρή 2ωρη μέρα και σε ultra. Grounded στα
ACSM/AND/DC daily-CHO tiers (Thomas 2016), **όχι ακόμα validated σε δείγμα πραγματικών πλάνων FYH**.

| `loadPerKg` (≈ MET-ώρες) | pos | tag | ~ νόημα |
|---|---|---|---|
| ≤ 3 | 0.10 | `low` | ≤~30′ χαλαρά / τεχνική |
| 3 – 7 | 0.30 | `low` | ~30–60′ χαλαρά–μέτρια |
| 7 – 12 | 0.50 | `mod` | ~1ω μέτρια, ή ~45′ σκληρά |
| 12 – 18 | 0.70 | `high` | ~60–90′ μεσαία-υψηλή, σκληρό combat/team |
| 18 – 26 | 0.88 | `high` | ~2ω+ αντοχή / μεγάλη σκληρή συνεδρία |
| > 26 | 1.00 | `high` | 2.5ω+ / stage / ultra |

`CHO_RACE_LOAD_PER_KG` = **20** (ήταν 16) — auto-`race` όταν το φορτίο ≥ αυτό **και** `matchDays[d]`.

**Επηρεάζει:** το **ημερήσιο** CHO g/kg και το **post-exercise** g/kg (κλιμάκωση εντός του
εύρους του αθλήματος).
**Δεν επηρεάζει:** ποιο εύρος ισχύει (→ `c.sport`), αν ενεργοποιείται το «κατά τη διάρκεια»
(→ κατώφλι διάρκειας `minDurationMin`, §2.3/§2.4), τον ρυθμό 30–60 g/h (sport + gut-limited),
το combat camp floor, τα youth ceilings.

**Προτεραιότητα πηγών ανά ημέρα:**

1. Ρητό `c.trainIntensityByDay[d]` (`'low'..'race'`) → **καρφώνει** τη θέση, αγνοεί τα kcal.
2. Αλλιώς `loadPerKg` από `calcMETkcal().byDay[d]` → **συνεχής** θέση μέσα στο εύρος.
3. Αλλιώς (`t.usedMET === false` ή `byDay[d] === 0`): `trainHoursByDay[d]` ως χοντρό proxy
   φορτίου (μεγαλύτερη διάρκεια → υψηλότερη θέση)· αν κι αυτό λείπει → μέση θέση + `intensityUnset`
   info flag που ζητά είτε MET δραστηριότητες είτε ρητή ένταση.
   *(Verify: το factory default του `trainHoursByDay` είναι `[1,1,1,1,1,1,1]` — όχι μηδενικά — οπότε
   σε φρέσκο πελάτη το proxy δεν ξεχωρίζει «καμία προπόνηση» από «1h». Στην πράξη το `setTrainDay`
   το μηδενίζει σε R και το `addMetActivity`/`removeMetActivity` το ξαναχτίζει· το `intensityUnset`
   καλύπτει το πραγματικά αμφίσημο state.)*
4. `'race'` (ρητό, ή auto όταν `loadPerKg` πολύ υψηλό **και** `matchDays[d] === true`) → πάνω άκρο
   + match-day timing (`matchTimeBucket`) + παράδοση ημ. συνόλου στην carb-loading (§2.5).

### 2.3 Τι διαβάζει από `SPORT_PROTOCOLS[c.sport].mealTiming`

Το υπάρχον `js/data/protocols.js` έχει `mealTiming` **μόνο** για `running`, `football`, `judo`,
και σε **ελεύθερο κείμενο** (π.χ. `preExercise: '2-3hrs before: 1-4g/kg CHO, 0.3-0.5g/kg PRO, <1g/kg FAT'`).
Το module χρειάζεται αριθμούς, οπότε:

- Διατηρεί δικό του **δομημένο** πίνακα `CHO_TIMING_BY_SPORT` (βλ. §3) με σχήμα ανά κλειδί:
  ```
  {
    category: 'endurance'|'team'|'combat'|'strength'|'power',
    dailyGPerKg:  { lo, hi },
    pre:   { gPerKgLo, gPerKgHi, leadMinLo, leadMinHi },
    during:{ gPerHrLo, gPerHrHi, minDurationMin },
    post:  { gPerKgLo, gPerKgHi, windowMin, ratioCHOtoPRO },
    confidence: 'a'|'b',            // §3 confidence tiers
    sourceTag: 'Thomas2016' | 'Collins2021' | 'Ricci2025' | ...
  }
  ```
- Για `running` / `football` / `judo` οι τιμές του module **αντικατοπτρίζουν** το κείμενο του
  `SPORT_PROTOCOLS` σε αριθμητική μορφή (καμία απόκλιση — single source of truth διατηρείται).
- **Fallback αλυσίδα:** `CHO_TIMING_BY_SPORT[c.sport]` → `CHO_TIMING_BY_SPORT['__' + categoryOf(c.sport)]`
  → `CHO_TIMING_BY_SPORT['__generic']` (master endurance framework, Thomas 2016). Κάθε πτώση κάτω
  από το πρώτο επίπεδο σηκώνει `noStructuredProtocol` flag (§4).

### 2.4 Έξοδος

`null` όταν: `!c.choProtocol || !c.choProtocol.enabled`, **ή** η ημέρα δεν είναι ημέρα προπόνησης
(§2.2: ούτε `trainDays[dayIdx]` ούτε `calcMETkcal().byDay[dayIdx] > 0`) και δεν είναι `matchDays[dayIdx]`,
**ή** `!c.sport`.

Αλλιώς αντικείμενο:

```
{
  dayIdx,
  isTrainingDay: boolean,                    // §2.2 — trainDays[d] Ή calcMETkcal().byDay[d] > 0
  isMatchDay: boolean,
  intensity: 'low'|'mod'|'high'|'race',      // ρητό tag, ή παράχθηκε από loadPerKg (§2.2)
  intensitySource: 'manual'|'met-load'|'duration-proxy'|'default',
  loadPerKg: number|null,                    // calcMETkcal().byDay[d] / weightBasisKg (null σε non-MET mode)
  weightBasisKg: number,                     // prePregnancyWeight όταν c.pregnant && >0, αλλιώς weight
  sessionStart: 'HH:MM' | null,              // trainTimesByDay[dayIdx]  ή  MATCH_TIME_H[matchTimeBucket]
  pre:   { grams, gPerKg, timeLabel:'HH:MM'|null, leadMin, note },
  during:{ gramsPerHour, totalGrams, applicable:boolean, note },   // applicable=false αν διάρκεια < minDurationMin
  post:  { grams, gPerKg, timeLabel:'HH:MM'|null, windowMin, ratioCHOtoPRO, note },
  dailyCHO: { gramsTarget, gPerKg, deltaVsBaselineG },             // deltaVsBaselineG vs t.carb-derived ημ. σύνολο
  mealTimingArg: { ... },                    // §2.6 — προς allocateMealTargets 3ο όρισμα
  flags: WarningFlag[],                      // §4
  source: 'auto'|'manual',                   // από c.choProtocol.mode
  _derivedFrom: string                       // κλειδί/κατηγορία fallback
}
```

- `grams` = `round(gPerKg × weightBasisKg)`, με `gPerKg` επιλεγμένο μέσα στο εύρος του αθλήματος
  βάσει του φορτίου/έντασης (§2.2).
- `timeLabel` υπολογίζεται στο ίδιο πνεύμα με το `getMealTimingGuide` (`js/client-editor/day-targets.js:198-215`)
  — *verify: εκείνο έχει **hardcoded** −2h / +30min, δεν διαβάζει `overrides.preLeadMin`/`postWindowMin`.
  Τα defaults του module (120 / 30) είναι εσκεμμένα ίδια ώστε το panel να συμφωνεί με τον υπάρχοντα οδηγό,
  αλλά οι δύο σταθερές είναι ανεξάρτητες.*
  pre = `sessionStart − leadMin`, post = `sessionEnd + windowMin` (όπου `sessionEnd = sessionStart +
  trainHoursByDay[dayIdx]`). `null` αν λείπει `sessionStart` → σηκώνει `sessionTimeMissing`.
- `during.totalGrams` = `gramsPerHour × trainHoursByDay[dayIdx]` (0 αν `applicable === false`).
- `during.gramsPerHour` clamp στα **90** εκτός αν `c.choProtocol.experimentalDuringHighRate === true`
  (τότε επιτρέπεται έως ~120, σηκώνει `experimentalDuringRate` info).

### 2.5 Αλληλεπίδραση με υπάρχουσα λογική (δεν γίνεται double-count)

| Υπάρχον | Πώς το σέβεται το module |
|---|---|
| `makeDayTgtDefaults` carb-boost redistribution (`js/client-editor/day-targets.js:88-95`) | Αν `c.carbBoost > 0`, το module **δεν** προσθέτει δικό του ημερήσιο CHO delta — αφήνει το `dailyCHO.deltaVsBaselineG = 0` και δουλεύει μόνο σε επίπεδο κατανομής ανά γεύμα. |
| `getCarbLoadDayIndexes` pre-event override (`js/client-editor/day-targets.js:26,99-117`) | Αν το `dayIdx` επιστρέφεται από `getCarbLoadDayIndexes(c)`, το module παραδίδει το ημερήσιο σύνολο στην υπάρχουσα carb-loading λογική (σηκώνει `carbLoadOverlap` info) και περιορίζεται σε pre/during/post timing. |
| Πρωτόκολλο εγκυμοσύνης GDM carb floor 175 g (`js/calc/plan-energy.js:285-287`) | *Verify: αυτό είναι **warning** (`warnings.push`, `type:'alert'`), **δεν** κάνει clamp το `carbG`.* Στο Phase 1 (per-meal kcal-neutral, μηδενικό ημ. delta) είναι άνευ αντικειμένου· **αν** ενεργοποιηθεί `dailyTargetGPerKg` σε Phase 2, το ίδιο το module πρέπει να επιβάλει το 175 g floor αφού τίποτα άλλο δεν το κάνει. Σηκώνει `pregnancyCHOInteraction`. |
| BMR/kcal floors (`js/calc/plan-energy.js:171-176`, `day-targets.js:63-68`) | Το module είναι kcal-neutral (μετακινεί CHO μεταξύ γευμάτων, δεν αλλάζει ημ. kcal) εκτός αν `dailyTargetGPerKg` οριστεί ρητά — και τότε ο μετασχηματισμός γίνεται πάνω στο ήδη-floored `t`. |

### 2.6 Τι επιστρέφεται προς το `mealTiming` όρισμα του `allocateMealTargets`

`allocateMealTargets(dailyTarget, meals, mealTiming)` (`js/client-editor/day-targets.js:153`) έχει
**ήδη** 3ο παράμετρο `mealTiming` που **δεν χρησιμοποιείται σήμερα**. Το module τον γεμίζει με:

```
mealTimingArg = {
  kcalNeutral: true,
  dayCHOTotalG: number,               // = dailyCHO.gramsTarget
  perMeal: [
    { name, role: 'pre'|'during'|'post'|'regular',
      choTargetG,                     // επιθυμητά g CHO για αυτό το γεύμα
      choFloorG }                     // ελάχιστο (pre/post δεν πέφτουν κάτω από αυτό)
  ]
}
```

- `perMeal` είναι **παράλληλο** με το `meals` array που περνά ο `genPlan()`.
- `role` ανά γεύμα προκύπτει από (α) το ήδη σφραγισμένο `meal.mealTiming` (το βάζει το
  `js/plan-gen/meal-slots.js:527-556` = `'pre-workout'` / `'post-workout'` / `'recovery'` / `'regular'`), ή
  (β) εγγύτητα της ώρας του γεύματος στο `sessionStart`.
  *Verify: το vocabulary του `meal.mealTiming` **δεν είναι ενιαίο** στον κώδικα — `meal-slots.js` γράφει
  lowercase-hyphen, `food-distribution.js:75` ελέγχει `'Lunch'`/`'Dinner'`, `week-table.js:166` κάνει
  default σε `'regular'`. Το Phase 2 mapping πρέπει να δεχτεί το lowercase-hyphen set ως primary και να
  είναι defensive για τα υπόλοιπα.*
- Συμβόλαιο για μελλοντικό patch του `allocateMealTargets`: όταν `mealTiming` δοθεί, να
  ανακατανέμει CHO grams προς τα `pre`/`post`/`during` γεύματα **χωρίς** να αλλάξει το άθροισμα
  kcal της ημέρας (ίδια αρχή με το carb-boost). Χωρίς patch, το `mealTimingArg` απλά αγνοείται
  (backward compatible) και το module παραμένει display-only.

---

## 3. `CHO_TIMING_BY_SPORT` — δεδομένα για τα 8 αθλήματα που λείπουν

Τα 8 κλειδιά που υπάρχουν στο `SPORT_PROFILES` (`js/data/protocols.js:17`) αλλά **λείπουν** από
το `SPORT_PROTOCOLS`: `bjj`, `boxing`, `mma`, `basketball`, `weightlifting`, `cycling`,
`swimming`, `crossfit`.
*(Σημείωση: το `judo` υπάρχει στο `SPORT_PROTOCOLS` αλλά **όχι** στο `SPORT_PROFILES` — δεν
επιλέγεται από το dropdown σήμερα· αξίζει ξεχωριστό follow-up, εκτός scope εδώ.)*

Όλες οι τιμές είναι **g CHO ανά kg σωματικού βάρους**, εκτός της στήλης *During* που είναι
**g ανά ώρα**. Βάση: reference doc (ISSN / ACSM-AND-DC / IOC / UEFA position stands +
συστηματικές ανασκοπήσεις).

| key | Κατηγορία / πηγή | Daily g/kg/ημέρα | Pre g/kg (lead) | During g/h (ελάχ. διάρκεια) | Post — 1ο bolus g/kg (window) | Post ρυθμός g/kg/h αν recovery < 8h | Conf. |
|---|---|---|---|---|---|---|---|
| **bjj** | Combat / weight-category — Ricci 2025 ISSN | camp floor **3.0–4.0**· εκτός camp 5–7 | 1–2 (2–3h)· low-fibre fight week | 30–60 μόνο αν συνεδρία > 75′ ή πολλά rounds | 1.0–1.2 (0–30′) | 1.0–1.2 × 4h | b |
| **boxing** | Combat / weight-category — Ricci 2025 ISSN | camp floor **3.0–4.0**· εκτός camp 5–7 | 1–2 (2–3h) | 30–60 για sparring blocks > 60′ | 1.0–1.2 (0–30′)· post-ζύγιση 4–7 σύνολο αν depleted | 1.0–1.2 × 4h· **post-weigh-in ≤ 60 g/h ΜΕΤΑ από ORS** | b |
| **mma** | Combat / weight-category — Ricci 2025 ISSN | camp floor **3.5–4.0**· εκτός camp 5–7 | 1–2 (2–3h) | 30–60 για conditioning > 60′ | 1.0–1.2 (0–30′) | 1.0–1.2 × 4h | b |
| **basketball** | Team / intermittent high-intensity — Collins 2021 UEFA (γενίκευση) | 5–7 τυπικά· **6–8** ημέρα αγώνα ± 1 | 1–3 (3–4h pre-game)· ~30–60 g 1h πριν | 30–60 in-game / long tournament | 1.0–1.2 (0–30′) | 1.0–1.2 × 4h | a (framework) |
| **weightlifting** | Strength/power + weight class — Kerksick 2017 ISSN· Ricci 2025 (class) | 4–7· **3–4 floor** αν κάνει βάρος | ~0.5–1.5 (≈30–90 g, 1–2h) | δεν απαιτείται < 45′· 15–30 g για μεγάλα technical blocks | 1.0–1.2 (0–60′) | 1.0–1.2 × 2–4h | b |
| **cycling** | Endurance — Thomas/Erdman/Burke 2016 | **6–10** (8–12 stage / πολύ υψηλός όγκος) | 1–4 (1–4h) | 30–60· έως 90 αν > 2.5h (2:1 glu:fru)· πειραματικό 120 gut-trained | 1.0–1.2 (0–30′) | 1.0–1.2 × 4h | a |
| **swimming** | Endurance — Thomas/Erdman/Burke 2016 | **6–10** | 1–4 (1–4h) | 30–60 για σετ > 60–90′ / open water | 1.0–1.2 (0–30′) | 1.0–1.2 × 4h | a |
| **crossfit** | Strength/power + γλυκολυτικό — Kerksick 2017· Thomas 2016 (during) | 4–7 (5–8 σε high-volume blocks) | 0.5–1.5 (1–2h)· 30–60 g 30–60′ pre-WOD | 30–60 για WODs / συνεδρίες > 45–60′ | 1.0–1.2 (0–30′) | 1.0–1.2 × 4h | b |

### 3.1 Modifier layers (δεν είναι αθλήματα — εφαρμόζονται πάνω στο επιλεγμένο sport)

| Modifier | Trigger | Επίδραση | Πηγή | Conf. |
|---|---|---|---|---|
| **Youth (~10–18)** | `t.isMinor` ή `age < 18` | Daily 5–7 (moderate) / 6–10 (endurance)· pre 1–4 g/kg (1–4h)· during 30–60 **και όχι > ~1 g/min** (χαμηλότερο απόλυτο ceiling)· post ~1.2 g/kg με έμφαση CHO+PRO αμέσως. **Απαγορεύεται** περιορισμός θερμίδων/CHO· EA floor ≥ 45 kcal/kg FFM/ημέρα. | Desbrow 2014 SDA· Timmons 2003 | b (νούμερα extrapolated) |
| **Female (όλα τα αθλήματα)** | `c.sex === 'F'` | Κλιμάκωση σε **απόλυτα g / άλιπη μάζα** (~12 g/kg LBM/ημέρα για supercompensation)· **καμία** διαφορά στην απόδοση CHO κατά την άσκηση· **καμία** διαφορά σε ικανότητα ή timing επαναπλήρωσης γλυκογόνου· περισσότερη διαθεσιμότητα CHO σε ωχρινική φάση / active-pill εβδομάδα. | Sims 2023 ISSN· James 2001 | a (glycogen)· b (φάση κύκλου) |

### 3.2 Confidence tiers (καθορίζουν αν μια τιμή είναι κλειδωμένο default ή προτεινόμενο)

- **(a) Υψηλή** → άμεσα auto default: master framework (endurance daily/pre/during/post), UEFA
  team, combat camp floor 3–4 g/kg, ακολουθία «ORS πριν CHO» μετά τη ζύγιση, «καμία διαφορά
  φύλου σε επαναπλήρωση γλυκογόνου».
- **(b) Περιορισμένη / υπό συζήτηση** → προτεινόμενο default **με** εύκολο override, ποτέ
  κλειδωμένο: ακριβή νούμερα youth, combat refeed 8–12 g/kg μετά ζύγιση, strength daily 4–7 vs
  8–12, προσαρμογές φάσης κύκλου.
- **(c) Ποτέ default:** during > 90 g/h. Μόνο μέσω `experimentalDuringHighRate` opt-in, ρητά
  σημασμένο ως πειραματικό (0.8:1 fructose:glucose, gut training).

---

## 4. Warnings / flags schema

```
WarningFlag = {
  code:        string,            // σταθερό αναγνωριστικό (κάτω)
  severity:    'block'|'alert'|'warn'|'info',
  title:       string,            // el (en στο snapshot/portal)
  detail:      string,
  blocking:    boolean,           // true μόνο για severity 'block'
  dismissible: boolean,           // αν καθαρίζει με flag στο c.choProtocol
  triggeredBy: string             // ποιο input το πυροδότησε (debug / UI)
}
```

`severity` mapping στην υπάρχουσα σύμβαση: `block`/`warn` όπως `getPregnancySafetyFlags`
(`js/plan-gen/gen-plan.js:17-29`)· `alert`/`warn` όπως `calcTDEE().warnings` (`js/calc/plan-energy.js:215`).

| code | severity | Πότε ενεργοποιείται | Blocking | Dismiss |
|---|---|---|---|---|
| `youthRestrictionBlock` | `block` (soft — confirm-to-proceed όπως `pregnancyBlockCheck`) | `t.isMinor` **και** ( `c.choProtocol.dailyTargetGPerKg` < youth floor [5 g/kg moderate · 6 endurance] **ή** `mode==='manual'` με override που υπονοεί ενεργειακό περιορισμό **ή** `t.ea != null && t.ea < 45` ) | ναι (overridable υπό ιατρική επίβλεψη) | όχι |
| `redsAlert` | `alert` | `t.ea != null && t.ea < 30` (ίδιο κατώφλι με `plan-energy.js:237`) **ή** ( `t.isMinor && t.ea < 45` ). Dedupe: αν ήδη υπάρχει αντίστοιχο στο `t.warnings`, δεν διπλο-προστίθεται. | όχι | όχι (re-eval κάθε φορά) |
| `weightCutSupervision` | `warn` (→ `info` αν `c.choProtocol.weightCutAcknowledged`) | `c.sport ∈ {bjj,boxing,mma,judo,weightlifting}` **και** ( κάποια ημέρα ένταση `'race'` [ρητή ή auto] **ή** `matchDays` true ) **και** ημ. CHO στόχος < 4 g/kg (camp floor) | όχι | ναι (`weightCutAcknowledged`) |
| `experimentalDuringRate` | `info` | `during.gramsPerHour > 90` (δυνατό μόνο με `experimentalDuringHighRate === true`) | όχι | — |
| `noStructuredProtocol` | `info` | `c.sport` set αλλά ούτε `SPORT_PROTOCOLS` ούτε `CHO_TIMING_BY_SPORT` έχει εγγραφή → fallback σε `__<category>` ή `__generic` | όχι | — |
| `sessionTimeMissing` | `warn` | `trainDays[d]` true αλλά `trainTimesByDay[d]` κενό → μόνο g, χωρίς ώρες pre/post | όχι | — |
| `intensityUnset` | `info` | Ημέρα προπόνησης **χωρίς MET φορτίο** (`byDay[d] === 0`) **και** χωρίς ρητό `trainIntensityByDay[d]` **και** χωρίς `trainHoursByDay[d]` → μέση θέση κατ' ανάγκη. *(Όταν υπάρχει MET φορτίο, το `null` είναι κανονική auto λειτουργία — **κανένα** flag.)* | όχι | — |
| `femaleLeanMassScaling` | `info` | `c.sex==='F'` **και** κανένα από `lbm`/`leanmass`/`bf` → κλιμάκωση σε σωματικό βάρος, όχι άλιπη μάζα· ο στόχος ~12 g/kg LBM/ημέρα δεν υπολογίζεται | όχι | — |
| `carbLoadOverlap` | `info` | Το `dayIdx` επιστρέφεται και από `getCarbLoadDayIndexes(c)` → ημ. σύνολο παραδίδεται στην υπάρχουσα carb-loading λογική (no double-count) | όχι | — |
| `pregnancyCHOInteraction` | `warn` | `c.pregnant` true → τα sport CHO-timing πρωτόκολλα δεν είναι validated σε εγκυμοσύνη· GDM carb floor 175 g/ημέρα (`plan-energy.js:285`) υπερισχύει | όχι | — |

**Ροή gate (πρόταση):** νέα συνάρτηση `choProtocolCheck(c, proceedFn)` στο module, στο ίδιο ύφος
με `pregnancyBlockCheck` / `calorieConsistencyCheck`. Τα `block` flags ⇒ `showConfirmDialog`
με confirm-to-proceed. Τα `alert`/`warn` ⇒ items σε ένα ενοποιημένο confirm (όπως ήδη κάνει το
`calorieConsistencyCheck`, `js/plan-gen/gen-plan.js:35-43`). Τα `info` ⇒ μόνο στο panel, όχι
interrupt.

---

## 5. Σημείο hook μέσα στο `genPlan()`

Αρχείο: **`js/plan-gen/gen-plan.js`**, συνάρτηση `genPlan()` (ξεκινά **γραμμή 160**).

### 5.1 Κύριο hook — template-based path

- **Μετά** τη γραμμή **270** ( `var eff=getDayTgtEff(c,t);` ) και **πριν** τον βρόχο ανά ημέρα
  στις γραμμές **275–277** που καλεί `allocateMealTargets`:
  ```
  270:  var eff=getDayTgtEff(c,t);
  271:
  272:  // ✅ PHASE 3A: HYBRID SYSTEM — Allocate per-meal targets from daily totals
  ...
  275:  for(var d=0;d<7;d++){
  276:    eff[d].meals = allocateMealTargets(eff[d], tmplDays[d]);
  277:  }
  ```
- Εννοιολογικά: για κάθε `d` 0–6, `choResult[d] = computeCHOTargets(c, t, d)`. Αν
  `c.choProtocol && c.choProtocol.enabled` και `choResult[d] != null`, να περνά το
  `choResult[d].mealTimingArg` ως **3ο όρισμα** στο `allocateMealTargets(eff[d], tmplDays[d], …)`
  (ο παράμετρος υπάρχει ήδη, `js/client-editor/day-targets.js:153`) και προαιρετικά να προσαρμόζει
  τα CHO grams του `eff[d]` **kcal-neutrally** όταν `dailyTargetGPerKg` έχει οριστεί.
- Τα `choResult[*].flags` συγκεντρώνονται και επιστρέφονται/εμφανίζονται μέσω της gate ροής
  (§5.3).

### 5.2 Δευτερεύον hook — clone-from-client path (χαμηλή προτεραιότητα)

- Ο κλάδος `isClientPlan` (γραμμές **170–214**) έχει δικό του `getDayTgtEff` στη γραμμή **194**
  και `scalePlan` στη **197**, αλλά **δεν** καλεί `allocateMealTargets`.
- Hook εδώ: μετά τη γραμμή **194**, `computeCHOTargets(c, t, d)` ανά ημέρα **μόνο** για την
  προσαρμογή ημερήσιου συνόλου CHO (καμία ανακατανομή ανά γεύμα — ο κλάδος δεν κάνει per-meal
  allocation). Προαιρετικό· μπορεί να παραλειφθεί στην πρώτη φάση.

### 5.3 Gate — μέσα στην αλυσίδα `genPlanWithUndo()`

Αρχείο ίδιο, συνάρτηση `genPlanWithUndo()` (**γραμμές 46–51**), συγκεκριμένα η γραμμή **50**:
```
50:  pregnancyBlockCheck(c, function(){ calorieConsistencyCheck(c, function(){ _genPlanWithUndoProceed(c); }); });
```
- Πρόταση: προσθήκη τρίτου κρίκου στο ίδιο pattern —
  `pregnancyBlockCheck(c, ()=> calorieConsistencyCheck(c, ()=> choProtocolCheck(c, ()=> _genPlanWithUndoProceed(c))))`.
- `choProtocolCheck` no-op αν `!c.choProtocol || !c.choProtocol.enabled`.

### 5.4 Display-only καταναλωτές (καμία αλλαγή στο genPlan)

`computeCHOTargets` είναι pure — το dietitian panel, το PDF export (`js/reports/exports.js`) και
το `_buildSnapshot` (`Dietologist.html:3187`, για το portal) το καλούν ανεξάρτητα. Για το portal
η τιμή ψήνεται μεταφρασμένη στο `SNAP` (π.χ. `SNAP.choProtocol` / `days[d].choTiming`) — καμία
νέα μαθηματική client-side στο `plan.html`.

---

## 6. Αποφάσεις & ανοιχτά ερωτήματα

### 6.1 Αποφασισμένα

- **Πρωτεύον σήμα έντασης = φορτίο MET** (`calcMETkcal().byDay[d] / weight`, §2.2). Το
  `c.trainIntensityByDay` υποβαθμίζεται σε **προαιρετικό override** ανά ημέρα· default `null` =
  auto από MET, **όχι** «assume mod».
- **«Ημέρα προπόνησης»** = `trainDays[d]` **ή** `calcMETkcal().byDay[d] > 0` — λύνει το
  `trainDays` vs `metActivities.days` mismatch.
- Ίδιο `byDay[d]` με το `makeDayTgtDefaults` — **καμία δεύτερη πηγή φορτίου**.

**Phase 1 implementation notes (2026-09-01):**
- **Pre-CHO g/kg** = συνάρτηση **απόλυτου χρόνου πριν** (`preByLead = 0.3 + 0.6·ώρες` → 1h≈0.9,
  2h≈1.5, 3h≈2.1, 4h≈2.7 g/kg) + μικρό load nudge (`(pos−0.35)·0.9`), clamped στο `[gPerKgLo,
  gPerKgHi]` του αθλήματος (Thomas 2016: time-graded, όχι intensity-graded). **Αναθεωρήθηκε 2026-09-01**
  (ήταν `prePos = 0.65·leadFrac + 0.35·pos`): το `leadFrac` μετρούσε θέση μέσα στο *αυθαίρετο*
  leadMin-window κάθε αθλήματος (cycling 60–240 vs running 120–180), οπότε ένας ποδηλάτης έπαιρνε
  μεγαλύτερο pre από δρομέα για το **ίδιο** 2ωρο lead. Τώρα consistent ανά άθλημα: 2ω lead → ~2 g/kg
  παντού· cycling 2ωρη μέρα 134 g αντί 175. Μεγάλο pre-load (3–4 g/kg) = ο διαιτολόγος βάζει
  μεγαλύτερο `preLeadMin` (σωστό workflow — μεγαλύτερο γεύμα, τρώγεται νωρίτερα).
- `CHO_TIMING_BY_SPORT`: προστέθηκαν προαιρετικά πεδία `campFloorGPerKg` (combat/weight-class, τροφοδοτεί
  το `weightCutSupervision`), `preTopUp` (team/power «50–100 g 1h πριν»), module-level `CHO_POST_EXTENDED`
  (1.0–1.2 g/kg/h × 4h, ίδιο παντού). 17 κλειδιά = 11 αθλήματα + 6 fallbacks (`__endurance/__team/__combat/__strength/__power/__generic`).
- **Daily-CHO validation 2026-09-01** — έναντι πραγματικού πλάνου elite μαραθωνοδρόμου (M, 80 kg, Πίσινος
  case study): ο διαιτολόγος προγραμματίζει **5.6–6.2 g/kg** σε κανονικές εβδομάδες προπόνησης, **8.3 g/kg**
  μόνο σε carb-load. Το γραμμικό `pos` έβγαζε ~8 g/kg για μια απλή ~1ωρη μέρα → αλλαγές: (α) endurance
  `dailyGPerKg` 6–10 → **5–9**· (β) daily χρησιμοποιεί **`dailyPos = pos^1.6`** (convex) — κρατά τις
  κανονικές μέρες στο floor, φτάνει το ceiling μόνο σε 2ω+ long run. Μετά: easy 10km μέρα 447 g vs
  δ/λόγου 445 g (ακριβές)· long run 2ω 8.3 g/kg = ακριβώς το carb-load νούμερο· residual +23% στο HIIT
  (glycolytic — ο διαιτολόγος το κρατά χαμηλά, το module το διαβάζει πιο σκληρό). Combat: ένα πλάνο
  (~2.9 g/kg) αλλά είναι φάση weight-cut 1750 kcal — ο διαιτολόγος βάζει `dailyTargetGPerKg` χαμηλά και
  το `weightCutSupervision` flag πυροδοτεί· η combat range δεν αλλάχθηκε (χρειάζεται non-cut δείγμα).
- Panel: control strip + row `🥤 Ένταση` δείχνονται όποτε υπάρχει sport (η ένταση είναι top-level, ανεξάρτητη
  από `enabled`)· οι 3 read-only CHO σειρές + flag strip μόνο όταν `enabled`. `block/alert/warn` flags ως
  χρωματιστές γραμμές, `info` flags ως ένα muted `ℹ️` line.
- `choProtocolCheck` υπάρχει στο module αλλά **δεν** είναι wired στο `genPlanWithUndo()` (Phase 2).
- Verify: smoke PASS + baseline diff CLEAN· `deterministic core` (calcTDEE/calcMETkcal/makeDayTgtDefaults/
  getDayTgtEff/allocateMealTargets/buildClientExclusionList) **byte-identical** με/χωρίς `choProtocol`.
  (`genPlan()` full-output είναι εγγενώς non-deterministic — smart-gen variety — οπότε δεν συγκρίνεται byte-wise.)

**Κλειδωμένα πριν το Phase 1:** (2) `c.trainIntensityByDay` = **top-level** πεδίο (sibling convention,
ανεξάρτητο από `enabled`). (3) **per-meal kcal-neutral μόνο** — το `dailyTargetGPerKg` μένει στο schema
αλλά ανενεργό σε Phase 1. (6) **Επέκταση του `buildDayTgtHtml` grid**, όχι ξεχωριστό card.

### 6.2 Ανοιχτά

0. **Improvement #1 (weekly periodisation) SHIPPED 2026-09-01** — βλ. Status πάνω. Το «stateless
   per-day» πρόβλημα («κάθε μεγάλη μέρα = carb-load level») λύθηκε: auto κύρια-συνεδρία + φάση
   εβδομάδας. Επόμενα από τη λίστα βελτιώσεων: **#3** HIIT/διαλειμματικό dampening (μικρό
   `loadPerKg *= ~0.85` σε <60′ υψηλού φορτίου· θέλει 2-3 πραγματικά πλάνα για το factor)· **#2**
   ή pre-workout meal slot στα templates ή υποβάθμιση Phase 2 σε καθαρή display-only σύσταση.
1. `LOAD_BANDS` κουρδίστηκαν 2026-09-01 (§2.2, νέα 6-band καμπύλη + `CHO_RACE_LOAD_PER_KG`=20) από
   exercise-physiology reasoning — **ακόμα δεν** έχουν validated σε δείγμα πραγματικών πλάνων FYH.
   Το pre-CHO lever αναθεωρήθηκε 2026-09-01 (§Phase 1 notes: `preByLead` απόλυτου χρόνου αντί
   `leadFrac` μέσα σε per-sport window) — cycling & running πλέον consistent στο ίδιο lead.
2. **Phase 2.1 (αν χρειαστεί):** σκληρότερη ανακατανομή — post-`scalePlan` pass που σπρώχνει τα carb
   foods του pre/post γεύματος πάνω / fat foods κάτω προς τους `computeCHOTargets` στόχους· πιο
   επιθετικό αλλά ρισκάρει το calorie-consistency guard. Ή: νέο "pre-workout meal" slot στα templates.
3. Integration `CHO_TIMING_BY_SPORT` → `SPORT_PROTOCOLS.mealTiming` τώρα (structured rewrite των 3
   υπαρχόντων) ή αργότερα (module self-contained);
4. Το `judo`/`SPORT_PROFILES` mismatch — να προστεθεί το judo στο dropdown ως ξεχωριστό
   follow-up;
5. Phase 3: portal (`_buildSnapshot` → `SNAP`) + PDF export· `plan.html` παραμένει display-only.
