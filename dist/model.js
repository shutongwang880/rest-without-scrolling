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
function create(){return {view:'choose',need:'unsure',selected:null,custom:'',feedback:'',decision:null,enabled:true};}
function getOptions(s){
 const list=[...(options[s.need]||options.unsure),options['switch-off'][1],scroll,own];
 return list.filter((x,i)=>list.findIndex(y=>y.id===x.id)===i);
}
function transition(s,action){
 const n={...s};const fail=()=>{throw new Error('Invalid break action: '+action.type)};
 switch(action.type){
 case'NEED':if(s.view!=='choose'||!needs.some(x=>x.id===action.value))fail();n.need=action.value;n.selected=null;n.custom='';break;
 case'SELECT':{if(s.view!=='choose')fail();const chosen=getOptions(s).find(x=>x.id===action.value);if(!chosen)fail();n.selected=chosen;n.custom='';break;}
 case'START':if(s.view!=='choose'||!s.selected||typeof action.custom!=='string')fail();if(s.selected.id==='own'&&!action.custom.trim())fail();n.custom=action.custom.trim().slice(0,160);n.view='rest';n.feedback='';n.decision=null;break;
 case'RETURN':if(s.view!=='rest')fail();n.view='next';break;
 case'ALREADY':return {...create(),view:'next',selected:scroll};
 case'FEEDBACK':if(s.view!=='next'||!['helped','same','more'].includes(action.value))fail();n.feedback=action.value;break;
 case'CONTINUE':if(s.view!=='next')fail();n.view='rest';n.decision=null;break;
 case'CHANGE':n.view='choose';n.selected=null;n.custom='';n.decision=null;n.feedback='';break;
 case'DECIDE':if(s.view!=='next'||!['study','plan','finish'].includes(action.value))fail();n.decision=action.value;break;
 case'OFF':n.enabled=false;n.view='off';break;
 case'RESET':return create();
 default:fail();
 }return n;
}
const api={needs,getOptions,create,transition};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PauseModel=api;
})(typeof window!=='undefined'?window:globalThis);
