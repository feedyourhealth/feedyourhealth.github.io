"""📐 Νέα μέτρηση (απλή φόρμα): βάρος + δερματοπτυχές → ίδια αποθήκευση με την πλήρη φόρμα,
«Αποθήκευση & → Πλάνο» ανοίγει το «⚠️ Οι στόχοι άλλαξαν» με τη μέτρηση και την εξήγηση για τον τύπο,
«Προσαρμογή & αποστολή», ανήλικοι = Slaughter, Lean Mass κρυφό/προειδοποίηση."""
import json, subprocess, sys, time, urllib.request, io
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

def day():
    return [{'name': 'Πρωινό', 'foods': [{'n': 'Βρώμη (ωμή)', 'g': 40}, {'n': 'Γιαούρτι 2%', 'g': 200}, {'n': 'Μπανάνα', 'g': 120}]},
            {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}, {'n': 'Ρύζι (βρ.)', 'g': 200}, {'n': 'Ελαιόλαδο', 'g': 10}]},
            {'name': 'Βραδινό', 'foods': [{'n': 'Σολομός (ψητός)', 'g': 150}, {'n': 'Πατάτες (βρ.)', 'g': 150}]}]
base = {'sex': 'M', 'height': 178, 'activity': 'mod', 'goal': 'maintain', 'allergenListsVer': 2, 'foodExclude': [],
        'weekPlan': {str(d): day() for d in range(7)}, 'phone': '+35799123456'}
gi = dict(base, id='gi', name='Γιάννης Δοκιμή', age=36, weight=77, bf=0, lbm=0,
          weightLog=[{'date': '2026-10-02', 'weight': 77, 'bf': 0, 'waist': 0, 'hip': 0, 'arm': 0, 'sleep': 0, 'energy': 0, 'compliance': 0, 'notes': ''}])
ki = dict(base, id='ki', name='Κική Δοκιμή', sex='F', age=14, weight=47, height=158, weightLog=[])
lm = dict(base, id='lm', name='Λάμπρος Δοκιμή', age=40, weight=80, bf=20, lbm=64, leanmass=69.4, weightLog=[])
S = {'rows': {U1: {'data': {'clients': [gi, ki, lm]}, 'version': 1}}}

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
        C = lambda cid: f'clients.find(x=>x.id==="{cid}")'

        print('1. Η απλή κάρτα αντί για την πλήρη φόρμα')
        J('selectClient("gi"); renderMain(); swTab(2);'); pg.wait_for_timeout(1600)   # baseline στόχων στο Πλάνο
        J('swTab(3)'); pg.wait_for_timeout(400)
        check(J('!!document.getElementById("qm-card")'), 'measurement card shown')
        check(J('getComputedStyle(document.getElementById("tr-full-form")).display==="none"'), 'full form hidden (kept in DOM)')
        ids = J('[...document.querySelectorAll("#qm-card input")].map(e=>e.id)')
        check(ids == ['qm-date', 'qm-weight', 'qm-sf-abdomen', 'qm-sf-suprailiac', 'qm-sf-tricep', 'qm-sf-thigh'], f'adult JP4: date, weight, 4 sites ({ids})')

        print('2. Ζωντανό αποτέλεσμα + Enter = επόμενο πεδίο')
        pg.click('#qm-weight'); pg.keyboard.type('75'); pg.keyboard.press('Enter')
        check(J('document.activeElement.id') == 'qm-sf-abdomen', 'Enter on weight → first site')
        for v in ('22', '18', '12'):
            pg.keyboard.type(v); pg.keyboard.press('Enter')
        pg.keyboard.type('16')
        res = J('document.getElementById("qm-res").innerText')
        exp = J(f'calcSkinfoldBF("jp4","M",36,{{abdomen:22,suprailiac:18,tricep:12,thigh:16}}).bf')
        check(str(exp).replace('.', ',') + '%' in res and 'Άλιπη μάζα' in res and 'Βάρος −2 kg από 02/10' in res, f'live result {exp}% + lean mass + weight Δ ({res!r})')

        print('3. Enter στο τελευταίο = Αποθήκευση & → Πλάνο')
        pg.keyboard.press('Enter'); pg.wait_for_timeout(2600)
        e = J(f'JSON.stringify({C("gi")}.weightLog.slice(-1)[0])'); e = json.loads(e)
        check(e['weight'] == 75 and e['bf'] == exp and e.get('sfProtocol') == 'jp4' and e.get('bfMethod') == 'caliper'
              and e.get('sfFields') == {'abdomen': 22, 'suprailiac': 18, 'tricep': 12, 'thigh': 16}, f'entry saved like the full form ({e})')
        check(J(f'{C("gi")}.bf') == exp and J(f'{C("gi")}.weight') == 75, 'client bf/weight updated')
        check(J('document.querySelector(".stab.active").id') == 't2', 'went to the Πλάνο tab')
        bn = J('(document.getElementById("po-tgt-banner")||{}).innerText||""')
        check('μετά τη νέα μέτρηση (06/11' in bn or 'μετά τη νέα μέτρηση (' in bn, f'banner names the new measurement ({bn[:120]!r})')
        check('Katch-McArdle' in bn and 'Mifflin-St Jeor' in bn, 'banner explains the Mifflin → Katch-McArdle switch')
        top = J('document.getElementById("po-tgt-banner").getBoundingClientRect().top')
        check(0 <= top < 1000, f'scrolled to the banner (top={top:.0f})')
        check(J('!window._poScrollToBanner'), 'scroll flag consumed')

        print('4. «Προσαρμογή & αποστολή» → προσαρμογή + παράθυρο αποστολής· η εξήγηση φεύγει μετά')
        p0 = J(f'JSON.stringify({C("gi")}.weekPlan)')
        J('document.querySelector("#po-tgt-banner .po-tgt-go").click()'); pg.wait_for_timeout(1500)
        check(J(f'JSON.stringify({C("gi")}.weekPlan)') != p0, 'plan portions adjusted')
        check(J('!!document.getElementById("publish-overlay")'), 'send dialog opened')
        J('var o=document.getElementById("publish-overlay");if(o)o.remove();')
        J('renderMain()'); pg.wait_for_timeout(1600)
        check(not J('!!document.getElementById("po-tgt-banner")'), 'no banner after adjusting (measurement/formula acknowledged)')

        print('5. Ελλιπή σημεία → καμία αποθήκευση')
        J('swTab(3)'); pg.wait_for_timeout(300)
        n = J(f'{C("gi")}.weightLog.length')
        pg.fill('#qm-weight', '74.5'); pg.fill('#qm-sf-abdomen', '20')
        J('qmSave(false)'); pg.wait_for_timeout(300)
        check(J(f'{C("gi")}.weightLog.length') == n, 'partial skinfolds are not saved')
        pg.fill('#qm-sf-abdomen', ''); J('qmUpdate()'); J('qmSave(false)'); pg.wait_for_timeout(300)
        e2 = json.loads(J(f'JSON.stringify({C("gi")}.weightLog.slice(-1)[0])'))
        check(J(f'{C("gi")}.weightLog.length') == n + 1 and e2['weight'] == 74.5 and not e2.get('sfFields') and J('document.querySelector(".stab.active").id') == 't3',
              'weight-only save stays on the tab')

        print('6. «＋ Περισσότερα» → πλήρης φόρμα, «← Απλή φόρμα» πίσω')
        J('document.querySelector("#qm-card .qm-more").click()'); pg.wait_for_timeout(300)
        check(not J('!!document.getElementById("qm-card")') and J('getComputedStyle(document.getElementById("tr-full-form")).display!=="none"') and J('!!document.getElementById("tr-waist")'),
              'full form with circumferences')
        J('qmSetFull(false)'); pg.wait_for_timeout(200)
        check(J('!!document.getElementById("qm-card")'), 'back to the simple card')
        J(f'editWeightEntry({C("gi")}.weightLog.length-1)'); pg.wait_for_timeout(300)
        check(not J('!!document.getElementById("qm-card")') and J('getComputedStyle(document.getElementById("tr-full-form")).display!=="none"'), 'editing an entry uses the full form')
        J('cancelWeightEdit()'); pg.wait_for_timeout(200)

        print('7. Ανήλικος → Slaughter (2 σημεία)')
        J('selectClient("ki"); renderMain(); swTab(3);'); pg.wait_for_timeout(500)
        ids = J('[...document.querySelectorAll("#qm-card input")].map(e=>e.id)')
        check(ids == ['qm-date', 'qm-weight', 'qm-sf-tricep', 'qm-sf-calf'] and 'Slaughter' in J('document.getElementById("qm-card").innerText'), f'minor: Slaughter sites ({ids})')

        print('8. Lean Mass: κρυφό όταν κενό, προειδοποίηση + καθαρισμός όταν υπάρχει')
        J('selectClient("gi"); renderMain(); swTab(1);'); pg.wait_for_timeout(500)
        check(not J('!!document.getElementById("inp-leanmass")'), 'no Lean Mass field when empty')
        J('selectClient("lm"); renderMain(); swTab(1);'); pg.wait_for_timeout(500)
        txt = J('document.getElementById("inp-leanmass").closest(".fgrp").textContent')
        check('υπερισχύει' in txt and '64 kg' in txt, f'warning with last measured lean mass ({txt[:120]!r})')
        check('Lean Mass, χειροκίνητη' in J('document.body.innerText'), 'formula label follows the calc order (Lean Mass first)')
        J('[...document.querySelectorAll("a")].find(a=>a.textContent.includes("Καθαρισμός")).click()'); pg.wait_for_timeout(500)
        check(not J(f'{C("lm")}.leanmass') and not J('!!document.getElementById("inp-leanmass")'), 'clear → leanmass 0, field hidden')

        print('9. Κινητό: η κάρτα χωράει')
        pg.set_viewport_size({'width': 390, 'height': 800})
        J('selectClient("gi"); renderMain(); swTab(3);'); pg.wait_for_timeout(500)
        w = J('(()=>{var r=document.getElementById("qm-card").getBoundingClientRect();return [r.width,innerWidth,document.getElementById("qm-card").scrollWidth]})()')
        check(w[0] <= w[1] and w[2] <= w[0] + 1, f'card fits 390px ({w})')

        print('10. «⚡ Ξεκίνα πλάνο τώρα» → Στοιχεία πελάτη, χωρίς λάθη')
        pg.set_viewport_size({'width': 1400, 'height': 1000})
        n0 = J('clients.length')
        J('document.querySelectorAll(".toast,[class*=toast]").forEach(e=>e.remove())')
        J('qaCreateAndPlan("")'); pg.wait_for_timeout(600)
        toasts = J('[...document.querySelectorAll("[class*=toast]")].map(e=>e.innerText).join(" | ")')
        check(J('clients.length') == n0 + 1 and J('document.querySelector(".stab.active").id') == 't1', 'new client opens on Στοιχεία πελάτη')
        check('Παρακαλώ' not in toasts, f'no 7-error toast ({toasts[:120]!r})')
        check(J('document.activeElement.id') == 'inp-name', 'cursor in the name field')
        check(J('!Object.keys(getC().weekPlan||{}).length'), 'no plan generated yet')
        J('qaCreateAndPlan("Νέα Πελάτισσα")'); pg.wait_for_timeout(600)
        check(J('getC().name') == 'Νέα Πελάτισσα' and J('document.activeElement.id') == 'inp-sex', 'with a typed name → cursor on Φύλο')
        br.close()
finally:
    srv.terminate()

errors = [e for e in errors if 'favicon' not in e]
check(not errors, f'no console errors ({errors[:3]})')
print('\nFAILED: %d' % len(fails) if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
