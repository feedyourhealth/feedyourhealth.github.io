"""🧩 Μενού επιλογών (φάση 1): μηχανή ποσοτήτων, αποκλεισμοί/νηστεία/vegan/ανήλικοι, editor στο Πλάνο,
clientHasPlan στις λίστες, μπλοκ δημοσίευσης (το link έρχεται στη φάση 2), PDF el/en."""
import json, subprocess, sys, time, urllib.request, io
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

def plan():
    return {str(d): [{'name': 'Πρωινό', 'foods': [{'n': 'Γιαούρτι 2%', 'g': 200}]},
                     {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}]}] for d in range(7)}

RUN = [{'name': 'Τρέξιμο', 'met': 9.8, 'mins': 60, 'days': [0, 2, 4, 5], 'time': '18:00'}]
base = {'sex': 'M', 'age': 34, 'weight': 78, 'height': 180, 'activity': 'light', 'goal': 'maintain', 'goalMain': 'maintain',
        'allergenListsVer': 2, 'foodExclude': []}
gi = dict(base, id='gi', name='Γιώργος Παπαδόπουλος', phone='99123456', metActivities=RUN, weekPlan=plan(), shareToken='tok-gi')
ve = dict(base, id='ve', name='Βίκυ Vegan', sex='F', weight=60, height=165, dietType='vegan')
fa = dict(base, id='fa', name='Φώτης Νηστεία', dietType='orthodox_fasting', dietExceptionDays={'6': ['Λάδια', 'Ψάρια']})
al = dict(base, id='al', name='Άλκης Αλλεργία', allergyGroups=['fish'], foodExclude=['Ρύζι άσπρο (βρ.)'])
mi = dict(base, id='mi', name='Μάριος Ανήλικος', age=15, weight=55, height=168)
S = {'rows': {U1: {'data': {'clients': [gi, ve, fa, al, mi], 'customTemplates': []}, 'version': 1}}}

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
        pg.add_init_script('window.__SERVER=' + json.dumps(S) + ';window.__UID=' + json.dumps(U1) + ';localStorage.clear();'
                           'window.__opened=[];window.open=function(){var d={_h:"",write:function(s){this._h+=s;},close:function(){}};'
                           'var w={document:d,print:function(){}};window.__opened.push(w);return w;};')
        pg.goto(f'http://localhost:{PORT}/Dietologist.html', wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=10000)
        pg.wait_for_timeout(800)
        J = lambda js: pg.evaluate(js)
        J('window.__toasts=[];(function(){var e=showErrorToast,s=showSuccessToast;'
          'showErrorToast=function(m){__toasts.push("E:"+m);return e.apply(this,arguments);};'
          'showSuccessToast=function(m){__toasts.push("S:"+m);return s.apply(this,arguments);};})()')
        def C(cid): return f'clients.find(x=>x.id==="{cid}")'

        print('1. Στόχοι γευμάτων = ίδιοι με το «Αποστολή στόχων»')
        r = J(f'''(()=>{{var c={C("gi")}, sh=buildTargetsSheet(c), w=mixWeekTargets(c,'el'), bad=[];
          for(var d=0;d<7;d++){{ var rows=sh.days[d].rows.filter(x=>!x.train);
            if(rows.length!==w[d].meals.length) bad.push(d+':len');
            rows.forEach((x,i)=>{{ var m=w[d].meals[i]; if(!m||m.p!==x.p||m.c!==x.c||m.f!==x.f||m.time!==x.time) bad.push(d+':'+i); }}); }}
          return {{bad:bad, mon:w[0].meals.map(m=>m.slot+(m.tag?'/'+m.tag:'')), tue:w[1].kind}};}})()''')
        check(not r['bad'], f'per-meal P/C/F/time identical to targets sheet ({r["bad"][:5]})')
        check('dinner/post' in r['mon'] and r['tue'] == 'R', f'Mon: post-training dinner; Tue rest day ({r["mon"]})')

        print('2. Ποσότητες: υδατάνθρακας πρώτα, πρωτεΐνη ≥75%, στρογγυλοποίηση, ωμό/ψημένο')
        r = J(f'''(()=>{{var c={C("gi")}, ctx=mixCtx(c), m={{p:42,c:90,f:16,slot:'lunch'}};
          var pl=mixPlate(ctx,0,m,'Κοτόπουλο στήθος (ψητό)','Ρύζι άσπρο (βρ.)','el');
          var pa=mixPlate(ctx,0,m,'Κοτόπουλο στήθος (ψητό)','Μακαρόνια (βρ.)','el');
          var br=mixCarbPortion('Ψωμί ολικής άλεσης',140,'el'), tn=mixProteinPortion('Τόνος (κονσέρβα)',40,0,'el');
          var po=mixCarbPortion('Πατάτες (βρ.)',60,'el'), om=mixProteinPortion('__omelette',30,0,'el');
          return {{rice:pl.carb.main+' | '+pl.carb.alt, chick:pl.prot.main+' | '+pl.prot.alt, tot:[pl.tot.p,pl.tot.c,pl.tot.f].map(Math.round),
            pastaP:pa.prot.mac.p, g:[pl.prot.g,pl.carb.g,pa.prot.g], bread:br.main+' | '+br.alt+' | '+(br.fruit&&br.fruit.n), tuna:tn.main+' | '+tn.alt,
            pot:po.main+' | '+po.alt, om:om.main, omP:om.mac.p}};}})()''')
        check(r['rice'].endswith('g ωμό | ≈ 290 g μαγ.') and r['rice'].startswith('100 g'), f'rice raw first: {r["rice"]}')
        check('ψημένο' in r['chick'] and 'ωμό' in r['chick'], f'chicken cooked first, raw in brackets: {r["chick"]}')
        check(abs(r['tot'][0] - 42) <= 5 and abs(r['tot'][1] - 90) <= 5, f'chicken+rice plate ≈ target P42/C90 ({r["tot"]})')
        check(r['pastaP'] >= 42 * 0.75 - 1, f'protein never below 75% even with pasta ({r["pastaP"]:.1f} g)')
        check(all((g % 5 == 0) if g < 50 else (g % 10 == 0) for g in r['g']), f'5 g / 10 g steps ({r["g"]})')
        check(r['bread'].startswith('4 φέτες') and 'μπανάνα' in r['bread'], f'bread capped at 4 slices + fruit ({r["bread"]})')
        check('στραγγ.' in r['tuna'] and 'κονσέρβ' in r['tuna'] and 'ωμ' not in r['tuna'], f'tuna in cans, no raw ({r["tuna"]})')
        check('τεμ.' in r['pot'], f'potatoes in pieces ({r["pot"]})')
        check(r['om'].startswith('2 αυγά') and 'ασπράδια' in r['om'] and r['omP'] >= 30 * 0.75, f'omelette = 2 eggs + whites ({r["om"]})')

        print('3. Λάδι από το λίπος που περισσεύει')
        r = J(f'''(()=>{{var c={C("gi")}, m={{p:44,c:66,f:16}};
          var ch=mixProteinPortion('Κοτόπουλο στήθος (ψητό)',m.p,null,'el'), sa=mixProteinPortion('Σολομός (ψητός)',m.p,null,'el');
          return [mixOilSpoons(ch,m,1), mixOilSpoons(sa,m,1)];}})()''')
        check(r[0] >= 0.5 and r[1] == 0, f'chicken gets oil, salmon none on a low-fat meal ({r})')

        print('4. Μενού: προεπιλογή, αλλεργίες, αποκλεισμοί, vegan, νηστεία ανά μέρα')
        r = J(f'''(()=>{{var g=mixDefaultMenu({C("gi")}), a=mixDefaultMenu({C("al")}), v=mixDefaultMenu({C("ve")}), f={C("fa")};
          f.mixMenu=mixDefaultMenu(f); var w=mixBuildWeek(f,'el');
          var veg=mixBuildWeek(Object.assign({C("ve")},{{mixMenu:v}}),'el');
          var fishA=a.protein.filter(n=>FOODS[n]&&FOODS[n].cat==='Ψάρια');
          var lockedFish=mixCandidates(Object.assign({C("al")},{{mixMenu:a}}),'protein').filter(x=>x.n==='Σολομός (ψητός)')[0];
          var vAnimal=v.protein.filter(n=>n!=='__omelette'&&FOODS[n]&&['Κρέας','Ψάρια','Αυγά/Γαλακτ.'].indexOf(FOODS[n].cat)!==-1&&!FOODS[n].plantBased);
          var vLeg=veg.days[0].meals.filter(m=>m.main)[0].legumes;
          return {{g:[g.protein.length,g.carb.length,g.legume.length], fishA:fishA, lockedFish:lockedFish&&lockedFish.locked,
            riceA:a.carb.indexOf('Ρύζι άσπρο (βρ.)'), vProt:v.protein, vAnimal:vAnimal, vOm:v.protein.indexOf('__omelette'),
            vAdd:vLeg.map(x=>x.add&&x.add.n).filter(Boolean),
            fMonOil:w.days[0].oilOk, fSunOil:w.days[6].oilOk, fMonProt:w.days[0].meals.filter(m=>m.main)[0].prot.map(x=>x.n),
            fSunProt:w.days[6].meals.filter(m=>m.main)[0].prot.map(x=>x.n), fMonFat:w.days[0].meals.filter(m=>m.main)[0].fat.n}};}})()''')
        check(r['g'] == [12, 12, 6], f'default menu = ⭐ lists (12 protein / 12 carb / 6 legumes) ({r["g"]})')
        check(not r['fishA'] and r['lockedFish'] is True, 'fish allergy: no fish in menu, salmon 🔒 in the picker')
        check(r['riceA'] == -1, 'excluded food (white rice) not in menu')
        check(not r['vAnimal'] and r['vOm'] == -1 and 'Tofu (φυσικό)' in r['vProt'], f'vegan: only plant proteins ({r["vProt"]})')
        check(r['vAdd'] and all(n in ('Tofu (φυσικό)', 'Edamame (βρ.)', 'Λούπινα (βρ.)') for n in r['vAdd']), f'vegan legume add-on is plant ({r["vAdd"]})')
        check(r['fMonOil'] is False and r['fSunOil'] is True, 'fasting: no oil Mon, oil allowed on the exception day (Sun)')
        check(r['fMonFat'] in ('Ταχίνι', 'Αβοκάντο', 'Ελιές', None), f'fasting Mon: fat from allowed alternatives ({r["fMonFat"]})')
        check(not any(FOOD in r['fMonProt'] for FOOD in ['Σολομός (ψητός)', 'Λαβράκι (ψητό)']) and 'Σολομός (ψητός)' in r['fSunProt'],
              f'fasting: fish only on the exception day ({r["fSunProt"][:4]})')

        print('5. Ιδέες πρωινού/σνακ από πρότυπο + Αγαπημένα')
        J('saveFavoriteMeals([{key:"t1",name:"Πρωινό",foods:[{n:"Αυγά (ολόκληρα)",g:110},{n:"Ψωμί σίκαλης",g:60}]}])')
        r = J(f'''(()=>{{var c={C("gi")}; c.mixMenu=mixDefaultMenu(c); var w=mixBuildWeek(c,'el'), b=w.days[1].meals[0];
          return {{slot:b.slot, n:b.ideas.length, fav:b.ideas.filter(i=>i.src==='fav').length, k:b.ideas.map(i=>Math.round(i.tot.k)), tk:b.k}};}})()''')
        check(r['slot'] == 'breakfast' and r['n'] >= 3 and r['fav'] == 1, f'breakfast ideas from template + 1 favourite ({r["n"]}, fav {r["fav"]})')
        check(all(abs(k - r['tk']) / r['tk'] < 0.35 for k in r['k']), f'ideas scaled near the meal kcal ({r["tk"]}: {r["k"]})')

        print('6. Ανήλικος: όχι Μενού επιλογών')
        J('selectClient("mi"); renderMain(); swTab(1);'); pg.wait_for_timeout(300)
        check(J('document.getElementById("mix-start-btn").disabled') is True, 'button disabled on Στοιχεία')
        J('mixStart()')
        check(J(f'{C("mi")}.planMode') in (None, 'daily') and any('ανήλικ' in t for t in J('__toasts')), 'mixStart refuses with a reason')

        print('7. Editor στην καρτέλα Πλάνο')
        J('selectClient("gi"); renderMain(); swTab(1);'); pg.wait_for_timeout(300)
        J('delete ' + C('gi') + '.mixMenu; ' + C('gi') + '.planMode="daily"')
        pg.click('#mix-start-btn'); pg.wait_for_timeout(400)
        check(J(f'{C("gi")}.planMode') == 'mix' and J(f'!!{C("gi")}.mixMenu'), 'mixStart → planMode mix + menu')
        check(J('document.getElementById("s2").classList.contains("mix-mode")') and J('getComputedStyle(document.querySelector("#s2 .plan-wrap")).display') == 'none',
              'Πλάνο: mix mode, week table hidden')
        check(J('getComputedStyle(document.querySelector("#s2 .pt-save-btn")).display') == 'none', '«Αποθήκευση» (daily plan) hidden')
        check(J('[...document.querySelectorAll("#plan-export-menu button")].filter(b=>getComputedStyle(b).display!=="none").map(b=>b.textContent).join("|")')
              == 'PDF Μενού επιλογών|PDF Μενού επιλογών (English)', 'export menu = only the Mix PDFs')
        txt = J('document.getElementById("mix-editor").innerText')
        check('① Πρωτεΐνη' in txt and '② Υδατάνθρακας' in txt and 'Ή όσπρια' in txt and 'Έλεγχος συνδυασμών' in txt, 'editor sections rendered')
        check('Το ημερήσιο πλάνο δεν σβήνεται' in J('document.getElementById("mix-mode-switch").innerText'), 'note that the daily plan is kept')
        J('document.querySelector("#mix-editor [data-mx=day][data-d=\'1\']").click()'); pg.wait_for_timeout(200)
        check('Τρίτη' in J('document.querySelector(".mx-day-sub").innerText') and 'Ξεκούραση' in J('document.querySelector(".mx-day-sub").innerText'), 'day pill → Tuesday (rest)')
        J('document.querySelector("#mix-editor .mx-chip-rm[data-role=protein][data-n=\'Σολομός (ψητός)\']").click()'); pg.wait_for_timeout(200)
        check('Σολομός (ψητός)' not in J(f'{C("gi")}.mixMenu.protein') and 'Αφαιρέθηκε' in J('document.querySelector(".mx-undo").innerText'), 'remove protein + undo bar')
        J('document.querySelector(".mx-undo button").click()'); pg.wait_for_timeout(200)
        check('Σολομός (ψητός)' in J(f'{C("gi")}.mixMenu.protein'), '↩ Αναίρεση restores it')
        J('document.querySelector("#mix-editor [data-mx=pick][data-role=protein]").click()'); pg.wait_for_timeout(200)
        pg.fill('#mix-pick-q', 'μπακαλ'); pg.wait_for_timeout(150)
        rows = J('[...document.querySelectorAll("#mix-pick-list .mx-pick-row")].map(b=>b.innerText)')
        check(len(rows) == 1 and 'Μπακαλιάρος' in rows[0], f'picker search ({rows})')
        J('document.querySelector("#mix-pick-list .mx-pick-row").click()'); pg.wait_for_timeout(200)
        check('Μπακαλιάρος (ψητός)' in J(f'{C("gi")}.mixMenu.protein'), 'added from picker')
        nb = J('document.querySelectorAll(".mx-check-list [data-mx=hide-combo]").length')
        if nb:
            J('document.querySelector(".mx-check-list [data-mx=hide-combo]").click()'); pg.wait_for_timeout(200)
            check(len(J(f'{C("gi")}.mixMenu.hiddenCombos')) == 1 and 'κρυμμένος' in J('document.querySelector(".mx-check").innerText'), 'hide a flagged combination')
        J('document.querySelector("#mix-editor [data-rule=fish]").value="3"; document.querySelector("#mix-editor [data-rule=fish]").dispatchEvent(new Event("change",{bubbles:true}))'); pg.wait_for_timeout(150)
        check(J(f'{C("gi")}.mixMenu.rules.fish') == 3, 'weekly rule saved')
        check(J(f'Object.keys({C("gi")}.weekPlan).length') == 7, 'daily weekPlan untouched')

        print('8. Δημοσίευση μπλοκαρισμένη (φάση 1) — κανένα κρυφό παλιό πλάνο δεν φεύγει')
        nsp = J(f'({C("gi")}.savedPlans||[]).length')
        J('__toasts=[]; openPublishModal()'); pg.wait_for_timeout(200)
        check(not J('!!document.getElementById("publish-overlay")') and any('Μενού επιλογών' in t for t in J('__toasts')), 'Στείλε → toast, no modal')
        err = J(f'Cloud.publishPlan({C("gi")}).then(()=>"published",e=>e.message)')
        check('Μενού επιλογών' in err, f'Cloud.publishPlan rejects for mix clients ({err[:40]})')
        check(J(f'({C("gi")}.savedPlans||[]).length') == nsp, 'nothing recorded in plan history')

        print('9. clientHasPlan: λίστα Πελατών / Διατροφές')
        J(f'{C("ve")}.mixMenu=mixDefaultMenu({C("ve")}); {C("ve")}.planMode="mix";')
        check(J(f'clientHasPlan({C("ve")})') and not J(f'clientHasPlan({C("al")})'), 'clientHasPlan counts the Mix menu')
        J('swTab(7)'); pg.wait_for_timeout(300)
        J('setClientQuickFilter("noplan")'); pg.wait_for_timeout(200)
        lst = J('document.getElementById("client-list").innerText')
        check('Βίκυ' not in lst and 'Άλκης' in lst, '«Χωρίς πλάνο» filter skips the Mix client')
        J('setClientQuickFilter("all")')
        check(J(f'qaPlanStatusText({C("ve")})') == 'έχει Μενού επιλογών', 'quick-action status text')

        print('10. PDF el / en')
        J('selectClient("gi"); renderMain(); swTab(2);'); pg.wait_for_timeout(300)
        J('exportMixPDF()'); J('exportMixPDF("en")')
        h_el = J('window.__opened[window.__opened.length-2].document._h'); h_en = J('window.__opened[window.__opened.length-1].document._h')
        check('Το μενού σου — Γιώργος' in h_el and '① Πρωτεΐνη' in h_el and 'Κοτόπουλο στήθος (ψητό)' in h_el and 'ωμό' in h_el, 'Greek PDF content')
        check('Δευτέρα · Τετάρτη · Παρασκευή' in h_el, 'training days with identical targets grouped')
        check('Your menu' in h_en and 'Chicken Breast' in h_en and 'raw' in h_en and 'Πρωτεΐνη' not in h_en, 'English PDF content')
        hid = J(f'{C("gi")}.mixMenu.hiddenCombos')
        if hid: check('Απόφυγε τους συνδυασμούς' in h_el, 'hidden combinations listed in the PDF')

        print('11. Πίσω σε Ημερήσιο')
        J('mixSetMode("daily")'); pg.wait_for_timeout(300)
        check(not J('document.getElementById("s2").classList.contains("mix-mode")') and J('getComputedStyle(document.querySelector("#s2 .plan-wrap")).display') != 'none',
              'daily mode: week table back')
        check(J(f'!!{C("gi")}.mixMenu') and J(f'{C("gi")}.planMode') == 'daily', 'menu kept for next time')
        J(f'{C("gi")}.age=16'); J('mixSetMode("mix")')
        check(J(f'{C("gi")}.planMode') == 'daily', 'age changed to <18 → cannot switch to Mix')

        print('12. Δημιουργία ημερήσιου πλάνου χωρίς αλλαγή (resolveClientTemplate)')
        J(f'{C("gi")}.age=34; {C("gi")}.selectedTemplate=null;')
        J('selectClient("gi"); renderMain(); swTab(1); genPlan();'); pg.wait_for_timeout(600)
        check(J(f'Object.keys({C("gi")}.weekPlan).length') == 7, 'genPlan still builds a week')

        real = [e for e in errors if 'favicon' not in e and 'Failed to load resource' not in e]
        check(not real, f'no console errors ({real[:3]})')
        br.close()
finally:
    srv.terminate()
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
