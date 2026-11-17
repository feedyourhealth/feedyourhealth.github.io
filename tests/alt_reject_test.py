"""👎 «Όχι για μένα» στις εναλλακτικές του link (2026-11-17).

1. Snapshot: 3 ορατές + ρεζέρβες (altSpares)· ό,τι απέρριψε ο πελάτης (client_alt_reject) δεν ξαναμπαίνει.
2. Επαναφορά από τον διαιτολόγο → ξαναμπαίνει στη δεξαμενή.
3. Πρόοδος: τρόφιμο σε ≥3 απορρίψεις → πρόταση αποκλεισμού (όχι αυτόματα), λόγοι, λίστα.
4. Link: 👎 → «γιατί;» → λόγος → μπαίνει ρεζέρβα «Νέα πρόταση» + toast + RPC· Αναίρεση· Παράλειψη +
   «1 κρυμμένη · Επαναφορά»· «Αυτό έφαγα» σε ρεζέρβα κρατά σωστό δείκτη.
5. Hydrate: απόρριψη από άλλη συσκευή (μετά τη δημοσίευση) κρύβεται· παλιότερη από τη δημοσίευση όχι.
Uses the fake in-browser Supabase — never touches real data.
"""
import datetime, json, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8897
BASE = f'http://localhost:{PORT}/Dietologist.html'
U1 = 'user-111'
fails, errors = [], []

def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

DAY = [
    {'name': 'Πρωινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 60}]},
    {'name': 'Ενδιάμεσο', 'foods': [{'n': 'Energy Bites (FYH)', 'g': 50}, {'n': 'Μήλο', 'g': 100}]},
    {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}, {'n': 'Ρύζι λευκό (βρ.)', 'g': 150}]},
    {'name': 'Βραδινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 40}]},
]
BLOB = {'clients': [{'id': 'c1', 'name': 'Test c1', 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod',
                     'goal': 'maintain', 'allergenListsVer': 2, 'shareToken': 'tokA', 'weekPlan': {str(i): DAY for i in range(7)}}],
        'customTemplates': [], 'savedCombos': [], 'tipsLibrary': [],
        'clinicContact': {'wa': '', 'tel': '', 'email': ''}, 'updatedAt': '2026-10-01T00:00:00Z'}
SERVER = {'rows': {U1: {'data': BLOB, 'version': 5}}, 'shared': {}, 'tables': {'client_meal_log': [], 'checkins': [], 'client_alt_reject': []}}
SNACK = 1   # δείκτης του Ενδιάμεσου στη μέρα

def sig_of(a): return '|'.join(sorted(p[0] for p in a.get('k', [])))

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
        def publish():
            return J("Cloud.publishPlan(clients[0]).then(()=>window.__SERVER.shared['tokA'].snapshot)")

        print('1. Snapshot: ρεζέρβες + αποκλεισμός απορριφθέντων')
        snap0 = publish()
        sn = snap0['days'][0]['meals'][SNACK]
        check(len(sn['alternates']) == 3 and len(sn.get('altSpares', [])) >= 1, f"3 visible + spares ({len(sn['alternates'])}+{len(sn.get('altSpares', []))})")
        target = sn['alternates'][0]
        tsig = sig_of(target)
        cot = J("Object.keys(FOODS).find(k=>/^Cottage/.test(k))")
        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).isoformat() + 'Z'
        rej = {tsig: {'el': target['el'], 's': 'Ενδιάμεσο', 'f': target['k'], 'r': 'time', 't': now}}
        for i, extra in enumerate(['Μήλο', 'Αχλάδι', 'Πορτοκάλι']):
            rej[f'{cot}|{extra}'] = {'el': f'{cot}, {extra}', 's': 'Ενδιάμεσο', 'f': [[cot, 100], [extra, 120]], 'r': 'time' if i else 'taste', 't': now}
        rej['Μπανάνα|Ταχίνι'] = {'el': 'Μπανάνα, Ταχίνι', 's': 'Ενδιάμεσο', 'f': [['Μπανάνα', 120], ['Ταχίνι', 10]], 'r': 'find', 't': now, 'x': 1}
        J("window.__SERVER.tables.client_alt_reject=[{token:'tokA',data:%s,updated_at:'%s'}]" % (json.dumps(rej, ensure_ascii=False), now))
        snap1 = publish()
        all_sigs = [sig_of(a) for d in snap1['days'] for m in d['meals'] for a in m['alternates'] + m.get('altSpares', [])]
        check(tsig not in all_sigs, f'rejected alternate «{target["el"]}» gone from every day (alternates + spares)')
        check(all(len(m['alternates']) == 3 for d in snap1['days'] for m in d['meals']), 'still 3 alternates per meal')
        check(J("Object.keys(clientRejectedAltSigs(clients[0])).length") == 4, 'undone (x) rejection not counted')

        print('2. Επαναφορά από τον διαιτολόγο')
        J("clients[0].altRejectRestored={%s:new Date(Date.now()+1000).toISOString()}" % json.dumps(tsig, ensure_ascii=False))
        check(J("buildAlternatesPool(clients[0],[]).some(x=>x.sig===%s)" % json.dumps(tsig, ensure_ascii=False)), 'restored meal back in the pool')
        J("delete clients[0].altRejectRestored")

        print('3. Πρόοδος')
        html = J("progressRejectsHtml(clients[0])")
        n_cot = 3 + (1 if cot in tsig.split('|') else 0)
        check(f'{cot} σε {n_cot} από τις 4 απορρίψεις' in html, 'repeated food → exclusion suggestion')
        check('Δεν έχω χρόνο' in html and 'Κυρίως «δεν έχω χρόνο»' in html, 'reasons + tip')
        check(html.count('pr-rj-row') == 4 and 'Μπανάνα, Ταχίνι' not in html, '4 rows, undone one hidden')
        check(J("(clients[0].foodExclude||[]).length") == 0, 'nothing excluded automatically')
        J("window.openProgressClient=function(){};window.showConfirmDialog=function(q,f){f();};progressRejectsHtml(clients[0]);progressRejExclude('c1',0)")
        check(J("clients[0].foodExclude") == [cot], 'one click → food in exclusions')
        check(f'{cot} σε ' not in J("progressRejectsHtml(clients[0])"), 'suggestion disappears once excluded')
        J("clients[0].foodExclude=[]; progressRejectsHtml(clients[0]); progressRejFoodDismiss('c1',0)")
        check(f'{cot} σε ' not in J("progressRejectsHtml(clients[0])"), '«Αγνόησε» hides the suggestion')
        sigs = J("progressRejectsHtml(clients[0]); _progressRejSigs['c1']")
        J("progressRejRestore('c1',0)")
        check(len(J("progressActiveRejects(clients[0])")) == 3, 'Επαναφορά removes the row')

        print('4. Link')
        J("window.__SERVER.tables.client_alt_reject=[]; delete clients[0].altRejectRestored")
        snap = publish()
        shared = J('window.__SERVER.shared')
        def link(extra=None):
            srvc = {'shared': shared}
            if extra: srvc.update(extra)
            cp = ctx.new_page()
            cp.on('pageerror', lambda e: errors.append('plan: ' + str(e)))
            cp.on('console', lambda m: errors.append('plan: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            cp.add_init_script('window.__SERVER=' + json.dumps(srvc) + ";localStorage.setItem('fyh_portal_tokA_onboardingSeen','1');localStorage.setItem('fyh_portal_tokA_goalHeroSeen','1');")
            cp.goto(f'http://localhost:{PORT}/plan.html?t=tokA', wait_until='domcontentloaded')
            cp.wait_for_selector('#todayMealsCard', timeout=8000)
            cp.wait_for_timeout(300)
            cp.evaluate('go("plan")'); cp.wait_for_timeout(200)
            return cp
        wd = (datetime.date.today().weekday())
        alts = snap['days'][wd]['meals'][SNACK]['alternates']
        spare0 = snap['days'][wd]['meals'][SNACK]['altSpares'][0]
        cp = link()
        card = lambda: cp.locator('.plan-grid > .card').nth(SNACK)
        card().locator('.swap-btn').click(); cp.wait_for_timeout(150)
        check(card().locator('.swap-item').count() == 3 and card().locator('.swap-no').count() == 3, '3 alternates, each with 👎')
        first = alts[0]['name']
        card().locator('.swap-item').nth(0).locator('.swap-no').click(); cp.wait_for_timeout(200)
        check(card().locator('.swap-ask').count() == 1 and 'όχι για σένα' in card().locator('.swap-ask').inner_text(), '👎 → «γιατί;» panel in place, list stays open')
        LS = lambda: cp.evaluate("JSON.parse(localStorage.getItem('fyh_portal_tokA_altrej')||'{}')")
        check(LS().get(sig_of(alts[0]), {}).get('r') == '', 'rejection stored right away (no reason yet)')
        card().locator('.swap-ask .chips button', has_text='Δεν έχω χρόνο').click(); cp.wait_for_timeout(600)
        items = card().locator('.swap-item')
        txt = card().inner_text()
        check(items.count() == 3 and first not in txt, 'rejected one gone, still 3')
        check(card().locator('.swap-item.new').count() == 1 and spare0['name'] in card().locator('.swap-item.new').inner_text(), 'spare shown as «Νέα πρόταση»')
        check(cp.locator('#alt-toast').count() == 1 and 'ξαναπροτείνουμε' in cp.inner_text('#alt-toast'), 'toast with undo')
        check(LS()[sig_of(alts[0])]['r'] == 'time', 'reason saved')
        calls = [c for c in cp.evaluate('window.__SERVER.rpcCalls||[]') if c[0] == 'save_alt_rejects']
        check(calls and sig_of(alts[0]) in calls[-1][1]['p_data'], 'save_alt_rejects RPC sent')
        cp.locator('#alt-toast button').click(); cp.wait_for_timeout(600)
        check(first in card().inner_text() and card().locator('.swap-item.new').count() == 0, 'Αναίρεση → original back')
        check(LS()[sig_of(alts[0])].get('x') == 1, 'undo kept as tombstone (x)')
        card().locator('.swap-item').nth(1).locator('.swap-no').click(); cp.wait_for_timeout(150)
        card().locator('.swap-ask .skip').click(); cp.wait_for_timeout(300)
        check('1 κρυμμένη επιλογή' in card().inner_text(), 'Παράλειψη → hidden, «1 κρυμμένη επιλογή»')
        # «Αυτό έφαγα» σε ρεζέρβα (σήμερα)
        newb = card().locator('.swap-item.new .swap-pick')
        if newb.count():
            newb.click(); cp.wait_for_timeout(300)
            mm = cp.evaluate("JSON.parse(localStorage.getItem('fyh_portal_tokA_meals')||'{}')")
            v = mm.get(datetime.date.today().isoformat(), {}).get(str(SNACK)) or mm.get(datetime.date.today().isoformat(), {}).get(SNACK)
            check(isinstance(v, dict) and v.get('a', 0) >= 3 and 'Έφαγες την εναλλακτική' in card().inner_text(), f'«Αυτό έφαγα» on a spare → index {v and v.get("a")} + banner')
            cp.evaluate("(function(){var d=JSON.parse(localStorage.getItem('fyh_portal_tokA_meals')||'{}');d={};localStorage.setItem('fyh_portal_tokA_meals',JSON.stringify(d));go('plan')})()"); cp.wait_for_timeout(200)
            card().locator('.swap-btn').click(); cp.wait_for_timeout(150)
        card().locator('.swap-hidden button').click(); cp.wait_for_timeout(300)
        check('κρυμμένη' not in card().inner_text() and card().locator('.swap-item.new').count() == 0, 'Επαναφορά → all 3 originals back')
        cp.close()

        print('5. Hydrate από άλλη συσκευή')
        later = (datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) + datetime.timedelta(minutes=5)).isoformat() + 'Z'
        cp = link({'rpcData': {'get_alt_rejects': {sig_of(alts[2]): {'el': '', 's': '', 'f': alts[2]['k'], 'r': '', 't': later},
                                                    sig_of(alts[1]): {'el': '', 's': '', 'f': alts[1]['k'], 'r': '', 't': '2020-01-01T00:00:00Z'}}}})
        cp.wait_for_timeout(500)
        card().locator('.swap-btn').click(); cp.wait_for_timeout(150)
        t = card().inner_text()
        check(alts[2]['name'] not in t, 'rejected on another device after publish → hidden')
        check(alts[1]['name'] in t, 'rejection older than this publish → shown (dietitian restored / already handled)')
        cp.close()
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
check(not errs, f'no console/page errors {errs[:3]}')
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
