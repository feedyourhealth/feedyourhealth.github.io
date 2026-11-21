"""🔔 Ειδοποιήσεις (2026-11-21) — καμπανάκι + πάνελ + «Τι να μου λέει».

1. Badge μετράει ΜΟΝΟ τα «Χρειάζονται εσένα» (❓ ερώτηση, χαμηλό feedback, νέο ερωτηματολόγιο)·
   σιγασμένος πελάτης και σχόλιο ημέρας (default «Σύνοψη») δεν μετράνε.
2. Πάνελ: κάρτες ενεργειών + «Σήμερα με μια ματιά» (check-ins, προπόνηση, βάρος, σερί 14, σίγαση)
   + μονογραμμή για χθες που ανοίγει.
3. «Το είδα» στο ερωτηματολόγιο → badge −1· ίδιο flag με «💬 Μηνύματα» για τις ερωτήσεις.
4. Ρυθμίσεις: σχόλιο → «Ειδοποίηση» ανεβάζει badge, ερώτηση → «Όχι» το κατεβάζει· prefs στο cloud blob.
5. Σίγαση/άρση σίγασης από τις ρυθμίσεις.
Uses the fake in-browser Supabase — never touches real data.
"""
import datetime, json, subprocess, sys, time, urllib.request, io, os
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8898
BASE = f'http://localhost:{PORT}/Dietologist.html'
U1 = 'user-111'
SHOTS = os.environ.get('NOTIF_SHOTS')   # προαιρετικός φάκελος για screenshots
fails, errors = [], []

def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

today = datetime.date.today()
def dk(n): return (today - datetime.timedelta(days=n)).isoformat()
def monday(n):
    d = today - datetime.timedelta(days=n); return (d - datetime.timedelta(days=d.weekday())).isoformat()

def client(cid, name, tok, **kw):
    c = {'id': cid, 'name': name, 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod',
         'goal': 'maintain', 'allergenListsVer': 2, 'shareToken': tok, 'phone': '99123456'}
    c.update(kw); return c
now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
BLOB = {'clients': [client('c1', 'Μαρία Κωνσταντίνου', 'tokA'),
                    client('c2', 'Γιώργος Παππάς', 'tokB'),
                    client('c3', 'Ελένη Σάββα', None, intakeToken='itk', intakeStatus='submitted', intakeSubmittedAt=now_iso),
                    client('c4', 'Νίκος Αντωνίου', 'tokD'),
                    client('c5', 'Δημήτρης Ρούσος', 'tokE', notifMuted=True)],
        'customTemplates': [], 'savedCombos': [], 'tipsLibrary': [],
        'clinicContact': {'wa': '', 'tel': '', 'email': ''}, 'updatedAt': '2026-10-01T00:00:00Z'}
good = lambda tok, n: {'token': tok, 'date': dk(n), 'meals_done': 3, 'meals_total': 3, 'water_glasses': 8, 'water_goal': 8, 'supps_done': 0, 'supps_total': 0}
SERVER = {'rows': {U1: {'data': BLOB, 'version': 5}}, 'shared': {},
          'tables': {
            'checkins': [good('tokD', n) for n in range(14)] + [good('tokA', 0), good('tokA', 1), good('tokB', 1)],
            'client_logs': [
              {'token': 'tokA', 'date': dk(0), 'weight_kg': 69.6, 'note': '❓ Την Τρίτη έχω γάμο, τι κάνω με το βραδινό;'},
              {'token': 'tokA', 'date': dk(3), 'weight_kg': 70.2, 'note': ''},
              {'token': 'tokB', 'date': dk(1), 'weight_kg': None, 'note': 'Όλα καλά σήμερα, λίγη πείνα το απόγευμα'},
              {'token': 'tokE', 'date': dk(0), 'weight_kg': None, 'note': '❓ Μπορώ να φάω πίτσα;'}],
            'plan_feedback': [{'token': 'tokB', 'week_start': monday(2), 'breakfast': 2, 'snacks': 4, 'lunch': 4, 'dinner': 4,
                               'recipes_ease': 4, 'ingredients_ease': 4, 'training_energy': 4, 'continue_likelihood': 8,
                               'low_rating_reasons': {'breakfast': ['Πεινάω']}}],
            'client_workout_log': [{'token': 'tokA', 'date': dk(0), 'data': {'e': {'t': 'run', 'm': 50}}}]}}

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(bypass_csp=True, viewport={'width': 1366, 'height': 900})
        ctx.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        ctx.route('**/*.supabase.co/**', lambda r: r.abort())
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.add_init_script('window.__SERVER=' + json.dumps(SERVER) + ';window.__UID=' + json.dumps(U1) + ';'
            + 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();'
            + "localStorage.setItem('fyh_cache_owner'," + json.dumps(U1) + ");localStorage.setItem('fyh_cache_base_version','5');}")
        pg.goto(BASE, wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=15000)
        J = lambda s: pg.evaluate(s)
        J('Promise.all([Cloud.refreshClientLogsCache(),Cloud.refreshPlanFeedbackCache(),Cloud.refreshCheckinsCache(),Cloud.refreshWorkoutLogCache()]).then(()=>renderSB())')
        pg.wait_for_timeout(600)
        badge = lambda: J("(()=>{var b=document.getElementById('notif-bell-badge');return b.style.display==='none'?0:+b.textContent})()")

        print('1. Badge')
        check(pg.locator('#notif-bell').is_visible(), 'bell visible')
        check(badge() == 3, f'badge = 3 (question + low feedback + intake) → {badge()}')

        print('2. Πάνελ')
        pg.click('#notif-bell'); pg.wait_for_timeout(500)
        check(pg.locator('#notif-panel').is_visible(), 'panel opens')
        cards = pg.locator('#notif-panel .nt-card')
        check(cards.count() == 3, f'3 action cards ({cards.count()})')
        txt = pg.inner_text('#notif-panel')
        check('Την Τρίτη έχω γάμο' in txt and 'Χαμηλή βαθμολογία' in txt and 'ερωτηματολόγιο' in txt, 'cards show question / feedback / intake')
        check('Μπορώ να φάω πίτσα' not in txt, 'muted client\'s question is not a card')
        dig = pg.inner_text('#notif-panel .nt-digest')
        check('συμπλήρωσαν τη μέρα τους' in dig, 'today: check-ins line')
        check('προπόνηση' in dig and 'Τρέξιμο 50′' in dig, f'today: workout with type/minutes')
        check('−0,6 kg' in dig, 'today: weight delta')
        check('14 μέρες στη σειρά' in dig and 'Στείλε μπράβο' in dig, 'today: 14-day streak + bravo')
        check('Δημήτρης Ρ.' in dig and 'ερώτηση' in dig, 'muted client lands in the digest')
        day = pg.locator('#notif-panel .nt-day').first
        check(day.count() == 1 and 'Χθες' in day.inner_text() and 'σχόλιο' in day.inner_text(), f'yesterday one-liner ({day.inner_text() if day.count() else ""!r})')
        day.click(); pg.wait_for_timeout(200)
        check('Όλα καλά σήμερα' in pg.inner_text('#notif-panel'), 'yesterday expands → the comment')
        if SHOTS: pg.screenshot(path=os.path.join(SHOTS, 'notif-panel.png'))

        print('2b. Πλήρης οθόνη')
        pg.click('#notif-panel .nt-full-b'); pg.wait_for_timeout(200)
        bb = pg.locator('#notif-panel').bounding_box()
        check('nt-full' in pg.get_attribute('#notif-panel', 'class') and bb['width'] > 1300 and bb['height'] > 850, f'⤢ → fills the screen ({bb})')
        ca, cd = pg.locator('.nt-col-alert').bounding_box(), pg.locator('.nt-col-digest').bounding_box()
        check(ca['x'] < cd['x'] and abs(ca['y'] - cd['y']) < 5, 'two columns side by side')
        if SHOTS: pg.screenshot(path=os.path.join(SHOTS, 'notif-full.png'))
        pg.keyboard.press('Escape'); pg.click('#notif-bell'); pg.wait_for_timeout(300)
        check('nt-full' in pg.get_attribute('#notif-panel', 'class'), 'remembers full screen on reopen')
        pg.click('#notif-panel .nt-full-b'); pg.wait_for_timeout(200)
        check(pg.locator('#notif-panel').bounding_box()['width'] <= 420, '⤡ → back to the small panel')

        print('3. Το είδα')
        pg.locator('#notif-panel .nt-card', has_text='ερωτηματολόγιο').get_by_role('button', name='👁️ Το είδα').click(); pg.wait_for_timeout(300)
        check(badge() == 2 and pg.locator('#notif-panel .nt-card').count() == 2, 'intake seen → badge 2')
        check(J('clients.find(c=>c.id==="c3").intakeNotifSeen') == now_iso, 'intakeNotifSeen stored on the client')
        pg.locator('#notif-panel .nt-card', has_text='γάμο').get_by_role('button', name='👁️ Το είδα').click(); pg.wait_for_timeout(300)
        check(badge() == 1, 'question seen → badge 1')
        check(J('isNoteSeen(clients.find(c=>c.id==="c1"),' + json.dumps(dk(0)) + ')') is True, 'same «seen» flag as Μηνύματα')

        print('4. Ρυθμίσεις')
        pg.click('#notif-panel [aria-label="Ρυθμίσεις ειδοποιήσεων"]'); pg.wait_for_timeout(200)
        check('Τι να μου λέει' in pg.inner_text('#notif-panel .nt-title'), 'settings view')
        check(pg.locator('#notif-panel .nt-set-row:not(.nt-set-email)').count() == 10, '10 event types')
        row = lambda lbl: pg.locator('#notif-panel .nt-set-row', has_text=lbl)
        check(row('Συμπλήρωσε τη μέρα').locator('.nt-seg-b').count() == 2, 'info types offer only Σύνοψη / Όχι')
        row('Σχόλιο στη μέρα').get_by_role('button', name='Ειδοποίηση').click(); pg.wait_for_timeout(200)
        check(badge() == 2, f'comment → Ειδοποίηση raises badge to 2 ({badge()})')
        row('Χαμηλή βαθμολογία').get_by_role('button', name='Όχι').click(); pg.wait_for_timeout(200)
        check(badge() == 1, 'low feedback → Όχι lowers badge')
        check(J('Cloud._blobBody().notifPrefs') == {'comment': 'alert', 'fb': 'off'}, 'prefs ride the cloud blob')
        em = pg.locator('#notif-panel .nt-set-email')
        check(em.count() == 1 and 'aria-pressed="true"' in em.inner_html().split('Όχι')[0], 'email row, default Ναι')
        em.get_by_role('button', name='Όχι').click(); pg.wait_for_timeout(150)
        check(J('Cloud._blobBody().notifPrefs.email') is False, 'email off → notifPrefs.email=false in blob')
        pg.locator('#notif-panel .nt-set-email').get_by_role('button', name='Ναι').click(); pg.wait_for_timeout(150)
        J("(()=>{var p=safeStorageGet('notifPrefs',{});delete p.email;safeStorageSet('notifPrefs',p);})()")

        print('5. Σίγαση')
        check('Δημήτρης Ρούσος' in pg.inner_text('#notif-panel .nt-chips'), 'muted client listed')
        pg.locator('#notif-panel .nt-chip button').click(); pg.wait_for_timeout(200)
        check(J('!!clients.find(c=>c.id==="c5").notifMuted') is False, 'unmute works')
        check(badge() == 2, f'unmuted → his question now counts (badge 2: {badge()})')
        pg.fill('#notif-mute-inp', 'Γιώργος Παππάς'); pg.press('#notif-mute-inp', 'Enter'); pg.wait_for_timeout(200)
        check(J('!!clients.find(c=>c.id==="c2").notifMuted') is True and badge() == 1, 'mute by name → his comment leaves the badge')
        if SHOTS: pg.screenshot(path=os.path.join(SHOTS, 'notif-settings.png'))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
        check(not pg.locator('#notif-panel').is_visible(), 'Esc closes the panel')

        if SHOTS:   # το καμπανάκι δεν πρέπει να καλύπτει κάτι πάνω δεξιά σε άλλες οθόνες
            J('swTab(0)'); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'v-home.png'))
            J('selectClient("c1")'); pg.wait_for_timeout(600); pg.screenshot(path=os.path.join(SHOTS, 'v-client.png'))
            J('swTab(10)'); pg.wait_for_timeout(600); pg.screenshot(path=os.path.join(SHOTS, 'v-progress.png'))
            J('swTab(9)'); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(SHOTS, 'v-messages.png'))

        print('6. Κινητό')
        pg.set_viewport_size({'width': 390, 'height': 844}); pg.wait_for_timeout(200)
        if SHOTS: pg.screenshot(path=os.path.join(SHOTS, 'notif-mobile-closed.png'))
        pg.click('#notif-bell'); pg.wait_for_timeout(300)
        bb = pg.locator('#notif-panel').bounding_box()
        check(bb and bb['x'] >= 0 and bb['x'] + bb['width'] <= 390, f'panel fits the phone width ({bb})')
        if SHOTS: pg.screenshot(path=os.path.join(SHOTS, 'notif-mobile.png'))
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
if errs: print('\nconsole errors:', *errs[:10], sep='\n  ')
print(f"\n{'PASS' if not fails and not errs else 'FAIL'} — {len(fails)} failed checks, {len(errs)} console errors")
sys.exit(1 if fails or errs else 0)
