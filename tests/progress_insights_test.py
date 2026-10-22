"""Πρόοδος πελάτη — κάρτες progress-insights.js (2026-10-22).

1. «Ποιο γεύμα παραλείπει»: ποσοστά ανά γεύμα, τα 2 «Ενδιάμεσο» χωριστά, σήμερα δεν μετρά,
   καθημερινές vs Σαββατοκύριακο.
2. Αντικαταστάσεις: πάτημα σε γραμμή → πλάνο ↔ τι έφαγε (νέο link με γραμμάρια, παλιό link με
   τίτλο «(100 γρ.)» που πρέπει να βρει το γεύμα στο Ιστορικό πλάνων) + «Τι προτιμά ανά γεύμα».
3. «Ποιο συμπλήρωμα ξεχνά»: αγγλικά ονόματα (en πελάτης) → ελληνικά, μήνυμα για χαμηλό.
4. «Λίστα αγορών»: τσεκαρισμένα / σύνολο από το snapshot του link.
5. Πελάτης χωρίς δεδομένα: καμία από τις νέες κάρτες.
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

today = datetime.date.today()
def dk(n): return (today - datetime.timedelta(days=n)).isoformat()

DAY = [
    {'name': 'Πρωινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 60}]},
    {'name': 'Ενδιάμεσο', 'foods': [{'n': 'Μήλο', 'g': 150}]},
    {'name': 'Μεσημεριανό', 'foods': [{'n': 'Ρύζι λευκό (βρ.)', 'g': 150}]},
    {'name': 'Ενδιάμεσο', 'foods': [{'n': 'Γιαούρτι 2%', 'g': 200}, {'n': 'Μπανάνα', 'g': 120}]},
    {'name': 'Βραδινό', 'foods': [{'n': 'Αυγά', 'g': 100}]},
]
WEEK = {str(i): DAY for i in range(7)}
CL = {'id': 'c1', 'name': 'Alpha Test', 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod',
      'goal': 'maintain', 'allergenListsVer': 2, 'lang': 'en', 'shareToken': 'tokA', 'weekPlan': WEEK,
      'savedPlans': [{'id': 'p1', 'number': 1, 'date': dk(25), 'kind': 'sent', 'weekPlan': WEEK}]}
CL2 = {'id': 'c2', 'name': 'Beta Empty', 'sex': 'M', 'age': 40, 'weight': 80, 'height': 180, 'activity': 'mod',
       'goal': 'maintain', 'allergenListsVer': 2, 'shareToken': 'tokB', 'weekPlan': WEEK}
BLOB = {'clients': [CL, CL2], 'customTemplates': [], 'savedCombos': [], 'tipsLibrary': [],
        'clinicContact': {'wa': '', 'tel': '', 'email': ''}, 'updatedAt': '2026-10-01T00:00:00Z'}

NEW_SWAP = {'a': 0, 'n': 'Γιαούρτι με βρώμη', 'o': 'Αυγά, Ψωμί ολικής', 's': 'Πρωινό',
            'f': [['Γιαούρτι 2%', 200], ['Βρώμη (ωμή)', 40], ['Μέλι', 10]]}
OLD_SWAP = {'a': 1, 'n': 'Τοστ γαλοπούλα', 'o': 'Αυγά (100 γρ.), Ψωμί ολικής (60 γρ.)', 's': 'Πρωινό', 'f': []}
meal_log, checkins, supp_log = [], [], []
for n in range(20, 0, -1):
    d = dk(n); wd = (today - datetime.timedelta(days=n)).weekday()
    mm = {'0': True, '1': True, '2': True, '4': wd < 5}          # δεύτερο ενδιάμεσο ποτέ, βραδινό μόνο καθημερινές
    if n == 2: mm['0'] = NEW_SWAP
    if n in (3, 4): mm['0'] = OLD_SWAP if n == 3 else NEW_SWAP
    meal_log.append({'token': 'tokA', 'date': d, 'meals_map': mm})
    checkins.append({'token': 'tokA', 'date': d, 'meals_done': sum(1 for v in mm.values() if v), 'meals_total': 5,
                     'water_glasses': 6, 'water_goal': 8, 'supps_done': 1, 'supps_total': 2})
    supp_log.append({'token': 'tokA', 'date': d, 'supps_map': {'Creatine': True, 'Omega-3 X': n in (5, 9)}})
meal_log.append({'token': 'tokA', 'date': dk(0), 'meals_map': {}})   # σήμερα: τίποτα ακόμα — δεν πρέπει να μετρά
SNAP = {'supps': [{'name': 'Creatine'}, {'name': 'Omega-3 X'}],
        'shopping': [{'cat': 'x', 'items': [{'name': 'Eggs'}, {'name': 'Rice'}, {'name': 'Apples'}]}]}
SERVER = {'rows': {U1: {'data': BLOB, 'version': 5}},
          'shared': {'tokA': {'token': 'tokA', 'snapshot': SNAP}},
          'tables': {'client_meal_log': meal_log, 'checkins': checkins, 'client_supp_log': supp_log,
                     'client_shop_log': [{'token': 'tokA', 'checks': {'Eggs': True}, 'updated_at': dk(1) + 'T10:00:00Z'}]}}

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
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.add_init_script('window.__SERVER=' + json.dumps(SERVER) + ';window.__UID=' + json.dumps(U1) + ';'
            + 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();'
            + "localStorage.setItem('fyh_cache_owner'," + json.dumps(U1) + ");localStorage.setItem('fyh_cache_base_version','5');}")
        page.goto(BASE, wait_until='domcontentloaded')
        page.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=15000)
        page.wait_for_timeout(1000)
        page.evaluate('swTab(10)'); page.wait_for_timeout(1500)
        page.evaluate("_progressSwapRange='4w'; openProgressClient('c1')"); page.wait_for_timeout(1200)
        txt = page.inner_text('#main')

        print('1. Ποιο γεύμα παραλείπει')
        check('Ποιο γεύμα παραλείπει' in txt, 'skip card shown')
        check('Ενδιάμεσο πρωί' in txt and 'Ενδιάμεσο απόγευμα' in txt, 'the two snacks are separate rows')
        bars = page.evaluate("[...document.querySelectorAll('.pi-bars > span')].map(e=>e.innerText.trim())")
        rows = {bars[i]: (bars[i + 2], bars[i + 3]) for i in range(0, len(bars), 4)}
        check(rows.get('Πρωινό') == ('100%', '20/20'), f"breakfast 20/20, today excluded: {rows.get('Πρωινό')}")
        check(rows.get('Ενδιάμεσο απόγευμα') == ('0%', '0/20'), f"afternoon snack 0/20: {rows.get('Ενδιάμεσο απόγευμα')}")
        check('Το «Ενδιάμεσο απόγευμα» τσεκάρεται μόνο 0 στις 10' in txt, 'low-meal note')
        check('Καθημερινές (Δε–Πα)' in txt and 'Το Σαββατοκύριακο πέφτει' in txt, 'weekday/weekend tiles + note')

        print('2. Αντικαταστάσεις: τι ακριβώς έφαγε + προτιμήσεις')
        n_det = page.evaluate("document.querySelectorAll('details.pr-sw-det').length")
        check(n_det == 3, f'3 swap rows are expandable ({n_det})')
        page.evaluate("document.querySelectorAll('details.pr-sw-det').forEach(d=>d.open=true)")
        dets = page.evaluate("[...document.querySelectorAll('details.pr-sw-det')].map(d=>d.innerText)")
        new_d = [d for d in dets if 'Γιαούρτι με βρώμη' in d][0]; old_d = [d for d in dets if 'Τοστ γαλοπούλα' in d][0]
        check('Αυγά · 100 γρ.' in new_d and 'Γιαούρτι 2% · 200 γρ.' in new_d and 'Βρώμη (ωμή) · 40 γρ.' in new_d, 'new link: both sides with grams')
        check('Θερμίδες' in new_d and 'Πρωτεΐνη' in new_d and 'kcal' in new_d, 'new link: macro line + diff chips')
        check('Ψωμί ολικής · 60 γρ.' in old_d and 'Παλιό link' in old_d, 'old link: planned meal found via history, eaten side name only')
        check('Τι προτιμά ανά γεύμα' in txt and 'Γιαούρτι με βρώμη' in txt, 'preferences block')

        print('3. Ποιο συμπλήρωμα ξεχνά')
        check('Ποιο συμπλήρωμα ξεχνά' in txt, 'supp card shown')
        check('Κρεατίνη' in txt and 'Creatine' not in txt, 'English supp name shown in Greek')
        check('Λιγότερο από τις μισές μέρες: Omega-3 X' in txt, 'low-supp note')
        check('20/20' in txt and '2/20' in txt, '4-week counts')

        print('4. Λίστα αγορών')
        check('Λίστα αγορών' in txt and '1 / 3' in txt, 'shop checked/total')
        check('Δεν έχει τσεκάρει: Rice, Apples' in txt, 'unchecked items listed')

        print('5. Πελάτης χωρίς δεδομένα')
        page.evaluate("openProgressClient('c2')"); page.wait_for_timeout(800)
        t2 = page.inner_text('#main')
        check(not any(s in t2 for s in ('Ποιο γεύμα παραλείπει', 'Ποιο συμπλήρωμα ξεχνά', 'Λίστα αγορών')), 'no new cards without data')
        check(not page.evaluate("[...document.querySelectorAll('.toast,.error-toast')].some(e=>/δεν βρέθηκε στη βάση/.test(e.innerText))"), 'no missing-food toast')
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
if errs:
    print('Console/page errors:'); [print('  ' + e[:200]) for e in errs]
print('\nRESULT:', 'FAIL' if fails or errs else 'PASS', f'({len(fails)} failed checks, {len(errs)} errors)')
sys.exit(1 if fails or errs else 0)
