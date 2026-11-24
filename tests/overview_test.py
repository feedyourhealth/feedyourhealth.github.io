"""📇 Επισκόπηση (2026-11-24): κεφαλίδα με κλινικά flags · «Τι συμφωνήσαμε» · «Η προσπάθεια από τότε»
(κάρτες + λωρίδα ημερών) · «Τι μου είπε» · γράφημα · «Για συζήτηση σήμερα» + γρήγορη καταχώρηση ·
κλειστά πλήρες ιστορικό/υπόβαθρο · η «📝 Ραντεβού» από κάτω χωρίς τις διπλές κάρτες."""
import json, subprocess, sys, time, urllib.request, io, datetime, os
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8911
U1 = 'user-111'
SHOT = os.environ.get('OV_SHOT')   # προαιρετικό: φάκελος για screenshots
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

today = datetime.date.today()
def dk(n): return (today - datetime.timedelta(days=n)).isoformat()
def fut(n): return (today + datetime.timedelta(days=n)).isoformat()
def ms_ago(n): return int((time.time() - n * 86400) * 1000)
def monday(weeks_back):
    d = today - datetime.timedelta(days=today.weekday()) - datetime.timedelta(weeks=weeks_back)
    return d.isoformat()
def plan():
    return {str(d): [{'name': 'Πρωινό', 'foods': [{'n': 'Βρώμη (ωμή)', 'g': 40}]}] for d in range(7)}

el = {'id': 'c' + str(ms_ago(70)), 'name': 'Ελένη Δοκιμή', 'sex': 'F', 'age': 34, 'weight': 68.9, 'height': 165, 'activity': 'mod',
      'goal': '-400', 'goalMain': 'loss', 'goalWeight': 65, 'allergenListsVer': 2, 'foodExclude': [], 'weekPlan': plan(),
      'planGeneratedAt': ms_ago(19), 'shareToken': 'tokE', 'medConditions': {'ibs': True}, 'medications': 'Levothyroxine 75μg',
      'trainDays': [True, False, True, False, True, False, True], 'eventDate': fut(11), 'nextAppointmentDate': dk(0),
      'weightLog': [{'date': dk(63), 'weight': 72.4, 'bf': 31.0, 'bfMethod': 'JP4'}, {'date': dk(42), 'weight': 71.1, 'bf': 30.1, 'bfMethod': 'JP4'},
                    {'date': dk(42 - 21), 'weight': 70.0, 'bf': 29.1, 'bfMethod': 'JP4'}],
      'appointments': [{'date': dk(63), 'notes': 'Πρώτη συνάντηση', 'chips': [], 'planAction': 'new', 'kcalAtEntry': 1950},
                       {'date': dk(42), 'notes': '', 'chips': ['Πεινάει το απόγευμα'], 'planAction': 'same', 'kcalAtEntry': 1950},
                       {'date': dk(21), 'notes': 'Λιγότερο ψωμί το βράδυ, σνακ πριν τη μεγάλη διαδρομή', 'chips': ['Αγώνας σύντομα'],
                        'planAction': 'adjust', 'kcalAtEntry': 1850}],
      'savedPlans': [{'number': 4, 'kind': 'sent', 'date': dk(19)}]}
empty = {'id': 'cEmpty', 'name': 'Νίκος Κενός', 'sex': 'M', 'age': 40, 'weight': 80, 'height': 180, 'activity': 'mod', 'goal': 'maintain',
         'allergenListsVer': 2, 'foodExclude': [], 'weightLog': [], 'appointments': []}

def ck(n, meals, water):
    return {'token': 'tokE', 'date': dk(n), 'meals_done': meals, 'meals_total': 4, 'water_glasses': water, 'water_goal': 8, 'supps_done': 0, 'supps_total': 0}
checkins = [ck(n, 4 if n % 4 else 2, 8 if n % 3 else 5) for n in range(0, 21)] + [ck(n, 2, 4) for n in range(22, 42)]
S = {'rows': {U1: {'data': {'clients': [el, empty]}, 'version': 1}}, 'shared': {},
     'tables': {'checkins': checkins,
                'client_logs': [{'token': 'tokE', 'date': dk(2), 'weight_kg': None, 'note': '[tag:party] ❓ Γάμος το Σάββατο, τι κάνω;'},
                                {'token': 'tokE', 'date': dk(9), 'weight_kg': 68.4, 'note': 'Κουράζομαι στις μεγάλες διαδρομές'}],
                'plan_feedback': [{'token': 'tokE', 'week_start': monday(1), 'breakfast': 5, 'snacks': 4, 'lunch': 4, 'dinner': 2,
                                   'recipes_ease': 3, 'ingredients_ease': 4, 'training_energy': 3, 'continue_likelihood': 9,
                                   'low_rating_reasons': {'dinner': ['Αργεί να γίνει']}}],
                'client_workout_log': [{'token': 'tokE', 'date': dk(n), 'data': {'d': True}} for n in range(1, 21, 2)]}}

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
        pg.wait_for_timeout(1200)
        J = lambda js: pg.evaluate(js)
        EID = el['id']

        J(f'selectClient("{EID}"); renderMain(); swTab(TAB_OVERVIEW);'); pg.wait_for_timeout(600)
        ov = lambda: J('document.getElementById("s0ov").innerText')
        t = ov()
        print('1. Κεφαλίδα')
        check('Ελένη Δοκιμή' in t, 'όνομα')
        flags = J('[...document.querySelectorAll("#s0ov .ov-flag.bad")].map(e=>e.textContent)')
        check(any('IBS' in f for f in flags) and any('Levothyroxine' in f for f in flags), f'κόκκινα flags πάθηση + φάρμακο ({flags})')
        check('Ραντεβού σήμερα · 4ο' in t, 'ραντεβού σήμερα, 4ο')
        check('21 ημέρες από το προηγούμενο' in t, '21 ημέρες από το προηγούμενο')
        check('Αγώνας/weigh-in σε 11 ημ.' in t, 'αγώνας σε 11 ημ.')
        print('2. Τι συμφωνήσαμε')
        check('Τι συμφωνήσαμε' in t and 'Λιγότερο ψωμί το βράδυ' in t, 'σημείωση τελευταίου ραντεβού')
        check('1950 → 1850 kcal' in t, 'αλλαγή θερμίδων')
        check('Πλάνο #4 στάλθηκε' in t, 'πλάνο που στάλθηκε μετά')
        print('3. Η προσπάθεια')
        labels = J('[...document.querySelectorAll("#s0ov .ov-kpi .l")].map(e=>e.textContent)')
        check(labels[:4] == ['Βάρος', 'Λίπος JP4', 'Τήρηση link', 'Προπονήσεις'], f'4 κάρτες ({labels})')
        kp = J('[...document.querySelectorAll("#s0ov .ov-kpi")].map(e=>e.innerText)')
        check('−1,1 από' in kp[0] and 'σπίτι' in kp[0], f'βάρος: διαφορά + ζύγιση σπιτιού ({kp[0]!r})')
        check('↑ από' in kp[2], f'τήρηση ανέβηκε σε σχέση με το προηγούμενο διάστημα ({kp[2]!r})')
        check('/' in kp[3] and 'προσέλευση 3/3' in kp[3], f'προπονήσεις + προσέλευση ({kp[3]!r})')
        check(J('document.querySelectorAll("#s0ov .ov-days .ov-d").length') == 22, 'λωρίδα 22 ημερών (21 + σήμερα)')
        print('4. Τι μου είπε')
        check('Γάμος το Σάββατο' in t and 'Γιορτή' in t, 'μήνυμα με ετικέτα')
        lo = J('[...document.querySelectorAll("#s0ov .ov-fb .ov-lo")].map(e=>e.textContent)')
        check(lo == ['Βραδινό 2'], f'χαμηλό σκορ σε κόκκινο ({lo})')
        check('Βραδινό: Αργεί να γίνει' in t, 'λόγος χαμηλής βαθμολογίας (νέα μορφή αντικειμένου)')
        check('[object Object]' not in t, 'χωρίς [object Object]')
        check(J('!!document.querySelector("#s0ov svg.ov-chart")'), 'γράφημα πορείας')
        print('5. Για συζήτηση σήμερα')
        ag = J('document.querySelector("#s0ov .ov-agenda").innerText')
        for frag in ['Αγώνας/weigh-in', 'Ερώτηση χωρίς απάντηση', 'Βραδινό 2/5', 'Έλεγχος συμφωνίας', 'Μέτρηση σήμερα']:
            check(frag in ag, f'ατζέντα: {frag}')
        J('document.querySelector("#s0ov .ov-ai input").click()')
        J('ovRefresh()')
        check(J('document.querySelector("#s0ov .ov-ai input").checked') is True, 'το τικ επιβιώνει ένα ovRefresh')
        print('6. Γρήγορη καταχώρηση')
        pg.fill('#ov-today-notes', 'Πλάνο αγώνα, CHO στις μεγάλες')
        J('ovRefresh()')
        check(J('document.getElementById("ov-today-notes").value') == 'Πλάνο αγώνα, CHO στις μεγάλες', 'η σημείωση μένει μετά από ovRefresh')
        n0 = J(f'clients.find(x=>x.id==="{EID}").appointments.length')
        J('document.querySelector("#ov-plan-action .appt-plan-action-btn[data-val=adjust]").click()')
        J('ovQuickAddAppt()'); pg.wait_for_timeout(300)
        last = J(f'(()=>{{const a=clients.find(x=>x.id==="{EID}").appointments; return a[a.length-1];}})()')
        check(J(f'clients.find(x=>x.id==="{EID}").appointments.length') == n0 + 1 and last['date'] == dk(0) and last['planAction'] == 'adjust'
              and last['notes'] == 'Πλάνο αγώνα, CHO στις μεγάλες' and last['kcalAtEntry'] > 0, 'νέα εγγραφή σήμερα με ενέργεια + kcal')
        t2 = ov()
        check('καταχωρήθηκε' in t2, 'το πλαίσιο δείχνει «καταχωρήθηκε»')
        check('Λιγότερο ψωμί το βράδυ' in t2, '«Τι συμφωνήσαμε» μένει στο προηγούμενο ραντεβού (όχι στο σημερινό)')
        print('7. Επόμενο ραντεβού')
        J(f'ovSetNextAppt("{fut(14)}")')
        check(J(f'clients.find(x=>x.id==="{EID}").nextAppointmentDate') == fut(14), 'αποθηκεύεται')
        print('8. Κλειστά από κάτω + «📝 Ραντεβού» χωρίς διπλά')
        check(J('document.getElementById("ov-hist").open') is False and J('document.getElementById("ov-bg").open') is False, 'ιστορικό/υπόβαθρο κλειστά')
        J('document.getElementById("ov-hist").open=true')
        J('document.querySelector("#ov-hist .ov-fchips button[data-f=meas]").click()')
        vis = J('[...document.querySelectorAll("#ov-hist .ov-ev")].filter(e=>e.style.display!=="none").map(e=>e.dataset.kind)')
        check(len(vis) == 3 and set(vis) == {'meas'}, f'φίλτρο «Μετρήσεις» ({vis})')
        s3b = J('document.getElementById("s3b").innerHTML')
        check('appt-summary-strip' not in s3b and 'Από το προηγούμενο ραντεβού' not in s3b, 'οι 7 κάρτες + «Από το προηγούμενο» έφυγαν')
        check('Νέο ραντεβού' in s3b, 'η πλήρης φόρμα μένει')
        if SHOT:
            J('document.getElementById("ov-hist").open=false; ovRefresh(); window.scrollTo(0,0)')
            pg.screenshot(path=os.path.join(SHOT, 'ov_desktop.png'), full_page=True)
        print('9. Πελάτης χωρίς δεδομένα')
        J('selectClient("cEmpty"); renderMain(); swTab(TAB_OVERVIEW);'); pg.wait_for_timeout(400)
        te = ov()
        check('Νίκος Κενός' in te and 'Δεν υπάρχουν ακόμη ραντεβού' in te, 'κενή κατάσταση')
        check(J('document.querySelectorAll("#s0ov .ov-kpi").length') == 0, 'χωρίς κενές κάρτες')
        if SHOT:
            pg.set_viewport_size({'width': 390, 'height': 900})
            J(f'selectClient("{EID}"); renderMain(); swTab(TAB_OVERVIEW);'); pg.wait_for_timeout(400)
            pg.screenshot(path=os.path.join(SHOT, 'ov_mobile.png'), full_page=True)
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e and 'Failed to load resource' not in e]
check(not errs, f'χωρίς σφάλματα κονσόλας ({errs[:3]})')
print('\n' + ('ALL OK' if not fails else f'{len(fails)} FAIL'))
sys.exit(1 if fails else 0)
