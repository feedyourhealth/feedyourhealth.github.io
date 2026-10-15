"""Clinical protocols: diabetes avoid-list (no eggplant), protocol fiber target, protocol swaps, RED-S flags/gate/home card,
hypertension/cholesterol approved ban + «με μέτρο» lists (exact «=Βούτυρο»)."""
import json, subprocess, sys, time, urllib.request, io
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8892
U1 = 'user-111'
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

base = {'sex': 'F', 'age': 30, 'weight': 60, 'height': 165, 'activity': 'light', 'goal': '0', 'allergenListsVer': 2, 'foodExclude': []}
cd = dict(base, id='cd', name='Διαβήτης', medConditions={'diabetes': True})
cc = dict(base, id='cc', name='Χοληστερόλη', medConditions={'cholesterol': True}, weekPlan={str(d): [
    {'name': 'Πρωινό', 'foods': [{'n': 'Βούτυρο', 'g': 10}, {'n': 'Γάλα πλήρες', 'g': 200}, {'n': 'Φυστικοβούτυρο', 'g': 15}]},
    {'name': 'Μεσημεριανό', 'foods': [{'n': 'Ψωμί λευκό', 'g': 60}, {'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}]}] for d in range(7)})
cr = dict(base, id='cr', name='Αμηνόρροια', goal='-400', menstrualCycle='absent', sport='running')
ci = dict(base, id='ci', name='Ακανόνιστος', goal='-300', menstrualCycle='irregular')
ck = dict(base, id='ck', name='Ακανόνιστος χωρίς έλλειμμα', goal='0', menstrualCycle='irregular')
cm = dict(base, id='cm', name='Άνδρας', sex='M', goal='-400', menstrualCycle='absent')
cs = dict(base, id='cs', name='Νέα σημείωση', goal='-300')
ch = dict(base, id='ch', name='Υπέρταση', medConditions={'hypertension': True})
cc2 = dict(base, id='cc2', name='Χοληστερόλη 2', medConditions={'cholesterol': True})
S = {'rows': {U1: {'data': {'clients': [cd, cc, cr, ci, ck, cm, cs, ch, cc2], 'customTemplates': []}, 'version': 1}}}

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
        def dlg(): return pg.get_attribute('#confirmDialog', 'data-open') == 'true'
        def T(expr): return pg.evaluate(expr)
        def close_dialogs():
            for _ in range(4):
                if dlg(): pg.click('#confirmBtn'); pg.wait_for_timeout(400)

        print('1. Diabetes avoid-list')
        r = T('(()=>{var c=clients.find(x=>x.id==="cd"); var ex=getProtocolAvoidFoods(c).map(normalizeGreekText); var f=n=>foodIsExcludedByNameOrIngredient(n,ex); return {egg:f("Μελιτζάνες"), honey:f("Μέλι άβραστο"), soyHoney:f("Σάλτσα σόγιας-μελιού"), egRecipes:Object.keys(FOODS).filter(n=>/μελιτζαν/i.test(normalizeGreekText(JSON.stringify(FOODS[n].ingredients||[])))&&!/μελι άβραστ|μελι αβραστ/i.test(JSON.stringify(FOODS[n].ingredients||[]))).filter(f).length};})()')
        check(not r['egg'], 'Μελιτζάνες no longer excluded for diabetes')
        check(r['honey'] and r['soyHoney'], 'honey + honey-soy sauce still excluded')
        check(r['egRecipes'] == 0, f"no eggplant recipe excluded only because of «Μέλι» ({r['egRecipes']})")
        T('selectClient("cd"); renderMain();'); pg.wait_for_timeout(400)
        T('genPlanWithUndo()'); pg.wait_for_timeout(500); close_dialogs()
        r = T('(()=>{var c=getC(), n=0, honey=0; Object.keys(c.weekPlan).forEach(d=>c.weekPlan[d].forEach(m=>m.foods.forEach(f=>{n++; if(f.n==="Μέλι άβραστο")honey++;}))); return {n:n, honey:honey};})()')
        check(r['n'] > 0 and r['honey'] == 0, f"diabetic plan generated with no honey ({r})")

        print('2. Protocol fiber target in the weekly banner')
        T('swTab && swTab("plan")'); pg.wait_for_timeout(400); T('renderWeekTable()'); pg.wait_for_timeout(300)
        txt = T('document.getElementById("week-con").innerText')
        check('30g/ημ.' in txt and 'Σακχαρώδης Διαβήτης' in txt, 'banner shows 30 g/day protocol target + protocol name')
        check('210g στόχος' in txt, 'weekly target = 30×7 = 210 g (above the 25 g DRI for women)')
        T('selectClient("cc"); renderMain();'); pg.wait_for_timeout(300)
        T('swTab && swTab("plan")'); pg.wait_for_timeout(300); T('renderWeekTable()'); pg.wait_for_timeout(300)
        txt = T('document.getElementById("week-con").innerText')
        check('Κάτω από τον στόχο πρωτοκόλλου' in txt, 'low-fiber cholesterol plan shows the protocol warning with suggestions')

        print('3. Protocol swaps (cholesterol)')
        r = T('findProtocolSwapsInPlan(getC()).map(s=>s.from+">"+s.to+"x"+s.count)')
        check(r == ['Βούτυρο>Ελαιόλαδοx7', 'Γάλα πλήρες>Γάλα φρέσκο 1.5% Λιπαράx7', 'Ψωμί λευκό>Ψωμί ολικής άλεσηςx7'], f'swaps found, peanut butter untouched ({r})')
        check('Εφάρμοσε αντικαταστάσεις' in txt, 'swap banner + button shown above the plan')
        T('''document.querySelector("#week-con button[onclick='applyProtocolSwaps()']").click()'''); pg.wait_for_timeout(400)
        check(dlg() and 'Βούτυρο → Ελαιόλαδο (×7)' in pg.inner_text('#confirmMessage'), 'confirm dialog lists the swaps')
        pg.click('#confirmBtn'); pg.wait_for_timeout(500)
        r = T('getC().weekPlan[0][0].foods.map(f=>f.n+":"+f.g).concat(getC().weekPlan[0][1].foods.map(f=>f.n+":"+f.g))')
        check(r == ['Ελαιόλαδο:8', 'Γάλα φρέσκο 1.5% Λιπαρά:200', 'Φυστικοβούτυρο:15', 'Ψωμί ολικής άλεσης:60', 'Κοτόπουλο στήθος (ψητό):150'], f'applied: butter 10g→olive oil 8g (same kcal), others same grams ({r})')
        check(T('findProtocolSwapsInPlan(getC()).length') == 0 and 'Εφάρμοσε αντικαταστάσεις' not in T('document.getElementById("week-con").innerText'), 'banner gone after applying')
        T('undo()'); pg.wait_for_timeout(400)
        check(T('getC().weekPlan[0][0].foods[0].n+":"+getC().weekPlan[0][0].foods[0].g') == 'Βούτυρο:10', '↶ Αναίρεση restores the original plan')

        print('4. RED-S flags')
        r = T('(()=>{var o={}; ["cr","ci","ck","cm"].forEach(id=>{o[id]=getRedsFlags(clients.find(x=>x.id===id)).map(f=>f.level+(f.fix?"+fix":""));}); return o;})()')
        check(r['cr'] == ['block+fix'], f"absent cycle + deficit → block with fix ({r['cr']})")
        check(r['ci'] == ['warn'] and r['ck'] == [], f"irregular → warn only with deficit ({r['ci']} / {r['ck']})")
        check(r['cm'] == [], 'male client never flagged')
        T('selectClient("cr"); renderMain();'); pg.wait_for_timeout(400)
        T('genPlanWithUndo()'); pg.wait_for_timeout(400)
        check(dlg() and 'RED-S' in pg.inner_text('#confirmMessage') and 'Διατήρηση' in pg.inner_text('#confirmBtn'), 'genPlan gate: RED-S dialog with «Στόχος → Διατήρηση & συνέχεια»')
        pg.click('#confirmBtn'); pg.wait_for_timeout(500); close_dialogs()
        r = T('({goal:getC().goal, plan:Object.keys(getC().weekPlan||{}).length})')
        check(r['goal'] == '0' and r['plan'] == 7, f'goal → maintenance and plan generated ({r})')

        print('5. Home card + save-time prompt')
        T('clients.find(x=>x.id==="cr").goal="-400"')
        r = T('homeRedsAlerts().map(c=>c.id).sort()')
        check(r == ['ci', 'cr'], f'home RED-S card lists absent + irregular-with-deficit only ({r})')
        T('selectClient("cs"); renderMain(); openMedicalConditionsModal();'); pg.wait_for_timeout(400)
        T('document.querySelector(\'input[name="menstrual"][value="absent"]\').checked=true; saveMedicalConditions();'); pg.wait_for_timeout(600)
        check(dlg() and 'Κίνδυνος RED-S' in pg.inner_text('#confirmTitle'), 'saving «Απών» with a loss goal offers Διατήρηση')
        pg.click('#confirmBtn'); pg.wait_for_timeout(400)
        check(T('getC().goal') == '0', 'accepted → goal 0')

        print('6. Hypertension / cholesterol lists (approved 2026-10-15)')
        r = T("""(()=>{var o={}; [["ch",["Αμπελόφυλλα (τουρσί)","Λούτζα","Κύβο λαχανικών","Σάλτσα σόγιας-μελιού","Σάλτσα σόγιας (μειωμένο αλάτι)","Αλάτι"],["Τυρί φέτα","Ελιές","Χαλλούμι (ψητό)"]],
          ["cc2",["Βούτυρο","Κρέμα γάλακτος","Cream cheese","Σαγανάκι (τηγανητό)","Λούτζα"],["Φυστικοβούτυρο","Αμυγδαλοβούτυρο","Τυρί φέτα","Αρνί (ψητό)","Βοδινός κιμάς (μαγ.)"]]].forEach(function(x){
            var c=clients.find(k=>k.id===x[0]); var ex=getProtocolAvoidFoods(c).map(normalizeGreekText);
            o[x[0]+"_banned_missed"]=x[1].filter(n=>!foodIsExcludedByNameOrIngredient(n,ex));
            o[x[0]+"_allowed_hit"]=x[2].filter(n=>foodIsExcludedByNameOrIngredient(n,ex)); });
          var ex2=getProtocolAvoidFoods(clients.find(k=>k.id==="cc2")).map(normalizeGreekText);
          var ing=n=>JSON.stringify((FOODS[n]&&FOODS[n].ingredients)||[])+JSON.stringify((typeof FYH_RECIPE_EXPAND!=="undefined"&&FYH_RECIPE_EXPAND[n])||{});
          var cc2=clients.find(k=>k.id==="cc2");
          o.butterRecipes=getRecipeExclusionConflicts({foods:[{n:"Αβοκάντο",g:80},{n:"Βούτυρο",g:12}]},cc2).map(f=>f.n).join();
          o.pbRecipesHit=getRecipeExclusionConflicts({foods:[{n:"Βρώμη (ωμή)",g:50},{n:"Φυστικοβούτυρο",g:15},{n:"Αμυγδαλοβούτυρο",g:15}]},cc2).map(f=>f.n);
          o.comboPB=comboHasExcludedFood([{n:"Φυστικοβούτυρο"}],["=βούτυρο"]); o.comboB=comboHasExcludedFood([{n:"Βούτυρο"}],["=βούτυρο"]);
          return o;})()""")
        check(r['ch_banned_missed'] == [] and r['ch_allowed_hit'] == [], f"hypertension: bans hit, feta/olives/halloumi allowed ({r['ch_banned_missed']} / {r['ch_allowed_hit']})")
        check(r['cc2_banned_missed'] == [] and r['cc2_allowed_hit'] == [], f"cholesterol: bans hit, peanut/almond butter + red meat allowed ({r['cc2_banned_missed']} / {r['cc2_allowed_hit']})")
        check(r['butterRecipes'] == 'Βούτυρο' and r['pbRecipesHit'] == [], f"recipes with butter excluded ({r['butterRecipes']}), peanut-butter recipes kept ({r['pbRecipesHit']})")
        check(r['comboB'] and not r['comboPB'], 'saved-combo matcher honours exact «=Βούτυρο»')
        for cid in ['ch', 'cc2']:
            T(f'selectClient("{cid}"); renderMain();'); pg.wait_for_timeout(300)
            T('genPlanWithUndo()'); pg.wait_for_timeout(500); close_dialogs()
            r = T("""(()=>{var c=getC(), ex=getProtocolAvoidFoods(c).map(normalizeGreekText), bad=[], n=0; Object.keys(c.weekPlan).forEach(d=>c.weekPlan[d].forEach(m=>m.foods.forEach(f=>{n++; if(foodIsExcludedByNameOrIngredient(f.n,ex))bad.push(f.n);}))); return {n:n,bad:bad};})()""")
            check(r['n'] > 0 and r['bad'] == [], f"{cid}: generated plan has no banned food ({r})")
        r = T("""(()=>{var c=clients.find(k=>k.id==="cc2"); c.weekPlan={0:[{name:"Πρωινό",foods:[{n:"Βούτυρο",g:10},{n:"Φυστικοβούτυρο",g:15},{n:"Τυρί φέτα",g:30}]}],1:[{name:"Πρωινό",foods:[{n:"Τυρί φέτα",g:30},{n:"Αρνί (ψητό)",g:150}]}]};
          var w=getProtocolWarnHits(c); scrubExcludedFoodsFromWeekPlan(c.weekPlan, buildEffectiveExclusionList(c));
          return {w:w.map(x=>x.hits.map(h=>h.term+"x"+h.count).join(",")), after:c.weekPlan[0][0].foods.map(f=>f.n)};})()""")
        check(r['w'] == ['Τυρί φέταx2,Αρνί (ψητό)x1'], f"warn hits counted ({r['w']})")
        check('Βούτυρο' not in r['after'] and 'Φυστικοβούτυρο' in r['after'], f"scrub removes butter, keeps peanut butter ({r['after']})")
        T('selectClient("cc2"); renderMain(); swTab && swTab("plan")'); pg.wait_for_timeout(300); T('renderWeekTable()'); pg.wait_for_timeout(200)
        txt = T('document.getElementById("week-con").innerText')
        check('πολλά κορεσμένα' in txt and 'Τυρί φέτα ×2' in txt, 'warn banner shown above the plan')
        T('showMedicalProtocol("cholesterol")'); pg.wait_for_timeout(200)
        card = T('document.querySelector("[data-medical-modal]").innerText')
        check('Με μέτρο' in card and '=Βούτυρο' not in card and 'Βούτυρο' in card, 'protocol card lists «Με μέτρο» and shows butter without «=»')
        br.close()
finally:
    srv.terminate()
errs = [e for e in errors if 'favicon' not in e]
if errs: fails.append('console errors: ' + ' | '.join(errs[:6]))
print('\nRESULT:', 'ALL PASSED' if not fails else f'{len(fails)} FAILED')
for f in fails: print(' -', f)
sys.exit(1 if fails else 0)
