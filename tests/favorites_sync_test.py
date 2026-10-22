"""Favourite meals ride the cloud blob (2026-10-22) — before, they lived only in localStorage.

1. Old cloud blob (no favoriteMeals key) + favourites on this PC -> kept, then uploaded.
2. Saving a favourite pushes it to the cloud.
3. "New computer": empty browser + cloud with favourites -> they come down.
Uses the fake in-browser Supabase — never touches real data.
"""
import json, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8896
BASE = f'http://localhost:{PORT}/Dietologist.html'
U1 = 'user-111'
fails, errors = [], []

def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

CL = {'id': 'c1', 'name': 'Alpha', 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod', 'goal': 'maintain', 'allergenListsVer': 2}
OLD_BLOB = {'clients': [CL], 'customTemplates': [], 'savedCombos': [], 'tipsLibrary': [], 'clinicContact': {'wa': '', 'tel': '', 'email': ''}, 'updatedAt': '2026-10-01T00:00:00Z'}
FAV1 = {'key': 'fav1', 'name': 'Breakfast', 'foods': [{'n': 'Egg', 'g': 50}]}
FAV2 = {'key': 'fav2', 'name': 'Lunch', 'foods': [{'n': 'Rice', 'g': 80}]}

def open_page(ctx, server, seed):
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.add_init_script('window.__SERVER=' + json.dumps(server) + ';window.__UID=' + json.dumps(U1) + ';'
        + 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();'
        + ''.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v)});' for k, v in seed.items()) + '}')
    page.goto(BASE, wait_until='domcontentloaded')
    page.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=15000)
    page.wait_for_timeout(1200)
    return page

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        def ctx():
            c = br.new_context(bypass_csp=True)
            c.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
            c.route('**/*.supabase.co/**', lambda r: r.abort())
            return c

        print('1. Old cloud blob without favourites: local ones kept, then uploaded')
        page = open_page(ctx(), {'rows': {U1: {'data': OLD_BLOB, 'version': 5}}},
                         {'favoriteMeals': json.dumps([FAV1]), 'fyh_cache_owner': U1, 'fyh_cache_base_version': '5'})
        check(page.evaluate('getFavoriteMeals().map(f=>f.key)') == ['fav1'], 'local favourite kept after load')
        page.evaluate('Cloud.save()'); page.wait_for_timeout(2500)
        cloud = page.evaluate('__SERVER.rows[__UID].data')
        check([f['key'] for f in cloud.get('favoriteMeals', [])] == ['fav1'], 'favourite uploaded to cloud')

        print('2. Saving a favourite pushes it')
        page.evaluate('saveFavoriteMeals(getFavoriteMeals().concat([' + json.dumps(FAV2) + ']))')
        page.wait_for_timeout(2500)
        cloud = page.evaluate('__SERVER.rows[__UID].data')
        check([f['key'] for f in cloud.get('favoriteMeals', [])] == ['fav1', 'fav2'], 'new favourite in cloud')
        server = page.evaluate('__SERVER')

        print('3. New computer: empty browser gets favourites from the cloud')
        page2 = open_page(ctx(), {'rows': server['rows']}, {})
        check(page2.evaluate('getFavoriteMeals().map(f=>f.key)') == ['fav1', 'fav2'], 'favourites downloaded')
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
if errs:
    print('Console/page errors:'); [print('  ' + e[:200]) for e in errs]
print('\nRESULT:', 'FAIL' if fails or errs else 'PASS', f'({len(fails)} failed checks, {len(errs)} errors)')
sys.exit(1 if fails or errs else 0)
