(function(root){
'use strict';
const KEY='pause-private-v1';
function empty(){return {version:1,prefs:{history:false,reflection:true,rememberIntent:false},intention:{task:'',next:''},favorites:[],records:[]};}
const txt=(v,n=300)=>typeof v==='string'?v.slice(0,n):'';
function clean(raw){
 const d=empty();if(!raw||raw.version!==1)return d;
 d.prefs={history:raw.prefs?.history===true,reflection:raw.prefs?.reflection!==false,rememberIntent:raw.prefs?.rememberIntent===true};
 if(d.prefs.rememberIntent)d.intention={task:txt(raw.intention?.task),next:txt(raw.intention?.next)};
 const activityIds=['window','nothing','wander','song','chat','message','drink','step-away','set-down','stretch','scroll','own'];
 const validBoundary=b=>['self','5','10','15','lap','drink','event'].includes(b);
 if(Array.isArray(raw.favorites))d.favorites=raw.favorites.filter(x=>x&&(x.activity!=='own'||txt(x.custom).trim())&&(x.boundary!=='event'||txt(x.event).trim())&&typeof x.id==='string'&&activityIds.includes(x.activity)&&validBoundary(x.boundary)).map(x=>({id:txt(x.id,100),activity:txt(x.activity,50),title:txt(x.title,160),custom:txt(x.custom,160),boundary:x.boundary,event:txt(x.event,160)}));
 if(Array.isArray(raw.records))d.records=raw.records.filter(x=>x&&typeof x.id==='string'&&activityIds.includes(x.activity)&&validBoundary(x.boundary)&&['not','some','yes'].includes(x.rating)).map(x=>({id:txt(x.id,100),activity:txt(x.activity,50),title:txt(x.title,160),intention:{task:txt(x.intention?.task),next:txt(x.intention?.next)},boundary:x.boundary,ending:txt(x.ending,160),rating:x.rating,overrun:['yes','no'].includes(x.overrun)?x.overrun:null}));
 return d;
}
function load(storage){try{const raw=storage.getItem(KEY);return {data:raw?clean(JSON.parse(raw)):empty(),available:true};}catch{return {data:empty(),available:false};}}
function save(storage,data){try{storage.setItem(KEY,JSON.stringify(clean(data)));return true;}catch{return false;}}
function clear(storage){try{storage.removeItem(KEY);return true;}catch{return false;}}
const api={KEY,empty,clean,load,save,clear};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PauseStorage=api;
})(typeof window!=='undefined'?window:globalThis);
