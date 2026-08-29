// js/plan-gen/supplement-recs.js
// getSupplementRecommendations(c) — builds the scientifically-backed supplement
// recommendation HTML for the 💊 tab. Extracted verbatim from js/app-part3.js
// (module split wave 18). Single pure fn declaration, no load-time code. Called
// from app-part4.js and from app-part3.js render paths, all at runtime. Loads
// right before app-part3.js.

// ══════════════════════════════════════════════════════════════════════════════
// SUPPLEMENT RECOMMENDATIONS — SCIENTIFICALLY-BACKED
// ══════════════════════════════════════════════════════════════════════════════
function getSupplementRecommendations(c){
  if(!c)return'';
  var isNormal=(c.dietType==='normal');
  var isKeto=(c.dietType==='keto');
  var isVegan=(c.dietType==='vegan');
  var isVegetarian=(c.dietType==='vegetarian');
  var isOrthodoxFasting=(c.dietType==='orthodox_fasting');
  var isIntermittentFasting=(c.dietType==='intermittent_fasting');

  var rec='<div style="background:var(--panel-bg);border-left:4px solid #ff9800;padding:12px 14px;margin:12px 0;border-radius:4px;font-size:12px;line-height:1.6">'
    +'<b style="color:#e65100">💊 Προτάσεις Συμπληρωμάτων</b><br/><br/>';

  // ══════════════════════════════════════════════════════════════════════════════
  // NORMAL DIET
  // ══════════════════════════════════════════════════════════════════════════════
  if(isNormal){
    rec+='<b>🍗 Κανονική Διατροφή</b><br/>'
      +'<b>Vitamin D3:</b><br/>'
      +'&nbsp;&nbsp;☀️ 10-25 mcg/day (ιδιαίτερα χειμώνα ή αν λίγη ηλιοθεραπεία)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Ψάρι (σολομός, μακαρόνι), αυγά, γάλα ενισχυμένο<br/><br/>'
      +'<b>Magnesium:</b><br/>'
      +'&nbsp;&nbsp;💪 300-400mg/day (ηρεμία, ύπνος, ανάκαμψη μυών)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Σκούρα φυλλώδη λαχανικά, σπόροι, καρύδια, σοκολάτα<br/><br/>'
      +'<b>Vitamin B Complex (B6, B3, Folate):</b><br/>'
      +'&nbsp;&nbsp;⚡ Ενέργεια & μεταβολισμό<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Κοτόπουλο, ψάρι, αυγά, δημητριακά ολικής άλεσης<br/><br/>'
      +'<b>Zinc:</b><br/>'
      +'&nbsp;&nbsp;🛡️ 8-11mg/day (ανοσοποιητικό, επουλωτική)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Κόκκινο κρέας, στρείδια, γαρίδες, σπόροι<br/><br/>'
      +'<b>Omega-3 Fatty Acids:</b><br/>'
      +'&nbsp;&nbsp;❤️ 200-300mg EPA/DHA per week ή 2-3x ψάρι/εβδάδα<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Σολομός, σαρδέλα, μαγιονέζα (από ψάρι)<br/><br/>';
  }
  // ══════════════════════════════════════════════════════════════════════════════
  // KETOGENIC
  // ══════════════════════════════════════════════════════════════════════════════
  else if(isKeto){
    rec+='<b>⚡ Κετογονική Διατροφή</b><br/>'
      +'<b>Electrolytes (ΚΡΙΤΙΚΟ - κετό γρίπη):</b><br/>'
      +'&nbsp;&nbsp;🧂 Νάτριο: 3-5g/day (αλάτι + bone broth)<br/>'
      +'&nbsp;&nbsp;🧂 Κάλιο: 2-3g/day (πράσινα λαχανικά, αβοκάντο)<br/>'
      +'&nbsp;&nbsp;🧂 Μάγνησιο: 300-400mg/day (supplement ή σπόροι)<br/><br/>'
      +'<b>Vitamin D3:</b><br/>'
      +'&nbsp;&nbsp;☀️ 10-25 mcg/day (ιδιαίτερα σε χαμηλότερη ηλιοθεραπεία)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Λιπαρό ψάρι (σολομός), αυγά, βούτυρο<br/><br/>'
      +'<b>Fiber & Micronutrients:</b><br/>'
      +'&nbsp;&nbsp;🥗 Φυτικές ίνες: Σκούρα λαχανικά, ψίλια, χία σπόροι<br/>'
      +'&nbsp;&nbsp;🥒 Προβιοτικά: Ζυμωμένα (κιμχι, σούβλα)<br/><br/>'
      +'<b>MCT Oil / Exogenous Ketones (Optional):</b><br/>'
      +'&nbsp;&nbsp;⚡ Ενέργεια & ketone παραγωγή (εξ ορισμού)<br/>'
      +'&nbsp;&nbsp;💡 Χρησιμοποιήστε μετά την πρώτη εβδάδα αν έχετε κετό γρίπη<br/><br/>';
  }
  // ══════════════════════════════════════════════════════════════════════════════
  // INTERMITTENT FASTING
  // ══════════════════════════════════════════════════════════════════════════════
  else if(isIntermittentFasting){
    rec+='<b>⏰ Διαλείπουσα Νηστεία (Intermittent Fasting)</b><br/>'
      +'<b>Μακροχρόνιο κορεσμό:</b><br/>'
      +'&nbsp;&nbsp;⭐ <b>Electrolytes</b> (during fasting): Κάλιο, Μάγνησιο, Νάτριο<br/>'
      +'&nbsp;&nbsp;&nbsp;&nbsp;💧 Πίνετε νερό με πέταλα λεμονιού ή ανιόντα αλάτι<br/>'
      +'&nbsp;&nbsp;⭐ <b>Ω-3 Fatty Acids</b>: Καλό για μαγνησίνειο & απόδοση<br/>'
      +'&nbsp;&nbsp;⭐ <b>Multivitamin</b>: Καλύπτει το gap από λιγότερα γεύματα<br/>'
      +'&nbsp;&nbsp;⭐ <b>Πρωτεΐνη Powder</b>: Ωφέλιμη για γρήγορη κορεσμό<br/><br/>';
  }
  // ══════════════════════════════════════════════════════════════════════════════
  // ORTHODOX FASTING
  // ══════════════════════════════════════════════════════════════════════════════
  else if(isOrthodoxFasting){
    rec+='<b>✝️ Ορθόδοξη Νηστεία (100% Φυτική)</b><br/>'
      +'<b>B12 (ΥΠΟΧΡΕΩΤΙΚΟ):</b><br/>'
      +'&nbsp;&nbsp;💉 Ημερήσια: 10-25 mcg supplement OR fortified plant milks (3x)<br/>'
      +'&nbsp;&nbsp;💉 Εβδομαδιαία: 2000 mcg supplement<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Fortified cereals, nutritional yeast<br/><br/>'
      +'<b>Σίδηρος (Iron) + Vitamin C:</b><br/>'
      +'&nbsp;&nbsp;🥬 Strategy: Φακές/ρεβίθια + τομάτες/λεμόνι (6x absorption)<br/>'
      +'&nbsp;&nbsp;⚠️ Αποφυγή: Καφές/τσάι με σιδηρούχα γεύματα<br/>'
      +'&nbsp;&nbsp;🔄 Soaking/sprouting legumes (↓ phytates)<br/><br/>'
      +'<b>Vitamin D3 + Calcium:</b><br/>'
      +'&nbsp;&nbsp;☀️ D3: 10-25 mcg/day algae supplement<br/>'
      +'&nbsp;&nbsp;🥛 Calcium: 1000-1200 mg από fortified plant milks + tahini<br/><br/>'
      +'<b>Omega-3 (ALA → EPA/DHA):</b><br/>'
      +'&nbsp;&nbsp;🌱 ALA: Σπόροι λιναριού (1tbsp), chia (1tbsp), καρύδια (1oz)<br/>'
      +'&nbsp;&nbsp;🍃 Algae supplement: 200-300mg EPA/DHA/day (limited ALA conversion)<br/><br/>'
      +'<b>Άλλα: Ιωδίνη (iodized salt), Ψευδάργυρος, Σελήνιο (brazil nuts)</b><br/><br/>';
  }
  // ══════════════════════════════════════════════════════════════════════════════
  // VEGAN
  // ══════════════════════════════════════════════════════════════════════════════
  else if(isVegan){
    rec+='<b>Vitamin B12</b> (υποχρεωτικό για веγάν):<br/>'
      +'&nbsp;&nbsp;💉 Ημερήσια: 10 mcg supplement OR 25-100 mcg fortified foods (3+ times)<br/>'
      +'&nbsp;&nbsp;💉 Εβδομαδιαία: 2000 mcg supplement (κάθε 7 ημέρες)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Fortified plant milks, nutritional yeast, cereals<br/><br/>';

    rec+='<b>Σίδηρος (Iron)</b> + Vitamin C (enhanced absorption):<br/>'
      +'&nbsp;&nbsp;🥬 Strategy: Φακές/ρεβίθια ΜΕ τομάτες/κιτρικά (6x absorption)<br/>'
      +'&nbsp;&nbsp;⚠️ Αποφυγή: Καφές/τσάι με σιδηρούχα γεύματα (ταννίνες)<br/>'
      +'&nbsp;&nbsp;🔄 Ενίσχυση: Soaking/sprouting legumes (↓ phytates)<br/><br/>';

    rec+='<b>Vitamin D3 + Calcium</b> (веγάν sources):<br/>'
      +'&nbsp;&nbsp;☀️ Vitamin D3: 10-25 μg/day algae supplement<br/>'
      +'&nbsp;&nbsp;🥛 Calcium: 1000-1200 mg/day από fortified plant milks + tofu<br/><br/>';

    rec+='<b>Omega-3 (ALA → EPA/DHA)</b>:<br/>'
      +'&nbsp;&nbsp;🌱 ALA: Σπόροι (flaxseed 1tbsp, chia 1tbsp, walnuts 1oz)<br/>'
      +'&nbsp;&nbsp;🍃 EPA/DHA: Algae supplement 200-300mg/day<br/><br/>';

    rec+='<b>Magnesium:</b><br/>'
      +'&nbsp;&nbsp;💪 300-400mg/day (ηρεμία, ύπνος, μυική ανάκαμψη)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Σπόροι, καρύδια, dark chocolate (85%+), σκούρα λαχανικά<br/><br/>'
      +'<b>Zinc:</b><br/>'
      +'&nbsp;&nbsp;🛡️ 8-11mg/day (ανοσοποιητικό)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Σπόροι κολοκύθας, κάσιας, φυστίκια, chickpeas<br/><br/>'
      +'<b>Vitamin B6 & Folate:</b><br/>'
      +'&nbsp;&nbsp;⚡ Μεταβολισμό ενέργειας<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Όσπρια, σπόροι, ντομάτες, μπανάνες<br/><br/>'
      +'<b>Άλλα:</b> Ιωδίνη (αλατισμένο αλάτι), Σελήνιο (brazil nuts 2-3/day)<br/>';
  }
  // ══════════════════════════════════════════════════════════════════════════════
  // VEGETARIAN
  // ══════════════════════════════════════════════════════════════════════════════
  else if(isVegetarian){
    rec+='<b>Vitamin B12</b> (χορτοφαγική):<br/>'
      +'&nbsp;&nbsp;💉 Ημερήσια: 10 mcg supplement (ή fortified foods)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Γιαούρτι, αυγά + fortified cereals<br/><br/>';

    rec+='<b>Σίδηρος (Iron)</b> + Vitamin C (enhanced absorption):<br/>'
      +'&nbsp;&nbsp;🥬 Strategy: Φακές/ρεβίθια ΜΕ τομάτες/λεμόνι (6x absorption)<br/>'
      +'&nbsp;&nbsp;⚠️ Αποφυγή: Καφές/τσάι με σιδηρούχα γεύματα (ταννίνες)<br/>'
      +'&nbsp;&nbsp;🔄 Ενίσχυση: Soaking/sprouting legumes (↓ phytates)<br/><br/>';

    rec+='<b>Vitamin D3 + Calcium</b> (χορτοφαγική):<br/>'
      +'&nbsp;&nbsp;☀️ Vitamin D3: 10-25 μg/day supplement (ή fortified)<br/>'
      +'&nbsp;&nbsp;🥛 Calcium: Γιαούρτι (200mg), τυρί, γάλα ενισχυμένο<br/><br/>';

    rec+='<b>Magnesium & Zinc:</b><br/>'
      +'&nbsp;&nbsp;💪 Magnesium: 300-400mg/day από σπόροι, καρύδια<br/>'
      +'&nbsp;&nbsp;🛡️ Zinc: 8-11mg/day (αυγά έχουν λίγο, χρειάζεται supplement)<br/><br/>';

    rec+='<b>Omega-3 (ALA → EPA/DHA):</b><br/>'
      +'&nbsp;&nbsp;🌱 ALA: Σπόροι (flaxseed 1tbsp, chia 1tbsp, walnuts 1oz)<br/>'
      +'&nbsp;&nbsp;🍃 Algae supplement: 200-300mg EPA/DHA/day (consider)<br/><br/>';

    rec+='<b>Vitamin B6 & Folate:</b><br/>'
      +'&nbsp;&nbsp;⚡ Σπόροι, όσπρια, αβοκάντο<br/><br/>'
      +'<b>Άλλα:</b> Ιωδίνη (iodized salt), Σελήνιο (brazil nuts 2-3/day)<br/>';
  }

  rec+='</div>';
  return rec;
}

