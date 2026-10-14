"""Runs test/smoke.html (function/constant/probe checks) headless and fails if it reports SMOKE FAIL.
The baseline diff it prints is informational only (food/recipe fingerprints change with every new entry)."""
import io, subprocess, sys, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
REPO = Path(__file__).resolve().parent.parent
PORT = 8893

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--directory', str(REPO)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
ok = False
try:
    for _ in range(50):
        try: urllib.request.urlopen(f'http://localhost:{PORT}/', timeout=1); break
        except Exception: time.sleep(0.2)
    with sync_playwright() as p:
        br = p.chromium.launch(); pg = br.new_page()
        pg.goto(f'http://localhost:{PORT}/test/smoke.html')
        pg.wait_for_function("document.getElementById('summary').textContent.indexOf('SMOKE')!==-1", timeout=30000)
        summary = pg.inner_text('#summary')
        print(summary)
        if 'SMOKE PASS' not in summary:
            print('\n'.join(l for l in pg.inner_text('#report').splitlines() if 'FAIL' in l)[:4000])
        ok = 'SMOKE PASS' in summary
        br.close()
finally:
    srv.terminate()
print('\nRESULT:', 'ALL PASSED' if ok else 'FAILED')
sys.exit(0 if ok else 1)
