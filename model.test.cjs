const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const M=require('./dist/model.js');
const go=(s,type,value,extra={})=>M.transition(s,{type,value,...extra},1000);
function breakState(minutes=0){let s=go(M.create(),'NEED','company');s=go(s,'SELECT','message');return go(s,'START',undefined,{minutes,cue:'After my message',custom:''});}

test('Each need leads to distinct relevant options, with scrolling and own choice always available',()=>{
 const sets=M.needs.map(n=>M.getOptions(go(M.create(),'NEED',n.id)).map(o=>o.id));
 assert.equal(new Set(sets.map(x=>x.slice(0,2).join(','))).size,5);
 for(const set of sets){assert.ok(set.includes('scroll'));assert.ok(set.includes('own'));}
});
test('A default break has no deadline and stays open indefinitely',()=>{
 const s=breakState();assert.equal(s.deadline,null);assert.equal(M.transition(s,{type:'TICK'},1e15).view,'away');
});
test('A chosen reminder appears once, including after background time, and never returns to study',()=>{
 const s=breakState(5);assert.equal(M.transition(s,{type:'TICK'},300999).view,'away');
 const reminded=M.transition(s,{type:'TICK'},900000);assert.equal(reminded.view,'checkin');assert.equal(reminded.source,'timed');assert.equal(reminded.deadline,null);
 const continued=go(reminded,'CONTINUE');assert.equal(M.transition(continued,{type:'TICK'},1e15).view,'away');
});
test('Turning support off and cancelling reminders prevent all later prompts',()=>{
 for(const action of ['OFF','CANCEL_REMINDER']){const s=go(breakState(10),action);assert.equal(s.deadline,null);assert.equal(M.transition(s,{type:'TICK'},1e15).view,s.view);}
});
test('Already-scrolling entry is self initiated and supports continued scrolling without reflection',()=>{
 const s=go(M.create(),'ENTRY','scrolling');assert.equal(s.source,'self');assert.equal(s.selected.id,'scroll');
 const next=go(s,'CONTINUE');assert.equal(next.view,'away');assert.equal(next.feedback,'');assert.equal(next.deadline,null);
});
test('All next steps remain available regardless of feedback, and reflection is optional',()=>{
 for(const feedback of ['', 'yes','unsure','no']){
  let s=go(breakState(),'CHECKIN');if(feedback)s=go(s,'FEEDBACK',feedback);
  assert.equal(go(s,'CONTINUE').view,'away');assert.equal(go(s,'RETHINK').view,'needs');
  for(const outcome of ['return','plan','end'])assert.equal(go(s,'NEXT',outcome).outcome,outcome);
 }
});
test('Personal choice and an empty stopping cue are supported; invalid inputs preserve prior state',()=>{
 let s=go(M.create(),'SELECT','own');const prior=JSON.stringify(s);
 assert.throws(()=>go(s,'START',undefined,{minutes:0,cue:'',custom:''}));assert.equal(JSON.stringify(s),prior);
 s=go(s,'START',undefined,{minutes:0,cue:'',custom:'Call my sister'});assert.equal(s.custom,'Call my sister');assert.equal(s.cue,'');
 assert.throws(()=>go(s,'START',undefined,{minutes:-1,cue:'',custom:'x'}));assert.throws(()=>go(s,'NEED','invented'));
 assert.deepEqual(go(s,'RESET'),M.create());
});
test('Every screen renders, and personal text is escaped before insertion into HTML',()=>{
 const elements=new Map();
 const el=key=>{if(!elements.has(key))elements.set(key,{innerHTML:'',disabled:false,addEventListener(){},focus(){},querySelectorAll(){return[]},setAttribute(){},removeAttribute(){}});return elements.get(key)};
 const context=vm.createContext({window:{PauseModel:M,scrollTo(){}},document:{querySelector:el,querySelectorAll(){return[]},addEventListener(){}},setInterval(){},setTimeout(){},clearTimeout(){},console});
 vm.runInContext(fs.readFileSync('./dist/app.js','utf8'),context);
 const s=breakState();
 const screens=[M.create(),go(M.create(),'NEED','company'),go(M.create(),'SELECT','scroll'),s,go(s,'CHECKIN'),go(s,'NEXT','plan'),go(s,'NEXT','return'),go(s,'NEXT','end'),go(s,'OFF')];
 for(const state of screens){context.screenState=state;vm.runInContext('state=screenState;render(false)',context);assert.match(el('#main').innerHTML,/<h1>/);assert.doesNotMatch(el('#main').innerHTML,/undefined/);}
 context.screenState={...go(s,'SAVE_PLAN','<img src=x onerror=alert(1)>'),outcome:'plan'};vm.runInContext('state=screenState;render(false)',context);
 assert.ok(el('#main').innerHTML.includes('&lt;img'));assert.ok(!el('#main').innerHTML.includes('<img'));
});
