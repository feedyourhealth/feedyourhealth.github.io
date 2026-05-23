# 🔬 ΑΚΡΙΒΕΙΑ ΘΕΡΜΙΔΩΝ & ΜΑΚΡΟΘΡΕΠΤΙΚΩΝ - ΛΕΠΤΟΜΕΡΗΣ ΔΟΚΙΜΗ

## ΣΕΝΑΡΙΟ ΔΟΚΙΜΗΣ #1: Γυναίκα Ενεργή (Activity Factor Case)

### Input Data:
```
Name: Maria
Sex: Female
Age: 32
Weight: 65 kg
Height: 168 cm
Body Fat: 22%
Activity: Active (1.725)
Goal: Loss
Training Days: 5 days/week (Δ,Τ,Τ,Π,Π)
Training Hours/Day: 1 hour
Macro Preset: Loss (35/30/35)
No MET activities (activity factor only)
```

---

## STEP 1: BMR Calculation (Mifflin-St Jeor)
**Formula**: BMR = 10W + 6.25H - 5A - 161 (Female)
```
BMR = 10(65) + 6.25(168) - 5(32) - 161
BMR = 650 + 1050 - 160 - 161
BMR = 1379 kcal
```
✓ Expected: ~1379 kcal

---

## STEP 2: NEAT Calculation
**Formula**: NEAT = BMR × 1.2
```
NEAT = 1379 × 1.2 = 1654.8 → 1655 kcal
```
✓ Expected: ~1655 kcal

---

## STEP 3: Exercise Energy Estimation
**Formula**: Exercise = (Activity Factor - 1.2) × BMR
```
Exercise = (1.725 - 1.2) × 1379
Exercise = 0.525 × 1379 = 723.975 → 724 kcal
```
✓ Expected: ~724 kcal

---

## STEP 4: TDEE Calculation
**Formula**: TDEE = NEAT + Exercise
```
TDEE = 1655 + 724 = 2379 kcal
```
✓ Expected: ~2379 kcal

---

## STEP 5: Goal Delta Application
**Goal**: Loss → -500 kcal
```
Target = 2379 - 500 = 1879 kcal
```
✓ Expected: ~1879 kcal

---

## STEP 6: MACROS (35/30/35 split)
**Formula for each macro**:
- Protein: target × 35% / 4
- Fat: target × 30% / 9
- Carbs: (target - protG×4 - fatG×9) / 4

### Calculation:
```
Protein: 1879 × 0.35 / 4 = 164.425 → 164g (656 kcal)
Fat: 1879 × 0.30 / 9 = 62.633 → 63g (567 kcal)
Carbs: (1879 - 164×4 - 63×9) / 4 = (1879 - 656 - 567) / 4 = 656/4 = 164g (656 kcal)
```

### Verification:
```
164×4 + 63×9 + 164×4 = 656 + 567 + 656 = 1879 kcal ✓ EXACT MATCH
```

✓ **MACROS**: P=164g, F=63g, C=164g, Total=1879 kcal

---

## STEP 7: Energy Availability (EA)
**Formula**: EA = (Target - Exercise) / LBM
```
LBM = 65 × (1 - 0.22) = 65 × 0.78 = 50.7 kg
EA = (1879 - 724) / 50.7 = 1155 / 50.7 = 22.78 kcal/kgLBM
```
⚠️ **ΚΙΝΔΥΝΟΣ**: < 30 kcal/kgLBM → RED-S!

✓ **EA**: 22.78 kcal/kgLBM 🔴 RED-S Warning

---

## STEP 8: Per-Protein-gram Check
**Formula**: Protein/kg body weight
```
164g / 65kg = 2.52 g/kg ✓ (Safe, 1.6-2.2g/kg recommended)
```

---

## 📊 EXPECTED OUTPUT IN UI

```
┌─ ΘΕΡΜΙΔΕΣ & ΜΑΚΡΟΘΡΕΠΤΙΚΑ ──────────────────┐
│                                              │
│ TDEE:        2379 kcal                       │
│ Target:      1879 kcal (Loss -500)           │
│                                              │
│ Πρωτείνη:    164g  (35%)  ✓                  │
│ Λίπος:       63g   (30%)  ✓                  │
│ Υδατάνθρακες: 164g  (35%)  ✓                  │
│                                              │
│ 🔴 EA: 22.78 kcal/kgLBM — RED-S ΚΙΝΔΥΝΟΣ    │
│    Αύξησε θερμίδες ή μείωσε άσκηση           │
│                                              │
│ Πρωτεΐνη/kg: 2.52g/kg ✓ (Ασφαλές)           │
│                                              │
└──────────────────────────────────────────────┘
```

---

## ✅ ΕΛΕΓΧΟΣ ΛΙΣΤΑ

- [ ] BMR υπολογίζεται σωστά (Mifflin-St Jeor)
- [ ] NEAT = BMR × 1.2 (explicitly shown)
- [ ] Exercise = (factor - 1.2) × BMR
- [ ] TDEE = NEAT + Exercise (ή activity factor × BMR)
- [ ] Goal delta προσαρμόζεται σωστά (-250, -500, 0, +300)
- [ ] Macros σε σωστά ποσοστά (άθροισμα = 100%)
- [ ] Carbs υπολογίζονται ως ΔΙΑΦΟΡΑ (όχι ανεξάρτητα)
- [ ] Macro kcal = Exact Target (καμία πλεονάζουσα)
- [ ] EA υπολογίζεται σωστά με exercise kcal
- [ ] EA προειδοποίηση εμφανίζεται αν < 30
- [ ] Protein/kg υπολογίζεται (164g / 65kg)
- [ ] Όλα τα νούμερα εμφανίζονται χωρίς rounding errors

---

## ΣΕΝΑΡΙΟ #2: Άνδρας Αθλητής (MET Case) 

### Input:
```
Name: John
Sex: Male
Age: 28
Weight: 82 kg
Height: 180 cm
LBM: 75 kg
Formula: Cunningham
Goal: Maintain
MET Activities:
  - Weight Training: MET=5, 60 min, Days: 0,2,4,6 (4x/week)
  - Running: MET=9, 30 min, Days: 1,3,5 (3x/week)
Macro Preset: Strength (30/25/45)
```

### Expected Calculations:

**BMR (Cunningham)**:
```
BMR = 500 + 22 × 75 = 500 + 1650 = 2150 kcal
```

**Exercise (MET-based)**:
```
Weight Training session: 5 × 3.5 × 82 / 200 × 60 = 428.5 kcal
4 sessions/week = 1714 kcal/week

Running session: 9 × 3.5 × 82 / 200 × 30 = 385.65 kcal
3 sessions/week = 1156.95 kcal/week

Total Exercise: (1714 + 1156.95) / 7 = 411.6 kcal/day
```

**TDEE**:
```
NEAT = 2150 × 1.2 = 2580 kcal
TDEE = 2580 + 411.6 = 2991.6 → 2992 kcal
```

**Target** (Maintain):
```
Target = 2992 + 0 = 2992 kcal
```

**Macros (30/25/45)**:
```
Protein: 2992 × 0.30 / 4 = 224.4 → 224g (896 kcal)
Fat: 2992 × 0.25 / 9 = 83.1 → 83g (747 kcal)
Carbs: (2992 - 224×4 - 83×9) / 4 = (2992 - 896 - 747) / 4 = 1349/4 = 337.25 → 337g (1348 kcal)

Verification: 896 + 747 + 1348 = 2991 kcal ✓ (1 kcal difference OK)
```

**EA**:
```
EA = (2992 - 411.6) / 75 = 2580.4 / 75 = 34.4 kcal/kgLBM ✓ (Safe)
```

---

## 🎯 CRITICAL VALIDATION POINTS

### Point 1: Macro Sum Exactness
- [ ] P×4 + F×9 + C×4 = Target kcal (max 1 kcal deviation)
- [ ] No rounding into surplus

### Point 2: EA for ALL Cases
- [ ] Activity factor: Exercise estimated correctly
- [ ] MET-based: Exercise from actual MET calculation
- [ ] Both: EA shown, RED-S warning if < 30

### Point 3: Display Consistency
- [ ] Stats shown in UI match calcTDEE return object
- [ ] No secondary calculations that might differ
- [ ] Decimals handled correctly (0-1 rounding variance acceptable)

### Point 4: Goal Application
- [ ] Mild: -250 applied to all targets
- [ ] Loss: -500 applied to all targets
- [ ] Maintain: 0 applied
- [ ] Gain: +300 applied
- [ ] Per-day targets correct (restTarget, trainTarget)

---

## 📋 TESTS TO RUN IN UI

### Test 1: Create Maria (Activity Factor)
1. Create client with exact data above
2. Check TDEE display: 2379 kcal
3. Check Target display: 1879 kcal
4. Check Macros: P=164g, F=63g, C=164g
5. Check EA warning: Red box with 22.78 kcal/kgLBM
6. Edit carb boost: Set to 0%, verify it stays 0% (not reverting to 20%)

### Test 2: Create John (MET-based)
1. Create client with exact data above
2. Add MET activities as specified
3. Check TDEE: ~2992 kcal
4. Check Macros: P=224g, F=83g, C=337g
5. Check EA: 34.4 kcal/kgLBM (safe, no warning)
6. Verify day targets (rest vs train days)

### Test 3: Goal Changes
1. Start with Maria at Loss (-500)
2. Change goal to Maintain: Target should be 2379
3. Change to Gain (+300): Target should be 2679
4. Verify macros recalculate exactly each time

### Test 4: Macro Preset Changes
1. Maria with Loss (35/30/35): P=164, F=63, C=164
2. Switch to Balanced (25/25/50): 
   - P: 1879×0.25/4 = 117g
   - F: 1879×0.25/9 = 52g
   - C: (1879-117×4-52×9)/4 = 211g
   - Verify exact sum
3. Switch to Keto (25/60/15):
   - P: 117g
   - F: 1879×0.60/9 = 125g
   - C: (1879-117×4-125×9)/4 = 50g
   - Verify exact sum

### Test 5: Weight/BF Changes
1. Maria: Change weight 65→70kg
2. Verify LBM recalculates: 70×0.78 = 54.6kg
3. Verify EA recalculates (should improve)
4. Verify TDEE changes proportionally

---

## 🚨 RED FLAGS TO CHECK

⚠️ **If any of these happen, there's a bug:**

1. Macro sum > Target by >2 kcal
2. Carbs show as negative
3. EA calculated but displays null
4. Goal change doesn't update all targets
5. Macro preset change doesn't recalculate macros
6. Carb boost=0% reverts to 20% on render
7. Red-S warning appears when EA > 35
8. Red-S warning doesn't appear when EA < 25
9. LBM calculation wrong (should use BF%)
10. Per-protein-gram shows as negative or >3.5g/kg

