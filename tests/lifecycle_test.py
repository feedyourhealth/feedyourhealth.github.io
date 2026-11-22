"""Ενεργός / Σε παύση / Πρώην (js/client-list/lifecycle.js):
πρόταση «Πρώην» μετά από 60 μέρες χωρίς δραστηριότητα, εξαίρεση από τις λίστες προσοχής,
παράθυρο ελέγχου (Πρώην / παύση / ενεργός), αυτόματη επιστροφή με check-in / μέτρηση / πλάνο."""
import json, subprocess, sys, time, urllib.request, io, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8899
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
OLD = 'c' + str(ms_ago(300))
clients = [
    cl('cA', 'Άννα Πρόσφατη', 10),
    cl(OLD + '_1', 'Βασίλης Παλιός', 100),
    cl(OLD + '_2', 'Γιώτα CheckIn', 100),
    cl(OLD + '_3', 'Δήμος Ραντεβού', 100, nextAppointmentDate=(today + datetime.timedelta(days=5)).isoformat()),
    cl(OLD + '_4', 'Ελένη Παύση', 100, pausedUntil=(today + datetime.timedelta(days=20)).isoformat()),
    cl(OLD + '_5', 'Φώτης Πρώην', 100, archived=True, archivedAt=(datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=20)).isoformat()),
    cl(OLD + '_6', 'Γεωργία Αστέρι', 90, isMealTemplate=True),
]
checkins = [{'token': 'tok_' + OLD + '_2', 'date': ago(3), 'meals_done': 3, 'meals_total': 5, 'water_glasses': 5, 'water_goal': 8, 'supps_done': 0, 'supps_total': 0},
            {'token': 'tok_' + OLD + '_5', 'date': ago(2), 'meals_done': 4, 'meals_total': 5, 'water_glasses': 5, 'water_goal': 8, 'supps_done': 0, 'supps_total': 0}]
S = {'rows': {U1: {'data': {'clients': clients}, 'version': 1}}, 'tables': {'checkins': checkins, 'client_logs': [], 'plan_feedback': []}}

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
        pg.wait_for_function('Cloud._checkinsLoaded && Cloud._clientLogsLoaded && Cloud._planFeedbackLoaded', timeout=10000)
        pg.wait_for_timeout(800)
        J = lambda js: pg.evaluate(js)
        C = lambda cid: f'clients.find(x=>x.id==="{cid}")'

        print('1. Αυτόματη επιστροφή Πρώην με νέο check-in')
        check(J(f'{C(OLD+"_5")}.archived') is False, 'Φώτης (Πρώην, check-in μετά τη μετακίνηση) → ξανά Ενεργός')
        check(J(f'!!{C(OLD+"_5")}.lcActiveSince'), 'lcActiveSince γράφτηκε (δεν ξαναπροτείνεται αμέσως)')

        print('2. Προτάσεις για Πρώην')
        names = J('lcFormerCandidates().map(x=>x.c.name)')
        check(sorted(names) == sorted(['Βασίλης Παλιός', 'Γεωργία Αστέρι']), f'μόνο οι 2 ανενεργοί ({names})')
        check('Γιώτα CheckIn' not in names, 'check-in πριν 3 μέρες μετράει ως δραστηριότητα')
        check('Δήμος Ραντεβού' not in names, 'μελλοντικό ραντεβού = όχι πρόταση')
        check('Ελένη Παύση' not in names, 'σε παύση = όχι πρόταση')

        print('3. Αρχική: κάρτα πρότασης, χωρίς «προσοχή» για τους ήσυχους')
        J('curId=null; swTab(0)'); pg.wait_for_timeout(500)
        card = J('(document.querySelector(".lc-suggest")||{}).innerText||""')
        check('2 πελάτες χωρίς δραστηριότητα' in card, f'κάρτα «2 πελάτες…» ({card[:60]!r})')
        attn = J('homeClientsNeedingAttention().map(x=>x.c.name)')
        for n in ['Βασίλης Παλιός', 'Γεωργία Αστέρι', 'Ελένη Παύση']:
            check(n not in attn, f'{n} όχι στο «χρειάζονται προσοχή»')
        check(J('homeAttentionBuckets().green.map(x=>x.c.name)').count('Ελένη Παύση') == 0, 'σε παύση ≠ «Ενεργοί, εντάξει»')
        check(J(f'clientNeedsAttention({C(OLD+"_1")})') is False, 'clientNeedsAttention false για προτεινόμενο Πρώην')

        print('4. Παράθυρο ελέγχου: Βασίλης → Πρώην, Γεωργία → παύση 1 μήνα')
        pg.click('.lc-suggest button'); pg.wait_for_timeout(300)
        check(J('document.querySelectorAll("#lc-overlay .lc-row").length') == 2, '2 γραμμές στο παράθυρο')
        J(f'document.querySelector(\'#lc-overlay .lc-row-sel[data-id="{OLD}_6"]\').value="p30"; lcUpdateApplySum()')
        check('1 → Πρώην' in J('document.getElementById("lc-apply-sum").textContent'), 'σύνοψη εφαρμογής')
        pg.click('#lc-overlay .wait-btn-primary'); pg.wait_for_timeout(500)
        check(J(f'{C(OLD+"_1")}.archived') is True, 'Βασίλης archived (Πρώην)')
        exp = (today + datetime.timedelta(days=30)).isoformat()
        check(J(f'{C(OLD+"_6")}.pausedUntil') == exp and J(f'lcIsPaused({C(OLD+"_6")})'), f'Γεωργία σε παύση έως {exp}')
        check(not J('document.querySelector(".lc-suggest")'), 'η κάρτα πρότασης χάθηκε')

        print('5. Πελάτες: chip «Σε παύση», ενότητα «Πρώην πελάτες»')
        J('swTab(7)'); pg.wait_for_timeout(400)
        txt = J('document.querySelector(".main").textContent')
        check('⏸ Σε παύση (2)' in txt, 'chip ⏸ Σε παύση (2)')
        check('📦 Πρώην πελάτες' in txt, 'ενότητα «📦 Πρώην πελάτες»')

        print('6. Καρτέλα πελάτη: κουμπί + λωρίδα + αλλαγή κατάστασης')
        J(f'selectClient("{OLD}_6"); renderMain();'); pg.wait_for_timeout(600)
        check('Σε παύση' in J('document.getElementById("client-lc-btn").innerText'), 'κουμπί κεφαλίδας «⏸ Σε παύση»')
        check('Σε παύση έως' in J('document.getElementById("lc-banner-slot").innerText'), 'λωρίδα «Σε παύση έως…»')
        pg.click('#client-lc-btn'); pg.wait_for_timeout(200)
        pg.click('#lc-client-overlay .lc-opt >> nth=0'); pg.wait_for_timeout(300)
        check(not J(f'{C(OLD+"_6")}.pausedUntil') and J('document.getElementById("lc-banner-slot").innerText') == '', '«Ενεργός» → τέλος παύσης, χωρίς λωρίδα')
        check(J(f'lcIsQuiet({C(OLD+"_6")})') is False, 'δεν ξαναπροτείνεται για Πρώην (lcActiveSince)')

        print('7. Νέα μέτρηση επαναφέρει Πρώην· παλιά (CSV ιστορικού) όχι')
        check(J(f'lcBackToActive({C(OLD+"_1")},"νέα μέτρηση","{ago(200)}")') is False and J(f'{C(OLD+"_1")}.archived'), 'μέτρηση 200 ημερών πριν: μένει Πρώην')
        J(f'selectClient("{OLD}_1"); renderMain(); swTab(3)'); pg.wait_for_timeout(600)
        check('Πρώην πελάτης' in J('document.getElementById("lc-banner-slot").innerText'), 'λωρίδα «Πρώην πελάτης» στην καρτέλα')
        J('document.getElementById("tr-date").value=new Date().toISOString().slice(0,10); document.getElementById("tr-weight").value="64"; addWeightEntry()')
        pg.wait_for_timeout(400)
        check(J(f'{C(OLD+"_1")}.archived') is False, 'νέα μέτρηση σήμερα → ξανά Ενεργός')

        print('8. Πρόοδος: σε παύση χωρίς σημαίες προσοχής')
        J(f'lcClientSet("{OLD}_4","p60")')
        rd = J(f'progressRosterData().find(x=>x.c.id==="{OLD}_4").flags')
        check(rd == ['paused'], f'flags = [paused] ({rd})')

        check(not errors, f'κανένα console error ({errors[:3]})')
        br.close()
finally:
    srv.terminate()
print('\nPASS' if not fails else f'\nFAIL — {len(fails)} failed checks')
sys.exit(1 if fails else 0)
