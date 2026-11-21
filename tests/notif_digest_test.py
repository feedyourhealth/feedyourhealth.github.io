"""📧 Βραδινή σύνοψη (scripts/notif_digest.py) — χωρίς δίκτυο, χωρίς αποστολή.

1. Ώρα Κύπρου: θερινή/χειμερινή + μόνο ένα από τα δύο cron slots στέλνει.
2. build_digest: ίδια «Χρειάζονται εσένα» με το πάνελ (❓, χαμηλό feedback, ερωτηματολόγιο· σίγαση/σχόλια στη σύνοψη),
   seen/replied flags σεβαστά, σύνοψη ημέρας (check-ins, προπόνηση, βάρος −0,6, σερί 14, σταμάτησαν).
3. notifPrefs: σχόλιο → alert, feedback → off.
4. main(): notifPrefs.email=false → δεν στέλνει.
"""
import datetime as dt, io, os, sys
from pathlib import Path
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'scripts'))
import notif_digest as nd

fails = []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: fails.append(msg)

U = lambda s: dt.datetime.fromisoformat(s).replace(tzinfo=dt.timezone.utc)

print('1. Ώρα')
check(nd.cyprus_offset_hours(U('2026-11-21T19:00')) == 2, 'November = UTC+2')
check(nd.cyprus_offset_hours(U('2026-07-01T18:00')) == 3, 'July = UTC+3')
check(nd.cyprus_offset_hours(U('2026-03-29T00:59')) == 2 and nd.cyprus_offset_hours(U('2026-03-29T01:00')) == 3, 'DST starts last Sunday of March 01:00 UTC')
check(nd.cyprus_offset_hours(U('2026-10-25T00:59')) == 3 and nd.cyprus_offset_hours(U('2026-10-25T01:00')) == 2, 'DST ends last Sunday of October')
check(nd.slot_is_due('19', U('2026-11-21T19:07')) and not nd.slot_is_due('18', U('2026-11-21T18:20')), 'winter: only the 19 UTC slot sends')
check(nd.slot_is_due('18', U('2026-07-01T18:12')) and not nd.slot_is_due('19', U('2026-07-01T19:05')), 'summer: only the 18 UTC slot sends')
check(nd.slot_is_due('', U('2026-07-01T09:00')), 'manual run sends any time')

print('2. build_digest')
NOW = U('2026-11-21T19:05')        # 21:05 Κύπρου
today = dt.date(2026, 11, 21)
def dk(n): return (today - dt.timedelta(days=n)).isoformat()
def cl(cid, name, tok, **kw):
    c = {'id': cid, 'name': name, 'shareToken': tok, 'weekPlan': {'0': []}}; c.update(kw); return c
good = lambda tok, n: {'token': tok, 'date': dk(n), 'meals_done': 3, 'meals_total': 3, 'water_glasses': 8, 'water_goal': 8, 'supps_done': 0, 'supps_total': 0}
DATA = {'clients': [cl('c1', 'Μαρία Κωνσταντίνου', 'tokA'), cl('c2', 'Γιώργος Παππάς', 'tokB'),
                    cl('c3', 'Ελένη Σάββα', None, intakeToken='itk'), cl('c4', 'Νίκος Αντωνίου', 'tokD'),
                    cl('c5', 'Δημήτρης Ρούσος', 'tokE', notifMuted=True),
                    cl('c6', 'Σοφία Λοΐζου', 'tokF', noteSeen={dk(0): True}),
                    cl('c7', 'Κώστας Ξ', 'tokG'), cl('c8', 'Παλιός', 'tokH', deleted=True)]}
T = {'checkins': [good('tokD', n) for n in range(14)] + [good('tokA', 0), good('tokB', 1), good('tokG', 5)],
     'client_logs': [{'token': 'tokA', 'date': dk(0), 'weight_kg': 69.6, 'note': '❓ Την Τρίτη έχω γάμο;'},
                     {'token': 'tokA', 'date': dk(3), 'weight_kg': 70.2, 'note': ''},
                     {'token': 'tokB', 'date': dk(1), 'weight_kg': None, 'note': '[tag:party] Όλα καλά σήμερα'},
                     {'token': 'tokE', 'date': dk(0), 'weight_kg': None, 'note': '❓ Πίτσα;'},
                     {'token': 'tokF', 'date': dk(0), 'weight_kg': None, 'note': '❓ ήδη το είδα'},
                     {'token': 'tokH', 'date': dk(0), 'weight_kg': None, 'note': '❓ διαγραμμένος'}],
     'plan_feedback': [{'token': 'tokB', 'week_start': dk(5), 'breakfast': 2, 'continue_likelihood': 8, 'low_rating_reasons': {'breakfast': ['Πεινάω']}},
                       {'token': 'tokA', 'week_start': dk(5), 'breakfast': 5, 'continue_likelihood': 9}],
     'client_workout_log': [{'token': 'tokA', 'date': dk(0), 'data': {'e': {'t': 'run', 'm': 50}}}],
     'client_intake': [{'token': 'itk', 'status': 'submitted', 'submitted_at': '2026-11-21T08:00:00+00:00'}],
     'food_diary': []}
d = nd.build_digest(DATA, T, NOW)
ks = sorted((a['k'], a['c']['id']) for a in d['alert'])
check(ks == [('fb', 'c2'), ('intake', 'c3'), ('q', 'c1')], f'alert = question + feedback + intake ({ks})')
check(d['subject'] == '🔔 Σύνοψη ημέρας — 3 χρειάζονται εσένα', d['subject'])
g = d['day']
check([c['id'] for c in g['day']] == ['c1', 'c4'], 'today check-ins: Μαρία, Νίκος')
check(g['workout'] and g['workout'][0][1] == 'Τρέξιμο 50′', 'workout label')
check(g['weight'] and g['weight'][0][2] == -0.6, 'weight delta −0.6')
check(g['streak'] == [(DATA['clients'][3], 14)], '14-day streak')
check(g['nudge'] == 1, f'nudge counts only the 3+ day gap (Κώστας 5 days) → {g["nudge"]}')
check([q['c']['id'] for q in g['quiet']] == ['c5'], 'muted client → today digest')
html = d['html']
check('Την Τρίτη έχω γάμο' in html and 'Πρωινό 2★ · Πεινάω' in html and 'ερωτηματολόγιο' in html, 'html: action cards')
check('ήδη το είδα' not in html and 'διαγραμμένος' not in html, 'html: seen + deleted excluded')
check('Σάββατο 21 Νοεμβρίου' in html, 'html: Greek date')
check('−0,6 kg' in html and '14 μέρες στη σειρά' in html, 'html: digest rows')
check('<script' not in html.lower(), 'no script in email')
X = nd.build_digest({'clients': [cl('x', '<b>Hack</b>', 'tokX')]}, {'client_logs': [{'token': 'tokX', 'date': dk(0), 'note': '❓ <img src=x>'}]}, NOW)['html']
check('<img src=x>' not in X and '&lt;b&gt;Hack' in X, 'client text is escaped')

print('3. notifPrefs')
d2 = nd.build_digest(dict(DATA, notifPrefs={'comment': 'alert', 'fb': 'off'}), T, NOW)
ks2 = sorted((a['k'], a['c']['id']) for a in d2['alert'])
check(ks2 == [('comment', 'c2'), ('intake', 'c3'), ('q', 'c1')], f'comment→alert, fb→off ({ks2})')
d3 = nd.build_digest(dict(DATA, notifPrefs={'q': 'off', 'fb': 'off', 'intake': 'digest'}), T, NOW)
check(d3['subject'].endswith('όλα ήσυχα') and 'Όλα χειρισμένα' in d3['html'], 'nothing alerts → «όλα ήσυχα»')
seen = dict(DATA); seen['clients'] = [dict(c) for c in DATA['clients']]; seen['clients'][2]['intakeNotifSeen'] = '2026-11-21T08:00:00Z'
check(not any(a['k'] == 'intake' for a in nd.build_digest(seen, T, NOW)['alert']), 'intakeNotifSeen (other ISO format) hides the intake')

print('4. email off')
calls0 = []
nd.send = lambda *a: calls0.append(a)
for k in ('SUPABASE_SERVICE_KEY', 'GMAIL_USER', 'GMAIL_APP_PASSWORD'): os.environ.pop(k, None)
check(nd.main() == 0 and calls0 == [], 'not configured yet → exits OK, sends nothing (no nightly failure emails)')
calls = []
nd.fetch = lambda rest, uid, today: (dict(DATA, notifPrefs={'email': False}), T)
nd.send = lambda *a: calls.append(a)
os.environ.update({'SUPABASE_SERVICE_KEY': 'x', 'GMAIL_USER': 'a@example.com', 'GMAIL_APP_PASSWORD': 'p', 'DIGEST_SLOT': ''})
nd.main()
check(calls == [], 'email=false → nothing sent')
nd.fetch = lambda rest, uid, today: (DATA, T)
nd.main()
check(len(calls) == 1 and calls[0][4] == 'a@example.com' and 'χρειάζονται εσένα' in calls[0][0], 'default → one email to GMAIL_USER')

if os.environ.get('NOTIF_SHOTS'):
    Path(os.environ['NOTIF_SHOTS'], 'digest.html').write_text(html, encoding='utf-8')
print(f"\n{'PASS' if not fails else 'FAIL'} — {len(fails)} failed checks")
sys.exit(1 if fails else 0)
