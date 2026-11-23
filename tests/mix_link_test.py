"""🧩 Μενού επιλογών (φάση 2): αποστολή → snapshot (mode mix, ίδια days[].meals, χωρίς ψώνια) → plan.html
«Μενού» (πιάτο / όσπρια / ιδέες / αναζήτηση / «Αυτό έφαγα» / εβδομάδα) → Αρχική μετράει το πιάτο →
η εφαρμογή το βλέπει ως «ακολούθησε» (όχι αντικατάσταση) · ru/en · ξεπερασμένο link · Ιστορικό."""
import json, subprocess, sys, time, urllib.request, io, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8898
U1 = 'user-111'
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

WD = datetime.date.today().weekday()
RUN = [{'name': 'Τρέξιμο', 'met': 9.8, 'mins': 60, 'days': [0, 2, 4, 5], 'time': '18:00'}]
DAY = [{'name': 'Πρωινό', 'foods': [{'n': 'Γιαούρτι 2%', 'g': 200}]}, {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}]}]
base = {'sex': 'M', 'age': 34, 'weight': 78, 'height': 180, 'activity': 'light', 'goal': 'maintain', 'goalMain': 'maintain',
        'allergenListsVer': 2, 'foodExclude': [], 'metActivities': RUN,
        'trainDays': [True, False, True, False, True, True, False], 'trainTimesByDay': ['18:00', '', '18:00', '', '18:00', '18:00', '']}
gi = dict(base, id='gi', name='Γιώργος Παπαδόπουλος', shareToken='tokM', weekPlan={str(i): DAY for i in range(7)})
iv = dict(base, id='iv', name='Ivan Petrov', lang='ru', shareToken='tokR')
da = dict(base, id='da', name='Δάφνη Ημερήσιο', sex='F', shareToken='tokD', weekPlan={str(i): DAY for i in range(7)})
SERVER = {'rows': {U1: {'data': {'clients': [gi, iv, da], 'customTemplates': []}, 'version': 5}}, 'shared': {},
          'tables': {'client_meal_log': [], 'checkins': [], 'client_alt_reject': []}}

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(bypass_csp=True, viewport={'width': 1300, 'height': 900})
        ctx.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        ctx.route('**/*.supabase.co/**', lambda r: r.abort())
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.add_init_script('window.__SERVER=' + json.dumps(SERVER) + ';window.__UID=' + json.dumps(U1) + ';'
            + 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();'
            + "localStorage.setItem('fyh_cache_owner'," + json.dumps(U1) + ");localStorage.setItem('fyh_cache_base_version','5');}")
        pg.goto(f'http://localhost:{PORT}/Dietologist.html', wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=15000)
        pg.wait_for_timeout(800)
        J = lambda s: pg.evaluate(s)
        def C(cid): return f'clients.find(x=>x.id==="{cid}")'
        def publish(cid, tok):
            return J(f"Cloud.publishPlan({C(cid)}).then(()=>window.__SERVER.shared['{tok}'].snapshot)")

        print('1. Snapshot του Μενού επιλογών')
        J(f'{C("gi")}.mixMenu=mixDefaultMenu({C("gi")}); {C("gi")}.planMode="mix";')
        J(f'{C("iv")}.mixMenu=mixDefaultMenu({C("iv")}); {C("iv")}.planMode="mix";')
        nsp = J(f'({C("gi")}.savedPlans||[]).length')
        snap = publish('gi', 'tokM')
        size = len(json.dumps(snap, ensure_ascii=False).encode('utf-8'))
        d0 = snap['days'][0]
        mains = [m for m in d0['meals'] if m.get('mix') == 'plate']
        ideas = [m for m in d0['meals'] if m.get('mix') == 'ideas']
        check(snap.get('mode') == 'mix' and snap.get('shopping') == [] and len(snap['days']) == 7, 'mode mix, 7 days, no shopping list')
        check(len(mains) == 2 and len(ideas) >= 2 and all(m.get('mq') is not None for m in mains), f'Mon: 2 main plates + idea meals ({[m["label"] for m in d0["meals"]]})')
        check(all('kcal' in m and 'macros' in m and m['foods'] == [] for m in d0['meals']), 'meal slots carry their targets (same shape as daily)')
        check(any(m['tag'] == 'post' for m in d0['meals']) and d0['isTrain'], 'training day: «μετά» tag on a meal')
        q = snap['mix']['q'][mains[0]['mq']]
        foods = snap['mix']['foods']
        check(len(q['p']) > 12 and len(q['c']) > 12 and len(q['l']) >= 6, f'menu + more items per meal ({len(q["p"])} p / {len(q["c"])} c / {len(q["l"])} l)')
        check(sum(1 for f in foods if f.get('s') and f['r'] == 'p') == 12, '12 protein items flagged as the dietitian\'s menu')
        check(any(f.get('fi') for f in foods) and any(f.get('rm') for f in foods), 'fish / red-meat flags for the weekly counters')
        check(size < 200000, f'snapshot size {size // 1024} KB')
        check(J(f'({C("gi")}.savedPlans||[]).length') == nsp and J(f'{C("gi")}.mixSent.length') == 1, 'hidden daily plan NOT recorded; menu recorded in mixSent')
        check(J(f'Cloud.isStale({C("gi")})') is False, 'fresh link is not stale')
        J(f'{C("gi")}.mixMenu.protein=({C("gi")}.mixMenu.protein).filter(n=>n!=="Γαρίδες (βραστές)")')
        check(J(f'Cloud.isStale({C("gi")})') is True, 'menu change → link stale')
        J(f'{C("gi")}.mixMenu.protein.push("Γαρίδες (βραστές)")')

        print('2. Ημερήσιος πελάτης: όπως πριν')
        sd = publish('da', 'tokD')
        check(sd.get('mode') == 'daily' and sd.get('shopping') and sd['days'][0]['meals'][0]['foods'], 'daily snapshot unchanged (foods + shopping)')

        shared = J('window.__SERVER.shared')
        def link(tok):
            cp = ctx.new_page()
            cp.set_viewport_size({'width': 390, 'height': 844})
            cp.on('pageerror', lambda e: errors.append('plan: ' + str(e)))
            cp.on('console', lambda m: errors.append('plan: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            cp.add_init_script('window.__SERVER=' + json.dumps({'shared': shared}) + f";localStorage.setItem('fyh_portal_{tok}_onboardingSeen','1');localStorage.setItem('fyh_portal_{tok}_goalHeroSeen','1');")
            cp.goto(f'http://localhost:{PORT}/plan.html?t={tok}', wait_until='domcontentloaded')
            cp.wait_for_selector('#todayMealsCard', timeout=8000)
            cp.wait_for_timeout(300)
            return cp

        print('3. Link: Αρχική + navigation')
        cp = link('tokM')
        E = cp.evaluate
        navs = E('[...document.querySelectorAll(".nav button")].map(b=>b.innerText.trim())')
        check('Μενού' in navs and 'Ψώνια' not in navs and 'Πλάνο' not in navs, f'nav: Μενού, no Ψώνια ({navs})')
        check(E('!!document.querySelector(".hdr .ti-printer")') is False, 'no daily-plan PDF button')
        home = E('document.getElementById("todayMealsCard").innerText')
        check('Φτιάξε το πιάτο σου →' in home and 'Διάλεξε ιδέα →' in home, 'home rows invite to build / pick')
        check('Λίστα ψώνια' not in E('document.querySelector(".quick").innerText'), 'no shopping quick card')
        tday = snap['days'][WD]['meals']
        lunch_i = next(i for i, m in enumerate(tday) if m['mix'] == 'plate')
        cp.locator('#todayMealsCard .meal').nth(lunch_i).click(); cp.wait_for_timeout(200)
        check(E('curView') == 'plan' and E('document.querySelector(".mx-ml.on")?.dataset.m') == str(lunch_i), 'tap on main meal → Μενού at that meal')

        print('4. Φτιάξε το πιάτο → Αυτό έφαγα')
        tiles = E('[...document.querySelectorAll(".mx-tile[data-mxa=p]")].map(t=>t.innerText.replace(/\\n/g," "))')
        check(len(tiles) == 12 and 'ψημένο' in tiles[0] and 'ωμό' in tiles[0], f'12 protein tiles with cooked + raw ({tiles[0]})')
        salmon_i = next(i for i, f in enumerate(foods) if f['el'] == 'Σολομός (ψητός)')
        cp.click(f'.mx-tile[data-mxa=p][data-i="{salmon_i}"]'); cp.wait_for_timeout(150)
        check(E(f'!!document.querySelector(".mx-tile[data-mxa=p][data-i=\\"{salmon_i}\\"].on")'), 'protein tile selected')
        plate = E('document.querySelector(".mx-plate").innerText')
        check('Σολομός' in plate and 'Πρωτεΐνη' in plate and '/' in plate and 'Λαχανικά' in plate, 'plate summary with bars')
        cp.click('.mx-btn[data-mxa=eat]'); cp.wait_for_timeout(300)
        v = E(f'getMeals()[{lunch_i}]')
        check(v and v.get('mx') == 1 and v.get('k', 0) > 300 and v.get('m', {}).get('p', 0) > 20 and v.get('t', {}).get('fi') == 1, f'pick stored {{mx,k,m,t}} ({v and v.get("d")})')
        check('Έφαγες' in E('document.querySelector(".mx-body").innerText'), 'banner «Έφαγες» + undo')
        E('flushMealSync()'); cp.wait_for_timeout(400)
        calls = E('(window.__SERVER.rpcCalls||[]).filter(c=>c[0]==="save_meal_checkin").length')
        check(calls >= 1, f'synced via save_meal_checkin ({calls})')
        check('🐟 Ψάρι 1 /' in E('document.querySelector(".mx-week").innerText'), 'weekly fish counter = 1')
        cp.evaluate('go("home")'); cp.wait_for_timeout(200)
        st = E('document.querySelector(".stats").innerText')
        check(str(v['k']) in st.replace('.', '') or f"{v['k']:,}".replace(',', '.') in st, f'home kcal bar counts the plate ({v["k"]})')
        check('Σολομός' in E('document.getElementById("todayMealsCard").innerText'), 'home row shows the plate name')

        print('5. Όσπρια, αναζήτηση, ιδέες, αναίρεση')
        cp.locator('#todayMealsCard .meal').nth(lunch_i).click(); cp.wait_for_timeout(200)
        cp.click('.alt-banner [data-mxa=unpick]'); cp.wait_for_timeout(200)
        check(not E(f'getMeals()[{lunch_i}]'), 'undo clears the pick')
        cp.click('.mx-seg [data-v=leg]'); cp.wait_for_timeout(150)
        lt = E('[...document.querySelectorAll(".mx-tile[data-mxa=l]")].map(t=>t.innerText.replace(/\\n/g," "))')
        check(len(lt) == 6 and ('ξερ' in lt[0]), f'legume tiles, dry weight first ({lt[0]})')
        check('ελαιόλαδο' in E('document.querySelector(".mx-plate").innerText'), 'legume plate lists the extras')
        cp.click('.mx-seg [data-v=plate]'); cp.wait_for_timeout(150)
        cp.click('.mx-morebtn[data-k=p]'); cp.wait_for_timeout(150)
        cp.fill('.mx-search[data-mxs=p]', 'μπακαλ'); cp.wait_for_timeout(250)
        res = E('[...document.querySelectorAll(".mx-search[data-mxs=p] + .mx-tiles .mx-tile")].map(t=>t.innerText.replace(/\\n/g," "))')
        check(len(res) == 1 and 'Μπακαλιάρος' in res[0], f'search in «more» ({res})')
        check(E('document.activeElement && document.activeElement.classList.contains("mx-search")'), 'search keeps focus while typing')
        br_i = next(i for i, m in enumerate(tday) if m['mix'] == 'ideas')
        cp.click(f'.mx-ml[data-m="{br_i}"]'); cp.wait_for_timeout(150)
        n_ideas = E('document.querySelectorAll(".mx-idea").length')
        check(n_ideas >= 2, f'idea list ({n_ideas})')
        cp.click('.mx-idea [data-mxa=idea]'); cp.wait_for_timeout(250)
        iv_ = E(f'getMeals()[{br_i}]')
        check(iv_ and iv_.get('mx') == 1 and iv_.get('k', 0) > 0, 'idea pick stored with kcal')
        cp.click('.mx-btn.sec[data-mxa=help]') if E('!!document.querySelector(".mx-btn.sec[data-mxa=help]")') else None
        cp.click(f'.mx-ml[data-m="{lunch_i}"]'); cp.wait_for_timeout(150)
        cp.click('.mx-btn.sec[data-mxa=help]'); cp.wait_for_timeout(150)
        check('παλάμη' in E('document.querySelector(".mx-hand").innerText'), '«Δεν βρίσκω» → hand portions')

        print('6. Η εφαρμογή: επιλογή από το Μενού = «ακολούθησε», όχι αντικατάσταση')
        mapv = E('JSON.parse(localStorage.getItem("fyh_portal_tokM_meals")||"{}")')
        st = J("(()=>{var log=%s, k=Object.keys(log)[0]; return progressSwapStats(%s,[k],log,{},k);})()" % (json.dumps(mapv, ensure_ascii=False), C('gi')))
        check(st['alt'] == 0 and st['planned'] >= 1, f'progress: planned {st["planned"]}, swaps {st["alt"]}')
        cp.close()

        print('7. Link στα ρωσικά')
        sr = publish('iv', 'tokR'); shared = J('window.__SERVER.shared')
        rf = sr['mix']['foods']
        chick = next(f for f in rf if f['el'] == 'Κοτόπουλο στήθος (ψητό)')
        check(chick['n'] == J('FOODS["Κοτόπουλο στήθος (ψητό)"].ru'), f'food names in Russian ({chick["n"]})')
        rq = sr['mix']['q'][next(m for m in sr['days'][0]['meals'] if m['mix'] == 'plate')['mq']]
        check(any('сыр' in r[2] for r in rq['p']) and any('масла' in r[3] for r in rq['p']), f'raw / oil text in Russian ({rq["p"][0][1:4]})')
        check(sr['days'][0]['meals'][0]['label'] == 'Завтрак', 'meal labels in Russian')
        cr = link('tokR')
        navs = cr.evaluate('[...document.querySelectorAll(".nav button")].map(b=>b.innerText.trim())')
        check('Меню' in navs, f'nav in Russian ({navs})')
        cr.evaluate('go("plan")'); cr.wait_for_timeout(200)
        txt = cr.evaluate('document.querySelector(".mx-body").innerText')
        check(not any(w in txt for w in ['Πρωτεΐνη', 'Υδατάνθρακας', 'Φτιάξε']), 'no Greek UI text in the Russian menu')
        cr.close()

        real = [e for e in errors if 'favicon' not in e and 'Failed to load resource' not in e]
        check(not real, f'no console errors ({real[:3]})')
        br.close()
finally:
    srv.terminate()
print('\n' + ('ALL PASSED' if not fails else f'{len(fails)} FAILED'))
sys.exit(1 if fails else 0)
