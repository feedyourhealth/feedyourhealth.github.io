"""#2 pregnancy + lactation: calcTDEE numbers, safety flags, form ticks, genPlan gate."""
import json, subprocess, sys, time, urllib.request, io
from pathlib import Path
from datetime import date, timedelta
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8891
U1 = 'user-111'
fails, errors = [], []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

base = {'sex': 'F', 'age': 31, 'weight': 55, 'height': 158, 'activity': 'sed', 'goal': '-500', 'allergenListsVer': 2, 'foodExclude': []}
cp = dict(base, id='cp', name='Έγκυος', pregnant=True, gestationalWeek=20, prePregnancyWeight=52)
cl = dict(base, id='cl', name='Θηλάζει', lactating=True, deliveryDate=(date.today() - timedelta(days=21)).isoformat())
cn = dict(base, id='cn', name='Απλή', goal='0')
ci = dict(base, id='ci', name='Ερωτηματολόγιο', goal='-300', intakeToken='tokI', intakeStatus='submitted')
S = {'rows': {U1: {'data': {'clients': [cp, cl, cn, ci], 'customTemplates': []}, 'version': 1}}}

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(bypass_csp=True, viewport={'width': 1400, 'height': 1000})
        ctx.route('**/vendor/supabase-js.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        ctx.route('**/*.supabase.co/**', lambda r: r.abort())
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.add_init_script('window.__SERVER=' + json.dumps(S) + ';window.__UID=' + json.dumps(U1) + ';localStorage.clear();')
        pg.goto(f'http://localhost:{PORT}/Dietologist.html', wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=10000)
        pg.wait_for_timeout(800)
        def dlg(): return pg.get_attribute('#confirmDialog', 'data-open') == 'true'
        def T(expr): return pg.evaluate(expr)

        print('1. calcTDEE')
        r = T('(()=>{var c=JSON.parse(JSON.stringify(clients.find(x=>x.id==="cp"))); var t=calcTDEE(c); return {min:Math.min.apply(null,t.trainTargetByDay), target:t.target, add:t.pregAdd, gd:t.goalDelta, floor:t.kcalFloor, w:t.warnings.map(w=>w.msg).join(" | ")};})()')
        check(r['min'] >= 1800 and r['floor'] == 1800, f"pregnant −500: every day ≥1800 (min {r['min']}, target {r['target']}, +{r['add']})")
        check('κατώτατο όριο των 1800' in r['w'], 'warning says the 1800 floor was applied')
        r = T('(()=>{var c=JSON.parse(JSON.stringify(clients.find(x=>x.id==="cl"))); c.goal="0"; c.macroP=12; var t=calcTDEE(c); var c0=JSON.parse(JSON.stringify(c)); c0.lactating=false; var t0=calcTDEE(c0); return {add:t.lactAdd, diff:t.restTarget-t0.restTarget, r1:t.restTarget, r0:t0.restTarget, tdee1:t.tdee, tdee0:t0.tdee, bmr1:t.bmr, bmr0:t0.bmr, hyd:t.hydBase-t0.hydBase, w:t.warnings.map(w=>w.msg).join(" | ")};})()')
        check(r['add'] == 330 and r['r1'] == max(r['r0']+330, 1800), f"lactating 3 weeks: +330 kcal (diff {r['diff']}: {r['r0']}→{r['r1']}, tdee {r['tdee0']}/{r['tdee1']}, bmr {r['bmr0']}/{r['bmr1']})")
        check(r['hyd'] == 700, f"hydration +700 ml ({r['hyd']})")
        check('Πρωτεΐνη κάτω από τον στόχο θηλασμού' in r['w'], 'protein <1.3 g/kg warning')
        r = T('(()=>{var c=JSON.parse(JSON.stringify(clients.find(x=>x.id==="cl"))); c.goal="0"; var d=new Date(); d.setMonth(d.getMonth()-8); c.deliveryDate=d.toISOString().slice(0,10); var t=calcTDEE(c); var c2=JSON.parse(JSON.stringify(c)); delete c2.deliveryDate; var t2=calcTDEE(c2); return {add:t.lactAdd, add2:t2.lactAdd, w2:t2.warnings.map(w=>w.msg).join(" | ")};})()')
        check(r['add'] == 400 and r['add2'] == 330 and 'ημερομηνία τοκετού' in r['w2'], f"8 months → +400; no date → +330 + reminder ({r['add']}/{r['add2']})")
        r = T('(()=>{var c=JSON.parse(JSON.stringify(clients.find(x=>x.id==="cn"))); var t=calcTDEE(c); return {floor:t.kcalFloor, bmr:t.bmr, lact:t.lactAdd};})()')
        check(r['floor'] == r['bmr'] and r['lact'] == 0, 'non-pregnant client unaffected (floor = BMR)')

        print('2. Safety flags')
        r = T('(()=>{var o={}; ["cp","cl"].forEach(id=>{ var c=clients.find(x=>x.id===id); o[id]=getPregnancySafetyFlags(c).map(f=>f.level+(f.fix?"+fix":"")); }); var c=JSON.parse(JSON.stringify(clients.find(x=>x.id==="cl"))); var d=new Date(); d.setDate(d.getDate()-70); c.deliveryDate=d.toISOString().slice(0,10); o.late=getPregnancySafetyFlags(c).map(f=>f.level); return o;})()')
        check('block+fix' in r['cp'], f"pregnant + loss → block with «Διατήρηση» fix ({r['cp']})")
        check('block+fix' in r['cl'], f"lactating week 3 + loss → block with fix ({r['cl']})")
        check(r['late'] == ['info'], f"lactating week 10 + loss → info only ({r['late']})")

        print('3. genPlan gate: pregnant + loss → «Στόχος → Διατήρηση & συνέχεια»')
        T('selectClient("cp"); renderMain();'); pg.wait_for_timeout(400)
        T('genPlanWithUndo()'); pg.wait_for_timeout(400)
        check(dlg() and 'Διατήρηση' in pg.inner_text('#confirmBtn'), f"dialog primary button = «{pg.inner_text('#confirmBtn') if dlg() else '-'}»")
        pg.click('#confirmBtn'); pg.wait_for_timeout(600)
        for _ in range(3):
            if dlg(): pg.click('#confirmBtn'); pg.wait_for_timeout(500)
        r = T('(()=>{var c=getC(); return {goal:c.goal, plan:Object.keys(c.weekPlan||{}).length, minDay:Math.min.apply(null,(c.dayTargets||[]).map(d=>d.kcal||d.k||d.target||99999))};})()')
        check(r['goal'] == '0' and r['plan'] == 7, f"goal → 0 and plan generated ({r})")

        print('4. Form ticks')
        T('selectClient("cn"); renderMain();'); pg.wait_for_timeout(300)
        T('(()=>{["s1","sec-basic-body"].forEach(function(id){var b=document.getElementById(id); if(b) b.style.display="block";});})()')
        T('setGoalCalories(-400)'); pg.wait_for_timeout(300)
        T('(()=>{["s1","sec-basic-body"].forEach(function(id){var b=document.getElementById(id); if(b) b.style.display="block";});})()')
        print('   visibility chain:', T('(()=>{var e=document.getElementById("inp-lactating"), out=[]; while(e){ var cs=getComputedStyle(e); if(cs.display==="none"||cs.visibility==="hidden") out.push((e.id||e.className||e.tagName)+":"+cs.display); e=e.parentElement; } return out;})()'))
        pg.check('#inp-lactating'); pg.wait_for_timeout(500)
        check(dlg() and 'Διατήρηση' in pg.inner_text('#confirmMessage'), 'ticking 🤱 with a loss goal offers Διατήρηση')
        pg.click('#confirmBtn'); pg.wait_for_timeout(500)
        r = T('({goal:getC().goal, lact:getC().lactating, vis:getComputedStyle(document.getElementById("lact-fields-wrap")).display, badge:document.getElementById("lact-stage-badge").textContent})')
        check(r['goal'] == '0' and r['lact'] is True and r['vis'] != 'none' and '+330' in r['badge'], f"lactating on, fields shown, badge «{r['badge']}»")
        T('(()=>{["s1","sec-basic-body"].forEach(function(id){var b=document.getElementById(id); if(b) b.style.display="block";});})()')
        pg.check('#inp-pregnant'); pg.wait_for_timeout(500)
        if dlg(): pg.click('#confirmBtn'); pg.wait_for_timeout(300)
        r = T('({p:getC().pregnant, l:getC().lactating, lvis:getComputedStyle(document.getElementById("lact-fields-wrap")).display})')
        check(r['p'] is True and r['l'] is False and r['lvis'] == 'none', f'ticking 🤰 unticks 🤱 ({r})')
        T('(()=>{["s1","sec-basic-body"].forEach(function(id){var b=document.getElementById(id); if(b) b.style.display="block";});})()')
        pg.locator('#preg-toggle-wrap').scroll_into_view_if_needed()
        pg.uncheck('#inp-pregnant'); pg.wait_for_timeout(300); T('(()=>{["s1","sec-basic-body"].forEach(function(id){var b=document.getElementById(id); if(b) b.style.display="block";});})()'); pg.check('#inp-lactating'); pg.wait_for_timeout(400)
        T('(()=>{["s1","sec-basic-body"].forEach(function(id){var b=document.getElementById(id); if(b) b.style.display="block";});})()')
        if dlg(): pg.click('#confirmBtn'); pg.wait_for_timeout(300)

        print('5. Intake «Εγκυμοσύνη/θηλ.: Ναι» buttons')
        html = T('(()=>{INTAKE_PAYLOAD_CACHE["tokI"]={v:1,profile:{},goal:"health",conditions:[],pregnancyBreastfeeding:true,allergies:[],avoid:[],habits:{}}; var c=clients.find(x=>x.id==="ci"); return buildIntakeReadbackHtml(c);})()')
        check("intakeSetRepro('pregnant')" in html and "intakeSetRepro('lactating')" in html, 'read-back offers 🤰 / 🤱 buttons')
        T('selectClient("ci"); renderMain(); intakeSetRepro("lactating");'); pg.wait_for_timeout(500)
        check(dlg() and 'Διατήρηση' in pg.inner_text('#confirmMessage'), 'choosing 🤱 with goal −300 offers Διατήρηση')
        pg.click('#confirmSecondaryBtn') if pg.is_visible('#confirmSecondaryBtn') else pg.evaluate('closeConfirmDialog()')
        check(T('getC().lactating===true && getC().pregnant===false'), 'intake button set lactating')

        pg.wait_for_timeout(2500)
        saved = {c['id']: c for c in T('window.__SERVER')['rows'][U1]['data']['clients']}
        check(saved['ci'].get('lactating') is True and saved['cp'].get('goal') == '0', 'changes reached the cloud')
        br.close()
finally:
    srv.terminate()
errs = [e for e in errors if 'favicon' not in e]
if errs: fails.append('console errors: ' + ' | '.join(errs[:6]))
print('\nRESULT:', 'ALL PASSED' if not fails else f'{len(fails)} FAILED')
for f in fails: print(' -', f)
