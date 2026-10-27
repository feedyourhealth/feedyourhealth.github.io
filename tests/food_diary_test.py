"""📒 Ημερολόγιο φαγητού: αποστολή → ο πελάτης γράφει (imerologio.html) → σχόλιο → το βλέπει ο πελάτης,
4 εβδομάδες / πλοήγηση, τερματισμός & λήξη (μόνο ανάγνωση), αποθήκευση χωρίς σύνδεση."""
import json, subprocess, sys, time, urllib.request, io
from datetime import date, timedelta
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

base = {'sex': 'F', 'age': 34, 'weight': 70, 'height': 165, 'activity': 'mod', 'goal': '-300', 'allergenListsVer': 2, 'foodExclude': []}
ma = dict(base, id='ma', name='Μαρία Κωνσταντίνου', phone='99123456')
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
        pg.on('pageerror', lambda e: errors.append('app: ' + str(e)))
        pg.on('console', lambda m: errors.append('app: ' + m.text) if m.type == 'error' else None)
        pg.add_init_script('if(!window.__SERVER){window.__SERVER=' + json.dumps(S) + ';window.__UID=' + json.dumps(U1) + ';localStorage.clear();}')
        pg.goto(f'http://localhost:{PORT}/Dietologist.html', wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=10000)
        pg.wait_for_timeout(800)
        J = lambda js: pg.evaluate(js)

        print('1. Κάρτα + αποστολή')
        J('selectClient("ma"); swTab(1); renderMain();'); pg.wait_for_timeout(400)
        card = pg.inner_text('#sec-food-diary')
        check('Ημερολόγιο φαγητού' in card and 'Δεν έχει σταλεί' in card, 'card next to intake shows «Δεν έχει σταλεί»')
        check(J('document.getElementById("sec-food-diary").parentElement===document.getElementById("sec-intake").parentElement'), 'card sits in the same row as the intake card')
        J('openFoodDiaryModal()'); pg.click('#fd-create-btn'); pg.wait_for_selector('#fd-url', timeout=4000)
        url = pg.input_value('#fd-url')
        tok = J('getC().diaryToken')
        check(url.endswith('imerologio.html?t=' + str(tok)) and tok, f'link created ({url[-36:]})')
        wa = pg.get_attribute('a[href^="https://wa.me/"]', 'href')
        check('4%20' in wa and 'imerologio.html' in wa, 'WhatsApp message mentions 4 weeks + link')
        row = J(f'window.__SERVER.diaries["{tok}"]')
        check(row['start_date'] == J('foodDiaryTodayStr()') and row['weeks'] == 4 and row['status'] == 'active', 'row: starts today, 4 weeks, active')
        J('document.getElementById("fd-send-overlay").remove(); renderMain();'); pg.wait_for_timeout(200)
        check('Εβδομάδα 1 από 4' in pg.inner_text('#sec-food-diary'), 'card: «Εβδομάδα 1 από 4»')
        J('swTab(2)'); pg.wait_for_timeout(200)
        check(not J('(function(){var e=document.getElementById("sec-food-diary");return !!(e&&e.offsetParent);})()'), 'card hidden outside the Στοιχεία tab')
        J('swTab(1); renderMain();')

        def client_page(server):
            cp = ctx.new_page()
            cp.on('pageerror', lambda e: errors.append('imerologio: ' + str(e)))
            cp.on('console', lambda m: errors.append('imerologio: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
            cp.add_init_script('window.__SERVER=' + json.dumps(server) + ';')
            cp.goto(f'http://localhost:{PORT}/imerologio.html?t={tok}', wait_until='domcontentloaded')
            cp.wait_for_selector('#meals .meal', timeout=5000)
            return cp

        print('2. Ο πελάτης γράφει')
        server = {'diaries': J('window.__SERVER.diaries')}
        cp = client_page(server)
        txt = cp.inner_text('#root')
        check('Γεια σου Μαρία' in txt and 'Εβδομάδα 1 από 4' in txt, 'greeting + «Εβδομάδα 1 από 4»')
        check(cp.locator('#meals .meal').count() == 6, '6 meal slots')
        check(cp.is_disabled('#wNext') and cp.is_disabled('#wPrev'), 'week arrows locked in week 1')
        cp.fill('#m-breakfast', 'Βρώμη με γάλα και φράουλες')
        cp.click('.chip[data-k="lunch"][data-q="skip"]')
        cp.click('#feel button[data-v="2"]')
        cp.wait_for_timeout(1600)
        today = J('foodDiaryTodayStr()')
        ent = cp.evaluate('window.__SERVER.diaries[%s].entries' % json.dumps(tok)).get(today, {})
        check(ent.get('meals', {}).get('breakfast') == 'Βρώμη με γάλα και φράουλες' and ent.get('meals', {}).get('lunch') == 'Δεν έφαγα' and ent.get('feel') == 2, f'saved to server: breakfast + skipped lunch + feel ({ent})')
        check('Αποθηκεύτηκε' in cp.inner_text('#savepill'), 'save pill confirms')
        check(cp.evaluate('localStorage.getItem("fyh_diary_pending_"+%s)' % json.dumps(tok)) is None, 'nothing left pending')
        cp.fill('#m-lunch', '')
        cp.wait_for_timeout(1500)
        check('lunch' not in cp.evaluate('window.__SERVER.diaries[%s].entries' % json.dumps(tok)).get(today, {}).get('meals', {}), 'clearing a meal removes it')

        print('3. Ο διαιτολόγος βλέπει και σχολιάζει')
        J('window.__SERVER.diaries=' + json.dumps(cp.evaluate('window.__SERVER.diaries')))
        J('openFoodDiaryViewer()'); pg.wait_for_selector('#fd-tbl td.cell', timeout=4000)
        tbl = pg.inner_text('#fd-tbl')
        check('Βρώμη με γάλα' in tbl and '😊' in tbl, 'viewer table shows the entry + day feeling')
        check(pg.locator('.fd-wtab').count() == 4 and pg.locator('.fd-wtab:disabled').count() == 3, '4 week tabs, future weeks disabled')
        pg.click(f'#fd-tbl td.cell[data-c="{today}|breakfast"]')
        pg.click('#fd-react button[data-r="👍"]')
        pg.fill('#fd-cmt', 'Τέλειο πρωινό!')
        pg.click('#fd-cmt-save'); pg.wait_for_timeout(400)
        cm = J(f'window.__SERVER.diaries["{tok}"].comments')
        check(cm.get(f'{today}|breakfast', {}).get('r') == '👍' and cm[f'{today}|breakfast']['t'] == 'Τέλειο πρωινό!', 'comment saved to server')
        pg.fill('#fd-notes', 'Πρωινό σταθερό')
        pg.wait_for_timeout(1400)
        check(J(f'window.__SERVER.diaries["{tok}"].notes')['0'] == 'Πρωινό σταθερό', 'private week note autosaved')
        check(pg.locator('#fd-react button').count() == 5 and 'Έλεος' in pg.inner_text('#fd-react'), '5 reactions incl. «Έλεος»')
        pg.click(f'#fd-tbl td.cell[data-c="{today}|lunch"]')
        pg.click('#fd-tips button[data-i="0"]'); pg.click('#fd-tips button[data-i="1"]'); pg.click('#fd-tips button[data-i="0"]')
        check(pg.input_value('#fd-cmt') == 'Πρόσθεσε λίγη πρωτεΐνη εδώ. Πρόσθεσε λαχανικά ή σαλάτα.', f'advice chips write the phrases once each ({pg.input_value("#fd-cmt")!r})')
        pg.click('#fd-cmt-save'); pg.wait_for_timeout(400)
        pg.click(f'#fd-tbl td.cell[data-c="{today}|snack1"]')
        pg.click('#fd-react button[data-r="🤦"]'); pg.click('#fd-cmt-save'); pg.wait_for_timeout(400)
        cm = J(f'window.__SERVER.diaries["{tok}"].comments')
        check(cm.get(f'{today}|snack1', {}).get('r') == '🤦' and 'πρωτεΐνη' in cm.get(f'{today}|lunch', {}).get('t', ''), 'reaction-only «Έλεος» + advice comment saved')
        J('closeFoodDiaryViewer()'); pg.wait_for_timeout(300)
        card = pg.inner_text('#sec-food-diary')
        check('1/7' in card and 'νέα καταγραφή' not in card, 'card: 1/7 days, no «νέα» badge after viewing')

        print('4. Ο πελάτης βλέπει το σχόλιο — όχι τις σημειώσεις')
        server = {'diaries': J('window.__SERVER.diaries')}
        cp.close(); cp = client_page(server)
        b = cp.inner_text('#meals')
        check('Τέλειο πρωινό!' in b and 'Διαιτολόγος' in b, 'comment bubble under breakfast')
        check('Έλεος!' in b and 'Πρόσθεσε λαχανικά ή σαλάτα.' in b, 'client sees «Έλεος!» and the advice text')
        check('Πρωινό σταθερό' not in cp.content(), 'private notes never reach the client page')

        print('5. Χωρίς σύνδεση → κρατιέται και στέλνεται μετά')
        cp.evaluate('window.__SERVER.rpcFail=true')
        cp.fill('#m-dinner', 'Σαλάτα με τόνο')
        cp.wait_for_timeout(1400)
        check('Χωρίς σύνδεση' in cp.inner_text('#savepill'), 'offline pill shown')
        check('dinner' in (cp.evaluate('localStorage.getItem("fyh_diary_pending_"+%s)' % json.dumps(tok)) or ''), 'kept in localStorage while offline')
        cp.evaluate('window.__SERVER.rpcFail=false; flushAll();'); cp.wait_for_timeout(500)
        check(cp.evaluate('window.__SERVER.diaries[%s].entries[%s].meals.dinner' % (json.dumps(tok), json.dumps(today))) == 'Σαλάτα με τόνο', 'sent once back online')

        print('6. Τρίτη εβδομάδα: πλοήγηση + μελλοντικές μέρες κλειδωμένες')
        server = {'diaries': cp.evaluate('window.__SERVER.diaries')}
        start = (date.today() - timedelta(days=15)).isoformat()
        server['diaries'][tok]['start_date'] = start
        server['today'] = date.today().isoformat()
        cp.close(); cp = client_page(server)
        check('Εβδομάδα 3 από 4' in cp.inner_text('.wknav'), 'opens on week 3')
        check(cp.locator('#days .day:disabled').count() == 5, 'the 5 days after today are disabled')
        cp.click('#wPrev'); cp.wait_for_timeout(100)
        check('Εβδομάδα 2 από 4' in cp.inner_text('.wknav') and cp.locator('#days .day:disabled').count() == 0, '‹ goes to week 2, all days open')
        cp.click('#days .day >> nth=0'); cp.fill('#m-breakfast', 'Αυγά'); cp.wait_for_timeout(1400)
        check((date.today() - timedelta(days=8)).isoformat() in cp.evaluate('Object.keys(window.__SERVER.diaries[%s].entries)' % json.dumps(tok)), 'can fill in a missed past day')

        print('7. Τερματισμός & λήξη = μόνο ανάγνωση')
        J('window.__SERVER.diaries=' + json.dumps(cp.evaluate('window.__SERVER.diaries')))
        J(f'window.__SERVER.diaries["{tok}"].start_date="{start}"; getC().diaryStart="{start}";')
        J('Cloud.endFoodDiary(getC()).then(function(){ renderMain(); })'); pg.wait_for_timeout(300)
        check('Ολοκληρώθηκε' in pg.inner_text('#sec-food-diary') and 'Νέα αποστολή' in pg.inner_text('#sec-food-diary'), 'card: «Ολοκληρώθηκε» + «Νέα αποστολή»')
        server = {'diaries': J('window.__SERVER.diaries'), 'today': date.today().isoformat()}
        cp.close(); cp = client_page(server)
        check('ολοκληρώθηκε' in cp.inner_text('#root') and cp.locator('#meals textarea[readonly]').count() == 6 and cp.locator('.chip').count() == 0, 'ended diary is read-only')
        server['diaries'][tok]['status'] = 'active'
        server['today'] = (date.fromisoformat(start) + timedelta(days=28)).isoformat()
        cp.close(); cp = client_page(server)
        check('ολοκληρώθηκε' in cp.inner_text('#root'), 'past the 4 weeks it is read-only too')
        r = cp.evaluate('sb.rpc("save_food_diary_day",{p_token:%s,p_date:%s,p_day:{meals:{breakfast:"x"}}}).then(function(x){return x.data;})' % (json.dumps(tok), json.dumps(start)))
        check(r.get('reason') == 'ended', 'server refuses writes after the end')

        print('8. Νέα αποστολή → ο παλιός σύνδεσμος αντικαθίσταται')
        J('openFoodDiaryModal(true)'); pg.click('#fd-create-btn'); pg.wait_for_selector('#fd-url', timeout=4000)
        tok2 = J('getC().diaryToken')
        check(tok2 != tok and J(f'window.__SERVER.diaries["{tok}"].status') in ('superseded', 'ended'), 'new token, old one no longer active')
        server = {'diaries': J('window.__SERVER.diaries')}
        server['diaries'][tok]['status'] = 'superseded'
        cp.close()
        cp2 = ctx.new_page(); cp2.add_init_script('window.__SERVER=' + json.dumps(server) + ';')
        cp2.goto(f'http://localhost:{PORT}/imerologio.html?t={tok}'); cp2.wait_for_timeout(600)
        check('αντικαταστάθηκε' in cp2.inner_text('#root'), 'old link says it was replaced')
        cp2.goto(f'http://localhost:{PORT}/imerologio.html?t=nope'); cp2.wait_for_timeout(600)
        check('Μη έγκυρος' in cp2.inner_text('#root'), 'unknown token → «Μη έγκυρος σύνδεσμος»')

        print('9. English link')
        server['diaries'][tok2]['lang'] = 'en'
        tok = tok2
        J('getC().diaryLang="en"; openFoodDiaryViewer()'); pg.wait_for_selector('#fd-tbl td.cell', timeout=4000)
        pg.click(f'#fd-tbl td.cell[data-c="{today}|breakfast"]'); pg.click('#fd-tips button[data-i="4"]')
        check(pg.input_value('#fd-cmt') == 'Don’t forget your water.', 'advice chip writes English for an English link')
        J('closeFoodDiaryViewer()')
        server['diaries'][tok2]['comments'] = {f'{today}|breakfast': {'r': '🤦', 't': ''}, f'{today}|lunch': {'r': '💪', 't': ''}}
        cp3 = client_page(server)
        check('Breakfast' in cp3.inner_text('#meals') and 'Week 1 of 4' in cp3.inner_text('.wknav'), 'English labels')
        check('Oh dear!' in cp3.inner_text('#meals') and 'Great choice!' in cp3.inner_text('#meals'), 'new reactions translated for English clients')
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
check(not errs, 'no console errors' + (': ' + ' | '.join(errs[:5]) if errs else ''))
print('\nFAILED: %d' % len(fails) if fails else '\nALL OK')
sys.exit(1 if fails else 0)
