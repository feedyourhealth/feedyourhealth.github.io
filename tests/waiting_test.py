"""⏳ Σε αναμονή: παράθυρο → κάρτα Αρχικής / λωρίδα πελάτη / φίλτρο Πελατών, υπενθύμιση el/en, κλείσιμο στη δημοσίευση, ιστορικό."""
import json, subprocess, sys, time, urllib.request, urllib.parse, io
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8894
U1 = 'user-111'
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

def plan():
    return {str(d): [{'name': 'Πρωινό', 'foods': [{'n': 'Γιαούρτι 2%', 'g': 200}]},
                     {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}]}] for d in range(7)}

base = {'sex': 'F', 'age': 34, 'weight': 68, 'height': 165, 'activity': 'light', 'goal': 'maintain', 'allergenListsVer': 2, 'foodExclude': []}
ma = dict(base, id='ma', name='Μαρία Κωνσταντίνου', phone='99123456', weekPlan=plan())
an = dict(base, id='an', name='Andreas Smith', sex='M', lang='en', phone='99654321', weekPlan=plan())
ni = dict(base, id='ni', name='Νίκος Άσχετος', sex='M')
S = {'rows': {U1: {'data': {'clients': [ma, an, ni], 'customTemplates': []}, 'version': 1}}}

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
        pg.add_init_script('window.__SERVER=' + json.dumps(S) + ';window.__UID=' + json.dumps(U1) + ';localStorage.clear();'
                           'window.__opened=[];window.open=function(u){window.__opened.push(u);return null;};')
        pg.goto(f'http://localhost:{PORT}/Dietologist.html', wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=10000)
        pg.wait_for_timeout(800)
        J = lambda js: pg.evaluate(js)
        def C(cid): return J(f'clients.find(x=>x.id==="{cid}")')

        print('1. Παράθυρο «Βάλε σε αναμονή»')
        J('renderHome()'); pg.wait_for_timeout(200)
        check('Σε αναμονή' not in J('document.querySelector(".hm-signals").innerText'), 'no waiting card while nobody waits')
        J('openWaitModal("ma")'); pg.wait_for_timeout(150)
        check(pg.is_visible('#wait-overlay .wait-modal'), 'modal opens')
        check(J('document.querySelector("#wait-overlay .wait-quick.on").textContent') == '+1 εβδ.', 'default due date = +1 week (highlighted)')
        check(J('document.querySelector("#wait-overlay input[name=wait-current]:checked").value') == 'temp', 'client with a plan → «Προσωρινό πλάνο» preselected')
        pg.click('#wait-overlay .wait-btn-primary'); pg.wait_for_timeout(150)
        check(pg.is_visible('#wait-overlay') and not C('ma').get('waitItems'), 'saving without a reason is refused')
        pg.click('#wait-overlay .wait-reason[data-key=labs]')
        pg.click('#wait-overlay .wait-quick >> text=+3 μέρες')
        pg.fill('#wait-note', 'σίδηρος, B12')
        pg.click('#wait-overlay .wait-btn-primary'); pg.wait_for_timeout(300)
        m = C('ma')
        w = (m.get('waitItems') or [{}])[0]
        check(not J('!!document.getElementById("wait-overlay")') and len(m.get('waitItems') or []) == 1, 'saved one wait item, modal closed')
        check(w.get('reasons') == ['labs'] and w.get('note') == 'σίδηρος, B12' and w.get('current') == 'temp' and not w.get('closedAt'), f'item fields ({w})')
        check(m.get('bloodTestStatus') == 'pending', 'blood-test tile follows → «Σε αναμονή»')

        print('2. Αρχική: κάρτα «⏳ Σε αναμονή»')
        J('(()=>{var d=new Date();d.setDate(d.getDate()-4);clients.find(x=>x.id==="ma").waitItems[0].due=waitDateKey(d);})()')
        J('openWaitModal("an")'); pg.wait_for_timeout(100)
        pg.click('#wait-overlay .wait-reason[data-key=training]')
        pg.click('#wait-overlay .wait-quick >> text=+2 εβδ.')
        pg.click('#wait-overlay .wait-btn-primary'); pg.wait_for_timeout(200)
        J('renderHome()'); pg.wait_for_timeout(200)
        sig = J('document.querySelector(".hm-signals").innerText')
        check('⏳ Σε αναμονή' in sig and '1 καθυστερεί' in sig, 'home card with «1 καθυστερεί»')
        check(sig.index('Μαρία') < sig.index('Andreas'), 'overdue client listed first')
        check('καθυστερεί 4 μ.' in sig and 'σε 14 μέρες' in sig, 'status chips (late / in 14 days)')
        check(J('document.querySelector(".hm-signals .hm-card-danger")!==null'), 'card turns red when someone is late')
        check(J('document.querySelectorAll(".hm-wait-row .hm-wait-remind").length') == 1, 'reminder button only on the late/soon row')

        print('3. Υπενθύμιση (el / en)')
        J('document.querySelector(".hm-wait-row .hm-wait-remind").click()'); pg.wait_for_timeout(200)
        url = J('window.__opened[window.__opened.length-1]')
        txt = urllib.parse.unquote(url.split('text=')[1]) if url and 'text=' in url else ''
        check(url and url.startswith('https://wa.me/'), f'opens WhatsApp ({url[:40] if url else url})')
        check('Γεια σου Μαρία!' in txt and 'τις αναλύσεις αίματος' in txt and 'προσωρινό πλάνο' in txt, f'Greek message ({txt[:90]!r})')
        check(C('ma')['waitItems'][0].get('remindedAt') == J('waitDateKey()'), 'remindedAt stamped')
        aid = C('an')['waitItems'][0]['id']
        J(f'sendWaitReminder("an","{aid}")'); pg.wait_for_timeout(150)
        txt = urllib.parse.unquote(J('window.__opened[window.__opened.length-1]').split('text=')[1])
        check(txt.startswith('Hi Andreas!') and 'your training programme' in txt, f'English message ({txt[:80]!r})')

        print('4. Καρτέλα πελάτη: κουμπί + λωρίδα')
        J('selectClient("ma"); renderMain();'); pg.wait_for_timeout(400)
        ban = J('document.getElementById("wait-banner-slot").innerText')
        check('Περιμένεις: 🩸 Αναλύσεις' in ban and 'καθυστερεί 4 μ.' in ban and 'σίδηρος, B12' in ban, f'banner ({ban[:90]!r})')
        check('Υπενθύμιση στάλθηκε' in ban, 'banner shows when the reminder went out')
        check(J('document.getElementById("client-wait-btn").textContent').strip() == '⏳ Σε αναμονή', 'header button shows «Σε αναμονή»')
        J('selectClient("ni"); renderMain();'); pg.wait_for_timeout(300)
        check(J('document.getElementById("wait-banner-slot").innerText').strip() == '' and 'Βάλε σε αναμονή' in J('document.getElementById("client-wait-btn").textContent'), 'non-waiting client: no banner, «Βάλε σε αναμονή»')
        J('openWaitModal()'); pg.wait_for_timeout(100)
        check(J('document.querySelector("#wait-overlay .wait-modal-sub").textContent') == 'Νίκος Άσχετος' and J('document.getElementById("wait-send-now").disabled'), 'no-arg modal = current client; no phone/email → send box disabled')
        J('document.getElementById("wait-overlay").remove()')

        print('5. Λίστα Πελατών')
        J('swTab(7)'); pg.wait_for_timeout(300)
        chips = J('document.querySelector(".client-quick-chips").innerText')
        check('⏳ Σε αναμονή (2)' in chips, f'quick chip with count ({chips!r})')
        J('setClientQuickFilter("waiting")'); pg.wait_for_timeout(200)
        names = J('[...document.querySelectorAll("#client-list .client-card .cc-name")].map(e=>e.textContent)')
        check(len(names) == 2 and names[0].startswith('Μαρία'), f'filter shows the 2 waiting, overdue first ({names})')
        check('⏳ 🩸 Αναλύσεις · καθυστερεί 4 μ.' in J('document.getElementById("client-list").innerText'), 'card carries the wait chip')
        J('setClientQuickFilter("all")')

        print('6. Γρήγορη ενέργεια πλαϊνής μπάρας')
        J('toggleQA("qa-wait"); renderQAWait("Νίκ")'); pg.wait_for_timeout(100)
        rows = J('document.getElementById("qa-wait-results").innerText')
        check('Νίκος Άσχετος' in rows and 'Μαρία' not in rows, 'search filters the list')
        J('document.querySelector("#qa-wait-results .qa-row").click()'); pg.wait_for_timeout(100)
        check(J('document.querySelector("#wait-overlay .wait-modal-sub").textContent') == 'Νίκος Άσχετος' and J('document.getElementById("qa-wait").style.display') == 'none', 'row opens the modal for that client, panel closes')
        J('document.getElementById("wait-overlay").remove()')

        print('7. Παράταση (επεξεργασία)')
        mid = C('ma')['waitItems'][0]['id']
        J(f'openWaitModal("ma","{mid}")'); pg.wait_for_timeout(100)
        check('Επεξεργασία' in J('document.getElementById("wait-modal-title").textContent') and J('document.getElementById("wait-note").value') == 'σίδηρος, B12', 'edit mode keeps the fields')
        pg.click('#wait-overlay .wait-quick >> text=+1 εβδ.')
        pg.click('#wait-overlay .wait-btn-primary'); pg.wait_for_timeout(200)
        check(len(C('ma')['waitItems']) == 1 and J('waitDaysLeft(clients.find(x=>x.id==="ma").waitItems[0])') == 7, 'same item, new due date (+7)')

        print('8. Δημοσίευση πλάνου → «Ήρθαν;»')
        J('selectClient("ma"); renderMain();'); pg.wait_for_timeout(300)
        J('openPublishModal()')
        pg.wait_for_selector('#wait-publish-prompt', timeout=5000)
        check('Ήρθαν και αυτό είναι το τελικό πλάνο' in J('document.getElementById("wait-publish-prompt").innerText'), 'publish modal asks if it arrived')
        J('document.querySelector("#wait-publish-prompt .wait-pill-done").click()'); pg.wait_for_timeout(200)
        m = C('ma')
        check(m['waitItems'][0].get('closedAt') == J('waitDateKey()') and m.get('bloodTestStatus') == 'sent', 'closed + blood-test tile → «Εστάλησαν»')
        check('Η αναμονή έκλεισε' in J('document.getElementById("wait-publish-prompt").innerText'), 'prompt confirms')
        J('document.getElementById("publish-overlay").remove()')
        check(J('document.getElementById("wait-banner-slot").innerText').strip() == '', 'banner gone after closing')

        print('9. Ιστορικό + Αρχική μετά το κλείσιμο')
        hist = J('waitHistoryCardHtml(clients.find(x=>x.id==="ma"))')
        check('Ιστορικό αναμονών' in hist and 'ήρθε' in hist, 'overview history card lists the closed wait')
        check('Ιστορικό αναμονών' in J('buildOverviewHtml(clients.find(x=>x.id==="ma"))'), 'history card is part of the overview')
        J(f'closeWaitItem("an","{aid}")'); J('renderHome()'); pg.wait_for_timeout(200)
        check('Σε αναμονή' not in J('document.querySelector(".hm-signals").innerText'), 'home card disappears when nobody waits')

        print('10. Σκούρο θέμα: η κάρτα διαβάζεται')
        J(f'clients.find(x=>x.id==="an").waitItems[0].closedAt=null; document.body.classList.add("dark-mode"); renderHome()'); pg.wait_for_timeout(200)
        bg = J('getComputedStyle(document.querySelector(".hm-wait-row .wait-chip")).backgroundColor')
        check(bg == 'rgb(15, 42, 36)', f'dark chip colour ({bg})')
        br.close()
finally:
    srv.terminate()

real_errors = [x for x in errors if 'favicon' not in x]
check(not real_errors, f'no console/page errors ({real_errors[:3]})')
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
