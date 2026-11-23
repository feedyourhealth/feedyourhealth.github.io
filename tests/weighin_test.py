"""⚖️ Αγώνας με ζύγιση: κατηγορία στο παράθυρο αγώνα → κάρτα (Ιστορικό + Μετρήσεις) με απόσταση, ρυθμό,
ελάχιστο ασφαλές βάρος, ανήλικοι → ο γυμναστής βλέπει τον αγώνα στην αναφορά και στη λίστα του."""
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

T0 = datetime.date.today()
D = lambda n: (T0 + datetime.timedelta(days=n)).isoformat()
log = [{'date': D(-28), 'weight': 77.0, 'bf': 14.0}, {'date': D(-14), 'weight': 76.2}, {'date': D(0), 'weight': 75.4, 'bf': 13.5}]
ko = {'id': 'ko', 'name': 'Κώστας Μιχαήλ', 'sex': 'M', 'age': 24, 'weight': 75.4, 'height': 175, 'activity': 'moderate', 'goalMain': 'loss',
      'allergenListsVer': 2, 'foodExclude': [], 'sport': 'custom', 'weightLog': log, 'trainerId': 'tr1', 'trainerConsent': True,
      'trainerConsentAt': '2026-11-01T10:00:00Z', 'races': []}
ni = dict(ko, id='ni', name='Νίκος Junior', age=16, trainerId=None, trainerConsent=False)
trainers = [{'id': 'tr1', 'name': 'Γιάννης Judo', 'kind': 'coach', 'lang': 'el', 'phone': '99111222'}]
S = {'rows': {U1: {'data': {'clients': [ko, ni], 'customTemplates': [], 'trainers': trainers}, 'version': 1}}}

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(bypass_csp=True, viewport={'width': 1400, 'height': 1000})
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
        C = lambda cid: J(f'clients.find(x=>x.id==="{cid}")')

        print('1. Παράθυρο αγώνα: κατηγορία + ζύγιση')
        J('selectClient("ko"); renderMain();'); pg.wait_for_timeout(300)
        J('phaOpenRaceModal()'); pg.wait_for_timeout(100)
        check(not pg.is_visible('#pha-r-weigh'), 'weigh fields hidden for other race types')
        pg.fill('#pha-r-name', 'Παγκύπριο Judo'); pg.fill('#pha-r-date', D(13))
        pg.select_option('#pha-r-type', 'weighin')
        check(pg.is_visible('#pha-r-weigh'), 'weigh fields appear for «Αγώνας με ζύγιση»')
        pg.fill('#pha-r-cls', '73'); pg.fill('#pha-r-wdate', D(12))
        J('phaSaveRace(null)'); pg.wait_for_timeout(200)
        r = (C('ko').get('races') or [{}])[0]
        check(r.get('weightClass') == 73 and r.get('weighDate') == D(12) and r.get('type') == 'weighin', f'saved class + weigh date ({r})')

        print('2. Επίπεδα κινδύνου')
        def info(cls, cid='ko'):
            J(f'clients.find(x=>x.id==="{cid}").races[0].weightClass={cls}')
            return J(f'phaWeighInfo(clients.find(x=>x.id==="{cid}"))')
        I = info(73)
        check(abs(I['dist'] - 2.4) < 0.01 and I['days'] == 12 and I['level'] == 'bad', f"−73: 2,4 kg in 12 days → bad ({I['level']}, {round(I['needWk'],2)}/wk)")
        check(I['rate'] is not None and I['rate'] < 0, f"current rate from measurements ({I['rate']})")
        check(abs(I['minW'] - 68.7) < 0.2, f"min safe weight from lean mass, 5% BF ({I['minW']})")
        check(info(75)['level'] == 'ok', '−75: mild → ok')
        check(info(74.5)['level'] == 'warn', '−74,5: consistent deficit → warn')
        check(info(76)['level'] == 'in', '−76: already within')
        I = info(66)
        check(I['level'] == 'bad' and 'ελάχιστο ασφαλές' in I['msgs'][0], 'class below min safe weight → bad with reason')
        info(73)

        print('3. Κάρτα στο Ιστορικό + στις Μετρήσεις')
        J('swTab(4)'); pg.wait_for_timeout(400)
        hist = J('(document.getElementById("pha-weigh-card-history")||{}).innerText||""')
        check('Ζύγιση · Παγκύπριο Judo' in hist and '−73 kg' in hist and '2,4 kg' in hist, 'card in plan history')
        check('Μίλα με τον Γιάννη' in hist, 'WhatsApp to the coach')
        J('swTab(3)'); pg.wait_for_timeout(400)
        tr = J('(document.getElementById("pha-weigh-card-tracker")||{}).innerText||""')
        check('−73 kg' in tr and 'πάνω από το ασφαλές 1%' in tr, 'card in Μετρήσεις with the warning')
        J('clients.find(x=>x.id==="ko").races[0].weighDate="' + D(90) + '";clients.find(x=>x.id==="ko").races[0].date="' + D(90) + '"; swTab(3)'); pg.wait_for_timeout(300)
        check(not J('!!document.getElementById("pha-weigh-card-tracker")'), 'not in Μετρήσεις when the weigh-in is >60 days away')
        J('clients.find(x=>x.id==="ko").races[0].weighDate="' + D(12) + '";clients.find(x=>x.id==="ko").races[0].date="' + D(13) + '"')

        print('4. Ανήλικος')
        J('clients.find(x=>x.id==="ni").races=[{id:"r9",name:"Πρωτάθλημα U18",date:"' + D(20) + '",weighDate:"' + D(20) + '",type:"weighin",weightClass:75}]')
        I = info(75, 'ni')
        check(I['minor'] and I['minBf'] == 7 and any('Ανήλικος' in m for m in I['msgs']), 'minor: 7% floor + no-dehydration note')

        print('5. Ο προπονητής βλέπει τον αγώνα')
        J('openTrainerSend("ko")'); pg.wait_for_timeout(150)
        check(J('!!document.getElementById("trs-comp2") && document.getElementById("trs-comp2").checked'), 'send modal offers «Επόμενος αγώνας» (on)')
        J('createTrainerLink()'); pg.wait_for_timeout(500)
        tok = C('ko').get('trainerToken')
        snap = J(f'window.__SERVER.shared["{tok}"].snapshot')
        comp = snap.get('comp') or {}
        check(comp.get('cls') == 73 and abs(comp.get('dist', 0) - 2.4) < 0.01 and comp.get('level') == 'bad', f'snapshot.comp ({comp})')
        J('createTrainerHub("tr1")'); pg.wait_for_timeout(500)
        hub = J('getTrainer("tr1").hubToken')
        gp = ctx.new_page()
        gp.on('pageerror', lambda e: errors.append('gymnastis: ' + str(e)))
        gp.add_init_script('window.__SERVER=' + json.dumps({'shared': J('window.__SERVER.shared')}) + ';')
        gp.goto(f'http://localhost:{PORT}/gymnastis.html?t={tok}', wait_until='domcontentloaded'); gp.wait_for_timeout(500)
        t = gp.evaluate('document.getElementById("root").textContent')
        check('Επόμενος αγώνας' in t and 'Παγκύπριο Judo' in t and 'σε 13 μέρες' in t and '−73 kg' in t and 'Δεν είναι ασφαλές' in t, 'report shows competition + class + warning')
        gp.goto(f'http://localhost:{PORT}/gymnastis.html?h={hub}', wait_until='domcontentloaded'); gp.wait_for_timeout(500)
        t = gp.evaluate('document.getElementById("root").textContent')
        check('🏆 Παγκύπριο Judo · σε 13 μέρες · −73 kg' in t, 'hub line shows the competition')
        br.close()
finally:
    srv.terminate()

real_errors = [x for x in errors if 'favicon' not in x]
check(not real_errors, f'no console/page errors ({real_errors[:3]})')
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
