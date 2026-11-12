"""🏃 Καταγραφή γυμναστικής στο link (2026-11-12).

1. Snapshot: day.workouts από τις «Προπονήσεις (MET)» (όνομα/λεπτά/ώρα)· ελληνικό όνομα μόνο σε el.
2. Link, μέρα προπόνησης: γραμμή μέσα στην κάρτα γευμάτων, τσεκ/ξε-τσεκ → localStorage + save_workout_checkin.
3. Link, μέρα χωρίς πρόγραμμα: «+ Έκανα προπόνηση» → τύπος/διάρκεια → εξτρά, αναίρεση.
4. Link: καρτέλα Πλάνο δείχνει τη γραμμή για σήμερα, όχι για μελλοντική μέρα· hydrate από τον server.
5. Πρόοδος: στήλη «🏃 Γυμν.» + σημάδια κάτω από τις μέρες, το σκορ δεν αλλάζει.
Uses the fake in-browser Supabase — never touches real data.
"""
import datetime, json, subprocess, sys, time, urllib.request, io
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8899
BASE = f'http://localhost:{PORT}/Dietologist.html'
U1 = 'user-111'
fails, errors = [], []

def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

today = datetime.date.today()
TI = today.weekday()                      # 0 = Δευτέρα, ίδιο index με c.trainDays
OTHER = (TI + 2) % 7
def dk(n): return (today - datetime.timedelta(days=n)).isoformat()

DAY = [
    {'name': 'Πρωινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 60}]},
    {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}, {'n': 'Ρύζι λευκό (βρ.)', 'g': 150}]},
    {'name': 'Βραδινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 40}]},
]
WEEK = {str(i): DAY for i in range(7)}
def client(cid, tok, train, mets, lang='el'):
    td = [i in train for i in range(7)]
    return {'id': cid, 'name': 'Test ' + cid, 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod',
            'goal': 'maintain', 'allergenListsVer': 2, 'shareToken': tok, 'weekPlan': WEEK, 'lang': lang,
            'trainDays': td, 'metActivities': mets}
RUN = {'id': 'run8', 'name': 'Τρέξιμο', 'met': 8.3, 'mins': 45, 'time': '18:30', 'days': [TI]}
BLOB = {'clients': [client('c1', 'tokA', [TI], [RUN]), client('c2', 'tokB', [OTHER], []),
                    client('c3', 'tokC', [TI], [RUN], 'en')],
        'customTemplates': [], 'savedCombos': [], 'tipsLibrary': [],
        'clinicContact': {'wa': '', 'tel': '', 'email': ''}, 'updatedAt': '2026-10-01T00:00:00Z'}
ck = lambda tok, n: {'token': tok, 'date': dk(n), 'meals_done': 2, 'meals_total': 3, 'water_glasses': 6, 'water_goal': 8, 'supps_done': 0, 'supps_total': 0}
SERVER = {'rows': {U1: {'data': BLOB, 'version': 5}}, 'shared': {},
          'tables': {'checkins': [ck('tokA', 9), ck('tokA', 3), ck('tokA', 0)],
                     'client_workout_log': [{'token': 'tokA', 'date': dk(7), 'data': {'d': True}},   # ίδια μέρα εβδομάδας με σήμερα = προγραμματισμένη
                                            {'token': 'tokA', 'date': dk(3), 'data': {'e': {'t': 'swim', 'm': 60}}}]}}

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(bypass_csp=True)
        ctx.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        ctx.route('**/*.supabase.co/**', lambda r: r.abort())
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.add_init_script('window.__SERVER=' + json.dumps(SERVER) + ';window.__UID=' + json.dumps(U1) + ';'
            + 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();'
            + "localStorage.setItem('fyh_cache_owner'," + json.dumps(U1) + ");localStorage.setItem('fyh_cache_base_version','5');}")
        pg.goto(BASE, wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=15000)
        pg.wait_for_timeout(800)
        J = lambda s: pg.evaluate(s)
        def publish(cid):
            return J('Cloud.publishPlan(clients.find(x=>x.id===%s)).then(()=>window.__SERVER.shared[clients.find(x=>x.id===%s).shareToken].snapshot)' % (json.dumps(cid), json.dumps(cid)))

        print('1. Snapshot')
        sA, sB, sC = publish('c1'), publish('c2'), publish('c3')
        check(sA['days'][TI]['workouts'] == [{'n': 'Τρέξιμο', 'm': 45, 't': '18:30'}], f"training day carries workout ({sA['days'][TI].get('workouts')})")
        check(sA['days'][OTHER]['workouts'] == [], 'rest day: no workouts')
        check(sB['days'][OTHER]['workouts'] == [{'n': '', 'm': 0, 't': ''}], 'training day without MET: one generic entry')
        check(sC['days'][TI]['workouts'] == [{'n': '', 'm': 45, 't': '18:30'}], 'en link: no Greek activity name')
        shared = J('window.__SERVER.shared')

        def link(tok, extra=None):
            srvc = {'shared': shared}
            if extra: srvc.update(extra)
            cp = ctx.new_page()
            cp.on('pageerror', lambda e: errors.append('plan: ' + str(e)))
            cp.on('console', lambda m: errors.append('plan: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            cp.add_init_script('window.__SERVER=' + json.dumps(srvc) + ';' + ''.join(f"localStorage.setItem('fyh_portal_{t}_onboardingSeen','1');localStorage.setItem('fyh_portal_{t}_goalHeroSeen','1');" for t in ('tokA','tokB','tokC')))
            cp.goto(f'http://localhost:{PORT}/plan.html?t={tok}', wait_until='domcontentloaded')
            cp.wait_for_selector('#todayMealsCard', timeout=8000)
            cp.wait_for_timeout(300)
            return cp
        def saves(cp): return [c for c in cp.evaluate('window.__SERVER.rpcCalls||[]') if c[0] == 'save_workout_checkin']
        LS = lambda cp, tok: cp.evaluate(f"JSON.parse(localStorage.getItem('fyh_portal_{tok}_workouts')||'{{}}')")

        print('2. Link · μέρα προπόνησης')
        cp = link('tokA')
        row = cp.locator('#todayMealsCard .wk-row')
        check(row.count() == 1, 'one workout row inside the meals card')
        txt = row.inner_text()
        check('Τρέξιμο · 45′' in txt and '18:30' in txt and 'πάτα όταν τελειώσεις' in txt, f'row shows name/time/hint ({txt!r})')
        check(cp.locator('.card .wk-add').count() == 0, 'no «+ Έκανα» on a training day')
        row.click(); cp.wait_for_timeout(600)
        check(cp.locator('#todayMealsCard .wk-row.on').count() == 1 and 'Έγινε' in cp.inner_text('#todayMealsCard .wk-row'), 'tap → checked «Έγινε ✓»')
        check(LS(cp, 'tokA').get(today.isoformat()) == {'d': True}, 'localStorage {d:true}')
        sv = saves(cp)
        check(sv and sv[-1][1]['p_date'] == today.isoformat() and sv[-1][1]['p_data'] == {'d': True}, 'save_workout_checkin sent {d:true}')
        check('Η διατροφή μου σήμερα' in cp.inner_text('#todayMealsCard') and cp.locator('#todayMealsCard .meal.eaten').count() == 0, 'meals untouched')
        cp.locator('#todayMealsCard .wk-row').click(); cp.wait_for_timeout(600)
        check(cp.locator('#todayMealsCard .wk-row.on').count() == 0 and saves(cp)[-1][1]['p_data'] == {}, 'second tap → unchecked, {} sent')

        print('4. Πλάνο tab')
        cp.evaluate(f'curDay={TI};go("plan")'); cp.wait_for_timeout(200)
        check(cp.locator('.view .wk-row').count() == 1, 'plan tab shows the row for today')
        if TI < 6:
            cp.evaluate(f'curDay={TI + 1};go("plan")'); cp.wait_for_timeout(200)
            check(cp.locator('.view .wk-row, .view .wk-add').count() == 0, 'future day: nothing')
        cp.close()

        cp = link('tokA', {'rpcData': {'get_workout_checkins': {today.isoformat(): {'d': True}}}})
        cp.wait_for_timeout(400)
        check(cp.locator('#todayMealsCard .wk-row.on').count() == 1, 'hydrate: server {d:true} shows as checked on a fresh device')
        cp.close()

        print('2b. Link · αγγλικά')
        cp = link('tokC')
        t = cp.inner_text('#todayMealsCard .wk-row')
        check('Training · 45′' in t and "tap when you’re done" in t, f'en row ({t!r})')
        cp.close()

        print('3. Link · μέρα χωρίς πρόγραμμα')
        cp = link('tokB')
        check(cp.locator('#todayMealsCard .wk-row').count() == 0, 'no planned row on a rest day')
        add = cp.locator('#todayMealsCard .wk-add')
        check(add.count() == 1 and 'Έκανα προπόνηση' in add.inner_text(), '«+ Έκανα προπόνηση» shown')
        add.click(); cp.wait_for_timeout(200)
        check(cp.locator('.wk-pick').count() == 1 and cp.is_disabled('.wk-save'), 'picker opens, Save disabled until a type')
        cp.locator('.wk-pick [data-t="run"]').click(); cp.locator('.wk-pick [data-m="45"]').click()
        cp.locator('.wk-save').click(); cp.wait_for_timeout(600)
        t = cp.inner_text('#todayMealsCard .wk-row.on')
        check('Τρέξιμο · 45′' in t and 'εξτρά' in t, f'extra logged row ({t!r})')
        check(LS(cp, 'tokB').get(today.isoformat()) == {'e': {'t': 'run', 'm': 45}}, 'localStorage {e:{t:run,m:45}}')
        check(saves(cp)[-1][1]['p_data'] == {'e': {'t': 'run', 'm': 45}}, 'save sent extra')
        cp.locator('.wk-x').click(); cp.wait_for_timeout(600)
        check(cp.locator('#todayMealsCard .wk-add').count() == 1 and saves(cp)[-1][1]['p_data'] == {}, 'undo → back to «+», {} sent')
        add = cp.locator('#todayMealsCard .wk-add'); add.click(); cp.locator('.wk-cancel').click(); cp.wait_for_timeout(150)
        check(cp.locator('.wk-pick').count() == 0, 'cancel closes the picker')
        cp.close()

        print('5. Πρόοδος')
        J('swTab(10)'); pg.wait_for_timeout(1500)
        J('openProgressClient("c1")'); pg.wait_for_timeout(400)
        card = pg.locator('.pr-wk')
        check(card.count() == 1 and '🏃 Γυμν.' in card.inner_text(), 'weekly table has the «🏃 Γυμν.» column')
        check(pg.locator('.pr-wk .pr-wk-gx').count() >= 1, 'extra (swim) marker shown')
        titles = J("[...document.querySelectorAll('.pr-wk .pr-wk-g[title]')].map(e=>e.title)")
        check(any('Κολύμπι' in x and '60′' in x for x in titles), 'extra tooltip names the activity')
        check(any('έγινε' in x for x in titles), 'done marker tooltip')
        J('openProgressClient("c2")'); pg.wait_for_timeout(200)
        check('Δεν υπάρχουν ακόμα καταγραφές' in pg.inner_text('.pr-wk'), 'client without check-ins: table unchanged')
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
if errs: print('\nconsole errors:', *errs[:10], sep='\n  ')
print(f"\n{'PASS' if not fails and not errs else 'FAIL'} — {len(fails)} failed checks, {len(errs)} console errors")
sys.exit(1 if fails or errs else 0)
