"""🧩 Μενού επιλογών — τι βλέπει ο διαιτολόγος (js/tabs/progress-mix.js, 2026-11-24).

1. Πρόοδος: «🧩 Τι διάλεξε από το Μενού» αντί για «🔄 Αντικαταστάσεις», πίνακας με emoji + ετικέτες
   από το Μενού (όχι «Γεύμα 1» / το κρυμμένο ημερήσιο), λίστα με στόχο ↔ πιάτο, κανόνες εβδομάδας, «Τι προτιμά».
2. Ειδοποιήσεις: «κάτι παρόμοιο» στο πρωινό, όσπρια/ψάρι κάτω από τον στόχο, κόκκινο κρέας πάνω από το όριο·
   «Κάνε ⭐» προσθέτει στο Μενού, «Αγνόησε» κρύβει, «📝» γράφει σημείωση.
3. Ημερήσιος πελάτης: η κάρτα «🔄 Αντικαταστάσεις» μένει όπως ήταν.
4. Πλάνο (editor Μενού): ×N / 💤 στα τρόφιμα, «τσεκαρίστηκε» στα γεύματα, πάνελ «📲 Ο πελάτης» με «Κάνε ⭐» + αναίρεση.
Uses the fake in-browser Supabase — never touches real data.
"""
import datetime, io, json, subprocess, sys, time, urllib.request
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
def dk(n): return (today - datetime.timedelta(days=n)).isoformat()
DAY = [{'name': 'Πρωινό', 'foods': [{'n': 'Γιαούρτι 2%', 'g': 200}]}, {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}]}]
base = {'sex': 'M', 'age': 34, 'weight': 78, 'height': 180, 'activity': 'light', 'goal': 'maintain', 'goalMain': 'maintain',
        'allergenListsVer': 2, 'foodExclude': []}
MX = dict(base, id='mx', name='Μάριος Μενού', shareToken='tokX', weekPlan={str(i): DAY for i in range(7)})
DA = dict(base, id='da', name='Δάφνη Ημερήσιο', sex='F', shareToken='tokD', weekPlan={str(i): DAY for i in range(7)})
SERVER = {'rows': {U1: {'data': {'clients': [MX, DA], 'customTemplates': []}, 'version': 5}}, 'shared': {},
          'tables': {'client_meal_log': [{'token': 'tokD', 'date': dk(1), 'meals_map': {'0': True, '1': {'a': 0, 'n': 'Τοστ', 'o': 'Γιαούρτι 2%', 's': 'Πρωινό', 'f': []}}}],
                     'checkins': [], 'client_alt_reject': []}}

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(bypass_csp=True, viewport={'width': 1300, 'height': 900})
        ctx.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        ctx.route('**/*.supabase.co/**', lambda r: r.abort())
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.add_init_script('window.__SERVER=' + json.dumps(SERVER) + ';window.__UID=' + json.dumps(U1) + ';'
            + 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();'
            + "localStorage.setItem('fyh_cache_owner'," + json.dumps(U1) + ");localStorage.setItem('fyh_cache_base_version','5');}")
        pg.goto(f'http://localhost:{PORT}/Dietologist.html', wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=15000)
        pg.wait_for_timeout(800)
        J = lambda s: pg.evaluate(s)
        CM = 'clients.find(x=>x.id==="mx")'

        # Μενού + «στάλθηκε πριν 30 μέρες»· θέσεις γευμάτων από τους στόχους
        J(f'{CM}.mixMenu=mixDefaultMenu({CM}); {CM}.planMode="mix"; {CM}.mixSent=[{{date:"{dk(30)}",sentDates:["{dk(30)}"],sig:"x",menu:{{}},kcal:2400}}];')
        lay = J(f'[0,1,2,3,4,5,6].map(d=>pmxDayMeals({CM},d).map(m=>[m.slot,m.main]))')
        menu = J(f'{CM}.mixMenu')
        prot = menu['protein']; carb = menu['carb']; leg = menu['legume']
        chick = next(n for n in prot if 'Κοτόπουλο' in n)
        fish = J(f'{json.dumps(prot)}.find(n=>mixIsFish(n))')
        red = J(f'{json.dumps(prot)}.find(n=>mixIsRedMeat(n))')
        rice = next(n for n in carb if 'Ρύζι' in n)
        lentil = leg[0]
        check(all(len(d) >= 4 for d in lay) and fish and red, f'layout ok, fish={fish}, red={red}')

        def plate(p_, c_, t):
            return {'mx': 1, 'n': p_ + ' + ' + c_, 'd': p_ + ' + ' + c_, 's': 'Μεσημεριανό', 'f': [[p_, 150], [c_, 160], ['Ελαιόλαδο', 5]],
                    'k': 610, 'm': {'p': 45, 'c': 60, 'f': 18}, 't': t}
        IDEA = {'mx': 1, 'n': 'Γιαούρτι 2% + Βρώμη (ωμή)', 'd': 'Γιαούρτι 2% 200 g + Βρώμη 40 g', 's': 'Ενδιάμεσο',
                'f': [['Γιαούρτι 2%', 200], ['Βρώμη (ωμή)', 40]], 'k': 290, 'm': {'p': 14, 'c': 30, 'f': 8}}
        THIS_MON = today - datetime.timedelta(days=today.weekday()); PREV_MON = THIS_MON - datetime.timedelta(days=7)
        log = []
        for n in range(27, -1, -1):
            d = today - datetime.timedelta(days=n); wd = d.weekday(); mm = {}
            for j, (slot, main) in enumerate(lay[wd]):
                if slot == 'breakfast':
                    mm[str(j)] = True                                   # πάντα «κάτι παρόμοιο»
                elif slot == 'lunch':
                    mm[str(j)] = ({'mx': 1, 'n': lentil, 'd': lentil, 's': 'Μεσημεριανό', 'f': [[lentil, 200]], 'k': 600, 'm': {'p': 30, 'c': 80, 'f': 15}, 't': {'le': 1}}
                                  if wd == 2 else plate(chick, rice, {}))
                elif slot == 'dinner':
                    if wd == 4: mm[str(j)] = dict(plate(fish, rice, {'fi': 1}), s='Βραδινό')
                    elif wd in (0, 1, 3) and PREV_MON <= d < THIS_MON: mm[str(j)] = dict(plate(red, rice, {'rm': 1}), s='Βραδινό')   # προηγ. εβδ.: 3× κόκκινο
                    elif wd == 6: pass                                  # Κυριακή βράδυ: δεν τσεκάρει
                    else: mm[str(j)] = dict(plate(chick, rice, {}), s='Βραδινό')
                else:
                    mm[str(j)] = IDEA
            log.append({'token': 'tokX', 'date': d.isoformat(), 'meals_map': mm})
        J(f'window.__SERVER.tables.client_meal_log=window.__SERVER.tables.client_meal_log.concat({json.dumps(log, ensure_ascii=False)})')
        J(f'Cloud.refreshMealLogFor({CM}).then(()=>Cloud.refreshMealLogFor(clients.find(x=>x.id==="da")))')
        pg.wait_for_timeout(500)

        print('1. Πρόοδος: «Τι διάλεξε από το Μενού»')
        S = J(f'(()=>{{const s=pmxSummary({CM}); return {{menu:s.st.menu,sim:s.st.similar,miss:s.st.missed,flags:s.flags.map(f=>f.key)}};}})()')
        check(S['menu'] > 40 and S['sim'] >= 20, f'counts: {S}')
        check(set(['sim|Πρωινό', 'le|under', 'fi|under', 'rm|over']) <= set(S['flags']), f'4 flags: {S["flags"]}')
        J('swTab(10)'); pg.wait_for_timeout(1200)
        J("_progressSwapRange='week'; openProgressClient('mx')"); pg.wait_for_timeout(1000)
        txt = pg.inner_text('#main')
        check('🧩 Τι διάλεξε από το Μενού' in txt and 'Αντικαταστάσεις γευμάτων' not in txt, 'mix card replaces swap card')
        rl = J("[...document.querySelectorAll('.pmx-grid .pr-sw-rl')].map(e=>e.innerText)")
        check('Μεσημεριανό' in rl and 'Βραδινό' in rl and not any(r.startswith('Γεύμα') for r in rl), f'grid rows from menu slots: {rl}')
        cells = J("[...document.querySelectorAll('.pmx-grid .pmx-ce')].map(e=>e.innerText+'|'+e.title)")
        check(any('🍚' in c_ and 'Ρύζι' in c_ for c_ in cells), f'emoji cells with names ({cells[:3]})')
        check(J("document.querySelectorAll('.pmx-grid .pmx-cs').length") >= 1, '≈ cells for «κάτι παρόμοιο»')
        J("document.querySelector('.pmx details.pr-sw-det').open=true")
        det = J("document.querySelector('.pmx details.pr-sw-det').innerText")
        check('ΣΤΟΧΟΣ ΓΕΥΜΑΤΟΣ' in det and ('ΤΟ ΠΙΑΤΟ ΤΟΥ' in det or 'Η ΙΔΕΑ ΠΟΥ ΔΙΑΛΕΞΕ' in det) and 'Θερμίδες' in det, 'row detail: target ↔ plate + chips')
        check('Κανόνες εβδομάδας' in txt and '🐟 Ψάρι' in txt and 'Τι προτιμά' in txt, 'rules + prefs sections')
        check('💤 Ποτέ' in txt, '💤 never-picked menu foods listed')
        J("_progressSwapRange='4w'; openProgressClient('mx')"); pg.wait_for_timeout(800)
        n4 = J("document.querySelectorAll('.pmx details.pr-sw-det').length")
        check(n4 >= 12 and 'Δες όλες' in pg.inner_text('#main'), f'4 weeks: long list collapsed ({n4} rows)')
        sk = pg.inner_text('#main')
        if 'Ποιο γεύμα παραλείπει' in sk:
            check('Γεύμα 1' not in sk, 'skip card uses menu slot names')

        print('2. Ειδοποιήσεις')
        flags = J("(_pmxFlags.mx||[]).map(f=>f.key)")
        check(J("document.querySelectorAll('.pmx .pr-sw-flag').length") == 3, 'max 3 flags shown')
        li = flags.index('le|under') if 'le|under' in flags[:3] else None
        if li is not None:
            add = J(f'_pmxFlags.mx[{li}].add')
            J(f'pmxFlagStar("mx",{li})'); pg.wait_for_timeout(500)
            check(add and all(a in J(f'{CM}.mixMenu.legume') for a in add), f'«Κάνε ⭐» added {add} to the menu')
        else:
            check(False, f'legume flag in first 3: {flags}')
        si = J("(_pmxFlags.mx||[]).findIndex(f=>f.key==='sim|Πρωινό')")
        nn = J(f'({CM}.dietologistNotes||[]).length')
        J(f'pmxFlagNote("mx",{si})'); pg.wait_for_timeout(400)
        check(J(f'({CM}.dietologistNotes||[]).length') == nn + 1, 'note added')
        si = J("(_pmxFlags.mx||[]).findIndex(f=>f.key==='sim|Πρωινό')")
        J(f'pmxFlagDismiss("mx",{si})'); pg.wait_for_timeout(400)
        check('sim|Πρωινό' not in J("(_pmxFlags.mx||[]).map(f=>f.key)"), 'dismissed flag hidden')

        print('3. Ημερήσιος πελάτης')
        J("openProgressClient('da')"); pg.wait_for_timeout(800)
        td = pg.inner_text('#main')
        check('Αντικαταστάσεις γευμάτων' in td and 'Τι διάλεξε από το Μενού' not in td, 'daily client keeps the swap card')

        print('4. Πλάνο: editor Μενού + 📲')
        J("selectClient('mx'); swTab(2)"); pg.wait_for_timeout(1200)
        ed = J("document.getElementById('mix-editor').innerHTML")
        cnts = J("[...document.querySelectorAll('#mix-editor .mx-cnt')].map(e=>e.innerText)")
        check(any(c_.startswith('×') for c_ in cnts) and '💤' in cnts, f'×N and 💤 badges ({len(cnts)})')
        check('τσεκαρίστηκε' in ed, 'meal header shows adherence')
        J('piToggle(true)'); pg.wait_for_timeout(800)
        pn = J("(document.getElementById('pi-panel')||{}).innerText||''")
        check('Από το μενού' in pn and '🐟 Ψάρι' in pn and 'Αλλάζει συχνά' not in pn, f'📲 panel is mix-aware')
        fi = J("_piMixFlags.findIndex(f=>f.kind==='under'&&f.add&&f.add.length)")
        if fi > -1:
            before = J(f'JSON.stringify({CM}.mixMenu.protein)+JSON.stringify({CM}.mixMenu.legume)')
            J(f'piMixStar({fi})'); pg.wait_for_timeout(400)
            after = J(f'JSON.stringify({CM}.mixMenu.protein)+JSON.stringify({CM}.mixMenu.legume)')
            check(before != after and 'Αναίρεση' in J("document.getElementById('mix-editor').innerText"), 'panel «Κάνε ⭐» changes the menu, undo offered')
            J('mixUndoLast()'); pg.wait_for_timeout(300)
            check(J(f'JSON.stringify({CM}.mixMenu.protein)+JSON.stringify({CM}.mixMenu.legume)') == before, 'undo restores')
        J('piToggle(false)')
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
if errs:
    print('Console/page errors:'); [print('  ' + e[:200]) for e in errs]
print('\nRESULT:', 'FAIL' if fails or errs else 'PASS', f'({len(fails)} failed checks, {len(errs)} errors)')
sys.exit(1 if fails or errs else 0)
