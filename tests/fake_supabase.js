// Fake supabase-js for sync tests. Server state lives in window.__SERVER (injected per page).
(function(){
  function clone(x){ return x==null?x:JSON.parse(JSON.stringify(x)); }
  function Q(t){ this.t=t; this.op='select'; this.f={}; this.p=null; this.single=false; }
  ['in','order','gte','lte','gt','lt','range','limit','neq','not','is','or','like','ilike','filter','match','contains'].forEach(function(m){
    Q.prototype[m]=function(){ return this; };
  });
  Q.prototype.in=function(k,v){ this.inF={k:k,v:v}; return this; };
  Q.prototype.range=function(a,b){ this.rg=[a,b]; return this; };
  Q.prototype.select=function(){ return this; };
  Q.prototype.eq=function(k,v){ this.f[k]=v; return this; };
  Q.prototype.maybeSingle=function(){ this.single=true; return this; };
  Q.prototype.single=function(){ this.single=true; return this; };
  Q.prototype.update=function(p){ this.op='update'; this.p=p; return this; };
  Q.prototype.insert=function(p){ this.op='insert'; this.p=p; return this; };
  Q.prototype.upsert=function(p){ this.op='upsert'; this.p=p; return this; };
  Q.prototype.delete=function(){ this.op='delete'; return this; };
  Q.prototype.then=function(res,rej){
    var self=this;
    return new Promise(function(r){ setTimeout(function(){ r(self._exec()); }, (window.__SERVER&&window.__SERVER.latency)||30); }).then(res,rej);
  };
  Q.prototype._exec=function(){
    var S=window.__SERVER, self0=this;
    S.calls=S.calls||[]; S.calls.push(this.t+':'+this.op);
    if(this.t==='shared_plans'){   // κρατά ό,τι δημοσιεύεται, για το get_shared_plan παρακάτω
      S.shared=S.shared||{};
      if(this.op==='upsert'&&this.p&&this.p.token) S.shared[this.p.token]=clone(this.p);
      if(this.op==='update'&&this.f.token&&S.shared[this.f.token]) Object.assign(S.shared[this.f.token],clone(this.p));
    }
    if(this.t==='food_diary') return fdExec(this,S);
    // Πίνακες που διαβάζει μόνο ο διαιτολόγος (client_meal_log, client_supp_log, …): S.tables[name] = [rows].
    if(this.op==='select' && S.tables && S.tables[this.t]){
      var tr=S.tables[this.t].filter(function(r){ return fdMatch(self0,r); }).map(clone);
      if(this.rg) tr=tr.slice(this.rg[0],this.rg[1]+1);
      return {data:tr, error:null};
    }
    if(this.t==='shared_plans' && this.op==='select' && this.f.token){
      var sp=(S.shared||{})[this.f.token];
      return {data:sp?[{snapshot:clone(sp.snapshot)}]:[], error:null};
    }
    if(this.t!=='user_data') return {data:this.single?null:[], error:null};
    var uid=this.f.user_id || (this.p&&this.p.user_id);
    S.rows=S.rows||{};
    var row=S.rows[uid];
    if(this.op==='select'){
      if(S.failLoads>0){ S.failLoads--; return {data:null,error:{message:'canceling statement due to statement timeout'}}; }
      return {data: row?{data:clone(row.data),version:row.version}:null, error:null};
    }
    if(this.op==='update'){
      if(!row || row.version!==this.f.version) return {data:[],error:null};
      row.data=clone(this.p.data); row.version=this.p.version; S.writes=(S.writes||0)+1;
      return {data:[{version:row.version}],error:null};
    }
    if(this.op==='insert'){
      if(row) return {data:null,error:{code:'23505',message:'duplicate key value violates unique constraint'}};
      S.rows[uid]={data:clone(this.p.data),version:this.p.version}; S.writes=(S.writes||0)+1;
      return {data:null,error:null};
    }
    if(this.op==='upsert'){
      S.rows[uid]={data:clone(this.p.data),version:this.p.version}; S.writes=(S.writes||0)+1; S.upserts=(S.upserts||0)+1;
      return {data:null,error:null};
    }
    return {data:null,error:null};
  };
  // 📒 food_diary: table rows in S.diaries[token]; the two anon RPCs mirror sql/2026-10-19_food_diary.sql.
  function fdMatch(q,r){ return Object.keys(q.f).every(function(k){ return r[k]===q.f[k]; }) && (!q.inF || q.inF.v.indexOf(r[q.inF.k])>=0); }
  function fdExec(q,S){
    S.diaries=S.diaries||{};
    var rows=Object.keys(S.diaries).map(function(k){ return S.diaries[k]; });
    if(q.op==='insert'){ var r=Object.assign({entries:{},comments:{},notes:{},last_entry_at:null,sent_at:new Date().toISOString()},clone(q.p)); S.diaries[r.token]=r; return {data:null,error:null}; }
    if(q.op==='update'){ rows.filter(function(r){ return fdMatch(q,r); }).forEach(function(r){ Object.assign(r,clone(q.p)); }); return {data:null,error:null}; }
    var hit=rows.filter(function(r){ return fdMatch(q,r); }).map(clone);
    return {data:q.single?(hit[0]||null):hit, error:null};
  }
  function fdAdd(s,n){ var p=s.split('-'); return new Date(Date.UTC(+p[0],+p[1]-1,+p[2])+n*864e5).toISOString().slice(0,10); }
  function fdRpc(name,args,S){
    var r=(S.diaries||{})[args.p_token], today=S.today||new Date().toISOString().slice(0,10);
    if(!r) return name==='get_food_diary'?null:{ok:false,reason:'not_found'};
    var end=fdAdd(r.start_date,r.weeks*7-1);
    if(name==='get_food_diary') return {status:(r.status==='active'&&today>end)?'ended':r.status,lang:r.lang,client_name:r.client_name,start_date:r.start_date,weeks:r.weeks,today:today,entries:clone(r.entries),comments:clone(r.comments)};
    if(r.status!=='active') return {ok:false,reason:r.status};
    if(today>end) return {ok:false,reason:'ended'};
    if(args.p_date<r.start_date||args.p_date>end||args.p_date>fdAdd(today,1)) return {ok:false,reason:'bad_date'};
    var d=args.p_day||{}, m=d.meals||{}, empty=(d.feel==null)&&!Object.keys(m).some(function(k){ return String(m[k]||'').trim(); });
    if(empty) delete r.entries[args.p_date]; else { r.entries[args.p_date]=Object.assign(clone(d),{at:new Date().toISOString()}); r.last_entry_at=new Date().toISOString(); }
    S.diarySaves=(S.diarySaves||0)+1;
    return {ok:true};
  }
  window.supabase={createClient:function(){
    return {
      from:function(t){ return new Q(t); },
      rpc:function(name,args){
        if(name==='get_food_diary'||name==='save_food_diary_day'){
          var S0=window.__SERVER=window.__SERVER||{};
          if(S0.rpcFail){ return Promise.resolve({data:null,error:{message:'network'}}); }
          return new Promise(function(r){ setTimeout(function(){ r({data:fdRpc(name,args,S0),error:null}); },20); });
        }
        var S=window.__SERVER||{}, row=(name==='get_shared_plan'&&S.shared&&args)?S.shared[args.p_token]:null;
        var p=Promise.resolve({data:row?{snapshot:clone(row.snapshot),updated_at:row.updated_at,expires_at:row.expires_at}:null,error:null});
        p.single=function(){ return p; };
        return p;
      },
      auth:{
        onAuthStateChange:function(){ return {data:{subscription:{unsubscribe:function(){}}}}; },
        getSession:function(){ return Promise.resolve({data:{session:{user:{id:window.__UID,email:'test@example.test'}}}}); },
        signOut:function(){ return Promise.resolve({error:null}); }
      }
    };
  }};
})();
