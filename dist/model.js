(function(root){
'use strict';
const needs=[
 {id:'switch-off',title:'To switch my brain off',description:'Less input. Nothing to keep up with.'},
 {id:'interest',title:'Something more interesting',description:'A change from what I’ve been working on.'},
 {id:'company',title:'A bit of company',description:'To feel connected to someone.'},
 {id:'distance',title:'To get away from this task',description:'It feels like a lot right now.'},
 {id:'unsure',title:'I’m not sure',description:'I just picked up my phone.'}
];
const options={
 'switch-off':[
  {id:'window',title:'Look out of a window',description:'Let your eyes settle somewhere beyond the screen.',instruction:'Find a window or a comfortable place to sit. You don’t need to look for anything in particular.',cue:'When I feel ready to look away'},
  {id:'nothing',title:'Do nothing for a bit',description:'No exercise, audio, or instructions.',instruction:'Sit, lie down, or get comfortable. There isn’t anything to follow or finish.',cue:''}],
 'interest':[
  {id:'wander',title:'Go somewhere else for a moment',description:'Another room, the corridor, or outside.',instruction:'Choose somewhere easy to get to. Notice whatever catches your attention; you don’t need to make it a walk with a purpose.',cue:'When I get back to my desk'},
  {id:'song',title:'Listen to one song',description:'Something you already like. No need to find the perfect track.',instruction:'Put on a song you like using your own music app. You can put your screen down while it plays.',cue:'When the song ends'}],
 'company':[
  {id:'chat',title:'Find someone for a quick chat',description:'A housemate, a friend, or someone nearby.',instruction:'If someone is available, say hello. You don’t need to talk about studying.',cue:'When the conversation finds a natural end'},
  {id:'message',title:'Message one person',description:'Go straight to someone you want to hear from.',instruction:'Open your usual messaging app and send that person a message. You don’t need to stay online waiting for a reply.',cue:'After I’ve sent my message'}],
 'distance':[
  {id:'drink',title:'Go and make a drink',description:'Give yourself a reason to step away from the desk.',instruction:'Make some tea, get water, or choose something you enjoy. The task can wait while you do that.',cue:'When my drink is ready'},
  {id:'step-away',title:'Leave the task where it is',description:'You don’t have to solve it before you take a break.',instruction:'Move somewhere comfortable. You can decide later whether you want to return, try a different task, or stop for today.',cue:''}],
 'unsure':[
  {id:'set-down',title:'Set my phone down for a moment',description:'See what I feel like doing without choosing a new app.',instruction:'Set your phone somewhere convenient. Let the next moment be undecided.',cue:''},
  {id:'stretch',title:'Change position',description:'Stand, stretch, or move in a way that suits you.',instruction:'Find a position that feels more comfortable. A small change is enough; this isn’t an exercise routine.',cue:'When I feel a bit more comfortable'}]
};
const scroll={id:'scroll',title:'Scroll, on purpose',description:'That can be the break you want, too.',instruction:'Use whichever app you had in mind. You can choose a stopping point, or leave it open. This page won’t watch or block it.',cue:'After this video or thread'};
const own={id:'own',title:'Something of my own',description:'Choose what works for you.',instruction:'You can make your own kind of break.',cue:''};
const boundaries={self:"I’ll come back myself",'5':'About 5 minutes','10':'About 10 minutes','15':'About 15 minutes',lap:'After one lap',drink:'When I finish this drink',event:'Another stopping point'};
const ratings={not:'Not really',some:'A little',yes:'Yes'};
const isTimed=boundary=>['5','10','15'].includes(boundary);
const text=(x,max=300)=>typeof x==='string'?x.trim().slice(0,max):'';
function create(intention={task:'',next:''}){return {view:'study',intention:{task:text(intention.task),next:text(intention.next)},snapshot:null,need:'unsure',selected:null,custom:'',boundary:'self',event:'',remind:false,deadline:null,notice:false,breakId:null,feedback:'',overrun:'',saved:false,decision:null,enabled:true};}
function allActivities(){return [...Object.values(options).flat(),scroll,own];}
function getOptions(s){const list=[...(options[s.need]||options.unsure),options['switch-off'][1],scroll,own];return list.filter((x,i)=>list.findIndex(y=>y.id===x.id)===i);}
function boundaryLabel(s){return s.boundary==='event'?s.event:boundaries[s.boundary];}
function transition(s,a,now=Date.now()){
 const n={...s};const fail=()=>{throw new Error('Invalid break action: '+a.type)};
 switch(a.type){
 case'INTENTION':n.intention={task:text(a.task),next:text(a.next)};break;
 case'BEGIN':n.view='choose';n.enabled=true;n.selected=null;n.custom='';n.boundary='self';n.event='';n.remind=false;n.decision=null;n.deadline=null;break;
 case'NEED':if(s.view!=='choose'||!needs.some(x=>x.id===a.value))fail();n.need=a.value;n.selected=null;n.custom='';break;
 case'SELECT':{if(s.view!=='choose')fail();const chosen=getOptions(s).find(x=>x.id===a.value);if(!chosen)fail();n.selected=chosen;n.custom='';break;}
 case'BOUNDARY':if(!Object.hasOwn(boundaries,a.value))fail();n.boundary=a.value;n.remind=false;break;
 case'REMIND':if(a.value&&!isTimed(s.boundary))fail();n.remind=!!a.value;break;
 case'FAVORITE':{const f=a.favorite;const activity=allActivities().find(x=>x.id===f?.activity);if(!activity||!Object.hasOwn(boundaries,f.boundary))fail();n.selected=activity;n.custom=text(f.custom,160);n.boundary=f.boundary;n.event=text(f.event,160);n.remind=false;n.view='choose';break;}
 case'START':if(s.view!=='choose'||!s.selected||!text(a.id,100))fail();if(s.selected.id==='own'&&!text(s.custom,160))fail();if(s.boundary==='event'&&!text(s.event,160))fail();n.snapshot={...s.intention};n.custom=text(s.custom,160);n.event=text(s.event,160);n.breakId=text(a.id,100);n.view='rest';n.feedback='';n.overrun='';n.saved=false;n.decision=null;n.notice=false;n.deadline=s.remind&&isTimed(s.boundary)?now+Number(s.boundary)*60000:null;break;
 case'TICK':if(s.enabled&&s.view==='rest'&&s.deadline!==null&&now>=s.deadline){n.notice=true;n.deadline=null;n.remind=false;}break;
 case'DISMISS':case'CANCEL_REMINDER':n.notice=false;n.deadline=null;n.remind=false;break;
 case'RETURN':if(s.view!=='rest')fail();n.view='next';n.deadline=null;n.notice=false;n.remind=false;break;
 case'FEEDBACK':if(s.view!=='next'||!Object.hasOwn(ratings,a.value))fail();n.feedback=a.value;n.saved=false;break;
 case'OVERRUN':if(s.view!=='next'||!['yes','no',''].includes(a.value))fail();n.overrun=a.value;n.saved=false;break;
 case'SAVED':n.saved=true;break;
 case'CONTINUE':if(s.view!=='next')fail();n.view='rest';n.decision=null;n.deadline=null;n.notice=false;n.remind=false;break;
 case'CHANGE':n.view='choose';n.selected=null;n.custom='';n.boundary='self';n.event='';n.remind=false;n.deadline=null;n.notice=false;n.decision=null;n.feedback='';n.overrun='';break;
 case'DECIDE':if(s.view!=='next'||!['study','plan','finish'].includes(a.value))fail();n.decision=a.value;break;
 case'OFF':n.enabled=false;n.view='off';n.deadline=null;n.notice=false;n.remind=false;break;
 case'RESET':return create(s.intention);
 default:fail();
 }return n;
}
function record(s){if(!s.breakId||!s.selected||!Object.hasOwn(ratings,s.feedback))throw new Error('Choose a reflection before saving.');return {id:s.breakId,activity:s.selected.id,title:s.custom||s.selected.title,intention:{...s.snapshot},boundary:s.boundary,ending:boundaryLabel(s),rating:s.feedback,overrun:s.overrun||null};}
function summary(records){
 const groups=new Map();for(const r of records){const key=r.activity==='own'?r.title:r.activity;if(!groups.has(key))groups.set(key,{title:r.title,total:0,restored:0});const g=groups.get(key);g.total++;if(r.rating==='yes')g.restored++;}
 return {activities:[...groups.values()].filter(x=>x.total>=3),open:records.filter(r=>r.boundary==='self'&&r.overrun!==null),bounded:records.filter(r=>r.boundary!=='self'&&r.overrun!==null)};
}
const api={needs,ratings,boundaries,isTimed,getOptions,allActivities,boundaryLabel,create,transition,record,summary};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PauseModel=api;
})(typeof window!=='undefined'?window:globalThis);
