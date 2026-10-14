#!/usr/bin/env python3
"""Cache-busting stamp for Dietologist.html (GitHub Pages caches every file for 10 minutes).

- Every local <script src> / <link href> to js/, css/, vendor/ gets ?v=<hash of that file>,
  so a fresh Dietologist.html never pairs with an old cached script (unchanged files stay cached).
- <meta name="fyh-build" content="..."> + version.json carry one build id for the whole app;
  js/version-check.js compares them and reloads a stale cached page (or offers a reload in a long session).

Run after every change to Dietologist.html / js / css, before committing:
    python scripts/stamp-version.py           # rewrite stamps + version.json
    python scripts/stamp-version.py --check   # CI: fail if the stamps are out of date
Hashes ignore CRLF/LF, so Windows and Linux checkouts give the same result.
"""
import hashlib, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / 'Dietologist.html'
VERSION = ROOT / 'version.json'
REF = re.compile(r'((?:src|href)=")((?:js|css|vendor)/[^"?#]+\.(?:js|css))(?:\?v=[0-9a-f]*)?(")')
META = re.compile(r'<meta name="fyh-build" content="[0-9a-f]*">')


def h(data, n=10):
    return hashlib.sha1(data).hexdigest()[:n]


def norm(path):
    return path.read_bytes().replace(b'\r\n', b'\n')


def stamped(html):
    missing = []

    def sub(m):
        f = ROOT / m.group(2)
        if not f.is_file():
            missing.append(m.group(2))
            return m.group(0)
        return m.group(1) + m.group(2) + '?v=' + h(norm(f)) + m.group(3)

    out = REF.sub(sub, html)
    # Build id = everything the page loads + the page itself (with its own build id blanked).
    build = h(META.sub('<meta name="fyh-build" content="">', out).replace('\r\n', '\n').encode('utf-8'), 12)
    out = META.sub('<meta name="fyh-build" content="' + build + '">', out)
    return out, build, missing


def main():
    check = '--check' in sys.argv
    raw = HTML.read_bytes().decode('utf-8')
    if not META.search(raw):
        print('FAIL: <meta name="fyh-build" content=""> missing from Dietologist.html')
        return 1
    out, build, missing = stamped(raw)
    if missing:
        print('FAIL: referenced files not found: ' + ', '.join(missing))
        return 1
    want_version = json.dumps({'build': build}) + '\n'
    have_version = VERSION.read_text(encoding='utf-8') if VERSION.is_file() else ''
    if check:
        ok = out == raw and have_version.replace('\r\n', '\n') == want_version
        print(('OK: stamps up to date, build ' if ok else
               'FAIL: stamps out of date — run: python scripts/stamp-version.py  (build ') + build + ('' if ok else ')'))
        return 0 if ok else 1
    if out != raw:
        HTML.write_bytes(out.encode('utf-8'))
    VERSION.write_text(want_version, encoding='utf-8', newline='\n')
    print('stamped build ' + build + ' (' + str(len(REF.findall(out))) + ' files)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
