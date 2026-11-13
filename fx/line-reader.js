/* Shared reader/inline-edit adapter. It changes only the displayed copy, never stored data in reader mode. */
(() => {
'use strict';
const attached=new WeakMap(),live=new Map();
const cleanup=()=>{for(const [frame,api] of live)if(!frame.isConnected)api.dispose()};
new MutationObserver(cleanup).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pagehide',()=>{for(const api of live.values())api.dispose()});
const textOf=node=>{const walk=n=>n.nodeType===3?n.data:n.nodeType!==1||n.hasAttribute('data-line-tail')?'':n.tagName==='BR'?'\n':[...n.childNodes].map(walk).join('')+(/^(DIV|P)$/.test(n.tagName)?'\n':'');return [...node.childNodes].map(walk).join('');};
function attach(frame,{editable=false,onChange,onHistory,enabled=false}={}){
 if(attached.has(frame))return attached.get(frame);
 const win=frame.contentWindow,doc=frame.contentDocument;if(!doc)return;
 // A reader illustration must not navigate into the maker's chat list or call UI.
 // Let reading gestures reach the parent; inline editing remains interactive.
 frame.style.pointerEvents=editable?'auto':'none';if(!editable)frame.tabIndex=-1;
 let disposed=false,composing=false,playing=[],played=false,raf=0;
 const style=doc.createElement('style');style.textContent=`html,body{height:auto!important;overflow:hidden!important}.reader .chat-message-text{line-height:1.5}.reader #phoneFrame{height:auto!important;min-height:0!important;overflow:visible!important}.reader #phoneFrame>.flex-1,.reader #viewRoom,.reader #viewFriends,.reader #viewChats{flex:none!important;overflow:visible!important}.reader #statusBar{height:22px}.reader #roomHeader{height:40px}.reader #roomMessageArea{flex:none!important;min-height:0;overflow:visible!important;padding-top:8px;padding-bottom:8px}.reader #roomMessageArea>:not([hidden])~:not([hidden]){margin-top:8px}.reader .msg-row{min-width:0;max-width:100%}.reader .msg-row>img+div{flex:1;min-width:0}.reader .msg-row>img+div>div{min-width:0;max-width:100%}.reader .msg-row>img+div>div>:first-child{min-width:0}.reader .line-text-bubble{min-width:0;max-width:100%;padding-top:6px;padding-bottom:6px}.reader #viewFriends>.overflow-y-auto,.reader #chatRoomList{overflow:visible!important}.reader [data-line-edit]{cursor:text!important;white-space:pre-wrap!important;overflow-wrap:anywhere;min-width:.4em;display:inline-block;outline:none}.reader [data-line-edit]:focus{box-shadow:0 1px 0 currentColor}.reader #roomHeaderTitle[data-line-edit]{text-overflow:clip;overflow:visible}.reader .chat-message-text[data-line-edit]:empty:before{content:' ';white-space:pre}`;
 // Keep mobile text at 14px/21px; reclaim decorative chrome and spacing only.
 // Six bottom pixels also contain the message entrance animation.
 style.textContent+="@media(max-width:399px){.reader #statusBar{height:18px}.reader #roomHeader{height:32px}.reader #roomMessageArea{padding:2px 4px 6px}.reader #roomMessageArea>:not([hidden])~:not([hidden]){margin-top:4px}.reader .msg-row{gap:2px}.reader .msg-row>img{width:24px;height:24px}.reader .msg-row>img+div>div{gap:2px}.reader .line-text-bubble{padding:4px 6px}.reader .bubble-left-line::before{left:-2px;border-right-width:4px}.reader .bubble-right-line::before,.reader .bubble-right-kakao::before{right:-2px;border-left-width:4px}}";style.textContent+='@media(max-width:399px){.reader[data-line-spacing="1"] #roomMessageArea{padding-top:4px;padding-bottom:8px}.reader[data-line-spacing="1"] #roomMessageArea>:not([hidden])~:not([hidden]){margin-top:6px}.reader[data-line-spacing="1"] .line-text-bubble{padding-top:5px;padding-bottom:5px}.reader[data-line-spacing="2"] #roomMessageArea{padding-top:6px;padding-bottom:10px}.reader[data-line-spacing="2"] #roomMessageArea>:not([hidden])~:not([hidden]){margin-top:8px}.reader[data-line-spacing="2"] .line-text-bubble{padding-top:6px;padding-bottom:6px}}';doc.documentElement.dataset.lineSpacing=frame.parentElement.dataset.lineSpacing||'0';doc.head.append(style);
 function finish(){playing.forEach(a=>a.cancel());playing=[];}
 function play(){finish();if(editable||!enabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const range=frame.parentElement.dataset.lineSlice?.split(',').map(Number),rows=[...doc.querySelectorAll('#roomMessageArea>div')].filter(row=>{const r=row.getBoundingClientRect();return !range||(r.bottom>range[0]&&r.top<range[1])});if(frame.dataset.lineSound==='1')rows.forEach((row,i)=>{const tm=setTimeout(()=>{try{window.fxLinePop&&window.fxLinePop()}catch(e){}},Math.min(i,18)*240);playing.push({cancel:()=>clearTimeout(tm)})});rows.forEach((row,i)=>playing.push(row.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,delay:Math.min(i,18)*240,fill:'backwards',easing:'ease-out'})));played=true;frame.dataset.linePlayed='1';}
 function resize(){if(!frame.isConnected){dispose();return;}const phone=doc.getElementById('phoneFrame');if(!phone)return;const h=Math.ceil(phone.getBoundingClientRect().height);if(h>0&&Math.abs(frame.getBoundingClientRect().height-h)>1){frame.style.height=h+'px';frame.style.maxHeight='none';frame.dispatchEvent(new CustomEvent('line-reader-resize',{bubbles:true}));}}
 function changed(node){const p=JSON.parse(node.dataset.lineEdit),value=textOf(node);const snapshot=win.lineMakerInlineUpdate({...p,value});onChange?.(snapshot,{...p,value,composing});requestAnimationFrame(resize);}
 function editableField(node,params,label){if(!node||node.dataset.lineEdit)return;node.dataset.lineEdit=JSON.stringify(params);node.contentEditable='true';node.setAttribute('role','textbox');node.setAttribute('aria-label',label);node.setAttribute('aria-multiline','true');node.tabIndex=0;
  node.addEventListener('click',e=>e.stopPropagation());node.addEventListener('contextmenu',e=>e.stopPropagation());
  node.addEventListener('compositionstart',()=>{composing=true;onChange?.(null,{composing:true})});node.addEventListener('compositionend',()=>{composing=false;changed(node)});node.addEventListener('input',()=>changed(node));
  node.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.altKey&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();if(!composing)onHistory?.(e.key.toLowerCase()==='y'||e.shiftKey?1:-1)}});
  const insert=text=>{const s=win.getSelection();if(!s.rangeCount)return;const r=s.getRangeAt(0);if(!node.contains(r.commonAncestorContainer))return;const rest=r.cloneRange();rest.selectNodeContents(node);rest.setStart(r.endContainer,r.endOffset);const atEnd=!rest.toString();r.deleteContents();const frag=doc.createDocumentFragment();String(text).split(/\r\n?|\n/).forEach((part,i)=>{if(i)frag.append(doc.createElement('br'));frag.append(doc.createTextNode(part))});const last=frag.lastChild;r.insertNode(frag);if(last){if(atEnd&&/[\r\n]$/.test(text)&&!node.querySelector('[data-line-tail]')){const tail=doc.createElement('br');tail.dataset.lineTail='';node.append(tail)}r.setStartAfter(last);}r.collapse(true);s.removeAllRanges();s.addRange(r);changed(node);};
  node.addEventListener('beforeinput',e=>{if(!e.isComposing&&['insertParagraph','insertLineBreak'].includes(e.inputType)){e.preventDefault();insert('\n')}});node.addEventListener('paste',e=>{e.preventDefault();insert(e.clipboardData.getData('text/plain'))});
 }
 function prepare(){if(disposed)return;doc.querySelectorAll('.chat-message-text').forEach(node=>node.parentElement.classList.add('line-text-bubble'));try{if(editable){const s=win.lineMakerSnapshot().fullState,room=s.rooms.find(r=>r.id===s.activeRoomId);if(room){editableField(doc.getElementById('roomHeaderTitle'),{roomId:room.id,field:'title'},'トーク名');[...doc.querySelectorAll('#roomMessageArea>div')].forEach((row,i)=>{const m=room.messages[i];if(!m)return;editableField(row.querySelector('.chat-message-text')||(['date','system','unsent'].includes(m.type)?row.querySelector('span'):null),{roomId:room.id,messageId:m.id,field:'text'},'メッセージの本文');});}}resize();}catch(_){} }
 const ro=new win.ResizeObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(resize)});ro.observe(doc.getElementById('phoneFrame'));const mo=new win.MutationObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(prepare)});mo.observe(doc.getElementById('phoneFrame'),{childList:true,subtree:true});
 const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!played)play()},{threshold:0});io.observe(frame);
 function dispose(){if(disposed)return;disposed=true;finish();ro.disconnect();mo.disconnect();io.disconnect();cancelAnimationFrame(raf);attached.delete(frame);live.delete(frame)}
 const api={setEnabled(value){enabled=value;if(!enabled)finish();else if(!played&&frame.getBoundingClientRect().bottom>0&&frame.getBoundingClientRect().top<innerHeight)play()},replay(){played=false;play()},dispose};attached.set(frame,api);live.set(frame,api);prepare();Promise.all([doc.fonts?.ready,...[...doc.querySelectorAll('#phoneFrame img')].filter(img=>img.getBoundingClientRect().width>0).map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})}))]).then(async()=>{if(disposed)return;const sample=doc.getElementById('phoneFrame')?.textContent||'';await Promise.race([Promise.all(['400','500','700'].map(weight=>document.fonts?.load(weight+" 14px 'Noto Sans JP'",sample).catch(()=>{}))),new Promise(resolve=>setTimeout(resolve,1500))]);if(disposed)return;prepare();frame.dataset.lineReady='1';frame.style.visibility='visible';frame.dispatchEvent(new CustomEvent('line-reader-ready',{bubbles:true}));});return api;
}
function scan(root,{enabled=true,sound=false}={}){cleanup();enabled=enabled&&!root?.classList.contains('editing');root?.querySelectorAll('.ym-line-view iframe:not([data-line-inline])').forEach(frame=>{frame.dataset.lineAnimate=String(enabled);frame.dataset.lineSound=sound?'1':'';attached.get(frame)?.setEnabled(enabled)});}
function replay(root){const frames=[...(root?.querySelectorAll('.ym-line-view iframe:not([data-line-inline])')||[])];frames.forEach(frame=>attached.get(frame)?.replay());return frames.length;}
// srcdoc readers contain no executable code. Initialize them from the parent
// after their styles/images load, with the same readiness and animation adapter.
document.addEventListener('load',event=>{const frame=event.target;if(frame?.tagName==='IFRAME'&&frame.hasAttribute('data-line-snapshot')&&frame.closest('.ym-line-view'))attach(frame,{enabled:frame.dataset.lineAnimate==='true'});},true);
window.LineMakerReader={attach,scan,replay};
})();

/* Pagination waits for the real LINE layout and slices only its displayed copy.
 * The saved source is never changed. Turn sheets use a frozen DOM, not new iframes. */
(() => {
'use strict';
const cache=new Map(),snapshots=new Map();let nextSnapshot=0;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function measured(source,width,height){
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none;writing-mode:horizontal-tb;width:'+width+'px';
 host.innerHTML=source;document.body.append(host);
 try{
  const frame=host.querySelector('iframe');const deadline=Date.now()+20000;
  while(frame.dataset.lineReady!=='1'){if(Date.now()>deadline)throw Error('LINE layout timed out');await sleep(20);}
  const doc=frame.contentDocument;
  // Wait two paints so ResizeObserver, loaded images, and font metrics have settled.
  await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
  const phone=doc.getElementById('phoneFrame');
  // Restore breathing room only if the entire card, including its outer margins,
  // still fits one page. Font/image readiness above remains mandatory.
  let spacing='0';
  if(width<=399)for(const level of ['2','1']){
   doc.documentElement.dataset.lineSpacing=level;
   if(Math.ceil(phone.getBoundingClientRect().height)+16<=height){spacing=level;break;}
  }
  doc.documentElement.dataset.lineSpacing=spacing;
  const total=Math.ceil(phone.getBoundingClientRect().height);
  if(!total||!doc.getElementById('roomMessageArea'))throw Error('LINE layout missing');
  const rows=[...doc.querySelectorAll('#roomMessageArea>div')],breaks=rows.map((row,i)=>i+1<rows.length?(row.getBoundingClientRect().bottom+rows[i+1].getBoundingClientRect().top)/2:row.getBoundingClientRect().bottom);
  const lines=[],walker=doc.createTreeWalker(phone,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){const n=walker.currentNode;if(!n.data.trim())continue;const range=doc.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.height&&r.width)lines.push({top:r.top,bottom:r.bottom});}
  for(const img of phone.querySelectorAll('img')){const r=img.getBoundingClientRect();if(r.height&&r.width)lines.push({top:r.top,bottom:r.bottom});}
  // Cache only a presentation copy. The maker state and editable path stay intact.
  // Reuse its generated CSS instead of rerunning the whole editor/Tailwind runtime.
  const snapshot=doc.implementation.createHTMLDocument('LINE');
  const base=snapshot.createElement('base');base.href=doc.baseURI;snapshot.head.append(base);
  for(const node of doc.head.querySelectorAll('style,link[rel="stylesheet"]'))snapshot.head.append(node.cloneNode(true));
  snapshot.documentElement.className=doc.documentElement.className;
  snapshot.documentElement.dataset.lineSpacing=spacing;
  snapshot.documentElement.lang=doc.documentElement.lang||'ja';
  snapshot.body.className=doc.body.className;snapshot.body.style.cssText=doc.body.style.cssText;
  snapshot.body.append(phone.cloneNode(true));
  snapshot.querySelectorAll('script,iframe,object,embed').forEach(node=>node.remove());
  for(const node of snapshot.querySelectorAll('*'))for(const attr of [...node.attributes])if(attr.name.startsWith('on')||attr.name==='contenteditable')node.removeAttribute(attr.name);
  return {total,breaks,lines,spacing,snapshot:'<!doctype html>'+snapshot.documentElement.outerHTML};
 }finally{host.remove();}
}
async function split(shell,width,height){
 const source=shell.outerHTML,key=width+'x'+height+':'+source;
 if(cache.has(key))return cache.get(key);
 const promise=(async()=>{
  const {total,breaks,lines,spacing,snapshot}=await measured(source,width,height);
  const snapshotId=String(++nextSnapshot);snapshots.set(snapshotId,snapshot);
  if(snapshots.size>12)snapshots.delete(snapshots.keys().next().value);
  const result=[];let start=0;
  while(start<total-.1){
   const limit=Math.min(total,start+height);let end=limit;
   if(limit<total){
    const candidates=breaks.filter(y=>y>start+1&&y<=limit);
    if(candidates.length)end=candidates[candidates.length-1];
    else{
     // One very long bubble may span pages. Never cut a line of its text in half.
     const crossing=lines.filter(r=>r.top<end-.1&&r.bottom>end+.1);
     if(crossing.length){const top=Math.min(...crossing.map(r=>r.top));if(top>start+1)end=top;}
    }
   }
   if(end<=start+.1)end=limit;
   const part=shell.cloneNode(true),frame=part.querySelector('iframe');
   frame.dataset.lineFallbackSrc=frame.getAttribute('src');frame.removeAttribute('src');frame.setAttribute('sandbox','allow-same-origin');frame.dataset.lineSnapshot=snapshotId;
   part.dataset.lineSpacing=spacing;part.dataset.lineSlice=start+','+end;part.dataset.lineWeight=String((end-start)/total);
   part.style.height=(end-start)+'px';part.style.overflow='hidden';part.style.position='relative';part.style.boxSizing='content-box';part.style.borderRadius=(start===0?'12px 12px':'0 0')+' '+(end===total?'12px 12px':'0 0');
   frame.style.height=total+'px';frame.style.transform='translateY(-'+start+'px)';frame.style.transformOrigin='top left';frame.style.visibility='hidden';frame.removeAttribute('data-line-ready');frame.removeAttribute('data-line-played');
   frame.setAttribute('aria-label',start===0?'トーク':'トークの続き');
   result.push(part.outerHTML);start=end;
  }
  return result.join('');
 })();
 cache.set(key,promise);promise.catch(()=>cache.delete(key));if(cache.size>12)cache.delete(cache.keys().next().value);return promise;
}
async function prepare(html,{width,height}){
 if(!String(html).includes('ym-line-view'))return html;
 if(!(width>40&&height>40))throw Error('LINE page size unavailable');
 const holder=document.createElement('div');holder.innerHTML=html;
 for(const shell of [...holder.querySelectorAll('.ym-line-view')]){
  const replacement=await split(shell,Math.min(440,width),height);
  shell.outerHTML=replacement;
 }
 return holder.innerHTML;
}
// Keep one snapshot per measured card, not a full HTML document in every slice.
// Attach it only to visible pages; fit probes stay inert and lightweight.
function hydrate(fragment){
 for(const frame of fragment.querySelectorAll('iframe[data-line-snapshot]')){
  const snapshot=snapshots.get(frame.dataset.lineSnapshot);
  if(snapshot)frame.srcdoc=snapshot;
  else{
   // A model can outlive the bounded cache. The original read-only maker remains
   // a compatible fallback, with its own image/font readiness and spacing rules.
   frame.removeAttribute('data-line-snapshot');frame.removeAttribute('sandbox');
   frame.src=frame.dataset.lineFallbackSrc;
  }
 }
 return fragment;
}
function freeze(source,copy){
 const originals=[...source.querySelectorAll('.ym-line-view iframe')],clones=[...copy.querySelectorAll('.ym-line-view iframe')];
 for(let i=0;i<clones.length;i++){
  const target=clones[i],shell=target.parentElement,original=originals.find(f=>f.parentElement.dataset.lineState===shell.dataset.lineState&&f.parentElement.dataset.lineSlice===shell.dataset.lineSlice);if(!original?.contentDocument){target.remove();continue;}
  const doc=original.contentDocument,phone=doc.getElementById('phoneFrame');if(!phone){target.remove();continue;}
  const win=doc.defaultView,visibleRange=original.parentElement.dataset.lineSlice?.split(',').map(Number);
  const snapshot=(node)=>{
   if(node.nodeType===3)return document.createTextNode(node.data);
   if(node.nodeType!==1||['SCRIPT','STYLE','LINK'].includes(node.tagName))return null;
   const style=win.getComputedStyle(node);if(style.display==='none')return null;
   const clone=node.cloneNode(false);
   for(const attr of [...clone.attributes])if(attr.name==='id'||attr.name.startsWith('on')||attr.name==='contenteditable'||attr.name==='tabindex')clone.removeAttribute(attr.name);
   clone.removeAttribute('class');clone.removeAttribute('style');
   for(const property of style)clone.style.setProperty(property,style.getPropertyValue(property),'important');
   // Animation/transition state is deliberately frozen at the readable final frame.
   clone.style.setProperty('animation','none','important');clone.style.setProperty('transition','none','important');if(node.parentElement?.id==='roomMessageArea'){clone.style.setProperty('opacity','1','important');clone.style.setProperty('transform','none','important');}
   if(node.tagName==='IMG')clone.src=node.src;
   const pseudo=(which)=>{
    const p=win.getComputedStyle(node,which),content=p.content;if(content==='none'||content==='normal'||p.display==='none')return null;
    const el=document.createElement('span');for(const property of p)el.style.setProperty(property,p.getPropertyValue(property),'important');
    if(content.length>2&&/^["']/.test(content))el.textContent=content.slice(1,-1);
    el.setAttribute('aria-hidden','true');return el;
   };
   const bounds=node.getBoundingClientRect();if(visibleRange&&node.parentElement?.id==='roomMessageArea'&&(bounds.bottom<visibleRange[0]||bounds.top>visibleRange[1]))return clone;
   const before=pseudo('::before');if(before)clone.append(before);
   for(const child of node.childNodes){const c=snapshot(child);if(c)clone.append(c);}
   const after=pseudo('::after');if(after)clone.append(after);
   return clone;
  };
  const outer=document.createElement('div');outer.style.cssText=original.style.cssText;outer.style.visibility='visible';outer.style.pointerEvents='none';outer.style.overflow='hidden';outer.dataset.lineFrozen='1';outer.setAttribute('aria-hidden','true');
  const body=snapshot(phone);if(body)outer.append(body);target.replaceWith(outer);
 }
}
window.LineMakerPagination={prepare,freeze,hydrate};
})();
