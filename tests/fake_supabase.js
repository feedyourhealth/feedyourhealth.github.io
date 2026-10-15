// Fake supabase-js for sync tests. Server state lives in window.__SERVER (injected per page).
(function(){
  function clone(x){ return x==null?x:JSON.parse(JSON.stringify(x)); }
  function Q(t){ this.t=t; this.op='select'; this.f={}; this.p=null; this.single=false; }
  ['in','order','gte','lte','gt','lt','range','limit','neq','not','is','or','like','ilike','filter','match','contains'].forEach(function(m){
    Q.prototype[m]=function(){ return this; };
  });
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
    var S=window.__SERVER;
    S.calls=S.calls||[]; S.calls.push(this.t+':'+this.op);
    if(this.t==='shared_plans'){   // κρατά ό,τι δημοσιεύεται, για το get_shared_plan παρακάτω
      S.shared=S.shared||{};
      if(this.op==='upsert'&&this.p&&this.p.token) S.shared[this.p.token]=clone(this.p);
      if(this.op==='update'&&this.f.token&&S.shared[this.f.token]) Object.assign(S.shared[this.f.token],clone(this.p));
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
  window.supabase={createClient:function(){
    return {
      from:function(t){ return new Q(t); },
      rpc:function(name,args){
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
