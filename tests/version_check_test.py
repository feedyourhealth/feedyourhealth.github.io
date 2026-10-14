"""#7 cache-busting: stamps up to date, stale page reloads itself once (no loop), recovery links and
long sessions get a banner instead of a forced reload."""
import io, json, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
PORT = 8889
BASE = f'http://localhost:{PORT}/Dietologist.html'
fails = []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

print('1. Stamps (?v= on every script/css + version.json) match the current files')
rc = subprocess.call([sys.executable, str(REPO / 'scripts' / 'stamp-version.py'), '--check'])
check(rc == 0, 'scripts/stamp-version.py --check')
build = json.loads((REPO / 'version.json').read_text(encoding='utf-8'))['build']

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()

        def page(remote_build=None):
            ctx = br.new_context()
            ctx.route('**/*.supabase.co/**', lambda r: r.abort())
            if remote_build:
                ctx.route('**/version.json*', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'build': remote_build})))
            pg = ctx.new_page()
            navs = []
            pg.on('framenavigated', lambda f: navs.append(f.url) if f == pg.main_frame else None)
            return ctx, pg, navs

        print('2. Up-to-date page: no reload, no banner')
        ctx, pg, navs = page()
        pg.goto(BASE); pg.wait_for_timeout(2000)
        check(pg.evaluate('document.querySelector("meta[name=fyh-build]").content') == build, 'page carries the build id')
        check(len(navs) == 1 and '?v=' not in pg.url, f'no reload ({navs})')
        check(pg.locator('#fyh-update-banner').count() == 0, 'no banner')
        ctx.close()

        print('3. Stale cached page (server says newer build): reloads ONCE to ?v=<new>, then banner, no loop')
        ctx, pg, navs = page('ffffffffffff')
        pg.goto(BASE); pg.wait_for_timeout(3500)
        check(pg.url.endswith('?v=ffffffffffff'), f'reloaded to fresh URL ({pg.url})')
        check(len(navs) == 2, f'exactly one automatic reload ({len(navs) - 1})')
        check(pg.locator('#fyh-update-banner').is_visible(), 'still mismatched → banner instead of another reload')
        ctx.close()

        print('4. Password-recovery link (#access_token): never auto-reloads, shows banner')
        ctx, pg, navs = page('ffffffffffff')
        pg.goto(BASE + '#access_token=x&type=recovery'); pg.wait_for_timeout(2500)
        check(len(navs) == 1 and 'v=' not in pg.url.split('#')[0], f'no reload on recovery link ({navs})')
        check(pg.locator('#fyh-update-banner').is_visible(), 'banner shown')
        ctx.close()

        print('5. Long session: new deploy appears later → banner, «Ανανέωση» goes to the fresh URL')
        ctx, pg, navs = page()
        pg.goto(BASE + '?debug=x'); pg.wait_for_timeout(1500)
        ctx.route('**/version.json*', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'build': 'abcabcabcabc'})))
        pg.evaluate('Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>"visible"})')
        pg.evaluate('''(()=>{var n=Date.now;Date.now=function(){return n()+11*60*1000;};document.dispatchEvent(new Event("visibilitychange"));})()''')
        pg.wait_for_timeout(1000)
        check(len(navs) == 1, 'no forced reload mid-session')
        check(pg.locator('#fyh-update-banner').is_visible(), 'banner shown after returning to the tab')
        pg.click('#fyh-update-banner button >> nth=0'); pg.wait_for_timeout(1500)
        check(pg.url.endswith('?debug=x&v=abcabcabcabc'), f'«Ανανέωση» → fresh URL keeping other params ({pg.url})')
        ctx.close()
        br.close()
finally:
    srv.terminate()
print('\nRESULT:', 'ALL PASSED' if not fails else f'{len(fails)} FAILED')
for f in fails: print(' -', f)
sys.exit(1 if fails else 0)
