"""Προτάσεις από τα δεδομένα χρήσης (2026-11-22): 8 έτοιμο μήνυμα · 4 link που δεν ξεκίνησε/σταμάτησε +
μηνύματα «γιατί να σημειώνω» στο link · 2 «Ο πελάτης στο link» μέσα στο Πλάνο · 3 🌱 Φρεσκάρισμα.

1. Προσωπικό μήνυμα: χωρίς c.portalNote → «Πάμε δυνατά!!» (en → «Let's go!!»)· κενό '' μένει κενό.
2. linkUsage: never / stopped / active + chip στην κεφαλίδα + σημαία «📵» στην Πρόοδο.
3. Πλάνο: τήρηση ανά γεύμα + 🔄 στην κεφαλίδα/κελιά, πάνελ ανοίγει/κλείνει, κρύβεται εκτός Πλάνου.
4. Φρεσκάρισμα: πρώτα ό,τι διαλέγει ο ίδιος, ίδιες θερμίδες ανά ημέρα, ↶ Αναίρεση επαναφέρει.
5. Link: «Πώς δουλεύουμε μαζί» μία φορά, «Καλώς ήρθες πίσω» μετά από 5+ μέρες.
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
def dk(n): return (today - datetime.timedelta(days=n)).isoformat()

DAY = [
    {'name': 'Πρωινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 60}]},
    {'name': 'Ενδιάμεσο', 'foods': [{'n': 'Μήλο', 'g': 150}, {'n': 'Καρύδια', 'g': 15}]},
    {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}, {'n': 'Ρύζι λευκό (βρ.)', 'g': 150}]},
    {'name': 'Βραδινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 40}]},
]
WEEK = {str(i): DAY for i in range(7)}
def client(cid, tok, **kw):
    c = {'id': cid, 'name': 'Test ' + cid, 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod',
         'goal': 'maintain', 'allergenListsVer': 2, 'shareToken': tok, 'weekPlan': WEEK,
         '_publishedPlanHash': 123, 'savedPlans': [{'id': 'p1', 'number': 1, 'date': dk(30), 'kind': 'sent', 'sentDates': [dk(30)]}]}
    c.update(kw); return c
CLIENTS = [client('cNever', 'tokN'), client('cStop', 'tokS'), client('cAct', 'tokA'),
           client('cEn', 'tokE', lang='en'), client('cBlank', 'tokB', portalNote='')]
BLOB = {'clients': CLIENTS, 'customTemplates': [], 'savedCombos': [], 'tipsLibrary': [],
        'clinicContact': {'wa': '', 'tel': '', 'email': ''}, 'updatedAt': '2026-10-01T00:00:00Z'}

def ck(tok, n): return {'token': tok, 'date': dk(n), 'meals_done': 3, 'meals_total': 4, 'water_glasses': 5, 'water_goal': 8, 'supps_done': 0, 'supps_total': 0}
checkins = [ck('tokS', 20), ck('tokS', 21)] + [ck('tokA', n) for n in range(0, 12)]
FAV = [['Γιαούρτι 2%', 200], ['Βρώμη (ωμή)', 40], ['Μέλι', 10]]
PICK = {'a': 0, 'n': 'Γιαούρτι 2%, Βρώμη, Μέλι', 'o': 'Αυγά, Ψωμί ολικής', 's': 'Πρωινό', 'f': FAV}
meal_log = [{'token': 'tokA', 'date': dk(n), 'meals_map': {'0': PICK, '1': True, '2': True}} for n in (1, 2, 3, 4)]
SERVER = {'rows': {U1: {'data': BLOB, 'version': 5}}, 'shared': {},
          'tables': {'checkins': checkins, 'client_meal_log': meal_log, 'client_logs': [], 'plan_feedback': []}}

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(bypass_csp=True, viewport={'width': 1440, 'height': 900})
        ctx.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        ctx.route('**/*.supabase.co/**', lambda r: r.abort())
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.add_init_script('window.__SERVER=' + json.dumps(SERVER) + ';window.__UID=' + json.dumps(U1) + ';'
            + 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();localStorage.setItem("dietologist-tour-done","1");'
            + "localStorage.setItem('fyh_cache_owner'," + json.dumps(U1) + ");localStorage.setItem('fyh_cache_base_version','5');}")
        pg.goto(BASE, wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=15000)
        pg.wait_for_function('Cloud._checkinsLoaded===true', timeout=15000)
        J = lambda s: pg.evaluate(s)
        J("Cloud.refreshMealLogCache()"); pg.wait_for_timeout(800)
        def publish(cid):
            return J('Cloud.publishPlan(clients.find(x=>x.id===%s)).then(()=>window.__SERVER.shared[clients.find(x=>x.id===%s).shareToken].snapshot)' % (json.dumps(cid), json.dumps(cid)))

        print('1. Έτοιμο προσωπικό μήνυμα')
        check(publish('cNever')['coachNote'] == 'Πάμε δυνατά!!', 'no note set → «Πάμε δυνατά!!»')
        check(publish('cEn')['coachNote'] == "Let's go!!", "English link → «Let's go!!»")
        check(publish('cBlank')['coachNote'] == '', "note deliberately cleared ('') stays empty")

        print('2. Χρήση του link')
        u = J("['cNever','cStop','cAct'].map(id=>{const r=linkUsage(clients.find(c=>c.id===id));return r&&r.state})")
        check(u == ['never', 'stopped', 'active'], f'never / stopped / active ({u})')
        J("selectClient('cNever')"); pg.wait_for_timeout(600)
        check('Δεν ξεκίνησε το link' in J("document.getElementById('client-chips').innerText"), 'header chip «📵 Δεν ξεκίνησε το link»')
        J("selectClient('cStop')"); pg.wait_for_timeout(600)
        check('σταμάτησε πριν 20' in J("document.getElementById('client-chips').innerText"), 'header chip «⏸ Link: σταμάτησε πριν 20 ημ.»')
        fl = J("progressRosterData().filter(x=>x.flags.indexOf('never')>-1).map(x=>x.c.id)")
        check('cNever' in fl and 'cAct' not in fl, f'Πρόοδος flag never ({fl})')

        print('3. «Ο πελάτης στο link» μέσα στο Πλάνο')
        J("localStorage.setItem('fyh_pi_open','0')")
        J("selectClient('cAct')"); pg.wait_for_timeout(600); J("swTab(2)"); pg.wait_for_timeout(900)
        check(J("document.querySelectorAll('.pi-slot').length") == 4, 'adherence chip on every meal header')
        bp = J("document.querySelector('.pi-slot').textContent")
        # check-in χωρίς ανά-γεύμα map δεν μετρά ως «έχασε»· μόνο οι 4 μέρες με map → 100% (εναλλακτική = έφαγε)
        check(bp.strip().endswith('100%'), f'breakfast 100%: alternate counts as eaten, unknown days skipped ({bp})')
        check(J("document.querySelectorAll('.pi-mk').length") == 1 and J("document.querySelectorAll('.pi-cell-sw').length") == 7, '🔄 on breakfast header + all 7 breakfast cells')
        check(not J("!!document.getElementById('pi-panel')"), 'panel closed by default')
        J("piToggle()"); pg.wait_for_timeout(600)
        txt = J("document.getElementById('pi-panel')&&document.getElementById('pi-panel').innerText") or ''
        check('Αλλάζει συχνά' in txt and 'Ανά γεύμα' in txt, 'panel shows per-meal + swaps')
        J("swTab(1)"); pg.wait_for_timeout(400)
        check(not J("!!document.getElementById('pi-panel')"), 'panel hidden outside the Πλάνο tab')
        J("swTab(2)"); pg.wait_for_timeout(700)
        check(J("!!document.getElementById('pi-panel')"), 'panel remembers it was open')

        print('4. 🌱 Φρεσκάρισμα')
        sugs = J("frSuggestions(getC()).map(s=>({tag:s.tag,name:s.name,n:s.hits.length}))")
        check(len(sugs) >= 1 and sugs[0]['tag'] == 'picked' and sugs[0]['name'] == 'Πρωινό', f'client pick suggested first ({sugs[:2]})')
        before = J("JSON.stringify(getC().weekPlan)")
        kb = J("[0,1,2,3,4,5,6].map(d=>(getC().weekPlan[d]||[]).reduce((s,m)=>s+calculateMealKcal(m.foods),0))")
        J("frOpen()"); pg.wait_for_timeout(300)
        check(J("!!document.getElementById('fr-overlay')"), 'dialog opens')
        J("frApply()"); pg.wait_for_timeout(500)
        ka = J("[0,1,2,3,4,5,6].map(d=>(getC().weekPlan[d]||[]).reduce((s,m)=>s+calculateMealKcal(m.foods),0))")
        check(J("JSON.stringify(getC().weekPlan)") != before, 'plan changed')
        check(all(abs(a - b) / b < 0.03 for a, b in zip(ka, kb)), 'same kcal per day (±3%)')
        check(J("getC().weekPlan[0][0].foods.some(f=>/Γιαούρτι/.test(f.n))"), 'breakfast now the client’s pick')
        J("undo()"); pg.wait_for_timeout(500)
        check(J("JSON.stringify(getC().weekPlan)") == before, '↶ Αναίρεση restores the plan')

        print('5. Μηνύματα μέσα στο link')
        shared = J("window.__SERVER.shared")
        p2 = ctx.new_page(); p2.set_viewport_size({'width': 390, 'height': 844})
        p2.on('pageerror', lambda e: errors.append('link ' + str(e)))
        p2.add_init_script('window.__SERVER=' + json.dumps({'shared': shared, 'tables': {}}) + ';')
        p2.goto(f'http://localhost:{PORT}/plan.html?t=tokN'); p2.wait_for_timeout(2500)
        W = lambda: p2.evaluate("document.getElementById('whyLogCard')&&document.getElementById('whyLogCard').innerText") or ''
        check('Πώς δουλεύουμε μαζί' in W(), 'first open → «Πώς δουλεύουμε μαζί»')
        p2.evaluate("document.querySelector('#whyLogCard .in-btn').click()")
        p2.evaluate("""(()=>{const m={};[8,9,10].forEach(n=>{const d=new Date();d.setDate(d.getDate()-n);
            m[d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')]={0:true};});
            localStorage.setItem('fyh_portal_tokN_meals',JSON.stringify(m));})()""")
        p2.reload(); p2.wait_for_timeout(2000)
        check('Καλώς ήρθες πίσω' in W(), 'back after 8 days → «Καλώς ήρθες πίσω»')
        p2.evaluate("document.querySelector('#whyLogCard .in-x').click()")
        p2.reload(); p2.wait_for_timeout(1500)
        check(not W(), 'closed for today stays closed')
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
check(not errs, f'no console/page errors {errs[:3]}')
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
