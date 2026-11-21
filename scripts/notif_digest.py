#!/usr/bin/env python3
"""📧 Βραδινή σύνοψη ειδοποιήσεων (φάση 2 του 🔔, 2026-11-21).

Τρέχει από το GitHub Actions (.github/workflows/nightly-digest.yml) κάθε βράδυ στις 21:00 ώρα Κύπρου
και στέλνει στο Gmail του διαιτολόγου ό,τι δείχνει το πάνελ 🔔 της εφαρμογής (js/tabs/notifications.js):
  • «Χρειάζονται εσένα» — ❓ ερωτήσεις, χαμηλό feedback πλάνου, νέο ερωτηματολόγιο (+ σχόλια αν το ζητήσει)
  • «Η μέρα σου με μια ματιά» — check-ins, προπονήσεις, βάρη, ημερολόγιο, σχόλια, σερί, «σταμάτησαν».
Σέβεται τις ίδιες ρυθμίσεις «Τι να μου λέει» (data.notifPrefs) και τη σίγαση (c.notifMuted)· αν ο
διαιτολόγος κλείσει το «📧 Βραδινό email» στο app (notifPrefs.email === False), δεν στέλνει τίποτα.

ΜΟΝΟ διαβάζει από τη βάση — δεν γράφει ποτέ τίποτα.

Μεταβλητές περιβάλλοντος (GitHub → Settings → Secrets and variables → Actions):
  SUPABASE_SERVICE_KEY  service_role key (Supabase → Project Settings → API) — μόνο ανάγνωση γίνεται
  GMAIL_USER            η διεύθυνση Gmail που στέλνει
  GMAIL_APP_PASSWORD    App password 16 χαρακτήρων του Gmail (ΟΧΙ ο κανονικός κωδικός)
  DIGEST_TO             (προαιρετικό) πού να πάει — αλλιώς στο GMAIL_USER
  DIGEST_USER_ID        (προαιρετικό) ποιος λογαριασμός — αλλιώς ο μοναδικός στο user_data
  SUPABASE_URL          (προαιρετικό) default το project της εφαρμογής
  DIGEST_SLOT           (από το workflow) "18" ή "19" = ώρα UTC του cron· στέλνει μόνο το slot που
                        πέφτει 21:00 Κύπρου (θερινή/χειμερινή ώρα). Κενό = στείλε τώρα (χειροκίνητο).
  DIGEST_DRY_RUN=1      γράψε το HTML στο stdout αντί για αποστολή
"""
import datetime as dt, json, os, smtplib, sys, urllib.parse, urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape as esc

APP_URL = 'https://feedyourhealth.github.io/Dietologist.html'
DEFAULT_SUPABASE_URL = 'https://vqmzrmotdqqoswlgfgrn.supabase.co'

# ── ΙΔΙΕΣ σταθερές με την εφαρμογή ───────────────────────────────────────────────────────
NOTIF_DAYS = 7                     # js/tabs/notifications.js
NOTIF_INTAKE_FRESH_DAYS = 14
MSG_PF_HISTORY_WEEKS = 26          # js/tabs/messages.js
CLIENT_LOGS_LIMIT = 15             # Cloud.allClientLogsFor
PF_ATTENTION_STAR_MAX, PF_ATTENTION_NPS_MAX = 2, 4   # js/client-list/roster-ui.js
PF_ROW_LABELS = {'breakfast': 'Πρωινό', 'snacks': 'Σνακ', 'lunch': 'Μεσημεριανό', 'dinner': 'Βραδινό',
                 'recipes_ease': 'Ευκολία συνταγών', 'ingredients_ease': 'Εύρεση υλικών', 'training_energy': 'Ενέργεια προπόνησης'}
PROGRESS_NUDGE_MIN_GAP, PROGRESS_NUDGE_RECONTACT_DAYS = 3, 7   # js/tabs/progress.js
WK_TYPES = {'weights': 'Βάρη', 'run': 'Τρέξιμο', 'walk': 'Περπάτημα', 'bike': 'Ποδήλατο', 'swim': 'Κολύμπι', 'team': 'Ομαδικό άθλημα', 'other': 'Άλλο'}
TYPES = {'q': ('alert', True), 'fb': ('alert', True), 'intake': ('alert', True), 'comment': ('digest', True),
         'day': ('digest', False), 'workout': ('digest', False), 'weight': ('digest', False),
         'diary': ('digest', False), 'streak': ('digest', False), 'nudge': ('digest', False)}


# ── Ώρα Κύπρου (EU: θερινή από τελευταία Κυριακή Μαρτίου 01:00 UTC ως τελευταία Κυριακή Οκτωβρίου) ──
def _last_sunday(year, month):
    d = dt.date(year, month + 1, 1) - dt.timedelta(days=1) if month < 12 else dt.date(year, 12, 31)
    return d - dt.timedelta(days=(d.weekday() + 1) % 7)

def cyprus_offset_hours(now_utc):
    y = now_utc.year
    start = dt.datetime.combine(_last_sunday(y, 3), dt.time(1), dt.timezone.utc)
    end = dt.datetime.combine(_last_sunday(y, 10), dt.time(1), dt.timezone.utc)
    return 3 if start <= now_utc < end else 2

def cyprus_now(now_utc=None):
    now_utc = now_utc or dt.datetime.now(dt.timezone.utc)
    return now_utc + dt.timedelta(hours=cyprus_offset_hours(now_utc))

def slot_is_due(slot, now_utc=None):
    """Το cron τρέχει 18:00 ΚΑΙ 19:00 UTC· μόνο αυτό που αντιστοιχεί σε 21:00 Κύπρου στέλνει."""
    if not slot: return True
    off = cyprus_offset_hours(now_utc or dt.datetime.now(dt.timezone.utc))
    return int(slot) + off == 21


# ── Βοηθητικά (αντίγραφα των JS) ────────────────────────────────────────────────────────────
def mode_of(prefs, k):
    default, action = TYPES[k]
    m = (prefs or {}).get(k)
    if m == 'alert' and not action: m = None
    return m if m in ('alert', 'digest', 'off') else default

def tokens_for(c):
    t = list(c.get('prevShareTokens') or [])
    if c.get('shareToken') and c['shareToken'] not in t: t.append(c['shareToken'])
    return t

def parse_note(raw):
    raw = str(raw or '')
    import re
    m = re.match(r'^\[tag:(travel|party|sick)\]\s*', raw)
    if m: raw = raw[m.end():]
    return raw.strip()

def needs_reply(text): return '❓' in (text or '')

def short_name(c):
    parts = str(c.get('name') or 'Πελάτης').split()
    return f"{parts[0]} {parts[-1][0]}." if len(parts) > 1 else parts[0]

def name_list(cs, mx=3):
    names = [esc(short_name(c)) for c in cs[:mx]]
    rest = len(cs) - len(names)
    return ', '.join(names) + (f' και {rest} ακόμη' if rest > 0 else '')

def clip(s, n): s = str(s or ''); return s if len(s) <= n else s[:n] + '…'

def is_good_day(r):
    if not r: return False
    if r.get('meals_total') and (r.get('meals_done') or 0) < r['meals_total']: return False
    if r.get('supps_total') and (r.get('supps_done') or 0) < r['supps_total']: return False
    if r.get('water_goal') and (r.get('water_glasses') or 0) < r['water_goal']: return False
    return True

def streak(by_date, today):
    d = today
    if not is_good_day(by_date.get(d.isoformat())): d -= dt.timedelta(days=1)
    n = 0
    while is_good_day(by_date.get(d.isoformat())) and n < 366:
        n += 1; d -= dt.timedelta(days=1)
    return n

def parse_ts(s):
    if not s: return None
    try: return dt.datetime.fromisoformat(str(s).replace('Z', '+00:00'))
    except ValueError: return None

def days_ago_text(key, today):
    n = (today - dt.date.fromisoformat(key)).days
    return 'σήμερα' if n <= 0 else ('χθες' if n == 1 else f'πριν {n} ημέρες')


# ── Η λογική της σύνοψης (καθαρή συνάρτηση — δοκιμάζεται χωρίς δίκτυο) ─────────────────────
def build_digest(data, tables, now_utc=None):
    """data = user_data.data · tables = {name: [rows]} · επιστρέφει dict με alert/day/subject/html."""
    now_utc = now_utc or dt.datetime.now(dt.timezone.utc)
    local = cyprus_now(now_utc)
    today = local.date(); tkey = today.isoformat()
    prefs = data.get('notifPrefs') or {}
    clients = [c for c in (data.get('clients') or []) if c and not c.get('deleted') and not c.get('archived')]

    def by_token(name):
        out = {}
        for r in tables.get(name, []): out.setdefault(r.get('token'), []).append(r)
        return out
    ck, logs, pf, wk = by_token('checkins'), by_token('client_logs'), by_token('plan_feedback'), by_token('client_workout_log')
    intake = {r['token']: r for r in tables.get('client_intake', [])}
    diary = {r['token']: r for r in tables.get('food_diary', [])}
    oldest = (today - dt.timedelta(days=NOTIF_DAYS - 1)).isoformat()

    actions = []
    for c in clients:
        tok = c.get('shareToken')
        if tok:
            entries = sorted(logs.get(tok, []), key=lambda e: e.get('date') or '', reverse=True)[:CLIENT_LOGS_LIMIT]
            for e in entries:
                text = parse_note(e.get('note'))
                if not text or not e.get('date'): continue
                d = e['date']
                replied = bool((c.get('noteReplies') or {}).get(d)); seen = bool((c.get('noteSeen') or {}).get(d))
                if replied or seen: continue
                if needs_reply(text): actions.append({'k': 'q', 'c': c, 'date': d, 'text': text})
                elif d >= oldest: actions.append({'k': 'comment', 'c': c, 'date': d, 'text': text})
            weeks = sorted(pf.get(tok, []), key=lambda e: e.get('week_start') or '', reverse=True)[:MSG_PF_HISTORY_WEEKS]
            for e in weeks:
                low = [k for k in PF_ROW_LABELS if e.get(k) is not None and e[k] <= PF_ATTENTION_STAR_MAX]
                low_nps = e.get('continue_likelihood') is not None and e['continue_likelihood'] <= PF_ATTENTION_NPS_MAX
                if not low and not low_nps: continue
                ws = e['week_start']; rep = c.get('pfReplies') or {}
                replied = rep.get(ws + '|_general') or (low and all(rep.get(ws + '|' + k) for k in low))
                if replied or (c.get('pfSeen') or {}).get(ws): continue
                parts = []
                for k in low:
                    reasons = ', '.join(((e.get('low_rating_reasons') or {}).get(k)) or [])
                    parts.append(f"{PF_ROW_LABELS[k]} {e[k]}★" + (f' · {reasons}' if reasons else ''))
                if low_nps: parts.append(f"συνέχιση {e['continue_likelihood']}/10")
                actions.append({'k': 'fb', 'c': c, 'date': ws, 'text': ' · '.join(parts)})
        it = intake.get(c.get('intakeToken')) if c.get('intakeToken') else None
        if it and it.get('status') == 'submitted' and it.get('submitted_at'):
            sub = parse_ts(it['submitted_at']); seen = parse_ts(c.get('intakeNotifSeen'))
            if sub and not (seen and abs((seen - sub).total_seconds()) < 1) and (now_utc - sub).days < NOTIF_INTAKE_FRESH_DAYS:
                actions.append({'k': 'intake', 'c': c, 'date': (sub + dt.timedelta(hours=cyprus_offset_hours(sub))).date().isoformat(), 'text': ''})
    actions.sort(key=lambda a: a['date'], reverse=True)

    alert, quiet = [], []
    for a in actions:
        m = mode_of(prefs, a['k'])
        if m == 'off': continue
        (alert if m == 'alert' and not a['c'].get('notifMuted') else quiet).append(a)

    # Σύνοψη σήμερα
    g = {'day': [], 'workout': [], 'weight': [], 'diary': [], 'quiet': [q for q in quiet if q['date'] == tkey], 'streak': [], 'nudge': 0}
    for c in clients:
        toks = tokens_for(c)
        rows = {}
        for t in toks:
            for r in ck.get(t, []): rows[r['date']] = r
        r = rows.get(tkey)
        if mode_of(prefs, 'day') != 'off' and r and ((r.get('meals_done') or 0) > 0 or (r.get('supps_done') or 0) > 0 or (r.get('water_glasses') or 0) > 0):
            g['day'].append(c)
        if mode_of(prefs, 'workout') != 'off':
            w = {}
            for t in toks:
                for x in wk.get(t, []): w[x['date']] = x.get('data') or {}
            w = w.get(tkey) or {}
            if w.get('d') or w.get('e'):
                e = w.get('e') or {}
                lbl = (WK_TYPES.get(e.get('t'), '') + (f" {e['m']}′" if e.get('m') else '')).strip() if e else ''
                g['workout'].append((c, lbl))
        if mode_of(prefs, 'weight') != 'off' and c.get('shareToken'):
            ws = [e for e in sorted(logs.get(c['shareToken'], []), key=lambda e: e.get('date') or '', reverse=True)[:CLIENT_LOGS_LIMIT]
                  if e.get('weight_kg') not in (None, '')]
            for i, e in enumerate(ws):
                if e['date'] != tkey: continue
                delta = round(float(e['weight_kg']) - float(ws[i + 1]['weight_kg']), 1) if i + 1 < len(ws) else None
                g['weight'].append((c, e['weight_kg'], delta)); break
        if mode_of(prefs, 'diary') != 'off' and c.get('diaryToken'):
            last = parse_ts((diary.get(c['diaryToken']) or {}).get('last_entry_at') or c.get('diaryLastEntryAt'))
            if last and (last + dt.timedelta(hours=cyprus_offset_hours(last))).date() == today: g['diary'].append(c)
        if rows:
            if mode_of(prefs, 'streak') != 'off':
                n = streak(rows, today)
                if n >= 7 and n % 7 == 0: g['streak'].append((c, n))
            if mode_of(prefs, 'nudge') != 'off':
                last = max(rows); gap = (today - dt.date.fromisoformat(last)).days
                muted = c.get('progressMutedUntil') and now_utc.timestamp() * 1000 < c['progressMutedUntil']
                cd = None
                if c.get('lastDietologistContact'): cd = int((now_utc.timestamp() * 1000 - c['lastDietologistContact']) // 86400000)
                recently = cd is not None and cd < gap and cd < PROGRESS_NUDGE_RECONTACT_DAYS
                if not muted and c.get('weekPlan') and gap >= PROGRESS_NUDGE_MIN_GAP and not recently: g['nudge'] += 1

    n = len(alert)
    subject = (f'🔔 Σύνοψη ημέρας — {n} ' + ('χρειάζεται' if n == 1 else 'χρειάζονται') + ' εσένα') if n else '🔔 Σύνοψη ημέρας — όλα ήσυχα'
    return {'alert': alert, 'quiet': quiet, 'day': g, 'today': today, 'subject': subject, 'html': render_html(alert, g, today)}


# ── Email (απλό HTML με inline styles — έτσι το δείχνει σωστά το Gmail) ─────────────────────
TEAL, RED = '#025857', '#7a1414'
KIND = {'q': '❓ Έγραψε ερώτηση', 'fb': '😕 Χαμηλή βαθμολογία πλάνου', 'intake': '📋 Συμπλήρωσε το ερωτηματολόγιο', 'comment': '💬 Σχόλιο στη μέρα του'}

def _row(icon, main, sub=''):
    return (f'<tr><td style="width:34px;padding:9px 0;vertical-align:top;font-size:17px">{icon}</td>'
            f'<td style="padding:9px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1a1a1a">{main}'
            + (f'<div style="font-size:12.5px;color:#6b6b6b;margin-top:2px">{sub}</div>' if sub else '') + '</td></tr>')

def render_html(alert, g, today):
    days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή']
    months = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου']
    h = ['<div style="background:#f5f5f5;padding:20px 10px;font-family:Arial,Helvetica,sans-serif">'
         '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0">'
         f'<div style="background:{TEAL};color:#fff;padding:18px 22px"><div style="font-size:18px;font-weight:bold">🔔 Η μέρα σου με μια ματιά</div>'
         f'<div style="font-size:13px;opacity:.85;margin-top:3px">{days[today.weekday()]} {today.day} {months[today.month - 1]}</div></div>'
         '<div style="padding:8px 22px 18px">']
    h.append(f'<div style="margin:14px 0 8px;font-size:12px;font-weight:bold;letter-spacing:.5px;color:{RED}">ΧΡΕΙΑΖΟΝΤΑΙ ΕΣΕΝΑ · {len(alert)}</div>')
    if not alert:
        h.append('<div style="padding:11px 12px;border-radius:8px;background:#e8f5e9;color:#1b5e20;font-size:13.5px">Όλα χειρισμένα 👍</div>')
    for a in alert:
        c = a['c']
        body = f'«{esc(clip(a["text"], 220))}»' if a['k'] in ('q', 'comment') else (esc(a['text']) if a['k'] == 'fb' else 'Έτοιμο για «Εφαρμογή» στον φάκελο.')
        h.append(f'<div style="margin:0 0 8px;padding:11px 12px;border-radius:8px;background:#fff7f5;border:1px solid #f3d6d0">'
                 f'<div style="font-size:14px;font-weight:bold;color:#1a1a1a">{esc(c.get("name") or "Πελάτης")}'
                 f'<span style="float:right;font-weight:normal;font-size:12px;color:#6b6b6b">{days_ago_text(a["date"], today)}</span></div>'
                 f'<div style="font-size:12.5px;font-weight:bold;color:{RED};margin:3px 0">{KIND[a["k"]]}</div>'
                 f'<div style="font-size:13.5px;color:#333;line-height:1.4">{body}</div></div>')
    h.append(f'<div style="margin:22px 0 4px;font-size:12px;font-weight:bold;letter-spacing:.5px;color:{TEAL}">ΣΗΜΕΡΑ ΜΕ ΜΙΑ ΜΑΤΙΑ</div><table style="width:100%;border-collapse:collapse">')
    rows = []
    if g['day']: rows.append(_row('✅', f'<b>{len(g["day"])} {"πελάτης" if len(g["day"]) == 1 else "πελάτες"}</b> συμπλήρωσαν τη μέρα τους', name_list(g['day'])))
    if g['workout']:
        sub = ', '.join(esc(short_name(c)) + (f' ({esc(l)})' if l else '') for c, l in g['workout'][:3]) + (f' και {len(g["workout"]) - 3} ακόμη' if len(g['workout']) > 3 else '')
        rows.append(_row('🏃', f'<b>{len(g["workout"])}</b> κατέγραψαν προπόνηση', sub))
    if g['weight']:
        def fmt(kg, d): return f'{kg} kg' if d is None else (('+' if d > 0 else ('−' if d < 0 else '±')) + f'{abs(d):.1f}'.replace('.', ',') + ' kg')
        rows.append(_row('⚖️', f'<b>{len(g["weight"])}</b> ' + ('νέα μέτρηση' if len(g['weight']) == 1 else 'νέες μετρήσεις') + ' βάρους',
                         ' · '.join(esc(short_name(c)) + ' ' + fmt(kg, d) for c, kg, d in g['weight'][:5])))
    if g['diary']: rows.append(_row('📒', f'<b>{len(g["diary"])}</b> ημερολόγιο φαγητού', name_list(g['diary'])))
    for q in g['quiet']:
        lbl = {'q': '❓ έγραψε ερώτηση', 'fb': '😕 χαμηλή βαθμολογία πλάνου', 'intake': '📋 συμπλήρωσε ερωτηματολόγιο'}.get(q['k']) or f'💬 «{esc(clip(q["text"], 90))}»'
        rows.append(_row('🔇' if q['c'].get('notifMuted') else '💬', f'<b>{esc(short_name(q["c"]))}</b> {lbl}'))
    for c, n in g['streak']: rows.append(_row('⭐', f'<b>{esc(short_name(c))}</b> έφτασε {n} μέρες στη σειρά', 'Καλή ευκαιρία για ένα «μπράβο» από την εφαρμογή'))
    if g['nudge']: rows.append(_row('🔔', f'<b>{g["nudge"]}</b> δεν έχουν καταγράψει 3+ μέρες', 'Δες τους στην Πρόοδο για υπενθύμιση'))
    h.extend(rows or [_row('🌙', 'Τίποτα από τους πελάτες σήμερα.')])
    h.append('</table>'
             f'<div style="text-align:center;margin:22px 0 4px"><a href="{APP_URL}" style="display:inline-block;background:{TEAL};color:#fff;text-decoration:none;'
             'font-weight:bold;font-size:14px;padding:11px 22px;border-radius:8px">Άνοιγμα εφαρμογής</a></div>'
             '</div></div><div style="max-width:560px;margin:10px auto 0;text-align:center;font-size:11.5px;color:#8a8a8a">'
             'Το στέλνει αυτόματα το Dietologist κάθε βράδυ. Για να το σταματήσεις: 🔔 → ⚙️ «Τι να μου λέει» → «📧 Βραδινό email».</div></div>')
    return ''.join(h)


# ── Ανάγνωση από Supabase (PostgREST, service key, μόνο GET) ──────────────────────────────────
class Rest:
    def __init__(self, url, key): self.url, self.key = url.rstrip('/'), key
    def get(self, table, params):
        out, off = [], 0
        while True:
            q = urllib.parse.urlencode(params, safe='(),.*:')
            req = urllib.request.Request(f'{self.url}/rest/v1/{table}?{q}', headers={
                'apikey': self.key, 'Authorization': 'Bearer ' + self.key, 'Range-Unit': 'items', 'Range': f'{off}-{off + 999}'})
            with urllib.request.urlopen(req, timeout=60) as r: rows = json.loads(r.read().decode('utf-8'))
            out += rows
            if len(rows) < 1000: return out
            off += 1000
    def by_tokens(self, table, cols, tokens, extra=None):
        rows, tokens = [], [t for t in tokens if t]
        for i in range(0, len(tokens), 60):
            p = {'select': cols, 'token': 'in.(' + ','.join(tokens[i:i + 60]) + ')'}
            p.update(extra or {})
            rows += self.get(table, p)
        return rows

def fetch(rest, user_id, today):
    if user_id: rows = rest.get('user_data', {'select': 'user_id,data', 'user_id': 'eq.' + user_id})
    else: rows = rest.get('user_data', {'select': 'user_id,data'})
    if len(rows) != 1: raise SystemExit(f'Βρέθηκαν {len(rows)} λογαριασμοί στο user_data — όρισε το DIGEST_USER_ID.')
    data = rows[0].get('data') or {}
    cs = [c for c in data.get('clients') or [] if c and not c.get('deleted') and not c.get('archived')]
    share = sorted({t for c in cs for t in tokens_for(c)})
    since = lambda d: 'gte.' + (today - dt.timedelta(days=d)).isoformat()
    t = {
        'checkins': rest.by_tokens('checkins', 'token,date,meals_done,meals_total,water_glasses,water_goal,supps_done,supps_total', share, {'date': since(400)}),
        'client_logs': rest.by_tokens('client_logs', 'token,date,weight_kg,note', share, {'date': since(400)}),
        'plan_feedback': rest.by_tokens('plan_feedback', 'token,week_start,' + ','.join(PF_ROW_LABELS) + ',continue_likelihood,low_rating_reasons', share, {'week_start': since(MSG_PF_HISTORY_WEEKS * 7 + 7)}),
        'client_workout_log': rest.by_tokens('client_workout_log', 'token,date,data', share, {'date': since(2)}),
        'client_intake': rest.by_tokens('client_intake', 'token,status,submitted_at', [c.get('intakeToken') for c in cs]),
        'food_diary': rest.by_tokens('food_diary', 'token,last_entry_at', [c.get('diaryToken') for c in cs]),
    }
    return data, t

def send(subject, html, user, pw, to):
    msg = MIMEMultipart('alternative')
    msg['Subject'], msg['From'], msg['To'] = subject, f'Dietologist <{user}>', to
    msg.attach(MIMEText('Άνοιξε το email σε πρόγραμμα που δείχνει HTML, ή μπες στην εφαρμογή: ' + APP_URL, 'plain', 'utf-8'))
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=60) as s:
        s.login(user, pw); s.sendmail(user, [to], msg.as_string())

def main():
    env = os.environ
    if not slot_is_due(env.get('DIGEST_SLOT', '').strip()):
        print('Όχι αυτό το slot (θερινή/χειμερινή ώρα) — τίποτα να γίνει.'); return 0
    key = env.get('SUPABASE_SERVICE_KEY')
    if not key or not env.get('GMAIL_USER') or not env.get('GMAIL_APP_PASSWORD'):
        # Δεν έχει ρυθμιστεί ακόμα — βγαίνει «πράσινο» ώστε το GitHub να μη στέλνει email αποτυχίας κάθε βράδυ.
        print('Το βραδινό email δεν έχει ρυθμιστεί (λείπουν GitHub secrets) — τίποτα να γίνει.'); return 0
    rest = Rest(env.get('SUPABASE_URL') or DEFAULT_SUPABASE_URL, key)
    data, tables = fetch(rest, env.get('DIGEST_USER_ID'), cyprus_now().date())
    if (data.get('notifPrefs') or {}).get('email') is False:
        print('Το βραδινό email είναι κλειστό από την εφαρμογή — δεν στέλνεται.'); return 0
    d = build_digest(data, tables)
    print(f"{d['subject']} · σήμερα: {len(d['day']['day'])} check-ins")
    if env.get('DIGEST_DRY_RUN') == '1':
        print(d['html']); return 0
    user, pw = env['GMAIL_USER'], env['GMAIL_APP_PASSWORD']
    send(d['subject'], d['html'], user, pw, env.get('DIGEST_TO') or user)
    print('Στάλθηκε.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
