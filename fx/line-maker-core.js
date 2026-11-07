/* Reuses the existing LINE/Kakao Maker directly; its editor UI is not changed here. */
(() => {
  'use strict';
  const KEY='チャットJSON', origin=location.origin;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const unpack=value=>{
    const p=JSON.parse(decodeURIComponent(value));
    if(p.v!==1||!p.state||!Array.isArray(p.state.users)||!Array.isArray(p.state.rooms))throw Error('トークの保存データを読み込めません。元のデータは変更していません。');
    return p.state;
  };
  const match=source=>String(source).match(/^［トーク([^］\r\n]*)］\r?\n([\s\S]*?)^［／トーク］$/m);
  const parse=source=>{
    const m=match(source);if(!m||m[0]!==source)throw Error('トークの範囲を読み込めません。');
    const attrs={args:[]};m[1].trim().split(/[ \t　]+/).filter(Boolean).forEach(t=>{const i=t.indexOf('=');if(i>0)attrs[t.slice(0,i)]=t.slice(i+1);else attrs.args.push(t)});
    // Match the existing FX talk codec: sender｜time｜read：body. Body pipes are literal text.
    const rows=m[2].split(/\r?\n/).filter(Boolean).map(line=>{const i=line.indexOf('：'),head=(i<0?'相手':line.slice(0,i)).split('｜');return [head[0],i<0?line:line.slice(i+1),head[1]||'',head[2]||'']});
    return {attrs,rows,fullState:attrs[KEY]?unpack(attrs[KEY]):null};
  };
  const isSource=source=>{try{return !!parse(source).fullState}catch(_){return false}};
  const pack=state=>encodeURIComponent(JSON.stringify({v:1,state}));
  const serialize=(snapshot,original)=>{
    if(!snapshot?.fullState||!Array.isArray(snapshot.fullState.users)||!Array.isArray(snapshot.fullState.rooms))throw Error('トークを読み込み中です。少し待ってからもう一度押してください。');
    const attrs={...(original?.attrs||{}),...snapshot.attrs};attrs[KEY]=pack(snapshot.fullState);
    const clean=s=>String(s??'').replace(/[\r\n]/g,'／').replace(/［/g,'〔').replace(/］/g,'〕');
    const head=Object.entries(attrs).filter(([k,v])=>k!=='args'&&v).map(([k,v])=>k+'='+clean(v).replace(/[ \t　]+/g,'_'));
    head.push(...(attrs.args||[]));
    const rows=(snapshot.rows||[]).map(row=>clean(row[0]||'相手')+(row[2]||row[3]?'｜'+clean(row[2])+(row[3]?'｜'+clean(row[3]):''):'')+'：'+clean(row[1]));
    return '［トーク '+head.join(' ')+'］\n'+(rows.length?rows.join('\n')+'\n':'')+'［／トーク］';
  };
  const html=source=>{
    const {attrs}=parse(source);if(!attrs[KEY])throw Error('保存したトークがありません。');
    return '<span class="ym-line-view" data-line-state="'+esc(attrs[KEY])+'" style="display:block;width:100%;max-width:440px;margin:8px 0;writing-mode:horizontal-tb;white-space:normal"><iframe title="保存したトーク" src="fx/linemaker.html?embed=1&inline=1&reader=1" style="display:block;border:0;border-radius:12px;width:100%;height:280px;max-height:none;visibility:hidden" loading="eager"></iframe></span>';
  };
  const inlineBindings=new WeakMap();
  const mountInlineEditable=(atom,source,onChange,onHistory)=>{
    atom.dataset.lineSource=source;atom.innerHTML=html(source);
    const frame=atom.querySelector('iframe');frame.dataset.lineInline='1';frame.src+='&inlineedit=1';
    inlineBindings.set(frame,{atom,initial:parse(source),onChange,onHistory});
  };
  const inlineSource=atom=>atom.dataset.lineSource;
  window.addEventListener('message',e=>{
    if(e.origin!==origin)return;
    for(const frame of document.querySelectorAll('.ym-line-view iframe')){
      if(e.source!==frame.contentWindow)continue;
      if(e.data?.type==='ready'){try{frame.contentWindow.postMessage({type:'init',fullState:unpack(frame.parentElement.dataset.lineState)},origin)}catch(_){} }
      if(e.data?.type==='initialized'){
        const binding=inlineBindings.get(frame);
        LineMakerReader.attach(frame,{editable:!!binding,enabled:frame.dataset.lineAnimate==='true',onHistory:binding?.onHistory,onChange:(snapshot,change)=>{
          if(!binding)return;
          if(snapshot){
            const state=binding.initial.fullState,room=state.rooms.find(r=>r.id===change.roomId);
            if(change.messageId){const message=room?.messages.find(m=>m.id===change.messageId);if(message)message[change.field]=change.value;}else if(room)room[change.field]=change.value;
            snapshot.fullState=state;const next=serialize(snapshot,binding.initial);binding.atom.dataset.lineSource=next;binding.atom.querySelector('.ym-line-view').dataset.lineState=pack(state);
          }
          binding.onChange?.(binding.atom.dataset.lineSource,change);
        }});
      }
      break;
    }
  });
  let current=null;
  const open=({source,isEditing=false,onSave,onClose})=>{
    const initial=parse(source);current?.close();
    const dialog=document.createElement('dialog');dialog.id='line-maker-editor';dialog.setAttribute('aria-label','LINE／カカオ風メーカー');
    dialog.style.cssText='padding:0;border:1px solid #b9aa94;border-radius:12px;width:min(640px,100%);max-width:100%;height:94dvh;max-height:94dvh;box-sizing:border-box;overflow:hidden;background:#fff;color:#332e27;';
    const layout=document.createElement('div');layout.style.cssText='display:flex;flex-direction:column;height:100%;min-height:0';
    const bar=document.createElement('div');bar.style.cssText='display:flex;align-items:center;gap:8px;padding:8px;flex:none;flex-wrap:wrap;background:#fff';
    const title=document.createElement('strong');title.textContent='LINE／カカオ風メーカー';title.style.cssText='flex:1;font-size:14px';
    const cancel=document.createElement('button');cancel.type='button';cancel.id='line-maker-cancel';cancel.textContent='閉じる';
    const insert=document.createElement('button');insert.type='button';insert.id='line-maker-insert';insert.textContent=isEditing?'本文に反映':'本文に挿入';insert.disabled=true;
    for(const b of [cancel,insert])b.style.cssText='padding:8px 12px;border:1px solid #b9aa94;border-radius:8px;background:#fff;color:#332e27;font-size:14px';
    const error=document.createElement('p');error.id='line-maker-error';error.setAttribute('role','alert');error.style.cssText='margin:0;padding:0 8px;color:#b42318;font-size:13px';
    const frame=document.createElement('iframe');frame.title='LINE／カカオ風メーカー';frame.src='fx/linemaker.html?embed=1';frame.style.cssText='display:block;width:100%;flex:1;min-height:0;border:0';
    bar.append(title,cancel,insert);layout.append(bar,error,frame);dialog.append(layout);document.body.append(dialog);
    const viewport=window.visualViewport;
    const fit=()=>{dialog.style.height=Math.max(220,(viewport?.height||innerHeight)*.94)+'px';dialog.style.maxHeight=dialog.style.height;};
    const close=()=>{window.removeEventListener('message',listener);viewport?.removeEventListener('resize',fit);dialog.close();dialog.remove();if(current?.close===close)current=null;onClose?.();};
    const listener=e=>{if(e.origin!==origin||e.source!==frame.contentWindow)return;if(e.data?.type==='ready')frame.contentWindow.postMessage({type:'init',...initial},origin);else if(e.data?.type==='initialized')insert.disabled=false;};
    cancel.onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
    insert.onclick=()=>{try{const snapshot=frame.contentWindow.lineMakerSnapshot();onSave(serialize(snapshot,initial));close()}catch(e){error.textContent=e.message}};
    window.addEventListener('message',listener);viewport?.addEventListener('resize',fit);current={close};dialog.showModal();fit();
    return current;
  };
  window.LineMaker={parse,isSource,pack,unpack,serialize,html,open,mountInlineEditable,inlineSource,scan:(...args)=>LineMakerReader.scan(...args),replay:(...args)=>LineMakerReader.replay(...args)};
})();
