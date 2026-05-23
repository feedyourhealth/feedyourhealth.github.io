# 🔬 DIETOLOGIST CALCULATIONS AUDIT

## Σενάριο Test #1: Γυναίκα, Χωρίς MET Activities, Ήπια Απώλεια Βάρους

### Input Data:
- Sex: Female
- Age: 30
- Weight: 70 kg
- Height: 165 cm
- Body Fat: 25%
- LBM: 70 × (1 - 0.25) = 52.5 kg
- Activity: Moderate (1.55)
- Goal: Mild loss (-250 kcal)
- Training Days: 4 days/week
- Training Hours: 1 hour/day
- Formula: Mifflin-St Jeor
- No MET activities

### Step 1: BMR Calculation (Mifflin-St Jeor)
Formula: BMR = 10×W + 6.25×H - 5×Age - 161 (Female)
- BMR = 10(70) + 6.25(165) - 5(30) - 161
- BMR = 700 + 1031.25 - 150 - 161
- **BMR = 1420.25 → 1420 kcal**

### Step 2: TDEE Calculation (Activity Factor Method)
Formula: TDEE = BMR × Activity Factor
- Activity Factor (Moderate) = 1.55
- TDEE = 1420 × 1.55
- **TDEE = 2201 kcal**

### Step 3: Target Calories (with goal delta)
Formula: Target = TDEE + Goal Delta
- Goal Delta (mild loss) = -250 kcal
- Target = 2201 - 250
- **Target = 1951 kcal**

### Step 4: Macro Calculations (25/25/50 split)
- Protein: 25% = 1951 × 0.25 / 4 = 121.9 → 122g
- Fat: 25% = 1951 × 0.25 / 9 = 54.2 → 54g
- Carbs (as difference): (1951 - 122×4 - 54×9) / 4 = (1951 - 488 - 486) / 4 = 977/4 = 244.25 → 244g

**Verification**: 122×4 + 54×9 + 244×4 = 488 + 486 + 976 = **1950 kcal ✓**

### Step 5: Exercise Energy Calculation (WITHOUT MET)
**PROBLEM**: Δεν υπάρχει τρόπος να υπολογιστεί η άσκηση χωρίς MET!
- trainDays = 4 days
- trainHours = 1 hour/day
- Activity factor είδη συμπεριλήφθηκε στο TDEE (1.55)
- Αλλά πόσα kcal σημαίνει αυτό;

Εστιμώντας από activity factor:
- NEAT (20% πάνω BMR) = 1420 × 1.2 = 1704 kcal
- Exercise = TDEE - NEAT = 2201 - 1704 = **497 kcal/day**

### Step 6: Energy Availability (EA) Calculation
Formula: EA = (Intake - Exercise) / LBM

**PROBLEM**: Το exercise δεν υπολογίζεται σωστά χωρίς MET!

Αν υποθέσουμε exercise = 497 kcal/day:
- EA = (1951 - 497) / 52.5 = 1454 / 52.5 = **27.7 kcal/kgLBM 🔴 RED-S!**

---

## Σενάριο Test #2: Άνδρας Αθλητής, ΜΕ MET Activities, Maintain Goal

### Input Data:
- Sex: Male
- Age: 28
- Weight: 80 kg
- Height: 180 cm
- LBM: 75 kg (known)
- Formula: Cunningham (more accurate for athletes)
- MET Activities: 
  - Boxing: MET=12.8, 45 min, 3 days/week
  - Running: MET=10, 30 min, 2 days/week
- Goal: Maintain (0 kcal delta)

### Step 1: BMR Calculation (Cunningham)
Formula: BMR = 500 + 22 × LBM
- BMR = 500 + 22 × 75
- **BMR = 1650 kcal**

### Step 2: Exercise Energy (MET-based)
Formula: kcal/session = MET × 3.5 × Weight(kg) / 200 × Duration(min)

**Boxing session**:
- kcal = 12.8 × 3.5 × 80 / 200 × 45
- kcal = 12.8 × 3.5 × 0.4 × 45
- kcal = 12.8 × 63 = **806.4 kcal/session**
- 3 sessions/week = 2419.2 kcal/week

**Running session**:
- kcal = 10 × 3.5 × 80 / 200 × 30
- kcal = 10 × 3.5 × 0.4 × 30
- kcal = 10 × 42 = **420 kcal/session**
- 2 sessions/week = 840 kcal/week

**Total Exercise**: 2419.2 + 840 = 3259.2 kcal/week
**Daily Average**: 3259.2 / 7 = **465.6 kcal/day**

### Step 3: TDEE Calculation (MET-based)
Formula: TDEE = BMR × 1.2 (NEAT) + Daily Exercise
- TDEE = 1650 × 1.2 + 465.6
- TDEE = 1980 + 465.6
- **TDEE = 2445.6 → 2446 kcal**

### Step 4: Target Calories
Formula: Target = TDEE + Goal Delta
- Goal Delta (maintain) = 0
- **Target = 2446 kcal**

### Step 5: Macro Calculations (30/25/45 split - Strength)
- Protein: 30% = 2446 × 0.30 / 4 = 183.45 → 183g
- Fat: 25% = 2446 × 0.25 / 9 = 67.9 → 68g
- Carbs (as difference): (2446 - 183×4 - 68×9) / 4 = (2446 - 732 - 612) / 4 = 1102/4 = 275.5 → 276g

**Verification**: 183×4 + 68×9 + 276×4 = 732 + 612 + 1104 = **2448 kcal ✓** (2 kcal rounding ok)

### Step 6: Energy Availability (EA) Calculation
Formula: EA = (Intake - Exercise) / LBM
- EA = (2446 - 465.6) / 75 = 1980.4 / 75 = **26.4 kcal/kgLBM 🔴 RED-S!**

**BUT WAIT**: Αυτό είναι λάθος! Ο άνδρας δεν έχει RED-S γιατί:
1. Έχει πολλές θερμίδες
2. Δεν κάνει "cutting"

**PROBLEM IDENTIFIED**: Η EA formula είναι λανθασμένη ή χρησιμοποιείται λάθος!

---

## 🔍 Ανακαλύφθησαν Προβλήματα

### 1️⃣ ΚΡΙΤΙΚΟ: EA Calculation Without MET Activities
- **Problem**: Αν δεν χρησιμοποιείς MET activities, το metKcal.daily = 0
- **Result**: EA δεν υπολογίζεται καθόλου!
- **Fix needed**: Υπολογισμός άσκησης από trainDays + trainHours

### 2️⃣ ΚΡΙΤΙΚΟ: EA Formula Mismatch
- **Current formula**: EA = (Target - MetKcal.daily) / LBM
- **Problem**: Χρησιμοποιεί target kcal (που περιλαμβάνει deficit) αντί για πραγματικό intake
- **Correct formula**: EA = (Intake - Exercise) / LBM
- **Example issue**: Αν κάνεις cutting (target = 1800) με 500 kcal exercise, θα εμφανιστεί RED-S ακόμα κι αν τρως 2800 kcal (κανονικό)

### 3️⃣ ΚΡΙΤΙΚΟ: Activity Factor vs MET Inconsistency
- **Problem**: Όταν χρησιμοποιείς activity factor (χωρίς MET), το exercise δεν μπορεί να αποδοθεί
- **Result**: Δεν γνωρίζουμε πόσα kcal πήγαν για άσκηση vs NEAT
- **Fix needed**: Ξεχωριστή εκτίμηση άσκησης ακόμα και για activity factor cases

### 4️⃣ ΚΡΙΤΙΚΟ: NEAT Allocation
- **Current**: BMR × 1.2 = NEAT (άλλα 20% υπολογίζεται ως γενικό αυξητικό)
- **Problem**: Αυτό δεν είναι ακριβές - NEAT εξαρτάται από δουλειά, κτλ.
- **Fix**: Χρησιμοποιήστε activity factor categories ως έχουν

### 5️⃣ ΣΗΜΑΝΤΙΚΟ: Red-S Thresholds May Be Too Aggressive
- **Problem**: Ακόμα και αθλητές με κανονικές θερμίδες εμφανίζουν RED-S
- **Reason**: Η φόρμουλα δεν λαμβάνει υπόψη την κατηγορία άσκησης (strength vs endurance)
- **Fix**: Προσαρμογή κατωφλίου ή καλύτερος υπολογισμός άσκησης

---

## ✅ Προτεινόμενες Διορθώσεις

1. **Υπολογισμός άσκησης για activity factor cases** (estimate από trainDays/Hours)
2. **Διόρθωση EA formula** (χρήση εκτιμώμενης άσκησης σε όλες τις περιπτώσεις)
3. **RED-S recalibration** με βάση ακριβέστερα δεδομένα
4. **Προαιρετικές παραμέτρους** για εκτίμηση NEAT και άσκησης

