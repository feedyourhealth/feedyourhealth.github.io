#!/usr/bin/env python3
"""Runs every test in tests/ one after another and fails if any of them fails.

  smoke_test.py       app opens, add client -> genPlan -> delete, no console errors
  smoke_html_test.py  test/smoke.html: core functions/constants/calc probes exist and run
  sync_test.py        cloud sync: stale/dirty cache, conflicts, other account, failed load
  snapshot_storage_test.py  snapshots in IndexedDB (not localStorage), legacy move, quota toast once
  allergen_test.py    allergen quick-exclude migration + genPlan never serves a group food
  allergy_ui_test.py  ⚠️ Αλλεργίες section: intake apply, genPlan/insert/publish guards
  repro_test.py       pregnancy / lactation kcal, safety flags, form ticks, genPlan gate
  clinical_test.py    diabetes avoid-list, protocol fiber target + swaps, RED-S gate / home card
  household_test.py   🏠 household link/leave, «Εφαρμογή σε…» scaling + allergies, kitchen link + kouzina.html
  food_diary_test.py  📒 food diary: send → client writes (imerologio.html) → comment → read-only after 4 weeks
  waiting_test.py     ⏳ «Σε αναμονή»: modal, home card, banner, list filter, reminder el/en, close on publish
  version_check_test.py  ?v= stamps up to date + stale page reloads once / banner (scripts/stamp-version.py)

All of them use a fake in-browser Supabase — they never touch real data.
Run locally with: python tests/run_all.py   (or one file: python tests/sync_test.py)
"""
import subprocess, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
TESTS = ['version_check_test.py', 'smoke_test.py', 'smoke_html_test.py', 'sync_test.py', 'snapshot_storage_test.py', 'allergen_test.py', 'allergy_ui_test.py', 'repro_test.py', 'clinical_test.py', 'household_test.py', 'food_diary_test.py', 'waiting_test.py']

failed = []
for name in TESTS:
    print(f'\n===== {name} =====', flush=True)
    t0 = time.time()
    rc = subprocess.call([sys.executable, str(HERE / name)])
    print(f'----- {name}: {"PASS" if rc == 0 else "FAIL"} ({time.time() - t0:.0f}s)', flush=True)
    if rc != 0:
        failed.append(name)

print('\n===== SUMMARY =====')
for name in TESTS:
    print(('  FAIL ' if name in failed else '  ok   ') + name)
sys.exit(1 if failed else 0)
