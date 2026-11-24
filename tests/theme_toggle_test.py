"""🌓 Εμφάνιση Αυτόματο → Φωτεινό → Σκοτεινό στα links (2026-11-24).

1. plan.html (πραγματικό snapshot, fake Supabase): κουμπί στην κεφαλίδα, κύκλος 3 καταστάσεων,
   χρώματα αλλάζουν και με συσκευή σε φωτεινό και σε σκοτεινό, μήνυμα στη γλώσσα του link (el/en).
2. Η επιλογή μένει μετά από reload και ισχύει σε άλλο link (κοινό κλειδί 'fyh-theme').
3. Οι μικρές σελίδες (κουζίνα, ημερολόγιο, στόχοι, μετρήσεις, ερωτηματολόγιο, γυμναστής): κουμπί στην
   κεφαλίδα και ο ίδιος κύκλος, ακόμη και χωρίς δεδομένα.
4. Επιπλέον σκοτεινοί κανόνες (π.χ. .mx-tag, .tf.warn) ακολουθούν το κουμπί, όχι μόνο τη συσκευή.
Uses the fake in-browser Supabase — never touches real data.
"""
import json, subprocess, sys, time, urllib.request, io
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8897
BASE = f'http://localhost:{PORT}/Dietologist.html'
U1 = 'user-111'
SHOTS = Path(sys.argv[1]) if len(sys.argv) > 1 else None
fails, errors = [], []
LIGHT_BG, DARK_BG = 'rgb(244, 248, 246)', 'rgb(13, 22, 20)'

def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

DAY = [
    {'name': 'Πρωινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 60}]},
    {'name': 'Μεσημεριανό', 'foods': [{'n': 'Κοτόπουλο στήθος (ψητό)', 'g': 150}, {'n': 'Ρύζι λευκό (βρ.)', 'g': 150}]},
    {'name': 'Βραδινό', 'foods': [{'n': 'Αυγά', 'g': 100}, {'n': 'Ψωμί ολικής', 'g': 40}]},
]
WEEK = {str(i): DAY for i in range(7)}
def client(cid, tok, lang='el'):
    return {'id': cid, 'name': 'Μαρία ' + cid, 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod',
            'goal': 'maintain', 'allergenListsVer': 2, 'shareToken': tok, 'weekPlan': WEEK, 'lang': lang}
BLOB = {'clients': [client('c1', 'tokA'), client('c2', 'tokB', 'en')],
        'customTemplates': [], 'savedCombos': [], 'tipsLibrary': [],
        'clinicContact': {'wa': '', 'tel': '', 'email': ''}, 'updatedAt': '2026-10-01T00:00:00Z'}
SERVER = {'rows': {U1: {'data': BLOB, 'version': 5}}, 'shared': {}, 'tables': {}}

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctx = br.new_context(bypass_csp=True)
        ctx.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        ctx.route('**/*.supabase.co/**', lambda r: r.abort())
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.add_init_script('window.__SERVER=' + json.dumps(SERVER) + ';window.__UID=' + json.dumps(U1) + ';'
            + 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();'
            + "localStorage.setItem('fyh_cache_owner'," + json.dumps(U1) + ");localStorage.setItem('fyh_cache_base_version','5');}")
        pg.goto(BASE, wait_until='domcontentloaded')
        pg.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=15000)
        pg.wait_for_timeout(800)
        for cid in ('c1', 'c2'):
            pg.evaluate('Cloud.publishPlan(clients.find(x=>x.id===%s))' % json.dumps(cid))
        pg.wait_for_timeout(300)
        shared = pg.evaluate('window.__SERVER.shared')

        def page(scheme, path):
            cx = br.new_context(bypass_csp=True, color_scheme=scheme, viewport={'width': 390, 'height': 760})
            cx.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
            cx.route('**/*.supabase.co/**', lambda r: r.abort())
            cp = cx.new_page()
            cp.on('pageerror', lambda e: errors.append(path + ': ' + str(e)))
            cp.add_init_script('window.__SERVER=' + json.dumps({'shared': shared}) + ';'
                + ''.join(f"localStorage.setItem('fyh_portal_{t}_onboardingSeen','1');localStorage.setItem('fyh_portal_{t}_goalHeroSeen','1');" for t in ('tokA', 'tokB')))
            cp.goto(f'http://localhost:{PORT}/{path}', wait_until='domcontentloaded')
            return cx, cp
        bg = lambda cp: cp.evaluate('getComputedStyle(document.body).backgroundColor')
        theme = lambda cp: cp.evaluate("document.documentElement.getAttribute('data-theme')||'auto'")

        for scheme, auto_bg in (('light', LIGHT_BG), ('dark', DARK_BG)):
            print(f'1. plan.html · συσκευή {scheme}')
            cx, cp = page(scheme, 'plan.html?t=tokA')
            cp.wait_for_selector('.hdr .thm-btn', timeout=8000)
            btn = cp.locator('.hdr .thm-btn')
            check(btn.count() == 1, 'one theme button in the header')
            check(theme(cp) == 'auto' and bg(cp) == auto_bg, f'starts Αυτόματο = device ({bg(cp)})')
            check('Αυτόματο' in (btn.get_attribute('aria-label') or ''), 'label says Αυτόματο')
            if SHOTS and scheme == 'light': cp.screenshot(path=str(SHOTS / 'plan-auto-light.png'))
            seq = []
            for _ in range(3):
                cp.locator('.hdr .thm-btn').click(); cp.wait_for_timeout(150)
                seq.append((theme(cp), bg(cp), cp.inner_text('#thm-toast')))
                if SHOTS and scheme == 'light' and seq[-1][0] == 'dark': cp.screenshot(path=str(SHOTS / 'plan-dark-forced.png'))
            check([s[0] for s in seq] == ['light', 'dark', 'auto'], f'cycle light → dark → auto ({[s[0] for s in seq]})')
            check(seq[0][1] == LIGHT_BG and seq[1][1] == DARK_BG and seq[2][1] == auto_bg, f'colors follow ({[s[1] for s in seq]})')
            check(seq[1][2] == 'Εμφάνιση: Σκοτεινό', f'toast in Greek ({seq[1][2]!r})')
            check(cp.evaluate("localStorage.getItem('fyh-theme')") is None, 'Αυτόματο clears the stored choice')
            # .mx-tag σκοτεινός κανόνας ακολουθεί το κουμπί
            cp.locator('.hdr .thm-btn').click(); cp.locator('.hdr .thm-btn').click()  # → dark
            tag = cp.evaluate("(()=>{const x=document.createElement('span');x.className='mx-tag';document.body.appendChild(x);return getComputedStyle(x).backgroundColor})()")
            check(tag == 'rgb(27, 42, 61)', f'.mx-tag dark override applies when forced dark ({tag})')
            cp.locator('.hdr .thm-btn').click()  # → auto
            cx.close()

        print('2. Μένει μετά από reload και σε άλλο link · αγγλικό link')
        cx, cp = page('light', 'plan.html?t=tokB')
        cp.wait_for_selector('.hdr .thm-btn', timeout=8000)
        cp.locator('.hdr .thm-btn').click(); cp.locator('.hdr .thm-btn').click(); cp.wait_for_timeout(150)
        check(cp.inner_text('#thm-toast') == 'Appearance: Dark', f"toast in English ({cp.inner_text('#thm-toast')!r})")
        cp.reload(wait_until='domcontentloaded'); cp.wait_for_selector('.hdr .thm-btn', timeout=8000)
        check(theme(cp) == 'dark' and bg(cp) == DARK_BG, 'still dark after reload (no flash: set in <head>)')
        check('Dark' in (cp.locator('.hdr .thm-btn').get_attribute('aria-label') or ''), 'button shows the dark state')
        cp.goto(f'http://localhost:{PORT}/kouzina.html', wait_until='domcontentloaded')
        check(theme(cp) == 'dark', 'same choice on another link (kouzina)')
        cx.close()

        print('3. Μικρές σελίδες')
        for pg_name in ('kouzina', 'imerologio', 'stoxoi', 'metriseis', 'intake', 'gymnastis'):
            cx, cp = page('light', pg_name + '.html')
            cp.wait_for_timeout(300)
            b = cp.locator('header .thm-btn')
            ok = b.count() == 1 and b.is_visible()
            box = b.bounding_box() if ok else None
            right = box and box['x'] + box['width'] > 300
            b.click() if ok else None; b.click() if ok else None
            check(ok and right and theme(cp) == 'dark' and bg(cp) != LIGHT_BG, f'{pg_name}: button top-right, forces dark ({theme(cp)}, {bg(cp)})')
            if pg_name == 'gymnastis':
                w = cp.evaluate("(()=>{const x=document.createElement('div');x.className='tf warn';document.body.appendChild(x);return getComputedStyle(x).backgroundColor})()")
                check(w == 'rgb(58, 44, 20)', f'gymnastis .tf.warn dark override follows button ({w})')
            if SHOTS and pg_name == 'kouzina': cp.screenshot(path=str(SHOTS / 'kouzina-dark-forced.png'))
            cx.close()
        br.close()
finally:
    srv.terminate()

check(not errors, 'no page errors' + (': ' + '; '.join(errors[:5]) if errors else ''))
print('\nRESULT:', 'ALL PASSED' if not fails else f'{len(fails)} FAILED')
sys.exit(1 if fails else 0)
