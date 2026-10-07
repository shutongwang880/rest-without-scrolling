const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const M=require('./dist/model.js');
const go=(s,type,value,extra={})=>M.transition(s,{type,value,...extra});
const start=()=>go(go(M.create(),'SELECT','scroll'),'START',undefined,{custom:''});

test('The core journey has exactly three steps, with selection on the first screen',()=>{
 let s=M.create();assert.equal(s.view,'choose');
 s=go(s,'NEED','company');assert.equal(s.view,'choose');
 s=go(s,'SELECT','message');assert.equal(s.view,'choose');
 s=go(s,'START',undefined,{custom:''});assert.equal(s.view,'rest');
 s=go(s,'RETURN');assert.equal(s.view,'next');
 for(const decision of ['study','plan','finish']){const next=go(s,'DECIDE',decision);assert.equal(next.view,'next');assert.equal(next.decision,decision);}
});
test('Needs change suggestions while scrolling, doing nothing and own choices stay available',()=>{
 const sets=M.needs.map(n=>M.getOptions(go(M.create(),'NEED',n.id)).map(x=>x.id));
 assert.equal(new Set(sets.map(x=>x.slice(0,2).join(','))).size,5);
 for(const ids of sets)for(const id of ['scroll','nothing','own'])assert.ok(ids.includes(id));
 const changed=go(go(M.create(),'SELECT','scroll'),'NEED','company');assert.equal(changed.selected,null);
});
test('More rest and changing breaks work without reflection or an automatic study return',()=>{
 const next=go(start(),'RETURN');assert.equal(next.feedback,'');
 assert.equal(go(next,'CONTINUE').view,'rest');assert.equal(go(next,'CHANGE').view,'choose');
 for(const feeling of ['helped','same','more']){const s=go(next,'FEEDBACK',feeling);assert.equal(s.view,'next');assert.equal(s.decision,null);assert.equal(go(s,'CONTINUE').view,'rest');}
});
test('Already-on-a-break skips setup; opt-out and restart are available from every main step',()=>{
 const next=go(M.create(),'ALREADY');assert.equal(next.view,'next');assert.equal(next.selected.id,'scroll');assert.equal(go(next,'CONTINUE').view,'rest');
 for(const s of [M.create(),start(),next]){const off=go(s,'OFF');assert.equal(off.enabled,false);assert.equal(off.view,'off');assert.deepEqual(go(off,'RESET'),M.create());}
});
test('Custom breaks require a choice but no extra screen; invalid actions leave state unchanged',()=>{
 const initial=M.create();assert.throws(()=>go(initial,'START',undefined,{custom:''}));
 const chosen=go(initial,'SELECT','own');assert.equal(chosen.view,'choose');
 assert.throws(()=>go(chosen,'START',undefined,{custom:' '}));
 const rest=go(chosen,'START',undefined,{custom:' Call a friend '});assert.equal(rest.custom,'Call a friend');assert.equal(rest.view,'rest');
 assert.throws(()=>go(rest,'NEED','company'));assert.throws(()=>go(initial,'SELECT','invalid'));assert.deepEqual(initial,M.create());
});
test('All screen templates render and personal text is escaped; no timers are installed',()=>{
 const els=new Map();const el=key=>{if(!els.has(key))els.set(key,{innerHTML:'',addEventListener(){},focus(){},setAttribute(){},removeAttribute(){}});return els.get(key)};
 const context=vm.createContext({window:{PauseModel:M,scrollTo(){}},document:{querySelector:el,querySelectorAll(){return[]}},console});
 vm.runInContext(fs.readFileSync('./dist/app.js','utf8'),context);
 const next=go(start(),'RETURN');
 const states=[M.create(),go(M.create(),'SELECT','own'),start(),next,...['study','plan','finish'].map(x=>go(next,'DECIDE',x)),go(next,'OFF')];
 for(const s of states){context.current=s;vm.runInContext('state=current;render(false)',context);assert.match(el('#main').innerHTML,/<h1>/);assert.doesNotMatch(el('#main').innerHTML,/undefined/);}
 context.current=go(go(M.create(),'SELECT','own'),'START',undefined,{custom:'<img src=x onerror=alert(1)>'});vm.runInContext('state=current;render(false)',context);assert.ok(el('#main').innerHTML.includes('&lt;img'));assert.ok(!el('#main').innerHTML.includes('<img'));
 assert.equal((fs.readFileSync('./dist/index.html','utf8').match(/data-step=/g)||[]).length,3);
 assert.doesNotMatch(fs.readFileSync('./dist/app.js','utf8'),/setInterval|setTimeout/);
});
