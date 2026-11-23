"""📤 Γυμναστές, βελτιώσεις 1+2: (1) οι αναφορές της λίστας λήγουν μαζί της, «Παλιά» μετά από 8 εβδ.
(λίστα + αναφορά)· (2) εκκρεμείς αναφορές στην Αρχική «Σήμερα», στο 🔔 και στο βραδινό email."""
import json, subprocess, sys, time, urllib.request, io, datetime as dt
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / 'scripts'))
import notif_digest as nd
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8895
U1 = 'user-111'
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

T0 = dt.date.today()
D = lambda n: (T0 + dt.timedelta(days=n)).isoformat()
base = {'sex': 'F', 'age': 30, 'height': 165, 'activity': 'light', 'goalMain': 'maintain', 'allergenListsVer': 2, 'foodExclude': []}
el = dict(base, id='el', name='Ελένη Σταύρου', weight=64, trainerId='tr1', trainerConsent=True, trainerConsentAt='2026-11-01T10:00:00Z',
          weightLog=[{'date': D(-30), 'weight': 65, 'bf': 28}, {'date': D(0), 'weight': 64, 'bf': 27}],
          trainerSends=[{'at': '2026-10-25T10:00:00Z', 'measDate': D(-30), 'trainerId': 'tr1'}], trainerToken='rep_el')
pe = dict(base, id='pe', name='Πέτρος Λοΐζου', sex='M', weight=88, trainerId='tr1', trainerConsent=True, trainerConsentAt='2026-06-01T10:00:00Z',
          weightLog=[{'date': D(-70), 'weight': 88, 'bf': 22}],
          trainerSends=[{'at': '2026-09-14T10:00:00Z', 'measDate': D(-70), 'trainerId': 'tr1'}], trainerToken='rep_pe')
no = dict(base, id='no', name='Νόρα Χωρίς', weight=60, trainerId='tr1', trainerConsent=False, weightLog=[{'date': D(0), 'weight': 60}])
trainers = [{'id': 'tr1', 'name': 'Ανδρέας Κωνσταντίνου', 'kind': 'trainer', 'lang': 'el', 'phone': '99887766'}]
soon = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=3)).strftime('%Y-%m-%dT%H:%M:%SZ')
S = {'rows': {U1: {'data': {'clients': [el, pe, no], 'customTemplates': [], 'trainers': trainers}, 'version': 1}},
     'shared': {'rep_el': {'token': 'rep_el', 'snapshot': {'kind': 'trainer'}, 'expires_at': soon},
                'rep_pe': {'token': 'rep_pe', 'snapshot': {'kind': 'trainer'}, 'expires_at': soon}}}

print('0. Βραδινό email (scripts/notif_digest.py)')
NOW = dt.datetime.now(dt.timezone.utc)
dg = nd.build_digest({'clients': [el, pe, no], 'trainers': trainers}, {}, NOW)
names = [c['name'] for c, t in dg['day']['trainer']]
check(names == ['Ελένη Σταύρου'], f'only the unsent measurement with consent ({names})')
check('αναφορά σε γυμναστή δεν στάλθηκε' in dg['html'] and 'Ελένη Σ. → Ανδρέας' in dg['html'], 'email row')
dg2 = nd.build_digest({'clients': [el], 'trainers': trainers, 'notifPrefs': {'trainer': 'off'}}, {}, NOW)
check(dg2['day']['trainer'] == [], 'pref off → no row')

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

        print('1. Οι αναφορές λήγουν μαζί με τη λίστα')
        J('createTrainerHub("tr1")'); pg.wait_for_timeout(600)
        hub = J('getTrainer("tr1").hubToken')
        hexp = J(f'window.__SERVER.shared["{hub}"].expires_at')
        check(J('window.__SERVER.shared.rep_el.expires_at') == hexp and J('window.__SERVER.shared.rep_pe.expires_at') == hexp, 'report rows extended to the hub expiry')
        check(J('window.__SERVER.shared.rep_el.snapshot.kind') == 'trainer', 'report content untouched')

        print('2. «Παλιά» στη λίστα και στην αναφορά')
        snap = J(f'window.__SERVER.shared["{hub}"].snapshot')
        rep = {'v': 1, 'kind': 'trainer', 'lang': 'el', 'client': {'name': 'Πέτρος Λοΐζου'}, 'trainer': {'name': 'Ανδρέας', 'kind': 'trainer'},
               'meas': [{'d': D(-70), 'w': 88, 'bf': 22, 'fm': 19.4, 'lbm': 68.6}], 'note': ''}
        gp = ctx.new_page()
        gp.on('pageerror', lambda e: errors.append('hub: ' + str(e)))
        gp.add_init_script('window.__SERVER=' + json.dumps({'shared': {hub: {'snapshot': snap, 'expires_at': hexp}, 'rep_pe': {'snapshot': rep, 'expires_at': hexp}}}) + ';')
        gp.goto(f'http://localhost:{PORT}/gymnastis.html?h={hub}', wait_until='domcontentloaded'); gp.wait_for_timeout(500)
        cards = gp.evaluate('[...document.querySelectorAll(".hubc")].map(a=>({t:a.textContent,old:a.classList.contains("old")}))')
        pcard = [c for c in cards if 'Πέτρος' in c['t']]
        ecard = [c for c in cards if 'Ελένη' in c['t']]
        check(pcard and pcard[0]['old'] and 'Παλιά' in pcard[0]['t'] and '10 εβδομάδες πριν' in pcard[0]['t'], f'70-day-old measurement → faded «Παλιά» ({pcard})')
        check(ecard and not ecard[0]['old'], 'recent one stays normal')
        gp.goto(f'http://localhost:{PORT}/gymnastis.html?t=rep_pe&h={hub}', wait_until='domcontentloaded'); gp.wait_for_timeout(500)
        check('Η τελευταία μέτρηση είναι 10 εβδομάδων' in gp.evaluate('document.getElementById("root").textContent'), 'report shows the «old measurement» note')

        print('3. Αρχική «Σήμερα»')
        J('curId=null; swTab(0)'); pg.wait_for_timeout(600)
        home = J('document.getElementById("main").innerText')
        check('📤 Αναφορές σε γυμναστές' in home and 'Ελένη Σταύρου' in home, 'home card lists the pending report')
        check('Νόρα' not in home.split('📤 Αναφορές σε γυμναστές')[1][:200], 'no consent → not listed')
        check('Μέτρηση' in home and '→ Ανδρέας Κωνσταντίνου' in home, 'row says which measurement → which trainer')
        J('[...document.querySelectorAll(".hm-action-btn")].find(b=>b.textContent.includes("Στον Ανδρέα")).click()'); pg.wait_for_timeout(200)
        check(pg.is_visible('#tr-send-ov'), 'button opens the send window (accusative «Στον Ανδρέα»)')

        print('4. 🔔')
        g = J('(function(){var g=notifDigestFor(notifDayKey(0),[]);return {n:g.trainer.length,total:g.total,html:notifDigestHtml(g,notifDayKey(0))};})()')
        check(g['n'] == 1 and 'αναφορά σε γυμναστή δεν στάλθηκε' in g['html'], 'digest row in the bell (no red badge)')
        check(J('notifAlertCount()') == 0, 'does not raise the red «needs you» count')
        J('createTrainerLink()'); pg.wait_for_timeout(600)
        check(J('trainerPendingReports().length') == 0, 'after sending → no longer pending')
        J('document.getElementById("tr-send-ov").remove(); curId=null; swTab(0)'); pg.wait_for_timeout(500)
        check('📤 Αναφορές σε γυμναστές' not in J('document.getElementById("main").innerText'), 'home card disappears')
        J('notifSetMode("trainer","off")')
        J('clients.find(x=>x.id==="el").weightLog.push({date:"' + D(0) + 'X",weight:63.9})')
        check(J('notifDigestFor(notifDayKey(0),[]).trainer.length') == 0, 'bell setting «Όχι» hides it')
        br.close()
finally:
    srv.terminate()

real_errors = [x for x in errors if 'favicon' not in x]
check(not real_errors, f'no console/page errors ({real_errors[:3]})')
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
