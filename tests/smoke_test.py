#!/usr/bin/env python3
"""
Smoke test for the Dietologist app.

Serves the repo as a static site, loads Dietologist.html, bypasses the
Supabase login gate (fake in-memory client, isolated to this browser
instance — never touches real Supabase data), and drives the core flows:
add client -> generate plan -> delete client (via the real confirm dialog).

Fails (non-zero exit) on any browser console error/pageerror, or if any
step doesn't produce the expected result. Run with: python tests/smoke_test.py
"""
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

REPO_ROOT = Path(__file__).resolve().parent.parent
PORT = 8899
BASE_URL = f"http://localhost:{PORT}"

# Synthetic test fixture — not a real client, invented values only.
TEST_CLIENT_FIELDS = {"sex": "F", "age": 30, "weight": 65, "height": 165, "activity": "mod", "goal": "maintain"}


def wait_for_server(url, timeout=10):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=1)
            return True
        except Exception:
            time.sleep(0.2)
    return False


def main():
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT), "--directory", str(REPO_ROOT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    failures = []
    console_errors = []
    try:
        if not wait_for_server(BASE_URL):
            print("FAIL: static server never came up")
            return 1

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda exc: console_errors.append(str(exc)))

            page.goto(f"{BASE_URL}/Dietologist.html", wait_until="networkidle")

            # Bypass the Supabase login gate for this isolated browser instance only.
            page.evaluate("""() => {
                window.clients = [];
                document.getElementById('login-page').style.display = 'none';
                document.getElementById('app-container').style.display = '';
                if (typeof renderMain === 'function') renderMain();
            }""")

            # --- Add client ---
            client_id = page.evaluate("""() => {
                addClient('SmokeTest');
                return clients[clients.length - 1].id;
            }""")
            if not client_id:
                failures.append("addClient() did not create a client")

            page.evaluate(
                """(args) => {
                    var c = clients.find(function(c){ return c.id === args.id; });
                    Object.assign(c, args.fields);
                }""",
                {"id": client_id, "fields": TEST_CLIENT_FIELDS},
            )

            # --- Generate plan ---
            page.evaluate("genPlan()")
            plan_day0_len = page.evaluate(
                """(id) => {
                    var c = clients.find(function(c){ return c.id === id; });
                    return (c.weekPlan && c.weekPlan[0]) ? c.weekPlan[0].length : 0;
                }""",
                client_id,
            )
            if not plan_day0_len:
                failures.append("genPlan() did not populate weekPlan[0]")

            # --- Delete client via the REAL confirm-dialog flow (real click, not a direct call) ---
            page.evaluate("(id) => deleteClient(id)", client_id)
            try:
                page.wait_for_selector("#confirmDialog[data-open='true']", timeout=3000)
                page.click("#confirmBtn")
                page.wait_for_function(
                    """(id) => {
                        var c = clients.find(function(c){ return c.id === id; });
                        return c && c.deleted === true;
                    }""",
                    arg=client_id,
                    timeout=3000,
                )
            except PlaywrightTimeoutError:
                failures.append("deleteClient() confirm-dialog flow did not mark the client deleted in time")

            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=5)

    if console_errors:
        failures.append(f"{len(console_errors)} browser console error(s): " + " | ".join(console_errors[:5]))

    if failures:
        print("SMOKE TEST FAILED:")
        for f in failures:
            print(f" - {f}")
        return 1

    print("SMOKE TEST PASSED: add client -> generate plan -> delete client, no console errors.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
