"""Καρτέλα πελάτη με 4 υπο-καρτέλες: Επισκόπηση (+ Παρακολούθηση από κάτω) · Στοιχεία · Πλάνο (+ Ιστορικό ως κουμπί) · Μετρήσεις."""
import json, subprocess, sys, time, urllib.request, io, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8897
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

        J('selectClient("cA"); renderMain();'); pg.wait_for_timeout(700)
        tabs = J('[...document.querySelectorAll(".stabs .stab")].map(b=>b.textContent.trim())')
        check(tabs == ['📇 Επισκόπηση', 'Στοιχεία', 'Πλάνο', '📐 Μετρήσεις'], f'4 υπο-καρτέλες ({tabs})')
        print('1. Επισκόπηση = επισκόπηση + «📝 Ραντεβού» (πλήρης φόρμα) από κάτω')
        J('swTab(TAB_OVERVIEW)'); pg.wait_for_timeout(400)
        check(J('getComputedStyle(document.getElementById("s0ov")).display') == 'block', 'επισκόπηση ορατή')
        check(J('getComputedStyle(document.getElementById("ov-appt-wrap")).display') == 'block' and not J('document.getElementById("ov-appt-wrap").open'), 'ενότητα «📝 Ραντεβού» ορατή, κλειστή εξ ορισμού')
        check('Νέο ραντεβού' in J('document.getElementById("s3b").innerHTML'), 'περιεχόμενο «📝 Ραντεβού» (Νέο ραντεβού)')
        print('2. swTab(TAB_APPOINTMENTS) από Αρχική / Μηνύματα → ίδια σελίδα, ανοίγει την ενότητα')
        J('document.getElementById("ov-appt-wrap").open=false; swTab(1); swTab(TAB_APPOINTMENTS)'); pg.wait_for_timeout(500)
        check(J('document.querySelector(".stab.active").id') == 't0ov', 'φωτίζει «Επισκόπηση»')
        check(J('document.getElementById("ov-appt-wrap").open') is True, 'η ενότητα ανοίγει')
        print('3. Ιστορικό πλάνων από το Πλάνο')
        J('swTab(2)'); pg.wait_for_timeout(500)
        btn = J('[...document.querySelectorAll("#s2 .plan-toolbar button")].map(b=>b.textContent).filter(t=>t.indexOf("Ιστορικό")>-1)')
        check(len(btn) == 1, f'κουμπί «Ιστορικό πλάνων» στο Πλάνο ({btn})')
        J('swTab(4)'); pg.wait_for_timeout(300)
        check(J('document.querySelector(".stab.active").id') == 't2', 'Ιστορικό → φωτίζει «Πλάνο»')
        check(J('getComputedStyle(document.getElementById("s4")).display') == 'block' and J('getComputedStyle(document.getElementById("ov-appt-wrap")).display') == 'none', 'μόνο το Ιστορικό ορατό')
        check('Πίσω στο Πλάνο' in J('document.getElementById("s4").innerText'), 'κουμπί «← Πίσω στο Πλάνο»')
        print('4. Μετρήσεις + Αναίρεση/Επανάληψη ως εικονίδια')
        J('swTab(3)'); pg.wait_for_timeout(500)
        check(J('getComputedStyle(document.getElementById("s3")).display') == 'block', 'Μετρήσεις ορατές')
        check(J('document.getElementById("undoBtn").textContent.trim()') == '↶' and J('document.getElementById("redoBtn").textContent.trim()') == '↷', 'εικονίδια ↶ ↷')
        J('updateUndoRedoUI()')
        check(J('document.getElementById("undoBtn").disabled') in (True, False), 'updateUndoRedoUI δουλεύει με τα νέα κουμπιά')

        print('5. Στοιχεία: αποφυγές ομαδοποιημένες, αιματολογικές χωρίς κόκκινο')
        legumes = J('Object.keys(FOODS).filter(n=>FOODS[n].cat==="Όσπρια").slice(0,6)')
        J(f'(()=>{{const c=clients.find(x=>x.id==="cA"); c.foodExclude={json.dumps(legumes + ["Σολομός (ψητός)"], ensure_ascii=False)}; c.bloodTestStatus="none"; renderMain(); swTab(1);}})()'); pg.wait_for_timeout(500)
        hx = J('document.getElementById("header-exclude").textContent')
        check(hx == 'Όσπρια (6), Σολομός (ψητός)', f'«Όσπρια (6), Σολομός (ψητός)» ({hx!r})')
        ttl = J('document.getElementById("header-exclude").closest(".cchip").title')
        check('Σολομός' in ttl and legumes[0] in ttl, 'πλήρης λίστα στο hover')
        bt = J('document.getElementById("header-bloodtest").textContent')
        check('Δεν ζητήθηκαν' in bt and '❌' not in bt, f'αιματολογικές ουδέτερες ({bt!r})')
        btc = J('document.getElementById("header-bloodtest").closest(".cchip").className')
        check('warn' not in btc and 'good' not in btc, f'ουδέτερο chip, όχι κόκκινο ({btc})')

        print('5β. Κεφαλίδα με chips: σε Στοιχεία/Πλάνο/Μετρήσεις, όχι στην Επισκόπηση')
        check(J('getComputedStyle(document.getElementById("client-chips")).display') == 'flex', 'chips ορατά στα Στοιχεία')
        check(not J('document.querySelector("#s1 [id=header-measures]")'), 'η παλιά λωρίδα των 7 καρτών έφυγε από τα Στοιχεία')
        J('swTab(2)'); pg.wait_for_timeout(300)
        check(J('getComputedStyle(document.getElementById("client-chips")).display') == 'flex', 'chips ορατά στο Πλάνο')
        J('swTab(TAB_OVERVIEW)'); pg.wait_for_timeout(300)
        check(J('getComputedStyle(document.getElementById("client-chips")).display') == 'none', 'κρυφά στην Επισκόπηση')
        J('swTab(1)'); pg.wait_for_timeout(200)
        pg.fill('#inp-weight', '70'); pg.press('#inp-weight', 'Tab'); pg.wait_for_timeout(500)   # ενημερώνεται στο blur
        hm = J('document.getElementById("header-measures").textContent')
        check(hm.startswith('70kg'), f'ζωντανή ενημέρωση βάρους στο chip ({hm!r})')
        J('cycleBloodTestStatus()'); pg.wait_for_timeout(300)
        check('Σε αναμονή' in J('document.getElementById("header-bloodtest").textContent'), 'κλικ στις αιματολογικές → ⏳ Σε αναμονή')

        print('6. Βάση πλάνου: αναζήτηση + σειρά')
        J(f'(()=>{{const b=clients.find(x=>x.id==="{OLD}_1"); b.isMealTemplate=true; renderMain(); swTab(1);}})()'); pg.wait_for_timeout(400)
        groups = J('[...document.querySelectorAll(".tmpl-sel-drop optgroup")].map(g=>g.label)')
        check(len(groups) == 2 and groups[0].startswith('⭐') and groups[1].startswith('👤'), f'ομάδες ⭐ / 👤 ({groups})')
        check(not any('undefined' in o for o in J('[...document.querySelectorAll(".tmpl-sel-drop option")].map(o=>o.textContent)')), 'χωρίς «undefined»')
        pg.fill('.tmpl-sel-search', 'βασιλη')   # χωρίς τόνους / κεφαλαία
        pg.wait_for_timeout(200)
        vis = J('[...document.querySelectorAll(".tmpl-sel-drop option")].filter((o,i)=>i>0&&!o.hidden).map(o=>o.value)')
        check(vis == ['__client_' + OLD + '_1'], f'«βασιλη» → μόνο ο Βασίλης ({vis})')
        check(J('document.querySelector(".tmpl-sel-drop").size') > 1, 'η λίστα ανοίγει επί τόπου')
        pg.press('.tmpl-sel-search', 'Enter'); pg.wait_for_timeout(200)
        check(J('clients.find(x=>x.id==="cA").selectedTemplate') == '__client_' + OLD + '_1', 'Enter = επιλογή του 1ου αποτελέσματος')
        check(J('document.querySelector(".tmpl-sel-search").value') == '' and J('document.querySelector(".tmpl-sel-drop").size') in (0, 1), 'μετά την επιλογή καθαρίζει')
        check(not errors, f'κανένα console error ({errors[:3]})')
        br.close()
finally:
    srv.terminate()
print('PASS' if not fails else f'FAIL - {len(fails)} failed checks')
sys.exit(1 if fails else 0)
