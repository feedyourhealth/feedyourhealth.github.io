# 🎬 LIVE TEST SESSION - STEP BY STEP

**Start Time:** Now!  
**Objective:** Run through all critical tests  
**Duration:** 30-60 minutes  
**Format:** Real-time feedback

---

## 🔴 **STEP 1: SETUP (2 minutes)**

### **1.1: Open Browser DevTools**
```
Press: F12
Look for: Console tab at bottom
Expected: Blank console (no errors yet)
```

### **1.2: Open Dietologist**
```
URL: https://feedyourhealth.github.io/Dietologist.html
Wait: Page loads completely
Check: No errors in F12 console
```

### **1.3: Clear Data**
```
F12 → Application → Storage → Local Storage
Right-click → Clear All
Refresh page
Expected: Fresh start, no clients in list
```

### **Status Check:**
```
[ ] DevTools open
[ ] App loaded
[ ] Console clear
[ ] Ready to test
```

✅ **PROCEED TO STEP 2**

---

## 🟢 **STEP 2: CREATE FIRST CLIENT (3 minutes)**

### **2.1: Click "+ Νέος Πελάτης"**
```
Action: Click green button
Wait: Form appears on left side
Check: 5 input fields visible
```

### **2.2: Fill Client Form**
```
Name:     Γιάννης Παπαδόπουλος
Sex:      Άνδρας (select from dropdown)
Age:      30
Weight:   80
Height:   180
Activity: Μέτρια ενεργός (3-5x)
Goal:     Διατήρηση (Maintain)
Formula:  Mifflin-St Jeor
Diet:     Κανονική
```

### **2.3: Click "✓ Αποθήκευση"**
```
Action: Click green checkmark button
Wait: Form closes
Check: Client appears in left list
Verify: "Γιάννης Παπαδόπουλος" visible
```

### **2.4: Check Console**
```
F12 → Console tab
Look for: ANY red errors?
If YES → Screenshot + note error
If NO → Continue
```

### **Status Check:**
```
[ ] Client created
[ ] Name in list
[ ] No console errors
```

✅ **CLIENT #1 CREATED - PROCEED TO STEP 3**

---

## 🟠 **STEP 3: MEDICAL CONDITIONS (5 minutes)**

### **3.1: Scroll Down on Left**
```
In client info section, scroll down
Look for: Section with checkboxes
Find: 6 medical condition options
```

### **3.2: Check DIABETES**
```
Action: Click checkbox "Σακχαρώδης Διαβήτης"
Wait: Toast appears (green notification)
Message should say: "✅ 🩺 Σακχαρώδης Διαβήτης ενεργοποιήθηκε"
Check: No errors in console
```

### **3.3: Click Info Icon (ℹ️)**
```
Next to "Σακχαρώδης Διαβήτης ℹ️" click the ℹ️
Wait: Beautiful modal opens
Check: Modal contains:
  ✓ Title with icon
  ✓ Foods to avoid section
  ✓ Food replacements
  ✓ Supplements list
  ✓ Official sources (3 links)
  ✓ Medical disclaimer
```

### **3.4: Click Official Link**
```
Action: Click "American Diabetes Association (ADA)"
Expected: Opens in new tab to official website
Check: Website loads (verify in new tab)
Return to test tab
```

### **3.5: Close Modal**
```
Click: ✕ Κλείσιμο button (top right)
or click overlay background
Modal should close
```

### **3.6: Check Second Medical Condition**
```
Also check: "Υψηλή Πίεση" checkbox
Toast should appear
Click ℹ️ icon
Verify modal displays correctly
Close modal
```

### **Status Check:**
```
[ ] DIABETES checked
[ ] Toast appeared
[ ] Modal opened
[ ] All sections visible
[ ] Official links clickable
[ ] No console errors
```

✅ **MEDICAL CONDITIONS WORKING - PROCEED TO STEP 4**

---

## 💛 **STEP 4: GENERATE MEAL PLAN (5 minutes)**

### **4.1: Scroll Up to Buttons**
```
Look for green buttons
Find: "✓ Αναδημιουργία" and "Δημιουργία πλάνου"
```

### **4.2: Click "Δημιουργία πλάνου"**
```
Action: Click green "Δημιουργία πλάνου" button
Wait: 2-3 seconds
Expected: Plan generates

Check:
  ✓ Tab 2 shows meal plan
  ✓ 7 days visible (Mon-Sun)
  ✓ Each day has 4-5 meals
  ✓ No "undefined" text
  ✓ Daily totals show at top
```

### **4.3: Check Daily Totals Header**
```
At top of plan, look for:
  Mon: 2000 kcal | P: 125g F: 55g C: 250g | 🟢
  Tue: 2000 kcal | ...
  (etc for all 7 days)

Check:
  ✓ Totals visible
  ✓ Status badge (🟢🟡🔴) appears
  ✓ Calorie totals ~2000
```

### **4.4: Check Macro Percentages**
```
For a meal, estimate:
  Protein: ~35% (diabetes protocol)
  Carbs: ~40% (diabetes protocol)
  Fat: ~25%

Verify: Makes sense for diabetes protocol
```

### **4.5: Scroll Through All Days**
```
Scroll down to see:
  [ ] Monday complete
  [ ] Tuesday complete
  [ ] Wednesday complete
  [ ] Thursday complete
  [ ] Friday complete
  [ ] Saturday complete
  [ ] Sunday complete
  
All days should have meals
No empty days
```

### **4.6: Check Console Again**
```
F12 → Console
Any red errors?
[ ] No errors
```

### **Status Check:**
```
[ ] Plan generated
[ ] 7 days visible
[ ] No undefined text
[ ] Daily totals show
[ ] Status badges present
[ ] Macros reasonable
[ ] No console errors
```

✅ **PLAN GENERATED - PROCEED TO STEP 5**

---

## 💜 **STEP 5: RATE MEALS (4 minutes)**

### **5.1: Find Rating Button**
```
Look at any meal, find small button
Button should be: "⭐" or similar
```

### **5.2: Click Rating Button on Monday Breakfast**
```
Action: Click rating button
Wait: Modal opens
Should show:
  ✓ 5 star options
  ✓ Notes text field
  ✓ Submit button
```

### **5.3: Rate Meal 5 Stars**
```
Click: 5th star (⭐⭐⭐⭐⭐)
Type notes: "Πολύ νόστιμο!" (Very tasty!)
Click: Submit button
Expected: Toast appears "✅ Rating saved"
Modal closes
```

### **5.4: Rate Another Meal 1 Star**
```
Find another meal
Click rating button
Rate: 1 star
Type notes: "Δεν μού αρέσει" (Don't like)
Submit
Expected: Toast "⭐ Rating saved"
```

### **5.5: Rate Third Meal 3 Stars**
```
Another meal
Rate: 3 stars
Submit
```

### **Status Check:**
```
[ ] Ratings work
[ ] Toast appears
[ ] No console errors
```

✅ **RATINGS WORKING - PROCEED TO STEP 6**

---

## 🤖 **STEP 6: AUTO-ADJUST (4 minutes)**

### **6.1: Find Auto-Adjust Buttons**
```
Scroll down client info
Look for two buttons:
  💡 Συστάσεις (Suggestions)
  🤖 AI Πλάνο (Smart Plan)
```

### **6.2: Click "💡 Συστάσεις"**
```
Action: Click suggestions button
Wait: Alert/modal appears
Check: Shows:
  ✓ Favorite meals (5⭐) 
  ✓ Bad meals (1⭐)
  ✓ Greek text correct
```

### **6.3: Click "🤖 AI Πλάνο"**
```
Action: Click AI Plan button
Expected: Dialog asks "Θέλετε να δημιουργήσετε νέο πλάνο...?"
Click: OK
Wait: New plan generates
Check: 
  ✓ Plan regenerates
  ✓ Same 7 days visible
  ✓ Favorite meals used more
  ✓ No console errors
```

### **Status Check:**
```
[ ] Suggestions work
[ ] AI Plan works
[ ] New plan generated
[ ] No console errors
```

✅ **AUTO-ADJUST WORKING - PROCEED TO STEP 7**

---

## 📊 **STEP 7: ANALYTICS (4 minutes)**

### **7.1: Click Analytics Tab**
```
At top, find: "📈 Analytics" button/tab
Click it
Wait: Analytics page loads
Check: No "undefined" text
```

### **7.2: Check Metric Cards**
```
Should show 4 cards:
  🟢 1 Σύνολο Πελατών
  🔵 1 Με Ενεργά Πλάνα
  🟠 0 Με Καταγραφή Προόδου
  🔴 1 Πλάνα Δημιουργηθέντα

Numbers should be correct
```

### **7.3: Check Client Table**
```
Scroll down, find table with columns:
  Όνομα | Ηλικία | Βάρος | Πλάνα | Πρόοδος | Αλλαγή Βάρους

Should show:
  Γιάννης | 30 | 80 | ✅ | ❌ | —
```

### **7.4: Check Charts Load**
```
Look for charts:
  1. Age Distribution (doughnut)
  2. Success Rate (doughnut)
  3. Weight Trend (bar) - empty if no progress data

Expected: Charts render without error
Colors show properly
```

### **Status Check:**
```
[ ] Tab loads
[ ] Metric cards visible
[ ] Table displays
[ ] Charts render
[ ] No console errors
```

✅ **ANALYTICS WORKING - PROCEED TO STEP 8**

---

## 📤 **STEP 8: EXPORTS (3 minutes)**

### **8.1: Create Second Client**
```
Go back to Tab 1
Create another client (different name)
Example: Μαρία Νικολάου, 28, 65kg, etc.
Check medical condition (different one)
Generate plan for this client
```

### **8.2: Test PDF Export**
```
Find button: "⬇️ Εξαγωγή PDF"
Click it
Wait: File downloads (check Downloads folder)
Open PDF file
Check:
  ✓ Client info visible
  ✓ NO activity level shown ⚠️ CRITICAL
  ✓ Meal plan visible
  ✓ Macros shown
  ✓ Greek text correct
  ✓ Proper formatting
```

### **8.3: Test Shopping List**
```
Find button: "🛒 Λίστα Αγορών"
Click it
Wait: TXT file downloads
Open it
Check:
  ✓ Organized by category
  ✓ Ingredients listed
  ✓ Format proper
```

### **Status Check:**
```
[ ] PDF exports
[ ] Activity NOT in PDF
[ ] Shopping list exports
[ ] No console errors
```

✅ **EXPORTS WORKING - PROCEED TO STEP 9**

---

## 📱 **STEP 9: MOBILE TEST (3 minutes)**

### **9.1: Resize Browser**
```
F12 → Device Toolbar (or Ctrl+Shift+M)
Select: iPhone 12 (or similar)
Expected: Layout changes to mobile
```

### **9.2: Test Mobile Client Creation**
```
Try to create a client on mobile
Check:
  ✓ Form fits screen
  ✓ Buttons clickable
  ✓ No horizontal scroll
  ✓ Text readable
```

### **9.3: Test Mobile Plan View**
```
Go to Tab 2 (meal plan)
Check:
  ✓ Meals readable on mobile
  ✓ Proper spacing
  ✓ No horizontal scroll
  ✓ Buttons accessible
```

### **9.4: Back to Desktop**
```
F12 → Exit device mode
Back to normal desktop view
```

### **Status Check:**
```
[ ] Mobile responsive
[ ] No horizontal scroll
[ ] Buttons clickable
[ ] Text readable
```

✅ **MOBILE WORKING - FINAL CHECKS**

---

## 🔴 **STEP 10: CRITICAL FINAL CHECKS (2 minutes)**

### **10.1: Open F12 Console**
```
F12 → Console tab
Check: ANY red error messages?
Count: How many errors?
Screenshot: If errors exist
```

### **10.2: Check for "undefined" Text**
```
Look through entire UI:
  [ ] Tab 1 - no "undefined"
  [ ] Tab 2 - no "undefined"
  [ ] Tab 3 - no "undefined"
  [ ] Tab 5 - no "undefined"
  [ ] Modals - no "undefined"
  [ ] Toasts - no "undefined"
```

### **10.3: Verify Data Persistence**
```
Press: Ctrl+R (refresh page)
Wait: Page reloads
Check:
  ✓ Both clients still in list
  ✓ First client selected
  ✓ Plan still visible
  ✓ No data loss
```

### **10.4: Check Activity Level Hidden**
```
For any client with activity set:
1. Generate plan
2. Export PDF
3. Open PDF
4. Check: Activity should NOT appear
   Example should NOT show: "Έντονα ενεργός"
```

### **Status Check:**
```
[ ] Console clean (or minimal errors)
[ ] No "undefined" text
[ ] Data persists
[ ] Activity hidden in PDF
```

✅ **ALL CRITICAL CHECKS COMPLETE**

---

## 📊 **TEST RESULTS SUMMARY**

### **Count Your Passes:**

```
QUICK CHECKLIST:
  [ ] Setup: 2/2 ✓
  [ ] Client Creation: 4/4 ✓
  [ ] Medical Conditions: 3/3 ✓
  [ ] Meal Plan: 5/5 ✓
  [ ] Ratings: 3/3 ✓
  [ ] Auto-Adjust: 2/2 ✓
  [ ] Analytics: 4/4 ✓
  [ ] Exports: 3/3 ✓
  [ ] Mobile: 4/4 ✓
  [ ] Critical: 4/4 ✓

TOTAL: ___ / 35 checkpoints
PASS RATE: ____%
```

### **Quality Score:**
```
35/35 (100%): ✅ PERFECT
33-34 (94-97%): ✅ EXCELLENT
31-32 (88-91%): ✅ VERY GOOD
29-30 (82-85%): ⚠️ GOOD (with notes)
<29 (<82%): ❌ NEEDS FIXES
```

---

## 🐛 **IF YOU FIND BUGS**

### **Document Bug:**
```
Bug #: ___
Title: ____________________
Severity: Critical / High / Medium / Low
Location: ________________
Steps to reproduce: 
  1. ___________
  2. ___________
  3. ___________
Expected: ________________
Actual: __________________
Screenshot: [Take one]
```

### **Create GitHub Issue:**
```
Visit: https://github.com/feedyourhealth/feedyourhealth.github.io/issues/new
Copy bug info above
Submit issue
Add label: bug, (severity)
```

---

## ✅ **TEST COMPLETE!**

### **Next Steps:**
1. Calculate pass rate
2. Document any failures
3. Create GitHub issues for bugs
4. Share results
5. Plan fixes (if needed)

---

**Ready? Start with STEP 1!** 🚀

Report back with results when done! 💪
