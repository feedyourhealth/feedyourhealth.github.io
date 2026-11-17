"""Ποικιλία εναλλακτικών link (2026-11-17).

1. Σνακ «Energy Bites + Μήλο» κάθε μέρα: καμία εναλλακτική με κύριο τρόφιμο τα Energy Bites,
   καμία δυάδα εναλλακτικών με το ίδιο κύριο τρόφιμο, 3 ανά γεύμα.
2. Μέσα στην εβδομάδα τα σνακ δεν είναι οι ίδιες 3 κάθε μέρα (πολλές διαφορετικές).
3. Vegan πελάτης: 3 ανά γεύμα, κανένα απαγορευμένο τρόφιμο (η ποικιλία δεν σπάει τους αποκλεισμούς).
Uses the fake in-browser Supabase — never touches real data.
"""
import json, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8899
BASE = f'http://localhost:{PORT}/Dietologist.html'
U1 = 'user-111'
fails, errors = [], []

def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

EB = [{'n': 'Energy Bites (FYH)', 'g': 50}, {'n': 'Μήλο', 'g': 100}]
DAY = [
    {'name': 'Πρωινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 60}]},
    {'name': 'Ενδιάμεσο', 'foods': EB},
    {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}, {'n': 'Ρύζι λευκό (βρ.)', 'g': 150}]},
    {'name': 'Ενδιάμεσο', 'foods': EB},
    {'name': 'Βραδινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 40}]},
]
VDAY = [
    {'name': 'Πρωινό', 'foods': [{'n': 'Βρώμη (ωμή)', 'g': 60}, {'n': 'Γάλα σόγιας', 'g': 250}, {'n': 'Μπανάνα', 'g': 100}]},
    {'name': 'Ενδιάμεσο', 'foods': [{'n': 'Μήλο', 'g': 150}, {'n': 'Αμύγδαλα', 'g': 20}]},
    {'name': 'Μεσημεριανό', 'foods': [{'n': 'Φακές', 'g': 250}, {'n': 'Ψωμί ολικής', 'g': 50}]},
    {'name': 'Βραδινό', 'foods': [{'n': 'Ρεβίθια', 'g': 200}, {'n': 'Ρύζι λευκό (βρ.)', 'g': 100}]},
]
def client(cid, tok, week, diet='normal'):
    return {'id': cid, 'name': 'Test ' + cid, 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod',
            'goal': 'maintain', 'dietType': diet, 'allergenListsVer': 2, 'shareToken': tok,
            'weekPlan': {str(i): week for i in range(7)}}
BLOB = {'clients': [client('c1', 'tokA', DAY), client('c2', 'tokB', VDAY, 'vegan')], 'customTemplates': [], 'savedCombos': [],
        'tipsLibrary': [], 'clinicContact': {'wa': '', 'tel': '', 'email': ''}, 'updatedAt': '2026-10-01T00:00:00Z'}
SERVER = {'rows': {U1: {'data': BLOB, 'version': 5}}, 'shared': {}, 'tables': {'client_meal_log': [], 'checkins': []}}

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
        def main_of(a):
            return J('mealMainFood(%s.map(p=>({n:p[0],g:p[1]})))' % json.dumps(a.get('k', [])))

        print('1. Energy Bites + Μήλο: όχι ξανά energy bites, διαφορετικό κύριο τρόφιμο')
        snap = publish('c1')
        snacks = [m for d in snap['days'] for i, m in enumerate(d['meals']) if i in (1, 3)]
        check(all(len(m['alternates']) == 3 for d in snap['days'] for m in d['meals']), '3 alternates for every meal')
        eb_main = J("mealMainFood([{n:'Energy Bites (FYH)',g:50},{n:'Μήλο',g:100}])")
        check(eb_main == 'Energy Bites (FYH)', f'main food of the snack = Energy Bites ({eb_main})')
        mains = [[main_of(a) for a in m['alternates']] for m in snacks]
        check(all(eb_main not in ms for ms in mains), f'no snack alternate built on Energy Bites ({mains[0]})')
        check(all(len(set(ms)) == len(ms) for ms in mains), 'no two alternates of a snack share their main food')

        print('2. Ποικιλία μέσα στην εβδομάδα')
        sigs = {'|'.join(sorted(f[0] for f in a.get('k', []))) for m in snacks for a in m['alternates']}
        check(len(sigs) >= 10, f'≥10 different snack alternates across the week ({len(sigs)}, was 3 before)')
        day_sets = {tuple(sorted('|'.join(sorted(f[0] for f in a.get('k', []))) for a in m['alternates'])) for m in snacks}
        check(len(day_sets) > 2, f'snack alternate sets change across the week ({len(day_sets)} different sets)')

        print('3. Vegan: η ποικιλία δεν σπάει τους αποκλεισμούς')
        snap2 = publish('c2')
        check(all(len(m['alternates']) == 3 for d in snap2['days'] for m in d['meals']), '3 alternates for every vegan meal')
        bad = J("""(function(s){var cats=DIET_TYPE_FORBIDDEN_CATS.vegan,b=[];
            s.days.forEach(d=>d.meals.forEach(m=>m.alternates.forEach(a=>(a.k||[]).forEach(p=>{ if(foodBlockedByDietCats(p[0],'vegan',cats))b.push(p[0]); }))));
            return b;})(%s)""" % json.dumps(snap2))
        check(not bad, f'no animal products in vegan alternates {bad[:3]}')
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
check(not errs, f'no console/page errors {errs[:3]}')
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
