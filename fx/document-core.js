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
