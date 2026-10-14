"""Allergen exclusion tests: one-time migration of old quick-exclude lists + genPlan never serves a group food."""
import json, subprocess, sys, time, urllib.request, io
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8894
BASE = f'http://localhost:{PORT}/Dietologist.html'
U1 = 'user-111'
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

def open_page(ctx, server, seed=None):
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    js = 'window.__SERVER=' + json.dumps(server) + ';window.__UID=' + json.dumps(U1) + ';'
    if seed is not None:
        js += 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();' + ''.join(
            f'localStorage.setItem({json.dumps(k)},{json.dumps(v)});' for k, v in seed.items()) + '}'
    page.add_init_script(js)
    page.goto(BASE, wait_until='domcontentloaded')
    page.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=10000)
    page.wait_for_timeout(400)
    return page

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        def ctx():
            c = br.new_context(bypass_csp=True)
            c.route('**/vendor/supabase-js.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
            c.route('**/*.supabase.co/**', lambda r: r.abort())
            return c

        # Old (pre-fix) nut list = today's hand list + Αβοκάντο, read from the running app.
        c0 = ctx(); pg = open_page(c0, {'rows': {}})
        old_nuts = pg.evaluate('QUICK_EXCL_BASE["🌰 Ξηροί καρποί"].concat(["Αβοκάντο"])')
        c0.close()

        print('M. One-time migration of clients who used the old 🌰 list')
        plan = {str(d): [{'name': 'Ενδιάμεσο', 'foods': [{'n': 'Φιστίκια', 'g': 30}, {'n': 'Μήλο', 'g': 150}]},
                         {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}, {'n': 'Ρύζι λευκό (βρ.)', 'g': 150}]}] for d in range(7)}
        cx = {'id': 'cx', 'name': 'Πελάτης Καρποί', 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod', 'goal': 'maintain',
              'foodExclude': old_nuts, 'weekPlan': plan, 'shareToken': 'tok'}
        cy = {'id': 'cy', 'name': 'Πελάτης Αμύγδαλα', 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod', 'goal': 'maintain',
              'foodExclude': ['Αμύγδαλα'], 'weekPlan': json.loads(json.dumps(plan))}
        S = {'rows': {U1: {'data': {'clients': [cx, cy], 'customTemplates': []}, 'version': 3}}}
        cM = ctx(); pg = open_page(cM, S, seed={})
        pg.wait_for_selector("#confirmDialog[data-open='true']", timeout=5000)
        msg = pg.inner_text('#confirmMessage')
        check('Ενημέρωση αλλεργιογόνων' in pg.inner_text('#confirmTitle') and 'Πελάτης Καρποί' in msg and 'Φιστίκια' in msg, 'dialog names the affected client and food')
        check('Πελάτης Αμύγδαλα' not in msg, 'client with a single manual exclusion not touched')
        pg.click('#confirmBtn'); pg.wait_for_timeout(2500)
        r = pg.evaluate('''(()=>{var x=clients.find(c=>c.id==="cx"),y=clients.find(c=>c.id==="cy");
            var inPlan=function(c,n){return Object.keys(c.weekPlan).some(d=>c.weekPlan[d].some(m=>m.foods.some(f=>f.n===n)));};
            var nutList=QUICK_EXCL["🌰 Ξηροί καρποί"];
            var anyNut=Object.keys(x.weekPlan).some(d=>x.weekPlan[d].some(m=>m.foods.some(f=>nutList.indexOf(f.n)!==-1)));
            return {xHas:["Φιστίκια","Φουντούκια","Σουσάμι"].every(n=>x.foodExclude.indexOf(n)!==-1), xPist:inPlan(x,"Φιστίκια"), anyNut:anyNut,
                    snack:x.weekPlan["0"][0].foods.map(f=>f.n), yEx:y.foodExclude, yPist:inPlan(y,"Φιστίκια"), ver:[x.allergenListsVer,y.allergenListsVer]};})()''')
        check(r['xHas'], 'old-list client now excludes Φιστίκια/Φουντούκια/Σουσάμι')
        check(not r['xPist'] and not r['anyNut'], f"no nut food left in plan (snack now {r['snack']})")
        check(r['yEx'] == ['Αμύγδαλα'] and r['yPist'], 'other client unchanged')
        check(r['ver'] == [2, 2], 'both flagged as migrated')
        s = pg.evaluate('window.__SERVER')
        check(s.get('writes') == 1, f"migration uploaded once (writes={s.get('writes')})")
        cache = {}
        cache.update(pg.evaluate('(()=>{var o={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k==="fyh_active_tab_lock")continue;o[k]=localStorage.getItem(k);}return o;})()'))
        cM.close()
        s['writes'] = 0
        cM2 = ctx(); pg = open_page(cM2, s, seed=cache); pg.wait_for_timeout(2500)
        check(pg.get_attribute('#confirmDialog', 'data-open') != 'true' and (pg.evaluate('window.__SERVER').get('writes') or 0) == 0, 'second open: no dialog, no upload')
        cM2.close()

        print('P. genPlan with each quick-exclude group never serves a food of that group')
        cP = ctx(); pg = open_page(cP, {'rows': {}}, seed={})
        groups = ['🌰 Ξηροί καρποί', '🌾 Γλουτένη', '🥚 Αυγά', '🥛 Γαλακτοκομικά', '🐟 Ψάρια/Θαλ.']
        profiles = [('F', 30, 65, 165, 'maintain', None), ('M', 25, 80, 180, 'gain', 'football'), ('F', 45, 90, 162, 'loss', None),
                    ('M', 35, 75, 178, 'maintain', 'running'), ('F', 14, 50, 160, 'maintain', None)]
        for g in groups:
            bad_total = []
            for i, (sex, age, w, h, goal, sport) in enumerate(profiles):
                cid = pg.evaluate('(a)=>{addClient("T"+a.i); var c=clients[clients.length-1]; Object.assign(c,{sex:a.sex,age:a.age,weight:a.w,height:a.h,activity:"mod",goal:a.goal}); if(a.sport)c.sport=a.sport; selectClient(c.id); applyQuickExclude(a.g); return c.id;}',
                                  {'i': i, 'sex': sex, 'age': age, 'w': w, 'h': h, 'goal': goal, 'sport': sport, 'g': g})
                pg.evaluate('genPlan()')
                for _ in range(3):
                    pg.wait_for_timeout(300)
                    if pg.get_attribute('#confirmDialog', 'data-open') == 'true': pg.click('#confirmBtn')
                pg.wait_for_timeout(400)
                res = pg.evaluate('''(a)=>{var c=clients.find(x=>x.id===a.id); var L=QUICK_EXCL[a.g]; var bad=[], n=0;
                    Object.keys(c.weekPlan||{}).forEach(d=>(c.weekPlan[d]||[]).forEach(m=>(m.foods||[]).forEach(f=>{n++; if(L.indexOf(f.n)!==-1) bad.push(f.n);})));
                    return {n:n, bad:bad};}''', {'id': cid, 'g': g})
                if res['n'] == 0: fails.append(f'{g} profile {i}: empty plan'); print(f'  FAIL {g} profile {i}: empty plan')
                bad_total += res['bad']
            check(not bad_total, f'{g}: 0 forbidden foods across {len(profiles)} profiles' + (f' — found {sorted(set(bad_total))}' if bad_total else ''))
        cP.close()
        br.close()
finally:
    srv.terminate()
errs = [e for e in errors if 'favicon' not in e]
if errs: fails.append('console errors: ' + ' | '.join(errs[:6]))
print('\nRESULT:', 'ALL PASSED' if not fails else f'{len(fails)} FAILED')
for f in fails: print(' -', f)
