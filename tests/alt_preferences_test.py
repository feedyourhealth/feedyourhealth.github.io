"""⭐ Εναλλακτικές link με βάση το «Αυτό έφαγα» (2026-11-12).

1. Η δημοσίευση διαβάζει φρέσκο client_meal_log (χωρίς να έχει ανοίξει η Πρόοδος) και το γεύμα που
   διάλεξε ο πελάτης βγαίνει 1ο στις εναλλακτικές του Πρωινού — σε κάθε μέρα.
2. Έως 2 αγαπημένα ανά γεύμα· η 3η θέση είναι πάντα κάτι καινούργιο.
3. Προφίλ προτιμήσεων: μετρήσεις, πρωτεΐνη ανά slot, παλιό pick χωρίς γραμμάρια (μόνο τίτλος),
   pick πάνω από 8 εβδομάδες δεν μετρά, αναίρεση (true) δεν μετρά.
4. Αποκλεισμός τροφίμου μετά την επιλογή → το αγαπημένο ΔΕΝ προτείνεται.
5. Πελάτης χωρίς επιλογές: 3 εναλλακτικές ανά γεύμα όπως πριν.
Uses the fake in-browser Supabase — never touches real data.
"""
import datetime, json, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8898
BASE = f'http://localhost:{PORT}/Dietologist.html'
U1 = 'user-111'
fails, errors = [], []

def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

today = datetime.date.today()
def dk(n): return (today - datetime.timedelta(days=n)).isoformat()

DAY = [
    {'name': 'Πρωινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 60}]},
    {'name': 'Ενδιάμεσο', 'foods': [{'n': 'Μήλο', 'g': 150}, {'n': 'Καρύδια', 'g': 15}]},
    {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}, {'n': 'Ρύζι λευκό (βρ.)', 'g': 150}]},
    {'name': 'Βραδινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 40}]},
]
WEEK = {str(i): DAY for i in range(7)}
def client(cid, tok):
    return {'id': cid, 'name': 'Test ' + cid, 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod',
            'goal': 'maintain', 'allergenListsVer': 2, 'shareToken': tok, 'weekPlan': WEEK}
BLOB = {'clients': [client('c1', 'tokA'), client('c2', 'tokB')], 'customTemplates': [], 'savedCombos': [], 'tipsLibrary': [],
        'clinicContact': {'wa': '', 'tel': '', 'email': ''}, 'updatedAt': '2026-10-01T00:00:00Z'}

FAV = [['Γιαούρτι 2%', 200], ['Βρώμη (ωμή)', 40], ['Μέλι', 10]]
FAV_PICK = {'a': 0, 'n': 'Γιαούρτι 2%, Βρώμη, Μέλι', 'o': 'Αυγά, Ψωμί ολικής', 's': 'Πρωινό', 'f': FAV}
OLD_PICK = {'a': 1, 'n': 'Κοτόπουλο στήθος, Ρύζι λευκό', 'o': 'x', 's': 'Lunch', 'f': []}   # παλιό link, αγγλικό slot
meal_log = [
    {'token': 'tokA', 'date': dk(2), 'meals_map': {'0': FAV_PICK, '1': True}},
    {'token': 'tokA', 'date': dk(5), 'meals_map': {'0': FAV_PICK}},
    {'token': 'tokA', 'date': dk(9), 'meals_map': {'0': FAV_PICK, '2': OLD_PICK}},
    {'token': 'tokA', 'date': dk(11), 'meals_map': {'0': True}},                                   # αναίρεση = true
    {'token': 'tokA', 'date': dk(80), 'meals_map': {'1': {'a': 2, 'n': 'Μπανάνα', 's': 'Ενδιάμεσο', 'f': [['Μπανάνα', 120]]}}},  # > 8 εβδ.
]
SERVER = {'rows': {U1: {'data': BLOB, 'version': 5}}, 'shared': {},
          'tables': {'client_meal_log': meal_log, 'checkins': []}}

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
        def fav_sig(a): return sorted(f[0] for f in a.get('k', []))
        FAVS = J("(function(){var f=%s.map(p=>FOODS[p[0]]?p[0]:resolveFood(p[0]));return f.sort();})()" % json.dumps(FAV))   # Μέλι → Μέλι άβραστο

        print('1. Δημοσίευση: το αγαπημένο βγαίνει 1ο στο Πρωινό')
        check(J("Object.keys(Cloud._mealLogCache).length") == 0, 'meal-log cache empty before publish (Πρόοδος not opened)')
        snap = publish('c1')
        bf = [d['meals'][0]['alternates'] for d in snap['days']]
        check(all(len(a) == 3 for a in bf), f'3 breakfast alternates every day ({[len(a) for a in bf]})')
        check(all(fav_sig(a[0]) == FAVS for a in bf), f"favourite first on all 7 days ({[a[0].get('el') for a in bf][:2]})")
        check(all(a[0]['kcal'] > 0 for a in bf), 'favourite rescaled to the meal kcal')

        print('2. Έως 2 αγαπημένα ανά γεύμα, πάντα κάτι καινούργιο')
        fav_sigs = J("""(function(){var c=clients.find(x=>x.id==='c1');var p=clientAltPreferences(c);
            return Object.keys(p.meals);})()""")
        per_meal = []
        for d in snap['days']:
            for m in d['meals']:
                sigs = ['|'.join(sorted(f[0] for f in a.get('k', []))) for a in m['alternates']]
                per_meal.append(sum(1 for s in sigs if s in fav_sigs))
        check(max(per_meal) <= 2, f'≤2 favourites per meal ({max(per_meal)})')
        check(all(len(m['alternates']) - n >= 1 for d in snap['days'] for m, n in zip(d['meals'], per_meal[:len(d['meals'])])), 'at least one new alternate per meal')

        print('3. Προφίλ προτιμήσεων')
        pr = J("(function(){var p=clientAltPreferences(clients.find(x=>x.id==='c1'));return {total:p.total,meals:Object.values(p.meals).map(m=>[m.count,m.slots]),bg:p.groups.breakfast,lg:p.groups.lunch,f:p.foods};})()")
        check(pr['total'] == 4, f"4 picks counted (true + >8 weeks ignored) ({pr['total']})")
        check(pr['meals'] == [[3, ['breakfast']]], f"one exact favourite, 3 times, breakfast ({pr['meals']})")
        check(pr['bg'] and pr['bg'].get('dairy') == 3, f"breakfast protein group = dairy ×3 ({pr['bg']})")
        check(pr['lg'] and pr['lg'].get('meat') == 1, f"old title-only pick with English slot → lunch/meat ({pr['lg']})")
        check(pr['f'].get('Κοτόπουλο στήθος (ψητό)') == 1 and 'Μπανάνα' not in pr['f'], 'title → food names; old pick outside 8 weeks ignored')

        print('4. Αποκλεισμός μετά την επιλογή')
        J("clients.find(x=>x.id==='c1').foodExclude=['Μέλι']")
        snap2 = publish('c1')
        has_honey = any('Μέλι' in fav_sig(a) for d in snap2['days'] for m in d['meals'] for a in m['alternates'])
        check(not has_honey, 'excluded food never offered, even from a favourite')

        print('5. Πελάτης χωρίς επιλογές')
        snap3 = publish('c2')
        counts = [len(m['alternates']) for d in snap3['days'] for m in d['meals']]
        check(all(n == 3 for n in counts), f'3 alternates per meal ({set(counts)})')
        check(J("buildAlternatesPool(clients.find(x=>x.id==='c2'),[]).filter(x=>x.src==='picked').length") == 0, "no 'picked' entries for a client without picks")
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
check(not errs, f'no console/page errors {errs[:3]}')
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
