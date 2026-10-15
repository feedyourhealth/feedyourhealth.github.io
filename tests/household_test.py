"""🏠 Νοικοκυριό: σύνδεση/αποχώρηση, «↔️ Εφαρμογή σε…» με κλίμακα + αποκλεισμούς, link κουζίνας (kouzina.html)."""
import json, subprocess, sys, time, urllib.request, io
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

def plan(k, dinner_extra=None):
    """k = συντελεστής μερίδας (μεγαλύτερο παιδί → μεγαλύτερες μερίδες)."""
    days = {}
    for d in range(7):
        dinner = [{'n': 'Σολομός (ψητός)', 'g': round(120 * k)}, {'n': 'Πατάτες', 'g': round(150 * k)}]
        if dinner_extra and d == 1: dinner.append({'n': dinner_extra, 'g': 20})
        days[str(d)] = [
            {'name': 'Πρωινό', 'foods': [{'n': 'Γιαούρτι 2%', 'g': round(200 * k)}, {'n': 'Μπανάνα', 'g': 120}]},
            {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': round(150 * k)}, {'n': 'Ρύζι άσπρο (βρ.)', 'g': round(150 * k)}]},
            {'name': 'Ενδιάμεσο', 'foods': [{'n': 'Μήλο', 'g': 150}]},
            {'name': 'Βραδινό', 'foods': dinner},
        ]
    return days

base = {'sex': 'M', 'age': 15, 'weight': 60, 'height': 172, 'activity': 'active', 'goal': 'maintain', 'allergenListsVer': 2, 'foodExclude': []}
ni = dict(base, id='ni', name='Νίκος Παπαδόπουλος', weekPlan=plan(1.4, dinner_extra='Αμύγδαλα'))
el = dict(base, id='el', name='Ελένη Παπαδοπούλου', sex='F', age=12, weight=40, height=150, activity='mod', allergyGroups=['nuts'], weekPlan=plan(0.9))
gi = dict(base, id='gi', name='Γιώργος Παπαδόπουλος', age=17, weight=70, height=180, weekPlan=plan(1.2))
ma = dict(base, id='ma', name='Μαρία Άσχετη', sex='F', age=40, weight=70, height=165, weekPlan=plan(1.0))
S = {'rows': {U1: {'data': {'clients': [ni, el, gi, ma], 'customTemplates': []}, 'version': 1}}}

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
        def ensure_week():
            J('(()=>{ if(!document.getElementById("week-con")){var d=document.createElement("div");d.id="week-con";document.body.appendChild(d);} renderWeekTable(); })()')
            return pg.inner_text('#week-con')
        def C(cid): return J(f'clients.find(x=>x.id==="{cid}")')

        print('1. Σύνδεση μελών')
        J('selectClient("ni"); renderMain();'); pg.wait_for_timeout(400)
        sec = J('document.getElementById("main").textContent')
        check('🏠 Νοικοκυριό' in sec and 'Σύνδεση με πελάτη' in sec, 'client form shows the household section with «Σύνδεση με πελάτη»')
        check('Link κουζίνας' not in sec, 'no kitchen-link button before a household exists')
        J('hhAddMember("el")'); pg.wait_for_timeout(300)
        J('hhAddMember("gi")'); pg.wait_for_timeout(300)
        n, e, g, m = C('ni'), C('el'), C('gi'), C('ma')
        check(n['householdId'] and n['householdId'] == e['householdId'] == g['householdId'], 'Νίκος, Ελένη, Γιώργος share one householdId')
        check(not m.get('householdId'), 'unrelated client untouched')
        check(n['householdName'] == 'Οικογένεια Παπαδόπουλος', f"default name from surname ({n['householdName']})")
        sec = J('document.getElementById("main").textContent')
        check('Ελένη Παπαδοπούλου' in sec and 'Link κουζίνας' in sec, 'section lists members + kitchen-link button')
        opts = J('[...document.querySelectorAll("#main select")].filter(s=>/Προσθήκη μέλους/.test(s.innerText)).map(s=>s.innerText)[0]||""')
        check('Μαρία' in opts and 'Ελένη' not in opts, 'add-member list offers only clients not in a household')

        print('2. Πλάνο: μπάρα + μενού')
        wk = ensure_week()
        check('τρώει μαζί με' in wk and 'Ελένη' in wk, 'plan bar above the week table')
        html = J('document.getElementById("week-con").innerHTML')
        check('Εφαρμογή ημέρας σε' in html and 'Εφαρμογή σε…' in html, 'day ⋮ and meal ⋮ menus offer «↔️ Εφαρμογή σε…»')
        check('🏠 Κοινό' not in wk, 'no «Κοινό» badge before anything is shared')

        print('3. Εφαρμογή ενός γεύματος (Δευτέρα μεσημεριανό) με κλίμακα')
        before_el = C('el')['weekPlan']
        J('openHouseholdApply("meal",0,1)'); pg.wait_for_timeout(200)
        cbs = J('[...document.querySelectorAll(".hh-apply-cb")].map(c=>({id:c.value,on:c.checked,dis:c.disabled}))')
        check(len(cbs) == 2 and all(c['on'] for c in cbs), f'both other members pre-checked ({cbs})')
        J('confirmHouseholdApply("meal",0,1)'); pg.wait_for_timeout(300)
        n, e, g = C('ni'), C('el'), C('gi')
        src = n['weekPlan']['0'][1]; dst = e['weekPlan']['0'][1]
        check([f['n'] for f in dst['foods']] == [f['n'] for f in src['foods']], 'Ελένη got the same foods')
        kc = J('(()=>{const k=m=>m.foods.reduce((s,f)=>s+cm(f.n,f.g).k,0);'
               'const c=x=>clients.find(y=>y.id===x);'
               'return {src:k(c("ni").weekPlan[0][1]), el:k(c("el").weekPlan[0][1])};})()')
        old_el = J('(()=>{const m=' + json.dumps(before_el['0'][1]) + ';return m.foods.reduce((s,f)=>s+cm(f.n,f.g).k,0);})()')
        check(abs(kc['el'] - old_el) / old_el < 0.06, f"Ελένη's meal kcal kept ≈ her old meal ({kc['el']:.0f} vs {old_el:.0f}), not Νίκος's ({kc['src']:.0f})")
        check(src.get('hhKey') and src['hhKey'] == dst.get('hhKey') == g['weekPlan']['0'][1].get('hhKey'), 'same hhKey on all 3 copies')
        check(e['weekPlan']['1'] == before_el['1'] and e['weekPlan']['0'][0] == before_el['0'][0], 'other meals/days of Ελένη untouched')
        wk = ensure_week()
        check(wk.count('🏠 Κοινό') == 1, 'one «🏠 Κοινό» badge in Νίκος\'s grid')
        check(bool(J('document.getElementById("hh-undo-toast")')), 'undo toast shown')

        print('4. Αναίρεση')
        J('document.querySelector("#hh-undo-toast button").click()'); pg.wait_for_timeout(200)
        check(C('el')['weekPlan'] == before_el and not C('ni')['weekPlan']['0'][1].get('hhKey'), 'undo restored Ελένη and removed the source mark')

        print('5. Αλλεργία: προειδοποίηση + όλη η εβδομάδα παραλείπει την ημέρα με αμύγδαλα για την Ελένη')
        J('openHouseholdApply("meal",1,3)'); pg.wait_for_timeout(200)
        txt = pg.inner_text('#hh-apply-overlay')
        cbs = {c['id']: c for c in J('[...document.querySelectorAll(".hh-apply-cb")].map(c=>({id:c.value,on:c.checked}))')}
        check('Δεν τρώει: Αμύγδαλα' in txt and not cbs['el']['on'] and cbs['gi']['on'], 'Τρίτη dinner: Ελένη warned + unchecked, Γιώργος checked')
        J('document.getElementById("hh-apply-overlay").remove()')
        J('openHouseholdApply("meal",0,3)'); pg.wait_for_timeout(200)
        J('document.getElementById("hh-apply-week").checked=true; confirmHouseholdApply("meal",0,3)'); pg.wait_for_timeout(300)
        e = C('el'); g = C('gi')
        el_almonds = [d for d in range(7) if any(f['n'] == 'Αμύγδαλα' for f in e['weekPlan'][str(d)][3]['foods'])]
        check(not el_almonds, f'no almonds copied to Ελένη ({el_almonds})')
        check(e['weekPlan']['1'][3]['foods'] == before_el['1'][3]['foods'], 'Ελένη\'s Τρίτη dinner left as it was (skipped)')
        check(all(e['weekPlan'][str(d)][3].get('hhKey') for d in (0, 2, 3, 4, 5, 6)), 'Ελένη got the other 6 dinners')
        check(any(f['n'] == 'Αμύγδαλα' for f in g['weekPlan']['1'][3]['foods']), 'Γιώργος (no allergy) got Τρίτη dinner incl. almonds')
        toast = pg.inner_text('#hh-undo-toast')
        check('Παραλείφθηκαν' in toast and 'Ελένη (Τρίτη: Αμύγδαλα)' in toast, f'toast names the skipped day ({toast[:120]!r})')
        J('document.getElementById("hh-undo-toast").remove()')

        print('6. Link κουζίνας: snapshot')
        snap = J('buildKitchenSnapshot(getC())')
        sj = json.dumps(snap, ensure_ascii=False)
        check(snap['kind'] == 'kitchen' and snap['members'] == ['Νίκος', 'Γιώργος', 'Ελένη'] or sorted(snap['members']) == ['Γιώργος', 'Ελένη', 'Νίκος'], f"members = first names only ({snap['members']})")
        check(len(snap['days'][0]['meals']) == 1 and len(snap['days'][0]['meals'][0]['plates']) == 3, 'Δευτέρα: 1 shared meal (dinner) with 3 plates')
        check(len(snap['days'][1]['meals']) == 1 and len(snap['days'][1]['meals'][0]['plates']) == 2, 'Τρίτη: dinner shared by 2 (Ελένη skipped)')
        m0 = snap['days'][0]['meals'][0]
        salmon_tot = next(t['g'] for t in m0['total'] if t['n'].startswith('Σολομός'))
        plates_g = J('(()=>{let s=0;["ni","el","gi"].forEach(id=>{s+=clients.find(x=>x.id===id).weekPlan[0][3].foods.find(f=>f.n.startsWith("Σολομός")).g;});return s;})()')
        check(salmon_tot == plates_g, f'«μαγειρέψτε συνολικά» salmon = sum of plates ({salmon_tot} = {plates_g})')
        check('Ξηροί καρποί' in ' '.join(snap['allergyWarn']), f"table-wide allergy warning ({snap['allergyWarn']})")
        for bad in ['weight', 'kcal', 'Παπαδοπούλου', 'Παπαδόπουλος ', 'bf', 'goal']:
            check(f'"{bad}"' not in sj and (bad not in ('Παπαδοπούλου',) or bad not in sj), f'snapshot has no «{bad}»')
        check('Γιαούρτι 2%' in snap['shopDays'][0] and 'Μήλο' in snap['shopDays'][0], 'shopping includes individual meals (breakfast, snack)')

        print('7. Δημοσίευση + kouzina.html')
        J('openKitchenLinkModal()'); pg.wait_for_timeout(200)
        J('createKitchenLink()'); pg.wait_for_timeout(800)
        url = J('(document.getElementById("kitchen-url")||{}).value||""')
        tok = C('ni').get('kitchenToken')
        check(url.endswith('kouzina.html?t=' + str(tok)) and tok == C('el').get('kitchenToken') == C('gi').get('kitchenToken'), f'link created, one token on all members ({url[-40:]})')
        server = J('window.__SERVER')
        check(server['shared'][tok]['snapshot']['kind'] == 'kitchen' and server['shared'][tok]['client_name'] == 'Οικογένεια Παπαδόπουλος', 'shared_plans row written')
        kp = ctx.new_page()
        kp.on('pageerror', lambda e: errors.append('kouzina: ' + str(e)))
        kp.on('console', lambda m: errors.append('kouzina: ' + m.text) if m.type == 'error' else None)
        kp.add_init_script('window.__SERVER=' + json.dumps(server) + ';window.__UID=null;')
        kp.goto(f'http://localhost:{PORT}/kouzina.html?t={tok}', wait_until='domcontentloaded')
        kp.wait_for_selector('.tabs', timeout=5000)
        kp.evaluate('setDay(0)'); kp.wait_for_timeout(100)
        t = kp.inner_text('#root')
        check('Οικογένεια Παπαδόπουλος' in t and 'Μαγειρέψτε συνολικά' in t and 'Μοιράστε στα πιάτα' in t, 'kouzina.html renders the shared meal')
        check('Ελένη' in t and 'Αλλεργίες στο σπίτι' in t, 'plates by first name + allergy banner')
        check('Μεσημεριανό' not in t and 'Πρωινό' not in t, 'individual meals are NOT shown')
        kp.click('text=Ψώνια'); kp.wait_for_timeout(100)
        t_all = kp.inner_text('#root')
        check('Γιαούρτι' in t_all and 'Σολομός' in t_all and '0 από' in t_all, 'shopping list (whole week) with all foods')
        kp.click('text=1ο ψώνιο'); kp.wait_for_timeout(100)
        kp.click('.chk >> nth=0'); kp.wait_for_timeout(100)
        check('1 από' in kp.inner_text('#root'), 'split «1ο ψώνιο» + ticking works')
        kp.close()
        J('document.getElementById("kitchen-overlay").remove()')

        print('8. Αποχώρηση μελών — τα πλάνα δεν αλλάζουν')
        plans_before = {cid: C(cid)['weekPlan'] for cid in ('ni', 'el', 'gi')}
        J('hhLeave("gi")'); pg.wait_for_timeout(200)
        pg.click('#confirmBtn'); pg.wait_for_timeout(900)
        g = C('gi')
        check(not g.get('householdId') and not g.get('kitchenToken'), 'Γιώργος unlinked')
        check(all(not m.get('hhKey') for d in g['weekPlan'] for m in g['weekPlan'][d]), 'Γιώργος\'s meals lost only the «κοινό» mark')
        strip = lambda wp: {d: [[(f['n'], f['g']) for f in m['foods']] for m in wp[d]] for d in wp}
        check(strip(g['weekPlan']) == strip(plans_before['gi']), 'Γιώργος\'s foods/grams unchanged')
        check(C('ni')['householdId'] == C('el')['householdId'], 'Νίκος + Ελένη still linked')
        snap2 = J('window.__SERVER.shared[' + json.dumps(tok) + '].snapshot')
        check('Γιώργος' not in json.dumps(snap2, ensure_ascii=False), 'kitchen link republished without Γιώργος')
        J('selectClient("ni"); renderMain(); hhLeave("el")'); pg.wait_for_timeout(200)
        pg.click('#confirmBtn'); pg.wait_for_timeout(900)
        check(not C('ni').get('householdId') and not C('el').get('householdId'), 'household of 1 dissolves')
        exp = J('window.__SERVER.shared[' + json.dumps(tok) + '].expires_at')
        check(exp < time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime()), f'kitchen link expired ({exp})')
        check(strip(C('ni')['weekPlan']) == strip(plans_before['ni']) and strip(C('el')['weekPlan']) == strip(plans_before['el']), 'Νίκος + Ελένη foods/grams unchanged')
        wk = ensure_week()
        check('τρώει μαζί με' not in wk and 'Εφαρμογή σε' not in J('document.getElementById("week-con").innerHTML'), 'plan bar + menu items gone')
        br.close()
finally:
    srv.terminate()

real_errors = [x for x in errors if 'favicon' not in x]
check(not real_errors, f'no console/page errors ({real_errors[:3]})')
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
