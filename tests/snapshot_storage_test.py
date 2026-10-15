"""Rolling snapshots live in IndexedDB, not localStorage (2026-10-15 quota fix).

Reproduces the real-world case: localStorage ~full (big legacy fyh_snapshots + fyh_clients +
dead keys) -> on open the legacy snapshots move to IndexedDB, dead keys are dropped, saving to
localStorage works again, new snapshots go to IndexedDB, restore still lists them, the quota
toast shows at most once, and switching account wipes the IndexedDB snapshots too.
Uses the fake in-browser Supabase — never touches real data.
"""
import json, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
FAKE = (Path(__file__).parent / 'fake_supabase.js').read_text(encoding='utf-8')
PORT = 8898
BASE = f'http://localhost:{PORT}/Dietologist.html'
U1 = 'user-111'
fails, errors = [], []

def cl(i, name, pad=0):
    c = {'id': i, 'name': name, 'sex': 'F', 'age': 30, 'weight': 65, 'height': 165, 'activity': 'mod', 'goal': 'maintain', 'allergenListsVer': 2}
    if pad: c['notes'] = 'x' * pad
    return c

def blob(clients):
    return {'clients': clients, 'customTemplates': [], 'savedCombos': [], 'tipsLibrary': [], 'clinicContact': {'wa': '', 'tel': '', 'email': ''}, 'updatedAt': '2026-10-01T00:00:00Z'}

def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

SNAPS_JS = 'new Promise(r=>_snapRead(s=>r(s.map(x=>({ts:x.ts,count:x.count,names:((x.data||{}).clients||[]).map(c=>c.name)})))))'

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch()
        c = br.new_context(bypass_csp=True)
        c.route('**/vendor/supabase-js.min.js*', lambda r: r.fulfill(status=200, content_type='application/javascript', body=FAKE))
        c.route('**/*.supabase.co/**', lambda r: r.abort())

        # Real-size data: ~1.6M chars of clients in the cloud + the same in a legacy snapshot,
        # plus dead keys — the browser's localStorage is (almost) full before the app even starts.
        big = [cl('c1', 'Alpha', 800_000), cl('c2', 'Beta', 800_000)]
        S = {'rows': {U1: {'data': blob(big), 'version': 5}}}
        old_snap = [{'ts': '2026-10-10T10:00:00.000Z', 'count': 2, 'sig': 'old1', 'data': {'clients': [cl('c1', 'OldAlpha', 1_200_000), cl('c2', 'OldBeta', 1_200_000)], 'customTemplates': []}},
                    {'ts': '2026-10-11T10:00:00.000Z', 'count': 1, 'sig': 'old2', 'data': {'clients': [cl('c1', 'OlderOnlyOne')], 'customTemplates': []}}]
        seed = {'fyh_snapshots': json.dumps(old_snap), 'fyh_leads': json.dumps(['y' * 170_000]),
                'cloud_someone_fyh_clients': json.dumps(['z' * 70_000]), 'cloud_someone_unrelated': 'keep',
                'fyh_cache_owner': U1, 'fyh_cache_base_version': '5'}

        page = c.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.add_init_script('window.__SERVER=' + json.dumps(S) + ';window.__UID=' + json.dumps(U1) + ';'
            + 'if(!sessionStorage.__seeded){sessionStorage.__seeded=1;localStorage.clear();'
            + ''.join(f'localStorage.setItem({json.dumps(k)},{json.dumps(v)});' for k, v in seed.items()) + '}'
            + 'window.__toasts=[];')
        page.goto(BASE, wait_until='domcontentloaded')
        page.wait_for_function('window.Cloud && Cloud._loaded===true', timeout=15000)
        page.wait_for_timeout(1500)

        print('1. Legacy snapshots move to IndexedDB, dead keys dropped')
        snaps = page.evaluate(SNAPS_JS)
        tss = [s['ts'] for s in snaps]
        check('2026-10-10T10:00:00.000Z' in tss and '2026-10-11T10:00:00.000Z' in tss, f'both legacy snapshots in IndexedDB {tss}')
        check(snaps[0]['names'] == ['OldAlpha', 'OldBeta'], 'legacy snapshot content intact')
        check(page.evaluate('localStorage.getItem("fyh_snapshots")') is None, 'legacy localStorage key removed')
        check(page.evaluate('localStorage.getItem("fyh_leads")') is None, 'fyh_leads removed')
        check(page.evaluate('localStorage.getItem("cloud_someone_fyh_clients")') is None, 'cloud_<user>_fyh_clients removed')
        check(page.evaluate('localStorage.getItem("cloud_someone_unrelated")') == 'keep', 'unrelated cloud_ key untouched')

        print('2. Saving to localStorage works; edits create snapshots in IndexedDB, max 5')
        page.evaluate('window.__toasts=[];window.showErrorToast=function(m){__toasts.push(String(m));};null')
        for i in range(6):
            page.evaluate(f'clients[0].name="Edit"+"!".repeat({i});saveNow();')
            page.wait_for_timeout(250)
        page.wait_for_timeout(800)
        cached = page.evaluate('JSON.parse(localStorage.getItem("fyh_clients")).map(c=>c.name)')
        check(cached[0] == 'Edit!!!!!', f'fyh_clients written to localStorage ({cached[0]})')
        snaps = page.evaluate(SNAPS_JS)
        check(len(snaps) == 5, f'snapshots capped at 5 ({len(snaps)})')
        check(snaps[-1]['names'][0] == 'Edit!!!!!', f'newest snapshot = latest edit ({snaps[-1]["names"]})')
        check(page.evaluate('localStorage.getItem("fyh_snapshots")') is None, 'nothing written back to localStorage snapshots')
        check(not any('γέμισε' in (t or '') for t in page.evaluate('__toasts')), 'no quota toast after the move')

        print('3. Snapshot captured synchronously (conflict path replaces clients right after)')
        page.evaluate('clients[0].name="BeforeSwap";_rollingSnapshot();clients[0].name="AfterSwap";')
        page.wait_for_timeout(600)
        check(page.evaluate(SNAPS_JS)[-1]['names'][0] == 'BeforeSwap', 'snapshot holds state at call time')

        print('4. Restore UIs read from IndexedDB')
        page.evaluate('restoreFromSnapshot()'); page.wait_for_timeout(500)
        n = page.evaluate('document.querySelectorAll("#snapshot-restore-overlay button[data-i]").length')
        check(n == 5, f'restore chooser lists 5 snapshots ({n})')
        page.evaluate('document.getElementById("snapshot-restore-overlay").remove()')
        page.evaluate('curId="c1";var c=getC();c.savedPlans=[];')
        page.evaluate('recoverSavedPlansFor("c1")'); page.wait_for_timeout(500)
        t = (page.evaluate('__toasts') or [''])[-1]
        check('5 τοπικά snapshots' in t, f'recover-plans scanned IndexedDB snapshots ({t[:60]!r})')

        print('5. Quota error toast shows once, not every autosave')
        page.evaluate('''(()=>{window.__toasts=[];window._quotaToastShown=false;_quotaToastShown=false;
          window.__realSet=Storage.prototype.setItem;
          Storage.prototype.setItem=function(k,v){ if(k==="fyh_clients"){var e=new Error("full");e.name="QuotaExceededError";throw e;} return __realSet.call(this,k,v); };
          for(var i=0;i<4;i++){ clients[1].name="Q"+i; _doSave(); }
          Storage.prototype.setItem=__realSet; return null;})()''')
        toasts = page.evaluate('__toasts')
        check(len([t for t in toasts if 'γέμισε' in t]) == 1 and len(toasts) == 1, f'one quota toast for 4 failing saves ({len(toasts)})')

        print('6. Account wipe clears IndexedDB snapshots too')
        page.evaluate('Cloud._wipeLocalCache(false)'); page.wait_for_timeout(600)
        check(page.evaluate(SNAPS_JS) == [], 'no snapshots left after wipe')
        br.close()
finally:
    srv.terminate()

errs = [e for e in errors if 'favicon' not in e and 'quota exceeded' not in e]
if errs:
    print('Console/page errors:'); [print('  ' + e[:200]) for e in errs]
print('\nRESULT:', 'FAIL' if fails or errs else 'PASS', f'({len(fails)} failed checks, {len(errs)} errors)')
sys.exit(1 if fails or errs else 0)
