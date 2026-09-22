// js/leads/leads-state.js
// Lead/prospect pipeline — people who inquired but aren't clients yet. New top-level
// collection, sibling to `clients` but deliberately NOT stored on it (a lead has no plan,
// no weekPlan/supps/etc — forcing it through addClient()'s huge shape would mean carrying
// a pile of nutrition fields that make no sense pre-contract). Rides in the same Supabase
// user_data blob as a new key (see js/app-part7.js _pushNow/load/forceReloadFromCloud) —
// no new Supabase table, same precedent as savedCombos/tipsLibrary.
// Loads right after js/core/state.js, before js/leads/leads-tab.js.

var leads=[];

var LEAD_STAGES=['new','contacting','booked','client','lost'];
var LEAD_STAGE_LABELS={new:'Νέο',contacting:'Σε επικοινωνία',booked:'Ραντεβού κλεισμένο',client:'Έγινε πελάτης',lost:'Χάθηκε'};
var LEAD_SOURCES=['instagram','google','referral','site','fresha','other'];
var LEAD_SOURCE_LABELS={instagram:'Instagram',google:'Google',referral:'Παραπομπή',site:'Site',fresha:'Fresha',other:'Άλλο'};

function addLead(data){
  try{
    var id='lead_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
    var newLead={
      id:id,
      name:(data&&data.name||'').trim(),
      phone:(data&&data.phone||'').trim(),
      email:(data&&data.email||'').trim(),
      source:(data&&data.source)||'other',
      stage:'new',
      firstContactDate:(data&&data.firstContactDate)||new Date().toISOString().slice(0,10),
      notes:(data&&data.notes||'').trim(),
      createdAt:Date.now(),
      stageChangedAt:Date.now(),
      lastDietologistContact:null,
      convertedClientId:null,
      deleted:false
    };
    leads.push(newLead);
    save();
    return newLead;
  }catch(e){
    console.error('❌ Σφάλμα στη δημιουργία lead:', e.message);
    return null;
  }
}

function getLead(id){
  return leads.find(function(l){return l.id===id;});
}

function setLeadStage(id,stage){
  var lead=getLead(id);
  if(!lead || LEAD_STAGES.indexOf(stage)===-1) return;
  lead.stage=stage;
  lead.stageChangedAt=Date.now();
  save();
}

function deleteLead(id){
  var lead=getLead(id);
  if(!lead) return;
  lead.deleted=true;
  lead.deletedAt=new Date().toISOString();
  save();
}

// Δεν σβήνει/κρύβει το lead — μένει ορατό ως τερματική κάρτα "Έγινε πελάτης" (συνδεδεμένο
// με convertedClientId) ώστε να μη χάνεται το ιστορικό pipeline (πηγή, σημειώσεις, ημερομηνία
// πρώτης επικοινωνίας) τη στιγμή που κάποιος γίνεται πραγματικός πελάτης.
function convertLeadToClient(id){
  var lead=getLead(id);
  if(!lead) return null;
  addClient(lead.name);
  var c=getC();
  if(c){
    if(lead.phone) c.phone=lead.phone;
    if(lead.email) c.email=lead.email;
    lead.convertedClientId=c.id;
  }
  lead.convertedAt=new Date().toISOString();
  setLeadStage(id,'client');
  return c;
}
