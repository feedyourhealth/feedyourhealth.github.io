"""⚠️ Οι στόχοι άλλαξαν: όταν αλλάζουν οι στόχοι ημέρας (καρβοφόρτωση, προπονήσεις…) το πλάνο ΔΕΝ αλλάζει μόνο του·
κίτρινο πλαίσιο + «νέοι στόχοι» στις ημέρες, ⚖️ από το πλαίσιο προσαρμόζει μόνο αυτές σε πρακτικές ποσότητες."""
import json, subprocess, sys, time, urllib.request, io, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8897
U1 = 'user-111'
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

def day():
    return [{'name': 'Πρωινό', 'foods': [{'n': 'Βρώμη', 'g': 60}, {'n': 'Γιαούρτι 2%', 'g': 200}, {'n': 'Μπανάνα', 'g': 120}]},
            {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}, {'n': 'Ρύζι (βρ.)', 'g': 200}]},
            {'name': 'Ενδιάμεσο', 'foods': [{'n': 'Ψωμί ολικής άλεσης', 'g': 60}, {'n': 'Μέλι', 'g': 20}, {'n': 'Muffins Μύρτιλου', 'g': 60}]},
            {'name': 'Βραδινό', 'foods': [{'n': 'Σολομός', 'g': 150}, {'n': 'Πατάτες (βρ.)', 'g': 250}, {'n': 'Σαλάτα εποχής', 'g': 100}, {'n': 'Ελαιόλαδο', 'g': 10}]}]

mi = {'id': 'mi', 'name': 'Μιχάλης Δοκιμή', 'sex': 'M', 'age': 42, 'weight': 82, 'height': 178, 'activity': 'mod',
      'goal': 'maintain', 'allergenListsVer': 2, 'foodExclude': [], 'weekPlan': {str(d): day() for d in range(7)}}
# Πελάτης/πρότυπο με το ΠΑΛΙΟ όνομα «Πατάτες» → η εφάπαξ μετονομασία (runFoodRenameMigration) το κάνει «Πατάτες (βρ.)»
po = {'id': 'po', 'name': 'Παλιό Πλάνο', 'sex': 'F', 'age': 30, 'weight': 60, 'height': 165, 'activity': 'light', 'goal': 'maintain',
      'allergenListsVer': 2, 'foodExclude': ['Πατάτες', 'Φακές'], 'weekPlan': {'0': [{'name': 'Μεσημεριανό', 'foods': [{'n': 'Πατάτες', 'g': 150}, {'n': 'Φακές', 'g': 200}, {'n': 'Γλυκοπατάτα', 'g': 130}]}]}}
tpl = {'id': 'tp1', 'name': 'Πρότυπο', 'meals': [{'name': 'Βραδινό', 'foods': [{'n': 'Πατάτες', 'g': 200}]}]}
S = {'rows': {U1: {'data': {'clients': [mi, po], 'customTemplates': [tpl]}, 'version': 1}}}

# Ημερομηνία αγώνα = η Κυριακή σε 3-9 μέρες → καρβοφόρτωση Πεμ/Παρ/Σαβ (οι μέρες ΠΡΙΝ τον αγώνα)
today = datetime.date.today()
sunday = today + datetime.timedelta(days=(6 - today.weekday()) or 7)
if (sunday - today).days < 3: sunday += datetime.timedelta(days=7)

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(bypass_csp=True, viewport={'width': 1400, 'height': 1000})
        ctx.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        ctx.route('**/*.supabase.co/**', lambda r: r.abort())
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.add_init_script('window.__SERVER=' + json.dumps(S) + ';window.__UID=' + json.dumps(U1) + ';localStorage.clear();')
        pg.goto(f'http://localhost:{PORT}/Dietologist.html', wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=10000)
        pg.wait_for_timeout(800)
        J = lambda js: pg.evaluate(js)
        plan = lambda: J('JSON.stringify(clients.find(x=>x.id==="mi").weekPlan)')

        print('0. Μετονομασία «Πατάτες» → «Πατάτες (βρ.)» στα αποθηκευμένα δεδομένα')
        p0 = J('JSON.stringify(clients.find(x=>x.id==="po"))')
        check('"Πατάτες"' not in p0 and p0.count('Πατάτες (βρ.)') == 2 and p0.count('Φακές (βρ.)') == 2 and '"Γλυκοπατάτα (ψητή)"' in p0,
              f'client plan + exclusions renamed ({p0[:200]})')
        check(J('cm("Γλυκοπατάτα",100).k===90 && cm("Φακές",100).k===116 && !!FOOD_UNITS["Γλυκοπατάτα (ψητή)"] && !!FOODS["Γαλοπούλα στήθος (ψητό)"] && cm("Σαρδέλες",100).k===167 && cm("Σαρδέλες",100).sf===2.3'),
              'legumes/sweet potato/turkey: new keys + old names resolve (sweet potato = baked 90 kcal)')
        check(J('getProtocol("fodmap").restrictions.avoidFoods.indexOf("Φασόλια")!==-1'), 'FODMAP avoid list keeps substring «Φασόλια» (still matches borlotti)')
        check(J('JSON.stringify(customTemplates)').count('Πατάτες (βρ.)') == 1, 'custom template renamed')
        check(J('!!FOODS["Πατάτες (βρ.)"] && !FOODS["Πατάτες"] && FOOD_UNITS["Πατάτες (βρ.)"].u==="τεμ." && cm("Πατάτες",100).k===87'),
              'new key everywhere, old name still resolves via alias')

        print('1. Άνοιγμα πελάτη = μόνο baseline, καμία αλλαγή')
        J('selectClient("mi"); renderMain(); swTab(2);'); pg.wait_for_timeout(300)
        before = plan()  # μετά το πρώτο render (κανονικοποίηση πεδίων γευμάτων), πριν τρέξει το auto-sync
        pg.wait_for_timeout(1600)
        check(plan() == before, 'opening the client does not touch the plan')
        check(not J('!!document.getElementById("portion-adjust-toast")'), 'no toast on open')

        def carbs(d): return J(f'clients.find(x=>x.id==="mi").weekPlan[{d}].reduce((s,m)=>s+m.foods.reduce((a,f)=>a+cm(f.n,f.g).c,0),0)')
        c_old = carbs(5)

        tg = lambda: J('getDayTgtEff(clients.find(x=>x.id==="mi"),calcTDEE(clients.find(x=>x.id==="mi")))')
        t0 = tg()

        print('2. Ημερομηνία αγώνα → καρβοφόρτωση Πεμ/Παρ/Σαβ → ΔΕΝ αλλάζει τίποτα, μόνο κίτρινο πλαίσιο')
        J(f'setEventDate("{sunday.isoformat()}")'); pg.wait_for_timeout(2200)
        check(plan() == before, 'changing targets does NOT touch the plan')
        check(not J('!!document.getElementById("portion-adjust-toast")'), 'no auto-adjust toast')
        bn = J('(document.getElementById("po-tgt-banner")||{}).innerText||""')
        check('Οι στόχοι άλλαξαν' in bn and 'Πέμπτη, Παρασκευή, Σάββατο' in bn and 'Μόνο προσαρμογή 3 ημερών' in bn and 'Προσαρμογή & αποστολή' in bn, f'banner lists Thu/Fri/Sat + button ({bn[:160]!r})')
        chips = J('[...document.querySelectorAll(".week-table thead th")].map(th=>th.querySelector(".po-tgt-chip")?1:0)')
        check(chips == [0, 0, 0, 0, 1, 1, 1, 0], f'«νέοι στόχοι» chip only on Thu/Fri/Sat headers ({chips})')
        J('document.querySelector("#po-tgt-banner .po-tgt-only").click()'); pg.wait_for_timeout(400)
        check(not J('!!document.getElementById("po-tgt-banner")'), 'banner gone after adjusting')
        loads = J('getCarbLoadDayIndexes(clients.find(x=>x.id==="mi"))')
        check(sorted(loads) == [3, 4, 5], f'carb-load days are Thu/Fri/Sat, race day excluded ({loads})')
        t1 = tg()
        check(all(t1[d]['c'] == 820 for d in (3, 4, 5)), f'loading days carbs = 10 g/kg = 820 ({[t1[d]["c"] for d in (3,4,5)]})')
        check(all(t1[d]['k'] > t0[d]['k'] + 1000 for d in (3, 4, 5)), f'loading days kcal go up ({[t0[d]["k"] for d in (3,4,5)]} → {[t1[d]["k"] for d in (3,4,5)]})')
        check(all(t1[d]['p'] == t0[d]['p'] and t1[d]['f'] <= 41 for d in (3, 4, 5)), 'protein unchanged, fat ≤ 0.5 g/kg on loading days')
        check(all(t1[d]['k'] == t1[d]['p']*4 + t1[d]['c']*4 + t1[d]['f']*9 for d in (3, 4, 5)), 'kcal = 4P + 4C + 9F on loading days')
        check(all(t1[d] == t0[d] for d in (0, 1, 2, 6)), 'other days (incl. race day) untouched')
        banner = J('document.body.textContent')
        check('Ενεργή καρβοφόρτωση: Πεμ, Παρ, Σαβ (αγώνας: Κυρ)' in banner, 'banner names Thu/Fri/Sat + race day')
        after = json.loads(plan()); old = json.loads(before)
        changed = [d for d in range(7) if after[str(d)] != old[str(d)]]
        check(changed and set(changed) <= {3, 4, 5}, f'only carb-load days changed in the plan ({changed})')
        toast = J('(document.getElementById("portion-adjust-toast")||{}).innerText||""')
        check('Προσαρμόστηκαν' in toast and 'Αναίρεση' in toast, f'toast with Αναίρεση ({toast[:90]!r})')
        # Πρακτικές ποσότητες: τεμάχια/φέτες ολόκληρα, φλ./κ.σ. σε ½, σαλάτα ίδια, γραμμάρια σε 5/10 g
        bad = J('''(()=>{var c=clients.find(x=>x.id==="mi"),o=JSON.parse(%s),bad=[];
          [3,4,5].forEach(d=>c.weekPlan[d].forEach((m,mi)=>m.foods.forEach((f,fi)=>{
            var g0=o[d][mi].foods[fi].g; if(f.g===g0)return;
            var fu=FOOD_UNITS[f.n],cat=(FOODS[resolveFood(f.n)]||{}).cat,k=cm(f.n,100).k;
            if(cat==="Λαχανικά"&&k<40){bad.push("veg "+f.n);return;}
            var w=_poWholeG(f.n);
            if(w){if(Math.abs(f.g/w-Math.round(f.g/w))>0.01)bad.push(f.n+" "+f.g);return;}
            if(f.g%%_poGramStep(f.g))bad.push(f.n+" "+f.g+"g");
          })));return bad;})()''' % json.dumps(before))
        check(not bad, f'adjusted amounts are practical (whole pieces, ½ cups/spoons, salad untouched, 5/10 g) ({bad})')
        check(J('_poWholeG("Muffins Μύρτιλου")===60 && _poWholeG("Γιαούρτι 2%")===100 && _poWholeG("Ελαιόλαδο")===5 && _poWholeG("Ρύζι (βρ.)")===0'),
              'unit rules: muffin whole, yogurt ½ φλ., oil ½ κ.σ., rice in grams')
        low = J('getLowFiberDayIndexes(clients.find(x=>x.id==="mi"))')
        check(sorted(low) == [3, 4, 5, 6], f'low-fiber days = load days + race day ({low})')
        check('(λιγότερες ίνες)' in toast or 'Ρύζι άσπρο' in toast or 'Μακαρόνια' in toast or 'Ψωμί λευκό' in toast,
              f'low-fiber suggestions offered ({toast!r})')
        check('+ Ρύζι καστανό' not in toast and '+ Κινόα' not in toast and '+ Ψωμί ολικής' not in toast and '+ Βρώμη' not in toast, 'no whole-grain add suggestions on load days')
        J('renderWeekTable()'); pg.wait_for_timeout(150)
        fiv = J('[...document.querySelectorAll(".totals-row td")].slice(1).map(td=>{var r=td.querySelectorAll(".macro-bar-row");return r.length?r[r.length-1].querySelector(".mbr-val").textContent:""})')
        check(all('/≤15g' in fiv[d] for d in (3, 4, 5, 6)) and not any('≤' in fiv[d] for d in (0, 1, 2)), f'fiber row shows ≤15g only on Thu–Sun ({fiv})')
        check('χαμηλές ίνες, έως 15g/ημ.' in J('document.body.textContent'), 'weekly fiber banner explains the low-fiber days')
        check(carbs(5) > c_old + 50, f'Saturday carbs went up toward 820g ({c_old:.0f} → {carbs(5):.0f})')

        print('3. Αναίρεση γυρίζει το πλάνο και ξαναφέρνει το πλαίσιο· «Θα το κάνω μόνος μου» το κλείνει')
        J('document.querySelector("#portion-adjust-toast button[data-undo]").click()'); pg.wait_for_timeout(300)
        J('renderMain()'); pg.wait_for_timeout(1600)
        check(plan() == before, 'undo restores the plan and a re-render does not re-adjust')
        check(J('!!document.getElementById("po-tgt-banner")'), 'after undo the banner is back')
        J('document.querySelector("#po-tgt-banner .po-tgt-dismiss").click()'); pg.wait_for_timeout(300)
        check(plan() == before and not J('!!document.getElementById("po-tgt-banner")'), 'dismiss closes the banner, plan unchanged')

        print('4. Χωρίς αλλαγή στόχων → τίποτα')
        J('renderMain()'); pg.wait_for_timeout(1600)
        check(plan() == before and not J('!!document.getElementById("portion-adjust-toast")') and not J('!!document.getElementById("po-tgt-banner")'),
              'plain re-render: no change, no toast, no banner')

        print('5. Πρωτεΐνη σταθερή κάθε μέρα με MET (εβδομάδα δρομέα με μαραθώνιο)')
        J('''(()=>{var c=clients.find(x=>x.id==="mi");c.activity="sed";c.eventDate=null;c.macroP=20;c.macroF=25;c.macroC=55;
          c.metActivities=[{id:"run_10",name:"Τρέξιμο 10 km/h",met:9.8,mins:30,time:"05:00",days:[1]},
            {id:"run_10",name:"Τρέξιμο 10 km/h",met:9.8,mins:70,time:"05:00",days:[2,3]},
            {id:"run_10",name:"Τρέξιμο 10 km/h",met:9.8,mins:40,time:"05:00",days:[5]},
            {id:"run_12",name:"Τρέξιμο 12 km/h",met:11.5,mins:210,time:"07:00",days:[6]}];
          _rebuildTrainDaysFromMet(c);renderMain();})()'''); pg.wait_for_timeout(300)
        t2 = tg(); w = 82
        ps = [t2[d]['p'] for d in range(7)]; ks = [t2[d]['k'] for d in range(7)]
        check(len(set(ps)) == 1, f'same protein every day ({ps})')
        check(1.2 <= ps[0] / w <= 2.0, f'protein {ps[0]} g = {ps[0]/w:.2f} g/kg (1.2-2.0)')
        check(ks[6] > ks[0] + 1500 and t2[6]['c'] > t2[0]['c'] + 300, f'race day: kcal/carbs carry the load, not protein (kcal {ks}, C {[t2[d]["c"] for d in range(7)]})')
        check(all(abs(t2[d]['p']*4 + t2[d]['c']*4 + t2[d]['f']*9 - ks[d]) <= 6 for d in range(7)), 'P/F/C add up to each day kcal')

        br.close()
finally:
    srv.terminate()

errors = [e for e in errors if 'favicon' not in e]
check(not errors, f'no console errors ({errors[:3]})')
print('\nFAILED: %d' % len(fails) if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
