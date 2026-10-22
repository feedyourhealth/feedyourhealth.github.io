"""Backup file holds EVERYTHING and restore brings ALL of it back (2026-10-22).

Before: backups had only clients/templates/tracking, and «Εισαγωγή backup» restored only clients
(+combos). Now _buildBackupObj also carries combos, tips, recipe tags, favourite meals, the
dietitian's own recipes and the clinic contact, and _applyBackupData restores all of it
(replace or merge) from the .json import, the backup folder and the snapshots.
Simulates "new computer": empty app -> import the file -> everything is back.
Uses the fake in-browser Supabase — never touches real data.
"""
import json, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8899
BASE = f'http://localhost:{PORT}/Dietologist.html'
U1 = 'user-111'
fails, errors = [], []

def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

def cl(i, name):
    return {'id': i, 'name': name, 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod', 'goal': 'maintain', 'allergenListsVer': 2}

BLOB = {'clients': [cl('c1', 'Alpha'), cl('c2', 'Beta')],
        'customTemplates': [{'id': 't1', 'name': 'Tmpl1', 'goal': 'maintain', 'days': []}],
        'trackingData': {'plans': [{'id': 'p1'}], 'recipes': {}, 'patterns': {}, 'lastUpdated': None},
        'recipeMeta': {'r_x': {'tags': ['breakfast']}},
        'savedCombos': [{'id': 'k1', 'name': 'Combo1', 'foods': []}],
        'tipsLibrary': [{'id': 'tip1', 'title': 'Tip1', 'body': 'b'}],
        'clinicContact': {'wa': '35799000000', 'tel': '22000000', 'email': 'clinic@example.com'},
        'updatedAt': '2026-10-01T00:00:00Z'}
FAVS = [{'key': 'fav1', 'name': 'Πρωινό', 'foods': [{'n': 'Αυγό', 'g': 50}]}]
RECIPES = [{'id': 'custom_1', 'dbId': 1, 'name': 'Κοτόσουπα', 'foods': [], 'kcal': 300, 'macro': {'p': 30, 'f': 5, 'c': 20}, 'tags': [], 'instructions': '', 'prepTimeMin': 30, 'source': 'custom'}]

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        c = br.new_context(bypass_csp=True, accept_downloads=True)
        c.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        c.route('**/*.supabase.co/**', lambda r: r.abort())
        page = c.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        S = {'rows': {U1: {'data': BLOB, 'version': 5}}}
        page.add_init_script('window.__SERVER=' + json.dumps(S) + ';window.__UID=' + json.dumps(U1) + ';'
            + 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();'
            + 'localStorage.setItem("favoriteMeals",' + json.dumps(json.dumps(FAVS)) + ');}')
        page.goto(BASE, wait_until='domcontentloaded')
        page.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=15000)
        page.wait_for_timeout(1200)
        page.evaluate('window.customRecipes=' + json.dumps(RECIPES) + ';null')

        print('1. Backup object carries everything')
        b = page.evaluate('JSON.parse(JSON.stringify(_buildBackupObj()))')
        check([x['name'] for x in b['clients']] == ['Alpha', 'Beta'], 'clients')
        check([x['id'] for x in b['customTemplates']] == ['t1'], 'templates')
        check(b['trackingData']['plans'] == [{'id': 'p1'}], 'tracking')
        check([x['id'] for x in b['savedCombos']] == ['k1'], 'combos')
        check([x['id'] for x in b['tipsLibrary']] == ['tip1'], 'tips')
        check(b['recipeMeta'] == {'r_x': {'tags': ['breakfast']}}, 'recipe tags')
        check([x['key'] for x in b['favoriteMeals']] == ['fav1'], 'favourite meals')
        check([x['name'] for x in b['customRecipes']] == ['Κοτόσουπα'], 'own recipes')
        check(b['clinicContact']['email'] == 'clinic@example.com', 'clinic contact')

        print('2. Manual .json export has the same content')
        with page.expect_download() as dl:
            page.evaluate('exportData()')
        exp = json.loads(Path(dl.value.path()).read_text(encoding='utf-8'))
        check(all(k in exp for k in ['clients', 'customTemplates', 'trackingData', 'savedCombos', 'tipsLibrary', 'recipeMeta', 'favoriteMeals', 'customRecipes', 'clinicContact']), 'export has every key')

        print('3. "New computer": empty app -> import the file -> everything back')
        page.evaluate('''(()=>{Cloud._wipeLocalCache(true);window.customRecipes=[];
          localStorage.removeItem("favoriteMeals");window.__recipeCalls=[];
          Cloud.saveCustomRecipe=function(r){__recipeCalls.push(r.name);return Promise.resolve({ok:true});};
          return null;})()''')
        check(page.evaluate('clients.length') == 0 and page.evaluate('getSavedCombos().length') == 0, 'app is empty before import')
        fpath = Path(dl.value.path())
        with page.expect_file_chooser() as fc:
            page.evaluate('importBackup()')
        fc.value.set_files(str(fpath))
        page.wait_for_function('clients.length===2', timeout=5000)
        page.wait_for_timeout(500)
        check(page.evaluate('clients.map(c=>c.name)') == ['Alpha', 'Beta'], 'clients restored')
        check(page.evaluate('customTemplates.map(t=>t.id)') == ['t1'], 'templates restored')
        check(page.evaluate('TRACKING_DATA.plans.length') == 1, 'tracking restored')
        check(page.evaluate('JSON.parse(localStorage.getItem("dietologist_tracking")).plans.length') == 1, 'tracking persisted locally')
        check(page.evaluate('getSavedCombos().map(x=>x.id)') == ['k1'], 'combos restored')
        check(page.evaluate('getTipsLibrary().map(x=>x.id)') == ['tip1'], 'tips restored')
        check(page.evaluate('getRecipeMeta()') == {'r_x': {'tags': ['breakfast']}}, 'recipe tags restored')
        check(page.evaluate('getFavoriteMeals().map(x=>x.key)') == ['fav1'], 'favourite meals restored')
        check(page.evaluate('localStorage.getItem("fyh-clinic-email")') == 'clinic@example.com', 'clinic contact restored')
        check(page.evaluate('__recipeCalls') == ['Κοτόσουπα'], 'missing own recipe re-uploaded once')
        page.wait_for_timeout(2500)
        cloud = page.evaluate('__SERVER.rows[__UID].data')
        check(len(cloud['clients']) == 2 and [x['id'] for x in cloud['savedCombos']] == ['k1'] and len(cloud['customTemplates']) == 1, 'restored data reaches the cloud')

        print('4. Merge only adds what is missing; never duplicates')
        page.evaluate('window.__recipeCalls=[];window.customRecipes=' + json.dumps(RECIPES) + ';null')
        page.evaluate('''(()=>{clients=[{id:"c3",name:"Gamma"},clients[0]];customTemplates=[{id:"t2",name:"T2"}];
          setSavedCombos([{id:"k2",name:"C2"}]);TRACKING_DATA={plans:[{id:"pX"}],recipes:{},patterns:{},lastUpdated:null};return null;})()''')
        r = page.evaluate('_applyBackupData(' + json.dumps(exp) + ',"merge")')
        check(sorted(page.evaluate('clients.map(c=>c.id)')) == ['c1', 'c2', 'c3'], 'clients merged without duplicate')
        check(page.evaluate('customTemplates.map(t=>t.id)') == ['t2', 't1'], 'templates merged')
        check(page.evaluate('getSavedCombos().map(x=>x.id)') == ['k2', 'k1'], 'combos merged')
        check(page.evaluate('TRACKING_DATA.plans[0].id') == 'pX', 'existing tracking kept on merge')
        check(page.evaluate('__recipeCalls') == [] and r['recipesPending'] == 0, 'recipe already there -> not re-uploaded')

        print('5. Old backup (no combos/tips keys) never wipes them')
        page.evaluate('_applyBackupData({clients:[{id:"c9",name:"Old"}],customTemplates:[]},"replace")')
        check(page.evaluate('clients.map(c=>c.id)') == ['c9'], 'old backup replaces clients')
        check(page.evaluate("getSavedCombos().length") == 2 and page.evaluate("getTipsLibrary().map(x=>x.id)") == ["tip1"], "combos/tips untouched")
        check(page.evaluate('getFavoriteMeals().length') == 1, 'favourites untouched')
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
if errs:
    print('Console/page errors:'); [print('  ' + e[:200]) for e in errs]
print('\nRESULT:', 'FAIL' if fails or errs else 'PASS', f'({len(fails)} failed checks, {len(errs)} errors)')
sys.exit(1 if fails or errs else 0)
