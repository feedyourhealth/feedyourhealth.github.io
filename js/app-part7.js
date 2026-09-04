(function(){
  var Cloud = {
    enabled:false, sb:null, user:null, _t:null, _loaded:false, _authMode:'signin', _loadRetries:0,
    // Optimistic-locking version for user_data. 0 = "no row loaded/known yet" (safe to
    // plain-upsert, e.g. brand-new dietitian). >0 = last version we know the cloud row is
    // at; _pushNow() only writes if the row is still at exactly this version, otherwise
    // another tab/device saved first and we must not silently overwrite it.
    _version:0,

    init:function(){
      var self=this;
      try{
        if(!window.supabase || !window.SUPABASE_URL){
          // Συνήθως στιγμιαίο πρόβλημα internet ακριβώς όταν άνοιξε η σελίδα (π.χ. το wifi συνδέεται ακόμα) —
          // ξαναπροσπάθησε μόνο του μέχρι 3 φορές με αυξανόμενη καθυστέρηση πριν δείξουμε λάθος στον χρήστη.
          if(window.SUPABASE_URL && this._loadRetries<3){
            this._loadRetries++;
            console.warn('[CLOUD] supabase-js δεν φορτώθηκε, νέα προσπάθεια '+this._loadRetries+'/3...');
            setTimeout(function(){
              var s=document.createElement('script');
              s.src='vendor/supabase-js.min.js';
              s.onload=function(){ self.init(); };
              s.onerror=function(){ self.init(); };
              document.head.appendChild(s);
            }, 1200*this._loadRetries);
            return;
          }
          console.warn('[CLOUD] supabase-js δεν φορτώθηκε — τοπική λειτουργία');
          this._showLoadError();
          this._fallback();
          return;
        }
        this.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
        this.enabled = true;
        // Ανίχνευση επαναφοράς κωδικού (ο χρήστης ήρθε από link στο email)
        var isRecovery = (location.hash && location.hash.indexOf('type=recovery') !== -1);
        this.sb.auth.onAuthStateChange(function(event,session){
          if(event === 'PASSWORD_RECOVERY'){ self._recovery = true; self._showNewPassword(); return; }
          // Κράτα το self.user συγχρονισμένο με το πραγματικό session (το SDK ανανεώνει το token μόνο του στο παρασκήνιο).
          if(event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN'){ if(session && session.user) self.user = session.user; return; }
          if(event === 'SIGNED_OUT'){ self.user = null; return; }
        });
        this.sb.auth.getSession().then(function(res){
          if(self._recovery || isRecovery){ self._showNewPassword(); return; }  // μη μπεις στην app — όρισε κωδικό πρώτα
          var session = (res && res.data) ? res.data.session : null;
          if(session && session.user){ self.user = session.user; self._loadThenEnter(); }
          else { self._showLogin(); }
        }).catch(function(e){ console.error('[CLOUD] getSession', e); self._showLogin(); });
      }catch(e){ console.error('[CLOUD] init', e); this._fallback(); }
    },

    _fallback:function(){
      if(window.clients && window.clients.length > 0){ if(typeof goToApp==='function') goToApp(); }
      else { this._showLogin(); }
    },

    _showLogin:function(){
      var g=document.getElementById('app-loading-gate'); if(g) g.style.display='none';
      var lp=document.getElementById('login-page'), ac=document.getElementById('app-container');
      if(lp) lp.style.display='flex';
      if(ac) ac.style.display='none';
    },

    _enterApp:function(){ if(typeof goToApp==='function') goToApp(); if(typeof initOnboarding==='function') initOnboarding(); },

    // Μετά από επιτυχές login/session: αν υπάρχει ήδη τοπικό cache πελατών, μπες ΑΜΕΣΩΣ
    // στην εφαρμογή δείχνοντάς το και τράβα το cloud blob στο παρασκήνιο — μόλις έρθει,
    // ξανα-ζωγράφισε ό,τι άλλαξε. Χωρίς cache (πρώτη φορά σε αυτόν τον browser / νέος
    // λογαριασμός) κρατάμε την παλιά σειρά: περίμενε το load() πριν δείξεις κάτι, αλλιώς
    // ο χρήστης βλέπει άδεια λίστα που «γεμίζει» ένα κλάσμα του δευτερολέπτου μετά.
    _loadThenEnter:function(){
      var self=this;
      var haveCache=false;
      try{
        var cc=JSON.parse(localStorage.getItem('fyh_clients')||'null');
        haveCache=Array.isArray(cc)&&cc.length>0;
      }catch(e){}
      if(!haveCache){ this.load().then(function(){ self._enterApp(); }); return; }
      this._enterApp();
      this.load({background:true}).then(function(){ self._afterBackgroundLoad(); });
    },

    // Το cloud blob ήρθε αφού ο χρήστης έβλεπε ήδη το cache — συγχρόνισε την οθόνη.
    _afterBackgroundLoad:function(){
      try{
        if(typeof renderSB==='function') renderSB();
        if(typeof renderHome==='function') renderHome();
        // Αν είναι ανοιχτή καρτέλα πελάτη, ξαναφτιάξ' την — ΕΚΤΟΣ αν ο χρήστης
        // πληκτρολογεί εκείνη τη στιγμή σε πεδίο του #main (μη του «κόψεις» την επεξεργασία·
        // το load() έχει ήδη κρατήσει τα τοπικά σε αυτή την περίπτωση — βλ. guard εκεί).
        var ae=document.activeElement;
        var typing=!!(ae && ae.closest && ae.closest('#main') && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName||''));
        if(typeof curId!=='undefined' && curId && typeof renderMain==='function' && !typing) renderMain();
      }catch(e){ console.warn('[CLOUD] afterBackgroundLoad', e && e.message); }
    },

    _msg:function(text,isError){
      var el=document.getElementById('cloud-login-msg');
      if(el){ el.textContent=text||''; el.style.color=isError?'#c0392b':'#027a48'; }
    },

    // Το module του cloud (supabase-js, φορτώνει από CDN) απέτυχε να φορτώσει — συνήθως στιγμιαίο πρόβλημα
    // internet ακριβώς όταν άνοιξε η σελίδα. Δείχνουμε ένα ξεκάθαρο μήνυμα με σύνδεσμο "Δοκίμασε ξανά" αντί
    // να αφήνουμε τον χρήστη να βλέπει μόνο το γενικό "Λάθος email ή κωδικός" όταν πατήσει Σύνδεση.
    _showLoadError:function(){
      var el=document.getElementById('cloud-login-msg');
      if(el){
        el.innerHTML='⚠️ Δεν φορτώθηκε η σύνδεση με το cloud (πρόβλημα internet κατά το άνοιγμα). <a href="#" onclick="event.preventDefault();window.Cloud.retryLoad();">Δοκίμασε ξανά</a>';
        el.style.color='#c0392b';
      }
    },
    retryLoad:function(){
      this._loadRetries=0;
      this._msg('Επανασύνδεση...');
      this.init();
    },

    // Εναλλαγή καρτέλας: 'signin' (σύνδεση) ή 'signup' (νέος λογαριασμός)
    setAuthMode:function(mode){
      this._authMode = mode;
      this._msg('');
      var base='flex:1;padding:10px;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;';
      var active='background:var(--card-bg);color:#025857;box-shadow:0 1px 3px rgba(0,0,0,.12);';
      var inactive='background:transparent;color:#7aa6a2;box-shadow:none;';
      var ti=document.getElementById('tab-signin'), tu=document.getElementById('tab-signup');
      var btn=document.getElementById('cloud-primary-btn');
      var hint=document.getElementById('signup-hint'), forgot=document.getElementById('forgot-row');
      var pw=document.getElementById('cloud-pw');
      if(mode==='signup'){
        if(ti) ti.style.cssText=base+inactive;
        if(tu) tu.style.cssText=base+active;
        if(btn) btn.textContent='+ Δημιουργία Λογαριασμού';
        if(hint) hint.style.display='block';
        if(forgot) forgot.style.display='none';
        if(pw) pw.setAttribute('autocomplete','new-password');
      } else {
        if(ti) ti.style.cssText=base+active;
        if(tu) tu.style.cssText=base+inactive;
        if(btn) btn.textContent='✓ Σύνδεση';
        if(hint) hint.style.display='none';
        if(forgot) forgot.style.display='block';
        if(pw) pw.setAttribute('autocomplete','current-password');
      }
    },

    // Το κουμπί/Enter: καλεί signIn ή signUp ανάλογα με την καρτέλα
    submit:function(){
      var email=((document.getElementById('cloud-email')||{}).value||'').trim();
      var pw=(document.getElementById('cloud-pw')||{}).value||'';
      if(this._authMode==='signup') this.signUp(email,pw);
      else this.signIn(email,pw);
    },

    // ── 📲 ΔΗΜΟΣΙΕΥΣΗ ΠΛΑΝΟΥ (client portal) ────────────────────────────────
    // Η σταθερή διεύθυνση του portal (το link που στέλνεται στον πελάτη)
    PORTAL_BASE:'https://feedyourhealth.github.io/plan.html',
    // Πόσες μέρες μένει ενεργός ο σύνδεσμος πριν λήξει αυτόματα (κάθε ξαναδημοσίευση τον ανανεώνει).
    LINK_EXPIRE_DAYS:50,
    // Αλλάζει μόνο αν αλλάξει ο ίδιος ο αλγόριθμος του _hashPlan — έτσι ένα ήδη-δημοσιευμένο πλάνο με
    // hash από ΠΑΛΙΟ αλγόριθμο δεν φαίνεται ψευδώς "ξεπερασμένο" μόλις ανέβει νέος κώδικας (βλ. isStale).
    HASH_VER:2,
    // Στοιχεία επικοινωνίας γραφείου που εμφανίζονται στο κουμπί «Ρώτησέ με» του πελάτη.
    // Συμπληρώνονται από τον διαιτολόγο στις Ρυθμίσεις → «Στοιχεία επικοινωνίας» (βλ. saveClinicContact()),
    // όχι εδώ — έτσι ώστε το κουμπί να εμφανίζεται πραγματικά στον πελάτη μόλις μπουν στοιχεία.
    CLINIC:{
      wa:localStorage.getItem('fyh-clinic-wa')||'',
      tel:localStorage.getItem('fyh-clinic-tel')||'',
      email:localStorage.getItem('fyh-clinic-email')||''
    },

    publishPlan:function(c){
      var self=this;
      if(!this.enabled || !this.user){ return Promise.reject(new Error('Πρέπει να είσαι συνδεδεμένος στο cloud για να δημοσιεύσεις πλάνο.')); }
      if(!c){ return Promise.reject(new Error('Δεν υπάρχει επιλεγμένος πελάτης.')); }
      var snap;
      try{ snap=this._buildSnapshot(c); }catch(e){ return Promise.reject(e); }
      // Ξαναέλεγξε το session ΠΡΙΝ γράψεις — αν έχει λήξει στο παρασκήνιο (π.χ. καρτέλα ανοιχτή πολλή ώρα),
      // εδώ το πιάνουμε και δίνουμε καθαρό μήνυμα αντί για ακατανόητο σφάλμα RLS από τη βάση.
      return this.sb.auth.getSession().then(function(res){
        var session=(res&&res.data)?res.data.session:null;
        if(!session || !session.user){
          self.user=null; self._showLogin();
          throw new Error('Η σύνδεσή σου στο cloud έχει λήξει. Συνδέσου ξανά και ξαναπροσπάθησε.');
        }
        self.user=session.user;
        var doWrite=function(tok,isRetry){
          var expiresAt=new Date(Date.now()+self.LINK_EXPIRE_DAYS*86400000).toISOString();
          var row={token:tok, dietitian_id:session.user.id, snapshot:snap, client_name:c.name||'', updated_at:new Date().toISOString(), expires_at:expiresAt};
          return self.sb.from('shared_plans').upsert(row,{onConflict:'token'}).then(function(res2){
            if(res2.error){
              var isRlsErr=/row-level security/i.test(res2.error.message||'');
              // Αν αποτύχει λόγω κανόνα ασφαλείας ΚΑΙ δεν έχουμε ξαναδοκιμάσει ήδη: ίσως το υπάρχον token
              // δείχνει σε γραμμή που δημιουργήθηκε από ΑΛΛΟΝ λογαριασμό (π.χ. παλιό/δοκιμαστικό) — δοκίμασε
              // με ΝΕΟ token ώστε να γίνει καθαρή νέα εγγραφή αντί για update πάνω σε ξένη γραμμή.
              if(isRlsErr && !isRetry){
                var newTok=genSecureToken();
                c.shareToken=newTok;
                return doWrite(newTok,true);
              }
              if(isRlsErr){
                var detail=[res2.error.code,res2.error.details,res2.error.hint].filter(Boolean).join(' — ');
                throw new Error('Δεν επιτρέπεται η αποθήκευση του συνδέσμου (κανόνας ασφαλείας της βάσης). Χρειάζεται έλεγχος στο Supabase.'+(detail?' ['+detail+']':''));
              }
              // Οποιοδήποτε άλλο σφάλμα (δίκτυο, άλλος περιορισμός της βάσης) — μεταφρασμένο μήνυμα
              // αντί για το ακατέργαστο res2.error να φτάσει αυτούσιο (συχνά στα αγγλικά) σε
              // ελληνικό toast (audit finding Ε9). Το τεχνικό μήνυμα μένει σε παρένθεση για debugging.
              throw new Error('Απέτυχε η δημοσίευση του πλάνου. Δοκίμασε ξανά.'+(res2.error.message?' ['+res2.error.message+']':''));
            }
            c._publishedPlanHash=self._hashPlan(c.weekPlan);   // ώστε να ξέρουμε αν ο σύνδεσμος «μπαγιατεύει» μετά από επόμενη επεξεργασία
            c._publishedPlanHashVer=self.HASH_VER;
            try{ if(typeof save==='function') save(); }catch(e){}   // κράτα το shareToken στο cloud
            return {url:self.PORTAL_BASE+'?t='+tok, expiresAt:expiresAt};
          });
        };
        var tok=c.shareToken;
        if(!tok){ tok=genSecureToken(); c.shareToken=tok; }
        return doWrite(tok,false);
      });
    },

    unpublishPlan:function(c){
      if(!this.enabled || !this.user || !c || !c.shareToken) return Promise.resolve();
      var tok=c.shareToken, self=this;
      return this.sb.from('shared_plans').delete().eq('token',tok).then(function(res){
        if(res.error) throw res.error;
        delete c.shareToken;
        delete c._publishedPlanHash;
        delete c._publishedPlanHashVer;
        try{ if(typeof save==='function') save(); }catch(e){}
      });
    },

    // ── 📐 ΣΥΝΔΕΣΜΟΣ ΜΕΤΡΗΣΕΩΝ (metriseis.html) ─────────────────────────────
    // Ανεξάρτητο live link μόνο για τη σωματική σύνθεση — δικό του token (c.lipoToken),
    // δικός του μικρός πίνακας (lipo_snapshots, sql/2026-09-04_lipo_snapshots.sql), ΧΩΡΙΣ
    // λήξη (σε αντίθεση με το shared_plans/50 μέρες — η ιδέα είναι να μη χρειάζεται ποτέ
    // re-send: κάθε νέα μέτρηση απλώς ξαναδημοσιεύει στο ίδιο link). Δουλεύει ακόμα κι αν
    // ο πελάτης δεν έχει καθόλου πλάνο. Βλ. [[dietologist-lipometria-report-redesign]].
    LIPO_BASE:'https://feedyourhealth.github.io/metriseis.html',

    publishLipoSnapshot:function(c){
      var self=this;
      if(!this.enabled || !this.user){ return Promise.reject(new Error('Πρέπει να είσαι συνδεδεμένος στο cloud για να στείλεις σύνδεσμο μετρήσεων.')); }
      if(!c){ return Promise.reject(new Error('Δεν υπάρχει επιλεγμένος πελάτης.')); }
      var snap;
      try{ snap=this._buildLipoSnapshot(c); }catch(e){ return Promise.reject(e); }
      return this.sb.auth.getSession().then(function(res){
        var session=(res&&res.data)?res.data.session:null;
        if(!session || !session.user){
          self.user=null; self._showLogin();
          throw new Error('Η σύνδεσή σου στο cloud έχει λήξει. Συνδέσου ξανά και ξαναπροσπάθησε.');
        }
        self.user=session.user;
        var lang=(['en','ru','tr'].indexOf(c.lang)>-1)?c.lang:'el';
        var doWrite=function(tok,isRetry){
          var row={token:tok, dietitian_id:session.user.id, client_id:c.id||'', client_name:c.name||'', lang:lang, snapshot:snap, updated_at:new Date().toISOString()};
          return self.sb.from('lipo_snapshots').upsert(row,{onConflict:'token'}).then(function(res2){
            if(res2.error){
              var isRlsErr=/row-level security/i.test(res2.error.message||'');
              // Ίδιο fallback με το publishPlan: token από παλιά/ξένη γραμμή → δοκίμασε με ΝΕΟ token.
              if(isRlsErr && !isRetry){
                var newTok=genSecureToken();
                c.lipoToken=newTok;
                return doWrite(newTok,true);
              }
              if(isRlsErr){
                var detail=[res2.error.code,res2.error.details,res2.error.hint].filter(Boolean).join(' — ');
                throw new Error('Δεν επιτρέπεται η αποθήκευση του συνδέσμου μετρήσεων (κανόνας ασφαλείας της βάσης). Χρειάζεται έλεγχος στο Supabase.'+(detail?' ['+detail+']':''));
              }
              throw new Error('Απέτυχε η δημοσίευση των μετρήσεων. Δοκίμασε ξανά.'+(res2.error.message?' ['+res2.error.message+']':''));
            }
            try{ if(typeof save==='function') save(); }catch(e){}   // κράτα το lipoToken στο cloud
            return {url:self.LIPO_BASE+'?t='+tok};
          });
        };
        var tok=c.lipoToken;
        if(!tok){ tok=genSecureToken(); c.lipoToken=tok; }
        return doWrite(tok,false);
      });
    },

    // "🔄 Νέο link": σβήνει την τρέχουσα γραμμή και το token — η επόμενη sendLipoLink φτιάχνει
    // καθαρό, καινούριο link (ο παλιός σταματάει να δουλεύει αμέσως). Ανεξάρτητο από
    // unpublishPlan/shareToken.
    rotateLipoLink:function(c){
      if(!this.enabled || !this.user || !c || !c.lipoToken) return Promise.resolve();
      var tok=c.lipoToken;
      return this.sb.from('lipo_snapshots').delete().eq('token',tok).then(function(res){
        if(res.error) throw res.error;
        delete c.lipoToken;
        try{ if(typeof save==='function') save(); }catch(e){}
      });
    },

    // Μικρό, αυτοτελές payload — ό,τι χρειάζεται το metriseis.html και ΤΙΠΟΤΑ άλλο (χωρίς
    // εβδομαδιαίο πλάνο, λίστα ψώνια ή μηνύματα — βλ. σχόλιο πίνακα στο sql/). Λίγα KB ακόμα
    // και για πολυετή πελάτη.
    _buildLipoSnapshot:function(c){
      var wl=(c.weightLog||[]).slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
      var log=wl.map(function(e){
        return {date:e.date, kg:e.weight, bf:(e.bf>0?e.bf:null), bfMethod:e.bfMethod||null, sfProtocol:e.sfProtocol||null, sfFields:e.sfFields||null};
      });
      // Χωρίς καμία καταχώρηση tracker: ίδιο fallback με το exportLipometriaPDF — ένα στιγμιότυπο
      // από τα στοιχεία της καρτέλας (c.weight/c.bf) ώστε το link να μη δείχνει κενό, με flag
      // profileOnly ώστε το metriseis.html να το επισημάνει (⚠ στοιχεία προφίλ, όχι μέτρηση).
      var profileOnly=false;
      if(!log.length && (c.weight||c.bf)){
        log=[{date:new Date().toISOString().slice(0,10), kg:c.weight||null, bf:(c.bf>0?c.bf:null), bfMethod:null, sfProtocol:null, sfFields:null}];
        profileOnly=true;
      }
      // Μέση ημερήσια πρωτεΐνη του πλάνου — ίδιος υπολογισμός με το buildSuggestion() του
      // exportLipometriaPDF (js/reports/exports.js) — υπολογισμένη εδώ γιατί το metriseis.html
      // δεν έχει πρόσβαση στα FOODS/cm().
      var planProtG=null;
      if(c.weekPlan && typeof cm==='function'){
        var pT=0,pN=0;
        for(var pd=0;pd<7;pd++){
          var dm=c.weekPlan[pd]; if(!dm||!dm.length) continue;
          var dp=0; dm.forEach(function(m){ (m.foods||[]).forEach(function(f){ dp+=cm(f.n,f.g).p; }); });
          pT+=dp; pN++;
        }
        if(pN) planProtG=Math.round(pT/pN);
      }
      return {
        v:1,
        name:c.name||'', sex:c.sex||'M', age:c.age||null, height:c.height||null,
        goalBF:(typeof bfGoalTarget==='function')?bfGoalTarget(c):(c.goalBF||null),
        planProtG:planProtG,
        planGeneratedAt:c.planGeneratedAt||null,
        log:log,
        profileOnly:profileOnly
      };
    },

    // ── 📋 ΕΡΩΤΗΜΑΤΟΛΟΓΙΟ ΕΙΣΑΓΩΓΗΣ (intake.html) ──────────────────────────
    // Ξεχωριστός πίνακας client_intake (μία γραμμή ανά αποστολή, μοτίβο custom_recipes):
    // ο διαιτολόγος διαβάζει/γράφει τις δικές του γραμμές απευθείας (RLS)· ο πελάτης
    // (χωρίς λογαριασμό) μπαίνει μόνο από τα RPC get_intake / submit_intake. Ο σύνδεσμος
    // ΔΕΝ λήγει· status: 'sent' → 'submitted' (μία φορά, κλειδώνει) και νέα αποστολή
    // γυρίζει την παλιά γραμμή σε 'superseded'. Βλ. sql/2026-08-30_client_intake.sql.
    INTAKE_BASE:'https://feedyourhealth.github.io/intake.html',

    // Φτιάχνει ΝΕΟ σύνδεσμο ερωτηματολογίου για τον πελάτη. Αν υπάρχει ήδη ενεργός
    // ('sent'), τον κάνει 'superseded' πρώτα. lang: 'el' | 'en'. Resolve → {url, token}.
    sendIntake:function(c, lang){
      var self=this;
      if(!this.enabled || !this.user){ return Promise.reject(new Error('Πρέπει να είσαι συνδεδεμένος στο cloud για να στείλεις ερωτηματολόγιο.')); }
      if(!c || !c.id){ return Promise.reject(new Error('Δεν υπάρχει επιλεγμένος πελάτης.')); }
      var lg=(lang==='en')?'en':'el';
      return this.sb.auth.getSession().then(function(res){
        var session=(res&&res.data)?res.data.session:null;
        if(!session || !session.user){
          self.user=null; self._showLogin();
          throw new Error('Η σύνδεσή σου στο cloud έχει λήξει. Συνδέσου ξανά και ξαναπροσπάθησε.');
        }
        self.user=session.user;
        var uid=session.user.id;
        // 1) όσα ενεργά ('sent') → 'superseded'
        return self.sb.from('client_intake').update({status:'superseded'})
          .eq('dietitian_id',uid).eq('client_id',c.id).eq('status','sent').then(function(){
            // 2) νέα γραμμή
            var tok=genSecureToken();
            var prefill={ name:c.name||'', birthDate:c.birthDate||'', heightCm:(c.height!=null?c.height:null) };
            var row={ token:tok, dietitian_id:uid, client_id:c.id, client_name:c.name||'', status:'sent', lang:lg, prefill:prefill };
            return self.sb.from('client_intake').insert(row).then(function(res2){
              if(res2.error){
                var detail=[res2.error.code,res2.error.details,res2.error.hint].filter(Boolean).join(' — ');
                if(/row-level security/i.test(res2.error.message||''))
                  throw new Error('Δεν επιτρέπεται η αποθήκευση (κανόνας ασφαλείας της βάσης). Χρειάζεται έλεγχος στο Supabase.'+(detail?' ['+detail+']':''));
                if(/client_intake|does not exist|relation/i.test(res2.error.message||''))
                  throw new Error('Ο πίνακας client_intake δεν βρέθηκε — τρέξε το sql/2026-08-30_client_intake.sql στο Supabase.'+(detail?' ['+detail+']':''));
                throw new Error('Απέτυχε η δημιουργία του συνδέσμου. Δοκίμασε ξανά.'+(res2.error.message?' ['+res2.error.message+']':''));
              }
              c.intakeToken=tok;
              c.intakeLang=lg;
              c.intakeStatus='sent';
              c.intakeSentAt=new Date().toISOString();
              delete c.intakeSubmittedAt;
              delete c.intakeApplied; // Phase 2c: νέο ερωτηματολόγιο ⇒ ξανά μη-εφαρμοσμένο
              c._intakeFetchedAt=Date.now();
              try{ if(typeof save==='function') save(); }catch(e){}
              return { url:self.INTAKE_BASE+'?t='+tok, token:tok };
            });
          });
      });
    },

    // Διαβάζει την τρέχουσα κατάσταση του ενεργού συνδέσμου του πελάτη από τη βάση.
    // Ενημερώνει c.intakeStatus / c.intakeSubmittedAt. Resolve → true αν κάτι άλλαξε
    // σε σχέση με την cache (ώστε ο caller να ξανακάνει render), αλλιώς false.
    fetchIntakeStatus:function(c){
      var self=this;
      if(!this.enabled || !this.user || !c || !c.intakeToken) return Promise.resolve(false);
      return this.sb.from('client_intake').select('status,submitted_at').eq('token',c.intakeToken).maybeSingle().then(function(res){
        c._intakeFetchedAt=Date.now();
        if(res.error || !res.data) return false;
        var changed = (c.intakeStatus!==res.data.status) || (c.intakeSubmittedAt!==res.data.submitted_at);
        c.intakeStatus=res.data.status;
        c.intakeSubmittedAt=res.data.submitted_at||null;
        if(changed){ try{ if(typeof save==='function') save(); }catch(e){} }
        return changed;
      }).catch(function(){ return false; });
    },

    // Μαζικός έλεγχος κατάστασης για ΟΛΑ τα εκκρεμή ('sent') ερωτηματολόγια σε μία κλήση —
    // τροφοδοτεί το σήμα «εκκρεμεί» στην Αρχική (Upgrades Phase 2d) χωρίς να περιμένει να
    // ανοίξει ο διαιτολόγος κάθε πελάτη. Ενημερώνει c.intakeStatus/c.intakeSubmittedAt όπου
    // άλλαξε, ξανασχεδιάζει roster + Αρχική. Resolve → true αν κάτι άλλαξε.
    refreshIntakeStatuses:function(){
      var self=this;
      if(!this.enabled || !this.user) return Promise.resolve(false);
      var pend=(window.clients||[]).filter(function(c){ return c && c.intakeToken && c.intakeStatus==='sent' && !c.deleted; });
      if(!pend.length) return Promise.resolve(false);
      var tokens=pend.map(function(c){ return c.intakeToken; });
      return this.sb.from('client_intake').select('token,status,submitted_at').in('token',tokens).then(function(res){
        if(res.error){ console.error('[CLOUD] refreshIntakeStatuses', res.error); return false; }
        var byTok={}; (res.data||[]).forEach(function(r){ byTok[r.token]=r; });
        var changed=false;
        pend.forEach(function(c){
          var r=byTok[c.intakeToken]; if(!r) return;
          if(c.intakeStatus!==r.status || c.intakeSubmittedAt!==(r.submitted_at||null)){
            c.intakeStatus=r.status; c.intakeSubmittedAt=r.submitted_at||null; c._intakeFetchedAt=Date.now(); changed=true;
          }
        });
        if(changed){
          try{ if(typeof save==='function') save(); }catch(e){}
          if(typeof renderSB==='function') renderSB();
          if(curId===null && typeof renderHome==='function') renderHome();
        }
        return changed;
      }).catch(function(e){ console.error('[CLOUD] refreshIntakeStatuses network', e && e.message); return false; });
    },

    // Διαβάζει τις ΠΛΗΡΕΙΣ απαντήσεις (payload jsonb) του υποβληθέντος ερωτηματολογίου —
    // για το read-back panel στην καρτέλα πελάτη (Upgrades Phase 2b). Δεν γράφει τίποτα
    // στον πελάτη· ο caller (js/client-editor/intake.js) κρατά runtime-only cache ώστε το
    // whole-blob save στο cloud να μη φουσκώνει. Resolve → payload object | null.
    fetchIntakePayload:function(c){
      if(!this.enabled || !this.user || !c || !c.intakeToken) return Promise.resolve(null);
      return this.sb.from('client_intake').select('payload,status').eq('token',c.intakeToken).maybeSingle().then(function(res){
        if(res.error || !res.data || res.data.status!=='submitted') return null;
        return res.data.payload||null;
      }).catch(function(){ return null; });
    },

    // JSON.stringify με ταξινομημένα keys σε κάθε επίπεδο — έτσι το hash δεν αλλάζει μόνο και μόνο επειδή
    // η σειρά των keys άλλαξε (π.χ. το jsonb column στο Supabase ΔΕΝ εγγυάται διατήρηση της αρχικής σειράς
    // keys όταν αποθηκεύει/επιστρέφει ένα object — ένα Cloud.load() μετά τη δημοσίευση θα έδειχνε "ξεπερασμένο"
    // σύνδεσμο ακόμα κι αν το πλάνο είναι byte-για-byte το ίδιο περιεχόμενο).
    _stableStringify:function(v){
      if(v===null || typeof v!=='object') return JSON.stringify(v);
      var self=this;
      if(Array.isArray(v)) return '['+v.map(function(x){return self._stableStringify(x);}).join(',')+']';
      var keys=Object.keys(v).sort();
      return '{'+keys.map(function(k){ return JSON.stringify(k)+':'+self._stableStringify(v[k]); }).join(',')+'}';
    },
    // Απλό, μη κρυπτογραφικό hash — μόνο για να εντοπίζουμε ότι το πλάνο άλλαξε μετά τη δημοσίευση, χωρίς να διπλασιάζουμε το αποθηκευμένο μέγεθος με ολόκληρο clone.
    _hashPlan:function(weekPlan){
      var str=this._stableStringify(weekPlan||{}), h=0;
      for(var i=0;i<str.length;i++){ h=(Math.imul(31,h)+str.charCodeAt(i))|0; }
      return h;
    },

    // Το πλάνο δημοσιεύτηκε αλλά έχει επεξεργαστεί έκτοτε — ο σύνδεσμος του πελάτη δείχνει παλιά δεδομένα.
    // Αν το αποθηκευμένο hash είναι από ΠΑΛΙΟΤΕΡΗ έκδοση του αλγορίθμου (_publishedPlanHashVer δεν ταιριάζει
    // με το τρέχον HASH_VER), δεν το θεωρούμε "ξεπερασμένο" — απλά δεν ξέρουμε ακόμα, μέχρι την επόμενη
    // πραγματική δημοσίευση να ξαναγράψει hash+version με τον τρέχοντα αλγόριθμο.
    isStale:function(c){
      return !!(c && c.shareToken && c._publishedPlanHash!=null && c._publishedPlanHashVer===this.HASH_VER && this._hashPlan(c.weekPlan)!==c._publishedPlanHash);
    },

    // Μετατρέπει τον πελάτη σε καθαρό read-only snapshot για το portal.
    _buildSnapshot:function(c){
      var t=(typeof calcTDEE==='function')?calcTDEE(c):{};
      // lang-aware helpers — μεταφράζουν ονόματα τροφίμων/γευμάτων/ημερών μία φορά, στη γλώσσα του
      // πελάτη (c.lang), κατά το publish. Το plan.html είναι standalone αρχείο χωρίς πρόσβαση στη
      // βάση FOODS/EN_MEAL_NAMES, οπότε η μετάφραση περιεχομένου ΠΡΕΠΕΙ να γίνει εδώ, όχι client-side.
      // Σκόπιμα ΔΕΝ μεταφράζεται το matchTimeBucket (πρωί/μεσημέρι/απόγευμα/βράδυ) — το plan.html's
      // MATCH_TIME_H lookup είναι keyed σε αυτές τις ελληνικές λέξεις για τον υπολογισμό πριν/μετά
      // τον αγώνα· μια μεταφρασμένη τιμή θα έσπαγε σιωπηλά αυτόν τον υπολογισμό.
      // lang: γενικεύτηκε από binary isEn ώστε να καλύπτει ru/tr (βλ. [[dietologist-ru-tr-portal-prep]]) —
      // κάθε άγνωστη/λείπουσα τιμή c.lang πέφτει σε 'el', ποτέ σε μισομεταφρασμένη κατάσταση.
      var lang=(['en','ru','tr'].indexOf(c.lang)>-1)?c.lang:'el';
      var EN_DOW=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      var RU_DOW=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
      var TR_DOW=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
      var EL_DOW=['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
      var DAYS=({el:EL_DOW,en:EN_DOW,ru:RU_DOW,tr:TR_DOW})[lang];
      function fName(n){return (lang!=='el'&&typeof FOODS!=='undefined'&&FOODS[n]&&FOODS[n][lang])||n;}
      var MEAL_NAME_DICTS={en:(typeof EN_MEAL_NAMES!=='undefined'?EN_MEAL_NAMES:null),ru:(typeof RU_MEAL_NAMES!=='undefined'?RU_MEAL_NAMES:null),tr:(typeof TR_MEAL_NAMES!=='undefined'?TR_MEAL_NAMES:null)};
      var MEAL_FALLBACK={el:'Γεύμα',en:'Meal',ru:'Приём пищи',tr:'Öğün'};
      function mLabel(n){var dict=MEAL_NAME_DICTS[lang]; return (n&&dict&&dict[n])||n||MEAL_FALLBACK[lang];}
      var TIMES={
        'Πρωινό':(c.mealTimes&&c.mealTimes.breakfast)||'08:00',
        'Ενδιάμεσο':(c.mealTimes&&c.mealTimes.snack)||'11:00',
        'Δεκατιανό':(c.mealTimes&&c.mealTimes.snack)||'11:00',
        'Μεσημεριανό':(c.mealTimes&&c.mealTimes.lunch)||'13:00',
        'Απογευματινό':(c.mealTimes&&c.mealTimes.snack2)||'17:00',
        'Βραδινό':(c.mealTimes&&c.mealTimes.dinner)||'20:00'
      };
      function shortName(n){return String(n||'').replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim();}
      function macro(n,g){return (typeof cm==='function')?cm(n,g):{k:0,p:0,c:0,f:0};}

      // Αποκλεισμοί/αλλεργίες του πελάτη — ίδια λίστα με αυτή που ήδη φιλτράρει τον γεννήτορα πλάνου,
      // ώστε μια «εναλλακτική» πρόταση από τη βιβλιοθήκη ΑΛΛΟΥ πελάτη να μην περιέχει κάτι που αυτός αποφεύγει.
      var altExcl=(c.foodExclude||[]).slice();
      if(c.foodExclusions && Array.isArray(c.foodExclusions)){
        c.foodExclusions.forEach(function(food){ if(altExcl.indexOf(food)===-1)altExcl.push(food); });
      }
      if(c.allergies && typeof parseAllergies==='function'){
        parseAllergies(c.allergies).forEach(function(a){ if(altExcl.indexOf(a)===-1)altExcl.push(a); });
      }

      // ── Ημερήσια πλάνα ──
      var wp=c.weekPlan||{};
      // gLbl/tUnit: μεταφράζουν το "γρ." και τις μονάδες μέτρησης (φλ./τεμ./κ.σ./κ.γ./χούφτα κτλ, μέσω
      // του υπάρχοντος EN_UNITS) στην αγγλική έκδοση του πλάνου — πριν ο τρίτος tuFn ήταν πάντα identity,
      // οπότε οι ποσότητες έμεναν ελληνικές ακόμα και σε isEn=true (πραγματικό bug, βρέθηκε σε QA).
      var gLbl=({el:'γρ.',en:'g',ru:'г',tr:'g'})[lang];
      var UNIT_DICTS={en:(typeof EN_UNITS!=='undefined'?EN_UNITS:null),ru:(typeof RU_UNITS!=='undefined'?RU_UNITS:null),tr:(typeof TR_UNITS!=='undefined'?TR_UNITS:null)};
      function tUnit(u){var dict=UNIT_DICTS[lang]; return (dict&&dict[u])||u;}
      var fmtQ=(typeof fmtFoodQty==='function')?function(f){return fmtFoodQty(f,gLbl,tUnit);}:function(f){return {main:Math.round(f.g)+' '+gLbl,sub:''};};

      // 🥤 CHO Training Protocol (Phase 3) — per-training-day pre/during/post carb guidance,
      // pre-translated here (plan.html has no calc access). Emitted only when the dietitian has
      // opted the client in (c.choProtocol.enabled). Numbers come from the same computeCHOTargets
      // the dietitian sees in the day-targets panel.
      var CHO_TXT={
        el:{title:'Η διατροφή σου γύρω από την προπόνηση',pre:'Πριν',during:'Κατά',post:'Μετά',
          hBefore:'πριν',everyHr:'κάθε ώρα',within:'μέσα σε',mn:'′',perHr:'g/ώρα',approx:'~',
          na:'δεν χρειάζεται (σύντομη συνεδρία)',
          preEg:'π.χ. μπανάνα + ψωμί με μέλι',durEg:'π.χ. αθλητικό ποτό ή gel + νερό',postEg:'π.χ. ρύζι + κοτόπουλο ή smoothie',
          why:'Γεμάτες αποθήκες ενέργειας πριν, σταθερή ενέργεια στη διάρκεια, γρήγορη ανάκαμψη μετά — χωρίς βάρος στο στομάχι.',
          note:'Οι ποσότητες είναι μέσα στο ημερήσιο σύνολό σου, όχι επιπλέον. Αν η προπόνηση είναι πιο σύντομη ή χαλαρή, μείωσέ τες.',
          foot:'Ενδεικτικά τρόφιμα — δες το πλήρες πλάνο για τις ακριβείς μερίδες.'},
        en:{title:'Fuelling around your training',pre:'Before',during:'During',post:'After',
          hBefore:'before',everyHr:'every hour',within:'within',mn:' min',perHr:'g/hr',approx:'~',
          na:'not needed (short session)',
          preEg:'e.g. banana + bread with honey',durEg:'e.g. a sports drink or a gel + water',postEg:'e.g. rice + chicken or a smoothie',
          why:'Full energy stores before you start, steady energy through the session, fast recovery afterwards — without a heavy stomach.',
          note:'These amounts are part of your daily total, not extra. If the session is shorter or easier, scale them down.',
          foot:'Example foods — see your full plan for exact portions.'},
        ru:{title:'Питание вокруг тренировки',pre:'До',during:'Во время',post:'После',
          hBefore:'до',everyHr:'каждый час',within:'в течение',mn:' мин',perHr:'г/час',approx:'~',
          na:'не требуется (короткая сессия)',
          preEg:'напр. банан + хлеб с мёдом',durEg:'напр. спортивный напиток или гель + вода',postEg:'напр. рис + курица или смузи',
          why:'Полные запасы энергии до старта, ровная энергия во время, быстрое восстановление после — без тяжести в желудке.',
          note:'Эти количества входят в дневную норму, а не сверх неё. Если тренировка короче или легче — уменьшите.',
          foot:'Примерные продукты — точные порции в вашем плане.'},
        tr:{title:'Antrenman çevresinde beslenme',pre:'Önce',during:'Sırasında',post:'Sonra',
          hBefore:'önce',everyHr:'her saat',within:'içinde',mn:' dk',perHr:'g/saat',approx:'~',
          na:'gerekmez (kısa seans)',
          preEg:'örn. muz + ballı ekmek',durEg:'örn. spor içeceği veya jel + su',postEg:'örn. pilav + tavuk veya smoothie',
          why:'Başlamadan önce dolu enerji depoları, seans boyunca istikrarlı enerji, sonrasında hızlı toparlanma — mideyi ağırlaştırmadan.',
          note:'Bu miktarlar günlük toplamının içindedir, ekstra değildir. Seans daha kısa veya hafifse azalt.',
          foot:'Örnek besinler — kesin porsiyonlar için tam planına bak.'}
      };
      var choTxt=CHO_TXT[lang]||CHO_TXT.el;
      function buildDayCho(dayIdx){
        if(!c.choProtocol||!c.choProtocol.enabled||typeof computeCHOTargets!=='function')return null;
        var cr=null; try{cr=computeCHOTargets(c,t,dayIdx);}catch(e){cr=null;}
        if(!cr||(!cr.isTrainingDay&&!cr.isMatchDay))return null;
        var leadH=Math.max(1,Math.round((cr.pre.leadMin||120)/60));
        return {
          title:choTxt.title, sessionStart:cr.sessionStart||'', why:choTxt.why, note:choTxt.note, foot:choTxt.foot,
          pre:{grams:cr.pre.grams, time:cr.pre.timeLabel||'', label:choTxt.pre, sub:leadH+'h '+choTxt.hBefore, eg:choTxt.preEg},
          during:cr.during.applicable
            ? {applicable:true, perHour:cr.during.gramsPerHour, total:cr.during.totalGrams,
               label:choTxt.during, sub:choTxt.everyHr, unit:choTxt.perHr, approx:choTxt.approx, eg:choTxt.durEg}
            : {applicable:false, label:choTxt.during, sub:choTxt.na, eg:''},
          post:{grams:cr.post.grams, time:cr.post.timeLabel||'', label:choTxt.post,
                sub:choTxt.within+' '+(cr.post.windowMin||30)+choTxt.mn, eg:choTxt.postEg}
        };
      }

      var days=[];
      for(var d=0; d<7; d++){
        var dm=wp[d]||[];
        var meals=[], dayK=0, dP=0,dC=0,dF=0,dFi=0;
        // Bug: κάθε μέρα έχει (συνήθως) ΔΥΟ γεύματα με το ίδιο literal name 'Ενδιάμεσο' (πρωινό +
        // απογευματινό ενδιάμεσο — genPlan() τα δημιουργεί έτσι, βλ. [[dietologist-reordermeals-bug]]),
        // και σπανιότερα τρίτο (π.χ. διπλή προπόνηση στην ίδια μέρα), αλλά το TIMES lookup παρακάτω γίνεται
        // by-name, οπότε όλα έπαιρναν την ίδια ώρα (c.mealTimes.snack) στο client link, ενώ το modal
        // «Ώρες Γευμάτων» έχει ξεχωριστά πεδία snack/snack2/snack3. snackSeen μετράει πόσα 'Ενδιάμεσο'/
        // 'Δεκατιανό' έχουμε ήδη περάσει μέσα στην ίδια μέρα ώστε το καθένα να πάρει τη σωστή ώρα.
        var snackSeen=0;
        dm.forEach(function(meal){
          var foods=[], mk=0,mp=0,mc=0,mf=0,mfi=0;
          (meal.foods||[]).forEach(function(f){
            var v=macro(f.n,f.g);
            mk+=v.k; mp+=v.p; mc+=v.c; mf+=v.f; mfi+=(v.fi||0);
            var q=fmtQ(f);
            foods.push({name:fName(f.n), qty:q.main, sub:q.sub||'', g:Math.round(f.g)});
          });
          dayK+=mk; dP+=mp; dC+=mc; dF+=mf; dFi+=mfi;
          // Ε14: δίπλα σε κάθε τρόφιμο στην κάρτα "Η διατροφή μου σήμερα" της Αρχικής, ώστε ο πελάτης
          // να βλέπει τη μερίδα χωρίς να ανοίγει το tab Πλάνο — πάντα σε γραμμάρια (όχι τη μονάδα
          // εμφάνισης π.χ. "τεμ."), γι' αυτό x.g εδώ και όχι x.qty.
          var title=foods.map(function(x){return shortName(x.name)+' ('+x.g+' '+gLbl+')';}).slice(0,3).join(', ')+(foods.length>3?'…':'');
          var alternates=[];
          if(typeof findMealAlternates==='function'){
            findMealAlternates(meal, c.dietType||'normal', c.id, mk, 3, altExcl).forEach(function(a){
              var af=[], ak=0;
              (a.foods||[]).forEach(function(f){
                var v=macro(f.n,f.g);
                ak+=v.k;
                var q=fmtQ(f);
                af.push({name:shortName(fName(f.n)), qty:q.main, sub:q.sub||''});
              });
              var altTitle=af.map(function(x){return x.name;}).slice(0,3).join(', ')+(af.length>3?'…':'');
              alternates.push({name:altTitle, kcal:Math.round(ak), foods:af});
            });
          }
          var mealTime;
          if(meal.name==='Ενδιάμεσο'||meal.name==='Δεκατιανό'){
            snackSeen++;
            // 1η εμφάνιση→snack, 2η→snack2, 3η+→snack3 (π.χ. διπλή προπόνηση στην ίδια μέρα). Πάνω
            // από 3 'Ενδιάμεσα' στην ίδια μέρα είναι εξαιρετικά σπάνιο· η 4η+ επαναχρησιμοποιεί το snack3.
            if(snackSeen>=3) mealTime=(c.mealTimes&&c.mealTimes.snack3)||'21:00';
            else if(snackSeen===2) mealTime=(c.mealTimes&&c.mealTimes.snack2)||'17:00';
            else mealTime=TIMES[meal.name]||'';
          } else {
            mealTime=TIMES[meal.name]||'';
          }
          meals.push({
            label:mLabel(meal.name),
            time:mealTime,
            title:title,
            // Όνομα έτοιμου/branded πιάτου — γραμμή-τίτλος πάνω από τα υλικά ώστε ο πελάτης να το
            // παραγγείλει με το όνομά του. Μένει αυτούσιο σε κάθε γλώσσα (brand name, δεν μεταφράζεται).
            dishLabel:(meal.dishLabels&&meal.dishLabels.length)?meal.dishLabels.join(' + '):'',
            kcal:Math.round(mk),
            macros:{p:Math.round(mp),c:Math.round(mc),f:Math.round(mf)},
            foods:foods,
            alternates:alternates
          });
        });
        days.push({
          label:DAYS[d],
          isTrain:!!(c.trainDays&&c.trainDays[d]),
          isMatch:!!(c.matchDays&&c.matchDays[d]),
          matchTime:c.matchTimeBucket||'απόγευμα',
          kcal:Math.round(dayK),
          macros:{p:Math.round(dP),c:Math.round(dC),f:Math.round(dF)},
          fiber:Math.round(dFi*10)/10,
          cho:buildDayCho(d),
          meals:meals
        });
      }

      // ── Λίστα ψώνια (ίδια λογική με το PDF) ──
      // rawLabel: μεταφράζει τα ελάχιστα ελληνικά γένη/πληθυντικούς του COOKED_TO_RAW.label
      // ('ωμό'/'ωμά'/'ωμές'/'ωμή'/'ωμός'/'ξερά'/'ξερές'/'ξερή'/'τεμ.'/'κονσέρβα (στρ.)') σε μία
      // ενιαία αγγλική λέξη — δεν χρειάζεται γραμματικό γένος στα αγγλικά.
      var EN_RAW_LABEL={'ωμό':'raw','ωμά':'raw','ωμές':'raw','ωμή':'raw','ωμός':'raw','ξερά':'dried','ξερές':'dried','ξερή':'dried','τεμ.':'pc.','κονσέρβα (στρ.)':'canned (drained)'};
      var RU_RAW_LABEL={'ωμό':'сырое','ωμά':'сырые','ωμές':'сырые','ωμή':'сырая','ωμός':'сырой','ξερά':'сушёные','ξερές':'сушёные','ξερή':'сушёная','τεμ.':'шт.','κονσέρβα (στρ.)':'консерв. (без жидк.)'};
      var TR_RAW_LABEL={'ωμό':'çiğ','ωμά':'çiğ','ωμές':'çiğ','ωμή':'çiğ','ωμός':'çiğ','ξερά':'kurutulmuş','ξερές':'kurutulmuş','ξερή':'kurutulmuş','τεμ.':'adet','κονσέρβα (στρ.)':'konserve (süzülmüş)'};
      var RAW_LABEL_DICTS={en:EN_RAW_LABEL,ru:RU_RAW_LABEL,tr:TR_RAW_LABEL};
      function rawLabel(lbl){var dict=RAW_LABEL_DICTS[lang]; return (dict&&dict[lbl])||lbl;}
      function shopRound(g){if(g<100)return Math.ceil(g/10)*10;if(g<500)return Math.ceil(g/25)*25;if(g<1000)return Math.ceil(g/50)*50;return Math.ceil(g/100)*100;}
      function shopDisp(g){if(g>=1000)return decSep((Math.round(g/100)/10).toFixed(1))+' kg';return g+' g';}
      // decSep: μόνο τα αγγλικά χρησιμοποιούν τελεία ως δεκαδικό διαχωριστικό — ελληνικά, ρωσικά και
      // τουρκικά χρησιμοποιούν κόμμα, άρα η λογική ήδη ήταν σωστή για ru/tr (isEn=false → κόμμα) χωρίς αλλαγή εδώ.
      function decSep(s){return lang==='en'?s:String(s).replace('.',',');}
      var totals={};
      for(var sd=0; sd<7; sd++){ (wp[sd]||[]).forEach(function(m){(m.foods||[]).forEach(function(f){totals[f.n]=(totals[f.n]||0)+f.g;});}); }
      var slCats=['Κρέας','Ψάρια','Αυγά/Γαλακτ.','Δημητριακά','Όσπρια','Λαχανικά','Φρούτα','Ξηροί καρποί','Λάδια','Συνταγές FYH'];
      var CAT_NAME_DICTS={en:(typeof EN_CAT_NAMES!=='undefined'?EN_CAT_NAMES:null),ru:(typeof RU_CAT_NAMES!=='undefined'?RU_CAT_NAMES:null),tr:(typeof TR_CAT_NAMES!=='undefined'?TR_CAT_NAMES:null)};
      var CAT_FALLBACK={en:{'Άλλα':'Other'},ru:{'Άλλα':'Другое'},tr:{'Άλλα':'Diğer'}};
      function catLabel(cat){var dict=CAT_NAME_DICTS[lang],fb=CAT_FALLBACK[lang]; return (dict&&dict[cat])||(fb&&fb[cat])||cat;}
      var byCat={};
      Object.keys(totals).forEach(function(name){
        var cat=(typeof FOODS!=='undefined'&&FOODS[name]&&FOODS[name].cat)||'Άλλα';
        var planG=Math.round(totals[name]);
        var conv=(typeof COOKED_TO_RAW!=='undefined')?COOKED_TO_RAW[name]:null;
        var buy,raw='';
        if(conv&&conv.isEgg){ buy=Math.ceil(planG/55)+' '+rawLabel('τεμ.'); raw='('+planG+' g)'; }
        else if(conv){ buy=shopDisp(shopRound(planG*conv.f)); raw=rawLabel(conv.label); }
        else { buy=shopDisp(shopRound(planG)); }
        (byCat[cat]=byCat[cat]||[]).push({name:shortName(fName(name)), buy:buy, raw:raw});
      });
      var shopping=[];
      slCats.concat(['Άλλα']).forEach(function(cat){ if(byCat[cat]&&byCat[cat].length) shopping.push({cat:cat,catLabel:catLabel(cat),items:byCat[cat]}); });

      // ── Συμπληρώματα (ίδια λογική με το PDF: Page 1 c.supps + Page 2 c.selectedSupplements) ──
      // EN_SUPP_TIMING: οι λίγες σταθερές ώρες λήψης (ti.t) που εμφανίζονται σε ΟΛΑ τα SUPPS — δεν
      // υπάρχει ανά-item αγγλική εκδοχή τους στη βάση (μόνο τα ονόματα έχουν nameEn), οπότε μεταφράζονται εδώ.
      var EN_SUPP_TIMING={'Αμέσως μετά προπόνηση':'Right after training','Βραδινό':'Dinner','Με το πρωινό':'With breakfast','Μεσημεριανό':'Lunch',"Πριν προπόνηση (30')":"Before training (30')",'Πριν το πρωινό':'Before breakfast','Πριν τον ύπνο':'Before bed'};
      var RU_SUPP_TIMING={'Αμέσως μετά προπόνηση':'Сразу после тренировки','Βραδινό':'Ужин','Με το πρωινό':'С завтраком','Μεσημεριανό':'Обед',"Πριν προπόνηση (30')":'За 30 мин до тренировки','Πριν το πρωινό':'Перед завтраком','Πριν τον ύπνο':'Перед сном'};
      var TR_SUPP_TIMING={'Αμέσως μετά προπόνηση':'Antrenmandan hemen sonra','Βραδινό':'Akşam yemeği','Με το πρωινό':'Kahvaltıyla birlikte','Μεσημεριανό':'Öğle yemeği',"Πριν προπόνηση (30')":'Antrenmandan 30dk önce','Πριν το πρωινό':'Kahvaltıdan önce','Πριν τον ύπνο':'Yatmadan önce'};
      var SUPP_TIMING_DICTS={en:EN_SUPP_TIMING,ru:RU_SUPP_TIMING,tr:TR_SUPP_TIMING};
      function suppTime(t){var dict=SUPP_TIMING_DICTS[lang]; return (dict&&dict[t])||t;}
      // nameField/doseField/dField: το SUPPS literal ονομάζει τα μεταφρασμένα πεδία nameEn/nameRu/nameTr
      // (dose: doseEn/doseRu/doseTr, timing[].d: dEn/dRu/dTr) — bare suffix, ίδιο μοτίβο με το FOODS[n][lang]
      // παραπάνω αλλά με "name"/"dose"/"d" ως πρόθεμα αντί για ξεχωριστό κλειδί ανά γλώσσα.
      var LANG_SUFFIX={en:'En',ru:'Ru',tr:'Tr'};
      var suppSfx=LANG_SUFFIX[lang]||'';
      function suppNameByText(n){
        if(!suppSfx||typeof SUPPS==='undefined')return n;
        var f=null; SUPPS.forEach(function(x){if(x.name===n)f=x;});
        return (f&&f['name'+suppSfx])||n;
      }
      var supps=[], suppSeen={};
      // Step 1: όσα λαμβάνει ήδη (από τα checkboxes, με ώρες λήψης)
      (c.supps||[]).forEach(function(id){
        var sx=null; if(typeof SUPPS!=='undefined') SUPPS.forEach(function(x){if(x.id===id)sx=x;});
        if(!sx)return;
        var times=[], dose='', doseTr='';
        (sx.timing||[]).forEach(function(ti){
          if(c.suppExclude && c.suppExclude.indexOf(id+'|'+ti.t)>-1) return;
          times.push(suppTime(ti.t)); if(!dose&&ti.d){dose=ti.d;doseTr=(suppSfx&&ti['d'+suppSfx])||ti.d;}
        });
        if(!times.length)return;
        suppSeen[sx.name]=1;
        supps.push({name:(suppSfx&&sx['name'+suppSfx])||sx.name, dose:(suppSfx?(doseTr||sx['dose'+suppSfx]):dose)||sx.dose||'', timing:times.join(', ')});
      });
      // Step 2: προτεινόμενα από την ανάλυση κενών (δεν υπάρχουν ώρες λήψης εδώ)
      (c.selectedSupplements||[]).forEach(function(su){
        var nm=su&&su.supplement; if(!nm||suppSeen[nm])return;
        suppSeen[nm]=1;
        supps.push({name:suppNameByText(nm), dose:(su.dose||su.info||''), timing:''});
      });

      // ── Πρόοδος ──
      var wl=(c.weightLog||[]).slice().sort(function(a,b){return a.date<b.date?-1:1;});
      var log=wl.map(function(e){
        var bf=e.bf>0?e.bf:null;
        var lbm=bf?+(e.weight*(1-bf/100)).toFixed(1):null;
        return {date:e.date, kg:e.weight, bf:bf, lbm:lbm};
      });
      var lastE=wl.length?wl[wl.length-1]:null;
      var lastLog=log.length?log[log.length-1]:null;
      var progress={
        start: log.length?log[0].kg:(c.weight||null),
        current: log.length?log[log.length-1].kg:(c.weight||null),
        goal: c.goalWeight||c.targetWeight||null,
        goalBF: c.goalBF||null,
        log: log,
        waist:(lastE&&lastE.waist)||null,
        bodyfat:(lastLog&&lastLog.bf)||c.bf||null,
        lbm:(lastLog&&lastLog.lbm)||c.lbm||null,
        showBFBands: !!c.portalShowBFBands
      };

      var hb=t.hydBase||Math.round((c.weight||70)*35);
      var ht=t.hydTrain||(hb+500);
      var hm=hb+800; // ημέρα αγώνα: μεγαλύτερη απώλεια υγρών από απλή προπόνηση

      // ── Λίστα ανταλλαγής φρούτων ── κρύβεται σε κετογονική δίαιτα, όπου τα φρούτα δεν προβλέπονται.
      var fruits=[];
      if(c.dietType!=='keto' && typeof FX!=='undefined'){
        FX.forEach(function(fx){
          var kcal=(typeof FOODS!=='undefined'&&FOODS[fx.n])?Math.round(FOODS[fx.n].k*fx.g/100):null;
          var porField=(suppSfx&&fx['por'+suppSfx])||fx.por;
          fruits.push({name:fName(fx.n), portion:porField, g:fx.g, kcal:kcal});
        });
      }

      var clinic=this.CLINIC||{};
      var hasContact=!!(clinic.wa||clinic.tel||clinic.email);
      return {
        v:1,
        lang:c.lang||'el',
        name:c.name||'',
        sex:c.sex||'M',
        age:c.age||null,
        height:c.height||null,
        publishedAt:new Date().toISOString(),
        coachNote:(c.portalNote||'').trim(),
        contact:hasContact?{wa:clinic.wa||'',tel:clinic.tel||'',email:clinic.email||''}:null,
        targets:{kcal:Math.round(t.target||0), p:Math.round(t.p||0), c:Math.round(t.carb||0), f:Math.round(t.f||0)},
        hydration:{baseMl:hb, trainMl:ht, matchMl:hm, glassMl:250},
        days:days,
        shopping:shopping,
        supps:supps,
        fruits:fruits,
        progress:progress,
        exclusions:altExcl.map(function(x){return shortName(fName(x));}),
        // Βιβλιοθήκη tips (tab "📚 Tips") — μία κοινή λίστα, ίδια για όλους τους πελάτες, οπότε
        // περνάει αυτούσια (όχι φιλτραρισμένη ανά c.*), εκτός από τα tips με visible:false
        // ("Ορατό στους πελάτες" off — π.χ. πρόχειρο υπό συγγραφή), που δεν πρέπει να φτάσουν σε
        // κανέναν πελάτη. Το plan.html διαλέγει titleEn/bodyEn/... ανάλογα με c.lang (tipField(),
        // ίδιο μοτίβο suffix με τα supps παραπάνω). Παλιά shared_plans links (πριν το feature)
        // δεν είχαν αυτό το πεδίο — το plan.html πέφτει τότε στο παλιό στατικό FAQ μέχρι ο
        // πελάτης να ξαναπάρει link.
        tips:(typeof getTipsLibrary==='function'?getTipsLibrary().filter(function(t){return t.visible!==false;}):[])
      };
    },

    // ✅ audit fix (2026-08-16): the submit button used to stay clickable for the whole network
    // round-trip — only the status text changed to "Σύνδεση..." — so a fast double-click/double-Enter
    // could fire two concurrent signIn/signUp requests. Mirrors the disabled-during-request pattern
    // already used elsewhere in the app (e.g. the portal "💾 Αποθήκευση ρυθμίσεων" button).
    _setAuthBusy:function(busy){
      var btn=document.getElementById('cloud-primary-btn');
      if(btn) btn.disabled=busy;
    },

    signUp:function(email,pw){
      var self=this;
      if(!this.enabled){ this._showLoadError(); return; }
      if(!email||!pw){ this._msg('Συμπλήρωσε email και κωδικό.',true); return; }
      if(pw.length<6){ this._msg('Ο κωδικός θέλει τουλάχιστον 6 χαρακτήρες.',true); return; }
      this._msg('Δημιουργία λογαριασμού...');
      this._setAuthBusy(true);
      this.sb.auth.signUp({email:email,password:pw}).then(function(res){
        if(res.error){ self._setAuthBusy(false); self._msg(self._translateError(res.error.message),true); return; }
        if(res.data && res.data.session){ self.user=res.data.user; self._msg(''); self._loadThenEnter(); }
        else { self._setAuthBusy(false); self._msg('✅ Έλεγξε το email σου για επιβεβαίωση και μετά πάτα «Σύνδεση».'); }
      }).catch(function(e){ self._setAuthBusy(false); self._msg(self._translateError(e&&e.message), true); });
    },

    signIn:function(email,pw){
      var self=this;
      if(!this.enabled){ this._showLoadError(); return; }
      if(!email||!pw){ this._msg('Συμπλήρωσε email και κωδικό.',true); return; }
      this._msg('Σύνδεση...');
      this._setAuthBusy(true);
      this.sb.auth.signInWithPassword({email:email,password:pw}).then(function(res){
        if(res.error){
          self._setAuthBusy(false);
          var m=(res.error.message||'').toLowerCase();
          if(m.indexOf('invalid login credentials')>=0){ self._msg('Λάθος email ή κωδικός. Πρώτη φορά εδώ; Πάτα «Νέος λογαριασμός» πάνω. ☝️',true); }
          else { self._msg(self._translateError(res.error.message),true); }
          return;
        }
        self.user=res.data.user; self._msg('');
        self._loadThenEnter();
      }).catch(function(e){ self._setAuthBusy(false); self._msg(self._translateError(e&&e.message), true); });
    },

    signOut:function(){
      var self=this;
      if(this.sb){ this.sb.auth.signOut().then(function(){ self.user=null; location.reload(); }).catch(function(){ location.reload(); }); }
      else { location.reload(); }
    },

    // 👁️ Εμφάνιση/απόκρυψη κωδικού
    togglePw:function(){
      var el=document.getElementById('cloud-pw');
      if(el) el.type = (el.type==='password') ? 'text' : 'password';
    },

    // 🔑 Ξέχασα τον κωδικό → στέλνει email με link επαναφοράς
    forgotPassword:function(){
      var self=this;
      if(!this.enabled){ this._showLoadError(); return; }
      var email=(document.getElementById('cloud-email')||{}).value;
      email=(email||'').trim();
      if(!email){ this._msg('Γράψε πρώτα το email σου πάνω, μετά πάτα «Ξέχασα τον κωδικό».',true); return; }
      this._msg('Αποστολή link επαναφοράς...');
      this.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(function(res){
        if(res.error){ self._msg(self._translateError(res.error.message),true); return; }
        self._msg('✅ Σου στείλαμε email με link για νέο κωδικό. Έλεγξε τα εισερχόμενά σου (και τα spam).');
      }).catch(function(e){ self._msg(self._translateError(e&&e.message), true); });
    },

    // Δείχνει τη φόρμα «νέος κωδικός» (όταν ο χρήστης έρθει από το email)
    _showNewPassword:function(){
      var g=document.getElementById('app-loading-gate'); if(g) g.style.display='none';
      var lp=document.getElementById('login-page'), ac=document.getElementById('app-container');
      if(lp) lp.style.display='flex';
      if(ac) ac.style.display='none';
      var ls=document.getElementById('cloud-login-section'), rs=document.getElementById('cloud-recovery-section');
      if(ls) ls.style.display='none';
      if(rs) rs.style.display='block';
    },

    // Αποθήκευση νέου κωδικού
    setNewPassword:function(pw){
      var self=this;
      var rmsg=function(t,e){ var el=document.getElementById('cloud-recovery-msg'); if(el){ el.textContent=t||''; el.style.color=e?'#c0392b':'#027a48'; } };
      if(!pw || pw.length<6){ rmsg('Ο κωδικός θέλει τουλάχιστον 6 χαρακτήρες.',true); return; }
      rmsg('Αποθήκευση...');
      this.sb.auth.updateUser({ password: pw }).then(function(res){
        if(res.error){ rmsg(self._translateError(res.error.message),true); return; }
        rmsg('✅ Ο κωδικός άλλαξε! Μπαίνεις...');
        try{ history.replaceState(null,'',location.origin+location.pathname); }catch(e){}
        if(res.data && res.data.user){ self.user=res.data.user; self._loadThenEnter(); }
        else { setTimeout(function(){ location.reload(); }, 900); }
      }).catch(function(e){ rmsg(self._translateError(e&&e.message), true); });
    },

    // 🇬🇷 Μετάφραση συνηθισμένων σφαλμάτων Supabase στα ελληνικά
    _translateError:function(msg){
      msg = msg || 'Κάτι πήγε στραβά.';
      var m = msg.toLowerCase();
      if(m.indexOf('invalid login credentials')>=0) return 'Λάθος email ή κωδικός.';
      if(m.indexOf('already registered')>=0 || m.indexOf('already been registered')>=0 || m.indexOf('user already')>=0) return 'Υπάρχει ήδη λογαριασμός με αυτό το email. Πάτα «Σύνδεση».';
      if(m.indexOf('is invalid')>=0 || m.indexOf('invalid email')>=0 || m.indexOf('unable to validate email')>=0) return 'Μη έγκυρο email — έλεγξε ότι το έγραψες σωστά.';
      if(m.indexOf('password should be at least')>=0 || m.indexOf('at least 6')>=0) return 'Ο κωδικός θέλει τουλάχιστον 6 χαρακτήρες.';
      if(m.indexOf('email not confirmed')>=0) return 'Δεν έχεις επιβεβαιώσει το email σου. Έλεγξε τα εισερχόμενά σου.';
      if(m.indexOf('rate limit')>=0 || m.indexOf('too many')>=0) return 'Πολλές προσπάθειες. Περίμενε λίγο και ξαναδοκίμασε.';
      if(m.indexOf('network')>=0 || m.indexOf('failed to fetch')>=0) return 'Πρόβλημα σύνδεσης. Έλεγξε το internet σου.';
      return 'Σφάλμα: ' + msg;
    },

    load:function(opts){
      var self=this;
      var _bg = !!(opts && opts.background);
      return new Promise(function(resolve){
        if(!self.user){ resolve(); return; }
        self.sb.from('user_data').select('data, version').eq('user_id',self.user.id).maybeSingle().then(function(res){
          if(res.error){ console.error('[CLOUD] load', res.error); }
          var row=(res && res.data)?res.data:null;
          var d=(row && row.data)?row.data:null;
          // Remember the version this row is at so _pushNow() can detect a concurrent
          // write from another tab/device instead of blindly overwriting it.
          self._version = (row && typeof row.version==='number') ? row.version : 0;
          if(d && d.clients && d.clients.length){
            // 🛡️ Background load (μπήκαμε ήδη με cache): αν ο χρήστης πληκτρολογεί/επεξεργάζεται
            // τη στιγμή που έφτασε το blob, μην πατήσεις πάνω στα τοπικά — κράτα τα και ανέβασέ
            // τα (optimistic-locked, self._version είναι ήδη σωστό). Ο επόμενος reload φέρνει
            // το cloud κανονικά. Πανσπάνιο: edit μέσα στο 1ο ~δευτερόλεπτο μετά το login.
            if(_bg && window.clients && window.clients.length){
              var _ae=document.activeElement;
              var _editingNow=!!(_ae && _ae.closest && _ae.closest('#main') && /^(INPUT|TEXTAREA|SELECT)$/.test(_ae.tagName||''));
              if(_editingNow){
                console.warn('[CLOUD] Ο χρήστης επεξεργάζεται τη στιγμή που ήρθε το cloud blob — κρατάω τα τοπικά.');
                self._loaded=true;
                self._pushNow().then(function(){ self._loadCustomRecipes().then(resolve); });
                return;
              }
            }
            // 🛡️ Μην αντικαταστήσεις τοπικά δεδομένα που είναι πιο πρόσφατα από το cloud —
            // π.χ. αν το προηγούμενο push (δουλεύει με καθυστέρηση/debounce) δεν πρόλαβε να
            // ολοκληρωθεί πριν κλείσει/ανανεωθεί η σελίδα. Χωρίς αυτό, ένα stale cloud read
            // σβήνει σιωπηλά πρόσφατες τοπικές αλλαγές (π.χ. ένα μόλις αποθηκευμένο πλάνο).
            var _localTs=null;
            try{ _localTs=localStorage.getItem('fyh_local_updated_at'); }catch(e){}
            if(_localTs && d.updatedAt && _localTs>d.updatedAt && window.clients && window.clients.length){
              console.warn('[CLOUD] Τοπικά δεδομένα ('+_localTs+') πιο πρόσφατα από το cloud ('+d.updatedAt+') — τα διατηρώ και τα ανεβάζω αντί να τα αντικαταστήσω.');
              self._loaded=true;
              self._pushNow().then(function(){ self._loadCustomRecipes().then(resolve); });
              return;
            }
            try{
              if(Array.isArray(d.clients)) window.clients=d.clients;
              if(Array.isArray(window.clients) && typeof mergeDuplicateGroupNames==='function') mergeDuplicateGroupNames(window.clients);
              if(Array.isArray(d.customTemplates)) window.customTemplates=d.customTemplates;
              if(d.trackingData && typeof window.TRACKING_DATA!=='undefined') window.TRACKING_DATA=d.trackingData;
              if(d.recipeMeta && typeof saveRecipeMetaAll==='function') saveRecipeMetaAll(d.recipeMeta);
              if(typeof safeStorageSet==='function'){
                safeStorageSet('fyh_clients', window.clients);
                safeStorageSet('fyh_custom_tmpls', window.customTemplates);
                // Saved combos live outside `clients` (own localStorage key, shared across
                // clients) so they need their own restore here — otherwise they never
                // travel across devices even though they now ride along in the same blob.
                if(Array.isArray(d.savedCombos)){
                  safeStorageSet('savedCombos', d.savedCombos);
                  // getSavedCombos() (js/plan-gen/combos-tips.js) caches this in memory; writing straight
                  // to storage here would otherwise leave stale data behind that cache.
                  window._savedCombosCache = d.savedCombos;
                }
                if(Array.isArray(d.tipsLibrary)){
                  safeStorageSet('tipsLibrary', d.tipsLibrary);
                  window._tipsLibraryCache = d.tipsLibrary;
                }
              }
              // Clinic contact — raw localStorage keys (read by loadSettingsPanel + _buildSnapshot
              // via self.CLINIC) plus the in-memory self.CLINIC object so a publish right after
              // load already carries it without a page reload.
              if(d.clinicContact && typeof d.clinicContact==='object'){
                try{
                  localStorage.setItem('fyh-clinic-wa', d.clinicContact.wa||'');
                  localStorage.setItem('fyh-clinic-tel', d.clinicContact.tel||'');
                  localStorage.setItem('fyh-clinic-email', d.clinicContact.email||'');
                }catch(e){}
                if(self.CLINIC){ self.CLINIC.wa=d.clinicContact.wa||''; self.CLINIC.tel=d.clinicContact.tel||''; self.CLINIC.email=d.clinicContact.email||''; }
              }
            }catch(e){ console.error('[CLOUD] apply data', e); }
            self._loaded=true; self._loadCustomRecipes().then(resolve);
          } else {
            // Cloud άδειο → πρώτη φορά: ανεβάζουμε τα τοπικά δεδομένα (migration)
            self._loaded=true;
            if(window.clients && window.clients.length){ self._pushNow().then(function(){ self._loadCustomRecipes().then(resolve); }); }
            else { self._loadCustomRecipes().then(resolve); }
          }
        }).catch(function(e){ console.error('[CLOUD] load', e); self._loaded=true; resolve(); });
      });
    },

    _pushNow:function(){
      var self=this;
      return new Promise(function(resolve){
        if(!self.user){ resolve(); return; }
        var blob={
          clients: window.clients||[],
          customTemplates: window.customTemplates||[],
          trackingData: (typeof window.TRACKING_DATA!=='undefined'?window.TRACKING_DATA:null),
          recipeMeta: (typeof getRecipeMeta==='function'?getRecipeMeta():null),
          savedCombos: (typeof safeStorageGet==='function'?safeStorageGet('savedCombos',[]):[]),
          tipsLibrary: (typeof safeStorageGet==='function'?safeStorageGet('tipsLibrary',[]):[]),
          // Clinic contact (WhatsApp/phone/email shown to the client in the plan's «Ρώτησέ με»
          // sheet) used to be localStorage-only, so publishing from another browser/device gave
          // the client a contact-less link. Rides along in the same blob now; self.CLINIC is
          // kept in sync by saveClinicContact() and is re-seeded from d.clinicContact on load().
          clinicContact: {
            wa:(self.CLINIC&&self.CLINIC.wa)||'',
            tel:(self.CLINIC&&self.CLINIC.tel)||'',
            email:(self.CLINIC&&self.CLINIC.email)||''
          },
          updatedAt: new Date().toISOString()
        };
        var expected=self._version||0;
        if(!expected){
          // No cloud row known yet (brand-new dietitian, or first push this session) —
          // nothing to conflict with, plain upsert starting the version chain at 1.
          self.sb.from('user_data').upsert({user_id:self.user.id, data:blob, updated_at:new Date().toISOString(), version:1}).then(function(res){
            if(res.error){ console.error('[CLOUD] push', res.error); resolve({ok:false,error:res.error}); }
            else { self._version=1; resolve({ok:true}); }
          }).catch(function(err){ console.error('[CLOUD] push', err); resolve({ok:false,error:err}); });
          return;
        }
        // 🔒 Optimistic lock: only write if the cloud row is still at the version we last
        // saw. If another tab/device saved in between, this UPDATE matches zero rows —
        // that's a real conflict, and the caller must NOT retry with the same blob (it
        // would silently clobber whatever the other tab/device just wrote).
        self.sb.from('user_data')
          .update({data:blob, updated_at:new Date().toISOString(), version:expected+1})
          .eq('user_id',self.user.id).eq('version',expected)
          .select('version').then(function(res){
            if(res.error){ console.error('[CLOUD] push', res.error); resolve({ok:false,error:res.error}); return; }
            if(!res.data || !res.data.length){
              console.warn('[CLOUD] push conflict — cloud row is no longer at version '+expected+' (saved elsewhere).');
              resolve({ok:false,conflict:true});
              return;
            }
            self._version=res.data[0].version;
            resolve({ok:true});
          }).catch(function(err){ console.error('[CLOUD] push', err); resolve({ok:false,error:err}); });
      });
    },

    // Custom (δικές του) συνταγές του διαιτολόγου — δικός τους πίνακας `custom_recipes` (όχι μέσα στο
    // ενιαίο user_data blob), γιατί εδώ ταιριάζει καλύτερα ένα upsert-ανά-συνταγή αντί για ολόκληρο
    // ξαναγράψιμο του blob σε κάθε μικρή αλλαγή. Ποτέ δεν πετάει σφάλμα προς τα έξω — αν αποτύχει,
    // η οθόνη Συνταγές απλά δείχνει μόνο τη στατική βιβλιοθήκη, όπως και σήμερα.
    _loadCustomRecipes:function(){
      var self=this;
      return new Promise(function(resolve){
        if(!self.user){ window.customRecipes=[]; resolve(); return; }
        self.sb.from('custom_recipes').select('*').eq('dietitian_id',self.user.id).then(function(res){
          if(res.error){ console.error('[CLOUD] loadCustomRecipes', res.error); window.customRecipes=window.customRecipes||[]; resolve(); return; }
          window.customRecipes=(res.data||[]).map(function(row){
            return {
              id:'custom_'+row.id, dbId:row.id, name:row.name, foods:row.foods||[], kcal:row.kcal||0,
              macro:row.macro||{p:0,f:0,c:0}, tags:row.tags||[], instructions:row.instructions||'',
              prepTimeMin:row.prep_time_min||null, source:'custom'
            };
          });
          resolve();
        }).catch(function(e){ console.error('[CLOUD] loadCustomRecipes', e); window.customRecipes=window.customRecipes||[]; resolve(); });
      });
    },
    saveCustomRecipe:function(recipeData){
      var self=this;
      if(!this.enabled || !this.user) return Promise.resolve({ok:false,error:'Δεν είσαι συνδεδεμένος'});
      var row={
        dietitian_id:self.user.id, name:recipeData.name, foods:recipeData.foods||[], kcal:recipeData.kcal||0,
        macro:recipeData.macro||{p:0,f:0,c:0}, tags:recipeData.tags||[], instructions:recipeData.instructions||'',
        prep_time_min:recipeData.prepTimeMin||null, updated_at:new Date().toISOString()
      };
      return self.sb.from('custom_recipes').insert(row).select().single().then(function(res){
        if(res.error){ console.error('[CLOUD] saveCustomRecipe', res.error); return {ok:false,error:res.error}; }
        var saved={
          id:'custom_'+res.data.id, dbId:res.data.id, name:res.data.name, foods:res.data.foods||[], kcal:res.data.kcal||0,
          macro:res.data.macro||{p:0,f:0,c:0}, tags:res.data.tags||[], instructions:res.data.instructions||'',
          prepTimeMin:res.data.prep_time_min||null, source:'custom'
        };
        window.customRecipes=(window.customRecipes||[]).concat([saved]);
        return {ok:true,recipe:saved};
      }).catch(function(e){ console.error('[CLOUD] saveCustomRecipe', e); return {ok:false,error:e}; });
    },
    // Επεξεργασία υπάρχουσας δικής του συνταγής — ίδιο μοτίβο με το saveCustomRecipe, αλλά UPDATE
    // στη γραμμή αντί για INSERT. Το RLS policy ("for all") ήδη καλύπτει το UPDATE· το
    // eq('dietitian_id',...) εδώ είναι άμυνα-σε-βάθος, όπως και στο deleteCustomRecipe.
    updateCustomRecipe:function(dbId, recipeData){
      var self=this;
      if(!this.enabled || !this.user) return Promise.resolve({ok:false,error:'Δεν είσαι συνδεδεμένος'});
      var patch={
        name:recipeData.name, foods:recipeData.foods||[], kcal:recipeData.kcal||0,
        macro:recipeData.macro||{p:0,f:0,c:0}, tags:recipeData.tags||[], instructions:recipeData.instructions||'',
        prep_time_min:recipeData.prepTimeMin||null, updated_at:new Date().toISOString()
      };
      return self.sb.from('custom_recipes').update(patch).eq('id',dbId).eq('dietitian_id',self.user.id).select().single().then(function(res){
        if(res.error){ console.error('[CLOUD] updateCustomRecipe', res.error); return {ok:false,error:res.error}; }
        var saved={
          id:'custom_'+res.data.id, dbId:res.data.id, name:res.data.name, foods:res.data.foods||[], kcal:res.data.kcal||0,
          macro:res.data.macro||{p:0,f:0,c:0}, tags:res.data.tags||[], instructions:res.data.instructions||'',
          prepTimeMin:res.data.prep_time_min||null, source:'custom'
        };
        window.customRecipes=(window.customRecipes||[]).map(function(r){ return r.dbId===res.data.id ? saved : r; });
        return {ok:true,recipe:saved};
      }).catch(function(e){ console.error('[CLOUD] updateCustomRecipe', e); return {ok:false,error:e}; });
    },
    deleteCustomRecipe:function(dbId){
      var self=this;
      if(!this.enabled || !this.user) return Promise.resolve({ok:false,error:'Δεν είσαι συνδεδεμένος'});
      // eq('dietitian_id',...) εδώ είναι άμυνα-σε-βάθος πέρα από το RLS policy — δεν αλλάζει τη
      // λειτουργικότητα (η RLS ήδη το επιβάλλει), αλλά κάνει το intent ρητό στον ίδιο τον κώδικα.
      return self.sb.from('custom_recipes').delete().eq('id',dbId).eq('dietitian_id',self.user.id).then(function(res){
        if(res.error){ console.error('[CLOUD] deleteCustomRecipe', res.error); return {ok:false,error:res.error}; }
        return {ok:true};
      }).catch(function(e){ console.error('[CLOUD] deleteCustomRecipe', e); return {ok:false,error:e}; });
    },

    // Καλείται από κάθε αποθήκευση. Φρουρά _loaded: ποτέ overwrite πριν φορτώσει το cloud.
    save:function(){
      var self=this;
      if(!this.enabled || !this.user || !this._loaded) return;
      clearTimeout(this._t);
      this._t=setTimeout(function(){
        self._pushNow().then(function(result){
          if(result && result.ok===false){
            self._syncFailed=true;
            if(result.conflict){ self._showConflictError(); } else { self._showSyncError(); }
            return;
          }
          self._syncFailed=false;
          self._hideSyncError();
          self._hideConflictError();
          var t=document.getElementById('cloud-save-toast');
          if(t){ t.style.opacity='1'; clearTimeout(t._ft); t._ft=setTimeout(function(){ t.style.opacity='0'; },1500); }
        });
      },1500);
    },

    // ⚠️ Εμφανίζεται ΜΟΝΙΜΑ (όχι σαν φευγαλέο toast) όσο η τελευταία αποθήκευση στο cloud αποτυγχάνει —
    // ώστε ο διαιτολόγος να μην πιστεύει ότι οι αλλαγές είναι ασφαλείς ενώ έμειναν μόνο τοπικά.
    _showSyncError:function(){
      var el=document.getElementById('cloud-sync-error');
      if(!el){
        el=document.createElement('div');
        el.id='cloud-sync-error';
        el.style.cssText='position:fixed;bottom:20px;right:20px;background:#c62828;color:#fff;padding:10px 16px;border-radius:8px;font-size:13px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.25);max-width:280px;line-height:1.4;';
        el.textContent='⚠️ Δεν συγχρονίστηκε με το cloud — οι αλλαγές είναι προς το παρόν μόνο σε αυτόν τον υπολογιστή';
        document.body.appendChild(el);
      }
      el.style.display='block';
    },
    _hideSyncError:function(){
      var el=document.getElementById('cloud-sync-error');
      if(el) el.style.display='none';
    },

    // ⚠️ Διαφορετικό μήνυμα από το _showSyncError: εδώ δεν είναι πρόβλημα δικτύου — κάποια
    // άλλη συσκευή/tab αποθήκευσε ήδη νεότερα δεδομένα. Ξαναδοκιμάζοντας το ίδιο save θα
    // ξαναπετύχαινε το ίδιο conflict (σωστά — καλύτερα να μπλοκάρει παρά να τα αντικαταστήσει
    // σιωπηλά), οπότε δίνουμε στον διαιτολόγο ρητή επιλογή να φορτώσει τα πιο πρόσφατα.
    _showConflictError:function(){
      var el=document.getElementById('cloud-conflict-error');
      if(!el){
        el=document.createElement('div');
        el.id='cloud-conflict-error';
        el.style.cssText='position:fixed;bottom:20px;right:20px;background:#8a5a00;color:#fff;padding:10px 16px;border-radius:8px;font-size:13px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.25);max-width:300px;line-height:1.4;';
        el.innerHTML='⚠️ Έγιναν αλλαγές σε άλλη συσκευή/tab — οι αλλαγές σου εδώ δεν αποθηκεύτηκαν, για να μη σβήσουν κάτι νεότερο.<br><a href="#" id="cloud-conflict-reload" style="color:#fff;text-decoration:underline;font-weight:600;">Φόρτωσε τα πιο πρόσφατα δεδομένα</a>';
        document.body.appendChild(el);
        var link=el.querySelector('#cloud-conflict-reload');
        if(link) link.addEventListener('click',function(e){ e.preventDefault(); Cloud.forceReloadFromCloud(); });
      }
      el.style.display='block';
    },
    _hideConflictError:function(){
      var el=document.getElementById('cloud-conflict-error');
      if(el) el.style.display='none';
    },

    // Ο διαιτολόγος επέλεξε ρητά να πετάξει τις τοπικές, μη-αποθηκευμένες αλλαγές του και να
    // δει τα πιο πρόσφατα δεδομένα του cloud (μετά από conflict). Σε αντίθεση με load(), εδώ
    // ΔΕΝ ελέγχουμε fyh_local_updated_at — ο σκοπός είναι ακριβώς να αντικατασταθούν τα τοπικά.
    forceReloadFromCloud:function(){
      var self=this;
      this._hideConflictError();
      this.sb.from('user_data').select('data, version').eq('user_id',self.user.id).maybeSingle().then(function(res){
        if(res.error){ console.error('[CLOUD] forceReloadFromCloud', res.error); return; }
        var row=(res && res.data)?res.data:null;
        var d=(row && row.data)?row.data:null;
        self._version=(row && typeof row.version==='number')?row.version:0;
        if(!d) return;
        try{
          if(Array.isArray(d.clients)) window.clients=d.clients;
          if(Array.isArray(window.clients) && typeof mergeDuplicateGroupNames==='function') mergeDuplicateGroupNames(window.clients);
          if(Array.isArray(d.customTemplates)) window.customTemplates=d.customTemplates;
          if(d.trackingData && typeof window.TRACKING_DATA!=='undefined') window.TRACKING_DATA=d.trackingData;
          if(d.recipeMeta && typeof saveRecipeMetaAll==='function') saveRecipeMetaAll(d.recipeMeta);
          if(typeof safeStorageSet==='function'){
            safeStorageSet('fyh_clients', window.clients);
            safeStorageSet('fyh_custom_tmpls', window.customTemplates);
            if(Array.isArray(d.savedCombos)){
              safeStorageSet('savedCombos', d.savedCombos);
              window._savedCombosCache = d.savedCombos;
            }
            if(Array.isArray(d.tipsLibrary)){
              safeStorageSet('tipsLibrary', d.tipsLibrary);
              window._tipsLibraryCache = d.tipsLibrary;
            }
          }
          if(d.clinicContact && typeof d.clinicContact==='object'){
            try{
              localStorage.setItem('fyh-clinic-wa', d.clinicContact.wa||'');
              localStorage.setItem('fyh-clinic-tel', d.clinicContact.tel||'');
              localStorage.setItem('fyh-clinic-email', d.clinicContact.email||'');
            }catch(e){}
            if(self.CLINIC){ self.CLINIC.wa=d.clinicContact.wa||''; self.CLINIC.tel=d.clinicContact.tel||''; self.CLINIC.email=d.clinicContact.email||''; }
          }
          try{ localStorage.setItem('fyh_local_updated_at', new Date().toISOString()); }catch(e){}
        }catch(e){ console.error('[CLOUD] forceReloadFromCloud apply', e); }
        try{
          if(typeof renderSB==='function') renderSB();
          if(typeof renderHome==='function') renderHome();
          if(typeof renderMain==='function') renderMain();
        }catch(e){ console.error('[CLOUD] forceReloadFromCloud render', e); }
        if(typeof showSuccessToast==='function') showSuccessToast('✅ Φορτώθηκαν τα πιο πρόσφατα δεδομένα από το cloud.');
      }).catch(function(e){ console.error('[CLOUD] forceReloadFromCloud', e); });
    },

    // ── 📈 ΠΡΟΟΔΟΣ ΠΕΛΑΤΗ (διάβασμα των checkins που στέλνει το plan.html) ──
    _checkinsCache:{},
    // Μία κλήση για όλους τους πελάτες μαζί (πιο γρήγορο από μία-μία).
    fetchAllCheckins:function(tokens){
      var self=this;
      if(!this.enabled || !this.user || !tokens || !tokens.length) return Promise.resolve({});
      return this.sb.from('checkins')
        .select('token,date,meals_done,meals_total,water_glasses,water_goal,supps_done,supps_total')
        .in('token',tokens).order('date',{ascending:true}).then(function(res){
          if(res.error){ console.error('[CLOUD] fetchAllCheckins', res.error); return {}; }
          var byToken={};
          (res.data||[]).forEach(function(r){ (byToken[r.token]=byToken[r.token]||[]).push(r); });
          return byToken;
        }).catch(function(e){ console.error('[CLOUD] fetchAllCheckins network error', e && e.message); return {}; });
    },
    // Ξαναφορτώνει το cache και ξανασχεδιάζει τη λίστα πελατών (badges).
    refreshCheckinsCache:function(){
      var self=this;
      var tokens=(window.clients||[]).filter(function(c){return c.shareToken && !c.deleted;}).map(function(c){return c.shareToken;});
      if(!tokens.length) return Promise.resolve();
      return this.fetchAllCheckins(tokens).then(function(byToken){
        self._checkinsCache=byToken;
        if(typeof renderSB==='function') renderSB();
        if(curId===null && typeof renderHome==='function') renderHome();
        // ✅ 2026-08-01: το feedback πελάτη (progress/notes/plan-feedback) μετακόμισε στο "📝 Ραντεβού"
        // (#s3b) — πρέπει να ξανασχεδιάζεται εκείνο, όχι πια το #s3 (Ανθρωπομετρία) που δεν το περιέχει πια.
        var s3b=document.getElementById('s3b');
        if(s3b && typeof getC==='function' && typeof buildAppointmentsHtml==='function'){
          var cur=getC(); if(cur) s3b.innerHTML=buildAppointmentsHtml(cur);
        }
      });
    },
    // Τα checkins ενός συγκεκριμένου πελάτη (από το cache — refreshCheckinsCache πρέπει να έχει τρέξει πρώτα).
    checkinsFor:function(c){
      return (c && c.shareToken && this._checkinsCache[c.shareToken]) || [];
    },

    // ── 📥 ΒΑΡΟΣ & ΣΗΜΕΙΩΣΕΙΣ ΠΕΛΑΤΗ (client_logs — γράφει το plan.html χωρίς login) ──
    _clientLogsCache:{},
    fetchAllClientLogs:function(tokens){
      var self=this;
      if(!this.enabled || !this.user || !tokens || !tokens.length) return Promise.resolve({});
      return this.sb.from('client_logs')
        .select('token,date,weight_kg,note')
        .in('token',tokens).order('date',{ascending:true}).then(function(res){
          if(res.error){ console.error('[CLOUD] fetchAllClientLogs', res.error); return {}; }
          var byToken={};
          (res.data||[]).forEach(function(r){ (byToken[r.token]=byToken[r.token]||[]).push(r); });
          return byToken;
        }).catch(function(e){ console.error('[CLOUD] fetchAllClientLogs network error', e && e.message); return {}; });
    },
    refreshClientLogsCache:function(){
      var self=this;
      var tokens=(window.clients||[]).filter(function(c){return c.shareToken && !c.deleted;}).map(function(c){return c.shareToken;});
      if(!tokens.length) return Promise.resolve();
      return this.fetchAllClientLogs(tokens).then(function(byToken){
        self._clientLogsCache=byToken;
        // ✅ 2026-08-01: πριν έλειπε από εδώ (μόνο το refreshCheckinsCache το έκανε) — το 💬 badge στη
        // λίστα πελατών/Αρχική διαβάζει clientHasNewClientNote() που εξαρτάται ΑΚΡΙΒΩΣ από αυτό το
        // cache, οπότε χωρίς αυτό το badge έμενε στο παλιό αποτέλεσμα μέχρι να τρέξει τυχαία κάποιο
        // άλλο re-render.
        if(typeof renderSB==='function') renderSB();
        if(curId===null && typeof renderHome==='function') renderHome();
        // ✅ 2026-08-01: το feedback πελάτη (progress/notes/plan-feedback) μετακόμισε στο "📝 Ραντεβού"
        // (#s3b) — πρέπει να ξανασχεδιάζεται εκείνο, όχι πια το #s3 (Ανθρωπομετρία) που δεν το περιέχει πια.
        var s3b=document.getElementById('s3b');
        if(s3b && typeof getC==='function' && typeof buildAppointmentsHtml==='function'){
          var cur=getC(); if(cur) s3b.innerHTML=buildAppointmentsHtml(cur);
        }
      });
    },
    // Πλήρες ιστορικό καταχωρήσεων του πελάτη (μέτρα δικά του, χωριστά από το επίσημο weightLog
    // του διαιτολόγου — μόνο για σύγκριση, δεν πειράζει ποτέ τα δικά σου δεδομένα). Πιο πρόσφατα πρώτα.
    allClientLogsFor:function(c){
      if(!c || !c.shareToken) return [];
      var entries=(this._clientLogsCache[c.shareToken]||[]).slice();
      entries.sort(function(a,b){return a.date<b.date?1:-1;});
      return entries.slice(0,15);
    },

    // ── ⭐ ΕΒΔΟΜΑΔΙΑΙΟ FEEDBACK ΠΛΑΝΟΥ (plan_feedback — γράφει το plan.html χωρίς login) ──
    _planFeedbackCache:{},
    fetchAllPlanFeedback:function(tokens){
      var self=this;
      if(!this.enabled || !this.user || !tokens || !tokens.length) return Promise.resolve({});
      return this.sb.from('plan_feedback')
        .select('token,week_start,breakfast,snacks,lunch,dinner,recipes_ease,ingredients_ease,training_energy,continue_likelihood,low_rating_reasons')
        .in('token',tokens).order('week_start',{ascending:true}).then(function(res){
          if(res.error){ console.error('[CLOUD] fetchAllPlanFeedback', res.error); return {}; }
          var byToken={};
          (res.data||[]).forEach(function(r){ (byToken[r.token]=byToken[r.token]||[]).push(r); });
          return byToken;
        }).catch(function(e){ console.error('[CLOUD] fetchAllPlanFeedback network error', e && e.message); return {}; });
    },
    refreshPlanFeedbackCache:function(){
      var self=this;
      var tokens=(window.clients||[]).filter(function(c){return c.shareToken && !c.deleted;}).map(function(c){return c.shareToken;});
      if(!tokens.length) return Promise.resolve();
      return this.fetchAllPlanFeedback(tokens).then(function(byToken){
        self._planFeedbackCache=byToken;
        // ✅ 2026-08-01: πριν έλειπε από εδώ (μόνο το refreshCheckinsCache το έκανε) — το 😕 badge
        // στη λίστα πελατών/Αρχική εξαρτάται ΑΚΡΙΒΩΣ από αυτό το cache (clientHasLowPlanFeedback).
        if(typeof renderSB==='function') renderSB();
        if(curId===null && typeof renderHome==='function') renderHome();
        // ✅ 2026-08-01: το feedback πελάτη (progress/notes/plan-feedback) μετακόμισε στο "📝 Ραντεβού"
        // (#s3b) — πρέπει να ξανασχεδιάζεται εκείνο, όχι πια το #s3 (Ανθρωπομετρία) που δεν το περιέχει πια.
        var s3b=document.getElementById('s3b');
        if(s3b && typeof getC==='function' && typeof buildAppointmentsHtml==='function'){
          var cur=getC(); if(cur) s3b.innerHTML=buildAppointmentsHtml(cur);
        }
      });
    },
    // Ιστορικό εβδομάδων feedback ενός πελάτη, πιο πρόσφατο πρώτα.
    planFeedbackFor:function(c){
      if(!c || !c.shareToken) return [];
      var entries=(this._planFeedbackCache[c.shareToken]||[]).slice();
      entries.sort(function(a,b){return a.week_start<b.week_start?1:-1;});
      return entries;
    },

    // ── 🔗 ΥΓΕΙΑ ΣΥΝΔΕΣΜΟΥ PORTAL (2026-08-14) ──────────────────────────────
    // Το isStale() πιο πάνω ελέγχει ΜΟΝΟ αν άλλαξε το πλάνο ΤΟΠΙΚΑ μετά τη δημοσίευση — δεν βλέπει αν
    // η ίδια η γραμμή shared_plans χάθηκε από τη βάση (διαγραφή, χειροκίνητο cleanup, ό,τι άλλο) ΜΕΤΑ
    // από μια επιτυχημένη δημοσίευση. Αυτό βρέθηκε live σε πραγματικό test client — το τοπικό
    // _publishedPlanHash έλεγε "όλα καλά" ενώ ο πελάτης έβλεπε "Το πλάνο δεν βρέθηκε". Εδώ κάνουμε μια
    // ελαφριά ερώτηση ύπαρξης (token+expires_at, όχι ολόκληρο το snapshot) για όλους τους δημοσιευμένους
    // πελάτες μαζί, ίδιο μοτίβο με τα άλλα 3 caches παραπάνω.
    _linkHealthCache:{}, _linkHealthChecked:false,
    fetchLinkHealth:function(tokens){
      var self=this;
      if(!this.enabled || !this.user || !tokens || !tokens.length) return Promise.resolve(null);
      return this.sb.from('shared_plans').select('token,expires_at').in('token',tokens).then(function(res){
        if(res.error){ console.error('[CLOUD] fetchLinkHealth', res.error); return null; }
        var byToken={};
        (res.data||[]).forEach(function(r){ byToken[r.token]=r.expires_at||null; });
        return byToken;
      }).catch(function(e){ console.error('[CLOUD] fetchLinkHealth network error', e && e.message); return null; });
    },
    refreshLinkHealthCache:function(){
      var self=this;
      var tokens=(window.clients||[]).filter(function(c){return c.shareToken && !c.deleted;}).map(function(c){return c.shareToken;});
      if(!tokens.length) return Promise.resolve();
      return this.fetchLinkHealth(tokens).then(function(byToken){
        // null = σφάλμα δικτύου/άδειας — κράτα το προηγούμενο (γνωστό) αποτέλεσμα αντί να το σβήσεις
        // με "άγνωστο", αλλιώς μια στιγμιαία αποτυχία δικτύου θα έκρυβε σιωπηλά ένα ήδη-γνωστό σπασμένο link.
        if(byToken===null) return;
        self._linkHealthCache=byToken;
        self._linkHealthChecked=true;
        var s3b=document.getElementById('s3b');
        if(s3b && typeof getC==='function' && typeof buildAppointmentsHtml==='function'){
          var cur=getC(); if(cur) s3b.innerHTML=buildAppointmentsHtml(cur);
        }
      });
    },
    // {checked:false} αν δεν έχει τρέξει ποτέ ο έλεγχος αυτή τη συνεδρία — το digest ΔΕΝ πρέπει να
    // υποθέσει σπασμένο link σε αυτή την περίπτωση, μόνο όταν πραγματικά το επιβεβαίωσε.
    linkHealthFor:function(c){
      if(!c || !c.shareToken) return {checked:true, exists:null};
      if(!this._linkHealthChecked) return {checked:false};
      var has=this._linkHealthCache.hasOwnProperty(c.shareToken);
      var expiresAt=has?this._linkHealthCache[c.shareToken]:null;
      var expired=has && expiresAt && new Date(expiresAt)<new Date();
      return {checked:true, exists:has, expired:!!expired, expiresAt:expiresAt};
    }
  };
  window.Cloud = Cloud;

  // 🛡️ Αν ο χρήστης κλείσει/αλλάξει καρτέλα ενώ εκκρεμεί debounced save (1.5s),
  // στείλε το push αμέσως αντί να το χάσουμε σιωπηλά (βλ. code review: race condition).
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState==='hidden' && Cloud._t){
      clearTimeout(Cloud._t);
      Cloud._t=null;
      Cloud._pushNow();
    }
  });
})();

// ── Βοηθητικές συναρτήσεις για το σκορ/σερί προόδου πελάτη από τα checkins ──
function ckDayKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
// «Σημαντική» μεταβολή σκορ τήρησης εβδομάδα-με-εβδομάδα (μονάδες %) — κοινό κατώφλι για όλα τα ▲/▼.
var CK_TREND_MIN_PP=5;
// Τα 7 κλειδιά ημερών (Δευ→Κυρ) της εβδομάδας που περιέχει το `ref` (Date ή 'YYYY-MM-DD'· default: σήμερα).
function ckWeekKeysFor(ref){
  var base=ref==null?new Date():(typeof ref==='string'?new Date(ref+'T00:00:00'):new Date(ref));
  var js=base.getDay(), toMon=(js===0?-6:1-js);
  var mon=new Date(base); mon.setDate(base.getDate()+toMon); mon.setHours(0,0,0,0);
  var arr=[]; for(var i=0;i<7;i++){var d=new Date(mon);d.setDate(mon.getDate()+i);arr.push(ckDayKey(d));}
  return arr;
}
function ckWeekDates(offset){
  var d=new Date(); d.setDate(d.getDate()+(offset||0)*7);
  return ckWeekKeysFor(d);
}
function ckRowsByDate(rows){
  var m={}; (rows||[]).forEach(function(r){m[r.date]=r;}); return m;
}
function ckPillarStats(rows){
  var dietDone=0,dietTot=0,supDone=0,supTot=0,watDone=0,watTot=0,any=false;
  (rows||[]).forEach(function(r){
    if(r.meals_total){dietTot++; if(r.meals_done>=r.meals_total)dietDone++;}
    if(r.supps_total){supTot++; if(r.supps_done>=r.supps_total)supDone++;}
    if(r.water_goal){watTot++; if(r.water_glasses>=r.water_goal)watDone++;}
    if(r.meals_done>0||r.supps_done>0||r.water_glasses>0)any=true;
  });
  return {dietDone:dietDone,dietTot:dietTot,supDone:supDone,supTot:supTot,watDone:watDone,watTot:watTot,anyData:any};
}
function ckOverallScore(st){
  var ps=[]; if(st.dietTot)ps.push(st.dietDone/st.dietTot); if(st.supTot)ps.push(st.supDone/st.supTot); if(st.watTot)ps.push(st.watDone/st.watTot);
  if(!ps.length)return null; return Math.round(ps.reduce(function(a,b){return a+b;},0)/ps.length*100);
}
function ckWeekScore(byDate,offset){
  var rows=ckWeekDates(offset).map(function(k){return byDate[k];}).filter(Boolean);
  var st=ckPillarStats(rows);
  return st.anyData?ckOverallScore(st):null;
}
// «Καλή» ημέρα check-in = τηρήθηκαν ΟΛΟΙ οι στόχοι που ορίστηκαν (γεύματα/συμπληρώματα/νερό).
function ckIsGoodDay(r){
  if(!r) return false;
  if(r.meals_total && r.meals_done<r.meals_total) return false;
  if(r.supps_total && r.supps_done<r.supps_total) return false;
  if(r.water_goal && r.water_glasses<r.water_goal) return false;
  return true;
}
function ckStreak(byDate){
  var n=0, d=new Date(); d.setHours(0,0,0,0);
  if(!ckIsGoodDay(byDate[ckDayKey(d)])) d.setDate(d.getDate()-1);
  var guard=0;
  while(ckIsGoodDay(byDate[ckDayKey(d)])){ n++; d.setDate(d.getDate()-1); guard++; if(guard>365)break; }
  return n;
}
// Μέρες από το τελευταίο check-in (Infinity αν δεν υπάρχει κανένα).
function ckDaysSinceLast(rows){
  if(!rows || !rows.length) return Infinity;
  var last=rows[rows.length-1].date;
  var d0=new Date(last+'T00:00:00'), d1=new Date(); d1.setHours(0,0,0,0);
  return Math.round((d1-d0)/86400000);
}
