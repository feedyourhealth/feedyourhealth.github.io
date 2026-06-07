# 🧪 DIETOLOGIST - COMPREHENSIVE TEST PLAN

**Date:** June 7, 2026  
**Objective:** Test ALL features, combinations, and edge cases  
**Expected Duration:** 2-3 hours

---

## 📋 TEST EXECUTION GUIDE

### **SETUP**
```
1. Open: https://feedyourhealth.github.io/Dietologist.html
2. Browser: Chrome/Firefox/Safari
3. Clear localStorage: DevTools → Application → Clear all
4. Open DevTools Console (F12) to check for errors
```

---

## 🧑 **PART 1: CLIENT CREATION TESTS**

### **TEST 1.1: Basic Client Creation**
```
Input:
  Name: Γιάννης Παπαδόπουλος
  Sex: Άνδρας
  Age: 30
  Weight: 80 kg
  Height: 180 cm
  Goal: maintain
  Activity: mod
  Formula: mifflin
  Diet Type: Κανονική

Expected:
  ✓ Client saved to DATA.clients
  ✓ Name appears in client list
  ✓ Profile info displayed correctly
  ✓ No console errors

Test:
  [ ] Create client
  [ ] Check console for errors
  [ ] Verify in client list
  [ ] Check stored data
```

### **TEST 1.2: Client Creation - All Goals**
```
Test each goal separately:
  □ mild (Ήπια απώλεια -250)
  □ loss (Απώλεση βάρους -500)
  □ maintain (Διατήρηση)
  □ gain (Αύξηση μάζας +300)

Expected:
  ✓ Each goal creates client with correct calculations
  ✓ Daily targets adjust per goal
  ✓ Macro percentages differ appropriately

Test:
  [ ] Create client with each goal
  [ ] Check daily calorie targets
  [ ] Verify macro distribution
```

### **TEST 1.3: Client Creation - All Activity Levels**
```
Test each activity level:
  □ sed (Καθιστικός)
  □ light (Ελαφρά ενεργός 1-3x)
  □ mod (Μέτρια ενεργός 3-5x)
  □ active (Έντονα ενεργός 6-7x)

Expected:
  ✓ TDEE increases with activity
  ✓ Calorie targets adjust appropriately
  ✓ Water targets increase with activity

Test:
  [ ] Create client for each activity level
  [ ] Compare daily calorie targets
  [ ] Verify hydration targets
```

### **TEST 1.4: Client Creation - Age Extremes**
```
Test age ranges:
  □ Age 13 (minimum - underage)
  □ Age 25 (young adult)
  □ Age 50 (mature)
  □ Age 80 (elderly)
  □ Age 120 (maximum)
  □ Age 12 (below minimum - should error?)
  □ Age 121 (above maximum - should error?)

Expected:
  ✓ Valid ages accepted
  ✓ Invalid ages rejected with message
  ✓ Calculations work for all ages

Test:
  [ ] Create clients with each age
  [ ] Check validation
  [ ] Verify calculations
```

### **TEST 1.5: Client Creation - Weight Extremes**
```
Test weight ranges:
  □ 20 kg (minimum - very light)
  □ 50 kg (light)
  □ 100 kg (normal)
  □ 200 kg (very heavy)
  □ 300 kg (maximum)
  □ 19 kg (below minimum - should error?)
  □ 301 kg (above maximum - should error?)

Expected:
  ✓ Valid weights accepted
  ✓ Invalid weights rejected
  ✓ Calculations work for all weights

Test:
  [ ] Create clients with each weight
  [ ] Check validation
  [ ] Verify TDEE calculations
```

### **TEST 1.6: Client Creation - Height Extremes**
```
Test height ranges:
  □ 100 cm (very short)
  □ 150 cm (short)
  □ 180 cm (average)
  □ 220 cm (very tall)
  □ 250 cm (maximum)
  □ 99 cm (below minimum - should error?)
  □ 251 cm (above maximum - should error?)

Expected:
  ✓ Valid heights accepted
  ✓ Invalid heights rejected
  ✓ BMI calculations correct

Test:
  [ ] Create clients with each height
  [ ] Check validation
  [ ] Verify BMI calculations
```

### **TEST 1.7: Client Creation - Diet Types**
```
Test each diet type:
  □ Κανονική (Normal)
  □ Χορτοφαγική (Vegetarian)
  □ Vegan
  □ Low-Carb
  □ Paleo

Expected:
  ✓ Each diet type accepted
  ✓ Meal templates adjust per diet
  ✓ Foods excluded appropriately

Test:
  [ ] Create client for each diet
  [ ] Generate plan
  [ ] Check meal contents
  [ ] Verify restrictions
```

### **TEST 1.8: Client Creation - Formulas**
```
Test both calorie formulas:
  □ Mifflin-St Jeor
  □ Cunningham (athletes)

Expected:
  ✓ Different formulas give different results
  ✓ Cunningham usually higher for athletes
  ✓ Both formulas mathematically correct

Test:
  [ ] Create same client with both formulas
  [ ] Compare daily calorie targets
  [ ] Verify formulas used
```

---

## 🏥 **PART 2: MEDICAL CONDITIONS TESTS**

### **TEST 2.1: Each Medical Condition Alone**
```
Test each condition separately:

□ DIABETES (Σακχαρώδης Διαβήτης)
  Expected:
  ✓ Check activates without error
  ✓ Protocol suggestions appear
  ✓ Carbs reduce to 40%
  ✓ Protein increases to 35%
  ✓ Modal shows protocol correctly
  ✓ All 3 official links clickable

□ HYPERTENSION (Υψηλή Πίεση)
  Expected:
  ✓ Check activates without error
  ✓ Low-sodium foods preferred
  ✓ High-potassium foods included
  ✓ Protocol information displays
  ✓ All links work

□ CELIAC (Κοιλιοκάκη)
  Expected:
  ✓ Check activates without error
  ✓ Gluten-free flag set
  ✓ No wheat/barley/rye in meals
  ✓ Protocol shows substitutions
  ✓ Links open correctly

□ IBS (Σύνδρομο Ευερέθιστου Εντέρου)
  Expected:
  ✓ Check activates without error
  ✓ Suggests 5 small meals
  ✓ Avoids fried foods
  ✓ Protocol info displayed
  ✓ Links functional

□ LACTOSE (Δυσανεξία Λακτόζης)
  Expected:
  ✓ Check activates without error
  ✓ No milk products
  ✓ Plant-based alternatives suggested
  ✓ Protocol shows clearly
  ✓ All sources accessible

□ VEGETARIAN (Χορτοφαγική)
  Expected:
  ✓ Check activates without error
  ✓ No meat in meals
  ✓ Plant proteins prioritized
  ✓ B12 supplement recommended
  ✓ Protocol displays properly
```

### **TEST 2.2: Multiple Medical Conditions**
```
Test combinations:

□ DIABETES + HYPERTENSION
  Expected:
  ✓ Both protocols apply
  ✓ Low carbs + low sodium
  ✓ High fiber + high potassium
  ✓ No conflicts

□ CELIAC + VEGETARIAN
  Expected:
  ✓ Gluten-free + no meat
  ✓ Plant-based proteins used
  ✓ Both restrictions honored

□ IBS + LACTOSE
  Expected:
  ✓ Small meals + no dairy
  ✓ Plant-based small portions

□ DIABETES + VEGETARIAN + CELIAC
  Expected:
  ✓ All three protocols apply
  ✓ No contradictions
  ✓ Meals still valid
  ✓ All restrictions honored
```

### **TEST 2.3: Protocol Modal Display**
```
For each condition, click ℹ️ icon:

Expected:
  ✓ Beautiful modal opens
  ✓ Shows all sections:
    - Title with icon
    - Foods to avoid
    - Food replacements
    - Supplements
    - Notes
    - Official sources
    - Medical disclaimer
  ✓ All links are clickable
  ✓ Links open in new tab
  ✓ Close button works
  ✓ Overlay dismissible
  ✓ No layout breaks on mobile
  ✓ Text fully readable
```

### **TEST 2.4: Protocol Activation/Deactivation**
```
Check then uncheck medical conditions:

Expected:
  ✓ Toast shows "✅ Protocol activated"
  ✓ If plan exists, asks to regenerate
  ✓ Uncheck shows "❌ Protocol deactivated"
  ✓ No errors in console
  ✓ Data correctly updated
```

---

## 🍽️ **PART 3: MEAL PLAN GENERATION TESTS**

### **TEST 3.1: Generate Plan - Basic**
```
Setup:
  - Simple client (no conditions, no restrictions)
  - Click "Δημιουργία πλάνου"

Expected:
  ✓ 7-day plan generates without error
  ✓ All meals populated
  ✓ Daily totals display
  ✓ Macros correct (+/- 2%)
  ✓ Each day has 4-5 meals
  ✓ No "undefined" text
  ✓ Plan appears in tab 2
  ✓ Proper styling
  ✓ Mobile responsive
```

### **TEST 3.2: Generate Plan - With Medical Conditions**
```
Setup:
  - Client with DIABETES
  - Generate plan

Expected:
  ✓ Plan generates
  ✓ Carbs are ~40% (not 50%)
  ✓ Protein is ~35% (not 25%)
  ✓ No sugary foods
  ✓ Whole grains preferred
  ✓ High fiber foods included
```

### **TEST 3.3: Generate Plan - With Allergies**
```
Setup:
  - Client with allergies: "γαρίδες, καρύδια"
  - Generate plan

Expected:
  ✓ Plan generates
  ✓ No shrimp (γαρίδες) in meals
  ✓ No walnuts (καρύδια) in meals
  ✓ No error messages
  ✓ Other meals normal
```

### **TEST 3.4: Generate Plan - Different Goals**
```
Generate plan for each goal:

□ MILD LOSS (-250 kcal)
  Expected: ~1750-1850 kcal/day

□ LOSS (-500 kcal)
  Expected: ~1500-1600 kcal/day

□ MAINTAIN
  Expected: ~2000-2200 kcal/day

□ GAIN (+300 kcal)
  Expected: ~2300-2500 kcal/day

Check:
  [ ] Daily calories correct
  [ ] Macros appropriate
  [ ] Meals suitable for goal
```

### **TEST 3.5: Plan Regeneration (Undo/Redo)**
```
Steps:
1. Generate plan
2. Click undo button
3. Verify plan disappears
4. Click redo button
5. Verify plan reappears

Expected:
  ✓ Plan removed on undo
  ✓ UI reflects change
  ✓ Plan restored on redo
  ✓ Identical plan restored
  ✓ No data loss
```

### **TEST 3.6: Daily Calorie Display**
```
Expected:
  ✓ Daily totals header shows
  ✓ Shows: Mon, Tue, Wed, etc.
  ✓ Shows kcal for each day
  ✓ Shows macros (P, F, C)
  ✓ Color-coded status badges
    - 🟢 Green if within ±5%
    - 🟡 Yellow if close
    - 🔴 Red if over
  ✓ Accurate calculations
```

---

## ⭐ **PART 4: MEAL RATING & AUTO-ADJUST TESTS**

### **TEST 4.1: Rate Individual Meals**
```
Steps:
1. Generate plan
2. Click meal rating button
3. Select 1-5 stars
4. Add optional notes

Expected:
  ✓ Modal opens for rating
  ✓ All 5 star options clickable
  ✓ Notes input works
  ✓ Submit saves rating
  ✓ Toast confirmation appears
  ✓ Data stored in c.mealFeedback
  ✓ No console errors
```

### **TEST 4.2: Rate Multiple Meals**
```
Steps:
1. Generate plan
2. Rate 3-4 meals with different stars
3. Rate same meal twice (verify update)

Expected:
  ✓ All ratings saved
  ✓ Multiple ratings stored
  ✓ Can update rating
  ✓ Data persists after refresh
  ✓ Accurate feedback stored
```

### **TEST 4.3: Auto-Adjust Suggestions**
```
Steps:
1. Generate plan
2. Rate some meals (mix of 5⭐ and 1⭐)
3. Click "💡 Συστάσεις" button

Expected:
  ✓ Modal shows improvements
  ✓ Lists favorite meals (5⭐)
  ✓ Lists disliked meals (1-2⭐)
  ✓ Greek text correct
  ✓ No errors
```

### **TEST 4.4: Generate Smart Plan**
```
Steps:
1. Generate plan
2. Rate several meals
3. Click "🤖 AI Πλάνο" button
4. Confirm regeneration

Expected:
  ✓ Modal offers to regenerate
  ✓ Confirms before changing
  ✓ New plan generates
  ✓ Favorite meals appear more
  ✓ Disliked meals removed
  ✓ Same daily calories
  ✓ No data loss
```

---

## 📊 **PART 5: ANALYTICS TESTS**

### **TEST 5.1: Analytics with Single Client**
```
Setup:
  - 1 client with plan
  - Click Analytics tab

Expected:
  ✓ Tab loads
  ✓ Shows metric cards:
    - Total Clients: 1
    - Clients with Plans: 1
    - Clients with Progress: 0 (or 1 if have data)
    - Plans Generated: >0
  ✓ Client table displays
  ✓ Client name visible
  ✓ Checkmarks for plan status
  ✓ No console errors
```

### **TEST 5.2: Analytics with Multiple Clients**
```
Setup:
  - Create 3-5 clients
  - Some with plans, some without
  - Some with progress tracking
  - Click Analytics tab

Expected:
  ✓ Correct client count
  ✓ Correct plan count
  ✓ Correct progress count
  ✓ All clients in table
  ✓ Table properly formatted
  ✓ Accurate statistics
```

### **TEST 5.3: Charts Display**
```
Expected when analytics loads:
  ✓ Chart.js loads (lazy loaded)
  ✓ No "chart not found" errors
  ✓ 3 charts render:
    1. Weight Trend (bar chart)
    2. Age Distribution (doughnut)
    3. Success Rate (doughnut)
  ✓ Charts have titles
  ✓ Charts have legends
  ✓ Colors appropriate
  ✓ Data accurate
  ✓ Responsive on mobile
```

### **TEST 5.4: Weight Trend Analysis**
```
Setup:
  - Client with 2+ weight entries

Expected:
  ✓ Chart shows initial vs current weight
  ✓ Red bars for initial
  ✓ Green bars for current
  ✓ Weight change calculated
  ✓ Table shows delta
  ✓ Correct calculations
```

### **TEST 5.5: Age Distribution**
```
Expected:
  ✓ Doughnut chart shows age groups
  ✓ 4 age groups displayed:
    - < 25 years
    - 25-35 years
    - 35-45 years
    - 45+ years
  ✓ Percentages correct
  ✓ Colors distinct
```

---

## 📤 **PART 6: EXPORT TESTS**

### **TEST 6.1: PDF Export**
```
Steps:
1. Generate plan
2. Click "PDF Export" button
3. Verify file downloads

Expected:
  ✓ File downloads
  ✓ Named properly
  ✓ PDF opens without error
  ✓ Contains client info (NO activity level shown)
  ✓ Contains meal plan
  ✓ Contains macro summary
  ✓ Formatting correct
  ✓ Greek text proper
  ✓ No broken layouts
```

### **TEST 6.2: Word/RTF Export**
```
Steps:
1. Generate plan
2. Click "Word Export" button
3. Verify file downloads

Expected:
  ✓ File downloads
  ✓ Opens in Word/LibreOffice
  ✓ Contains client info (NO activity shown)
  ✓ Meal plan formatted
  ✓ Macros visible
  ✓ Greek text preserved
  ✓ No corruption
```

### **TEST 6.3: Google Docs Export**
```
Steps:
1. Generate plan
2. Click "Google Docs" button
3. Verify file downloads

Expected:
  ✓ .docx file downloads
  ✓ Opens in Google Docs
  ✓ No activity level shown
  ✓ Content readable
  ✓ Greek characters correct
  ✓ Formatting proper
```

### **TEST 6.4: Shopping List Export**
```
Steps:
1. Generate plan
2. Click "🛒 Λίστα Αγορών"
3. Download file

Expected:
  ✓ TXT file downloads
  ✓ Contains organized shopping list
  ✓ Categories present:
    - Proteins
    - Vegetables
    - Grains
    - Dairy
    - Oils/Spices
    - Other
  ✓ Proper formatting
  ✓ All ingredients listed
  ✓ Greek text correct
```

### **TEST 6.5: Progress Report Export**
```
Steps:
1. Add progress entries
2. Click "📋 Αναφορά"
3. Download file

Expected:
  ✓ TXT file downloads
  ✓ Contains weight history
  ✓ Shows weight change
  ✓ Includes notes
  ✓ Proper formatting
  ✓ Client name in filename
```

---

## 🔐 **PART 7: CLIENT SHARING TESTS**

### **TEST 7.1: Generate Share Link**
```
Steps:
1. Create client
2. Click "🔗 Δώσε στον Client"
3. Click copy button

Expected:
  ✓ Share link generated
  ✓ Copied to clipboard
  ✓ Toast confirms copy
  ✓ Link format: ?view=client&token=share_xxx
  ✓ Unique token generated
  ✓ Can share multiple times
```

### **TEST 7.2: Verify Share Token**
```
Steps:
1. Generate share link
2. Copy the token
3. Verify token stored in client object

Expected:
  ✓ c.shareToken exists
  ✓ Token is unique per client
  ✓ Token persists after refresh
  ✓ Same client = same token
```

---

## 💾 **PART 8: DATA PERSISTENCE TESTS**

### **TEST 8.1: Save on Modification**
```
Steps:
1. Create client
2. Modify name/age/weight
3. Refresh page
4. Verify data saved

Expected:
  ✓ Data persists
  ✓ No data loss
  ✓ Automatic save works
  ✓ Changes reflected
```

### **TEST 8.2: Multiple Clients**
```
Steps:
1. Create 3+ clients
2. Refresh page
3. Verify all clients present

Expected:
  ✓ All clients persist
  ✓ Correct data for each
  ✓ No mixing
  ✓ Proper isolation
```

### **TEST 8.3: Plan Data Persistence**
```
Steps:
1. Generate plan for client
2. Refresh page
3. Switch to plan tab

Expected:
  ✓ Plan still there
  ✓ Accurate data
  ✓ Same meals
  ✓ Same daily totals
```

---

## 🔴 **PART 9: EDGE CASES & ERROR HANDLING**

### **TEST 9.1: Empty Data States**
```
Scenarios:
□ No clients created
  Expected: Message "Δεν υπάρχουν πελάτες"
  
□ No plan generated
  Expected: Tab 2 empty or message
  
□ Analytics with no clients
  Expected: "Δεν υπάρχουν πελάτες"
  
□ No progress data
  Expected: "—" or "Δεν υπάρχει"
```

### **TEST 9.2: Missing Data Fields**
```
Create client missing optional fields:
□ No preferences
□ No allergies
□ No medical conditions
□ No budget

Expected:
  ✓ Plan still generates
  ✓ No errors
  ✓ Defaults applied
  ✓ Fields optional
```

### **TEST 9.3: Invalid Input Data**
```
Try to enter:
□ Negative weight
□ Age 0
□ Height 0
□ Very large numbers (9999)
□ Special characters in name

Expected:
  ✓ Validation prevents invalid
  ✓ Error messages shown
  ✓ Data not saved if invalid
  ✓ User guided to fix
```

### **TEST 9.4: LocalStorage Limits**
```
Steps:
1. Create many clients
2. Generate many plans
3. Watch storage growth

Expected:
  ✓ No crashes
  ✓ Graceful handling if quota exceeded
  ✓ Error message if needed
  ✓ Data integrity maintained
```

### **TEST 9.5: Rapid Changes**
```
Steps:
1. Quickly modify client data
2. Rapidly generate/undo plans
3. Quick switches between tabs

Expected:
  ✓ No race conditions
  ✓ Data consistent
  ✓ No loss of data
  ✓ Smooth operation
```

---

## 🖥️ **PART 10: BROWSER COMPATIBILITY & RESPONSIVE TESTS**

### **TEST 10.1: Desktop (1024px+)**
```
Expected:
  ✓ Full 4-column layout
  ✓ All buttons visible
  ✓ Proper spacing
  ✓ Charts display well
  ✓ Table readable
  ✓ No overflow
```

### **TEST 10.2: Tablet (768px)**
```
Expected:
  ✓ 2-column grid
  ✓ Responsive layout
  ✓ Touch-friendly buttons
  ✓ Charts adapt
  ✓ Mobile readable
```

### **TEST 10.3: Mobile (480px)**
```
Expected:
  ✓ 1-column layout
  ✓ Stack all elements
  ✓ Large touch targets (36px+)
  ✓ Readable text
  ✓ No horizontal scroll
  ✓ Forms functional
  ✓ Buttons accessible
```

### **TEST 10.4: Browser Compatibility**
```
Test on:
□ Chrome
□ Firefox
□ Safari
□ Edge

Expected:
  ✓ Works on all
  ✓ No JS errors
  ✓ CSS renders properly
  ✓ Greek text correct
  ✓ Charts load
```

---

## 🎯 **PART 11: CRITICAL FUNCTIONALITY CHECKLIST**

### **Must Work:**
```
✓ Create client
✓ Generate 7-day plan
✓ Display daily totals
✓ Show macro breakdown
✓ Rate meals 1-5 stars
✓ Auto-adjust from feedback
✓ Show medical protocols
✓ Analytics dashboard
✓ Export PDF/Word/Docs
✓ Shopping list generation
✓ Progress tracking
✓ Share link for clients
✓ Medical condition protocols
✓ Official source links
✓ Responsive design
✓ No console errors
✓ Data persistence
```

### **Should NOT Happen:**
```
✗ undefined in text
✗ Missing meal names
✗ Incorrect daily calories
✗ Macro percentages wrong
✗ Broken modal displays
✗ Missing links
✗ Export files corrupted
✗ Data loss on refresh
✗ Console JavaScript errors
✗ Broken links
✗ Styling issues on mobile
✗ Activity level in exports
```

---

## 📝 **TEST RESULT TEMPLATE**

```
TEST: [Test Name]
Date: [Date]
Tester: [Name]
Browser: [Chrome/Firefox/Safari/Edge]
OS: [Windows/Mac/Linux]

Setup: [Steps to reproduce]

Expected Result: [What should happen]

Actual Result: [What actually happened]

Status: ✓ PASS / ❌ FAIL / ⚠️ WARNING

Notes: [Any observations]

Screenshot: [If needed]

Console Errors: [If any]
```

---

## 🚀 **NEXT STEPS**

**After completing tests:**
1. Document all failures
2. Create GitHub issues for bugs
3. Prioritize fixes
4. Assign to development
5. Retest after fixes
6. Deploy when all critical tests pass

**Success Criteria:**
- [ ] All MUST WORK items pass
- [ ] Zero console errors
- [ ] All exports work
- [ ] Mobile responsive
- [ ] All protocols display
- [ ] Data persists correctly
- [ ] No undefined text
- [ ] Share links work
