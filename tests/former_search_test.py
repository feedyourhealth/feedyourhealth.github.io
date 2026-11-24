"""Αναζήτηση πελάτη βρίσκει ΚΑΙ τους Πρώην (2026-11-24): καρτέλα Πελάτες, «Βρες πελάτη» Αρχικής,
γρήγορες ενέργειες. Χωρίς κείμενο αναζήτησης οι λίστες μένουν μόνο με ενεργούς."""
import json, subprocess, sys, time, urllib.request, io, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8901
U1 = 'user-111'
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

today = datetime.date.today()
def ago(n): return (today - datetime.timedelta(days=n)).isoformat()
def ms_ago(n): return int((time.time() - n * 86400) * 1000)
def plan():
    return {str(d): [{'name': 'Πρωινό', 'foods': [{'n': 'Βρώμη (ωμή)', 'g': 40}]}] for d in range(7)}
def cl(cid, name, days, **kw):
    c = {'id': cid, 'name': name, 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod', 'goal': '-500', 'goalMain': 'loss',
         'allergenListsVer': 2, 'foodExclude': [], 'weekPlan': plan(), 'planGeneratedAt': ms_ago(days),
         'weightLog': [{'date': ago(days), 'weight': 65, 'bf': 0}], 'shareToken': 'tok_' + cid}
    c.update(kw); return c
arch = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=200)).isoformat()
clients = [
    cl('cA', 'Μαρία Ενεργή', 10),
    cl('cB', 'Νίκος Ενεργός', 10),
    cl('cF', 'Μαρία Παλιά', 400, archived=True, archivedAt=arch),
    cl('cG', 'Ζωή Πρώην', 400, archived=True, archivedAt=arch),
    cl('cD', 'Μαρία Διαγραμμένη', 400, deleted=True),
]
S = {'rows': {U1: {'data': {'clients': clients}, 'version': 1}}, 'tables': {'checkins': [], 'client_logs': [], 'plan_feedback': []}}

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
        pg.add_init_script('window.__SERVER=' + json.dumps(S) + ';window.__UID=' + json.dumps(U1) + ';localStorage.clear();')
        pg.goto(f'http://localhost:{PORT}/Dietologist.html', wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=10000)
        pg.wait_for_timeout(800)
        J = lambda js: pg.evaluate(js)

        print('1. Καρτέλα Πελάτες')
        J('renderClients(); filterClients("")'); pg.wait_for_timeout(200)
        txt = J('document.getElementById("main").textContent')
        check('📦 Πρώην πελάτες' in txt and 'Ζωή Πρώην' in txt, 'χωρίς αναζήτηση: η ενότητα Πρώην όπως πριν (όλοι)')
        J('filterClients("μαρία")'); pg.wait_for_timeout(200)
        txt = J('document.getElementById("main").textContent')
        check('Μαρία Ενεργή' in txt, 'ενεργός που ταιριάζει εμφανίζεται')
        check('Πρώην πελάτες που ταιριάζουν' in txt and 'Μαρία Παλιά' in txt, 'πρώην που ταιριάζει εμφανίζεται σε δική του ενότητα')
        check('Ζωή Πρώην' not in txt, 'πρώην που δεν ταιριάζει κρύβεται')
        check('Μαρία Διαγραμμένη' not in txt, 'διαγραμμένος δεν βγαίνει')
        J('filterClients("ζωή")'); pg.wait_for_timeout(200)
        txt = J('document.getElementById("main").textContent')
        check('βρέθηκε στους πρώην' in txt and 'Ζωή Πρώην' in txt, 'μόνο πρώην: μήνυμα «βρέθηκε στους πρώην» + κάρτα')
        J('document.querySelector(".cc-muted .cc-restore").click()'); pg.wait_for_timeout(300)
        check(J('curId') == 'cG', '«Άνοιγμα» ανοίγει τον πρώην πελάτη')
        J('filterClients("")')

        print('2. Αρχική «Βρες πελάτη»')
        J('curId=null; swTab(0)'); pg.wait_for_timeout(400)
        opts = J('[...document.querySelectorAll("#hm-find-list option")].map(o=>o.value)')
        check('Ζωή Πρώην' in opts and 'Μαρία Διαγραμμένη' not in opts, 'datalist έχει πρώην, όχι διαγραμμένους')
        J('homeQuickFind("ζωή")'); pg.wait_for_timeout(300)
        check(J('curId') == 'cG', 'homeQuickFind βρίσκει πρώην')
        J('curId=null; swTab(0)'); pg.wait_for_timeout(300)
        J('homeQuickFind("μαρία")'); pg.wait_for_timeout(300)
        check(J('curId') == 'cA', 'ενεργός προηγείται του πρώην με ίδιο όνομα')

        print('3. Γρήγορες ενέργειες')
        check(J('qaMatchingClients("").map(c=>c.id)') == ['cA', 'cB'], 'χωρίς κείμενο: μόνο ενεργοί')
        check(J('qaMatchingClients("μαρία").map(c=>c.id)') == ['cA', 'cF'], 'με κείμενο: ενεργοί πρώτα, μετά πρώην')
        J('curId=null; swTab(0)'); pg.wait_for_timeout(300)
        J('toggleQA("qa-newplan"); renderQANewPlan("ζωή")')
        row = J('(document.querySelector("#qa-newplan-results .qa-row")||{}).innerText||""')
        check('Ζωή Πρώην' in row and 'πρώην' in row, f'γραμμή με σήμα «📦 πρώην» ({row!r})')

        br.close()
finally:
    srv.terminate()

real_errors = [e for e in errors if 'favicon' not in e and 'Failed to load resource' not in e]
check(not real_errors, 'χωρίς JS errors ' + (str(real_errors[:3]) if real_errors else ''))
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
