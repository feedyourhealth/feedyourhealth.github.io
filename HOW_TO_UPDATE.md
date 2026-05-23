# 🔄 Πώς να ενημερώσεις το Dietologist στο GitHub

Κάθε φορά που κάνεις αλλαγές στο `C:\Users\steph\OneDrive\Desktop\Dietologist.html`, η εφαρμογή στο GitHub θα πρέπει να ενημερωθεί.

## ⚡ Γρήγορη Ενημέρωση (Αυτόματη)

### Windows:
Απλά κάνε **double-click** στο:
```
C:\Users\steph\feedyourhealth.github.io\update.bat
```

### Mac/Linux:
```bash
~/feedyourhealth.github.io/update.sh
```

---

## 📝 Χειροκίνητη Ενημέρωση (αν θέλεις)

1. **Αντιγραφή αρχείου:**
   ```bash
   copy "C:\Users\steph\OneDrive\Desktop\Dietologist.html" "C:\Users\steph\feedyourhealth.github.io\index.html"
   ```

2. **Πήγαινε στο repository:**
   ```bash
   cd C:\Users\steph\feedyourhealth.github.io
   ```

3. **Κάνε commit:**
   ```bash
   git add index.html
   git commit -m "Update Dietologist - [ΠΕΡΙΓΡΑΦΗ ΤΗΣ ΑΛΛΑΓΗΣ]"
   ```

4. **Ανέβασε στο GitHub:**
   ```bash
   git push origin main
   ```

---

## ✅ Επιβεβαίωση

Μετά από λίγα δευτερόλεπτα, η εφαρμογή θα ανανεωθεί στο:
```
https://feedyourhealth.github.io
```

---

## 🔧 Τι να κάνεις αν δεν λειτουργεί

### ❌ Σφάλμα: "fatal: The current branch main has no upstream branch"

**Λύση:**
```bash
cd C:\Users\steph\feedyourhealth.github.io
git push -u origin main
```

### ❌ Σφάλμα: Ζητά username/password

**Λύση:** Δημιούργησε ένα Personal Access Token στο GitHub:
1. Πήγαινε https://github.com/settings/tokens
2. Πάτησε "Generate new token"
3. Δώσε όνομα: `dietologist-push`
4. Επίλεξε `repo` permissions
5. Copy το token
6. Όταν ζητάει password, κάτσε το token

---

## 📊 Status του Repository

Για να δεις το status ανά πάσα στιγμή:
```bash
cd C:\Users\steph\feedyourhealth.github.io
git status
```

Για να δεις τα commits:
```bash
git log --oneline -10
```
