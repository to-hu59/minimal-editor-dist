/* Play provided documents where they are read, without moving or rewriting text. */
(function(global){
'use strict';
const seen=new Set(),active=new Map(),observed=new Map();let io=null,root=null,settings={},chapter='',mutation=null,queued=false;
const documents=()=>root?[...root.querySelectorAll('.ymdoc .letter-container,.ymdoc .report-container')].filter(el=>!el.closest('#reader-editor-box,[data-ym-doc-editing]')):[];
const enabled=()=>settings.enabled!==false&&root?.isConnected&&!root.classList.contains('editing')&&root.getClientRects().length>0&&getComputedStyle(root).visibility!=='hidden';
function cancel(el){active.get(el)?.cancel();active.delete(el);}
function clean(){for(const el of active.keys())if(!enabled()||!el.isConnected||!root.contains(el))cancel(el);for(const el of observed.keys())if(!enabled()||!el.isConnected||!root.contains(el)){io?.unobserve(el);observed.delete(el);}}
function keyFor(el,i){return chapter+':'+i+':'+el.textContent;}
function play(el,key){
 if(!enabled()||!el.isConnected)return;observed.delete(el);io?.unobserve(el);seen.add(key);
 if(!global.DocumentWriting||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const handle=DocumentWriting.play(el,{sound:!!settings.sound});active.set(el,handle);
 handle.promise.then(()=>{if(active.get(el)===handle)active.delete(el)});
}
function scan(nextRoot,nextSettings,nextChapter){
 if(nextRoot){root=nextRoot;settings=nextSettings||{};chapter=String(nextChapter||'');}
 clean();if(!enabled())return;
 if(!io)io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting&&observed.has(e.target))play(e.target,observed.get(e.target));},{threshold:.01});
 documents().forEach((el,i)=>{const key=keyFor(el,i);if(seen.has(key)||active.has(el)||observed.has(el))return;observed.set(el,key);io.observe(el);});
 if(!mutation){mutation=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;clean();});});mutation.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});}
}
function replay(nextRoot,nextSettings,nextChapter){
 if(nextRoot){root=nextRoot;settings=nextSettings||settings;chapter=String(nextChapter||chapter);}
 const docs=documents();docs.forEach((el,i)=>{cancel(el);io?.unobserve(el);observed.delete(el);seen.delete(keyFor(el,i));});scan();return docs.length>0;
}
document.addEventListener('pointerdown',e=>{const el=e.target.closest?.('.ymdoc .letter-container,.ymdoc .report-container');if(el&&active.has(el))cancel(el);});
global.addEventListener('resize',()=>{for(const el of active.keys())cancel(el)});
global.addEventListener('pagehide',()=>{for(const el of active.keys())cancel(el);io?.disconnect();observed.clear();});
global.ProvidedDocumentReader={scan,replay,cancel,reset(){for(const el of active.keys())cancel(el);seen.clear();io?.disconnect();observed.clear();}};
})(window);