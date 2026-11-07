/* Sequential email typing on a stable layout. Never replace editable markup. */
(function(global){
'use strict';const active=new WeakMap();let serial=0;
function play(target,options={}){
 if(!target)return {promise:Promise.resolve(),cancel(){}};
 active.get(target)?.cancel();let stopped=false,raf=0,resolve;const promise=new Promise(r=>resolve=r),id='ymemail'+(++serial),style=document.createElement('style'),cursor=document.createElement('i');let audio=null;
 const stop=()=>{if(stopped)return;stopped=true;cancelAnimationFrame(raf);global.CSS?.highlights?.delete(id);style.remove();cursor.remove();target.removeAttribute('data-ym-email-writing');for(const [o,e,f] of listeners)o.removeEventListener(e,f,true);if(audio){audio.close().catch(()=>{});audio=null}if(active.get(target)?.promise===promise)active.delete(target);resolve()};
 const listeners=[],on=(o,e,f)=>{o.addEventListener(e,f,true);listeners.push([o,e,f])};const handle={promise,cancel:stop};active.set(target,handle);
 if(!target.isConnected||matchMedia('(prefers-reduced-motion: reduce)').matches||!global.CSS?.highlights||!global.Highlight){stop();return handle}
 const rows=[...target.querySelectorAll('.anim-target')].filter(el=>getComputedStyle(el).display!=='none'&&el.getClientRects().length);
 const marks=[],ranges=[];let group=0;
 for(const row of rows){const walker=document.createTreeWalker(row,NodeFilter.SHOW_TEXT);for(let node;node=walker.nextNode();){if(!node.data)continue;const r=document.createRange();r.selectNodeContents(node);ranges.push(r);const seg=global.Intl?.Segmenter?[...new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(node.data)].map(x=>({start:x.index,end:x.index+x.segment.length,text:x.segment})):(()=>{let i=0;return Array.from(node.data).map(text=>{const start=i;i+=text.length;return{start,end:i,text}})})();for(const part of seg)marks.push({node,range:r,group,...part})}group++}
 if(!marks.length){stop();return handle}
 style.textContent='::highlight('+id+'){color:transparent;text-shadow:none}';document.head.append(style);CSS.highlights.set(id,new Highlight(...ranges));target.dataset.ymEmailWriting=id;
 cursor.setAttribute('aria-hidden','true');cursor.style.cssText='position:fixed;width:1px;background:currentColor;pointer-events:none;z-index:2147483600;';document.body.append(cursor);
 if(options.sound){try{audio=new (global.AudioContext||global.webkitAudioContext)();audio.resume().catch(()=>{})}catch(e){}}
 function tick(){if(!audio||audio.state!=='running')return;try{const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*.022),audio.sampleRate),d=buffer.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*1.5*(1-i/d.length)}const s=audio.createBufferSource();s.buffer=buffer;s.connect(audio.destination);s.start()}catch(e){}}
 on(target,'beforeinput',stop);on(target,'pointerdown',stop);on(global,'resize',stop);on(global,'pagehide',stop);on(document,'visibilitychange',()=>{if(document.hidden)stop()});
 let index=0,next=0,prev=-1;const speed=Math.max(.1,Number(options.speed)||1);
 const step=now=>{if(stopped)return;if(!target.isConnected){stop();return}if(now<next){raf=requestAnimationFrame(step);return}if(index>=marks.length){stop();return}const m=marks[index++];if(m.group!==prev&&prev>=0){index--;prev=m.group;next=now+100/speed;raf=requestAnimationFrame(step);return}prev=m.group;m.range.setStart(m.node,m.end);const r=document.createRange();r.setStart(m.node,m.start);r.setEnd(m.node,m.end);const b=r.getBoundingClientRect();cursor.style.cssText+='left:'+b.right+'px;top:'+b.top+'px;height:'+b.height+'px;color:'+getComputedStyle(m.node.parentElement).color+';';if(m.text.trim())tick();next=now+(5+Math.random()*15)/speed;raf=requestAnimationFrame(step)};
 raf=requestAnimationFrame(step);return handle;
}
global.ProvidedEmailMotion={play,cancel:target=>target&&active.get(target)?.cancel()};
})(window);
