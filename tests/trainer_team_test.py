"""📋 Πίνακας ομάδας στον σύνδεσμο προπονητή: στήλες από την εφαρμογή (γρήγορη απώλεια, ενέργεια EA,
προπονήσεις 7 ημ. ΜΟΝΟ με συναίνεση) → διακόπτης Λίστα/Πίνακας, σήματα, ταξινόμηση, χωρίς ιατρικά."""
import json, subprocess, sys, time, urllib.request, io, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8896
U1 = 'user-111'
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

T0 = datetime.date.today()
D = lambda n: (T0 + datetime.timedelta(days=n)).isoformat()
base = {'sex': 'M', 'age': 16, 'height': 172, 'activity': 'moderate', 'goalMain': 'maintain', 'allergenListsVer': 2, 'foodExclude': [],
        'sport': 'football', 'trainerId': 'co', 'trainerConsent': True, 'trainerConsentAt': '2026-11-01T10:00:00Z',
        'trainDays': [True, False, True, False, True, False, False]}
def ath(i, name, logs, **kw):
    d = dict(base, id=i, name=name, weight=logs[-1]['weight'], weightLog=logs, trainerToken='rep_' + i, shareToken='sh_' + i,
             trainerSends=[{'at': '2026-11-20T10:00:00Z', 'measDate': logs[-1]['date'], 'trainerId': 'co'}])
    d.update(kw); return d
a1 = ath('a1', 'Αντρέας Νικολάου', [{'date': D(-14), 'weight': 62.0, 'bf': 12.9}, {'date': D(-1), 'weight': 61.8, 'bf': 12.1}], trainerShareWorkouts=True)
a2 = ath('a2', 'Μάριος Κυριάκου', [{'date': D(-8), 'weight': 60.0, 'bf': 11.5}, {'date': D(-1), 'weight': 58.9, 'bf': 9.4}],
         menstrualCycle='absent', medicalHistory='ΜΥΣΤΙΚΟ')
a3 = ath('a3', 'Σάββας Θεοδώρου', [{'date': D(-40), 'weight': 70.0, 'bf': 14.0}])
a4 = ath('a4', 'Χρίστος Χωρίς συναίνεση', [{'date': D(-2), 'weight': 65.0}], trainerConsent=False, trainerToken=None)
trainers = [{'id': 'co', 'name': 'Γιώργος Χ.', 'kind': 'coach', 'lang': 'el', 'phone': '99000111'}]
S = {'rows': {U1: {'data': {'clients': [a1, a2, a3, a4], 'customTemplates': [], 'trainers': trainers}, 'version': 1}}}

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(bypass_csp=True, viewport={'width': 1300, 'height': 950})
        ctx.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        ctx.route('**/*.supabase.co/**', lambda r: r.abort())
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.on('dialog', lambda d: d.accept())
        pg.add_init_script('if(!window.__SERVER){window.__SERVER=' + json.dumps(S) + ';window.__UID=' + json.dumps(U1) + ';localStorage.clear();}')
        pg.goto(f'http://localhost:{PORT}/Dietologist.html', wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=10000)
        pg.wait_for_timeout(800)
        J = lambda js: pg.evaluate(js)
        # προπονήσεις που σημείωσαν (2 από τις τελευταίες 7 μέρες) — και για τον a2 που ΔΕΝ έχει συναίνεση προπονήσεων
        wl = [{'date': D(-1), 'data': {'d': True}}, {'date': D(-3), 'data': {'e': {'t': 'run', 'm': 30}}}, {'date': D(-12), 'data': {'d': True}}]
        J('Cloud._workoutLogCache={sh_a1:' + json.dumps(wl) + ',sh_a2:' + json.dumps(wl) + '}')

        print('1. Στήλες από την εφαρμογή')
        r1 = J('_trTeamRow(clients.find(x=>x.id==="a1"))')
        r2 = J('_trTeamRow(clients.find(x=>x.id==="a2"))')
        r3 = J('_trTeamRow(clients.find(x=>x.id==="a3"))')
        check(r1.get('wk') and r1['wk']['done'] == 2 and r1['wk']['planned'] >= 2, f"a1: workouts 7d with consent ({r1.get('wk')})")
        check('wk' not in r2, 'a2: no workouts without that consent')
        check(r2.get('fastLoss') and r2['fastLoss'] > 1, f"a2: 1,1 kg in 7 days → fast loss ({r2.get('fastLoss')}%/wk)")
        check(not r1.get('fastLoss'), 'a1: slow change → no flag')
        check(isinstance(r1.get('ea'), (int, float)), f"athlete → energy availability number ({r1.get('ea')})")
        check(r3.get('lastMeas') == D(-40), 'a3: last measurement date carried')

        print('2. Συναίνεση προπονήσεων στην κάρτα πελάτη')
        J('selectClient("a2"); renderMain(); swTab(1)'); pg.wait_for_timeout(300)
        card = J('document.getElementById("sec-trainer").innerText')
        check('Ο γονέας συμφωνεί (ανήλικος)' in card and 'πόσες προπονήσεις σημειώνει' in card, 'minor wording + workouts consent checkbox')
        J('setClientTrainerWorkouts(true)')
        check(J('clients.find(x=>x.id==="a2").trainerShareWorkouts') is True, 'workouts consent saved')
        J('setClientTrainerWorkouts(false)')

        print('3. Σύνδεσμος προπονητή → πίνακας ομάδας')
        J('createTrainerHub("co")'); pg.wait_for_timeout(500)
        hub = J('getTrainer("co").hubToken')
        snap = J(f'window.__SERVER.shared["{hub}"].snapshot')
        js = json.dumps(snap, ensure_ascii=False)
        check(len(snap['clients']) == 3 and 'Χρίστος' not in js, 'only consented athletes')
        check('ΜΥΣΤΙΚΟ' not in js and 'menstrual' not in js and 'absent' not in js, 'no medical / menstrual data in the hub')
        # για να ελέγξουμε τη σελίδα: ο a2 με χαμηλή ενέργεια
        for c in snap['clients']:
            if c['name'].startswith('Μάριος'): c['team']['ea'] = 24
            if c['name'].startswith('Αντρέας'): c['team']['ea'] = 50
            if c['name'].startswith('Σάββας'): c['team']['ea'] = 38; c['comp'] = {'name': 'Κύπελλο', 'date': D(10), 'cls': None}
        gp = ctx.new_page()
        gp.on('pageerror', lambda e: errors.append('hub: ' + str(e)))
        gp.on('console', lambda m: errors.append('hub: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        gp.add_init_script('window.__SERVER=' + json.dumps({'shared': {hub: {'snapshot': snap, 'expires_at': '2027-06-01T00:00:00Z'}}}) + ';')
        gp.goto(f'http://localhost:{PORT}/gymnastis.html?h={hub}', wait_until='domcontentloaded'); gp.wait_for_timeout(500)
        check(gp.evaluate('!!document.querySelector(".seg")'), 'coach gets the List / Team toggle')
        check(gp.evaluate('!!document.querySelector("table.team")') is False, 'coach with <4 athletes starts on the list')
        gp.click('.seg button:nth-child(2)'); gp.wait_for_timeout(200)
        rows = gp.evaluate('[...document.querySelectorAll("table.team tbody tr")].map(r=>r.innerText)')
        check(len(rows) == 3, f'3 rows ({len(rows)})')
        check(rows[0].startswith('Μάριος') and 'Χαμηλή ενέργεια' in rows[0] and 'Γρήγορη απώλεια' in rows[0], f'most urgent first ({rows[0][:60]!r})')
        check(any(r.startswith('Σάββας') and 'Χρειάζεται μέτρηση' in r and 'Οριακή ενέργεια' in r and 'Αγώνας σε 10' in r for r in rows), 'Σάββας: old measurement + borderline + competition')
        check(any(r.startswith('Αντρέας') and '2/' in r and 'ΟΚ' in r for r in rows), 'Αντρέας: workouts 2/x + OK')
        check(gp.evaluate('document.querySelector(".seg .cnt").textContent') == '2', 'toggle badge counts athletes needing attention')
        gp.reload(); gp.wait_for_timeout(500)
        check(gp.evaluate('!!document.querySelector("table.team")'), 'view choice remembered')
        gp.click('table.team tbody tr a'); gp.wait_for_timeout(300)
        check('t=rep_a2' in gp.url, 'name opens that athlete\'s report')
        br.close()
finally:
    srv.terminate()

real_errors = [x for x in errors if 'favicon' not in x]
check(not real_errors, f'no console/page errors ({real_errors[:3]})')
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
