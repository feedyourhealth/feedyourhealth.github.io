# Module split — προεργασία / execution plan

Status: **PREPARED, NOT STARTED.** Ο χρήστης θα πει πότε ξεκινάμε.
Canonical repo: `C:\Users\steph\feedyourhealth-site` (git, origin = github.com/feedyourhealth/feedyourhealth.github.io, branch `main`, HEAD `0b4842b`)
Synced copy: `C:\Users\steph\OneDrive\Desktop\Dietologist_App\` (no .git) — μέσω `sync_dietologist.bat` (`xcopy /E` του html + `js/` + `css/`, οπότε νέοι υποφάκελοι `js/**` συγχρονίζονται αυτόματα)
Decoy — ΜΗΝ αγγίξεις: `C:\Users\steph\feedyourhealth.github.io\` (stale clone)

---

## 1. Τι υπάρχει σήμερα

`Dietologist.html` φορτώνει (γρ. 288–300), με τη σειρά:

| # | αρχείο | γραμμές | ρόλος |
|---|--------|--------:|-------|
| 1 | `js/data.js` | 3.639 | όλα τα static data (FOODS, PORTIONS, FOOD_UNITS, MET_ACTIVITIES, SUPPS, MICRONUTRIENTS, SPORT_PROTOCOLS, DEFAULT_TMPLS, MEAL_RECIPES, SNACK_RECIPES, MED_PLAN, FYH_*) |
| 2 | `js/app-part1.js` | 4.094 | helpers + state root (`clients`, `curId`, `getC`) + `save`/auto-save + tab-lock + backup/snapshots + micronutrient calc + `calcTDEE`/`calcMETkcal` + `scalePlan` + template normalisation + client sidebar render |
| 3 | `js/app-part2.js` | 5.484 | `renderMain` + dialogs + undo/redo wrappers + day-targets + MET UI + macros UI + insights + tracker/skinfold + appointments + exclusions + Mediterranean rules + `swTab` |
| 4 | `js/app-part3.js` | 4.213 | meal library harvest + combos + `findBestRecipe` + `generateSmartMeal` + `genPlan` + supplement recs + `renderWeekTable` + food-selector modal + saved-combos store + tips-library seed + auto-backup + publish modal |
| 5 | `js/app-part4.js` | 3.581 | `exportPDF` / `exportLipometriaPDF` / `exportBodyCompPDF` / `exportWord` / `exportGoogleDocs` + backup import/export + recipe/micro/supplement modals + red-meat frequency + tracking data + tracking dashboard + gap analysis |
| 6 | `js/app-part5-home.js` | 1.358 | tab Αρχική (`renderHome`) + tab Διατροφές (`renderDiets`) + `renderClients` + bulk group assign + tab Μηνύματα (`renderMessages`) |
| 7 | `js/app-part6-recipes.js` | 846 | tab Συνταγές: tags, scaler, νέα-συνταγή, swap panel |
| 8 | `js/app-part7-tips.js` | 289 | tab Tips |
| — | (CDN chart.js) | — | γρ. 297 |
| 9 | `js/11-undo-redo.js` | ~150 | `class UndoRedoManager` (guards με `typeof updateUndoRedoUI === 'function'`) |

Σύνολο ~18.650 γρ. JS.

### Γιατί ΔΕΝ πάμε σε ES modules
439 inline handler strings παράγονται μέσα σε JS (`onclick=` ×320, `onchange=` ×41, `oninput=` ×24, `onblur=` ×8) + 119 στο HTML. Όλες οι handler-συναρτήσεις **πρέπει να μείνουν global**. Άρα: concatenation-style split, ίδιος `<script>`-loading, καμία μετονομασία. (Phase 2, αργότερα & προαιρετικά: IIFE + ρητά `window.` exports ανά αρχείο.)

---

## 2. Load-time side effects — ΤΑ ΕΠΙΚΙΝΔΥΝΑ ΣΗΜΕΙΑ

Οι hoisted συναρτήσεις δεν νοιάζονται για σειρά. Νοιάζονται **μόνο** αυτά, που εκτελούνται στο parse:

| σημείο | αρχείο:γρ. | τι κάνει | κανόνας μετά το split |
|--------|-----------|----------|----------------------|
| `TMPLS = deepClone(DEFAULT_TMPLS)` | part1:2186 | διαβάζει `DEFAULT_TMPLS` από data.js | `data/templates.js` ΠΡΙΝ από όποιο αρχείο κρατήσει το `TMPLS` |
| `customTemplates=[]`, `TRACKING_DATA={…}`, `clients=[]`, `curId=null` | part1:2188/2191/2402 | state init | όλα μαζί σε `core/state.js`, φορτώνεται νωρίς |
| `_tabLockTick(); setInterval(_tabLockTick,…)` | part1:868–869 | ξεκινά το tab-lock heartbeat | οι top-level κλήσεις μένουν στο **τέλος** του `core/tab-lock.js`· το αρχείο φορτώνεται αφού υπάρχει `safeStorageGet` |
| `window.addEventListener('beforeunload'…)` ×2 | part1:781, 888 | flush save + release lock | μαζί με `core/save.js` / `core/tab-lock.js` |
| `document.addEventListener('DOMContentLoaded'…)` | part1:1086 | (να ελεγχθεί τι κάνει) | μένει στο ίδιο module με τον handler του |
| `window.addEventListener('orientationchange')`, `touchmove` | part1:2500, 2507 | mobile viewport | `core/mobile-viewport.js` ή μένει με τα MOBILE_VIEWPORT/TOUCH_HANDLERS |
| `window.addEventListener('load'…)` | part1:2710, part3:3572, part4:3412, part4:3543 | init hooks (auto-backup, gap-analysis wiring κ.λπ.) | κάθε `load` handler ταξιδεύει ΜΑΖΙ με τη feature του· ασφαλές γιατί τρέχει μετά το parse όλων |
| IIFE `(function(){…})()` | part4:2006 | (να ελεγχθεί — γύρω από `getStorageKey`/`cloudUsername`) | κρατιέται ακέραιο σε ένα module |
| `document.addEventListener('keydown')` ×2, `click` delegation | part2:161, 172, 5481 | shortcuts + global click (drag&drop, dropdown close) | με το αντίστοιχο feature module· η click-delegation στο part2:5481 → `core/global-click.js` (αγγίζει chip-dd, drag) |

**Άρα η νέα σειρά φόρτωσης = αυστηρά: `data/*` → `lib/*` → `core/*` → feature modules → `tabs/*` → `11-undo-redo.js`.**

---

## 3. Άλλα προαπαιτούμενα να επιβεβαιωθούν ΠΡΙΝ το wave 1

- [ ] `plan.html` (client portal): επιβεβαίωση ότι **δεν** φορτώνει κανένα `js/app-part*.js` / `js/data.js` (φαίνεται self-contained με δικό του I18N + snapshot builder). Αν φορτώνει, μπαίνει στο scope του split.
- [ ] `Dietologist.html`: υπάρχουν 5 inline `<script>` blocks (γρ. 9, 27, 514, 1979, 2737) + πολλά `DOMContentLoaded`. Να καταγραφεί ποιες global συναρτήσεις καλούν, ώστε να μη σπάσει η σειρά (π.χ. `renderMain()` στο 2307/2506, `Cloud.init`).
- [ ] Επιβεβαίωση ότι το `sync_dietologist.bat` `xcopy /E` όντως δημιουργεί τους νέους `js/data/`, `js/core/` κ.λπ. στο copy (θα πρέπει — `/E` = subdirs). Δοκιμαστικό run μετά το wave 1.
- [ ] Git checkpoint tag πριν αρχίσουμε: `git tag pre-module-split`.

---

## 4. Στρατηγική εκτέλεσης — WAVES (κάθε wave = 1+ commit, harness-verify, sync bat, ρώτα πριν push)

Όχι big-bang. Κάθε wave είναι ανεξάρτητα shippable και reversible με ένα `git revert`.

### Wave 0 — Safety net (καμία μετακίνηση κώδικα)
1. `git tag pre-module-split`
2. Φτιάξε `_dev/smoke.html`: φορτώνει όλα τα `js/*` (τρέχουσα σειρά) + fixture client JSON, τρέχει `genPlan`-path σε detached DOM, `exportPDF` σε stub, και κάνει `console.assert(typeof FN==='function')` για ~40 κρίσιμα ονόματα (λίστα §6). Αποθηκεύει baseline του παραγόμενου `weekPlan` (JSON) για diff.
3. Πρόσθεσε manifest-σχόλιο στο `Dietologist.html` πάνω από τα `<script>` (τεκμηρίωση της σειράς data→lib→core→features→tabs).

### Wave 1 — `data.js` → `js/data/*` (μηδέν συμπεριφορά, μόνο `var` blocks)
| νέο αρχείο | περιεχόμενο (από data.js) |
|-----------|--------------------------|
| `data/foods.js` | `FOODS`, `FOOD_PAIRING_DB`, `FOOD_PAIRING_EXT`, `SAUCE_DB`, `HERB_FOOD_MAP`, `FOOD_ALIASES` |
| `data/portions.js` | `PORTIONS`, `FOOD_UNITS`, `WHOLE_UNIT_FOODS`, `UNIT_PLURALS`, `COOKED_TO_RAW`, `SCALE_CATS`, `BREAKFAST_FOODS`, `QUICK_EXCL`, `SUBST_ORDER` |
| `data/recipes.js` | `MEAL_RECIPES`, `SNACK_RECIPES`, `FYH_COMPLETE_MEAL`, `FYH_RECIPE_EXPAND`, `FYH_DEFAULT_MAIN`, `FYH_SNACK_NAMES`, `PETRETZEAKIS_EGG_RECIPES`, `PETRETZEAKIS_YOGURT_RECIPES`, `FX` |
| `data/supplements.js` | `SUPPS`, `SUPP_TIMINGS`, `EN_SUPP_TIMINGS` |
| `data/micronutrients.js` | `MICRONUTRIENTS`, `NUTRIENT_UNITS` |
| `data/protocols.js` | `SPORT_PROTOCOLS`, `SPORT_PROFILES`, `MEAL_TIMING_PROFILES`, `MACRO_PRESETS`, `DEFAULT_MACRO_PRESET_BY_GOAL` |
| `data/templates.js` | `DEFAULT_TMPLS` |
| `data/met-activities.js` | `MET_ACTIVITIES` |
| `data/med-diet.js` | `MED_PLAN`, `MED_GRAIN_SWAP`, `MED_SNACK_FRUITS/NUTS`, `MED_BRK_FRUITS`, `PROT_CATS`, `GRAIN_CATS`, `FRUIT_CAT`, `NUTS_CATS`, `LEGUME_FOODS_LST`, `OTHER_STARCHES`, `DAIRY_FOODS`, `WHITE_PROTEINS`, `VEGETABLES_NEEDING_FAT`, `EGG_DAYS`, `isLegumeFood()` |
| `data/misc.js` | `MACRO_TYPE`, `GOAL_LABELS`, `GOAL_KEYS`, `DIET_TYPE_BADGE`, `GREEK_MONTHS`, `FREE_MEAL_MARKER` |

`<script>`: αντικατέστησε τη 1 γραμμή `data.js` με 10 γραμμές `data/*.js` (σειρά: foods, portions, recipes, supplements, micronutrients, protocols, templates, met-activities, med-diet, misc). Commit. Harness: assert όλα τα constants ορισμένα, `genPlan` baseline diff = καθαρό.

### Wave 2 — `lib/*` (pure leaf helpers, από app-part1)
`lib/format.js` (`esc`, `escJsAttr`, `snapWholeG`, `pluralUnit`, `fmtFoodQty`, `DAYS`, `normalizeGreekText`) · `lib/phone.js` (`normalizePhoneIntl`) · `lib/gauges.js` (`pctRing`, `pctStatusColor`, `bfGaugeHtml`, `clientGoalWeightPct`) · `lib/pregnancy.js` (`getPregTrimester*`, `getIOMWeightGainRange`, `checkGestationalWeightGain`) · `lib/micronutrient-calc.js` (`getMicronutrientTargets`, `getDayMicronutrients`, `getWeekMicronutrients`, `detectMicronutrientGaps`, `checkMicronutrientAdequacy`, `MICRONUTRIENT_KEY_MAP`, `getFiberTarget`) · `lib/supplement-match.js` (`matchSupplementsToGaps`, `calculateOptimalDose`, `flagSupplementInteractions`) · `lib/food-resolve.js` (`resolveFood`, `cm`, `getFoodColorHex`).

### Wave 3 — `calc/*` (μεγαλύτερα αλλά pure, από app-part1)
`calc/tdee.js` (`calcTDEE` — 270 γρ., κεντρικό) · `calc/met.js` (`calcMETkcal`) · `calc/scale-plan.js` (`minScaleG`, `scaledG`, `clampRatio`, `scalePlan`, `reconcileMealCaloriesAfterRemoval`, `SCALE_RATIO_*`) · `calc/validation.js` (`VALIDATION_RULES`, `validateAllCalculations`, `logValidation`, `FIELD_VALIDATION_RULES`, `VALIDATION_MESSAGES_GR`, `validateClientData`).

### Wave 4 — `core/*` (state + persistence, από app-part1) — ΠΡΟΣΟΧΗ top-level exec
`core/storage.js` (`deepClone`, `safeStorageGet`, `safeStorageSet`) · `core/save.js` (`_saveTimer`, `_doSave`, `save`, `saveNow`, `beforeunload` flush) · `core/tab-lock.js` (ΟΛΟ το tab-lock block **με** τις top-level `_tabLockTick()` + `setInterval` στο τέλος) · `core/backup.js` (`_buildBackupObj`, snapshots, IndexedDB folder, `restoreFromSnapshot`, `recoverSavedPlansFor`, `startAutoSaveInterval`/`stop`, `_portalPollInterval`, `exportData`) · `core/state.js` (`clients`, `curId`, `currentDD`, `getC`, `addClient`, `deleteClient`, `archiveClient`/`unarchive`, `selectClient`, `restoreClient`, `permanentlyDeleteClient`, `JSON_CACHE`) · `core/recalc.js` (`onClientChange`, `recalculateMacros`, `updateMealTimingGuide`, `shouldRegeneratePlan`, `showPlanRegenerationPrompt`, `showAutoRecalculationNotification`, `_recalc*`) · `core/templates.js` (`TMPLS = deepClone(DEFAULT_TMPLS)` — μετά το data/templates.js —, `customTemplates`, `normalizeWholeTmpls`, `trimTemplateAddedFat`, `boostPlantTemplateProtein`).

### Wave 5 — `client-list/*` (από app-part1 tail + app-part5)
`renderSB`, `clientCardHtml`, `clientRowHtml`, `clientTableHtml`, φίλτρα/sort/view (`_clientSearchTerm` … `setClientQuickFilter`), group names, `clientNeedsAttention` & co, `progressBadge`, `initials` · + από part5: `renderClients`, bulk group assign (`toggleClientBulkMode`, `applyBulkGroupAssign`, `_applyGroupToSelected`), `SPORT_INFO`.

### Wave 6 — `reports/*` (από app-part4, self-contained)
`reports/pdf-plan.js` (`exportPDF`, `shopRound`, `shopDisp`) · `reports/pdf-lipometria.js` (`exportLipometriaPDF`, `escRtf`) · `reports/pdf-bodycomp.js` (`exportBodyCompPDF`, `sendBodyCompReport`) · `reports/word.js` (`exportWord`) · `reports/gdocs.js` (`exportGoogleDocs`) · `reports/backup-io.js` (`exportBackup`, `exportClientsJSON`, `importClientsJSON`, `importBackup`) · `reports/debug.js` (`showDebugPanel`, `showReferences`).

### Wave 7 — `tracking/*` (από app-part4)
`tracking/data.js` (`loadTrackingData`, `saveTrackingData`, `ensureRecipeTrackingEntry`, `getMealDisplayName`, `logPlanGeneration`, `logRegenerate`, IIFE @2006 + `getStorageKey`/`cloudUsername`) · `tracking/ratings.js` (`rateMeal`, `getMealRatingStats`, `calculateRecipeStats`, `getRecipeTrustScore` dup-check με part3) · `tracking/alternatives.js` (`generateDiverseAlternatives`, `showMealAlternatives`, `closeAltModal`, `replaceMeal`) · `tracking/dashboard.js` (`showTrackingDashboard`, `analyzePatterns`, `closeTrackingDashboard`, `load` hooks @3412/3543) · `tracking/gap-analysis.js` (`openGapAnalysisModal`, `buildGapAnalysisHTML`, `closeGapAnalysisModal`).

### Wave 8 — `plan-gen/*` (από app-part3 — ο πυρήνας, πιο προσεκτικό wave)
`plan-gen/meal-library.js` (`harvestMealLibrary`, `harvestOwnHistory`, `mealSignature`, `classifyMealSlot`, `findMealAlternates`) · `plan-gen/combos.js` (`findSavedComboMatch`, saved-combos store: `getSavedCombos`/`set`, `migrateLegacyPerClientCombos`, `mergeSavedComboLists`, `comboDietOK`, `comboHasExcludedFood`, `_savedCombosCache`) · `plan-gen/recipe-finder.js` (`findBestRecipe`, `calculateTrustScore`, `getRecipeTrustScore`) · `plan-gen/smart-meal.js` (`generateSmartMeal`, `calculateMealKcal`) · `plan-gen/med-score.js` (`calcMedScore`, `renderMedScore`, `MED_SCORE_RULES`, `FISH_FOODS`, `RED_MEAT_FOODS`, `LEGUME_FOODS`, `REFINED_GRAINS`) · `plan-gen/food-distribution.js` (`countFoodFrequency`, `validateFoodDistribution`, `displayFoodDistributionResults`, `NUTRITION_CONSTRAINTS`, `FOOD_CATEGORIES`) · `plan-gen/cleanup.js` (`normalizeBreakfasts`, `removeOatsFromMainMeals`, `reorderMealsToStandardSequence`, `applyPostGenerationCleanup`, `buildClientExclusionList`) · `plan-gen/gen-plan.js` (`genPlan`, `genPlanWithUndo`, `_genPlanWithUndoProceed`, `pregnancyBlockCheck`, `calorieConsistencyCheck`, `cloneAndScaleClientPlan`, `getSupplementRecommendations`) · `plan-gen/week-table.js` (`renderWeekTable`, `regenerateDay`, `mealSourceBadge`, `insertPlanItemIntoCell`, `updG`/`addF`/`delF`, active-meal-target, day/meal menus, copy/swap day, `enableMealDragDrop` + `_mealDrag*`, `showPortions`/`pickServing`, `expandRecipeInPlan`, favorites, `saveCombo`/`deleteCombo`, `balanceMacros`, `initializeMealTiming`, `getMicronutrientHtml`, `renderFoodLib`) · `plan-gen/food-selector.js` (`openFoodSelectorModal`, `updateFoodSelector`, `showFoodQuantityInput`/`hide`/`confirm`, `_foodSelector*`, recipe-in-selector: `updateRecipeSelectorForPlan`, `confirmAddRecipeToMeal`, `insertRecipeFoodsIntoMeal`, `removeDishLabel`) · `plan-gen/publish-modal.js` (`openPublishModal`, `publishHandoffMsg`, `PUBLISH_MSG_DICTS`, `EN_/RU_/TR_MEAL_NAMES`, `EN_/RU_/TR_UNITS`, `EN_/RU_/TR_CAT_NAMES`, copy buttons) · `plan-gen/tips-store.js` (`getTipsLibrary`/`set`, `defaultTipsSeed`, `_tipsLibraryCache`) · `plan-gen/auto-backup.js` (`autoBackupClients`, `initAutoBackup`, `load` hook @3572) · `misc: dietoToast`, `toggleMealTemplate`.

### Wave 9 — `client-editor/*` (από app-part2 — μεγάλο, σπάει σε πολλά)
`client-editor/render-main.js` (`renderMain`, `swTab`, `TAB_APPOINTMENTS`, `upd`, `setupFormEventListeners`, `updateDayTargetTable`, `setActivityFactor`, `setGoalCalories`, `applyGoalMacros`, `commitBirthdate`, `updateAgeDisplay`, section collapse `getSecState`/`toggleSec`/`toggleFoodLib`, error-scroll `SEC_FOR_ERROR`/`FIELD_ID_FOR_ERROR`) · `client-editor/day-targets.js` (`makeDayTgtDefaults`, `getDayTgtEff`, `allocateMealTargets`, `getMealTimingGuide`, `buildDayTgtHtml`, `daysUntilEvent`, `getCarbLoadDayIndexes`, `resetDayTargets`, `setDayMacro`/`setTrainDay`/`setTrainHours`/`setTrainTime`/`setCarbBoost`/`setEventDate`) · `client-editor/met-ui.js` (`buildMetHtml`, `metCatChange`, `toggleMetDay`, `addMetActivity`, `removeMetActivity`, `updateConditionalVisibility`, `updateActivityFromSport`, `toggleSportSupplement`) · `client-editor/macros-ui.js` (`buildMacroDistributionHtml`, `setDietType`, `setMacroPreset`, `setMacroCustom`, `CREATINE_SUGGESTED_SPORTS`) · `client-editor/insights.js` (`buildInsightsPanelHtml`, `buildClientProgressHtml`, `buildTrackerHtml` + skinfold: `calcSkinfoldBF`, `toggleSkinfoldPanel`, `updateSkinfold*`, `applySkinfoldBF`, `getSkinfoldEntry`, `migrateClientSkinfoldBF`, `ageAtDate`, ergo CSV import, `initTrendCharts`, weight/consult entries) · `client-editor/matchday.js` (`isMatchDate`, `setMatchDay`, `setMatchTimeBucket`) · `client-editor/blood-test.js` (`BLOOD_TEST_STATUS_DEFS`, `cycleBloodTestStatus`, `QUICK_PRESETS`, `applyClientPreset`).

### Wave 10 — `exclusions/*` (από app-part2 tail)
`parseAllergies`, `isFoodAllergy`, `foodIsExcludedByNameOrIngredient`, `applyFoodExclusions`, `buildEffectiveExclusionList`, `scrubExcludedFoodsFromWeekPlan`, `parsePreferenceAvoidFoods` + `PREF_*` maps, `buildExcludeHtml`, `renderExclWrap`, `toggleFoodExclude`, `applyQuickExclude`, `addFoodExclude`, `clearAllExcludes`, `showExclSug`, `refilterMealPlanExclusions`, `applyDietTypeCategorySafetyNet`, `DIET_TYPE_FORBIDDEN_CATS`, `dairyFoodsList`, `DAIRY_NOT_ACTUAL_DAIRY`.

### Wave 11 — `mediterranean/*` (από app-part2 tail — αυτοτελές block γρ. 4989–5477)
`expandFYHRecipes`, `removeFYHFromMainMeals`, `ensureSaladAndOil`, `applyMediterraneanRules`, `preferWholeGrains`, `cleanFYHMeals`, `addPotatoToFishMeals`, `standardizeMediterraneanSnacks`, `avoidLegumeStarchCombos`, `avoidDairyWithLegumes`, `avoidTanninsWithLegumes`, `ensureOilWithVegetables`, `avoidOxalateWithDairy`, `ensureOmega3FishIntake`, `PETRETZEAKIS_OATS_RECIPES`, `HIGH_/LOW_OXALATE*`, `OMEGA3_FISH` · + `togglePlanExportMenu`/`closePlanExportMenu`.

### Wave 12 — `portal-comms/*` (από app-part2 + app-part5)
από part2: `noteReply*`/`isNoteReplied`/`markNoteReplied`/`replyToClientNote`, `pfReply*`/`replyToPlanFeedback`, `note/pfSeen*`, `clientLogsPanelHtml`, `planFeedbackPanelHtml`, `pfStarsReadonly`, `PF_ROW_LABELS`, `dislikedRecipesPanelHtml`/`restoreDislikedRecipe`, `CLIENT_LOG_TAG_DEFS` · από part5: `sendFeedbackReminder`, `buildWeeklyRecapText`, `weeklyWeightDeltaText`, `sendWeeklyRecap`, `sendActivityNudge`, `isFeedbackReminderWindow`.

### Wave 13 — `appointments/*` (από app-part2, block γρ. 2860–3800)
όλα τα `appt*` (chips, templates, food-prefs bridge, plan-actions, sparkline, correlation chart, digest, `buildAppointmentsHtml`, absence log, entry CRUD, `setNextAppointmentDate`, `resolveAppointmentFlag`) + `APPT_*` consts + `today_appt_iso`, `fmtDateShortAppt`, `fmtRelativeSince`, `clientAgeDays`, `reminderMetaHtml`.

### Wave 14 — `tabs/*` (από app-part5/6/7 — ήδη σχεδόν αυτοτελή)
`tabs/home.js` (part5 γρ. 1–520: `renderHome` + όλα τα `home*` + attention buckets + `NAME_DAYS` → δικό του `data/namedays.js` + `homeUpcomingBirthdays`/`NameDays`, `updateHomeNavBadge`) · `tabs/diets.js` (part5 γρ. 819–945: `renderDiets` + `diets*` + `PLAN_RENEWAL_DAYS`) · `tabs/messages.js` (part5 γρ. 1096–end: `renderMessages` + `msg*` + `collectAllClientMessages` + `updateMessagesNavBadge`) · `tabs/recipes.js` (= app-part6 ολόκληρο) · `tabs/tips.js` (= app-part7 ολόκληρο).

### Wave 15 (προαιρετικό, ξεχωριστή απόφαση) — Phase 2: scope isolation
Ανά αρχείο, τύλιξε σε `(function(){ … ; window.foo=foo; })()` εκθέτοντας ρητά μόνο ό,τι καλείται από HTML/handlers/άλλα modules. Ένα αρχείο τη φορά, harness μετά από κάθε ένα.

### Wave 16 (ξεχωριστό project) — bundler
esbuild: 1 config, `js/**/*.js` → `dist/app.js` (IIFE bundle, source map). `Dietologist.html` → 1 `<script src="dist/app.js">`. GitHub Pages serve το `dist/`. Δεν αλλάζει το deploy (git push). Κερδίζει: 1 request αντί ~70, καλύτερο caching, build-time syntax check.

---

## 5. Verification ανά wave (χωρίς login διαθέσιμο)

Για ΚΑΘΕ wave, με τη σειρά:
1. **grep-sanity**: κάθε symbol που αφαιρέθηκε από παλιό αρχείο → ορίζεται ακριβώς 1× σε νέο αρχείο· το παλιό αρχείο δεν το ξαναδηλώνει.
2. **`_dev/smoke.html`**: φορτώνει τα `js/**` με τη ΝΕΑ σειρά· asserts:
   - `typeof FN === 'function'` για τη λίστα §6
   - όλα τα κρίσιμα consts `!== undefined` (`FOODS`, `PORTIONS`, `FOOD_UNITS`, `MET_ACTIVITIES`, `SUPPS`, `MICRONUTRIENTS`, `DEFAULT_TMPLS`, `MEAL_RECIPES`, `TMPLS`)
   - `genPlan`-path σε fixture client → σύγκριση παραγόμενου `weekPlan` με baseline (deep-equal). Οποιοδήποτε diff = investigate.
   - `exportPDF('el')` δεν πετάει (jsPDF/CDN stub ή πραγματικό)
3. **browser smoke** στο `Dietologist.html` μέσω preview tools: `read_console_messages` για errors, `read_page` ότι φορτώνει το login, (αν υπάρχει test λογαριασμός) `swTab` σε κάθε tab.
4. `git commit` (μήνυμα: `Module split (wave N): <περιγραφή>`).
5. Τρέξε `sync_dietologist.bat` (ή manual xcopy) → επιβεβαίωσε ότι το `Dietologist_App/js/**` πήρε τους νέους υποφακέλους.
6. **Ρώτα τον χρήστη πριν `git push origin main`.**

Rollback ανά wave: `git revert <commit>` + ξανα-sync. Τα δεδομένα πελατών (Supabase `user_data` blob + localStorage) δεν αγγίζονται ποτέ.

---

## 6. Κρίσιμα global ονόματα για το harness assert (μη εξαντλητικό)
`esc`, `fmtFoodQty`, `deepClone`, `safeStorageGet`, `safeStorageSet`, `save`, `saveNow`, `getC`, `calcTDEE`, `calcMETkcal`, `scalePlan`, `minScaleG`, `resolveFood`, `getMicronutrientTargets`, `detectMicronutrientGaps`, `renderMain`, `swTab`, `renderSB`, `renderWeekTable`, `genPlan`, `genPlanWithUndo`, `generateSmartMeal`, `findBestRecipe`, `harvestMealLibrary`, `getSavedCombos`, `buildEffectiveExclusionList`, `applyMediterraneanRules`, `exportPDF`, `exportWord`, `exportLipometriaPDF`, `exportBodyCompPDF`, `openPublishModal`, `renderHome`, `renderDiets`, `renderClients`, `renderMessages`, `renderRecipes`, `renderTips`, `openFoodSelectorModal`, `showMealAlternatives`, `openGapAnalysisModal`, `loadTrackingData`, `rateMeal`, `initializeApp`, `checkAppStart`(;- αν υπάρχει), `onClientChange`, `recalculateMacros`.

---

## 7. Ανοιχτά ερωτήματα πριν το wave 1
- Θέλει ο χρήστης χωριστό `docs/module-split-plan.md` μέσα στο repo (committed) ή μένει εκτός;
- Υπάρχει test λογαριασμός Supabase για browser-smoke, ή μόνο harness;
- Ξεκινάμε ταυτόχρονα το retire του decoy `feedyourhealth.github.io` clone, ή αργότερα;
- OK να προστεθεί φάκελος `_dev/` στο repo (harness) ή να μείνει στο scratchpad;
