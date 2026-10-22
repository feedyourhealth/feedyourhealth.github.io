"""📊 Ιστορικό πλάνων: αρίθμηση (max+1, διόρθωση διπλών), backup πριν τη Φόρτωση / νέο πλάνο,
αυτόματη αποθήκευση στη δημοσίευση (dedupe + same-day update), στοιχεία ανά πλάνο, γράφημα, σύγκριση."""
import json, subprocess, sys, time, urllib.request, io
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8895
U1 = 'user-111'
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

def plan(g):
    return {str(d): [{'name': 'Πρωινό', 'foods': [{'n': 'Γιαούρτι 2%', 'g': 200}]},
                     {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': g}]}] for d in range(7)}

def saved(num, date, g, pid):
    return {'id': pid, 'number': num, 'date': date, 'time': '10:00', 'note': '', 'macros': {'k': 2000 + g, 'p': 140, 'f': 60, 'c': 250},
            'weekPlan': plan(g), 'goal': '-300', 'dietType': 'normal'}

ma = {'id': 'ma', 'name': 'Μαρία Κωνσταντίνου', 'sex': 'F', 'age': 34, 'weight': 68, 'height': 165, 'activity': 'light',
      'goal': '-300', 'goalMain': 'loss', 'allergenListsVer': 2, 'foodExclude': [], 'weekPlan': plan(150),
      'weightLog': [{'date': '2026-07-20', 'weight': 72.4, 'bf': 30.1}, {'date': '2026-08-15', 'weight': 70.9, 'bf': 29.0},
                    {'date': '2026-09-20', 'weight': 69.2, 'bf': 28.1}],
      # legacy history with a repeated number (#2 twice) — the bug from the screenshot
      'savedPlans': [saved(1, '2026-07-22', 120, 'plan_1000'), saved(2, '2026-08-12', 130, 'plan_2000'), saved(2, '2026-09-09', 150, 'plan_3000')]}
S = {'rows': {U1: {'data': {'clients': [ma], 'customTemplates': []}, 'version': 1}}}

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
        C = lambda: J('clients.find(x=>x.id==="ma")')
        nums = lambda: sorted(p['number'] for p in C()['savedPlans'])
        confirm = lambda: (J('executeConfirm()'), pg.wait_for_timeout(250))

        print('1. Διπλοί αριθμοί διορθώνονται στην εμφάνιση')
        J('selectClient("ma"); renderMain(); swTab(4);'); pg.wait_for_timeout(400)
        check(nums() == [1, 2, 3], f'renumbered chronologically → {nums()}')
        txt = J('document.getElementById("s4").innerText')
        check('Πλάνο #3' in txt and txt.count('Πλάνο #2 ·') == 1, 'timeline shows #1,#2,#3 once each')
        check(J('!!document.querySelector("#s4 svg[role=img]")'), 'kcal/weight chart rendered')
        check('72,4 → 69,2 kg' in txt, 'summary: weight first plan → latest measurement')
        check('ΕΝΕΡΓΟ' in txt, 'current weekPlan == #3 → ΕΝΕΡΓΟ badge')

        print('2. Νέα αριθμηση = max+1 μετά από διαγραφή')
        J('deletePlanFromHistory("plan_2000")'); confirm()
        check(nums() == [1, 3], f'#2 deleted → {nums()}')
        J('clients.find(x=>x.id==="ma").weekPlan["0"][1].foods[0].g=170; showSavePlanPanel(); document.getElementById("plan-save-note").value="πρώτη αλλαγή"; doSavePlan();')
        pg.wait_for_timeout(300)
        check(nums() == [1, 3, 4], f'new manual save gets #4, not a repeated #3 → {nums()}')
        last = sorted(C()['savedPlans'], key=lambda p: p['number'])[-1]
        check(last.get('kind') == 'manual' and last.get('ctx', {}).get('weight') == 68 and last['macros'].get('fi') is not None, 'manual entry stores kind + ctx + fiber')
        J('showSavePlanPanel(); doSavePlan();'); pg.wait_for_timeout(200)
        check(nums() == [1, 3, 4], 'saving an identical plan again does not add a copy')

        print('3. Backup πριν τη «Φόρτωση»')
        J('clients.find(x=>x.id==="ma").weekPlan["1"][1].foods[0].g=210;')  # unsaved edit
        J('loadPlanAsActive("plan_1000")'); pg.wait_for_timeout(150)
        check('backup' in J('document.getElementById("confirmMessage").innerText'), 'confirm dialog warns the current plan becomes a backup')
        confirm()
        bk = C().get('planBackups') or []
        check(len(bk) == 1 and '#1' in bk[0]['reason'], f'one backup with reason → {[b["reason"] for b in bk]}')
        check(C()['weekPlan']['0'][1]['foods'][0]['g'] == 120, 'plan #1 is now active')
        J('loadPlanAsActive("plan_3000")'); confirm()
        check(len(C().get('planBackups') or []) == 1, 'loading over a SAVED plan makes no extra backup')

        print('4. Backup πριν από νέο πλάνο (genPlan), όριο 3')
        for g in (171, 172, 173, 174):
            J(f'clients.find(x=>x.id==="ma").weekPlan["2"][1].foods[0].g={g}; phBackupIfUnsaved(clients.find(x=>x.id==="ma"),"test")')
        check(len(C()['planBackups']) == 3, f'capped at 3 → {len(C()["planBackups"])}')
        J('clients.find(x=>x.id==="ma").weekPlan["3"][1].foods[0].g=199;')
        n_before = len(C()['planBackups'])
        J('genPlan()'); pg.wait_for_timeout(500)
        bks = C()['planBackups']
        check(bks[-1]['reason'] == 'Πριν τη δημιουργία νέου πλάνου' and bks[-1]['weekPlan']['3'][1]['foods'][0]['g'] == 199, 'genPlan kept the unsaved plan as the newest backup')
        J('renderMain(); swTab(4);'); pg.wait_for_timeout(300)
        bid = bks[-1]['id']
        J(f'restorePlanBackup("{bid}")'); confirm()
        check(C()['weekPlan']['3'][1]['foods'][0]['g'] == 199, 'restore backup brings that plan back')

        print('5. Αυτόματη αποθήκευση στη δημοσίευση')
        count = len(C()['savedPlans'])
        J('selectClient("ma"); renderMain(); openPublishModal()')
        pg.wait_for_selector('#publish-url', timeout=5000)
        body = J('document.getElementById("publish-body").innerText')
        check('Αποθηκεύτηκε στο Ιστορικό πλάνων ως Πλάνο #5' in body, 'publish modal: saved as #5')
        sp = C()['savedPlans']
        check(len(sp) == count + 1 and sp[-1]['kind'] == 'sent' and len(sp[-1]['sentDates']) == 1, 'new sent entry with sentDates')
        J('document.getElementById("publish-overlay").remove()')
        J('Cloud.publishPlan(clients.find(x=>x.id==="ma"))'); pg.wait_for_timeout(400)
        check(len(C()['savedPlans']) == count + 1, 'same plan re-published → no new entry')
        J('clients.find(x=>x.id==="ma").weekPlan["4"][1].foods[0].g=111; Cloud.publishPlan(clients.find(x=>x.id==="ma"))'); pg.wait_for_timeout(400)
        sp = C()['savedPlans']
        check(len(sp) == count + 1 and sp[-1]['number'] == 5 and sp[-1]['weekPlan']['4'][1]['foods'][0]['g'] == 111, 'same-day re-send after an edit updates #5 in place')

        print('6. Τήρηση, σημείωση, φίλτρα, σύγκριση')
        tok = C()['shareToken']
        today = J('phToday()')
        J(f'Cloud._checkinsCache[{json.dumps(tok)}]=[{{date:{json.dumps(today)},meals_done:4,meals_total:5}}]; renderMain(); swTab(4);'); pg.wait_for_timeout(300)
        txt = J('document.getElementById("s4").textContent')
        check('τήρηση 80%' in txt, 'adherence pill for the current plan')
        check('g/kg' in txt and 'Φυτικές ίνες' in txt and 'Τι άλλαξε από το #4' in txt, 'detail card: g/kg, fiber, food diff')
        pid = sp[-1]['id']
        J(f'document.getElementById("ph-note-{pid}").value="Ξαναβλέπουμε σε 2 εβδ."; savePlanNote("{pid}")')
        check(C()['savedPlans'][-1]['note'] == 'Ξαναβλέπουμε σε 2 εβδ.', 'note edited after saving')
        J('phSetFilter("backup")'); pg.wait_for_timeout(100)
        check(J('document.querySelectorAll("#s4 .ph-title").length') == 0 and 'Αυτόματο backup' in J('document.getElementById("s4").textContent'), 'backup filter shows only backups')
        J('phSetFilter("sent")'); pg.wait_for_timeout(100)
        tl = J('[...document.querySelectorAll("#s4 .ph-title")].map(e=>e.textContent)')
        check(len(tl) == 1 and '#5' in tl[0], f'sent filter → {tl}')
        J('phSetFilter("all")')
        J('openPlanCompare("plan_1000")'); pg.wait_for_timeout(150)
        ov = J('document.getElementById("plan-compare-overlay").textContent')
        check('Σύγκριση πλάνων' in ov and 'kcal ανά ημέρα' in ov and 'Άλλαξε η ποσότητα' in ov, 'compare overlay renders')
        check(J('document.getElementById("phc-a").selectedOptions[0].text.startsWith("#1")') and J('document.getElementById("phc-b").selectedOptions[0].text.startsWith("#5")'), 'compare defaults: chosen plan → newest')
        J('closePlanCompare()')
        check(not J('!!document.getElementById("plan-compare-overlay")'), 'compare closes')

        print('7. Mobile width')
        pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(200)
        sw = J('document.getElementById("s4").scrollWidth <= document.getElementById("s4").clientWidth+2')
        check(sw, 'no horizontal overflow in s4 at 390px')

        errs = [e for e in errors if 'favicon' not in e]
        check(not errs, f'no console errors {errs[:3]}')
        br.close()
finally:
    srv.terminate()
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
