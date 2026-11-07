/* Existing LINE/Kakao Maker, with full-state persistence and unchanged legacy talk support. */
(() => {
  'use strict';
  if (window.LineMakerBridge) return;
  const KEY = 'チャットJSON', makers = new Set();
  const unpack = value => {
    if (!value) return null;
    const p = JSON.parse(decodeURIComponent(value));
    if (p.v !== 1 || !p.state || !Array.isArray(p.state.rooms) || !Array.isArray(p.state.users)) throw new Error('チャットの保存データを読み込めません。元データは変更していません。');
    return p.state;
  };
  const pack = state => encodeURIComponent(JSON.stringify({v:1,state}));
  const origin = location.origin;
  const send = (frame,data) => frame.contentWindow?.postMessage(data,origin);
  const flush = () => {
    for (const item of [...makers]) {
      if (!item.frame.isConnected) { makers.delete(item); continue; }
      if (!item.ready) throw new Error('トークメーカーを読み込み中です。少し待ってから保存してください。');
      item.apply(item.frame.contentWindow.lineMakerSnapshot());
    }
  };
  window.LineMakerBridge = {flush, unpack, pack};
  // Save before closing/replacing an iframe, including rapid Save/Insert clicks.
  document.addEventListener('pointerdown', () => { try { flush(); } catch (_) {} }, true);
  const originalBuildCard = buildCard;
  buildCard = function(o,host,commit) {
    if (o.k !== 'トーク') return originalBuildCard(o,host,commit);
    const card = hEl('div','ecard'); host.appendChild(card);
    EDT['トーク'].maker(card,o,o.a,commit);
  };
  EDT['トーク'].maker = (pane,o,a,commit) => {
    let saved;
    try { saved=unpack(a[KEY]); } catch(e) { pane.appendChild(hEl('p','ehint',esc(e.message))); return; }
    pane.appendChild(hEl('p','ehint','元のLINE／カカオ風メーカーです。友だち・全トークルーム・写真・プロフィール・返信も一緒に保存します。未送信の文と通話の進行状況は保存しません。'));
    const wrap=hEl('div','mkwrap'), frame=document.createElement('iframe');
    frame.className='mkfr'; frame.src='linemaker.html?embed=1'; frame.title='LINE・カカオ風トークメーカー';
    const fullButton=hEl('button','mkfs','⛶ 全画面で作る'); fullButton.type='button';
    wrap.append(fullButton,frame); pane.appendChild(wrap);
    let full=false; const footer=document.getElementById('mkBar');
    const viewport=window.visualViewport;
    const fitKeyboard=()=>{
      if(!frame.isConnected){viewport?.removeEventListener('resize',fitKeyboard);viewport?.removeEventListener('scroll',fitKeyboard);return;}
      if(!full)return;
      const top=viewport?.offsetTop||0,height=viewport?.height||innerHeight;
      frame.style.top=top+'px';frame.style.bottom='auto';frame.style.height=Math.max(220,height)+'px';
      send(frame,{type:'kb',pad:innerHeight-top-height>60?76:0});
    };
    const setFull=on=>{full=on;if(footer)footer.style.visibility=on?'hidden':'';frame.style.cssText=on?'position:fixed;inset:0;width:100%;height:100dvh;min-height:0;z-index:80;border-radius:0;':'';fullButton.style.display=on?'none':'';send(frame,{type:'full',on});if(on)fitKeyboard();else send(frame,{type:'kb',pad:0});};
    viewport?.addEventListener('resize',fitKeyboard);viewport?.addEventListener('scroll',fitKeyboard);
    fullButton.onclick=()=>setFull(true);
    const item={frame,ready:false,apply(m){
      if (!m || !m.fullState || !Array.isArray(m.fullState.rooms) || !Array.isArray(m.fullState.users)) throw new Error('チャット全体の保存データが届きませんでした。保存は中止しました。');
      const encoded=pack(m.fullState);
      const rows=Array.isArray(m.rows)?m.rows:o.rows;
      if (a[KEY]===encoded && JSON.stringify(o.rows)===JSON.stringify(rows)) return;
      o.rows=rows;
      for(const key of ['相手','見た目','人数','メンバー','ひとこと','時計','不在','背景']) delete a[key];
      for(const [key,value] of Object.entries(m.attrs||{})) if(value) a[key]=value;
      a[KEY]=encoded; commit();
    }};
    makers.add(item);
    const listener=e=>{
      if (!frame.isConnected) { makers.delete(item); window.removeEventListener('message',listener); return; }
      if(e.source!==frame.contentWindow || e.origin!==origin) return;
      const m=e.data||{};
      if(m.type==='ready') send(frame,{type:'init',attrs:a,rows:o.rows,fullState:saved});
      else if(m.type==='initialized') {item.ready=true; if(innerWidth<=520)setFull(true);}
      else if(m.type==='state') {if(item.ready)item.apply(m);}
      else if(m.type==='exitFull') {try{flush();}catch(_){} setFull(false);}
    };
    window.addEventListener('message',listener);
    // The engine's legacy keyboard helper forces full-screen even on desktop and restores stale styles after Back.
    // This maker already owns full-screen mode, so only resize its explicit full-screen viewport.
    frame.addEventListener('load',()=>{try{frame.contentDocument.addEventListener('focusin',()=>{if(full)setTimeout(fitKeyboard,150);});}catch(_){}});
  };
  const originalTalk=BR['トーク'];
  BR['トーク']=(a,lines)=>{
    if(!a[KEY])return originalTalk(a,lines);
    try{unpack(a[KEY]);}catch(_){return originalTalk(a,lines);}
    return '<div class="blk line-preserved" data-line-state="'+esc(a[KEY])+'" style="max-width:440px;width:100%;margin:18px 0"><iframe title="保存したトーク画面" src="linemaker.html?embed=1&inline=1&reader=1" style="display:block;border:0;border-radius:12px;width:100%;height:280px;max-height:none" loading="eager"></iframe></div>';
  };
  window.addEventListener('message',e=>{
    if(e.origin!==origin || !['ready','initialized'].includes(e.data?.type))return;
    for(const frame of document.querySelectorAll('.line-preserved iframe')) {
      if(e.source!==frame.contentWindow)continue;
      try{if(e.data.type==='ready')send(frame,{type:'init',fullState:unpack(frame.parentElement.dataset.lineState)});else window.LineMakerReader?.attach(frame,{enabled:typeof S==='undefined'||S.fx!==false});}catch(_){/* Keep original stored data unchanged. */}
    }
  });
})();
