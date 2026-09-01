// js/portal-comms/portal-comms.js
// Two-way client-portal communication (no client login): dietitian-side reply +
// seen tracking for client notes and weekly plan-feedback, and the read-only panels
// that surface them. Extracted verbatim from js/app-part2.js (module split wave 27):
//   CLIENT_LOG_TAG_DEFS, noteReplyKey/isNoteReplied/markNoteReplied/replyToClientNote,
//   pfReplyKey/isPfReplied/markPfReplied/replyToPlanFeedback,
//   noteSeenKey/isNoteSeen/markNoteSeen, pfSeenKey/isPfSeen/markPfSeen,
//   isMatchDate (small match-day helper wedged in this run of the file),
//   clientLogsPanelHtml, PF_ROW_LABELS, pfStarsReadonly, planFeedbackPanelHtml,
//   dislikedRecipesPanelHtml, restoreDislikedRecipe.
// Only literal table initialisers run at parse time. Referenced (all typeof-guarded
// or runtime) by app-part5-home.js, appointments/appointments.js, client-list/roster-ui.js
// and renderMain. New js/portal-comms/ area; loads right after appointments/.

/* ── Body Composition & Consultation Tracker ────────────────────────────── */
// Καταχωρήσεις βάρους/σημειώσεων που έστειλε ο ίδιος ο πελάτης από το portal (client_logs, χωρίς login).
// Μόνιμο ιστορικό αναφοράς, μόνο για ανάγνωση — δεν μπαίνουν ποτέ αυτόματα ούτε με χειροκίνητη ενέργεια
// στο επίσημο weightLog, ώστε τα δικά του μέτρα να μη συγχέονται με τις επίσημες μετρήσεις του διαιτολόγου.
// Ο πελάτης μπορεί προαιρετικά να επισημάνει ένα πλαίσιο ημέρας (ταξίδι/γιορτή/αρρώστια) από το portal —
// αποθηκεύεται ως πρόθεμα "[tag:id] " μέσα στο ίδιο πεδίο note (καμία νέα στήλη στο client_logs), το ξεχωρίζουμε εδώ.
var CLIENT_LOG_TAG_DEFS={travel:{icon:'✈️',label:'Ταξίδι'},party:{icon:'🎉',label:'Γιορτή'},sick:{icon:'🤒',label:'Άρρωστος/η'}};
// "Έχω απαντήσει σε αυτή τη σημείωση" — αποθηκεύεται ΚΑΙ στο ίδιο το client (c.noteReplies,
// συγχρονισμένο cloud μέσω του κανονικού save()) ΚΑΙ στο localStorage (παλιό μονοπάτι, κρατιέται
// ως fallback ώστε ήδη-απαντημένες σημειώσεις να μη "ξαναφανούν" σε browsers που δεν έχουν
// ακόμα το νέο πεδίο). 2026-08-14: πριν ζούσε ΜΟΝΟ στο localStorage — αν ο διαιτολόγος άνοιγε
// την εφαρμογή από άλλη συσκευή, όλα ξαναφαίνονταν "αναπάντητα".
function noteReplyKey(token,date){ return 'fyh-note-replied-'+token+'-'+date; }
function isNoteReplied(c,date){
  if(c && c.noteReplies && c.noteReplies[date]) return true;
  if(!c || !c.shareToken) return false;
  try{ return localStorage.getItem(noteReplyKey(c.shareToken,date))==='1'; }catch(err){ return false; }
}
function markNoteReplied(c,date){
  if(!c) return;
  if(!c.noteReplies) c.noteReplies={};
  c.noteReplies[date]=true;
  if(c.shareToken){ try{ localStorage.setItem(noteReplyKey(c.shareToken,date),'1'); }catch(err){} }
}
// ↩️ Απάντησε πάνω σε μια σημείωση πελάτη — ίδιο μοτίβο με sendFeedbackReminder (js/app-part5-home.js):
// ανοίγει WhatsApp στο ΔΙΚΟ ΤΟΥ τηλέφωνο (c.phone, όχι τα clinic στοιχεία) με έτοιμο μήνυμα που
// παραθέτει τι είπε, mailto ως fallback αν δεν έχει τηλέφωνο, toast αν δεν έχει ούτε τα δύο.
function replyToClientNote(clientId,date,noteRaw){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  var fname=(c.name||'').split(' ')[0];
  var msg='Γεια σου '+fname+'! Είδα το μήνυμά σου: «'+noteRaw+'» — ';
  var phone=normalizePhoneIntl(c.phone);
  if(phone){
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
  } else if(c.email){
    location.href='mailto:'+encodeURIComponent(c.email).replace(/%40/g,'@')+'?subject='+encodeURIComponent('Απάντηση — Feed Your Health')+'&body='+encodeURIComponent(msg);
  } else {
    showErrorToast('Δεν υπάρχει τηλέφωνο ή email για τον/την '+(c.name||'πελάτη')+'.');
    return;
  }
  markNoteReplied(c,date);
  save();
  var s3b=document.getElementById('s3b');
  if(s3b && typeof getC==='function' && typeof buildAppointmentsHtml==='function'){
    var cur=getC(); if(cur) s3b.innerHTML=buildAppointmentsHtml(cur);
  }
}
function pfReplyKey(token,weekStart,key){ return 'fyh-pf-replied-'+token+'-'+weekStart+'-'+(key||'_general'); }
function isPfReplied(c,weekStart,key){
  var k=weekStart+'|'+(key||'_general');
  if(c && c.pfReplies && c.pfReplies[k]) return true;
  if(!c || !c.shareToken) return false;
  try{ return localStorage.getItem(pfReplyKey(c.shareToken,weekStart,key))==='1'; }catch(err){ return false; }
}
function markPfReplied(c,weekStart,key){
  if(!c) return;
  var k=weekStart+'|'+(key||'_general');
  if(!c.pfReplies) c.pfReplies={};
  c.pfReplies[k]=true;
  if(c.shareToken){ try{ localStorage.setItem(pfReplyKey(c.shareToken,weekStart,key),'1'); }catch(err){} }
}
// ↩️ Απάντησε σε feedback πλάνου — ίδιο μοτίβο με replyToClientNote. key=null (κουμπί δίπλα στο NPS)
// → γενικό μήνυμα, key='breakfast' κλπ (κουμπί πάνω σε συγκεκριμένη χαμηλή βαθμολογία) → μήνυμα με
// το όνομα της κατηγορίας και τους λόγους (low_rating_reasons) που επέλεξε ο πελάτης στο portal.
function replyToPlanFeedback(clientId,weekStart,key){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  var entries=window.Cloud&&window.Cloud.planFeedbackFor?window.Cloud.planFeedbackFor(c):[];
  var entry=entries.filter(function(e){return e.week_start===weekStart;})[0];
  if(!entry) return;
  var fname=(c.name||'').split(' ')[0];
  var msg;
  if(key){
    var reasons=((entry.low_rating_reasons||{})[key]||[]).join(', ');
    var lbl=(typeof PF_ROW_LABELS!=='undefined'&&PF_ROW_LABELS[key])||key;
    msg='Γεια σου '+fname+'! Είδα ότι το '+lbl+' σου φάνηκε λίγο'+(reasons?(' ('+reasons+')'):'')+' αυτή την εβδομάδα — ας το προσαρμόσουμε μαζί, πες μου τι θα σε βόλευε καλύτερα.';
  } else {
    msg='Γεια σου '+fname+'! Είδα το feedback σου για το πλάνο αυτής της εβδομάδας — θέλω να το προσαρμόσουμε ώστε να σου ταιριάζει καλύτερα. Πες μου τι σε δυσκόλεψε περισσότερο.';
  }
  var phone=normalizePhoneIntl(c.phone);
  if(phone){
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
  } else if(c.email){
    location.href='mailto:'+encodeURIComponent(c.email).replace(/%40/g,'@')+'?subject='+encodeURIComponent('Απάντηση — Feed Your Health')+'&body='+encodeURIComponent(msg);
  } else {
    showErrorToast('Δεν υπάρχει τηλέφωνο ή email για τον/την '+(c.name||'πελάτη')+'.');
    return;
  }
  markPfReplied(c,weekStart,key);
  save();
  var s3b=document.getElementById('s3b');
  if(s3b && typeof getC==='function' && typeof buildAppointmentsHtml==='function'){
    var cur=getC(); if(cur) s3b.innerHTML=buildAppointmentsHtml(cur);
  }
}
// "Το είδα" — ελαφρύτερο από το ↩️ Απάντησε (isNoteReplied/isPfReplied): δεν ανοίγει WhatsApp/email,
// απλά βγάζει το μήνυμα από τα "Αναπάντητα" στο "💬 Μηνύματα" (js/app-part5-home.js) όταν δεν χρειάζεται
// πραγματική απάντηση (π.χ. "όλα καλά, ευχαριστώ"). Ίδιο μοτίβο αποθήκευσης (client field + localStorage
// fallback) με markNoteReplied/markPfReplied, ξεχωριστό πεδίο ώστε να μη μπερδεύεται με "απαντήθηκε".
function noteSeenKey(token,date){ return 'fyh-note-seen-'+token+'-'+date; }
function isNoteSeen(c,date){
  if(c && c.noteSeen && c.noteSeen[date]) return true;
  if(!c || !c.shareToken) return false;
  try{ return localStorage.getItem(noteSeenKey(c.shareToken,date))==='1'; }catch(err){ return false; }
}
function markNoteSeen(c,date){
  if(!c) return;
  if(!c.noteSeen) c.noteSeen={};
  c.noteSeen[date]=true;
  if(c.shareToken){ try{ localStorage.setItem(noteSeenKey(c.shareToken,date),'1'); }catch(err){} }
}
function pfSeenKey(token,weekStart){ return 'fyh-pf-seen-'+token+'-'+weekStart; }
function isPfSeen(c,weekStart){
  if(c && c.pfSeen && c.pfSeen[weekStart]) return true;
  if(!c || !c.shareToken) return false;
  try{ return localStorage.getItem(pfSeenKey(c.shareToken,weekStart))==='1'; }catch(err){ return false; }
}
function markPfSeen(c,weekStart){
  if(!c) return;
  if(!c.pfSeen) c.pfSeen={};
  c.pfSeen[weekStart]=true;
  if(c.shareToken){ try{ localStorage.setItem(pfSeenKey(c.shareToken,weekStart),'1'); }catch(err){} }
}
// Μόνο για annotation στο ιστορικό — δεν ξέρει τίποτα για το εβδομαδιαίο override του πελάτη
// (αυτό ζει μόνο στο localStorage του πελάτη, ποτέ δεν φτάνει στο cloud), δείχνει μόνο τον
// ΜΟΝΙΜΟ κανόνα (c.matchDays) ώστε ο διαιτολόγος να ξέρει "αυτή η μέρα ήταν συνήθως αγώνας"
// όταν διαβάζει μια παλιά σημείωση/καταγραφή πελάτη.
function isMatchDate(c,dateStr){
  if(!c || !c.matchDays) return false;
  var dt=new Date(dateStr+'T12:00:00');
  if(isNaN(dt.getTime())) return false;
  var map=[6,0,1,2,3,4,5];
  return !!c.matchDays[map[dt.getDay()]];
}
function clientLogsPanelHtml(c){
  if(!window.Cloud || typeof window.Cloud.allClientLogsFor!=='function') return '';
  var entries=window.Cloud.allClientLogsFor(c);
  if(!entries.length) return '';
  var rows=entries.map(function(e){
    var w=e.weight_kg?('<b>'+e.weight_kg+' kg</b>'):'';
    var matchBadge=isMatchDate(c,e.date)?'<span title="Συνήθως μέρα αγώνα (μόνιμος κανόνας — μπορεί να άλλαξε αυτή τη βδομάδα από τον πελάτη)" style="margin-right:4px">⚽</span>':'';
    var noteRaw=e.note||'';
    var tagMatch=/^\[tag:(travel|party|sick)\]\s*/.exec(noteRaw);
    var tagHtml='';
    if(tagMatch){
      var td=CLIENT_LOG_TAG_DEFS[tagMatch[1]];
      noteRaw=noteRaw.slice(tagMatch[0].length);
      tagHtml='<span style="background:#e8f5e9;color:#014545;border-radius:999px;padding:2px 8px;font-size:10px;margin-right:6px;white-space:nowrap">'+td.icon+' '+td.label+'</span>';
    }
    var n=noteRaw?('<span style="color:#666">'+esc(noteRaw)+'</span>'):'';
    var replyBtn='';
    if(noteRaw){
      var replied=isNoteReplied(c,e.date);
      var noteJs=escJsAttr(noteRaw);
      replyBtn='<button type="button" class="note-reply-btn'+(replied?' replied':'')+'" onclick="event.stopPropagation();replyToClientNote(\''+c.id+'\',\''+e.date+'\',\''+noteJs+'\')">↩️ Απάντησε'+(replied?' ✓':'')+'</button>';
    }
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;font-size:11px">'
      +'<div style="flex:1;min-width:0">'+tagHtml+'<span>'+matchBadge+e.date+' — '+w+(w&&n?' · ':'')+n+'</span></div>'
      +replyBtn+'</div>';
  }).join('');
  return '<div class="tracker-section" style="background:#f1f8f6;border:1px solid #cfe8e0;border-radius:8px;padding:10px 12px;margin-bottom:10px">'
    +'<div style="font-size:11px;font-weight:700;color:#025857;margin-bottom:4px">📥 Ιστορικό καταχωρήσεων πελάτη <span style="font-weight:400;color:#666">(δικά του μέτρα — για σύγκριση, δεν επηρεάζουν το ιστορικό σου)</span></div>'
    +rows+'</div>';
}

// Εβδομαδιαίο ⭐ feedback πλάνου (plan_feedback) που στέλνει ο πελάτης χωρίς login — βλ. window.Cloud.planFeedbackFor.
// Οι λεγόμενες "reasons" εμφανίζονται μόνο όπου ο πελάτης βαθμολόγησε ≤2 αστέρια σε κάποια σειρά.
var PF_ROW_LABELS={breakfast:'Πρωινό',snacks:'Σνακ',lunch:'Μεσημεριανό',dinner:'Βραδινό',recipes_ease:'Ευκολία συνταγών',ingredients_ease:'Εύρεση υλικών',training_energy:'Ενέργεια προπόνησης'};
function pfStarsReadonly(val){
  if(!val)return '<span style="color:var(--text-muted)">—</span>';
  var s='';
  for(var i=1;i<=5;i++)s+='<span style="color:'+(i<=val?'#025857':'#d5e6e2')+'">★</span>';
  return s;
}
function planFeedbackPanelHtml(c){
  if(!window.Cloud || typeof window.Cloud.planFeedbackFor!=='function') return '';
  var entries=window.Cloud.planFeedbackFor(c);
  if(!entries.length) return '';
  var latest=entries[0];
  var reasons=latest.low_rating_reasons||{};
  var rowsHtml=Object.keys(PF_ROW_LABELS).map(function(key){
    var val=latest[key];
    // ✅ Τάση ανά κατηγορία: σύγκριση με την ΑΜΕΣΩΣ προηγούμενη εβδομάδα (entries[1], planFeedbackFor
    // είναι ήδη most-recent-first) — έτσι φαίνεται μια σιγά-σιγά πτωτική βαθμολογία πριν γίνει πρόβλημα,
    // χωρίς να χρειάζεται ξεχωριστό mini-γράφημα ανά σειρά.
    var prevVal=entries.length>1?entries[1][key]:null;
    var trendHtml='';
    if(val>0&&prevVal>0&&val!==prevVal){
      var up=val>prevVal;
      trendHtml='<span title="'+(up?'Καλύτερα':'Χειρότερα')+' από προηγούμενη εβδομάδα ('+prevVal+'→'+val+')" style="font-size:11px;font-weight:700;color:'+(up?'var(--good)':'#c62828')+'">'+(up?'▲':'▼')+'</span>';
    }
    var tags=(reasons[key]||[]).map(function(r){return '<span style="background:#fbe9e7;color:#c0392b;border-radius:999px;padding:2px 8px;font-size:10px;margin-left:4px;white-space:nowrap">'+esc(r)+'</span>';}).join('');
    var replyBtn='';
    if(val>0&&val<=2){
      var rowReplied=isPfReplied(c,latest.week_start,key);
      replyBtn='<button type="button" class="note-reply-btn'+(rowReplied?' replied':'')+'" style="margin-left:auto" onclick="event.stopPropagation();replyToPlanFeedback(\''+c.id+'\',\''+latest.week_start+'\',\''+key+'\')">↩️ Απάντησε'+(rowReplied?' ✓':'')+'</button>';
    }
    // ✨ Idea 1 (2026-08-14): ιστορικό ανά ερώτηση — πριν φαινόταν μόνο η τελευταία εβδομάδα + το
    // βελάκι ▲▼ έναντι της αμέσως προηγούμενης. Κλικ στη γραμμή ανοίγει mini-ιστορικό (ίδιο slice(0,4)
    // με το histBars του NPS πιο κάτω) ώστε να φαίνεται αν πέφτει σταθερά 2-3 εβδομάδες, όχι μόνο ότι
    // έπεσε σε σχέση με την προηγούμενη.
    var histId='pf-hist-'+key;
    var histRecent=entries.slice(0,4).filter(function(e){return e[key]>0;}).reverse();
    var histHtml='';
    if(histRecent.length>1){
      histHtml='<div class="pf-history" id="'+histId+'">'+histRecent.map(function(e,idx){
        var isNow=idx===histRecent.length-1;
        var hv=e[key];
        var hReasons=((e.low_rating_reasons||{})[key]||[]).join(', ');
        return '<div class="bar'+(isNow?' now':'')+'"><i style="height:'+Math.max(4,hv*7)+'px" title="'+hv+'/5"></i><b>'+esc((e.week_start||'').slice(5))+'</b>'+(hv<=2&&hReasons?'<span class="reason">'+esc(hReasons)+'</span>':'')+'</div>';
      }).join('')+'</div>';
    }
    // ⚠️ Το class="pf-row" (άρα και το cursor:pointer από CSS) μπαίνει ΜΟΝΟ όταν υπάρχει πραγματικό
    // ιστορικό να ανοίξει — αλλιώς η γραμμή έδειχνε "clickable" (χέρι στο hover) χωρίς να κάνει τίποτα.
    var expHint=histRecent.length>1?'<span class="pf-exp-hint">▾ ιστορικό</span>':'';
    var rowClass=histRecent.length>1?'pf-row':'';
    var rowClick=histRecent.length>1?(' onclick="var h=document.getElementById(\''+histId+'\');if(h)h.classList.toggle(\'open\')"'):'';
    return '<div>'
      +'<div class="'+rowClass+'"'+rowClick+' style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #eee;font-size:11px;flex-wrap:wrap">'
      +'<span style="width:150px;flex-shrink:0;color:#444">'+PF_ROW_LABELS[key]+'</span>'
      +'<span style="letter-spacing:1px;font-size:13px">'+pfStarsReadonly(val)+'</span>'+trendHtml+tags+replyBtn+expHint+'</div>'
      +histHtml
      +'</div>';
  }).join('');
  var nps=latest.continue_likelihood;
  var npsColor=nps==null?'#999':(nps>=8?'var(--good)':(nps>=5?'#c77d11':'#c0392b'));
  var npsBadge=nps==null?'':('<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;background:'+npsColor+'22;color:'+npsColor+'">'+nps+'/10 πιθανότητα συνέχισης</span>');
  var npsReplyBtn='';
  if(nps!=null && typeof PF_ATTENTION_NPS_MAX!=='undefined' && nps<=PF_ATTENTION_NPS_MAX){
    var npsReplied=isPfReplied(c,latest.week_start,null);
    npsReplyBtn='<button type="button" class="note-reply-btn'+(npsReplied?' replied':'')+'" onclick="event.stopPropagation();replyToPlanFeedback(\''+c.id+'\',\''+latest.week_start+'\',null)">↩️ Απάντησε'+(npsReplied?' ✓':'')+'</button>';
  }
  var histBars='';
  var recent=entries.slice(0,4).reverse();
  recent.forEach(function(e,idx){
    var isLast=idx===recent.length-1;
    var v=e.continue_likelihood;
    var h=v==null?4:Math.max(4,Math.round(v/10*40));
    histBars+='<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">'
      +'<div style="width:100%;max-width:22px;height:'+h+'px;background:'+(isLast?'#025857':'#cfe8e0')+';border-radius:4px 4px 0 0"></div>'
      +'<span style="font-size:9px;color:#888">'+esc((e.week_start||'').slice(5))+'</span></div>';
  });
  return '<div class="tracker-section" style="background:#f1f8f6;border:1px solid #cfe8e0;border-radius:8px;padding:10px 12px;margin-bottom:10px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:6px">'
    +'<div style="font-size:11px;font-weight:700;color:#025857">⭐ Feedback πλάνου <span style="font-weight:400;color:#666">(εβδομάδα '+esc(latest.week_start)+')</span></div>'
    +'<div style="display:flex;align-items:center;gap:6px">'+npsBadge+npsReplyBtn+'</div></div>'
    +rowsHtml
    +(entries.length>1?('<div style="display:flex;align-items:flex-end;gap:6px;height:44px;margin-top:10px">'+histBars+'</div>'):'')
    +'</div>';
}

// 👎'd recipes/combos block this client from getting them again (js/app-part4.js rateMeal,
// js/app-part3.js findBestRecipe/findSavedComboMatch/generateSmartMeal all skip anything in
// c.dislikedRecipeIds) but until now there was no way to SEE or reverse that list except by
// re-👍'ing the exact same meal if it ever got manually re-added — practically a one-way door.
// Resolves each id to a real name via findRecipeById() (static/custom recipes); falls back to
// the tracked name (TRACKING_DATA.recipes[id].name — for saved-combo signatures this is only the
// meal-slot label, e.g. "Μεσημεριανό", not a dish title — a known display-only limitation, not
// fixed here) or the raw id as a last resort so nothing renders blank.
function dislikedRecipesPanelHtml(c){
  var ids=c.dislikedRecipeIds||[];
  if(!ids.length) return '';
  var rowsHtml=ids.map(function(id){
    var recipe=(typeof findRecipeById==='function')?findRecipeById(id):null;
    var entry=(typeof TRACKING_DATA!=='undefined'&&TRACKING_DATA.recipes)?TRACKING_DATA.recipes[id]:null;
    var label=recipe?recipe.name:(entry?entry.name:id);
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid #f3d4d0;font-size:11.5px">'
      +'<span style="color:#444" title="'+esc(id)+'">'+esc(label)+'</span>'
      +'<button type="button" class="btn" style="padding:3px 9px;font-size:10.5px;background:var(--card-bg);color:#025857;border:1px solid #cfe8e0" onclick="restoreDislikedRecipe(\''+esc(id).replace(/'/g,"\\'")+'\')">↩️ Επαναφορά</button>'
      +'</div>';
  }).join('');
  // 🗒️ Renders inside buildTrackerHtml (Ανθρωπομετρία tab) even though this is a meal-preference
  // list, not a body-composition one — conceptually it belongs in "Πλάνο" instead. Left here
  // rather than moved: #s1/#s2 (Στοιχεία/Πλάνο) are built together by one much larger combined
  // template, so relocating this would mean re-rendering that whole meal-plan view (losing
  // scroll position/open accordions) every time someone restores a disliked recipe, instead of
  // just this small tab as today. Added a subtitle so it doesn't read as randomly dropped here
  // in the meantime — a real move needs to look at that s1/s2 render path first.
  return '<div class="tracker-section" style="background:#fdf3f2;border:1px solid #f3d4d0;border-radius:8px;padding:10px 12px;margin-bottom:10px">'
    +'<div style="font-size:11px;font-weight:700;color:#c0392b;margin-bottom:2px">👎 Συνταγές που δεν άρεσαν ('+ids.length+')</div>'
    +'<div style="font-size:9.5px;color:#c0392b;opacity:.75;margin-bottom:6px">Προτίμηση γεύματος, όχι σωματομετρία — εμφανίζεται εδώ για ευκολία όσο επεξεργάζεσαι αυτόν τον πελάτη</div>'
    +rowsHtml
    +'</div>';
}
function restoreDislikedRecipe(id){
  var c=getC();if(!c||!c.dislikedRecipeIds)return;
  var idx=c.dislikedRecipeIds.indexOf(id);
  if(idx===-1)return;
  c.dislikedRecipeIds.splice(idx,1);
  save();
  var s3=document.getElementById('s3');
  if(s3)s3.innerHTML=buildTrackerHtml(c);
}

