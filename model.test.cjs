const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const M=require('./dist/model.js'),S=require('./dist/storage.js');
const go=(s,type,value,extra={},now=1000)=>M.transition(s,{type,value,...extra},now);
function prepared(){let s=go(M.create(),'INTENTION',null,{task:'Essay intro',next:'Write the first sentence'});s=go(s,'BEGIN');return go(s,'SELECT','scroll');}
function start(boundary='self',remind=false){let s=go(prepared(),'BOUNDARY',boundary);if(boundary==='event')s={...s,event:'After the song'};if(remind)s=go(s,'REMIND',true);return go(s,'START',null,{id:'break-1'});}
const memory=()=>{let entries=new Map();return{getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)}};

test('Starting snapshots the self-defined study intention and defaults to no reminder',()=>{
 const s=start();assert.deepEqual(s.snapshot,{task:'Essay intro',next:'Write the first sentence'});assert.notEqual(s.snapshot,s.intention);assert.equal(s.deadline,null);assert.equal(s.remind,false);
 const changed=go(s,'INTENTION',null,{task:'Reading',next:'Page 10'});assert.equal(changed.snapshot.task,'Essay intro');assert.equal(changed.intention.task,'Reading');
});
test('Time boundaries require separate reminder consent; event endings are never detected',()=>{
 for(const b of ['self','5','10','15','lap','drink','event']){const s=start(b);assert.equal(s.deadline,null);assert.equal(go(s,'TICK',null,{},1e15).notice,false);}
 assert.throws(()=>go(prepared(),'REMIND',true));
 let s=go(prepared(),'BOUNDARY','5');s=go(s,'REMIND',true);s=go(s,'BOUNDARY','drink');assert.equal(s.remind,false);
});
test('A timed reminder appears exactly once, stays on the break screen, and can be ignored',()=>{
 const s=start('5',true);assert.equal(s.deadline,301000);assert.equal(go(s,'TICK',null,{},300999).notice,false);
 const shown=go(s,'TICK',null,{},1e6);assert.equal(shown.notice,true);assert.equal(shown.deadline,null);assert.equal(shown.view,'rest');
 const dismissed=go(shown,'DISMISS');assert.equal(go(dismissed,'TICK',null,{},1e15).notice,false);
});
test('Returning, cancelling and turning off all disarm reminders; continuing rest does not rearm',()=>{
 for(const action of ['RETURN','CANCEL_REMINDER','OFF']){const s=go(start('10',true),action);assert.equal(s.deadline,null);assert.equal(go(s,'TICK',null,{},1e15).notice,false);}
 const more=go(go(start('5',true),'RETURN'),'CONTINUE');assert.equal(more.view,'rest');assert.equal(more.deadline,null);
});
test('All five next options are available without reflection, and changing plan keeps the return snapshot',()=>{
 const n=go(start(),'RETURN');assert.equal(n.feedback,'');assert.equal(go(n,'CONTINUE').view,'rest');assert.equal(go(n,'CHANGE').view,'choose');
 for(const decision of ['study','plan','finish'])assert.equal(go(n,'DECIDE',decision).decision,decision);
 const changed=go(go(n,'DECIDE','plan'),'INTENTION',null,{task:'Read',next:'Open chapter 2'});assert.equal(changed.snapshot.task,'Essay intro');assert.equal(changed.intention.next,'Open chapter 2');
});
test('Quick-start favorites reuse an explicit ending, never a reminder, and start a new break',()=>{
 const f={activity:'scroll',custom:'',boundary:'5',event:''};const s=go(prepared(),'FAVORITE',null,{favorite:f});assert.equal(s.remind,false);assert.equal(s.boundary,'5');assert.equal(go(s,'START',null,{id:'fav-1'}).deadline,null);
 assert.throws(()=>go(s,'FAVORITE',null,{favorite:{...f,activity:'unknown'}}));
});
test('Personal activity and stopping-point validation prevents empty commitments',()=>{
 const p=go(go(M.create(),'BEGIN'),'SELECT','own');assert.throws(()=>go(p,'START',null,{id:'1'}));
 const custom={...p,custom:'Take a walk',boundary:'event',event:''};assert.throws(()=>go(custom,'START',null,{id:'1'}));
 assert.equal(go({...custom,event:'After one lap'},'START',null,{id:'1'}).view,'rest');
});
test('Records require actual reflection and retain only declared fields; overrun is explicitly self-reported',()=>{
 const n=go(start(),'RETURN');assert.throws(()=>M.record(n));const r=M.record(go(n,'FEEDBACK','some'));
 assert.equal(r.overrun,null);assert.equal(r.rating,'some');assert.deepEqual(Object.keys(r).sort(),['activity','boundary','ending','id','intention','overrun','rating','title']);
 assert.equal(M.record(go(go(n,'FEEDBACK','yes'),'OVERRUN','yes')).overrun,'yes');
});
test('Summary uses saved answers only and withholds activity patterns below three observations',()=>{
 const r=M.record(go(go(start(),'RETURN'),'FEEDBACK','yes'));assert.equal(M.summary([]).activities.length,0);assert.equal(M.summary([r,r]).activities.length,0);
 const stats=M.summary([r,{...r,rating:'some'},{...r,rating:'not'}]);assert.deepEqual(stats.activities[0],{title:'Scroll, on purpose',total:3,restored:1});assert.equal(stats.open.length,0);
 const comparison=M.summary([{...r,overrun:'yes'},{...r,boundary:'5',overrun:'no'}]);assert.equal(comparison.open.length,1);assert.equal(comparison.bounded.length,1);
});
test('Saving preferences, favorites and reflections survive reload; clearing removes everything',()=>{
 const mem=memory();const d=S.empty();d.prefs.history=true;d.prefs.rememberIntent=true;d.intention={task:'Essay',next:'First sentence'};d.favorites=[{id:'f',activity:'scroll',title:'Scroll',custom:'',boundary:'5',event:''}];d.records=[M.record(go(go(start(),'RETURN'),'FEEDBACK','yes'))];
 assert.equal(S.save(mem,d),true);assert.deepEqual(S.load(mem).data,d);d.prefs.history=false;assert.equal(S.save(mem,d),true);assert.equal(S.load(mem).data.records.length,1);
 assert.equal(S.clear(mem),true);assert.deepEqual(S.load(mem).data,S.empty());
});
test('Corrupt or unavailable storage is handled without claiming success',()=>{
 const unavailable={getItem(){throw Error('blocked')},setItem(){throw Error('full')},removeItem(){throw Error('blocked')}};assert.equal(S.load(unavailable).available,false);assert.equal(S.save(unavailable,S.empty()),false);assert.equal(S.clear(unavailable),false);
 const mem=memory();mem.setItem(S.KEY,'not json');assert.equal(S.load(mem).available,false);
 const raw={...S.empty(),favorites:[{id:'a',activity:'unknown',boundary:'self'},{id:'b',activity:'own',custom:'',boundary:'self'}]};assert.equal(S.clean(raw).favorites.length,0);
});
test('Screen and summary templates render without a browser; custom text cannot become markup',()=>{
 const els=new Map();const el=k=>{if(!els.has(k))els.set(k,{innerHTML:'',addEventListener(){},focus(){},setAttribute(){},removeAttribute(){},querySelectorAll(){return[]},querySelector(){return null}});return els.get(k)};
 const mem=memory();const context=vm.createContext({window:{PauseModel:M,PauseStorage:S,localStorage:mem,addEventListener(){},scrollTo(){}},document:{querySelector:el,querySelectorAll(){return[]},addEventListener(){}},setInterval(){},setTimeout(){},clearTimeout(){},crypto:{randomUUID:()=> 'test'},console});
 vm.runInContext(fs.readFileSync('./dist/app.js','utf8'),context);
 const n=go(start(),'RETURN');const screens=[M.create(),prepared(),start(),n,...['study','plan','finish'].map(v=>go(n,'DECIDE',v)),go(n,'OFF')];
 for(const current of screens){context.current=current;vm.runInContext('state=current;render(false)',context);assert.match(el('#main').innerHTML,/<h1>/);assert.doesNotMatch(el('#main').innerHTML,/undefined/);}
 context.current={...start(),custom:'<img src=x onerror=alert(1)>'};vm.runInContext('state=current;render(false);updatePanels()',context);assert.ok(el('#main').innerHTML.includes('&lt;img'));assert.ok(!el('#main').innerHTML.includes('<img'));
});
