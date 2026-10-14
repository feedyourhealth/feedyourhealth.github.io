"""⚠️ Αλλεργίες section: intake apply, enforcement in genPlan/insert/publish/snapshot, red grid, header."""
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

def plan_with(food):
    return {str(d): [{'name': 'Πρωινό', 'foods': [{'n': 'Γιαούρτι 2%', 'g': 200}, {'n': food, 'g': 30}]},
                     {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}, {'n': 'Ρύζι λευκό (βρ.)', 'g': 150}]}] for d in range(7)}

base = {'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod', 'goal': 'maintain', 'allergenListsVer': 2, 'foodExclude': []}
ca = dict(base, id='ca', name='Άννα Ερωτηματολόγιο', intakeAllergyKeys=['nuts'], intakeAllergyOther='ακτινίδιο', weekPlan=plan_with('Φιστίκια'), shareToken='tokA')
cb = dict(base, id='cb', name='Βασίλης Γλουτένη', allergyGroups=['gluten', 'milk'])
cc = dict(base, id='cc', name='Γιώργος Σόγια', allergyGroups=['nuts'], weekPlan=plan_with('Μήλο'), shareToken='tokC')
S = {'rows': {U1: {'data': {'clients': [ca, cb, cc], 'customTemplates': []}, 'version': 1}}}

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(bypass_csp=True, viewport={'width': 1400, 'height': 1000})
        ctx.route('**/vendor/supabase-js.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        ctx.route('**/*.supabase.co/**', lambda r: r.abort())
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.add_init_script('window.__SERVER=' + json.dumps(S) + ';window.__UID=' + json.dumps(U1) + ';localStorage.clear();')
        pg.goto(f'http://localhost:{PORT}/Dietologist.html', wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=10000)
        pg.wait_for_timeout(800)
        def dlg_open(): return pg.get_attribute('#confirmDialog', 'data-open') == 'true'

        print('1. Client with intake allergies not yet applied')
        pg.evaluate('selectClient("ca"); renderMain();'); pg.wait_for_timeout(500)
        hdr = pg.inner_text('#header-allergy-wrap')
        check('από ερωτηματολόγιο' in hdr, f'header shows pending intake allergies ({hdr.strip()[:80]})')
        blk = pg.evaluate('document.getElementById("allergy-block") ? document.getElementById("allergy-block").innerText : ""')
        check('Ξηροί καρποί' in blk and 'ακτινίδιο' in blk and 'Εφαρμογή' in blk, 'allergy section shows pending box with nuts + «ακτινίδιο»')
        check('⛔ Αλλεργία' not in pg.inner_text('#week-con') if pg.query_selector('#week-con') else True, 'grid has no red chip before applying (nuts not yet an allergy)')
        pg.evaluate('genPlanWithUndo()'); pg.wait_for_timeout(400)
        check(dlg_open() and 'ερωτηματολόγιο' in pg.inner_text('#confirmTitle'), '«Δημιουργία πλάνου» asks about the unapplied allergies')
        pg.click('#confirmBtn'); pg.wait_for_timeout(300)
        for _ in range(4):
            if dlg_open(): pg.click('#confirmBtn'); pg.wait_for_timeout(400)
        r = pg.evaluate('''(()=>{var c=getC(); var L=clientAllergyFoods(c); var bad=[];
            Object.keys(c.weekPlan).forEach(d=>c.weekPlan[d].forEach(m=>m.foods.forEach(f=>{ if(L.indexOf(f.n)!==-1||/ακτινιδ/i.test(normalizeGreekText(f.n))) bad.push(f.n); })));
            return {groups:c.allergyGroups, note:c.allergies, excl:c.foodExclude, bad:bad, n:Object.keys(c.weekPlan).length, pending:intakeAllergiesPending(c)};})()''')
        check(r['groups'] == ['nuts'] and 'ακτινίδιο' in (r['note'] or ''), f"applied: groups={r['groups']} note={r['note']}")
        check(r['n'] == 7 and not r['bad'], f"new plan has no nuts/kiwi ({r['bad']})")
        check(r['excl'] == [], f"c.foodExclude untouched by allergies/generation ({len(r['excl'])} items)")
        check(not r['pending'] and 'από ερωτηματολόγιο' not in pg.inner_text('#header-allergy-wrap'), 'pending cleared, header shows the allergy')

        print('2. Manual add of an allergen is blocked; grid marks allergens red; publish guard replaces them')
        ok = pg.evaluate('insertPlanItemIntoCell(0,0,"Φουντούκια")')
        check(ok is False, 'drag/click add of Φουντούκια refused')
        pg.evaluate('getC().weekPlan[0][0].foods.push({n:"Αμύγδαλα",g:30}); renderWeekTable();')
        grid = pg.inner_text('#week-con') if pg.query_selector('#week-con') else pg.evaluate('(()=>{var d=document.createElement("div");d.id="week-con";document.body.appendChild(d);renderWeekTable();return d.innerText;})()')
        check('⛔ Αλλεργία: Ξηροί καρποί' in grid, 'grid shows red «⛔ Αλλεργία» on the injected food')
        pg.evaluate('openPublishModal()'); pg.wait_for_timeout(300)
        check(dlg_open() and 'Αλλεργία στο πλάνο' in pg.inner_text('#confirmTitle') and 'Αμύγδαλα' in pg.inner_text('#confirmMessage'), 'publish blocked with dialog naming Αμύγδαλα')
        pg.click('#confirmBtn'); pg.wait_for_timeout(1500)
        r = pg.evaluate('({hits:planAllergenHits(getC()).map(h=>h.n), overlay:!!document.getElementById("publish-overlay")})')
        check(not r['hits'] and r['overlay'], f"after «Αντικατάσταση & αποστολή»: no allergen left, publish continued ({r})")
        pg.evaluate('var o=document.getElementById("publish-overlay"); if(o) o.remove();')

        print('3. Client link snapshot lists the allergy as a group chip')
        ex = pg.evaluate('Cloud._buildSnapshot(getC()).exclusions')
        check(isinstance(ex, list) and ex and isinstance(ex[0], dict) and ex[0]['label'].startswith('Αλλεργία: Ξηροί καρποί'), f'first chip = allergy group ({ex[0] if ex else None})')

        print('4. genPlan for a client with gluten + milk allergies, several profiles')
        bad_all = []
        for prof in [('F', 30, 65, 165, 'maintain', None), ('M', 25, 80, 180, 'gain', 'football'), ('F', 45, 90, 162, 'loss', None), ('M', 35, 75, 178, 'maintain', 'running')]:
            pg.evaluate('(a)=>{var c=clients.find(x=>x.id==="cb"); Object.assign(c,{sex:a[0],age:a[1],weight:a[2],height:a[3],goal:a[4]}); if(a[5])c.sport=a[5]; else delete c.sport; selectClient("cb"); genPlan();}', list(prof))
            pg.wait_for_timeout(400)
            if dlg_open(): pg.click('#confirmBtn'); pg.wait_for_timeout(400)
            bad_all += pg.evaluate('''(()=>{var c=getC(); var L=clientAllergyFoods(c), bad=[];
                Object.keys(c.weekPlan||{}).forEach(d=>(c.weekPlan[d]||[]).forEach(m=>(m.foods||[]).forEach(f=>{ if(L.indexOf(f.n)!==-1) bad.push(f.n); })));
                return bad;})()''')
        check(not bad_all, f'0 gluten/dairy foods across 4 profiles ({sorted(set(bad_all))})')
        check(pg.evaluate('getC().foodExclude.length') == 0, 'foodExclude still empty after 4 generations')

        print('5. Toggling an allergy on an existing plan replaces the foods; «Άλλες αλλεργίες» suggestions')
        pg.evaluate('selectClient("cc"); renderMain();'); pg.wait_for_timeout(300)
        pg.evaluate('toggleAllergyGroup("milk")'); pg.wait_for_timeout(300)
        r = pg.evaluate('({g:getC().allergyGroups, hasYog:Object.keys(getC().weekPlan).some(d=>getC().weekPlan[d].some(m=>m.foods.some(f=>f.n==="Γιαούρτι 2%")))})')
        check(r['g'] == ['nuts', 'milk'] and not r['hasYog'], f'milk allergy added → Γιαούρτι 2% replaced in plan ({r})')
        pg.evaluate('updateAllergyNote("φιστίκια, σουσάμι, σόγια")'); pg.wait_for_timeout(200)
        sug = pg.inner_text('#allergy-suggest') if pg.query_selector('#allergy-suggest') else ''
        check('Σόγια' in sug and 'Ξηροί' not in sug, f'suggests 🫛 Σόγια (nuts already selected): «{sug.strip()}»')
        pg.evaluate('toggleAllergyGroup("milk")'); pg.wait_for_timeout(300)
        check(pg.evaluate('getC().allergyGroups') == ['nuts'], 'toggle off works')

        pg.wait_for_timeout(2500)
        s = pg.evaluate('window.__SERVER')
        saved = {c['id']: c for c in s['rows'][U1]['data']['clients']}
        check(saved['ca'].get('allergyGroups') == ['nuts'] and saved['cc'].get('allergyGroups') == ['nuts'], 'allergies reached the cloud')
        br.close()
finally:
    srv.terminate()
errs = [e for e in errors if 'favicon' not in e]
if errs: fails.append('console errors: ' + ' | '.join(errs[:6]))
print('\nRESULT:', 'ALL PASSED' if not fails else f'{len(fails)} FAILED')
for f in fails: print(' -', f)
