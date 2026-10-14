"""Cloud-sync scenarios against a fake in-browser Supabase (never touches the real project)."""
import json, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8897
BASE = f'http://localhost:{PORT}/Dietologist.html'
U1, U2 = 'user-111', 'user-222'
fails, errors = [], []

def cl(i, name):
    return {'id': i, 'name': name, 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod', 'goal': 'maintain', 'allergenListsVer': 2}

def blob(clients):
    return {'clients': clients, 'customTemplates': [], 'savedCombos': [], 'tipsLibrary': [], 'clinicContact': {'wa': '', 'tel': '', 'email': ''}, 'updatedAt': '2026-10-01T00:00:00Z'}

def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

def open_page(ctx, server, uid, seed=None):
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' and '[CLOUD] load' not in m.text else None)
    js = 'window.__SERVER=' + json.dumps(server) + ';window.__UID=' + json.dumps(uid) + ';'
    if seed is not None:
        js += 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();' + ''.join(
            f'localStorage.setItem({json.dumps(k)},{json.dumps(v)});' for k, v in seed.items()) + '}'
    page.add_init_script(js)
    page.goto(BASE, wait_until='domcontentloaded')
    return page

def wait_loaded(page, t=8000):
    page.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=t)
    page.wait_for_timeout(300)

def names(page):
    return page.evaluate('clients.filter(c=>!c.deleted).map(c=>c.name).sort()')

def server(page):
    return page.evaluate('window.__SERVER')

def ls(page):
    return page.evaluate('({owner:localStorage.getItem("fyh_cache_owner"),base:localStorage.getItem("fyh_cache_base_version"),dirty:localStorage.getItem("fyh_local_dirty"),cache:JSON.parse(localStorage.getItem("fyh_clients")||"[]").map(c=>c.name).sort()})')

def dump_ls(page):
    return page.evaluate('(()=>{var o={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k==="fyh_active_tab_lock")continue;o[k]=localStorage.getItem(k);}return o;})()')

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

        print('A. Fresh device, cloud v5 — load, no-change autosaves must not upload, one edit uploads once')
        S = {'rows': {U1: {'data': blob([cl('c1', 'Alpha'), cl('c2', 'Beta')]), 'version': 5}}}
        cA = ctx(); pg = open_page(cA, S, U1, seed={}); wait_loaded(pg)
        check(names(pg) == ['Alpha', 'Beta'], 'shows cloud clients')
        st = ls(pg); check(st['owner'] == U1 and st['base'] == '5' and st['dirty'] is None, f'owner/base/dirty set after load {st}')
        pg.evaluate('_doSave();_doSave();Cloud.save();'); pg.wait_for_timeout(2500)
        check((server(pg).get('writes') or 0) == 0, f"no upload without changes (writes={server(pg).get('writes')})")
        pg.evaluate('clients[0].name="Alpha2";saveNow();'); pg.wait_for_timeout(300)
        check(ls(pg)['dirty'] == '1', 'dirty flag set right after edit')
        pg.wait_for_timeout(2500)
        s = server(pg); check(s.get('writes') == 1 and s['rows'][U1]['version'] == 6, f"exactly one upload, v6 (writes={s.get('writes')}, v={s['rows'][U1]['version']})")
        check(ls(pg)['dirty'] is None and ls(pg)['base'] == '6', 'dirty cleared, base=6 after upload')
        pg.evaluate('_doSave();'); pg.wait_for_timeout(2200)
        check(server(pg).get('writes') == 1, 'autosave after upload: still one write')
        devA_ls = dump_ls(pg); S = server(pg); cA.close()

        print('B. Device 2 with stale CLEAN cache (base 6); cloud moved to v7 elsewhere -> cloud wins, nothing uploaded')
        S['rows'][U1]['data']['clients'].append(cl('c3', 'Gamma')); S['rows'][U1]['version'] = 7; S['writes'] = 0
        cB = ctx(); pg = open_page(cB, S, U1, seed=devA_ls); wait_loaded(pg); pg.wait_for_timeout(2000)
        check(names(pg) == ['Alpha2', 'Beta', 'Gamma'], f'shows newer cloud data {names(pg)}')
        check((server(pg).get('writes') or 0) == 0, 'stale cache NOT uploaded over newer cloud')
        check(ls(pg)['base'] == '7', 'base updated to 7'); cB.close()

        print('C. Stale DIRTY cache (base 6, local edit) vs cloud v7 -> conflict dialog, cloud shown, nothing uploaded')
        seed = dict(devA_ls); loc = json.loads(seed['fyh_clients']); loc[1]['name'] = 'BetaLocal'
        seed['fyh_clients'] = json.dumps(loc); seed['fyh_local_dirty'] = '1'
        cC = ctx(); pg = open_page(cC, S, U1, seed=seed); wait_loaded(pg)
        pg.wait_for_selector("#confirmDialog[data-open='true']", timeout=4000)
        check('Δύο εκδοχές' in pg.inner_text('#confirmTitle'), 'conflict dialog shown')
        check(names(pg) == ['Alpha2', 'Beta', 'Gamma'], 'cloud data shown by default')
        check((server(pg).get('writes') or 0) == 0, 'nothing uploaded before a choice')
        pg.click('#confirmSecondaryBtn'); pg.wait_for_timeout(2800)
        s = server(pg)
        check(sorted(c['name'] for c in s['rows'][U1]['data']['clients']) == ['Alpha2', 'BetaLocal'] and s['rows'][U1]['version'] == 8,
              f"'keep this PC' uploads local copy as v8 ({s['rows'][U1]['version']})")
        S = s; cC.close()

        print('C2. Same conflict, choose "keep cloud" -> cloud untouched')
        seed2 = dict(devA_ls); seed2['fyh_local_dirty'] = '1'; S['writes'] = 0
        cC2 = ctx(); pg = open_page(cC2, S, U1, seed=seed2); wait_loaded(pg)
        pg.wait_for_selector("#confirmDialog[data-open='true']", timeout=4000); pg.click('#confirmBtn'); pg.wait_for_timeout(2500)
        check((server(pg).get('writes') or 0) == 0 and server(pg)['rows'][U1]['version'] == 8, 'keep cloud: no upload')
        check(ls(pg)['dirty'] is None, 'dirty cleared after choosing cloud'); cC2.close()

        print('D. Dirty cache on the CURRENT version -> uploaded silently, no dialog')
        cD0 = ctx(); pg = open_page(cD0, S, U1, seed={}); wait_loaded(pg); cur_ls = dump_ls(pg); cD0.close()
        loc = json.loads(cur_ls['fyh_clients']); loc[0]['name'] = 'AlphaOffline'
        cur_ls['fyh_clients'] = json.dumps(loc); cur_ls['fyh_local_dirty'] = '1'; S['writes'] = 0
        cD = ctx(); pg = open_page(cD, S, U1, seed=cur_ls); wait_loaded(pg); pg.wait_for_timeout(1500)
        s = server(pg)
        check(s.get('writes') == 1 and any(c['name'] == 'AlphaOffline' for c in s['rows'][U1]['data']['clients']), 'unpushed local edit uploaded')
        check(pg.get_attribute('#confirmDialog', 'data-open') != 'true', 'no conflict dialog')
        S = s; u1_ls = dump_ls(pg); cD.close()

        print('E. Same browser, log in as ANOTHER account (U2 has its own data) -> U1 clients never shown/uploaded')
        S['rows'][U2] = {'data': blob([cl('z1', 'Zeta')]), 'version': 3}; S['writes'] = 0
        cE = ctx(); pg = open_page(cE, S, U2, seed=u1_ls); wait_loaded(pg); pg.wait_for_timeout(2000)
        check(names(pg) == ['Zeta'], f'U2 sees only its own clients {names(pg)}')
        s = server(pg); check((s.get('writes') or 0) == 0 and s['rows'][U2]['version'] == 3, 'U2 cloud untouched')
        check(ls(pg)['owner'] == U2 and ls(pg)['cache'] == ['Zeta'], 'local cache now belongs to U2'); cE.close()

        print('E2. Another account with NO cloud row yet -> starts empty, U1 data not inserted')
        S.pop('writes', None); U3 = 'user-333'
        cE2 = ctx(); pg = open_page(cE2, S, U3, seed=u1_ls); wait_loaded(pg); pg.wait_for_timeout(2000)
        s = server(pg)
        check(names(pg) == [] and U3 not in s['rows'], f'U3 empty, nothing inserted ({names(pg)})')
        pg.evaluate('addClient("NewForU3");'); pg.wait_for_timeout(2500)
        s = server(pg)
        check(U3 in s['rows'] and [c['name'] for c in s['rows'][U3]['data']['clients']] == ['NewForU3'], 'U3 first client inserted (insert, not upsert)')
        check(not s.get('upserts'), 'no blind upsert ever used'); S = s; cE2.close()

        print('F. Legacy cache (no owner key) + account whose cloud row has EMPTY clients -> stays empty, no upload')
        legacy = {k: v for k, v in u1_ls.items() if k not in ('fyh_cache_owner', 'fyh_cache_base_version', 'fyh_local_dirty')}
        S['rows'][U2] = {'data': blob([]), 'version': 4}; S['writes'] = 0
        cF = ctx(); pg = open_page(cF, S, U2, seed=legacy); wait_loaded(pg); pg.wait_for_timeout(2000)
        check(names(pg) == [] and (server(pg).get('writes') or 0) == 0, f'legacy cache not pushed into other account ({names(pg)})')
        check(pg.evaluate('!!localStorage.getItem("fyh_snapshots")') == ('fyh_snapshots' in legacy), 'legacy snapshots kept'); cF.close()

        print('F2. Legacy cache, SAME account with data -> cloud wins quietly (upgrade path)')
        S['writes'] = 0
        cF2 = ctx(); pg = open_page(cF2, S, U1, seed=legacy); wait_loaded(pg); pg.wait_for_timeout(1500)
        cloud_names = sorted(c['name'] for c in S['rows'][U1]['data']['clients'])
        check(names(pg) == cloud_names and (server(pg).get('writes') or 0) == 0, 'upgrade: cloud data, no upload')
        check(ls(pg)['owner'] == U1, 'owner recorded after upgrade'); cF2.close()

        print('G. Cloud read FAILS at open -> no upload while failing, banner, auto-retry then upload the edit')
        S['failLoads'] = 1; S['writes'] = 0
        cG = ctx(); pg = open_page(cG, S, U1, seed=u1_ls)
        pg.wait_for_selector('#cloud-load-error', state='visible', timeout=6000)
        check(pg.evaluate('Cloud._loaded') is False, 'not marked loaded after failure')
        pg.evaluate('clients[0].name="EditedWhileOffline";saveNow();'); pg.wait_for_timeout(2000)
        check((server(pg).get('writes') or 0) == 0, 'nothing uploaded while cloud unreadable')
        wait_loaded(pg, t=12000); pg.wait_for_timeout(2500)
        s = server(pg)
        check(s.get('writes') == 1 and any(c['name'] == 'EditedWhileOffline' for c in s['rows'][U1]['data']['clients']), 'after retry, the edit uploaded on top of current version')
        check(not pg.is_visible('#cloud-load-error'), 'banner hidden after recovery'); cG.close()
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e]
if errs: fails.append('console errors: ' + ' | '.join(errs[:6]))
print('\nRESULT:', 'ALL PASSED' if not fails else f'{len(fails)} FAILED')
for f in fails: print(' -', f)
sys.exit(1 if fails else 0)
