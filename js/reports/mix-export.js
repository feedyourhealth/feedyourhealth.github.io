// js/reports/mix-export.js
// 🧩 Μενού επιλογών — PDF για τον πελάτη (Εξαγωγή ▾ → «PDF Μενού επιλογών»), el / en.
// Ίδια λογική με το «Στόχοι» (targets-sheet.js): νέο παράθυρο με έτοιμο HTML → εκτύπωση / PDF.
// Οι μέρες με ΙΔΙΟΥΣ στόχους γευμάτων (π.χ. όλες οι μέρες προπόνησης) μπαίνουν μαζί, ώστε το
// έντυπο να μένει λίγες σελίδες χωρίς να χάνεται καμία ποσότητα.

var MIX_PDF_TXT={
  el:{title:'Το μενού σου',sub:'Διάλεξε, και οι ποσότητες είναι ήδη μετρημένες για σένα',
    how:'Πώς φτιάχνεις το πιάτο σου',
    howL:['Κύριο γεύμα = ① μία πρωτεΐνη + ② έναν υδατάνθρακα + ③ λαχανικά / σαλάτα ≥ 200 g + ④ το λάδι που γράφει δίπλα στην πρωτεΐνη.',
          'Ή, αντί για ①+②, ένα πιάτο όσπρια με ό,τι γράφει δίπλα του.',
          'Κρέας και ψάρι: το βάρος είναι ψημένο (σε παρένθεση το ωμό). Ρύζι, ζυμαρικά, όσπρια: το βάρος είναι ωμό / ξερό (σε παρένθεση το μαγειρεμένο).',
          'Πρωινό και ενδιάμεσα: διάλεξε μία από τις ιδέες.'],
    protein:'① Πρωτεΐνη',carb:'② Υδατάνθρακας',legume:'🫘 Ή όσπρια (αντί για ①+②)',oil:'Λάδι',qty:'Ποσότητα',
    veg:'③ Λαχανικά / σαλάτα ≥ 200 g',ideas:'Διάλεξε μία ιδέα',week:'Η εβδομάδα σου',
    fish:'Ψάρι τουλάχιστον',legumes:'Όσπρια τουλάχιστον',red:'Κόκκινο κρέας έως',times:'φορές',
    avoid:'Απόφυγε τους συνδυασμούς',noOil:'χωρίς λάδι αυτές τις μέρες',print:'Εκτύπωση / Αποθήκευση PDF',
    target:'Στόχος',kcal:'kcal',P:'Π',C:'Υ',F:'Λ',rest:'Ξεκούραση',days:'Ημέρες'},
  en:{title:'Your menu',sub:'Pick what you like — the amounts are already measured for you',
    how:'How to build your plate',
    howL:['Main meal = ① one protein + ② one carb + ③ vegetables / salad ≥ 200 g + ④ the oil shown next to the protein.',
          'Or, instead of ①+②, one legume dish with what is written next to it.',
          'Meat and fish: weight is cooked (raw in brackets). Rice, pasta, legumes: weight is raw / dry (cooked in brackets).',
          'Breakfast and snacks: pick one of the ideas.'],
    protein:'① Protein',carb:'② Carbs',legume:'🫘 Or legumes (instead of ①+②)',oil:'Oil',qty:'Amount',
    veg:'③ Vegetables / salad ≥ 200 g',ideas:'Pick one idea',week:'Your week',
    fish:'Fish at least',legumes:'Legumes at least',red:'Red meat at most',times:'times',
    avoid:'Avoid these combinations',noOil:'no oil on these days',print:'Print / Save as PDF',
    target:'Target',kcal:'kcal',P:'P',C:'C',F:'F',rest:'Rest day',days:'Days'}
};
var MIX_PDF_CSS='*{box-sizing:border-box}body{margin:0;background:#fff;color:#1d2b2a;font-family:"Segoe UI",system-ui,Arial,sans-serif;padding:18px;font-size:13px}'
  +'h1{font-size:22px;margin:0;color:#025857}h2{font-size:16px;margin:18px 0 6px;color:#025857;border-bottom:2px solid #025857;padding-bottom:3px}'
  +'h3{font-size:14px;margin:12px 0 4px}.sub{color:#5a6b69;margin:2px 0 10px}.hd{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;flex-wrap:wrap}'
  +'.how{background:#e2eee5;border-radius:8px;padding:8px 12px;margin:8px 0}.how ul{margin:4px 0 0 18px;padding:0}.how li{margin:2px 0}'
  +'table{width:100%;border-collapse:collapse;margin:4px 0 8px}th,td{text-align:left;padding:4px 6px;border-bottom:1px solid #e0e4e3;vertical-align:top}'
  +'th{font-size:11px;color:#5a6b69;font-weight:600;background:#f4f6f5}td.q{font-weight:700;white-space:nowrap}td.s{color:#5a6b69;font-size:12px}'
  +'.meal{break-inside:avoid;margin-bottom:10px}.mh{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.tm{color:#025857;font-weight:700}'
  +'.tag{font-size:11px;background:#e8f0fb;color:#1565c0;border-radius:999px;padding:1px 8px}.mac{margin-left:auto;font-size:11px;color:#5a6b69}'
  +'.lab{font-size:12px;font-weight:700;margin:6px 0 0}.lp{color:#1565C0}.lc{color:#2E7D32}.idea{padding:3px 0;border-bottom:1px dashed #e0e4e3}'
  +'.rules{display:flex;gap:16px;flex-wrap:wrap;background:#f4f6f5;border-radius:8px;padding:8px 12px}.warn{color:#8a5a00}'
  +'.group{break-before:auto}.btn{position:fixed;right:16px;top:16px;background:#025857;color:#fff;border:0;border-radius:8px;padding:8px 14px;font:inherit;cursor:pointer}'
  +'@media print{.btn{display:none}body{padding:0}h2{break-after:avoid}}';

function mixPdfQty(f,lang){
  if(lang==='en') return f.g+' g';
  return mixIdeaQty(f,'el');
}
function mixPdfMealHead(m,L){
  return '<div class="mh"><span class="tm">'+esc(m.time)+'</span><b>'+esc(m.name)+'</b>'
    +(m.tag?'<span class="tag">'+esc(m.tagLabel)+'</span>':'')
    +'<span class="mac">'+L.target+': '+m.k+' '+L.kcal+' · '+L.P+' '+m.p+' · '+L.C+' '+m.c+' · '+L.F+' '+m.f+'</span></div>';
}
function mixPdfMainHtml(day,m,L,lang){
  var h='<div class="meal">'+mixPdfMealHead(m,L);
  if(m.prot.length){
    h+='<div class="lab lp">'+L.protein+'</div><table><tr><th></th><th>'+L.qty+'</th><th></th><th>'+L.oil+'</th></tr>'
      +m.prot.map(function(q){
        return '<tr><td>'+esc(mixFoodName(q.n,lang))+'</td><td class="q">'+esc(q.main)+'</td><td class="s">'+(q.alt?esc(q.alt):'')+'</td><td class="s">'
          +esc(day.oilOk?mixOilTxt(q.oil,lang):m.fat.txt)+'</td></tr>';
      }).join('')+'</table>';
  }
  if(m.carb.length){
    h+='<div class="lab lc">'+L.carb+'</div><table><tr><th></th><th>'+L.qty+'</th><th></th></tr>'
      +m.carb.map(function(q){
        return '<tr><td>'+esc(mixFoodName(q.n,lang))+'</td><td class="q">'+esc(q.main)+'</td><td class="s">'+(q.alt?esc(q.alt):'')+'</td></tr>';
      }).join('')+'</table>';
  }
  h+='<div class="lab">'+L.veg+'</div>';
  if(m.legumes.length){
    h+='<div class="lab">'+L.legume+'</div><table>'
      +m.legumes.map(function(lp){
        var extra=[];
        if(lp.bread) extra.push('+ '+esc(lp.bread.main)+' '+esc(mixFoodName(lp.bread.n,lang)));
        if(lp.add) extra.push('+ '+esc(mixFoodName(lp.add.n,lang))+' '+esc(lp.add.main)+(lp.add.alt?' ('+esc(lp.add.alt)+')':''));
        extra.push('+ '+esc(lp.fat.txt));
        return '<tr><td>'+esc(mixFoodName(lp.leg.n,lang))+'</td><td class="q">'+esc(lp.leg.main)+'</td><td class="s">'+(lp.leg.alt?esc(lp.leg.alt):'')+'</td><td class="s">'+extra.join(' ')+'</td></tr>';
      }).join('')+'</table>';
  }
  return h+'</div>';
}
function mixPdfIdeasHtml(m,L,lang){
  if(!m.ideas.length) return '';
  return '<div class="meal">'+mixPdfMealHead(m,L)+'<div class="lab">'+L.ideas+'</div>'
    +m.ideas.slice(0,6).map(function(i){
      return '<div class="idea">'+i.foods.map(function(f){ return esc(mixFoodName(f.n,lang))+' <b>'+esc(mixPdfQty(f,lang))+'</b>'; }).join(' + ')+'</div>';
    }).join('')+'</div>';
}
function buildMixSheetHtml(c,lang){
  lang=(lang==='en')?'en':'el';
  var w=mixBuildWeek(c,lang); if(!w) return null;
  var L=MIX_PDF_TXT[lang], menu=w.menu, rules=menu.rules||{};
  // ομαδοποίηση ημερών με ίδιους στόχους γευμάτων
  var groups=[], bySig={};
  w.days.forEach(function(day){
    var sig=mixDaySig(day);
    if(bySig[sig]) bySig[sig].days.push(day);
    else { bySig[sig]={days:[day]}; groups.push(bySig[sig]); }
  });
  var now=new Date();
  var date=String(now.getDate()).padStart(2,'0')+'/'+String(now.getMonth()+1).padStart(2,'0')+'/'+now.getFullYear();
  var h='<button class="btn" onclick="window.print()">'+esc(L.print)+'</button>'
    +'<div class="hd"><div><h1>🧩 '+esc(L.title)+' — '+esc((c.name||'').split(' ')[0])+'</h1><div class="sub">'+esc(L.sub)+'</div></div><div class="sub">'+date+'</div></div>'
    +'<div class="how"><b>'+esc(L.how)+'</b><ul>'+L.howL.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>'
    +'<div class="rules"><b>'+esc(L.week)+'</b><span>🐟 '+L.fish+' '+(rules.fish!=null?rules.fish:2)+' '+L.times+'</span>'
    +'<span>🫘 '+L.legumes+' '+(rules.legumes!=null?rules.legumes:2)+' '+L.times+'</span>'
    +'<span>🥩 '+L.red+' '+(rules.redMeatMax!=null?rules.redMeatMax:2)+' '+L.times+'</span></div>';
  var hidden=menu.hiddenCombos||[];
  if(hidden.length) h+='<p class="warn"><b>'+esc(L.avoid)+':</b> '+hidden.map(function(p){ var a=p.split('|'); return esc(mixFoodName(a[0],lang))+' + '+esc(mixFoodName(a[1],lang)); }).join(' · ')+'</p>';
  groups.forEach(function(g){
    var d0=g.days[0];
    h+='<div class="group"><h2>'+g.days.map(function(x){return esc(x.label);}).join(' · ')+'</h2>'
      +'<div class="sub">'+esc(d0.sub)+' · '+d0.k+' '+L.kcal+(d0.oilOk?'':' · <span class="warn">'+esc(L.noOil)+'</span>')+'</div>';
    d0.meals.forEach(function(m){ h+=m.main?mixPdfMainHtml(d0,m,L,lang):mixPdfIdeasHtml(m,L,lang); });
    h+='</div>';
  });
  return {lang:lang,title:L.title+' — '+(c.name||''),html:h};
}
function exportMixPDF(lang){
  var c=getC();
  if(!c){ showErrorToast('Διάλεξε πρώτα πελάτη.'); return; }
  if(!mixIsActive(c)){ showErrorToast('Ο πελάτης δεν είναι σε Μενού επιλογών.'); return; }
  // χωρίς ρητή γλώσσα: όπως το «Στόχοι» — αγγλικά για en/ru/tr πελάτες, αλλιώς ελληνικά
  var sh=buildMixSheetHtml(c,lang||mixLang(c));
  if(!sh){ showErrorToast('Συμπλήρωσε βάρος, ύψος και ηλικία για να υπολογιστούν οι στόχοι.'); return; }
  var html='<!DOCTYPE html><html lang="'+sh.lang+'"><head><meta charset="UTF-8"><title>'+esc(sh.title)+'</title><style>'+MIX_PDF_CSS+'</style></head><body>'+sh.html+'</body></html>';
  var w=window.open('','_blank');
  if(!w){ showErrorToast('Ο browser μπλόκαρε το νέο παράθυρο — επίτρεψε τα pop-ups για να ανοίξει το PDF.'); return; }
  w.document.write(html); w.document.close();
  setTimeout(function(){ try{ w.print(); }catch(e){} },600);
}
