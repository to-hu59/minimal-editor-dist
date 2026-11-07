/* Provided email presentation. Legacy email syntax is unchanged. */
(function(global){
'use strict';
const exampleHTML="\n            <div class=\"email-container email-theme-pc\" contenteditable=\"false\">\n                <button class=\"doc-delete-btn\" contenteditable=\"false\" title=\"削除\">×</button>\n                <div class=\"email-actions\" contenteditable=\"false\">\n                    <button class=\"email-simple-btn\" contenteditable=\"false\" title=\"簡易/詳細表示の切り替え\">➖</button>\n                    <button class=\"email-toggle-btn\" contenteditable=\"false\" title=\"スマホ表示に切り替え\">📱</button>\n                </div>\n                <div class=\"email-header\">\n                    <div class=\"email-row email-row-subject anim-target\"><span class=\"email-label\" contenteditable=\"false\">件名:</span> <span class=\"email-val\" contenteditable=\"true\">【重要】プロジェクトに関するご報告</span></div>\n                    <div class=\"email-row email-row-to anim-target\"><span class=\"email-label\" contenteditable=\"false\">宛先:</span> <span class=\"email-val\" contenteditable=\"true\">あなた</span></div>\n                    <div class=\"email-row email-row-date anim-target\"><span class=\"email-label\" contenteditable=\"false\">日時:</span> <span class=\"email-val\" contenteditable=\"true\">2026/11/08 07:00</span></div>\n                    <div class=\"email-row email-row-from anim-target\"><span class=\"email-label\" contenteditable=\"false\">差出人:</span> <span class=\"email-val font-bold\" contenteditable=\"true\">謎のハッカー</span></div>\n                </div>\n                <div class=\"email-body anim-target\" contenteditable=\"true\">\n                    例のデータは無事に抽出完了した。<br>\n                    添付ファイルを確認してくれ。<br>\n                    <br>\n                    これ以上の深追いは危険だ。健闘を祈る。\n                </div>\n            </div>";
const classes=new Set('email-container email-theme-pc email-theme-mobile email-simple email-header email-row email-row-subject email-row-to email-row-date email-row-from email-label email-val email-body anim-target font-bold'.split(' '));
const tags=new Set('DIV SPAN P BR B STRONG I EM U S RUBY RT RP'.split(' '));
const styles=new Set('width text-align font-size font-weight font-style color background-color text-decoration'.split(' '));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const isHTML=html=>/class=["'][^"']*\bemail-container\b/.test(String(html));
function sanitize(html){
 const input=document.createElement('template');input.innerHTML=String(html||'');const source=input.content.querySelector('.email-container');if(!source)throw Error('メールのデータがありません。');
 function clean(node){
  if(node.nodeType===3)return document.createTextNode(node.data);
  if(node.nodeType!==1)return document.createDocumentFragment();
  if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','BUTTON','SVG','MATH','LINK','META','IMG'].includes(node.tagName)||node.classList.contains('email-actions'))return document.createDocumentFragment();
  const el=tags.has(node.tagName)?document.createElement(node.tagName.toLowerCase()):document.createDocumentFragment();
  if(el.nodeType===1){const cs=[...node.classList].filter(c=>classes.has(c));if(cs.length)el.className=cs.join(' ');
   for(const key of node.style){const value=node.style.getPropertyValue(key);if(styles.has(key)&&!/[<>]|url\s*\(|expression\s*\(/i.test(value))el.style.setProperty(key,value)}
  }
  node.childNodes.forEach(n=>el.append(clean(n)));return el;
 }
 const root=clean(source);root.contentEditable='false';
 root.querySelectorAll('.email-val,.email-body').forEach(f=>f.contentEditable='true');
 if(!root.matches('.email-theme-pc,.email-theme-mobile'))root.classList.add('email-theme-pc');
 return root.outerHTML;
}
function plain(html){const box=document.createElement('div');box.innerHTML=sanitize(html);const walk=n=>n.nodeType===3?n.data:n.nodeType!==1?'':n.tagName==='BR'?'\n':[...n.childNodes].map(walk).join('')+(/^(DIV|P)$/.test(n.tagName)?'\n':'');return walk(box).split('\n').map(s=>s.trim()).join('\n').replace(/\n{3,}/g,'\n\n').trim()}
const encode=s=>{const bytes=new TextEncoder().encode(s);let v='';for(let i=0;i<bytes.length;i+=32768)v+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(v)};
function source(html){html=sanitize(html);return '［メール 見た目=提供版 データ='+encode(JSON.stringify({v:1,html}))+'］\n'+plain(html)+'\n［／メール］'}
const isSource=s=>/^［メール\s[^\n］]*見た目=提供版(?:[\s］])/.test(String(s).trim());
function parse(s){if(!isSource(s))return null;const m=String(s).match(/^\s*［メール\s([^\n］]*)］/),data=m[1].match(/(?:^|\s)データ=([A-Za-z0-9+/=]+)/);if(!data)return sanitize(exampleHTML);if(data[1].length>1500000)throw Error('メールのデータが大きすぎます。');const obj=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(data[1]),c=>c.charCodeAt(0))));if(obj.v!==1||typeof obj.html!=='string')throw Error('未対応のメール形式です。');return sanitize(obj.html)}
function decorate(root,edit){root.contentEditable='false';root.toggleAttribute('data-ym-doc-editing',!!edit);root.querySelectorAll('.email-val,.email-body').forEach((f,i)=>{f.dataset.documentField=String(i);f.dataset.ymEditable='true';f.setAttribute('aria-label',f.classList.contains('email-body')?'メールの本文':f.parentElement.querySelector('.email-label')?.textContent||'メールの項目');if(edit){f.contentEditable='true';f.setAttribute('role','textbox');f.setAttribute('aria-multiline','true');f.tabIndex=0}else f.removeAttribute('contenteditable')});if(!edit)root.removeAttribute('contenteditable')}
function rendered(html,edit=false){const box=document.createElement('div');box.innerHTML=sanitize(html);const root=box.firstElementChild;decorate(root,edit);if(edit){const buttons=document.createElement('div');buttons.className='email-actions';buttons.contentEditable='false';buttons.innerHTML='<button type="button" class="email-simple-btn" title="簡易/詳細表示の切り替え" aria-label="簡易/詳細表示の切り替え">➖</button><button type="button" class="email-toggle-btn" title="PC/スマホ表示の切り替え" aria-label="PC/スマホ表示の切り替え">'+(root.classList.contains('email-theme-pc')?'📱':'💻')+'</button>';root.prepend(buttons);const del=document.createElement('button');del.type='button';del.className='doc-delete-btn';del.contentEditable='false';del.title='削除';del.textContent='×';root.prepend(del)}return root.outerHTML}
const token=/^［メール\s(?=[^\n］]*見た目=提供版(?:[\s］]))[^\n］]*］\r?\n[\s\S]*?^［／メール］/gm;
function paragraphs(s){if(!s)return '';return s.replace(/^\n|\n$/g,'').split('\n').map(x=>'<p>'+(x?esc(x):'<br>')+'</p>').join('')}
function editorHTML(s){s=String(s||'');let html='',at=0;for(const m of s.matchAll(token)){html+=paragraphs(s.slice(at,m.index))+rendered(parse(m[0]),true);at=m.index+m[0].length}return html+paragraphs(s.slice(at))||'<p><br></p>'}
function editorSource(editor){const walk=n=>n.nodeType===3?n.data:n.nodeType!==1?'':n.matches('.email-container')?'\n'+source(n.outerHTML)+'\n':n.matches('button,.email-actions')?'':n.tagName==='BR'?'\n':[...n.childNodes].map(walk).join('')+(/^(DIV|P)$/.test(n.tagName)?'\n':'');return [...editor.childNodes].map(walk).join('').replace(/[ \t]+(?=\n|$)/g,'').replace(/\n{3,}/g,'\n\n').trim()}
global.ProvidedEmail={sanitize,plain,source,isSource,parse,rendered,editorHTML,editorSource,example:()=>sanitize(exampleHTML)};
const api=global.ProvidedDocument;if(!api)return;
for(const [key,test] of [['sanitize',isHTML],['plain',isHTML],['source',isHTML],['rendered',isHTML],['parse',isSource]]){const old=api[key];api[key]=function(value,...args){return test(value)?global.ProvidedEmail[key](value,...args):old(value,...args)}}
const oldIs=api.isSource;api.isSource=s=>isSource(s)||oldIs(s);
const oldInline=api.inlineSource;api.inlineSource=atom=>{const root=atom.querySelector('.email-container');if(!root)return oldInline(atom);const copy=root.cloneNode(true);copy.querySelectorAll('[data-document-placeholder]').forEach(n=>n.remove());const html=sanitize(copy.outerHTML);return html===atom.dataset.documentBaseline?atom.dataset.documentSource:source(html)};
})(window);
