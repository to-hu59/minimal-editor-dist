/* Provided letter/report presentation codec; keeps legacy FX syntax untouched. */
(function(global){
'use strict';
const allowedTags=new Set('DIV SPAN P BR B STRONG I EM U S RUBY RT RP'.split(' '));
const allowedClasses=new Set('letter-container letter-title report-container secret-stamp report-header report-title report-meta report-body report-item report-item-label report-item-value font-bold text-red-600'.split(' '));
const allowedStyles=new Set('text-align width margin-left margin-right margin-top margin-bottom font-size font-weight font-style color background-color text-decoration'.split(' '));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function sanitize(html){
  const box=document.createElement('template');box.innerHTML=String(html||'');
  function clean(node){
    if(node.nodeType===3)return document.createTextNode(node.data);
    if(node.nodeType!==1)return document.createDocumentFragment();
    if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','BUTTON','SVG','MATH','LINK','META'].includes(node.tagName))return document.createDocumentFragment();
    const el=allowedTags.has(node.tagName)?document.createElement(node.tagName.toLowerCase()):document.createDocumentFragment();
    if(el.nodeType===1){
      const classes=[...node.classList].filter(c=>allowedClasses.has(c));if(classes.length)el.className=classes.join(' ');
      for(const name of node.style){const value=node.style.getPropertyValue(name);if(allowedStyles.has(name)&&!/[<>]|url\s*\(|expression\s*\(/i.test(value))el.style.setProperty(name,value)}
      if(node.hasAttribute('contenteditable'))el.setAttribute('contenteditable',node.getAttribute('contenteditable')==='true'?'true':'false');
    }
    node.childNodes.forEach(c=>el.append(clean(c)));return el;
  }
  const out=document.createElement('div');box.content.childNodes.forEach(c=>out.append(clean(c)));
  const root=out.querySelector('.letter-container,.report-container');if(!root)throw new Error('手紙または調査証のデータがありません。');
  return root.outerHTML;
}
function plain(html){
  const box=document.createElement('div');box.innerHTML=sanitize(html);
  const walk=n=>n.nodeType===3?n.data:n.nodeType!==1?'':n.matches('.secret-stamp')?'':n.tagName==='BR'?'\n':[...n.childNodes].map(walk).join('')+(/^(DIV|P)$/.test(n.tagName)?'\n':'');
  return walk(box).split('\n').map(s=>s.trim()).join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
function encode(value){const bytes=new TextEncoder().encode(value);let data='';for(let i=0;i<bytes.length;i+=32768)data+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(data)}
function decode(value){if(value.length>1500000)throw new Error('文書が大きすぎます。');return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(value),c=>c.charCodeAt(0)))}
function source(html){
  html=sanitize(html);const type=/class="[^"]*\bletter-container\b/.test(html)?'手紙':'書類';
  return '［'+type+' 見た目=提供版 データ='+encode(JSON.stringify({v:1,html}))+'］\n'+plain(html)+'\n［／'+type+'］';
}
function isSource(src){return /^［(?:手紙|書類)\s[^\n］]*見た目=提供版(?:[\s］])/.test(String(src).trim())}
function parse(src){
  const m=String(src).trim().match(/^［(手紙|書類)\s([^\n］]*)］/);if(!m||!/(?:^|\s)見た目=提供版(?:\s|$)/.test(m[2]))return null;
  const data=m[2].match(/(?:^|\s)データ=([A-Za-z0-9+/=]+)/);if(!data)return example(m[1]==='手紙'?'letter':'report');
  const value=JSON.parse(decode(data[1]));if(value.v!==1||typeof value.html!=='string')throw new Error('未対応の文書形式です。');return sanitize(value.html);
}
function rendered(html,edit=false){
  const box=document.createElement('div');box.innerHTML=sanitize(html);const root=box.firstElementChild;
  if(edit){
    const button=document.createElement('button');button.type='button';button.className='doc-delete-btn';button.contentEditable='false';button.title='削除';button.textContent='×';root.prepend(button);
  }else root.querySelectorAll('[contenteditable]').forEach(el=>el.setAttribute('data-ym-editable',el.getAttribute('contenteditable')));
  if(!edit){root.removeAttribute('contenteditable');root.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'))}
  return root.outerHTML;
}
const token=/^［(手紙|書類)\s(?=[^\n］]*見た目=提供版(?:[\s］]))[^\n］]*］\r?\n[\s\S]*?^［／\1］/gm;
function editorHTML(src){
  let out='',at=0;
  for(const m of String(src).matchAll(token)){out+=paragraphs(String(src).slice(at,m.index));out+=rendered(parse(m[0]),true);at=m.index+m[0].length}
  out+=paragraphs(String(src).slice(at));return out||'<p><br></p>';
}
function paragraphs(s){if(!s)return '';return String(s).replace(/^\n|\n$/g,'').split('\n').map(x=>'<p>'+(x?esc(x):'<br>')+'</p>').join('')}
function editorSource(editor){
  const walk=node=>{
    if(node.nodeType===3)return node.data;
    if(node.nodeType!==1)return '';
    if(node.matches('.letter-container,.report-container'))return '\n'+source(node.outerHTML)+'\n';
    if(node.matches('button'))return '';
    if(node.tagName==='BR')return '\n';
    return [...node.childNodes].map(walk).join('')+(/^(DIV|P)$/.test(node.tagName)?'\n':'');
  };
  return [...editor.childNodes].map(walk).join('').replace(/[ \t]+(?=\n|$)/g,'').replace(/\n{3,}/g,'\n\n').trim();
}
function example(kind){
  return kind==='report'?'<div class="report-container" contenteditable="false"><div class="secret-stamp">極 秘</div><div class="report-header" contenteditable="true"><div class="report-title">対象者 調査報告書</div><div class="report-meta">作成日: 20XX年X月X日<br>担当: 特務第4課</div></div><div><div class="report-item"><div class="report-item-label" contenteditable="true">氏名</div><div class="report-item-value" contenteditable="true">名無し の 太郎</div></div><div class="report-item"><div class="report-item-label" contenteditable="true">危険度レベル</div><div class="report-item-value font-bold text-red-600" contenteditable="true">クラスA (要監視)</div></div><div class="report-item"><div class="report-item-label" contenteditable="true">特記事項</div><div class="report-item-value" contenteditable="true">対象は現在、ネット上の掲示板にて頻繁に活動している。周囲への影響力が極めて高いため、早急な対応が求められる。</div></div></div></div>':
    '<div class="letter-container" contenteditable="false"><div style="text-align:center;"><span class="letter-title" contenteditable="true">親愛なる友へ</span></div><div contenteditable="true">この手紙が君に届く頃、私はもうこの街にはいないだろう。<br>例の件についてだが、君の予想通りだった。<br>どうか気を付けてくれ。</div><div style="width:fit-content;margin-left:auto;text-align:left;margin-top:2.4rem;" contenteditable="true">差出人不明より</div></div>';
}
global.ProvidedDocument={sanitize,plain,source,parse,isSource,rendered,editorHTML,editorSource,example};
})(window);

/* Inline document editing and content-sized presentation. */
(function(global){
'use strict';
const api=global.ProvidedDocument,originalRendered=api.rendered;
const plain=n=>n.nodeType===3?n.data:n.nodeType!==1?'':n.tagName==='BR'?'\n':[...n.childNodes].map(plain).join('')+(/^(DIV|P)$/.test(n.tagName)?'\n':'');
function decorate(root,editing=false){
 if(!root)return;if(editing)root.contentEditable='false';
 const fields=[...root.querySelectorAll('[contenteditable="true"],[data-ym-editable="true"]')];
 fields.forEach((field,i)=>{field.dataset.documentField=String(i);field.dataset.ymEditable='true';field.dataset.ymEmpty=String(!field.textContent.trim());if(editing){field.contentEditable='true';field.setAttribute('role','textbox');field.setAttribute('aria-multiline','true');field.setAttribute('tabindex','0');}});
 if(root.classList.contains('letter-container')){
  const title=root.querySelector('.letter-title');if(title){title.dataset.ymDocRole='title';const holder=title.parentElement;holder.dataset.ymDocTitle='';holder.dataset.ymEmpty=String(!title.textContent.trim());title.setAttribute('aria-label','宛名');}
  const body=fields.find(f=>f!==title);if(body){body.dataset.ymDocRole='body';body.setAttribute('aria-label','手紙の本文');}
  const sender=fields.length>2?fields[fields.length-1]:null;if(sender){sender.dataset.ymDocRole='sender';sender.setAttribute('aria-label','差出人');}
 }
 root.toggleAttribute('data-ym-doc-editing',editing);
}
api.rendered=(html,edit=false)=>{const box=document.createElement('div');box.innerHTML=originalRendered(html,edit);decorate(box.firstElementChild,edit);return box.innerHTML;};
function inlineSource(atom){
 const doc=atom.querySelector('.letter-container,.report-container');if(!doc)return atom.dataset.documentSource||'';
 const copy=doc.cloneNode(true);copy.querySelectorAll('[data-document-placeholder]').forEach(n=>n.remove());const html=api.sanitize(copy.outerHTML);
 return html===atom.dataset.documentBaseline?atom.dataset.documentSource:api.source(html);
}
function insertText(text){
 const selection=getSelection();if(!selection.rangeCount)return;const range=selection.getRangeAt(0),fragment=document.createDocumentFragment();
 String(text).split(/\r\n?|\n/).forEach((line,i)=>{if(i)fragment.append(document.createElement('br'));fragment.append(document.createTextNode(line))});
 const last=fragment.lastChild;let placeholder=null;if(/(?:\r\n?|\n)$/.test(String(text))){placeholder=document.createElement('br');placeholder.dataset.documentPlaceholder='true';fragment.append(placeholder);}
 range.deleteContents();range.insertNode(fragment);if(last){range.setStartAfter(last);range.collapse(true);selection.removeAllRanges();selection.addRange(range);}
}
function mountInlineEditable(atom,src,onChange){
 atom.dataset.documentSource=src;atom.contentEditable='false';atom.classList.add('ymdoc');
 atom.innerHTML=api.rendered(api.parse(src));const doc=atom.firstElementChild;decorate(doc,true);atom.dataset.documentBaseline=api.sanitize(doc.outerHTML);
 const change=()=>{decorate(doc,true);onChange?.();};
 // Keep native field input inside the document. Never splice its base64 payload as plain text.
 atom.addEventListener('beforeinput',e=>{if(!e.target.closest('[data-document-field]'))return;if(e.inputType==='historyUndo'||e.inputType==='historyRedo')return;e.stopPropagation();if(!e.isComposing&&['insertParagraph','insertLineBreak'].includes(e.inputType)){e.preventDefault();insertText('\n');change();}});
 atom.addEventListener('paste',e=>{if(!e.target.closest('[data-document-field]'))return;e.preventDefault();e.stopPropagation();insertText(e.clipboardData.getData('text/plain'));change();});
 for(const type of ['copy','cut'])atom.addEventListener(type,e=>{
  const selection=getSelection();if(!selection.rangeCount)return;const range=selection.getRangeAt(0),element=n=>n.nodeType===1?n:n.parentElement;
  const a=element(range.startContainer)?.closest('[data-document-field]'),b=element(range.endContainer)?.closest('[data-document-field]');if(!a||!b||!atom.contains(a)||!atom.contains(b))return;
  e.preventDefault();e.stopPropagation();e.clipboardData?.setData('text/plain',selection.toString());
  if(type==='cut'){if(a!==b){if(typeof global.toast==='function')global.toast('切り取る文字は同じ欄の中で選んでください');return;}range.deleteContents();change();}
 });
 atom.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();});
 atom.addEventListener('input',change);
 return doc;
}
function descriptor(range=getSelection().rangeCount?getSelection().getRangeAt(0):null){
 if(!range)return null;const asElement=n=>n.nodeType===1?n:n.parentElement;
 const a=asElement(range.startContainer)?.closest('[data-document-source]'),b=asElement(range.endContainer)?.closest('[data-document-source]');if(!a||a!==b)return null;
 const at=(node,offset)=>{const field=asElement(node)?.closest('[data-document-field]');if(!field)return null;const r=document.createRange();r.selectNodeContents(field);r.setEnd(node,offset);const box=document.createElement('span');box.append(r.cloneContents());return{field:Number(field.dataset.documentField),offset:plain(box).length}};
 return {document:[...a.parentElement.querySelectorAll('[data-document-source]')].indexOf(a),a:at(range.startContainer,range.startOffset),b:at(range.endContainer,range.endOffset)};
}
function restore(root,d){
 if(!d?.a||!d?.b)return false;const atom=root.querySelectorAll('[data-document-source]')[d.document];if(!atom)return false;
 const locate=point=>{const f=atom.querySelector('[data-document-field="'+point.field+'"]');if(!f)return null;let at=0,answer=null;const walk=n=>{if(answer)return;if(n.nodeType===3){if(point.offset<=at+n.length){answer=[n,Math.max(0,point.offset-at)];return;}at+=n.length;return;}if(n.nodeType===1&&n.tagName==='BR'){if(point.offset<=at+1){answer=[n.parentNode,[...n.parentNode.childNodes].indexOf(n)+(point.offset>at?1:0)];return;}at++;return;}for(const c of n.childNodes)walk(c);};walk(f);return answer||[f,f.childNodes.length];};
 const a=locate(d.a),b=locate(d.b);if(!a||!b)return false;const r=document.createRange();r.setStart(...a);r.setEnd(...b);const selection=getSelection();selection.removeAllRanges();selection.addRange(r);(a[0].nodeType===1?a[0]:a[0].parentElement)?.closest('[data-document-field]')?.focus({preventScroll:true});selection.removeAllRanges();selection.addRange(r);return true;
}
function formatSelection(kind,value){
 const d=descriptor();if(!d)return false;const selection=getSelection(),range=selection.getRangeAt(0);if(range.collapsed)return true;
 const atom=(range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement).closest('[data-document-source]');
 if(d.a?.field!==d.b?.field)return true;
 const tags={'太字':'b','斜体':'i','下線':'u','取消線':'s','色':'span','マーカー':'span','大きく':'span','小さく':'span'};if(!tags[kind])return false;
 const el=document.createElement(tags[kind]);if(kind==='色')el.style.color=value||'';if(kind==='マーカー')el.style.backgroundColor='#fff2a8';if(kind==='大きく')el.style.fontSize='1.2em';if(kind==='小さく')el.style.fontSize='.85em';el.append(range.extractContents());range.insertNode(el);range.selectNodeContents(el);selection.removeAllRanges();selection.addRange(range);atom.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'format'+kind}));return true;
}
Object.assign(api,{decorate,mountInlineEditable,inlineSource,selectionDescriptor:descriptor,restoreSelection:restore,formatSelection});
})(window);
