"""🏁 Ιστορικό πλάνων — αθλητές: αγώνες, φάση/αγώνας ανά πλάνο, CHO g/kg ανά ημέρα, EA, πρωτεΐνη/γεύμα,
απολογισμός αγώνα, «Επανάληψη πλάνου αγώνα», σημαίες στο γράφημα."""
import json, subprocess, sys, time, urllib.request, io
from datetime import date, timedelta
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

T = date.today()
iso = lambda d: d.isoformat()
def plan(rice):
    return {str(d): [{'name': 'Πρωινό', 'foods': [{'n': 'Γιαούρτι 2%', 'g': 200}]},
                     {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}, {'n': 'Ρύζι μπασμάτι (βρ.)', 'g': rice + d * 10}]},
                     {'name': 'Ενδιάμεσο', 'foods': [{'n': 'Γιαούρτι 2%', 'g': 100}]}] for d in range(7)}

ru = {'id': 'ru', 'name': 'Δρομέας Δοκιμής', 'sex': 'M', 'age': 30, 'weight': 67, 'height': 176, 'bf': 12, 'activity': 'light',
      'goal': '0', 'goalMain': 'maintain', 'allergenListsVer': 2, 'foodExclude': [], 'sport': 'running',
      'trainDays': [True, True, False, True, True, True, False],
      'metActivities': [{'id': 'run_10', 'name': 'Τρέξιμο', 'met': 9.8, 'mins': 60, 'time': '07:00', 'days': [0, 1, 3, 4, 5]}],
      'choProtocol': {'enabled': True, 'mode': 'auto'},
      'weightLog': [{'date': iso(T - timedelta(days=40)), 'weight': 67, 'bf': 12}],
      'weekPlan': plan(150)}
ni = {'id': 'ni', 'name': 'Μη αθλητής', 'sex': 'F', 'age': 40, 'weight': 70, 'height': 165, 'activity': 'light', 'goal': '0',
      'allergenListsVer': 2, 'foodExclude': [], 'weekPlan': plan(100),
      'savedPlans': [{'id': 'plan_1', 'number': 1, 'date': iso(T - timedelta(days=5)), 'macros': {'k': 1500, 'p': 90, 'f': 50, 'c': 160}, 'weekPlan': plan(100)}]}
S = {'rows': {U1: {'data': {'clients': [ru, ni], 'customTemplates': []}, 'version': 1}}}

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
        C = lambda cid='ru': J(f'clients.find(x=>x.id==="{cid}")')
        S4 = lambda: J('document.getElementById("s4").textContent')
        open_ = lambda cid: (J(f'selectClient("{cid}"); renderMain(); swTab(4);'), pg.wait_for_timeout(350))

        print('1. Μη αθλητής: τίποτα αθλητικό')
        open_('ni')
        check('Αγώνες' not in S4() and 'Energy Availability' not in S4(), 'no race card / athlete metrics for a non-athlete')

        print('2. Αγώνες: προσθήκη (παρελθόν + επόμενος)')
        open_('ru')
        check('🏁 Αγώνες' in S4(), 'athlete with no saved plans still sees the race card')
        def add_race(name, d):
            J('phaOpenRaceModal()'); pg.wait_for_timeout(80)
            pg.fill('#pha-r-name', name); pg.fill('#pha-r-date', d)
            J('phaSaveRace(null)'); pg.wait_for_timeout(150)
        add_race('Ημιμαραθώνιος', iso(T - timedelta(days=3)))
        add_race('Μαραθώνιος', iso(T + timedelta(days=30)))
        races = C()['races']
        past = [r for r in races if r['name'] == 'Ημιμαραθώνιος'][0]['id']
        fut = [r for r in races if r['name'] == 'Μαραθώνιος'][0]['id']
        check(len(races) == 2, 'two races stored')
        check('Επόμενος αγώνας' in S4() and 'Μαραθώνιος' in S4(), 'next-race banner')

        print('3. Αποθήκευση με φάση/αγώνα + αθλητικό στιγμιότυπο')
        J('showSavePlanPanel()'); pg.wait_for_timeout(100)
        check(J('!!document.getElementById("pha-save-phase")'), 'save modal shows the phase select for athletes')
        opts = J('[...document.querySelectorAll("#pha-save-race option")].map(o=>o.value)')
        check(fut in opts and past not in opts, 'race select lists only upcoming races')
        J('document.getElementById("pha-save-phase").value="comp"; doSavePlan();'); pg.wait_for_timeout(300)
        e = C()['savedPlans'][-1]
        a = (e.get('ctx') or {}).get('athlete') or {}
        check(e.get('phase') == 'comp', 'entry phase = comp')
        check(len(a.get('days') or []) == 7 and a.get('ffm', 0) > 50 and a.get('exWeekly', 0) > 0, f'athlete snapshot (ffm={a.get("ffm")}, exWeekly={a.get("exWeekly")})')
        check(sum(1 for d in a['days'] if d['t']) == 5, 'snapshot keeps the 5 training days')
        pid = e['id']
        J(f'phaSetPlanRace("{pid}","{past}")'); pg.wait_for_timeout(200)
        check(C()['savedPlans'][-1].get('raceId') == past, 'race linked from the detail card')
        t = S4()
        check('Energy Availability' in t and 'kcal/kg FFM' in t, 'EA tile in detail')
        check('Πρωτεΐνη ανά γεύμα' in t and 'Ενδιάμεσο' in t, 'protein-per-meal chips')
        check('g/kg' in t and 'Προπόνηση' in t and 'Ξεκούραση' in t, 'CHO per-day strip with day types')
        check('Ημιμαραθώνιος' in t and 'Αγωνιστική' in t, 'phase + race badges on the row')
        ea = J(f'phaEA(phFind(getC(),"{pid}"))')
        exp = round((e['macros']['k'] - a['exDaily']) / a['ffm'])
        check(ea == exp, f'EA = (plan kcal − exercise/day) / FFM ({ea} == {exp})')

        print('4. Απολογισμός αγώνα')
        J(f'phaOpenDebrief("{past}")'); pg.wait_for_timeout(100)
        J('phaPickPerf(5); phaToggleGi("Φούσκωμα");')
        pg.fill('#pha-d-result', '1:31:40'); pg.fill('#pha-d-dur', '90'); pg.fill('#pha-d-wpre', '67'); pg.fill('#pha-d-wpost', '65,6')
        pg.fill('#pha-d-fl', '350'); pg.fill('#pha-d-cho', '90'); pg.fill('#pha-d-note', 'Χαμηλές ίνες D-1 βοήθησαν')
        calc = J('document.getElementById("pha-d-calc").textContent')
        check('2,1%' in calc and '1,2 L/h' in calc and '60 g/h' in calc, f'live calc: {calc}')
        J(f'phaSaveDebrief("{past}")'); pg.wait_for_timeout(200)
        db = [r for r in C()['races'] if r['id'] == past][0].get('debrief') or {}
        check(db.get('perf') == 5 and db.get('gi') == ['Φούσκωμα'] and db.get('wPost') == 65.6, 'debrief stored')
        t = S4()
        check('Απόδοση 5/5' in t and 'Sweat rate' in t and 'Χαμηλές ίνες' in t, 'debrief summary in the linked plan')

        print('5. Επανάληψη για τον επόμενο αγώνα')
        J(f'clients.find(x=>x.id==="ru").weightLog.push({{date:"{iso(T)}",weight:65,bf:11}})')
        J(f'renderMain(); swTab(4); phaOpenRepeat("{pid}")'); pg.wait_for_timeout(150)
        m = J('document.getElementById("pha-overlay").textContent')
        check('Μαραθώνιος' in m and '×0,97' in m, 'repeat modal: target race + weight scaling')
        src = C()['savedPlans'][-1]['weekPlan']
        J(f'phaDoRepeat("{pid}","{fut}")'); pg.wait_for_timeout(400)
        c = C()
        shift = ((date.fromisoformat(iso(T + timedelta(days=30))).weekday() - date.fromisoformat(iso(T - timedelta(days=3))).weekday()) % 7)
        rice_src = src['2'][1]['foods'][1]['g']
        rice_new = c['weekPlan'][str((2 + shift) % 7)][1]['foods'][1]['g']
        check(abs(rice_new - round(rice_src * 65 / 67)) <= 1, f'day rotated by {shift} + grams scaled ({rice_src} → {rice_new})')
        check(c['planTag'] == {'phase': 'taper', 'raceId': fut, 'note': 'Από #1: Χαμηλές ίνες D-1 βοήθησαν'}, f'planTag set {c.get("planTag")}')
        J('Cloud.publishPlan(clients.find(x=>x.id==="ru"))'); pg.wait_for_timeout(500)
        e2 = C()['savedPlans'][-1]
        check(e2.get('kind') == 'sent' and e2.get('phase') == 'taper' and e2.get('raceId') == fut and e2.get('note', '').startswith('Από #1'), 'publish → entry tagged taper + next race + carried note')
        check(C()['planTag'].get('note') == '', 'carried note used once')

        print('6. Φίλτρο αγώνων + γράφημα')
        J('renderMain(); swTab(4); phSetFilter("race")'); pg.wait_for_timeout(200)
        n = J('document.querySelectorAll("#s4 .ph-title").length')
        check(n == 2, f'race filter shows the 2 race-linked plans ({n})')
        J('phSetFilter("all")'); pg.wait_for_timeout(100)
        flags = J('[...document.querySelectorAll("#s4 svg path")].filter(p=>p.getAttribute("stroke")==="#8a4b00").length')
        check(flags == 1, f'upcoming race flag on the chart; the race before the first plan is out of range ({flags})')
        check(J('document.querySelectorAll("#s4 svg rect title").length') >= 1, 'phase bands drawn')

        print('7. Διαγραφή αγώνα αποσυνδέει τα πλάνα')
        J(f'phaDeleteRace("{fut}")'); J('executeConfirm()'); pg.wait_for_timeout(250)
        check(all(p.get('raceId') != fut for p in C()['savedPlans']) and len(C()['races']) == 1, 'race removed and plans unlinked')

        pg.set_viewport_size({'width': 390, 'height': 844}); J('renderMain(); swTab(4);'); pg.wait_for_timeout(300)
        check(J('document.getElementById("s4").scrollWidth <= document.getElementById("s4").clientWidth+2'), 'no horizontal overflow at 390px')
        errs = [x for x in errors if 'favicon' not in x]
        check(not errs, f'no console errors {errs[:3]}')
        br.close()
finally:
    srv.terminate()
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
