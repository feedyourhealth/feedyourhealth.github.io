"""🏋️ Γυμναστές, βελτιώσεις 3-9: προεπιλογές ανά γυμναστή, ένα κλικ μετά τη μέτρηση, αποστολή όλων
(ένα μήνυμα), ιστορικό συναίνεσης + επιβεβαίωση, σύνδεση ομάδας, σύνοψη/chip, διπλοεγγραφές, σύντομο WhatsApp."""
import json, subprocess, sys, time, urllib.request, urllib.parse, io, datetime as dt
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8893
U1 = 'user-111'
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

T0 = dt.date.today()
D = lambda n: (T0 + dt.timedelta(days=n)).isoformat()
base = {'sex': 'M', 'age': 15, 'height': 170, 'activity': 'moderate', 'goalMain': 'maintain', 'allergenListsVer': 2, 'foodExclude': [], 'group': 'U15 Ακαδημία'}
def kid(i, name, **kw):
    d = dict(base, id=i, name=name, weight=60, weightLog=[{'date': D(-20), 'weight': 60.5, 'bf': 13, 'sfProtocol': 'slaughter', 'sfFields': {'tricep': 10, 'calf': 11}},
                                                         {'date': D(0), 'weight': 60, 'bf': 12.5, 'sfProtocol': 'slaughter', 'sfFields': {'tricep': 9, 'calf': 10}}])
    d.update(kw); return d
k1 = kid('k1', 'Αντρέας Νικολάου', phone='99000001')
k2 = kid('k2', 'Μάριος Κυριάκου')
k3 = kid('k3', 'Σάββας Θεοδώρου', trainerId='other')
ad = dict(base, id='ad', name='Ελένη Σταύρου', sex='F', age=30, group=None, phone='99000009', weight=64, weightLog=[{'date': D(0), 'weight': 64, 'bf': 27}])
trainers = [{'id': 'co', 'name': 'Γιώργος Χατζής', 'kind': 'coach', 'lang': 'el', 'phone': '99111222'},
            {'id': 'other', 'name': 'Άλλος Γυμναστής', 'kind': 'trainer', 'lang': 'el', 'phone': '99333444'}]
S = {'rows': {U1: {'data': {'clients': [k1, k2, k3, ad], 'customTemplates': [], 'trainers': trainers}, 'version': 1}}}

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
        C = lambda cid: J(f'clients.find(x=>x.id==="{cid}")')

        print('7. Σύνδεση ολόκληρης ομάδας')
        J('openTrainerProfile("co")'); pg.wait_for_timeout(250)
        opt = J('[...document.querySelectorAll("select[aria-label=\\"Σύνδεση ολόκληρης ομάδας\\"] option")].map(o=>o.textContent)')
        check(any('U15 Ακαδημία (2/3)' in o for o in opt), f'group option shows free/total ({opt})')
        J('trainerLinkGroup("co","U15 Ακαδημία")'); pg.wait_for_timeout(250)
        check(C('k1').get('trainerId') == 'co' and C('k2').get('trainerId') == 'co' and C('k3').get('trainerId') == 'other', 'free members linked, the one with another trainer untouched')
        check(not C('k1').get('trainerConsent'), 'no consent given in bulk')

        print('6. Ιστορικό συναίνεσης')
        J('selectClient("k1"); renderMain(); swTab(1)'); pg.wait_for_timeout(300)
        J('setClientTrainerConsent(true)'); J('setClientTrainerWorkouts(true)'); J('setClientTrainerWorkouts(false)')
        lg = C('k1').get('trainerConsentLog') or []
        check([x['a'] for x in lg] == ['give', 'wk_give', 'wk_revoke'] and lg[0]['by'] == 'parent' and lg[0]['tn'] == 'Γιώργος Χατζής', f'log entries ({[x["a"] for x in lg]})')
        hist = J('document.querySelector("#sec-trainer details").textContent')
        check('Ιστορικό συναίνεσης (3)' in hist and 'συμφώνησε: αναφορές μετρήσεων (γονέας)' in hist and 'Επιβεβαίωση στον πελάτη' in hist, 'history + confirm button in client card')
        href = J('document.querySelector("#sec-trainer details a[href*=\\"wa.me/\\"]").getAttribute("href")')
        txt = urllib.parse.unquote(href.split('text=')[1])
        check('συμφωνήσατε να στέλνω τις αναφορές μετρήσεων του/της Αντρέας' in txt and 'Γιώργος Χατζής' in txt, f'confirmation text for a minor ({txt[:70]!r})')

        print('5. Προεπιλογές ανά γυμναστή')
        J('openTrainerEdit("co")'); pg.wait_for_timeout(100)
        check(J('document.getElementById("tre-d-hist").checked') and not J('document.getElementById("tre-d-sf").checked'), 'defaults: history on, skinfolds off')
        J('document.getElementById("tre-d-sf").checked=true; document.getElementById("tre-d-phase").checked=false; saveTrainerEdit("co",null)'); pg.wait_for_timeout(200)
        check(J('getTrainer("co").reportDefaults') == {'hist': True, 'phase': False, 'comp': True, 'sf': True}, 'saved')
        J('openTrainerSend("k1")'); pg.wait_for_timeout(150)
        check(J('document.getElementById("trs-sf").checked') and not J('document.getElementById("trs-phase").checked'), 'send window opens with the trainer\'s defaults')
        J('document.getElementById("tr-send-ov").remove()')

        print('4. Ένα κλικ μετά τη μέτρηση')
        J('swTab(3)'); pg.wait_for_timeout(300)
        J('document.getElementById("tr-date").value="' + D(0) + '"; document.getElementById("tr-weight").value="59.8"; addWeightEntry()'); pg.wait_for_timeout(300)
        bar = J('(document.getElementById("tr-measure-bar")||{}).textContent||""')
        check('Στείλε στον Γιώργο' in bar and 'Αργότερα' in bar, f'prompt after saving a measurement ({bar[:50]!r})')
        J('document.querySelector("#tr-measure-bar button").click()'); pg.wait_for_timeout(600)
        tok = C('k1').get('trainerToken')
        snap = J(f'window.__SERVER.shared["{tok}"].snapshot') if tok else {}
        check(not snap.get('phase') and len(snap.get('meas') or []) == 3, 'one-click report used the defaults (history yes, phase no)')
        check('Στείλε στο WhatsApp' in J('document.getElementById("tr-quick-body").textContent'), 'result with WhatsApp button')
        J('document.getElementById("tr-quick-ov").remove()')
        J('selectClient("ad"); renderMain(); swTab(3)'); pg.wait_for_timeout(300)
        J('document.getElementById("tr-date").value="' + D(0) + '"; document.getElementById("tr-weight").value="63.8"; addWeightEntry()'); pg.wait_for_timeout(200)
        check(not J('!!document.getElementById("tr-measure-bar")'), 'no prompt for a client without a trainer')

        print('3. Αποστολή όλων (ένα μήνυμα)')
        J('clients.find(x=>x.id==="k2").trainerConsent=true')
        J('clients.find(x=>x.id==="k1").weightLog.push({date:"' + D(1) + '",weight:59.7,bf:12.3})')
        check(J('trainerPendingReports().filter(x=>x.t.id==="co").length') == 2, '2 pending for the coach')
        J('curId=null; _trOpenId=null; swTab(11)'); pg.wait_for_timeout(300)
        kp = J('document.getElementById("main").innerText')
        check('Εκκρεμείς αναφορές\n2' in kp and 'Πελάτες με γυμναστή\n3' in kp, f'KPI strip ({kp[:160]!r})')
        check('Αποστολή όλων' in J('document.getElementById("tr-list").innerText'), 'card button «Αποστολή όλων»')
        J('trainerBatchSend("co")'); pg.wait_for_timeout(150)
        check(J('document.querySelectorAll("#tr-batch-ov .trb-c").length') == 2, 'batch window lists both')
        J('_trBatchGo("co")'); pg.wait_for_timeout(1200)
        res = urllib.parse.unquote(J('document.getElementById("trb-res").innerHTML'))
        hub = J('getTrainer("co").hubToken')
        check('2 αναφορές έτοιμες' in res and 'ανέβηκαν 2 νέες αναφορές στη σελίδα σου: Αντρέας, Μάριος' in res and ('?h=' + hub) in res, 'one WhatsApp message with the hub link')
        check('?t=' not in res and 'Γεια σου Γιώργο' in res, 'only the hub link (no per-report links), vocative')
        check(J('trainerPendingReports().length') == 0, 'nothing pending afterwards')
        J('document.getElementById("tr-batch-ov").remove()')

        print('9. Σύντομο WhatsApp όταν υπάρχει σελίδα γυμναστή')
        J('clients.find(x=>x.id==="k2").weightLog.push({date:"' + D(1) + '",weight:59.9}); selectClient("k2"); renderMain(); swTab(3)'); pg.wait_for_timeout(300)
        J('openTrainerSend()'); pg.wait_for_timeout(150); J('createTrainerLink()'); pg.wait_for_timeout(600)
        res = urllib.parse.unquote(J('document.getElementById("trs-result").innerHTML'))
        check('νέα αναφορά μέτρησης για τον Μάριος Κυριάκου στη σελίδα σου' in res and ('?h=' + hub) in res and ('?t=' + C('k2')['trainerToken']) not in res.split('wa.me')[1].split('"')[0], 'message carries only the hub link')
        J('document.getElementById("tr-send-ov").remove()')

        print('8. Ένδειξη στη λίστα Πελατών')
        J('swTab(7)'); pg.wait_for_timeout(400)
        check('🏋️ Γιώργος' in J('document.getElementById("main").innerText'), 'trainer chip on client cards')

        print('9. Διπλοεγγραφές')
        pg.remove_listener('dialog', pg.listeners('dialog')[0]) if hasattr(pg, 'listeners') else None
        J('window.confirm=function(){window.__dupAsked=true;return false;}')
        J('openTrainerEdit(null)'); pg.fill('#tre-name', 'Γιώργος Χατζής'); J('saveTrainerEdit(null,null)'); pg.wait_for_timeout(150)
        check(J('window.__dupAsked===true') and J('getTrainers().length') == 2, 'same name → asks, declining adds nothing')
        J('window.__dupAsked=false'); pg.fill('#tre-name', 'Τελείως Νέος'); pg.fill('#tre-phone', '99 111 222'); J('saveTrainerEdit(null,null)'); pg.wait_for_timeout(150)
        check(J('window.__dupAsked===true'), 'same phone (different spacing) → asks too')
        br.close()
finally:
    srv.terminate()

real_errors = [x for x in errors if 'favicon' not in x]
check(not real_errors, f'no console/page errors ({real_errors[:3]})')
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
