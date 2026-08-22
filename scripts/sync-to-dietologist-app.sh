#!/usr/bin/env bash
# ============================================================================
# Συγχρονίζει τα live-app αρχεία από αυτό το repo (feedyourhealth-site/, το
# canonical αντίγραφο) στο δεύτερο, μη-git αντίγραφο Dietologist_App/ που
# χρησιμοποιείται για τοπικό testing.
#
# Γιατί υπάρχει: το χειροκίνητο sync είναι εύθραυστο σε 2 σημεία —
#   1) το Dietologist_App/ γράφει CRLF ενώ αυτό το repo γράφει LF, οπότε ένα
#      απλό `cp` "αλλάζει" κάθε γραμμή του αρχείου σε git diff/επόμενο review·
#   2) αν κάποιος επεξεργαστεί το Dietologist_App/ απευθείας (π.χ. γρήγορο
#      test-fix τοπικά) και μετά τρέξει sync, ένα τυφλό αντίγραφο θα το
#      έσβηνε σιωπηλά χωρίς προειδοποίηση.
# Αυτό το script λύνει και τα δύο: διατηρεί το line-ending convention του
# προορισμού, και ΑΡΝΕΙΤΑΙ να αγγίξει αρχείο που δεν ταιριάζει με το τελευταίο
# committed state αυτού του repo (πιθανό ανεξάρτητο hand-edit) εκτός αν δοθεί
# --force.
#
# Χρήση:
#   ./scripts/sync-to-dietologist-app.sh              # συγχρονισμός
#   ./scripts/sync-to-dietologist-app.sh --dry-run     # δείξε τι θα άλλαζε, μην αγγίξεις τίποτα
#   ./scripts/sync-to-dietologist-app.sh --force       # αντικατέστησε ΚΑΙ διαφοροποιημένα αρχεία
# ============================================================================
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DST_DIR="/c/Users/steph/OneDrive/Desktop/Dietologist_App"

DRY_RUN=0
FORCE=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --force) FORCE=1 ;;
    *) echo "Άγνωστο flag: $arg (δεκτά: --dry-run, --force)" >&2; exit 1 ;;
  esac
done

if [ ! -d "$DST_DIR" ]; then
  echo "Δεν βρέθηκε το $DST_DIR — ελέγξε τη διαδρομή στο script." >&2
  exit 1
fi

cd "$SRC_DIR"

synced=0
skipped_diverged=0
skipped_missing=0
unchanged=0

# Μόνο αρχεία που ΗΔΗ υπάρχουν και στα δύο αντίγραφα — δεν εισάγει νέα αρχεία/φακέλους
# στο Dietologist_App (π.χ. .github/, tests/, README.md μένουν έξω σκόπιμα, όπως ήταν πάντα).
while IFS= read -r f; do
  dst_file="$DST_DIR/$f"
  if [ ! -f "$dst_file" ]; then
    skipped_missing=$((skipped_missing+1))
    continue
  fi

  # Divergence check: το αρχείο στο Dietologist_App ταιριάζει (αγνοώντας CRLF/LF) με το
  # τελευταίο committed state ΕΔΩ; Αν όχι, κάποιος το άγγιξε ανεξάρτητα — μη το πατήσεις τυφλά.
  if git cat-file -e HEAD:"$f" 2>/dev/null; then
    if ! diff -q --strip-trailing-cr <(git show HEAD:"$f") "$dst_file" >/dev/null 2>&1; then
      if [ "$FORCE" -ne 1 ]; then
        echo "⚠️  ΔΙΑΦΟΡΟΠΟΙΗΜΕΝΟ (παραλείπεται, χρειάζεται --force ή χειροκίνητο review): $f"
        skipped_diverged=$((skipped_diverged+1))
        continue
      fi
    fi
  fi

  # Αν το αρχείο-πηγή δεν άλλαξε καθόλου (αγνοώντας CRLF/LF), μην το ξαναγράψεις άσκοπα.
  if diff -q --strip-trailing-cr "$f" "$dst_file" >/dev/null 2>&1; then
    unchanged=$((unchanged+1))
    continue
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "θα ενημερωνόταν: $f"
    synced=$((synced+1))
    continue
  fi

  # Διατήρησε το line-ending convention που ήδη έχει το αρχείο-προορισμός.
  if grep -qU $'\r' "$dst_file" 2>/dev/null; then
    sed 's/\r$//' "$f" | sed 's/$/\r/' > "$dst_file"
  else
    cp "$f" "$dst_file"
  fi
  echo "✓ ενημερώθηκε: $f"
  synced=$((synced+1))
done < <(git ls-files)

echo ""
echo "── Σύνοψη ──"
echo "Ενημερώθηκαν: $synced   Ήδη ίδια: $unchanged   Διαφοροποιημένα (παραλείφθηκαν): $skipped_diverged   Λείπουν στο Dietologist_App: $skipped_missing"
if [ "$skipped_diverged" -gt 0 ]; then
  echo ""
  echo "Κάποια αρχεία στο Dietologist_App δεν ταιριάζουν με το τελευταίο commit εδώ — δες τα"
  echo "χειροκίνητα (π.χ. diff --strip-trailing-cr) πριν τρέξεις ξανά με --force."
fi
