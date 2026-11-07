/* Stable-layout handwriting reveal. No text removal, replacement or reflow.
   Original attachment: libfile_948b0a972d1081918bc4e6f27ce9b384 (version 0). */
(function(global){
'use strict';
const active=new WeakMap();let serial=0;
const segmenter=global.Intl?.Segmenter?new Intl.Segmenter('ja',{granularity:'grapheme'}):null;
function graphemes(text){
  if(segmenter)return [...segmenter.segment(text)].map(x=>({text:x.segment,start:x.index,end:x.index+x.segment.length}));
  let at=0;return Array.from(text).map(text=>{const start=at;at+=text.length;return{text,start,end:at}});
}
function play(target,options={}){
  active.get(target)?.cancel();
  let stopped=false,finish,raf=0;
  const promise=new Promise(r=>finish=r),id='ymdoc'+(++serial),hiddenName=id+'hidden',inkName=id+'ink';
  const style=document.createElement('style'),pen=document.createElement('i');
  const changed=[],listeners=[],nodes=[],marks=[],animations=[];
  let audio=null,currentColor='rgb(74, 59, 50)';
  const on=(obj,event,fn,opt)=>{obj.addEventListener(event,fn,opt);listeners.push(()=>obj.removeEventListener(event,fn,opt))};
  const cleanup=()=>{
    if(stopped)return;stopped=true;cancelAnimationFrame(raf);
    CSS.highlights?.delete(hiddenName);CSS.highlights?.delete(inkName);
    style.remove();pen.remove();listeners.forEach(f=>f());
    changed.forEach(([el,value])=>{if(value===null)el.removeAttribute('contenteditable');else el.setAttribute('contenteditable',value)});
    animations.forEach(a=>a.cancel());
    if(audio){audio.gain.gain.setValueAtTime(0,audio.ctx.currentTime);audio.source.stop();audio.ctx.close().catch(()=>{})}
    target.removeAttribute('data-ym-writing');if(active.get(target)?.promise===promise)active.delete(target);
    finish();
  };
  const handle={promise,cancel:cleanup};active.set(target,handle);
  if(!target?.isConnected || matchMedia('(prefers-reduced-motion: reduce)').matches || !global.CSS?.highlights || !global.Highlight){
    cleanup();return handle;
  }
  // Collect genuine text nodes before adding any presentation-only elements.
  const roots=[...target.querySelectorAll('[contenteditable="true"]')].filter(el=>!el.parentElement.closest('[contenteditable="true"]')||el.parentElement.closest('[contenteditable="true"]')===target.closest('[contenteditable="true"]'));
  const fields=roots.length?roots:[target];
  const seen=new Set();
  for(const field of fields){
    const walker=document.createTreeWalker(field,NodeFilter.SHOW_TEXT);
    for(let node;node=walker.nextNode();){
      if(seen.has(node)||!node.data||node.parentElement.closest('button,.secret-stamp,[data-ym-no-write]'))continue;
      seen.add(node);const parts=graphemes(node.data);if(!parts.some(x=>x.text.trim()))continue;
      const range=document.createRange();range.selectNodeContents(node);nodes.push(range);
      parts.forEach(part=>marks.push({node,range,...part}));
    }
  }
  if(!marks.length){cleanup();return handle}
  target.querySelectorAll('[contenteditable]').forEach(el=>{changed.push([el,el.getAttribute('contenteditable')]);el.setAttribute('contenteditable','false')});
  target.setAttribute('data-ym-writing',id);
  style.textContent='::highlight('+hiddenName+'){color:transparent;text-shadow:none}::highlight('+inkName+'){color:transparent;text-shadow:none}';
  document.head.append(style);
  const hidden=new Highlight(...nodes),ink=new Highlight();
  hidden.priority=100;ink.priority=101;CSS.highlights.set(hiddenName,hidden);CSS.highlights.set(inkName,ink);
  pen.setAttribute('aria-hidden','true');pen.dataset.ymPen='';
  pen.style.cssText='position:fixed;left:0;top:0;width:2px;height:7px;border-radius:1px 1px 2px 2px;background:#4a3b32;pointer-events:none;z-index:2147483600;transform-origin:bottom left;opacity:0;';
  document.body.append(pen);
  if(options.sound){
    try{
      const Audio=global.AudioContext||global.webkitAudioContext,ctx=new Audio();
      const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.7),ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
      for(let i=0;i<data.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*3}
      const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain).connect(ctx.destination);source.start();ctx.resume().catch(()=>{});audio={ctx,source,gain};
    }catch(e){/* Sound is optional; unavailable audio never blocks the visual. */}
  }
  const mute=()=>{if(audio)audio.gain.gain.setTargetAtTime(0,audio.ctx.currentTime,.025)};
  on(global,'resize',cleanup);on(document,'visibilitychange',()=>{if(document.hidden)cleanup()});
  on(global,'pagehide',cleanup);
  const stamp=target.querySelector('.secret-stamp');
  const restoreStamp=()=>{if(style.sheet&&style.sheet.cssRules.length>2)style.sheet.deleteRule(2)};
  if(stamp)style.sheet.insertRule('[data-ym-writing="'+id+'"] .secret-stamp{visibility:hidden}',2);
  let index=0,current=null,started=0,delayUntil=0;
  const speed=Number(options.speed)||1;
  const advance=()=>{
    if(current){current.range.setStart(current.node,current.end);ink.clear();current=null}
    if(index>=marks.length){
      if(stamp){restoreStamp();options.onStamp?.();const a=stamp.animate([{opacity:0,transform:'translate(-50%, -50%) rotate(-25deg) scale(3)'},{opacity:1,transform:'translate(-50%, -50%) rotate(-25deg) scale(1)'}],{duration:400,easing:'cubic-bezier(.175,.885,.32,1.275)'});animations.push(a);a.finished.then(cleanup,cleanup)}
      else cleanup();return false;
    }
    return true;
  };
  // Cancellation must reveal the whole unmodified document, including the stamp.
  const originalCancel=handle.cancel;
  handle.cancel=()=>{restoreStamp();originalCancel()};
  const step=now=>{
    if(stopped)return;
    if(!target.isConnected){handle.cancel();return}
    if(now<delayUntil){raf=requestAnimationFrame(step);return}
    while(!current&&index<marks.length){
      const m=marks[index++];if(!m.text.trim()){m.range.setStart(m.node,m.end);continue}
      current=m;started=now;
      const r=document.createRange();r.setStart(m.node,m.start);r.setEnd(m.node,m.end);m.inkRange=r;ink.add(r);
      currentColor=getComputedStyle(m.node.parentElement).color;pen.style.background=currentColor;
      m.duration=(/^[、。，．,.!?！？]$/.test(m.text)?65:75+Math.random()*40)/speed;
    }
    if(!current){advance();return}
    const p=Math.min(1,(now-started)/current.duration),rect=current.inkRange.getBoundingClientRect();
    // Ink appears softly while a small nib crosses the existing, fully laid-out glyph.
    style.sheet.cssRules[1].style.color='color-mix(in srgb, '+currentColor+' '+Math.round(p*100)+'%, transparent)';
    if(rect.width>0&&rect.height>0){
      const x=rect.left+rect.width*(.08+.82*p),y=rect.top+rect.height*.72+Math.sin(p*Math.PI*3)*1.2;
      pen.style.opacity='0.65';pen.style.transform='translate('+x+'px,'+(y-5)+'px) rotate(35deg)';
    }else pen.style.opacity='0';
    if(audio)audio.gain.gain.setTargetAtTime((.018+Math.sin(p*Math.PI)*.012),audio.ctx.currentTime,.018);
    if(p>=1){
      const text=current.text;mute();pen.style.opacity='0';
      if(!advance())return;
      delayUntil=now+(/^[、。，．,.!?！？]$/.test(text)?140:12)/speed;
    }
    raf=requestAnimationFrame(step);
  };
  // Keep the stamp visible on every exit, including resize and reduced motion.
  promise.finally(restoreStamp);
  raf=requestAnimationFrame(step);return handle;
}
global.DocumentWriting={play,cancel:target=>active.get(target)?.cancel(),graphemes};
})(window);
