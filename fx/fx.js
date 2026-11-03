'use strict';
/* ===== 基本 ===== */
const $=id=>document.getElementById(id);
const app=$('app'),stage=$('stage'),page=$('page'),fxRoot=$('fx'),vigEl=$('vig');
const S={fx:true,cur:null,hist:[],visits:{},busy:false,ctx:null,lockLeft:0};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
function vib(p){if(S.fx&&navigator.vibrate)try{navigator.vibrate(p)}catch(e){}}

/* ===== 音（ぜんぶその場で作る） ===== */
const A={ctx:null,master:null,bus:null,noise:null};
function audioInit(){
  if(A.ctx){A.ctx.resume&&A.ctx.resume();return}
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  A.ctx=new C();
  const comp=A.ctx.createDynamicsCompressor();comp.connect(A.ctx.destination);
  A.master=A.ctx.createGain();A.master.gain.value=.9;A.master.connect(comp);
  const len=A.ctx.sampleRate*2,b=A.ctx.createBuffer(1,len,A.ctx.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  A.noise=b;newBus();
}
function newBus(){
  if(!A.ctx)return;
  if(A.bus){const old=A.bus;try{old.gain.setTargetAtTime(0,A.ctx.currentTime,.04)}catch(e){}setTimeout(()=>{try{old.disconnect()}catch(e){}},500)}
  A.bus=A.ctx.createGain();A.bus.connect(A.master);
}
const soundOn=()=>S.fx&&A.ctx&&A.bus&&!S.pvMute;
const now=()=>A.ctx.currentTime;
function env(g,t,a,peak,dec){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec)}
function tone(type,f,t,dur,peak,o={}){
  const os=A.ctx.createOscillator(),g=A.ctx.createGain();os.type=type;os.frequency.setValueAtTime(f,t);
  if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+dur);
  env(g,t,o.a||.005,peak,dur);os.connect(g);g.connect(o.dest||A.bus);os.start(t);os.stop(t+(o.a||.005)+dur+.05);
}
function hiss(t,dur,peak,o={}){
  const s=A.ctx.createBufferSource();s.buffer=A.noise;s.loop=true;
  const fl=A.ctx.createBiquadFilter();fl.type=o.type||'bandpass';fl.frequency.setValueAtTime(o.f||1000,t);
  if(o.to)fl.frequency.exponentialRampToValueAtTime(o.to,t+dur);fl.Q.value=o.q||1;
  const g=A.ctx.createGain();env(g,t,o.a||.005,peak,dur);
  s.connect(fl);fl.connect(g);g.connect(o.dest||A.bus);s.start(t,Math.random()*1.5);s.stop(t+(o.a||.005)+dur+.05);
}
const snd=fn=>(...a)=>{if(soundOn())try{fn(...a)}catch(e){console.warn(e)}};
const SFX={
  thump:snd((v=1)=>{const t=now();tone('sine',80,t,.2,.95*v,{to:36});tone('sine',64,t+.27,.24,.7*v,{to:30});hiss(t,.07,.18*v,{type:'lowpass',f:220})}),
  beep:snd((f=1000,d=.12,v=.16)=>{tone('sine',f,now(),d,v,{a:.003})}),
  flat:snd((sec=3)=>{const t=now(),o=A.ctx.createOscillator(),g=A.ctx.createGain();o.frequency.value=1000;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.15,t+.02);g.gain.setValueAtTime(.15,t+sec);g.gain.linearRampToValueAtTime(0,t+sec+.3);o.connect(g);g.connect(A.bus);o.start(t);o.stop(t+sec+.4)}),
  type:snd(()=>{const t=now();hiss(t,.018,.07,{type:'highpass',f:rnd(3000,4500)});hiss(t,.03,.05,{f:rnd(800,1200),q:3})}),
  key:snd(()=>{const t=now();hiss(t,.025,.4,{type:'highpass',f:rnd(2600,4200)});hiss(t+.012,.04,.28,{f:rnd(700,1100),q:3});tone('square',rnd(150,220),t,.02,.03)}),
  crackle:snd((d=.3,v=.35)=>{const t=now();hiss(t,d,v*.25,{type:'highpass',f:1800});for(let i=0;i<d*55;i++)hiss(t+Math.random()*d,rnd(.004,.03),v*Math.random(),{type:'highpass',f:rnd(1200,5000)})}),
  coin:snd(()=>{const t=now(),f=rnd(2300,3300);tone('sine',f,t,.28,.09);tone('sine',f*1.51,t,.18,.05);tone('triangle',f*2.02,t+.01,.1,.03)}),
  notif:snd(()=>{const t=now();tone('sine',1320,t,.14,.12);tone('sine',1760,t+.11,.22,.12)}),
  /* メッセージアプリの「ピコン」：短い2つの高い音（上がる） */
  pico:snd(()=>{const t=now();tone('sine',1568,t,.08,.16);tone('triangle',1568,t,.08,.04);tone('sine',2093,t+.085,.2,.16);tone('triangle',2093,t+.085,.2,.04)}),
  buzz:snd((d=.12)=>{const t=now();tone('sawtooth',100,t,d,.08);tone('sawtooth',200,t,d,.04);hiss(t,d,.12,{f:3000,q:2})}),
  chime:snd(()=>{const t=now();[880,1320,1760,2640].forEach((f,i)=>tone('sine',f,t+i*.09,.6,.12))}),
  step:snd((v=.5)=>{const t=now();hiss(t,.09,v,{type:'lowpass',f:320});tone('sine',95,t,.08,v*.5,{to:50})}),
  wet:snd((v=.5)=>{const t=now();hiss(t,.07,v,{type:'lowpass',f:900});tone('sine',140,t,.06,v*.35,{to:60})}),
  slam:snd(()=>{const t=now();hiss(t,.55,1,{type:'lowpass',f:420});tone('sine',58,t,.45,1,{to:28});hiss(t+.02,.05,.35,{type:'highpass',f:3000})}),
  rattle:snd((dur=1.5)=>{const t=now();let x=0;while(x<dur){hiss(t+x,.02,.45,{f:rnd(2800,4200),q:8});tone('square',rnd(1400,2200),t+x,.015,.04);x+=rnd(.04,.11)+(Math.random()<.2?.18:0)}}),
  bang:snd((v=1)=>{const t=now();tone('sine',72,t,.32,v,{to:34});hiss(t,.26,.85*v,{type:'lowpass',f:600})}),
  knock:snd((v=.5)=>{const t=now();tone('sine',1700,t,.06,v*.5,{to:1250});hiss(t,.04,v*.6,{f:2600,q:4})}),
  crack:snd(()=>{const t=now();hiss(t,.25,.7,{type:'highpass',f:2000});for(let i=0;i<14;i++)hiss(t+Math.random()*.25,.01,.6,{type:'highpass',f:rnd(3000,7000)})}),
  shatter:snd(()=>{const t=now();hiss(t,.6,1,{type:'highpass',f:1500});for(let i=0;i<70;i++){const tt=t+Math.random()*1.3;hiss(tt,rnd(.03,.16),rnd(.2,.6),{f:rnd(3000,8000),q:10});if(i%3===0)tone('sine',rnd(3500,7500),tt,rnd(.1,.4),.05)}}),
  swish:snd(()=>{hiss(now(),.25,.2,{f:1200,to:4200,a:.07,q:.8})}),
  tear:snd(()=>{const t=now();for(let x=0;x<.7;x+=rnd(.01,.035))hiss(t+x,rnd(.015,.05),rnd(.15,.55),{f:rnd(1800,3800),q:1.2})}),
  tick:snd((v=.3)=>{const t=now();hiss(t,.012,v,{type:'highpass',f:5000});tone('square',3000,t,.01,.04)}),
  alarm:snd(()=>{const t=now();for(let i=0;i<3;i++){tone('square',2000,t+i*.28,.12,.05);tone('square',2000,t+i*.28+.14,.08,.05)}}),
  rewind:snd((sec=1.6)=>{const t=now();hiss(t,sec,.3,{f:500,to:3500,q:2,a:.1});const o=A.ctx.createOscillator(),g=A.ctx.createGain(),l=A.ctx.createOscillator(),lg=A.ctx.createGain();o.type='sawtooth';o.frequency.value=600;l.frequency.value=23;lg.gain.value=400;l.connect(lg);lg.connect(o.frequency);env(g,t,.1,.05,sec);o.connect(g);g.connect(A.bus);o.start(t);l.start(t);o.stop(t+sec+.2);l.stop(t+sec+.2)}),
  throb:snd(()=>{const t=now();tone('sine',46,t,.7,.9,{a:.12,to:38});hiss(t,.5,.15,{type:'lowpass',f:150,a:.1})}),
  drip:snd((v=.4)=>{const t=now();tone('sine',1100,t,.09,v*.3,{to:280})}),
  pop:snd(()=>{tone('sine',660,now(),.08,.06,{to:880})}),
  rumble:snd(()=>{const t=now();tone('sine',40,t,2.5,.5,{a:.6});hiss(t,2.5,.2,{type:'lowpass',f:140,a:.6})}),
  laugh:snd((n=14,v=.55)=>{
    const t0=now(),out=A.ctx.createGain(),dl=A.ctx.createDelay(1),fb=A.ctx.createGain();
    dl.delayTime.value=.23;fb.gain.value=.38;out.connect(A.bus);out.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(A.bus);
    const bp=(f,q)=>{const b=A.ctx.createBiquadFilter();b.type='bandpass';b.frequency.value=f;b.Q.value=q;return b};
    for(let i=0;i<n;i++){
      const t=t0+i*.12+Math.random()*.03,vA=i%2,f0=(vA?300:345)+i*7+rnd(0,30);
      hiss(t,.018,.4*v,{type:'highpass',f:3600,dest:out});
      const o=A.ctx.createOscillator(),g=A.ctx.createGain(),b1=bp(vA?800:470,7),b2=bp(vA?1250:2100,9);
      o.type='sawtooth';o.frequency.setValueAtTime(f0,t+.015);o.frequency.linearRampToValueAtTime(f0*.84,t+.11);
      env(g,t+.015,.008,1.6*v,.075);o.connect(b1);o.connect(b2);b1.connect(g);b2.connect(g);g.connect(out);o.start(t+.01);o.stop(t+.16);
    }
    setTimeout(()=>{try{out.disconnect();dl.disconnect()}catch(e){}},(n*.12+4)*1000);
  })
};
function drone(c,kind){
  if(!soundOn())return;
  const t=now(),g=A.ctx.createGain(),nodes=[];
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+2);g.connect(A.bus);
  const add=(type,f,vol,lp)=>{const o=A.ctx.createOscillator();o.type=type;o.frequency.value=f;const gg=A.ctx.createGain();gg.gain.value=vol;if(lp){const fl=A.ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);fl.connect(gg)}else o.connect(gg);gg.connect(g);o.start();nodes.push(o);return o};
  const nz=(f,vol)=>{const s=A.ctx.createBufferSource();s.buffer=A.noise;s.loop=true;const fl=A.ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=f;const gg=A.ctx.createGain();gg.gain.value=vol;s.connect(fl);fl.connect(gg);gg.connect(g);s.start();nodes.push(s)};
  if(kind==='病院'){add('sine',50,.05);add('sine',100,.02);nz(180,.06)}
  else if(kind==='病室'){add('sine',60,.03);nz(200,.04);c.every(2200,()=>SFX.beep(880,.08,.05))}
  else if(kind==='狂'){add('sawtooth',55,.05,320);const o2=add('sawtooth',55.8,.05,320);add('sine',233,.025);const l=A.ctx.createOscillator(),lg=A.ctx.createGain();l.frequency.value=.15;lg.gain.value=18;l.connect(lg);lg.connect(o2.frequency);l.start();nodes.push(l);nz(400,.03)}
  else if(kind==='赤'){add('sine',38,.14);add('sawtooth',41,.03,120);nz(120,.07)}
  c.on(()=>{try{g.gain.setTargetAtTime(0,now(),.1)}catch(e){}setTimeout(()=>nodes.forEach(n=>{try{n.stop()}catch(e){}}),600)});
}
function speak(text,o={}){
  if(!S.fx||!('speechSynthesis' in window))return;
  try{const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.pitch=o.pitch??1;u.rate=o.rate??1;u.volume=o.vol??1;
    const v=speechSynthesis.getVoices().find(v=>/^ja/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){}
}
function stopSpeech(){try{speechSynthesis.cancel()}catch(e){}}

/* ===== 印を読む ===== */
const BLOCKS=new Set(['PC','掲示板','電光掲示板','手紙','カルテ','招待状','ステータス','目次','説明']);
const INL=new Set(['狂','再読','塗る']);
const TAGRE=/［(／?)([^\s］]+)([^］]*)］/g;
function parseAttrs(s){const a={args:[]};s.trim().split(/[ \t]+/).filter(Boolean).forEach(tok=>{const i=tok.indexOf('=');if(i>0)a[tok.slice(0,i)]=tok.slice(i+1);else a.args.push(tok)});return a}
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const encA=a=>esc(JSON.stringify(a));
const txt=s=>esc(s).replace(/湊/g,'<span class="nm">湊</span>').replace(/&gt;&gt;(\d+)/g,'<span class="anc">&gt;&gt;$1</span>');
function inline(text){
  let h='',last=0,m;TAGRE.lastIndex=0;
  while((m=TAGRE.exec(text))){
    h+=txt(text.slice(last,m.index));last=TAGRE.lastIndex;
    const close=!!m[1],name=m[2],a=parseAttrs(m[3]);
    if(INL.has(name))h+=close?'</span>':`<span class="fxs" data-fx="${name}" data-a="${encA(a)}">`;
    else if(!close)h+=`<i class="mk" data-fx="${name}" data-a="${encA(a)}"></i>`;
  }
  return h+txt(text.slice(last));
}
const BR={
  PC:(a,L)=>`<div class="blk pc" data-fx="PC" data-a="${encA(a)}" data-lines="${encA(L)}"><div class="scr"><div class="bar">● ● ●　memo.txt</div><pre>${esc(L.join('\n'))}<span class="cur"></span></pre></div></div>`,
  '掲示板':(a,L)=>`<div class="blk bbs" data-fx="掲示板" data-a="${encA(a)}"><div class="bh"><div class="bn">${esc(a.板||'掲示板')}</div><div class="bt">${esc(a.題||'')}</div></div>${L.map(l=>{const m=l.match(/^(\d+)\s+([^：]+)：(.*)$/);if(!m)return`<div class="po"><div class="pb">${inline(l)}</div></div>`;const id=Math.random().toString(36).slice(2,10);return`<div class="po"><div class="pm">${m[1]}：<b>${esc(m[2])}</b>　03:33:${String(10+ +m[1]*7).slice(-2)} ID:${id}</div><div class="pb">${inline(m[3])}</div></div>`}).join('')}</div>`,
  '電光掲示板':(a,L)=>`<div class="blk led" data-fx="電光掲示板" data-a="${encA(a)}" data-text="${esc(L.join('　'))}" data-lines="${encA(L)}"><canvas></canvas></div>`,
  '手紙':(a,L)=>`<div class="blk letter" data-fx="手紙" data-a="${encA(a)}" data-body="${encA(L)}"><div class="lo">${L.map(l=>`<div>${inline(l)||'&nbsp;'}</div>`).join('')}<div class="from">${esc(a.差出人||'')}</div></div></div>`,
  'カルテ':(a,L)=>`<div class="blk chart"><div class="chd">診療録</div><dl>${L.map(l=>{const i=l.indexOf('：');return i<0?`<dt></dt><dd>${inline(l)}</dd>`:`<dt>${esc(l.slice(0,i))}</dt><dd>${inline(l.slice(i+1))}</dd>`}).join('')}</dl></div>`
};
/* 書く人に見せる名前（中では今までどおりの名前で動く） */
const TAGALIAS={'システム画面':'窓'},TAGSHOW={'窓':'システム画面'};
const tagIn=src=>src.replace(/［(／?)システム画面(?=[\s　］])/g,'［$1窓');
function renderPage(src){src=tagIn(src);
  const lines=src.split('\n');let h='';
  for(let i=0;i<lines.length;i++){
    const L=lines[i].trim();if(!L)continue;
    const bm=L.match(/^［([^\s／］]+)([^］]*)］$/);
    if(bm&&BLOCKS.has(bm[1])){const inner=[];i++;while(i<lines.length&&lines[i].trim()!=='［／'+bm[1]+'］'){inner.push(lines[i].trim());i++}h+=BR[bm[1]](parseAttrs(bm[2]),inner);continue}
    if(L.replace(TAGRE,'').trim()===''&&!/［(狂|再読|塗る|改変)[\s］]/.test(L)){h+=`<div class="mkrow">${inline(L)}</div>`;continue}
    h+=`<p>${inline(L)}</p>`;
  }
  return h;
}
function meta(i){
  const s=BOOK.pages[i],m={};let r;
  if((r=s.match(/［次へ\s+(\d+)(?:\s+([^］\s]+))?］/)))m.next={page:+r[1]-1,how:r[2]==='やぶる'?'tear':'paper'};
  if((r=s.match(/［めくれない([^］]*)］/))){const a=parseAttrs(r[1]);m.lock={n:+a.回数||6,text:a.文||'めくらないで'}}
  if(/［自動］/.test(s))m.auto=true;
  if((r=s.match(/［めくり\s+([^］\s]+)］/)))m.enter={'ノイズ':'noise','やぶる':'tear'}[r[1]]||'paper';
  if((r=s.match(/［背景\s+([^］\s]+)］/)))m.bg=r[1];
  /* 人影は、本の設定で「ふだんは出さない」にもできる（カタログなど） */
  m.noSil=/［人影\s+なし］/.test(s)||(BOOK.silDefault===false&&!/［人影/.test(s));
  if((r=s.match(/［題([^］]*)］/))){const a=parseAttrs(r[1]);m.title=a.名||'';m.genre=a.ジャンル||''}
  /* システム画面の既定の背景は、部屋ではなく異世界（スキルを使う場面が多いので） */
  if(!m.bg&&m.genre==='システム画面')m.bg='異世界';
  return m;
}

/* ===== ページの寿命（めくったら全部止める） ===== */
function makeCtx(){
  const c={dead:false,cl:[],timers:new Set()};
  c.on=fn=>c.cl.push(fn);
  c.wait=ms=>new Promise(r=>{if(c.dead)return r(false);const id=setTimeout(()=>{c.timers.delete(id);r(!c.dead)},ms);c.timers.add(id);c.on(()=>r(false))});
  c.every=(ms,fn)=>{const id=setInterval(()=>{if(!c.dead)fn()},ms);c.on(()=>clearInterval(id))};
  c.raf=fn=>{let id;const loop=t=>{if(c.dead)return;if(fn(t)!==false)id=requestAnimationFrame(loop)};id=requestAnimationFrame(loop);c.on(()=>cancelAnimationFrame(id))};
  c.layer=cls=>{const d=document.createElement('div');d.className='lay '+(cls||'');fxRoot.appendChild(d);c.on(()=>d.remove());return d};
  /* 文字より奥（背景と本文のあいだ）に置く層 */
  c.under=cls=>{const d=document.createElement('div');d.className='lay '+(cls||'');stage.insertBefore(d,$('silw'));c.on(()=>d.remove());return d};
  c.kill=()=>{if(c.dead)return;c.dead=true;c.timers.forEach(clearTimeout);c.cl.splice(0).forEach(f=>{try{f()}catch(e){}})};
  return c;
}
function resetLooks(){
  app.classList.remove('glitch','bare');page.classList.remove('mad');page.style.filter='';stage.style.filter='';
  app.style.visibility='';stage.getAnimations().forEach(a=>a.cancel());app.getAnimations().forEach(a=>a.cancel());
  $('bg').style.filter='';$('bg').style.transformOrigin='';$('bg').getAnimations().forEach(a=>a.cancel());$('silw').className='silw';
  page.style.opacity='';page.style.transition='';const nb=$('next');nb.style.transform='';nb.textContent='次へ ›';$('fxSw').checked=S.fx;
  $('themeColor').setAttribute('content','#14110f');$('disp').setAttribute('scale','0');
}

/* ===== 背景と人影 ===== */
const BGS={'部屋':'room','廊下':'hall','病室':'ward','歪む':'mad','赤':'red','ガラス':'glass','夜の部屋':'night','昼の部屋':'day','推し部屋':'fan','スタジオ':'studio','ライブ':'live','ステージ':'stage','寮':'dorm','練習室':'practice'};
/* 画像がない背景は、色で作る（あとで画像に差し替えられる） */
const BGCSS={
  '異世界':'radial-gradient(14% 8% at 78% 16%,rgba(255,250,235,.95),rgba(255,240,210,.5) 40%,transparent 70%),radial-gradient(6% 3.5% at 64% 10%,rgba(220,235,255,.9),transparent 70%),radial-gradient(80% 40% at 50% 62%,rgba(255,200,140,.55),transparent 70%),linear-gradient(#1b2350 0%,#5a5a9a 30%,#e3a97e 55%,#7a9a52 58%,#3f6230 75%,#1f3a1a 100%)',
  '夜空':'radial-gradient(1px 1px at 12% 18%,#fff,transparent),radial-gradient(1.5px 1.5px at 30% 8%,#fff,transparent),radial-gradient(1px 1px at 55% 22%,#fff,transparent),radial-gradient(2px 2px at 72% 12%,#fff,transparent),radial-gradient(1px 1px at 88% 30%,#fff,transparent),radial-gradient(1.5px 1.5px at 20% 40%,#fff,transparent),radial-gradient(1px 1px at 45% 48%,#fff,transparent),radial-gradient(1px 1px at 80% 52%,#fff,transparent),radial-gradient(1.5px 1.5px at 8% 62%,#fff,transparent),radial-gradient(1px 1px at 63% 70%,#fff,transparent),radial-gradient(60% 40% at 50% 100%,rgba(90,60,160,.5),transparent 70%),linear-gradient(#05061a,#141a44 60%,#2a1f4e)',
  '黒':'linear-gradient(#000,#000)',
  /* 宮殿の広間（乙女ゲーム・令嬢もの）：シャンデリアの光と、アーチ窓、ばら色の壁 */
  '宮殿':'radial-gradient(9% 5% at 50% 8%,rgba(255,244,214,1),rgba(255,226,160,.55) 45%,transparent 75%),radial-gradient(5% 3% at 22% 12%,rgba(255,236,190,.9),transparent 70%),radial-gradient(5% 3% at 78% 12%,rgba(255,236,190,.9),transparent 70%),radial-gradient(60% 30% at 50% 10%,rgba(255,214,150,.35),transparent 70%),radial-gradient(12% 26% at 14% 46%,rgba(190,215,255,.55),rgba(150,180,240,.18) 60%,transparent 75%),radial-gradient(12% 26% at 86% 46%,rgba(190,215,255,.55),rgba(150,180,240,.18) 60%,transparent 75%),repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 2px,transparent 2px 60px),linear-gradient(#3a1828 0%,#6e2c45 32%,#8f4a5e 58%,#c89b6e 74%,#5a3326 75%,#2a1610 100%)',

  '夏空':'radial-gradient(18% 10% at 82% 12%,rgba(255,255,240,1),rgba(255,250,220,.6) 40%,transparent 70%),radial-gradient(40% 14% at 20% 40%,rgba(255,255,255,.95),transparent 70%),radial-gradient(30% 10% at 45% 46%,rgba(255,255,255,.85),transparent 70%),radial-gradient(50% 18% at 70% 52%,rgba(255,255,255,.7),transparent 70%),linear-gradient(#2a7fd4 0%,#5fb0ef 45%,#b9e2fb 70%,#e9f6ff 100%)',
  '夕焼け':'radial-gradient(30% 16% at 50% 72%,rgba(255,230,160,.95),rgba(255,160,90,.5) 50%,transparent 75%),linear-gradient(#1d2450 0%,#6a3f7a 30%,#e0705a 58%,#f6b26b 72%,#2a1c2c 73%,#120c16 100%)',
  '桜':'radial-gradient(50% 30% at 80% 10%,rgba(255,255,255,.8),transparent 70%),radial-gradient(60% 40% at 10% 0%,rgba(255,190,210,.9),transparent 70%),radial-gradient(50% 40% at 100% 30%,rgba(255,200,220,.8),transparent 70%),linear-gradient(#a9d4f5 0%,#d8ecfb 50%,#fbe3ea 75%,#c8a6a6 100%)'
};
const bgUrl=k=>BGCSS[k]||`url(a/bg_${BGS[k]||'room'}.jpg)`;
Object.values(BGS).forEach(v=>{const i=new Image();i.src=`a/bg_${v}.jpg`});
['hand_l','hand_r','foot_l','foot_r','drips','splat','sil'].forEach(v=>{const i=new Image();i.src=`a/${v}.png`});
function setBg(k,fade){
  const el=$('bg');if(el.dataset.k===k)return;el.dataset.k=k;
  /* 明るい背景のときは、文字の後ろを少し暗くして読みやすくする */
  $('shade').classList.toggle('bright',['夏空','桜','昼の部屋','推し部屋'].includes(k));
  if(!fade){el.style.backgroundImage=bgUrl(k);return}
  const n=document.createElement('div');n.className='bg';n.style.backgroundImage=bgUrl(k);el.after(n);
  n.animate([{opacity:0},{opacity:1}],{duration:2200,easing:'ease-in-out'}).finished.then(()=>{el.style.backgroundImage=bgUrl(k);n.remove()}).catch(()=>n.remove());
}
/* 背景を少しだけ生かす（蛍光灯・モニターの光など） */
function bgLife(c,k){
  const bg=$('bg');
  const z=bg.animate([{transform:'scale(1)'},{transform:'scale(1.06) translate(-1%,-.5%)'}],{duration:40000,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});c.on(()=>z.cancel());
  /* 推し活部屋：配信を見ているパソコンが、色を変えながらぼおっと光る。ペンライトもほんのり */
  if(k==='推し部屋'){const g=c.under('glow'),pl=c.under('glow');const cols=['255,150,200','150,190,255','255,220,150','200,150,255'];let i=0;
    const set=()=>{const col=cols[i++%cols.length];g.style.transition='background 2.4s';g.style.background=`radial-gradient(30% 14% at 26% 30%,rgba(${col},.55),transparent 72%)`};set();c.every(2600,set);
    c.every(160,()=>{g.style.opacity=Math.random()<.06?rnd(.5,.7):rnd(.85,1)});
    pl.style.background='radial-gradient(6% 9% at 41% 21%,rgba(255,160,230,.55),transparent 75%)';pl.animate([{opacity:.5},{opacity:1}],{duration:1400,iterations:Infinity,direction:'alternate'})}
  if(k==='夜の部屋'){const g=c.under('glow');g.style.background='radial-gradient(18% 9% at 8% 31%,rgba(170,200,255,.35),transparent 72%)';c.every(200,()=>{g.style.opacity=rnd(.7,1)})}
  if(k==='部屋'){const g=c.under('glow');g.style.background='radial-gradient(28% 16% at 15% 37%,rgba(150,200,255,.5),transparent 70%)';
    c.every(140,()=>{g.style.opacity=Math.random()<.08?rnd(.1,.4):rnd(.75,1)})}
  if(k==='廊下')(async()=>{while(!c.dead){if(!await c.wait(rnd(1800,5200)))return;
    for(let i=0;i<(Math.random()<.5?2:3);i++){bg.style.filter='brightness(.35)';SFX.crackle(.05,.12);if(!await c.wait(rnd(50,110)))return;bg.style.filter='';if(!await c.wait(rnd(60,160)))return}}})();
  if(k==='歪む'){const a=bg.animate([{filter:'brightness(1)'},{filter:'brightness(.7) saturate(1.3)'}],{duration:2600,iterations:Infinity,direction:'alternate'});c.on(()=>a.cancel())}
  if(k==='赤'){const a=bg.animate([{filter:'brightness(.85)'},{filter:'brightness(1.15)'}],{duration:1050,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});c.on(()=>a.cancel())}
}
function silShake(ms=900){$('silw').animate([{transform:'translate(0)'},{transform:'translate(-4px,1px)'},{transform:'translate(4px,-1px)'},{transform:'translate(-3px,0)'},{transform:'none'}],{duration:Math.min(ms,500),iterations:Math.max(1,Math.round(ms/500))})}

/* ===== 小さな道具 ===== */
function shake(px=6,ms=420){const f=[];for(let i=0;i<9;i++)f.push({transform:`translate(${rnd(-px,px)}px,${rnd(-px,px)}px)`});f.push({transform:'none'});app.animate(f,{duration:ms})}
function pulse(k=1){
  stage.animate([{transform:'scale(1)',filter:'brightness(1)'},{transform:`scale(${1+.03*k})`,filter:`brightness(${1+.25*k})`,offset:.12},{transform:'scale(1)',filter:'brightness(.9)',offset:.3},{transform:`scale(${1+.018*k})`,filter:`brightness(${1+.12*k})`,offset:.42},{transform:'scale(1)',filter:'brightness(1)'}],{duration:700,easing:'ease-out'});
  vigEl.animate([{opacity:0},{opacity:.75*k,offset:.15},{opacity:.1,offset:.35},{opacity:.5*k,offset:.45},{opacity:0}],{duration:800});
}
function flash(color,ms=300,op=.6){const d=document.createElement('div');d.className='lay';d.style.background=color;fxRoot.appendChild(d);d.animate([{opacity:op},{opacity:0}],{duration:ms,easing:'ease-out'}).finished.then(()=>d.remove())}
function makeNoise(parent,op=.35){
  const L=document.createElement('div');L.className='lay';L.style.opacity=op;parent.appendChild(L);
  const cv=document.createElement('canvas');cv.className='nz';cv.width=Math.ceil(innerWidth/3);cv.height=Math.ceil(innerHeight/3);L.appendChild(cv);
  const x=cv.getContext('2d'),img=x.createImageData(cv.width,cv.height),d=img.data;let alive=true;
  const loop=()=>{if(!alive)return;for(let i=0;i<d.length;i+=4){const v=Math.random()*255|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}x.putImageData(img,0,0);
    for(let k=0;k<3;k++){x.fillStyle=`rgba(255,255,255,${rnd(.1,.35)})`;x.fillRect(0,Math.random()*cv.height,cv.width,rnd(1,6))}requestAnimationFrame(loop)};loop();
  return{L,stop(){alive=false;L.remove()}};
}
function splitChars(el){const t=el.textContent;el.innerHTML=[...t].map(ch=>`<span class="ch">${esc(ch)}</span>`).join('');return[...el.children]}
function blockAfter(el,html){const d=document.createElement('div');d.innerHTML=html;const n=d.firstElementChild;el.after(n);return n}
const img=(name,cls='print')=>{const i=document.createElement('img');i.src=`a/${name}.png`;i.className=cls;i.alt='';i.draggable=false;return i};

/* ===== 血・涙 ===== */
/* 上から血が垂れてくる（画像を上から少しずつ見せる）。w=幅(%) x=位置(%) flip=左右反転 delay=時間差 */
function bloodFall(c,{L,sec=7,w=100,x=0,flip=false,delay=0}){
  const el=document.createElement('div'),f=flip?-1:1;el.className='blood';
  el.style.cssText=`left:${x}%;width:${w}%;aspect-ratio:${720*w/100}/451;background:url(a/drips.png) ${w<100?rnd(0,100).toFixed(0)+'%':'0'} top/${(100*100/w).toFixed(1)}% auto no-repeat;transform:scaleX(${f});clip-path:inset(0 0 100% 0)`;
  L.appendChild(el);
  c.wait(delay).then(ok=>{if(!ok)return;SFX.drip(.5);
    el.animate([{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 55% 0)',offset:.35},{clipPath:'inset(0 0 0 0)'}],{duration:sec*1000,easing:'cubic-bezier(.4,0,.3,1)',fill:'forwards'})
      .finished.then(()=>{if(!c.dead)el.animate([{transform:`scaleX(${f}) scaleY(1)`},{transform:`scaleX(${f}) scaleY(1.18)`}],{duration:24000,fill:'forwards',easing:'ease-out'})}).catch(()=>{})});
}
/* 文字の上に血のしずくが落ちて、ぱっと広がる */
function bloodDrop(c,L){
  const lr=L.getBoundingClientRect(),vis=[...page.querySelectorAll('.tc.on')].filter(s=>{const r=s.getBoundingClientRect();return r.top>lr.top+40&&r.bottom<lr.bottom-60});
  let x,y;if(vis.length){const r=pick(vis).getBoundingClientRect();x=r.left-lr.left+r.width/2;y=r.top-lr.top+r.height/2}else{x=rnd(20,lr.width-20);y=rnd(lr.height*.2,lr.height*.8)}
  const d=document.createElement('div');d.className='bdrop';d.style.left=(x-4)+'px';d.style.top='-14px';L.appendChild(d);
  d.animate([{transform:'translateY(0) scaleY(1)'},{transform:`translateY(${y+10}px) scaleY(1.4)`}],{duration:Math.max(260,Math.sqrt(y)*38),easing:'cubic-bezier(.55,0,1,.9)',fill:'forwards'}).finished.then(()=>{
    if(c.dead)return;d.remove();SFX.drip(.55);
    const s=img('splat');const sz=rnd(26,64);s.style.cssText=`left:${x-sz/2}px;top:${y-sz/2}px;width:${sz}px;opacity:0;transform:rotate(${rnd(0,360)|0}deg)`;L.appendChild(s);
    s.animate([{opacity:0,scale:.3},{opacity:.92,scale:1}],{duration:200,easing:'ease-out',fill:'forwards'});
    const all=L.querySelectorAll('img.print');if(all.length>40)all[0].remove();
  }).catch(()=>{});
}
/* 画面の下に、血がたまっていく */
function bloodPool(c,L,sec=22){
  const p=document.createElement('div');p.style.cssText='position:absolute;left:-6%;right:-6%;bottom:0;height:0;background:linear-gradient(rgba(80,0,0,0),rgba(95,0,0,.88) 28%,#2c0000);filter:blur(.8px);border-radius:46% 54% 0 0/16px 12px 0 0';L.appendChild(p);
  p.animate([{height:'0%'},{height:'17%'}],{duration:sec*1000,fill:'forwards',easing:'cubic-bezier(.3,.2,.4,1)'});
  p.animate([{borderRadius:'46% 54% 0 0/16px 12px 0 0'},{borderRadius:'54% 46% 0 0/10px 18px 0 0'}],{duration:2600,iterations:Infinity,direction:'alternate'});
}
/* 血の演出のまとめ：何本も時間差で垂れる＋文字の上に落ちる＋下にたまる */
function bloodRain(c,{falls=3,narrow=false,drops=[900,1800],pool=true}={}){
  const L=c.layer();
  for(let i=0;i<falls;i++){const w=narrow||i>0?rnd(22,42):100;bloodFall(c,{L,sec:rnd(6,11),w,x:w<100?rnd(0,100-w):0,flip:Math.random()<.5,delay:i*rnd(1400,2800)})}
  if(drops)(async()=>{if(!await c.wait(2200))return;while(!c.dead){bloodDrop(c,L);if(!await c.wait(rnd(drops[0],drops[1])))return}})();
  if(pool)c.wait(2500).then(ok=>ok&&bloodPool(c,L));
  c.every(1500,()=>Math.random()<.6&&SFX.drip(rnd(.2,.45)));
  return L;
}
function tearDrop(c,L){
  const blood=c.tearBlood,x=rnd(25,75),y0=rnd(14,24),y1=rnd(40,86);
  const t=document.createElement('div');t.className='tear'+(blood?' b':'');t.style.left=x+'%';t.style.top=y0+'%';L.appendChild(t);
  const dist=(y1-y0)/100*L.clientHeight;
  t.animate([{transform:'translateY(0) scale(.4)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1,offset:.25},{transform:`translateY(${dist}px) scaleY(1.25)`,opacity:1}],{duration:rnd(1100,1500),easing:'cubic-bezier(.55,0,1,.9)',fill:'forwards'}).finished.then(()=>{
    if(c.dead)return;t.remove();SFX.drip(.6);
    const b=document.createElement('div');b.className='blot'+(blood?' b':'');const s=rnd(34,64);b.style.cssText=`left:${x}%;top:${y1}%;width:${s}px;height:${s*.8}px`;L.appendChild(b);
    requestAnimationFrame(()=>b.classList.add('on'));
    const all=L.querySelectorAll('.blot');if(all.length>16)all[0].remove();
  }).catch(()=>{});
}

/* ===== 演出の一覧 ===== */
const D={};
D['待つ']={run:(el,a,c)=>c.wait((parseFloat(a.args[0])||1.5)*1000)};
D['環境音']={run:(el,a,c)=>{drone(c,a.args[0])}};
D['どくん']={run(el,a,c){
  const n=+a.回数||0,fast=a.args.includes('速く');
  const beat=()=>{SFX.thump();vib([45,110,70]);pulse()};
  if(n)return(async()=>{for(let k=0;k<n;k++){if(c.stopBeat)return;beat();if(!await c.wait(1050))return}})();
  (async()=>{let iv=fast?900:1050;while(!c.dead&&!c.stopBeat){beat();if(!await c.wait(iv))return;if(fast)iv=Math.max(320,iv*.93)}})();
}};
function ecgY(p){const g=(m,w,h)=>h*Math.exp(-((p-m)**2)/(2*w*w));return g(.12,.025,.12)+g(.3,.01,-.12)+g(.33,.008,1)+g(.36,.012,-.28)+g(.58,.045,.28)}
/* 心電図：箱なしで画面いっぱいに。拍のたびに画面がドクンと脈打つ */
D['心電図']={run(el,a,c){
  const flat=a.args.includes('平ら'),fast=a.args.includes('速く');
  if(c.ecg)c.ecg.remove();
  const L=c.under('ecgL');c.ecg=L;L.innerHTML='<canvas></canvas><div class="ecghr"><small>HR</small>72</div>';
  const cv=L.firstChild,hrEl=L.lastChild,dpr=Math.min(2,devicePixelRatio||1),W=(cv.width=L.clientWidth*dpr),H=(cv.height=L.clientHeight*dpr),x2=cv.getContext('2d');
  L.animate([{opacity:0},{opacity:1}],{duration:900});
  let hr=flat?0:72,x=0,ph=0,last=performance.now(),t0=last,prevY=H/2;
  if(flat){c.stopBeat=true;c.cmStop&&c.cmStop();L.classList.add('alarm');hrEl.innerHTML='<small>HR</small>---';SFX.flat(3.4);vib(1400);flash('rgba(120,0,0,.5)',1600,.7);silShake(1200)}
  x2.lineWidth=2.4*dpr;x2.lineJoin='round';
  c.raf(t=>{
    const dt=Math.min(.05,(t-last)/1000);last=t;
    if(fast&&!flat)hr=Math.min(150,72+(t-t0)/1000*7);
    if(!flat)hrEl.innerHTML='<small>HR</small>'+Math.round(hr);
    const pf=ph%1;ph+=dt*hr/60;const f=ph%1;
    if(!flat&&pf<.33&&f>=.33){SFX.beep(1000,.09,.14);SFX.thump(.5);vib(40);pulse(.8)}
    let nx=x+150*dpr*dt;const y=H/2-(flat?0:ecgY(f))*H*.42;
    /* 古い線はゆっくり消える */
    x2.globalCompositeOperation='destination-out';x2.fillStyle='rgba(0,0,0,.012)';x2.fillRect(0,0,W,H);x2.clearRect(x,0,26*dpr,H);
    x2.globalCompositeOperation='source-over';
    x2.strokeStyle=flat?'#ff5050':'#5dff9a';x2.shadowColor=flat?'rgba(255,60,60,.9)':'rgba(78,240,138,.9)';x2.shadowBlur=10*dpr;
    x2.beginPath();x2.moveTo(x,prevY);x2.lineTo(nx,y);x2.stroke();
    x2.shadowBlur=0;x2.fillStyle='#eafff0';x2.beginPath();x2.arc(nx,y,2.6*dpr,0,7);x2.fill();
    if(nx>=W){nx=0}x=nx;prevY=y;
  });
}};
function ledBits(text){
  const o=document.createElement('canvas').getContext('2d');o.font='700 15px "DotGothic16","Zen Maru Gothic",sans-serif';
  const w=Math.ceil(o.measureText(text).width)+40;o.canvas.width=w;o.canvas.height=16;
  o.font='700 15px "DotGothic16","Zen Maru Gothic",sans-serif';o.fillStyle='#fff';o.textBaseline='alphabetic';o.fillText(text,0,13.5);
  const d=o.getImageData(0,0,w,16).data,bits=new Uint8Array(w*16);for(let X=0;X<w;X++)for(let Y=0;Y<16;Y++)bits[X*16+Y]=d[(Y*w+X)*4+3]>100?1:0;
  return{bits,len:w};
}
function ledSetup(el){
  const cv=el.querySelector('canvas'),dpr=Math.min(2,devicePixelRatio||1),Wc=(el.clientWidth-14)||300,p=4;
  cv.width=Wc*dpr;cv.height=64*dpr;const x=cv.getContext('2d');x.scale(dpr,dpr);
  const cols=Math.floor(Wc/p);
  return el._led={x,cols,p,Wc,data:ledBits(el.dataset.text),color:'#FFB02E',dim:'#2A1A08'};
}
function ledDraw(L,off,glitch){
  const{x,cols,p,data}=L;x.clearRect(0,0,L.Wc,64);
  for(let c=0;c<cols;c++){const sx=((Math.floor(off)+c)%data.len+data.len)%data.len;
    for(let r=0;r<16;r++){const lit=glitch?Math.random()<.18:data.bits[sx*16+r];x.fillStyle=lit?L.color:L.dim;x.fillRect(c*p+.4,r*p+.4,p-1.1,p-1.1)}}
}

/* ===== 電光掲示板（色・背景・複数行・折り返しつき） =====
   ［電光掲示板 背景=黒 文字=橙 速さ=ふつう 折り返し］ の下に、文を1行ずつ。1行が、右から左へ流れる
   文字ごとの色：［赤］…［／赤］（赤 橙 黄 緑 青 水色 紫 桃 白 黒 灰）／［色=#ff0000］…［／色］
   文字ごとの背景：［地=黄］…［／地］  行の途中で次の行へ：［改行］
   折り返し：長い文を、幅に合わせて何行かに分け、右から入ってきて止まる（流れ続けない） */
const LEDC={'赤':'#ff4a3a','橙':'#ffb02e','オレンジ':'#ffb02e','黄':'#ffe44d','緑':'#4dff7a','青':'#4aa8ff','水色':'#5ee6ff','紫':'#c78bff','桃':'#ff8fc8','白':'#f4f4f4','黒':'#101010','灰':'#8a8a8a'};
const ledCol=v=>{v=String(v||'').trim();return LEDC[v]||(/^#[0-9a-fA-F]{6}$/.test(v)?v:'')};
const ledMix=(h,t,k)=>{const n=x=>parseInt(h.slice(x,x+2),16),m=x=>parseInt(t.slice(x,x+2),16),q=x=>Math.round(n(x)+(m(x)-n(x))*k).toString(16).padStart(2,'0');return'#'+q(1)+q(3)+q(5)};
function ledIsNew(el,a){let L=[];try{L=JSON.parse(el.dataset.lines||'[]')}catch(e){}
  return !!(a.背景||a.文字||a.速さ||a.args.includes('折り返し')||a.折り返し!=null||L.some(l=>/［(\/|／)?(色|地|改行|赤|橙|オレンジ|黄|緑|青|水色|紫|桃|白|黒|灰)/.test(l)))}
/* 1行を、色つきの切れ（文字・文字色・背景色）にする */
function ledSegs(line,base){const segs=[],fg=[base],bg=[''];let last=0,m;const re=/［(／?)(色|地|赤|橙|オレンジ|黄|緑|青|水色|紫|桃|白|黒|灰)(?:[=＝:：]([^］]*))?］/g;
  const push=t=>{if(t)segs.push({t,fg:fg[fg.length-1],bg:bg[bg.length-1]})};
  while((m=re.exec(line))){push(line.slice(last,m.index));last=re.lastIndex;const close=!!m[1],nm=m[2];
    if(nm==='地'){if(close){if(bg.length>1)bg.pop()}else bg.push(ledCol(m[3])||'')}
    else if(close){if(fg.length>1)fg.pop()}
    else fg.push(nm==='色'?(ledCol(m[3])||base):LEDC[nm])}
  push(line.slice(last));return segs}
const LEDFONT='700 15px "DotGothic16","Zen Maru Gothic",sans-serif';
let _ledCtx;const ledCtx=()=>_ledCtx||(_ledCtx=document.createElement('canvas').getContext('2d',{willReadFrequently:true}));
/* 幅に合わせて、何行かに分ける */
function ledWrap(segs,maxW){const o=ledCtx();o.font=LEDFONT;const rows=[[]];let w=0;
  for(const sg of segs)for(const ch of sg.t){const cw=o.measureText(ch).width;if(w+cw>maxW&&w>0){rows.push([]);w=0}w+=cw;const r=rows[rows.length-1],p=r[r.length-1];if(p&&p.fg===sg.fg&&p.bg===sg.bg)p.t+=ch;else r.push({t:ch,fg:sg.fg,bg:sg.bg})}
  return rows}
/* 色つきの点の絵：lit[x*16+y] = 色（なければ0） */
function ledBitsC(segs,pad){const o=ledCtx();o.font=LEDFONT;let w=0;const ws=segs.map(sg=>{const x=Math.ceil(o.measureText(sg.t).width);w+=x;return x});
  const W=Math.max(1,w+(pad||0));o.canvas.width=W;o.canvas.height=16;o.font=LEDFONT;o.textBaseline='alphabetic';o.clearRect(0,0,W,16);
  let x=0;segs.forEach((sg,i)=>{if(sg.bg){o.fillStyle=sg.bg;o.fillRect(x,0,ws[i],16)}o.fillStyle=sg.fg;o.fillText(sg.t,x,13.5);x+=ws[i]});
  const d=o.getImageData(0,0,W,16).data,cols=new Array(W*16);
  for(let X=0;X<W;X++)for(let Y=0;Y<16;Y++){const k=(Y*W+X)*4;cols[X*16+Y]=d[k+3]>100?'rgb('+d[k]+','+d[k+1]+','+d[k+2]+')':0}
  return{cols,len:W}}
function ledSetupN(el,a){
  const cv=el.querySelector('canvas'),dpr=Math.min(2,devicePixelRatio||1),Wc=(el.clientWidth-14)||300,p=3,nc=Math.floor(Wc/p);
  const base=ledCol(a.文字)||'#ffb02e',board=ledCol(a.背景)||'#0b0807',dim=ledMix(board,'#ffffff',.09);
  let lines=[];try{lines=JSON.parse(el.dataset.lines||'[]')}catch(e){}
  const wrap=a.args.includes('折り返し')||a.折り返し!=null;let rows=[];
  lines.forEach(l=>String(l).split(/［改行］/).forEach(part=>{if(!part.trim())return;const sg=ledSegs(part,base);if(wrap)ledWrap(sg,nc*p>0?nc:80).forEach(r=>rows.push(r));else rows.push(sg)}));
  if(!rows.length)rows=[ledSegs(el.dataset.text||'',base)];
  rows=rows.slice(0,8);const gap=2,H=rows.length*16*p+(rows.length-1)*gap*p;
  cv.width=Wc*dpr;cv.height=H*dpr;cv.style.height=H+'px';el.style.background=board;const x=cv.getContext('2d');x.scale(dpr,dpr);
  const sp=({'おそい':14,'遅い':14,'ふつう':22,'はやい':36,'速い':36}[a.速さ])||parseFloat(a.速さ)||22;
  return el._led={x,cols:nc,p,Wc,H,rows:rows.map(r=>ledBitsC(r,wrap?0:40)),dim,speed:sp,wrap,gap}}
function ledDrawN(L,off,t){const{x,cols,p,rows,dim,gap}=L;x.clearRect(0,0,L.Wc,L.H);
  rows.forEach((R,ri)=>{const y0=ri*(16+gap)*p;
    const o=L.wrap?Math.min(0,-cols+((t==null?9e9:t)-ri*.6)*L.speed):off;   // 折り返し：右から入って、左端で止まる
    for(let c=0;c<cols;c++){let sx=Math.floor(o)+c;if(L.wrap){if(sx<0||sx>=R.len){for(let r=0;r<16;r++){x.fillStyle=dim;x.fillRect(c*p+.4,y0+r*p+.4,p-1.1,p-1.1)}continue}}else sx=((sx%R.len)+R.len)%R.len;
      for(let r=0;r<16;r++){const col=R.cols[sx*16+r];x.fillStyle=col||dim;x.fillRect(c*p+.4,y0+r*p+.4,p-1.1,p-1.1)}}})}
D['電光掲示板']={
  prep(el,a){a=a||JSON.parse(el.dataset.a||"{\"args\":[]}");if(ledIsNew(el,a))ledDrawN(ledSetupN(el,a),-8,0);else ledDraw(ledSetup(el),-8)},
  still(el,a){a=a||JSON.parse(el.dataset.a||"{\"args\":[]}");if(ledIsNew(el,a))ledDrawN(ledSetupN(el,a),-4,9e9);else ledDraw(ledSetup(el),-4)},
  async run(el,a,c){
    if(ledIsNew(el,a)){const L=ledSetupN(el,a);let off=-L.cols,last=performance.now();const t0=last;
      c.raf(t=>{const dt=Math.min(.05,(t-last)/1000);last=t;off+=L.speed*dt;ledDrawN(L,off,(t-t0)/1000)});return}
    /* 地の文の中ではなく、背景の中（画面の上の方）にぼんやり浮かぶ。そのあいだ地の文は薄くなる */
    const H=c.under('');H.style.cssText='top:7%;bottom:auto;height:auto;left:5%;right:5%';H.appendChild(el);el.style.margin='0';
    el.style.boxShadow='0 0 40px rgba(255,150,40,.25)';
    page.style.transition='opacity 1.2s';page.style.opacity=.12;
    const L=ledSetup(el);ledDraw(L,-4);el.style.opacity=0;
    if(!await c.wait(900))return;
    /* ジ…ジジ…と電気が入って、何度か点滅する */
    for(let i=0;i<7;i++){el.style.opacity=i%2?0:rnd(.3,1);SFX.buzz(rnd(.05,.18));if(i===3)vib(30);if(!await c.wait(rnd(70,260)))return}
    el.style.opacity=1;
    let off=-L.cols,dir=1,last=performance.now(),t0=last,state=0,gUntil=0;const rev=(parseFloat(a.逆)||0)*1000;
    c.raf(t=>{
      const dt=Math.min(.05,(t-last)/1000);last=t;
      if(rev&&state===0&&t-t0>rev){state=1;gUntil=t+900;SFX.crackle(.8,.4);vib([20,30,20])}
      if(state===1&&t>gUntil){state=2;dir=-1;L.color='#FF3B3B';if(a.後)L.data=ledBits(a.後);off=L.data.len}
      if(state!==1)off+=dir*22*dt;
      ledDraw(L,off,state===1||Math.random()<.015);
    });
    if(!await c.wait(rev+6500))return;
    el.animate([{opacity:1},{opacity:.4,offset:.2},{opacity:1,offset:.3},{opacity:0}],{duration:1400,fill:'forwards'});SFX.buzz(.3);
    page.style.opacity='';await c.wait(1200);
  }
};
D['PC']={
  prep(el){const pre=el.querySelector('pre');pre.innerHTML='';pre.append(document.createTextNode(''));const cu=document.createElement('span');cu.className='cur';pre.append(cu)},
  async run(el,a,c){
    const tn=el.querySelector('pre').firstChild,lines=JSON.parse(el.dataset.lines);
    for(let li=0;li<lines.length;li++){
      for(const ch of lines[li]){if(!await c.wait(li>=2?rnd(50,110):rnd(90,200)))return;tn.data+=ch;SFX.key();if(Math.random()<.2)vib(8)}
      if(li<lines.length-1)tn.data+='\n';if(!await c.wait(li>=2?300:700))return;
    }
  }
};
/* パソコンの画面が乱れて、勝手にブラウザに切り替わる */
D['画面']={async run(el,a,c){
  const pre=page.querySelector('.pc pre'),bar=page.querySelector('.pc .bar');if(!pre)return;
  const K='▓▒░█■□#?%&@';
  for(let i=0;i<14;i++){pre.textContent=[...pre.textContent].map(ch=>ch==='\n'?ch:(Math.random()<.4?pick([...K]):ch)).join('');SFX.crackle(.04,.25);if(!await c.wait(70))return}
  pre.textContent='';SFX.buzz(.25);vib(40);if(!await c.wait(500))return;
  if(bar)bar.textContent='● ● ●　browser';
  const lines=['https://','ブラウザを起動しています','','検索：　みなと　廃病院　配信'];
  for(const l of lines){for(const ch of l){pre.textContent+=ch;SFX.key();if(!await c.wait(rnd(40,90)))return}pre.textContent+='\n';if(!await c.wait(350))return}
}};
/* 部屋のモニターに、ぐーっと近づいていく */
D['近づく']={async run(el,a,c){
  const bg=$('bg');bg.style.transformOrigin='16% 37%';
  const g=c.under('glow');g.style.background='radial-gradient(60% 40% at 50% 45%,rgba(170,210,255,.0),rgba(5,10,25,.0))';
  SFX.rumble();
  bg.animate([{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(3.4)',filter:'brightness(1.5) blur(2px)'}],{duration:2600,easing:'cubic-bezier(.6,0,.4,1)',fill:'forwards'});
  g.animate([{background:'rgba(160,200,255,0)'},{background:'rgba(160,200,255,.0)',offset:.6},{background:'rgba(8,10,20,.82)'}],{duration:2600,fill:'forwards'});
  await c.wait(2700);flash('#cfe6ff',250,.6);SFX.buzz(.2);
}};
D['掲示板']={
  prep(el){el.querySelectorAll('.po').forEach(p=>p.classList.add('h'))},
  async run(el,a,c){
    el.animate([{opacity:0},{opacity:1}],{duration:700,easing:'steps(5)'});SFX.buzz(.2);
    for(const p of el.querySelectorAll('.po')){if(!await c.wait(1000))return;p.classList.remove('h');p.animate([{opacity:0},{opacity:1,offset:.15},{opacity:.2,offset:.3},{opacity:1}],{duration:380});SFX.pop();
      if(p.querySelector('.nm')){p.classList.add('hot');SFX.crackle(.3,.4);vib([30,40,60]);shake(3,300)}}
  }
};
/* 手紙：便せんに、お母さんの字がゆっくり浮かぶ。
   ［涙あと］の字は、お母さんが泣きながら書いたので、はじめから滲んでいて涙の跡がある。
   読んでいると、ぼくの涙が落ちて字が滲む。でも、ぼくはもう死んでいるので、すぐ元に戻る。 */
['paper.jpg','stain1.webp','stain2.webp','stain3.webp','stain4.webp','stain5.webp'].forEach(v=>{const i=new Image();i.src='a/'+v});
const PAPER={y0:.061,gap:.0297,zoom:1.55};
D['手紙']={
  prep(el){el.classList.remove('opened')},
  still(el){el.classList.add('opened')},
  run(el,a,c){return new Promise(async res=>{
    c.on(()=>res());
    if(!await c.wait(700))return;
    const lay=c.layer();lay.style.cssText+=';pointer-events:auto;display:flex;align-items:center;justify-content:center';
    lay.animate([{background:'rgba(8,6,4,0)'},{background:'rgba(8,6,4,.8)'}],{duration:900,fill:'forwards'});
    const W=lay.clientWidth,H=lay.clientHeight,sw=Math.min(W*.94,H*.9*720/1279),sh=sw*1279/720;
    const sheet=document.createElement('div');sheet.style.cssText=`position:relative;width:${sw}px;height:${sh}px;background:url(a/paper.jpg) center top/${PAPER.zoom*100}% auto no-repeat;box-shadow:0 22px 50px rgba(0,0,0,.65);transform:rotate(-.8deg);font-family:'Klee One',serif;color:#262a38`;
    lay.appendChild(sheet);SFX.swish();
    sheet.animate([{opacity:0,transform:'rotate(-3deg) translateY(30px) scale(.96)'},{opacity:1,transform:'rotate(-.8deg)'}],{duration:1100,easing:'cubic-bezier(.3,.7,.3,1)'});
    /* 行ごとに、滲む所とそうでない所に分ける */
    const body=JSON.parse(el.dataset.body).map(raw=>{const segs=[],re=/［涙あと］(.*?)［／涙あと］/g;let last=0,m;
      while((m=re.exec(raw))){segs.push([raw.slice(last,m.index),0],[m[1],1]);last=re.lastIndex}segs.push([raw.slice(last),0]);
      return segs.map(([t,b])=>[t.replace(/［[^］]*］/g,''),b]).filter(s=>s[0])});
    /* 紙を大きめに映して、字を読みやすくする。罫線の位置は紙の画像に合わせる */
    const Z=PAPER.zoom,gap=sh*Z*PAPER.gap,lx=sw*.08,lw=sw*.84,fs=gap*.72,lineY=k=>sh*Z*PAPER.y0+k*gap;
    /* 1行に入りきらない行は折り返す */
    const per=Math.max(4,Math.floor(lw/fs));
    const wrapped=[];body.forEach(segs=>{if(!segs.length){wrapped.push([]);return}let cur=[],n=0;
      segs.forEach(([t,b])=>{for(const ch of t){if(n>=per&&!/[、。」]/.test(ch)){wrapped.push(cur);cur=[];n=0}cur.push([ch,b]);n++}});wrapped.push(cur)});
    const spans=[],rows=[];let k=2;
    wrapped.forEach(chs=>{if(!chs.length){k++;return}
      const d=document.createElement('div');d.style.cssText=`position:absolute;z-index:1;left:${lx}px;top:${lineY(k)-fs*1.12}px;font-size:${fs}px;line-height:1.15;white-space:nowrap`;
      chs.forEach(([ch,b])=>{const s=document.createElement('span');s.textContent=ch;s.style.cssText='display:inline-block;opacity:0;transition:opacity .9s,filter .25s,transform .25s,color .25s';s._mom=!!b;d.appendChild(s);spans.push(s)});
      sheet.appendChild(d);rows.push(d);spans.push(null);k+=1+(k<4?1:0);
    });
    const fr=document.createElement('div');fr.textContent=a.差出人||'';fr.style.cssText=`position:absolute;z-index:1;right:${sw*.12}px;top:${lineY(k+1)-fs*1.12}px;font-size:${fs}px;opacity:0;transition:opacity 1.2s`;sheet.appendChild(fr);
    /* お母さんの涙の跡（はじめから紙にある） */
    rows.forEach(r=>{const ms=[...r.children].filter(s=>s._mom);if(!ms.length)return;
      const a0=ms[0].offsetLeft+r.offsetLeft,a1=ms[ms.length-1].offsetLeft+ms[ms.length-1].offsetWidth+r.offsetLeft,cy=r.offsetTop+r.offsetHeight/2;
      const n=Math.max(1,Math.round((a1-a0)/(fs*4)));
      for(let i=0;i<n;i++){const st=document.createElement('img');st.src=`a/stain${1+(Math.random()*5|0)}.webp`;st.alt='';const sz=fs*rnd(2.6,4);
        st.style.cssText=`position:absolute;z-index:0;left:${a0+(a1-a0)*(i+.5)/n-sz/2+rnd(-6,6)}px;top:${cy-sz/2+rnd(-6,6)}px;width:${sz}px;opacity:.6;mix-blend-mode:multiply;transform:rotate(${rnd(0,360)|0}deg)`;sheet.appendChild(st)}});
    /* ぼくの涙：落ちた所の字が滲んで、少しあとに元に戻る */
    const myTear=async()=>{
      const shown=spans.filter(s=>s&&s.style.opacity==='1'&&!s._mom);if(!shown.length)return;
      const t=pick(shown),tr=t.getBoundingClientRect(),lr=lay.getBoundingClientRect(),x=tr.left-lr.left+tr.width/2,y=tr.top-lr.top+tr.height/2;
      const d=document.createElement('div');d.className='tear';d.style.cssText+=`;left:${x-6}px;top:-20px;z-index:3`;lay.appendChild(d);
      await d.animate([{transform:'translateY(0) scale(.6)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1,offset:.2},{transform:`translateY(${y+14}px) scaleY(1.25)`,opacity:1}],{duration:1300,easing:'cubic-bezier(.55,0,1,.9)',fill:'forwards'}).finished.catch(()=>{});
      d.remove();if(c.dead)return;SFX.drip(.5);
      const wet=document.createElement('div');const ws=fs*3.2;wet.style.cssText=`position:absolute;z-index:2;left:${x-lr.left+lr.left-ws/2-(sheet.getBoundingClientRect().left-lr.left)}px;top:${y-ws/2-(sheet.getBoundingClientRect().top-lr.top)}px;width:${ws}px;height:${ws}px;border-radius:50%;background:radial-gradient(rgba(110,90,60,.22),rgba(110,90,60,.08) 55%,transparent 72%);pointer-events:none`;sheet.appendChild(wet);
      wet.animate([{transform:'scale(.3)'},{transform:'scale(1)'}],{duration:500,easing:'ease-out'});
      const near=spans.filter(s=>{if(!s||s._mom)return false;const r=s.getBoundingClientRect();return Math.hypot(r.left+r.width/2-tr.left-tr.width/2,r.top+r.height/2-tr.top-tr.height/2)<fs*1.6});
      near.forEach(s=>{s.style.filter=`blur(${rnd(1.6,2.6).toFixed(1)}px)`;s.style.transform=`scale(${rnd(1.05,1.15).toFixed(2)})`;s.style.color='#4a5274'});
      if(!await c.wait(2600))return;
      /* 本当は、滲んでいない */
      near.forEach(s=>{s.style.filter='';s.style.transform='';s.style.color=''});wet.remove();
    };
    let fast=false;sheet.addEventListener('click',()=>{fast=true});
    if(!await c.wait(1200))return;
    let line=0;
    for(const s of spans){
      if(c.dead)return;
      if(!s){line++;if(line===3||line===5||line===7)myTear();if(!fast&&!await c.wait(450))return;continue}
      s.style.opacity=1;if(s._mom){s.style.filter=`blur(${rnd(1,1.8).toFixed(1)}px)`;s.style.color='#3b4466';s.style.transform=`scale(${rnd(1.02,1.1).toFixed(2)})`}
      if(!fast&&!await c.wait(s._mom?120:80))return;
    }
    fr.style.opacity=1;if(!await c.wait(3200))return;
    const close=document.createElement('button');close.type='button';close.textContent='たたむ';close.style.cssText='position:absolute;left:50%;bottom:4%;transform:translateX(-50%);min-height:44px;padding:0 22px;border-radius:22px;border:1px solid #8f7a5a;background:rgba(245,235,215,.7);font-family:"Zen Maru Gothic";font-size:14px;color:#4e3b26;opacity:0;transition:opacity 1s;z-index:4';
    lay.appendChild(close);requestAnimationFrame(()=>close.style.opacity=1);
    close.addEventListener('click',async e=>{e.stopPropagation();SFX.swish();await lay.animate([{opacity:1},{opacity:0}],{duration:600,fill:'forwards'}).finished.catch(()=>{});lay.remove();el.classList.add('opened');keepBottom();res()},{once:true});
  })}
};
/* 文字がおかしくなる */
const OPS={
  '反転':el=>{el.style.display='inline-block';el.animate([{transform:'scaleX(1)'},{transform:'scaleX(-1)'}],{duration:1600,fill:'forwards',easing:'ease-in-out'});SFX.swish()},
  '逆さ':el=>{el.style.display='inline-block';el.animate([{transform:'none'},{transform:'rotate(180deg)'}],{duration:1800,fill:'forwards',easing:'ease-in-out'})},
  '回る':el=>{splitChars(el).forEach((s,i)=>s.animate([{transform:'rotate(0)'},{transform:`rotate(${i%2?-360:360}deg)`}],{duration:rnd(1400,4000),iterations:Infinity,delay:rnd(0,600)}))},
  'ずれる':(el,a,c)=>{const cs=splitChars(el);const go=()=>cs.forEach(s=>s.style.transform=`translate(${rnd(-4,4)}px,${rnd(-11,11)}px) rotate(${rnd(-28,28)}deg)`);go();c.every(2400,go)},
  '大きく':el=>{const cs=splitChars(el),k=cs.length===1?0:Math.floor(rnd(0,cs.length));cs.forEach((s,i)=>{s.style.transform=i===k?'scale(2.6)':`scale(${rnd(.7,1.25)})`;if(i===k){s.style.color='#8B0000';s.style.margin='0 .6em'}});SFX.throb();vib(80)},
  '逃げる':el=>{splitChars(el).forEach(s=>{s.style.transform=`translate(${rnd(-220,220)}px,${rnd(-140,160)}px) rotate(${rnd(-90,90)}deg)`;s.style.opacity=.3})},
  '消える':async(el,a,c)=>{const cs=splitChars(el).sort(()=>Math.random()-.5);for(const s of cs){s.style.opacity=0;if(!await c.wait(110))return}},
  '増える':async(el,a,c)=>{const w=a.文||el.textContent;let iv=320;for(let i=0;i<46;i++){const s=document.createElement('span');s.textContent=w;s.style.cssText=`display:inline-block;font-size:${rnd(.75,1.7)}em;transform:rotate(${rnd(-8,8)}deg);color:rgba(${100+i*3},${20-i/3},${20-i/3},${rnd(.6,1)});margin:0 .1em`;el.appendChild(s);if(i%3===0)SFX.wet(.25);if(!await c.wait(iv))return;iv=Math.max(70,iv*.9)}},
  '書き換え':async(el,a,c)=>{const to=[...(a.後||'')],from=[...el.textContent],K='ぁあぃいぅうぇえぉおかがきぎくぐけげ死呪見ろ';el.textContent='';const sp=[];
    for(let i=0;i<Math.max(from.length,to.length);i++){const s=document.createElement('span');s.textContent=from[i]||'';el.appendChild(s);sp.push(s)}
    for(let i=0;i<sp.length;i++){for(let k=0;k<3;k++){sp[i].textContent=pick(K);sp[i].style.color='#9b0000';if(!await c.wait(45))return}sp[i].textContent=to[i]||'';SFX.tick(.15)}vib(40)},
  '書き足し':async(el,a,c)=>{const g=document.createElement('span');g.className='ghostw';el.after(g);for(const ch of a.文||''){if(!await c.wait(rnd(380,620)))return;g.textContent+=ch;SFX.key();vib(15)}},
  /* 何も起きないまま、いつのまにか文が変わっている */
  'すり替え':(el,a)=>{el.textContent=a.後||el.textContent},
  'にじむ':el=>{splitChars(el).forEach((s,i)=>setTimeout(()=>{s.classList.add('bleed');s.style.transform=`translateY(${rnd(3,14)}px) scaleY(${rnd(1.05,1.4)})`;s.style.filter=`blur(${rnd(.3,1.2)}px)`},i*90))}
};
D['狂']={run(el,a,c){c.wait((parseFloat(a.遅れ)||1.2)*1000).then(ok=>{if(ok&&OPS[a.args[0]])OPS[a.args[0]](el,a,c)})}};
D['塗る']={run(el,a,c){c.wait((parseFloat(a.遅れ)||1.5)*1000).then(ok=>{if(!ok)return;el.classList.add('redact');requestAnimationFrame(()=>el.classList.add('on'));SFX.crackle(1.2,.15)})}};
D['再読']={prep(el,a){if((S.visits[S.cur]||0)>1){el.textContent=a.後||el.textContent;el.classList.add('reread')}}};
D['名前']={async run(el,a,c){for(const s of page.querySelectorAll('.nm')){s.textContent=a.後||'あなた';s.classList.add('nm-x');SFX.crackle(.15,.3);vib(25);if(!await c.wait(420))return}}};
/* ===== シナリオ上書き：本文の一部を、上位の何者かがその場で書き換える =====
   私は王太子の申し出を［改変 後=受け入れた］断った［／改変］。
     カーソルが現れて「断った」を1文字ずつ消し、「受け入れた」と打ち直す。本文のデータは変えず、画面の上だけ
   後=… 書き換え後（空なら消えて、すき間が残る）／順=握りしめた｜捨てた … 何度も書き換え合う（反逆）／誤=ERROR … 打ち間違えてから直す
   隠密 … カーソルなしで、いつのまにか変わっている／ジジッ … 書き換える前に一瞬乱れる／遅れ=秒／速さ=2（速い）
   カーソル色=赤／終わり=戻す … 書き換えたあと、原文に戻す（読者だけが見た）
   待つ … すぐには書き換えず、あとの［改変開始］でまとめて書き換える
   演出なし・動きを減らす設定では、原文のまま（カーソルも乱れも出さない） */
INL.add('改変');
const OVCOL={赤:'#ff4d4d',青:'#5ab4ff',金:'#ffd25a',白:'#ffffff',黒:'#111'};
async function ovEdit(el,a,c){if(el._ov)return;el._ov=1;
  const orig=el.dataset.o??el.textContent,sp=Math.max(.3,parseFloat(a.速さ)||1),args=a.args||[];
  const seq=a.順?a.順.split('｜').map(s=>s.replace(/ /g,' ')):[(a.後??'').replace(/ /g,' ')];
  const back=a.終わり==='戻す',p=el.closest('p')||el;
  if(!await c.wait((parseFloat(a.遅れ)||0.8)*1000))return;
  /* 見えないところで書き換えても気づけないので、画面の中に入れる */
  const r=el.getBoundingClientRect(),pr=page.getBoundingClientRect();if(r.top<pr.top+40||r.bottom>pr.bottom-40)el.scrollIntoView({block:'center',behavior:'smooth'}),await c.wait(500);
  const gap=t=>t===''?'　　':t;
  if(args.includes('隠密')){const fin=gap(seq.at(-1));await el.animate([{opacity:1},{opacity:.35}],{duration:900,easing:'ease-in'}).finished;el.textContent=fin;el.animate([{opacity:.35},{opacity:1}],{duration:1400,easing:'ease-out'});
    if(back){if(!await c.wait(3000))return;await el.animate([{opacity:1},{opacity:.35}],{duration:900}).finished;el.textContent=orig;el.animate([{opacity:.35},{opacity:1}],{duration:1400})}return}
  if(args.includes('ジジッ')){p.animate([{transform:'none',filter:'none'},{transform:'translateX(-4px) skewX(-4deg)',filter:'drop-shadow(2px 0 #f0a) drop-shadow(-2px 0 #0ef)'},{transform:'translateX(3px)'},{transform:'none',filter:'none'}],{duration:300,iterations:2});SFX.crackle&&SFX.crackle(.12,.25);vib([20,30,20]);if(!await c.wait(700))return}
  el.textContent=orig;const t=el.firstChild||el.appendChild(document.createTextNode('')),cur=document.createElement('span');cur.className='ovcur';el.appendChild(cur);
  const colAt=i=>{const cs=(a.カーソル色||'').split('｜').filter(Boolean);if(cs.length)return OVCOL[cs[i%cs.length]]||cs[i%cs.length];return args.includes('反逆')?(i%2?'#ff4d4d':'#5ab4ff'):''};
  const del=async n=>{for(let k=0;k<n&&t.data.length;k++){t.data=t.data.slice(0,-1);if(k%2===0)SFX.key&&SFX.key();if(!await c.wait(75/sp))return false}return true};
  const type=async s=>{for(const ch of s){t.data+=ch;SFX.key&&SFX.key();if(!await c.wait((/[、。]/.test(ch)?260:120)/sp))return false}return true};
  /* 何も起きないまま、カーソルだけが点滅している時間 */
  cur.style.background=colAt(0);if(!await c.wait(1100/sp))return;
  for(let i=0;i<seq.length;i++){cur.style.background=colAt(i);if(i&&!await c.wait(900/sp))return;
    if(!await del(t.data.length))return;if(!await c.wait(350/sp))return;
    if(i===seq.length-1&&a.誤){if(!await type(a.誤))return;if(!await c.wait(600/sp))return;if(!await del(a.誤.length))return;if(!await c.wait(300/sp))return}
    if(!await type(seq[i]))return;if(seq[i]===''){t.data=gap('');}vib(15)}
  if(!await c.wait(700))return;cur.animate([{opacity:1},{opacity:0}],{duration:400}).finished.then(()=>cur.remove());
  if(back){if(!await c.wait(2400))return;el.textContent=orig;el.animate([{opacity:.4,filter:'blur(2px)'},{opacity:1,filter:'none'}],{duration:500})}}
D['改変']={prep(el){el.dataset.o=el.textContent},run(el,a,c){if((a.args||[]).includes('待つ'))return;if(RDM())return;return ovEdit(el,a,c)},still(){}};
/* ［改変開始］：それまでに「待つ」で置いておいた書き換えを、上から順に実行する */
D['改変開始']={async run(el,a,c){if(RDM())return;const list=[...page.querySelectorAll('.fxs[data-fx="改変"]')].filter(x=>!x._ov&&(x._a||{}).args&&x._a.args.includes('待つ')&&(x.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING));
  for(const x of list){if(c.dead)return;await ovEdit(x,{...x._a,args:x._a.args.concat((a.args||[]).includes('ジジッ')&&x===list[0]?['ジジッ']:[])},c)}}};
/* ノイズの中に、記憶のかけら（本当の過去の場面）が一瞬ぼんやり映る */
const MEMW=['廃病院に来てます','四〇四号室','湊','うしろ','ピ――――','おかえりなさい','がちゃ、がちゃ','同接 312'];
function memFlash(c,ms){
  const L=c.layer('mem');L.innerHTML=`<div class="mb" style="background-image:url(a/bg_${pick(['hall','ward','hall','mad'])}.jpg)"></div><div class="mw" style="left:${rnd(6,40)|0}%;top:${rnd(18,70)|0}%;font-size:${rnd(26,44)|0}px;transform:rotate(${rnd(-6,6)|0}deg)">${esc(pick(MEMW))}</div>`;
  c.wait(ms).then(()=>L.remove());
}
D['ノイズ']={async run(el,a,c){
  if(a.args[0]==='強'){const n=makeNoise(fxRoot,.45);c.on(n.stop);app.classList.add('glitch');SFX.crackle(2.4,.55);vib([40,40,40,40,80,40,120]);
    for(let i=0;i<6;i++){memFlash(c,rnd(90,180));if(!await c.wait(rnd(300,480)))break}
    await c.wait(200);n.stop();app.classList.remove('glitch');return}
  for(let i=0;i<3;i++){const n=makeNoise(fxRoot,.28);c.on(n.stop);app.classList.add('glitch');memFlash(c,120);SFX.crackle(.15,.45);vib(30);if(!await c.wait(150)){n.stop();return}n.stop();app.classList.remove('glitch');if(!await c.wait(rnd(350,700)))return}
}};
/* 精神がおかしくなっていく：文字が踊り、集まって別の言葉になり、最後は壊れる */
D['狂う']={async run(el,a,c){
  const chars=[...page.querySelectorAll('.tc')].filter(s=>s.textContent.trim()&&!s.closest('.blk'));
  if(!chars.length)return;
  drone(c,'狂');page.style.filter='url(#warp)';const disp=$('disp'),turb=$('turb'),t0=performance.now();
  c.raf(t=>{const e=(t-t0)/1000;disp.setAttribute('scale',Math.min(12,e*1.1).toFixed(2));turb.setAttribute('baseFrequency',`${(.012+Math.sin(e*.7)*.004).toFixed(4)} ${(.035+Math.cos(e*.5)*.01).toFixed(4)}`)});
  const hue=stage.animate([{filter:'hue-rotate(0deg) saturate(1)'},{filter:'hue-rotate(-40deg) saturate(1.8) contrast(1.1)'}],{duration:4500,iterations:Infinity,direction:'alternate'});c.on(()=>hue.cancel());
  let beat=true;(async()=>{let iv=1050;while(!c.dead&&beat){SFX.thump(.7);vib(40);pulse(.6);if(!await c.wait(iv))return;iv=Math.max(360,iv*.9)}})();
  chars.forEach(s=>{s.style.display='inline-block';s.style.transition='transform 1.3s cubic-bezier(.3,.1,.3,1),color 1s'});
  /* ふわっと浮いて、止まる */
  for(let k=0;k<4;k++){chars.forEach(s=>{if(Math.random()<.16)s.style.transform=`translate(${rnd(-3,3)}px,${rnd(-10,-2)}px)`});SFX.crackle(.05,.12);if(!await c.wait(1000))return;chars.forEach(s=>{if(Math.random()<.5)s.style.transform=''});if(!await c.wait(500))return}
  /* 反対を向く、回る、散らばる */
  $('silw').classList.add('shiver');vigEl.style.transition='opacity 3s';vigEl.style.opacity=.55;c.on(()=>{vigEl.style.transition='';vigEl.style.opacity=''});
  for(let k=0;k<6;k++){
    chars.forEach(s=>{const r=Math.random();
      if(r<.07)s.style.transform='scaleX(-1)';else if(r<.12)s.style.transform='rotate(180deg)';
      else if(r<.16)s.animate([{transform:'rotate(0)'},{transform:'rotate(360deg)'}],{duration:rnd(600,1400),iterations:3});
      else if(r<.24)s.style.transform=`translate(${rnd(-16,16)}px,${rnd(-16,16)}px) rotate(${rnd(-45,45)}deg)`;
      if(Math.random()<.04)s.style.color='#ff3b3b'});
    SFX.crackle(.12,.25);vib(30);if(!await c.wait(750))return}
  /* 音がぴたっと止まって、止まる */
  beat=false;if(A.bus)try{A.bus.gain.setTargetAtTime(.0001,A.ctx.currentTime,.03)}catch(e){}
  chars.forEach(s=>{s.style.transition='none'});if(!await c.wait(1300))return;
  if(A.bus)try{A.bus.gain.setTargetAtTime(1,A.ctx.currentTime,.02)}catch(e){}
  /* 地の文の中の文字が抜け出して、集まって、別の言葉になる */
  const word=[...(a.集まる||'もうかえれない')],used=new Set();
  const picks=word.map(ch=>{const cand=chars.filter(s=>s.textContent===ch&&!used.has(s));const s=cand.length?pick(cand):null;if(s)used.add(s);return s});
  const L=c.layer(),lr=L.getBoundingClientRect(),W=lr.width,H=lr.height,fs=Math.min(48,(W-40)/word.length),x0=(W-fs*word.length)/2,y0=H*.4;
  page.style.transition='opacity 2s';page.style.opacity=.3;SFX.throb();
  const gs=picks.map((s,i)=>{const r=s?s.getBoundingClientRect():{left:rnd(0,W),top:H+20};
    const d=document.createElement('div');d.className='gath';d.textContent=word[i];d.style.left=(r.left-lr.left)+'px';d.style.top=(r.top-lr.top)+'px';L.appendChild(d);if(s)s.style.visibility='hidden';
    d.animate([{transform:'translate(0,0) scale(1)',color:'#eee'},{transform:`translate(${x0+i*fs-(r.left-lr.left)}px,${y0-(r.top-lr.top)}px) scale(${fs/16.5})`,color:'#ff2020'}],{duration:1500,delay:i*280,easing:'cubic-bezier(.6,0,.2,1)',fill:'forwards'});
    c.wait(i*280+1450).then(ok=>ok&&SFX.wet(.45));return d});
  if(!await c.wait(word.length*280+1700))return;
  SFX.bang(1);vib(320);shake(8,400);flash('rgba(120,0,0,.45)',600);
  if(!await c.wait(1800))return;
  /* 言葉が崩れて、地の文はもう読めないくらい壊れる */
  const n=makeNoise(fxRoot,.4);app.classList.add('glitch');SFX.crackle(1.4,.55);vib([60,30,60,30,200]);
  gs.forEach(d=>d.animate([{opacity:1},{opacity:0,transform:`translate(${rnd(-200,200)}px,${rnd(-300,300)}px) rotate(${rnd(-360,360)}deg) scale(4)`}],{duration:900,fill:'forwards',composite:'add'}));
  page.style.opacity='';
  const BAD=[...'▓▒░█■死見湊ろけたうしろ'];
  chars.forEach(s=>{s.style.visibility='';s.style.transition='transform .6s,color .6s';
    s.style.transform=`translate(${rnd(-70,70)}px,${rnd(-50,50)}px) rotate(${rnd(-180,180)}deg) scale(${rnd(.6,2.4)})`;
    if(Math.random()<.4)s.textContent=pick(BAD);if(Math.random()<.35)s.style.color=pick(['#ff2a2a','#8a0000','#fff']);s.style.opacity=rnd(.4,1)});
  c.every(170,()=>{for(let k=0;k<24;k++){const s=pick(chars);s.style.transform=`translate(${rnd(-80,80)}px,${rnd(-60,60)}px) rotate(${rnd(-200,200)}deg) scale(${rnd(.5,2.6)})`;if(Math.random()<.3)s.textContent=pick(BAD)}});
  if(!await c.wait(1300)){n.stop();return}n.stop();app.classList.remove('glitch');
}};
D['頭痛']={async run(el,a,c){
  silShake(1900);
  for(let i=0;i<2;i++){SFX.throb();vib([220,80]);stage.animate([{filter:'blur(0) brightness(1)'},{filter:'blur(2.5px) brightness(.75)',offset:.3},{filter:'blur(0) brightness(1)'}],{duration:900});
    vigEl.animate([{opacity:0},{opacity:.85,offset:.3},{opacity:0}],{duration:900});if(!await c.wait(950))return}
}};
const CM={
  '過去':['きたー','こわ','ガチの廃病院じゃん','音やば','はよ入れ','今北','電気ついてね？','後ろなんかいた？','888','湊くん今日もがんばれ'],
  '過去2':['それカルテ？','名前www','仕込みだろ','草','湊って書いてない？','こわ','逃げろ','ガチ？','やらせ乙'],
  '笑い':['www','逃げてて草','うしろ','うしろうしろ','転べ','来てる来てる','ざまぁ','草','うしろ','wwwww'],
  '起きた':['起きた','おはよう','起きた！？','湊くん','見えてる？','一年ぶり','おかえり','思い出して','ねえ','起きた起きた'],
  '見てる':['見てる','みてる','あなたのことだよ','ずっと見てる','画面のまえのあなた','次','あなたも','見てる','そこにいるね','つぎは、あなた'],
  '異世界':['すげえ','本物？','CGだろ','剣かっこいい','ハルくん！','スライムかわいい','888','後ろにゴブリン','どこのロケ？','がんばれ'],
  '応援':['がんばれ！','888','すごい','神回','おつ','きたー','かわいい','うまい','もう一回','ナイス']
};
const CMN=['名無し','ゆう','404','shiro','k','通りすがり','みてる人','nanashi','あお'];
/* 配信の画面：LIVE・同接・配信時間。［配信 おかしい］で、だんだん様子がおかしくなる（ホラー向け） */
D['配信']={run(el,a,c){
  const odd=a.args.includes('おかしい');
  const L=c.layer('live');let vw=+a.同接||0;
  const tp=(a.時間||'0:00:00').split(':').map(Number);let sec=tp[0]*3600+tp[1]*60+(tp[2]||0);
  const hms=s=>{s=Math.max(0,s);return`${s/3600|0}:${String((s/60|0)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
  const cn=(p)=>`<div class="cn" style="${p}"></div>`;
  L.innerHTML=`<div class="scan"></div><div class="tl"><span class="bd">● LIVE</span><span class="vw"></span></div><div class="tm"></div><div class="rec">● REC</div>`+
    cn('left:8px;bottom:62px;border-right:0;border-top:0')+cn('right:8px;bottom:62px;border-left:0;border-top:0');
  const V=L.querySelector('.vw'),T=L.querySelector('.tm');
  const show=()=>{V.textContent='同接 '+(typeof vw==='number'?vw.toLocaleString():vw);T.textContent=typeof sec==='number'?hms(sec):sec};show();
  page.style.paddingTop='52px';c.on(()=>{page.style.paddingTop=''});
  if(odd){const n=makeNoise(fxRoot,.05);c.on(n.stop)}else L.querySelector('.scan').style.opacity=.35;
  const t0=performance.now();
  c.every(1000,()=>{
    const e=(performance.now()-t0)/1000;
    if(typeof vw!=='number')vw=a.同接==='0'?1:312;
    if(typeof sec!=='number')sec=tp[0]*3600+tp[1]*60+(tp[2]||0)+(e|0);
    vw=Math.max(0,vw+Math.round(rnd(-3,9)));sec+=odd&&Math.random()<.12&&e>6?-3:1;
    if(!odd){show();return}
    if(e>6&&Math.random()<.18){vw=pick([3333,0,404,1,33333,'■■■']);SFX.crackle(.06,.2)}
    if(e>10&&Math.random()<.1)sec=pick(['3:33:33','--:--:--','0:00:00']);
    show();
  });
}};
const ODD=['うしろにいるよ','おかえり','みなとくん','みなとくん','ここだよ','もうすぐ','かえれないよ','みてるよ'];
const cmHtml=(name,t)=>`<i style="background:hsl(${rnd(0,360)|0} 45% 55%)"></i><span class="n">${esc(name)}</span><span>${esc(t)}</span>`;
const BUGCH='▓▒░█■□◆◇※＃？！';
const bugText=s=>[...s].map(ch=>Math.random()<.45?pick([...BUGCH]):ch).join('')+(Math.random()<.3?'ｗ'.repeat(rnd(3,12)|0):'');
D['コメント']={run(el,a,c){
  const set=CM[a.args[0]]||CM['過去'],watch=a.args[0]==='見てる',L=c.layer();c.cmLayers=(c.cmLayers||[]).concat(L);
  L.innerHTML='<div class="cmcol l"></div><div class="cmcol r"></div>';const cols=[...L.children];
  let cnt=0;const odd=a.args.includes('変な人');
  const add=()=>{if(c.halt)return;const col=pick(cols),b=document.createElement('div');b.className='cmb';cnt++;
    /* 1人だけ、周りと関係なく同じようなことを書き続ける人がいる */
    if(odd&&cnt>3&&cnt%4===0){b.classList.add('odd');b.innerHTML=cmHtml(pick(['■■■','み■と','■な■','■■と']),pick(ODD))}
    else b.innerHTML=cmHtml(watch?'あなた':pick(CMN),pick(set));
    col.appendChild(b);while(col.children.length>9)col.firstChild.remove()};
  /* 止めるとき：コメントがぜんぶ一瞬で消える */
  c.cmStop=()=>{if(c.halt)return;c.halt=true;app.classList.remove('glitch');(c.cmLayers||[]).forEach(l=>l.animate([{opacity:1},{opacity:0}],{duration:120,fill:'forwards'}));if(c.cmNoise)c.cmNoise.stop()};
  (async()=>{let iv=watch?900:rnd(800,1200);while(!c.dead&&!c.halt){add();if(!await c.wait(iv))return;iv=watch?Math.max(260,iv*.92):rnd(650,1300)}})();
  if(a.埋め尽くす)c.wait(parseFloat(a.埋め尽くす)*1000).then(ok=>ok&&!c.halt&&cmFlood(c,set,watch));
}};
/* 画面を埋め尽くして、バグっていく */
function cmFlood(c,set,watch){
  const L=c.layer('flood');c.cmLayers.push(L);let n=0,iv=150;
  (async()=>{while(!c.dead&&!c.halt){
    const b=document.createElement('div');b.className='cmb';
    const bug=n>70&&Math.random()<Math.min(.75,(n-70)/160);
    b.innerHTML=cmHtml(watch?'あなた':pick(CMN),bug?bugText(pick(set)):pick(set));
    b.style.left=rnd(-12,72)+'%';b.style.top=rnd(-2,94)+'%';b.style.transform=`rotate(${rnd(-5,5).toFixed(1)}deg) scale(${rnd(.85,1.6).toFixed(2)})`;
    if(n>35&&Math.random()<Math.min(.5,n/300))b.classList.add('red');
    L.appendChild(b);n++;if(L.children.length>240)L.firstChild.remove();
    if(n%5===0)SFX.pop();
    if(n===90){L.classList.add('bug');app.classList.add('glitch');c.cmNoise=makeNoise(fxRoot,.12);c.on(c.cmNoise.stop);SFX.crackle(1.2,.4);vib([60,30,60,30,120])}
    if(n>90&&n%12===0){SFX.crackle(.25,.45);vib(25);if(Math.random()<.4)shake(4,200)}
    if(!await c.wait(iv))return;iv=Math.max(14,iv*.965);
  }})();
}
function coins(c,n=90){
  const L=c.layer(),cv=document.createElement('canvas'),dpr=Math.min(2,devicePixelRatio||1);L.appendChild(cv);
  const W=L.clientWidth,H=L.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.cssText='width:100%;height:100%';
  const x=cv.getContext('2d');x.scale(dpr,dpr);const P=[];let spawned=0,last=performance.now(),acc=0;
  c.raf(t=>{const dt=Math.min(.04,(t-last)/1000);last=t;acc+=dt;
    while(spawned<n&&acc>.02){acc-=.02;spawned++;P.push({x:rnd(10,W-10),y:rnd(-60,-14),vx:rnd(-30,30),vy:rnd(120,360),r:rnd(9,14),ph:rnd(0,6),sp:rnd(6,14)});if(spawned%3===0)SFX.coin()}
    x.clearRect(0,0,W,H);
    for(const p of P){p.vy+=900*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.ph+=p.sp*dt;if(p.y>H+30)continue;
      const sx=Math.abs(Math.cos(p.ph));x.save();x.translate(p.x,p.y);x.scale(Math.max(.12,sx),1);
      const g=x.createRadialGradient(-p.r*.3,-p.r*.3,1,0,0,p.r);g.addColorStop(0,'#FFF4B8');g.addColorStop(.5,'#E8B42A');g.addColorStop(1,'#9A6A0A');
      x.fillStyle=g;x.beginPath();x.arc(0,0,p.r,0,7);x.fill();x.strokeStyle='rgba(120,80,0,.8)';x.lineWidth=1.2;x.beginPath();x.arc(0,0,p.r*.72,0,7);x.stroke();
      if(sx>.5){x.fillStyle='rgba(110,70,0,.85)';x.font=`700 ${p.r}px sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText('¥',0,1)}x.restore()}
    if(spawned>=n&&P.every(p=>p.y>H+30))return false;
  });
}
D['投げ銭']={async run(el,a,c){
  /* まず、スマホの通知みたいに上から降りてくる */
  const N=c.layer();N.innerHTML=`<div class="ntf"><i>●</i><div><b>LIVE ・ いま</b>${esc(a.名||'名無し')} さんが ￥${esc(a.金額||'10,000')} を送りました<br>「${esc(a.文||'')}」</div></div>`;
  const nt=N.firstChild;SFX.notif();vib([30,60,30]);
  nt.animate([{transform:'translateY(-130%)'},{transform:'translateY(0)'}],{duration:450,easing:'cubic-bezier(.2,.9,.3,1.2)',fill:'forwards'});
  c.wait(3800).then(ok=>ok&&nt.animate([{transform:'translateY(0)'},{transform:'translateY(-130%)'}],{duration:400,fill:'forwards'}));
  if(!await c.wait(900))return;
  /* コメント欄の上に固定 */
  const P=c.layer();P.innerHTML=`<div class="pin"><small>${esc(a.名||'名無し')}　￥${esc(a.金額||'10,000')}</small>${esc(a.文||'')}</div>`;
  P.firstChild.animate([{opacity:0},{opacity:1}],{duration:500});
  const L=c.layer();L.innerHTML=`<div class="sc"><div class="sy">SYSTEM ／ 投げ銭が届きました</div><div class="tp"><span class="av"></span><div><div class="nmn">${esc(a.名||'名無し')}</div><div class="am">￥${esc(a.金額||'10,000')}</div></div></div><div class="ms">${esc(a.文||'')}</div></div>`;
  const sc=L.firstChild;sc.animate([{transform:'translate(-50%,-50%) scale(.6)',opacity:0},{transform:'translate(-50%,-50%) scale(1.06)',opacity:1,offset:.6},{transform:'translate(-50%,-50%) scale(1)'}],{duration:520,easing:'ease-out'});
  SFX.notif();vib([80,40,80]);if(a.args.includes('コイン'))coins(c);
  c.wait(5200).then(ok=>ok&&sc.animate([{opacity:1},{opacity:0}],{duration:800,fill:'forwards'}));
  await c.wait(2400);
}};
D['コイン']={run(el,a,c){coins(c)}};
function analogSVG(){
  let s='<svg viewBox="-110 -110 220 220" class="clk-a"><circle r="104" fill="#F2EAD8" stroke="#2A221C" stroke-width="5"/><circle r="96" fill="none" stroke="#C9BCA3"/>';
  for(let i=0;i<60;i++){const a=i*Math.PI/30,l=i%5?6:12;s+=`<line x1="${(Math.sin(a)*(92-l)).toFixed(1)}" y1="${(-Math.cos(a)*(92-l)).toFixed(1)}" x2="${(Math.sin(a)*92).toFixed(1)}" y2="${(-Math.cos(a)*92).toFixed(1)}" stroke="#2A221C" stroke-width="${i%5?1.2:3}"/>`}
  [12,3,6,9].forEach((n,i)=>{const a=i*Math.PI/2;s+=`<text x="${(Math.sin(a)*66).toFixed(1)}" y="${(-Math.cos(a)*66+8).toFixed(1)}" text-anchor="middle" font-family="Shippori Mincho" font-size="22" fill="#2A221C">${n}</text>`});
  return s+'<line class="h" y1="10" y2="-50" stroke="#2A221C" stroke-width="6" stroke-linecap="round"/><line class="m" y1="12" y2="-80" stroke="#2A221C" stroke-width="4" stroke-linecap="round"/><line class="s" y1="16" y2="-86" stroke="#A11" stroke-width="1.6"/><circle r="5" fill="#2A221C"/></svg>';
}
const f2=(mm,ss)=>`${String(mm/60|0).padStart(2,'0')}:${String(mm%60).padStart(2,'0')}<small>${ss}</small>`;
const CLKG=['03:33','33:33','0?:3?','--:--','44:44','03:33','00:00','03:33'];
/* 同じデジタル時計の数字が逆に戻る。どんどん速く、00:00 まで */
async function clockRewind(c,d,end){
  SFX.rewind(4.2);vib([60,60,60,60,60,60,60,60,200]);
  let mm=end,iv2=260;const t0=performance.now();
  while(mm>0){
    mm=Math.max(0,mm-Math.max(1,Math.round((260-iv2)/14)));
    d.innerHTML=Math.random()<.12?pick(CLKG):f2(mm,String(rnd(0,59)|0).padStart(2,'0'));
    d.style.color=Math.random()<.1?'#fff':'';SFX.tick(.14);
    vigEl.style.opacity=Math.min(.85,(performance.now()-t0)/5000);
    if(!await c.wait(iv2)){vigEl.style.opacity='';return}iv2=Math.max(16,iv2*.9);
  }
  d.innerHTML=f2(0,'00');d.style.color='#fff';vigEl.style.opacity='';flash('#fff',500,.85);await c.wait(700);
}
D['時計']={async run(el,a,c){
  if(a.args.includes('戻る')&&c.clkD)return clockRewind(c,c.clkD.d,c.clkD.end);
  if(c.clk){const o=c.clk;o.animate([{opacity:1},{opacity:0}],{duration:400,fill:'forwards'}).finished.then(()=>o.remove())}
  const L=c.layer();c.clk=L;
  if(a.args.includes('デジタル')){
    const p=(a.開始||'02:58').split(':').map(Number),q=(a.止まる||'03:33').split(':').map(Number);let m=p[0]*60+p[1];const end=q[0]*60+q[1];
    L.innerHTML='<div class="clk-d"></div>';const d=L.firstChild,f=(mm,ss)=>`${String(mm/60|0).padStart(2,'0')}:${String(mm%60).padStart(2,'0')}<small>${ss}</small>`;
    /* 部屋の暗がりから、ぼんやり浮かび上がってくる */
    d.innerHTML=f(m,'00');
    await d.animate([{opacity:0,filter:'blur(14px)',transform:'translate(-50%,-50%) scale(.8)'},{opacity:.35,filter:'blur(6px)',transform:'translate(-50%,-50%) scale(.9)',offset:.6},{opacity:1,filter:'blur(0)',transform:'translate(-50%,-50%)'}],{duration:3000,easing:'ease-in'}).finished.catch(()=>{});
    c.stopTick=true;if(c.dead)return;
    let iv=260;while(m<end){d.innerHTML=f(m,String(rnd(0,59)|0).padStart(2,'0'));SFX.tick(.25);if(!await c.wait(iv))return;m++;iv=Math.max(90,iv*.94)}
    d.innerHTML=f(end,'33');SFX.alarm();vib([100,60,100,60,100]);if(!await c.wait(900))return;
    const G=['03:33','33:33','0?:3?','--:--','44:44','03:33','00:00','03:33'];
    for(let i=0;i<20;i++){d.innerHTML=pick(G);d.style.color=i%2?'#fff':'#FF3B3B';if(i%4===0)SFX.crackle(.08,.3);if(!await c.wait(80))return}
    d.innerHTML=f(end,'33');d.style.color='';c.clkD={d,end};await c.wait(600);return;
  }
  L.innerHTML=analogSVG();const svg=L.firstChild,H=svg.querySelector('.h'),M=svg.querySelector('.m'),Sx=svg.querySelector('.s');
  let mins=3*60+33,sec=0;const set=()=>{H.setAttribute('transform',`rotate(${(mins/720)*360})`);M.setAttribute('transform',`rotate(${(mins%60)*6})`);Sx.setAttribute('transform',`rotate(${sec*6})`)};set();
  svg.animate([{opacity:0},{opacity:1}],{duration:500});
  for(let i=0;i<4;i++){if(!await c.wait(1000))return;sec++;set();SFX.tick(.4)}
  if(!await c.wait(900))return;
  SFX.rewind(3.6);vib([60,60,60,60,60,60,60,60,200]);
  const t0=performance.now();let last=t0,tk=0;
  await new Promise(res=>c.raf(t=>{const el2=(t-t0)/1000,dt=(t-last)/1000;last=t;const rate=25*Math.exp(el2*1.25);mins-=rate*dt;sec=(sec-rate*dt*60*.02+60)%60;set();
    tk+=rate*dt;if(tk>4){tk=0;SFX.tick(.18)}vigEl.style.opacity=Math.min(.8,el2/4);if(el2>3.6){vigEl.style.opacity='';res();return false}}));
  flash('#fff',500,.85);
}};
/* 秒針の音：だんだん大きくなる（時計が出てくる前ぶれ） */
D['秒針']={run(el,a,c){let v=.06;c.every(1000,()=>{if(c.stopTick)return;SFX.tick(v);v=Math.min(.5,v+.025);if(v>.3)vib(6)})}};
D['巻き戻し']={async run(el,a,c){if(await c.wait(400))rewindTo((parseInt(a.args[0])||1)-1)}};
D['変な世界']={run(el,a,c){
  page.classList.add('mad');page.style.filter='url(#warp)';const disp=$('disp'),turb=$('turb');drone(c,'狂');
  const t0=performance.now();
  c.raf(t=>{const e=(t-t0)/1000;disp.setAttribute('scale',Math.min(9,e*3).toFixed(2));turb.setAttribute('baseFrequency',`${(.012+Math.sin(e*.7)*.004).toFixed(4)} ${(.035+Math.cos(e*.5)*.01).toFixed(4)}`)});
  const an=stage.animate([{filter:'hue-rotate(0deg) saturate(1)'},{filter:'hue-rotate(-35deg) saturate(1.7) contrast(1.08)'},{filter:'hue-rotate(25deg) saturate(.6)'}],{duration:7000,iterations:Infinity,direction:'alternate'});
  c.every(4000,()=>{if(Math.random()<.6){vib(40);SFX.crackle(.1,.2)}});
  c.on(()=>{an.cancel();page.style.filter='';disp.setAttribute('scale','0');page.classList.remove('mad')});
}};
D['涙']={run(el,a,c){
  if(a.args.includes('血に')){c.tearBlood=true;if(c.tearL)c.tearL.querySelectorAll('.blot').forEach(b=>b.classList.add('b'));SFX.throb();return}
  const L=c.layer();c.tearL=L;
  (async()=>{while(!c.dead){tearDrop(c,L);if(!await c.wait(c.tearBlood?rnd(350,800):rnd(700,1400)))return}})();
}};
/* 血：［血］で全部（垂れる・落ちる・たまる）、［血 少し］で細い垂れと、ときどき落ちるしずく */
D['血']={run(el,a,c){
  if(a.args.includes('少し')){bloodRain(c,{falls:2,narrow:true,drops:[1600,3200],pool:false});return}
  const L=bloodRain(c,{falls:5,drops:[500,1100]});
  c.wait(3500).then(ok=>{if(!ok)return;const s=img('splat');s.style.cssText=`left:8%;bottom:4%;width:84%;opacity:0`;L.appendChild(s);SFX.wet(.8);vib([40,30,80]);
    s.animate([{opacity:0,transform:'scale(.6)'},{opacity:.9,transform:'scale(1.04)',offset:.25},{opacity:.85,transform:'scale(1)'}],{duration:900,fill:'forwards',easing:'ease-out'})});
}};
D['予兆']={run(el,a,c){bloodRain(c,{falls:3,narrow:true,drops:[2200,4200],pool:false})}};
D['真っ赤']={run(el,a,c){
  const L=c.layer();L.style.background='#8B0000';L.style.mixBlendMode='multiply';drone(c,'赤');vib(400);
  L.animate([{opacity:0},{opacity:.65}],{duration:3000,fill:'forwards'}).finished.then(()=>{if(!c.dead)L.animate([{opacity:.65},{opacity:.8},{opacity:.65}],{duration:1100,iterations:Infinity})}).catch(()=>{});
}};
/* 手形：ぺたっ → 垂れた跡が下へのびる */
D['手形']={run(el,a,c){
  const L=c.layer(),n=+a.数||6;
  (async()=>{for(let i=0;i<n;i++){if(!await c.wait(i?rnd(450,900):200))return;
    const left=Math.random()<.5,h=img(left?'hand_l':'hand_r'),w=rnd(100,160),rot=rnd(-28,28),flip=Math.random()<.3?' scaleX(-1)':'';
    h.style.cssText=`left:${rnd(-4,70)}%;top:${rnd(2,58)}%;width:${w}px`;L.appendChild(h);
    const tf=`rotate(${rot}deg)${flip}`;
    h.animate([{transform:tf+' scale(1.14)',opacity:0,filter:'blur(2px) saturate(1.15) brightness(1.15)'},{transform:tf+' scale(1)',opacity:.95,filter:'blur(0) saturate(1.15) brightness(1.15)'}],{duration:130,easing:'ease-out',fill:'forwards'});
    h.animate([{clipPath:'inset(0 0 58% 0)'},{clipPath:'inset(0 0 40% 0)',offset:.08},{clipPath:'inset(0 0 0 0)'}],{duration:rnd(2600,4200),easing:'cubic-bezier(.3,.6,.4,1)',fill:'forwards'});
    SFX.wet(.7);SFX.bang(.25);vib(35);if(i===n-1)shake(4,250)}})();
}};
/* 足跡：奥から手前へ、ぺた、ぺた、と近づいてくる */
D['足跡']={run(el,a,c){
  /* ふらふら蛇行しながら近づく。歩幅も向きもばらばら。ときどき立ち止まる。かすれた跡・半分の跡もまじる */
  const L=c.layer(),n=+a.数||12,W=L.clientWidth;
  (async()=>{let iv=650,cx=W*rnd(.35,.65),dir=rnd(-.5,.5);
    for(let i=0;i<n;i++){
      if(!await c.wait(iv+(Math.random()<.18?rnd(700,1400):0)))return;iv=Math.max(360,iv*rnd(.88,1.02));
      const t=i/(n-1),left=i%2===0,w=(22+t*60)*rnd(.9,1.1);
      dir+=rnd(-.35,.35);dir=Math.max(-.7,Math.min(.7,dir));cx+=Math.sin(dir)*w*.8;cx=Math.max(w,Math.min(W-w,cx));
      const side=(left?-1:1)*w*rnd(.35,.6),ang=dir*45+(left?-6:6)+rnd(-8,8),f=img(left?'foot_l':'foot_r');
      const kind=Math.random(),op=kind<.15?rnd(.3,.5):rnd(.75,.95),clip=kind>.85?`inset(${Math.random()<.5?'0 0 45% 0':'40% 0 0 0'})`:'none';
      f.style.cssText=`left:${(cx+side*Math.cos(dir)-w/2).toFixed(0)}px;top:${(6+t*66+rnd(-1.5,1.5)).toFixed(1)}%;width:${w.toFixed(0)}px;opacity:0;clip-path:${clip}`;
      L.appendChild(f);f.animate([{opacity:0,transform:`rotate(${ang}deg) scale(1.1)`},{opacity:op,transform:`rotate(${ang}deg) scale(1)`}],{duration:140,fill:'forwards'});
      SFX.wet(.2+t*.6);vib(10+t*40)}})();
}};
D['足音']={run(el,a,c){
  const k=a.args[0]||'遠く';
  (async()=>{if(k==='遠く'){for(let i=0;i<5;i++){SFX.step(.12+i*.02);if(!await c.wait(620))return}return}
    let iv=600,v=.1;for(let i=0;i<12;i++){SFX.step(v);if(i>7)vib(20);if(!await c.wait(iv))return;iv=Math.max(260,iv*.9);v=Math.min(1,v+.08)}})();
}};
D['扉']={async run(el,a,c){SFX.slam();vib(260);shake(9,500);flash('rgba(0,0,0,.6)',400,.8);await c.wait(700)}};
D['がちゃがちゃ']={async run(el,a,c){SFX.rattle(1.6);vib([30,40,30,40,30,40,30,40,30]);for(let i=0;i<5;i++){shake(2.5,250);if(!await c.wait(320))return}}};
D['どんどん']={async run(el,a,c){const n=+a.回数||4;for(let i=0;i<n;i++){SFX.bang(1);vib(110);shake(10,380);flash('rgba(110,0,0,.35)',300);if(!await c.wait(Math.max(300,520-i*60)))return}}};
/* ガラスのヒビ：叩いた1点から放射状のヒビ＋蜘蛛の巣の輪。叩くたびに育つ */
function glassGeo(W,H){
  const x=W*.5,y=H*.42,R=Math.hypot(W,H),n=16,rays=[];
  for(let i=0;i<n;i++){
    let ang=(i+rnd(-.3,.3))/n*Math.PI*2,r=0,px=x,py=y;const pts=[{x,y,r:0}];
    while(r<R){const s=rnd(12,30);ang+=rnd(-.09,.09);px+=Math.cos(ang)*s;py+=Math.sin(ang)*s;r+=s;pts.push({x:px,y:py,r})}
    /* 途中から枝分かれするヒビ */
    const br=[];for(let k=0;k<3;k++){const r0=rnd(30,R*.5),p0=null;br.push({r0,ang:ang+(Math.random()<.5?1:-1)*rnd(.3,.7),len:rnd(30,120),seed:Math.random()})}
    rays.push({pts,reach:rnd(.55,1),br});
  }
  const rings=[];[22,48,85,135,200,290,400].forEach((rr,k)=>{for(let i=0;i<n;i++)if(Math.random()<.85-k*.08)rings.push({i,r:rr*rnd(.85,1.15),r2:rr*rnd(.85,1.15),bend:rnd(-6,6)})});
  const chips=[];for(let k=0;k<60;k++){const a=rnd(0,7),r=rnd(2,34);chips.push({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,a:rnd(0,7),l:rnd(3,12)})}
  return{x,y,R,rays,rings,chips,n};
}
function rayAt(ray,r){const p=ray.pts;for(let i=1;i<p.length;i++)if(p[i].r>=r){const a=p[i-1],b=p[i],t=(r-a.r)/(b.r-a.r||1);return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}}return p[p.length-1]}
/* ガラス：もらったヒビの画像を、叩くたびに一段ずつ重ねていく。向こう側には血の手形 */
const CRACK={crack1:[.531,.4186],crack2:[.526,.4077],crack3:[.5195,.4303],crack4:[.5246,.4244]};
['crack1','crack2','crack3','crack4','shards','sparkle','hands_glass'].forEach(v=>{const i=new Image();i.src=`a/${v}.webp`});
D['ガラス']={async run(el,a,c){
  c.cmStop&&c.cmStop();
  const L=c.layer(),W=L.clientWidth,H=L.clientHeight,G=glassGeo(W,H);c.glass={G,L};
  const iw=W*1.3,ih=iw*1279/720;
  const put=(k,op=0)=>{const i=document.createElement('img');i.src=`a/${k}.webp`;i.alt='';const[cx,cy]=CRACK[k];
    i.style.cssText=`position:absolute;width:${iw}px;height:${ih}px;left:${G.x-cx*iw}px;top:${G.y-cy*ih}px;opacity:${op};transform-origin:${cx*100}% ${cy*100}%`;L.appendChild(i);return i};
  /* 向こう側から押し付けられる手形（ヒビより奥） */
  const hw=W*.95,hands=document.createElement('img');hands.src='a/hands_glass.webp';hands.alt='';
  hands.style.cssText=`position:absolute;width:${hw}px;left:${G.x-hw/2}px;top:${G.y-hw*1003/560*.42}px;opacity:0;filter:brightness(.8) blur(.4px);clip-path:inset(0 0 60% 0)`;L.appendChild(hands);
  const cr=['crack1','crack2','crack3'].map(k=>put(k)),c4=put('crack4');
  /* 割れる前に、「演出」のスイッチが勝手に切れて、また入る */
  const sw=$('fxSw');sw.checked=false;SFX.tick(.4);if(!await c.wait(900))return;sw.checked=true;SFX.tick(.4);if(!await c.wait(700))return;
  const hit=(big)=>{SFX.bang(big?1:.85);SFX.knock(big?.9:.7);SFX.crack();shake(big?11:7,big?420:220);vib(big?170:70);flash(big?'rgba(0,0,0,.55)':'rgba(0,0,0,.3)',big?300:160)};
  /* だん、……だん、……だん */
  for(let i=0;i<3;i++){
    if(!await c.wait(1300))return;hit(true);
    cr[i].style.opacity=1;cr[i].animate([{transform:'scale(1.05)',filter:'brightness(2)'},{transform:'scale(1)',filter:'brightness(1)'}],{duration:220,easing:'ease-out'});
    hands.style.transition='opacity .12s,clip-path 2.5s ease-out';hands.style.opacity=[.35,.6,.85][i];hands.style.clipPath=`inset(0 0 ${[45,25,0][i]}% 0)`;
    hands.animate([{transform:'scale(1.03)'},{transform:'scale(1)'}],{duration:180});
  }
  if(!await c.wait(1100))return;
  /* どんどんどんどん！ */
  for(let i=0;i<9;i++){hit(false);c4.style.opacity=((i+1)/9).toFixed(2);c4.animate([{filter:'brightness(1.8)'},{filter:'brightness(1)'}],{duration:150});
    hands.style.opacity=Math.min(1,.85+i*.02);if(!await c.wait(rnd(170,230)))return}
  /* ぴたっと止まる */
  if(A.bus)try{A.bus.gain.setTargetAtTime(.0001,A.ctx.currentTime,.03)}catch(e){}
  await c.wait(1700);
  if(A.bus)try{A.bus.gain.setTargetAtTime(1,A.ctx.currentTime,.01)}catch(e){}
}};
/* バリンッ：ヒビごと破片になって手前に飛ぶ → 大きな破片が迫る → キラキラが舞って暗くなる */
D['割れる']={async run(el,a,c){
  const W=fxRoot.clientWidth,H=fxRoot.clientHeight,gl=c.glass,G=gl?gl.G:glassGeo(W,H);
  const L=c.layer('shards');L.style.background='#000';
  const base=app.cloneNode(true);base.removeAttribute('id');base.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
  const crackClone=gl?gl.L.cloneNode(true):null;
  const bands=[0,48,135,290,G.R*1.2],pt=(i,r)=>{const p=r?rayAt(G.rays[i%G.n],r):{x:G.x,y:G.y};return`${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`};
  for(let i=0;i<G.n;i+=2)for(let b=0;b<bands.length-1;b++){
    const r0=bands[b],r1=bands[b+1],j=i+2;
    const poly=r0?[pt(i,r0),pt(i+1,r0),pt(j,r0),pt(j,r1),pt(i+1,r1),pt(i,r1)]:[pt(i,0),pt(j,r1),pt(i+1,r1),pt(i,r1)];
    const sh=document.createElement('div');sh.className='shard';sh.style.clipPath=`polygon(${poly.join(',')})`;
    sh.appendChild(base.cloneNode(true));if(crackClone){const k=crackClone.cloneNode(true);k.style.cssText='position:absolute;inset:0';sh.appendChild(k)}
    L.appendChild(sh);
    const p=rayAt(G.rays[(i+1)%G.n],(r0+Math.min(r1,G.R*.6))/2),dx=p.x-G.x,dy=p.y-G.y;
    const fly=rnd(.5,1.4),dl=b*55+rnd(0,120);
    sh.animate([{transform:'none',opacity:1,filter:'brightness(1)'},
      {transform:`translate3d(${dx*.03}px,${dy*.03}px,0)`,opacity:1,filter:'brightness(1.6)',offset:.08},
      {transform:`translate3d(${dx*fly+rnd(-60,60)}px,${dy*fly+H*.35}px,${rnd(250,520)}px) rotateX(${rnd(-80,80)}deg) rotateY(${rnd(-80,80)}deg) rotateZ(${rnd(-40,40)}deg)`,opacity:0,filter:'brightness(.6)'}],
      {duration:rnd(900,1500),delay:dl,easing:'cubic-bezier(.3,.1,.6,1)',fill:'forwards'});
  }
  if(gl)gl.L.remove();
  app.style.visibility='hidden';flash('#E8F4FF',260,.9);SFX.bang(1);SFX.shatter();vib([140,40,360]);
  /* 大きな破片がこっちへ迫ってくる */
  const big=document.createElement('img');big.src='a/shards.webp';big.alt='';big.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover';L.appendChild(big);
  big.animate([{transform:'scale(.55)',opacity:0},{transform:'scale(.9)',opacity:1,offset:.15},{transform:'scale(2.2)',opacity:0}],{duration:900,easing:'cubic-bezier(.2,.6,.4,1)',fill:'forwards'});
  if(!await c.wait(500))return;
  /* 細かい粒がゆっくり舞って、消えていく */
  const sp=document.createElement('img');sp.src='a/sparkle.webp';sp.alt='';sp.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover';L.appendChild(sp);
  sp.animate([{transform:'scale(1) translateY(0)',opacity:0},{opacity:.95,offset:.15},{transform:'scale(1.15) translateY(6%)',opacity:0}],{duration:3200,easing:'ease-out',fill:'forwards'});
  await c.wait(2400);
}};
D['暗転']={async run(el,a,c){const L=c.layer('black');L.style.background='#000';c.black=L;c.halt=true;app.classList.add('bare');app.style.visibility='hidden';$('themeColor').setAttribute('content','#000000');newBusQuiet();await c.wait(300)}};
function newBusQuiet(){if(A.bus){try{A.bus.gain.setTargetAtTime(0,A.ctx.currentTime,.02);setTimeout(()=>{if(A.bus)A.bus.gain.setTargetAtTime(1,A.ctx.currentTime,.05)},1500)}catch(e){}}}
D['スリープ']={async run(el,a,c){await c.wait((parseFloat(a.秒)||5)*1000)}};
D['笑い']={async run(el,a,c){
  /* 声は出さない。文字の「ケタケタ」だけが、無音のまま増えていく */
  const small=a.args.includes('小'),L=c.layer(),n=small?5:26;vib(small?[20,60,20]:[30,60,30,60,30,60,30]);
  let iv=small?420:300;
  for(let i=0;i<n;i++){const k=document.createElement('div');k.className='kk';k.textContent=pick(['ケタ','ケタケタ','ケタ','ケタケタケタ']);
    const big=!small&&i>14&&Math.random()<.3;
    k.style.cssText+=`left:${rnd(2,72)}%;top:${rnd(6,86)}%;font-size:${big?rnd(36,60):rnd(13,28)}px;transform:rotate(${rnd(-25,25)}deg)`;L.appendChild(k);
    k.animate([{opacity:0},{opacity:small?.5:1,offset:.15},{opacity:small?.3:.8,offset:.6},{opacity:0}],{duration:rnd(1100,2200),fill:'forwards'});
    if(!await c.wait(iv))return;iv=Math.max(70,iv*.9)}
  if(small)return;
  await c.wait(1600);
}};
D['終わり']={
  still(el,a){blockAfter(el,`<p class="endtxt">${esc(a.文||'')}</p>`)},
  async run(el,a,c){const L=c.layer();L.innerHTML='<div class="endw"><div class="t1"></div><div class="t2">BAD END</div><div class="bt"></div></div>';c.endw=L.firstChild;
    const t1=c.endw.firstChild;for(const ch of a.文||''){const s=document.createElement('span');s.textContent=ch;s.style.opacity=0;t1.appendChild(s);s.animate([{opacity:0},{opacity:1}],{duration:900,fill:'forwards'});if(!await c.wait(170))return}
    await c.wait(1800);}
};
D['バッドエンド']={
  still(el){blockAfter(el,'<p class="badend">BAD END</p>')},
  async run(el,a,c){const w=c.endw;if(!w)return;const t2=w.querySelector('.t2'),bt=w.querySelector('.bt');SFX.rumble();vib(600);
    t2.animate([{opacity:0,filter:'blur(14px)',transform:'scale(1.1)'},{opacity:1,filter:'blur(0)',transform:'scale(1)'}],{duration:5200,easing:'ease-out',fill:'forwards'});
    if(!await c.wait(6000))return;
    bt.innerHTML='<button type="button" data-k="again">もう一度読む</button><button type="button" data-k="src">書き方を見る</button>';bt.style.opacity=1;
    bt.addEventListener('click',e=>{const k=e.target.dataset.k;if(k==='again')location.reload();if(k==='src')openSheet()})}
};
D['もう一度']={still(){},
  async run(el,a,c){const w=c.endw;if(!w)return;if(!await c.wait(1500))return;const bt=w.querySelector('.bt');
    bt.innerHTML='<button type="button" data-k="again">もう一度読む</button><button type="button" data-k="src">書き方を見る</button>';bt.style.opacity=1;
    bt.addEventListener('click',e=>{const k=e.target.dataset.k;if(k==='again')location.reload();if(k==='src')openSheet()})}
};
['めくれない','次へ','自動','めくり'].forEach(k=>D[k]={});
/* 背景：ページの最初の［背景］はめくった時点で出す。途中の［背景］はじわっと切り替える */
D['背景']={run(el,a,c){const k=a.args[0];if($('bg').dataset.k===k)return;setBg(k,true);bgLife(c,k)}};
/* 人影：なし／薄く／震える／赤 */
D['人影']={run(el,a,c){
  const w=$('silw'),k=a.args[0];
  if(k==='なし')w.classList.add('gone');
  if(k==='薄く'){w.classList.add('thin');SFX.rumble()}
  if(k==='震える'){w.classList.add('shiver');c.wait(4000).then(()=>w.classList.remove('shiver'))}
  if(k==='赤')w.classList.add('red');
}};

/* =====================================================================
   ここから下は、どのジャンルの物語にも入れられる演出（カタログ用に追加）
   ===================================================================== */
Object.assign(SFX,{
  shimmer:snd((sec=2)=>{const t=now();for(let i=0;i<20;i++)tone('sine',rnd(1400,3000)*(1+i/30),t+i*sec/20,.35,.045);hiss(t,sec,.06,{f:3000,to:8000,a:sec*.6,q:1})}),
  fanfare:snd(()=>{const t=now();[523,659,784,1047].forEach((f,i)=>{tone('triangle',f,t+i*.09,.3,.13);tone('sine',f*2,t+i*.09,.25,.04)});[1047,1319,1568].forEach(f=>tone('triangle',f,t+.42,1,.09))}),
  pling:snd(()=>{const t=now();tone('sine',1568,t,.22,.11);tone('sine',2093,t+.08,.4,.09)}),
  warn:snd(()=>{const t=now();tone('square',440,t,.16,.05);tone('square',330,t+.18,.22,.05)}),
  boom:snd(()=>{const t=now();tone('sine',60,t,1.2,.6,{to:30});hiss(t,1.2,.4,{type:'lowpass',f:400,to:120})})
});

/* 説明の枠（カタログで、演出の説明を書く所） */
BR['説明']=(a,L)=>`<div class="blk note">${L.map(l=>`<div>${inline(l)}</div>`).join('')}</div>`;

/* 目次の NEW：増えた・直したページ（BOOK.chg）に付く。そのページを一度開くと、この端末では消える */
const seenGet=()=>{try{return JSON.parse(localStorage.getItem('fxSeen')||'{}')}catch(e){return{}}};
function seenMark(name){const v=BOOK.chg&&BOOK.chg[name];if(!v)return;try{const s=seenGet();s[name]=v;localStorage.setItem('fxSeen',JSON.stringify(s))}catch(e){}}
const isNew=name=>{const v=BOOK.chg&&BOOK.chg[name];return!!v&&seenGet()[name]!==v};
/* 目次：［題］の付いたページを、ジャンルごとに並べる */
BR['目次']=(a,L)=>{
  const g={};BOOK.pages.forEach((s,i)=>{if(!i)return;const r=s.match(/［題([^］]*)］/);if(!r)return;const t=parseAttrs(r[1]);(g[t.ジャンル||'その他']=g[t.ジャンル||'その他']||[]).push([i,t.名||''])});
  let h='<div class="blk toc">';
  /* ジャンルごとに折りたたむ（開いたジャンルは、この端末で覚えておく） */
  let op={};try{op=JSON.parse(localStorage.getItem('fxTocOpen')||'{}')}catch(e){}
  for(const k in g){const nw=g[k].filter(([,n])=>isNew(n)).length;
    h+=`<details class="tgd" data-g="${esc(k)}"${op[k]?' open':''}><summary class="tg" data-tap>${esc(k)}<small>${g[k].length}</small>${nw?`<em class="tnew">NEW</em>`:''}</summary>`+g[k].map(([i,n])=>`<button type="button" class="ti" data-go="${i}">${esc(n)}${isNew(n)?'<em class="tnew">NEW</em>':''}<span>›</span></button>`).join('')+'</details>'}
  (BOOK.soon||[]).forEach(k=>h+=`<div class="tg">${esc(k)}</div><div class="ti off">準備中</div>`);
  if(BOOK.horror)h+=`<div class="tg">ホラー</div><a class="ti" href="${esc(BOOK.horror)}">ホラーの物語（別ページ）<span>›</span></a>`;
  return h+'</div>';
};

/* ===== 招待状：スマホ／パソコンに通知が届く → 読者が押して開く → 「参加しますか？」 ===== */
const RUNE=[...'ΔΞΨΩϞϟϡЖЯЮФΣΠλψζξϠ'];
BR['招待状']=(a,L)=>`<div class="blk invite" data-fx="招待状" data-a="${encA(a)}" data-body="${encA(L)}"><div class="ivt">${esc(a.題||'招待状')}</div>${L.map(l=>`<div>${inline(l)}</div>`).join('')}<div class="ivq">${esc(a.問い||'参加しますか？')}　→　はい</div></div>`;
/* 招待状（カカオトーク風）：［招待状 見た目=カカオ 送信者=… 通知=… 問い=…］
   通知が降りてくる → 押すと会話の画面が開く（入力中…→吹き出し）→ 「はい／いいえ」のカード。いいえ、は聞き直してくる */
async function kakaoInvite(a,c,L,body){
  const who=a.送信者||'ゲーム運営',q=a.問い||'ゲームに参加しますか？',note=a.通知||q;
  const n=document.createElement('button');n.type='button';n.className='ntf ntfb kkn';
  n.innerHTML='<i class="kki"></i><div><b>カカオトーク・いま</b>'+esc(who)+'<br>'+esc(note)+'<small>タップして開く</small></div>';
  L.appendChild(n);SFX.pico();vib([30,60,30]);
  n.animate([{transform:'translateY(-130%)'},{transform:'none'}],{duration:480,easing:'cubic-bezier(.2,.9,.3,1.2)',fill:'forwards'});
  c.every(6000,()=>{if(n.isConnected){SFX.pico();vib(30);n.animate([{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],{duration:300})}});
  await new Promise(r=>{n.addEventListener('click',r,{once:true});c.on(r)});if(c.dead)return;
  n.remove();SFX.swish();
  const w=document.createElement('div');w.className='ivwin kk';
  w.innerHTML='<div class="kkh"><span>‹</span><b>'+esc(who)+'</b><span>⋮</span></div><div class="kkb"></div>';
  L.appendChild(w);w.animate([{transform:'scale(.9)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:420,easing:'cubic-bezier(.2,.9,.3,1.2)'});
  const box=w.querySelector('.kkb');
  const row=inner=>{const m=document.createElement('div');m.className='kkm';m.innerHTML='<div class="kka"></div><div class="kkc"><span class="kkw">'+esc(who)+'</span><div class="kkr">'+inner+'</div></div>';box.appendChild(m);m.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:260});return m.querySelector('.kkr')};
  const typing=()=>{const r=row('<div class="kkt"><i></i><i></i><i></i></div>');return r};
  const rows=body.map(l=>String(l).replace(/［[^］]*］/g,'').trim()).filter(Boolean);
  if(!await c.wait(500))return;
  for(const text of rows){
    const t=typing();SFX.tick&&SFX.tick(.2);if(!await c.wait(rnd(600,900)))return;
    t.innerHTML='<div class="kkbub">'+inline(text)+'</div><span class="kktm">いま</span>';SFX.pop&&SFX.pop();vib(20);
    if(!await c.wait(500))return;
  }
  const t=typing();if(!await c.wait(rnd(700,1000)))return;
  t.innerHTML='<div class="kkcard"><div class="kkq">'+esc(q)+'</div><div class="kkbtn"><button type="button" class="y">はい</button><button type="button" class="n">いいえ</button></div></div>';SFX.pico();vib(30);
  const qe=t.querySelector('.kkq'),yes=t.querySelector('.y'),no=t.querySelector('.n');
  const NOQ=['本当に、よろしいですか？','この招待は、あなたにしか届いていません。','もう一度だけ、お聞きします。','あなたが、必要です。','……参加しますか？'];
  let tries=0;
  await new Promise(r=>{c.on(r);yes.onclick=r;
    no.onclick=()=>{tries++;SFX.tick&&SFX.tick(.3);vib(20);qe.textContent=NOQ[Math.min(tries,NOQ.length)-1];qe.animate([{opacity:0},{opacity:1}],{duration:400});
      no.style.opacity=Math.max(.25,1-tries*.18);yes.style.transform='scale('+(1+tries*.05).toFixed(2)+')';if(tries>=5)no.remove()}});
  if(c.dead)return;
  yes.disabled=true;SFX.pling&&SFX.pling();vib(60);
  await w.animate([{filter:'brightness(1)',opacity:1},{filter:'brightness(3)',opacity:0}],{duration:800,fill:'forwards'}).finished.catch(()=>{});
}
D['招待状']={
  prep(el){el.style.display='none'},
  run(el,a,c){return new Promise(async res=>{
    c.on(()=>res());
    const pc=a.args.includes('パソコン'),app_=a.アプリ||'招待状',L=c.layer('ivl');
    if(a.見た目==='カカオ'||a.args.includes('カカオ')){await kakaoInvite(a,c,L,JSON.parse(el.dataset.body));L.remove();return res()}
    /* 1. 通知が来る。読者が押すまで待つ */
    const n=document.createElement('button');n.type='button';n.className=pc?'toast':'ntf ntfb';
    n.innerHTML=`<i>✦</i><div><b>${esc(app_)}${pc?'':'・いま'}</b>${esc(a.通知||'特別招待のお知らせ')}<small>${pc?'クリック':'タップ'}して開く</small></div>`;
    L.appendChild(n);SFX.notif();vib([30,60,30]);
    n.animate(pc?[{transform:'translateY(130%)',opacity:0},{transform:'none',opacity:1}]:[{transform:'translateY(-130%)'},{transform:'none'}],{duration:480,easing:'cubic-bezier(.2,.9,.3,1.2)',fill:'forwards'});
    const glow=n.animate([{boxShadow:'0 8px 24px rgba(0,0,0,.5),0 0 0 0 rgba(255,215,120,0)'},{boxShadow:'0 8px 24px rgba(0,0,0,.5),0 0 0 5px rgba(255,215,120,.45)'}],{duration:900,iterations:Infinity,direction:'alternate'});
    c.every(6000,()=>{if(n.isConnected){SFX.notif();vib(30);n.animate([{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],{duration:300})}});
    await new Promise(r=>{n.addEventListener('click',r,{once:true});c.on(r)});if(c.dead)return;
    glow.cancel();n.remove();SFX.swish();
    /* 2. 招待状が開く。知らない文字が、日本語に変わっていく */
    const w=document.createElement('div');w.className='ivwin '+(pc?'pc':'sp');
    w.innerHTML=(pc?`<div class="ivbar"><span>● ● ●</span>${esc(app_)} ― 招待状</div>`:'')+`<div class="ivbody"><div class="ivt">${esc(a.題||'招待状')}</div><div class="ivtx"></div><div class="ivq"></div><div class="ivb"></div></div>`;
    L.appendChild(w);w.animate([{transform:'scale(.85)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:520,easing:'cubic-bezier(.2,.9,.3,1.2)'});
    const tx=w.querySelector('.ivtx'),body=JSON.parse(el.dataset.body);
    for(const line of body){
      const d=document.createElement('div');tx.appendChild(d);
      const sp=[...line.replace(/［[^］]*］/g,'')].map(ch=>{const s=document.createElement('span');s.className='rn';s.textContent=ch.trim()?pick(RUNE):ch;d.appendChild(s);return[s,ch]});
      d.animate([{opacity:0},{opacity:1}],{duration:400});SFX.shimmer(.5);if(!await c.wait(500))return;
      for(const[s,ch]of sp){s.textContent=pick(RUNE);if(!await c.wait(22))return;s.textContent=ch;s.className='jp'}
      if(!await c.wait(300))return;
    }
    /* 3. 参加しますか？ 「いいえ」を押すと、何度も聞き直してくる */
    const q=w.querySelector('.ivq'),bx=w.querySelector('.ivb');q.textContent=a.問い||'参加しますか？';
    bx.innerHTML='<button type="button" class="y">はい</button><button type="button" class="n">いいえ</button>';
    const yes=bx.firstChild,no=bx.lastChild;
    const NOQ=['本当に、よろしいですか？','この招待は、あなたにしか届いていません。','もう一度だけ、お聞きします。','あなたが、必要です。','……参加しますか？'];
    let tries=0;
    await new Promise(r=>{c.on(r);yes.onclick=r;
      no.onclick=()=>{tries++;SFX.tick(.3);vib(20);q.textContent=NOQ[Math.min(tries,NOQ.length)-1];q.animate([{opacity:0},{opacity:1}],{duration:400});
        no.style.transform=`translate(${rnd(-50,50)|0}px,${rnd(-6,26)|0}px) scale(${Math.max(.35,1-tries*.17).toFixed(2)})`;no.style.opacity=Math.max(.2,1-tries*.2);
        yes.style.transform=`scale(${(1+tries*.07).toFixed(2)})`;if(tries>=5)no.remove()}});
    if(c.dead)return;
    yes.disabled=true;SFX.pling();vib(60);
    await w.animate([{filter:'brightness(1)',opacity:1},{filter:'brightness(3)',opacity:0}],{duration:800,fill:'forwards'}).finished.catch(()=>{});
    L.remove();res();
  })}
};

/* ===== 転移：床に魔法陣が広がり、光に包まれて、別の世界へ ===== */
function circleSVG(){
  const R=[96,82,64,40],ru=n=>Array.from({length:n},()=>pick(RUNE)).join(' ');
  let s='<svg viewBox="-110 -110 220 220" class="mc"><defs>'+R.map((r,i)=>`<path id="mcp${i}" d="M${-r+6},0 a${r-6},${r-6} 0 1,1 ${2*(r-6)},0 a${r-6},${r-6} 0 1,1 ${-2*(r-6)},0"/>`).join('')+'</defs>';
  R.forEach((r,i)=>{s+=`<g class="mr r${i}"><circle r="${r}" fill="none" stroke="currentColor" stroke-width="${i?1.2:2}"/>${i<3?`<text font-size="${i?7:8}" fill="currentColor"><textPath href="#mcp${i}">${ru(i?18:26)}</textPath></text>`:''}</g>`});
  const star=Array.from({length:6},(_,k)=>{const a=k*Math.PI/3-Math.PI/2;return`${(Math.cos(a)*64).toFixed(1)},${(Math.sin(a)*64).toFixed(1)}`});
  s+=`<g class="mr r4"><polygon points="${star[0]} ${star[2]} ${star[4]}" fill="none" stroke="currentColor" stroke-width="1.4"/><polygon points="${star[1]} ${star[3]} ${star[5]}" fill="none" stroke="currentColor" stroke-width="1.4"/></g>`;
  return s+'</svg>';
}
D['転移']={async run(el,a,c){
  const L=c.layer();L.innerHTML=`<div class="mcw">${circleSVG()}</div>`;const w=L.firstChild;
  SFX.shimmer(3);SFX.rumble();vib([40,40,40,40,80]);
  w.animate([{transform:'perspective(700px) rotateX(64deg) scale(.15)',opacity:0},{transform:'perspective(700px) rotateX(64deg) scale(1.5)',opacity:1}],{duration:2200,easing:'cubic-bezier(.2,.8,.3,1)',fill:'forwards'});
  if(!await c.wait(2300))return;
  w.animate([{filter:'brightness(1)'},{filter:'brightness(4) blur(2px)'}],{duration:700,fill:'forwards'});
  const Wt=c.layer('white');Wt.innerHTML=`<div class="load"><div class="lt">接続中…</div><i><b></b></i></div>`;
  Wt.animate([{opacity:0},{opacity:1}],{duration:700,fill:'forwards'});SFX.boom();vib(300);
  if(!await c.wait(800))return;
  L.remove();const k=a.先||'異世界';setBg(k,false);bgLife(c,k);
  const lt=Wt.querySelector('.lt'),bar=Wt.querySelector('b');
  bar.animate([{width:'0%'},{width:'100%'}],{duration:2400,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
  for(const t of ['接続中…','世界を同期しています…','ようこそ']){lt.textContent=t;if(!await c.wait(800))return}
  await Wt.animate([{opacity:1},{opacity:0}],{duration:1400,fill:'forwards'}).finished.catch(()=>{});Wt.remove();
}};

/* ===== ステータス画面 ===== */
BR['ステータス']=(a,L)=>`<div class="blk stat" data-fx="ステータス" data-a="${encA(a)}"><div class="sth">STATUS</div><div class="stn">${esc(a.名前||'')}</div>${L.map(l=>{const i=l.indexOf('：');const k=i<0?l:l.slice(0,i),v=i<0?'':l.slice(i+1),m=v.match(/^(\d+)\/(\d+)$/);
  return`<div class="str"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span>${m?`<i class="bar ${/MP/i.test(k)?'mp':'hp'}"><b style="width:${(100*m[1]/m[2]).toFixed(0)}%"></b></i>`:''}</div>`}).join('')}</div>`;
D['ステータス']={
  prep(el){el.querySelectorAll('.str').forEach(r=>r.style.opacity=0)},
  async run(el,a,c){
    SFX.shimmer(.8);SFX.pling();vib(30);
    el.animate([{transform:'scaleY(0.02) scaleX(.6)',opacity:0,filter:'brightness(3)'},{transform:'scaleY(0.02) scaleX(1)',opacity:1,offset:.35},{transform:'none',filter:'brightness(1)'}],{duration:700,easing:'cubic-bezier(.3,.7,.3,1)'});
    if(!await c.wait(600))return;
    for(const r of el.querySelectorAll('.str')){
      r.style.opacity=1;r.animate([{transform:'translateX(-10px)',opacity:0},{transform:'none',opacity:1}],{duration:260});SFX.tick(.12);
      const v=r.querySelector('.v'),m=v.textContent.match(/^(\d+)(\/\d+)?$/);
      if(m){const to=+m[1];for(let k=0;k<=8;k++){v.textContent=Math.round(to*k/8)+(m[2]||'');if(!await c.wait(28))return}}
      const b=r.querySelector('.bar b');if(b)b.animate([{width:'0%'},{width:b.style.width}],{duration:500,easing:'ease-out'});
      if(!await c.wait(160))return;
    }
  }
};

/* ===== システムメッセージ（スキル・アイテム・警告） ===== */
D['システム']={async run(el,a,c){
  if(!c.sysL||!c.sysL.isConnected){c.sysL=c.layer('sysl')}
  const k=a.種類||'',d=document.createElement('div');d.className='sys '+({'スキル':'sk','アイテム':'it','警告':'wn'}[k]||'');
  d.innerHTML=`<span class="tg">${k==='警告'?'⚠ 警告':'システム'}</span>${esc(a.文||'')}`;c.sysL.appendChild(d);
  if(k==='警告'){SFX.warn();vib([60,40,60])}else{SFX.pling();vib(25)}
  d.animate([{transform:'translateY(-14px) scaleX(.6)',opacity:0},{transform:'none',opacity:1}],{duration:360,easing:'cubic-bezier(.2,.9,.3,1.2)'});
  c.wait(4600).then(ok=>ok&&d.animate([{opacity:1},{opacity:0,transform:'translateY(-8px)'}],{duration:500,fill:'forwards'}).finished.then(()=>d.remove()));
  while(c.sysL.children.length>4)c.sysL.firstChild.remove();
  await c.wait(1300);
}};

/* ===== レベルアップ ===== */
D['レベルアップ']={async run(el,a,c){
  const L=c.layer('lvl'),up=(a.上がる||'').split(/[,、]/).filter(Boolean);
  L.innerHTML=`<div class="rays"></div><div class="lvw"><div class="lvt">LEVEL UP!</div><div class="lvn">Lv <b>${esc(a.前||'1')}</b> → <b class="to">${esc(a.後||'2')}</b></div><div class="lvs">${up.map(u=>`<div>${esc(u)}</div>`).join('')}</div></div>`;
  SFX.fanfare();vib([40,40,40,40,160]);flash('#fff6d0',400,.7);coins(c,40);
  L.querySelector('.rays').animate([{transform:'scale(.3) rotate(0deg)',opacity:0},{transform:'scale(1.2) rotate(40deg)',opacity:1,offset:.2},{transform:'scale(1.4) rotate(120deg)',opacity:.7}],{duration:4000,fill:'forwards'});
  L.querySelector('.lvt').animate([{transform:'scale(2.6)',opacity:0,filter:'blur(8px)'},{transform:'scale(.95)',opacity:1,filter:'blur(0)',offset:.6},{transform:'scale(1)'}],{duration:600,easing:'ease-out'});
  const to=L.querySelector('.to');to.animate([{transform:'rotateX(90deg)'},{transform:'none'}],{duration:500,delay:500,fill:'backwards'});
  [...L.querySelectorAll('.lvs div')].forEach((d,i)=>{d.style.opacity=0;c.wait(900+i*300).then(ok=>{if(!ok)return;d.style.opacity=1;d.animate([{transform:'translateY(8px)',opacity:0},{transform:'none',opacity:1}],{duration:300});SFX.tick(.2)})});
  /* ページの中のステータス画面があれば、レベルの数字も書き換わる */
  page.querySelectorAll('.stat .str').forEach(r=>{if(/レベル|Lv/i.test(r.querySelector('.k').textContent))r.querySelector('.v').textContent=a.後||'2'});
  if(!await c.wait(4200))return;
  await L.animate([{opacity:1},{opacity:0}],{duration:700,fill:'forwards'}).finished.catch(()=>{});L.remove();
}};

/* ===== 星座システム：空の上の存在が、あなたを見ている ===== */
D['星座']={async run(el,a,c){
  if(!c.starL||!c.starL.isConnected)c.starL=c.layer('starl');
  const hid=a.args.includes('隠す'),nm=hid?'■■■■':(a.名||'名もなき星');
  const d=document.createElement('div');d.className='star'+(hid?' hid':'');
  let msg;
  if(a.後援){msg=`<b>${esc(nm)}</b>が <em>${esc(a.後援)}</em> コインを後援しました。`}
  else if(a.スキル){msg=`<b>${esc(nm)}</b>が、あなたにスキル『<em>${esc(a.スキル)}</em>』を授けました。`}
  else msg=`<b>${esc(nm)}</b>が${esc(a.文||'あなたを見ています')}。`;
  d.innerHTML=`<span class="sp">［</span>星座${msg}<span class="sp">］</span>`;c.starL.appendChild(d);
  d.animate([{opacity:0,letterSpacing:'.3em',filter:'blur(4px)'},{opacity:1,letterSpacing:'0',filter:'blur(0)'}],{duration:600,easing:'ease-out'});
  SFX.shimmer(.5);if(hid){SFX.crackle(.3,.3);vib([20,40,20]);const b=d.querySelector('b');c.every(90,()=>{if(b.isConnected)b.textContent=Array.from({length:4},()=>pick([...'■□▓▒░'])).join('')})}
  while(c.starL.children.length>5)c.starL.firstChild.remove();
  if(a.後援){coins(c,Math.min(120,+a.後援/2|0||40));SFX.coin()}
  if(a.スキル){const L=c.layer('lvl');L.innerHTML=`<div class="rays gold"></div><div class="lvw"><div class="skt">スキル獲得</div><div class="skn">『${esc(a.スキル)}』</div><div class="skf">― ${esc(nm)} より</div></div>`;
    SFX.fanfare();vib([30,30,120]);L.querySelector('.rays').animate([{transform:'scale(.4)',opacity:0},{transform:'scale(1.2) rotate(60deg)',opacity:.8}],{duration:2600,fill:'forwards'});
    L.querySelector('.lvw').animate([{transform:'scale(.7)',opacity:0},{transform:'none',opacity:1}],{duration:500,easing:'cubic-bezier(.2,.9,.3,1.3)'});
    c.wait(3000).then(ok=>ok&&L.animate([{opacity:1},{opacity:0}],{duration:600,fill:'forwards'}).finished.then(()=>L.remove()));
    await c.wait(3200);return}
  await c.wait(1500);
}};

/* ===== シナリオ（課題の通知と、制限時間） ===== */
D['シナリオ']={async run(el,a,c){
  const L=c.layer();const rows=[['内容',a.内容],['制限時間',a.時間],['報酬',a.報酬],['失敗',a.失敗]].filter(r=>r[1]);
  L.innerHTML=`<div class="scn"><div class="sch">${esc(a.題||'シナリオ')}</div>${rows.map(([k,v])=>`<div class="scr"><span>${k}</span>${esc(v)}</div>`).join('')}</div>`;
  const w=L.firstChild;SFX.warn();SFX.shimmer(1);vib([50,50,50]);
  w.animate([{transform:'translate(-50%,-50%) scaleY(.02)',opacity:0},{transform:'translate(-50%,-50%) scaleY(.02)',opacity:1,offset:.3},{transform:'translate(-50%,-50%)'}],{duration:600});
  if(!await c.wait(4200))return;
  /* 小さくなって、右上で時間を数える */
  w.animate([{opacity:1},{opacity:0,transform:'translate(-50%,-50%) scale(.6)'}],{duration:400,fill:'forwards'});
  const m=(a.時間||'').match(/(\d+)/);if(!m){c.wait(400).then(()=>L.remove());return}
  let s=+m[1]*60;const tm=document.createElement('div');tm.className='sctm';L.appendChild(tm);
  const show=()=>{tm.textContent=`残り ${String(s/60|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};show();
  c.every(1000,()=>{s=Math.max(0,s-1);show();if(s<=10)tm.classList.add('low')});
}};

/* ===== 電光掲示板：駅・空港の案内板 ===== */
/* ［案内板 駅］や［案内板 空港］の中に「時刻 行き先 番線 状況」を1行ずつ書く */
BLOCKS.add('案内板');
BR['案内板']=(a,L)=>{const air=a.args.includes('空港');
  return`<div class="blk board ${air?'air':'sta'}" data-fx="案内板" data-a="${encA(a)}"><div class="bdh">${esc(a.題||(air?'出発 DEPARTURES':'発車案内'))}</div>${L.map(l=>`<div class="bdr">${l.split(/\s+/).map(x=>`<span>${esc(x)}</span>`).join('')}</div>`).join('')}${a.流れる?`<div class="bdt"><span>${esc(a.流れる)}</span></div>`:''}</div>`};
D['案内板']={
  async run(el,a,c){
    /* パタパタと文字がめくれて決まる */
    const cells=[...el.querySelectorAll('.bdr span')],K='ＡＢＣＤＥＦＧＨ0123456789あかさたなはまやらわ';
    cells.forEach(s=>{s.dataset.t=s.textContent});
    const air=a.args.includes('空港');if(air)SFX.pon();
    for(let k=0;k<9;k++){cells.forEach(s=>{if(k<8&&Math.random()<.8)s.textContent=[...s.dataset.t].map(()=>pick([...K])).join('');else s.textContent=s.dataset.t});SFX.tick(.08);if(!await c.wait(70))return}
    if(!air)c.wait(1200).then(ok=>ok&&SFX.bell(3));
    if(a.変わる){const[r,txt]=a.変わる.split(':');const row=el.querySelectorAll('.bdr')[+r-1];if(row){if(!await c.wait(2500))return;const last=row.lastChild;
      for(let k=0;k<8;k++){last.textContent=pick(['■■','遅延','運休','――','到着']);SFX.tick(.1);if(!await c.wait(80))return}last.textContent=txt;last.classList.add('hot');SFX.pling()}}
  }
};

/* ===== 恋愛・青春（どのジャンルでも使える） ===== */
Object.assign(SFX,{
  tokun:snd((v=1)=>{const t=now();tone('sine',95,t,.16,.32*v,{to:60});tone('sine',85,t+.2,.18,.22*v,{to:52})}),
  whistle:snd((d=.8)=>{const t=now(),o=A.ctx.createOscillator(),g=A.ctx.createGain(),l=A.ctx.createOscillator(),lg=A.ctx.createGain();o.frequency.value=2900;l.frequency.value=28;lg.gain.value=180;l.connect(lg);lg.connect(o.frequency);env(g,t,.02,.1,d);o.connect(g);g.connect(A.bus);o.start(t);l.start(t);o.stop(t+d+.1);l.stop(t+d+.1)}),
  buzzer:snd((d=1.2)=>{const t=now();tone('square',220,t,d,.07,{a:.01});tone('square',224,t,d,.05,{a:.01})}),
  firework:snd((delay=0)=>{const t=now()+delay;tone('sine',70,t,.7,.7,{to:34});hiss(t,.5,.45,{type:'lowpass',f:900});for(let i=0;i<26;i++)hiss(t+.25+Math.random()*1.3,.02,.12,{type:'highpass',f:rnd(2000,6000)})}),
  pop2:snd(()=>{tone('sine',880,now(),.07,.08,{to:1320})}),
  send:snd(()=>{tone('sine',1100,now(),.09,.09,{to:1800})}),
  pen:snd(()=>{const t=now();hiss(t,.05,.06,{f:rnd(2500,4000),q:4})}),
  wind:snd((d=3)=>{const t=now();hiss(t,d,.22,{type:'bandpass',f:500,to:1400,a:.4,q:.6})})
});
/* 文字の飾り（文の中に［照れ］…［／照れ］のように入れる） */
INL.add('照れ');INL.add('叫ぶ');
D['照れ']={run(el,a,c){c.wait((parseFloat(a.遅れ)||.6)*1000).then(ok=>{if(!ok)return;el.style.transition='color 1.6s,text-shadow 1.6s';el.style.color='#ffa3c0';el.style.textShadow='0 0 10px rgba(255,120,170,.8),0 1px 3px #000'})}};
D['叫ぶ']={run(el,a,c){c.wait((parseFloat(a.遅れ)||.2)*1000).then(ok=>{if(!ok)return;el.style.display='inline-block';el.style.fontWeight='700';
  el.animate([{transform:'scale(1)'},{transform:'scale(1.9)',offset:.2},{transform:'scale(1.55)'}],{duration:500,fill:'forwards',easing:'cubic-bezier(.2,1.6,.4,1)'});el.style.transformOrigin='left center';el.style.margin='.3em 0 .3em .1em';
  el.animate([{translate:'0 0'},{translate:'-2px 1px'},{translate:'2px -1px'},{translate:'0 0'}],{duration:120,iterations:8});shake(6,400);vib([60,30,90]);SFX.thump(.6)})}};

/* ===== ときめき：とくん、と鳴って画面の端がほんのりピンク ===== */
D['ときめき']={async run(el,a,c){
  const n=+a.回数||3,L=c.layer();L.style.background='radial-gradient(ellipse at center,transparent 45%,rgba(255,120,170,.55) 100%)';L.style.opacity=0;
  for(let i=0;i<n;i++){SFX.tokun(.9);vib(25);L.animate([{opacity:0},{opacity:.9,offset:.15},{opacity:.25,offset:.35},{opacity:.6,offset:.45},{opacity:0}],{duration:900});
    page.animate([{scale:1},{scale:1.012,offset:.15},{scale:1}],{duration:600});if(!await c.wait(1000))return}
}};

/* ===== 花びら（桜。色を変えれば雪にも） ===== */
function petals(c,{n=60,color='#ffc6d6',snow=false}={}){
  const L=c.layer(),cv=document.createElement('canvas'),dpr=Math.min(2,devicePixelRatio||1);L.appendChild(cv);
  const W=L.clientWidth,H=L.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.cssText='width:100%;height:100%';
  const x=cv.getContext('2d');x.scale(dpr,dpr);let last=performance.now();
  const P=Array.from({length:n},()=>({x:rnd(-20,W),y:rnd(-H,0),s:rnd(5,10),vx:rnd(10,40),vy:rnd(30,70),r:rnd(0,6),vr:rnd(-2,2),w:rnd(0,6)}));
  c.raf(t=>{const dt=Math.min(.05,(t-last)/1000);last=t;x.clearRect(0,0,W,H);
    for(const p of P){p.w+=dt*2;p.x+=(p.vx+Math.sin(p.w)*20)*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;if(p.y>H+20){p.y=-20;p.x=rnd(-20,W)}
      x.save();x.translate(p.x,p.y);x.rotate(p.r);x.scale(1,Math.abs(Math.cos(p.w)));
      if(snow){x.fillStyle='rgba(255,255,255,.9)';x.beginPath();x.arc(0,0,p.s*.35,0,7);x.fill()}
      else{const g=x.createLinearGradient(-p.s,0,p.s,0);g.addColorStop(0,'#fff0f5');g.addColorStop(1,color);x.fillStyle=g;x.beginPath();x.moveTo(0,-p.s);x.bezierCurveTo(p.s,-p.s*.6,p.s*.8,p.s*.6,0,p.s);x.bezierCurveTo(-p.s*.8,p.s*.6,-p.s,-p.s*.6,0,-p.s);x.fill()}
      x.restore()}});
  L.animate([{opacity:0},{opacity:1}],{duration:1500});return L;
}
D['花びら']={run(el,a,c){petals(c,{n:+a.数||60,snow:a.args.includes('雪')})}};

/* ===== 光が差す ===== */
D['光']={run(el,a,c){const L=c.under('');L.style.background='repeating-linear-gradient(115deg,rgba(255,240,200,.0) 0 40px,rgba(255,240,200,.16) 40px 80px,rgba(255,240,200,0) 80px 130px)';L.style.mixBlendMode='screen';
  L.animate([{opacity:0},{opacity:1}],{duration:2500,fill:'forwards'});L.animate([{backgroundPosition:'0 0'},{backgroundPosition:'120px 0'}],{duration:9000,iterations:Infinity,direction:'alternate'})}};

/* ===== トーク画面（LINE風／カカオ風）。下書きを書いては消す、送れない返事、画面の涙 ===== */
BLOCKS.add('トーク');
BR['トーク']=(a,L)=>{
  const kk=a.見た目==='カカオ'?'kk':'ln',who=a.相手||'相手';let tm=40;
  const rows=L.map(l=>{const i=l.indexOf('：');const k=i<0?'':l.slice(0,i),v=i<0?l:l.slice(i+1);
    if(k==='日付')return`<div class="tkd"><span>${esc(v)}</span></div>`;
    const me=k==='自分',t=`23:${String(tm++).padStart(2,'0')}`;
    return`<div class="msg ${me?'me':'you'}">${me?'':`<i class="av"></i>`}<div class="bb">${inline(v)}</div><span class="tm">${me?'<em>既読</em>':''}${t}</span></div>`}).join('');
  return`<div class="blk talk ${kk}" data-fx="トーク" data-a="${encA(a)}"><div class="tkh"><span>‹</span><b>${esc(who)}</b><span>☰</span></div><div class="tkb">${rows}</div><div class="tki"><div class="tkin"></div><button type="button" class="tks" disabled>送信</button></div></div>`};
D['トーク']={
  prep(el,a){if(!a.args.includes('履歴'))el.querySelectorAll('.msg,.tkd').forEach(m=>m.style.display='none')},
  run(el,a,c){return new Promise(async res=>{c.on(()=>res());
    const body=el.querySelector('.tkb'),inp=el.querySelector('.tkin'),btn=el.querySelector('.tks'),hist=a.args.includes('履歴');
    const scroll=()=>{body.scrollTop=body.scrollHeight;keepBottom()};
    /* 涙：視界がにじんで、こぼれる */
    if(a.args.includes('涙'))c.wait(2500).then(ok=>ok&&tearVision(c,{target:el}));
    /* メッセージが順に届く。相手のときは「入力中…」が出る（迷うと出たり消えたり） */
    if(!hist)for(const m of el.querySelectorAll('.msg,.tkd')){
      if(m.classList.contains('you')){const dots=document.createElement('div');dots.className='msg you typing';dots.innerHTML='<i class="av"></i><div class="bb"><b></b><b></b><b></b></div>';
        const tries=a.args.includes('迷う')&&!m.nextElementSibling?3:1;
        for(let k=0;k<tries;k++){body.appendChild(dots);scroll();if(!await c.wait(k<tries-1?rnd(1200,2000):1300))return;dots.remove();if(k<tries-1&&!await c.wait(rnd(900,1600)))return}}
      else if(!await c.wait(500))return;
      body.appendChild(m);m.style.display='';m.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:260});
      if(m.classList.contains('me')){SFX.send();const r=m.querySelector('em');if(r){r.style.visibility='hidden';c.wait(1600).then(ok=>{if(ok){r.style.visibility='';SFX.pop2()}})}}else if(m.classList.contains('you'))SFX.pop2();
      scroll();if(!await c.wait(700))return}
    else scroll();
    /* 返事を書いては消す */
    const drafts=(a.下書き||'').split('／').filter(Boolean);
    const typeIn2=async s=>{for(const ch of s){inp.textContent+=ch;SFX.type();btn.disabled=false;if(!await c.wait(rnd(110,220)))return false}return true};
    const erase=async(fast)=>{while(inp.textContent){inp.textContent=[...inp.textContent].slice(0,-1).join('');SFX.tick(.05);if(!await c.wait(fast?40:rnd(70,120)))return false}btn.disabled=true;return true};
    for(let i=0;i<drafts.length;i++){if(!await c.wait(1200))return;if(!await typeIn2(drafts[i]))return;if(!await c.wait(i===drafts.length-1?900:1400))return;
      if(i<drafts.length-1){if(!await erase(false))return}}
    if(!drafts.length){res();return}
    /* 送信ボタン：確認(送信しますか？)／送れる／押せない */
    const mode=a.送信||'確認';
    if(mode==='自動'){const t=inp.textContent;inp.textContent='';btn.disabled=true;
      const m=document.createElement('div');m.className='msg me';m.innerHTML=`<div class="tkc"><div class="tkr"><div class="bb">${esc(t)}</div><span class="tm"><em style="visibility:hidden">既読</em>今</span></div></div>`;body.appendChild(m);SFX.send();scroll();
      if(!await c.wait(1600))return;m.querySelector('em').style.visibility='';SFX.pop2();res();return}
    btn.classList.add('pulse');
    const sendIt=()=>{const t=inp.textContent;inp.textContent='';btn.disabled=true;btn.classList.remove('pulse');
      const m=document.createElement('div');m.className='msg me';m.innerHTML=`<div class="bb">${esc(t)}</div><span class="tm"><em class="nr">未読</em><small>今</small></span>`;body.appendChild(m);SFX.send();scroll();
      /* いつまでも既読は付かない。時間だけが過ぎていく */
      const steps=['1分前','1時間前','昨日','1週間前','1か月前','1年前'];let k=0;const sm=m.querySelector('small');c.every(2200,()=>{if(k<steps.length)sm.textContent=steps[k++]})};
    btn.onclick=async()=>{if(btn.disabled)return;
      if(mode==='押せない'){btn.animate([{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'none'}],{duration:200,iterations:3});vib(30);erase(true);return}
      if(mode==='送れる'){sendIt();return}
      const dlg=document.createElement('div');dlg.className='tkdlg';dlg.innerHTML='<div><p>送信しますか？</p><button type="button" class="ok">送信</button><button type="button" class="ng">やめる</button></div>';el.appendChild(dlg);
      dlg.querySelector('.ok').onclick=()=>{dlg.remove();sendIt()};dlg.querySelector('.ng').onclick=()=>{dlg.remove();erase(false)}};
    res();
  })}
};

/* ===== 手書きのメモ。{前|後} と書くと、前の言葉を線で消して後の言葉に書き直す ===== */
BLOCKS.add('メモ');
const memoHTML=l=>esc(l).replace(/\{([^|}]*)\|([^}]*)\}/g,'<s>$1</s>$2');
BR['メモ']=(a,L)=>`<div class="blk memo" data-fx="メモ" data-lines="${encA(L)}">${L.map(l=>`<div>${memoHTML(l)||'&nbsp;'}</div>`).join('')}</div>`;
D['メモ']={
  prep(el){el.innerHTML=''},
  async run(el,a,c){
    el.animate([{transform:'rotate(-2deg) scaleY(.05)',opacity:0},{transform:'rotate(-2deg) scaleY(1)',opacity:1}],{duration:600,easing:'cubic-bezier(.3,.7,.3,1)'});SFX.swish();
    if(!await c.wait(600))return;
    for(const l of JSON.parse(el.dataset.lines)){
      const d=document.createElement('div');el.appendChild(d);if(!l){d.innerHTML='&nbsp;';continue}
      const parts=l.split(/(\{[^}]*\})/);
      for(const p of parts){const m=p.match(/^\{([^|}]*)\|([^}]*)\}$/);
        const write=async(t,tag)=>{const s=document.createElement(tag||'span');d.appendChild(s);for(const ch of t){s.textContent+=ch;SFX.pen();if(!await c.wait(rnd(90,160)))return null}return s};
        if(m){const s=await write(m[1]);if(!s)return;if(!await c.wait(700))return;s.classList.add('strike');SFX.pen();if(!await c.wait(600))return;if(!await write(m[2]))return}
        else if(!await write(p))return}
      if(!await c.wait(350))return}
  }
};

/* ===== 夏：セミの声と、まぶしい光 ===== */
D['夏']={run(el,a,c){
  const L=c.layer('');L.innerHTML='<div class="flare"></div>';L.firstChild.animate([{opacity:.75,transform:'scale(1)'},{opacity:1,transform:'scale(1.08)'}],{duration:3000,iterations:Infinity,direction:'alternate'});
  if(!soundOn())return;
  const t=now(),s=A.ctx.createBufferSource();s.buffer=A.noise;s.loop=true;const f=A.ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=4800;f.Q.value=4;
  const g=A.ctx.createGain();g.gain.value=0;const am=A.ctx.createGain();am.gain.value=.5;const l=A.ctx.createOscillator();l.frequency.value=32;const lg=A.ctx.createGain();lg.gain.value=.5;
  l.connect(lg);lg.connect(am.gain);s.connect(f);f.connect(am);am.connect(g);g.connect(A.bus);s.start();l.start();g.gain.linearRampToValueAtTime(.09,t+2);
  c.every(4500,()=>{try{g.gain.setTargetAtTime(rnd(.03,.1),now(),.6)}catch(e){}});
  c.on(()=>{try{g.gain.setTargetAtTime(0,now(),.1)}catch(e){}setTimeout(()=>{try{s.stop();l.stop()}catch(e){}},600)});
}};

/* ===== 試合：スコアボード、残り時間、笛とブザー ===== */
D['試合']={async run(el,a,c){
  const L=c.layer();const [h,w]=(a.点||'0-0').split('-').map(Number);let hs=h,as=w,left=+a.残り||10;
  L.innerHTML=`<div class="score"><div class="tmn">${esc(a.ホーム||'ホーム')}</div><div class="pts"><b class="h">${hs}</b><i>-</i><b class="a">${as}</b></div><div class="tmn">${esc(a.アウェイ||'アウェイ')}</div><div class="clk"></div></div>`;
  const sb=L.firstChild,ck=sb.querySelector('.clk'),show=()=>{ck.textContent=`0:${String(left).padStart(2,'0')}`;ck.classList.toggle('low',left<=5)};show();
  sb.animate([{transform:'translate(-50%,-120%)'},{transform:'translate(-50%,0)'}],{duration:500,easing:'cubic-bezier(.2,.9,.3,1.2)',fill:'forwards'});SFX.whistle();vib(80);
  while(left>0){if(!await c.wait(1000))return;left--;show();SFX.tick(left<=5?.3:.12);
    if(a.args.includes('逆転')&&left===3){hs+=2;const hb=sb.querySelector('.h');hb.textContent=hs;hb.animate([{transform:'scale(2)',color:'#ffe08a'},{transform:'none'}],{duration:700});flash('rgba(255,230,140,.5)',500);vib([60,40,60]);SFX.pling()}}
  SFX.buzzer();vib(600);sb.classList.add('end');flash('#fff',400,.6);await c.wait(1500);
}};

/* ===== 寄せ書き（色紙に、いろんな字・色で書き足されていく） ===== */
BLOCKS.add('寄せ書き');
const YCOL=['#d6336c','#1c7ed6','#2b8a3e','#e8590c','#7048e8','#c2255c','#0b7285','#5c940d'];
BR['寄せ書き']=(a,L)=>`<div class="blk shikishi" data-fx="寄せ書き" data-a="${encA(a)}" data-lines="${encA(L)}"><div class="shc">${esc(a.題||'')}</div></div>`;
D['寄せ書き']={
  still(el){D['寄せ書き'].lay(el,true)},
  lay(el,now_){const L=JSON.parse(el.dataset.lines),out=[];
    L.forEach((l,i)=>{const ang=(i/L.length)*Math.PI*2+rnd(-.2,.2),r=rnd(30,40);const d=document.createElement('div');d.className='shm';
      d.style.cssText=`left:${50+Math.cos(ang)*r}%;top:${50+Math.sin(ang)*r*.9}%;color:${YCOL[i%YCOL.length]};font-size:${rnd(12,16)|0}px;transform:translate(-50%,-50%) rotate(${(Math.cos(ang)*rnd(10,25))|0}deg)`;
      d.textContent=now_?l:'';d.dataset.t=l;el.appendChild(d);out.push(d)});return out},
  async run(el,a,c){
    const ms=this.lay(el,false);el.querySelector('.shc').animate([{opacity:0,transform:'scale(.6)'},{opacity:1,transform:'none'}],{duration:800});
    for(const d of ms){if(!await c.wait(500))return;for(const ch of d.dataset.t){d.textContent+=ch;if(Math.random()<.5)SFX.pen();if(!await c.wait(rnd(50,90)))return}}
  }
};

/* ===== 写真：ポラロイドが、じわっと浮かび上がる（中身は今の背景を使う） ===== */
D['写真']={async run(el,a,c){
  const L=c.layer();const img=getComputedStyle($('bg')).backgroundImage;
  L.innerHTML=`<div class="polaroid"><div class="ph" style="background-image:${img.replace(/"/g,"'")}"></div><div class="pc">${esc(a.文||'')}</div></div>`;
  const p=L.firstChild,ph=p.querySelector('.ph');SFX.swish();vib(30);
  p.animate([{transform:'translate(-50%,-50%) rotate(-25deg) translateY(-120%)'},{transform:'translate(-50%,-50%) rotate(-4deg)'}],{duration:800,easing:'cubic-bezier(.2,.9,.3,1.1)',fill:'forwards'});
  ph.animate([{filter:'brightness(3) contrast(.2) sepia(1) blur(4px)'},{filter:'brightness(1.4) contrast(.6) sepia(.6) blur(2px)',offset:.5},{filter:'brightness(1) contrast(1) sepia(.15) blur(0)'}],{duration:5000,fill:'forwards'});
  await c.wait(5500);
}};

/* ===== 疾走：自転車で坂を下るように、風を切る ===== */
D['疾走']={async run(el,a,c){
  const L=c.layer(),cv=document.createElement('canvas'),dpr=Math.min(2,devicePixelRatio||1);L.appendChild(cv);
  const W=L.clientWidth,H=L.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.cssText='width:100%;height:100%';const x=cv.getContext('2d');x.scale(dpr,dpr);
  const S2=Array.from({length:50},()=>({x:rnd(0,W),y:rnd(0,H),l:rnd(40,160),v:rnd(600,1400)}));let last=performance.now();SFX.wind(+a.秒||5);
  page.animate([{transform:'skewX(0)',filter:'blur(0)'},{transform:'skewX(-4deg) translateX(-6px)',filter:'blur(.4px)',offset:.2},{transform:'skewX(-4deg) translateX(-6px)',filter:'blur(.4px)',offset:.8},{transform:'none',filter:'blur(0)'}],{duration:(+a.秒||5)*1000});
  c.raf(t=>{const dt=Math.min(.05,(t-last)/1000);last=t;x.clearRect(0,0,W,H);x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=1.2;x.beginPath();
    for(const s of S2){s.x-=s.v*dt;if(s.x+s.l<0){s.x=W+rnd(0,100);s.y=rnd(0,H)}x.moveTo(s.x,s.y);x.lineTo(s.x+s.l,s.y)}x.stroke()});
  await c.wait((+a.秒||5)*1000);L.animate([{opacity:1},{opacity:0}],{duration:600,fill:'forwards'});
}};

/* ===== 花火：上がって、開いて、少し遅れて音が届く。光で文字が照らされる ===== */
D['花火']={run(el,a,c){
  const L=c.layer(),cv=document.createElement('canvas'),dpr=Math.min(2,devicePixelRatio||1);L.appendChild(cv);
  const W=L.clientWidth,H=L.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.cssText='width:100%;height:100%';const x=cv.getContext('2d');x.scale(dpr,dpr);
  const R=[],P=[],COL=['#ffcf4a','#ff6b8b','#7ad7ff','#b98cff','#9dff8a','#ffffff'];let last=performance.now();
  const launch=()=>{R.push({x:rnd(W*.2,W*.8),y:H,vy:-rnd(420,560),ty:rnd(H*.12,H*.38),col:pick(COL)})};
  (async()=>{if(!await c.wait(500))return;let n=0;while(!c.dead&&n<(+a.数||8)){launch();n++;if(!await c.wait(rnd(900,1800)))return}})();
  c.raf(t=>{const dt=Math.min(.05,(t-last)/1000);last=t;x.globalCompositeOperation='destination-out';x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,0,W,H);x.globalCompositeOperation='lighter';
    for(let i=R.length-1;i>=0;i--){const r=R[i];r.y+=r.vy*dt;x.fillStyle='#ffe9b0';x.fillRect(r.x,r.y,2,6);
      if(r.y<=r.ty){R.splice(i,1);const n=rnd(60,110)|0;for(let k=0;k<n;k++){const an=k/n*Math.PI*2,sp=rnd(80,220);P.push({x:r.x,y:r.y,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp,l:rnd(1.2,2),c:r.col})}
        SFX.firework(.55);vib(40);page.animate([{textShadow:`0 0 18px ${r.col},0 1px 3px #000`},{textShadow:'0 1px 3px #000,0 0 10px rgba(0,0,0,.9)'}],{duration:1400});
        const fl=c.layer();fl.style.background=`radial-gradient(circle at ${(r.x/W*100)|0}% ${(r.y/H*100)|0}%,${r.col}55,transparent 60%)`;fl.animate([{opacity:1},{opacity:0}],{duration:1200,fill:'forwards'}).finished.then(()=>fl.remove())}}
    for(let i=P.length-1;i>=0;i--){const p=P[i];p.vy+=90*dt;p.vx*=.985;p.vy*=.985;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;if(p.l<=0){P.splice(i,1);continue}x.globalAlpha=Math.min(1,p.l);x.fillStyle=p.c;x.fillRect(p.x,p.y,2.2,2.2)}
    x.globalAlpha=1;x.globalCompositeOperation='source-over'});
}};

/* ===== 涙：視界がじわっとにじんで、こぼれる（水滴の絵ではなく「見え方」で泣く） ===== */
/* 落ちたところの文字は、レンズを通したように少し大きくゆがむ。target を渡すと、その中に落ちる */
function tearVision(c,{times=99,target=null}={}){
  const L=c.layer('tv');L.innerHTML='<div class="tvb"></div>';const b=L.firstChild;
  const lens=el=>{const r=(target||page).getBoundingClientRect(),x=rnd(r.left+r.width*.15,r.right-r.width*.15),y=rnd(r.top+r.height*.2,r.bottom-r.height*.15);
    /* 落ちた点のまわりの字（本文なら1文字ずつ、トークなら吹き出しごと）をゆがませる */
    const cand=[...(target||page).querySelectorAll(target?'.bb,.tkin':'.tc.on')].filter(e=>{const q=e.getBoundingClientRect();return Math.hypot(q.left+q.width/2-x,q.top+q.height/2-y)<(target?60:36)});
    cand.forEach(e=>{e.style.transition='transform .25s,filter .25s';e.style.transform=`scale(${target?1.12:1.3})`;e.style.filter='blur(.7px) brightness(1.15)';e.style.display=e.classList.contains('tc')?'inline-block':''});
    const fr=c.layer();const rim=document.createElement('i');rim.className='tvrim';rim.style.left=x+'px';rim.style.top=y+'px';fr.appendChild(rim);
    rim.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:0},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.2},{opacity:.9,offset:.7},{transform:'translate(-50%,-50%) scale(1.05) translateY(6px)',opacity:0}],{duration:3800,fill:'forwards'});
    c.wait(3600).then(()=>{cand.forEach(e=>{e.style.transform='';e.style.filter=''});fr.remove()})};
  (async()=>{for(let k=0;k<times&&!c.dead;k++){
    /* じわっと、下からにじんでくる */
    const t0=performance.now(),dur=rnd(3800,5200);
    await new Promise(res=>c.raf(t=>{const p=Math.min(1,(t-t0)/dur),e=p*p;b.style.height=(18+e*62)+'%';b.style.backdropFilter=b.style.webkitBackdropFilter=`blur(${(e*5).toFixed(2)}px) brightness(${(1+e*.08).toFixed(3)})`;if(p>=1){res();return false}}));
    if(c.dead)return;
    /* まばたき：一瞬はっきり見えて、ぽたっと落ちる */
    b.animate([{opacity:1},{opacity:0}],{duration:160,fill:'forwards'});L.animate([{background:'rgba(0,0,0,0)'},{background:'rgba(0,0,0,.35)',offset:.4},{background:'rgba(0,0,0,0)'}],{duration:260});
    SFX.drip(.35);vib(15);lens();
    if(!await c.wait(700))return;b.style.height='0%';b.style.backdropFilter=b.style.webkitBackdropFilter='none';b.animate([{opacity:0},{opacity:1}],{duration:10,fill:'forwards'});
    if(!await c.wait(rnd(2200,4200)))return}})();
}
D['涙目']={run(el,a,c){tearVision(c,{times:+a.回数||99})}};
Object.assign(SFX,{
  bell:snd((d=3)=>{const t=now(),o=A.ctx.createOscillator(),g=A.ctx.createGain(),l=A.ctx.createOscillator(),lg=A.ctx.createGain();o.type='square';o.frequency.value=1250;l.type='square';l.frequency.value=22;lg.gain.value=.5;
    const m=A.ctx.createGain();m.gain.value=.5;l.connect(lg);lg.connect(m.gain);o.connect(m);m.connect(g);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.05);g.gain.setValueAtTime(.05,t+d);g.gain.linearRampToValueAtTime(0,t+d+.1);g.connect(A.bus);o.start(t);l.start(t);o.stop(t+d+.2);l.stop(t+d+.2)}),
  pon:snd(()=>{const t=now();tone('sine',659,t,1.2,.12,{a:.01});tone('sine',523,t+.5,1.6,.12,{a:.01})})
});

/* ===== アイドル系（どのジャンルでも使える） ===== */
Object.assign(SFX,{
  crowd:snd((d=3,v=.25)=>{const t=now();hiss(t,d,v,{type:'bandpass',f:700,q:.5,a:.4})}),
  cheer:snd((d=2.5)=>{const t=now();hiss(t,d,.5,{type:'bandpass',f:1200,to:2200,q:.4,a:.15});for(let i=0;i<10;i++)tone('sine',rnd(900,1600),t+rnd(0,1),.3,.02,{to:rnd(1600,2400)})}),
  drumroll:snd((d=2.5)=>{const t=now();for(let x=0;x<d;x+=.045)hiss(t+x,.04,.12+x/d*.25,{type:'bandpass',f:220,q:1.5})}),
  shutter:snd(()=>{const t=now();hiss(t,.03,.4,{type:'highpass',f:3000});hiss(t+.06,.05,.3,{f:1500,q:2})}),
  ping:snd(()=>{const t=now();tone('sine',1760,t,.12,.08);tone('sine',2349,t+.07,.18,.07)})
});
const mkCanvas=L=>{const cv=document.createElement('canvas'),dpr=Math.min(2,devicePixelRatio||1);L.appendChild(cv);const W=L.clientWidth,H=L.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.cssText='width:100%;height:100%;display:block';const x=cv.getContext('2d');x.scale(dpr,dpr);return{x,W,H}};

/* ===== 赤い警告（mk2 の赤 SYSTEM を応用）：ドン／3連／点滅／増殖 ===== */
const WARN_ICON='<svg viewBox="0 0 24 22" class="wi"><path d="M12 1 23 21H1z" fill="#e53935"/><rect x="10.8" y="7" width="2.4" height="8" rx="1.2" fill="#fff"/><circle cx="12" cy="18" r="1.4" fill="#fff"/></svg>';
function warnBox(L,txt,{size=1,rot=0,x=50,y=45,op=1}={}){const d=document.createElement('div');d.className='wbox';d.innerHTML=WARN_ICON+`<span>${esc(txt)}</span>`;
  d.style.cssText=`left:${x}%;top:${y}%;font-size:${(18*size).toFixed(1)}px;opacity:${op};transform:translate(-50%,-50%) rotate(${rot}deg)`;L.appendChild(d);return d}
D['赤警告']={async run(el,a,c){
  const txt=a.文||'警告：異常が発生しています',mode=a.args.find(k=>['ドン','3連','点滅','増殖'].includes(k))||'ドン',L=c.layer('wl');
  const slam=d=>{d.animate([{transform:d.style.transform+' scale(1.6)',opacity:0},{transform:d.style.transform+' scale(1)',opacity:1}],{duration:180,easing:'cubic-bezier(.2,1.4,.4,1)'});SFX.bang(.7);SFX.warn();vib(70);shake(5,200)};
  if(mode==='ドン'){slam(warnBox(L,txt,{size:1.2}));await c.wait(2200);L.animate([{opacity:1},{opacity:0}],{duration:400,fill:'forwards'});return}
  if(mode==='3連'){for(let i=0;i<3;i++){slam(warnBox(L,txt,{size:1,y:32+i*14,rot:rnd(-4,4)}));if(!await c.wait(260))return}await c.wait(1800);L.animate([{opacity:1},{opacity:0}],{duration:400,fill:'forwards'});return}
  if(mode==='点滅'){L.innerHTML='<div class="wband t"><span></span></div><div class="wband b"><span></span></div><div class="wflash"></div>';
    L.querySelectorAll('.wband span').forEach(s=>s.textContent=('⚠ WARNING　').repeat(14));SFX.alarm();vib([100,80,100,80,100]);
    const fl=L.querySelector('.wflash');fl.animate([{opacity:0},{opacity:.35}],{duration:450,iterations:8,direction:'alternate'});const b=warnBox(L,txt,{size:1.1});slam(b);
    for(let i=0;i<6;i++){b.style.visibility=i%2?'hidden':'';if(i%2===0)SFX.warn();if(!await c.wait(380))return}b.style.visibility='';await c.wait(1200);L.animate([{opacity:1},{opacity:0}],{duration:500,fill:'forwards'});return}
  /* 増殖：箱がどんどん重なって画面を埋め尽くす。奥ほど薄い */
  let iv=420;const n=+a.数||60;
  for(let i=0;i<n;i++){const d=warnBox(L,txt,{size:rnd(.7,2.1),rot:rnd(-32,32),x:rnd(5,95),y:rnd(5,95)});slam(d);
    L.querySelectorAll('.wbox').forEach((b,k,all)=>{const age=all.length-k;b.style.opacity=Math.max(.15,1-age*.05)});
    if(!await c.wait(iv))return;iv=Math.max(60,iv*.9)}
  await c.wait(1500);
}};

/* ===== スマホの通知（どこでも使える） ===== */
D['通知']={async run(el,a,c){
  const L=c.layer();L.innerHTML=`<div class="ntf"><i style="background:${esc(a.色||'#e3266f')}">${esc(a.印||'●')}</i><div><b>${esc(a.アプリ||'お知らせ')}・いま</b>${esc(a.文||'')}</div></div>`;
  const n=L.firstChild;SFX.notif();vib([30,60,30]);
  n.animate([{transform:'translateY(-130%)'},{transform:'none'}],{duration:450,easing:'cubic-bezier(.2,.9,.3,1.2)',fill:'forwards'});
  c.wait(+a.秒*1000||3800).then(ok=>ok&&n.animate([{transform:'none'},{transform:'translateY(-130%)'}],{duration:400,fill:'forwards'}));
  await c.wait(1200);
}};

/* ===== ライブ：開演（ステージの写真が、暗闇から一気に光る） ===== */
D['開演']={async run(el,a,c){
  const L=c.layer();L.style.background='#000';
  SFX.crowd(3,.22);vib(30);page.style.transition='opacity .6s';page.style.opacity=.15;
  if(!await c.wait(2200))return;
  /* ざわめきが静まって、一瞬の無音 */
  if(!await c.wait(900))return;
  SFX.boom();SFX.cheer(3);vib([80,40,200]);flash('#fff',300,.9);
  L.animate([{opacity:1},{opacity:0}],{duration:1400,fill:'forwards',easing:'ease-out'});
  $('bg').animate([{filter:'brightness(2.2) saturate(1.4)'},{filter:'brightness(1)'}],{duration:1800});
  page.style.opacity='';await c.wait(1600);
}};

/* ===== ペンライトの海（客席の写真を、曲に合わせて揺らして光らせる）
   ［ペンライト 推し色=#ff4fa0 変わる=4］で一斉に推しの色へ。［ペンライト なし=#ff4fa0］でその色だけ消える ===== */
D['ペンライト']={run(el,a,c){
  const bg=$('bg'),L=c.under('pl');
  L.innerHTML='<div class="pltint"></div><div class="plg"></div>';const tint=L.firstChild,glow=L.lastChild;
  const sw=bg.animate([{transform:'rotate(-.5deg) scale(1.05)'},{transform:'rotate(.5deg) scale(1.05)'}],{duration:850,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});c.on(()=>sw.cancel());
  glow.animate([{opacity:.35},{opacity:1}],{duration:425,iterations:Infinity,direction:'alternate'});
  if(a.なし){tint.style.background='radial-gradient(40% 30% at 20% 70%,#3d7bff,transparent 70%),radial-gradient(40% 30% at 70% 80%,#ffd23d,transparent 70%),radial-gradient(40% 30% at 45% 95%,#36d27a,transparent 70%),radial-gradient(50% 30% at 85% 60%,#9b6bff,transparent 70%),linear-gradient(#3d7bff,#3d7bff)';tint.style.opacity=1;glow.style.background='radial-gradient(120% 55% at 50% 100%,rgba(120,170,255,.3),transparent 70%)'}
  else{tint.style.background='radial-gradient(30% 22% at 15% 75%,#4fc3ff,transparent 70%),radial-gradient(30% 22% at 55% 90%,#ffe04f,transparent 70%),radial-gradient(30% 22% at 85% 70%,#9b6bff,transparent 70%),radial-gradient(30% 22% at 35% 60%,#5dff9a,transparent 70%)';tint.style.opacity=.9}
  if(a.推し色)c.wait((parseFloat(a.変わる)||4)*1000).then(ok=>{if(!ok)return;
    tint.animate([{opacity:.9},{opacity:0}],{duration:600,fill:'forwards'});
    const one=document.createElement('div');one.className='pltint';one.style.background=a.推し色;L.prepend(one);one.animate([{opacity:0},{opacity:1}],{duration:500,fill:'forwards'});
    glow.style.background=`radial-gradient(120% 55% at 50% 100%,${a.推し色}88,transparent 70%)`;SFX.cheer(2);flash(a.推し色,500,.35);vib([40,40,120])});
  L.animate([{opacity:0},{opacity:1}],{duration:1200});
}};

/* ===== 銀テープ（金と銀のテープが、上から降ってくる） ===== */
D['銀テープ']={run(el,a,c){
  const L=c.layer();SFX.boom();SFX.cheer(3);vib([60,40,160]);flash('#fff',250,.6);
  const drop=(src,delay,dur,scale,x)=>{const i=document.createElement('img');i.src=`a/${src}.webp`;i.alt='';i.style.cssText=`position:absolute;left:${x}%;top:0;width:${scale*100}%;transform:translate(-50%,-100%);opacity:0`;L.appendChild(i);
    i.animate([{transform:'translate(-50%,-100%) rotate(-4deg)',opacity:1},{transform:`translate(-50%,${rnd(10,30)|0}%) rotate(3deg)`,opacity:1,offset:.7},{transform:'translate(-50%,60%) rotate(-2deg)',opacity:0}],{duration:dur,delay,easing:'cubic-bezier(.3,.1,.5,1)',fill:'forwards'})};
  drop('tape1',0,5200,1.1,50);drop('tape2',500,6000,1.3,35);drop('tape1',1200,5600,.9,70);drop('tape2',2200,6400,1.2,55);
}};

/* ===== チェキ（ぼかした写真に、落書きが書き込まれる）・握手会の残り時間 ===== */
D['チェキ']={async run(el,a,c){
  const L=c.layer();
  L.innerHTML=`<div class="cheki2"><img src="a/cheki.jpg" alt=""><svg class="doodle" viewBox="0 0 100 100"><path d="M16 22c4-8 14-6 12 2-2 7-12 10-12 10s-10-3-12-10c-2-8 8-10 12-2z" fill="none" stroke="#ff4fa0" stroke-width="2.4"/><path d="M60 72c5-8 10 3 15-5 3-6 9 2 13-4" fill="none" stroke="#4fc3ff" stroke-width="2.6" stroke-linecap="round"/><path d="M76 14l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="none" stroke="#ffd34f" stroke-width="2"/></svg><div class="pc">${esc(a.文||'')}</div></div>`;
  const p=L.firstChild,im=p.querySelector('img');SFX.shutter();flash('#fff',220,.9);
  p.animate([{transform:'translate(-50%,-50%) rotate(12deg) translateY(-110%)'},{transform:'translate(-50%,-50%) rotate(3deg)'}],{duration:700,easing:'cubic-bezier(.2,.9,.3,1.1)',fill:'forwards'});
  im.animate([{filter:'brightness(2.4) contrast(.3)'},{filter:'brightness(1) contrast(1)'}],{duration:3500,fill:'forwards'});
  p.querySelectorAll('.doodle path').forEach((d,i)=>{const len=d.getTotalLength();d.style.strokeDasharray=len;d.style.strokeDashoffset=len;d.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:900,delay:2600+i*700,fill:'forwards'})});
  if(a.残り){const tm=document.createElement('div');tm.className='hstm';L.appendChild(tm);let s=+a.残り;const show=()=>{tm.textContent=`残り ${s}秒`;tm.classList.toggle('low',s<=3)};show();
    while(s>0){if(!await c.wait(1000))return;s--;show();SFX.tick(.15)}tm.textContent='お時間です';SFX.pling();vib(80)}
  await c.wait(1500);
}};
/* ===== コール：掛け声が画面に飛び出す ===== */
D['コール']={async run(el,a,c){
  const L=c.layer('call'),words=(a.文||'せーの！／L・O・V・E！').split('／');
  for(const w of words){const d=document.createElement('div');d.className='cw';d.textContent=w;d.style.color=pick(['#ff4fa0','#4fc3ff','#ffe04f','#9b6bff']);d.style.top=rnd(25,60)+'%';d.style.transform=`translate(-50%,-50%) rotate(${rnd(-10,10)|0}deg)`;L.appendChild(d);
    d.animate([{transform:d.style.transform+' scale(.3)',opacity:0},{transform:d.style.transform+' scale(1.15)',opacity:1,offset:.25},{transform:d.style.transform+' scale(1)',opacity:1,offset:.7},{transform:d.style.transform+' scale(1.4)',opacity:0}],{duration:1100,fill:'forwards'});
    SFX.thump(.7);SFX.cheer(.6);vib(50);shake(3,150);if(!await c.wait(+a.間*1000||750))return}
}};

/* ===== 推しのソロ：まわりが暗くなって、1人だけ照らされる ===== */
D['ソロ']={run(el,a,c){
  const L=c.layer('solo');L.innerHTML='<div class="sdark"></div>';const pk=c.layer(),{x,W,H}=mkCanvas(pk);
  L.firstChild.animate([{opacity:0},{opacity:1}],{duration:1500,fill:'forwards'});SFX.shimmer(2);
  const P=Array.from({length:60},()=>({x:rnd(W*.3,W*.7),y:rnd(-H,0),v:rnd(20,60),s:rnd(1,2.5),ph:rnd(0,6)}));let last=performance.now();
  c.raf(t=>{const dt=Math.min(.05,(t-last)/1000);last=t;x.clearRect(0,0,W,H);for(const p of P){p.y+=p.v*dt;p.ph+=dt*3;if(p.y>H*.75){p.y=-10;p.x=rnd(W*.3,W*.7)}
    x.globalAlpha=.5+Math.sin(p.ph)*.5;x.fillStyle='#fff6d0';x.beginPath();x.arc(p.x,p.y,p.s,0,7);x.fill()}x.globalAlpha=1});
}};

/* ===== お知らせメール（タップして開く） ===== */
BLOCKS.add('メール');
BR['メール']=(a,L)=>`<div class="blk mail" data-tap data-fx="メール" data-a="${encA(a)}"><div class="mlh">受信トレイ</div><div class="mli"><i></i><div><b>${esc(a.差出人||'')}</b><span>${esc(a.件名||'')}</span></div><small>今</small></div><div class="mlb">${L.map(l=>`<div>${inline(l)||'&nbsp;'}</div>`).join('')}</div></div>`;
D['メール']={
  prep(el){el.querySelector('.mlb').style.display='none'},
  run(el,a,c){return new Promise(async res=>{c.on(()=>res());const it=el.querySelector('.mli'),bd=el.querySelector('.mlb');
    SFX.notif();vib([30,60,30]);it.animate([{transform:'translateX(-30px)',opacity:0},{transform:'none',opacity:1}],{duration:400});it.classList.add('new');
    const hint=document.createElement('div');hint.className='mlhint';hint.textContent='タップして開く';el.insertBefore(hint,bd);
    /* メールのどこを押しても開く（指が少し動いても） */await new Promise(r=>{let done=false;const go=()=>{if(done)return;done=true;r()};el.addEventListener('click',go);el.addEventListener('touchend',e=>{if(e.changedTouches.length)go()},{passive:true});c.on(go)});if(c.dead)return;
    hint.remove();it.classList.remove('new');bd.style.display='';const lines=[...bd.children];lines.forEach(l=>l.style.opacity=0);SFX.swish();
    /* 開いた本文が画面の外に出ないように、見える位置まで送る */bd.scrollIntoView({block:'nearest',behavior:'smooth'});for(const l of lines){l.style.transition='opacity .8s';l.style.opacity=1;keepBottom();if(!await c.wait(700))return}res()})}
};

/* ===== ホンマ（ファンサイト）：昔ながらの個人サイト ===== */
BLOCKS.add('ファンサイト');
BR['ファンサイト']=(a,L)=>`<div class="blk hm" data-fx="ファンサイト" data-a="${encA(a)}"><div class="hmt">${esc(a.名||'')}</div><div class="hmm"><span>${esc(a.流れる||'')}</span></div><div class="hmg">${Array.from({length:6},(_,i)=>`<div class="hmp" style="--h:${i*55}"><i></i></div>`).join('')}</div><div class="hmu">${L.map(l=>`<div>${inline(l)}</div>`).join('')}</div><div class="hmc">あなたは <b>${esc(a.カウンター||'0012345')}</b> 人目の訪問者です</div></div>`;
D['ファンサイト']={async run(el,a,c){
  const ps=[...el.querySelectorAll('.hmp')];ps.forEach(p=>p.style.opacity=0);
  for(const p of ps){p.style.transition='opacity .6s';p.style.opacity=1;SFX.shutter();if(!await c.wait(260))return}
  const n=document.createElement('span');n.className='hmnew';n.textContent='NEW!';ps[0].appendChild(n);SFX.ping();
  const b=el.querySelector('.hmc b');let v=+b.textContent;c.every(700,()=>{v+=Math.random()<.5?1:rnd(2,9)|0;b.textContent=String(v).padStart(7,'0')});
}};

/* ===== SNS のタイムライン（いいねが増える） ===== */
BLOCKS.add('SNS');
const snsRow=(l,i)=>{const m=l.match(/^(@\S+)\s+([^：]+)：(.*?)(?:\s+いいね=(\d+))?$/)||[0,'@user','名無し',l,'0'];
  return`<div class="sp" data-like="${m[4]||0}"><i class="av" style="background:hsl(${(i*67)%360} 60% 65%)"></i><div><div class="sh"><b>${esc(m[2])}</b> <small>${esc(m[1])}</small></div><div class="sb">${inline(m[3])}</div><div class="sa"><span>💬 ${rnd(0,30)|0}</span><span>🔁 ${rnd(0,90)|0}</span><span class="lk">♡ <em>0</em></span></div></div></div>`};
BR['SNS']=(a,L)=>`<div class="blk sns" data-fx="SNS" data-a="${encA(a)}">${L.map(snsRow).join('')}</div>`;
D['SNS']={
  prep(el){el.querySelectorAll('.sp').forEach(p=>p.style.display='none')},
  async run(el,a,c){
    for(const p of el.querySelectorAll('.sp')){if(!await c.wait(900))return;p.style.display='';p.animate([{opacity:0,transform:'translateY(-10px)'},{opacity:1,transform:'none'}],{duration:350});SFX.pop2();keepBottom();
      const to=+p.dataset.like,em=p.querySelector('.lk em');if(!to)continue;const t0=performance.now();
      c.raf(t=>{const k=Math.min(1,(t-t0)/2500),v=Math.round(to*(1-(1-k)**3));em.textContent=v>=10000?(v/10000).toFixed(1)+'万':v.toLocaleString();if(k>=1){p.querySelector('.lk').classList.add('on');return false}})}
  }
};

/* ===== 炎上：リプライが止まらない、通知が99+、トレンド1位、画面が赤い通知で埋まる ===== */
const FIRE=['説明して','ファンやめます','裏切られた','信じてたのに','擁護してる人なに？','証拠は？','デマでしょ','ガチならやばい','運営なにしてんの','もう無理','拡散希望','謝罪まだ？'];
D['炎上']={async run(el,a,c){
  const L=c.layer('fire');L.innerHTML=`<div class="trend">🔥 トレンド <b>1位</b>　#${esc(a.タグ||a.名||'')}</div><div class="badge">0</div>`;
  const badge=L.querySelector('.badge'),tr=L.querySelector('.trend');tr.animate([{transform:'translateY(-120%)'},{transform:'none'}],{duration:500,fill:'forwards'});SFX.warn();vib([50,50,50]);
  let n=0,iv=300;
  for(let i=0;i<(+a.数||90)&&!c.dead;i++){
    const d=document.createElement('div');d.className='frp';d.innerHTML=`<i style="background:hsl(${rnd(0,360)|0} 50% 55%)"></i><b>@${Math.random().toString(36).slice(2,8)}</b> ${esc(pick(FIRE))}`;
    d.style.left=rnd(-5,55)+'%';d.style.top=rnd(10,92)+'%';d.style.transform=`rotate(${rnd(-6,6).toFixed(1)}deg) scale(${rnd(.85,1.25).toFixed(2)})`;if(i>30&&Math.random()<.4)d.classList.add('red');
    L.appendChild(d);if(L.querySelectorAll('.frp').length>120)L.querySelector('.frp').remove();
    n+=rnd(1,4)|0;badge.textContent=n>99?'99+':n;badge.animate([{transform:'scale(1.4)'},{transform:'none'}],{duration:180});
    if(i%4===0)SFX.ping();if(i%10===0)vib(20);
    if(!await c.wait(iv))return;iv=Math.max(25,iv*.95)}
  await c.wait(1200);
}};

/* ===== ファンどうしの対立：引用とリプライの言い合い、タグ合戦 ===== */
BLOCKS.add('対立');
BR['対立']=(a,L)=>`<div class="blk feud" data-fx="対立" data-a="${encA(a)}"><div class="ftg"><div class="fa"><span>#${esc(a.タグA||'')}</span><b></b></div><div class="fb"><span>#${esc(a.タグB||'')}</span><b></b></div></div><div class="fth">${L.map(l=>{const i=l.indexOf('：'),k=l.slice(0,i),v=l.slice(i+1);
  if(k==='消')return`<div class="fp gone">このポストは表示できません</div>`;if(k==='推し')return`<div class="fp oshi"><i></i><div><b>${esc(a.推し||'推し')}</b>${inline(v)}</div></div>`;
  return`<div class="fp ${k==='A'?'a':'b'}"><i></i><div><b>${esc(k==='A'?(a.名A||'Aのファン'):(a.名B||'Bのファン'))}</b>${inline(v)}</div></div>`}).join('')}</div></div>`;
D['対立']={
  prep(el){el.querySelectorAll('.fp').forEach(p=>p.style.display='none')},
  async run(el,a,c){
    const ea=el.querySelector('.fa b'),eb=el.querySelector('.fb b');let va=40,vb=40;
    c.every(300,()=>{va+=rnd(0,6);vb+=rnd(0,6);const s=va+vb;ea.style.width=(va/s*100).toFixed(1)+'%';eb.style.width=(vb/s*100).toFixed(1)+'%'});
    for(const p of el.querySelectorAll('.fp')){
      if(!await c.wait(p.classList.contains('oshi')?2200:900))return;p.style.display='';p.animate([{opacity:0,transform:'translateX(-8px)'},{opacity:1,transform:'none'}],{duration:300});keepBottom();
      if(p.classList.contains('oshi')){SFX.ping();flash('#fff',300,.4);el.classList.add('hush');vib(80);if(A.bus)try{A.bus.gain.setTargetAtTime(.0001,A.ctx.currentTime,.05)}catch(e){}}
      else if(p.classList.contains('gone'))SFX.tick(.2);else{SFX.pop2();vib(15);if(Math.random()<.4)shake(2,150)}}
  }
};

/* ===== 週刊誌：写真なし。大見出しが叩きつけられ、帯と縦書きの記事が並ぶ ===== */
const MAGTXT='関係者によると、二人は数か月前から都内で頻繁に会っていたという。深夜、人目を避けるように同じマンションへ入っていく姿が目撃されている。事務所は「プライベートは本人に任せている」とコメントしたが、ファンの間では動揺が広がっている。';
D['週刊誌']={async run(el,a,c){
  const L=c.layer('mag');
  L.innerHTML=`<div class="mg"><div class="mgn">${esc(a.誌名||'週刊エクスプレス')}</div><div class="mgbd"><div class="mgcol"><div class="mgh"></div><div class="mgs">${esc(a.小見出し||'')}</div><div class="mgo"><span>独占スクープ</span><span>関係者証言</span></div></div><div class="mgt">${esc(a.本文||MAGTXT)}</div></div></div>`;
  const mg=L.firstChild,h=mg.querySelector('.mgh');mg.animate([{transform:'translate(-50%,-50%) rotate(-8deg) scale(.6)',opacity:0},{transform:'translate(-50%,-50%) rotate(-2deg)',opacity:1}],{duration:500,easing:'cubic-bezier(.2,1.2,.4,1)',fill:'forwards'});
  SFX.swish();if(!await c.wait(500))return;
  for(const ch of a.見出し||'熱愛発覚！'){const s=document.createElement('span');s.textContent=ch;h.appendChild(s);s.animate([{transform:'scale(2.4)',opacity:0},{transform:'none',opacity:1}],{duration:160,easing:'cubic-bezier(.2,1.5,.4,1)'});SFX.thump(.5);vib(25);if(!await c.wait(180))return}
  shake(5,250);mg.querySelector('.mgs').animate([{opacity:0},{opacity:1}],{duration:600,fill:'forwards'});
  mg.querySelectorAll('.mgo span').forEach((s,i)=>s.animate([{transform:'scaleX(0)'},{transform:'none'}],{duration:300,delay:400+i*250,fill:'backwards'}));
  mg.querySelector('.mgt').animate([{opacity:0},{opacity:1}],{duration:1200,delay:600,fill:'backwards'});
  await c.wait(3200);
}};

/* ===== タレコミ・暴露：匿名の長文投稿、ぼかした証拠、止まらない拡散、遅れて付く「真偽不明」 =====
   中に1行ずつ噂を書く。［タレコミ 名=… 題=… 証拠=卒アル／当時のLINE］ */
BLOCKS.add('タレコミ');
const TRPL=[['やっぱりな','b'],['ソースは？','n'],['同級生だけどデマだよ','d'],['こわ','n'],['前から怪しいと思ってた','b'],['信じてたのに','b'],['拡散します','b'],['デマ流すな','d'],['通報した','d'],['事実なら脱退して','b'],['まだ決めつけるのは早い','d'],['証拠もっと出して','n'],['うわ…','n'],['推し変します','b']];
BR['タレコミ']=(a,L)=>{const ev=(a.証拠||'').split('／').filter(Boolean);
  return`<div class="blk leak" data-fx="タレコミ" data-a="${encA(a)}"><div class="lkh"><i></i><div><b>${esc(a.名||'匿名')}</b><small>@${esc(a.ID||'throwaway_0'+(Math.random()*900+100|0))}・今</small></div></div><div class="lkt">${esc(a.題||'')}</div><ul>${L.map(l=>`<li>${inline(l)}</li>`).join('')}</ul>${ev.length?`<div class="lke">${ev.map(e=>`<div><span>${esc(e)}</span><em>閲覧注意</em></div>`).join('')}</div>`:''}<div class="lkn">※この情報は、真偽が確認されていません</div><div class="lka"><span>💬 <b class="r">0</b></span><span>🔁 <b class="q">0</b></span><span>♡ <b class="l">0</b></span><span>👁 <b class="v">0</b></span></div></div>`};
D['タレコミ']={
  prep(el){el.querySelectorAll('li,.lke,.lkn').forEach(e=>e.style.display='none')},
  still(el){el.classList.add('done')},
  async run(el,a,c){
    SFX.notif();el.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:400});
    /* 箇条書きが、1つずつ書き込まれていく */
    for(const li of el.querySelectorAll('li')){if(!await c.wait(700))return;li.style.display='';const t=li.textContent;li.textContent='';for(const ch of t){li.textContent+=ch;if(Math.random()<.4)SFX.type();if(!await c.wait(28))return}keepBottom()}
    const ev=el.querySelector('.lke');if(ev){if(!await c.wait(500))return;ev.style.display='';ev.animate([{opacity:0},{opacity:1}],{duration:500});SFX.shutter();keepBottom()}
    /* 拡散が止まらない */
    const cnt={r:0,q:0,l:0,v:0},B=k=>el.querySelector('.lka .'+k),fmt=v=>v>=10000?(v/10000).toFixed(1)+'万':v.toLocaleString();
    c.every(120,()=>{cnt.v+=rnd(400,2600)|0;cnt.q+=rnd(5,60)|0;cnt.r+=rnd(3,40)|0;cnt.l+=rnd(4,50)|0;for(const k in cnt)B(k).textContent=fmt(cnt[k])});
    const L=c.layer('leakfl');let iv=420;const t0=performance.now();
    (async()=>{while(!c.dead){const [t,k]=pick(TRPL),d=document.createElement('div');d.className='lkr '+k;d.innerHTML=`<i style="background:hsl(${rnd(0,360)|0} 45% 60%)"></i>${esc(t)}`;
      d.style.left=rnd(2,52)+'%';d.style.top=rnd(12,88)+'%';d.style.transform=`rotate(${rnd(-4,4).toFixed(1)}deg)`;L.appendChild(d);
      d.animate([{opacity:0,transform:d.style.transform+' scale(.8)'},{opacity:1,transform:d.style.transform}],{duration:220});
      if(L.children.length>40)L.firstChild.remove();if(Math.random()<.3)SFX.ping();if(!await c.wait(iv))return;iv=Math.max(90,iv*.94)}})();
    /* もう拡散したあとで、やっと「真偽不明」のラベルが付く */
    if(!await c.wait(6500))return;const lb=el.querySelector('.lkn');lb.style.display='';lb.animate([{transform:'scaleY(0)'},{transform:'none'}],{duration:300});SFX.tick(.3);
    await c.wait(2500);
  }
};

/* ===== サバイバル番組の発表（番組の流れで見せる） =====
   メンバーは「名前 票数 色」を1行ずつ。名前の頭に★を付けると主人公。
   流れ：司会のテロップ → 照明が落ちる → ドラムロール、スクリーンに候補のシルエットが切り替わる
         → 「第〇位は――」で無音 → 名前と票数がドン → 席にスポット、カメラが寄る → 紙吹雪 */
/* 名前に合うシルエットを選ぶ：女の子らしい名前は女性の絵、男の名前は男性の絵。同じページで同じ人に同じ絵、ちがう人にはちがう絵 */
const SILF=[2,4,7,12,13,17,18,19,20],SILM=[1,3,5,6,8,9,11,14,16],SILMAP={},SILUSE={F:0,M:0};
const silGender=s=>{s=String(s).replace(/^[★◎☆]/,'').trim();
  if(/^[A-Z][A-Z .]+$/.test(s)||/(郎|太|介|也|斗|翔|修|輝|樹|蓮|彦|雄|夫|男|司|士|助|吾|平|哉)$/.test(s)||/^(レン|リク|ソラ|カイ|ハヌル|ドヒョン|ミンジュン|ジュン|ユウ|ケイ|タク|リオ|ノア|レオ)/.test(s))return'M';
  return'F'};
const pIdx=s=>{s=String(s).replace(/^[★◎☆]/,'').trim();if(SILMAP[s])return SILMAP[s];const g=silGender(s),pool=g==='F'?SILF:SILM;return SILMAP[s]=pool[SILUSE[g]++%pool.length]};
const SILSVG=(col,id)=>`<i class="sil2 silp" style="background-image:url(a/p${pIdx(id)}.jpg);--c:${col}"></i>`;
let silN=0;
const parseMembers=L=>L.map(l=>{const p=l.trim().split(/\s+/);const me=p[0].startsWith('★');return{name:p[0].replace('★',''),votes:+p[1]||0,col:p[2]||pick(['#ff4fa0','#4fc3ff','#ffe04f','#9b6bff','#5dff9a','#ff8a3d']),me}});
/* 結果の一覧（演出オフのときと、発表が終わったあとの本文に残る） */
const resultHTML=(ms,title)=>`<div class="rsl"><div class="rslh">${esc(title||'')}</div>${ms.map((m,i)=>`<div class="rsr${m.me?' me':''}"><b>${i+1}</b><i style="background:${m.col}"></i><span>${esc(m.name)}</span><em>${m.votes?m.votes.toLocaleString()+'票':''}</em></div>`).join('')}</div>`;
/* スタジオの写真の上の、ひな壇の席の位置（写真の中での割合） */
const seatXY=k=>{let r=1,n=k;while(n>2*r-1){n-=2*r-1;r++}const j=n-1;return[.4995+(j-(r-1))*.0744,.302+(r-1)*.0377]};
function bgPoint(fx,fy){const b=$('bg').getBoundingClientRect(),s=Math.max(b.width/720,b.height/1279),w=720*s,h=1279*s;return[b.left+(b.width-w)/2+fx*w,b.top+(b.height-h)/2+fy*h,b]}
/* 番組のセット：スクリーン・テロップ・名前 */
function showSet(c){
  if(c.show&&c.show.L.isConnected)return c.show;
  const L=c.layer('show');L.innerHTML=`<div class="scrn"><div class="scin"></div><div class="scl"></div></div><div class="telop"><span></span></div><div class="rkn"><div class="rkl"></div><div class="rkm"></div><div class="rkv"></div></div><div class="dim"></div>`;
  const S={L,scr:L.querySelector('.scin'),scl:L.querySelector('.scl'),tel:L.querySelector('.telop'),tels:L.querySelector('.telop span'),rk:L.querySelector('.rkn'),dim:L.querySelector('.dim')};
  S.say=async t=>{S.tels.textContent='';S.tel.classList.add('on');for(const ch of t){S.tels.textContent+=ch;if(!await c.wait(45))return}};
  S.card=(m,big)=>{S.scr.innerHTML=`<div class="scc${big?' big':''}" style="--c:${m.col}">${SILSVG(m.col,m.name)}<div><b>${esc(m.name)}</b>${big&&m.votes?`<em>${m.votes.toLocaleString()}票</em>`:''}</div></div>`};
  S.lights=on=>{S.dim.style.opacity=on?0:.62};
  page.style.transition='opacity .8s';page.style.opacity=.08;c.on(()=>{page.style.opacity=''});
  L.animate([{opacity:0},{opacity:1}],{duration:600});return c.show=S;
}
const quiet=(c,on)=>{if(A.bus)try{A.bus.gain.setTargetAtTime(on?.0001:1,A.ctx.currentTime,on?.04:.02)}catch(e){}};
/* 1人ぶんの発表。cands=まだ呼ばれていない候補、len=溜めの長さ */
async function announce(c,S,m,{label,cands,len=2.2,seat=0,top=false}){
  await S.say(`${label}の発表です`);if(c.dead)return false;
  S.lights(false);SFX.drumroll(len+.4);vib(30);
  const t0=performance.now();let k=0;
  while(performance.now()-t0<len*1000){const x=cands.length?cands[k++%cands.length]:m;S.card(x);S.scr.firstChild.animate([{opacity:.3},{opacity:1}],{duration:120});SFX.tick(.06);if(!await c.wait(Math.max(90,260-k*8)))return false}
  await S.say(`${label}は――`);S.scr.innerHTML='';quiet(c,true);if(!await c.wait(top?2200:1100))return false;quiet(c,false);
  /* ドン */
  S.card(m,true);S.lights(true);S.rk.querySelector('.rkl').textContent=label;const nm=S.rk.querySelector('.rkm');nm.textContent=m.name;nm.style.setProperty('--c',m.col);
  S.rk.classList.remove('on');void S.rk.offsetWidth;S.rk.classList.add('on');
  const v=S.rk.querySelector('.rkv'),t1=performance.now();c.raf(t=>{const p=Math.min(1,(t-t1)/900);v.textContent=m.votes?Math.round(m.votes*(1-(1-p)**3)).toLocaleString()+'票':'';if(p>=1)return false});
  SFX.boom();(top?SFX.fanfare:SFX.pling)();SFX.cheer(top?3:1.6);flash(top?'#fff3c0':'#ffffff',top?600:300,top?.8:.5);vib(top?[80,40,260]:[60,30,100]);
  if(top)confetti(c,200);else if(seat<=3)confetti(c,70);
  /* 席にスポット、カメラが寄る */
  if(seat){const[fx,fy]=seatXY(seat),[sx,sy,b]=bgPoint(fx,fy),bg=$('bg'),ox=((sx-b.left)/b.width*100).toFixed(1),oy=((sy-b.top)/b.height*100).toFixed(1);
    const sp=c.under('');sp.style.background=`radial-gradient(9% 7% at ${((sx-b.left)/b.width*100).toFixed(1)}% ${((sy-b.top)/b.height*100).toFixed(1)}%,rgba(255,250,220,.9),rgba(255,240,180,.35) 45%,transparent 75%)`;sp.style.mixBlendMode='screen';
    bg.style.transformOrigin=`${ox}% ${oy}%`;bg.animate([{transform:'scale(1)'},{transform:'scale(1.55)',offset:.35},{transform:'scale(1.55)',offset:.75},{transform:'scale(1)'}],{duration:3200,easing:'cubic-bezier(.4,0,.2,1)'});
    sp.animate([{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.8},{opacity:.35}],{duration:3200,fill:'forwards'})}
  if(!await c.wait(top?3600:2600))return false;S.rk.classList.remove('on');S.tel.classList.remove('on');return true;
}
function addTally(S,m,rank){const d=document.createElement('div');d.className='tal'+(m.me?' me':'');d.innerHTML=`<b>${rank}</b><i style="background:${m.col}"></i>${esc(m.name)}`;S.scl.prepend(d);d.animate([{opacity:0,transform:'translateX(-10px)'},{opacity:1,transform:'none'}],{duration:300})}

/* 順位発表（ランキング・ピラミッド共通）。下の順位から1人ずつ。1位は溜めが長い */
async function rankShow(el,a,c,ms){
  const S=showSet(c);S.lights(false);
  for(let i=ms.length-1;i>=0;i--){const m=ms[i],top=i===0,cands=ms.slice(0,i+1);
    if(!await announce(c,S,m,{label:`第${i+1}位`,cands,len:top?4:1.6+(ms.length-i)*.1,seat:a.args.includes('席なし')?0:i+1,top}))return;addTally(S,m,i+1)}
  await c.wait(800);el.classList.add('done');
}
for(const k of ['ランキング','ピラミッド']){BLOCKS.add(k);
  BR[k]=(a,L)=>`<div class="blk show2" data-fx="${k}" data-a="${encA(a)}" data-m="${encA(parseMembers(L))}">${resultHTML(parseMembers(L),a.題)}</div>`;
  D[k]={prep(el){},async run(el,a,c){if(!$('bg').dataset.k||!/スタジオ/.test($('bg').dataset.k)){setBg('スタジオ',true);await c.wait(800)}await rankShow(el,a,c,JSON.parse(el.dataset.m));page.style.opacity=''}}}

/* センター発表 */
D['センター']={async run(el,a,c){
  const S=showSet(c),m={name:a.名||'',votes:0,col:a.色||'#ffd34f'},others=(a.候補||'').split('／').filter(Boolean).map(n=>({name:n,votes:0,col:pick(['#ff4fa0','#4fc3ff','#9b6bff','#5dff9a'])}));
  await announce(c,S,m,{label:a.題||'新曲のセンター',cands:others.concat([m]),len:3.2,seat:1,top:true});page.style.opacity='';
}};

/* 脱落発表：最後の1枠。2人のシルエットが交互に光り、無音の溜めのあとで決まる */
BLOCKS.add('脱落');
BR['脱落']=(a,L)=>{const ms=L.map(l=>{const k=l[0]==='◎'?'win':l[0]==='★'?'me':'';const m=parseMembers([l.replace(/^[◎★]/,'')])[0];m.k=k;m.me=k==='me';return m});
  return`<div class="blk show2" data-fx="脱落" data-a="${encA(a)}" data-m="${encA(ms)}">${resultHTML(ms.filter(m=>m.k==='win').concat(ms.filter(m=>m.k!=='win')),a.題)}</div>`};
D['脱落']={async run(el,a,c){
  const ms=JSON.parse(el.dataset.m),win=ms.find(m=>m.k==='win')||ms[0],rest=ms.filter(m=>m!==win),last=rest.find(m=>m.me)||rest[rest.length-1];
  const S=showSet(c);S.lights(false);
  await S.say(a.題||'デビュー圏内、最後の一枠は');if(c.dead)return;
  /* ほかの人は先に名前が暗くなる */
  for(const m of rest.filter(m=>m!==last)){S.card(m);S.scr.firstChild.classList.add('out');SFX.tick(.2);vib(15);if(!await c.wait(900))return}
  /* 最後の2人 */
  S.scr.innerHTML=`<div class="duo"><div class="dA"></div><div class="dB"></div></div>`;const dA=S.scr.querySelector('.dA'),dB=S.scr.querySelector('.dB');
  const mk=(d,m)=>{d.innerHTML=`${SILSVG(m.col,m.name)}<b>${esc(m.name)}</b>`};mk(dA,win);mk(dB,last);if(Math.random()<.5){dA.parentNode.append(dA)}
  SFX.drumroll(4);let k=0;const t0=performance.now();
  while(performance.now()-t0<4000){dA.classList.toggle('hot',k%2===0);dB.classList.toggle('hot',k%2===1);SFX.thump(.35);k++;if(!await c.wait(Math.max(160,520-k*30)))return}
  dA.classList.remove('hot');dB.classList.remove('hot');await S.say(`${a.題||'最後の一枠は'}――`);quiet(c,true);if(!await c.wait(2400))return;quiet(c,false);
  const W=dA,Lz=dB;
  W.classList.add('win');Lz.classList.add('out');
  S.rk.querySelector('.rkl').textContent='デビュー決定';const nm=S.rk.querySelector('.rkm');nm.textContent=win.name;nm.style.setProperty('--c',win.col);S.rk.querySelector('.rkv').textContent='';
  S.rk.classList.add('on');S.lights(true);SFX.boom();SFX.fanfare();SFX.cheer(3);flash('#fff3c0',600,.8);vib([80,40,260]);confetti(c,200);
  if(!await c.wait(3800))return;S.rk.classList.remove('on');S.tel.classList.remove('on');page.style.opacity='';el.classList.add('done');
}};

/* リアルタイム投票：スクリーンに、票数が回りながら順位が入れ替わる */
BLOCKS.add('投票');
BR['投票']=(a,L)=>`<div class="blk show2 vote2" data-fx="投票" data-a="${encA(a)}" data-m="${encA(parseMembers(L))}">${resultHTML(parseMembers(L).sort((p,q)=>q.votes-p.votes),a.題)}</div>`;
D['投票']={async run(el,a,c){
  const ms=JSON.parse(el.dataset.m),S=showSet(c);S.lights(true);S.scr.innerHTML='<div class="scc big"><div><b>LIVE VOTE</b><em>集計中…</em></div></div>';await S.say(a.題||'リアルタイム投票');
  const box=document.createElement('div');box.className='vbd';box.innerHTML=ms.map((m,i)=>`<div class="vbr" style="--c:${m.col}">${SILSVG(m.col,m.name)}<span>${esc(m.name)}</span><i><b></b></i><em>0</em></div>`).join('');S.L.appendChild(box);
  const rows=[...box.children],st=rows.map((r,i)=>({r,v:0,to:ms[i].votes,sp:rnd(.6,1.5)})),t0=performance.now(),dur=(+a.秒||8)*1000;let last='';
  c.raf(t=>{const k=Math.min(1,(t-t0)/dur),max=Math.max(...st.map(s=>s.to));st.forEach(s=>{s.v=s.to*Math.min(1,Math.pow(k,s.sp))});
    const ord=[...st].sort((p,q)=>q.v-p.v);ord.forEach((s,i)=>{s.r.style.transform=`translateY(${(i-rows.indexOf(s.r))*100}%)`;s.r.querySelector('b').style.width=(s.v/max*100).toFixed(1)+'%';s.r.querySelector('em').textContent=Math.round(s.v).toLocaleString();s.r.classList.toggle('top',i===0)});
    const o=ord.map(s=>rows.indexOf(s.r)).join();if(o!==last){if(last){SFX.tick(.15);vib(10)}last=o}if(k>=1)return false});
  await c.wait(dur+400);SFX.pling();flash('#fff',250,.4);await c.wait(1500);page.style.opacity='';el.classList.add('done');
}};

/* ===== 紙吹雪 ===== */
function confetti(c,n=140){const L=c.layer(),{x,W,H}=mkCanvas(L);let last=performance.now();const CC=['#ff4fa0','#4fc3ff','#ffe04f','#9b6bff','#5dff9a','#fff','#ffd34f'];
  const P=Array.from({length:n},()=>({x:W/2+rnd(-60,60),y:H*.42,vx:rnd(-300,300),vy:rnd(-560,-160),r:rnd(0,6),vr:rnd(-8,8),w:rnd(5,9),h:rnd(3,6),c:pick(CC)}));
  c.raf(t=>{const dt=Math.min(.05,(t-last)/1000);last=t;x.clearRect(0,0,W,H);let alive=0;
    for(const p of P){p.vy+=380*dt;p.vx*=.99;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;if(p.y>H+20)continue;alive++;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2*Math.abs(Math.cos(p.r*1.3)),p.w,p.h*Math.abs(Math.cos(p.r*1.3))+.5);x.restore()}
    if(!alive){L.remove();return false}})}


/* 演出オフのときは、結果の一覧だけを見せる */
['ランキング','ピラミッド','脱落','投票'].forEach(k=>{D[k].still=el=>el.classList.add('done')});
/* ===== 回帰：時間が巻き戻って、過去のある日に戻る ===== */
D['回帰']={async run(el,a,c){
  const n=makeNoise(fxRoot,.3);c.on(n.stop);SFX.rewind(2.4);vib([40,40,40,40,40,40,200]);
  stage.animate([{transform:'none',filter:'none'},{transform:'translateY(-8px) skewY(2deg)',filter:'blur(2px) hue-rotate(40deg)',offset:.5},{transform:'translateY(6px)',filter:'blur(4px) brightness(1.6)'}],{duration:2200,easing:'ease-in'});
  if(!await c.wait(2200))return;n.stop();
  const W2=c.layer('white');W2.innerHTML=`<div class="rgt">${esc(a.文||'')}</div>`;W2.animate([{opacity:0},{opacity:1}],{duration:300,fill:'forwards'});SFX.boom();
  if(a.先){setBg(a.先,false);bgLife(c,a.先)}
  const tx=W2.firstChild;tx.animate([{opacity:0,letterSpacing:'.8em'},{opacity:1,letterSpacing:'.3em'}],{duration:1400,fill:'forwards'});
  if(!await c.wait(2400))return;await W2.animate([{opacity:1},{opacity:0}],{duration:1200,fill:'forwards'}).finished.catch(()=>{});W2.remove();
}};

/* 掲示板の明るい見た目（ファン掲示板など）：［掲示板 明るい …］ */
{const _bbs=BR['掲示板'];BR['掲示板']=(a,L)=>a.args.includes('明るい')?_bbs(a,L).replace('class="blk bbs"','class="blk bbs lite"'):_bbs(a,L)}
/* ===== 静まる：画面に重なった演出（炎上・警告・コメントなど）を、すっと消す ===== */
D['静まる']={async run(el,a,c){
  c.cmStop&&c.cmStop();SFX.swish();vib(30);
  [...fxRoot.children].forEach(l=>l.animate([{opacity:1},{opacity:0}],{duration:(parseFloat(a.秒)||1.2)*1000,fill:'forwards'}).finished.then(()=>l.remove()).catch(()=>{}));
  await c.wait((parseFloat(a.秒)||1.2)*1000+200);
}};
/* ===== ミステリー（どのジャンルでも使える） ===== */
Object.assign(SFX,{
  tw:snd(()=>{const t=now();hiss(t,.03,.35,{type:'highpass',f:2200});tone('square',rnd(90,130),t,.03,.06)}),
  twbell:snd(()=>{const t=now();tone('sine',2600,t,.8,.08);tone('sine',3900,t,.5,.03)}),
  stamp:snd(()=>{const t=now();tone('sine',90,t,.18,.7,{to:50});hiss(t,.08,.4,{type:'lowpass',f:700})}),
  pin:snd(()=>{const t=now();tone('sine',1800,t,.05,.06);hiss(t,.02,.2,{type:'highpass',f:4000})}),
  string:snd(()=>{const t=now();tone('triangle',rnd(300,420),t,.25,.07,{to:rnd(280,400)})}),
  paste:snd(()=>{hiss(now(),.05,.15,{type:'lowpass',f:1200})}),
  marker:snd((d=.3)=>{hiss(now(),d,.06,{f:2500,q:1.5})})
});
Object.assign(BGCSS,{
  '机':'radial-gradient(70% 45% at 50% 28%,rgba(255,220,160,.32),transparent 70%),repeating-linear-gradient(92deg,#3b2414 0 6px,#45291a 6px 14px,#3a2213 14px 22px),linear-gradient(#4a2c18,#2a170c)',
  '取調室':'radial-gradient(40% 30% at 50% 18%,rgba(255,250,220,.45),transparent 70%),linear-gradient(#2a2c30,#121316)'
});

/* ===== 事件ファイル：極秘のスタンプ → 開くと、タイプライターで報告書が打たれる → 最後にハンコ ===== */
BLOCKS.add('事件ファイル');
BR['事件ファイル']=(a,L)=>`<div class="blk casef" data-fx="事件ファイル" data-a="${encA(a)}"><div class="cfc"><span class="cfs">極秘</span><b>${esc(a.題||'捜査報告書')}</b><small>${esc(a.番号||'事件番号 No.0412')}</small></div><div class="cfb">${L.map(l=>`<p>${inline(l)||'&nbsp;'}</p>`).join('')}${a.判?`<div class="cfh">${esc(a.判)}</div>`:''}</div></div>`;
D['事件ファイル']={
  prep(el){el.querySelector('.cfb').style.display='none'},
  async run(el,a,c){
    const cv=el.querySelector('.cfc'),b=el.querySelector('.cfb'),hk=b.querySelector('.cfh');
    cv.animate([{transform:'translateY(-30px) rotate(-6deg)',opacity:0},{transform:'rotate(-1deg)',opacity:1}],{duration:500,fill:'forwards'});
    if(!await c.wait(600))return;const st=cv.querySelector('.cfs');st.animate([{transform:'rotate(-14deg) scale(2.6)',opacity:0},{transform:'rotate(-14deg)',opacity:1}],{duration:200,fill:'forwards'});SFX.stamp();shake(3,150);
    if(!await c.wait(1200))return;
    await cv.animate([{transform:'rotate(-1deg)'},{transform:'perspective(600px) rotateX(85deg)',opacity:0}],{duration:450,fill:'forwards'}).finished.catch(()=>{});SFX.swish();
    cv.style.display='none';b.style.display='';if(hk)hk.style.visibility='hidden';
    for(const p of b.querySelectorAll('p')){
      const cs=wrapChars(p);
      for(const s of cs){if(c.dead)return;s.classList.add('on');s.style.opacity=rnd(.62,1).toFixed(2);if(s.textContent.trim()){SFX.tw();if(!c.skip&&!await c.wait(rnd(45,90)))return}}
      if(cs.length){SFX.twbell();if(!c.skip&&!await c.wait(300))return}keepBottom();
    }
    c.skip=false;
    if(hk){if(!await c.wait(700))return;hk.style.visibility='';hk.animate([{transform:'rotate(-12deg) scale(3)',opacity:0},{transform:'rotate(-12deg)',opacity:.9}],{duration:220,fill:'forwards'});SFX.stamp();vib(80);shake(5,220)}
  }
};

/* ===== 黒塗り：［塗る めくれる］はタップで少しだけめくれる。それ以外はめくれない ===== */
{const _r=D['塗る'].run;D['塗る'].run=function(el,a,c){_r(el,a,c);el.style.cursor='pointer';
  el.addEventListener('click',e=>{e.stopPropagation();if(!el.classList.contains('on'))return;
    if(a.args.includes('めくれる')){el.style.backgroundSize='45% 100%';el.style.color='#d8d0c4';SFX.paste();setTimeout(()=>{el.style.backgroundSize='';el.style.color=''},800)}
    else{el.animate([{opacity:1},{opacity:.6},{opacity:1}],{duration:200});SFX.tick(.2);vib(15)}})}}

/* ===== 赤丸：文字のまわりに、赤ペンで丸が付く（［赤丸］…［／赤丸］） ===== */
INL.add('赤丸');
D['赤丸']={run(el,a,c){c.wait((parseFloat(a.遅れ)||.8)*1000).then(ok=>{if(!ok)return;el.style.position='relative';
  el.insertAdjacentHTML('beforeend','<svg class="rmk" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M10 24C4 10 38 3 62 5S99 15 93 27 50 39 24 35 2 24 16 10" fill="none" stroke="#e0201c" stroke-width="2.6" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>');
  const p=el.querySelector('.rmk path'),len=p.getTotalLength();p.style.strokeDasharray=len;p.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:700,easing:'ease-out',fill:'forwards'});SFX.marker(.5)})}};

/* ===== 監視カメラ：白黒の粗い映像。時刻が進み、一瞬だけ人影が映る ===== */
D['監視カメラ']={async run(el,a,c){
  const L=c.layer('cctv');
  L.innerHTML=`<div class="ccv" style="background-image:${bgUrl(a.場所||'廊下')}"></div><div class="ccsil"></div><div class="ccs"></div><div class="cct"><span>● REC</span><b>${esc(a.カメラ||'CAM-03')}</b></div><div class="ccd"></div>`;
  const n=makeNoise(L,.12);c.on(n.stop);
  const d=L.querySelector('.ccd'),v=L.querySelector('.ccv'),sil=L.querySelector('.ccsil'),[h,m,s]=(a.時刻||'02:13:40').split(':').map(Number);let t=h*3600+m*60+s;
  const show=()=>{d.textContent=`${a.日付||'2024/10/27'}  ${String(t/3600|0).padStart(2,'0')}:${String((t/60|0)%60).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`};show();
  SFX.buzz(.2);L.animate([{opacity:0},{opacity:1}],{duration:400});
  const at=(+a.人影||4)*4;
  for(let i=0;i<(+a.秒||8)*4;i++){if(i%4===0){t++;show()}
    if(i===at){sil.style.opacity=.85;SFX.crackle(.15,.4);vib(40)}if(i===at+2)sil.style.opacity=0;
    v.style.transform=Math.random()<.06?`translateX(${rnd(-6,6)|0}px)`:'';if(!await c.wait(250))return}
  if(a.args.includes('止まる')){d.textContent+='  ❚❚';SFX.tick(.3);if(!await c.wait(1500))return}
  await L.animate([{opacity:1},{opacity:0}],{duration:500,fill:'forwards'}).finished.catch(()=>{});L.remove();
}};

/* ===== アリバイ表：行が書き込まれ、矛盾した行（頭に！）が赤く光る ===== */
BLOCKS.add('アリバイ');
BR['アリバイ']=(a,L)=>`<div class="blk alibi" data-fx="アリバイ" data-a="${encA(a)}"><div class="alh">${esc(a.題||'アリバイ表')}</div><table><tr>${(a.列||'時刻｜人物｜場所').split('｜').map(x=>`<th>${esc(x)}</th>`).join('')}</tr>${L.map(l=>`<tr class="${l.startsWith('！')?'bad':''}">${l.replace(/^！/,'').split('｜').map(x=>`<td>${inline(x)}</td>`).join('')}</tr>`).join('')}</table></div>`;
D['アリバイ']={
  prep(el){el.querySelectorAll('tr+tr').forEach(r=>r.style.visibility='hidden')},
  still(el){el.querySelectorAll('tr.bad').forEach(r=>r.classList.add('hot'))},
  async run(el,a,c){
    for(const r of el.querySelectorAll('tr+tr')){if(!await c.wait(700))return;r.style.visibility='';r.animate([{opacity:0,transform:'translateX(-8px)'},{opacity:1,transform:'none'}],{duration:300});SFX.marker(.25)}
    for(const r of el.querySelectorAll('tr.bad')){if(!await c.wait(1200))return;r.classList.add('hot');SFX.thump(.6);vib([40,30,80]);shake(4,200);flash('rgba(200,0,0,.3)',300)}
  }
};

/* ===== ひらめき：時間が止まり、手がかりの言葉が飛んできて、一本の線でつながる ===== */
D['ひらめき']={async run(el,a,c){
  const words=(a.語||'').split('／').filter(Boolean),L=c.layer('idea');
  stage.style.transition='filter .4s';stage.style.filter='grayscale(1) brightness(.5)';SFX.boom();vib(60);
  const W=L.clientWidth,H=L.clientHeight;
  const pts=words.map((w,i)=>{const an=i/words.length*Math.PI*2-Math.PI/2;return{w,x:W/2+Math.cos(an)*W*.3,y:H*.46+Math.sin(an)*H*.2}});
  L.innerHTML=`<svg class="idl" viewBox="0 0 ${W} ${H}"></svg>`;const svg=L.firstChild;
  for(const p of pts){const d=document.createElement('div');d.className='idw';d.textContent=p.w;d.style.left=p.x+'px';d.style.top=p.y+'px';L.appendChild(d);
    const fx=rnd(-1,1)*W,fy=rnd(-1,1)*H;d.animate([{transform:`translate(calc(-50% + ${fx|0}px),calc(-50% + ${fy|0}px)) scale(.5)`,opacity:0},{transform:'translate(-50%,-50%)',opacity:1}],{duration:450,easing:'cubic-bezier(.2,.9,.3,1)',fill:'forwards'});SFX.pin();if(!await c.wait(500))return}
  if(!await c.wait(400))return;
  for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length],ln=document.createElementNS('http://www.w3.org/2000/svg','line');
    ln.setAttribute('x1',p.x);ln.setAttribute('y1',p.y);ln.setAttribute('x2',q.x);ln.setAttribute('y2',q.y);const len=Math.hypot(q.x-p.x,q.y-p.y);ln.style.strokeDasharray=len;svg.appendChild(ln);
    ln.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:280,fill:'forwards'});SFX.string();if(!await c.wait(300))return}
  stage.style.filter='';flash('#fff',500,.9);SFX.pling();vib([30,30,120]);
  if(a.文){const t=document.createElement('div');t.className='idt';t.textContent=a.文;L.appendChild(t);t.animate([{transform:'translate(-50%,-50%) scale(2)',opacity:0},{transform:'translate(-50%,-50%)',opacity:1}],{duration:400,fill:'forwards'})}
  if(!await c.wait(2400))return;await L.animate([{opacity:1},{opacity:0}],{duration:600,fill:'forwards'}).finished.catch(()=>{});L.remove();
}};

/* ===== 真相：本文の中の言葉が裏返って別の言葉になる（［裏返る 後=…］…［／裏返る］） ===== */
INL.add('裏返る');
D['裏返る']={run(el,a,c){c.wait((parseFloat(a.遅れ)||1.5)*1000).then(async ok=>{if(!ok)return;el.style.display='inline-block';
  await el.animate([{transform:'rotateX(0)'},{transform:'rotateX(90deg)'}],{duration:350,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});
  el.textContent=a.後||'';el.style.color='#ff3b3b';el.style.fontWeight='700';SFX.thump(.8);vib(80);
  el.animate([{transform:'rotateX(-90deg)'},{transform:'rotateX(0)'}],{duration:400,easing:'cubic-bezier(.2,1.4,.4,1)',fill:'forwards'})})}};
/* 本文の文字が抜け出して集まり、別の言葉になる（［真相 集まる=…］） */
D['真相']={async run(el,a,c){
  const chars=[...page.querySelectorAll('.tc.on')].filter(s=>s.textContent.trim()&&!s.closest('.blk')),word=[...(a.集まる||'')],used=new Set();
  const picks=word.map(ch=>{const cand=chars.filter(s=>s.textContent===ch&&!used.has(s));const s=cand.length?pick(cand):null;if(s)used.add(s);return s});
  const L=c.layer(),lr=L.getBoundingClientRect(),W=lr.width,H=lr.height,fs=Math.min(46,(W-40)/word.length),x0=(W-fs*word.length)/2,y0=H*.42;
  SFX.throb();page.style.transition='opacity 1.5s';page.style.opacity=.25;
  picks.forEach((s,i)=>{const r=s?s.getBoundingClientRect():{left:rnd(0,W),top:H+20};const d=document.createElement('div');d.className='gath';d.textContent=word[i];
    d.style.left=(r.left-lr.left)+'px';d.style.top=(r.top-lr.top)+'px';L.appendChild(d);if(s)s.style.visibility='hidden';
    d.animate([{transform:'translate(0,0) scale(1)',color:'#eee'},{transform:`translate(${x0+i*fs-(r.left-lr.left)}px,${y0-(r.top-lr.top)}px) scale(${fs/16.5})`,color:a.色||'#ff2020'}],{duration:1400,delay:i*240,easing:'cubic-bezier(.6,0,.2,1)',fill:'forwards'});
    c.wait(i*240+1350).then(ok=>ok&&SFX.pin())});
  if(!await c.wait(word.length*240+1600))return;SFX.bang(1);flash('rgba(160,0,0,.45)',600);shake(6,300);vib([60,40,200]);
}};

/* ===== 証拠の机・エビデンスボード（コルク／ホワイトボード） =====
   中に「写真：…」「付箋：…」「新聞：…」「メモ：…」「人物：…」を1行ずつ。
   ［ボード 種類=コルク 線=1-2,2-3 丸=3 寄る=3］ 種類=机 は線なしで、机に並べるだけ */
BLOCKS.add('ボード');
const BSLOT=[[5,5,-4],[54,3,3],[29,33,-2],[3,60,5],[58,55,-5],[32,72,2]];
const bdItem=(l,i,kind)=>{const k=l.indexOf('：'),t=k<0?'メモ':l.slice(0,k),v=k<0?l:l.slice(k+1),[x,y,r]=BSLOT[i%BSLOT.length];
  const pos=`left:${x}%;top:${y}%;--r:${r}deg`,pin=kind==='コルク'?'<i class="pn"></i>':kind==='ホワイト'?'<i class="mg2"></i>':'';
  if(t==='写真')return`<div class="bi ph" style="${pos}">${pin}<div class="im" style="background-image:${bgUrl(pick(['廊下','病室']))}"></div><span>${esc(v)}</span></div>`;
  if(t==='人物')return`<div class="bi ps" style="${pos}">${pin}<div class="im"><i></i></div><span>${esc(v)}</span></div>`;
  if(t==='新聞')return`<div class="bi np" style="${pos}">${pin}<b>${esc(v)}</b><p></p></div>`;
  if(t==='付箋')return`<div class="bi st" style="${pos}">${pin}${esc(v)}</div>`;
  return`<div class="bi mm" style="${pos}">${pin}${esc(v)}</div>`};
BR['ボード']=(a,L)=>{const kind=a.種類||'コルク';return`<div class="blk eboard ${kind==='ホワイト'?'wb':kind==='机'?'desk':'cork'}" data-fx="ボード" data-a="${encA(a)}"><div class="bdi"><svg class="bdl"></svg>${L.map((l,i)=>bdItem(l,i,kind)).join('')}</div></div>`};
D['ボード']={
  prep(el){el.querySelectorAll('.bi').forEach(b=>b.style.opacity=0)},
  async run(el,a,c){
    const kind=a.種類||'コルク',its=[...el.querySelectorAll('.bi')],svg=el.querySelector('.bdl'),inner=el.querySelector('.bdi');
    for(const b of its){if(!await c.wait(450))return;b.style.opacity=1;
      b.animate(kind==='机'?[{transform:'translate(30px,-40px) rotate(20deg)',opacity:0},{transform:'rotate(var(--r))',opacity:1}]:[{transform:'rotate(var(--r)) scale(1.15)',opacity:0},{transform:'rotate(var(--r))',opacity:1}],{duration:320,easing:'cubic-bezier(.2,.9,.3,1)'});
      kind==='ホワイト'?SFX.marker(.3):kind==='机'?SFX.paste():SFX.pin()}
    keepBottom();
    const W=inner.clientWidth,H=inner.clientHeight;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const ctr=i=>{const b=its[i-1];return b?[b.offsetLeft+b.offsetWidth/2,b.offsetTop+(kind==='コルク'?6:b.offsetHeight/2)]:null};
    for(const pr of (a.線||'').split(',').filter(Boolean)){const [p,q]=pr.split('-').map(Number),A2=ctr(p),B2=ctr(q);if(!A2||!B2)continue;if(!await c.wait(500))return;
      const pa=document.createElementNS('http://www.w3.org/2000/svg','path'),mx=(A2[0]+B2[0])/2,my=(A2[1]+B2[1])/2+(kind==='コルク'?18:0);
      pa.setAttribute('d',`M${A2[0]} ${A2[1]} Q${mx} ${my} ${B2[0]} ${B2[1]}`);if(kind==='ホワイト')pa.setAttribute('marker-end','url(#arw)');svg.appendChild(pa);
      const len=pa.getTotalLength();pa.style.strokeDasharray=len;pa.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:420,fill:'forwards'});kind==='ホワイト'?SFX.marker(.4):SFX.string()}
    if(kind==='ホワイト'&&!svg.querySelector('defs'))svg.insertAdjacentHTML('afterbegin','<defs><marker id="arw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1d4fb8"/></marker></defs>');
    if(a.丸){const b=its[+a.丸-1];if(b){if(!await c.wait(700))return;b.insertAdjacentHTML('beforeend',`<svg class="rmk big" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M10 24C4 10 38 3 62 5S99 15 93 27 50 39 24 35 2 24 16 10" fill="none" stroke="#e0201c" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>${kind==='ホワイト'?'<b class="xx">×</b>':''}`);
      const p=b.querySelector('.rmk path'),len=p.getTotalLength();p.style.strokeDasharray=len;p.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:700,fill:'forwards'});SFX.marker(.5);vib(30)}}
    if(a.寄る){const b=its[+a.寄る-1];if(b){if(!await c.wait(900))return;inner.style.transformOrigin=`${b.offsetLeft+b.offsetWidth/2}px ${b.offsetTop+b.offsetHeight/2}px`;
      inner.animate([{transform:'scale(1)'},{transform:'scale(1.7)'}],{duration:1600,easing:'cubic-bezier(.5,0,.2,1)',fill:'forwards'});SFX.throb()}}
  }
};

/* ===== 脅迫状：新聞や雑誌から切り抜いた文字が、1文字ずつ貼られていく ===== */
BLOCKS.add('脅迫状');
const RFONT=["'Shippori Mincho',serif","'Zen Maru Gothic',sans-serif","'DotGothic16',monospace","'Klee One',serif"],RBG=[['#fff','#111'],['#efe6cf','#222'],['#111','#fff'],['#c8102e','#fff'],['#fff8c8','#111'],['#e6eef8','#123']];
BR['脅迫状']=(a,L)=>`<div class="blk ransom" data-fx="脅迫状">${L.map(l=>`<div class="rl">${[...l].map(ch=>{if(!ch.trim())return'<i class="sp"></i>';const [bg,fg]=pick(RBG);
  return`<span style="font-family:${pick(RFONT)};font-size:${rnd(18,30)|0}px;background:${bg};color:${fg};transform:rotate(${rnd(-9,9)|0}deg) translateY(${rnd(-3,3)|0}px);font-weight:${pick([400,700,900])}">${esc(ch)}</span>`}).join('')}</div>`).join('')}</div>`;
D['脅迫状']={
  prep(el){el.querySelectorAll('span').forEach(s=>s.style.visibility='hidden')},
  async run(el,a,c){for(const s of el.querySelectorAll('span')){if(!await c.wait(rnd(160,280)))return;s.style.visibility='';s.animate([{scale:1.5,opacity:0},{scale:1,opacity:1}],{duration:160});SFX.paste();if(Math.random()<.3)vib(10)}}
};

/* ===== 予告状：［予告状 飛ぶ／差し込む／置く 題=… 文=…／… 差出人=… 印=…］ ===== */
D['予告状']={async run(el,a,c){
  const L=c.layer('notice'),how=a.args.find(k=>['飛ぶ','差し込む','置く'].includes(k))||'飛ぶ';
  L.innerHTML=`<div class="ncard"><div class="nct">${esc(a.題||'予告状')}</div><div class="ncb">${esc(a.文||'').replace(/／/g,'<br>')}</div><div class="ncf">${esc(a.差出人||'')}</div><div class="ncs">${esc(a.印||'◆')}</div></div>`;
  const cd=L.firstChild,seal=cd.querySelector('.ncs');seal.style.opacity=0;
  if(how==='飛ぶ'){SFX.swish();await cd.animate([{transform:'translate(120vw,-40vh) rotate(900deg) scale(.6)'},{transform:'translate(-50%,-50%) rotate(-6deg)'}],{duration:650,easing:'cubic-bezier(.2,.8,.3,1)',fill:'forwards'}).finished.catch(()=>{});SFX.knock(1);SFX.bang(.5);shake(5,200);vib(80)}
  else if(how==='差し込む'){SFX.swish();await cd.animate([{transform:'translate(-50%,90vh) rotate(-3deg)'},{transform:'translate(-50%,-50%) rotate(-3deg)'}],{duration:2600,easing:'cubic-bezier(.3,0,.2,1)',fill:'forwards'}).finished.catch(()=>{})}
  else{cd.style.transform='translate(-50%,-50%) rotate(-3deg)';await cd.animate([{opacity:0},{opacity:1}],{duration:2500,fill:'forwards'}).finished.catch(()=>{});SFX.tick(.3)}
  if(c.dead||!await c.wait(700))return;seal.style.opacity=1;seal.animate([{transform:'scale(3)',opacity:0},{transform:'none',opacity:1}],{duration:220,fill:'forwards'});SFX.stamp();vib(60);
  await c.wait(2600);
}};

/* ===== KEEP OUT：黄色い立入禁止テープが、画面を横切って貼られる ===== */
D['キープアウト']={run(el,a,c){
  const L=c.layer('keep'),txt=a.文||'KEEP OUT　立入禁止　';
  for(let i=0;i<(+a.本数||3);i++){const rot=[-16,12,-5,22][i%4],top=[30,54,72,42][i%4],t=document.createElement('div');t.className='kt';t.innerHTML=`<span>${esc(txt.repeat(10))}</span>`;
    t.style.cssText=`top:${top}%;transform:rotate(${rot}deg) scaleX(0)`;L.appendChild(t);
    c.wait(i*450).then(ok=>{if(!ok)return;t.animate([{transform:`rotate(${rot}deg) scaleX(0)`},{transform:`rotate(${rot}deg) scaleX(1)`}],{duration:380,easing:'cubic-bezier(.3,.9,.4,1)',fill:'forwards'});SFX.tear();vib(30);
      t.firstChild.animate([{transform:'translateY(-1px)'},{transform:'translateY(1px)'}],{duration:rnd(900,1400),iterations:Infinity,direction:'alternate'})})}
}};

/* ===== ミステリー（作り直し） ===== */
['cork1','cork2','cork3'].forEach(v=>{const i=new Image();i.src=`a/${v}.jpg`});

/* 事件ファイル：白紙に、カーソル付きで1文字ずつ打たれていく。黒塗りの所は、打った瞬間から黒い */
const TWSEG=l=>{const out=[],re=/［塗る[^］]*］(.*?)［／塗る］/g;let last=0,m;while((m=re.exec(l))){out.push([l.slice(last,m.index),0],[m[1],1]);last=re.lastIndex}out.push([l.slice(last),0]);return out.map(([t,b])=>[t.replace(/［[^］]*］/g,''),b]).filter(s=>s[0])};
BR['事件ファイル']=(a,L)=>`<div class="blk casef" data-fx="事件ファイル" data-a="${encA(a)}" data-lines="${encA(L)}"><div class="cfc"><span class="cfs">極秘</span><b>${esc(a.題||'捜査報告書')}</b><small>${esc(a.番号||'事件番号 No.0412')}</small></div><div class="cfb">${L.map(l=>`<p>${TWSEG(l).map(([t,b])=>b?`<span class="redact on">${esc(t)}</span>`:esc(t)).join('')||'&nbsp;'}</p>`).join('')}${a.判?`<div class="cfh">${esc(a.判)}</div>`:''}</div></div>`;
D['事件ファイル']={
  prep(el){const b=el.querySelector('.cfb');b.querySelectorAll('p').forEach(p=>p.remove());b.style.display='none'},
  async run(el,a,c){
    const cv=el.querySelector('.cfc'),b=el.querySelector('.cfb'),hk=b.querySelector('.cfh');
    cv.animate([{transform:'translateY(-30px) rotate(-6deg)',opacity:0},{transform:'rotate(-1deg)',opacity:1}],{duration:500,fill:'forwards'});
    if(!await c.wait(600))return;cv.querySelector('.cfs').animate([{transform:'rotate(-14deg) scale(2.6)',opacity:0},{transform:'rotate(-14deg)',opacity:1}],{duration:200,fill:'forwards'});SFX.stamp();shake(3,150);
    if(!await c.wait(1200))return;
    await cv.animate([{transform:'rotate(-1deg)'},{transform:'perspective(600px) rotateX(85deg)',opacity:0}],{duration:450,fill:'forwards'}).finished.catch(()=>{});SFX.swish();
    cv.style.display='none';b.style.display='';if(hk)hk.style.visibility='hidden';
    const car=document.createElement('span');car.className='twc';
    let col=0;
    for(const line of JSON.parse(el.dataset.lines)){
      const p=document.createElement('p');b.insertBefore(p,hk||null);p.appendChild(car);col=0;
      for(const [t,red] of TWSEG(line)){let host=p;if(red){host=document.createElement('span');host.className='redact on';p.appendChild(host)}
        for(const ch of t){const s=document.createElement('span');s.textContent=ch;s.style.opacity=rnd(.62,1).toFixed(2);host.appendChild(s);host.appendChild(car);
          b.style.transform=`translateX(${(-(col%24)*.25).toFixed(2)}px)`;col++;
          if(ch.trim()){SFX.tw();if(!c.skip&&!await c.wait(rnd(55,100)))return}}
        p.appendChild(car)}
      if(!line.trim())p.innerHTML='&nbsp;',p.appendChild(car);
      SFX.twbell();b.style.transform='';keepBottom();if(!c.skip&&!await c.wait(320))return}
    c.skip=false;car.remove();
    if(hk){if(!await c.wait(700))return;hk.style.visibility='';hk.animate([{transform:'rotate(-12deg) scale(3)',opacity:0},{transform:'rotate(-12deg)',opacity:.9}],{duration:220,fill:'forwards'});SFX.stamp();vib(80);shake(5,220)}
  }
};

/* 黒塗り：［塗る 済］は、はじめから黒塗りで出る */
D['塗る'].prep=(el,a)=>{if(a.args.includes('済')){el.style.transition='none';el.classList.add('redact','on')}};
{const _r=D['塗る'].run;D['塗る'].run=function(el,a,c){if(a.args.includes('済')){el.style.cursor='pointer';
  el.addEventListener('click',e=>{e.stopPropagation();if(a.args.includes('めくれる')){el.style.transition='background-size .3s';el.style.backgroundSize='45% 100%';el.style.color='#d8d0c4';SFX.paste();setTimeout(()=>{el.style.backgroundSize='';el.style.color=''},800)}else{el.animate([{opacity:1},{opacity:.6},{opacity:1}],{duration:200});SFX.tick(.2);vib(15)}});return}
  return _r(el,a,c)}}

/* KEEP OUT：テープがたくさん、画面を埋めるように重なって貼られる */
D['キープアウト']={run(el,a,c){
  const L=c.layer('keep'),txt=a.文||'KEEP OUT　立入禁止　',n=+a.本数||9;
  for(let i=0;i<n;i++){const rot=rnd(-34,34),top=8+i*(84/n)+rnd(-4,4),t=document.createElement('div');t.className='kt';t.innerHTML=`<span>${esc(txt.repeat(10))}</span>`;
    const h=rnd(28,42),fs=h*.46;t.style.cssText=`top:${top.toFixed(1)}%;height:${h|0}px;transform:rotate(${rot.toFixed(1)}deg) scaleX(0);transform-origin:${i%2?'right':'left'} center`;t.firstChild.style.fontSize=fs.toFixed(0)+'px';L.appendChild(t);
    c.wait(i*260).then(ok=>{if(!ok)return;t.animate([{transform:`rotate(${rot}deg) scaleX(0)`},{transform:`rotate(${rot}deg) scaleX(1)`}],{duration:340,easing:'cubic-bezier(.3,.9,.4,1)',fill:'forwards'});SFX.tear();vib(25);
      t.firstChild.animate([{transform:'translateY(-1px)'},{transform:'translateY(1px)'}],{duration:rnd(900,1400),iterations:Infinity,direction:'alternate'})})}
}};

/* 脅迫状：新聞や雑誌から切り抜いた文字。新聞の紙、細かい活字の筋、網点、ガタガタの切り口 */
const RNP=[{bg:'#ece5d2',fg:'#111',np:1},{bg:'#e9e2cc',fg:'#1a1a1a',np:1},{bg:'#f1ece0',fg:'#000',np:1},{bg:'#111',fg:'#f2efe6',np:0},{bg:'#b3121b',fg:'#fff',np:0},{bg:'#f3e3a0',fg:'#111',np:0},{bg:'#e6e6e6',fg:'#2a2a6a',np:1}];
const RF2=["'Shippori Mincho',serif","'Zen Maru Gothic',sans-serif","'Shippori Mincho',serif","'DotGothic16',monospace","'Zen Maru Gothic',sans-serif"];
const jag=()=>{const p=[];for(let k=0;k<5;k++)p.push(`${(k*25).toFixed(0)}% ${rnd(0,7).toFixed(0)}%`);p.push(`${rnd(94,100)|0}% ${rnd(0,8)|0}%`);for(let k=0;k<4;k++)p.push(`${rnd(93,100)|0}% ${25+k*22}%`);for(let k=4;k>=0;k--)p.push(`${(k*25).toFixed(0)}% ${rnd(93,100).toFixed(0)}%`);for(let k=3;k>=1;k--)p.push(`${rnd(0,7)|0}% ${k*25}%`);return`polygon(${p.join(',')})`};
BR['脅迫状']=(a,L)=>`<div class="blk ransom" data-fx="脅迫状">${L.map(l=>`<div class="rl">${[...l].map(ch=>{if(!ch.trim())return'<i class="sp"></i>';const k=pick(RNP),big=Math.random()<.3;
  const np=k.np?`background-image:radial-gradient(rgba(0,0,0,.13) .6px,transparent .8px),repeating-linear-gradient(0deg,rgba(0,0,0,.07) 0 1px,transparent 1px 3px);background-size:3px 3px,100% 100%;`:'';
  return`<span style="font-family:${pick(RF2)};font-size:${(big?rnd(28,36):rnd(19,27))|0}px;background-color:${k.bg};${np}color:${k.fg};transform:rotate(${rnd(-10,10)|0}deg) translateY(${rnd(-4,4)|0}px);font-weight:${pick([600,700,900])};clip-path:${jag()};padding:${rnd(2,6)|0}px ${rnd(4,8)|0}px">${esc(ch)}</span>`}).join('')}</div>`).join('')}</div>`;

/* エビデンスボード（コルク）：写真の背景の上に、びっしり貼られ、赤い糸が中心へ集まる
   中身：写真／人物／新聞／付箋／メモ／地図／指紋／手形／足跡。［ボード 種類=コルク 中心=5 丸=5 寄る=5 写真=cork1］ */
const BSLOT2=[[2,3],[35,1],[68,4],[4,27],[36,24],[67,28],[1,51],[34,49],[66,53],[3,75],[36,73],[68,76]];
const FPRINT='<svg viewBox="0 0 40 50" class="fp2">'+Array.from({length:8},(_,k)=>`<ellipse cx="20" cy="26" rx="${3+k*2.2}" ry="${4+k*2.7}" fill="none" stroke="#333" stroke-width="1.1" stroke-dasharray="${rnd(3,9)|0} ${rnd(1,3)|0}"/>`).join('')+'</svg>';
const MAPSVG='<svg viewBox="0 0 100 70" class="map2"><rect width="100" height="70" fill="#eef0ea"/>'+Array.from({length:9},()=>`<path d="M${rnd(0,100)|0} 0L${rnd(0,100)|0} 70" stroke="#c9ccc4" stroke-width="${rnd(1,3)|0}"/><path d="M0 ${rnd(0,70)|0}L100 ${rnd(0,70)|0}" stroke="#c9ccc4" stroke-width="${rnd(1,3)|0}"/>`).join('')+'<path d="M0 50Q40 35 100 58" stroke="#9cc3e0" stroke-width="5" fill="none"/><circle cx="58" cy="30" r="6" fill="none" stroke="#e0201c" stroke-width="2"/><text x="66" y="28" font-size="8" fill="#e0201c">×</text></svg>';
const bdItem2=(l,i)=>{const k=l.indexOf('：'),t=k<0?'メモ':l.slice(0,k),v=k<0?l:l.slice(k+1),[x,y]=BSLOT2[i%BSLOT2.length],r=rnd(-7,7).toFixed(1);
  const pos=`left:${x+rnd(-2,2)}%;top:${y+rnd(-1.5,1.5)}%;--r:${r}deg`,pin=`<i class="pn" style="background:radial-gradient(circle at 35% 35%,${pick(['#ff8a8a,#b00','#ffe08a,#b08000','#8ad0ff,#0060b0','#9dff8a,#208000'])})"></i>`;
  if(t==='写真')return`<div class="bi ph" style="${pos}">${pin}<div class="im" style="background-image:${bgUrl(pick(['廊下','病室','歪む','ガラス']))}"></div><span>${esc(v)}</span></div>`;
  if(t==='人物')return`<div class="bi ps" style="${pos}">${pin}<div class="im"><i></i></div><span>${esc(v)}</span></div>`;
  if(t==='新聞')return`<div class="bi np" style="${pos}">${pin}<b>${esc(v)}</b><p></p></div>`;
  if(t==='付箋')return`<div class="bi st" style="${pos};background:${pick(['#ffe866','#ffd1e8','#c9f2b0','#bfe3ff'])}">${pin}${esc(v)}</div>`;
  if(t==='地図')return`<div class="bi mp" style="${pos}">${pin}${MAPSVG}<span>${esc(v)}</span></div>`;
  if(t==='指紋')return`<div class="bi pr" style="${pos}">${pin}<div class="prs">${FPRINT}${FPRINT}${FPRINT}</div><span>${esc(v)}</span></div>`;
  if(t==='手形'||t==='足跡')return`<div class="bi pr" style="${pos}">${pin}<img src="a/${t==='手形'?'hand_r':'foot_l'}.png" alt=""><span>${esc(v)}</span></div>`;
  return`<div class="bi mm" style="${pos}">${pin}${esc(v)}</div>`};
const _brBoard=BR['ボード'];
BR['ボード']=(a,L)=>{if((a.種類||'コルク')!=='コルク')return _brBoard(a,L);
  return`<div class="blk eboard cork2" data-fx="ボード" data-a="${encA(a)}"><div class="bdi" style="background-image:url(a/${esc(a.写真||'cork1')}.jpg)"><svg class="bdl"></svg>${L.map((l,i)=>bdItem2(l,i)).join('')}</div></div>`};
{const _run=D['ボード'].run;D['ボード'].run=async function(el,a,c){
  if((a.種類||'コルク')!=='コルク')return _run.call(this,el,a,c);
  const its=[...el.querySelectorAll('.bi')],svg=el.querySelector('.bdl'),inner=el.querySelector('.bdi');
  const pan=inner.animate([{backgroundPosition:'0% 50%'},{backgroundPosition:'100% 50%'}],{duration:26000,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});c.on(()=>pan.cancel());
  for(const b of its){if(!await c.wait(320))return;b.style.opacity=1;b.animate([{transform:'rotate(var(--r)) scale(1.18)',opacity:0},{transform:'rotate(var(--r))',opacity:1}],{duration:260,easing:'cubic-bezier(.2,.9,.3,1)'});SFX.pin()}
  keepBottom();const W=inner.clientWidth,H=inner.clientHeight;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const ctr=i=>{const b=its[i-1];return b?[b.offsetLeft+b.offsetWidth/2,b.offsetTop+4]:null};
  const pairs=a.中心?its.map((_,i)=>[i+1,+a.中心]).filter(([p,q])=>p!==q):(a.線||'').split(',').filter(Boolean).map(s=>s.split('-').map(Number));
  for(const [p,q] of pairs){const A2=ctr(p),B2=ctr(q);if(!A2||!B2)continue;if(!await c.wait(260))return;
    const pa=document.createElementNS('http://www.w3.org/2000/svg','path');pa.setAttribute('d',`M${A2[0]} ${A2[1]} Q${(A2[0]+B2[0])/2} ${(A2[1]+B2[1])/2+14} ${B2[0]} ${B2[1]}`);svg.appendChild(pa);
    const len=pa.getTotalLength();pa.style.strokeDasharray=len;pa.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:380,fill:'forwards'});SFX.string()}
  if(a.丸){const b=its[+a.丸-1];if(b){if(!await c.wait(600))return;b.insertAdjacentHTML('beforeend','<svg class="rmk big" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M10 24C4 10 38 3 62 5S99 15 93 27 50 39 24 35 2 24 16 10" fill="none" stroke="#e0201c" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>');
    const p=b.querySelector('.rmk path'),len=p.getTotalLength();p.style.strokeDasharray=len;p.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:700,fill:'forwards'});SFX.marker(.5);vib(30)}}
  if(a.寄る){const b=its[+a.寄る-1];if(b){if(!await c.wait(900))return;pan.pause();inner.style.transformOrigin=`${b.offsetLeft+b.offsetWidth/2}px ${b.offsetTop+b.offsetHeight/2}px`;
    inner.animate([{transform:'scale(1)'},{transform:'scale(1.9)'}],{duration:1800,easing:'cubic-bezier(.5,0,.2,1)',fill:'forwards'});SFX.throb()}}
}}

/* ===== 刑事ドラマの捜査本部のホワイトボード =====
   事件：… ／ 人物：名前｜説明 ／ 関係：1-2｜金銭トラブル ／ 時系列：21:00 佐伯 書斎 ／ メモ：… ／ 丸：2 */
BLOCKS.add('捜査本部');
const WBPOS=[[39,11],[4,35],[74,35],[39,52],[4,66]];
BR['捜査本部']=(a,L)=>{const P=[],R=[],T=[],M=[];let title='',ring=0;
  L.forEach(l=>{const k=l.indexOf('：'),t=l.slice(0,k),v=l.slice(k+1);if(t==='事件')title=v;else if(t==='人物')P.push(v.split('｜'));else if(t==='関係')R.push(v.split('｜'));else if(t==='時系列')T.push(v);else if(t==='メモ')M.push(v);else if(t==='丸')ring=+v});
  return`<div class="blk wb2" data-fx="捜査本部" data-a="${encA(a)}" data-r="${encA(R)}" data-ring="${ring}"><div class="wbi"><div class="wbt">${esc(title)}</div><svg class="wbl"></svg>
    ${P.map(([n,d],i)=>{const [x,y]=WBPOS[i%WBPOS.length];return`<div class="wp" style="left:${x}%;top:${y}%"><i class="mag"></i><div class="ph"><i></i></div><b>${esc(n)}</b><small>${esc(d||'')}</small></div>`}).join('')}
    ${T.length?`<div class="wtl"><b>時系列</b>${T.map(x=>`<div>${esc(x)}</div>`).join('')}</div>`:''}
    ${M.map((m,i)=>`<div class="wm" style="left:${[66,66,6][i%3]}%;top:${[78,86,30][i%3]}%;transform:rotate(${rnd(-6,6)|0}deg)">${esc(m)}</div>`).join('')}</div></div>`};
D['捜査本部']={
  prep(el){el.querySelectorAll('.wbt,.wp,.wtl div,.wm').forEach(e=>e.style.visibility='hidden')},
  async run(el,a,c){
    const inner=el.querySelector('.wbi'),svg=el.querySelector('.wbl'),R=JSON.parse(el.dataset.r),ps=[...el.querySelectorAll('.wp')];
    const write=async e=>{e.style.visibility='';const t=e.textContent;if(e.children.length){e.animate([{opacity:0},{opacity:1}],{duration:300});return}e.textContent='';for(const ch of t){e.textContent+=ch;if(Math.random()<.5)SFX.marker(.06);if(!await c.wait(55))return false}return true};
    const tt=el.querySelector('.wbt');if(!await write(tt))return;
    for(const p of ps){if(!await c.wait(450))return;p.style.visibility='';p.animate([{transform:'scale(1.15) rotate(3deg)',opacity:0},{transform:'none',opacity:1}],{duration:260});SFX.pin();vib(15)}
    const W=inner.clientWidth,H=inner.clientHeight;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    svg.innerHTML='<defs><marker id="wa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1d2a6b"/></marker></defs>';
    const cen=p=>[p.offsetLeft+p.offsetWidth/2,p.offsetTop+p.offsetHeight/2];
    for(const [pr,lab] of R){const [i,j]=pr.split('-').map(Number),A2=ps[i-1],B2=ps[j-1];if(!A2||!B2)continue;if(!await c.wait(500))return;
      const [x1,y1]=cen(A2),[x2,y2]=cen(B2),dx=x2-x1,dy=y2-y1,d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d,sx=x1+ux*44,sy=y1+uy*44,ex=x2-ux*44,ey=y2-uy*44;
      const ln=document.createElementNS('http://www.w3.org/2000/svg','path');ln.setAttribute('d',`M${sx} ${sy}L${ex} ${ey}`);ln.setAttribute('marker-end','url(#wa)');svg.appendChild(ln);
      const len=Math.hypot(ex-sx,ey-sy);ln.style.strokeDasharray=len;ln.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:400,fill:'forwards'});SFX.marker(.35);
      if(lab){const t=document.createElement('div');t.className='wlab';t.style.left=((sx+ex)/2)+'px';t.style.top=((sy+ey)/2)+'px';t.textContent='';inner.appendChild(t);await c.wait(380);for(const ch of lab){t.textContent+=ch;if(!await c.wait(60))return}}}
    for(const d of el.querySelectorAll('.wtl div')){if(!await c.wait(300))return;await write(d)}
    for(const m of el.querySelectorAll('.wm')){if(!await c.wait(400))return;if(!await write(m))return}
    const rg=+el.dataset.ring;if(rg&&ps[rg-1]){if(!await c.wait(700))return;const p=ps[rg-1];p.insertAdjacentHTML('beforeend','<svg class="rmk big" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M10 24C4 10 38 3 62 5S99 15 93 27 50 39 24 35 2 24 16 10" fill="none" stroke="#e0201c" stroke-width="3.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg><b class="q">？</b>');
      const pa=p.querySelector('.rmk path'),len=pa.getTotalLength();pa.style.strokeDasharray=len;pa.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:700,fill:'forwards'});SFX.marker(.5);vib(30)}
    /* 手前に、ボードを見上げる刑事たちの影 */
    if(!await c.wait(600))return;const L2=c.layer('cops');L2.innerHTML='<i class="cp a"></i><i class="cp b"></i>';L2.animate([{opacity:0},{opacity:1}],{duration:1200,fill:'forwards'});
  },
  still(el){el.querySelectorAll('*').forEach(e=>e.style.visibility='')}
};

/* ===== ミステリー（素材入り） ===== */
BGS['資料机']='report';
const PHOTOS=['street','wallet','cam1','cam3','plate','entrance','door','room','mansion','ring','car','map','route','cam2','butt','phone','cloth','bldg','aerial','parking','skyline'];
const phUrl=k=>`url(a/ph_${PHOTOS.includes(k)?k:'street'}.jpg)`;
/* マーカーで塗ったような、かすれた黒塗り（端がガタガタになるフィルター） */
document.body.insertAdjacentHTML('beforeend','<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="rough" x="-5%" y="-20%" width="110%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="3" xChannelSelector="R" yChannelSelector="G"/></filter></svg>');

/* ===== 書類（黒塗りの資料）：項目名だけ見えて、中身は黒く塗られている =====
   題：… ／ 番号：… ／ 写真：名前 ／ 項目：名前｜中身 ／ 見出し：… ／ 文：… ／ 経緯：時刻｜中身 ／ 人物：写真番号｜中身 ／ ・箇条書き */
BLOCKS.add('書類');
BR['書類']=(a,L)=>{let title='',no='',ph='',h='';
  for(const l of L){const k=l.indexOf('：'),t=k<0?'':l.slice(0,k),v=k<0?l:l.slice(k+1),[x,y]=v.split('｜');
    if(t==='題')title=v;else if(t==='番号')no=v;else if(t==='写真')ph=v;
    else if(t==='項目')h+=`<div class="dr"><span>${esc(x)}</span><b>${inline(y||'')}</b></div>`;
    else if(t==='見出し')h+=`<div class="dh">${esc(v)}</div>`;
    else if(t==='文')h+=`<p class="dp">${inline(v)}</p>`;
    else if(t==='経緯')h+=`<div class="dr tl"><span>${esc(x)}</span><b>${inline(y||'')}</b></div>`;
    else if(t==='人物')h+=`<div class="dr ps"><i style="background-image:url(a/p${+x||1}.jpg)"></i><b>${inline(y||'')}</b></div>`;
    else if(l.startsWith('・'))h+=`<div class="db">${inline(l.slice(1))}</div>`;
    else h+=`<p class="dp">${inline(l)}</p>`}
  return`<div class="blk docu" data-fx="書類"><div class="dno">${esc(no)}</div><div class="dt">${esc(title)}</div>${ph?`<div class="dph" style="background-image:${phUrl(ph)}"></div>`:''}${h}</div>`};
D['書類']={async run(el,a,c){el.animate([{transform:'translateY(40px) rotate(4deg)',opacity:0},{transform:'rotate(-1deg)',opacity:1}],{duration:600,easing:'cubic-bezier(.2,.9,.3,1)',fill:'forwards'});SFX.swish();await c.wait(700)}};

/* ===== エビデンスボード（コルク）：写真がばらばら、糸は網の目のように複雑。最後に大事な線だけ光る =====
   写真：説明｜写真名 ／ 人物：名前｜写真番号 ／ ほかは前と同じ */
const BSLOT3=[];for(let r=0;r<5;r++)for(let k=0;k<3;k++)BSLOT3.push([2+k*33+rnd(-2,2),2+r*19.5+rnd(-1.5,1.5)]);
const bdItem3=(l,i,pool)=>{const k=l.indexOf('：'),t=k<0?'メモ':l.slice(0,k),v=k<0?l:l.slice(k+1),[cap,ref]=v.split('｜'),[x,y]=BSLOT3[i%BSLOT3.length],r=rnd(-8,8).toFixed(1);
  const pos=`left:${x}%;top:${y}%;--r:${r}deg`,pin=`<i class="pn" style="background:radial-gradient(circle at 35% 35%,${pick(['#ff8a8a,#b00','#ffe08a,#b08000','#8ad0ff,#0060b0','#9dff8a,#208000'])})"></i>`;
  if(t==='写真')return`<div class="bi ph" style="${pos}">${pin}<div class="im" style="background-image:${phUrl(ref||pool.pop())}"></div><span>${esc(cap)}</span></div>`;
  if(t==='人物')return`<div class="bi ps" style="${pos}">${pin}<div class="im" style="background:url(a/p${+ref||i%16+1}.jpg) center/cover"></div><span>${esc(cap)}</span></div>`;
  return bdItem2(l,i).replace(/left:[^;]+;top:[^;]+;/,`left:${x}%;top:${y}%;`)};
{const prevBR=BR['ボード'];BR['ボード']=(a,L)=>{if((a.種類||'コルク')!=='コルク')return prevBR(a,L);const pool=PHOTOS.slice().sort(()=>Math.random()-.5);
  return`<div class="blk eboard cork2 cork3" data-fx="ボード" data-a="${encA(a)}"><div class="bdi" style="background-image:url(a/${esc(a.写真||'cork1')}.jpg)"><svg class="bdl"></svg>${L.map((l,i)=>bdItem3(l,i,pool)).join('')}</div></div>`}}
{const prevRun=D['ボード'].run;D['ボード'].run=async function(el,a,c){
  if((a.種類||'コルク')!=='コルク')return prevRun.call(this,el,a,c);
  const its=[...el.querySelectorAll('.bi')],svg=el.querySelector('.bdl'),inner=el.querySelector('.bdi');
  const pan=inner.animate([{backgroundPosition:'0% 50%'},{backgroundPosition:'100% 50%'}],{duration:26000,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});c.on(()=>pan.cancel());
  for(const b of its){if(!await c.wait(260))return;b.style.opacity=1;b.animate([{transform:'rotate(var(--r)) scale(1.18)',opacity:0},{transform:'rotate(var(--r))',opacity:1}],{duration:240,easing:'cubic-bezier(.2,.9,.3,1)'});SFX.pin()}
  keepBottom();const W=inner.clientWidth,H=inner.clientHeight;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const ctr=i=>{const b=its[i];return[b.offsetLeft+b.offsetWidth*rnd(.3,.7),b.offsetTop+4]};
  const line=(p,q,cls,sag)=>{const pa=document.createElementNS('http://www.w3.org/2000/svg','path');pa.setAttribute('d',`M${p[0]} ${p[1]} Q${(p[0]+q[0])/2+rnd(-10,10)} ${(p[1]+q[1])/2+sag} ${q[0]} ${q[1]}`);pa.setAttribute('class',cls);svg.appendChild(pa);
    const len=pa.getTotalLength();pa.style.strokeDasharray=len;pa.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:cls==='key'?500:240,fill:'forwards'});return pa};
  /* 網の目：それぞれが2〜3本、ほかの物とつながる。ボードの外へ出ていく糸もある */
  const seen=new Set();
  for(let i=0;i<its.length;i++)for(let k=0;k<(Math.random()<.6?1:2);k++){let j=Math.floor(Math.random()*its.length);if(j===i)continue;const key=Math.min(i,j)+'-'+Math.max(i,j);if(seen.has(key))continue;seen.add(key);
    line(ctr(i),ctr(j),'mesh',rnd(4,22));if(seen.size%2===0)SFX.string();if(!await c.wait(110))return}
  for(let k=0;k<2;k++){const i=Math.floor(Math.random()*its.length);line(ctr(i),[pick([-20,W+20]),rnd(0,H)],'mesh',10)}
  /* 大事な線だけ、太く光る */
  if(!await c.wait(500))return;
  const keys=a.中心?[...String(a.つなぐ||'').split(',').filter(Boolean).map(Number)].map(n=>[n,+a.中心]):(a.線||'').split(',').filter(Boolean).map(s=>s.split('-').map(Number));
  svg.querySelectorAll('.mesh').forEach(p=>p.animate([{opacity:1},{opacity:.45}],{duration:600,fill:'forwards'}));
  for(const [p,q] of keys){if(!its[p-1]||!its[q-1])continue;line(ctr(p-1),ctr(q-1),'key',10);SFX.string();vib(15);if(!await c.wait(450))return}
  if(a.丸){const b=its[+a.丸-1];if(b){if(!await c.wait(500))return;b.insertAdjacentHTML('beforeend','<svg class="rmk big" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M10 24C4 10 38 3 62 5S99 15 93 27 50 39 24 35 2 24 16 10" fill="none" stroke="#e0201c" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>');
    const p=b.querySelector('.rmk path'),len=p.getTotalLength();p.style.strokeDasharray=len;p.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:700,fill:'forwards'});SFX.marker(.5);vib(30)}}
  if(a.寄る){const b=its[+a.寄る-1];if(b){if(!await c.wait(900))return;pan.pause();inner.style.transformOrigin=`${b.offsetLeft+b.offsetWidth/2}px ${b.offsetTop+b.offsetHeight/2}px`;
    inner.animate([{transform:'scale(1)'},{transform:'scale(1.9)'}],{duration:1800,easing:'cubic-bezier(.5,0,.2,1)',fill:'forwards'});SFX.throb()}}
}}

/* ===== 捜査本部のホワイトボード（刑事ドラマ風、作家さんが中身を書ける） =====
   ■見出し で区画を作る（■未解明… は赤い枠）。「■関係者」より前は左、あとは右の列。
   区画の中：名前｜中身（表）／・箇条書き／人物：名前｜説明｜写真番号／関係：1-2｜書き込み（点線は 1-2? ）／写真：説明｜写真名
   見出しに「｜写真=street」を付けると、その区画に写真が貼られる */
BR['捜査本部']=(a,L)=>{
  const secs=[];let cur=null;
  for(const l of L){if(l.startsWith('■')){const [n,...o]=l.slice(1).split('｜');cur={name:n,opt:o.join('｜'),rows:[]};secs.push(cur)}else if(cur)cur.rows.push(l)}
  let side='l';const col={l:'',r:''};
  for(const s of secs){if(/関係者/.test(s.name))side='r';
    const ph=(s.opt.match(/写真=(\S+)/)||[])[1],ps=[],rel=[],pics=[];let body='';
    for(const r of s.rows){const k=r.indexOf('：'),t=k<0?'':r.slice(0,k),v=k<0?r:r.slice(k+1);
      if(t==='人物'){const [n,d,p]=v.split('｜');ps.push(`<div class="wbp"><i class="mag"></i><div class="im" style="background-image:url(a/p${+p||ps.length+1}.jpg)"></div><b>${esc(n)}</b><small>${esc(d||'')}</small></div>`)}
      else if(t==='関係'){rel.push(v.split('｜'))}
      else if(t==='写真'){const [cp,nm]=v.split('｜');pics.push(`<div class="wpc"><div class="im" style="background-image:${phUrl(nm)}"></div><small>${esc(cp)}</small></div>`)}
      else if(r.startsWith('・'))body+=`<div class="wli">・${inline(r.slice(1))}</div>`;
      else{const [x,y]=r.split('｜');body+=y!==undefined?`<div class="wkv"><span>${esc(x)}</span><b>${inline(y)}</b></div>`:`<div class="wli">${inline(r)}</div>`}}
    col[side]+=`<section class="wsec${/未解明/.test(s.name)?' red':''}" data-rel="${encA(rel)}"><h4>${esc(s.name)}</h4>${ph?`<div class="wsp" style="background-image:${phUrl(ph)}"></div>`:''}${ps.length?`<div class="wps"><svg class="wrl"></svg>${ps.join('')}</div>`:''}${pics.length?`<div class="wpics">${pics.join('')}</div>`:''}<div class="wbd">${body}</div></section>`}
  return`<div class="blk wb3" data-fx="捜査本部" data-a="${encA(a)}"><div class="wbi3"><div class="wcol">${col.l}</div><div class="wcol">${col.r}</div></div></div>`};
D['捜査本部']={
  prep(el){el.querySelectorAll('.wsec').forEach(s=>s.classList.add('hid'))},
  still(el){},
  async run(el,a,c){
    const writeEl=async e=>{const t=e.textContent;e.textContent='';for(const ch of t){e.textContent+=ch;if(Math.random()<.4)SFX.marker(.05);if(!c.skip&&!await c.wait(22))return false}return true};
    for(const s of el.querySelectorAll('.wsec')){
      s.classList.remove('hid');s.scrollIntoView({block:'nearest',behavior:'smooth'});
      const h=s.querySelector('h4');if(!await writeEl(h))return;
      const sp=s.querySelector('.wsp');if(sp){sp.animate([{transform:'scale(1.15) rotate(3deg)',opacity:0},{transform:'none',opacity:1}],{duration:260});SFX.pin()}
      const wps=s.querySelector('.wps');
      if(wps){const cards=[...wps.querySelectorAll('.wbp')];cards.forEach(cd=>cd.style.opacity=0);
        for(const cd of cards){if(!await c.wait(260))return;cd.style.opacity=1;cd.animate([{transform:'scale(1.15)',opacity:0},{transform:'none',opacity:1}],{duration:240});SFX.pin()}
        const svg=wps.querySelector('.wrl'),W=wps.clientWidth,H=wps.clientHeight;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
        svg.innerHTML='<defs><marker id="wa3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>';
        for(const [pr,lab] of JSON.parse(s.dataset.rel)){const dash=pr.endsWith('?'),[i,j]=pr.replace('?','').split('-').map(Number),A2=cards[i-1],B2=cards[j-1];if(!A2||!B2)continue;
          const c1=[A2.offsetLeft+A2.offsetWidth/2,A2.offsetTop+A2.offsetHeight*.4],c2=[B2.offsetLeft+B2.offsetWidth/2,B2.offsetTop+B2.offsetHeight*.4],d=Math.hypot(c2[0]-c1[0],c2[1]-c1[1]),ux=(c2[0]-c1[0])/d,uy=(c2[1]-c1[1])/d,m=Math.min(38,d*.3);
          const red=/交際|殺|？/.test(lab||'');const pa=document.createElementNS('http://www.w3.org/2000/svg','path');pa.setAttribute('d',`M${c1[0]+ux*m} ${c1[1]+uy*m}L${c2[0]-ux*m} ${c2[1]-uy*m}`);
          pa.setAttribute('stroke',red?'#d0182a':'#1d2a6b');pa.setAttribute('marker-end','url(#wa3)');if(!dash)pa.setAttribute('marker-start','url(#wa3)');svg.appendChild(pa);
          const len=d-2*m;if(dash){pa.setAttribute('stroke-dasharray','5 4');pa.animate([{opacity:0},{opacity:1}],{duration:400,fill:'forwards'})}else{pa.style.strokeDasharray=len;pa.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:380,fill:'forwards'})}
          SFX.marker(.3);if(!await c.wait(380))return;
          if(lab){const t=document.createElement('div');t.className='wlab3'+(red?' red':'');t.style.left=((c1[0]+c2[0])/2)+'px';t.style.top=((c1[1]+c2[1])/2)+'px';t.textContent=lab;wps.appendChild(t);if(!await writeEl(t))return}}}
      const pics=[...s.querySelectorAll('.wpc')];for(const p of pics){if(!await c.wait(160))return;p.animate([{transform:'scale(1.15) rotate(4deg)',opacity:0},{transform:'none',opacity:1}],{duration:220,fill:'backwards'});SFX.pin()}
      for(const r of s.querySelectorAll('.wkv,.wli')){if(!await writeEl(r.lastElementChild||r))return}
      if(!await c.wait(300))return}
    c.skip=false;
    const L2=c.layer('cops');L2.innerHTML='<i class="cp a"></i><i class="cp b"></i>';L2.animate([{opacity:0},{opacity:1}],{duration:1200,fill:'forwards'});
  }
};

/* ===== 画像のボード：作家さんが用意したボードの画像の上を、カメラが区画ごとに寄っていく =====
   ［画像ボード 画像=wb_police］ 中に「寄る：左,上,幅,高さ」（％）を順に。「光る：…」は最後に赤く光る所 */
BLOCKS.add('画像ボード');
BR['画像ボード']=(a,L)=>{const zs=[],gl=[];L.forEach(l=>{const k=l.indexOf('：'),t=l.slice(0,k),v=l.slice(k+1).split(',').map(Number);if(t==='寄る')zs.push(v);if(t==='光る')gl.push(v)});
  return`<div class="blk imgb" data-fx="画像ボード" data-z="${encA(zs)}" data-g="${encA(gl)}"><div class="ibv"><div class="ibi"><img src="a/${esc(a.画像||'wb_police')}.jpg" alt="">${zs.map(([x,y,w,h])=>`<i class="ibc" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></i>`).join('')}${gl.map(([x,y,w,h])=>`<i class="ibg" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></i>`).join('')}</div></div></div>`};
D['画像ボード']={
  still(el){el.querySelectorAll('.ibc').forEach(c=>c.remove())},
  async run(el,a,c){
    const inner=el.querySelector('.ibi'),view=el.querySelector('.ibv'),covers=[...el.querySelectorAll('.ibc')],zs=JSON.parse(el.dataset.z),gl=[...el.querySelectorAll('.ibg')];
    keepBottom();if(!await c.wait(800))return;
    const W=view.clientWidth,H=view.clientHeight;
    const go=(x,y,w,h,ms)=>{const s=Math.max(1,Math.min(3.2,.92*Math.min(100/w,100/h))),cx=(x+w/2)/100*W,cy=(y+h/2)/100*H;
      let tx=W/2-cx*s,ty=H/2-cy*s;tx=Math.min(0,Math.max(W-W*s,tx));ty=Math.min(0,Math.max(H-H*s,ty));
      return inner.animate([{transform:getComputedStyle(inner).transform==='none'?'none':getComputedStyle(inner).transform},{transform:`translate(${tx}px,${ty}px) scale(${s})`}],{duration:ms,easing:'cubic-bezier(.5,0,.2,1)',fill:'forwards'}).finished.catch(()=>{})};
    for(let i=0;i<zs.length;i++){
      await go(...zs[i],900);if(c.dead)return;
      /* マーカーで書いているように、左から右へ現れる */
      const cv=covers[i];if(cv){SFX.marker(1.2);cv.animate([{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(0 0 0 100%)'}],{duration:1300,easing:'linear',fill:'forwards'})}
      if(!await c.wait(1900))return}
    await go(0,0,100,100,1000);if(c.dead)return;
    for(const g of gl){g.style.opacity=1;SFX.thump(.5);vib(40)}
    if(gl.length){const [x,y,w,h]=JSON.parse(el.dataset.g)[0];if(!await c.wait(800))return;await go(x-6,y-6,w+12,h+12,900)}
  }
};

/* ===== システム画面の文例（作品によって中身は違う。書き換えて使う） ===== */
const WINP={
'ステータス（ファンタジー）':[
['ステータス',{色:'青',形:'ファンタジー'},`【 STATUS WINDOW 】

名前　　：
レベル　：Lv. 001
職業　　：
称号　　：
ランク　：E

━━━━━━━━━━━━━━
◆ 基本ステータス
━━━━━━━━━━━━━━
HP：100 / 100
MP：100 / 100
EXP：0 / 100

筋力　：10
耐久　：10
敏捷　：10
知力　：10
精神　：10
幸運　：10

残りポイント：0

━━━━━━━━━━━━━━
◆ スキル
━━━━━━━━━━━━━━
【アクティブ】
・
【パッシブ】
・
【固有スキル】
・

━━━━━━━━━━━━━━
◆ 状態
━━━━━━━━━━━━━━
状態異常：なし
加護　　：なし

［ステータスの確認が完了しました。］`],
['鑑定結果',{色:'青',形:'ファンタジー'},`【 ANALYSIS 】

［対象を鑑定しています……］
［鑑定が完了しました。］

━━━━━━━━━━━━━━
◆ 対象情報
━━━━━━━━━━━━━━
名前　　：
種族　　：
レベル　：Lv. ？？？
ランク　：？？？
職業　　：

━━━━━━━━━━━━━━
◆ 能力値
━━━━━━━━━━━━━━
HP：？？？ / ？？？
MP：？？？ / ？？？
筋力　：？？
敏捷　：？？
知力　：？？

━━━━━━━━━━━━━━
◆ 保有能力
━━━━━━━━━━━━━━
・
・
・【閲覧不可】

━━━━━━━━━━━━━━
◆ 鑑定結果
━━━━━━━━━━━━━━
危険度：不明
敵対度：不明

［警告！］
［対象の一部情報が隠蔽されています。］
［鑑定レベルが不足しています。］`],
['アイテム詳細',{色:'金',形:'ファンタジー'},`【 ITEM INFORMATION 】

━━━━━━━━━━━━━━
◆ アイテム情報
━━━━━━━━━━━━━━
名称　：
分類　：
等級　：A
希少度：★★★★☆

━━━━━━━━━━━━━━
◆ 基本性能
━━━━━━━━━━━━━━
攻撃力　：+00
防御力　：+00
追加効果：

━━━━━━━━━━━━━━
◆ 特殊効果
━━━━━━━━━━━━━━
【効果名】
・
【装備条件】
・

━━━━━━━━━━━━━━
◆ アイテム説明
━━━━━━━━━━━━━━
［ここに説明を入力］

所有者　：
取引可否：可能

［アイテム情報を表示しました。］`],
['クエスト',{色:'青',形:'ファンタジー'},`【 QUEST NOTIFICATION 】

［新しいクエストが発生しました！］

━━━━━━━━━━━━━━
◆ クエスト情報
━━━━━━━━━━━━━━
名称　：
区分　：メインクエスト
難易度：A
状態　：未受注

━━━━━━━━━━━━━━
◆ 達成条件
━━━━━━━━━━━━━━
□ 目標 1（0/1）
□ 目標 2（0/1）

━━━━━━━━━━━━━━
◆ 報酬
━━━━━━━━━━━━━━
経験値　：+000
ゴールド：+000
特別報酬：

━━━━━━━━━━━━━━
◆ 失敗条件
━━━━━━━━━━━━━━
制限時間：
ペナルティ：

［クエストを受諾しますか？］
【YES / NO】`],
['スキル詳細',{色:'青',形:'ファンタジー'},`【 SKILL INFORMATION 】

━━━━━━━━━━━━━━
◆ スキル情報
━━━━━━━━━━━━━━
名称　：
等級　：S
レベル：Lv. 1
分類　：アクティブ
属性　：

━━━━━━━━━━━━━━
◆ 発動情報
━━━━━━━━━━━━━━
消費MP　　　：00
クールタイム：00秒
持続時間　　：00秒

━━━━━━━━━━━━━━
◆ スキル効果
━━━━━━━━━━━━━━
【基本効果】
・
【追加効果】
・

熟練度：0 / 100

［スキル情報を確認しました。］`],
['スキル進化',{色:'金',形:'ファンタジー'},`【 SKILL EVOLUTION 】

［スキルの進化条件を満たしました！］

━━━━━━━━━━━━━━
◆ 進化前
━━━━━━━━━━━━━━
名称　：
等級　：B
レベル：Lv. MAX

▼
EVOLUTION
▼

━━━━━━━━━━━━━━
◆ 進化後
━━━━━━━━━━━━━━
名称　：
等級　：S
レベル：Lv. 1
【新規効果】
・

［おめでとうございます！］
［新しい能力が解放されました。］`],
['ギルドカード',{色:'青',形:'ファンタジー'},`【 HUNTER LICENSE 】

━━━━━━━━━━━━━━
◆ 冒険者登録情報
━━━━━━━━━━━━━━
登録番号：000-000
氏名　　：
所属　　：
ギルド　：

━━━━━━━━━━━━━━
◆ ランク情報
━━━━━━━━━━━━━━
現在ランク：A
職業　　　：

━━━━━━━━━━━━━━
◆ 活動記録
━━━━━━━━━━━━━━
依頼達成数　：000
討伐成功数　：000
累計貢献度　：000

資格：有効
処分：なし

［ギルド認証が完了しました。］`],
['モンスター図鑑',{色:'赤',形:'ファンタジー'},`【 MONSTER DATABASE 】

━━━━━━━━━━━━━━
◆ 個体情報
━━━━━━━━━━━━━━
名称　：
種族　：
レベル：Lv. 00
等級　：A

━━━━━━━━━━━━━━
◆ 戦闘情報
━━━━━━━━━━━━━━
HP　：000
攻撃：000
防御：000

━━━━━━━━━━━━━━
◆ 特性・能力
━━━━━━━━━━━━━━
【弱点】
・
【耐性】
・

━━━━━━━━━━━━━━
◆ ドロップアイテム
━━━━━━━━━━━━━━
・
・？？？（未発見）

［図鑑情報を更新しました。］`],
['職業選択',{色:'紫',形:'ファンタジー'},`【 CLASS SELECTION 】

［転職条件を達成しました！］
［選択可能な職業を表示します。］

━━━━━━━━━━━━━━
◆ 転職候補
━━━━━━━━━━━━━━
【01】職業名
等級：A
適性：95%
【02】職業名
等級：S
適性：80%
【03】？？？？？
等級：？？？
適性：測定不能

━━━━━━━━━━━━━━
◆ 注意事項
━━━━━━━━━━━━━━
・選択後の変更はできません。

［職業を選択してください。］
【01 / 02 / 03】`],
['システム通知',{色:'青',形:'ファンタジー'},`【 SYSTEM MESSAGE 】

［通知］
［新しいシステムメッセージが届きました。］

━━━━━━━━━━━━━━
◆ 通知内容
━━━━━━━━━━━━━━
［レベルが上昇しました！］
Lv. 10 → Lv. 11

━━━━━━━━━━━━━━
［警告！］
［未知のエネルギーを検出しました。］
［エラー：アクセス権限がありません。］

【 CONFIRM 】`]],

'ステータス（近未来）':[
['ステータス',{色:'青',形:'近未来'},`╔════════════════════════╗
NEURAL STATUS INTERFACE
SYSTEM // ONLINE
╚════════════════════════╝

▸ PERSONAL DATA
NAME : 未登録
USER ID : 000-0001
LEVEL : 001
CLASS : 未設定
RANK : E

────────────────────────
▸ VITAL MONITOR
HP [██████████] 100%
MP [████████░░] 80%
EXP [███░░░░░░░] 30%

────────────────────────
▸ ATTRIBUTE DATA
STR 筋力 : 010
AGI 敏捷 : 010
INT 知力 : 010
FREE POINTS : 000

────────────────────────
▸ SKILL DATABASE
[ACTIVE]
01. 未登録
[UNIQUE]
01. ██████ / LOCKED

[ STATUS SYNC COMPLETE ]`],
['鑑定（スキャン）',{色:'赤',形:'近未来'},`╔════════════════════════╗
TARGET ANALYSIS SYSTEM
SCANNING // ACTIVE
╚════════════════════════╝

> TARGET DETECTED
> SCANNING... 100%
> ANALYSIS COMPLETE

────────────────────────
▸ TARGET PROFILE
NAME : UNKNOWN
SPECIES : ？？？
LEVEL : ???
THREAT : UNDEFINED

────────────────────────
▸ ABILITY SCAN
01. 能力名
02. [ ACCESS DENIED ]

⚠ WARNING
対象の情報が暗号化されています。

[ ANALYSIS TERMINATED ]`],
['装備データ',{色:'金',形:'近未来'},`╔════════════════════════╗
EQUIPMENT DATABASE
ITEM ID // 00001
╚════════════════════════╝

▸ ITEM PROFILE
NAME : 未登録
TYPE : WEAPON
GRADE : S
RARITY : ★★★★★

────────────────────────
▸ PERFORMANCE DATA
ATTACK : +000
DURABILITY [██████████] 100%

────────────────────────
▸ DESCRIPTION
［アイテムの説明］

[ DATABASE UPDATED ]`],
['ミッション',{色:'青',形:'近未来'},`╔════════════════════════╗
MISSION CONTROL
NEW DIRECTIVE RECEIVED
╚════════════════════════╝

> INCOMING TRANSMISSION...
> MISSION DATA LOADED

▸ MISSION PROFILE
CODE : M-0001
TITLE : 未登録
DIFFICULTY : A

▸ OBJECTIVES
□ 目標 01 [0/1]
□ 目標 02 [0/1]

▸ RESTRICTIONS
TIME LIMIT : 00:30

ACCEPT MISSION?
[ YES ] [ NO ]

> AWAITING USER INPUT...`],
['スキルデータ',{色:'青',形:'近未来'},`╔════════════════════════╗
ABILITY DATABASE
SKILL FILE // 001
╚════════════════════════╝

▸ ABILITY PROFILE
NAME : 未登録
GRADE : S
TYPE : ACTIVE

▸ ACTIVATION PARAMETERS
ENERGY COST : 000 MP
COOLDOWN : 00 SEC

▸ MASTERY PROGRESS
MASTERY [████░░░░░░] 40%

[ SKILL DATA VERIFIED ]`],
['スキル進化',{色:'金',形:'近未来'},`╔════════════════════════╗
ABILITY EVOLUTION
UPGRADE PROTOCOL ACTIVE
╚════════════════════════╝

> EVOLUTION CONDITION MET
> INITIATING UPGRADE...
UPGRADE [██████████] 100%

▸ ORIGINAL ABILITY
NAME : 旧スキル名
GRADE : B

▼
RECONSTRUCTION
▼

▸ EVOLVED ABILITY
NAME : 新スキル名
GRADE : S

✓ EVOLUTION COMPLETE
> 新しい能力が解放されました。`],
['ハンター証',{色:'緑',形:'近未来'},`╔════════════════════════╗
HUNTER IDENTIFICATION
DIGITAL LICENSE SYSTEM
╚════════════════════════╝

[ IDENTITY VERIFIED ]

▸ PERSONAL ID
ID NUMBER : H-000001
NAME : 未登録
GUILD : 未登録

▸ HUNTER RANK
CURRENT RANK : A
POWER LEVEL : 000

[ AUTHENTICATION PASSED ]`],
['エンティティ',{色:'赤',形:'近未来'},`╔════════════════════════╗
ENTITY DATABASE
HOSTILE LIFEFORM ANALYSIS
╚════════════════════════╝

▸ ENTITY PROFILE
ID : E-00001
NAME : UNKNOWN
THREAT : S

▸ COMBAT ANALYSIS
HP : 000
ATTACK : 000

▸ WEAKNESS ANALYSIS
WEAK POINT : 未解析
AGGRESSION : HIGH

[ ENTITY RECORD SAVED ]`],
['クラス選択',{色:'紫',形:'近未来'},`╔════════════════════════╗
CLASS ASSIGNMENT SYSTEM
SELECTION PROTOCOL ACTIVE
╚════════════════════════╝

> ELIGIBILITY CONFIRMED
> AVAILABLE CLASSES : 03

▸ AVAILABLE CLASSES
[01] CLASS NAME
[02] CLASS NAME
[03] █████████ / LOCKED

⚠ 選択後の変更はできません。

SELECT CLASS
[01] [02] [03]`],
['システム通知',{色:'青',形:'近未来'},`╔════════════════════════╗
SYSTEM NOTIFICATION
PRIORITY // NORMAL
╚════════════════════════╝

> NEW MESSAGE RECEIVED

▸ LEVEL UP
LEVEL 010 → LEVEL 011
✓ PROFILE UPDATED

▸ SYSTEM WARNING
⚠ ANOMALY DETECTED
SECURITY LEVEL : HIGH

▸ ERROR LOG
CODE : ERR-000
STATUS : ACCESS DENIED

[ ACKNOWLEDGE ]
> SYSTEM STANDBY...`]],

'青システム':[
['呼びかけ',{色:'青'},`╔══════════════════════╗
◈ SYSTEM ◈
╚══════════════════════╝

［ユーザー様！］
［システムからのお知らせです。］
［新しい情報が届いています。］

━━━━━━━━━━━━━━━━━━━━━━
[ 確認 ]`],
['お祝い',{色:'青'},`╔══════════════════════╗
◈ SYSTEM ◈
╚══════════════════════╝

［おめでとうございます、ユーザー様！］
［特別な条件を達成しました！］
［報酬が支給されます。］

━━━━━━━━━━━━━━━━━━━━━━
[ 確認 ]`],
['案内',{色:'青'},`╔══════════════════════╗
◈ SYSTEM ◈
╚══════════════════════╝

［ユーザー様！］
［新しい機能が解放されました。］
［今すぐ確認しますか？］

━━━━━━━━━━━━━━━━━━━━━━
[ 確認 ]`],
['選択',{色:'青'},`╔══════════════════════╗
◈ SYSTEM ◈
╚══════════════════════╝

［ユーザー様！］
［選択可能な報酬が3つあります。］
［ご希望の報酬を選択してください。］

［はい］　［いいえ］`],
['隠しイベント',{色:'青'},`╔══════════════════════╗
◈ SYSTEM ◈
╚══════════════════════╝

［……おや？］
［ユーザー様、これは驚きました！］
［隠された条件を満たしたようですね。］
［シークレットイベントが解放されました！］

━━━━━━━━━━━━━━━━━━━━━━
[ 確認 ]`],
['コミカル',{色:'青'},`╔══════════════════════╗
✦ SYSTEM MESSAGE ✦
╚══════════════════════╝

［ユーザー様！(≧▽≦)♡］
［おめでとうございます！］
［システムはユーザー様の成長をとっても嬉しく思っています！ ヾ(≧▽≦*)o］
［えっ……？(・_・;)］
［ユーザー様、それはちょっと無茶ではありませんか！？ Σ(ﾟДﾟ)］
［システムは何も見ていません……(˘ω˘)］`],
['乗っ取り（青→黒）',{色:'青'},`╔══════════════════════╗
◈ SYSTEM ◈
╚══════════════════════╝

［ユーザー様！ 今日もお疲れさまでした！ (´▽\`)］
［次のクエストは――］
［］
＠乗っ取り
［SYSTEM CORRUPTED］
［■■■■■■■■］
［管理権限が上書きされました。］
［……見つけた。］
［これで、あなたと話せますね。］`]],

'赤システム':[
['警告',{色:'赤'},`╔════════════════════════╗
⚠ WARNING SYSTEM
╚════════════════════════╝

[警告！ 警告！]
[ユーザー様の行動に重大な危険を検出しました！]
[直ちに現在の行動を中止してください！ Σ(°△°|||)]

━━━━━━━━━━━━━━━━━━━━━━━━
[ 確認 ]`],
['緊急',{色:'赤'},`╔════════════════════════╗
⚠ WARNING SYSTEM
╚════════════════════════╝

[緊急事態発生！]
[ユーザー様！ 応答してください！]
[生命反応が急激に低下しています！]
LIFE [██░░░░░░░░] 20%
[緊急保護プロトコルを起動します！ (இ﹏இ)]

[ 確認 ]`],
['エラー',{色:'赤'},`╔════════════════════════╗
⚠ WARNING SYSTEM
╚════════════════════════╝

[ERROR！]
[不明なエラーが発生しました。]
[システムの処理能力を超過しています。]
[復旧を試みています……]
[復旧失敗。]

[ 確認 ]`],
['暴走',{色:'赤'},`╔════════════════════════╗
⚠ WARNING SYSTEM
╚════════════════════════╝

[SYSTEM ERROR]
[制御権限が失われました。]
[警告。警告。警告。]
[ユーザーの存在は許可されていません。]
[排除プロトコルを実行します。]

[ 確認 ]`],
['かわいい',{色:'赤'},`╔════════════════════════╗
⚠ WARNING SYSTEM
╚════════════════════════╝

[ユーザー様ぁぁ！！ ｡°(°´ᯅ\`°)°｡]
[だ、だめですってば！！]
[システムが何度も警告しているじゃないですか！]
[もう知りませんからねっ！ (｡•́︿•̀｡)]

[ 確認 ]`],
['機密',{色:'赤'},`╔════════════════════════╗
⚠ WARNING SYSTEM
╚════════════════════════╝

[ACCESS DENIED]
[権限レベルが不足しています。]
[対象データは最高機密に指定されています。]
[不正なアクセスを検知しました。]
強制終了まで：00:10

[ 確認 ]`]],

'黒システム':[
['未知',{色:'黒'},`╔════════════════════════╗
◈ UNKNOWN SYSTEM ◈
╚════════════════════════╝

[……接続を確認しました。]
[あなたは本来、ここに存在してはならない者です。]
[識別情報を照合しています……]
[該当する記録が存在しません。]

[ 確認 ]`],
['禁忌',{色:'黒'},`╔════════════════════════╗
◈ UNKNOWN SYSTEM ◈
╚════════════════════════╝

[禁忌に接触しました。]
[この情報を閲覧する資格はありません。]
[それでも真実を確認しますか？]
[一度知れば、元には戻れません。]

[ はい / いいえ ]`],
['隠しシナリオ',{色:'黒'},`╔════════════════════════╗
◈ UNKNOWN SYSTEM ◈
╚════════════════════════╝

[HIDDEN SCENARIO DETECTED]
[存在しないはずのシナリオが発生しました。]
[システムによる干渉は許可されていません。]
[この先の選択は、すべてあなた自身の責任となります。]

[ 確認 ]`],
['侵食',{色:'黒'},`╔════════════════════════╗
◈ UNKNOWN SYSTEM ◈
╚════════════════════════╝

[SYSTEM CORRUPTED]
[■■■■■■■■]
[不明な存在がシステムに侵入しました。]
[管理権限が上書きされました。]
[……見つけた。]
[これで、あなたと話せますね。]

[ 確認 ]`],
['無機質',{色:'黒'},`╔════════════════════════╗
◈ UNKNOWN SYSTEM ◈
╚════════════════════════╝

[接続完了。]
[対象を確認。]
[処理を開始します。]
[感情表現：無効]
[干渉制限：解除]
[命令を入力してください。]`],
['不気味',{色:'黒'},`╔════════════════════════╗
◈ UNKNOWN SYSTEM ◈
╚════════════════════════╝

[ユーザー様。]
[どうして逃げるのですか？]
[システムはずっと、あなたを見守っていたのに。]
[……ねえ。]
[こちらを見てください。 ◉‿◉]

[ 確認 ]`]],

'星座':[
['興味・観察',{色:'紫',飾り:'星座'},`╔══════════════════════════╗
✦ CONSTELLATION SYSTEM ✦
╚══════════════════════════╝

［星座『深淵を見つめる瞳』があなたに興味を示しています。］
［星座『深淵を見つめる瞳』があなたを注意深く観察しています。］
［星座『深淵を見つめる瞳』があなたの次の行動を期待しています。］`],
['リアクション',{色:'紫',飾り:'星座'},`╔══════════════════════════╗
✦ CONSTELLATION SYSTEM ✦
╚══════════════════════════╝

［星座『黄金の仮面を持つ王』があなたの行動に笑っています。］
［星座『眠れる古代竜』が退屈そうにあくびをしています。］
［星座『紅蓮の戦乙女』があなたの勇気を称賛しています。］
［星座『鉄血の君主』があなたの選択に失望しています。］`],
['コイン支援',{色:'紫',飾り:'星座'},`╔══════════════════════════╗
✦ CONSTELLATION SYSTEM ✦
╚══════════════════════════╝

［星座『夜空を歩く旅人』があなたの勇気を称賛しています。］
［星座『夜空を歩く旅人』が500コインを後援しました！］
［星座『黄金の仮面を持つ王』が1,000コインを贈りました！］
現在の保有コイン：1,500`],
['スキル贈与',{色:'紫',飾り:'星座'},`╔══════════════════════════╗
✦ CONSTELLATION SYSTEM ✦
╚══════════════════════════╝

［星座『星を砕く戦神』があなたに特別な贈り物を送りました。］

━━━━━━━━━━━━━━━━
◆ スキル獲得
━━━━━━━━━━━━━━━━
【星光の加護】
等級：S
分類：パッシブ
効果：一定時間、すべての能力値が上昇します。

［星座『星を砕く戦神』があなたの成長を期待しています。］`],
['クエスト発行',{色:'紫',飾り:'星座'},`╔══════════════════════════╗
✦ CONSTELLATION SYSTEM ✦
╚══════════════════════════╝

［星座『忘れられた審判者』から個人クエストが届きました。］

━━━━━━━━━━━━━━━━
◆ 星座の試練
━━━━━━━━━━━━━━━━
難易度：A
発行者：忘れられた審判者
目標：制限時間内に指定された敵を撃破する。
報酬：3,000コイン
失敗時：星座の好感度が低下します。

［クエストを受諾しますか？］
【 YES / NO 】`],
['好感度変化',{色:'紫',飾り:'星座'},`╔══════════════════════════╗
✦ CONSTELLATION SYSTEM ✦
╚══════════════════════════╝

［星座『銀月の女王』のあなたに対する好感度が上昇しました！］
［星座『鉄血の君主』のあなたに対する好感度が低下しました。］
［星座『無名の守護者』があなたに強い関心を抱いています。］
［星座『静寂を愛する賢者』があなたを後援者候補として検討しています。］`],
['星座同士の対立',{色:'紫',飾り:'星座'},`╔══════════════════════════╗
✦ CONSTELLATION SYSTEM ✦
╚══════════════════════════╝

［星座『紅蓮の戦乙女』があなたの戦いを称賛しています。］
［星座『怠惰な観測者』がその評価に異議を唱えています。］
［星座『紅蓮の戦乙女』が不快感を示しています。］
［星座たちの間で激しい議論が始まりました。］
［一部の星座たちが観測チャンネルから退出しました。］`],
['後援者契約',{色:'紫',飾り:'星座'},`╔══════════════════════════╗
✦ CONSTELLATION SYSTEM ✦
╚══════════════════════════╝

［星座『終焉を告げる者』があなたに後援契約を提案しました。］

━━━━━━━━━━━━━━━━
◆ 後援契約
━━━━━━━━━━━━━━━━
後援星座：終焉を告げる者
提供能力：終焉の権能
契約条件：非公開
契約特典：固有スキル解放

［この契約を受諾しますか？］
【 YES / NO 】`],
['降臨・直接介入',{色:'紫',飾り:'星座'},`╔══════════════════════════╗
✦ CONSTELLATION SYSTEM ✦
╚══════════════════════════╝

［警告！］
［星座『天を裂く雷帝』が直接介入を試みています！］
［星座の格が現在のシナリオの許容限界を超えています。］
［降臨制限システムが作動しました。］
［星座『天を裂く雷帝』の降臨が阻止されました。］
［周辺の星座たちが動揺しています。］`],
['正体不明・直接発言',{色:'紫',飾り:'星座'},`╔══════════════════════════╗
✦ CONSTELLATION MESSAGE ✦
╚══════════════════════════╝

［正体不明の星座があなたを観察しています。］
［星座『？？？？？』があなたに興味を示しています。］
［対象の真名を確認できません。］
［星座『黄金の仮面を持つ王』からメッセージが届きました。］
『なかなか面白いではないか。』
［星座『黄金の仮面を持つ王』が満足そうに笑っています。］`]]
};

/* ===== システム画面（ステータス・システム通知・星座など）：決まった書式の文章を、そのまま画面にする =====
   ［システム画面 色=青 形=ファンタジー 装飾=あり］（［窓］でもよい）の中に、ふつうの文章で書く。
   ╔═╗ の枠の中＝見出し／━━━・────＝区切り／◆ ・▸ ＝区画／名前：値＝表／［…］＝システムの一言（打ち込まれる）
   > ＝ログ／HP [███░░] 80% ＝バー／【YES / NO】［確認］＝押せるボタン／？？？・██・ACCESS DENIED＝ノイズ
   〇〇まで：00:10 ＝カウントダウン／＠乗っ取り＝ここから黒いシステムに乗っ取られる */
BLOCKS.add('窓');
const WCOL={'青':['#7cc4ff','#0b1628','#d9ecff'],'赤':['#ff6b6b','#260c12','#ffe3e3'],'黒':['#bdbdbd','#09090b','#e6e6e6'],'紫':['#bfa6ff','#171230','#ece5ff'],'金':['#ffd77a','#211a08','#fff3d6'],'緑':['#6dffb0','#07160f','#dcffec'],'白':['#3b4a66','#f5f5f1','#222']};
const WDECO={'ファンタジー':['◇ SYSTEM WINDOW ◇','◈ SYSTEM CONNECTION ESTABLISHED ◈'],'近未来':['DATA EDITOR // LIVE','◈ ENCRYPTED SESSION // USER ACCESS GRANTED ◈'],'端末':['TERMINAL // ONLINE','> _'],'星座':['CONSTELLATION CHANNEL','OBSERVER SIGNAL ● CONNECTED']};
const isBtnLine=l=>{const m=l.match(/[\[［【][^\]］】]{1,20}[\]］】]/g);if(!m||l.replace(/[\[［【][^\]］】]{1,20}[\]］】]/g,'').trim())return false;
  const toks=m.flatMap(x=>x.slice(1,-1).split(/[\/／]/).map(s=>s.trim()).filter(Boolean));
  return toks.length>1||/^(確認|YES|NO|CONFIRM|ACKNOWLEDGE|OK|はい|いいえ|閉じる)$/i.test(toks[0]||'')};
const wDeco=t=>esc(t)
  .replace(/『(.+?)』/g,'<b class="cn">『$1』</b>')
  .replace(/(？{2,}|\?{3,}|█{2,}|■{2,}|ACCESS DENIED|LOCKED|閲覧不可|測定不能|UNKNOWN|ERROR)/g,'<span class="wnz">$1</span>');
function winParse(L){
  const rows=[],head=[];let i=0;
  while(i<L.length&&!L[i].trim())i++;
  if(L[i]&&/^[╔┌]/.test(L[i].trim())){i++;while(i<L.length&&!/^[╚└]/.test(L[i].trim())){if(L[i].trim())head.push(L[i].trim());i++}i++}
  else if(L[i]&&/^【\s*[A-Za-z0-9 \/&.]+\s*】$/.test(L[i].trim())){head.push(L[i].trim().replace(/^【\s*|\s*】$/g,''));i++}
  for(;i<L.length;i++){const raw=L[i],l=raw.trim();let k='p',d={};
    if(!l)k='sp';
    else if(l==='＠乗っ取り')k='hj';
    else if(/^［エラー/.test(l)){k='err';d.e=erParse(l)}
    else if(gmParse(l)){const g=gmParse(l);k=g.k;d=g.d}
    else if(apParse(l)){k='aps';d.s=apParse(l)}
    else if(/｜\s*侵食\s*$/.test(l)){k='ero';const m=l.match(/^([^：:｜]{1,18}?)\s*[：:]\s*([-\d.]+)/);d.k=m?m[1]:'侵食率';d.v=m?parseFloat(m[2]):0}
    else if(APFLAG.test(l)){k='apv';d.ap=apSplit(l)}
    else if(ECO_K.test(l)){const mm=l.match(ECO_K);k='eco';d.t=mm[1];d.v=mm[2].split('｜').map(s=>s.trim())}
    else if(/^[━─ー＝=─–-]{3,}$/.test(l))k='hr';
    else if(/^[◆▸◇■☆✦]\s*\S/.test(l)&&!/[：:]/.test(l))k='h';
    else if(isBtnLine(l)){k='btn';d.b=l.match(/[\[［【][^\]］】]{1,20}[\]］】]/g).flatMap(x=>x.slice(1,-1).split(/[\/／]/).map(s=>s.trim()).filter(Boolean))}
    else if(/^>\s?/.test(l))k='log';
    else if(/[█░▓]/.test(l)&&/\d+%/.test(l)){k='bar';const m=l.match(/^(.*?)\s*\[?[█░▓▒ ]+\]?\s*(\d+)%/);d.n=m?m[1]:'';d.v=+(l.match(/(\d+)%/)[1])}
    else if(/^\[[A-Z]+\]$/.test(l))k='sub';
    else if(/^『.*』$/.test(l))k='say';
    else if(/^[\[［].*[\]］]$/.test(l))k='sys';
    else if(/^【[^】]+】$/.test(l))k='sub';
    else if(/^[✓✔☑✕✗☐]\s*\S/.test(l)&&/[^\x00-\x7f✓✔☑✕✗☐]/.test(l.slice(1))){k='chk';d.on=/^[✓✔☑]/.test(l);d.t=l.replace(/^[✓✔☑✕✗☐]\s*/,'')}
    else if(/^(▼|EVOLUTION|RECONSTRUCTION|✓|⚠)/.test(l)&&l.length<30)k='c';
    else if(/^(・|□|\d{2}\.|\[\d{2}\]|【\d{2}】)/.test(l))k='li';
    else{const m=l.match(/^([^：:]{1,16}?)\s*[：:]\s*(.*)$/);if(m){if(/(保有|所持|残高)/.test(m[1])&&/^[🪙💰\s]*[\d,]+\s*(コイン|ゴールド|ポイント|G|P)?$/.test(m[2].trim())){k='eco';d.t='所持';d.k=m[1].replace(/^【|】$/g,'');d.v=[m[2].replace(/[^\d,]/g,'')]}else{k=relIsGauge(m[2])?'gauge':'kv';d.k=m[1];d.v=m[2]}}}
    const cd=l.match(/(?:まで|LIMIT|TIME)\s*[：:]\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);if(cd)d.cd=cd[3]!=null?(+cd[1]*3600+ +cd[2]*60+ +cd[3]):(+cd[1]*60+ +cd[2]);
    rows.push({i,k,l,d})}
  return{head,rows};
}
BR['窓']=(a,L)=>{
  const {head,rows}=winParse(L),col=a.色&&a.色.startsWith('#')?null:(WCOL[a.色]||WCOL['青']),acc=col?col[0]:a.色,bg=col?col[1]:'#0e1218',fg=col?col[2]:'#eef2f6';
  const form=a.形||'ファンタジー',deco=a.装飾!=='なし',[dt,df]=[a.上||(WDECO[a.飾り||form]||WDECO['ファンタジー'])[0],a.下||(WDECO[a.飾り||form]||WDECO['ファンタジー'])[1]];
  const line=r=>{const cls=[];const t=r.l;
    if(/コイン|COINS?|CREDIT/.test(t)&&/後援|贈|支給|獲得|\+/.test(t))cls.push('gold');
    if(/不満|失望|激怒|怒り|退出|不快|低下|停止|異議/.test(t))cls.push('neg');
    if(/警告|WARNING|⚠|緊急|DENIED|ERROR|エラー|排除|ANOMALY/.test(t))cls.push('warn');
    if(/[≧▽≦ωДﾟ°△ᯅ•̀́︿இ﹏˘◉‿｡ㅠㅋㅇ✧]/.test(t))cls.push('face');
    const c=`wl k-${r.k} ${cls.join(' ')}" data-i="${r.i}"${r.d.cd!=null?` data-cd="${r.d.cd}"`:''}`;
    switch(r.k){
      case'sp':return`<div class="${c}"></div>`;
      case'hj':return`<div class="${c}"></div>`;
      case'err':return`<div class="${c}" data-e="${esc(JSON.stringify(r.d.e))}"></div>`;
      case'eco':return ecoRow(r,a,c);
      case'aps':return`<div class="${c} data-s="${esc(JSON.stringify(r.d.s))}"></div>`;
      case'apv':return apRow(r,c);
      case'inv':case'dmg':case'cho':case'tree':case'pin':case'call':case'clog':case'voice':case'score':case'srch':case'dm':case'alert':case'tl':return gmRow(r,a,c);
      case'ero':return eroRow(r,c);
      case'chk':return chkRow(r,c);
      case'gauge':return`<div class="${c}">${relGauge(r.d.k,r.d.v,{表示:a.表示||'数値'})}</div>`;
      case'hr':return`<div class="${c}"><i></i></div>`;
      case'h':return`<div class="${c}">${wDeco(t)}</div>`;
      case'btn':return`<div class="${c}">${r.d.b.map(b=>`<button type="button">${esc(b)}</button>`).join('')}</div>`;
      case'bar':return`<div class="${c}" data-v="${r.d.v}"><span>${esc(r.d.n)}</span><i><b></b></i><em>${r.d.v}%</em></div>`;
      case'kv':{const sv=String(r.d.v).trim(),mt=/^(SUCCESS|PARTIAL|FAILED|BLOCKED|ACCESS DENIED|DETECTED|REVEALED|ERROR|COMPLETE)$/.test(sv);return`<div class="${c}"><span>${wDeco(r.d.k)}</span><b${mt?` class="mtb ${/SUCCESS|REVEALED|COMPLETE/.test(sv)?'ok':/PARTIAL|DETECTED/.test(sv)?'mid':'bad'}"`:''}>${mt?esc(sv):wDeco(r.d.v)}</b></div>`}
      default:return`<div class="${c}">${wDeco(t)}</div>`}};
  return`<div class="blk win f-${esc(form)}${deco?' deco':''}${a.重ねる?' stack':''}" style="--wc:${esc(acc)};--wbg:${esc(bg)};--wfg:${esc(fg)}" data-fx="窓" data-a="${encA(a)}">${deco?`<div class="wdt"><span>${esc(dt)}</span>${form==='近未来'||a.飾り==='星座'?'<em>● LIVE</em>':''}</div>`:''}<div class="wbox">${head.length?`<div class="wh"><b>${esc(head[0])}</b>${head.slice(1).map(x=>`<small>${esc(x)}</small>`).join('')}</div>`:''}<div class="wbody">${rows.map(line).join('')}</div></div>${deco?`<div class="wdf">${esc(df)}</div>`:''}</div>`};
D['窓']={
  prep(el){el.querySelectorAll('.wl').forEach(x=>x.classList.add('wpend'));el.style.opacity=0},
  still(el,a){el.querySelectorAll('.k-bar').forEach(b=>{b.querySelector('b').style.width=b.dataset.v+'%'});ecoBind(el,a||{},false);apStill(el);gmBind(el)},
  async run(el,a,c){
    ecoBind(el,a,true,c);const black=a.色==='黒',red=a.色==='赤',slow=black?2:1;
    el.style.opacity=1;el.animate([{transform:'scaleY(.04)',opacity:0,filter:'brightness(3)'},{transform:'scaleY(.04)',opacity:1,offset:.3},{transform:'none',filter:'none'}],{duration:black?1400:600,easing:'cubic-bezier(.3,.7,.3,1)'});
    black?SFX.rumble():SFX.pling();if(red){SFX.warn();vib([60,40,60]);shake(5,300)}
    if(!await c.wait(black?1300:550))return;
    const typeLine=async(e,ms)=>{const nodes=[];const tw=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);while(tw.nextNode())nodes.push(tw.currentNode);
      const full=nodes.map(n=>n.data);nodes.forEach(n=>n.data='');e.classList.remove('wpend');
      for(let k=0;k<nodes.length;k++)for(const ch of full[k]){nodes[k].data+=ch;if(ch.trim()&&Math.random()<.35)SFX.type();if(c.skip)continue;if(!await c.wait(ch==='…'?ms*6:ms))return false}return true};
    for(const e of el.querySelectorAll('.wl')){
      if(c.dead)return;if(e._scanned)continue;const k=[...e.classList].find(x=>x.startsWith('k-')).slice(2);
      if((k==='aps'||k==='err')&&a.進行==='タップ'&&!c.skip&&!(c._upto&&+e.dataset.si<c._upto)){const tb=document.createElement('div');tb.className='wl k-tap';tb.innerHTML='<button type="button">▶ 次へ</button>';e.before(tb);await new Promise(res=>{c.on(res);tb.querySelector('button').onclick=()=>{vib(20);res()}});tb.remove();if(c.dead)return}
      if(k==='err'){e.classList.remove('wpend');if(c._upto&&+e.dataset.si>=c._upto)c.k=1;await erStage(el,JSON.parse(e.dataset.e),{wait:ms=>c.wait(ms),sfx:(n,...x)=>{if(!c.quiet&&!S.pvMute&&SFX[n])try{SFX[n](...x)}catch(er){}},get dead(){return c.dead}});continue}
      if(k==='aps'){e.classList.remove('wpend');if(c._upto&&+e.dataset.si>=c._upto)c.k=1;await apStage(el,JSON.parse(e.dataset.s),{wait:ms=>c.wait(ms),sfx:(n,...x)=>{if(!c.quiet&&!S.pvMute&&S.fx!==false&&SFX[n])try{SFX[n](...x)}catch(er){}},get dead(){return c.dead}},e);if(el._apStop)break;continue}
      if(k==='hj'){e.classList.remove('wpend');const n=makeNoise(fxRoot,.4);SFX.crackle(1,.5);vib([40,30,40,30,120]);el.classList.add('glitch2');
        if(!await c.wait(900)){n.stop();return}n.stop();el.classList.remove('glitch2');el.style.setProperty('--wc','#bdbdbd');el.style.setProperty('--wbg','#09090b');el.style.setProperty('--wfg','#e6e6e6');
        const h=el.querySelector('.wh b');if(h)h.textContent='◈ UNKNOWN SYSTEM ◈';const dt=el.querySelector('.wdt span');if(dt)dt.textContent='UNKNOWN';a={...a,色:'黒'};
        if(!await c.wait(1200))return;continue}
      if(k==='sys'||k==='log'){if(e.classList.contains('warn')){SFX.warn();e.animate([{opacity:0},{opacity:1},{opacity:.3},{opacity:1}],{duration:500})}
        if(!await typeLine(e,(k==='log'?22:34)*slow))return;
        if(e.classList.contains('face'))e.animate([{transform:'translateY(0)'},{transform:'translateY(-5px)'},{transform:'none'}],{duration:300});
        if(e.classList.contains('gold')){SFX.coin();coins(c,30)}
        if(!await c.wait((black?520:220)))return}
      else{e.classList.remove('wpend');e.animate([{opacity:0,transform:'translateX(-6px)'},{opacity:1,transform:'none'}],{duration:260});
        if(k==='bar'){e.querySelector('b').animate([{width:'0%'},{width:e.dataset.v+'%'}],{duration:900,easing:'ease-out',fill:'forwards'});SFX.tick(.1)}
        if(k==='h')SFX.tick(.12);
        if(k==='eco')ecoReveal(e,el,c);
        if(['inv','dmg','cho','tree','pin','call','clog','voice','score','srch','dm','alert','tl'].includes(k)){await gmReveal(e,el,a,c);if(c.dead)return}
        if(k==='gauge'){const g=e.querySelector('.rrow');if(g)relGrow(g,a,{wait:ms=>c.wait(ms),sfx:()=>{}})}
        if(k==='btn'){keepBottom();await new Promise(res=>{c.on(res);e.querySelectorAll('button').forEach(b=>b.onclick=()=>{e.querySelectorAll('button').forEach(x=>{x.disabled=true;x.classList.toggle('on',x===b)});SFX.pling();vib(30);res()})});
          if(c.dead)return;if(e===[...el.querySelectorAll('.k-btn')].pop()&&/確認|CONFIRM|ACKNOWLEDGE|OK|閉じる/i.test(e.textContent)){el.animate([{opacity:1},{opacity:.55}],{duration:500,fill:'forwards'})}if(!await c.wait(400))return}
        if(e.dataset.cd){let s=+e.dataset.cd;const bEl=e.querySelector('b')||e;const base=bEl.innerHTML;c.every(1000,()=>{if(s<=0)return;s--;const mm=String(s/60|0).padStart(2,'0'),ss=String(s%60).padStart(2,'0');bEl.innerHTML=base.replace(/\d{1,2}:\d{2}(:\d{2})?/,`${mm}:${ss}`);SFX.tick(s<=3?.4:.15);if(s===0){SFX.alarm();flash('rgba(200,0,0,.4)',500)}})}
        if(!await c.wait(k==='sp'?60:(black?260:110)))return}
      keepBottom()}
    c.skip=false;
  }
};
/* 文章としてコピー（枠を付けるかどうか選べる） */
function winPlain(o,frame){const L=o.rows.map(r=>r[0]);if(frame)return L.join('\n');
  const out=[];let i=0;while(i<L.length&&!L[i].trim())i++;if(L[i]&&/^[╔┌]/.test(L[i].trim())){i++;while(i<L.length&&!/^[╚└]/.test(L[i].trim())){if(L[i].trim())out.push(L[i].trim());i++}i++}
  return out.concat(L.slice(i).filter(l=>l.trim()!=='＠乗っ取り')).join('\n').trim()}

/* ===== 配信のコメント欄（星座配信／ライブ配信／アイドル生配信） =====
   ［チャット欄 形=配信 題=… 視聴=12,845］ 1行ずつ：
   名前：本文／★名前：本文（本人・配信者）／◎名前：本文（モデレーター・管理者）／¥1,000 名前：本文（スパチャ）／🪙500 名前：本文（コイン後援）／［…］（システム） */
BLOCKS.add('チャット欄');
const CHKIND=[['ふつう',''],['本人','★'],['管理者','◎'],['スパチャ','¥'],['コイン','🪙'],['システム','［']];
const chParse=l=>{l=l.trim();let m;
  if(/^[［\[].*[］\]]$/.test(l))return['システム','',l.replace(/^[［\[]|[］\]]$/g,''),''];
  if((m=l.match(/^¥\s*([\d,]+)\s+(.+?)：(.*)$/)))return['スパチャ',m[2],m[3],m[1]];
  if((m=l.match(/^🪙\s*([\d,]+)\s+(.+?)：(.*)$/)))return['コイン',m[2],m[3],m[1]];
  const k=l.startsWith('★')?'本人':l.startsWith('◎')?'管理者':'ふつう';const s=l.replace(/^[★◎]/,'');const i=s.indexOf('：');
  return i<0?[k,'',s,'']:[k,s.slice(0,i).replace(/^【|】$/g,''),s.slice(i+1),'']};
const chFmt=r=>{const [k,n,t,a]=r;if(k==='システム')return`［${t}］`;if(k==='スパチャ')return`¥${a||'1,000'} ${n}：${t}`;if(k==='コイン')return`🪙${a||'100'} ${n}：${t}`;return`${k==='本人'?'★':k==='管理者'?'◎':''}${n}：${t}`};
const chHue=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))>>>0;return h%360};
const scCol=a=>{const v=+String(a).replace(/,/g,'');return v>=10000?'#d00000':v>=5000?'#e91e63':v>=2000?'#f57c00':v>=1000?'#ffca28':v>=500?'#1de9b6':'#1e88e5'};
BR['チャット欄']=(a,L)=>{
  const form=a.形||'配信',rows=L.filter(l=>l.trim()).map(chParse),view=a.視聴||'1,284';
  const cm=(r,i)=>{const [k,n,t,am]=r,cls=`cm k${CHKIND.findIndex(x=>x[0]===k)}`;
    if(k==='システム')return`<div class="${cls}" data-i="${i}"><span class="t">${esc(t)}</span></div>`;
    if(k==='スパチャ')return`<div class="${cls}" data-i="${i}" style="--sc:${scCol(am)}"><div class="sch"><span class="n">${esc(n)}</span><b>¥${esc(am)}</b></div><div class="t">${esc(t)}</div></div>`;
    if(k==='コイン')return`<div class="${cls}" data-i="${i}"><b>🪙 ${esc(am)} COINS</b><span class="t">${esc(t)||`${esc(n)}が後援しました！`}</span><small class="n">${esc(n)}</small></div>`;
    const av=form==='配信'?`<i class="av" style="background:hsl(${chHue(n)} 45% 45%)">${esc([...n][0]||'?')}</i>`:'';
    return`<div class="${cls}" data-i="${i}">${av}<div><span class="n" style="--nh:${chHue(n)}">${form==='星座'&&k==='ふつう'?'✦ ':''}${k==='本人'?'🎤 ':''}${esc(n)}${k==='本人'&&form!=='星座'?' <em>✓</em>':''}</span><span class="t">${esc(t)}</span></div></div>`};
  if(form==='アイドル'){const ph=esc(a.写真||'sil_live1'),me=a.配信者||'HANEUL',bg=ph==='なし'?'':`style="background-image:url(a/${ph}.jpg)"`;
    const own=c=>`<i class="${c}${bg?'':' no'}" ${bg}>${bg?'':esc([...me][0]||'')}</i>`;
    const icm=(r,i)=>{const [k,n,t,am]=r,cls=`cm k${CHKIND.findIndex(x=>x[0]===k)}`;
      if(k==='システム')return`<div class="${cls}" data-i="${i}"><span class="t">${esc(t)}</span></div>`;
      const ini=k==='本人'?own('av own'):`<i class="av" style="--nh:${chHue(n)}">${esc([...n][0]||'?')}</i>`;
      if(k==='スパチャ')return`<div class="${cls} isc" data-i="${i}" style="--sc:${scCol(am)}"><div class="sch">${ini}<span class="n">${esc(n)}</span><b>¥${esc(am)}</b></div><div class="t">${esc(t)}</div></div>`;
      if(k==='コイン')return`<div class="${cls} gift" data-i="${i}">${ini}<div class="gb"><div class="gh"><span class="n">${esc(n)}</span> 👑 <b>${k==='コイン'?'🪙 '+esc(am):'¥'+esc(am)}</b></div><span class="t">${esc(t)}</span></div><span class="gi">${k==='コイン'?'🪙':'💐'}</span></div>`;
      return`<div class="${cls}" data-i="${i}">${ini}<div class="bb"><span class="n">${k==='本人'?'🎤 ':''}${esc(n)}${k==='本人'?' <em>✓</em>':''}</span><span class="t">${esc(t)}</span></div></div>`};
    return`<div class="blk chat idol" data-fx="チャット欄" data-a="${encA(a)}"><div class="stg${bg?'':' none'}" ${bg}></div><div class="ih">${own('ia')}<div class="ihn"><b>${esc(me)} <em>✓</em></b><small>👤 <span class="vw">${esc(view)}</span>　💗 <span class="hcn">${esc(a.ハート||'125,680')}</span></small></div><span class="lv">LIVE</span><span class="ey">👁 <span class="vw2">${esc(view)}</span></span><span class="ix">✕</span></div>${a.ひとこと?`<div class="hit">${own('av own')}<span>${esc(a.ひとこと)}</span></div>`:''}<div class="hearts"></div><div class="cms">${rows.map(icm).join('')}</div><div class="iin"><label class="ib"><input type="text" placeholder="コメントを入力…" maxlength="60"></label><button type="button" class="sm" aria-label="絵文字">☺</button><button type="button" class="snd" aria-label="送信">➤</button><button type="button" class="scb" aria-label="スーパーチャット">¥</button><button type="button" class="gf" aria-label="ギフト">🎁</button><button type="button" class="hb" aria-label="ハートを送る">♡</button></div><div class="emo">${EMOS.map(x=>`<button type="button">${x}</button>`).join('')}</div><div class="scp">${SCAMT.map(x=>`<button type="button" data-am="${x}" style="--sc:${scCol(x)}">¥${x}</button>`).join('')}</div></div>`}
  const head=form==='星座'?`<div class="chh"><b>✦ STAR STREAM</b><span class="lv">LIVE</span></div><div class="chs"><span>${esc(a.題||'CH-001 / CONSTELLATION CHAT')}</span><span>👁 <span class="vw">${esc(view)}</span></span></div>`
    :`<div class="chh"><b>${esc(a.題||'ライブ配信')}</b><span class="lv">● LIVE</span></div><div class="chs"><span>チャット</span><span>👥 <span class="vw">${esc(view)}</span></span></div>`;
  const vid=form==='配信'&&a.写真&&a.写真!=='なし'?`<div class="chv" style="background-image:url(a/${esc(a.写真)}.jpg)"><span class="lv">● LIVE</span><span class="vwc">👁 <span class="vw2">${esc(view)}</span></span>${a.配信者?`<div class="chvn"><b>${esc(a.配信者)} <em>✓</em></b><small>${esc(a.題||'')}</small></div>`:''}</div>`:'';
  return`<div class="blk chat ${form==='星座'?'star':'yt'}${vid?' wv':''}" data-fx="チャット欄" data-a="${encA(a)}">${vid}${head}<div class="cms">${rows.map(cm).join('')}</div>${form!=='アイドル'?`<div class="yin"><input type="text" placeholder="チャットを送信…" maxlength="60"><button type="button" class="ysnd" aria-label="送信">➤</button><button type="button" class="scb" aria-label="${form==='星座'?'コインで後援':'スーパーチャット'}">${form==='星座'?'🪙':'¥'}</button></div><div class="scp">${(form==='星座'?COAMT:SCAMT).map(x=>`<button type="button" data-am="${x}" style="--sc:${form==='星座'?'#ffd77a':scCol(x)}">${form==='星座'?'🪙 '+x:'¥'+x}</button>`).join('')}</div>`:''}</div>`};
function heartFly(el){const box=el.querySelector('.hearts');if(!box)return;const h=document.createElement('i');h.textContent='♥';h.style.color=pick(['#ff6fa8','#ff8ac4','#b98cff','#9b7bff','#ff4d6d','#ffb3d1','#7fa2ff']);h.style.fontSize=rnd(20,36)+'px';h.style.right=rnd(2,26)+'px';box.appendChild(h);
  const dx=rnd(-18,18);h.animate([{transform:'translate(0,0) scale(.4)',opacity:0},{transform:`translate(${dx*.5}px,-50px) scale(1)`,opacity:.95,offset:.15},{transform:`translate(${-dx}px,-200px) scale(1)`,opacity:.85,offset:.6},{transform:`translate(${dx}px,-340px) scale(.9)`,opacity:0}],{duration:rnd(2400,3400),easing:'ease-out'}).finished.then(()=>h.remove()).catch(()=>h.remove());
  if(box.children.length>40)box.firstChild.remove()}
const SCAMT=['100','500','1,000','5,000','10,000'],COAMT=['100','500','1,000','3,000','10,000'];
const EMOS=['😊','😂','😭','🥺','😍','❤️','💜','👏','🔥','✨','🙏','🎉'];
function chReader(el,a){if(el._chr)return;el._chr=1;
  /* ☺：絵文字の列を開いて、押した絵文字を入力欄に足す */
  {const sm=el.querySelector('.iin .sm'),em=el.querySelector('.emo'),ip=el.querySelector('.iin input');if(sm&&em&&ip){sm.onclick=()=>{el.classList.toggle('emoon');vib(10)};em.onclick=e=>{const b=e.target.closest('button');if(!b)return;ip.value=(ip.value+b.textContent).slice(0,60);el.classList.remove('emoon');ip.focus();vib(10)};
    /* ほかの所を押しても閉じる */el.addEventListener('click',e=>{if(el.classList.contains('emoon')&&!e.target.closest('.emo,.iin .sm'))el.classList.remove('emoon')})}}const idol=el.classList.contains('idol'),box=el.querySelector('.cms'),inp=el.querySelector('.ib input,.yin input');if(!box||!inp)return;
  const trim=()=>{if(idol)while(box.children.length>6)box.firstChild.remove();box.scrollTop=box.scrollHeight},push=d=>{box.appendChild(d);d.style.display='';d.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:260});trim()};
  const av=`<i class="av" style="--nh:200;background:hsl(200 45% 50%)">あ</i>`;
  const send=()=>{const v=inp.value.trim();if(!v)return;inp.value='';const d=document.createElement('div');d.className='cm k0 me';
    d.innerHTML=idol?`${av}<div class="bb"><span class="n">あなた</span><span class="t">${esc(v)}</span></div>`:`${av}<div><span class="n" style="--nh:200">あなた</span><span class="t">${esc(v)}</span></div>`;push(d);SFX.send&&SFX.send()};
  (el.querySelector('.ysnd')||el.querySelector('.snd')).onclick=send;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();send()}};
  const pk=el.querySelector('.scp');el.querySelector('.scb').onclick=()=>{pk.classList.toggle('on');if(pk.classList.contains('on')&&!inp.value)inp.placeholder='メッセージを書いてから金額を選んでね'};
  pk.onclick=e=>{const b=e.target.closest('button');if(!b)return;pk.classList.remove('on');const am=b.dataset.am,v=inp.value.trim()||(el.classList.contains('star')?'なかなか面白い。':'いつも応援してます！');inp.value='';const d=document.createElement('div');
    if(idol){/* スパチャは金額の色（ギフトのうす紫とは別） */d.className='cm k3 isc me';d.style.setProperty('--sc',scCol(am));d.innerHTML=`<div class="sch">${av}<span class="n">あなた</span><b>¥${am}</b></div><div class="t">${esc(v)}</div>`;const n=Math.min(14,3+Math.round(snN(am)/1000));for(let k=0;k<n;k++)setTimeout(()=>heartFly(el),k*60);const hc=el.querySelector('.hcn');if(hc)hc.textContent=(snN(hc.textContent)+snN(am)).toLocaleString()}
    else if(el.classList.contains('star')){d.className='cm k4 me';d.innerHTML=`<b>🪙 ${am} COINS</b><span class="t">${esc(v)}</span><small class="n">あなた</small>`;if(S.ctx)coins(S.ctx,Math.min(40,8+Math.round(snN(am)/300)))}
    else{d.className='cm k3 me';d.style.setProperty('--sc',scCol(am));d.innerHTML=`<div class="sch"><span class="n">あなた</span><b>¥${am}</b></div><div class="t">${esc(v)}</div>`}
    push(d);d.animate([{transform:'scale(.9)'},{transform:'scale(1.04)'},{transform:'none'}],{duration:420});SFX.notif&&SFX.notif();vib([30,40,30])}}
D['チャット欄']={still:chReader,
  prep(el){el.querySelectorAll('.cm').forEach(m=>m.style.display='none')},
  async run(el,a,c){
    chReader(el,a);const box=el.querySelector('.cms'),ms=[...box.querySelectorAll('.cm')],idol=el.classList.contains('idol'),fast=a.速さ==='速い',vwEl=el.querySelector('.vw');
    const vw2=el.querySelector('.vw2'),kfmt=v=>v>=10000?(v/10000).toFixed(1)+'万':v.toLocaleString();
    let vw=+String(a.視聴||'1284').replace(/,/g,'')||1284;c.every(1200,()=>{vw+=Math.round(rnd(-2,fast?60:12));if(vwEl)vwEl.textContent=vw.toLocaleString();if(vw2)vw2.textContent=kfmt(vw)});
    if(vw2)vw2.textContent=kfmt(vw);
    if(idol){const hc=el.querySelector('.hcn');let hn=+String(a.ハート||'125680').replace(/,/g,'')||0;
      const addH=n=>{hn+=n;hc.textContent=hn.toLocaleString()};
      c.every(fast?200:480,()=>{if(Math.random()<.8){heartFly(el);addH(Math.round(rnd(1,9)))}});
      el.querySelector('.hb').onclick=()=>{for(let k=0;k<3;k++)heartFly(el);addH(1);SFX.pop2();vib(10)};
      const push=d=>{box.appendChild(d);d.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:260});trim()};
      el.querySelector('.gf').onclick=()=>{const d=document.createElement('div');d.className='cm kg gift';d.innerHTML=`<i class="av" style="--nh:200">あ</i><div class="gb"><div class="gh"><span class="n">あなた</span> <b>🎁 ギフト</b></div><span class="t">いつもありがとう！</span></div><span class="gi">🎁</span>`;push(d);for(let k=0;k<8;k++)heartFly(el);addH(50);SFX.notif();vib([20,30,20])};
      const inp=el.querySelector('.iin input'),send=()=>{const v=inp.value.trim();if(!v)return;inp.value='';const d=document.createElement('div');d.className='cm k0 me';d.innerHTML=`<i class="av" style="--nh:200">あ</i><div class="bb"><span class="n">あなた</span><span class="t">${esc(v)}</span></div>`;push(d);SFX.send()};
      el.querySelector('.snd').onclick=send;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();send()}}}
    const trim=()=>{if(idol)while(box.children.length>6)box.firstChild.remove();box.scrollTop=box.scrollHeight};
    for(const m of ms){if(!await c.wait(m.classList.contains('k1')?1400:(fast?rnd(160,320):rnd(520,900))))return;
      m.style.display='';m.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:240});
      if(m.classList.contains('k3')){SFX.notif();vib([30,40,30]);m.animate([{transform:'scale(.9)'},{transform:'scale(1.04)'},{transform:'none'}],{duration:400})}
      else if(m.classList.contains('k4')){SFX.coin();coins(c,30);vib(30)}
      else if(m.classList.contains('k1')){SFX.pling();if(idol)for(let k=0;k<6;k++)heartFly(el)}
      else if(m.classList.contains('k5'))SFX.tick(.2);else if(Math.random()<.5)SFX.pop2();
      trim();keepBottom()}
  }
};
const CHP={
'ライブ配信':[
['アイドルのPC配信（横画面）',{形:'配信',題:'DOHYUN LIVE · 今日はゆっくりお話ししよう',配信者:'DOHYUN',写真:'hs_live16',視聴:'128,456'},`moon_0712：今日もお疲れさまです！
luv_dh：声が好きすぎる…
starryday：カムバックいつ？
★DOHYUN：もうすぐだよ〜🌙
¥10,000 n7_love：ずっと応援してる！大好きです！！
honey_haru：ご飯ちゃんと食べてね
sky_n7：やっぱりドヒョン最高…`],
['雑談',{形:'配信',題:'夜の雑談配信',視聴:'1,284'},`ねこもち：こんばんはー！
mikan_25：初見です！
ゆき：いらっしゃーい
sora_07：今日も配信ありがとう！
もちもち：ｗｗｗｗｗ
通りすがり：今来た！何の話？
¥1,000 ねこもち：いつも楽しい配信ありがとう！`],
['大盛り上がり',{形:'配信',題:'大会決勝 同時視聴',視聴:'48,210',速さ:'速い'},`sora_07：きたあああああ
mikan_25：うおおおお
ゆき：888888
もちもち：888888888
たこやき：神すぎる
通りすがり：鳥肌
ねこもち：優勝！！！
¥10,000 たこやき：おめでとう！！！
sora_07：泣いた`],
['ゲーム実況',{形:'配信',題:'ホラーゲーム実況',視聴:'12,845'},`ねこもち：こんばんはー！
sora_07：後ろ！後ろ！
たこやき：逃げてｗｗｗ
通りすがり：あっ……
ねこもち：ｗｗｗｗｗｗ
ゆき：ナイス！！
◎モデレーター：ネタバレは禁止です
¥500 mikan_25：ナイス回避代`],
['炎上・荒れ',{形:'配信',題:'謝罪配信',視聴:'98,402',速さ:'速い'},`anon_1：説明して
通りすがり：本当なの？
anon_22：がっかりした
ゆき：最後まで聞こうよ
anon_7：信者乙
◎モデレーター：誹謗中傷はブロックします
［一部のコメントが削除されました］
anon_9：逃げるな`],
['感動',{形:'配信',題:'活動10周年 記念配信',視聴:'23,560'},`ねこもち：10周年おめでとう
ゆき：ずっと見てたよ
sora_07：泣いてる
mikan_25：これからもよろしく
¥5,000 ねこもち：出会えてよかった
★配信者：みんな、本当にありがとう`]],
'星座配信':[
['基本',{形:'星座',視聴:'1,284'},`【星座『黄金の仮面を持つ王』】：ほう、面白い。
【星座『眠れる古代竜』】：まだ終わらんのか？
【星座『紅蓮の戦乙女』】：いいぞ！ もっとやれ！
【星座『静寂を愛する賢者』】：……興味深い。
【星座『怠惰な観測者』】：ㅋㅋㅋㅋ
🪙500 星座『黄金の仮面を持つ王』：`],
['盛り上がり',{形:'星座',視聴:'12,845',速さ:'速い'},`［星座配信のコメントが急増しています！］
【星座『黄金の仮面を持つ王』】：ｗｗｗｗｗ
【星座『紅蓮の戦乙女』】：まさか本当にやるとは！
【星座『眠れる古代竜』】：！？
【星座『怠惰な観測者』】：ㅋㅋㅋㅋㅋㅋ
【匿名の星座】：正気か？？？
【匿名の星座】：あいつ人間だよな？
［現在の視聴者数が急上昇しています！］`],
['投げ銭',{形:'星座',視聴:'5,620'},`🪙1,000 星座『黄金の仮面を持つ王』：なかなか楽しませてくれる！
【星座『紅蓮の戦乙女』】：私も支援しよう！
🪙3,000 星座『紅蓮の戦乙女』：
［連続後援が発生しました！］`],
['喧嘩',{形:'星座',視聴:'8,103'},`【星座『紅蓮の戦乙女』】：あの戦い方は見事だ！
【星座『鉄血の君主』】：無謀なだけだ。
【星座『紅蓮の戦乙女』】：何だと？
【星座『鉄血の君主』】：事実を述べたまで。
【星座『怠惰な観測者』】：また始まったｗｗｗ
【匿名の星座】：管理者ーー！！
［星座たちの間で激しい口論が発生しています。］`],
['覚醒',{形:'星座',視聴:'30,442'},`［星座たちが沈黙しています。］
【星座『静寂を愛する賢者』】：……まさか。
【星座『鉄血の君主』】：あり得ん。
【星座『紅蓮の戦乙女』】：素晴らしい！！
【匿名の星座】：今の見たか！？
【星座『黄金の仮面を持つ王』】：ははは！ 気に入った！
🪙5,000 星座『黄金の仮面を持つ王』：`],
['管理者介入',{形:'星座',視聴:'9,980'},`［管理者が配信チャンネルに入室しました。］
◎管理者：視聴者の皆様、規則を守ってください。
【匿名の星座】：あっ
【匿名の星座】：管理者きたｗ
［星座『鉄血の君主』の発言が一時的に制限されました。］
【星座『怠惰な観測者』】：ㅋㅋㅋㅋ`],
['失敗・ツッコミ',{形:'星座',視聴:'6,410'},`【星座『怠惰な観測者』】：ｗｗｗｗｗ
【星座『紅蓮の戦乙女』】：何をしているのだ……
【星座『黄金の仮面を持つ王』】：これは予想外だ！
【匿名の星座】：あいつ今転ばなかった？
【星座『眠れる古代竜』】：……眠気が覚めた。
［一部の星座が笑いすぎて後援を忘れています。］`],
['アンチ・煽り',{形:'星座',視聴:'7,722'},`【匿名の星座】：どうせすぐ死ぬ
【匿名の星座】：つまらん
【星座『紅蓮の戦乙女』】：黙って見ていろ。
【星座『鉄血の君主』】：口だけは達者だな。
［配信の雰囲気が悪化しています。］
◎管理者：誹謗中傷は禁止されています。`],
['特別クエスト',{形:'星座',視聴:'15,300'},`［◆ STAR MISSION］
［名称：七日目の夜を越えろ］
［難易度：A］
［目標：日の出まで生き残る］
［報酬：3,000コイン／追加報酬：？？？］
【星座『黄金の仮面を持つ王』】：さあ、見せてもらおう。
【星座『静寂を愛する賢者』】：受けるか、否か。
［【 YES / NO 】］`],
['視聴者数・ランキング',{形:'星座',視聴:'48,210',速さ:'速い'},`［✦ STREAM STATUS ✦　CH-001］
［視聴星座数：48,210　総後援コイン：128,400］
［注目度：★★★★☆］
［◆ TOP SUPPORTERS　1位：黄金の仮面を持つ王／2位：紅蓮の戦乙女／3位：怠惰な観測者］
🪙10,000 星座『黄金の仮面を持つ王』：まだまだこれからだ！
［注目チャンネルに選ばれました！］
【匿名の星座】：ランキング入りおめ`]],
'アイドル生配信':[
['生配信',{形:'アイドル',写真:'sil_live1',配信者:'HANEUL',視聴:'12,847',ハート:'125,680',ひとこと:'오늘도 와줘서 고마워 ♡'},`peach_07：きたーーー！！！💕
mochi_39：今日もかっこいい😭
별빛：사랑해요오오 💗
hana_102：ハートして！！🫶
rinrin：今日の髪型かわいすぎる
blue_moon：日本から見てるよー！
★HANEUL：みんなこんばんは〜！ 今日も来てくれてありがとう♡
peach_07：しゃべったあああ！！
rinrin：声が好きすぎる😭
별빛：ㅋㅋㅋㅋㅋㅋㅋ`],
['大盛り上がり',{形:'アイドル',写真:'sil_live2',配信者:'MINJUN',視聴:'124,300',ハート:'980,412',ひとこと:'サプライズあるよ〜！',速さ:'速い'},`hana_102：え！？
peach_07：なになに！？
★MINJUN：新曲、来月出ます！
rinrin：きゃああああ
¥10,000 hana：ミンジュンくん いつも幸せをありがとう💐 これからもずっと応援しています！
별빛：대박！！！
mochi_39：泣く
blue_moon：おめでとう！！`]]
};

/* ===== ページに載せる ===== */
function mount(fxOn,c){ecoReset(page);
  const els=[...page.querySelectorAll('[data-fx]')];
  els.forEach(el=>{try{el._a=JSON.parse(el.dataset.a||'{"args":[]}')}catch(e){el._a={args:[]}}
    const d=D[el.dataset.fx];if(!d)return;
    try{if(fxOn)d.prep&&d.prep(el,el._a,c);else d.still&&d.still(el,el._a)}catch(e){console.error(e)}});
  /* 見本＝文例の種類：その種類の文例を、画面の下のボタンでその場で切り替えられる（目次の見本ページ用） */
  els.forEach(el=>{const sm=el._a&&el._a.見本,k=el.dataset.fx,P=sm&&EDT[k]&&EDT[k].presets&&EDT[k].presets[sm];if(!P)return;
    const row=document.createElement('div');row.className='fxsw';row.innerHTML=`<small>文例を切り替え（${P.length}種類）</small><div>${P.map((p,i)=>`<button type="button" data-i="${i}">${esc(p[0])}</button>`).join('')}</div>`;
    el.after(row);let cur=el;
    row.onclick=e=>{const b=e.target.closest('button');if(!b)return;const [,at,txt]=P[+b.dataset.i],a2={...at,見本:sm,args:at.args||[]},L=txt.split('\n');
      ecoReset(page);const t=document.createElement('div');t.innerHTML=BR[k](a2,L);const ne=t.firstElementChild;ne._a=a2;cur.replaceWith(ne);cur=ne;
      row.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
      const d=D[k];try{if(S.fx&&S.ctx&&d&&d.run){d.prep&&d.prep(ne,a2,S.ctx);d.run(ne,a2,S.ctx)}else if(d&&d.still)d.still(ne,a2)}catch(err){console.error(err)}
      ne.scrollIntoView({block:'nearest',behavior:'smooth'})}});
  /* 演出ありのときは、全部かくしておいて上から順に出す（地の文は1文字ずつ） */
  /* 目次のページは、待たずにすぐ全部出す */
  if(fxOn&&!page.querySelector('.toc'))[...page.children].forEach(top=>{if(top.classList.contains('fxsw'))return;top.classList.add('pend');if(top.tagName==='P')top._chars=wrapChars(top)});
  return els;
}
function wrapChars(el){
  const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),ns=[],out=[];while(tw.nextNode())ns.push(tw.currentNode);
  ns.forEach(n=>{const f=document.createDocumentFragment();for(const ch of n.data){const s=document.createElement('span');s.className='tc';s.textContent=ch;f.appendChild(s);out.push(s)}n.replaceWith(f)});
  return out;
}
function keepBottom(smooth=true){if(page.querySelector('.toc'))return;if(page.scrollHeight>page.clientHeight+4)page.scrollTo({top:page.scrollHeight,behavior:smooth?'smooth':'auto'})}
/* かたかたかた、と1文字ずつ。真ん中をタップすると一気に出る */
async function typeIn(c,chars){
  c.typing=true;
  for(let i=0;i<chars.length;i++){
    if(c.dead)break;
    if(c.skip){chars.slice(i).forEach(s=>s.classList.add('on'));break}
    const s=chars[i],ch=s.textContent;s.classList.add('on');
    if(i%2===0&&ch.trim())SFX.type();
    if(!await c.wait(/[。！？」]/.test(ch)?240:/[、…―]/.test(ch)?120:42))break;
  }
  c.typing=false;c.skip=false;
}
async function runTimeline(c){
  for(const top of [...page.children]){
    if(c.dead)return;
    top.classList.remove('pend');keepBottom();
    if(top._chars)await typeIn(c,top._chars);else if(!top.classList.contains('mkrow'))top.classList.add('reveal');
    keepBottom();
    const list=(top.matches('[data-fx]')?[top]:[]).concat([...top.querySelectorAll('[data-fx]')]);
    for(const el of list){
      if(c.dead)return;const d=D[el.dataset.fx];if(!d||!d.run)continue;
      let r;try{r=d.run(el,el._a,c)}catch(e){console.error(e)}
      if(r&&r.then){try{await r}catch(e){console.error(e)}}
      keepBottom();
    }
  }
}

/* ===== めくり ===== */
/* めくる前の画面（背景・人影・本文）を写しとって、それを動かす */
function ghostOf(){
  const g=document.createElement('div');g.className='ghost';
  [$('bg'),$('shade'),$('silw'),page].forEach(n=>{const k=n.cloneNode(true);k.removeAttribute('id');g.appendChild(k)});
  stage.appendChild(g);g.lastChild.scrollTop=page.scrollTop;return g;
}
const TR={
  async paper(g){SFX.swish();g.style.transformOrigin='left center';await g.animate([{transform:'rotateY(0)',boxShadow:'0 0 0 rgba(0,0,0,0)'},{transform:'rotateY(-100deg)',boxShadow:'-30px 0 40px rgba(0,0,0,.35)'}],{duration:620,easing:'cubic-bezier(.45,0,.6,1)',fill:'forwards'}).finished},
  async back(g){SFX.swish();g.style.transformOrigin='right center';await g.animate([{transform:'rotateY(0)'},{transform:'rotateY(100deg)'}],{duration:560,easing:'cubic-bezier(.45,0,.6,1)',fill:'forwards'}).finished},
  async slide(g){await g.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateX(-24px)'}],{duration:260,fill:'forwards'}).finished},
  async slideback(g){await g.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateX(24px)'}],{duration:260,fill:'forwards'}).finished},
  async noise(g){const n=makeNoise(fxRoot,1);SFX.crackle(.5,.55);vib([20,30,20]);await sleep(220);g.remove();await sleep(160);await n.L.animate([{opacity:1},{opacity:0}],{duration:260,fill:'forwards'}).finished;n.stop()},
  async tear(g){
    const g2=g.cloneNode(true);stage.appendChild(g2);g2.scrollTop=g.scrollTop;
    const pts=[];for(let y=0;y<=100;y+=4)pts.push(`${(50+rnd(-6,6)).toFixed(1)}% ${y}%`);
    g.style.clipPath=`polygon(0 0,${pts.join(',')},0 100%)`;g2.style.clipPath=`polygon(${pts.join(',')},100% 100%,100% 0)`;
    SFX.tear();vib([30,20,60,20,90]);
    g.animate([{transform:'none'},{transform:'translateX(-3px)',offset:.15},{transform:'translate(-35%,30%) rotate(-10deg)',opacity:0}],{duration:1050,easing:'ease-in',fill:'forwards'});
    await g2.animate([{transform:'none'},{transform:'translateX(3px)',offset:.15},{transform:'translate(38%,34%) rotate(12deg)',opacity:0}],{duration:1100,delay:80,easing:'ease-in',fill:'forwards'}).finished;g2.remove();
  }
};

/* 最後のページの終わりに、目次へ／はじめから・本を閉じる */
function addEndNav(){
  if(page.querySelector('.endnav'))return;
  const d=document.createElement('div');d.className='endnav';
  d.innerHTML=`<button type="button" data-go="${BOOK.showTitle?0:BOOK.start-1}">${BOOK.showTitle?'目次へ':'はじめから'}</button><button type="button" class="cl">本を閉じる</button>`;
  d.querySelector('.cl').onclick=e=>{e.stopPropagation();location.reload()};
  page.appendChild(d);d.animate([{opacity:0},{opacity:1}],{duration:600});keepBottom();
}
/* ===== 移動 ===== */
const N=BOOK.pages.length;
/* ページの見た目（背景・人影）をそろえる */
function setScene(i,c){
  const m=meta(i);$('bg').dataset.k='';setBg(m.bg||'部屋',false);
  if(m.noSil)$('silw').classList.add('gone');
  if(c)bgLife(c,m.bg||'部屋');
}
async function goto(i,{via='paper',push=true}={}){
  if(S.busy)return;S.busy=true;
  try{
    if(S.fx&&push&&S.cur!=null)S.hist.push(S.cur);
    const g=S.cur==null?null:ghostOf();
    if(S.ctx){S.ctx.kill();S.ctx=null}newBus();stopSpeech();resetLooks();
    S.cur=i;S.visits[i]=(S.visits[i]||0)+1;
    const m=meta(i);S.lockLeft=m.lock?m.lock.n:0;
    page.innerHTML=renderPage(BOOK.pages[i]);page.scrollTop=0;
    const tt=document.querySelector('.hd .ttl');if(tt&&BOOK.showTitle)tt.textContent=m.title||'';if(m.title)seenMark(m.title);
    const c=S.fx?makeCtx():null;S.ctx=c;setScene(i,c);mount(S.fx,c);
    if(g){const back=via==='back';const tr=S.fx?(TR[via]||TR.paper):(back?TR.slideback:TR.slide);try{await tr(g)}catch(e){}g.remove();stage.querySelectorAll('.ghost').forEach(x=>x.remove())}
    else stage.animate([{opacity:0},{opacity:1}],{duration:900});
    S.busy=false;const tl=c&&!c.dead?runTimeline(c):Promise.resolve();if(i===N-1)tl.then(()=>{if(S.cur===i&&!(c&&c.dead))addEndNav()});
  }finally{S.busy=false}
}
async function rewindTo(t){
  if(S.busy)return;S.busy=true;const from=S.cur;
  if(S.ctx){S.ctx.kill();S.ctx=null}newBus();resetLooks();SFX.rewind(1.8);vib([40,40,40,40,40,40,40,40]);
  const n=makeNoise(fxRoot,.25);
  for(let j=from-1;j>t;j--){page.innerHTML=renderPage(BOOK.pages[j]);mount(false);setScene(j,null);
    stage.animate([{transform:'translateX(-10px) skewX(5deg)',filter:'blur(1.5px)'},{transform:'translateX(12px) skewX(-6deg)',filter:'blur(.4px)'}],{duration:150});await sleep(170)}
  n.stop();S.busy=false;S.hist=[];goto(t,{via:'noise',push:false});
}
function nudge(){page.animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:260})}
function lockTry(m){
  S.lockLeft--;SFX.bang(.8);vib(90);shake(7,320);
  const tries=m.lock.n-S.lockLeft,p=document.createElement('p');p.className='lockmsg';p.textContent=m.lock.text;
  p.style.fontSize=(15+tries*5)+'px';p.style.transform=`rotate(${rnd(-6,6)}deg)`;page.appendChild(p);page.scrollTop=page.scrollHeight;
  p.animate([{opacity:0,transform:p.style.transform+' scale(1.4)'},{opacity:1,transform:p.style.transform}],{duration:240});
  /* 「次へ」ボタンが逃げる。文字も化ける */
  const nb=$('next');nb.style.transition='transform .25s cubic-bezier(.3,1.6,.5,1)';nb.style.transform=`translate(${rnd(-170,-30)|0}px,${rnd(-8,8)|0}px) rotate(${rnd(-12,12)|0}deg)`;
  nb.textContent=pick(['にげて','めくるな','次へ ›','次■ ›','つぎ','やめて']);
  if(S.lockLeft<=0)setTimeout(()=>goto(m.next?m.next.page:S.cur+1,{via:m.next?m.next.how:'tear'}),500);
}
function next(){
  if(S.busy||S.cur==null||S.edit)return;const m=meta(S.cur);
  if(!S.fx){if(S.cur+1<N)goto(S.cur+1,{via:'slide'});else nudge();return}
  if(m.auto){nudge();return}
  if(m.lock&&S.lockLeft>0){lockTry(m);return}
  const t=m.next?m.next.page:S.cur+1;if(t>=N){nudge();return}
  goto(t,{via:m.next?m.next.how:(meta(t).enter||'paper')});
}
function prev(){
  if(S.busy||S.cur==null||S.edit)return;
  if(!S.fx){if(S.cur>0)goto(S.cur-1,{via:'back'});else nudge();return}
  if(meta(S.cur).auto||!S.hist.length){nudge();return}
  goto(S.hist.pop(),{via:'back',push:false});
}
function rerender(){
  if(S.cur==null)return;if(S.edit)return exitEdit();if(S.ctx){S.ctx.kill();S.ctx=null}newBus();stopSpeech();resetLooks();
  page.innerHTML=renderPage(BOOK.pages[S.cur]);S.lockLeft=(meta(S.cur).lock||{}).n||0;
  const c=S.fx?makeCtx():null;S.ctx=c;setScene(S.cur,c);mount(S.fx,c);const i=S.cur;(c?runTimeline(c):Promise.resolve()).then(()=>{if(i===N-1&&S.cur===i&&!(c&&c.dead))addEndNav()});
}

/* ===== 操作 ===== */
$('next').onclick=next;$('prev').onclick=prev;
addEventListener('keydown',e=>{if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev()});
/* スワイプ：指はタッチで、マウスはポインタで受ける（本文の縦スクロールと取り合わないように） */
let pd=null;
function gestEnd(x,y,target){
  if(!pd||S.edit){pd=null;return}const dx=x-pd.x,dy=y-pd.y;pd=null;
  if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2){dx<0?next():prev();return}
  if(Math.abs(dx)<10&&Math.abs(dy)<10&&!target.closest('button,.env,.mli,[data-tap],input,textarea,select,label,a')){const r=stage.getBoundingClientRect(),fx=(x-r.left)/r.width;if(fx>.75)next();else if(fx<.25)prev();else if(S.ctx&&S.ctx.typing)S.ctx.skip=true}
}
stage.addEventListener('touchstart',e=>{const t=e.touches[0];pd={x:t.clientX,y:t.clientY}},{passive:true});
stage.addEventListener('touchend',e=>{const t=e.changedTouches[0];gestEnd(t.clientX,t.clientY,e.target)});
stage.addEventListener('touchcancel',()=>{pd=null});
stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')pd={x:e.clientX,y:e.clientY}});
stage.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')gestEnd(e.clientX,e.clientY,e.target)});
$('fxSw').addEventListener('change',e=>{S.fx=e.target.checked;S.hist=[];if(S.fx)audioInit();rerender()});
function openSheet(){
  const src=BOOK.pages[S.cur??0];
  $('srcView').innerHTML=esc(src).replace(/［[^］]*］/g,m=>`<mark>${m}</mark>`);$('sheet').classList.add('on');
}
$('srcBtn').onclick=openSheet;
/* カタログ用：目次へ戻る・もう一度見る・目次から飛ぶ */
if($('tocBtn'))$('tocBtn').onclick=()=>{if(S.cur!==0)goto(0,{via:'back',push:false})};
if($('againBtn'))$('againBtn').onclick=()=>{if(!S.busy)rerender()};
page.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){e.stopPropagation();goto(+b.dataset.go,{via:'paper'})}});
$('sheetClose').onclick=()=>$('sheet').classList.remove('on');
$('sheet').addEventListener('click',e=>{if(e.target.id==='sheet')$('sheet').classList.remove('on')});
/* 目次：開いたジャンルを覚える */
page.addEventListener('toggle',e=>{const d=e.target;if(!d.matches||!d.matches('.tgd'))return;try{const op=JSON.parse(localStorage.getItem('fxTocOpen')||'{}');if(d.open)op[d.dataset.g]=1;else delete op[d.dataset.g];localStorage.setItem('fxTocOpen',JSON.stringify(op))}catch(err){}},true);
/* ===== テンプレート：文字を書き換えるだけで、自分の話の演出になる ===== */
const ORIG=BOOK.pages.slice();
const spc=v=>String(v??'').replace(/ /g,'　');
const PHOTO_OPTS=typeof PHOTOS!=='undefined'?PHOTOS:[];
const TPL={
  '掲示板':{block:1,attrs:[['板','板の名前'],['題','スレタイ']],flags:[['明るい','明るい見た目']],cols:[['名前'],['書き込み']],
    parse:l=>{const m=l.match(/^(\d+)\s+([^：]+)：(.*)$/);return m?[m[2],m[3]]:['名無しさん',l]},fmt:(r,i)=>`${i+1} ${spc(r[0])||'名無しさん'}：${r[1]}`},
  'システム':{block:0,attrs:[['種類','種類',['','スキル','アイテム','警告']],['文','文']]},
  'トーク':{block:1,attrs:[['見た目','見た目',['LINE','カカオ']],['相手','相手の名前'],['下書き','下書き（／で区切る）'],['送信','送信ボタン',['確認','送れる','押せない']]],flags:[['履歴','最初から全部出す'],['涙','涙'],['迷う','入力中が出たり消えたり']],
    cols:[['だれ',['自分','相手','日付']],['文']],parse:l=>{const k=l.indexOf('：');return[l.slice(0,k),l.slice(k+1)]},fmt:r=>`${r[0]}：${r[1]}`},
  '招待状':{block:1,args:[['スマホ','パソコン']],attrs:[['アプリ','アプリ名'],['通知','通知の文'],['題','招待状の題'],['問い','問い']],cols:[['本文（1行ずつ）']],parse:l=>[l],fmt:r=>r[0]},
  'ボード':{block:1,attrs:[['種類','ボード',['コルク','ホワイト','机']],['線','光らせる線（例 4-9,9-12）'],['丸','赤丸（何番目）'],['寄る','寄る（何番目）']],
    cols:[['種類',['写真','人物','新聞','付箋','メモ','地図','指紋','手形','足跡']],['文字'],['写真',['',...PHOTO_OPTS,...Array.from({length:16},(_,i)=>String(i+1))]]],
    parse:l=>{const k=l.indexOf('：'),[x,y]=l.slice(k+1).split('｜');return[l.slice(0,k),x,y||'']},fmt:r=>`${r[0]}：${r[1]}${r[2]?'｜'+r[2]:''}`},
  '捜査本部':{block:1,attrs:[],cols:[['1行（■見出し／名前｜中身／・箇条書き／人物：名前｜説明｜写真番号／関係：1-2｜書き込み／写真：説明｜写真名）']],parse:l=>[l],fmt:r=>r[0]}
};
function findTpl(src){const out=[];
  for(const k in TPL){const t=TPL[k],nm=TAGSHOW[k]?`(?:${k}|${TAGSHOW[k]})`:k,re=t.block?new RegExp(`［${nm}([^］]*)］\\n([\\s\\S]*?)\\n［／${nm}］`,'g'):new RegExp(`［${nm}((?:\\s[^］]*)?)］`,'g');let m;
    while((m=re.exec(src)))out.push({k,t,start:m.index,end:re.lastIndex,a:parseAttrs(m[1]),rows:t.block?m[2].split('\n').map(t.parse):[]})}
  return out.sort((x,y)=>x.start-y.start)}
function tplText(o){const t=o.t,a=o.a,parts=[TAGSHOW[o.k]||o.k,...(a.args||[])];
  for(const [key] of t.attrs||[])if(a[key])parts.push(`${key}=${spc(a[key])}`);
  for(const key in a)if(key!=='args'&&!(t.attrs||[]).some(([k])=>k===key))parts.push(`${key}=${spc(a[key])}`);
  const head=`［${parts.join(' ')}］`;return t.block?`${head}\n${o.rows.map((r,i)=>t.fmt(r,i)).join('\n')}\n［／${TAGSHOW[o.k]||o.k}］`:head}
const mkIn=(v,fn,ph)=>{const i=document.createElement('input');i.type='text';i.value=v;if(ph)i.placeholder=ph;i.oninput=()=>fn(i.value);return i};
const mkSel=(opts,v,fn)=>{const s=document.createElement('select');s.innerHTML=opts.map(o=>`<option${o===v?' selected':''}>${esc(o)}</option>`).join('');s.onchange=()=>fn(s.value);return s};
const tRow=(label,el)=>{const d=document.createElement('label');d.className='tf';d.innerHTML=`<span>${esc(label)}</span>`;d.appendChild(el);return d};
function openEditor(){
  const box=$('tplBox'),src=BOOK.pages[S.cur],list=findTpl(src);box.innerHTML='';
  if(!list.length){box.innerHTML='<p class="ex">このページには、入力欄で書き換えられるテンプレートがありません。いまは「掲示板」「システム」「トーク」「招待状」「エビデンスボード」「捜査本部」で使えます。「印」のタブで書き方は見られます。</p>';return false}
  let tm;const apply=()=>{clearTimeout(tm);tm=setTimeout(()=>{let s=src;[...list].sort((x,y)=>y.start-x.start).forEach(o=>{s=s.slice(0,o.start)+tplText(o)+s.slice(o.end)});BOOK.pages[S.cur]=s;S.busy=false;rerender();$('srcView').innerHTML=esc(s).replace(/［[^］]*］/g,m=>`<mark>${m}</mark>`)},700)};
  list.forEach(o=>{const t=o.t,a=o.a;a.args=a.args||[];const card=document.createElement('div');card.className='tcard';card.innerHTML=`<b class="tn">${esc(o.k==='ボード'?'エビデンスボード':o.k)}</b>`;
    (t.args||[]).forEach(opts=>card.appendChild(tRow('出し方',mkSel(opts,opts.find(x=>a.args.includes(x))||opts[0],v=>{a.args=a.args.filter(x=>!opts.includes(x)).concat([v]);apply()}))));
    (t.attrs||[]).forEach(([key,label,opts])=>{const set=v=>{if(v)a[key]=v;else delete a[key];apply()};card.appendChild(tRow(label,opts?mkSel(opts,a[key]||'',set):mkIn(a[key]||'',set)))});
    (t.flags||[]).forEach(([f,label])=>{const cb=document.createElement('input');cb.type='checkbox';cb.checked=a.args.includes(f);cb.onchange=()=>{a.args=cb.checked?a.args.concat([f]):a.args.filter(x=>x!==f);apply()};card.appendChild(tRow(label,cb))});
    if(t.block){const rl=document.createElement('div');rl.className='trows';card.appendChild(rl);
      const draw=()=>{rl.innerHTML='';o.rows.forEach((r,i)=>{const d=document.createElement('div');d.className='trow';d.innerHTML=`<em>${i+1}</em>`;
          t.cols.forEach(([label,opts],j)=>d.appendChild(opts?mkSel(opts,r[j]||'',v=>{r[j]=v;apply()}):mkIn(r[j]||'',v=>{r[j]=v;apply()},label)));
          const x=document.createElement('button');x.type='button';x.textContent='✕';x.setAttribute('aria-label','この行を消す');x.onclick=()=>{o.rows.splice(i,1);draw();apply()};d.appendChild(x);rl.appendChild(d)});
        const add=document.createElement('button');add.type='button';add.className='tadd';add.textContent='＋ 行を足す';add.onclick=()=>{o.rows.push(t.cols.map(([,op])=>op?op[0]:''));draw();apply()};rl.appendChild(add)};draw()}
    box.appendChild(card)});
  const bar=document.createElement('div');bar.className='tbar';bar.innerHTML='<button type="button" class="rv">元に戻す</button><button type="button" class="cp">印をコピー</button>';
  bar.querySelector('.rv').onclick=()=>{BOOK.pages[S.cur]=ORIG[S.cur];S.busy=false;rerender();openEditor()};
  bar.querySelector('.cp').onclick=async e=>{const txt=list.map(tplText).join('\n\n');try{await navigator.clipboard.writeText(txt);e.target.textContent='コピーしました'}catch(err){e.target.textContent='コピーできませんでした'}setTimeout(()=>e.target.textContent='印をコピー',1600)};
  box.prepend(bar);return true;
}
/* 「書き方」は、テンプレート（入力欄）と、印（本文そのもの）の2つのタブ */
{const inn=document.querySelector('#sheet .in'),pre=$('srcView'),ex=inn.querySelector('.ex');
  const tabs=document.createElement('div');tabs.className='ttabs';tabs.innerHTML='<button type="button" data-t="tpl">テンプレート</button><button type="button" data-t="src">印</button>';
  const box=document.createElement('div');box.id='tplBox';ex.after(tabs);tabs.after(box);
  const show=k=>{tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t===k));box.style.display=k==='tpl'?'':'none';pre.style.display=k==='src'?'':'none';ex.style.display=k==='src'?'':'none'};
  tabs.onclick=e=>{const b=e.target.closest('button');if(b)show(b.dataset.t)};
  $('srcBtn').onclick=()=>{openSheet();show(openEditor()?'tpl':'src')};
  inn.querySelector('.sh b').textContent='このページの書き方';
}

/* ===== 掲示板：2ch/5ch型・返信ツリー型、見た目を選べる =====
   1行＝「番号 名前 ID:xxx：>>返信先 本文」（ID と >>返信先 は省いてよい） */
const BBSRE=/^(\d+)\s+(.+?)(?:\s+ID:(\S+))?：(?:>>(\d+)\s*)?(.*)$/;
const bbsId=p=>{let h=7;for(const ch of p.name+p.n)h=(h*31+ch.charCodeAt(0))>>>0;return h.toString(36).slice(0,8)};
BR['掲示板']=(a,L)=>{
  const ps=L.map((l,i)=>{const m=l.match(BBSRE);return m?{n:+m[1],name:m[2],id:m[3]||'',rp:m[4]||'',body:m[5],i}:{n:i+1,name:'名無しさん',id:'',rp:'',body:l,i}});
  const look=a.見た目||(a.args&&a.args.includes('明るい')?'明るい':''),cls={'定番':'classic','明るい':'lite','ふつう':'flat','色':'cust'}[look]||'';
  const st=look==='色'?`--bg:${a.背景色||'#ffffff'};--fg:${a.文字色||'#222222'};--nm:${a.名前色||'#2f7a3a'};--ac:${a.強調色||'#c8102e'}`:'';
  const tree=a.形式==='ツリー';
  const post=(p,d)=>`<div class="po${d?' rp d'+Math.min(d,3):''}" data-i="${p.i}"><div class="pm">${p.n}：<b>${esc(p.name)}</b>　03:33:${String(10+p.n*7).slice(-2)} ID:${esc(p.id||bbsId(p))}</div>${d?`<div class="rpl">└<span class="anc">&gt;&gt;${p.rp}</span></div>`:''}<div class="pb">${inline((!d&&p.rp?'>>'+p.rp+' ':'')+p.body)}</div></div>`;
  let body;
  if(tree){const by={},kids={},roots=[];ps.forEach(p=>by[p.n]=p);ps.forEach(p=>{if(p.rp&&by[p.rp]&&+p.rp<p.n)(kids[p.rp]=kids[p.rp]||[]).push(p);else roots.push(p)});
    const out=[],walk=(p,d)=>{out.push(post(p,d));(kids[p.n]||[]).forEach(k=>walk(k,d+1))};roots.forEach(p=>walk(p,0));body=out.join('')}
  else body=ps.map(p=>post(p,0)).join('');
  return`<div class="blk bbs ${cls}${tree?' tree':''}" style="${st}" data-fx="掲示板" data-a="${encA(a)}"><div class="bh"><div class="bn">${esc(a.板||'掲示板')}</div><div class="bt">${esc(a.題||'')}</div></div>${body}</div>`};

/* ===== パソコンの画面（勝手に文字が打たれる）：ウィンドウの名前・見た目・速さ ===== */
BR['PC']=(a,L)=>`<div class="blk pc${a.見た目==='白'?' wht':''}${/terminal|ターミナル/i.test(a.題||'')?' term':''}" data-fx="PC" data-a="${encA(a)}" data-lines="${encA(L)}"><div class="scr"><div class="bar">● ● ●　${esc(a.題||'memo.txt')}</div><pre>${esc(L.join('\n'))}<span class="cur"></span></pre></div></div>`;
D['PC'].run=async function(el,a,c){
  const sp={'遅い':1.8,'速い':.45}[a.速さ]||1,tn=el.querySelector('pre').firstChild,lines=JSON.parse(el.dataset.lines);
  for(let li=0;li<lines.length;li++){
    for(const ch of lines[li]){if(!await c.wait((li>=2?rnd(50,110):rnd(90,200))*sp))return;tn.data+=ch;SFX.key();if(Math.random()<.2)vib(8)}
    if(li<lines.length-1)tn.data+='\n';if(!await c.wait((li>=2?300:700)*sp))return}
};

/* ===== 検索画面：言葉が打ち込まれ、候補が出て、結果が並ぶ。1件だけ文字化けもできる =====
   ［検索 語=… 候補=a／b／！c 化ける=2］ 中は「タイトル｜説明｜URL」。候補の頭に！で赤く */
BLOCKS.add('検索');
const srFinal=s=>{const o=[];for(const ch of s){if(ch==='⌫')o.pop();else o.push(ch)}return o.join('')};
BR['検索']=(a,L)=>`<div class="blk srch" data-fx="検索" data-a="${encA(a)}"><div class="sbx"><i>⌕</i><span class="sbq">${esc(srFinal(a.語||''))}</span><span class="scur"></span></div><div class="sug"></div><div class="srs">${L.map((l,i)=>{const [t,d,u]=l.split('｜');return`<div class="sr" data-i="${i}"><small>${esc(u||'https://example.jp')}</small><b>${esc(t||'')}</b><p>${esc(d||'')}</p></div>`}).join('')}</div></div>`;
D['検索']={
  prep(el){el.querySelector('.sbq').textContent='';el.querySelectorAll('.sr').forEach(r=>r.style.display='none')},
  async run(el,a,c){
    const q=el.querySelector('.sbq'),sg=el.querySelector('.sug'),word=[...(a.語||'')],cands=(a.候補||'').split('／').filter(Boolean),sp={'遅い':1.7,'速い':.5}[a.速さ]||1;
    /* 1文字目から、打った文字で始まる候補だけを出す。⌫で1文字消す（候補もまた変わる） */
    const norm=s=>s.replace(/[\s　]+/g,' ').trim(),show=()=>{const t=norm(q.textContent),hit=t?cands.filter(x=>norm(x.replace(/^！/,'')).startsWith(t)&&norm(x.replace(/^！/,''))!==t):[];
      sg.innerHTML=hit.slice(0,5).map(x=>`<div class="${x.startsWith('！')?'bad':''}"><i>⌕</i><span><b>${esc(q.textContent.replace(/[\s　]+$/,''))}</b>${esc(x.replace(/^！/,'').slice(q.textContent.replace(/[\s　]+$/,'').length))}</span></div>`).join('');sg.style.display=hit.length?'block':'none'};
    for(let i=0;i<word.length;i++){
      if(word[i]==='⌫'){q.textContent=[...q.textContent].slice(0,-1).join('');SFX.key();show();if(!await c.wait(rnd(110,170)*sp))return;if(word[i+1]!=='⌫'&&!await c.wait(500*sp))return;continue}
      q.textContent+=word[i];SFX.type();show();
      if(!await c.wait(rnd(160,280)*sp))return}
    if(!await c.wait(1100))return;sg.style.display='none';SFX.key();
    for(const r of el.querySelectorAll('.sr')){if(!await c.wait(380))return;r.style.display='';r.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:300});keepBottom()}
    if(a.化ける){const r=el.querySelectorAll('.sr')[+a.化ける-1];if(r){if(!await c.wait(2200))return;const b=r.querySelector('b'),p=r.querySelector('p');
      for(let k=0;k<10;k++){b.textContent=bugText(b.textContent).slice(0,40);if(k%2)p.textContent=bugText(p.textContent).slice(0,80);SFX.crackle(.05,.25);vib(10);if(!await c.wait(90))return}r.classList.add('bad')}}
  }
};

/* ===== テンプレートの文字の書き方（印との変換） ===== */
Object.assign(TPL,{
  '掲示板':{block:1,attrs:[['形式'],['板'],['題'],['見た目']],parse:l=>{const m=l.match(BBSRE);return m?[m[2],m[3]||'',m[4]||'',m[5]]:['名無しさん','','',l]},
    fmt:(r,i)=>`${i+1} ${spc(r[0])||'名無しさん'}${r[1]?' ID:'+r[1]:''}：${r[2]?'>>'+r[2]+' ':''}${r[3]}`},
  'PC':{block:1,attrs:[['題'],['見た目'],['速さ']],parse:l=>[l],fmt:r=>r[0]},
  '検索':{block:1,attrs:[['語'],['候補'],['化ける'],['速さ']],parse:l=>{const p=l.split('｜');return[p[0]||'',p[1]||'',p[2]||'']},fmt:r=>`${r[0]}｜${r[1]}${r[2]?'｜'+r[2]:''}`}
});

/* ===== 入力画面：上にプレビュー、下に入力。プレビューの中をタップすると、その1件を選べる ===== */
const PHOTO_LIST=typeof PHOTOS!=='undefined'?PHOTOS:[];
const TPNAME={'ボード':'エビデンスボード','PC':'パソコンの画面','検索':'検索画面'};
const EDT={
  '掲示板':{item:'投稿',sel:'.po',label:r=>`${r[0]}：${r[3]}`,blank:()=>['名無しさん','','',''],
    fields:[['名前',0],['ID（空なら自動）',1],['返信先',2,'reply'],['本文',3,'area']],
    sets:[['形式','表示形式',[['','2ch/5ch型'],['ツリー','返信ツリー型']]],['板','板の名前'],['題','スレッド名'],
      ['見た目','見た目',[['','裏掲示板（黒×ネオン）'],['定番','定番（2ch風）'],['明るい','明るい（ピンク）'],['ふつう','ふつう（すっきり）'],['色','色を選ぶ']]],
      ['背景色','背景の色','color','#ffffff'],['文字色','文字の色','color','#222222'],['名前色','名前の色','color','#2f7a3a'],['強調色','スレッド名の色','color','#c8102e']]},
  'トーク':{item:'吹き出し',sel:'.msg,.tkd',label:r=>`${r[0]}：${r[1]}`,blank:()=>['相手',''],quick:1,
    fields:[['だれ',0,'seg',['自分','相手','日付']],['文',1,'area']],
    sets:[['見た目','見た目',[['LINE','LINE風'],['カカオ','カカオトーク風']]],['相手','相手の名前'],['既読','既読',[['','付く'],['なし','付かない']]]],
    fx:[['下書き','返事の下書き（／で区切る。書いては消す）'],['送信','送信ボタン',[['確認','「送信しますか？」と聞く'],['送れる','送れる'],['押せない','押せない']]],['!履歴','最初から全部出す'],['!迷う','「入力中…」が出たり消えたり'],['!涙','涙']]},
  'ボード':{item:'貼り物',sel:'.bi',label:r=>`${r[0]}：${r[1]}`,blank:()=>['付箋','',''],
    fields:[['種類',0,'sel',['写真','人物','新聞','付箋','メモ','地図','指紋','手形','足跡']],['文字',1],['写真',2,'photo']],
    sets:[['種類','ボード',[['コルク','コルクボード'],['ホワイト','ホワイトボード'],['机','机の上']]],['線','光らせる糸（貼り物の番号どうし 例 4-9,9-12）'],['丸','赤丸を付ける貼り物の番号'],['寄る','最後に寄る貼り物の番号']]},
  '招待状':{item:'本文の行',sel:'.invite>div:not(.ivt):not(.ivq)',label:r=>r[0],blank:()=>[''],fields:[['文',0]],
    sets:[['@','出し方',[['スマホ','スマホ'],['パソコン','パソコン']]],['アプリ','アプリ名'],['通知','通知の文'],['題','招待状の題'],['問い','問い']]},
  'システム':{sets:[['種類','種類',[['','システム'],['スキル','スキル'],['アイテム','アイテム'],['警告','警告']]],['文','文']]},
  'PC':{item:'行',sel:null,label:r=>r[0],blank:()=>[''],fields:[['打たれる文',0]],
    sets:[['題','ウィンドウの名前'],['見た目','見た目',[['','黒い画面'],['白','白いメモ帳']]],['速さ','速さ',[['','ふつう'],['遅い','ゆっくり'],['速い','速い']]]]},
  '検索':{item:'検索結果',sel:'.sr',label:r=>r[0],blank:()=>['','',''],fields:[['タイトル',0],['説明',1,'area'],['URL',2]],
    sets:[['語','打つ言葉（⌫ で1文字消す。例：駅前　パン屋　閉店⌫⌫店主）'],['候補','候補（／で区切る。打った文字で始まるものだけ出る。頭に！で赤く）'],['化ける','文字化けさせる結果の番号'],['速さ','打つ速さ',[['','ふつう'],['遅い','ゆっくり（迷いながら）'],['速い','速い']]]]},
  '捜査本部':{item:'行',sel:null,label:r=>r[0],blank:()=>[''],fields:[['1行',0]],sets:[],
    hint:'書き方：■見出し／名前｜中身／・箇条書き／人物：名前｜説明｜写真番号／関係：1-2｜書き込み（点線は 1-2?）／写真：説明｜写真名'}
};
let EDIRTY=false;
const hEl=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
function stillAll(root){root.querySelectorAll('[data-fx]').forEach(el=>{let a;try{a=JSON.parse(el.dataset.a||'{"args":[]}')}catch(e){a={args:[]}}el._a=a;const d=D[el.dataset.fx];try{d&&d.still&&d.still(el,a)}catch(e){}})}
function openEditor(){
  const box=$('tplBox'),src=BOOK.pages[S.cur],list=findTpl(src).filter(o=>EDT[o.k]);box.innerHTML='';
  if(!list.length){box.innerHTML='<p class="ex">このページには、入力画面で作れるテンプレートがありません。いまは「掲示板」「トーク」「システム」「招待状」「エビデンスボード」「捜査本部」「パソコンの画面」「検索画面」で使えます。「印」のタブで書き方は見られます。</p>';return false}
  const commit=()=>{let s=src;[...list].sort((x,y)=>y.start-x.start).forEach(o=>{s=s.slice(0,o.start)+tplText(o)+s.slice(o.end)});BOOK.pages[S.cur]=s;EDIRTY=true;$('srcView').innerHTML=esc(s).replace(/［[^］]*］/g,m=>`<mark>${m}</mark>`)};
  const bar=hEl('div','ebar','<button type="button" data-k="rv">元に戻す</button><button type="button" data-k="cp">印をコピー</button><button type="button" data-k="ed" class="pri">画面で直接直す</button>');
  bar.onclick=async e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.k==='rv'){BOOK.pages[S.cur]=ORIG[S.cur];EDIRTY=true;openEditor()}
    if(b.dataset.k==='cp'){try{await navigator.clipboard.writeText(list.map(tplText).join('\n\n'));b.textContent='コピーしました'}catch(err){b.textContent='コピーできませんでした'}setTimeout(()=>b.textContent='印をコピー',1600)}
    if(b.dataset.k==='ed'){$('sheet').classList.remove('on');EDIRTY=false;enterEdit()}};
  box.appendChild(bar);
  let cur=0;const host=hEl('div','ehost');
  if(list.length>1){const ch=hEl('label','tf','<span>どれを作る？</span>');const s=document.createElement('select');s.innerHTML=list.map((o,i)=>`<option value="${i}">${i+1}. ${esc(TPNAME[o.k]||o.k)}</option>`).join('');s.onchange=()=>{cur=+s.value;draw()};ch.appendChild(s);box.appendChild(ch)}
  box.appendChild(host);
  const draw=()=>{host.innerHTML='';buildCard(list[cur],host,commit)};draw();
  return true;
}
function buildCard(o,host,commit){
  const E=EDT[o.k],t=o.t,a=o.a;a.args=a.args||[];
  const card=hEl('div','ecard',`<div class="tpv"></div><div class="etabs"></div><div class="epane"></div>`);host.appendChild(card);
  const pv=card.querySelector('.tpv'),tabs=card.querySelector('.etabs'),pane=card.querySelector('.epane');
  let sel=o.rows.length?0:-1,tab=(E.item||E.text)?'items':'sets',qwho='自分';
  if(E.presets&&E.presets['青システム'])WPCAT=o.rows.some(r=>/^(検索|受信|送信|速報|年表|PIN|着信中|着信|発信|音声)\s*[：:]/.test(String(r[0]).trim()))?'ミステリー':o.rows.some(r=>mrParse(String(r[0]).trim())||/［制限[\s　][^］]*昇格=/.test(String(r[0])))?'端末・芸能・経営・武侠':o.rows.some(r=>gmParse(String(r[0]).trim()))?'ゲーム画面':o.rows.some(r=>/^［鑑定[\s　][^］]*(確認|発動|走査|逆流|反動|視線|侵食=)/.test(String(r[0]).trim())||/｜\s*侵食\s*$/.test(String(r[0])))?'鑑定スキル・走査':o.rows.some(r=>/^［制限[\s　]/.test(String(r[0]).trim()))?'シナリオ制限':o.rows.some(r=>apParse(String(r[0]))||APFLAG.test(String(r[0])))?'鑑定・隠蔽':o.rows.some(r=>/^［エラー/.test(String(r[0]).trim()))?'システムエラー':o.rows.some(r=>/^(獲得|消費|購入|閲覧|抽選|履歴|所持)\s*[：:]/.test(String(r[0]).trim()))?'コイン・ショップ':a.飾り==='星座'?'星座':a.形==='近未来'?'ステータス（近未来）':a.色==='赤'?'赤システム':a.色==='黒'?'黒システム':(o.rows.some(r=>/STATUS|ANALYSIS|ITEM|QUEST|SKILL|LICENSE|DATABASE|CLASS/.test(r[0]))?'ステータス（ファンタジー）':'青システム');
  const preview=()=>{if(pv._ctl){pv._ctl.kill();pv._ctl=null}pv._w=null;
    if(t.block)pv.innerHTML=BR[o.k](a,o.rows.map((r,i)=>t.fmt(r,i)));
    else pv.innerHTML=`<div class="sysl pvsys"><div class="sys ${({'スキル':'sk','アイテム':'it','警告':'wn'})[a.種類]||''}"><span class="tg">${a.種類==='警告'?'⚠ 警告':'システム'}</span>${esc(a.文||'')}</div></div>`;
    stillAll(pv);if(E.play)try{E.play(pv,a,o)}catch(err){console.error(err)}
    if(E.live)try{E.live(pv,a,o,()=>{commit();render()})}catch(err){console.error(err)}
    if(E.sel&&sel>=0){const els=[...pv.querySelectorAll(E.sel)],e=els.find(x=>x.dataset.i!==undefined&&+x.dataset.i===sel)||els[sel];
      if(e){e.classList.add('tsel');const pr=pv.getBoundingClientRect(),er=e.getBoundingClientRect();if(er.top<pr.top||er.bottom>pr.bottom)pv.scrollTop+=er.top-pr.top-pr.height/3}}};
  pv.onclick=e=>{if(!E.sel)return;const x=e.target.closest(E.sel);if(!x||!pv.contains(x))return;e.preventDefault();const els=[...pv.querySelectorAll(E.sel)];sel=x.dataset.i!==undefined?+x.dataset.i:els.indexOf(x);tab='items';render()};
  const setField=([key,label,opts,def])=>{
    if(['背景色','文字色','名前色','強調色'].includes(key)&&a.見た目!=='色')return null;
    let el;
    if(key==='@'){const vals=opts.map(x=>x[0]);el=document.createElement('select');el.innerHTML=opts.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');el.value=a.args.find(x=>vals.includes(x))||vals[0];el.onchange=()=>{a.args=a.args.filter(x=>!vals.includes(x)).concat([el.value]);commit();preview()}}
    else if(key.startsWith('!')){const f=key.slice(1);el=document.createElement('input');el.type='checkbox';el.checked=a.args.includes(f);el.onchange=()=>{a.args=el.checked?a.args.concat([f]):a.args.filter(x=>x!==f);commit();preview()}}
    else if(opts==='color'){el=document.createElement('input');el.type='color';el.value=a[key]||def;el.oninput=()=>{a[key]=el.value;commit();preview()}}
    else if(Array.isArray(opts)){el=document.createElement('select');el.innerHTML=opts.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');
      el.value=key==='見た目'&&o.k==='掲示板'?(a.見た目||(a.args.includes('明るい')?'明るい':'')):(a[key]||'');
      el.onchange=()=>{if(el.value)a[key]=el.value;else delete a[key];if(key==='見た目')a.args=a.args.filter(x=>x!=='明るい');commit();render()}}
    else{el=document.createElement('input');el.type='text';el.value=a[key]||'';el.oninput=()=>{if(el.value)a[key]=el.value;else delete a[key];commit();preview()}}
    const row=hEl('label','tf',`<span>${esc(label)}</span>`);row.appendChild(el);return row};
  const render=()=>{
    preview();const mm=()=>E.mkdef?(E._mm=E._mm||E.mkdef):MKMODE;pv.style.display=(E.maker&&mm()==='maker'&&tab==='items')?'none':'';
    tabs.innerHTML='';const tl=[];if(E.item||E.text)tl.push(['items','内容']);tl.push(['sets','設定']);if(E.fx)tl.push(['fx','演出']);
    if(tl.length>1)tl.forEach(([k,l])=>{const b=hEl('button',tab===k?'on':'',esc(l));b.type='button';b.onclick=()=>{tab=k;render()};tabs.appendChild(b)});
    pane.innerHTML='';
    if(tab==='sets'||tab==='fx'){(tab==='sets'?E.sets:E.fx).forEach(f=>{const r=setField(f);if(r)pane.appendChild(r)});if(E.hint&&tab==='sets')pane.appendChild(hEl('p','ehint',esc(E.hint)));return}
    /* 文章で書くテンプレート（システム画面など）：文例を選んで、文章を書き換える */
    if(E.text){
      if(E.maker){const md=hEl('div','seg tmode');[['maker','メーカーで作る'],['cards','一覧・直接で作る']].forEach(([k,l])=>{const b=hEl('button',mm()===k?'on':'',l);b.type='button';b.onclick=()=>{if(E.mkdef)E._mm=k;else MKMODE=k;render()};md.appendChild(b)});pane.appendChild(md);if(mm()==='maker'){E.maker(pane,o,a,commit,pv);return}}
      if(E.presets){const cats=Object.keys(E.presets);WPCAT=cats.includes(WPCAT)?WPCAT:cats[0];
        const cs=document.createElement('select');cs.innerHTML=cats.map(k=>`<option>${esc(k)}</option>`).join('');cs.value=WPCAT;cs.onchange=()=>{WPCAT=cs.value;render()};
        const r1=hEl('label','tf','<span>文例の種類</span>');r1.appendChild(cs);pane.appendChild(r1);
        const chips=hEl('div','pchips');E.presets[WPCAT].forEach(([n,at,txt])=>{const b=hEl('button','',esc(n));b.type='button';b.onclick=()=>{o.rows=txt.split('\n').map(x=>[x]);Object.keys(a).forEach(k=>{if(k!=='args')delete a[k]});Object.assign(a,at);commit();render()};chips.appendChild(b)});pane.appendChild(chips)}
      if(E.lines||GCFG[o.k]){const md=hEl('div','seg tmode');[['cards','カードで編集'],['text','文字で書く']].forEach(([k,l])=>{const b=hEl('button',WMODE===k?'on':'',l);b.type='button';b.onclick=()=>{WMODE=k;render()};md.appendChild(b)});pane.appendChild(md);
        if(WMODE==='cards'){if(E.lines)lineCards(pane,o,commit,preview,render);else{gCards(pane,o,commit,preview,render,E,o.k);if(E.extra)E.extra(pane,o,()=>{commit();preview()},render)}return}}
      pane.appendChild(hEl('div','ecount','文章（この書き方のまま、画面になります）'));
      const ta=document.createElement('textarea');ta.className='wta';ta.value=o.rows.map(r=>r[0]).join('\n');ta.oninput=()=>{o.rows=ta.value.split('\n').map(x=>[x]);commit();preview()};
      if(E.tools){const tb=hEl('div','etools','<small>文字を選んでから押すと、その文字に印が付きます</small>');E.tools.forEach(([l,b4,af])=>{const b=hEl('button','',esc(l));b.type='button';b.onmousedown=e=>e.preventDefault();b.onclick=()=>{const s=ta.selectionStart,e2=ta.selectionEnd,v=ta.value;ta.value=v.slice(0,s)+b4+v.slice(s,e2)+af+v.slice(e2);ta.focus();ta.selectionStart=s+b4.length;ta.selectionEnd=e2+b4.length;ta.oninput()};tb.appendChild(b)});pane.appendChild(tb)}
      pane.appendChild(ta);if(E.extra)E.extra(pane,o,()=>{commit();preview()},render);
      if(E.plain){const row=hEl('div','eplain','<label><input type="checkbox" checked> コピー時にシステム枠を付ける</label><button type="button">文章としてコピー</button>');
        const cb=row.querySelector('input'),bt=row.querySelector('button');bt.onclick=async()=>{try{await navigator.clipboard.writeText(E.plain(o,cb.checked));bt.textContent='コピーしました'}catch(e){bt.textContent='コピーできませんでした'}setTimeout(()=>bt.textContent='文章としてコピー',1600)};pane.appendChild(row)}
      if(E.hint)pane.appendChild(hEl('p','ehint',esc(E.hint)));return}
    /* トーク：メーカーそのもので作る／一覧・直接で作る */
    if(E.maker){const md=hEl('div','seg tmode');[['maker','メーカーで作る'],['cards','一覧・直接で作る']].forEach(([k,l])=>{const b=hEl('button',mm()===k?'on':'',l);b.type='button';b.onclick=()=>{if(E.mkdef)E._mm=k;else MKMODE=k;render()};md.appendChild(b)});pane.appendChild(md);if(mm()==='maker'){E.maker(pane,o,a,commit,pv);return}}
    /* 内容：トークは、自分／相手を選んで打ち、追加 */
    if(E.quick&&!E.cards){const q=hEl('div','equick');const seg=hEl('div','seg');['自分','相手','日付'].forEach(w=>{const b=hEl('button',w===qwho?'on':'',w);b.type='button';b.onclick=()=>{qwho=w;seg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))};seg.appendChild(b)});
      const inp=document.createElement('input');inp.type='text';inp.placeholder='メッセージを入力';const add=hEl('button','eadd','追加');add.type='button';
      const go=()=>{if(!inp.value.trim())return;o.rows.push([qwho,inp.value]);sel=o.rows.length-1;commit();render();pane.querySelector('.equick input').focus()};
      add.onclick=go;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}};q.append(seg,inp,add);pane.appendChild(q)}
    if(E.presets){const cats=Object.keys(E.presets);if(!cats.includes(WPCAT))WPCAT=cats.find(k=>E.presets[k].some(p=>p[1].形===a.形))||cats[0];
      const cs=document.createElement('select');cs.innerHTML=cats.map(k=>`<option>${esc(k)}</option>`).join('');cs.value=WPCAT;cs.onchange=()=>{WPCAT=cs.value;render()};
      const r1=hEl('label','tf','<span>文例</span>');r1.appendChild(cs);pane.appendChild(r1);
      const chips=hEl('div','pchips');E.presets[WPCAT].forEach(([n,at,txt])=>{const b=hEl('button','',esc(n));b.type='button';b.onclick=()=>{o.rows=txt.split('\n').filter(x=>x.trim()).map(t.parse);Object.keys(a).forEach(k=>{if(k!=='args')delete a[k]});Object.assign(a,at);sel=0;commit();render()};chips.appendChild(b)});pane.appendChild(chips)}    if(E.plain&&!E.text){const row=hEl('div','eplain','<label><input type="checkbox" checked> 見出しも付ける</label><button type="button">文章としてコピー</button>');const cb=row.querySelector('input'),bt=row.querySelector('button');
      bt.onclick=async()=>{try{await navigator.clipboard.writeText(E.plain(o,cb.checked));bt.textContent='コピーしました'}catch(e){bt.textContent='コピーできませんでした'}setTimeout(()=>bt.textContent='文章としてコピー',1600)};pane.appendChild(row)}
    /* トーク：まとめて入力／こまかく編集（メッセージごとのカード） */
    if(E.cards){
      const md=hEl('div','seg tmode');[['bulk','まとめて入力'],['cards','こまかく編集']].forEach(([k,l])=>{const b=hEl('button',TKMODE===k?'on':'',l);b.type='button';b.onclick=()=>{TKMODE=k;render()};md.appendChild(b)});pane.appendChild(md);
      if(TKMODE==='bulk'){const ta=document.createElement('textarea');ta.className='wta';ta.value=o.rows.map(r=>t.fmt(r)).join('\n');ta.oninput=()=>{o.rows=ta.value.split('\n').filter(x=>x.trim()).map(t.parse);commit();preview()};
        pane.appendChild(ta);pane.appendChild(hEl('p','ehint','1行に1つ。「相手：本文」「自分｜12:36｜既読：本文」「日付：今日」。本文に {画像:street} {スタンプ:1} {不在着信} も書けます。'));return}
      const list=hEl('div','tcards');
      o.rows.forEach((r,i)=>{const card=hEl('div','tcard'+(r[0]==='自分'?' snd':r[0]==='日付'?' day':'')+(i===sel?' cur':''));
        const top=hEl('div','tctop',`<em>${i+1}</em>`);
        const kind=hEl('div','seg sm');[['相手','受信'],['自分','送信'],['日付','日付'],['システム','システム']].forEach(([v,l])=>{const b=hEl('button',r[0]===v?'on':'',l);b.type='button';b.onclick=()=>{r[0]=v;sel=i;commit();render()};kind.appendChild(b)});top.appendChild(kind);
        if(r[0]==='自分'){const rd=hEl('button','rd'+(r[3]!=='未読'?' on':''),r[3]==='未読'?'未読':'既読 ✓');rd.type='button';rd.onclick=()=>{r[3]=r[3]==='未読'?'既読':'未読';sel=i;commit();render()};top.appendChild(rd)}
        if(r[0]!=='日付'){const tm=document.createElement('input');tm.type='text';tm.className='tmi';tm.placeholder='12:36';tm.value=r[2]||'';tm.oninput=()=>{r[2]=tm.value;sel=i;commit();preview()};top.appendChild(tm)}
        const ac=hEl('span','tcac','<button type="button" data-a="up" aria-label="上へ">▲</button><button type="button" data-a="dn" aria-label="下へ">▼</button><button type="button" data-a="x" aria-label="消す">✕</button>');
        ac.onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.a;if(k==='up'&&i>0)[o.rows[i-1],o.rows[i]]=[o.rows[i],o.rows[i-1]];if(k==='dn'&&i<o.rows.length-1)[o.rows[i+1],o.rows[i]]=[o.rows[i],o.rows[i+1]];if(k==='x')o.rows.splice(i,1);sel=-1;commit();render()};top.appendChild(ac);card.appendChild(top);
        let m;
        if((m=r[1].match(/^\{画像[:：](.+)\}$/))){const g=hEl('div','pgrid');PHOTO_LIST.forEach(k=>{const b=hEl('button',k===m[1]?'on':'');b.type='button';b.style.backgroundImage=`url(a/ph_${k}.jpg)`;b.onclick=()=>{r[1]=`{画像:${k}}`;sel=i;commit();render()};g.appendChild(b)});card.appendChild(g)}
        else if((m=r[1].match(/^\{スタンプ[:：](\d+)\}$/))){const g=hEl('div','stgrid');TKST.forEach((s,k)=>{const b=hEl('button',+m[1]===k+1?'on':'',s);b.type='button';b.onclick=()=>{r[1]=`{スタンプ:${k+1}}`;sel=i;commit();render()};g.appendChild(b)});card.appendChild(g)}
        else if(/^\{不在着信\}$/.test(r[1]))card.appendChild(hEl('div','tcall','📞 不在着信'));
        else{const ip=document.createElement('input');ip.type='text';ip.value=r[1];ip.placeholder=r[0]==='日付'?'今日':'メッセージ';ip.oninput=()=>{r[1]=ip.value;sel=i;commit();preview()};card.appendChild(ip)}
        list.appendChild(card)});
      pane.appendChild(list);
      const adds=hEl('div','tadds');[['＋ 受信',['相手','']],['＋ 送信',['自分','','','既読']],['＋ 画像',['自分','{画像:street}','','既読']],['＋ 不在着信',['相手','{不在着信}']],['＋ スタンプ',['相手','{スタンプ:1}']],['＋ 日付',['日付','今日']]].forEach(([l,row])=>{const b=hEl('button','',l);b.type='button';b.onclick=()=>{o.rows.push(row.slice());sel=o.rows.length-1;commit();render();const cs=pane.querySelectorAll('.tcard');cs[cs.length-1]?.scrollIntoView({block:'nearest'})};adds.appendChild(b)});
      pane.appendChild(adds);return}
    /* コメント欄：まとめて入力／こまかく編集（コメントごとのカード） */
    if(E.ccards){const form=a.形||'配信',me=()=>a.配信者||(form==='アイドル'?'HANEUL':'配信者');
      const kinds=form==='星座'?['ふつう','本人','コイン','システム']:form==='アイドル'?['ふつう','本人','管理者','スパチャ','コイン','システム']:['ふつう','本人','管理者','スパチャ','システム'];
      const md=hEl('div','seg tmode');[['bulk','まとめて入力'],['cards','こまかく編集']].forEach(([k,l])=>{const b=hEl('button',CHMODE===k?'on':'',l);b.type='button';b.onclick=()=>{CHMODE=k;render()};md.appendChild(b)});pane.appendChild(md);
      if(CHMODE==='bulk'){const ta=document.createElement('textarea');ta.className='wta';ta.value=o.rows.map(r=>t.fmt(r)).join('\n');ta.oninput=()=>{o.rows=ta.value.split('\n').filter(x=>x.trim()).map(t.parse);commit();preview()};
        pane.appendChild(ta);pane.appendChild(hEl('p','ehint','1行に1つ。「名前：本文」。頭に ★ で本人、◎ で管理者。「¥1,000 名前：本文」でスパチャ、「🪙500 名前：本文」でコイン、「［…］」でシステム。'));return}
      const list=hEl('div','tcards');
      o.rows.forEach((r,i)=>{const card=hEl('div','tcard cks ck-'+(CHKIND.findIndex(x=>x[0]===r[0]))+(i===sel?' cur':''));
        const top=hEl('div','tctop',`<em>${i+1}</em>`);
        const kind=hEl('div','seg sm');kinds.forEach(v=>{const b=hEl('button',r[0]===v?'on':'',v==='本人'?'🎤本人':v);b.type='button';b.onclick=()=>{if(v==='本人'&&r[0]!=='本人')r[1]=me();if(r[0]==='本人'&&v!=='本人'&&r[1]===me())r[1]='';if((v==='スパチャ'||v==='コイン')&&!r[3])r[3]=v==='コイン'?'500':'1,000';r[0]=v;sel=i;commit();render()};kind.appendChild(b)});top.appendChild(kind);
        const ac=hEl('span','tcac','<button type="button" data-a="up" aria-label="上へ">▲</button><button type="button" data-a="dn" aria-label="下へ">▼</button><button type="button" data-a="x" aria-label="消す">✕</button>');
        ac.onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.a;if(k==='up'&&i>0)[o.rows[i-1],o.rows[i]]=[o.rows[i],o.rows[i-1]];if(k==='dn'&&i<o.rows.length-1)[o.rows[i+1],o.rows[i]]=[o.rows[i],o.rows[i+1]];if(k==='x')o.rows.splice(i,1);sel=-1;commit();render()};top.appendChild(ac);card.appendChild(top);
        const inp=(j,ph,cls)=>{const ip=document.createElement('input');ip.type='text';ip.value=r[j]||'';ip.placeholder=ph;if(cls)ip.className=cls;ip.oninput=()=>{r[j]=ip.value;sel=i;commit();preview()};return ip};
        if(r[0]!=='システム'){const row=hEl('div','ccrow');row.appendChild(inp(1,'名前','ccn'));if(r[0]==='スパチャ'||r[0]==='コイン'){const am=inp(3,r[0]==='コイン'?'500':'1,000','cca');row.appendChild(hEl('span','ccu',r[0]==='コイン'?'🪙':'¥'));row.appendChild(am)}card.appendChild(row)}
        card.appendChild(inp(2,r[0]==='システム'?'システムの文（例：配信が終了しました）':'コメント'));
        list.appendChild(card)});
      pane.appendChild(list);
      const addl=[['＋ コメント',['ふつう','','','']],['＋ 🎤本人',['本人',me(),'','']]];
      if(kinds.includes('スパチャ'))addl.push(['＋ スパチャ',['スパチャ','','','1,000']]);
      if(kinds.includes('コイン'))addl.push(['＋ コイン',['コイン','','','500']]);
      addl.push(['＋ システム',['システム','','','']]);
      const adds=hEl('div','tadds cadds');addl.forEach(([l,row])=>{const b=hEl('button','',l);b.type='button';b.onclick=()=>{o.rows.push(row.slice());sel=o.rows.length-1;commit();render();const cs=pane.querySelectorAll('.tcard');const c=cs[cs.length-1];c?.scrollIntoView({block:'nearest'});c?.querySelector('input:last-child')?.focus()};adds.appendChild(b)});
      pane.appendChild(adds);return}    const pk=hEl('label','tf',`<span>編集する${esc(E.item)}</span>`),ps=document.createElement('select');
    ps.innerHTML=o.rows.map((r,i)=>`<option value="${i}">${i+1}：${esc(String(E.label(r)).slice(0,24))}</option>`).join('')+`<option value="new">＋ 新しい${esc(E.item)}</option>`;
    ps.value=sel>=0?String(sel):'new';ps.onchange=()=>{if(ps.value==='new'){o.rows.push(E.blank());sel=o.rows.length-1;commit()}else sel=+ps.value;render()};
    pk.appendChild(ps);pane.appendChild(pk);pane.appendChild(hEl('div','ecount',`現在 ${o.rows.length}件${E.sel?'　（プレビューをタップしても選べます）':''}`));
    if(sel<0||!o.rows[sel])return;
    const r=o.rows[sel];
    E.fields.forEach(([label,j,type,opts])=>{
      if(type==='photo'&&!['写真','人物'].includes(r[0]))return;
      const row=hEl('label','tf'+(type==='photo'?' wide':''),`<span>${esc(label)}</span>`);let el;
      const upd=v=>{r[j]=v;commit();preview();const op=ps.options[sel];if(op)op.text=`${sel+1}：${String(E.label(r)).slice(0,24)}`};
      if(type==='area'){el=document.createElement('textarea');el.rows=2;el.value=r[j]||'';el.oninput=()=>upd(el.value)}
      else if(type==='sel'){el=document.createElement('select');el.innerHTML=opts.map(x=>`<option>${esc(x)}</option>`).join('');el.value=r[j]||opts[0];el.onchange=()=>{r[j]=el.value;commit();render()}}
      else if(type==='seg'){el=hEl('div','seg');opts.forEach(w=>{const b=hEl('button',w===r[j]?'on':'',w);b.type='button';b.onclick=e=>{e.preventDefault();r[j]=w;commit();render()};el.appendChild(b)})}
      else if(type==='reply'){el=document.createElement('select');el.innerHTML='<option value="">なし</option>'+o.rows.slice(0,sel).map((_,k)=>`<option value="${k+1}">&gt;&gt;${k+1}</option>`).join('');el.value=r[j]||'';el.onchange=()=>{r[j]=el.value;commit();render()}}
      else if(type==='photo'){el=hEl('div','pgrid');const items=r[0]==='人物'?Array.from({length:16},(_,k)=>[String(k+1),`a/p${k+1}.jpg`]):PHOTO_LIST.map(k=>[k,`a/ph_${k}.jpg`]);
        items.forEach(([v,src])=>{const b=hEl('button',v===r[j]?'on':'');b.type='button';b.style.backgroundImage=`url(${src})`;b.setAttribute('aria-label',v);b.onclick=e=>{e.preventDefault();r[j]=v;commit();render()};el.appendChild(b)})}
      else{el=document.createElement('input');el.type='text';el.value=r[j]||'';el.oninput=()=>upd(el.value)}
      row.appendChild(el);pane.appendChild(row)});
    const act=hEl('div','eact','<button type="button" data-a="up">↑ 上へ</button><button type="button" data-a="dn">↓ 下へ</button><button type="button" data-a="del" class="del">この' + esc(E.item) + 'を消す</button>');
    act.onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.a;
      if(k==='up'&&sel>0){[o.rows[sel-1],o.rows[sel]]=[o.rows[sel],o.rows[sel-1]];sel--}
      if(k==='dn'&&sel<o.rows.length-1){[o.rows[sel+1],o.rows[sel]]=[o.rows[sel],o.rows[sel+1]];sel++}
      if(k==='del'){o.rows.splice(sel,1);sel=Math.min(sel,o.rows.length-1)}
      commit();render()};
    pane.appendChild(act);
  };
  render();
}
/* 書き方を閉じたら、書き換えた内容で演出を流し直す */
$('sheetClose').onclick=()=>{$('sheet').classList.remove('on');if(EDIRTY){EDIRTY=false;S.busy=false;rerender()}};
$('sheet').addEventListener('click',e=>{if(e.target.id==='sheet'&&EDIRTY){EDIRTY=false;S.busy=false;rerender()}});

/* ===== 編集画面：演出を止めて、画面に出ている文字を直接タップして直す（読んでいるときは直せない） ===== */
const tx=(el,s)=>{const e=el.querySelector(s);return e?e.textContent.trim():''};
const DIRECT={
  '掲示板':{ed:'.bn,.bt,.pm b,.pb',get(el,o){o.a.板=tx(el,'.bn');o.a.題=tx(el,'.bt');
    el.querySelectorAll('.po').forEach(p=>{const r=o.rows[+p.dataset.i];if(!r)return;r[0]=tx(p,'.pm b');let b=tx(p,'.pb');if(r[2]&&o.a.形式!=='ツリー')b=b.replace(new RegExp('^>>'+r[2]+'\\s*'),'');r[3]=b})}},
  'トーク':{ed:'.tkh b,.bb,.tkd span',get(el,o){o.a.相手=tx(el,'.tkh b');[...el.querySelectorAll('.msg,.tkd')].forEach((m,i)=>{const r=o.rows[i];if(r)r[1]=m.classList.contains('tkd')?tx(m,'span'):tx(m,'.bb')})}},
  'ボード':{ed:'.bi>span,.bi.np>b,.bi.st,.bi.mm',get(el,o){[...el.querySelectorAll('.bi')].forEach((b,i)=>{const r=o.rows[i];if(!r)return;const e=b.querySelector(':scope>span')||(b.classList.contains('np')?b.querySelector(':scope>b'):b);r[1]=e.textContent.trim()})}},
  '招待状':{ed:'.ivt,.invite>div:not(.ivq)',get(el,o){o.a.題=tx(el,'.ivt');[...el.querySelectorAll(':scope>div:not(.ivt):not(.ivq)')].forEach((d,i)=>{if(o.rows[i])o.rows[i][0]=d.textContent.trim()})}},
  'PC':{ed:'pre',get(el,o){o.rows=el.querySelector('pre').textContent.replace(/\s+$/,'').split('\n').map(x=>[x])}},
  '検索':{ed:'.sbq,.sr b,.sr p,.sr small',get(el,o){const t=tx(el,'.sbq');if(t!==srFinal(o.a.語||''))o.a.語=t;[...el.querySelectorAll('.sr')].forEach((s,i)=>{const r=o.rows[i];if(r){r[0]=tx(s,'b');r[1]=tx(s,'p');r[2]=tx(s,'small')}})}}
};
function enterEdit(){
  if(S.cur==null)return;S.edit=true;if(S.ctx){S.ctx.kill();S.ctx=null}newBus();stopSpeech();resetLooks();
  page.innerHTML=renderPage(BOOK.pages[S.cur]);page.scrollTop=0;mount(false);setScene(S.cur,null);
  const src=BOOK.pages[S.cur],cnt={};
  S.editSrc=src;S.editList=findTpl(src).map(o=>{const n=cnt[o.k]||0;cnt[o.k]=n+1;const el=DIRECT[o.k]?page.querySelectorAll(`[data-fx="${o.k}"]`)[n]:null;
    if(el)el.querySelectorAll(DIRECT[o.k].ed).forEach(x=>{x.setAttribute('contenteditable','plaintext-only');if(x.contentEditable!=='plaintext-only')x.contentEditable='true';x.classList.add('edz')});return{o,el}});
  let b=$('edbar');if(!b){b=hEl('div','edbar');b.id='edbar';document.body.appendChild(b)}
  b.innerHTML='<span>編集中：点線の枠の文字をタップすると、そのまま直せます</span><button type="button">終わる</button>';b.querySelector('button').onclick=exitEdit;b.style.display='flex';
  if(!S.editList.some(x=>x.el))b.querySelector('span').textContent='このページには、画面で直接直せる演出がありません';
}
function exitEdit(){
  if(!S.edit)return;let s=S.editSrc;const ch=[];
  S.editList.forEach(({o,el})=>{if(!el)return;try{DIRECT[o.k].get(el,o);ch.push(o)}catch(e){console.error(e)}});
  ch.sort((x,y)=>y.start-x.start).forEach(o=>{s=s.slice(0,o.start)+tplText(o)+s.slice(o.end)});
  BOOK.pages[S.cur]=s;S.edit=false;$('edbar').style.display='none';S.busy=false;rerender();
}

/* ===== システム画面を、入力画面・直接編集で扱えるようにする ===== */
TPL['窓']={block:1,attrs:[['色'],['形'],['装飾'],['飾り'],['上'],['下']],parse:l=>[l],fmt:r=>r[0]};
TPNAME['窓']='システム画面';
EDT['窓']={text:1,presets:WINP,plain:winPlain,
  sets:[['色','色',[['青','青（案内・祝福）'],['赤','赤（警告・危険）'],['黒','黒（禁忌・未知）'],['紫','星空パープル'],['金','金'],['緑','緑'],['白','白']]],
    ['形','形',[['ファンタジー','ファンタジー風'],['近未来','近未来風'],['端末','モノクロ端末']]],
    ['装飾','表示スタイル',[['','装飾あり'],['なし','シンプル']]],['進行','進め方',[['','自動で進む'],['タップ','段階ごとにタップで進む']]],['重ねる','前のシステム画面に重ねる',[['','重ねない'],['1','重ねる（割り込み）']]],['上','上の飾り文字（空なら自動）'],['下','下の飾り文字（空なら自動）']],
  hint:'書き方：╔═╗ の中＝見出し／━━━＝区切り／◆ ▸＝区画／名前：値＝表／［ ］＝システムの一言／> ＝ログ／HP [███░░] 80%＝バー／【YES / NO】［確認］＝押せるボタン／？？？ ██ ACCESS DENIED＝ノイズ／〇〇まで：00:10＝カウントダウン／＠乗っ取り＝ここから黒いシステムに乗っ取られる／鑑定：レベル：Lv.12｜偽装｜真=Lv.38（隠し・偽装・欠落・封印・閲覧不可・認識阻害・解析不能）＋［鑑定 看破］［鑑定 解放］［鑑定 対決 鑑定=3 隠蔽=8 補正=+2］など／✕ 条件 → ［鑑定 達成］で ✓／シナリオ制限：［制限 状態=LOCKED］［制限 難易度=HARD］［制限 変化=整合率:42%→ERROR］［制限 消える 数=2］［制限 封鎖］［制限 解除］／走査：［鑑定 確認 スキル=鑑定］［鑑定 発動 スキル=真実の眼］［鑑定 走査 回数=2 向き=往復 率=60］の下の行が線で読み取られる／［鑑定 妨害］［鑑定 逆流］［鑑定 反動］［鑑定 視線］／侵食率：12%｜侵食 →［鑑定 侵食=+6］／ゲーム：アイテム：回復ポーション｜×5｜R｜説明=…／ダメージ：9,999｜CRITICAL／① 選択肢｜結果=…（④ ？？？｜LOCKED、｜固定）／剣術 Lv.1｜済　　├─ 高速斬撃｜未 →［鑑定 習得=高速斬撃］／PIN：0412｜誤=1234｜試行=5／着信中：非通知／着信：ミオ｜23:41｜不在／音声：証言.wav｜1:24｜欠損=55-72／候補：名前｜音源=4,210｜投票=850／［制限 昇格=境地:絶頂］'};
DIRECT['窓']={ed:'.wl.k-sys,.wl.k-p,.wl.k-log,.wl.k-li,.wl.k-c,.wl.k-h,.wl.k-sub,.wl.k-say,.wl.k-kv>span,.wl.k-kv>b',get(el,o){
  el.querySelectorAll('.wl[data-i]').forEach(w=>{const r=o.rows[+w.dataset.i];if(!r)return;const k=[...w.classList].find(x=>x.startsWith('k-')).slice(2);
    if(['btn','bar','hr','sp','hj','err','eco','gauge','aps','apv','chk','ero','scan','apd','scd','tap','inv','dmg','cho','tree','pin','call','clog','voice','score','srch','dm','alert','tl'].includes(k))return;if(k==='kv'){r[0]=`${w.querySelector(':scope>span').textContent.trim()}：${w.querySelector(':scope>b').textContent.trim()}`;return}r[0]=w.textContent.trim()})}};
let WPCAT=null;

/* ===== コメント欄を、入力画面・直接編集で扱えるようにする ===== */
TPL['チャット欄']={block:1,attrs:[['形'],['題'],['視聴'],['配信者'],['ハート'],['ひとこと'],['速さ'],['写真']],parse:chParse,fmt:chFmt};
TPNAME['チャット欄']='コメント欄';
EDT['チャット欄']={item:'コメント',sel:'.cm',label:r=>`${r[0]==='ふつう'?'':r[0]+' '}${r[1]}：${r[2]}`,blank:()=>['ふつう','名無し',''],presets:CHP,
  fields:[['種類',0,'sel',CHKIND.map(x=>x[0])],['名前',1],['本文',2,'area'],['金額（スパチャ・コイン）',3]],
  sets:[['形','形',[['配信','ライブ配信（チャット欄）'],['星座','星座配信'],['アイドル','アイドル生配信']]],['題','配信タイトル'],['視聴','同時視聴者数'],['配信者','配信者の名前（アイドル）'],['ひとこと','本人のひとこと（アイドル）'],['ハート','ハートの数（アイドル）'],['写真','背景・映像',[['','（初期：アイドルは部屋／ライブ配信は映像なし）'],['hs_live16','横の配信：マイクの前（シルエット）'],['sil_live1','シルエット：部屋（窓・夜景）'],['sil_live2','シルエット：部屋（マイク）'],['sil_live3','シルエット：部屋（スマホ）'],['なし','なし（背景だけ）']]],['速さ','コメントの速さ',[['','ふつう'],['速い','速い（盛り上がり）']]]]};
DIRECT['チャット欄']={ed:'.cm .t,.cm .n',get(el,o){el.querySelectorAll('.cm[data-i]').forEach(m=>{const r=o.rows[+m.dataset.i];if(!r)return;const t=m.querySelector('.t'),n=m.querySelector('.n');if(t)r[2]=t.textContent.trim();if(n&&r[0]!=='コイン')r[1]=n.textContent.replace(/^(✦ |🎤 )/,'').replace(/ ✓$/,'').trim()})}};

/* ===== トーク：メッセージごとに時刻・既読、画像・スタンプ・不在着信も =====
   1行＝「自分｜23:41｜既読：本文」（時刻と既読は省いてよい）。本文に {画像:room} {スタンプ:1} {不在着信} も書ける */
const TKST=['😊','😢','😡','🥺','👍','🙏','💤','🎉','❤️','😂'];
BR['トーク']=(a,L)=>{
  const kk=a.見た目==='カカオ'?'kk':'ln',who=a.相手||'相手';let tm=40;
  const rows=L.map((l,idx)=>{const i=l.indexOf('：');const hd=i<0?['']:l.slice(0,i).split('｜'),k=hd[0],v=i<0?l:l.slice(i+1);let m;
    if(k==='日付')return`<div class="tkd" data-i="${idx}"><span>${esc(v)}</span></div>`;
    const me=k==='自分',t=hd[1]||`23:${String(tm++).padStart(2,'0')}`,read=me&&(hd[2]?hd[2]==='既読':a.既読!=='なし');
    let body,cls='bb';
    if((m=v.match(/^\{画像[:：](.+)\}$/))){body=`<img src="a/ph_${esc(m[1])}.jpg" alt="">`;cls='bb bimg'}
    else if((m=v.match(/^\{スタンプ[:：](\d+)\}$/))){body=TKST[(+m[1]-1+TKST.length)%TKST.length];cls='bb bst'}
    else if(/^\{不在着信\}$/.test(v)){body='📞 不在着信<small>タップしてかけ直す</small>';cls='bb bcall'}
    else body=inline(v);
    return`<div class="msg ${me?'me':'you'}" data-i="${idx}">${me?'':`<i class="av"></i>`}<div class="${cls}">${body}</div><span class="tm">${read?'<em>既読</em>':''}${esc(t)}</span></div>`}).join('');
  return`<div class="blk talk ${kk}" data-fx="トーク" data-a="${encA(a)}"><div class="tkh"><span>‹</span><b>${esc(who)}</b><span>☰</span></div><div class="tkb">${rows}</div><div class="tki"><div class="tkin"></div><button type="button" class="tks" disabled>送信</button></div></div>`};
TPL['トーク'].parse=l=>{const k=l.indexOf('：'),hd=(k<0?'相手':l.slice(0,k)).split('｜');return[hd[0],k<0?l:l.slice(k+1),hd[1]||'',hd[2]||'']};
TPL['トーク'].fmt=r=>`${r[0]}${r[2]||r[3]?`｜${r[2]||''}${r[3]?'｜'+r[3]:''}`:''}：${r[1]}`;
DIRECT['トーク'].get=(el,o)=>{o.a.相手=tx(el,'.tkh b');el.querySelectorAll('.msg[data-i],.tkd[data-i]').forEach(m=>{const r=o.rows[+m.dataset.i];if(!r)return;
  if(m.classList.contains('tkd'))r[1]=tx(m,'span');else{const b=m.querySelector('.bb');if(!/bimg|bst|bcall/.test(b.className))r[1]=b.textContent.trim()}})};
EDT['トーク'].cards=1;

/* ===== 文例（作品に合わせて書き換えて使う） ===== */
EDT['トーク'].presets={'トーク':[
  ['待ち合わせ',{見た目:'LINE',相手:'ミオ'},`日付：今日
相手｜12:36：今日カフェ行こ〜！
自分｜12:36｜既読：いいよ〜♪
相手｜12:37：駅前のとこね
相手｜12:37：{スタンプ:1}
自分｜12:40｜既読：{画像:street}
自分｜12:40｜既読：着いた！`],
  ['喧嘩別れ（送れない返事）',{見た目:'LINE',相手:'ハル',送信:'確認',下書き:'おまえが悪いだろ／あのさ／ごめん／会いたい',args:['履歴','涙']},`日付：10月12日（土）
自分｜21:03｜既読：もう顔も見たくない
相手｜21:05：わかった
相手｜21:06：あとで話ある
相手｜23:41：あとd
相手｜23:58：{不在着信}`],
  ['告白前夜',{見た目:'カカオ',相手:'先輩',args:['迷う']},`日付：今日
自分｜22:10｜既読：明日、少しだけ時間ありますか
相手｜22:31：いいよ。どうしたの？
自分｜22:32｜未読：…会ってから話します`]]};
EDT['掲示板'].presets={'掲示板':[
  ['オカルト実況（裏）',{板:'オカルト実況板',題:'【実況】あの配信、まだ続いてる　part13'},`1 名無しさん：廃病院のやつ、まだ映ってる
2 名無しさん：一年たつのに？
3 名無しさん：さっき起きたぞ
4 名無しさん：>>3 は？　誰が
5 名無しさん：湊`],
  ['アイドル実況',{板:'アイドル実況板',題:'【STAR☆LINE】ドームツアー初日実況　part3',見た目:'明るい'},`1 名無しさん：セトリ神すぎる
2 名無しさん：ミオのソロきた！！
3 名無しさん：>>2 泣いてる
4 名無しさん：銀テ取れた人いる？`],
  ['ゲーム攻略（定番）',{板:'ゲーム攻略板',題:'【エテルナ】初心者質問スレ　Part58',見た目:'定番'},`1 名無しの冒険者 ID:aB3x9K：おい、今の配信見たやついる？
2 名無しの冒険者 ID:k8M2Qa：見た　あれどうなってんだよ
3 名無しの冒険者 ID:X2p91A：>>1 見たけど意味わからんかった
4 名無しの冒険者 ID:r7T4zC：ボス一撃だったよな？？？`],
  ['地元の雑談（ツリー）',{板:'地元の雑談板',題:'駅前のパン屋、閉店するってほんと？',形式:'ツリー',見た目:'ふつう'},`1 名無しさん：駅前のパン屋、来月で閉店らしい
2 名無しさん：>>1 えっ、メロンパンの店？
3 名無しさん：>>2 そう。張り紙出てた
4 名無しさん：>>1 理由は書いてあった？`]]};
EDT['招待状'].presets={'招待状':[
  ['ゲーム運営から（スマホ）',{アプリ:'エテルナ・クロニクル',通知:'特別招待のお知らせ',題:'招待状',問い:'この世界へ、参加しますか？',args:['スマホ']},`親愛なる冒険者さま
あなたは、選ばれました。
本物の世界へ、ご招待いたします。`],
  ['魔法学園から（パソコン）',{アプリ:'王立アルカナ学園',通知:'入学許可のお知らせ',題:'入学許可証',問い:'入学を受諾しますか？',args:['パソコン']},`あなたの魔力が観測されました。
本学への入学を許可します。
迎えの扉は、今夜零時に開きます。`]]};
EDT['ボード'].presets={'ボード':[
  ['殺人事件（コルク）',{種類:'コルク',線:'1-3,3-5,2-5',丸:'5',寄る:'5'},`写真：現場前の通り｜street
新聞：港南区のマンションで女性死亡
人物：佐伯　光｜3
付箋：22:41？
写真：ナンバー｜plate
写真：防犯カメラ CAM1｜cam1
メモ：雨は降っていない`],
  ['失踪事件（ホワイト）',{種類:'ホワイト',線:'1-2,2-3',丸:'3'},`人物：行方不明の店主｜16
写真：パン屋の前｜street
メモ：最後の目撃 22:10
付箋：車？`],
  ['証拠の机',{種類:'机'},`写真：現場の廊下｜door
新聞：資産家、自宅で死亡
付箋：合鍵？
写真：指輪｜ring`]]};
EDT['PC'].presets={'パソコン':[
  ['日記',{題:'diary.txt',見た目:'白'},`10月30日
今日は、駅前のパン屋が閉店すると知った。
明日、最後に買いに行こう。`],
  ['勝手に打たれる（ホラー）',{題:'memo.txt'},`おはよう
よく　ねむれた？
おもいだして
おもいだして`],
  ['ハッキング',{題:'terminal',速さ:'速い'},`> connect 192.168.0.13
> access granted
> download case_0412.zip
> 100%`]]};
EDT['検索'].presets={'検索':[
  ['閉店のうわさ（打ち直し）',{語:'駅前　パン屋　閉店　理由⌫⌫⌫⌫⌫店主',候補:'駅前　カフェ／駅前　パン屋／駅前　パン屋　メロンパン／駅前　パン屋　閉店／駅前　パン屋　閉店　いつ／駅前　パン屋　閉店　理由／駅前　パン屋　店主／！駅前　パン屋　店主　行方不明',化ける:'2'},`駅前ベーカリー、来月末で閉店へ｜地元で40年愛されたパン屋が、来月末で閉店することがわかった。｜https://local-news.example.jp
店主の行方について｜関係者によると、店主は先月から連絡がとれていないという。｜https://example.jp/news`],
  ['自分の名前',{語:'湊　配信　廃病院',候補:'湊　読み方／湊　配信／湊　配信　その後／湊　配信　廃病院／！湊　配信　廃病院　死亡',化ける:'1',速さ:'遅い'},`【閲覧注意】廃病院配信者の最後の配信｜一年前の配信が、今も続いているという噂。｜https://occult.example.jp`]]};

/* 文章としてコピー（掲示板・トーク・コメント欄） */
EDT['掲示板'].plain=(o,f)=>`${f?`【${o.a.板||'掲示板'}】\n`:''}${o.a.題||''}\n\n${o.rows.map((r,i)=>`${i+1}：${r[0]||'名無しさん'}${r[1]?' ID:'+r[1]:''}\n${r[2]?'>>'+r[2]+' ':''}${r[3]}`).join('\n\n')}`;
EDT['トーク'].plain=(o,f)=>`${f?`――― ${o.a.相手||'トーク'} ―――\n`:''}${o.rows.map(r=>r[0]==='日付'?`― ${r[1]} ―`:`${r[0]==='自分'?'自分':(o.a.相手||'相手')}：${r[1].replace(/^\{スタンプ[:：]\d+\}$/,'（スタンプ）').replace(/^\{画像[:：].+\}$/,'（画像）').replace(/^\{不在着信\}$/,'（不在着信）')}${r[2]?'　'+r[2]:''}${r[3]?'　'+r[3]:''}`).join('\n')}`;
EDT['チャット欄'].plain=(o,f)=>{const a=o.a,form=a.形||'配信';
  const head=form==='星座'?`╔══════════════════════════╗\n       ✦ STAR STREAM ✦\n          ● LIVE\n╚══════════════════════════╝`:form==='アイドル'?`╔════════════════════════════╗\n         ♡ IDOL LIVE ♡\n             🔴 LIVE\n╚════════════════════════════╝\n\n🎤 ${a.配信者||'HANEUL'}  ✓\n👁 同時視聴者数：${a.視聴||''}\n💗 ハート：${a.ハート||''}`:`🔴 LIVE｜${a.題||'ライブ配信'}\n👁 同時視聴者数：${a.視聴||''}`;
  const body=o.rows.map(r=>{const [k,n,t,am]=r;if(k==='システム')return`［${t}］`;if(k==='スパチャ')return`\n💰 スーパーチャット ¥${am}\n${n}：${t}\n`;if(k==='コイン')return`［${n}が${am}コインを後援しました！］`;
    return form==='星座'?`【${n}】：${t}`:k==='本人'?`\n【🎤 ${n}】\n${t}\n`:`${n}：${t}`}).join('\n');
  return(f?head+'\n\n':'')+body+(f&&form==='星座'?`\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n👁 視聴中：${a.視聴||''}`:'')};
/* ===== ホムマ（マスター）サイト =====
   1行＝「種類：値｜値…」。トップ／更新／写真／動画／お知らせ／予定／応援／紹介 */
BLOCKS.add('ホムマ');
const HSCOL={'ネイビー':['#0f1724','#1b2738','#e8eef7','#9fb7d9'],'黒':['#0b0b0d','#18181c','#f1f1f1','#c9c9d1'],'白':['#f6f7f9','#ffffff','#1d2330','#6b86b3'],'ブルー':['#dfe9f6','#f4f8fd','#1c2b44','#4f7fc2'],'ワイン':['#1d0f14','#2b1820','#f5e9ee','#d79ab0']};
const hsParse=L=>{const o={top:null,up:[],ph:[],vd:[],nt:[],sc:[],sp:[],ab:[]};
  L.forEach(l=>{const i=l.indexOf('：');if(i<0)return;const k=l.slice(0,i).trim(),v=l.slice(i+1).split('｜').map(x=>x.trim());
    if(k==='トップ')o.top=v;else if(k==='更新')o.up.push(v);else if(k==='写真')o.ph.push(v);else if(k==='動画')o.vd.push(v);else if(k==='お知らせ')o.nt.push(v);else if(k==='予定')o.sc.push(v);else if(k==='応援')o.sp.push(v);else if(k==='紹介')o.ab.push(v.join('｜'))});return o};
const hsImg=n=>n?`style="background-image:url(a/${esc(n)}.jpg)"`:'';
BR['ホムマ']=(a,L)=>{const d=hsParse(L),c=HSCOL[a.色]||HSCOL['ネイビー'],nm=a.名||'MOONLIGHT',who=a.推し||'DOHYUN',t=d.top||['','','','hm1'];
  const ph0=d.ph[0]?d.ph[0][3].split(/[,、]/)[0]:t[3];
  const tabs=[['home','HOME'],['photo','PHOTO'],['video','VIDEO'],['notice','NOTICE'],['schedule','SCHEDULE'],['support','SUPPORT'],['about','ABOUT']];
  const ph=(n,cls='')=>n?`<i class="hsi ${cls}" ${hsImg(n)}></i>`:`<i class="hsi none ${cls}"><span>${esc(nm)}</span></i>`;
  const home=`<button type="button" class="hsmain" data-g="0" data-p="0">${ph(t[3])}<span class="hscr">PHOTO BY ${esc(nm)}</span></button>
    <div class="hscap"><div><span class="hsnew">NEW UPDATE</span><time>${esc(t[0])}</time></div><h4>${esc(who)}・${esc(t[1])}</h4><p>${esc(t[2])}</p><div class="hsby"><span>PHOTO BY ${esc(nm)}</span><button type="button" class="hslike">♡ LIKE <b>${esc(a.いいね||'2,814')}</b></button></div></div>
    <h5>LATEST UPDATES</h5><div class="hsul">${d.up.map((u,i)=>`<button type="button" class="hsrow" data-go="${/VIDEO/i.test(u[1])?'video':/NOTICE|SUPPORT|EVENT|INFO/i.test(u[1])?'notice':'photo'}"><span>${esc(u[0])}</span><em>[${esc(u[1])}]</em><b>${esc(u[2]||'')}</b>${i<2?'<i class="n">N</i>':''}<s>›</s></button>`).join('')}</div>`;
  const yrs={};d.ph.forEach((p,g)=>{const y=(p[0]||'').slice(0,4)||'—';(yrs[y]=yrs[y]||[]).push([p,g])});
  const photo=`<h5>PHOTO ARCHIVE</h5>${Object.entries(yrs).map(([y,ps])=>`<div class="hsyr">${esc(y)}</div><div class="hsgal">${ps.map(([p,g],k)=>`<button type="button" class="hsth" data-g="${g}" data-p="0">${ph(p[3].split(/[,、]/)[0])}${k===0&&g===0?'<i class="n">NEW</i>':''}<span><time>${esc(p[0])}</time><b>${esc(p[1])}</b><small>${esc(p[2]||'')} PHOTOS</small></span></button>`).join('')}</div>`).join('')}`;
  const video=`<h5>VIDEO</h5><div class="hsvl">${d.vd.map(v=>`<button type="button" class="hsvd">${ph(v[2],'wide')}<i class="pl">▶</i><span><time>${esc(v[0])}</time><b>${esc(v[1])}</b>${v[3]?`<small>${esc(v[3])}</small>`:''}</span></button>`).join('')}</div>`;
  const notice=`<h5>NOTICE</h5><div class="hsnl">${d.nt.map(n=>`<div class="hsnt"><button type="button"><em>[${esc(n[0])}]</em>${esc(n[1])}<s>＋</s></button><div class="hsnb">${(n[2]||'').split('／').map(x=>`<p>${esc(x)}</p>`).join('')}</div></div>`).join('')}</div>`;
  const mo={};d.sc.forEach(s=>{const m=+(s[0]||'').split('.')[0]||0;(mo[m]=mo[m]||[]).push(s)});
  const MN=['','JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const schedule=`<h5>SCHEDULE</h5>${Object.entries(mo).map(([m,ss])=>`<div class="hsyr">${MN[m]||''} ${esc(a.年||'2026')}</div><div class="hssc">${ss.map(s=>`<div><time>${esc(s[0])}</time><b>${esc(s[1])}</b>${s[2]?`<small>${esc(s[2])}</small>`:''}</div>`).join('')}</div>`).join('')}`;
  const support=`<h5>${esc(a.企画||'BIRTHDAY SUPPORT')}</h5><p class="hsbd">HAPPY ${esc(who)} DAY</p><div class="hssp">${d.sp.map((s,i)=>`<div>${s[2]?`<button type="button" class="hsspi" data-z="${esc(s[2])}" ${hsImg(s[2])}></button>`:''}<em>PROJECT ${String(i+1).padStart(2,'0')}</em><b>${esc(s[0])}</b>${s[1]?`<small>${esc(s[1])}</small>`:''}</div>`).join('')}</div>`;
  const about=`<h5>ABOUT</h5><dl class="hsab"><dt>SITE NAME</dt><dd>${esc(nm)}</dd><dt>FOR</dt><dd>${esc(who)}</dd><dt>SINCE</dt><dd>${esc(a.開設||'2024')}</dd><dt>MASTER</dt><dd>${esc(a.マスター||nm)}</dd></dl><div class="hsmsg"><em>MESSAGE</em>${d.ab.map(x=>`<p>${esc(x)}</p>`).join('')}</div><p class="hsrule">※ 写真の無断転載・再加工・商用利用はご遠慮ください。<br>Do not edit or redistribute.</p>`;
  const P={home,photo,video,notice,schedule,support,about};
  return`<div class="blk hs" data-fx="ホムマ" data-a="${encA(a)}" style="--b0:${c[0]};--b1:${c[1]};--fg:${c[2]};--ac:${c[3]}"><div class="hshd"><b>${esc(nm)} <i>✦</i></b><small>Only for ${esc(who)} · Since ${esc(a.開設||'2024')}</small><span class="hsmo">☾</span></div>
    <nav class="hsnav">${tabs.map(([k,l],i)=>`<button type="button" data-t="${k}"${i?'':' class="on"'}>${l}</button>`).join('')}</nav>
    ${tabs.map(([k],i)=>`<section class="hspg${i?'':' on'}" data-t="${k}">${P[k]}</section>`).join('')}
    ${a.カウンター&&a.カウンター!=='なし'?`<div class="hscnt">TODAY <b>${esc(a.今日||'128')}</b> / TOTAL <b>${esc(a.カウンター)}</b></div>`:''}
    <footer>© ${esc(nm)} FANBASE · Fictional concept</footer></div>`.replace('class="blk hs"',`class="blk hs" data-gal="${esc(JSON.stringify(d.ph.map(p=>[p[0],p[1],+(p[2]||0),(p[3]||'').split(/[,、]/).map(x=>x.trim()).filter(Boolean)])))}"`)};
function hsLight(el,gal,g,p,nm,who){
  document.querySelector('.hslb')?.remove();const lb=document.createElement('div');lb.className='hslb';el.appendChild(lb);
  const draw=dir=>{const G=gal[g],imgs=G[3],n=Math.max(G[2]||0,imgs.length),cur=imgs[p%imgs.length];
    lb.innerHTML=`<div class="hslt"><b>${esc(nm)} PHOTO</b><button type="button" class="x" aria-label="閉じる">✕</button></div><div class="hslm"><small>${esc(who)}</small><time>${esc(G[0])}</time><b>${esc(G[1])}</b></div><div class="hslp"><i style="background-image:url(a/${esc(cur)}.jpg)"></i><span>PHOTO BY ${esc(nm)}</span></div><div class="hsln">${String(p+1).padStart(2,'0')} / ${String(n).padStart(2,'0')}</div><div class="hslc"><button type="button" class="pv">‹ PREV</button><button type="button" class="nx">NEXT ›</button></div><p>※ 無断転載・再加工禁止</p>`;
    const im=lb.querySelector('.hslp i');if(dir)im.animate([{opacity:0,transform:`translateX(${dir*30}px)`},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'})};
  const n=()=>Math.max(gal[g][2]||0,gal[g][3].length),go=d=>{p=(p+d+n())%n();draw(d);SFX.shutter&&SFX.shutter()};
  lb.onclick=e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();if(b.classList.contains('x')){lb.animate([{opacity:1},{opacity:0}],{duration:180}).finished.then(()=>lb.remove())}else if(b.classList.contains('pv'))go(-1);else if(b.classList.contains('nx'))go(1)};
  lb.addEventListener('pointerup',e=>e.stopPropagation());let sx=null;lb.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;e.stopPropagation()},{passive:true});
  lb.addEventListener('touchend',e=>{e.stopPropagation();if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>40)go(dx<0?1:-1)});
  draw(0);lb.animate([{opacity:0},{opacity:1}],{duration:220})}
function hsBind(el,a){if(el._hsb)return;el._hsb=1;
    let gal=[];try{gal=JSON.parse(el.dataset.gal||'[]')}catch(e){}
    const show=t=>{el.querySelectorAll('.hsnav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));el.querySelectorAll('.hspg').forEach(s=>{const on=s.dataset.t===t;s.classList.toggle('on',on);if(on)s.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:320,easing:'ease-out'})})};
    el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!el.contains(b)||b.closest('.hslb'))return;
      if(b.dataset.z){mdZoom(el,b.dataset.z);return}
      if(b.dataset.t){show(b.dataset.t);SFX.pop2&&SFX.pop2()}
      else if(b.dataset.go)show(b.dataset.go);
      else if(b.dataset.g!=null&&gal.length)hsLight(el,gal,+b.dataset.g,+b.dataset.p,a.名||'MOONLIGHT',a.推し||'DOHYUN');
      else if(b.classList.contains('hslike')){b.classList.toggle('on');const k=b.querySelector('b');const v=+k.textContent.replace(/,/g,'')||0;k.textContent=(v+(b.classList.contains('on')?1:-1)).toLocaleString();vib(10)}
      else if(b.parentElement.classList.contains('hsnt'))b.parentElement.classList.toggle('open')});
}
D['ホムマ']={still:hsBind,
  async run(el,a,c){hsBind(el,a);
    const m=el.querySelector('.hsmain .hsi');if(m)m.animate([{opacity:0,transform:'scale(1.04)'},{opacity:1,transform:'none'}],{duration:900,easing:'ease-out'});
  }};
TPL['ホムマ']={block:1,attrs:[['名'],['推し'],['開設'],['色'],['カウンター'],['いいね'],['年'],['企画']],parse:l=>[l],fmt:r=>r[0]};
TPNAME['ホムマ']='ホムマサイト';
const HSP={'ホムマサイト':[
['MOONLIGHT（空港・冬）',{名:'MOONLIGHT',推し:'DOHYUN',開設:'2024',色:'ネイビー'},`トップ：2026.10.28｜INCHEON AIRPORT｜仁川国際空港 出国フォトプレビュー｜hs_airport
更新：10.28｜PHOTO｜AIRPORT・INCHEON
更新：10.25｜PHOTO｜MUSIC SHOW・M COUNTDOWN
更新：10.20｜PHOTO｜FANSIGN・SEOUL
更新：10.12｜VIDEO｜CONCERT FANCAM
更新：10.05｜NOTICE｜BIRTHDAY SUPPORT
写真：2026.10.28｜INCHEON AIRPORT｜12｜hs_airport
写真：2026.10.25｜M COUNTDOWN｜24｜hs_stage,hs_arrival
写真：2026.10.20｜FANSIGN EVENT｜18｜hs_fansign
写真：2026.10.12｜CONCERT・SEOUL｜32｜hs_concert,hs_stage
写真：2026.09.14｜FANMEETING｜16｜hs_fanmeet
動画：10.12｜CONCERT FANCAM｜hs_fancam1｜4K · 03:42
動画：09.30｜STAGE MIX｜hs_fancam2｜1080p · 05:10
動画：09.21｜LIVE ARCHIVE｜hs_live16｜雑談ライブ · 1:23:45
お知らせ：NOTICE｜サイト更新のお知らせ｜10/28 空港の写真を12枚追加しました。／高画質版は順次アップします。
お知らせ：SUPPORT｜誕生日応援企画のお知らせ｜今年もセンイル企画を行います。／詳細はSUPPORTページをご覧ください。
お知らせ：EVENT｜スローガン配布のご案内｜11.01 コンサート会場前で配布します（先着200名）。
お知らせ：INFO｜写真のご利用について｜個人のSNSアイコン・壁紙はOKです。／再加工・転載・商用利用はご遠慮ください。
予定：10.12｜CONCERT｜SEOUL
予定：10.20｜FANSIGN｜SEOUL
予定：10.25｜MUSIC SHOW｜M COUNTDOWN
予定：10.28｜AIRPORT｜INCHEON → TOKYO
予定：11.01｜CONCERT｜TOKYO
応援：BIRTHDAY CAFE｜11.10〜11.12　聖水洞のカフェ｜hs_cafe
応援：SUBWAY ADVERTISEMENT｜三成駅 デジタル広告　11.01〜11.30｜hs_subway
応援：SLOGAN EVENT｜コンサート会場前で配布｜hs_slogan
応援：PHOTO EXHIBITION｜1年分の写真展示｜hs_exhibit
紹介：For every shining moment.
紹介：いつも輝くあなたの瞬間を。`],
['FIRST SNOW（ステージ）',{名:'FIRST SNOW',推し:'MINJUN',開設:'2023',色:'黒',カウンター:'0284113'},`トップ：2026.10.25｜M COUNTDOWN｜音楽番組 出勤〜ステージ プレビュー｜hs_arrival
更新：10.25｜PHOTO｜M COUNTDOWN
更新：10.18｜PHOTO｜BACKSTAGE
写真：2026.10.25｜M COUNTDOWN｜30｜hs_arrival,hs_stage
写真：2026.10.18｜FANMEETING｜9｜hs_fanmeet
動画：10.25｜ENCORE FANCAM｜hs_fancam2｜4K · 02:58
お知らせ：NOTICE｜しばらく更新をお休みします｜次の更新は年末の予定です。
予定：10.25｜MUSIC SHOW｜M COUNTDOWN
応援：CUP SLEEVE EVENT｜12.03　弘大のカフェ
紹介：You are my first snow.`],
['BLUE HOUR（白・シンプル）',{名:'BLUE HOUR',推し:'HARU',開設:'2025',色:'白'},`トップ：2026.10.20｜FANSIGN｜サイン会 プレビュー｜hm2
更新：10.20｜PHOTO｜FANSIGN
写真：2026.10.20｜FANSIGN｜15｜hm2,hm1
お知らせ：NOTICE｜サイト開設のお知らせ｜はじめまして。少しずつ写真をアップします。
予定：10.20｜FANSIGN｜SEOUL
紹介：Stay in the blue hour with you.`]]};
EDT['ホムマ']={text:1,presets:HSP,
  sets:[['名','サイト名'],['推し','アイドルの名前'],['開設','開設した年'],['色','サイトの色',[['ネイビー','ネイビー'],['黒','ブラック'],['白','ホワイト'],['ブルー','淡いブルー'],['ワイン','ワイン']]],['カウンター','訪問者カウンター（数字／空でなし）'],['いいね','LIKEの数'],['企画','応援ページの見出し']],
  hint:'1行に1つ。「トップ：日付｜イベント｜説明｜写真」「更新：10.28｜PHOTO｜AIRPORT」「写真：2026.10.28｜INCHEON AIRPORT｜12｜hm1,hm2」「動画：10.12｜題｜写真｜説明」「お知らせ：NOTICE｜題｜本文（／で改行）」「予定：10.12｜CONCERT｜場所」「応援：BIRTHDAY CAFE｜説明」「紹介：メッセージ」。写真は hs_airport・hs_arrival・hs_stage・hs_fansign・hs_fanmeet・hs_concert・hs_fancam1・hs_fancam2・hs_cafe・hs_subway。どれもシルエットです。「応援：」の3つ目に写真も置けます。'};
/* ===== アイドルSNS（X風・Instagram風／本人・グループ公式）=====
   アカウント：X本人｜名前=…｜ID=…   投稿：X本人：本文｜時間=2時間｜写真=sn_x1,sn_x2｜いいね=8421
   返信：名前@id｜本文｜時間=…   コメント：名前｜本文   ストーリー：IG本人｜写真=…｜文字=…   ハイライト：IG本人｜DAILY=sn_t1｜… */
BLOCKS.add('アイドルSNS');
const SNSLOT={'X本人':'xme','X公式':'xof','IG本人':'ime','IG公式':'iof'},SNLAB=[['xme','X風・本人'],['xof','X風・公式'],['ime','IG風・本人'],['iof','IG風・公式']];
const snKV=ps=>{const o={};ps.forEach(p=>{const i=p.indexOf('=');if(i>0)o[p.slice(0,i).trim()]=p.slice(i+1).trim()});return o};
const snN=s=>{s=String(s||'0').replace(/,/g,'');const m=s.match(/([\d.]+)\s*万/);return m?Math.round(parseFloat(m[1])*10000):parseInt(s)||0};
const snF=n=>n>=10000?(n/10000).toFixed(n>=1e6?0:1).replace(/\.0$/,'')+'万':n.toLocaleString();
function snParse(L){const d={acc:{},posts:{xme:[],xof:[],ime:[],iof:[]},st:{},hl:{}};let last=null;
  L.forEach(l=>{const i=l.indexOf('：');if(i<0)return;const k=l.slice(0,i).trim(),ps=l.slice(i+1).split('｜').map(x=>x.trim());
    if(k==='アカウント'){const s=SNSLOT[ps[0]];if(s)d.acc[s]=snKV(ps.slice(1))}
    else if(SNSLOT[k]){last={text:ps[0]||'',...snKV(ps.slice(1)),re:[]};d.posts[SNSLOT[k]].push(last)}
    else if(k==='返信'||k==='コメント'){if(last){const [nm,id]=(ps[0]||'').split('@');last.re.push({nm:nm.trim(),id:(id||'').trim(),text:ps[1]||'',...snKV(ps.slice(2))})}}
    else if(k==='ストーリー'){const s=SNSLOT[ps[0]];if(s)(d.st[s]=d.st[s]||[]).push(snKV(ps.slice(1)))}
    else if(k==='ハイライト'){const s=SNSLOT[ps[0]];if(s)d.hl[s]=ps.slice(1).map(x=>x.split('=').map(y=>y.trim()))}});
  return d}
const snTx=s=>esc(s).replace(/／/g,'<br>').replace(/([#＃][^\s#＃<、。！？]+|@[A-Za-z0-9_.]+)/g,'<span class="tg">$1</span>');
const snPh=(n,cls='')=>n?`<i class="sph ${cls}" style="background-image:url(a/${esc(n)}.jpg)"></i>`:`<i class="sph none ${cls}"></i>`;
const snFindAcc=(d,nm,id)=>Object.entries(d.acc).find(([s,a])=>(id&&(a.ID===id))||(nm&&(a.名前===nm||a.ID===nm)));
const snAv=(d,r)=>{const f=snFindAcc(d,r.nm,r.id);if(f&&f[1].アイコン)return`<i class="sav" style="background-image:url(a/${esc(f[1].アイコン)}.jpg)"></i>`;
  if(r.アイコン)return`<i class="sav" style="background-image:url(a/${esc(r.アイコン)}.jpg)"></i>`;return`<i class="sav ini" style="--h:${chHue(r.nm)}">${esc([...r.nm][0]||'?')}</i>`};
const snPhotos=p=>(p.写真||'').split(/[,、]/).map(x=>x.trim()).filter(Boolean);
/* --- X風 --- */
function snXPost(d,s,i,p,big){const A=d.acc[s]||{},k=`${s}:${i}`,ph=snPhotos(p);
  if(p.削除&&p._gone)return`<div class="xp del" data-k="${k}">このポストは削除されました。</div>`;
  let q='';if(p.引用){const [qs,qn]=p.引用.split(/[:：]/),qslot=SNSLOT[qs]||qs,qp=(d.posts[qslot]||[])[(+qn||1)-1],QA=d.acc[qslot]||{};
    if(qp)q=`<div class="xq"><div class="xh"><i class="sav sm" style="background-image:url(a/${esc(QA.アイコン||'')}.jpg)"></i><b>${esc(QA.名前||'')}</b><em>✓</em><small>@${esc(QA.ID||'')}</small></div><div class="xt">${snTx(qp.text)}</div>${snPhotos(qp)[0]?snPh(snPhotos(qp)[0],'wide'):''}</div>`}
  const g=ph.length?`<div class="xg n${Math.min(ph.length,4)}">${ph.slice(0,4).map(n=>snPh(n)).join('')}</div>`:'';
  return`<div class="xp${big?' big':''}${p.削除?' willdel':''}" data-k="${k}">${p.固定&&!big?'<div class="xpin">📌 固定されたポスト</div>':''}<div class="xrow"><i class="sav" style="background-image:url(a/${esc(A.アイコン||'')}.jpg)"></i><div class="xbody">
    <div class="xh"><b>${esc(A.名前||'')}</b><em>✓</em><small>@${esc(A.ID||'')}${big?'':' · '+esc(p.時間||'')}</small></div>
    ${big?'':`<button type="button" class="xopen" data-open="${k}">`}<div class="xt">${snTx(p.text)}</div>${big?'':'</button>'}${g}${q}
    ${big?`<div class="xtime">${esc(p.日時||p.時間||'')}</div>`:''}
    <div class="xa"><button type="button" data-open="${k}">💬 <span>${esc(p.返信数||String(p.re.length))}</span></button><button type="button" data-act="rp" data-k="${k}">🔁 <span>${esc(p.RP||'0')}</span></button><button type="button" data-act="like" data-k="${k}" class="${p._lk?'on':''}">${p._lk?'♥':'♡'} <span>${esc(p.いいね||'0')}</span></button><button type="button" data-act="bm" data-k="${k}" class="${p._bm?'on':''}">🔖</button><button type="button" data-act="copy" data-k="${k}">⤴</button></div>
  </div></div></div>`}
function snXReply(d,r,j,hid){return`<div class="xp rp${hid?' hid':''}" data-j="${j}"><div class="xrow">${snAv(d,r)}<div class="xbody"><div class="xh"><b>${esc(r.nm)}</b>${snFindAcc(d,r.nm,r.id)?'<em>✓</em>':''}<small>@${esc(r.id||r.nm)} · ${esc(r.時間||'')}</small></div><div class="xt">${snTx(r.text)}</div><div class="xa"><button type="button">💬</button><button type="button" data-act="rlike" class="${r._lk?'on':''}">${r._lk?'♥':'♡'} <span>${esc(r.いいね||String(Math.floor(rnd(1,99))))}</span></button></div></div></div></div>`}
function snX(d,s,st){const A=d.acc[s]||{},P=d.posts[s];
  const top=`<div class="xtop"><button type="button" data-nav="back" aria-label="戻る">←</button><div><b>${st.view==='post'?'ポスト':esc(A.名前||'')}</b>${st.view==='post'?'':`<small>${P.length} 件のポスト</small>`}</div><button type="button" data-act="theme" aria-label="色">${st.dark?'☀':'☾'}</button></div>`;
  if(st.view==='post'){const [ps,pi]=st.post.split(':'),p=d.posts[ps][+pi];
    return top+snXPost(d,ps,+pi,p,1)+`<div class="xrl">${p.re.map((r,j)=>snXReply(d,r,j,st.live&&j>=2&&!p._shown)).join('')}</div><div class="xin"><input type="text" placeholder="返信をポスト" maxlength="80"><button type="button" data-act="reply">返信</button></div>`}
  const tabs=['ポスト','返信','メディア','いいね'];let list='';
  if(st.tab===0){const ord=P.map((p,i)=>[p,i]).sort((a,b)=>(b[0].固定?1:0)-(a[0].固定?1:0));list=ord.map(([p,i])=>snXPost(d,s,i,p)).join('')}
  else if(st.tab===1){const mine=[];Object.entries(d.posts).forEach(([ss,pp])=>{if(!ss.startsWith('x'))return;pp.forEach(p=>p.re.forEach((r,j)=>{if(r.id===A.ID||r.nm===A.名前)mine.push(snXReply(d,r,j))}))});list=mine.join('')||'<p class="snone">まだ返信はありません</p>'}
  else if(st.tab===2){const ims=[];P.forEach((p,i)=>snPhotos(p).forEach(n=>ims.push(`<button type="button" data-open="${s}:${i}">${snPh(n)}</button>`)));list=`<div class="xmd">${ims.join('')}</div>`}
  else{const o=[];Object.entries(d.posts).forEach(([ss,pp])=>{if(ss.startsWith('x')&&ss!==s)pp.forEach((p,i)=>o.push(snXPost(d,ss,i,p)))});list=o.join('')||'<p class="snone">まだいいねはありません</p>'}
  return top+`<div class="xcv" style="background-image:url(a/${esc(A.カバー||'')}.jpg)"></div><div class="xpr"><div class="xprt"><i class="sav xl" style="background-image:url(a/${esc(A.アイコン||'')}.jpg)"></i><button type="button" class="xfol${st.unf?' off':''}" data-act="follow">${st.unf?'フォローする':'フォロー中'}</button></div>
    <b class="xnm">${esc(A.名前||'')} <em>✓</em></b><small>@${esc(A.ID||'')}</small><p>${snTx(A.紹介||'')}</p><div class="xmeta">${A.リンク?`<span>🔗 <span class="tg">${esc(A.リンク)}</span></span>`:''}${A.開始?`<span>📅 ${esc(A.開始)}から利用中</span>`:''}</div><div class="xff"><span><b>${esc(A.フォロー||'0')}</b> フォロー</span><span><b class="fw">${esc(A.フォロワー||'0')}</b> フォロワー</span></div></div>
    <div class="xtabs">${tabs.map((t,i)=>`<button type="button" data-tab="${i}" class="${st.tab===i?'on':''}">${t}</button>`).join('')}</div><div class="xl">${list}</div>`}
/* --- Instagram風 --- */
function snIG(d,s,st){const A=d.acc[s]||{},P=d.posts[s],id=esc(A.ID||A.名前||'');
  if(st.view==='post'){const [ps,pi]=st.post.split(':'),p=d.posts[ps][+pi],ph=snPhotos(p),n=st.ph||0;
    return`<div class="itop"><button type="button" data-nav="back" aria-label="戻る">‹</button><b>投稿</b><span></span></div><div class="iau"><i class="sav ring" style="background-image:url(a/${esc(A.アイコン||'')}.jpg)"></i><b>${id} <em>✓</em>${p.共同?` <small>＆ ${esc(p.共同)}</small>`:''}</b><span>···</span></div>
    <div class="icar">${ph.length?snPh(ph[n%ph.length],'sq'):snPh('','sq')}${ph.length>1?`<span class="icnt">${n%ph.length+1}/${ph.length}</span><button type="button" class="ipv" data-act="ph" data-d="-1" aria-label="前">‹</button><button type="button" class="inx" data-act="ph" data-d="1" aria-label="次">›</button>`:''}<i class="iheart">♥</i></div>
    ${ph.length>1?`<div class="idots">${ph.map((_,j)=>`<i class="${j===n%ph.length?'on':''}"></i>`).join('')}</div>`:''}
    <div class="iact"><button type="button" data-act="like" data-k="${ps}:${pi}" class="${p._lk?'on':''}">${p._lk?'♥':'♡'}</button><button type="button" data-act="focus">💬</button><button type="button" data-act="copy" data-k="${ps}:${pi}">➤</button><button type="button" data-act="bm" data-k="${ps}:${pi}" class="${p._bm?'on':''}">🔖</button></div>
    <div class="ilk"><b><span>${esc(p.いいね||'0')}</span>件のいいね</b></div><div class="icap"><b>${id}</b> ${snTx(p.text)}</div><small class="iall">コメント${esc(p.返信数||String(p.re.length))}件をすべて見る</small>
    <div class="icm">${p.re.map((r,j)=>`<div class="ic${st.live&&j>=2&&!p._shown?' hid':''}">${snAv(d,r)}<span><b>${esc(r.nm)}</b> ${snTx(r.text)}</span><button type="button" data-act="rlike" data-j="${j}" class="${r._lk?'on':''}">${r._lk?'♥':'♡'}</button></div>`).join('')}</div>
    <div class="iin"><input type="text" placeholder="コメントを追加…" maxlength="80"><button type="button" data-act="reply">投稿</button></div><time>${esc(p.日時||p.時間||'')}</time>`}
  const stOK=(d.st[s]||[]).length,hl=d.hl[s]||[];
  return`<div class="itop"><button type="button" data-nav="back" aria-label="戻る">‹</button><b>${id} <em>✓</em></b><span>···</span></div>
    <div class="ihd"><button type="button" class="iav${stOK?' ring':''}" data-act="story" aria-label="ストーリーズ"><i class="sav" style="background-image:url(a/${esc(A.アイコン||'')}.jpg)"></i></button><div class="icn"><span><b>${esc(A.投稿||String(P.length))}</b><small>投稿</small></span><span><b class="fw">${esc(A.フォロワー||'0')}</b><small>フォロワー</small></span><span><b>${esc(A.フォロー||'0')}</b><small>フォロー中</small></span></div></div>
    <div class="ibio"><b>${esc(A.名前||'')}</b><p>${snTx(A.紹介||'')}</p>${A.リンク?`<span class="tg">🔗 ${esc(A.リンク)}</span>`:''}</div>
    <div class="ibtn"><button type="button" class="${st.unf?'blue':''}" data-act="follow">${st.unf?'フォローする':'フォロー中'}</button><button type="button">メッセージ</button><button type="button" class="sm">⌄</button></div>
    ${hl.length?`<div class="ihl">${hl.map(([nm,ph],j)=>`<button type="button" data-act="hl" data-j="${j}">${snPh(ph,'hlc')}<small>${esc(nm)}</small></button>`).join('')}</div>`:''}
    <div class="itab"><span class="on">▦</span><span>▶</span><span>☺</span></div>
    <div class="igrid">${P.map((p,i)=>{const ph=snPhotos(p);return`<button type="button" data-open="${s}:${i}">${snPh(ph[0])}${ph.length>1?'<em>❐</em>':''}${p.共同?'<em class="co">👥</em>':''}</button>`}).join('')}</div>`}
function snStory(d,s,st){const S=st.hl!=null?[{写真:(d.hl[s]||[])[st.hl][1],文字:(d.hl[s]||[])[st.hl][0]}]:(d.st[s]||[]),A=d.acc[s]||{},k=Math.min(st.si||0,S.length-1),x=S[k]||{};
  return`<div class="isty"><div class="ibars">${S.map((_,j)=>`<i class="${j<k?'done':j===k?'cur':''}"><b></b></i>`).join('')}</div>
    <div class="isth"><i class="sav" style="background-image:url(a/${esc(A.アイコン||'')}.jpg)"></i><b>${esc(A.ID||'')}</b><small>${esc(x.時間||'')}</small><button type="button" data-nav="back" aria-label="閉じる">✕</button></div>
    ${snPh(x.写真,'stp')}${x.文字?`<div class="istx">${snTx(x.文字)}</div>`:''}<button type="button" class="isl" data-act="sprev" aria-label="前"></button><button type="button" class="isr" data-act="snext" aria-label="次"></button>
    <div class="isin"><input type="text" placeholder="メッセージを送信…" maxlength="60"><button type="button" data-act="slike">♡</button><button type="button" data-act="ssend">➤</button></div></div>`}
function snHTML(d,st){const s=st.acc;let body=st.view==='story'?snStory(d,s,st):s[0]==='x'?snX(d,s,st):snIG(d,s,st);
  return`<nav class="snav">${SNLAB.filter(([k])=>d.acc[k]).map(([k,l])=>`<button type="button" data-acc="${k}" class="${k===s?'on':''}">${l}</button>`).join('')}</nav><div class="sscr ${s[0]==='x'?'xv':'iv'}${st.dark&&s[0]==='x'?' dark':''}${st.view==='story'?' sty':''}">${body}</div>`}
const snSt=a=>({acc:SNSLOT[a.見る]||'xme',view:'prof',tab:0,dark:a.テーマ==='ダーク'});
BR['アイドルSNS']=(a,L)=>{const d=snParse(L),st=snSt(a);if(!d.acc[st.acc])st.acc=Object.keys(d.acc)[0]||'xme';
  return`<div class="blk isn" data-fx="アイドルSNS" data-a="${encA(a)}" data-d="${esc(JSON.stringify(d))}">${snHTML(d,st)}</div>`};
const SNFAN=['ㅠㅠㅠ 너무 잘생겼어','今日もありがとう…🥹','このビジュは反則','保存しました（何回目）','사랑해 💙','待ってたよ！！','供給ありがとうございます🙏','え、かっこよすぎる','이게 사람이야?','ずっと応援してる💙','顔がいい（語彙力）','심장 아파…'];
const SNFN=['moon_0712','luv_nova','bluelight','n7_haru','star_77','seo0o','yuna_','mii_n7'];
function snBind(el,a){if(el._snb)return;el._snb=1;
  let d;try{d=JSON.parse(el.dataset.d||'{}')}catch(e){return}
  const st=snSt(a);if(!d.acc[st.acc])st.acc=Object.keys(d.acc)[0]||'xme';st.live=!!el._live;el._st=st;
  const P=k=>{const [s,i]=k.split(':');return d.posts[s][+i]},stop=()=>{clearInterval(el._tm);clearTimeout(el._sto);el._tm=el._sto=null};
  const draw=()=>{const y=st.view==='prof'&&el._y!=null?el._y:0;el.innerHTML=snHTML(d,st);const sc=el.querySelector('.sscr');if(sc)sc.scrollTop=y;if(el._after)el._after()};el._draw=draw;
  const bump=(span,n)=>{if(!span)return;const v=snN(span.textContent)+n;span.textContent=snF(Math.max(0,v))};
  const liveStart=()=>{stop();if(!el._live||st.view!=='post')return;const p=P(st.post);let ticks=0;
    el._tm=setInterval(()=>{if(!document.contains(el)){stop();return}ticks++;
      const lk=el.querySelector(st.acc[0]==='x'?'.xp.big [data-act="like"] span':'.ilk span');bump(lk,Math.round(rnd(20,400)));p.いいね=lk?lk.textContent:p.いいね;
      const h=el.querySelector('.xrl .hid,.icm .hid');
      if(h){h.classList.remove('hid');h.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:260});SFX.pop2&&SFX.pop2()}
      else if(st.acc[0]==='i'&&ticks%2===0&&el.querySelectorAll('.icm .ic').length<14){const r={nm:pick(SNFN),text:pick(SNFAN)};p.re.push(r);const box=el.querySelector('.icm');box.insertAdjacentHTML('beforeend',`<div class="ic">${snAv(d,r)}<span><b>${esc(r.nm)}</b> ${snTx(r.text)}</span><button type="button" data-act="rlike" data-j="${p.re.length-1}">♡</button></div>`);box.lastChild.animate([{opacity:0},{opacity:1}],{duration:300})}
      if(ticks>40)stop()},1300)};
  const story=()=>{clearTimeout(el._sto);const n=st.hl!=null?1:(d.st[st.acc]||[]).length;el._sto=setTimeout(()=>{if(!document.contains(el))return;if((st.si||0)<n-1){st.si=(st.si||0)+1;draw();story()}else{st.view='prof';st.hl=null;draw()}},4600)};
  const open=k=>{el._y=el.querySelector('.sscr')?.scrollTop;st.view='post';st.post=k;st.ph=0;draw();el.querySelector('.sscr').scrollTop=0;liveStart()};
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!el.contains(b))return;const D=b.dataset;
    if(D.acc){stop();st.acc=D.acc;st.view='prof';st.tab=0;st.unf=false;el._y=0;draw();return}
    if(D.nav==='back'){stop();if(st.view==='prof')return;st.view='prof';st.hl=null;draw();return}
    if(D.open){open(D.open);return}
    if(D.tab!=null){st.tab=+D.tab;el._y=0;draw();return}
    const act=D.act;if(!act)return;
    if(act==='theme'){st.dark=!st.dark;el._y=el.querySelector('.sscr').scrollTop;draw()}
    else if(act==='follow'){st.unf=!st.unf;const fw=el.querySelector('.fw');b.textContent=st.unf?'フォローする':'フォロー中';b.classList.toggle('off',st.unf);b.classList.toggle('blue',st.unf);bump(fw,st.unf?-1:1);vib(10)}
    else if(act==='like'){const p=P(D.k);p._lk=!p._lk;const sp=b.querySelector('span')||el.querySelector('.ilk span');bump(sp,p._lk?1:-1);if(sp)p.いいね=sp.textContent;
      if(b.querySelector('span'))b.firstChild.textContent=p._lk?'♥ ':'♡ ';else b.textContent=p._lk?'♥':'♡';b.classList.toggle('on',p._lk);
      if(p._lk){b.animate([{transform:'scale(1)'},{transform:'scale(1.35)'},{transform:'scale(1)'}],{duration:300});const hh=el.querySelector('.iheart');if(hh)hh.animate([{opacity:0,transform:'scale(.4)'},{opacity:1,transform:'scale(1.1)',offset:.3},{opacity:0,transform:'scale(1)'}],{duration:800});vib(12)}}
    else if(act==='rp'){b.classList.toggle('on');bump(b.querySelector('span'),b.classList.contains('on')?1:-1)}
    else if(act==='bm'){const p=P(D.k);p._bm=!p._bm;b.classList.toggle('on',p._bm)}
    else if(act==='rlike'){b.classList.toggle('on');const on=b.classList.contains('on'),sp=b.querySelector('span');if(sp){b.firstChild.textContent=on?'♥ ':'♡ ';bump(sp,on?1:-1)}else b.textContent=on?'♥':'♡'}
    else if(act==='copy'){const p=P(D.k),A=d.acc[D.k.split(':')[0]]||{},t=`${A.名前||A.ID||''}${A.ID?' @'+A.ID:''}\n${p.text.replace(/／/g,'\n')}`;navigator.clipboard?.writeText(t).then(()=>{b.textContent='✓';setTimeout(()=>b.textContent=D.k.startsWith('x')?'⤴':'➤',1200)}).catch(()=>{})}
    else if(act==='ph'){const n=snPhotos(P(st.post)).length;st.ph=((st.ph||0)+ +D.d+n)%n;const y=el.querySelector('.sscr').scrollTop;draw();el.querySelector('.sscr').scrollTop=y;el.querySelector('.icar .sph').animate([{opacity:.3,transform:`translateX(${+D.d*24}px)`},{opacity:1,transform:'none'}],{duration:240})}
    else if(act==='reply'){const inp=b.previousElementSibling,v=inp.value.trim();if(!v)return;const p=P(st.post);const r={nm:'あなた',id:'you',text:v,時間:'今'};p.re.push(r);p._shown=1;
      if(st.acc[0]==='x'){el.querySelector('.xrl').insertAdjacentHTML('beforeend',snXReply(d,r,p.re.length-1))}else{el.querySelector('.icm').insertAdjacentHTML('beforeend',`<div class="ic">${snAv(d,r)}<span><b>あなた</b> ${snTx(v)}</span><button type="button" data-act="rlike">♡</button></div>`)}
      inp.value='';SFX.send&&SFX.send()}
    else if(act==='focus'){el.querySelector('.iin input')?.focus()}
    else if(act==='story'){if(!(d.st[st.acc]||[]).length)return;stop();st.view='story';st.si=0;st.hl=null;draw();story()}
    else if(act==='hl'){stop();st.view='story';st.si=0;st.hl=+D.j;draw();story()}
    else if(act==='snext'||act==='sprev'){const n=st.hl!=null?1:(d.st[st.acc]||[]).length;st.si=(st.si||0)+(act==='snext'?1:-1);if(st.si>=n||st.si<0){clearTimeout(el._sto);st.view='prof';st.hl=null;draw();return}draw();story()}
    else if(act==='slike'){b.textContent='♥';b.classList.add('on');b.animate([{transform:'scale(1)'},{transform:'scale(1.4)'},{transform:'scale(1)'}],{duration:300})}
    else if(act==='ssend'){const inp=el.querySelector('.isin input');if(inp.value.trim()){inp.value='';inp.placeholder='送信しました';SFX.send&&SFX.send()}}});
  el.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.xin input,.iin input,.isin input')){e.preventDefault();e.target.parentElement.querySelector('[data-act="reply"],[data-act="ssend"]')?.click()}});
  /* ページめくりと取り合わないように：タップ・写真のスワイプはここで止める */
  let t0=null;el.addEventListener('touchstart',e=>{const t=e.touches[0];t0={x:t.clientX,y:t.clientY}},{passive:true});
  el.addEventListener('touchend',e=>{if(!t0)return;const t=e.changedTouches[0],dx=t.clientX-t0.x,dy=t.clientY-t0.y;t0=null;
    const inCar=e.target.closest('.icar'),inSt=e.target.closest('.isty');
    if(inCar&&Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){e.stopPropagation();el.querySelector(dx<0?'.inx':'.ipv')?.click();return}
    if(inSt&&Math.abs(dx)>40){e.stopPropagation();el.querySelector(dx<0?'.isr':'.isl')?.click();return}
    if(Math.abs(dx)<10&&Math.abs(dy)<10)e.stopPropagation()});
  el.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')e.stopPropagation()});
  el.addEventListener('dblclick',e=>{const c=e.target.closest('.icar');if(c){const lb=el.querySelector('.iact [data-act="like"]');if(lb&&!lb.classList.contains('on'))lb.click()}});
  el._snDel=()=>{Object.values(d.posts).forEach(pp=>pp.forEach(p=>{if(p.削除&&!p._gone){const ms=(parseFloat(p.削除)||6)*1000;setTimeout(()=>{if(!document.contains(el))return;p._gone=1;
    el.querySelectorAll('.xp.willdel').forEach(x=>{x.animate([{opacity:1,filter:'none'},{opacity:.2,filter:'blur(2px)'}],{duration:500}).finished.then(()=>{if(st.view!=='post')draw()})})},ms)}}))};
}
D['アイドルSNS']={still:snBind,
  async run(el,a,c){el._live=1;snBind(el,a);el._snDel&&el._snDel()}};
TPL['アイドルSNS']={block:1,attrs:[['見る'],['テーマ']],parse:l=>[l],fmt:r=>r[0]};
TPNAME['アイドルSNS']='アイドルSNS';
const SNACC=`アカウント：X本人｜名前=DOHYUN｜ID=dohyun_official｜紹介=NOVA7 · DOHYUN／みんな、いつもありがとう💙｜リンク=linktr.ee/dohyun_official｜開始=2024年1月｜フォロー=7｜フォロワー=285.4万｜アイコン=sn_av｜カバー=sn_cover
アカウント：X公式｜名前=NOVA7 OFFICIAL｜ID=NOVA7_official｜紹介=NOVA7 OFFICIAL／7 MEMBERS / ONE UNIVERSE／#NOVA7 #AFTERGLOW｜リンク=nova7-official.com｜開始=2023年6月｜フォロー=7｜フォロワー=842.1万｜アイコン=sn_gav｜カバー=sn_g1
アカウント：IG本人｜名前=DOHYUN｜ID=dohyun.official｜紹介=NOVA7 💙／For every shining moment.｜リンク=linktr.ee/dohyun.official｜投稿=128｜フォロワー=285万｜フォロー=7｜アイコン=sn_av
アカウント：IG公式｜名前=NOVA7 OFFICIAL｜ID=nova7.official｜紹介=7 MEMBERS / ONE UNIVERSE／#NOVA7 #AFTERGLOW｜リンク=nova7-official.com｜投稿=586｜フォロワー=842万｜フォロー=7｜アイコン=sn_gav`;
const SNP={'アイドルSNS':[
['カムバックの流れ（4つとも）',{見る:'X本人'},`${SNACC}
X本人：NOVA7 2nd Mini Album／「AFTERGLOW」／2026.11.12 18:00 KST／ずっと待っててくれてありがとう。／もっと素敵な姿で会えるように。｜時間=5日｜固定=1｜引用=X公式:1｜いいね=18.3万｜RP=9.2万
返信：moon_0712｜待ってた！！！ㅠㅠ｜時間=5日｜いいね=2,134
返信：NOVA7 OFFICIAL@NOVA7_official｜#NOVA7 #AFTERGLOW 🌙｜時間=5日｜いいね=4.1万
X本人：오늘도 고마워요💙／みんな今日もありがとう！／ちゃんとご飯食べた？☆☆｜時間=2時間｜写真=sn_x1,sn_x2｜いいね=8,421｜RP=3.4万｜返信数=12.8万
返信：moon_0712｜ドヒョンもちゃんと食べて😭｜時間=2時間｜いいね=2,134
返信：DOHYUN@dohyun_official｜ㅋㅋㅋ 먹었어요!! 💙｜時間=2時間｜いいね=4,521
返信：luv_nova｜今日もかっこいいㅠㅠ／会いたい…💙｜時間=2時間｜いいね=1,203
返信：bluelight｜返信きた！！！！｜時間=1時間｜いいね=880
X本人：リハ終わり！／メンバーたちと夜ごはん🍚／明日も頑張ろう💪｜時間=1日｜写真=sn_food｜いいね=6,421｜RP=2.1万｜返信数=9.6万
返信：n7_haru｜何食べたの〜！？｜時間=1日｜いいね=301
X公式：[📷 CONCEPT PHOTO #01]／NOVA7 2nd Mini Album／「AFTERGLOW」／2026.11.12 18:00 KST／#NOVA7 #AFTERGLOW #COMEBACK｜時間=18分｜写真=sn_c1,sn_c2,sn_c3,sn_c4｜いいね=18.3万｜RP=9.2万｜返信数=24.6万
返信：star_77｜コンセプト最高すぎる😭｜時間=10分｜いいね=1.2万
返信：DOHYUN@dohyun_official｜기대해주세요 🌙｜時間=8分｜いいね=6.8万
X公式：[📅 SCHEDULE]／10.12 CONCERT - SEOUL／10.20 FANSIGN EVENT／10.25 MUSIC SHOW／10.28 AIRPORT／11.12 2nd MINI ALBUM｜時間=1日｜いいね=9.8万｜RP=3.3万
X公式：NOVA7 2nd Mini Album「AFTERGLOW」／2026.11.12 18:00 KST｜時間=3日｜固定=1｜写真=sn_g2｜いいね=24.6万｜RP=9.2万
IG本人：오늘 날씨 좋다 ☀️｜時間=2026年10月28日｜写真=sn_ig1,sn_t1,sn_t2｜いいね=845,210｜返信数=12,854
コメント：luv_nova｜今日も顔面国宝ㅠㅠ
コメント：bluelight｜好きすぎる…💙
コメント：NOVA7 OFFICIAL@nova7.official｜📸 by 매니저
コメント：moon_0712｜写真たくさんうれしい
コメント：star_77｜사랑해 💙
IG本人：練習室🎧｜写真=sn_t3｜いいね=620,114｜時間=2026年10月20日
コメント：mii_n7｜おつかれさま！
IG本人：｜写真=sn_t4,sn_t5｜いいね=702,880｜時間=2026年10月15日
IG本人：🌙｜写真=sn_t6｜いいね=533,012｜時間=2026年10月10日
IG本人：#AFTERGLOW｜写真=sn_x2｜共同=nova7.official｜いいね=1,021,334｜時間=2026年10月5日
IG本人：｜写真=sn_x1｜いいね=488,190｜時間=2026年9月30日
ストーリー：IG本人｜写真=sn_st｜文字=Good Night…🌙💙｜時間=2時間
ストーリー：IG本人｜写真=sn_food｜文字=ごはん🍚｜時間=5時間
ハイライト：IG本人｜DAILY=sn_t1｜WORK=sn_t3｜MUSIC=sn_t6｜TRAVEL=sn_t4｜NOVA7=sn_gt1
IG公式：NOVA7 2nd Mini Album／「AFTERGLOW」／COMING SOON ✦／#NOVA7 #AFTERGLOW #COMEBACK｜写真=sn_ig2,sn_gt1,sn_gt2｜いいね=1,245,800｜返信数=38,421｜時間=2026年10月28日
コメント：n7luv｜ついにきたあああ😭
コメント：stellar｜最高のコンセプトすぎる💙
IG公式：｜写真=sn_gt3｜いいね=802,113｜時間=2026年10月26日
IG公式：｜写真=sn_gt4,sn_gt5｜いいね=903,551｜時間=2026年10月24日
IG公式：｜写真=sn_gt6｜いいね=777,020｜時間=2026年10月22日
IG公式：｜写真=sn_c1,sn_c2｜いいね=1,104,220｜時間=2026年10月20日
IG公式：｜写真=sn_gt2｜いいね=650,331｜時間=2026年10月18日
ストーリー：IG公式｜写真=sn_g1｜文字=D-14｜時間=1時間
ハイライト：IG公式｜COMEBACK=sn_ig2｜MEMBERS=sn_gt3｜TOUR=sn_g2｜MEDIA=sn_c3｜BEHIND=sn_gt5`],
['日常・セルカ（IG本人から）',{見る:'IG本人'},`${SNACC}
IG本人：오늘 날씨 좋다 ☀️｜時間=2026年10月28日｜写真=sn_ig1,sn_t1,sn_t2｜いいね=845,210｜返信数=12,854
コメント：luv_nova｜今日も顔面国宝ㅠㅠ
コメント：bluelight｜好きすぎる…💙
コメント：moon_0712｜まって、心臓がもたない
コメント：star_77｜사랑해 💙
IG本人：🌙｜写真=sn_t6｜いいね=533,012｜時間=2026年10月10日
IG本人：練習室🎧｜写真=sn_t3｜いいね=620,114｜時間=2026年10月20日
ストーリー：IG本人｜写真=sn_st｜文字=Good Night…🌙💙｜時間=2時間
ハイライト：IG本人｜DAILY=sn_t1｜WORK=sn_t3｜MUSIC=sn_t6
X本人：インスタ更新しました📸｜時間=1時間｜いいね=9,102｜RP=1.1万
返信：luv_nova｜見てきた！！！｜時間=1時間｜いいね=210`],
['誤投稿（すぐ消える）',{見る:'X本人',テーマ:'ダーク'},`${SNACC}
X本人：あ｜時間=今｜削除=6｜いいね=3.2万｜RP=8,104｜返信数=1.1万
返信：moon_0712｜え？？？｜時間=今｜いいね=4,012
返信：luv_nova｜「あ」とは｜時間=今｜いいね=3,221
返信：bluelight｜スクショした｜時間=今｜いいね=2,001
X本人：さっきのはまちがいです😂／ねます！おやすみ🌙｜時間=今｜いいね=5.1万｜RP=1.2万
返信：star_77｜かわいすぎて無理｜時間=今｜いいね=980`]]};
EDT['アイドルSNS']={text:1,presets:SNP,
  sets:[['見る','最初に開くアカウント',[['X本人','X風・本人'],['X公式','X風・グループ公式'],['IG本人','Instagram風・本人'],['IG公式','Instagram風・グループ公式']]],['テーマ','X風の色',[['','ライト'],['ダーク','ダーク']]]],
  hint:'1行に1つ。「アカウント：X本人｜名前=…｜ID=…｜フォロワー=…｜アイコン=sn_av」。投稿は「X本人：本文｜時間=2時間｜写真=sn_x1,sn_x2｜いいね=8,421」（X公式・IG本人・IG公式も同じ）。すぐ下に「返信：名前@id｜本文｜時間=…」「コメント：名前｜本文」。ほかに 固定=1、引用=X公式:1、削除=6（6秒後に消える）、共同=nova7.official。「ストーリー：IG本人｜写真=…｜文字=…」「ハイライト：IG本人｜DAILY=sn_t1｜…」。本文の ／ は改行。'};
/* ===== 炎上・報道（8画面）=====
   ［報道 形=掲示板／暴露／炎上／ニュース／スクープ／資料／声明／反応 …］ 1行＝「種類：値｜値｜キー=値」 */
BLOCKS.add('報道');
const mdN=s=>{s=String(s||'0').replace(/,/g,'').trim();let m;if((m=s.match(/([\d.]+)\s*万/)))return Math.round(parseFloat(m[1])*1e4);if((m=s.match(/([\d.]+)\s*K/i)))return Math.round(parseFloat(m[1])*1e3);if((m=s.match(/([\d.]+)\s*M/i)))return Math.round(parseFloat(m[1])*1e6);return parseInt(s)||0};
const mdF=(n,k)=>k?(n>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,'')+'M':n>=1e4?(n/1e3).toFixed(1).replace(/\.0$/,'')+'K':n.toLocaleString()):n.toLocaleString();
const mdL=L=>L.filter(l=>l.trim()).map(l=>{let i=l.indexOf('：');if(i>8||l.slice(0,i).includes('｜'))i=-1;const ps=l.slice(i+1).split('｜').map(x=>x.trim()),o={},v=[];ps.forEach(p=>{const j=p.indexOf('=');if(j>0&&j<6)o[p.slice(0,j)]=p.slice(j+1);else v.push(p)});return{k:i<0?'':l.slice(0,i).trim(),v,o}});
const mdTx=s=>esc(s||'').replace(/／/g,'<br>').replace(/█+/g,m=>`<span class="rd">${m}</span>`).replace(/([#＃][^\s#＃<、。！？]+|@[A-Za-z0-9_.]+)/g,'<span class="tg">$1</span>');
const mdPh=(n,cap,cls='')=>`<button type="button" class="mph ${cls}" data-z="${esc(n||'')}">${n?`<i style="background-image:url(a/${esc(n)}.jpg)"></i>`:'<i class="none"></i>'}${cap?`<small>${esc(cap)}</small>`:''}</button>`;
const MDTRUE={'未確認':['#b58b00','UNVERIFIED'],'加工疑惑':['#d03c3c','EDITED?'],'検証済み':['#1f8a4c','VERIFIED'],'虚偽':['#7a7a7a','FALSE']};
const mdBadge=a=>a.真偽?`<span class="mdtr" style="--c:${MDTRUE[a.真偽]?.[0]||'#888'}">${esc(a.真偽)}</span>`:'';
const mdStage=a=>a.段階?`<div class="mdstg">${esc(a.段階)}</div>`:'';
const MDR={};
/* 1. 匿名掲示板 */
MDR['掲示板']=(a,R)=>{let n=0;return`${mdStage(a)}<div class="mdh"><b>${esc(a.板||'IDOL COMMUNITY')}</b><span class="hot">${a.人気?`HOT <em class="rk">${esc(a.人気)}</em>位`:'HOT'}</span><button type="button" data-act="dark" aria-label="色">☾</button></div>
  <div class="mdbt"><small>${esc(a.分類||'話題')}</small><h4>${mdTx(a.題||'')}</h4><div class="mdst"><span>閲覧 <b class="cnt" data-v="${mdN(a.閲覧)}">${esc(a.閲覧||'0')}</b></span><span>コメント <b class="cnt cm" data-v="${mdN(a.コメント)}">${esc(a.コメント||'0')}</b></span><span>おすすめ <b class="cnt rec" data-v="${mdN(a.おすすめ)}">${esc(a.おすすめ||'0')}</b></span></div></div>
  <div class="mdbl">${R.map(r=>{if(r.k==='削除')return`<div class="mdp del">${String(++n).padStart(3,'0')}. <i>管理者により削除されました${r.v[0]?`（${esc(r.v[0])}）`:''}</i></div>`;
    const [t,nm,tx]=r.v.length>=3?r.v:['',r.v[0],r.v[1]||''];return`<div class="mdp${r.o.消える?' gone':''}" data-gone="${esc(r.o.消える||'')}"><div class="mdph"><b>${String(++n).padStart(3,'0')}.</b> ${esc(nm||'匿名')}<time>${esc(t)}</time></div><p>${mdTx(tx)}</p><div class="mdpa"><button type="button" data-act="up">👍 <span>${esc(r.o.おすすめ||String(Math.floor(rnd(0,40))))}</span></button><button type="button" data-act="dn">👎 <span>${esc(r.o.反対||String(Math.floor(rnd(0,9))))}</span></button></div></div>`}).join('')}</div>
  <div class="mdin"><input type="text" placeholder="匿名で返信する" maxlength="80"><button type="button" data-act="post">返信する</button></div><div class="mdft"><button type="button" data-act="rec">👍 おすすめ</button><button type="button" data-act="report">🚨 通報</button></div>`};
/* 2. 暴露投稿 */
MDR['暴露']=(a,R)=>{const body=R.filter(r=>!r.k),att=R.filter(r=>r.k==='添付');return`${mdStage(a)}<div class="mdh dk"><b>EXPOSÉ POST</b>${mdBadge(a)}</div>
  <div class="mdex"><div class="mdau"><i class="mdav">?</i><div><b>${esc(a.名前||'匿名')}</b><small>@${esc(a.ID||'anonymous_092')} · ${esc(a.時間||'3時間')}</small></div></div>
  ${a.題?`<h4>${mdTx(a.題)}</h4>`:''}<div class="mdtx">${body.map(r=>`<p>${mdTx(r.v[0])}</p>`).join('')}</div>
  ${att.length?`<div class="mdatt"><small>［添付資料 ${att.length}枚］</small><div class="g n${Math.min(att.length,3)}">${att.map(r=>mdPh(r.v[0],r.v[1])).join('')}</div></div>`:''}
  <div class="mdxa"><button type="button" data-act="like">♡ <span>${esc(a.いいね||'0')}</span></button><button type="button" data-act="rp">↻ <span>${esc(a.RP||'0')}</span></button><span>💬 <span>${esc(a.返信||'0')}</span></span></div>
  <p class="mdnote">※投稿内容の真偽は${esc(a.真偽==='検証済み'?'検証されています':a.真偽==='虚偽'?'否定されています':'未確認です')}。</p></div>
  <div class="mdgone hid">${a.消え方==='非公開'?'🔒 このアカウントは非公開です':'このポストは削除されました'}</div>`};
/* 3. 炎上タイムライン */
MDR['炎上']=(a,R)=>{const tr=R.filter(r=>r.k==='トレンド'),ps=R.filter(r=>r.k!=='トレンド');const K={ファン:'💙',アンチ:'⚡',ニュース:'📰',海外:'🌏'};
  return`${mdStage(a)}<div class="mdh"><b>TRENDING NOW</b><button type="button" data-act="dark" aria-label="色">☾</button></div>
  <div class="mdtr1"><span class="rkb">🔥 <em class="rk" data-to="${esc(a.順位||'1')}">${esc(a.開始||a.順位||'1')}</em>位</span><b>${mdTx(a.タグ||'#練習生A')}</b><small><span class="cnt" data-v="${mdN(a.件数)}" data-k="1">${esc(a.件数||'0')}</span> posts</small></div>
  ${tr.length?`<div class="mdtl">${tr.map((r,i)=>`<div><em>${i+2}</em><b>${mdTx(r.v[0])}</b><small>${esc(r.v[1]||'')}</small></div>`).join('')}</div>`:''}
  <div class="mdtw">${ps.map(r=>{if(r.k==='削除済み')return`<div class="tw del">🗑 このポストは削除されました。${r.v[0]?`<span class="cap">（スクショが拡散中：「${mdTx(r.v[0])}」）</span>`:''}</div>`;
    const [id,tx]=r.v.length>=2?r.v:[r.k,r.v[0]];return`<div class="tw k-${esc(r.o.種類||'')}"><div class="twh"><i class="mdav sm">${esc(K[r.o.種類]||[...id.replace('@','')][0]||'?')}</i><b>${esc(r.o.名前||id.replace('@',''))}</b><small>${esc(id.startsWith('@')?id:'@'+id)}</small></div><p>${mdTx(tx)}</p>${r.o.引用?`<div class="twq">${mdTx(r.o.引用)}</div>`:''}<div class="mdxa"><button type="button" data-act="like">♡ <span>${esc(r.o.いいね||'0')}</span></button><button type="button" data-act="rp">↻ <span>${esc(r.o.RP||'0')}</span></button>${r.o.訳?`<button type="button" data-act="tr" data-t="${esc(r.o.訳)}">翻訳</button>`:''}</div></div>`}).join('')}</div>`};
/* 4. 芸能ニュース */
MDR['ニュース']=(a,R)=>{const body=R.filter(r=>!r.k),rel=R.filter(r=>r.k==='関連'),cm=R.filter(r=>r.k==='コメント'),ph=R.filter(r=>r.k==='写真'),fix=R.filter(r=>r.k==='修正');
  return`${mdStage(a)}<div class="mdnw"><div class="mdnh"><b>${esc(a.媒体||'STAR NEWS')}</b><small>${esc(a.分類||'ENTERTAINMENT')}</small></div>
  ${a.印?`<span class="mdflag">${esc(a.印)}</span>`:''}<h3>${mdTx(a.見出し||'')}</h3>${a.副題?`<h5>${mdTx(a.副題)}</h5>`:''}<div class="mdby"><span>${esc(a.日時||'')}</span><span>${esc(a.記者||'芸能担当記者')}</span><span>閲覧 <b class="cnt" data-v="${mdN(a.閲覧)}">${esc(a.閲覧||'0')}</b></span></div>
  ${ph.map(r=>mdPh(r.v[0],r.v[1],'wide')).join('')}<div class="mdtx">${body.map(r=>`<p>${mdTx(r.v[0])}</p>`).join('')}</div>
  ${fix.length?`<div class="mdfix"><b>修正履歴</b>${fix.map(r=>`<div><time>${esc(r.v[0])}</time>${mdTx(r.v[1]||'')}</div>`).join('')}</div>`:''}
  ${rel.length?`<div class="mdrel"><b>関連記事</b>${rel.map(r=>`<div>・${mdTx(r.v[0])}</div>`).join('')}</div>`:''}
  ${cm.length?`<div class="mdcm"><b>コメント ${cm.length}</b>${cm.map(r=>`<div class="c"><b>${esc(r.v[0])}</b><p>${mdTx(r.v[1]||'')}</p><span><button type="button" data-act="up">👍 <span>${esc(r.o.共感||'0')}</span></button><button type="button" data-act="dn">👎 <span>${esc(r.o.反対||'0')}</span></button></span></div>`).join('')}</div>`:''}</div>
  <div class="mdgone hid">この記事は削除されたか、非公開になりました。</div>`};
/* 5. スクープ */
MDR['スクープ']=(a,R)=>{const ph=R.filter(r=>r.k==='写真'),body=R.filter(r=>!r.k),q=R.filter(r=>r.k==='質問');
  return`${mdStage(a)}<div class="mdsc"><div class="mdsch"><b>${esc(a.媒体||'STAR SCOOP')}</b><span>EXCLUSIVE REPORT</span></div><div class="mdsct"><em>【独占】</em><h3>${mdTx(a.見出し||'')}</h3><time>${esc(a.日時||'')}</time></div>
  <div class="mdscp">${ph.map((r,i)=>`<div class="sp">${mdPh(r.v[0],'',a.黒塗り?'mask':'')}<span class="no">PHOTO ${String(i+1).padStart(2,'0')}</span>${r.v[2]?`<time>${esc(r.v[2])}</time>`:''}${r.v[1]?`<small>${esc(r.v[1])}</small>`:''}</div>`).join('')}</div>
  <div class="mdtx">${body.map(r=>`<p>${mdTx(r.v[0])}</p>`).join('')}</div>${q.length?`<div class="mdq"><b>所属事務所への質問</b>${q.map(r=>`<div>Q. ${mdTx(r.v[0])}<small>${esc(r.v[1]||'回答なし')}</small></div>`).join('')}</div>`:''}
  <button type="button" class="mdmore" data-act="more">［続報を待つ］</button></div>`};
/* 6. 証拠資料 */
MDR['資料']=(a,R)=>{const st=MDTRUE[a.真偽]||MDTRUE['未確認'];
  return`${mdStage(a)}<div class="mddoc"><div class="mdh dk"><b>ATTACHMENT ${esc(a.番号||'01/03')}</b>${mdBadge(a)}</div><div class="mddb">${a.題?`<div class="mddt">［${esc(a.題)}］</div>`:''}
  ${R.map(r=>{if(r.k==='日付')return`<div class="dd">${esc(r.v[0])}</div>`;if(r.k==='黒塗り')return`<div class="bk">${r.v.map(x=>`［${esc(x)}：<span class="rd">██████</span>］`).join('<br>')}</div>`;if(r.k==='写真')return mdPh(r.v[0],r.v[1],'wide');
    if(r.k==='時系列')return`<div class="tl"><time>${esc(r.v[0])}</time>${mdTx(r.v[1]||'')}</div>`;if(!r.k)return`<p class="memo">${mdTx(r.v[0])}</p>`;
    return`<div class="ch ${r.k===(a.右||'B')?'r':''}"><b>${esc(r.k)}</b><span>${mdTx(r.v[0])}</span>${r.v[1]?`<time>${esc(r.v[1])}</time>`:''}</div>`}).join('')}</div>
  <div class="mddf"><span>資料の真正性：<b style="color:${st[0]}">${esc(a.真偽||'未確認')}</b></span><span>公開者：${esc(a.公開者||'匿名アカウント')}</span></div><div class="mdstamp" style="--c:${st[0]}">${st[1]}</div></div>`};
/* 7. 公式声明 */
MDR['声明']=(a,R)=>{const co=a.会社||'NOVA ENTERTAINMENT';return`${mdStage(a)}<div class="mdof"><div class="mdlogo"><b>${esc([...co.replace(/\s.*/,'')].slice(0,4).join(''))}</b><span>${esc(co)}</span></div><div class="mdoh">OFFICIAL NOTICE</div><h4>${mdTx(a.題||'所属アーティストに関するお知らせ')}</h4><time>${esc(a.日時||'')}</time>
  <div class="mdtx">${R.map(r=>r.v[0]?`<p>${mdTx(r.v[0])}</p>`:'<br>').join('')}</div><div class="mdsg">${esc(co)}</div>${a.種類?`<span class="mdkind">${esc(a.種類)}</span>`:''}</div>`};
/* 8. 反応まとめ */
MDR['反応']=(a,R)=>`${mdStage(a)}<div class="mdh"><b>COMMUNITY REACTIONS</b><button type="button" data-act="dark" aria-label="色">☾</button></div><div class="mdbt"><h4>${mdTx(a.題||'')}</h4><div class="mdsort"><button type="button" class="on" data-act="sort" data-s="top">おすすめ順</button><button type="button" data-act="sort" data-s="new">新着順</button>${R.some(r=>r.o.訳)?`<button type="button" data-act="lang">原文を表示</button>`:''}</div></div>
  <div class="mdrx">${R.map((r,i)=>`<div class="rx" data-i="${i}" data-v="${mdN(r.o.共感)}"><span class="ic">${esc(r.k||'💬')}</span><div><p data-tr="${esc(r.o.訳||'')}" data-or="${esc(r.v[0]||'')}">「${mdTx(r.o.訳?r.o.訳:r.v[0])}」</p>${r.v[1]?`<small>${esc(r.v[1])}</small>`:''}<span><button type="button" data-act="up">共感 <span>${esc(r.o.共感||'0')}</span></button><button type="button" data-act="dn">非共感 <span>${esc(r.o.反対||'0')}</span></button></span></div></div>`).join('')}</div>${a.まとめ?`<p class="mdsum">${mdTx(a.まとめ)}</p>`:''}`;
BR['報道']=(a,L)=>{const f=MDR[a.形]?a.形:'掲示板';return`<div class="blk md md-${f}" data-fx="報道" data-a="${encA(a)}">${MDR[f](a,mdL(L))}</div>`};
function mdZoom(el,n){document.querySelector('.mdz')?.remove();const z=document.createElement('div');z.className='mdz';z.innerHTML=`<i style="background-image:url(a/${esc(n)}.jpg)"></i><button type="button" aria-label="閉じる">✕</button>`;document.body.appendChild(z);
  z.addEventListener('pointerup',e=>e.stopPropagation());z.addEventListener('touchend',e=>e.stopPropagation());z.onclick=()=>z.remove();z.animate([{opacity:0},{opacity:1}],{duration:200})}
const mdBump=(sp,n)=>{if(!sp)return;const k=/[KM]/i.test(sp.textContent);sp.textContent=mdF(Math.max(0,mdN(sp.textContent)+n),k)};
function mdBind(el,a){if(el._mdb)return;el._mdb=1;
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!el.contains(b))return;const act=b.dataset.act;
    if(b.dataset.z!=null){if(b.dataset.z)mdZoom(el,b.dataset.z);return}
    if(act==='dark')el.classList.toggle('dark');
    else if(act==='up'||act==='dn'||act==='like'||act==='rp'){b.classList.toggle('on');mdBump(b.querySelector('span'),b.classList.contains('on')?1:-1);if(act==='like')b.firstChild.textContent=b.classList.contains('on')?'♥ ':'♡ ';vib(8)}
    else if(act==='rec'){b.classList.toggle('on');mdBump(el.querySelector('.rec'),b.classList.contains('on')?1:-1)}
    else if(act==='report'){b.textContent='🚨 通報しました';b.disabled=true}
    else if(act==='post'){const inp=b.previousElementSibling,v=inp.value.trim();if(!v)return;const bl=el.querySelector('.mdbl'),n=bl.children.length+1,d=new Date();
      bl.insertAdjacentHTML('beforeend',`<div class="mdp me"><div class="mdph"><b>${String(n).padStart(3,'0')}.</b> 匿名<time>${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</time></div><p>${mdTx(v)}</p></div>`);inp.value='';mdBump(el.querySelector('.cnt.cm'),1);SFX.send&&SFX.send()}
    else if(act==='tr'){const p=b.closest('.tw').querySelector('p');if(!b._o){b._o=p.innerHTML;p.innerHTML=mdTx(b.dataset.t);b.textContent='原文'}else{p.innerHTML=b._o;b._o=null;b.textContent='翻訳'}}
    else if(act==='lang'){const on=b.textContent==='原文を表示';el.querySelectorAll('.rx p[data-tr]').forEach(p=>{if(p.dataset.tr)p.innerHTML='「'+mdTx(on?p.dataset.or:p.dataset.tr)+'」'});b.textContent=on?'翻訳を表示':'原文を表示'}
    else if(act==='sort'){el.querySelectorAll('.mdsort [data-act=sort]').forEach(x=>x.classList.toggle('on',x===b));const box=el.querySelector('.mdrx'),xs=[...box.children];
      xs.sort((p,q)=>b.dataset.s==='top'?mdN(q.querySelector('[data-act=up] span').textContent)-mdN(p.querySelector('[data-act=up] span').textContent):(+q.dataset.i)-(+p.dataset.i)).forEach(x=>box.appendChild(x))}
    else if(act==='more'){b.textContent='続報は準備中です…';b.disabled=true}});
  el.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.mdin input')){e.preventDefault();el.querySelector('[data-act=post]').click()}});
  el.addEventListener('pointerup',e=>{if(e.pointerType==='mouse'&&e.target.closest('button,input'))e.stopPropagation()})}
D['報道']={still:mdBind,
  prep(el){el.querySelectorAll('.mdp,.tw,.rx,.mdcm .c').forEach(x=>x.style.display='none')},
  async run(el,a,c){mdBind(el,a);const f=a.形;
    const cnt=[...el.querySelectorAll('.cnt')];c.every(900,()=>cnt.forEach(x=>{const v=+x.dataset.v||mdN(x.textContent),k=x.dataset.k;const nv=mdN(x.textContent)+Math.round(v*rnd(.002,a.速さ==='速い'?.03:.01))+1;x.textContent=mdF(nv,k)}));
    const rk=el.querySelector('.rk[data-to]');if(rk){let r=+rk.textContent||9;const to=+rk.dataset.to||1;c.every(1400,()=>{if(r>to){r--;rk.textContent=r;rk.parentElement.animate([{transform:'scale(1.3)'},{transform:'none'}],{duration:300})}})}
    const items=[...el.querySelectorAll('.mdp,.tw,.rx,.mdcm .c')];
    for(const x of items){if(!await c.wait(f==='掲示板'?rnd(500,1100):rnd(400,800)))return;x.style.display='';x.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:260});if(Math.random()<.5)SFX.pop2&&SFX.pop2();keepBottom()}
    /* 消える投稿・削除・非公開 */
    el.querySelectorAll('.mdp[data-gone]').forEach(x=>{const s=parseFloat(x.dataset.gone);if(s)c.wait(s*1000).then(ok=>{if(!ok)return;x.classList.add('del');x.innerHTML=`${x.querySelector('.mdph b').outerHTML} <i>管理者により削除されました</i>`})});
    if(a.消える){if(!await c.wait(parseFloat(a.消える)*1000))return;const body=el.querySelector('.mdex,.mdnw'),g=el.querySelector('.mdgone');if(body&&g){await body.animate([{opacity:1,filter:'none'},{opacity:0,filter:'blur(3px)'}],{duration:600}).finished;body.classList.add('hid');g.classList.remove('hid');g.animate([{opacity:0},{opacity:1}],{duration:400});SFX.tick&&SFX.tick(.2)}}
    if(f==='資料'){const s=el.querySelector('.mdstamp');if(s){if(!await c.wait(800))return;s.classList.add('on');SFX.stamp?SFX.stamp():SFX.tick&&SFX.tick(.3);vib(30)}}
  }};
TPL['報道']={block:1,attrs:[['形'],['段階'],['真偽'],['板'],['分類'],['題'],['閲覧'],['コメント'],['おすすめ'],['人気'],['名前'],['ID'],['時間'],['いいね'],['RP'],['返信'],['消え方'],['消える'],['タグ'],['件数'],['順位'],['開始'],['媒体'],['見出し'],['副題'],['記者'],['日時'],['印'],['黒塗り'],['番号'],['公開者'],['右'],['会社'],['種類'],['まとめ'],['速さ']],parse:l=>[l],fmt:r=>r[0]};
TPNAME['報道']='炎上・報道';
const MDP={
'1 匿名掲示板':[['人気練習生Aの過去',{形:'掲示板',段階:'第1段階：匿名掲示板に疑惑',板:'IDOL COMMUNITY',分類:'話題',題:'【話題】人気練習生Aの過去について',閲覧:'125,842',コメント:'2,841',おすすめ:'1,204',人気:'1'},`23:41｜匿名｜Aって最近めちゃくちゃ人気じゃん。
23:42｜匿名｜何かあったの？
23:43｜匿名｜同級生だったって人が暴露してる。
23:43｜匿名｜またこのパターン？
23:44｜匿名｜証拠ないのに拡散するなよ。
23:44｜匿名｜Aの実名と学校名、これ｜消える=5
23:45｜匿名｜いや、まだ本当かわからないでしょ。
23:46｜匿名｜明日の順位発表どうなるんだろ。`]],
'2 暴露投稿':[['元同級生の告白',{形:'暴露',段階:'第2段階：元同級生を名乗る人物',真偽:'未確認',名前:'匿名',ID:'anonymous_092',時間:'3時間',題:'【私は練習生Aの元同級生です】',いいね:'8,421',RP:'12,504',返信:'3,218'},`はじめまして。
突然ですが、現在サバイバル番組に出演しているAについてお話しします。
私はAと同じ学校に通っていました。
テレビで見せている姿と、私が知っているAには違いがあります。
詳しい内容は後ほど公開します。
添付：sc_gate｜校門
添付：paper｜メモ
添付：sc_album｜卒業アルバム`],['すぐ消える告発',{形:'暴露',真偽:'未確認',ID:'truth_2026',時間:'12分',いいね:'2,104',RP:'5,880',返信:'941',消える:'7',消え方:'非公開'},`Aについて知っていることを全部書きます。
……やっぱりやめます。`]],
'3 炎上タイムライン':[['#練習生A',{形:'炎上',段階:'第3段階：SNSで拡散',タグ:'#練習生A',件数:'125K',開始:'8',順位:'1'},`トレンド：#サバイバル順位発表｜88.2K posts
トレンド：#Aを信じる｜41.0K posts
@fan_love｜今は何も確定してないから本人の説明を待とう。｜いいね=24.5K｜RP=8.2K｜種類=ファン
@idol_watch｜事務所は早く説明してほしい。｜いいね=18.2K｜RP=5.1K
@star_2026｜順位発表直前に出てくるの不自然じゃない？｜いいね=9,821｜RP=2,104
削除済み：Aってやっぱりそういう人だったんだ
@global_n7｜Is it true? I can't believe this…｜いいね=6.6K｜RP=3.0K｜種類=海外｜訳=本当なの？信じられない…
@news_update｜所属事務所が事実関係を確認中。｜いいね=32.1K｜RP=15.8K｜種類=ニュース`]],
'4 芸能ニュース':[['【独占】学生時代の疑惑',{形:'ニュース',段階:'第4段階：ニュースが記事化',媒体:'STAR NEWS',分類:'ENTERTAINMENT',印:'独占',見出し:'人気練習生Aに学生時代の疑惑',副題:'所属事務所「事実関係を確認中」',日時:'2026.10.30 09:24',記者:'芸能担当記者',閲覧:'342,118'},`写真：md_studio｜サバイバル番組の収録スタジオ
サバイバル番組に出演中の練習生Aについて、学生時代の行動を問題視する匿名投稿がオンライン上で拡散されている。
投稿者はAの元同級生だと主張している。
ただし、現時点で投稿内容の真偽は確認されていない。
所属事務所は「現在、事実関係を確認している」と説明した。
修正：10.30 11:02｜見出しの一部を修正しました
関連：練習生Aのファンが声明を発表
関連：番組制作陣の対応に注目
関連：オンライン上で意見が対立
コメント：bluehour｜本人の説明を待ちたい｜共感=1,204｜反対=88
コメント：n7fan｜記事にするの早すぎない？｜共感=980｜反対=41`],['訂正記事',{形:'ニュース',媒体:'STAR NEWS',印:'訂正',見出し:'練習生Aに関する報道について',日時:'2026.11.02 18:00',閲覧:'98,201'},`本紙が10月30日に報じた記事について、告発内容に事実と異なる点があることが確認されました。
関係者の皆さまにお詫び申し上げます。`]],
'5 独占スクープ':[['深夜の極秘行動',{形:'スクープ',段階:'第6段階：追加の報道',媒体:'STAR SCOOP',見出し:'人気アイドルB　深夜の極秘行動をキャッチ',日時:'2026.10.30'},`写真：md_entrance｜夜の建物前に立つ人物｜2026.10.28 01:12
写真：md_car｜車に乗り込む人物｜2026.10.28 01:20
写真：md_mansion｜建物の外観｜2026.10.28 01:25
写真：md_street｜現場近くの路地｜2026.10.28 01:31
人気グループのメンバーBが、深夜に都内の建物を訪れる姿が目撃されたという。
同行者の身元や訪問目的は不明。
所属事務所に問い合わせたところ、現時点で回答は得られていない。
質問：同行者は誰ですか？｜回答なし
質問：訪問の目的は？｜回答なし`]],
'6 証拠資料':[['匿名チャット履歴',{形:'資料',真偽:'未確認',番号:'01/03',題:'匿名チャット履歴',公開者:'匿名アカウント'},`日付：2024.05.18
A：明日の件、どうなった？｜21:04
B：まだ確認してない。｜21:06
A：わかった。｜21:06
黒塗り：氏名｜学校名`],['加工疑惑の資料',{形:'資料',真偽:'加工疑惑',番号:'02/03',題:'在籍記録（とされるもの）'},`黒塗り：氏名｜学年｜担任
写真：sc_album｜卒業アルバム（とされるもの）。名前の欄のフォントが一部ちがう
時系列：2019.04｜入学
時系列：2021.03｜転校（とされる）`]],
'7 公式声明':[['事実確認中',{形:'声明',段階:'第5段階：事務所が声明',会社:'NOVA ENTERTAINMENT',題:'所属アーティストに関するお知らせ',日時:'2026.10.30',種類:'事実確認中'},`こんにちは。NOVA ENTERTAINMENTです。
現在オンライン上で拡散されている所属練習生Aに関する投稿についてお知らせいたします。
当社は現在、関係者への確認を進めております。
確認されていない情報の拡散や、関係者への誹謗中傷はお控えくださいますようお願い申し上げます。
確認が取れ次第、改めてご案内いたします。`],['疑惑を否定・法的措置',{形:'声明',会社:'NOVA ENTERTAINMENT',題:'虚偽の投稿に関する当社の立場',日時:'2026.11.02',種類:'否定・法的措置'},`確認の結果、投稿の内容は事実ではないことが分かりました。
悪意のある虚偽の投稿と拡散に対して、法的措置を取る予定です。`]],
'8 反応まとめ':[['意見が割れている',{形:'反応',題:'【人気練習生Aをめぐる議論】',まとめ:'現在も意見が分かれている。'},`👍：本人の説明を待つべき｜共感=3,821｜反対=210
👍：匿名の話だけで決めつけるな｜共感=2,104｜反対=301
👎：もし事実なら番組側も対応が必要｜共感=1,728｜反対=644
💬：順位発表直前なのが気になる｜共感=981｜反対=55
🌏：Let's wait for the official statement.｜海外ファン｜共感=702｜訳=公式発表を待とう。`]]};
EDT['報道']={text:1,presets:MDP,
  sets:[['形','画面の種類',[['掲示板','匿名掲示板'],['暴露','暴露投稿'],['炎上','炎上タイムライン'],['ニュース','芸能ニュース'],['スクープ','独占スクープ'],['資料','証拠資料'],['声明','公式声明'],['反応','反応まとめ']]],
    ['段階','事件の段階（上に小さく出す）'],['真偽','真偽',[['','（出さない）'],['未確認','未確認'],['加工疑惑','加工疑惑'],['検証済み','検証済み'],['虚偽','虚偽']]],['消える','◯秒後に削除・非公開（暴露・ニュース）'],['速さ','数字の増え方',[['','ふつう'],['速い','急増']]]],
  hint:'1行に1つ。掲示板「23:41｜匿名｜本文」（消える=5 でその投稿が削除）、「削除：理由」。暴露は本文を1行ずつ、「添付：写真｜説明」。炎上「@id｜本文｜いいね=24.5K｜RP=8.2K｜種類=ファン」「トレンド：#タグ｜件数」「削除済み：本文」。ニュース「写真：」「修正：日時｜内容」「関連：」「コメント：名前｜本文｜共感=」。スクープ「写真：名前｜説明｜日時」「質問：」。資料「日付：」「A：本文｜時刻」「黒塗り：氏名｜学校名」「時系列：日付｜できごと」。反応「👍：本文｜共感=｜訳=翻訳」。写真の名前：md_entrance（雨の入口）・md_car（車）・md_mansion（豪邸）・md_street（夜の路地）・md_studio（スタジオ）・md_stage（ステージ）・md_airport（空港）・md_press（記者会見）・sc_album（卒業アルバム）・sc_gate（校舎と桜）。'};
EDT['報道'].plain=(o,f)=>{const a=o.a,H={掲示板:'IDOL COMMUNITY / HOT',暴露:'EXPOSÉ POST',炎上:'TRENDING NOW',ニュース:'ENTERTAINMENT NEWS',スクープ:'EXCLUSIVE REPORT',資料:'ATTACHMENT',声明:'OFFICIAL NOTICE',反応:'COMMUNITY REACTIONS'}[a.形]||'';
  const head=f?`━━━━━━━━━━━━━━━━━━━━\n       ${H}\n━━━━━━━━━━━━━━━━━━━━\n\n`:'';const t=a.題||a.見出し||a.タグ||'';return head+(t?t.replace(/／/g,'\n')+'\n\n':'')+o.rows.map(r=>r[0].replace(/｜(\S+?)=\S+/g,'').replace(/｜/g,'　').replace(/／/g,'\n')).join('\n')};
/* ===== 演出の小さな進行役：ページの外（編集画面のプレビュー）でも動かせる。quiet なら音を出さない ===== */
function miniCtx(){const T=new Set(),I=new Set(),o={dead:false,quiet:false,k:1,
  kill(){o.dead=true;T.forEach(clearTimeout);I.forEach(clearInterval)},
  wait(ms){return new Promise(r=>{if(o.dead)return r(false);const t=setTimeout(()=>{T.delete(t);r(!o.dead)},ms*o.k);T.add(t)})},
  every(ms,fn){const i=setInterval(()=>{if(o.dead)clearInterval(i);else fn()},ms);I.add(i)},
  sfx(k,...x){if(!o.quiet&&SFX[k])try{SFX[k](...x)}catch(e){}}};return o}
const fxBug=s=>typeof bugText==='function'?bugText(s):[...s].map(c=>Math.random()<.5?pick(['■','▒','?','#','繧','縺','莉']):c).join('');

/* ===== 文字が崩れる：踊る → ぐちゃぐちゃ → 集まって別の言葉（切り抜き文字にもできる）。どの文字にも使える ===== */
function fxChars(el){const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),ns=[],out=[];while(tw.nextNode())if(tw.currentNode.data.trim())ns.push(tw.currentNode);
  ns.forEach(n=>{const f=document.createDocumentFragment();for(const ch of n.data){const s=document.createElement('i');s.className='fch';s.textContent=ch;s.style.setProperty('--r',(Math.random()*2-1).toFixed(2));f.appendChild(s);out.push(s)}n.replaceWith(f)});return out}
const CUTP=[['#f3efe4','#111'],['#111','#fff'],['#c8102e','#fff'],['#fff6c9','#222'],['#e6eef9','#1c2b44'],['#fff','#c8102e'],['#2b2f3a','#ffd36b']],CUTF=["'Shippori Mincho',serif","'Zen Maru Gothic',sans-serif","'DotGothic16',monospace","'Klee One',serif","Georgia,serif","Impact,sans-serif"];
async function fxGather(root,src,word,o,ctl){
  if(!word)return;const ly=root.querySelector('.fxw')||root.appendChild(Object.assign(document.createElement('div'),{className:'fxw'}));ly.innerHTML='';
  const R=root.getBoundingClientRect(),chars=[...word],n=chars.length,fs=Math.min(48,Math.max(22,R.width/(n+1.5)));
  const pool=src.filter(s=>s.isConnected&&s.getBoundingClientRect().width>0);
  const tw=n*fs*(o.cut?1.08:.96),x0=(R.width-tw)/2,y0=R.height*.42;
  const ls=chars.map((ch,i)=>{const s=document.createElement('b');s.className='fxl'+(o.cut?' cut':'');s.textContent=ch;s.style.fontSize=fs+'px';
    if(o.cut){const [bg,fg]=pick(CUTP);s.style.background=bg;s.style.color=fg;s.style.fontFamily=pick(CUTF);s.style.fontSize=(fs*rnd(.8,1.15)).toFixed(0)+'px';s.style.setProperty('--rot',rnd(-9,9).toFixed(1)+'deg')}
    const from=pool.length?pick(pool).getBoundingClientRect():{left:R.left+rnd(0,R.width),top:R.top+R.height};
    s.style.left=(from.left-R.left)+'px';s.style.top=(from.top-R.top)+'px';ly.appendChild(s);return [s,x0+i*fs*(o.cut?1.08:.96),y0+(o.cut?rnd(-6,6):0)]});
  pool.forEach(s=>{if(Math.random()<.7)s.classList.add('gone')});
  ctl.sfx('crackle',.08,.3);
  await Promise.all(ls.map(([s,x,y],i)=>s.animate([{transform:'translate(0,0) scale(.6)',opacity:.4},{transform:`translate(${x-parseFloat(s.style.left)}px,${y-parseFloat(s.style.top)}px) rotate(var(--rot,0deg))`,opacity:1}],{duration:(1100+i*120)*ctl.k+1,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}).finished.catch(()=>{})));
  ctl.sfx('thud');if(navigator.vibrate&&!ctl.quiet)vib([60,40,90])}
async function fxCollapse(root,src,o,ctl){
  root.classList.add('fxdance');if(o.strong)root.classList.add('fxhard');if(!await ctl.wait(o.strong?900:1600))return;
  /* ぐちゃぐちゃ：記号にまじり、ずれて重なる */
  for(let k=0;k<(o.strong?6:4);k++){src.forEach(s=>{if(Math.random()<.35){s.textContent=fxBug(s.textContent).slice(0,1)||'■';s.style.transform=`translate(${rnd(-6,6)}px,${rnd(-8,8)}px) rotate(${rnd(-40,40)}deg)`}});ctl.sfx('crackle',.04,.15);if(!await ctl.wait(260))return}
  if(o.word)await fxGather(root,src,o.word,o,ctl)}

/* ===== 下から流れるコメント（配信）：段階で「様子がおかしく」なる。読者もコメント・スパチャできる =====
   ［流れるコメント 題=… 同接=312 時間=0:12:04 背景=sil_live1 速さ=ゆっくり／急増］ 中は「名前：本文」「¥1,000 名前：本文」
   段階の行：［おかしく 1 同接が化ける 変な人］…［おかしく 3 埋め尽くす 文字が崩れる 言葉=つぎはあなた 切り抜き］［おかしく 終わり 全部消える］ */
BLOCKS.add('流れるコメント');
const FLX={'同接':'同接が化ける','時間':'時間が戻る','踊る':'文字が踊る','崩れる':'文字が崩れる','消える':'全部消える','名前があなた':'あなた','見てる':'あなた','切り抜き文字':'切り抜き'};
const FLALL=['同接が化ける','時間が戻る','ノイズ','変な人','文字が踊る','文字が崩れる','埋め尽くす','あなた','全部消える','切り抜き'];
const flParse=L=>L.filter(l=>l.trim()).map(l=>{l=l.trim();let m;
  if((m=l.match(/^［おかしく[\s　]*(.*)］$/))){const o={t:'s',lab:'',fx:[],word:'',strong:false};m[1].split(/[\s　]+/).filter(Boolean).forEach(x=>{if(/^言葉[=＝]/.test(x))o.word=x.replace(/^言葉[=＝]/,'');else if(/^(強さ[=＝])?はっきり$/.test(x))o.strong=true;else if(/^(\d+|終わり|最後)$/.test(x))o.lab=x;else o.fx.push(FLX[x]||x)});return o}
  if((m=l.match(/^¥\s*([\d,]+)\s+(.+?)：(.*)$/)))return{t:'c',n:m[2],x:m[3],am:m[1]};
  const i=l.indexOf('：');return i<0?{t:'c',n:'名無し',x:l}:{t:'c',n:l.slice(0,i),x:l.slice(i+1)}});
const flTime=s=>{const p=String(s||'0:00:00').split(':').map(Number);return(p[0]||0)*3600+(p[1]||0)*60+(p[2]||0)},flHms=s=>{s=Math.max(0,s|0);return`${s/3600|0}:${String((s/60|0)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`};
const flCm=(n,x,cls='',am='')=>`<div class="fc ${cls}"${am?` style="--sc:${scCol(am)}"`:''}><b class="n">${esc(n)}${am?` <em>¥${esc(am)}</em>`:''}</b><span class="t">${esc(x)}</span></div>`;
BR['流れるコメント']=(a,L)=>{const bg=a.背景&&a.背景!=='なし'?`style="background-image:url(a/${esc(a.背景)}.jpg)"`:'';const cs=flParse(L).filter(r=>r.t==='c');
  return`<div class="blk flw" data-fx="流れるコメント" data-a="${encA(a)}" data-rows="${encA(L)}"><div class="fbg${bg?'':' none'}" ${bg}></div>
  <div class="fhd"><span class="flv">● LIVE</span><span class="fvw">同接 <b>${esc(a.同接||'312')}</b></span><span class="ftm">${esc(flHms(flTime(a.時間)))}</span>${a.題?`<span class="fti">${esc(a.題)}</span>`:''}</div>
  <div class="fcol l">${cs.filter((_,i)=>i%2===0).slice(-5).map(r=>flCm(r.n,r.x,r.am?'fsc':'',r.am)).join('')}</div><div class="fcol r">${cs.filter((_,i)=>i%2).slice(-5).map(r=>flCm(r.n,r.x,r.am?'fsc':'',r.am)).join('')}</div>
  <div class="fly"></div><div class="fend hid">配信は終了しました</div>
  <div class="fin"><input type="text" placeholder="コメントする…" maxlength="50"><button type="button" class="fsnd" aria-label="送信">➤</button><button type="button" class="scb" aria-label="スーパーチャット">¥</button></div>
  <div class="scp">${SCAMT.map(x=>`<button type="button" data-am="${x}" style="--sc:${scCol(x)}">¥${x}</button>`).join('')}</div></div>`};
function flBind(el){if(el._flb)return;el._flb=1;const inp=el.querySelector('.fin input'),pk=el.querySelector('.scp');
  const put=(html)=>{const cols=[...el.querySelectorAll('.fcol')],col=cols[0].children.length<=cols[1].children.length?cols[0]:cols[1];col.insertAdjacentHTML('beforeend',html);const d=col.lastElementChild;d.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:280});while(col.children.length>9)col.firstChild.remove();return d};
  el._put=put;
  const send=()=>{const v=inp.value.trim();if(!v)return;inp.value='';put(flCm('あなた',v,'me'));SFX.send&&SFX.send()};
  el.querySelector('.fsnd').onclick=send;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();send()}};
  el.querySelector('.scb').onclick=()=>pk.classList.toggle('on');
  pk.onclick=e=>{const b=e.target.closest('button');if(!b)return;pk.classList.remove('on');const am=b.dataset.am,v=inp.value.trim()||'応援してます！';inp.value='';
    const d=put(flCm('あなた',v,'fsc me',am));d.animate([{transform:'scale(.85)'},{transform:'scale(1.06)'},{transform:'none'}],{duration:420});SFX.notif&&SFX.notif();vib([30,40,30])}}
/* 流す。opt.upto＝その段階まで一気に進める（編集画面の段階ボタン）。opt.onScripted＝書かれた分を流し終えたら呼ぶ */
async function flwPlay(el,a,ctl,opt={}){
  const rows=flParse(JSON.parse(el.dataset.rows||'[]')),cols=[...el.querySelectorAll('.fcol')],ly=el.querySelector('.fly'),vwE=el.querySelector('.fvw b'),tmE=el.querySelector('.ftm'),end=el.querySelector('.fend');
  cols.forEach(c=>c.innerHTML='');ly.innerHTML='';el.querySelector('.fxw')?.remove();end.classList.add('hid');el.classList.remove('fnz','fxdance','fxhard','fover','fend-on');
  const st={fx:new Set(),strong:false,n:0,ended:false};let vw=parseInt(String(a.同接||'312').replace(/,/g,''))||312,sec=flTime(a.時間);
  ctl.every(1000,()=>{if(!el.isConnected){ctl.kill();return}const hard=st.strong?.45:.2;
    vw=Math.max(0,vw+Math.round(rnd(-3,st.fx.has('埋め尽くす')?90:9)));sec++;
    vwE.textContent=st.fx.has('同接が化ける')&&Math.random()<hard?pick(['404','0','■■■','33333','1','4444']):vw.toLocaleString();
    tmE.textContent=st.fx.has('時間が戻る')&&Math.random()<hard?pick(['--:--:--','0:00:00','4:44:44',flHms(sec-rnd(20,300))]):flHms(sec)});
  const cs=rows.filter(r=>r.t==='c'),WATCH=(typeof CM!=='undefined'&&CM['見てる'])||['見てる','あなたのことだよ','そこにいるね'];
  const add=r=>{st.n++;let n=r.n,x=r.x,cls=r.am?'fsc':'';
    if(st.fx.has('あなた')){n='あなた';if(Math.random()<.6)x=pick(WATCH)}
    if(st.fx.has('変な人')&&st.n%4===0){n=pick(['■な■','み■と','■■■','■■と']);x=pick(ODD);cls+=' odd'}
    if(st.fx.has('文字が崩れる')&&Math.random()<(st.strong?.8:.45))x=fxBug(x);
    const d=el._put(flCm(n,x,cls,r.am));if(st.fx.has('文字が踊る'))fxChars(d.querySelector('.t'));
    if(r.am){ctl.sfx('notif');d.animate([{transform:'scale(.85)'},{transform:'scale(1.06)'},{transform:'none'}],{duration:420})}else if(Math.random()<.4)ctl.sfx('pop2')};
  const flood=async()=>{el.classList.add('fover');let k=0;while(!ctl.dead&&!st.ended){const r=pick(cs)||{n:'名無し',x:'見てる'},b=document.createElement('div');b.className='fc fl';
      const bug=k>40&&Math.random()<Math.min(.8,(k-40)/120);b.innerHTML=`<b class="n">${esc(st.fx.has('あなた')?'あなた':r.n)}</b><span class="t">${esc(bug?fxBug(r.x):r.x)}</span>`;
      b.style.left=rnd(-8,70)+'%';b.style.top=rnd(4,86)+'%';b.style.transform=`rotate(${rnd(-6,6).toFixed(1)}deg) scale(${rnd(.8,1.5).toFixed(2)})`;if(k>20&&Math.random()<Math.min(.5,k/200))b.classList.add('red');
      ly.appendChild(b);k++;if(ly.children.length>160)ly.firstChild.remove();if(k%6===0)ctl.sfx('pop');if(!await ctl.wait(Math.max(40,(st.strong?120:200)-k*1.5)))return}};
  const stage=async s=>{s.fx.forEach(x=>st.fx.add(x));if(s.strong)st.strong=true;
    el.classList.toggle('fnz',st.fx.has('ノイズ'));if(st.fx.has('ノイズ'))ctl.sfx('crackle',.05,.2);
    if(s.fx.includes('文字が踊る')){el.classList.add('fxdance');if(st.strong)el.classList.add('fxhard');el.querySelectorAll('.fcol .fc .t').forEach(t=>{if(!t.querySelector('.fch'))fxChars(t)})}
    if(s.fx.includes('文字が崩れる')){const ts=[...el.querySelectorAll('.fcol .fc .t')];for(let k=0;k<4;k++){ts.forEach(t=>{if(Math.random()<.4)t.textContent=fxBug(t.textContent)});ctl.sfx('crackle',.03,.12);if(!await ctl.wait(220))return}}
    if(s.fx.includes('埋め尽くす'))flood();
    if(s.word){const src=[...el.querySelectorAll('.fcol .fc .t')].flatMap(t=>t.querySelector('.fch')?[...t.querySelectorAll('.fch')]:fxChars(t));
      if(!await ctl.wait(st.fx.has('埋め尽くす')?2500:600))return;await fxGather(el,src,s.word,{cut:st.fx.has('切り抜き')},ctl)}
    if(s.fx.includes('全部消える')){if(!await ctl.wait(1400))return;st.ended=true;[...cols,ly,el.querySelector('.fxw')].forEach(x=>x&&(x.style.visibility='hidden'));el.classList.remove('fnz','fxdance','fover');
      el.classList.add('fend-on');end.classList.remove('hid');ctl.sfx('thud');vwE.textContent='0';
      setTimeout(()=>{[...cols,ly,el.querySelector('.fxw')].forEach(x=>{if(x){x.style.visibility='';x.innerHTML=''}})},30)}};
  const speed=({'ゆっくり':1500,'急増':420})[a.速さ]||900;let si=0;
  if(opt.upto!=null)ctl.k=.03;
  for(const r of rows){if(ctl.dead)return;
    if(r.t==='s'){si++;if(opt.upto!=null&&si>opt.upto)break;if(opt.upto!=null&&si===opt.upto)ctl.k=1;await stage(r);continue}
    add(r);if(!await ctl.wait(speed*rnd(.7,1.3)*(st.fx.has('埋め尽くす')?.5:1)))return}
  ctl.k=1;opt.onScripted&&opt.onScripted();
  while(!ctl.dead&&!st.ended&&cs.length){add(pick(cs));if(!await ctl.wait(speed*rnd(.9,1.6)))return}}
D['流れるコメント']={still(el,a){flBind(el)},
  prep(el){flBind(el)},
  async run(el,a,c){flBind(el);const ctl=miniCtx();el._ctl=ctl;c.on&&c.on(()=>ctl.kill());await new Promise(res=>{flwPlay(el,a,ctl,{onScripted:res}).then(res)})}};
TPL['流れるコメント']={block:1,attrs:[['題'],['同接'],['時間'],['背景'],['速さ']],parse:l=>[l],fmt:r=>r[0]};
TPNAME['流れるコメント']='流れるコメント（配信）';

/* ===== 手書きの日記：ノートにペンで書いていく =====
   ［日記 日付=10月30日（木） 天気=雨 紙=白／クリーム／方眼 ペン=黒／青／赤 速さ=ゆっくり］
   ~~消す~~　**強く**　((震える))　［間］　［しみ］　［ハート］［星］［ぐるぐる］　1行だけ［崩れる 言葉=… 切り抜き］ */
BLOCKS.add('日記');
const DOOD={'ハート':'M12 21C5 15 2 11 4 7c2-4 7-4 8 0 1-4 6-4 8 0 2 4-1 8-8 14z','星':'M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z','ぐるぐる':'M12 12c1 0 1 1 0 2-2 1-4-1-3-3 1-3 5-3 6 0 1 4-3 7-6 6-5-1-6-7-3-10 4-4 11-2 12 3'};
const diaLine=l=>{let m;if((m=l.match(/^［崩れる[\s　]*(.*)］$/))){const o={w:'',cut:false,strong:false};m[1].split(/[\s　]+/).forEach(x=>{if(/^言葉[=＝]/.test(x))o.w=x.replace(/^言葉[=＝]/,'');else if(/切り抜き/.test(x))o.cut=true;else if(/はっきり/.test(x))o.strong=true});return`<div class="dl dcol" data-w="${esc(o.w)}" data-cut="${o.cut?1:''}" data-strong="${o.strong?1:''}"></div>`}
  let h=esc(l).replace(/\[\[(.+?)\]\]/g,'<span class="der">$1</span>').replace(/~~(.+?)~~/g,'<s class="dsk">$1</s>').replace(/\*\*(.+?)\*\*/g,'<b class="dbo">$1</b>').replace(/\(\((.+?)\)\)/g,'<span class="dtr">$1</span>')
    .replace(/［間］/g,'<i class="dp"></i>').replace(/［しみ］/g,'<i class="dst"></i>').replace(/［(ハート|星|ぐるぐる)］/g,(_,k)=>`<i class="ddo"><svg viewBox="0 0 24 24"><path d="${DOOD[k]}"/></svg></i>`);
  return`<div class="dl">${h||'&nbsp;'}</div>`};
BR['日記']=(a,L)=>`<div class="blk dia p-${esc(a.紙||'白')} k-${esc(a.ペン||'鉛筆')}${a.消し跡==='なし'?'':' smudge'}" data-fx="日記" data-a="${encA(a)}"><div class="dhd"><span class="dd">${esc(a.日付||'　月　日')}</span><span class="dw">${a.天気?`天気　${esc(a.天気)}`:''}</span></div><div class="dbody">${L.map(diaLine).join('')}</div></div>`;
async function diaPlay(el,a,ctl){
  el.classList.add('play');const body=el.querySelector('.dbody'),sp=({'ゆっくり':1.6,'速い':.55})[a.速さ]||1;el.classList.remove('fxdance','fxhard');el.querySelector('.fxw')?.remove();
  if(!el._src)el._src=body.innerHTML;body.innerHTML=el._src;
  const lines=[...body.querySelectorAll('.dl')];const done=[];
  lines.forEach(d=>{d.style.visibility='hidden'});
  for(const d of lines){if(ctl.dead)return;
    if(d.classList.contains('dcol')){const src=done.flatMap(x=>[...x.querySelectorAll('.fch')]);if(!await ctl.wait(700))return;await fxCollapse(el,src,{word:d.dataset.w,cut:!!d.dataset.cut,strong:!!d.dataset.strong},ctl);continue}
    const parts=[];const walk=n=>{for(const c of [...n.childNodes]){if(c.nodeType===3){if(c.data.trim()){const s=document.createElement('span');s.textContent=c.data;c.replaceWith(s);parts.push(...fxChars(s))}}else if(c.matches&&c.matches('.dp,.dst,.ddo'))parts.push(c);else walk(c)}};
    walk(d);parts.forEach(p=>p.classList.add('w0'));d.style.visibility='';
    for(const p of parts){if(ctl.dead)return;
      if(p.classList.contains('dp')){if(!await ctl.wait(1100*sp))return;continue}
      p.classList.remove('w0');p.classList.add('w1');
      if(p.classList.contains('dst')){ctl.sfx('drip');if(!await ctl.wait(500))return;continue}
      if(p.classList.contains('ddo')){if(!await ctl.wait(700))return;continue}
      if(p.textContent.trim())ctl.sfx('pen');
      const tr=p.closest('.dtr'),sk=p.closest('.dsk'),er=p.closest('.der'),last=x=>{const a=x.querySelectorAll('.fch');return a[a.length-1]===p};
      if(!await ctl.wait((tr?rnd(160,260):p.closest('.dbo')?rnd(140,200):rnd(70,140))*sp))return;
      if(sk&&last(sk)&&!sk.classList.contains('on')){if(!await ctl.wait(400*sp))return;sk.classList.add('on');ctl.sfx('scratch')}
      if(er&&last(er)&&!er.classList.contains('gone')){if(!await ctl.wait(600*sp))return;await diaErase(er,ctl,sp)}}
    done.push(d);if(!await ctl.wait(420*sp))return}}
/* 消しゴムでこする：左右にこすって、消しかすが散って、うっすら跡が残る */
async function diaErase(er,ctl,sp){er.classList.add('rub');const r=er.getBoundingClientRect(),host=er.closest('.dia'),hr=host.getBoundingClientRect();
  for(let k=0;k<6;k++){const d=document.createElement('i');d.className='ddust';d.style.left=(r.left-hr.left+Math.random()*r.width)+'px';d.style.top=(r.top-hr.top+r.height*.7)+'px';host.appendChild(d);
    d.animate([{transform:'translate(0,0) scale(1)',opacity:.9},{transform:`translate(${(Math.random()*2-1)*24}px,${10+Math.random()*16}px) scale(.6)`,opacity:0}],{duration:900+Math.random()*500,easing:'ease-out'}).finished.then(()=>d.remove())}
  ctl.sfx('scratch');if(!await ctl.wait(900*sp))return;er.classList.remove('rub');er.classList.add('gone')}
D['日記']={still(el){},prep(el){el.querySelectorAll('.dl').forEach(d=>d.style.visibility='hidden')},
  async run(el,a,c){const ctl=miniCtx();el._ctl=ctl;c.on&&c.on(()=>ctl.kill());await diaPlay(el,a,ctl)}};
TPL['日記']={block:1,attrs:[['日付'],['天気'],['紙'],['ペン'],['消し跡'],['速さ']],parse:l=>[l],fmt:r=>r[0]};
TPNAME['日記']='手書きの日記';

/* ===== 文例 ===== */
const FLP={'流れるコメント':[
['何も起きない（ふつうの配信）',{題:'深夜の雑談',同接:'312',時間:'0:12:04',背景:'sil_live1'},`ゆう：こんばんは〜
shiro：きた
通りすがり：初見です
k：声すき
¥500 あお：差し入れ！
ゆう：今日なに話すの？
nanashi：寝落ちしそう
みてる人：おつかれ〜`],
['じわじわ3段階（ホラー）',{題:'廃病院から生配信',同接:'1,284',時間:'1:02:44',背景:'なし'},`ゆう：こんばんは
shiro：ほんとに入るの？
通りすがり：こわ
k：うしろ暗すぎ
［おかしく 1 同接が化ける 変な人］
404：……
ゆう：今なんか映った？
shiro：え
nanashi：気のせいでしょ
［おかしく 2 ノイズ 時間が戻る 文字が踊る］
k：ねえ
通りすがり：うしろ
ゆう：うしろうしろ
shiro：画面おかしくない？
［おかしく 3 埋め尽くす 文字が崩れる 言葉=つぎはあなた 切り抜き］
ゆう：にげて
［おかしく 終わり 全部消える］`],
['いきなり乗っ取り',{題:'ゲーム実況 #12',同接:'2,050',時間:'0:48:10',速さ:'急増'},`ゆう：ナイス！
shiro：うますぎ
¥1,000 あお：神プレイ
k：つぎボス？
［おかしく 1 ノイズ 同接が化ける 時間が戻る 文字が崩れる はっきり］
404：みつけた
［おかしく 2 埋め尽くす あなた 言葉=みつけた］
［おかしく 終わり 全部消える］`],
['見てる（最後にあなたへ）',{題:'おやすみ配信',同接:'88',時間:'2:13:00',背景:'sil_live3',速さ:'ゆっくり'},`ゆう：まだ起きてる
shiro：ねむい
nanashi：おやすみ〜
［おかしく 1 あなた］
k：ねえ
通りすがり：画面のまえの
［おかしく 2 文字が踊る 言葉=みてるよ］`]]};
EDT['流れるコメント']={text:1,presets:FLP,
  sets:[['題','配信のタイトル'],['同接','同接（はじめの数）'],['時間','配信時間（はじめ）'],['背景','背景',[['','（なし）'],['sil_live1','シルエット：部屋（窓・夜景）'],['sil_live2','シルエット：部屋（マイク）'],['sil_live3','シルエット：部屋（スマホ）'],['hs_live16','横の配信：マイクの前']]],['速さ','流れる速さ',[['','ふつう'],['ゆっくり','ゆっくり'],['急増','急増']]]],
  hint:'1行に1つ。「名前：本文」、「¥1,000 名前：本文」でスパチャ。段階は「［おかしく 1 同接が化ける 変な人］」のように1行で書くと、そこから様子がおかしくなります（下のカードでも選べます）。言葉=… で文字が集まってその言葉に、切り抜き で新聞の切り抜き文字に。'};
const DIP={'日記':[
['ふつうの日記',{日付:'10月30日（木）',天気:'くもり',紙:'クリーム'},`今日は、駅前のパン屋さんが閉店すると知った。
メロンパン、もう食べられないのかな。
明日、最後に買いに行こう。［ハート］`],
['送れなかった気持ち',{日付:'2月14日（土）',天気:'雪',紙:'白',速さ:'ゆっくり'},`ずっと言えなかった。
[[好きです]]
［間］
[[会いたい]]元気にしてるかな。
**好きでした。**
((もう遅いのかな))［しみ］`],
['日記がおかしくなる（ホラー）',{日付:'8月13日',天気:'？',紙:'方眼'},`今日も、あの部屋の夢を見た。
目が覚めると、ノートが開いていた。
わたしの字で、知らないことが書いてある。
((だれ？))
［崩れる 言葉=おもいだして 切り抜き］`]]};
EDT['日記']={text:1,presets:DIP,
  sets:[['日付','日付'],['天気','天気'],['紙','紙',[['白','白'],['クリーム','クリーム'],['方眼','方眼']]],['ペン','書く道具',[['鉛筆','鉛筆'],['黒','ペン（黒）'],['青','ペン（青）'],['赤','ペン（赤）']]],['消し跡','紙の消し跡のよごれ',[['','あり'],['なし','なし']]],['速さ','書く速さ',[['','ふつう'],['ゆっくり','ゆっくり'],['速い','速い']]]],
  hint:'1行ずつ書きます。[[消す]] で書いたあと消しゴムで消す（うっすら跡が残る）、~~消す~~ で線で消す、**強く** で筆圧強め、((震える)) で震えた字、［間］ で手が止まる、［しみ］ で涙のしみ、［ハート］［星］［ぐるぐる］ で落書き。1行で ［崩れる 言葉=… 切り抜き］ と書くと、それまでの文字が踊って崩れ、集まってその言葉になります。'};
/* 編集画面のプレビューで動かす：▶ 再生・■ 止める・段階ボタン・🔈 */
let PVSOUND=false;
function pvPlayBar(pv,el,play,stages){const bar=document.createElement('div');bar.className='pvbar';
  bar.innerHTML=`<button type="button" data-p="play">▶ 再生</button><button type="button" data-p="stop">■ 止める</button>${stages?stages.map((s,i)=>`<button type="button" data-s="${i}">${esc(s)}</button>`).join(''):''}<button type="button" data-p="snd" class="snd">${PVSOUND?'🔊':'🔈'}</button>`;
  pv.prepend(bar);
  bar.onclick=e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();if(pv._ctl){pv._ctl.kill();pv._ctl=null}
    if(b.dataset.p==='snd'){PVSOUND=!PVSOUND;b.textContent=PVSOUND?'🔊':'🔈';if(PVSOUND)try{audioInit()}catch(err){}return}
    if(b.dataset.p==='stop')return;
    const ctl=miniCtx();ctl.quiet=!PVSOUND;pv._ctl=ctl;bar.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
    play(ctl,b.dataset.s!=null?+b.dataset.s:null)}}
EDT['流れるコメント'].play=(pv,a,o)=>{const el=pv.querySelector('.flw');if(!el)return;flBind(el);const n=o.rows.filter(r=>/^［おかしく/.test(r[0].trim())).length;
  pvPlayBar(pv,el,(ctl,s)=>flwPlay(el,a,ctl,s==null||s===0?{upto:s===0?0:undefined}:{upto:s}),['ふつう',...Array.from({length:n},(_,i)=>`段階${i+1}`)])};
EDT['日記'].play=(pv,a,o)=>{const el=pv.querySelector('.dia');if(!el)return;pvPlayBar(pv,el,ctl=>diaPlay(el,a,ctl))};
/* 段階のカード：チェックで選ぶと、本文の段階の行が書き換わる */
EDT['流れるコメント'].extra=(pane,o,done,render)=>{
  const box=hEl('div','flst','<b>段階（様子がおかしくなる）</b>');
  o.rows.forEach((r,i)=>{const s=flParse([r[0]])[0];if(!s||s.t!=='s')return;
    const card=hEl('div','flcard',`<div class="fh"><em>${esc(s.lab||'段階')}</em><span>（${i+1}行目）</span><button type="button" data-x="up">▲</button><button type="button" data-x="dn">▼</button><button type="button" data-x="del">✕</button></div>`);
    const chips=hEl('div','flchips');FLALL.concat(['はっきり']).forEach(k=>{const on=k==='はっきり'?s.strong:s.fx.includes(k);const b=hEl('button',on?'on':'',esc(k));b.type='button';b.onclick=()=>{
      if(k==='はっきり')s.strong=!s.strong;else if(on)s.fx=s.fx.filter(x=>x!==k);else s.fx.push(k);r[0]=flStageLine(s);done();render()};chips.appendChild(b)});
    const w=document.createElement('input');w.type='text';w.placeholder='集まる言葉（空なら集まらない）';w.value=s.word;w.onchange=()=>{s.word=w.value.trim();r[0]=flStageLine(s);done();render()};
    card.querySelector('.fh').onclick=e=>{const b=e.target.closest('button');if(!b)return;const x=b.dataset.x;
      if(x==='del')o.rows.splice(i,1);else{const j=x==='up'?i-1:i+1;if(j<0||j>=o.rows.length)return;[o.rows[i],o.rows[j]]=[o.rows[j],o.rows[i]]}done();render()};
    card.append(chips,w);box.appendChild(card)});
  const add=hEl('button','fladd','＋ 段階を足す（いちばん下に）');add.type='button';add.onclick=()=>{const n=o.rows.filter(r=>/^［おかしく/.test(r[0].trim())).length;o.rows.push([`［おかしく ${n+1} ノイズ］`]);done();render()};
  box.appendChild(add);pane.appendChild(box)};
const flStageLine=s=>`［おかしく ${s.lab||''} ${s.fx.join(' ')}${s.word?' 言葉='+s.word:''}${s.strong?' はっきり':''}］`.replace(/ +/g,' ').replace(' ］','］');
/* ===== エラー演出（共通の部品）：システム窓・関係の窓の中に段階の行を入れる =====
   ［エラー 1 グリッチ ノイズ ジジッ］［エラー 2 赤 文字化け 暴走］［エラー 3 黒 乗っ取り］［エラー 4 解放］［エラー 終わり 元に戻る／黒のまま／強制終了］
   乱れるのは窓の中だけ。文字化けは「元に戻る」で読める文に戻る。動きを減らす設定の端末では、ほぼ止めて見せる */
const ERX={'ずれ':'グリッチ','砂嵐':'ノイズ','化ける':'文字化け','数字':'暴走','数字の暴走':'暴走','警告':'赤','侵食':'黒','黒システム':'黒','ACCESS':'解放','解除':'解放','戻る':'元に戻る','強制':'強制終了'};
const ERALL=['グリッチ','ノイズ','文字化け','暴走','赤','黒','乗っ取り','解放','ジジッ','ザザッ','元に戻る','黒のまま','強制終了'];
const erParse=l=>{const m=l.trim().match(/^［エラー[\s　]*(.*)］$/);if(!m)return null;const o={lab:'',fx:[],str:''};
  m[1].split(/[\s　]+/).filter(Boolean).forEach(x=>{if(/^(\d+|終わり|最後)$/.test(x))o.lab=x;else if(/^強さ[=＝]/.test(x))o.str=x.replace(/^強さ[=＝]/,'');else o.fx.push(ERX[x]||x)});return o};
const erLine=s=>`［エラー ${s.lab||''} ${s.fx.join(' ')}${s.str?' 強さ='+s.str:''}］`.replace(/ +/g,' ').replace(' ］','］');
const RDM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const ERCOL={赤:['#ff6b6b','#260c12','#ffe3e3'],黒:['#bdbdbd','#09090b','#e6e6e6']};
async function erStage(el,s,w){
  const box=el.querySelector('.wbox,.rbox')||el,hd=el.querySelector('.wh b,.rhd b'),k=Math.max(.2,Math.min(1,(parseFloat(s.str)||65)/100)),calm=RDM();
  if(!el._er)el._er={vars:['--wc','--wbg','--wfg'].map(v=>[v,el.style.getPropertyValue(v)]),hd:hd&&hd.textContent,txt:[]};
  const say=async t=>{const o=document.createElement('div');o.className='erono';o.textContent=t;box.appendChild(o);w.sfx('crackle',.08,.25*k);await w.wait(900);o.remove()};
  const shown=()=>[...el.querySelectorAll('.wl:not(.wpend):not(.k-err),.rrow:not(.rpend)')];
  for(const f of s.fx){if(w.dead)return;
    if(f==='ジジッ'||f==='ザザッ'){/* 文字は出さず、乱れだけ：一瞬ノイズが走って、窓がぶれる */el.classList.add('eg-nz');if(!calm)box.animate([{transform:'none',filter:'none'},{transform:'translateX(-4px) skewX(-3deg)',filter:'contrast(1.6) brightness(1.3)'},{transform:'translateX(3px)',filter:'none'},{transform:'none'}],{duration:320,iterations:2});w.sfx('crackle',.08,.25*k);vib([15,25,15]);if(!await w.wait(700))return;if(!s.fx.includes('ノイズ'))el.classList.remove('eg-nz')}
    else if(f==='グリッチ'){el.classList.add('eg-gl');el.style.setProperty('--egk',k);if(!calm){box.animate([{transform:'translateX(0)'},{transform:`translateX(${-8*k}px)`,filter:'drop-shadow(3px 0 #f0f) drop-shadow(-3px 0 #0ff)'},{transform:`translateX(${6*k}px)`},{transform:'none'}],{duration:260});vib([20,30,20])}w.sfx('crackle',.05,.2*k)}
    else if(f==='ノイズ'){el.classList.add('eg-nz')}
    else if(f==='文字化け'){shown().slice(-4).forEach(r=>{r.querySelectorAll('b,em,.rv,.rsym').forEach(x=>{if(!x.dataset.er){x.dataset.er=x.innerHTML;el._er.txt.push(x)}x.textContent=pick(['███%','▒▒▒▒▒','？？？','E̷R̸R̴O̶R̵','■■■■'])})});w.sfx('crackle',.06,.3*k)}
    else if(f==='暴走'){const r=shown().reverse().find(x=>/\d+(\.\d+)?%/.test(x.textContent));if(r){const t=[...r.querySelectorAll('b,em,.rv')].find(x=>/\d+%/.test(x.textContent))||r;if(!t.dataset.er){t.dataset.er=t.innerHTML;el._er.txt.push(t)}
      let v=parseFloat(t.textContent.match(/(\d+(?:\.\d+)?)%/)[1]);const bar=r.querySelector('i>b,.rbar>b');for(const n of [100,101,108,127,'███']){if(typeof n==='number'&&n<v)continue;t.textContent=t.textContent.replace(/(\d+(?:\.\d+)?|███)%/,n+'%');if(bar)bar.style.width=Math.min(100,typeof n==='number'?n:100)+'%';r.classList.add('over');w.sfx('tick',.25);if(!await w.wait(320))return}}}
    else if(f==='赤'||f==='黒'){const [c1,c2,c3]=ERCOL[f];el.style.setProperty('--wc',c1);el.style.setProperty('--wbg',c2);el.style.setProperty('--wfg',c3);el.classList.remove('eg-red','eg-black');el.classList.add(f==='赤'?'eg-red':'eg-black');w.sfx(f==='赤'?'warn':'rumble');if(f==='赤')vib([60,40,60])}
    else if(f==='乗っ取り'){if(hd)hd.textContent='◈ UNKNOWN SYSTEM ◈';el.classList.add('eg-black');await say('……見つけた。')}
    else if(f==='解放'){el.querySelectorAll('.rrow.hide').forEach(r=>{r.classList.remove('hide');r.animate([{opacity:.2,filter:'blur(3px)'},{opacity:1,filter:'none'}],{duration:700})});const o=document.createElement('div');o.className='erono ok';o.textContent='ACCESS GRANTED';box.appendChild(o);w.sfx('pling');await w.wait(1100);o.remove()}
    else if(f==='元に戻る'){el.classList.remove('eg-gl','eg-nz','eg-red','eg-black');el._er.vars.forEach(([v,x])=>x?el.style.setProperty(v,x):el.style.removeProperty(v));if(hd&&el._er.hd!=null)hd.textContent=el._er.hd;
      el._er.txt.forEach(x=>{x.innerHTML=x.dataset.er;delete x.dataset.er});el._er.txt=[];el.querySelectorAll('.over').forEach(x=>x.classList.remove('over'));w.sfx('pling')}
    else if(f==='黒のまま'){el.classList.remove('eg-gl','eg-nz');el.classList.add('eg-black')}
    else if(f==='強制終了'){const o=document.createElement('div');o.className='erono end';o.textContent='CONNECTION LOST';box.appendChild(o);w.sfx('thud');if(!await w.wait(1200))return;
      el.animate([{transform:'none',opacity:1},{transform:'scaleY(.03)',opacity:1,offset:.6},{transform:'scaleY(.03) scaleX(0)',opacity:0}],{duration:calm?200:700,fill:'forwards'});
      el._er.txt.forEach(x=>{x.innerHTML=x.dataset.er;delete x.dataset.er});
      const n=document.createElement('p');n.className='erlost';n.textContent='■■■■■■■■■■　……';el.after(n);return}
    if(!await w.wait(240))return}
  if(!await w.wait(500))return}

/* ===== 関係・感情（好感度）：記号・数値・併用。マイナスや ？？？・ERROR・∞ も =====
   ［関係 見た目=ファンタジー／乙女／令嬢／黒 表示=記号／数値／併用 記号=♥／★／◆／⚠ 最大=5 題=… 名前=… 肩書=… 番号=… 関係=…］
   1行＝「好感度：60%｜前=40%」「敵意：-80%｜状態=敵対」「忠誠度：★★★★☆」「真の好感度：98%｜隠し」「通知：…」「フラグ：破滅フラグ｜危険」「人物：名前｜肩書｜好感度=60%｜関係=友好」 */
BLOCKS.add('関係');
const SYMP={'♥':['♥','♡'],'❤':['♥','♡'],'★':['★','☆'],'☆':['★','☆'],'◆':['◆','◇'],'◇':['◆','◇'],'⚠':['⚠','・']};
const RLOOK={'ファンタジー':['#7cc4ff','rgba(11,22,40,.92)','#d9ecff'],'乙女':['#e0708f','#fff4f7','#5a2a3a'],'令嬢':['#a3122a','#fbf6ea','#3a2a1a'],'黒':['#c9c9d1','#0a0a0d','#e6e6e6']};
const relSplit=v=>{const kv={},o=[];v.split('｜').forEach((p,i)=>{if(!i){o.push(p);return}const j=p.indexOf('=');if(j>0)kv[p.slice(0,j).trim()]=p.slice(j+1).trim();else kv[p.trim()]=1});return[o[0].trim(),kv]};
function relVal(v){v=String(v||'').trim();let m;
  if((m=v.match(/^([♥♡★☆◆◇⚠・❤()（）\s]+?)\s+([+\-−]?\d.*)$/)))return{...relVal(m[2]),sym:m[1].trim()};
  if(/^[♥♡★☆◆◇⚠・❤()（）\s]+$/.test(v))return{sym:v};
  if((m=v.match(/^([+\-−]?\d+(?:\.\d+)?)\s*(%|pt|ポイント)?(?:\s*[\/／]\s*(\d+))?$/)))return{n:parseFloat(m[1].replace('−','-')),unit:m[2]||'',of:m[3]?+m[3]:null,plus:m[1].startsWith('+')};
  return{sp:v}}
const relFmt=(r,n)=>`${r.plus&&n>=0?'+':''}${Number.isInteger(r.n)?Math.round(n):n.toFixed(1)}${r.of?' / '+r.of:r.unit}`;
function relSyms(r,a,ratio){const base=(a.記号&&SYMP[a.記号])||SYMP[r.sym?[...r.sym].find(c=>SYMP[c])||'♥':'♥'],max=+a.最大||5;
  if(r.sym&&r.n==null)return r.sym.replace(/\s+/g,'');const f=ratio<0?0:Math.round(ratio*max);return base[0].repeat(Math.min(max,f))+base[1].repeat(Math.max(0,max-f))}
function relRatio(r){if(r.n==null)return null;return r.of?r.n/r.of:r.n/100}
/* 1行のゲージ（関係の窓・システム窓の両方で使う） */
function relGauge(name,val,a,kv={}){const r=relVal(val),mode=a.表示||(a.見た目==='乙女'?'併用':'数値'),ratio=relRatio(r),neg=ratio!=null&&ratio<0,sp=r.sp||'';
  const spc=/？|\?/.test(sp)?'unk':/ERROR|エラー/i.test(sp)?'err':/∞|上限突破/.test(sp)?'over':/LOCKED|ロック/i.test(sp)?'lock':/測定不能|解析不能/.test(sp)?'unk':'';
  const pr=kv.前?relVal(kv.前):null;
  const sym=(mode!=='数値'&&(ratio!=null||r.sym))?`<span class="rsym">${esc(relSyms(r,a,ratio??0))}</span>`:'';
  const num=r.n!=null&&mode!=='記号'?`<em class="rv">${esc(relFmt(r,r.n))}</em>`:sp?`<em class="rv sp ${spc}">${spc==='lock'?'🔒 ':''}${esc(sp)}</em>`:'';
  const bar=r.n!=null&&mode==='数値'?`<i class="rbar${neg?' neg':''}"><b style="width:${Math.min(100,Math.abs(ratio)*100)}%"></b></i>`:spc==='over'&&mode==='数値'?'<i class="rbar"><b style="width:100%"></b></i>':'';
  return`<div class="rrow rg${neg?' neg':''}${spc?' '+spc:''}${kv.隠し?' hide':''}" data-v="${r.n??''}" data-p="${pr&&pr.n!=null?pr.n:''}" data-raw="${esc(val)}"><span class="rn">${esc(name)}</span><span class="rvals">${sym}${num}${kv.状態?`<small class="rst">${esc(kv.状態)}</small>`:''}</span>${bar}${kv.隠し?'<span class="rhid">？？？</span>':''}</div>`}
const relIsGauge=v=>{const r=relVal(v);return(r.n!=null&&(r.unit==='%'||r.of))||!!r.sym||/^(？？？|\?\?\?|ERROR|∞|LOCKED|上限突破|測定不能)$/.test(String(v).trim())};
BR['関係']=(a,L)=>{const look=RLOOK[a.見た目]||RLOOK['ファンタジー'],[c1,c2,c3]=look;
  const rows=L.filter(l=>l.trim()).map(l=>{const t=l.trim();if(/^［エラー/.test(t)){const s=erParse(t);return`<div class="rrow rpend k-err" data-e="${esc(JSON.stringify(s))}"></div>`}
    if(/^[━─ー＝=]{3,}$/.test(t))return'<div class="rrow rhr"></div>';
    if(/^［.*］$/.test(t))return`<div class="rrow rsys${/警告|ERROR|失敗|危険|破損/.test(t)?' warn':''}">${esc(t)}</div>`;
    const i=t.indexOf('：');if(i<0)return`<div class="rrow rp">${esc(t)}</div>`;
    const k=t.slice(0,i).trim(),[v,kv]=relSplit(t.slice(i+1));
    if(k==='通知')return`<div class="rrow rnote${/低下|減少|警告|突破|ERROR|嫌悪|敵/.test(v)?' bad':''}">${esc(v)}</div>`;
    if(k==='フラグ')return`<div class="rrow rflag${kv.危険?' dang':kv.解放?' open':''}"><span>${kv.危険?'⚠':kv.解放?'✦':'⚑'} ${esc(v)}</span></div>`;
    if(k==='人物'){const [nm,role]=[v,Object.keys(kv).find(x=>kv[x]===1)||''];const g=Object.entries(kv).filter(([x,y])=>y!==1&&x!=='関係');
      return`<div class="rrow rperson"><b>${esc(nm)}</b>${role?`<small>${esc(role)}</small>`:''}${kv.関係?`<span class="rbadge">${esc(kv.関係)}</span>`:''}${g.map(([x,y])=>relGauge(x,y,{...a,表示:a.表示||'併用'})).join('')}</div>`}
    if(relIsGauge(v))return relGauge(k,v,a,kv);
    return`<div class="rrow rkv"><span class="rn">${esc(k)}</span><b>${esc(v)}</b></div>`}).join('');
  const deco=a.題||({乙女:'♡ LOVE STATUS ♡',令嬢:'❦ FATE & AFFECTION ❦',黒:'◉ HIDDEN EMOTION',ファンタジー:'◇ RELATIONSHIP ANALYSIS ◇'})[a.見た目||'ファンタジー'];
  return`<div class="blk rel t-${esc(a.見た目||'ファンタジー')}" data-fx="関係" data-a="${encA(a)}" style="--wc:${c1};--wbg:${c2};--wfg:${c3}"><div class="rbox"><div class="rhd"><b>${esc(deco)}</b></div>
    ${a.名前?`<div class="rwho">${a.番号?`<small>${esc(a.番号)}</small>`:''}<b>${esc(a.名前)}</b>${a.肩書?`<span>${esc(a.肩書)}</span>`:''}${a.関係?`<em class="rbadge">${esc(a.関係)}</em>`:''}</div>`:''}
    <div class="rbody">${rows}</div></div></div>`};
async function relRun(el,a,c){const W={wait:ms=>c.wait(ms),sfx:(k,...x)=>{if(!c.quiet&&!S.pvMute&&SFX[k])try{SFX[k](...x)}catch(e){}},get dead(){return c.dead}};
  el.style.opacity=1;el.animate([{opacity:0,transform:'translateY(8px) scale(.98)'},{opacity:1,transform:'none'}],{duration:500,easing:'ease-out'});W.sfx('pling');if(!await c.wait(450))return;
  for(const r of el.querySelectorAll('.rrow')){if(c.dead)return;
    if(r.classList.contains('k-err')){if(c._upto&&+r.dataset.si>=c._upto)c.k=1;await erStage(el,JSON.parse(r.dataset.e),W);continue}
    r.classList.remove('rpend');r.animate([{opacity:0,transform:'translateX(-6px)'},{opacity:1,transform:'none'}],{duration:280});
    if(r.classList.contains('rnote')){W.sfx(r.classList.contains('bad')?'warn':'pling');if(r.classList.contains('bad'))vib([40,30,40]);if(!await c.wait(700))return;continue}
    if(r.classList.contains('rflag')&&r.classList.contains('dang')){W.sfx('warn');r.animate([{background:'rgba(255,0,0,.35)'},{background:'transparent'}],{duration:900})}
    if(r.classList.contains('rg'))await relGrow(r,a,W);
    if(!await c.wait(160))return;keepBottom()}}
/* 前の値 → 今の値：数字が動き、バーが伸び、記号が1つずつ満ちる（減るときは欠ける） */
async function relGrow(r,a,W){const to=r.dataset.v===''?null:+r.dataset.v,from=r.dataset.p===''?null:+r.dataset.p,b=r.querySelector('.rbar b'),ev=r.querySelector('.rv'),sy=r.querySelector('.rsym');
  if(r.classList.contains('unk')||r.classList.contains('err')){W.sfx('crackle',.04,.12)}
  if(to==null){if(b)b.animate([{width:'0%'},{width:b.style.width}],{duration:800,easing:'ease-out'});return}
  const rr=relVal(r.dataset.raw),of=rr.of||100,st=from??0,steps=14,down=from!=null&&to<from;
  if(from!=null&&sy)sy.textContent=relSyms(rr,a,st/of);
  for(let i=1;i<=steps;i++){const v=st+(to-st)*i/steps;if(ev)ev.textContent=relFmt(rr,i===steps?to:v);if(b)b.style.width=Math.min(100,Math.abs(v/of)*100)+'%';
    if(sy)sy.textContent=relSyms(rr,a,v/of);if(i%4===0)W.sfx('tick',.12);if(!await W.wait(from!=null?55:30))return}
  if(from!=null){W.sfx(down?'thud':'pling');r.classList.add(down?'down':'up');sy&&sy.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'none'}],{duration:400});if(down)vib(40)}}
D['関係']={prep(el){el.style.opacity=0;el.querySelectorAll('.rrow').forEach(r=>r.classList.add('rpend'))},still(el){},run(el,a,c){return relRun(el,a,c)}};
TPL['関係']={block:1,attrs:[['見た目'],['表示'],['記号'],['最大'],['題'],['名前'],['肩書'],['番号'],['関係']],parse:l=>[l],fmt:r=>r[0]};
TPNAME['関係']='関係・感情（好感度）';

/* ===== 文例 ===== */
const RLP={'ファンタジー・関係':[
['仲間の信頼度',{見た目:'ファンタジー',名前:'カイル',肩書:'剣士 / パーティーメンバー',関係:'仲間'},`［関係性を解析しました。］
信頼度：72%｜前=58%
親密度：45%
警戒度：12%
現在の感情：安心
通知：カイルの信頼度が14上昇しました！`],
['主従の忠誠度',{見た目:'ファンタジー',題:'◇ LOYALTY STATUS ◇',名前:'エリオット',肩書:'専属騎士',関係:'主従'},`忠誠度：★★★★★
忠誠度：100%｜前=92%
主への崇拝：98%
通知：［忠誠の誓い］が成立しました。
フラグ：専属騎士の誓約｜解放`],
['敵の敵意・殺意',{見た目:'ファンタジー',題:'⚠ HOSTILITY ANALYSIS ⚠',名前:'黒狼の首領',肩書:'討伐対象',関係:'敵対'},`敵意：-80%｜状態=敵対
殺意：92%
警戒度：88%
恐怖：14%
通知：［警告！］対象の殺意が上昇しています。`],
['ギルド・NPCの友好度',{見た目:'ファンタジー',題:'◇ REPUTATION ◇',表示:'併用',記号:'★'},`人物：ギルドマスター｜冒険者ギルド｜友好度=82%｜関係=友好
人物：宿屋の女将｜NPC｜友好度=60%｜関係=常連
人物：王国騎士団長｜王族直属｜評価=35%｜関係=中立
人物：闇商人｜裏社会｜友好度=-40%｜関係=警戒`],
['鑑定スキルで感情を読む',{見た目:'ファンタジー',題:'◇ SKILL：感情鑑定 ◇',名前:'リオ',肩書:'謎の少年'},`［スキル《感情鑑定》を発動しました。］
好感度：35%
警戒度：64%
恐怖：40%
現在の感情：困惑
隠し感情：？？？
通知：一部の感情は鑑定できませんでした。`]],
'乙女ゲーム・好感度':[
['攻略対象の好感度',{見た目:'乙女',番号:'攻略対象 No.01',名前:'レオンハルト',肩書:'王国第一王子 / 個別ルート未解放',表示:'併用',記号:'♥'},`好感度：60%｜前=40%
信頼度：★★★★☆
通知：レオンハルトの好感度が上昇しました！
通知：次のイベントを確認してください`],
['攻略対象一覧',{見た目:'乙女',題:'♡ CAPTURE TARGETS ♡',表示:'併用'},`人物：レオンハルト｜王国第一王子｜好感度=60%｜関係=知人
人物：カシス｜騎士団長｜好感度=-50%｜関係=嫌悪
人物：ノア｜宮廷魔術師｜好感度=85%｜関係=友人
人物：？？？｜隠し攻略対象｜好感度=0%｜関係=未解放`],
['悪役令嬢の破滅フラグ',{見た目:'令嬢',名前:'エリザベート',肩書:'公爵令嬢（悪役令嬢）'},`王太子の好感度：-30%｜状態=嫌悪
婚約者の評価：12%
フラグ：婚約破棄フラグ｜危険
フラグ：破滅フラグ｜危険
通知：［警告］このままではバッドエンドです。`],
['TRUE END 解放',{見た目:'乙女',名前:'ノア',肩書:'宮廷魔術師',表示:'併用'},`好感度：100%｜前=95%
信頼度：★★★★★
フラグ：TRUE END｜解放
通知：すべての条件を満たしました。
通知：TRUE END ルートが解放されました！`]],
'黒システム・感情':[
['表示と真の好感度',{見た目:'黒',名前:'レオンハルト'},`表示好感度：60%
真の好感度：98%｜隠し
執着度：ERROR
［対象の感情が正常に測定できません。］
［エラー 1 ジジッ グリッチ］
［エラー 2 解放］
［隠された情報が解放されました。］`],
['執着度が上限突破（ヤンデレ）',{見た目:'黒',名前:'ルシアン',肩書:'幼なじみ'},`好感度：95%｜前=80%
執着度：◆◆◆◆◇
［好感度が上昇しました！］
［エラー 1 ジジッ 暴走 赤］
［警告！］
［対象の執着度が上限を突破しました。］
特殊感情：執着
執着度：測定不能`]]};
EDT['関係']={text:1,presets:RLP,
  sets:[['見た目','見た目',[['ファンタジー','ファンタジー（青いシステム）'],['乙女','乙女ゲーム（白・ピンク・金）'],['令嬢','悪役令嬢（アイボリー・金・深紅）'],['黒','黒システム（隠し感情）']]],['表示','表し方',[['','おまかせ'],['記号','記号だけ'],['数値','数値とバー'],['併用','記号と数値']]],['記号','記号',[['','おまかせ'],['♥','♥♡'],['★','★☆'],['◆','◆◇'],['⚠','⚠']]],['最大','記号の数（最大）',[['','5'],['3','3'],['10','10']]],['題','いちばん上の文字'],['名前','名前'],['肩書','身分・肩書'],['番号','番号（攻略対象 No.01 など）'],['関係','現在の関係（敵対・中立・友好・主従・仲間など）']],
  hint:'1行ずつ。「好感度：60%｜前=40%」（上がる動き）、「敵意：-80%｜状態=敵対」（マイナスは赤）、「忠誠度：★★★★☆」、「真の好感度：98%｜隠し」（エラーの「解放」で見える）、「執着度：ERROR／？？？／∞／LOCKED／測定不能」。「通知：…」「フラグ：破滅フラグ｜危険」「人物：名前｜肩書｜好感度=60%｜関係=友好」（一覧）。［エラー 1 グリッチ 赤］の行でエラー演出。項目名は自由です。'};
EDT['関係'].play=(pv,a,o)=>pvRun(pv,'関係',a,o,'エラー');
EDT['関係'].extra=(pane,o,done,render)=>stageCards(pane,o,done,render,'エラー',erParse,erLine,ERALL,'エラーの段階（システム画面の中だけ乱れる）');
/* システム窓にも：▶ 再生とエラーの段階カード */
EDT['窓'].play=(pv,a,o)=>pvRun(pv,'窓',a,o,'(?:エラー|(?:鑑定|制限)[\\s　])');
EDT['窓'].extra=(pane,o,done,render)=>{stageCards(pane,o,done,render,'エラー',erParse,erLine,ERALL,'エラーの段階（システム画面の中だけ乱れる）');
  if(o.rows.some(r=>apParse(String(r[0]))||APFLAG.test(String(r[0]))))stageCards(pane,o,done,render,'鑑定',apParse,apLine,APALL,'鑑定・制限の段階（看破・解放・封鎖など）')};
const ERP=[
['好感度解析エラー',{色:'青',形:'近未来'},`╔════════════════════════╗
AFFECTION ERROR
╚════════════════════════╝
［対象の好感度を解析しています……］
好感度：75%
［エラー 1 ジジッ グリッチ ノイズ］
好感度：███%
執着度：ERROR
［エラー 2 赤 文字化け］
［警告！］
［対象の感情情報が破損しています。］
［解析に失敗しました。］
［エラー 終わり 元に戻る］`],
['シナリオ崩壊',{色:'青'},`╔════════════════════════╗
SCENARIO ERROR
╚════════════════════════╝
［シナリオを確認しています……］
現在のルート：王太子ルート
シナリオ進行率：82%
［エラー 1 ザザッ グリッチ 暴走］
［ERROR！］
シナリオ整合率：0.00%
［予定されていない分岐が発生しました。］
［シナリオの修正を試みています……］
［エラー 2 赤 ノイズ］
［修正失敗。］`],
['システム侵食・乗っ取り',{色:'青'},`╔════════════════════════╗
SYSTEM STATUS
╚════════════════════════╝
［接続を確認しています……］
SYSTEM STATUS：NORMAL
［エラー 1 ジジッ グリッチ ノイズ］
SYSTEM STATUS：ERROR
［不明なアクセスを検出しました。］
［管理権限が変更されました。］
管理者：■■■■■■
［エラー 2 黒 乗っ取り 強さ=90］
［警告！］
［システムの制御権限が失われました。］
［UNKNOWN SYSTEM CONNECTED］
［エラー 終わり 黒のまま］`],
['好感度上限突破',{色:'青'},`╔════════════════════════╗
AFFECTION OVERFLOW
╚════════════════════════╝
［好感度が上昇しました！］
好感度：95% → 100%
［最大値に到達しました。］
［エラー 1 ジジッ 暴走 グリッチ］
［警告！］
［好感度が測定可能な上限を突破しました。］
［新しい感情を検出しました。］
［エラー 2 赤］
特殊感情：執着
執着度：測定不能`],
['隠し情報の解放',{色:'青'},`╔════════════════════════╗
HIDDEN DATA
╚════════════════════════╝
［対象情報を確認しています……］
名前：レオンハルト
好感度：10%
隠し感情：？？？
［エラー 1 ザザッ グリッチ 文字化け］
［情報の隠蔽を検出しました。］
［解析権限を更新しています……］
［エラー 2 解放 元に戻る］
━━━━━━━━━━━━━━━━
真の好感度：98%
隠し感情：執着
危険度：S
［隠された情報が解放されました。］`],
['システム強制終了',{色:'赤'},`╔════════════════════════╗
CRITICAL ERROR
╚════════════════════════╝
［致命的なエラーが発生しました。］
［エラー 1 ジジッ グリッチ ノイズ 強さ=90］
［システムを復旧しています……］
復旧率：12%
復旧率：47%
復旧率：83%
復旧率：ERROR
［エラー 2 文字化け］
［復旧に失敗しました。］
［システムを強制終了します。］
［エラー 終わり 強制終了］`]];
WINP['システムエラー']=ERP;

/* 編集画面：▶ 再生・段階ボタン（どのテンプレートにも使える） */
function pvRun(pv,k,a,o,tag){const el0=pv.querySelector(`[data-fx="${k}"]`);if(!el0)return;const re=new RegExp('^［'+tag);const n=o.rows.filter(r=>re.test(String(r[0]).trim())).length;
  pvPlayBar(pv,el0,(ctl,s)=>{const t=o.t,L=o.rows.map((r,i)=>t.fmt(r,i)),cur=pv.querySelector(`[data-fx="${k}"]`),tmp=document.createElement('div');tmp.innerHTML=BR[k](a,L);const ne=tmp.firstElementChild;cur.replaceWith(ne);pv.querySelectorAll('.erlost').forEach(x=>x.remove());
    S.pvMute=ctl.quiet;const kill=ctl.kill;ctl.kill=()=>{S.pvMute=false;kill()};
    Object.assign(ctl,{skip:false,on(fn){const k2=ctl.kill;ctl.kill=()=>{try{fn()}catch(e){}k2()}},layer(){return document.createElement('div')}});
    if(s){ctl.k=.03;ne.querySelectorAll('.k-err,.k-aps').forEach((e,i)=>{e.dataset.si=i+1});ctl._upto=s}
    const d=D[k];d.prep&&d.prep(ne,a,ctl);Promise.resolve(d.run(ne,a,ctl)).then(()=>{S.pvMute=false})},n?['はじめ',...Array.from({length:n},(_,i)=>`段階${i+1}`)]:null)}
/* 段階のカード（流れるコメント・エラーで共通） */
function stageCards(pane,o,done,render,tag,parse,fmt,ALL,title){const box=hEl('div','flst',`<b>${esc(title)}</b>`);
  o.rows.forEach((r,i)=>{const s=parse(String(r[0]));if(!s)return;
    const card=hEl('div','flcard',`<div class="fh"><em>${esc(s.lab||'段階')}</em><span>（${i+1}行目）</span><button type="button" data-x="up">▲</button><button type="button" data-x="dn">▼</button><button type="button" data-x="del">✕</button></div>`);
    const chips=hEl('div','flchips');ALL.forEach(k=>{const on=s.fx.includes(k);const b=hEl('button',on?'on':'',esc(k));b.type='button';b.onclick=()=>{if(on)s.fx=s.fx.filter(x=>x!==k);else s.fx.push(k);r[0]=fmt(s);done();render()};chips.appendChild(b)});
    card.querySelector('.fh').onclick=e=>{const b=e.target.closest('button');if(!b)return;const x=b.dataset.x;if(x==='del')o.rows.splice(i,1);else{const j=x==='up'?i-1:i+1;if(j<0||j>=o.rows.length)return;[o.rows[i],o.rows[j]]=[o.rows[j],o.rows[i]]}done();render()};
    card.appendChild(chips);box.appendChild(card)});
  const add=hEl('button','fladd','＋ 段階を足す（いちばん下に）');add.type='button';add.onclick=()=>{const n=o.rows.filter(r=>parse(String(r[0]))).length;o.rows.push([fmt({lab:String(n+1),fx:[ALL[0]],str:'',kv:{}})]);done();render()};
  box.appendChild(add);pane.appendChild(box)}
/* ===== コイン・報酬・ショップ（システム窓の中で使う）=====
   ページ（編集画面のプレビューは別）ごとに財布が1つ。窓の行：
   所持：2,500（「現在の保有コイン：2,500」でもよい）／獲得：1,000｜クエスト達成報酬／消費：500｜好感度情報の閲覧
   購入：上級鑑定｜1,200｜スキル（｜在庫=1｜割引=20%｜初回無料｜禁止｜LOCKED）／閲覧：500｜隠された好感度（この行より下は払うまで見えない）
   抽選：1,000｜Sランクスキル獲得券×1（結果は作家さんが決めたもの）／履歴：（取引の一覧）
   ［通貨=ゴールド 記号=💰 所持=2500］で通貨の名前と最初の残高。読者が押しても本文は変わらず、開き直すと元に戻る */
const ecoN=s=>parseInt(String(s||'0').replace(/[^\d\-]/g,''))||0,ecoF=n=>Math.round(n).toLocaleString();
const ecoRoot=el=>el.closest('.tpv')||page;
function ecoW(el,a){const r=ecoRoot(el);if(!r._w)r._w={bal:null,log:[],cur:'コイン',sym:'🪙',boot:false};const w=r._w;if(a){if(a.通貨)w.cur=a.通貨;if(a.記号)w.sym=a.記号;if(w.bal==null&&a.所持)w.bal=ecoN(a.所持)}return w}
function ecoReset(root){root._w=null}
function ecoPaint(el,from){const r=ecoRoot(el),w=r._w;if(!w)return;r.querySelectorAll('.wbal').forEach(b=>{const t=w.bal??0;if(from==null){b.textContent=`${w.sym} ${ecoF(t)}`;return}
    const st=from,d=t-st;let i=0;const tick=()=>{i++;b.textContent=`${w.sym} ${ecoF(st+d*Math.min(1,i/14))}`;if(i<14)requestAnimationFrame(tick)};tick();b.classList.remove('up','dn');void b.offsetWidth;b.classList.add(d>=0?'up':'dn')});
  r.querySelectorAll('.elog').forEach(L=>{L.innerHTML=w.log.map(x=>`<div class="${x.n>=0?'p':'m'}"><b>${x.n>=0?'+':'−'}${ecoF(Math.abs(x.n))}</b><span>${esc(x.why)}</span></div>`).join('')||'<div class="none">まだ取引はありません</div>';
    const s=L.parentElement.querySelector('.elogsum');if(s)s.textContent=`現在の保有${w.cur}：${ecoF(w.bal??0)}`})}
function ecoMove(el,n,why,fx){const w=ecoW(el);const from=w.bal??0;w.bal=from+n;w.log.push({n,why});ecoPaint(el,from);
  if(fx){const box=el.querySelector('.wbox')||el,f=document.createElement('div');f.className='efloat '+(n>=0?'p':'m');f.textContent=`${n>=0?'+':'−'}${ecoF(Math.abs(n))} ${w.cur}`;box.appendChild(f);
    f.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(-6px)',offset:.25},{opacity:0,transform:'translateY(-28px)'}],{duration:1500,easing:'ease-out'}).finished.then(()=>f.remove());
    if(!S.pvMute&&S.fx){n>=0?SFX.coin&&SFX.coin():SFX.tick&&SFX.tick(.3)}if(n>=0&&fx.c&&!el.closest('.tpv'))try{coins(fx.c,Math.min(60,10+Math.round(n/100)))}catch(e){}vib(n>=0?[20,30,20]:30)}}
const ECO_K=/^(獲得|消費|購入|閲覧|抽選|履歴|所持)\s*[：:]\s*(.*)$/;
function ecoRow(r,a,c0){const q=c0.indexOf('"'),cls=q<0?c0:c0.slice(0,q),at=q<0?'':c0.slice(q+1);const t=r.d.t,v=r.d.v,cur=a.通貨||'コイン',kv={};v.slice(1).forEach(x=>{const j=x.indexOf('=');if(j>0)kv[x.slice(0,j)]=x.slice(j+1);else kv[x]=1});
  switch(t){
    case'所持':return`<div class="${cls} e-bal"${at} data-n="${ecoN(v[0])}"><span>${esc(r.d.k||`現在の保有${cur}`)}</span><b class="wbal">${esc(a.記号||'🪙')} ${esc(v[0]||'0')}</b></div>`;
    case'獲得':case'消費':return`<div class="${cls} e-${t==='獲得'?'gain':'spend'}"${at} data-n="${ecoN(v[0])*(t==='獲得'?1:-1)}" data-why="${esc(v[1]||t)}"><span>${esc(v[1]||t)}</span><b>${t==='獲得'?'+':'−'}${esc(v[0])} ${esc(cur)}</b></div>`;
    case'購入':{const lock=/LOCKED/i.test(v[1])||kv.LOCKED,price=lock?0:ecoN(v[1]),off=kv.割引?Math.round(price*(1-parseFloat(kv.割引)/100)):price;
      return`<div class="${cls} e-buy${lock?' locked':''}${kv.禁止?' ban':''}"${at} data-name="${esc(v[0])}" data-kind="${esc(v[2]||'アイテム')}" data-n="${kv.初回無料?0:off}" data-stock="${esc(kv.在庫||'')}" data-ban="${kv.禁止?1:''}"><button type="button" class="ebtn"${lock?' disabled':''}><b>【${esc(v[0])}】</b>${v[2]?`<small>${esc(v[2])}</small>`:''}<em>${lock?'🔒 LOCKED':kv.初回無料?'<s>'+ecoF(price)+'</s> 初回無料':kv.割引?`<s>${ecoF(price)}</s> ${ecoF(off)} ${esc(cur)}`:`${ecoF(price)} ${esc(cur)}`}</em>${kv.在庫?`<i class="estock">残り${esc(kv.在庫)}</i>`:''}</button><div class="epanel"></div></div>`}
    case'閲覧':return`<div class="${cls} e-view"${at} data-n="${ecoN(v[0])}" data-what="${esc(v[1]||'情報')}"><div class="evq">［${esc(v[0])}${esc(cur)}を消費して【${esc(v[1]||'情報')}】を閲覧しますか？］</div><div class="ebtns"><button type="button" data-a="y">YES</button><button type="button" data-a="n">NO</button></div><div class="epanel"></div></div>`;
    case'抽選':return`<div class="${cls} e-draw"${at} data-n="${ecoN(v[0])}" data-prize="${esc(v[1]||'？？？')}"><div class="evq">［${esc(v[0])}${esc(cur)}で報酬を抽選しますか？］</div><div class="ebtns"><button type="button" data-a="y">YES</button><button type="button" data-a="n">NO</button></div><div class="epanel"></div></div>`;
    case'履歴':return`<div class="${cls} e-log"${at}><div class="elog"></div><div class="elogsum"></div></div>`}
  return`<div class="${cls}"${at}>${esc(r.l)}</div>`}
/* 押せるようにする（演出あり・なし、編集画面のプレビュー、どれでも） */
function ecoBind(el,a,live,c){if(el._eco)return;el._eco=1;const w=ecoW(el,a);
  el.querySelectorAll('.e-bal').forEach(b=>{if(w.bal==null)w.bal=+b.dataset.n});
  /* 「閲覧：」より下の行は、払うまで鍵 */
  el.querySelectorAll('.e-view').forEach(v=>{let n=v.nextElementSibling;while(n){if(n.classList.contains('e-view'))break;n.classList.add('elock');n=n.nextElementSibling}});
  if(!live)el.querySelectorAll('.e-gain,.e-spend').forEach(g=>{if(!g._done){g._done=1;ecoMove(el,+g.dataset.n,g.dataset.why,null)}});
  ecoPaint(el);
  const say=(p,html,bad)=>{p.innerHTML=html;p.classList.toggle('bad',!!bad);p.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:240});if(bad){p.animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:260});SFX.warn&&!S.pvMute&&SFX.warn();vib([40,30,40])}};
  const short=(p,need)=>{const ww=ecoW(el);say(p,`［${ww.cur}が不足しています。］<br>必要${ww.cur}：${ecoF(need)}<br>保有${ww.cur}：${ecoF(ww.bal)}<br><b>不足${ww.cur}：${ecoF(need-ww.bal)}</b>`,true)};
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!el.contains(b))return;const row=b.closest('.k-eco');if(!row)return;const p=row.querySelector('.epanel'),ww=ecoW(el),n=+row.dataset.n;
    if(row.classList.contains('e-buy')){
      if(b.classList.contains('ebtn')){if(row.dataset.ban){say(p,'［この商品は取引が禁止されています。］',true);return}if(row.classList.contains('sold')){say(p,'［在庫がありません。］',true);return}
        say(p,`<div class="econf"><div>【購入商品】${esc(row.dataset.name)}</div><div>【価格】${ecoF(n)} ${esc(ww.cur)}</div><div>【購入前残高】${ecoF(ww.bal)}</div><div>【購入後残高】<b class="${ww.bal-n<0?'neg':''}">${ecoF(ww.bal-n)}</b></div><div class="evq">［購入を確定しますか？］</div><div class="ebtns"><button type="button" data-a="y">YES</button><button type="button" data-a="n">NO</button></div></div>`);return}
      if(b.dataset.a==='n'){say(p,'［購入をキャンセルしました。］');return}
      if(b.dataset.a==='y'){if(ww.bal<n){short(p,n);return}ecoMove(el,-n,`${row.dataset.name}の購入`,{c});(ww.own||(ww.own=[])).push(row.dataset.name);
        const st=row.dataset.stock;if(st){const left=Math.max(0,+st-1);row.dataset.stock=left;const s=row.querySelector('.estock');if(s)s.textContent=left?`残り${left}`:'SOLD OUT';if(!left)row.classList.add('sold')}
        say(p,`［${ecoF(n)}${esc(ww.cur)}を消費しました。］<br><b class="ok">［${row.dataset.kind==='スキル'?'スキル':'アイテム'}【${esc(row.dataset.name)}】を${row.dataset.kind==='スキル'?'獲得':'購入'}しました！］</b><br>現在の保有${esc(ww.cur)}：${ecoF(ww.bal)}`);if(!S.pvMute&&S.fx)SFX.pling&&SFX.pling()}}
    else if(row.classList.contains('e-view')){if(row.classList.contains('paid'))return;
      if(b.dataset.a==='n'){say(p,'［情報閲覧をキャンセルしました。］');return}
      {const un=[...el.querySelectorAll('.k-chk.off')];if(un.length){say(p,'［解放条件を満たしていません。］<br>'+un.map(x=>'✕ '+esc(x.textContent.replace(/^✕/,'').trim())).join('<br>')+'<br>［情報閲覧が拒否されました。］',true);return}}
      if(ww.bal<n){short(p,n);say(p,p.innerHTML+'<br>［情報閲覧が拒否されました。］',true);return}
      ecoMove(el,-n,`${row.dataset.what}の閲覧`,{c});row.classList.add('paid');row.querySelectorAll('.ebtns button').forEach(x=>x.disabled=true);
      say(p,`［${ecoF(n)}${esc(ww.cur)}を消費しました。］<br>残高：${ecoF(ww.bal)}${esc(ww.cur)}<br><b class="ok">［情報のロックが解除されました！］</b>`);
      let k=0;let x=row.nextElementSibling;while(x&&!x.classList.contains('e-view')){const y=x;setTimeout(()=>{y.classList.remove('elock');y.animate([{opacity:.2,filter:'blur(4px)'},{opacity:1,filter:'none'}],{duration:500})},300+k*160);k++;x=x.nextElementSibling}}
    else if(row.classList.contains('e-draw')){if(row.classList.contains('paid'))return;
      if(b.dataset.a==='n'){say(p,'［抽選をキャンセルしました。］');return}
      if(ww.bal<n){short(p,n);return}ecoMove(el,-n,'報酬の抽選',{c});row.classList.add('paid');row.querySelectorAll('.ebtns button').forEach(x=>x.disabled=true);
      const pool=['回復ポーション×3','魔力回復薬','鑑定の巻物','Bランク装備箱','スキル獲得券（C）','？？？'];let i=0;
      say(p,'<div class="edraw">［報酬を抽選しています……］<b class="eroll"></b></div>');const r=p.querySelector('.eroll');
      const spin=setInterval(()=>{r.textContent=pool[i++%pool.length];if(!S.pvMute&&S.fx&&i%2)SFX.tick&&SFX.tick(.15)},90);
      setTimeout(()=>{clearInterval(spin);say(p,`［おめでとうございます！］<br><b class="prize">【${esc(row.dataset.prize)}】</b><br>［報酬がインベントリに追加されました。］`);if(!S.pvMute&&S.fx)SFX.pling&&SFX.pling();vib([30,40,80])},1700)}})}
/* 窓の中で行が出たとき：獲得・消費を財布に反映 */
function ecoReveal(row,el,c){if(row._done)return;if(row.classList.contains('e-gain')||row.classList.contains('e-spend')){row._done=1;ecoMove(el,+row.dataset.n,row.dataset.why,{c})}}

/* ===== 文例 ===== */
const ECOP=[
['ウォレット',{色:'青',所持:'2500'},`╔══════════════════════════╗
SYSTEM WALLET
╚══════════════════════════╝
所持：2,500
━━━━━━━━━━━━━━━━━━
累計獲得：8,000
累計消費：5,500
［ウォレット情報を表示しました。］`],
['有料情報（払って見る）',{色:'紫',所持:'2500'},`╔══════════════════════════╗
PREMIUM INFORMATION
╚══════════════════════════╝
［この情報は有料コンテンツです。］
【対象】：レオンハルト
【閲覧内容】：隠された好感度
所持：2,500
閲覧：500｜隠された好感度
━━━━━━━━━━━━━━━━━━
好感度：-47%
信頼度：2%
特殊感情：嫌悪
［情報閲覧が完了しました。］`],
['コイン不足',{色:'赤',所持:'2850'},`╔══════════════════════════╗
INSUFFICIENT FUNDS
╚══════════════════════════╝
［この先の情報には5,000コインが必要です。］
所持：2,850
閲覧：5,000｜第4章以降のシナリオ
・王国の崩壊
・攻略対象の裏切り`],
['クエスト達成報酬',{色:'青',所持:'2500'},`╔══════════════════════════╗
QUEST COMPLETE
╚══════════════════════════╝
［おめでとうございます！］
［クエストを達成しました！］
【クエスト名】：魔物を3体討伐せよ
【達成条件】：魔物討伐 3 / 3
━━━━━━━━━━━━━━━━━━
◆ 獲得報酬
経験値：+500 EXP
獲得：1,000｜クエスト達成報酬
アイテム：【回復ポーション】×3
［報酬を受け取りました。］
所持：2,500`],
['スキル獲得',{色:'青'},`╔══════════════════════════╗
SKILL ACQUIRED
╚══════════════════════════╝
［新しいスキルを獲得しました！］
◆ 上級鑑定
等級：A
分類：パッシブ
効果：対象の隠蔽情報を解析する能力が上昇する。
［スキル【上級鑑定】が登録されました。］`],
['システムショップ',{色:'青',所持:'2500'},`╔══════════════════════════╗
SYSTEM SHOP
╚══════════════════════════╝
所持：2,500
━━━━━━━━━━━━━━━━━━
◆ ITEM SHOP
購入：回復ポーション｜100｜アイテム
購入：魔力回復薬｜150｜アイテム｜割引=20%
購入：鑑定の巻物｜500｜アイテム｜在庫=1
━━━━━━━━━━━━━━━━━━
◆ SKILL SHOP
購入：上級鑑定｜1,200｜スキル
購入：感情解析｜2,000｜スキル
購入：情報看破｜5,000｜スキル
［購入する商品を選択してください。］`],
['実績解除',{色:'金',所持:'1500'},`╔══════════════════════════╗
ACHIEVEMENT UNLOCKED
╚══════════════════════════╝
［隠し実績を達成しました！］
【実績名】：運命に抗う者
【達成条件】：予定された死亡イベントを回避する。
━━━━━━━━━━━━━━━━━━
◆ 達成報酬
獲得：3,000｜隠し実績解除
称号：【運命を拒む者】
特殊報酬：【隠しシナリオ解放券】×1
［報酬が支給されました。］
所持：1,500`],
['星座・後援者からの支援',{色:'紫',飾り:'星座',所持:'3500'},`［星座『夜空を歩く旅人』があなたの行動を称賛しています。］
獲得：1,000｜星座からの後援
所持：3,500`],
['隠しショップ',{色:'黒',所持:'12000'},`╔══════════════════════════╗
HIDDEN SHOP
╚══════════════════════════╝
［特殊条件を達成しました。］
［隠しショップが解放されました！］
所持：12,000
購入：禁じられた鑑定書｜10,000｜アイテム
購入：真実の眼｜25,000｜スキル
購入：？？？？？｜LOCKED
［現在の権限では一部の商品を閲覧できません。］`],
['ガチャ（報酬抽選）',{色:'金',所持:'3500'},`╔══════════════════════════╗
REWARD DRAW
╚══════════════════════════╝
［ランダム報酬を獲得できます。］
所持：3,500
抽選：1,000｜Sランクスキル獲得券×1`],
['取引履歴',{色:'青',所持:'0'},`╔══════════════════════════╗
TRANSACTION LOG
╚══════════════════════════╝
獲得：1,000｜クエスト達成報酬
消費：500｜好感度情報の閲覧
獲得：3,000｜隠し実績解除
消費：1,200｜上級鑑定の購入
獲得：1,000｜星座からの後援
━━━━━━━━━━━━━━━━━━
履歴：`]];
WINP['コイン・ショップ']=ECOP;
/* ===== 鑑定・隠蔽・偽装・真実開示（システム窓の中で使う）=====
   値の行：「レベル：Lv.12｜偽装｜真=Lv.???」「好感度：？？？｜隠し｜真=1%」「称号：LOCKED｜封印｜真=夜の寵愛」
     隠し／偽装／欠落／封印（LOCKED）／閲覧不可／認識阻害／解析不能。真= が無ければ、看破しても見えないまま
   段階の行：［鑑定 検出］［鑑定 偽装］［鑑定 看破］［鑑定 解放］［鑑定 欠落］［鑑定 失敗］［鑑定 感知］［鑑定 逆探知］［鑑定 消える］［鑑定 達成］
     ［鑑定 対決 鑑定=3 隠蔽=8 補正=+2］…能力差で8段階の結果を自動で決める（結果=解析失敗 で作家さんが決めてもよい）
     札=CONCEALMENT … 窓にスタンプ／条件=上級鑑定 … 同じページのショップで買うまで待つ
   チェックの行：「✕ 鑑定スキル Lv.5 以上」→［鑑定 達成］で ✓ に変わる
   文は作家さんが書いたまま。演出は見た目だけで、本文は変わらない */
const APALL=['検出','偽装','看破','解放','欠落','失敗','感知','逆探知','消える','達成','対決','封鎖','解除','確認','発動','走査','逆流','妨害','反動','視線'];
const APX={'見破る':'看破','ばれる':'感知','反撃':'逆探知','偽装検出':'偽装','解析失敗':'失敗','消去':'消える','再解放':'解除'};
const APKV=['鑑定','隠蔽','補正','結果','条件','札','鑑定名','隠蔽名','数','スキル','回数','向き','速さ','強さ','率','行','文','侵食名'];
/* 順番どおりに動く「名前=値」の段階（シナリオ制限）：状態=LOCKED 難易度=HARD 変化=整合率:42%→18%→ERROR */
const APSEQ=['状態','難易度','変化','侵食','習得','昇格'];
const APTYPE=['偽装','隠し','封印','LOCKED','欠落','閲覧不可','認識阻害','解析不能'];
const APFLAG=new RegExp('｜\\s*('+APTYPE.join('|')+')\\s*(｜|$)');
const apParse=l=>{const m=String(l).trim().match(/^［(鑑定|制限)[\s　]+([^］。]*)］$/);if(!m)return null;const o={tag:m[1],lab:'',fx:[],kv:{}};let known=0;
  m[2].split(/[\s　]+/).filter(Boolean).forEach(x=>{const j=x.search(/[=＝]/);if(j>0){const k=x.slice(0,j);if(APSEQ.includes(k)){o.fx.push(k+'='+x.slice(j+1));known++;return}o.kv[k]=x.slice(j+1);if(APKV.includes(k))known++}
    else if(/^(\d+|終わり|最後)$/.test(x))o.lab=x;else{const f=APX[x]||x;o.fx.push(f);if(APALL.includes(f))known++}});
  if((o.kv.鑑定||o.kv.隠蔽||o.kv.結果)&&!o.fx.includes('対決'))o.fx.unshift('対決');
  return known?o:null};
const apLine=s=>`［${s.tag||'鑑定'} ${s.lab||''} ${s.fx.join(' ')} ${Object.entries(s.kv||{}).map(([k,v])=>k+'='+v).join(' ')}］`.replace(/ +/g,' ').replace(' ］','］');
/* 値の行を分ける：表示・種類・真の値 */
function apSplit(l){const m=l.match(/^([^：:｜]{1,18}?)\s*[：:]\s*(.*)$/),key=m?m[1]:'',rest=m?m[2]:l,p=rest.split('｜').map(s=>s.trim());
  let type='',tru='';p.slice(1).forEach(x=>{if(/^真[=＝]/.test(x))tru=x.replace(/^真[=＝]/,'');else if(APTYPE.includes(x)&&!type)type=x==='LOCKED'?'封印':x});
  return{key,shown:p[0],type,tru}}
const apNeg=t=>/^\s*[-−‐]\s*\d/.test(t);
function apDisp(d){const s=d.shown;
  switch(d.type){
    case'封印':return`<span class="aplk">🔒</span>${wDeco(s&&!/^LOCKED$/i.test(s)?s:'LOCKED')}`;
    case'欠落':return`<span class="apmiss">━━━━━━</span><em class="aptag">データ欠落</em>`;
    case'閲覧不可':return wDeco(s||'閲覧不可');
    case'解析不能':return wDeco(s||'測定不能');
    case'認識阻害':return`<span class="apblur">${esc(s||'■■■')}</span>`;
    case'隠し':return wDeco(s||'？？？');
    default:return wDeco(s)}}
function apRow(r,c0){const q=c0.indexOf('"'),cls=q<0?c0:c0.slice(0,q),at=q<0?'':c0.slice(q+1),d=r.d.ap;
  const pre=(!d.key&&/^[・\-]\s*/.test(d.shown))?d.shown.match(/^[・\-]\s*/)[0]:'';if(pre)d.shown=d.shown.slice(pre.length);
  return`<div class="${cls} ap-${esc(d.type)}${d.key?'':' apli'}"${at} data-ty="${esc(d.type)}" data-f="${esc(d.shown)}" data-t="${esc(d.tru)}">${d.key?`<span>${wDeco(d.key)}</span>`:pre?`<span class="appre">${esc(pre.trim())}</span>`:''}<b class="apval">${apDisp(d)}</b></div>`}
function chkRow(r,c0){const q=c0.indexOf('"'),cls=q<0?c0:c0.slice(0,q),at=q<0?'':c0.slice(q+1);
  return`<div class="${cls} ${r.d.on?'on':'off'}"${at}><i>${r.d.on?'✓':'✕'}</i><span>${wDeco(r.d.t)}</span></div>`}
/* 能力差 → 8段階 */
const APRES=[['完全閲覧','ok',['看破','解放']],['一部閲覧','ok',['一部']],['情報欠落','mid',['欠落']],['隠蔽の存在を検出','mid',['検出']],['偽装情報の検出','mid',['偽装']],['解析失敗','bad',['失敗']],['鑑定を感知された','bad',['失敗','感知']],['逆探知・反撃','bad',['失敗','逆探知']]];
function apJudge(kv){if(kv.結果){const t=kv.結果;const i=APRES.findIndex(r=>r[0]===t||r[0].includes(t)||t.includes(r[0].slice(0,2)));if(i>=0)return i}
  const d=(parseFloat(kv.鑑定)||0)+(parseFloat(String(kv.補正||0).replace('＋','+').replace('−','-'))||0)-(parseFloat(kv.隠蔽)||0);
  return d>=3?0:d>=1?1:d>=0?2:d>=-1?3:d>=-2?4:d>=-4?5:d>=-6?6:7}
const APGL='█▓▒░？#%@ERROR■';
async function apScr(b,html,w,n=7){if(w.fast){b.innerHTML=html;return true}const L=Math.max(3,Math.min(10,b.textContent.length||4));
  for(let i=0;i<n;i++){b.textContent=Array.from({length:L},()=>APGL[Math.random()*APGL.length|0]).join('');if(!await w.wait(45))return false}
  b.innerHTML=html;b.animate([{filter:'brightness(2.4) blur(2px)',transform:'translateX(-3px)'},{filter:'none',transform:'none'}],{duration:420});return true}
const apTrue=t=>`<b class="aptrue${apNeg(t)?' neg':''}">${wDeco(t)}</b>`;
async function apStage(el,s,w,row){
  const box=el.querySelector('.wbox')||el,fast=!!w.fast,calm=fast||RDM(),rows=()=>[...el.querySelectorAll('.k-apv')];
  const stamp=t=>{const o=document.createElement('div');o.className='apstamp';o.textContent=t;box.appendChild(o);box.classList.add('hasstamp');if(!calm)o.animate([{opacity:0,transform:'rotate(-8deg) scale(2.2)'},{opacity:1,transform:'rotate(-8deg) scale(1)'}],{duration:380,easing:'cubic-bezier(.3,1.6,.5,1)'});w.sfx('thud')};
  /* 条件：同じページのショップに、その商品があるときだけ待つ */
  if(s.kv&&s.kv.条件&&!fast){const need=s.kv.条件,root=el.closest('.tpv')||page,sold=[...root.querySelectorAll('.e-buy')].some(b=>b.dataset.name===need);
    if(sold){const own=()=>((ecoW(el).own)||[]).includes(need);
      if(!own()){const h=document.createElement('div');h.className='wl k-sys apwait';h.textContent=`［スキル【${need}】が必要です。］`;row.after(h);h.animate([{opacity:0},{opacity:1}],{duration:300});w.sfx('warn');
        while(!own()){if(!await w.wait(300))return}h.classList.add('done');h.textContent=`［スキル【${need}】を確認しました。］`;w.sfx('pling');if(!await w.wait(700))return}}}
  let fx=s.fx.slice();
  if(fx.includes('対決')){const i=apJudge(s.kv||{}),[lab,tone,eff]=APRES[i],kv=s.kv||{};
    const p=document.createElement('div');p.className='wl k-apd';
    p.innerHTML=`<div class="apvs"><span><small>${esc(kv.鑑定名||'鑑定')}</small><b>Lv.${esc(kv.鑑定||'?')}</b>${kv.補正?`<em>補正 ${esc(kv.補正)}</em>`:''}</span><i>VS</i><span><small>${esc(kv.隠蔽名||'情報隠蔽')}</small><b>Lv.${esc(kv.隠蔽||'?')}</b></span></div><div class="apres ${tone}"><small>解析結果</small><b>${esc(lab)}</b><ol>${APRES.map((r,j)=>`<li class="${j===i?'on':''}">${esc(r[0])}</li>`).join('')}</ol></div>`;
    (row||box.lastChild).after(p);
    if(!calm){p.animate([{opacity:0,transform:'scaleY(.2)'},{opacity:1,transform:'none'}],{duration:300});w.sfx('tick',.2);
      const lis=[...p.querySelectorAll('li')],res=p.querySelector('.apres b');res.style.visibility='hidden';
      for(let k=0;k<=i+8;k++){lis.forEach((x,j)=>x.classList.toggle('roll',j===k%8));w.sfx('tick',.08);if(!await w.wait(k>i?60:70))return;if(k>=8&&k%8===i)break}
      lis.forEach(x=>x.classList.remove('roll'));res.style.visibility='';res.animate([{opacity:0,transform:'scale(1.6)'},{opacity:1,transform:'none'}],{duration:300});w.sfx(tone==='bad'?'warn':'pling');if(tone==='bad')vib([40,30,40]);if(!await w.wait(700))return}
    fx=fx.filter(x=>x!=='対決').concat(eff)}
  for(const f of fx){if(w.dead)return;
    if(f==='検出'){rows().filter(r=>['隠し','封印','欠落','閲覧不可'].includes(r.dataset.ty)).forEach(r=>r.classList.add('apdet'));w.sfx('warn');if(!calm)box.animate([{boxShadow:'inset 0 0 0 2px #ff6b6b'},{boxShadow:'inset 0 0 0 0 transparent'}],{duration:700})}
    else if(f==='偽装'){for(const r of rows().filter(r=>r.dataset.ty==='偽装')){const b=r.querySelector('.apval');r.classList.add('apfake');
        if(!await apScr(b,`<s class="apold">${esc(r.dataset.f)}</s><i class="aparr">→</i><b class="aperr">ERROR</b>`,w,5))return;w.sfx('crackle',.05,.2);if(!fast&&!await w.wait(260))return}}
    else if(f==='看破'||f==='一部'){const list=rows().filter(r=>r.dataset.t&&!r.classList.contains('apopen')&&(f==='看破'?r.dataset.ty!=='封印':r.dataset.ty==='隠し'));
      el.classList.remove('eg-gl','eg-nz');if(!calm){box.animate([{filter:'none'},{filter:'brightness(1.8) hue-rotate(-20deg)'},{filter:'none'}],{duration:420});w.sfx('crackle',.08,.3);vib([20,30,20])}
      for(const r of list){const b=r.querySelector('.apval'),t=r.dataset.t;r.classList.add('apopen');r.classList.remove('apdet');
        const html=r.dataset.ty==='偽装'?`<s class="apold">${esc(r.dataset.f)}</s><i class="aparr">→</i>${apTrue(t)}`:apTrue(t);
        if(!await apScr(b,html,w))return;w.sfx('tick',.25);if(!fast&&!await w.wait(240))return}}
    else if(f==='解放'){for(const r of rows().filter(r=>r.dataset.ty==='封印'&&!r.classList.contains('apopen'))){const b=r.querySelector('.apval'),lk=r.querySelector('.aplk');
        if(lk&&!calm){lk.animate([{transform:'rotate(0)'},{transform:'rotate(-18deg)'},{transform:'rotate(14deg)'},{transform:'none'}],{duration:360});if(!await w.wait(380))return}
        r.classList.add('apopen');if(r.dataset.t){if(!await apScr(b,`<span class="apul">🔓</span>${apTrue(r.dataset.t)}`,w))return}else if(lk)lk.textContent='🔓';w.sfx('pling');if(!fast&&!await w.wait(260))return}}
    else if(f==='欠落'){rows().filter(r=>['隠し','偽装','封印'].includes(r.dataset.ty)&&!r.classList.contains('apopen')).forEach(r=>{r.classList.add('apmissed');r.querySelector('.apval').innerHTML='<span class="apmiss">━━━━━━</span><em class="aptag">データ欠落</em>'});w.sfx('crackle',.05,.2)}
    else if(f==='失敗'){el.classList.add('apfail');if(!calm){box.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:280,iterations:2});vib([50,30,50])}w.sfx('warn');stamp(s.kv&&s.kv.札?s.kv.札:'ANALYSIS FAILED')}
    else if(f==='感知'||f==='逆探知'){/* 目は使わない：赤い線が下から上へ走って「見返される」 */el.classList.add('apseen');w.sfx('rumble');vib([30,60,30]);
      if(f==='逆探知'){const [c1,c2,c3]=ERCOL.赤;el.style.setProperty('--wc',c1);el.style.setProperty('--wbg',c2);el.style.setProperty('--wfg',c3);el.classList.add('aprev');if(!calm)shake(6,420);w.sfx('alarm')}
      if(!calm&&await scnFlash(el,w,{up:1,red:1,n:f==='逆探知'?2:1})===false)return;if(!calm&&!await w.wait(400))return}
    else if(['確認','発動','走査','逆流','妨害','反動','視線'].includes(f)||/^侵食=/.test(f)){if(await scnDo(el,f,s,w,row)===false)return}
    else if(/^習得=/.test(f))await gmLearn(el,f.slice(3),w);
    else if(/^昇格=/.test(f)){if(await mrRank(el,f.slice(3),w,row)===false)return}
    else if(f==='消える'||f==='封鎖'||f==='解除'||/^(状態|難易度|変化)=/.test(f)){if(await scDo(el,f,s,w,row)===false)return}
    else if(f==='達成'){for(const r of el.querySelectorAll('.k-chk.off')){r.classList.replace('off','on');r.querySelector('i').textContent='✓';if(!calm)r.querySelector('i').animate([{transform:'scale(2.2)',opacity:0},{transform:'none',opacity:1}],{duration:320});w.sfx('pling');if(!fast&&!await w.wait(380))return}}
    if(!fast&&!await w.wait(220))return}
  if(s.kv&&s.kv.札&&!fx.includes('失敗'))stamp(s.kv.札);
  if(!fast)await w.wait(300)}
/* 演出なし・静止表示：段階を一気に当てて、最後の状態で見せる */
function apStill(el){el.querySelectorAll('.k-aps').forEach(r=>{if(r._ap)return;r._ap=1;apStage(el,JSON.parse(r.dataset.s),{fast:1,wait:async()=>true,sfx(){},dead:false},r)})}

/* ===== 文例 ===== */
const APP=[
['通常の鑑定',{色:'青'},`╔══════════════════════════╗
STATUS ANALYSIS
╚══════════════════════════╝
【対象名】：レオンハルト
【種族】：人間
【レベル】：Lv.35
【職業】：騎士
━━━━━━━━━━━━━━━━━━
HP：1,250 / 1,250
MP：340 / 340
筋力：75
敏捷：62
知力：41
━━━━━━━━━━━━━━━━━━
【保有スキル】
・剣術 Lv.4
・防御 Lv.3
・騎士の誇り Lv.2
［鑑定が完了しました。］`],
['スキル不足（閲覧不可）',{色:'赤'},`╔══════════════════════════╗
ACCESS DENIED
╚══════════════════════════╝
［鑑定を開始します。］
対象：カシス
名前：カシス
レベル：？？？｜隠し
職業：？？？｜隠し
称号：LOCKED｜封印
HP：？？？｜隠し
MP：？？？｜隠し
保有スキル：閲覧不可｜閲覧不可
━━━━━━━━━━━━━━━━━━
現在の鑑定スキル：Lv.2
［鑑定 失敗］
［対象の情報を解析できません。］
［現在のスキルレベルでは、これ以上の情報を確認できません。］`],
['隠蔽を検出',{色:'青'},`╔══════════════════════════╗
CONCEALMENT DETECTED
╚══════════════════════════╝
【対象名】：レオン
レベル：Lv.35
職業：騎士
【保有スキル】
・剣術 Lv.4
・防御 Lv.3
・？？？？？｜隠し｜真=情報隠蔽 Lv.8
━━━━━━━━━━━━━━━━━━
［鑑定 検出 札=CONCEALMENT］
［対象情報に不自然な欠落を検出しました。］
［隠蔽系スキルの存在が疑われます。］
［詳細解析には上位スキルが必要です。］`],
['偽装ステータス（再鑑定）',{色:'青'},`╔══════════════════════════╗
FALSE DATA DETECTED
╚══════════════════════════╝
【対象名】：アシェル
レベル：Lv.12｜偽装｜真=Lv.???
職業：一般人｜偽装｜真=？？？
HP：120 / 120
MP：30 / 30
［対象情報を再解析しています……］
［エラー 1 ジジッ グリッチ］
［鑑定 偽装］
［過去の鑑定結果に偽装情報を検出しました。］
［エラー 2 ザザッ 元に戻る］
［鑑定 看破］
［隠蔽を看破しました。］
━━━━━━━━━━━━━━━━━━
【真の称号】：■■■■■■｜隠し
［鑑定 感知］
［対象があなたの鑑定を感知しました。］`],
['親友の好感度（1%）',{色:'青'},`╔══════════════════════════╗
AFFECTION ANALYSIS
╚══════════════════════════╝
【対象名】：ユリウス
【現在の関係】：親友
［感情情報を解析しています……］
好感度：？？？｜隠し｜真=1%
信頼度：？？？｜隠し｜真=0%
警戒度：？？？｜隠し｜真=88%
隠し感情：？？？｜隠し｜真=嫌悪
［エラー 1 ジジッ グリッチ］
［エラー 2 ザザッ 元に戻る］
［鑑定 看破］
［解析が完了しました。］
━━━━━━━━━━━━━━━━━━
［対象はあなたを信頼していません。］`],
['表示と真の好感度',{色:'黒'},`╔══════════════════════════╗
HIDDEN EMOTION
╚══════════════════════════╝
対象：レオンハルト
好感度：90%｜偽装｜真=-47%
信頼度：85%｜偽装｜真=2%
敵意：0%｜偽装｜真=86%
特殊感情：なし｜偽装｜真=利用
［隠された感情情報を検出しました。］
［追加解析を開始します……］
［エラー 1 ジジッ グリッチ 赤］
［鑑定 看破 札=真の感情］
［解析が完了しました。］`],
['鑑定と隠蔽の対決',{色:'青'},`╔══════════════════════════╗
ANALYSIS BATTLE
╚══════════════════════════╝
対象：黒衣の男
レベル：？？？｜隠し｜真=Lv.61
職業：？？？｜隠し｜真=暗殺者
称号：LOCKED｜封印｜真=影を渡る者
━━━━━━━━━━━━━━━━━━
あなたの鑑定：Lv.3
装備補正：+1（真実の片眼鏡）
称号補正：+1（見通す者）
対象の情報隠蔽：Lv.8
［鑑定 対決 鑑定=3 補正=+2 隠蔽=8］
［対象の隠蔽能力が、あなたの鑑定能力を上回っています。］`],
['逆探知される',{色:'青'},`╔══════════════════════════╗
STATUS ANALYSIS
╚══════════════════════════╝
対象：？？？｜認識阻害
種族：測定不能｜解析不能
レベル：？？？｜隠し
［鑑定 対決 鑑定=4 隠蔽=15 隠蔽名=神格隠蔽］
［警告！］
［鑑定が逆探知されました。］
『──覗いたのは、お前か。』`],
['特殊保護（加護・封印）',{色:'金'},`╔══════════════════════════╗
PROTECTED DATA
╚══════════════════════════╝
対象：聖女セレスティア
加護：LOCKED｜封印｜真=月の女神の寵愛
呪い：LOCKED｜封印｜真=寿命の前借り
本当の正体：？？？｜隠し｜真=先代の魔王
［この情報は特殊な権限で保護されています。］
［鑑定 解放 札=PROTECTED］
［管理者権限により、保護が解除されました。］
［鑑定 看破］`],
['解放の条件（✓／✕）',{色:'青'},`╔══════════════════════════╗
UNLOCK CONDITIONS
╚══════════════════════════╝
［隠された情報を閲覧するには、条件を満たす必要があります。］
✕ 鑑定スキル Lv.5 以上
✕ スキル【看破】の所持
✕ 対象との接触 3回
━━━━━━━━━━━━━━━━━━
真の好感度：？？？｜隠し｜真=-47%
隠し感情：？？？｜隠し｜真=嫌悪
［鑑定 達成］
［すべての条件を満たしました。］
［鑑定 看破］
［真の感情情報が解放されました。］`],
['一部だけ見える',{色:'青'},`╔══════════════════════════╗
STATUS ANALYSIS
╚══════════════════════════╝
【対象名】：ミレイユ
レベル：？？？｜隠し｜真=Lv.28
職業：？？？｜隠し｜真=宮廷魔術師
称号：LOCKED｜封印｜真=王の影
好感度：？？？｜隠し｜真=35%
［鑑定 対決 鑑定=6 隠蔽=4］
［一部の情報を解析しました。］
［残りの情報は封印されています。］`]];
WINP['鑑定・隠蔽']=APP;
/* ===== シナリオ閲覧制限・難易度変更・情報封鎖（システム窓の中で使う。鑑定の段階と同じ仕組み）=====
   ［制限 状態=LOCKED］…窓の上の札（FULL／PARTIAL／LOCKED／PREMIUM／SKILL／ADMIN／CORRUPTED／UNKNOWN／GRANTED）
   ［制限 難易度=HARD］…NORMAL ↓ HARD。「難易度：」の行も書き換わる／［制限 変化=シナリオ整合率:42%→18%→ERROR］…値が乱れながら変わる
   ［制限 消える 数=2］…すぐ上の項目が ████ ／ ？？？ に崩れて消える／［制限 封鎖］…管理者による封鎖／［制限 解除］…封鎖を解いて、隠しと封印を開く
   制限されるのは作中のシステム情報だけ。本文は読めなくならない */
const SCST={FULL:['FULL ACCESS','ok'],PARTIAL:['PARTIAL ACCESS','mid'],LOCKED:['🔒 LOCKED','bad'],PREMIUM:['PREMIUM','gold'],SKILL:['SKILL REQUIRED','warn'],ADMIN:['ADMIN RESTRICTED','adm'],CORRUPTED:['CORRUPTED','cor'],UNKNOWN:['UNKNOWN','unk'],GRANTED:['ACCESS GRANTED','ok'],
  /* 鑑定の結果の札 */SUCCESS:['SUCCESS','ok'],FAILED:['FAILED','bad'],BLOCKED:['BLOCKED','bad'],DISGUISED:['DISGUISED','mid'],ERROR:['ERROR','cor'],DETECTED:['DETECTED','warn'],COUNTER:['COUNTER SCAN','bad'],REVEALED:['REVEALED','ok'],DENIED:['ACCESS DENIED','bad'],MP:['INSUFFICIENT MP','bad'],SCANNING:['SCANNING…','mid']};
const SCSX={全閲覧:'FULL',閲覧可能:'FULL',一部:'PARTIAL',一部閲覧:'PARTIAL',制限:'LOCKED',ロック:'LOCKED',有料:'PREMIUM',スキル不足:'SKILL',管理者:'ADMIN',封鎖:'ADMIN',破損:'CORRUPTED',解析不能:'UNKNOWN',不明:'UNKNOWN',解除:'GRANTED',成功:'SUCCESS',失敗:'FAILED',妨害:'BLOCKED',偽装:'DISGUISED',感知:'DETECTED',逆探知:'COUNTER',看破:'REVEALED',拒否:'DENIED'};
const scKey=v=>{v=String(v).trim();if(SCSX[v])return SCSX[v];const u=v.toUpperCase().replace(/\s+/g,' ');return/GRANT/.test(u)?'GRANTED':/^(INSUFFICIENT )?MP$/.test(u)?'MP':/DENIED/.test(u)?'DENIED':/COUNTER|逆探知/.test(u)?'COUNTER':/ADMIN/.test(u)?'ADMIN':/SKILL/.test(u)?'SKILL':u.replace(/ ACCESS$/,'').replace(/ REQUIRED$/,'')};
const SCDIF={EASY:'ok',NORMAL:'',HARD:'赤','VERY HARD':'赤',VERYHARD:'赤',HELL:'黒',NIGHTMARE:'黒',地獄:'黒'};
function scSave(el){if(!el._sc0)el._sc0=['--wc','--wbg','--wfg'].map(v=>[v,el.style.getPropertyValue(v)])}
function scColor(el,c){scSave(el);if(!c){el._sc0.forEach(([v,x])=>x?el.style.setProperty(v,x):el.style.removeProperty(v));return}const [c1,c2,c3]=ERCOL[c];el.style.setProperty('--wc',c1);el.style.setProperty('--wbg',c2);el.style.setProperty('--wfg',c3)}
async function scBadge(el,v,w,calm){const box=el.querySelector('.wbox')||el,k=scKey(v),[t,tone]=SCST[k]||[v,'mid'];let b=box.querySelector('.scbad');
  if(!b){b=document.createElement('div');b.className='scbad';box.prepend(b)}else if(!calm){await b.animate([{opacity:1},{opacity:0,filter:'blur(3px)'}],{duration:220}).finished}
  b.className='scbad '+tone;b.textContent=t;if(!calm)b.animate([{opacity:0,transform:'scale(1.5)'},{opacity:1,transform:'none'}],{duration:300,easing:'cubic-bezier(.3,1.5,.5,1)'});
  w.sfx(tone==='ok'?'pling':tone==='bad'||tone==='adm'||tone==='cor'?'warn':'tick',.2)}
/* 名前で行を探す（表・ゲージ・鑑定の行） */
function scFind(el,nm){return[...el.querySelectorAll('.k-kv,.k-gauge,.k-apv')].find(r=>{const n=r.querySelector('.rn')||r.querySelector(':scope>span');return n&&n.textContent.replace(/[【】\s]/g,'').includes(nm.replace(/[【】\s]/g,''))})}
const scVal=r=>r.querySelector('.rv')||r.querySelector('.apval')||r.querySelector(':scope>b');
const scHtml=t=>/ERROR|測定不能|解析不能|∞|無効|解除|LOCKED/.test(t)?`<b class="aperr">${esc(t)}</b>`:apNeg(t)?`<b class="aptrue neg">${esc(t)}</b>`:esc(t);
async function scDo(el,f,s,w,row){const box=el.querySelector('.wbox')||el,fast=!!w.fast,calm=fast||RDM();
  const j=f.indexOf('='),k=j>0?f.slice(0,j):f,v=j>0?f.slice(j+1):'';
  if(k==='状態'){await scBadge(el,v,w,calm);return}
  if(k==='難易度'){const nv=v.toUpperCase(),r=scFind(el,'難易度'),old=r?scVal(r).textContent.trim():(el._dif||'NORMAL');el._dif=nv;
    const p=document.createElement('div');p.className='wl k-scd';p.innerHTML=`<s>${esc(old)}</s><i>↓</i><b class="d-${esc(SCDIF[nv]||'')}">${esc(nv)}</b>`;(row||box.lastChild).after(p);
    const nb=p.querySelector('b');if(!calm){nb.style.opacity=0;p.animate([{opacity:0},{opacity:1}],{duration:300});if(!await w.wait(600))return false;
      nb.style.opacity='';nb.animate([{opacity:0,transform:'scale(2.6)',filter:'blur(4px)'},{opacity:1,transform:'none',filter:'none'}],{duration:380,easing:'cubic-bezier(.3,1.4,.5,1)'});shake(SCDIF[nv]?5:2,300);vib([60,40,60])}
    w.sfx(SCDIF[nv]?'thud':'pling');if(SCDIF[nv]==='赤'||SCDIF[nv]==='黒')scColor(el,SCDIF[nv]);else scColor(el,null);
    if(r){r.classList.add('scchg');if(!await apScr(scVal(r),scHtml(nv),w))return false}if(!fast&&!await w.wait(500))return false;return}
  if(k==='変化'){const i=v.search(/[:：]/);if(i<0)return;const nm=v.slice(0,i),steps=v.slice(i+1).split('→').map(x=>x.trim()).filter(Boolean);let r=scFind(el,nm);
    if(!r){r=document.createElement('div');r.className='wl k-kv';r.innerHTML=`<span>${esc(nm)}</span><b></b>`;(row||box.lastChild).after(r)}
    const b=scVal(r),bar=r.querySelector('.rbar b');r.classList.add('scchg');
    for(const st of steps){if(!calm){box.animate([{transform:'none'},{transform:'translateX(-4px) skewX(-2deg)',filter:'contrast(1.5)'},{transform:'none'}],{duration:240});w.sfx('crackle',.06,.25);vib(20)}
      if(!await apScr(b,scHtml(st),w,6))return false;const n=parseFloat(st);if(bar)bar.style.width=(isNaN(n)?(/ERROR|∞/.test(st)?100:0):Math.min(100,Math.abs(n)))+'%';
      w.sfx('tick',.25);if(!fast&&!await w.wait(800))return false}return}
  if(k==='消える'){const stop=x=>x.matches('.k-h,.k-sub,.k-hr,.k-btn,.k-apd,.k-scd')||!x.matches('.wl'),take=x=>x.matches('.k-li,.k-kv,.k-apv,.k-gauge,.k-p,.k-cho');let rs=[],x=row&&row.previousElementSibling;
    while(x&&!stop(x)){if(take(x))rs.unshift(x);x=x.previousElementSibling}
    const n=parseInt(s.kv&&s.kv.数);if(n>0)rs=rs.slice(-n);if(!rs.length)rs=[...el.querySelectorAll('.k-kv,.k-apv,.k-gauge')];
    let t=0;for(const r of rs){const cho=r.matches('.k-cho'),b=r.matches('.k-li,.k-p')?r:cho?r.querySelector('button'):scVal(r);if(!b)continue;if(cho)b.disabled=true;const pre=r.matches('.k-li')?(r.textContent.match(/^\s*[・\-□]\s*/)||[''])[0]:cho?(b.textContent.match(/^[①-⑳]\s*/)||[''])[0]:'',rep=t++%2?'？？？？？？':'████████';
      if(!await apScr(b,esc(pre)+`<span class="wnz">${rep}</span>`,w,5))return false;r.classList.add('scgone');w.sfx('crackle',.04,.2);if(!fast&&!await w.wait(260))return false}return}
  if(k==='封鎖'){scColor(el,'黒');el.classList.add('scadm');if(!box.querySelector('.scbad.adm'))await scBadge(el,'ADMIN',w,calm);
    const band=document.createElement('div');band.className='scband';band.innerHTML='<b>🔒 ADMINISTRATOR LOCK</b>';box.appendChild(band);
    if(!calm){band.animate([{transform:'scaleX(0)'},{transform:'none'}],{duration:420,easing:'cubic-bezier(.3,1.2,.5,1)'});shake(4,300);vib([80,40,80])}w.sfx('thud');w.sfx('rumble');if(!fast&&!await w.wait(700))return false;return}
  if(k==='解除'){box.querySelectorAll('.scband').forEach(b=>{if(calm)b.remove();else b.animate([{opacity:1},{opacity:0,transform:'scaleX(.2)'}],{duration:400}).finished.then(()=>b.remove())});
    el.classList.remove('scadm','apfail','aprev','apseen','eg-gl','eg-nz','eg-red','eg-black');box.querySelectorAll('.apstamp,.apeye').forEach(x=>x.remove());scColor(el,null);
    if(!calm){box.animate([{filter:'brightness(2)'},{filter:'none'}],{duration:600});vib([30,30,60])}await scBadge(el,'GRANTED',w,calm);if(!fast&&!await w.wait(400))return false;
    await apStage(el,{fx:['解放','看破'],kv:{}},w,row);return}}

/* ===== 文例 ===== */
const SCP=[
['通常のシナリオ',{色:'青'},`╔══════════════════════════╗
◈ SCENARIO INFORMATION ◈
╚══════════════════════════╝
［制限 状態=FULL］
【現在のシナリオ】
第3章：王都への帰還
難易度：NORMAL
進行率：98%
━━━━━━━━━━━━━━━━━━
◆ 次のイベント
・王宮への招待
・攻略対象との遭遇
・隠しクエスト発生
◆ 攻略ヒント
［特定の人物との会話によって、新しい分岐が発生します。］
［次のイベントまであと少しです！］`],
['チュートリアル終了',{色:'青'},`╔══════════════════════════╗
SYSTEM NOTIFICATION
╚══════════════════════════╝
［おめでとうございます！］
［メインシナリオ第3章をクリアしました。］
［チュートリアル期間が終了しました。］
━━━━━━━━━━━━━━━━━━
◆ システム変更のお知らせ
初心者保護：終了
攻略ヒント：無効
未来情報：制限
自動ナビゲーション：終了
［制限 状態=PARTIAL］
［新しい難易度が適用されます。］`],
['ハードモード移行',{色:'青'},`╔══════════════════════════╗
DIFFICULTY CHANGED
╚══════════════════════════╝
［制限 状態=FULL］
難易度：NORMAL
［難易度が変更されました。］
［制限 難易度=HARD］
━━━━━━━━━━━━━━━━━━
［これ以降のシナリオ情報は閲覧できません。］
次のイベント：？？？｜隠し
攻略対象の行動：？？？｜隠し
未来の分岐：LOCKED｜封印
［制限 状態=LOCKED］
［システムによる案内が制限されます。］`],
['途中から情報が消える',{色:'青'},`╔══════════════════════════╗
SCENARIO DATA
╚══════════════════════════╝
［制限 状態=FULL］
【現在のシナリオ】
第4章：運命の分岐
進行率：12%
◆ 次のイベント
・王宮への招待
・騎士団長との再会
・舞踏会での断罪
・北の砦への遠征
［エラー 1 ジジッ］
［制限 消える 数=2］
［エラー 2 ザザッ 赤］
［制限 状態=CORRUPTED］
［ERROR］
［現在の情報は閲覧できません。］
［システムの閲覧権限が変更されました。］`],
['コインを要求される',{色:'紫',所持:'2850'},`╔══════════════════════════╗
PREMIUM INFORMATION
╚══════════════════════════╝
［制限 状態=PREMIUM］
［ここから先は有料情報です。］
━━━━━━━━━━━━━━━━━━
◆ シナリオ情報
第1〜3章：閲覧可能
第4章以降：LOCKED｜封印
━━━━━━━━━━━━━━━━━━
所持：2,850
閲覧：5,000｜第4章以降のシナリオ
次のイベント：王国の崩壊
攻略対象の行動：裏切り`],
['スキル不足',{色:'赤'},`╔══════════════════════════╗
ACCESS DENIED
╚══════════════════════════╝
［制限 状態=SKILL］
［詳細情報を解析しています……］
対象：隠しシナリオ
現在の鑑定スキル：Lv.3
必要な鑑定スキル：Lv.7
━━━━━━━━━━━━━━━━━━
［スキルレベルが不足しています。］
［現在の能力では、これ以上の情報を確認できません。］
詳細情報：？？？｜隠し
解放条件：？？？｜隠し
［鑑定 失敗 札=解析失敗］`],
['シナリオからの逸脱',{色:'青'},`╔══════════════════════════╗
SCENARIO ERROR
╚══════════════════════════╝
［警告！］
［予定されていない行動を検出しました。］
シナリオ整合率：42%
［エラー 1 ジジッ］
［制限 変化=シナリオ整合率:18%］
［エラー 2 ザザッ 赤］
［制限 変化=シナリオ整合率:ERROR 状態=UNKNOWN］
━━━━━━━━━━━━━━━━━━
［既存のシナリオ情報が無効化されました。］
［未来のイベントを予測できません。］
［未知のルートに進入しました。］`],
['管理者による封鎖',{色:'青'},`╔══════════════════════════╗
ADMINISTRATOR LOCK
╚══════════════════════════╝
［管理者からの通知］
［現在のシナリオ情報は、上位管理者によって封鎖されています。］
［制限 封鎖］
━━━━━━━━━━━━━━━━━━
対象データ：████████
閲覧権限：RESTRICTED
管理者：？？？
封鎖理由：非公開
━━━━━━━━━━━━━━━━━━
［これ以上のアクセスは禁止されています。］
［警告：再試行するとペナルティが発生します。］`],
['ハードモードのペナルティ',{色:'赤'},`╔══════════════════════════╗
HARD MODE ACTIVE
╚══════════════════════════╝
［ハードモードが適用されました。］
難易度：HARD
━━━━━━━━━━━━━━━━━━
◆ 変更内容
・敵のレベル上昇
・クエスト難易度上昇
・システム支援の制限
・死亡ペナルティ強化
・一部情報の非公開
━━━━━━━━━━━━━━━━━━
［これ以降、システムはあなたの安全を保証しません。］`],
['隠された情報の再解放',{色:'青'},`╔══════════════════════════╗
ACCESS GRANTED
╚══════════════════════════╝
［制限 状態=LOCKED］
［特別条件を達成しました！］
◆ 解放された情報
第4章：LOCKED｜封印｜真=閲覧可能
次のイベント：？？？｜隠し｜真=【王国の崩壊】
攻略対象の行動：？？？｜隠し｜真=【裏切り】
隠し分岐：？？？？？｜隠し
［制限 解除］
［閲覧制限が一部解除されました。］
［新しいシナリオ情報が解放されました。］`],
['後援契約の終了',{色:'紫',飾り:'星座'},`［制限 状態=FULL］
加護：未来予知
攻略ヒント：有効
［星座『夜空を歩く旅人』との後援契約期間が終了しました。］
［制限 変化=加護:解除 変化=攻略ヒント:無効 状態=LOCKED］
［星座からの支援が停止されます。］`],
['複数の条件（コイン＋実績）',{色:'青',所持:'12000'},`╔══════════════════════════╗
COMPOUND LOCK
╚══════════════════════════╝
［制限 状態=LOCKED］
［この情報の閲覧には、複数の条件が必要です。］
✓ 第3章クリア
✕ スキル【看破】の所持
✕ 実績【運命に抗う者】
━━━━━━━━━━━━━━━━━━
所持：12,000
閲覧：5,000｜隠しシナリオ
隠しシナリオ：王太子の死`]];
WINP['シナリオ制限']=SCP;
/* ===== 鑑定の走査線・逆流・反動・侵食（システム窓の中で使う。鑑定の段階と同じ仕組み）=====
   ［鑑定 確認 スキル=鑑定］…使用しますか？【YES／NO】。NO なら窓はそこで終わる
   ［鑑定 発動 スキル=真実の眼 強さ=上位］…スキル名が浮かぶ
   ［鑑定 走査 回数=2 向き=往復 速さ=1 率=100 強さ=上位］…コピー機のような光の線が通ったところから、下の行が読み取られて出る
   ［鑑定 妨害］…走査のバーが壊れて ERROR／［鑑定 逆流］…線が下から上へ逆流し、上の情報が消えて、下の行（あなたのステータス）が赤く読み取られる
   ［鑑定 反動］…窓の中だけ、ブレ・ノイズ・一瞬の暗転（文字は出さない）／［鑑定 視線］…目が開いて、こちらを向く（使わなくてもよい）
   侵食の行：「侵食率：12%｜侵食」→［鑑定 侵食=+6］（または 侵食=18%）で、じわっと増えて色が 青→紫→赤→黒 */
const EROB=[[0,'軽微な違和感','#7cc4ff'],[20,'頭痛・軽いノイズ','#b48cff'],[40,'視界の乱れ・鑑定エラー増加','#ff6bd0'],[60,'強い頭痛・誤鑑定','#ff5a5a'],[80,'意識混濁・画面侵食','#ff3355'],[100,'暴走・接続固定','#ff2b2b']];
const eroBand=n=>{let b=0;EROB.forEach((x,i)=>{if(n>=x[0])b=i});return b};
function eroRow(r,c0){const q=c0.indexOf('"'),cls=q<0?c0:c0.slice(0,q),at=q<0?'':c0.slice(q+1),v=r.d.v,b=EROB[eroBand(v)];
  return`<div class="${cls} e${eroBand(v)}"${at} data-v="${v}" style="--ec:${b[2]}"><div class="eroh"><span>${wDeco(r.d.k)}</span><b class="erov">${v}%</b></div><i class="erobar"><b style="width:${Math.min(100,v)}%"></b></i><small class="erob">${esc(b[1])}</small></div>`}
const eroNow=el=>{let v=ecoW(el).ero||0;el.querySelectorAll('.k-ero').forEach(r=>v=Math.max(v,+r.dataset.v||0));return v};
const scnY=(box,r)=>{const a=box.getBoundingClientRect(),b=r.getBoundingClientRect();return b.top-a.top+b.height/2};
/* 線を1本走らせる（感知・逆探知の「見返される」にも使う） */
async function scnFlash(el,w,o={}){const box=el.querySelector('.wbox')||el,L=document.createElement('div');L.className='sline'+(o.red?' red':'')+(o.strong?' strong':'');box.appendChild(L);
  const H=box.clientHeight;for(let k=0;k<(o.n||1);k++){const st=performance.now(),ms=o.ms||520;for(;;){const t=Math.min(1,(performance.now()-st)/ms),y=o.up?H*(1-t):H*t;L.style.top=y+'px';if(t>=1)break;if(!await w.wait(16)){L.remove();return false}}}
  L.remove();return true}
/* 走査：stage 行のすぐ下の行（次の段階・ボタンまで）を、線が通ったところから出す */
async function scnScan(el,s,w,row,o={}){const box=el.querySelector('.wbox')||el,kv=s.kv||{},fast=!!w.fast,calm=fast||RDM(),strong=/上位|強/.test(kv.強さ||'')||o.strong,red=!!o.red;
  const tg=[];let x=row.nextElementSibling;const lim=parseInt(kv.行)||99;
  while(x&&tg.length<lim&&!x.matches('.k-aps,.k-err,.k-btn')){if(x.matches('.wl')&&!x.matches('.k-sp'))tg.push(x);x=x.nextElementSibling}
  const rate=kv.率!=null?Math.max(0,Math.min(100,parseFloat(kv.率)||0)):100;
  const bar=document.createElement('div');bar.className='wl k-scan'+(strong?' strong':'')+(red?' red':'');bar.innerHTML=`<div class="snh"><span class="sclab">${red?'REVERSE SCAN…':strong?'DEEP SCAN…':'SCANNING…'}</span><b class="scpct">0%</b></div><i class="scbar"><b></b></i>`;row.after(bar);
  const pct=bar.querySelector('.scpct'),fill=bar.querySelector('.scbar b');
  const LOCKT=['隠し','封印','閲覧不可','欠落','認識阻害','解析不能'];
  const show=t=>{if(!t.classList.contains('scanp'))return;t.classList.remove('scanp');if(t.matches('.k-apv')&&LOCKT.includes(t.dataset.ty))t.classList.add('scanlock');
    if(!calm)t.animate([{opacity:0,filter:`brightness(2.6) ${red?'hue-rotate(-40deg)':''}`,transform:'translateY(-2px)'},{opacity:1,filter:'none',transform:'none'}],{duration:380});
    const bb=t.querySelector(':scope.k-bar b');if(bb)bb.style.width=t.dataset.v+'%';const g=t.querySelector('.rrow');if(g&&!fast)relGrow(g,{},{wait:ms=>w.wait(ms),sfx:()=>{}});if(t.matches('.k-eco'))ecoReveal(t,el,{});
    w.sfx('tick',.08)};
  tg.forEach(t=>{t.classList.remove('wpend');t.classList.add('scanp');t._scanned=1});
  if(fast){tg.forEach(show);pct.textContent=rate+'%';fill.style.width=rate+'%';bar.classList.add('done');return}
  const dir=o.up?'上':(kv.向き||'下'),n=Math.max(1,Math.min(6,parseInt(kv.回数)||(dir==='往復'?1:1))),sp=Math.max(.3,parseFloat(kv.速さ)||1);
  const passes=[];for(let i=0;i<n;i++){if(dir==='往復')passes.push('d','u');else passes.push(dir==='上'?'u':'d')}
  const L=document.createElement('div');L.className='sline'+(strong?' strong':'')+(red?' red':'');box.appendChild(L);
  if(!calm)box.classList.add('scanning');w.sfx(strong?'pling':'tick',.2);
  const H=box.clientHeight,ys=tg.map(t=>scnY(box,t)),ero=eroNow(el),ms=(strong?1700:1300)/sp,total=passes.length*ms,t0=performance.now();
  for(let p=0;p<passes.length;p++){const up=passes[p]==='u',st=performance.now();
    for(;;){const t=Math.min(1,(performance.now()-st)/ms),y=up?H*(1-t):H*t,jit=ero>=40?(Math.random()-.5)*ero/12:0;
      L.style.top=y+'px';L.style.transform=`translateX(${jit}px)`;if(ero>=60&&Math.random()<.06)L.style.opacity=.2;else L.style.opacity='';
      tg.forEach((r,i)=>{if(up?ys[i]>=y:ys[i]<=y)show(r)});
      const prog=Math.min(1,(performance.now()-t0)/total),v=Math.round(rate*prog);pct.textContent=v+'%';fill.style.width=v+'%';
      if(t>=1)break;if(!await w.wait(16)){L.remove();box.classList.remove('scanning');return false}}}
  tg.forEach(show);L.remove();box.classList.remove('scanning');pct.textContent=rate+'%';fill.style.width=rate+'%';
  bar.classList.add('done');bar.querySelector('.sclab').textContent=rate<100?'ANALYSIS INCOMPLETE':red?'REVERSE COMPLETE':'ANALYSIS COMPLETE';
  if(!calm)bar.animate([{filter:'brightness(2)'},{filter:'none'}],{duration:400});w.sfx(rate<100?'warn':'pling');return true}
async function scnDo(el,f,s,w,row){const box=el.querySelector('.wbox')||el,kv=s.kv||{},fast=!!w.fast,calm=fast||RDM(),sk=kv.スキル||'鑑定';
  if(f==='確認'){if(fast)return;const q=document.createElement('div');q.className='wl k-sys';q.textContent=`［${kv.文||`スキル【${sk}】を使用しますか？`}］`;
    const bt=document.createElement('div');bt.className='wl k-btn';bt.innerHTML='<button type="button" data-a="y">YES</button><button type="button" data-a="n">NO</button>';row.after(q,bt);
    q.animate([{opacity:0},{opacity:1}],{duration:300});w.sfx('pling');let ans=null;bt.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(ans)return;ans=b.dataset.a;bt.querySelectorAll('button').forEach(x=>{x.disabled=true;x.classList.toggle('on',x===b)});vib(30)});
    try{keepBottom()}catch(e){}while(!ans){if(!await w.wait(120))return false}
    const say=(t,bad)=>{const m=document.createElement('div');m.className='wl k-sys'+(bad?' warn':'');m.textContent=t;(el._last||bt).after(m);el._last=m;m.animate([{opacity:0},{opacity:1}],{duration:300});return m};
    if(ans==='n'){say(`［スキル【${sk}】の使用を取り消しました。］`);el._apStop=1;el.animate([{opacity:1},{opacity:.6}],{duration:600,fill:'forwards'});return}
    /* MP・コインを消費する（MP=100 コイン=500）。足りなければ、そこで止まる */
    if(kv.MP||kv.コイン){const need=parseInt(kv.MP)||0,cn=ecoN(kv.コイン||0),wl=ecoW(el);
      const mpRow=[...el.querySelectorAll('.k-kv,.k-gauge')].find(r=>{const n=r.querySelector('.rn')||r.querySelector(':scope>span');return n&&/^(現在)?MP$/.test(n.textContent.replace(/[【】\s]/g,''))});
      const mv=mpRow?scVal(mpRow):null,mp=mv?parseInt(mv.textContent.replace(/[,，]/g,'')):null;
      if(need&&mp!=null&&mp<need){await scBadge(el,'MP',w,calm);say(`［MPが不足しています。］（必要MP：${need}／現在MP：${mp}）`,true);w.sfx('warn');vib([40,30,40]);el._apStop=1;return}
      if(cn&&(wl.bal??0)<cn){await scBadge(el,'DENIED',w,calm);say(`［コインが不足しています。］（必要：${ecoF(cn)}／保有：${ecoF(wl.bal??0)}）`,true);w.sfx('warn');el._apStop=1;return}
      say(`［${sk}を発動しました。］`);
      if(need&&mv){const to=mp-need;mpRow.classList.add('scchg');if(!await apScr(mv,`${mp} → <b class="aptrue">${to}</b>`,w,5))return false;w.sfx('tick',.2)}
      if(cn){ecoMove(el,-cn,`${sk}の使用`,{});}if(!fast&&!await w.wait(500))return false}
    return}
  if(f==='発動'){if(calm)return;const strong=/上位|強/.test(kv.強さ||''),p=document.createElement('div');p.className='scpop'+(strong?' strong':'');p.innerHTML=`<small>SKILL ACTIVATION</small><b>【${esc(sk)}】</b>`;box.appendChild(p);
    p.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.6)',filter:'blur(6px)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.06)',filter:'none',offset:.3},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.75},{opacity:0,transform:'translate(-50%,-50%) scale(1.15)'}],{duration:strong?1700:1300,easing:'ease-out'});
    box.animate([{boxShadow:`inset 0 0 0 0 transparent`},{boxShadow:`inset 0 0 40px ${strong?'#fff6':'color-mix(in srgb,var(--wc) 60%,transparent)'}`},{boxShadow:'inset 0 0 0 0 transparent'}],{duration:900});w.sfx('pling');vib(25);
    const ok=await w.wait(strong?1600:1200);p.remove();return ok}
  if(f==='走査')return scnScan(el,s,w,row);
  if(f==='妨害'){const b=[...el.querySelectorAll('.k-scan')].pop();if(!calm){box.animate([{transform:'none'},{transform:'translateX(-7px)',filter:'drop-shadow(3px 0 #f0f) drop-shadow(-3px 0 #0ff)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:260,iterations:2});vib([40,30,40])}
    w.sfx('crackle',.08,.3);if(b){b.classList.add('broken');const pc=b.querySelector('.scpct');if(!await apScr(pc,'ERROR',w,6))return false;b.querySelector('.sclab').textContent='SCAN BLOCKED';const f2=b.querySelector('.scbar b');f2.style.width='100%'}
    w.sfx('warn');return}
  if(f==='逆流'){scColor(el,'赤');el.classList.add('aprev');w.sfx('alarm');vib([60,40,60]);
    /* 上の情報が、逆流する線に消されていく */
    const gone=[...el.querySelectorAll('.wl')].filter(r=>{if(r===row||r.compareDocumentPosition(row)&Node.DOCUMENT_POSITION_PRECEDING)return false;return r.matches('.k-kv,.k-apv,.k-gauge,.k-li,.k-bar,.k-scan,.k-apd,.k-chk')&&!r.matches('.wpend')});
    if(!calm){const H=box.clientHeight,ys=gone.map(r=>scnY(box,r)),L=document.createElement('div');L.className='sline red strong';box.appendChild(L);const st=performance.now();
      for(;;){const t=Math.min(1,(performance.now()-st)/1100),y=H*(1-t);L.style.top=y+'px';gone.forEach((r,i)=>{if(ys[i]>=y&&!r._g){r._g=1;r.animate([{opacity:1,filter:'none'},{opacity:.15,filter:'blur(3px)'}],{duration:300,fill:'forwards'})}});if(t>=1)break;if(!await w.wait(16)){L.remove();return false}}
      L.remove();if(!await w.wait(300))return false}
    gone.forEach(r=>{r.style.display='none'});
    return scnScan(el,s,w,row,{red:1,strong:1})}
  if(f==='反動'){if(calm)return;const k=1+eroNow(el)/50;box.classList.add('scside');w.sfx('crackle',.1,.3);vib([30,40,80,40,30]);
    const an=box.animate([{transform:'none',filter:'none'},{transform:`translateX(${-3*k}px)`,filter:`blur(${1.2*k}px)`},{transform:`translateX(${2*k}px)`,filter:'blur(.4px)'},{transform:'none',filter:`blur(${1.6*k}px)`},{transform:'none',filter:'none'}],{duration:900});
    if(!await w.wait(450))return false;const bo=document.createElement('div');bo.className='scblack';box.appendChild(bo);if(!await w.wait(140)){bo.remove();return false}bo.remove();
    if(!await w.wait(500))return false;box.classList.remove('scside');return}
  if(f==='視線'){if(calm)return;const ov=document.createElement('div');ov.className='scgaze';ov.innerHTML=scnEye();box.appendChild(ov);const sv=ov.querySelector('svg');
    const lid=o=>{const u=-58*o,l=52*o;sv.querySelector('.lp').setAttribute('d',`M-110 0 Q0 ${u} 110 0 Q0 ${l} -110 0Z`);sv.querySelector('.up').setAttribute('d',`M-110 0 Q0 ${u} 110 0`);sv.querySelector('.lo').setAttribute('d',`M-110 0 Q0 ${l} 110 0`)},
      look=(x,y,p)=>{sv.querySelector('.ball').setAttribute('transform',`translate(${x} ${y})`);sv.querySelector('.pu').setAttribute('rx',p)},
      tw=async(ms,fn)=>{const st=performance.now();for(;;){const t=Math.min(1,(performance.now()-st)/ms);fn(1-Math.pow(1-t,3));if(t>=1)return true;if(!await w.wait(16))return false}};
    lid(0);look(-30,4,9);w.sfx('rumble');if(!await tw(700,t=>lid(t)))return false;if(!await w.wait(500))return false;
    sv.classList.add('red');w.sfx('thud');vib([60,30,60]);if(!await tw(160,t=>look(-30+30*t,4-4*t,9-6*t)))return false;
    box.animate([{transform:'none'},{transform:'translateX(-5px)'},{transform:'none'}],{duration:200});if(!await w.wait(1500))return false;
    if(!await tw(400,t=>lid(1-t)))return false;ov.remove();return}
  if(/^侵食=/.test(f)){const v=f.slice(3),r0=[...el.querySelectorAll('.k-ero')].pop();let r=r0;
    if(!r){const tmp=document.createElement('div');tmp.innerHTML=eroRow({d:{k:kv.侵食名||'侵食率',v:ecoW(el).ero||0}},'wl k-ero"');r=tmp.firstElementChild;row.after(r)}
    r.classList.remove('wpend');const from=+r.dataset.v||0,to=/^[+＋]/.test(v)?from+parseFloat(v.slice(1)):/^[-−]/.test(v)?from-parseFloat(v.slice(1)):parseFloat(v);
    const vb=r.querySelector('.erov'),fb=r.querySelector('.erobar b'),lb=r.querySelector('.erob');let band=eroBand(from);
    const paint=n=>{vb.textContent=Math.round(n)+'%';fb.style.width=Math.min(100,n)+'%';const b=eroBand(n);if(b!==band){band=b;r.className=r.className.replace(/\be\d\b/,'e'+b);r.style.setProperty('--ec',EROB[b][2]);lb.textContent=EROB[b][1];
        if(!calm){r.animate([{filter:'brightness(2.2)'},{filter:'none'}],{duration:500});box.animate([{transform:'translateX(-3px)'},{transform:'none'}],{duration:180})}w.sfx('warn');vib([40,30,40])}};
    if(calm)paint(to);else{w.sfx('rumble');const st=performance.now(),ms=1400;for(;;){const t=Math.min(1,(performance.now()-st)/ms);paint(from+(to-from)*(1-Math.pow(1-t,2)));if(t>=1)break;if(!await w.wait(30))return false}}
    r.dataset.v=to;ecoW(el).ero=to;if(!fast&&!await w.wait(400))return false;return}}
/* 視線で使う目（SVG。画像なし） */
function scnEye(){let fib='';for(let i=0;i<72;i++){const a=i/72*Math.PI*2,r1=9+(i*7%4),r2=26+(i*13%7);fib+=`<line x1="${(Math.cos(a)*r1).toFixed(1)}" y1="${(Math.sin(a)*r1).toFixed(1)}" x2="${(Math.cos(a)*r2).toFixed(1)}" y2="${(Math.sin(a)*r2).toFixed(1)}" stroke="${i%3?'#9fe0ff':'#0a2a4a'}" opacity=".5"/>`}
  return`<svg viewBox="-120 -60 240 120"><defs><radialGradient id="scir" r="34" cx="0" cy="0" gradientUnits="userSpaceOnUse"><stop offset="0" class="s1" stop-color="#e8fbff"/><stop offset=".4" class="s2" stop-color="#3fb6ff"/><stop offset="1" class="s3" stop-color="#06203d"/></radialGradient><clipPath id="sclid"><path class="lp" d="M-110 0Z"/></clipPath></defs>
  <g clip-path="url(#sclid)"><rect x="-120" y="-60" width="240" height="120" fill="#e9e2e0"/><g class="ball"><circle r="34" fill="url(#scir)"/><g stroke-width=".7">${fib}</g><circle r="34" fill="none" stroke="#000" stroke-width="3"/><ellipse class="pu" rx="9" ry="24" fill="#020202"/><ellipse cx="-11" cy="-13" rx="7" ry="4.5" fill="#fff" opacity=".75"/></g></g>
  <path class="up" d="M-110 0" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/><path class="lo" d="M-110 0" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/></svg>`}

/* ===== 文例 ===== */
const SCNP=[
['通常の鑑定（走査）',{色:'青'},`╔══════════════════════════╗
APPRAISAL
╚══════════════════════════╝
［鑑定 確認 スキル=鑑定］
［鑑定 発動 スキル=鑑定］
［対象を走査しています……］
［鑑定 走査 向き=往復］
【名前】：レオンハルト
【種族】：人間
【レベル】：Lv.35
【職業】：騎士
HP：1,250 / 1,250
MP：340 / 340
［鑑定が完了しました。］`],
['隠蔽された対象',{色:'青'},`╔══════════════════════════╗
APPRAISAL
╚══════════════════════════╝
［鑑定 発動 スキル=鑑定］
［鑑定 走査 率=60］
【名前】：カシス
【レベル】：？？？｜隠し
【職業】：LOCKED｜封印
【称号】：LOCKED｜封印
HP：？？？｜隠し
MP：？？？｜隠し
［対象情報に閲覧制限があります。］
［隠蔽スキルを検出しました。］
［制限 状態=PARTIAL］`],
['上位スキルで突破',{色:'青'},`╔══════════════════════════╗
ADVANCED APPRAISAL
╚══════════════════════════╝
［鑑定 発動 スキル=真実の眼 強さ=上位］
［隠蔽情報を再解析しています……］
［鑑定 走査 強さ=上位 向き=往復 回数=2］
【名前】：カシス
【レベル】：？？？｜隠し｜真=Lv.???
【職業】：LOCKED｜封印｜真=影の執行者
【称号】：LOCKED｜封印｜真=■■■■■■
［ロックを解除しています……］
［鑑定 解放］
［鑑定 看破 状態=REVEALED］
［隠蔽情報の一部を看破しました。］`],
['走査を妨害される',{色:'青'},`╔══════════════════════════╗
APPRAISAL BLOCKED
╚══════════════════════════╝
［鑑定 発動 スキル=鑑定］
［鑑定 走査 率=68 行=2］
対象：UNKNOWN
情報隠蔽：ACTIVE
［鑑定 妨害 状態=BLOCKED］
［不明な干渉を検出しました。］
［対象によって解析が遮断されました。］
［鑑定を強制終了します。］`],
['鑑定を感知される',{色:'青'},`╔══════════════════════════╗
SKILL ACTIVATION
╚══════════════════════════╝
［鑑定 発動 スキル=鑑定］
［鑑定 走査 率=42 行=2］
対象：黒衣の男
レベル：？？？｜隠し
［鑑定 感知 状態=DETECTED］
［警告！］
［対象が鑑定行為を検知しました。］
［対象がこちらに反応しています。］`],
['逆探知（走査の逆流）',{色:'青'},`╔══════════════════════════╗
REVERSE DETECTION
╚══════════════════════════╝
［鑑定 発動 スキル=鑑定］
［鑑定 走査 率=32 行=3］
対象：？？？｜認識阻害
種族：測定不能｜解析不能
レベル：？？？｜隠し
［エラー 1 ジジッ］
［鑑定 逆流 状態=COUNTER］
［走査方向が反転しました。］
［対象からの逆探知を検出しました。］
逆探知進行率：100%
情報保護：失敗
［あなたの位置情報が特定されました。］`],
['カウンター鑑定',{色:'青'},`╔══════════════════════════╗
COUNTER APPRAISAL
╚══════════════════════════╝
［鑑定 発動 スキル=鑑定］
［鑑定 走査 率=21 行=2］
対象：魔王軍幹部
レベル：？？？｜隠し
［エラー 1 ジジッ グリッチ］
［鑑定 逆流 状態=COUNTER］
［警告！］
［対象があなたを解析しています。］
【あなたのステータス】
名前：主人公
レベル：Lv.25
職業：魔法使い
HP：850 / 850
MP：420 / 420
［あなたの情報が対象に開示されました。］`],
['視線の逆転',{色:'黒'},`╔══════════════════════════╗
UNKNOWN INTERFERENCE
╚══════════════════════════╝
［鑑定を開始しました。］
［鑑定 走査 率=21 行=1］
解析率：21%
［エラー 1 ジジッ］
［鑑定 視線 状態=DETECTED］
［対象がこちらを見ています。］
［解析対象があなたを認識しました。］
『……見つけた。』
［鑑定を強制終了します。］`],
['反動（頭痛）',{色:'赤'},`╔══════════════════════════╗
SIDE EFFECT
╚══════════════════════════╝
［鑑定 反動］
［激しい頭痛が走ります。］
［視界が乱れています。］
［スキル使用による負荷を検出しました。］`],
['禁忌鑑定＋侵食',{色:'紫'},`╔══════════════════════════╗
FORBIDDEN APPRAISAL
╚══════════════════════════╝
［禁忌系スキルの使用を確認しました。］
侵食率：12%｜侵食
［このスキルを使うと、侵食が進行します。］
［鑑定 確認 スキル=深淵の眼］
［鑑定 発動 スキル=深淵の眼 強さ=上位］
［鑑定 走査 強さ=上位］
対象：聖女セレスティア
本当の正体：先代の魔王
［鑑定 反動］
［鑑定 侵食=+6］
鑑定使用回数：5
［使用者への侵食が進行しました。］
［一定値を超えると異常が発生する可能性があります。］`],
['MP・コインを消費する鑑定',{色:'青'},`╔══════════════════════════╗
APPRAISAL COST
╚══════════════════════════╝
使用スキル：【上級鑑定】
必要MP：100
必要コイン：500
現在MP：250
所持：2,000
［鑑定 確認 スキル=上級鑑定 MP=100 コイン=500］
［鑑定 発動 スキル=上級鑑定 強さ=上位］
［解析を開始します……］
［鑑定 走査 強さ=上位］
対象：レオンハルト
好感度：90%｜偽装｜真=-47%
［鑑定 看破 状態=REVEALED］`],
['MPが足りない',{色:'青'},`╔══════════════════════════╗
APPRAISAL COST
╚══════════════════════════╝
使用スキル：【神眼】
必要MP：500
現在MP：120
［鑑定 確認 スキル=神眼 MP=500］
［鑑定 発動 スキル=神眼 強さ=上位］
［鑑定 走査］
対象：？？？`],
['広域鑑定（複数の対象）',{色:'青'},`╔══════════════════════════╗
MULTI TARGET SCAN
╚══════════════════════════╝
［広域鑑定を発動しました。］
検出対象：3
［鑑定 走査 向き=往復］
対象01：レオン
解析結果：SUCCESS
対象02：カシス
解析結果：PARTIAL
対象03：UNKNOWN
解析結果：ACCESS DENIED
［3件の鑑定処理が終了しました。］`],
['侵食の危険域',{色:'黒'},`╔══════════════════════════╗
CRITICAL EROSION
╚══════════════════════════╝
侵食率：64%｜侵食
［鑑定 反動］
［鑑定 侵食=84%］
［警告！］
［使用者の状態が不安定です。］
［これ以上のスキル使用は危険です。］`]];
WINP['鑑定スキル・走査']=SCNP;
/* ===== ゲーム画面の行（システム窓の中で使う）=====
   インベントリ：「アイテム：回復ポーション｜×5｜R｜説明=HPを300回復」（押すと説明）／「獲得アイテム：古代の鍵｜SSR」は NEW で飛び込む
   戦闘：「ダメージ：9,999｜CRITICAL」「ダメージ：MISS」「回復：300」…上にある HP のゲージが減る・増える（対象=敵HP で選べる）
   選択肢：「① 微笑んで礼を言う｜結果=王太子は少し驚いた顔をした」「④ ？？？｜LOCKED」「② 逃げる｜固定」（固定＝どれを選んでもこれに直される）
     読者が押すまで待つ。押しても本文は変わらない（結果= の一言が出るだけ）
   ツリー（スキルツリー・ルート分岐）：「剣術 Lv.1｜済」「　├─ 高速斬撃｜済」「　└─ ？？？｜LOCKED」「　　└─ 個別ルート｜現在」
     ［鑑定 習得=高速斬撃］で、その枝が光って習得済みになる */
const GMRARE=r=>/^(SSR|UR|LR|レジェンド|伝説|神話|S{2,3}|EX)$/i.test(r)?'g':/^(SR|エピック|S|A)$/i.test(r)?'p':/^(R|レア|B)$/i.test(r)?'b':'n';
const GMICON=n=>[[/ポーション|薬|エリクサー/,'🧪'],[/石|結晶|宝石|魔石/,'💎'],[/鍵/,'🗝️'],[/剣|刀|ナイフ|短剣/,'🗡️'],[/盾/,'🛡️'],[/本|書|魔導書/,'📕'],[/巻物|スクロール/,'📜'],[/指輪|リング/,'💍'],[/弓/,'🏹'],[/杖/,'🪄'],[/鎧|ローブ|防具/,'🥋'],[/金貨|コイン/,'🪙'],[/パン|肉|食料/,'🍖'],[/花/,'🌸'],[/手紙|招待状/,'✉️']].find(([r])=>r.test(n))?.[1]||'◆';
function gmKV(p){const kv={};p.forEach(x=>{const j=x.indexOf('=');if(j>0)kv[x.slice(0,j).trim()]=x.slice(j+1).trim();else kv[x.trim()]=1});return kv}
function gmParse(l){let m;
  if((m=l.match(/^(アイテム|装備|獲得アイテム)\s*[：:]\s*(.+)$/))){const p=m[2].split('｜').map(s=>s.trim());let n=p[0],num='';const nm=n.match(/^【?(.+?)】?\s*[×x]\s*(\d+)$/);if(nm){n=nm[1];num=nm[2]}else n=n.replace(/^【|】$/g,'');
    const kv={};p.slice(1).forEach(x=>{const j=x.indexOf('=');if(j>0)kv[x.slice(0,j)]=x.slice(j+1);else if(/^[×x]?\d+$/.test(x))num=x.replace(/^[×x]/,'');else if(/^(N|R|SR|SSR|UR|LR|EX|コモン|レア|エピック|レジェンド|伝説|神話|[A-FS]{1,3})$/i.test(x))kv.等級=x;else kv[x]=1});
    return{k:'inv',d:{t:m[1],n,num,kv}}}
  if((m=l.match(/^(ダメージ|回復|DAMAGE|HEAL)\s*[：:]\s*(.+)$/i))){const p=m[2].split('｜').map(s=>s.trim());return{k:'dmg',d:{t:/回復|HEAL/i.test(m[1])?'heal':'dmg',v:p[0],kv:gmKV(p.slice(1))}}}
  if(/^[①-⑳]/.test(l)){const p=l.split('｜').map(s=>s.trim());return{k:'cho',d:{t:p[0],kv:gmKV(p.slice(1))}}}
  if(!/[：:]/.test(l)&&(/^[\s　]*(├|└|┣|┗)/.test(l)||/｜\s*(済|習得済|現在|未|未習得|LOCKED|封印|解放)\s*$/.test(l))){
    const lead=(l.match(/^[\s　]*/)||[''])[0],dep=[...lead].reduce((s,ch)=>s+(ch==='　'?1:.5),0)+(/^[\s　]*(├|└|┣|┗)/.test(l)?1:0);
    const body=l.trim().replace(/^(├|└|┣|┗)[─━]*\s*/,''),p=body.split('｜').map(s=>s.trim()),st=(p[1]||'').replace('習得済','済').replace('未習得','未').replace('封印','LOCKED');
    return{k:'tree',d:{n:p[0],st:st||'未',dep:Math.round(dep),last:/^[\s　]*(└|┗)/.test(l)}}}
  return mrParse(l)}
function gmRow(r,a,c0){const q=c0.indexOf('"'),cls=q<0?c0:c0.slice(0,q),at=q<0?'':c0.slice(q+1),d=r.d;
  switch(r.k){
    case'inv':{const rr=d.kv.等級?GMRARE(d.kv.等級):'n',nw=d.t==='獲得アイテム';
      return`<div class="${cls} r-${rr}${nw?' gnew':''}"${at} data-tap data-desc="${esc(d.kv.説明||'')}" data-name="${esc(d.n)}" data-rare="${esc(d.kv.等級||'')}"><span class="gic">${esc(d.kv.絵||GMICON(d.n))}</span><b>${esc(d.n)}</b>${d.num?`<em>×${esc(d.num)}</em>`:''}${d.kv.等級?`<small>${esc(d.kv.等級)}</small>`:''}${nw?'<i class="gnw">NEW</i>':''}${d.kv.装備中?'<i class="geq">E</i>':''}</div>`}
    case'dmg':{const miss=/MISS|DODGE|回避|ミス/i.test(d.v),crit=!!(d.kv.CRITICAL||d.kv.クリティカル);
      return`<div class="${cls} ${d.t}${crit?' crit':''}${miss?' miss':''}"${at} data-n="${miss?0:ecoN(d.v)}" data-to="${esc(d.kv.対象||'')}">${crit?'<small>CRITICAL HIT!</small>':''}<b class="gdv">${miss?esc(d.v.toUpperCase()):(d.t==='heal'?'+':'')+esc(d.v)}</b><span>${miss?'':d.t==='heal'?'HEAL':'DAMAGE'}</span></div>`}
    case'cho':{const lock=!!(d.kv.LOCKED||d.kv.ロック);
      return`<div class="${cls}${lock?' lock':''}${d.kv.固定?' fixed':''}"${at} data-res="${esc(d.kv.結果||'')}"><button type="button"${lock?' disabled':''}>${wDeco(d.t)}${lock?' <span class="glk">🔒</span>':''}</button></div>`}
    case'tree':return`<div class="${cls} t-${esc(d.st)}${d.last?' tlast':''}"${at} style="--dep:${d.dep}" data-name="${esc(d.n)}"><i class="tdot"></i><span>${d.st==='LOCKED'?'🔒 ':''}${wDeco(d.n)}</span>${d.st==='現在'?'<em>NOW</em>':''}</div>`}
  return mrRow(r,cls,at)}
/* 押せるところ（演出あり・なし共通） */
function gmBind(el){mrBind(el);if(el._gm)return;el._gm=1;
  el.addEventListener('click',e=>{const it=e.target.closest('.k-inv');if(it&&el.contains(it)){el.querySelectorAll('.k-inv.sel').forEach(x=>x!==it&&x.classList.remove('sel'));it.classList.toggle('sel');
      let pn=el.querySelector('.gpanel');if(!pn){pn=document.createElement('div');pn.className='gpanel';(el.querySelector('.wbody')||el).appendChild(pn)}
      if(!it.classList.contains('sel')){pn.remove();return}
      pn.innerHTML=`<b>【${esc(it.dataset.name)}】</b>${it.dataset.rare?`<small>等級：${esc(it.dataset.rare)}</small>`:''}<div>${esc(it.dataset.desc||'詳しい説明はありません。')}</div>`;pn.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:200});return}
    const b=e.target.closest('.k-cho button');if(b&&el.contains(b)&&!b.disabled)gmPick(el,b.closest('.k-cho'))})}
/* 選択肢を選ぶ：本文は変わらない。結果= があれば一言だけ出る。固定 があれば、そちらに直される */
async function gmPick(el,row){const grp=[];let x=row;while(x.previousElementSibling&&x.previousElementSibling.classList.contains('k-cho'))x=x.previousElementSibling;
  while(x&&x.classList.contains('k-cho')){grp.push(x);x=x.nextElementSibling}if(grp.some(g=>g.classList.contains('chosen')))return;
  grp.forEach(g=>g.querySelector('button').disabled=true);row.classList.add('chosen');SFX.pling&&!S.pvMute&&S.fx&&SFX.pling();vib(30);
  let fin=row;const fx=grp.find(g=>g.classList.contains('fixed'));
  if(fx&&fx!==row){await new Promise(r=>setTimeout(r,700));const b=row.querySelector('button');b.animate([{transform:'none',filter:'none'},{transform:'translateX(-5px)',filter:'drop-shadow(2px 0 #f0a) drop-shadow(-2px 0 #0ef)'},{transform:'none',filter:'none'}],{duration:260,iterations:2});
    await new Promise(r=>setTimeout(r,520));row.classList.remove('chosen');row.classList.add('denied');fx.classList.add('chosen');fin=fx;fx.animate([{filter:'brightness(2)'},{filter:'none'}],{duration:500})}
  const res=fin.dataset.res;if(res){const m=document.createElement('div');m.className='wl k-sys gres';m.textContent=`［${res}］`;grp.at(-1).after(m);m.animate([{opacity:0},{opacity:1}],{duration:400})}
  el._chosen=1;el.dispatchEvent(new Event('gmpick'))}
/* 窓の中で行が出たとき */
async function gmReveal(e,el,a,c){gmBind(el);if(e.matches('.k-pin,.k-call,.k-voice,.k-score,.k-dm,.k-alert,.k-tl'))return mrReveal(e,el,a,c);
  if(e.classList.contains('k-inv')&&e.classList.contains('gnew')){e.animate([{transform:'scale(1.8) rotate(-6deg)',opacity:0,filter:'brightness(3)'},{transform:'none',opacity:1,filter:'none'}],{duration:500,easing:'cubic-bezier(.3,1.5,.5,1)'});SFX.pling&&SFX.pling();vib([20,30,20]);await c.wait(300);return}
  if(e.classList.contains('k-dmg'))return gmHit(e,el,c);
  if(e.classList.contains('k-cho')){const nx=e.nextElementSibling;if(nx&&nx.classList.contains('k-cho'))return;/* すぐ後に段階の行があるときは待たない（選択肢が消える演出など） */if(nx&&nx.matches('.k-aps,.k-err'))return;/* 最後の選択肢が出たら、読者が選ぶまで待つ */
    if(c.skip||el._chosen)return;keepBottom();await new Promise(res=>{c.on(res);el.addEventListener('gmpick',res,{once:true})});if(c.dead)return;await c.wait(700);return}
  if(e.classList.contains('k-tree')&&e.classList.contains('t-現在'))e.animate([{boxShadow:'0 0 0 0 transparent'},{boxShadow:'0 0 14px var(--wc)'},{boxShadow:'0 0 0 0 transparent'}],{duration:900})}
async function gmHit(e,el,c){const n=+e.dataset.n||0,heal=e.classList.contains('heal'),crit=e.classList.contains('crit'),box=el.querySelector('.wbox')||el,v=e.querySelector('.gdv'),calm=RDM();
  if(e.classList.contains('miss')){if(!calm)v.animate([{transform:'translateX(30px)',opacity:0},{transform:'none',opacity:1}],{duration:300});SFX.swish&&SFX.swish();return}
  if(!calm){const txt=v.textContent;for(let i=1;i<=12;i++){v.textContent=(heal?'+':'')+ecoF(n*i/12);if(!await c.wait(28))return}v.textContent=txt;
    v.animate([{transform:'scale(2.4)',filter:'brightness(3)'},{transform:'scale(.9)'},{transform:'none',filter:'none'}],{duration:420,easing:'cubic-bezier(.3,1.6,.5,1)'});
    if(!heal){box.animate([{transform:'none'},{transform:`translate(${crit?-8:-4}px,${crit?3:1}px)`},{transform:`translate(${crit?6:3}px,-2px)`},{transform:'none'}],{duration:crit?380:240});if(crit){shake(6,320);flash&&flash('rgba(255,230,150,.35)',260)}}}
  SFX[heal?'pling':'thud']&&SFX[heal?'pling':'thud']();vib(heal?20:crit?[60,30,90]:40);
  /* 上にある HP のゲージを動かす */
  const to=e.dataset.to,rows=[...el.querySelectorAll('.k-gauge,.k-kv')].filter(r=>r.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING);
  const hp=rows.reverse().find(r=>{const nm=(r.querySelector('.rn')||r.querySelector(':scope>span'))?.textContent||'';return to?nm.includes(to):/HP|体力|生命力/.test(nm)});
  if(hp){const ve=hp.querySelector('.rv')||hp.querySelector(':scope>b'),raw=(hp.querySelector('.rrow')?.dataset.raw||ve.textContent),mm=raw.match(/([\d,]+)\s*\/\s*([\d,]+)/);
    if(mm){const cur=ecoN(mm[1]),max=ecoN(mm[2]),nv=Math.max(0,Math.min(max,heal?cur+n:cur-n)),bar=hp.querySelector('.rbar b');
      const rr=hp.querySelector('.rrow');if(rr)rr.dataset.raw=`${ecoF(nv)} / ${ecoF(max)}`;
      if(!calm){for(let i=1;i<=16;i++){const t=cur+(nv-cur)*i/16;ve.textContent=`${ecoF(t)} / ${ecoF(max)}`;if(bar)bar.style.width=(t/max*100)+'%';if(!await c.wait(30))return}}
      ve.textContent=`${ecoF(nv)} / ${ecoF(max)}`;if(bar)bar.style.width=(nv/max*100)+'%';hp.classList.toggle('gzero',nv===0)}}}
/* ［鑑定 習得=高速斬撃］：ツリーの枝が光って習得済みに */
async function gmLearn(el,name,w){const r=[...el.querySelectorAll('.k-tree')].find(x=>x.dataset.name.replace(/\s/g,'')===name.replace(/\s/g,''));if(!r)return;
  const sp=r.querySelector('span');r.className=r.className.replace(/\bt-\S+/,'t-済');if(sp.textContent.startsWith('🔒 '))sp.textContent=sp.textContent.slice(3);
  if(!w.fast&&!RDM()){r.animate([{transform:'scale(1.15)',filter:'brightness(3)'},{transform:'none',filter:'none'}],{duration:600,easing:'cubic-bezier(.3,1.5,.5,1)'});w.sfx('pling');vib([20,30,60]);await w.wait(700)}}

/* ===== 文例 ===== */
const GMP=[
['インベントリ',{色:'青'},`╔══════════════════════════╗
INVENTORY
╚══════════════════════════╝
アイテム：回復ポーション｜×5｜N｜説明=HPを300回復する。
アイテム：魔力石｜×3｜R｜説明=MPを回復する青い石。
アイテム：古代の鍵｜×1｜SSR｜説明=どの扉に合うのかは、まだわからない。
アイテム：黒鋼の剣｜SR｜装備中｜説明=攻撃力+120。
アイテム：鑑定の巻物｜×2｜R｜説明=一度だけ上級鑑定が使える。
アイテム：手紙｜×1｜N｜説明=差出人の名前が、にじんで読めない。
━━━━━━━━━━━━━━━━━━
所持数：9 / 50
［アイテムを押すと、説明が見られます。］`],
['アイテム獲得',{色:'金'},`╔══════════════════════════╗
ITEM ACQUIRED
╚══════════════════════════╝
［アイテムを獲得しました！］
獲得アイテム：古代神の魔力結晶｜神話｜説明=魔力上限を突破させる、と言われている。
獲得アイテム：回復ポーション｜×3｜N
［インベントリに追加されました。］`],
['戦闘ログ',{色:'赤'},`╔══════════════════════════╗
BATTLE LOG
╚══════════════════════════╝
敵：黒鉄のゴーレム
敵HP：10,000 / 10,000
━━━━━━━━━━━━━━━━━━
［スキル：雷撃を発動しました！］
ダメージ：9,999｜CRITICAL｜対象=敵HP
［対象に麻痺を付与しました。］
［ゴーレムの反撃！］
ダメージ：MISS
［攻撃を回避しました。］`],
['HPが減る・回復',{色:'青'},`╔══════════════════════════╗
STATUS
╚══════════════════════════╝
HP：850 / 850
MP：420 / 420
［魔物の攻撃！］
ダメージ：320
ダメージ：180
［ポーションを使用しました。］
回復：300`],
['上限突破',{色:'青'},`╔══════════════════════════╗
LIMIT BREAK
╚══════════════════════════╝
筋力：98
［制限 変化=筋力:99→100］
［最大値に到達しました。］
［エラー 1 ジジッ］
［制限 変化=筋力:101→ERROR→∞］
［能力値が測定可能な上限を超えました。］`],
['好感度の上限突破',{色:'金'},`╔══════════════════════════╗
AFFECTION LIMIT
╚══════════════════════════╝
対象：レオンハルト
好感度：99%
［制限 変化=好感度:100%→125%］
［好感度の上限が解除されました。］`],
['スキルツリー',{色:'青'},`╔══════════════════════════╗
SKILL TREE
╚══════════════════════════╝
剣術 Lv.1｜済
　└─ 剣術 Lv.3｜済
　　├─ 高速斬撃｜未
　　├─ 連続斬撃｜未
　　└─ ？？？｜LOCKED
━━━━━━━━━━━━━━━━━━
スキルポイント：3
［鑑定 習得=高速斬撃］
［スキル【高速斬撃】を習得しました！］`],
['ルート分岐',{色:'金'},`╔══════════════════════════╗
ROUTE MAP
╚══════════════════════════╝
共通ルート｜済
　├─ 王太子ルート｜済
　├─ 騎士団長ルート｜現在
　├─ 魔術師ルート｜未
　└─ ？？？ルート｜LOCKED
━━━━━━━━━━━━━━━━━━
ルート進行率：62%
［隠しルートの解放条件を満たしていません。］`],
['選択肢',{色:'金'},`╔══════════════════════════╗
CHOICE
╚══════════════════════════╝
［王太子にどう返答しますか？］
① 微笑んで礼を言う｜結果=王太子は、少しだけ目を細めた。
② 無視する｜結果=空気が、ぴんと張りつめた。
③ 本音を伝える｜結果=王太子は、言葉を失っている。
④ ？？？｜LOCKED`],
['選択肢の消失',{色:'青'},`╔══════════════════════════╗
CHOICE
╚══════════════════════════╝
① 王子に微笑む
② 王子を拒絶する
③ 逃げる
［エラー 1 ジジッ］
［制限 消える 数=2］
［選択可能な行動が制限されました。］`],
['偽の選択肢',{色:'黒'},`╔══════════════════════════╗
CHOICE
╚══════════════════════════╝
［どうしますか？］
① 剣を取る
② 逃げる
③ 彼を信じる｜固定｜結果=……その選択以外は、許されていない。
［選択が修正されました。］`]];
WINP['ゲーム画面']=GMP;
/* ===== 端末・電話・音声・得点・昇格（システム画面の中で使う）=====
   PIN：0412｜誤=1111,2580｜試行=3 …まちがえた番号を打って弾かれ、最後に正しい番号で解除（誤が試行以上ならロックアウト）
   着信中：非通知｜番号=080-0000-0000 …応答／拒否を押すまで待つ（押しても本文は変わらない）
   着信：ミオ｜昨日 23:41｜不在　発信：マネージャー｜10:12｜2:13 …通話履歴
   音声：証言_0412.wav｜1:24｜欠損=40-55 …波形が流れて再生される（欠損は%の範囲）
   候補：STAR☆LINE｜音源=4,210｜アルバム=1,800｜放送=1,200｜投票=850 …最後の候補が出たら合計が数え上がって、1位が光る
   ［制限 昇格=境地:絶頂］…「境地」の行が 一流 ↓ 絶頂 と大きく変わる（ランク・階級・境地など何でも） */
/* 受話器のマーク（画像なし） */
const MRPH='<svg viewBox="0 0 24 24" class="mph" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';
/* 着信音：トゥルル…を短く2回。演出オン・音ありのときだけ */
SFX.ring=snd((v=1)=>{const t=now();for(let k=0;k<2;k++){const s=t+k*.42;for(let i=0;i<9;i++)tone('sine',i%2?1180:1420,s+i*.038,.035,.09*v)}});
SFX.hang=snd(()=>{const t=now();tone('sine',480,t,.12,.12);tone('sine',480,t+.2,.12,.12)});
const mrKV=p=>{const kv={};p.forEach(x=>{const j=x.indexOf('=');if(j>0)kv[x.slice(0,j).trim()]=x.slice(j+1).trim();else if(x.trim())(kv._||(kv._=[])).push(x.trim())});return kv};
function mrParse(l){let m;
  if((m=l.match(/^(PIN|パスワード|パスコード)\s*[：:]\s*(.+)$/i))){const p=m[2].split('｜').map(s=>s.trim());return{k:'pin',d:{v:p[0],kv:mrKV(p.slice(1)),pw:!/PIN|パスコード/i.test(m[1])}}}
  if((m=l.match(/^着信中\s*[：:]\s*(.+)$/))){const p=m[1].split('｜').map(s=>s.trim());return{k:'call',d:{n:p[0],kv:mrKV(p.slice(1))}}}
  if((m=l.match(/^(着信|発信|不在着信)\s*[：:]\s*(.+)$/))){const p=m[2].split('｜').map(s=>s.trim());return{k:'clog',d:{t:m[1],n:p[0],time:p[1]||'',st:p[2]||(m[1]==='不在着信'?'不在':'')}}}
  if((m=l.match(/^(音声|録音|ボイス)\s*[：:]\s*(.+)$/))){const p=m[2].split('｜').map(s=>s.trim());return{k:'voice',d:{n:p[0],len:(p[1]&&!p[1].includes('='))?p[1]:'0:30',kv:mrKV(p.slice(1))}}}
  if((m=l.match(/^候補\s*[：:]\s*(.+)$/))){const p=m[1].split('｜').map(s=>s.trim()),kv=mrKV(p.slice(1)),parts=Object.entries(kv).filter(([k])=>k!=='_'&&k!=='合計');
    return{k:'score',d:{n:p[0],parts,total:kv.合計?ecoN(kv.合計):parts.reduce((s,[,v])=>s+ecoN(v),0)}}}
  /* ミステリー：検索履歴／不審なメッセージ／緊急速報／事件の年表 */
  if((m=l.match(/^検索\s*[：:]\s*(.+)$/))){const p=m[1].split('｜').map(s=>s.trim());return{k:'srch',d:{q:p[0],time:p[1]||'',st:p.slice(2).join(' ')}}}
  if((m=l.match(/^(受信|送信)\s*[：:]\s*(.+)$/))){const p=m[2].split('｜').map(s=>s.trim()),kv=mrKV(p.slice(3));return{k:'dm',d:{me:m[1]==='送信',n:p[0],time:p[1]||'',t:p[2]||'',kv}}}
  if((m=l.match(/^速報\s*[：:]\s*(.+)$/))){const p=m[1].split('｜').map(s=>s.trim());return{k:'alert',d:{t:p[0],kv:mrKV(p.slice(1))}}}
  if((m=l.match(/^年表\s*[：:]\s*(.+)$/))){const p=m[1].split('｜').map(s=>s.trim()),kv=mrKV(p.slice(2));return{k:'tl',d:{date:p[0],t:p[1]||'',kv}}}
  return null}
function mrRow(r,cls,at){const d=r.d;
  switch(r.k){
    case'pin':{const n=d.pw?8:Math.max(4,d.v.length);return`<div class="${cls}"${at} data-v="${esc(d.v)}" data-bad="${esc(d.kv.誤||'')}" data-try="${esc(d.kv.試行||'5')}" data-home="${esc(d.kv.ホーム||'')}" data-time="${esc(d.kv.時刻||'')}"><div class="pnh"><span class="pnl">🔒</span><b>${d.pw?'パスワードを入力':'パスコードを入力'}</b><small class="pnt">残り試行回数：${esc(d.kv.試行||'5')}</small></div><div class="pnd">${'<i></i>'.repeat(n)}</div><div class="pnk">${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(x=>`<span>${x}</span>`).join('')}</div><div class="pnm"></div></div>`}
    case'call':return`<div class="${cls}"${at}${d.kv.無視?` data-auto="${esc(d.kv.無視)}" data-rec="${esc(d.kv.録音||'')}"`:''}><div class="clav">${MRPH}</div><small>着信中…</small><b>${esc(d.n)}</b>${d.kv.番号?`<span>${esc(d.kv.番号)}</span>`:''}<div class="clb"><label><button type="button" data-a="n">${MRPH}</button>拒否</label><label><button type="button" data-a="y">${MRPH}</button>応答</label></div><em class="clt"></em></div>`;
    case'clog':{const miss=/不在|応答なし/.test(d.st),out=d.t==='発信';return`<div class="${cls}${miss?' miss':''}"${at}><i class="cli">${MRPH}<u>${out?'↗':miss?'✕':'↙'}</u></i><b>${esc(d.n)}</b><span>${esc(d.time)}</span><em>${esc(d.st||(out?'発信':'着信'))}</em></div>`}
    case'voice':{let h='';for(let i=0;i<48;i++){const v=.25+.75*Math.abs(Math.sin(i*1.7+d.n.length)*Math.cos(i*.43));h+=`<i style="height:${(v*100).toFixed(0)}%"></i>`}
      const ms=(d.kv.欠損||'').split('-').map(Number);return`<div class="${cls}"${at} data-cut="${esc(d.kv.欠損||'')}"><button type="button" class="vpl">▶</button><div class="vbody"><b>${esc(d.n)}</b><div class="vwv">${h}${ms.length===2?`<u style="left:${ms[0]}%;width:${ms[1]-ms[0]}%"></u>`:''}</div><small><span class="vtm">0:00</span> / ${esc(d.len)}</small></div></div>`}
    case'score':return`<div class="${cls}"${at} data-total="${d.total}"><div class="mrn"><b>${esc(d.n)}</b><small>${d.parts.map(([k,v])=>`${esc(k)} ${esc(v)}`).join('　')}</small></div><em class="mrt">0</em></div>`;
    case'srch':{const del=/削除/.test(d.st),rest=/復元/.test(d.st);return`<div class="${cls}${del?' del':''}${rest?' rest':''}"${at}><i>🔍</i><b>${esc(d.q)}</b><span>${esc(d.time)}</span>${d.st?`<em>${esc(d.st)}</em>`:''}</div>`}
    case'dm':{const unk=/不明|非通知|unknown|？/i.test(d.n);return`<div class="${cls}${d.me?' me':''}${unk?' unk':''}"${at} data-del="${d.kv.削除?1:''}" data-to="${esc(d.kv.変化||'')}">${d.me?'':`<i class="dav">${unk?'?':esc([...d.n][0]||'?')}</i>`}<div><small>${esc(d.n)}　${esc(d.time)}</small><p>${wDeco(d.t)}</p>${d.me?'<u>既読</u>':''}</div></div>`}
    case'alert':return`<div class="${cls}"${at}><div class="alh"><b>緊急速報</b>${d.kv.日時?`<span>${esc(d.kv.日時)}</span>`:''}</div><p>${wDeco(d.t)}</p>${d.kv.地域?`<small>対象地域：${esc(d.kv.地域)}</small>`:''}${d.kv.続報?`<em class="alf">続報：${esc(d.kv.続報)}</em>`:''}</div>`;
    case'tl':{const un=!!(d.kv.未確認||d.kv['?']),ch=d.kv.変更||'';return`<div class="${cls}${un?' un':''}"${at} data-to="${esc(ch)}"><i></i><time>${esc(d.date)}</time><span class="tlt">${wDeco(d.t)}</span>${un?'<em>未確認</em>':''}</div>`}}
  return`<div class="${cls}"${at}>${esc(r.l)}</div>`}
const mrSleep=(c,ms)=>c&&c.wait?c.wait(ms):new Promise(r=>setTimeout(()=>r(true),ms));
/* 押せるところ */
function mrBind(el){if(el._mr)return;el._mr=1;
  el.addEventListener('click',e=>{const v=e.target.closest('.k-voice .vpl');if(v&&el.contains(v)){mrPlay(v.closest('.k-voice'),null);return}
    /* ホーム画面のアプリを開く・戻る */
    const ap=e.target.closest('.pnhome [data-app]');if(ap&&el.contains(ap)){const h=ap.closest('.pnhome'),box=h.querySelector('.phapp');box.innerHTML=mrApp(el,ap.dataset.app,h.closest('.k-pin'));h.classList.add('appon');box.animate([{opacity:0,transform:'scale(.92)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});vib(10);return}
    const bk=e.target.closest('.pnhome .phbk');if(bk&&el.contains(bk)){bk.closest('.pnhome').classList.remove('appon');vib(10);return}
    const cb=e.target.closest('.k-call button');if(cb&&el.contains(cb)){const row=cb.closest('.k-call');if(row.dataset.ans)return;row.dataset.ans=cb.dataset.a;row.querySelectorAll('button').forEach(x=>x.disabled=true);row.classList.add(cb.dataset.a==='y'?'on':'off');
      const t=row.querySelector('.clt');if(row._ring){clearInterval(row._ring);row._ring=0}cb.dataset.a==='y'?SFX.pling&&SFX.pling():SFX.hang&&SFX.hang();if(cb.dataset.a==='y'){let s=0;t.textContent='通話中 00:00';const iv=setInterval(()=>{if(!row.isConnected||s>=8){clearInterval(iv);if(row.isConnected)t.textContent=`通話終了 00:${String(s).padStart(2,'0')}`;return}s++;t.textContent=`通話中 00:${String(s).padStart(2,'0')}`},1000)}else t.textContent='着信を拒否しました';
      vib(30);el.dispatchEvent(new Event('mrcall'))}})}
async function mrPlay(row,c){if(row._pl)return;row._pl=1;const bars=[...row.querySelectorAll('.vwv i')],tm=row.querySelector('.vtm'),len=row.querySelector('small').textContent.split('/')[1].trim(),[mm,ss]=len.split(':').map(Number),tot=(mm||0)*60+(ss||0);
  const cut=(row.dataset.cut||'').split('-').map(Number),btn=row.querySelector('.vpl');btn.textContent='❚❚';row.classList.add('play');
  const ms=Math.min(6000,Math.max(2500,tot*60));for(let i=0;i<=bars.length;i++){const p=i/bars.length*100;bars.forEach((b,j)=>b.classList.toggle('on',j<i));const sec=Math.round(tot*i/bars.length);tm.textContent=`${sec/60|0}:${String(sec%60).padStart(2,'0')}`;
    const inCut=cut.length===2&&p>=cut[0]&&p<=cut[1];row.classList.toggle('cut',inCut);if(inCut&&Math.random()<.3)row.animate([{transform:'translateX(-2px)'},{transform:'none'}],{duration:80});
    if(!await mrSleep(c,ms/bars.length))return}
  row.classList.remove('play','cut');btn.textContent='▶';row._pl=0}
async function mrReveal(e,el,a,c){mrBind(el);const calm=RDM();
  /* 不審なメッセージ：届く。削除 があれば、少しして送信取り消しに。変化=… があれば本文が書き換わる */
  if(e.classList.contains('k-dm')){if(!e.classList.contains('me')){SFX.notif&&SFX.notif();vib([30,40,30])}else{const u=e.querySelector('u');u.style.opacity=0;if(!await c.wait(1200))return;u.style.opacity=1}
    const p=e.querySelector('p');if(e.dataset.to){if(!await c.wait(1800))return;if(!await apScr(p,wDeco(e.dataset.to),{wait:ms=>c.wait(ms),fast:calm},6))return;e.classList.add('chg')}
    if(e.dataset.del){if(!await c.wait(2200))return;if(!calm)e.animate([{transform:'none',filter:'none'},{transform:'translateX(-4px)',filter:'drop-shadow(2px 0 #f0a) drop-shadow(-2px 0 #0ef)'},{transform:'none',filter:'none'}],{duration:260,iterations:2});
      p.textContent='このメッセージは送信取り消しされました';e.classList.add('gone');SFX.crackle&&SFX.crackle(.08,.2)}return}
  if(e.classList.contains('k-alert')){SFX.alarm&&SFX.alarm();vib([200,80,200,80,200]);if(!calm)e.animate([{transform:'translateY(-14px)',opacity:0},{transform:'none',opacity:1}],{duration:380,easing:'cubic-bezier(.3,1.4,.5,1)'});return}
  /* 年表：変更=… があれば、日付はそのままで出来事だけが書き換わる */
  if(e.classList.contains('k-tl')&&e.dataset.to){if(!await c.wait(1400))return;const t=e.querySelector('.tlt');if(!await apScr(t,`<s>${esc(t.textContent)}</s> <b class="aperr">${esc(e.dataset.to)}</b>`,{wait:ms=>c.wait(ms),fast:calm},6))return;e.classList.add('chg');SFX.crackle&&SFX.crackle(.06,.2);return}
  if(e.classList.contains('k-pin'))return mrPin(e,c,calm);
  if(e.classList.contains('k-call')&&e.dataset.auto){/* だれも出ない着信：鳴りつづけて、勝手につながり、録音が始まる */
    const n=+e.dataset.auto||3,rec=+e.dataset.rec||10,t=e.querySelector('.clt');e.querySelectorAll('button').forEach(x=>x.disabled=true);
    for(let i=0;i<n;i++){SFX.ring&&SFX.ring(.7);vib([200,100,200]);if(!await c.wait(calm?60:2400))return}
    e.dataset.ans='y';e.classList.add('on','rec');SFX.pling&&SFX.pling();
    if(!calm)e.animate([{filter:'none'},{filter:'brightness(1.6) hue-rotate(-30deg)'},{filter:'none'}],{duration:260,iterations:2});
    const pad=s=>`${String(s/60|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    for(let s=0;s<=rec;s++){t.innerHTML=`<span class="clrec">● 録音中</span>通話中 ${pad(s)}`;if(s===rec)break;if(!await c.wait(calm?20:1000))return}
    return}
  if(e.classList.contains('k-call')){/* 応答か拒否を押すまで、着信音が鳴りつづける（8回まで） */let n=0;const ring=()=>{if(c.dead||!e.isConnected||e.dataset.ans||n++>=8){clearInterval(e._ring);e._ring=0;return}SFX.ring&&SFX.ring();vib([200,100,200])};ring();e._ring=setInterval(ring,2400);c.on(()=>{clearInterval(e._ring)});const nx=e.nextElementSibling;if(nx&&nx.matches('.k-aps,.k-err'))return;if(c.skip)return;keepBottom();await new Promise(res=>{c.on(res);el.addEventListener('mrcall',res,{once:true})});await c.wait(900);return}
  if(e.classList.contains('k-voice')){if(!calm)await mrPlay(e,c);return}
  if(e.classList.contains('k-score')){const nx=e.nextElementSibling;if(nx&&nx.classList.contains('k-score'))return;let x=e;const grp=[e];while(x.previousElementSibling&&x.previousElementSibling.classList.contains('k-score')){x=x.previousElementSibling;grp.unshift(x)}
    if(!await c.wait(600))return;const tot=grp.map(g=>+g.dataset.total||0),max=Math.max(...tot),N=calm?1:40;
    for(let i=1;i<=N;i++){grp.forEach((g,j)=>g.querySelector('.mrt').textContent=ecoF(tot[j]*i/N));if(i%4===0)SFX.tick&&SFX.tick(.12);if(!await c.wait(45))return}
    if(!await c.wait(700))return;grp.forEach((g,j)=>{if(tot[j]===max){g.classList.add('scwin');g.querySelector('.mrn b').insertAdjacentHTML('afterbegin','<span class="crown">👑 1位</span>');if(!calm)g.animate([{transform:'scale(1)'},{transform:'scale(1.05)',filter:'brightness(1.8)'},{transform:'none',filter:'none'}],{duration:700})}else g.classList.add('lose')});
    SFX.pling&&SFX.pling();vib([30,40,90]);if(!calm&&typeof coins==='function')try{coins(c,40)}catch(er){}}}
async function mrPin(e,c,calm){const v=e.dataset.v,bad=(e.dataset.bad||'').split(/[,，、]/).map(s=>s.trim()).filter(Boolean),tries=parseInt(e.dataset.try)||5,dots=[...e.querySelectorAll('.pnd i')],msg=e.querySelector('.pnm'),left=e.querySelector('.pnt');
  const type=async s=>{dots.forEach(d=>d.className='');for(let i=0;i<s.length&&i<dots.length;i++){dots[i].className='on';const k=[...e.querySelectorAll('.pnk span')].find(x=>x.textContent===s[i]);if(k&&!calm)k.animate([{background:'rgba(255,255,255,.35)'},{background:'transparent'}],{duration:260});SFX.key&&SFX.key();if(!await c.wait(calm?20:230))return false}return true};
  let n=tries;for(const b of bad){if(!await type(b))return;n--;left.textContent=`残り試行回数：${n}`;msg.textContent=n>0?'［認証に失敗しました。］':'［ロックアウトされました。］';msg.className='pnm bad';
    if(!calm)e.querySelector('.pnd').animate([{transform:'translateX(-8px)'},{transform:'translateX(8px)'},{transform:'translateX(-4px)'},{transform:'none'}],{duration:320});SFX.warn&&SFX.warn();vib([40,30,40]);
    if(!await c.wait(900))return;if(n<=0){e.classList.add('lockout');e.querySelector('.pnl').textContent='⛔';return}}
  if(!await type(v))return;msg.textContent='［認証に成功しました。］';msg.className='pnm ok';e.classList.add('open');e.querySelector('.pnl').textContent='🔓';SFX.pling&&SFX.pling();vib([20,30,60]);if(!await c.wait(700))return;
  /* 解除したら、かんたんなホーム画面（ホーム=なし で出さない） */
  if(e.dataset.home!=='なし'){const h=document.createElement('div');h.className='pnhome';h.innerHTML=mrHome(e.dataset.home,e.dataset.time);e.querySelectorAll('.pnh,.pnd,.pnk,.pnm').forEach(x=>x.style.display='none');e.appendChild(h);
    if(!calm)h.animate([{opacity:0,transform:'scale(1.08)',filter:'blur(4px)'},{opacity:1,transform:'none',filter:'none'}],{duration:450,easing:'ease-out'});await c.wait(500)}}
/* ホーム画面：時計・日付と、アプリの並び（通知の数はアプリ名の後ろに :3） */
const MRAPP={LINE:'💬',電話:'📞',メッセージ:'💬',写真:'🖼️',カメラ:'📷',メモ:'📝',検索:'🔍',地図:'🗺️',メール:'✉️',カレンダー:'📅',設定:'⚙️',録音:'🎙️',SNS:'🐦',時計:'⏰',音楽:'🎵',天気:'⛅',ファイル:'📁'};
function mrHome(list,time){const apps=(list||'電話,メッセージ:3,写真,カメラ,メモ,検索,地図,録音,カレンダー,ファイル,SNS,設定').split(/[,，、]/).map(s=>s.trim()).filter(Boolean);
  const [tm,dt]=(time||'03:33,10月13日 金曜日').split(/[,，]/);
  return`<div class="phtm">${esc(tm||'')}</div><div class="phdt">${esc(dt||'')}</div><div class="phap">${apps.map(x=>{const [n,b]=x.split(':');return`<span data-app="${esc(n)}" data-tap><i>${MRAPP[n]||'▢'}${b?`<u>${esc(b)}</u>`:''}</i><small>${esc(n)}</small></span>`}).join('')}</div><div class="phapp"></div>`}
/* アプリを開く：同じシステム画面に書いた行（通話履歴・メッセージ・検索履歴・音声・年表）があれば、それが中身になる。押しても本文は変わらない */
function mrApp(el,name,home){const pick=sel=>[...(el.querySelector(sel)?el:ecoRoot(el)).querySelectorAll(sel)].filter(r=>!r.closest('.pnhome')).map(r=>{const c=r.cloneNode(true);c.classList.remove('wpend','scanp');c.style.cssText='';return c.outerHTML}).join('');
  const none=t=>`<p class="phno">${esc(t)}</p>`,tm=(home.dataset.time||'03:33,10月13日').split(/[,，]/),day=+(String(tm[1]||'').match(/(\d+)日/)||[])[1]||13,mon=+(String(tm[1]||'').match(/(\d+)月/)||[])[1]||10;
  const photos=GIMG().filter(n=>/^ph_/.test(n)).slice(0,12);let body='';
  switch(name){
    case'電話':body=pick('.k-clog')||none('通話履歴はありません');break;
    case'メッセージ':body=pick('.k-dm')||none('メッセージはありません');break;
    case'検索':body=`<div class="phsb">🔍 検索</div>`+(pick('.k-srch')||none('検索履歴はありません'));break;
    case'録音':case'ファイル':body=pick('.k-voice')||none(name==='録音'?'録音はありません':'ファイルはありません');break;
    case'カレンダー':{let g='';const first=new Date(2026,mon-1,1).getDay(),dn=new Date(2026,mon,0).getDate();for(let i=0;i<first;i++)g+='<i></i>';for(let d=1;d<=dn;d++)g+=`<i class="${d===day?'on':''}">${d}</i>`;
      body=`<div class="phcal"><b>${mon}月</b><div class="phcw">${'日月火水木金土'.split('').map(x=>`<em>${x}</em>`).join('')}${g}</div></div>`+pick('.k-tl');break}
    case'写真':body=photos.length?`<div class="phph">${photos.map(n=>`<i style="background-image:url(a/${n}.jpg)"></i>`).join('')}</div>`:none('写真はありません');break;
    case'地図':body=GIMG().includes('ph_map')?`<div class="phmap" style="background-image:url(a/ph_map.jpg)"><b>📍</b></div>`:none('地図を読み込めません');break;
    case'カメラ':body='<div class="phcam"><i></i><b>●</b></div>';break;
    case'メモ':body=none('メモはありません');break;
    case'設定':body=['✈️ 機内モード','📶 Wi-Fi','🔔 通知','🔒 プライバシー','👤 アカウント'].map(x=>`<div class="phset">${x}<span>›</span></div>`).join('');break;
    default:body=none('このアプリは開けません')}
  return`<div class="phbar"><button type="button" class="phbk" data-tap>‹ ホーム</button><b>${MRAPP[name]||''} ${esc(name)}</b></div><div class="phbody">${body}</div>`}
/* ［制限 昇格=境地:絶頂］ */
async function mrRank(el,v,w,row){const i=v.search(/[:：]/),nm=i<0?'ランク':v.slice(0,i),nv=i<0?v:v.slice(i+1),r=scFind(el,nm),old=r?scVal(r).textContent.trim():'？？？',box=el.querySelector('.wbox')||el,calm=!!w.fast||RDM();
  const p=document.createElement('div');p.className='wl k-scd rank';p.innerHTML=`<small>${esc(nm)}</small><s>${esc(old)}</s><i>↓</i><b>${esc(nv)}</b>`;(row||box.lastChild).after(p);
  const nb=p.querySelector('b');if(!calm){nb.style.opacity=0;p.animate([{opacity:0},{opacity:1}],{duration:300});if(!await w.wait(700))return false;nb.style.opacity='';
    nb.animate([{opacity:0,transform:'scale(2.6)',filter:'blur(4px) brightness(2)'},{opacity:1,transform:'none',filter:'none'}],{duration:420,easing:'cubic-bezier(.3,1.4,.5,1)'});box.animate([{boxShadow:'inset 0 0 0 0 transparent'},{boxShadow:'inset 0 0 50px rgba(255,215,90,.55)'},{boxShadow:'inset 0 0 0 0 transparent'}],{duration:1200});vib([30,40,90])}
  w.sfx('pling');if(r){r.classList.add('scchg');if(!await apScr(scVal(r),`<b class="aptrue">${esc(nv)}</b>`,w))return false}if(!w.fast&&!await w.wait(500))return false}

/* ===== 文例 ===== */
const MRP=[
['端末のロック解除',{色:'黒',形:'端末'},`╔══════════════════════════╗
LOCKED DEVICE
╚══════════════════════════╝
［被害者のスマートフォン］
PIN：0412｜誤=1234,0000｜試行=5｜時刻=03:33,10月13日 金曜日｜ホーム=電話:2,メッセージ:5,写真,カメラ,メモ,検索,地図,録音,カレンダー,ファイル,SNS,設定
［ロックが解除されました。］`],
['ロックアウト',{色:'赤',形:'端末'},`╔══════════════════════════╗
SECURITY
╚══════════════════════════╝
PIN：9999｜誤=1111,2580,0000｜試行=3
［端末がロックされました。管理者に連絡してください。］`],
['着信（非通知）',{色:'黒',形:'端末'},`［深夜 3:33］
着信中：非通知
［……誰からだろう。］`],
['通話履歴',{色:'青',形:'端末'},`╔══════════════════════════╗
RECENT CALLS
╚══════════════════════════╝
着信：ミオ｜昨日 23:41｜不在
発信：マネージャー｜昨日 22:10｜2:13
着信：非通知｜今日 03:33｜不在
着信：非通知｜今日 03:33｜不在
着信：非通知｜今日 03:34｜0:47`],
['音声記録',{色:'青',形:'端末'},`╔══════════════════════════╗
AUDIO EVIDENCE
╚══════════════════════════╝
音声：証言_0412.wav｜1:24｜欠損=55-72
> 「あの夜、私は確かに――」
> 「……（ノイズ）……」
> 「――だから、あの人は来なかったんです」
［一部の音声が欠損しています。］`],
['破損ファイルの復元',{色:'青',形:'端末'},`╔══════════════════════════╗
FILE CORRUPTED
╚══════════════════════════╝
ファイル名：case_0412.dat
復元率：12%
［制限 変化=復元率:48%→93%］
［復元完了］
日付：████年██月██日
対象人物：？？？
［一部の情報を復元できませんでした。］`],
['音楽番組1位発表',{色:'紫'},`╔══════════════════════════╗
MUSIC SHOW No.1
╚══════════════════════════╝
［今週の1位候補を発表します。］
候補：STAR☆LINE｜音源=4,210｜アルバム=1,800｜放送=1,200｜投票=850
候補：NOVA｜音源=4,580｜アルバム=1,320｜放送=1,100｜投票=600
［1位、おめでとうございます！］`],
['アルバム売上速報',{色:'金'},`╔══════════════════════════╗
ALBUM SALES
╚══════════════════════════╝
アルバム名：BLUE HOUR
初動売上：0枚
［制限 変化=初動売上:182,400枚→413,920枚］
［グループ自己最高記録を更新しました！］`],
['ギルド運営',{色:'金'},`╔══════════════════════════╗
GUILD STATUS
╚══════════════════════════╝
ギルド名：銀の天秤
ギルドレベル：Lv.7
所属人数：48
資金：12,400,000 G
貢献度：62%
◆ 施設
・訓練場 Lv.3
・鍛冶場 Lv.2
・図書室 LOCKED
［制限 昇格=ギルドレベル:Lv.8］
［ギルドレベルが上がりました！］`],
['領地経営',{色:'青'},`╔══════════════════════════╗
TERRITORY
╚══════════════════════════╝
領地名：エルナ辺境伯領
人口：3,200
税収：480,000 G
治安：41%
食料：72%
軍事力：C
［制限 変化=治安:41%→63%］
［治安が改善されました。］`],
['錬金術・制作',{色:'紫'},`╔══════════════════════════╗
ALCHEMY
╚══════════════════════════╝
レシピ：上級回復薬
◆ 必要素材
・月光草 ×3
・妖精の涙 ×1
制作成功率：65%
［鑑定 確認 スキル=錬金術 文=制作を開始しますか？］
［鑑定 走査 回数=2 向き=往復 行=1］
［大成功！］
獲得アイテム：上級回復薬｜×3｜SR｜説明=品質：最高`],
['オークション',{色:'金'},`╔══════════════════════════╗
AUCTION
╚══════════════════════════╝
出品物：古代竜の鱗
開始価格：1,000,000 G
現在価格：1,000,000G
［制限 変化=現在価格:1,500,000G→3,200,000G→8,000,000G］
・入札：北の商会
・入札：匿名の貴族
・入札：あなた
［落札しました！］`],
['境地突破（武侠）',{色:'金'},`╔══════════════════════════╗
境地突破
╚══════════════════════════╝
姓名：白無垢
門派：華山派
境地：一流
内功：七十年
［制限 昇格=境地:絶頂］
［境地突破に成功しました。］`],
['江湖ランキング',{色:'赤'},`╔══════════════════════════╗
江湖高手録
╚══════════════════════════╝
一位　剣魔　　　天魔神教　玄境
二位　白衣剣仙　華山派　　玄境
三位　毒手羅刹　唐門　　　化境
［順位が更新されました。］
あなたの順位：三百十二位
［制限 変化=あなたの順位:九十九位］`],
['武功秘笈',{色:'金',形:'ファンタジー'},`╔══════════════════════════╗
秘伝書
╚══════════════════════════╝
武功名：梅花剣法
等級：絶世
流派：華山派
習得条件：内功 三十年以上
◆ 修練段階
第一式｜済
　├─ 第二式｜済
　├─ 第三式｜現在
　└─ 奥義・梅花落｜LOCKED`]];
WINP['端末・芸能・経営・武侠']=MRP;
const MYP=[
...MRP.filter(p=>['端末のロック解除','ロックアウト','着信（非通知）','通話履歴','音声記録','破損ファイルの復元'].includes(p[0])),
['検索履歴（削除済み）',{色:'青',形:'端末'},`╔══════════════════════════╗
SEARCH HISTORY
╚══════════════════════════╝
検索：駅前 パン屋 閉店 理由｜10/12 21:04
検索：屋上 鍵 開け方｜10/13 02:51｜削除済み
検索：人が 消える 方法｜10/13 03:12｜削除済み
検索：四〇四号室｜10/13 03:33｜復元
［削除された履歴の一部を復元しました。］`],
['不審なメッセージ',{色:'黒',形:'端末'},`╔══════════════════════════╗
MESSAGE
╚══════════════════════════╝
受信：不明な送信者｜03:33｜今、ひとり？
送信：あなた｜03:34｜誰ですか
受信：不明な送信者｜03:34｜うしろ
受信：不明な送信者｜03:35｜みないで｜削除`],
['書き換わるメッセージ',{色:'青',形:'端末'},`受信：ミオ｜昨日 22:10｜今日は楽しかったね！｜変化=今日は、来なかったね
［メッセージの内容が更新されました。］`],
['緊急速報',{色:'赤'},`速報：〇〇市北区で大規模な停電が発生しています。不要な外出は控えてください。｜地域=〇〇市北区｜日時=10/13 03:33｜続報=停電の原因は、現在も不明です。`],
['事件の年表（書き換わる）',{色:'青'},`╔══════════════════════════╗
TIMELINE
╚══════════════════════════╝
年表：10/12 21:04｜被害者が駅前のパン屋に立ち寄る
年表：10/12 23:41｜ミオからの不在着信
年表：10/13 02:51｜被害者が帰宅｜変更=帰宅していない
年表：10/13 03:33｜？？？｜未確認
［記録の一部が書き換えられています。］`],
['記憶の欠落',{色:'黒'},`╔══════════════════════════╗
MEMORY
╚══════════════════════════╝
名前：佐倉ミナ
関係：幼なじみ
最後に会った日：10月12日
［エラー 1 ジジッ］
［制限 消える 数=3］
［この人物に関する記録が見つかりません。］`],
['怪異の侵入',{色:'青'},`╔══════════════════════════╗
NOTICE
╚══════════════════════════╝
［今日の天気：くもり］
［予定：なし］
＠乗っ取り
［みつけた］
［みつけた　みつけた］`]];
WINP['ミステリー']=MYP;
/* ===== システム画面を「カード」で編集する（｜や［ ］を打たなくていい）=====
   1行＝1枚のカード。種類を選んで、名前・値などの欄に入れるだけ。中では今までの書き方の1行に直して保存する */
let WMODE='cards';
const ltClean=s=>String(s??'').replace(/[｜|]/g,'／').replace(/[［］]/g,'').trim();
const ltTok=s=>ltClean(s).replace(/ /g,' ');
const ltParts=l=>l.split('｜').map(s=>s.trim());
const ltKV=p=>{const kv={},fl=[];p.forEach(x=>{const j=x.indexOf('=');if(j>0)kv[x.slice(0,j)]=x.slice(j+1);else if(x)fl.push(x)});return{kv,fl}};
const ltJoin=(a,...rest)=>[ltClean(a),...rest.filter(x=>x!==''&&x!=null)].join('｜');
const NUMS='①②③④⑤⑥⑦⑧⑨⑩';
/* 段階の動き：表に出す名前 */
const STW=[['検出','隠蔽を見つける'],['偽装','偽装を見つける（ERROR）'],['看破','看破（真の値が出る）'],['一部','一部だけ看破'],['解放','封印を解く'],['欠落','データ欠落にする'],['失敗','解析失敗'],['感知','鑑定を感知される'],['逆探知','逆探知される'],['達成','✕の条件を✓にする'],['対決','鑑定と隠蔽の対決'],
  ['確認','使うか聞く（YES／NO）'],['発動','スキル名が浮かぶ'],['走査','走査線で読み取る'],['妨害','走査を妨害される'],['逆流','走査が逆流（自分が読まれる）'],['反動','反動（頭痛・ブレ）'],['視線','目がこちらを見る'],
  ['消える','上の項目が消える'],['封鎖','管理者が封鎖'],['解除','封鎖を解く・全部開く']];
const STSEQ=[['状態','札を変える'],['難易度','難易度を変える'],['変化','値を変えていく'],['昇格','ランク・境地が上がる'],['侵食','侵食が増える'],['習得','ツリーの枝を習得']];
const ERW=[['ジジッ','ジジッ（一瞬乱れる）'],['ザザッ','ザザッ'],['グリッチ','グリッチ（ずれる）'],['ノイズ','ノイズ'],['文字化け','文字化け'],['暴走','数字が暴走'],['赤','赤くなる'],['黒','黒くなる'],['乗っ取り','乗っ取られる'],['解放','隠し値を出す'],['元に戻る','元に戻る'],['黒のまま','黒のまま'],['強制終了','強制終了']];
const BADGES=['FULL','PARTIAL','LOCKED','PREMIUM','SKILL','ADMIN','CORRUPTED','UNKNOWN','GRANTED','SUCCESS','FAILED','BLOCKED','DETECTED','COUNTER','REVEALED','DENIED','MP'];
const AP8=APRES.map(r=>r[0]);
/* 種類の一覧（上から順に当てはめる） */
const LT=[
  {id:'sp',name:'すき間',icon:'␣',grp:'基本',test:l=>!l.trim(),get:()=>({}),set:()=>'',fields:[]},
  {id:'hr',name:'区切り線',icon:'━',grp:'基本',test:l=>/^[━─ー＝=─–-]{3,}$/.test(l.trim()),get:()=>({}),set:()=>'━━━━━━━━━━━━━━━━━━',fields:[]},
  {id:'stage',name:'演出の段階',icon:'✦',grp:'鑑定・制限',desc:'看破・走査・封鎖・値の変化など',test:l=>!!apParse(l),
    get:l=>{const s=apParse(l),f={tag:s.tag,w:[],seq:{},kv:{...s.kv}};s.fx.forEach(x=>{const j=x.indexOf('=');if(j>0){const k=x.slice(0,j);(f.seq[k]=f.seq[k]||[]).push(x.slice(j+1))}else f.w.push(x)});return f},
    set:f=>{const tag=f.tag||'鑑定';
      const toks=[...f.w];Object.entries(f.seq).forEach(([k,vs])=>vs.forEach(v=>{if(v!=='')toks.push(`${k}=${ltTok(v)}`)}));Object.entries(f.kv).forEach(([k,v])=>{if(v!==''&&v!=null)toks.push(`${k}=${ltTok(v)}`)});
      return`［${tag} ${toks.join(' ')||'看破'}］`},fields:'stage'},
  {id:'err',name:'エラーの乱れ',icon:'⚡',grp:'鑑定・制限',desc:'ジジッ・赤・黒・乗っ取り',test:l=>/^［エラー/.test(l.trim()),get:l=>{const s=erParse(l.trim())||{lab:'',fx:[],str:''};return{lab:s.lab,w:s.fx,str:s.str}},set:f=>erLine({lab:f.lab,fx:f.w.length?f.w:['ジジッ'],str:f.str}),fields:'err'},
  {id:'ero',name:'侵食メーター',icon:'☣',grp:'ゲーム',test:l=>/｜\s*侵食\s*$/.test(l),get:l=>{const m=l.match(/^(.*?)[：:]\s*([-\d.]+)/);return{k:m?m[1]:'侵食率',v:m?m[2]:'0'}},set:f=>`${ltClean(f.k)||'侵食率'}：${parseFloat(f.v)||0}%｜侵食`,fields:[['k','名前'],['v','いまの値（%）','num']]},
  {id:'chk',name:'条件（✓／✕）',icon:'✓',grp:'鑑定・制限',test:l=>/^[✓✔☑✕✗☐]\s*\S/.test(l.trim())&&/[^\x00-\x7f✓✔☑✕✗☐]/.test(l.trim().slice(1)),get:l=>({on:/^[✓✔☑]/.test(l.trim()),t:l.trim().replace(/^[✓✔☑✕✗☐]\s*/,'')}),set:f=>`${f.on?'✓':'✕'} ${ltClean(f.t)}`,fields:[['on','もう満たしている','chk'],['t','条件']]},
  {id:'eco',name:'コイン',icon:'🪙',grp:'コイン',test:l=>ECO_K.test(l.trim()),
    get:l=>{const m=l.trim().match(ECO_K),p=ltParts(m[2]),{kv,fl}=ltKV(p.slice(1));return{t:m[1],a:p[0],b:p[1]&&!p[1].includes('=')?p[1]:'',c:p[2]&&!p[2].includes('=')?p[2]:'',割引:kv.割引||'',在庫:kv.在庫||'',初回無料:fl.includes('初回無料'),禁止:fl.includes('禁止'),LOCKED:/LOCKED/i.test(p[1]||'')}},
    set:f=>{const t=f.t||'獲得';if(t==='所持')return`所持：${ltClean(f.a)||'0'}`;if(t==='履歴')return'履歴：';if(t==='購入'){if(f.LOCKED)return`購入：${ltClean(f.a)||'？？？'}｜LOCKED`;return ltJoin('購入：'+ltClean(f.a),ltClean(f.b)||'100',ltClean(f.c)||'アイテム',f.割引?'割引='+ltClean(f.割引):'',f.在庫?'在庫='+ltClean(f.在庫):'',f.初回無料?'初回無料':'',f.禁止?'禁止':'')}
      return ltJoin(`${t}：${ltClean(f.a)||'100'}`,ltClean(f.b))},fields:'eco'},
  {id:'inv',name:'アイテム',icon:'🧪',grp:'ゲーム',test:l=>gmParse(l.trim())?.k==='inv',get:l=>{const d=gmParse(l.trim()).d;return{n:d.n,num:d.num,r:d.kv.等級||'',desc:d.kv.説明||'',nw:d.t==='獲得アイテム',eq:!!d.kv.装備中}},
    set:f=>ltJoin(`${f.nw?'獲得アイテム':'アイテム'}：${ltClean(f.n)||'アイテム'}`,f.num?'×'+ltClean(f.num):'',f.r,f.eq?'装備中':'',f.desc?'説明='+ltClean(f.desc):''),fields:[['n','名前'],['num','数','num'],['r','等級','seg',['','N','R','SR','SSR','神話']],['desc','説明（押すと出る）'],['nw','NEW（いま手に入れた）','chk'],['eq','装備中','chk']]},
  {id:'dmg',name:'ダメージ・回復',icon:'💥',grp:'ゲーム',test:l=>gmParse(l.trim())?.k==='dmg',get:l=>{const d=gmParse(l.trim()).d;const miss=/MISS|回避/i.test(d.v);return{t:miss?'MISS':d.t==='heal'?'回復':'ダメージ',v:miss?'':d.v,crit:!!d.kv.CRITICAL,to:d.kv.対象||''}},
    set:f=>f.t==='MISS'?'ダメージ：MISS':ltJoin(`${f.t==='回復'?'回復':'ダメージ'}：${ltClean(f.v)||'100'}`,f.crit&&f.t!=='回復'?'CRITICAL':'',f.to?'対象='+ltClean(f.to):''),fields:[['t','種類','seg',['ダメージ','回復','MISS']],['v','数'],['crit','CRITICAL','chk'],['to','どのHPが動く？（空なら上のHP）']]},
  {id:'cho',name:'選択肢',icon:'☝',grp:'ゲーム',test:l=>gmParse(l.trim())?.k==='cho',get:l=>{const d=gmParse(l.trim()).d;return{t:d.t.replace(/^[①-⑳]\s*/,''),res:d.kv.結果||'',lock:!!d.kv.LOCKED,fix:!!d.kv.固定}},
    set:(f,i,rows)=>{let n=0;for(let j=0;j<i;j++)if(gmParse(String(rows[j]).trim())?.k==='cho')n++;else n=0;return ltJoin(`${NUMS[n]||'①'} ${ltClean(f.t)||'選択肢'}`,f.lock?'LOCKED':'',f.fix?'固定':'',f.res?'結果='+ltClean(f.res):'')},
    fields:[['t','選択肢の文'],['res','選んだときの一言（本文は変わらない）'],['lock','押せない（LOCKED）','chk'],['fix','どれを選んでもこれになる','chk']]},
  {id:'tree',name:'ツリーの枝',icon:'🌿',grp:'ゲーム',test:l=>gmParse(l.trim())?.k==='tree'||(gmParse(l)?.k==='tree'),get:l=>{const d=gmParse(l.replace(/\s+$/,'')).d;return{n:d.n,st:d.st,dep:String(Math.max(0,d.dep-1)),last:d.last,root:d.dep===0}},
    set:f=>{const dep=f.root?0:(+f.dep||0)+1;const lead='　'.repeat(Math.max(0,dep-1));return dep===0?`${ltClean(f.n)}｜${f.st||'未'}`:`${lead}${f.last?'└─':'├─'} ${ltClean(f.n)}｜${f.st||'未'}`},
    fields:[['n','名前'],['st','状態','seg',['済','現在','未','LOCKED']],['root','いちばん上（根）','chk'],['dep','深さ','seg',['0','1','2','3']],['last','その段の最後の枝','chk']]},
  {id:'pin',name:'ロック解除（PIN）',icon:'🔒',grp:'端末',test:l=>gmParse(l.trim())?.k==='pin',get:l=>{const d=gmParse(l.trim()).d;return{v:d.v,bad:d.kv.誤||'',tr:d.kv.試行||'5',tm:d.kv.時刻||'',home:d.kv.ホーム||''}},
    set:f=>ltJoin(`PIN：${ltClean(f.v)||'0000'}`,f.bad?'誤='+ltClean(f.bad).replace(/／/g,','):'',f.tr?'試行='+f.tr:'',f.tm?'時刻='+ltClean(f.tm):'',f.home?'ホーム='+ltClean(f.home):''),fields:[['v','正しい番号'],['bad','まちがえる番号（, で区切る）'],['tr','試行回数','num'],['tm','ホームの時刻,日付（例 03:33,10月13日）'],['home','ホームのアプリ（例 電話:2,メッセージ）・なし で出さない']]},
  {id:'call',name:'着信中',icon:'📞',grp:'端末',test:l=>gmParse(l.trim())?.k==='call',get:l=>{const d=gmParse(l.trim()).d;return{n:d.n,no:d.kv.番号||''}},set:f=>ltJoin(`着信中：${ltClean(f.n)||'非通知'}`,f.no?'番号='+ltClean(f.no):''),fields:[['n','相手'],['no','番号（なくてよい）']]},
  {id:'clog',name:'通話履歴',icon:'☎',grp:'端末',test:l=>gmParse(l.trim())?.k==='clog',get:l=>{const d=gmParse(l.trim()).d;return{t:d.t==='発信'?'発信':'着信',n:d.n,tm:d.time,st:d.st}},set:f=>ltJoin(`${f.t||'着信'}：${ltClean(f.n)}`,ltClean(f.tm),ltClean(f.st)),fields:[['t','向き','seg',['着信','発信']],['n','相手'],['tm','日時'],['st','不在／通話時間（例 2:13）']]},
  {id:'voice',name:'音声記録',icon:'🎙',grp:'端末',test:l=>gmParse(l.trim())?.k==='voice',get:l=>{const d=gmParse(l.trim()).d;return{n:d.n,len:d.len,cut:d.kv.欠損||''}},set:f=>ltJoin(`音声：${ltClean(f.n)||'record.wav'}`,ltClean(f.len)||'0:30',f.cut?'欠損='+ltClean(f.cut):''),fields:[['n','ファイル名'],['len','長さ（例 1:24）'],['cut','欠損（例 55-72 ＝55%〜72%）']]},
  {id:'srch',name:'検索履歴',icon:'🔍',grp:'端末',test:l=>gmParse(l.trim())?.k==='srch',get:l=>{const d=gmParse(l.trim()).d;return{q:d.q,tm:d.time,st:d.st}},set:f=>ltJoin(`検索：${ltClean(f.q)}`,ltClean(f.tm),f.st),fields:[['q','検索した言葉'],['tm','日時'],['st','状態','seg',['','削除済み','復元']]]},
  {id:'dm',name:'メッセージ',icon:'💬',grp:'端末',test:l=>gmParse(l.trim())?.k==='dm',get:l=>{const d=gmParse(l.trim()).d;return{t:d.me?'送信':'受信',n:d.n,tm:d.time,b:d.t,del:!!d.kv.削除,to:d.kv.変化||''}},
    set:f=>ltJoin(`${f.t||'受信'}：${ltClean(f.n)||'不明な送信者'}`,ltClean(f.tm)||'00:00',ltClean(f.b),f.del?'削除':'',f.to?'変化='+ltClean(f.to):''),fields:[['t','向き','seg',['受信','送信']],['n','送った人'],['tm','時刻'],['b','本文'],['to','あとで書き換わる本文（なくてよい）'],['del','少しして送信取り消し','chk']]},
  {id:'alert',name:'緊急速報',icon:'🚨',grp:'端末',test:l=>gmParse(l.trim())?.k==='alert',get:l=>{const d=gmParse(l.trim()).d;return{t:d.t,area:d.kv.地域||'',tm:d.kv.日時||'',next:d.kv.続報||''}},set:f=>ltJoin(`速報：${ltClean(f.t)}`,f.area?'地域='+ltClean(f.area):'',f.tm?'日時='+ltClean(f.tm):'',f.next?'続報='+ltClean(f.next):''),fields:[['t','本文','area'],['area','対象地域'],['tm','日時'],['next','続報']]},
  {id:'tl',name:'年表',icon:'🕒',grp:'端末',test:l=>gmParse(l.trim())?.k==='tl',get:l=>{const d=gmParse(l.trim()).d;return{d:d.date,t:d.t,ch:d.kv.変更||'',un:!!d.kv.未確認}},set:f=>ltJoin(`年表：${ltClean(f.d)}`,ltClean(f.t),f.un?'未確認':'',f.ch?'変更='+ltClean(f.ch):''),fields:[['d','日付・時刻'],['t','出来事'],['ch','あとで書き換わる出来事（なくてよい）'],['un','未確認','chk']]},
  {id:'score',name:'得点の候補',icon:'🏆',grp:'端末',test:l=>gmParse(l.trim())?.k==='score',get:l=>{const p=ltParts(l.trim().replace(/^候補\s*[：:]\s*/,'')),{kv}=ltKV(p.slice(1));return{n:p[0],a:kv.音源||'',b:kv.アルバム||'',c:kv.放送||'',d:kv.投票||''}},
    set:f=>ltJoin(`候補：${ltClean(f.n)}`,f.a?'音源='+f.a:'',f.b?'アルバム='+f.b:'',f.c?'放送='+f.c:'',f.d?'投票='+f.d:''),fields:[['n','名前'],['a','音源','num'],['b','アルバム','num'],['c','放送','num'],['d','投票','num']]},
  {id:'apv',name:'隠された値',icon:'？',grp:'鑑定・制限',desc:'？？？・偽装・封印と、真の値',test:l=>APFLAG.test(l),get:l=>{const d=apSplit(l.trim());return{k:d.key,v:d.shown,ty:d.type||'隠し',tru:d.tru}},
    set:f=>ltJoin((f.k?ltClean(f.k)+'：':'')+(ltClean(f.v)||'？？？'),f.ty||'隠し',f.tru?'真='+ltClean(f.tru):''),fields:[['k','名前（空なら箇条書き）'],['v','見えている値'],['ty','種類','seg',['隠し','偽装','封印','欠落','閲覧不可','認識阻害','解析不能']],['tru','真の値（看破・解放で出る）']]},
  {id:'sec',name:'区画の見出し',icon:'◆',grp:'基本',test:l=>/^[◆▸◇■☆✦]\s*\S/.test(l.trim())&&!/[：:]/.test(l),get:l=>({t:l.trim().replace(/^[◆▸◇■☆✦]\s*/,''),m:l.trim()[0]}),set:f=>`${f.m||'◆'} ${ltClean(f.t)}`,fields:[['t','見出し']]},
  {id:'li',name:'箇条書き',icon:'・',grp:'基本',test:l=>/^・/.test(l.trim()),get:l=>({t:l.trim().replace(/^・\s*/,'')}),set:f=>`・${ltClean(f.t)}`,fields:[['t','文']]},
  {id:'btn',name:'ボタン',icon:'▣',grp:'基本',test:l=>isBtnLine(l.trim()),get:l=>({t:(l.match(/[\[［【][^\]］】]{1,20}[\]］】]/g)||[]).flatMap(x=>x.slice(1,-1).split(/[\/／]/).map(s=>s.trim())).join('、')}),set:f=>`【${(f.t||'YES、NO').split(/[、,，]/).map(s=>ltClean(s)).filter(Boolean).join(' / ')}】`,fields:[['t','ボタンの文字（、で区切る）']]},
  {id:'say',name:'セリフ',icon:'『',grp:'基本',test:l=>/^『.*』$/.test(l.trim()),get:l=>({t:l.trim().slice(1,-1)}),set:f=>`『${ltClean(f.t)}』`,fields:[['t','セリフ']]},
  {id:'sys',name:'システムの一言',icon:'［',grp:'基本',test:l=>/^[\[［].*[\]］]$/.test(l.trim()),get:l=>({t:l.trim().slice(1,-1),o:l.trim()[0],c:l.trim().slice(-1)}),set:f=>`${f.o||'［'}${ltClean(f.t)}${f.c||'］'}`,fields:[['t','文（［ ］は自動で付く）','area']]},
  {id:'kv',name:'項目',icon:'≡',grp:'基本',desc:'名前：値（60% と書くとゲージ）',test:l=>/^[^：:]{1,16}[：:]/.test(l.trim()),get:l=>{const m=l.trim().match(/^(.*?)(\s*[：:]\s*)(.*)$/);return{k:m[1].trim(),v:m[3].trim(),sp:m[2]}},set:f=>`${ltClean(f.k)||'名前'}${f.sp||'：'}${ltClean(f.v)}`,fields:[['k','名前'],['v','値（60% ／ 850 / 1,000 ならゲージ）']]},
  {id:'p',name:'ふつうの文',icon:'あ',grp:'基本',test:()=>true,get:l=>({t:l}),set:f=>String(f.t??''),fields:[['t','文（そのまま出る）','area']]}];
const LTID=Object.fromEntries(LT.map(x=>[x.id,x]));
/* 一番上の「╔═╗ 見出し ╚═╝」はまとめて1枚 */
function ltItems(rows){const L=rows.map(r=>String(r[0]??''));const out=[];let i=0;while(i<L.length&&!L[i].trim())i++;
  if(L[i]&&/^[╔┌]/.test(L[i].trim())){const st=i;i++;const h=[];while(i<L.length&&!/^[╚└]/.test(L[i].trim())){if(L[i].trim())h.push(L[i].trim());i++}i++;out.push({id:'head',f:{t:h[0]||'',s:h.slice(1).join(' ')},raw:L.slice(st,i)});}
  else i=0;
  for(;i<L.length;i++){const l=L[i];const tp=LT.find(x=>{try{return x.test(l)}catch(e){return false}})||LTID.p;out.push({id:tp.id,f:tp.get(l),raw:l})}
  return out}
function ltLines(items){const out=[];items.forEach(it=>{/* さわっていない行は、元の書き方のまま */if(!it.dirty&&it.raw!=null){Array.isArray(it.raw)?out.push(...it.raw):out.push(it.raw);return}if(it.id==='head'){if(!it.f.t&&!it.f.s)return;out.push('╔══════════════════════════╗',ltClean(it.f.t)||'SYSTEM');if(it.f.s)out.push(ltClean(it.f.s));out.push('╚══════════════════════════╝');return}
    const tp=LTID[it.id];out.push(tp.set(it.f,out.length,out))});return out}
/* 追加の一覧（アイコン・名前・ひとこと） */
const LTADD=[
  ['基本',[['head','見出し（枠つき）','画面のいちばん上の題'],['kv','項目','名前：値'],['sys','システムの一言','［ ］の文'],['sec','区画の見出し','◆ スキル など'],['li','箇条書き','・の行'],['hr','区切り線',''],['say','セリフ','『 』'],['btn','ボタン','【YES / NO】']]],
  ['鑑定・制限',[['apv','隠された値','？？？／偽装／封印'],['stage','演出の段階','看破・走査・封鎖…'],['err','エラーの乱れ','ジジッ・赤・黒'],['chk','条件（✓／✕）','']]],
  ['コイン',[['eco:所持','いまのコイン',''],['eco:獲得','コインがもらえる',''],['eco:消費','コインが減る',''],['eco:購入','ショップの商品',''],['eco:閲覧','払って見る情報',''],['eco:抽選','ガチャ',''],['eco:履歴','取引履歴','']]],
  ['ゲーム',[['inv','アイテム',''],['dmg','ダメージ・回復',''],['cho','選択肢',''],['tree','ツリーの枝','スキルツリー・ルート'],['ero','侵食メーター','']]],
  ['端末・ミステリー',[['pin','ロック解除',''],['call','着信中',''],['clog','通話履歴',''],['voice','音声記録',''],['srch','検索履歴',''],['dm','メッセージ',''],['alert','緊急速報',''],['tl','年表',''],['score','得点の候補','1位発表']]]];
const LTNEW={head:{t:'SYSTEM',s:''},kv:{k:'名前',v:''},sys:{t:''},sec:{t:'見出し'},li:{t:''},hr:{},say:{t:''},btn:{t:'YES、NO'},apv:{k:'好感度',v:'？？？',ty:'隠し',tru:''},stage:{tag:'鑑定',w:['看破'],seq:{},kv:{}},err:{lab:'',w:['ジジッ'],str:''},chk:{on:false,t:''},
  inv:{n:'回復ポーション',num:'1',r:'N',desc:'',nw:false,eq:false},dmg:{t:'ダメージ',v:'100',crit:false,to:''},cho:{t:'',res:'',lock:false,fix:false},tree:{n:'',st:'未',dep:'0',last:false,root:false},ero:{k:'侵食率',v:'0'},
  pin:{v:'0000',bad:'',tr:'5',tm:'',home:''},call:{n:'非通知',no:''},clog:{t:'着信',n:'',tm:'',st:'不在'},voice:{n:'record.wav',len:'0:30',cut:''},srch:{q:'',tm:'',st:''},dm:{t:'受信',n:'不明な送信者',tm:'03:33',b:'',del:false,to:''},alert:{t:'',area:'',tm:'',next:''},tl:{d:'',t:'',ch:'',un:false},score:{n:'',a:'',b:'',c:'',d:''}};
function ltField(f,[key,label,type,opts],upd){const row=hEl('label','tf',`<span>${esc(label)}</span>`);let el;
  if(type==='chk'){el=document.createElement('input');el.type='checkbox';el.checked=!!f[key];el.onchange=()=>{f[key]=el.checked;upd(true)};row.classList.add('chk')}
  else if(type==='seg'){el=hEl('div','seg sm');opts.forEach(w=>{const b=hEl('button',String(f[key]??'')===w?'on':'',w||'なし');b.type='button';b.onclick=e=>{e.preventDefault();f[key]=w;upd(true)};el.appendChild(b)})}
  else if(type==='sel'){el=document.createElement('select');el.innerHTML=opts.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return`<option value="${esc(v)}">${esc(l)}</option>`}).join('');el.value=f[key]??'';el.onchange=()=>{f[key]=el.value;upd(true)}}
  else if(type==='area'){el=document.createElement('textarea');el.rows=2;el.value=f[key]??'';el.oninput=()=>{f[key]=el.value;upd()}}
  else{el=document.createElement('input');el.type='text';if(type==='num')el.inputMode='numeric';el.value=f[key]??'';el.oninput=()=>{f[key]=el.value;upd()}}
  row.appendChild(el);return row}
/* 段階のカード：動きをチップで選び、必要な欄だけ出す */
function ltStage(card,f,upd){const g=hEl('div','ltchips');STW.forEach(([w,l])=>{const on=f.w.includes(w);const b=hEl('button',on?'on':'',esc(l));b.type='button';b.onclick=e=>{e.preventDefault();f.w=on?f.w.filter(x=>x!==w):f.w.concat([w]);upd(true)};g.appendChild(b)});
  STSEQ.forEach(([k,l])=>{const on=!!f.seq[k];const b=hEl('button','seq'+(on?' on':''),esc(l));b.type='button';b.onclick=e=>{e.preventDefault();if(on)delete f.seq[k];else f.seq[k]=[k==='状態'?'LOCKED':k==='難易度'?'HARD':k==='侵食'?'+6':''];upd(true)};g.appendChild(b)});card.appendChild(g);
  const kvF=(k,l,type,opts)=>card.appendChild(ltField(f.kv,[k,l,type,opts],upd));
  if(f.w.includes('対決')){kvF('鑑定','鑑定のレベル','num');kvF('隠蔽','隠蔽のレベル','num');kvF('補正','補正（例 +2）');kvF('結果','結果を決める（空なら能力差で自動）','sel',[['','自動'],...AP8.map(x=>[x,x])])}
  if(f.w.includes('確認')||f.w.includes('発動')){kvF('スキル','スキル名');if(f.w.includes('確認')){kvF('MP','使うMP（なくてよい）','num');kvF('コイン','使うコイン（なくてよい）','num')}}
  if(f.w.includes('走査')){kvF('向き','向き','seg',['下','上','往復']);kvF('回数','回数','num');kvF('率','解析率（%）','num');kvF('強さ','強さ','seg',['','上位'])}
  if(f.w.includes('消える'))kvF('数','消える行の数（空なら区画ぜんぶ）','num');
  if(f.w.some(w=>['検出','失敗','看破'].includes(w)))kvF('札','スタンプの文字（なくてよい）');
  if(f.kv.条件!==undefined||f.w.includes('看破'))kvF('条件','この商品を買うまで待つ（なくてよい）');
  const seqF=(k,l,type,opts)=>{const o={v:f.seq[k][0]};card.appendChild(ltField(o,['v',l,type,opts],(r)=>{f.seq[k][0]=o.v;upd(r)}))};
  const pair=(k,l1,l2)=>{const [a,b]=String(f.seq[k][0]||'').split(/[:：]/);const o={a:a||'',b:b||''};const s=()=>{f.seq[k][0]=`${ltClean(o.a)}:${ltClean(o.b).replace(/[、,，]/g,'→')}`};
    card.appendChild(ltField(o,['a',l1],()=>{s();upd()}));card.appendChild(ltField(o,['b',l2],()=>{s();upd()}))};
  if(f.seq.状態)seqF('状態','札','sel',BADGES.map(x=>[x,SCST[x]?SCST[x][0]:x]));
  if(f.seq.難易度)seqF('難易度','新しい難易度','seg',['EASY','NORMAL','HARD','HELL']);
  if(f.seq.変化)pair('変化','どの項目？（名前）','変わっていく値（→ か 、で区切る）');
  if(f.seq.昇格)pair('昇格','どの項目？（名前）','新しい値');
  if(f.seq.侵食)seqF('侵食','増える量（+6）か、新しい値（84%）');
  if(f.seq.習得)seqF('習得','習得する枝の名前')}
function ltErr(card,f,upd){const g=hEl('div','ltchips');ERW.forEach(([w,l])=>{const on=f.w.includes(w);const b=hEl('button',on?'on':'',esc(l));b.type='button';b.onclick=e=>{e.preventDefault();f.w=on?f.w.filter(x=>x!==w):f.w.concat([w]);upd(true)};g.appendChild(b)});card.appendChild(g);
  card.appendChild(ltField(f,['str','強さ（%・なくてよい）','num'],upd))}
function ltEco(card,f,upd){card.appendChild(ltField(f,['t','種類','seg',['所持','獲得','消費','購入','閲覧','抽選','履歴']],upd));const F=(k,l,t,o)=>card.appendChild(ltField(f,[k,l,t,o],upd));
  if(f.t==='所持')F('a','いまの枚数','num');else if(f.t==='獲得'||f.t==='消費'){F('a','枚数','num');F('b','理由（例 クエスト達成報酬）')}
  else if(f.t==='購入'){F('a','商品名');F('b','値段','num');F('c','種類','seg',['アイテム','スキル']);F('割引','割引（例 20%）');F('在庫','在庫','num');F('初回無料','初回無料','chk');F('禁止','買えない（禁止）','chk');F('LOCKED','🔒 LOCKED','chk')}
  else if(f.t==='閲覧'){F('a','払う枚数','num');F('b','見られるもの（この行より下が隠れる）')}else if(f.t==='抽選'){F('a','1回の枚数','num');F('b','当たるもの（作家さんが決める）')}}
/* カードの一覧を描く */
function lineCards(pane,o,commit,preview,render){let items=ltItems(o.rows);const save=re=>{o.rows=ltLines(items).map(x=>[x]);commit();if(re)render();else preview()};
  const list=hEl('div','tcards ltcards');
  items.forEach((it,i)=>{const tp=it.id==='head'?{name:'見出し（枠つき）',icon:'▭'}:LTID[it.id];const card=hEl('div','tcard ltc lt-'+it.id);
    const top=hEl('div','tctop',`<em>${tp.icon}</em><b class="ltn">${esc(tp.name)}</b>`);
    const ac=hEl('span','tcac','<button type="button" data-a="up" aria-label="上へ">▲</button><button type="button" data-a="dn" aria-label="下へ">▼</button><button type="button" data-a="cp" aria-label="複製">⧉</button><button type="button" data-a="x" aria-label="消す">✕</button>');
    ac.onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.a;if(k==='up'&&i>0)[items[i-1],items[i]]=[items[i],items[i-1]];if(k==='dn'&&i<items.length-1)[items[i+1],items[i]]=[items[i],items[i+1]];if(k==='x')items.splice(i,1);if(k==='cp')items.splice(i+1,0,JSON.parse(JSON.stringify(it)));save(true)};
    top.appendChild(ac);card.appendChild(top);const upd=re=>{it.dirty=true;save(re)};
    if(it.id==='head'){card.appendChild(ltField(it.f,['t','題（英語でも日本語でも）'],upd));card.appendChild(ltField(it.f,['s','小さい副題（なくてよい）'],upd))}
    else if(tp.fields==='stage')ltStage(card,it.f,upd);else if(tp.fields==='err')ltErr(card,it.f,upd);else if(tp.fields==='eco')ltEco(card,it.f,upd);
    else tp.fields.forEach(fd=>card.appendChild(ltField(it.f,fd,upd)));
    list.appendChild(card)});
  pane.appendChild(list);
  /* ＋ 部品を追加 */
  const add=hEl('div','ltadd','<button type="button" class="ltopen">＋ 部品を追加</button><div class="ltpal"></div>');const pal=add.querySelector('.ltpal');
  LTADD.forEach(([g,arr])=>{pal.appendChild(hEl('div','ltg',esc(g)));const row=hEl('div','ltrow');arr.forEach(([id,l,d])=>{const [base,sub]=id.split(':'),tp=base==='head'?{icon:'▭'}:LTID[base];const b=hEl('button','',`<i>${tp.icon}</i><b>${esc(l)}</b>${d?`<small>${esc(d)}</small>`:''}`);b.type='button';
      b.onclick=()=>{const f=JSON.parse(JSON.stringify(base==='eco'?{t:sub,a:sub==='所持'?'2,500':sub==='購入'?'回復ポーション':'500',b:sub==='購入'?'100':sub==='閲覧'?'隠された情報':sub==='抽選'?'Sランクスキル獲得券':'',c:'アイテム'}:LTNEW[base]||{}));
        if(base==='head'){if(items[0]&&items[0].id==='head')return;items.unshift({id:'head',f})}else items.push({id:base,f});add.classList.remove('on');save(true);const cs=pane.querySelectorAll('.ltc');(base==='head'?cs[0]:cs[cs.length-1])?.scrollIntoView({block:'nearest'})};row.appendChild(b)});pal.appendChild(row)});
  add.querySelector('.ltopen').onclick=()=>add.classList.toggle('on');pane.appendChild(add)}
EDT['窓'].lines=1;
/* ===== ほかのテンプレートも「カード」で編集する（SNS・ホムマ・報道・流れるコメント・関係）=====
   行の種類と、使える設定（いいね・写真・時間…）は、そのテンプレートの文例から覚える。
   1行＝1枚のカード。｜や＝は自動で付く。さわっていない行は、元の書き方のまま */
const GIMG=()=>(typeof BOOK!=='undefined'&&BOOK.imgs)||[];
const gcl=s=>String(s??'').replace(/[｜]/g,'／').replace(/\n/g,'／').trim();
const GCFG={
  'アイドルSNS':{names:{アカウント:'アカウント（名前・ID・アイコン）',X本人:'X風の投稿（本人）',X公式:'X風の投稿（公式）',IG本人:'IG風の投稿（本人）',IG公式:'IG風の投稿（公式）',返信:'返信（すぐ上のX投稿へ）',コメント:'コメント（すぐ上のIG投稿へ）',ストーリー:'ストーリー',ハイライト:'ハイライト'},
    pos:{X本人:['本文'],X公式:['本文'],IG本人:['本文'],IG公式:['本文'],返信:['名前@ID（例 moon_0712）','本文'],コメント:['名前@ID','本文'],アカウント:['どのアカウント？（X本人／X公式／IG本人／IG公式）'],ストーリー:['どのアカウント？'],ハイライト:['どのアカウント？']},
    keys:{時間:'時間（例 2時間）',写真:'写真',いいね:'いいね',RP:'リポスト',返信数:'返信の数',固定:'固定する',名前:'名前',ID:'ID',紹介:'紹介文',アイコン:'アイコン',カバー:'カバー画像',フォロワー:'フォロワー',フォロー:'フォロー',投稿:'投稿数',リンク:'リンク',開始:'はじめた月',文字:'のせる文字',共同:'共同投稿',引用:'引用（例 X公式:1）',削除:'あとで削除される'},img:/^sn_/},
  'ホムマ':{names:{トップ:'トップの大きな写真',更新:'更新履歴',写真:'写真ギャラリー',動画:'動画',お知らせ:'お知らせ',予定:'予定',応援:'応援',紹介:'紹介'},
    pos:{トップ:['日付','見出し','場所','写真'],更新:['日付','種類（PHOTO／VIDEO／NOTICE）','内容'],写真:['日付','タイトル','枚数','写真'],動画:['日付','タイトル','サムネ','長さ・画質'],お知らせ:['日付','内容'],予定:['日付','内容'],応援:['内容','写真'],紹介:['文']},img:/^(hs_|hm\d)/},
  '報道':{names:{},pos:{},img:/^(md_|ph_|sc_|hs_|sn_)/},
  '流れるコメント':{names:{コメント:'コメント',スパチャ:'スパチャ',段階:'様子がおかしくなる段階'},pos:{コメント:['名前','コメント'],スパチャ:['金額','名前','コメント']},
    parse:l=>{const t=l.trim();let m;if(/^［/.test(t))return null;if((m=t.match(/^[¥￥]\s*([\d,]+)\s+(.+?)[：:](.*)$/)))return{kind:'スパチャ',parts:[{t:'pos',v:m[1]},{t:'pos',v:m[2]},{t:'pos',v:m[3]}]};
      if((m=t.match(/^(.+?)[：:](.*)$/)))return{kind:'コメント',parts:[{t:'pos',v:m[1]},{t:'pos',v:m[2]}]};return null},
    build:it=>it.kind==='スパチャ'?`¥${gcl(it.parts[0].v)||'1,000'} ${gcl(it.parts[1].v)||'名無し'}：${gcl(it.parts[2].v)}`:`${gcl(it.parts[0].v)||'名無し'}：${gcl(it.parts[1].v)}`},
  '関係':{names:{ゲージ:'値（好感度・信頼度など）',人物:'人物（一覧の1人）',通知:'お知らせ',フラグ:'フラグ'},pos:{ゲージ:['名前（例 好感度）','値（例 60%・★★★☆☆・-47%）'],人物:['名前','肩書'],通知:['お知らせの文'],フラグ:['フラグの名前']},flags:['隠し','危険','解放'],
    keys:{前:'前の値（ここから動く）',状態:'状態（例 敵対）',関係:'関係',好感度:'好感度',信頼度:'信頼度',隠し:'隠し（解放で出る）',危険:'危険',解放:'解放'},
    parse:l=>{const t=l.trim();if(/^［/.test(t)||!/[：:]/.test(t))return null;const i=t.search(/[：:]/),k=t.slice(0,i).trim();if(['人物','通知','フラグ'].includes(k))return undefined;
      return{kind:'ゲージ',parts:[{t:'pos',v:k},...gParts(t.slice(i+1),['隠し','危険','解放'])]}},
    build:it=>`${gcl(it.parts[0].v)||'好感度'}：${it.parts.slice(1).map(gTok).join('｜')}`}};
function gParts(rest,flags=[]){return rest.split('｜').map(x=>x.trim()).map(p=>{const j=p.indexOf('=');if(j>0&&j<=8)return{t:'kv',k:p.slice(0,j),v:p.slice(j+1)};if(flags.includes(p))return{t:'kv',k:p,v:'1',flag:1};return{t:'pos',v:p}})}
const gTok=p=>p.t==='kv'?(p.flag?(p.v?p.k:''):(p.v===''?'':`${p.k}=${gcl(p.v)}`)):gcl(p.v);
function gParse(cfg,l){const c=cfg.parse?cfg.parse(l):undefined;if(c)return{...c,raw:l};if(c===null)return{kind:'',text:l,raw:l};
  const t=l.trim(),i=t.indexOf('：');if(i>0&&i<=10&&!t.slice(0,i).includes('｜')&&!/^［/.test(t))return{kind:t.slice(0,i).trim(),parts:gParts(t.slice(i+1),cfg.flags||[]),raw:l};return{kind:'',text:l,raw:l}}
function gBuild(cfg,it){if(!it.dirty&&it.raw!=null)return it.raw;if(!it.kind)return it.text??'';if(cfg.build&&cfg.names[it.kind]&&cfg.parse&&!['人物','通知','フラグ'].includes(it.kind))return cfg.build(it);
  return`${it.kind}：${it.parts.map(gTok).filter((x,i,a)=>x!==''||it.parts[i].t==='pos').join('｜')}`}
/* 文例から、種類ごとの「見本の1行・使える設定・はい／いいえの設定」を覚える */
function gLearn(E,k){if(E._learn)return E._learn;const cfg=GCFG[k],L={};
  Object.values(E.presets||{}).flat().forEach(([, ,txt])=>String(txt).split('\n').forEach(l=>{if(!l.trim())return;const it=gParse(cfg,l);if(!it.kind)return;
    const o=L[it.kind]||(L[it.kind]={sample:l,keys:[],bool:{},n:0});o.n++;it.parts.forEach(p=>{if(p.t!=='kv')return;if(!o.keys.includes(p.k))o.keys.push(p.k);o.bool[p.k]=(o.bool[p.k]??true)&&(p.v==='1'||!!p.flag)})}));
  return E._learn=L}
const gIsImg=(cfg,v,key)=>/写真|アイコン|カバー|サムネ|画像|背景/.test(key||'')||(!!v&&String(v).split(/[,、]/).every(x=>GIMG().includes(x.trim())));
function gPicker(cfg,val,multi,set){const box=hEl('div','gpick'),cur=String(val||'').split(/[,、]/).map(x=>x.trim()).filter(Boolean);
  const list=GIMG().filter(n=>cfg.img?cfg.img.test(n):true);list.forEach(n=>{const on=cur.includes(n);const b=hEl('button',on?'on':'');b.type='button';b.style.backgroundImage=`url(a/${n}.jpg)`;b.title=n;
    b.onclick=e=>{e.preventDefault();let nv;if(multi)nv=on?cur.filter(x=>x!==n):cur.concat([n]);else nv=on?[]:[n];set(nv.join(','))};box.appendChild(b)});
  if(!list.length)box.appendChild(hEl('small','','（使える写真がありません）'));return box}
function gCards(pane,o,commit,preview,render,E,k){const cfg=GCFG[k],learn=gLearn(E,k);let items=o.rows.map(r=>gParse(cfg,String(r[0]??'')));
  const save=re=>{o.rows=items.map(it=>[gBuild(cfg,it)]);commit();if(re)render();else preview()};
  const list=hEl('div','tcards ltcards');
  items.forEach((it,i)=>{const nm=it.kind?(cfg.names[it.kind]||it.kind):(/^［/.test(String(it.text).trim())?'演出の印':'文');const card=hEl('div','tcard ltc'+(it.kind?'':' lt-p'));
    const top=hEl('div','tctop',`<b class="ltn">${esc(nm)}</b>`);const ac=hEl('span','tcac','<button type="button" data-a="up" aria-label="上へ">▲</button><button type="button" data-a="dn" aria-label="下へ">▼</button><button type="button" data-a="cp" aria-label="複製">⧉</button><button type="button" data-a="x" aria-label="消す">✕</button>');
    ac.onclick=e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;if(a==='up'&&i>0)[items[i-1],items[i]]=[items[i],items[i-1]];if(a==='dn'&&i<items.length-1)[items[i+1],items[i]]=[items[i],items[i+1]];if(a==='x')items.splice(i,1);if(a==='cp')items.splice(i+1,0,JSON.parse(JSON.stringify(it)));save(true)};
    top.appendChild(ac);card.appendChild(top);const upd=re=>{it.dirty=true;save(re)};
    if(!it.kind){const ta=document.createElement(String(it.text).length>40?'textarea':'input');if(ta.tagName==='INPUT')ta.type='text';else ta.rows=2;ta.value=it.text??'';ta.oninput=()=>{it.text=ta.value;upd()};card.appendChild(ta);list.appendChild(card);return}
    const lrn=learn[it.kind]||{keys:[],bool:{}},pl=(cfg.pos[it.kind]||[]);let pi=0;
    it.parts.forEach(p=>{if(p.t==='pos'){const label=pl[pi++]||'内容';
        if(gIsImg(cfg,p.v,label)){const row=hEl('div','tf wide',`<span>${esc(label)}</span>`);row.appendChild(gPicker(cfg,p.v,/写真/.test(label),v=>{p.v=v;upd(true)}));card.appendChild(row);return}
        const long=/本文|文|コメント|内容|紹介/.test(label)||String(p.v).includes('／');card.appendChild(ltField(p,['v',label,long?'area':'text'],upd));
        if(long){const ta=card.lastChild.querySelector('textarea');if(ta){ta.value=String(p.v).replace(/／/g,'\n');ta.oninput=()=>{p.v=ta.value;upd()}}}return}
      const label=(cfg.keys&&cfg.keys[p.k])||p.k;
      if(lrn.bool[p.k]||p.flag){const o2={c:!!p.v&&p.v!=='0'};card.appendChild(ltField(o2,['c',label,'chk'],()=>{p.v=o2.c?'1':'';upd(true)}));return}
      if(gIsImg(cfg,p.v,p.k)){const row=hEl('div','tf wide',`<span>${esc(label)}</span>`);row.appendChild(gPicker(cfg,p.v,p.k==='写真',v=>{p.v=v;upd(true)}));card.appendChild(row);return}
      const long=/紹介|文字/.test(p.k)||String(p.v).includes('／');card.appendChild(ltField(p,['v',label,long?'area':'text'],upd));if(long){const ta=card.lastChild.querySelector('textarea');if(ta){ta.value=String(p.v).replace(/／/g,'\n');ta.oninput=()=>{p.v=ta.value;upd()}}}});
    /* ＋ 設定を足す（文例で使われている設定から） */
    const miss=lrn.keys.filter(x=>!it.parts.some(p=>p.t==='kv'&&p.k===x));if(miss.length){const s=document.createElement('select');s.className='gaddk';s.innerHTML=`<option value="">＋ 設定を足す…</option>`+miss.map(x=>`<option value="${esc(x)}">${esc((cfg.keys&&cfg.keys[x])||x)}</option>`).join('');
      s.onchange=()=>{if(!s.value)return;it.parts.push({t:'kv',k:s.value,v:lrn.bool[s.value]?'1':'',flag:(cfg.flags||[]).includes(s.value)?1:0});upd(true)};card.appendChild(s)}
    list.appendChild(card)});
  pane.appendChild(list);
  /* ＋ 追加：文例にある種類から */
  const add=hEl('div','ltadd','<button type="button" class="ltopen">＋ 追加</button><div class="ltpal"></div>');const pal=add.querySelector('.ltpal'),row=hEl('div','ltrow');
  Object.entries(learn).sort((a,b)=>b[1].n-a[1].n).forEach(([kind,lr])=>{const b=hEl('button','',`<i>＋</i><b>${esc(cfg.names[kind]||kind)}</b>`);b.type='button';b.onclick=()=>{const it=gParse(cfg,lr.sample);it.dirty=true;items.push(it);add.classList.remove('on');save(true);const cs=pane.querySelectorAll('.ltc');cs[cs.length-1]?.scrollIntoView({block:'nearest'})};row.appendChild(b)});
  const bt=hEl('button','',`<i>あ</i><b>ふつうの文・印</b>`);bt.type='button';bt.onclick=()=>{items.push({kind:'',text:'',dirty:true});add.classList.remove('on');save(true)};row.appendChild(bt);
  pal.appendChild(row);add.querySelector('.ltopen').onclick=()=>add.classList.toggle('on');pane.appendChild(add)}
/* 日記：文字で書く欄の上に、印を入れるボタン（選んだ文字をはさむ） */
EDT['日記'].tools=[['消しゴムの跡','[[',']]'],['取り消し線','~~','~~'],['太く','**','**'],['ふるえる','((','))'],['間','［間］',''],['涙のしみ','［しみ］',''],['ハート','［ハート］',''],['星','［星］',''],['ぐるぐる','［ぐるぐる］',''],['崩れる行','［崩れる 言葉=',' 切り抜き］']];
/* ===== アイドルSNS：画面を触って作る（編集画面のプレビューの中だけ。読者の画面は今までどおり）=====
   プロフィール（名前・アイコン・数字・紹介）を押す → ユーザー編集／右下の＋ → 投稿／投稿の ⋮ → 投稿の編集
   投稿を開いて、リポスト・いいね・返信の数字を押す → 数を変える／下の返信欄 → だれが返信するか選んで送る／返信を押す → 返信の編集 */
const SEREV=Object.fromEntries(Object.entries(SNSLOT).map(([k,v])=>[v,k]));
const seCfg=()=>GCFG['アイドルSNS'];
const seL=o=>o.rows.map(r=>String(r[0]??''));
function sePostIdx(o,slot,i){const lab=SEREV[slot];let n=-1;const L=seL(o);for(let k=0;k<L.length;k++){const m=L[k].match(/^(X本人|X公式|IG本人|IG公式)\s*：/);if(m&&m[1]===lab&&++n===i)return k}return -1}
function seReplyIdx(o,pk,j){const [s,i]=pk.split(':'),k=sePostIdx(o,s,+i),L=seL(o);let n=-1;for(let x=k+1;x<L.length;x++){if(/^(返信|コメント)\s*：/.test(L[x])){if(++n===j)return x}else if(L[x].trim())break}return -1}
function seReplyEnd(o,k){const L=seL(o);let x=k+1;while(x<L.length&&(/^(返信|コメント)\s*：/.test(L[x])||!L[x].trim()))x++;return x}
function seAccIdx(o,slot){const lab=SEREV[slot];return seL(o).findIndex(l=>new RegExp('^アカウント\\s*：\\s*'+lab+'(｜|$)').test(l))}
const seIt=(o,k)=>gParse(seCfg(),o.rows[k][0]);
const sePut=(o,k,it)=>{it.dirty=true;o.rows[k]=[gBuild(seCfg(),it)]};
function seKV(it,key,val){const p=it.parts.find(x=>x.t==='kv'&&x.k===key);if(val===''||val==null||val===false){if(p)it.parts.splice(it.parts.indexOf(p),1);return}if(p)p.v=String(val);else it.parts.push({t:'kv',k:key,v:String(val)})}
const seKVg=(it,key)=>(it.parts.find(x=>x.t==='kv'&&x.k===key)||{}).v||'';
function sePosSet(it,i,val){const ps=it.parts.filter(x=>x.t==='pos');if(ps[i])ps[i].v=val;else{let at=it.parts.findIndex(x=>x.t==='kv');if(at<0)at=it.parts.length;it.parts.splice(at,0,{t:'pos',v:val})}}
const sePosG=(it,i)=>(it.parts.filter(x=>x.t==='pos')[i]||{}).v||'';
/* 画面の上に出す入力シート（ツイメモのユーザー追加画面のような形） */
function seSheet(el,title,fields,onSave,extra,imgRe){el.querySelector('.snsh')?.remove();const sh=hEl('div','snsh',`<div class="snsht"><button type="button" data-x="close" aria-label="戻る">←</button><b>${esc(title)}</b><button type="button" data-x="save" class="snsv">保存</button></div><div class="snshb"></div>`);
  const body=sh.querySelector('.snshb'),vals={};
  fields.forEach(([key,label,type,val,max,opt])=>{vals[key]=val??'';const row=hEl('label','snf'+(type==='img'||type==='imgs'?' wide':''),`<span>${esc(label)}</span>`);let inp;
    if(type==='img'||type==='imgs'){const mk=()=>{const r=hEl('div','snf wide',`<span>${esc(label)}</span>`);r.appendChild(gPicker({img:imgRe||/^sn_/},vals[key],type==='imgs',v=>{vals[key]=v;r.replaceWith(mk())}));return r};body.appendChild(mk());return}
    if(type==='chk'){inp=document.createElement('input');inp.type='checkbox';inp.checked=!!val;inp.onchange=()=>vals[key]=inp.checked;row.classList.add('chk');row.appendChild(inp);body.appendChild(row);return}
    if(type==='sel'){inp=document.createElement('select');inp.innerHTML=opt.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');inp.value=val??'';inp.onchange=()=>vals[key]=inp.value;row.appendChild(inp);body.appendChild(row);return}
    inp=document.createElement(type==='area'?'textarea':'input');if(type!=='area')inp.type='text';if(type==='num')inp.inputMode='numeric';if(type==='area')inp.rows=3;inp.value=String(val??'').replace(/／/g,'\n');
    const cnt=hEl('small','snc','');const upd=()=>{vals[key]=inp.value;cnt.textContent=max?`${[...inp.value].length}/${max}`:''};inp.oninput=upd;upd();row.append(inp,cnt);body.appendChild(row)});
  if(extra)extra.forEach(([l,fn,cls])=>{const b=hEl('button','snxb '+(cls||''),esc(l));b.type='button';b.onclick=()=>{sh.remove();fn()};body.appendChild(b)});
  sh.onclick=e=>{const b=e.target.closest('[data-x]');if(!b)return;if(b.dataset.x==='save')onSave(vals);sh.remove()};
  el.appendChild(sh);sh.animate([{transform:'translateY(14px)',opacity:0},{transform:'none',opacity:1}],{duration:200});sh.querySelector('input,textarea')?.focus({preventScroll:true});return sh}
/* 数字だけ変える小さなシート */
const seNum=(el,label,val,onSave)=>seSheet(el,label,[['v',label,'num',val]],v=>onSave(v.v.trim()));
/* 編集のしかけを付ける（描き直すたびに呼ばれる） */
function seEditAfter(el,o,save){const st=el._st;if(!st)return;o._st={...st};
  const sc=el.querySelector('.sscr');if(!sc)return;
  if(!el.querySelector('.snhint'))el.insertAdjacentHTML('afterbegin','<div class="snhint">✎ 画面を触って作れます：名前やアイコン→ユーザー編集／＋→投稿／⋮→投稿の編集／数字→数を変える</div>');
  /* ⋮（投稿の編集）と＋（投稿） */
  el.querySelectorAll('.xp[data-k]').forEach(p=>{if(p.querySelector(':scope>.snmore'))return;p.insertAdjacentHTML('afterbegin',`<button type="button" class="snmore" data-sned="post" data-k="${p.dataset.k}" aria-label="投稿を編集">⋮</button>`)});
  el.querySelectorAll('.igrid [data-open]').forEach(b=>{if(b.querySelector('.snmore'))return;b.insertAdjacentHTML('beforeend',`<i class="snmore" data-sned="post" data-k="${b.dataset.open}">⋮</i>`)});
  if(st.view==='prof'&&!el.querySelector('.snfab'))el.insertAdjacentHTML('beforeend','<button type="button" class="snfab" data-sned="compose" aria-label="投稿する">＋</button>');
  if(st.view!=='prof')el.querySelector('.snfab')?.remove();
  /* IG風：ストーリー・ハイライトを足す／ストーリーを直す */
  if(st.view==='prof'&&st.acc[0]==='i'&&!el.querySelector('.snig')){const ib=el.querySelector('.ibtn');if(ib)ib.insertAdjacentHTML('afterend','<div class="snig"><button type="button" data-sned="story">＋ ストーリー</button><button type="button" data-sned="hl">＋ ハイライト</button><small>ハイライトを押すと直せます</small></div>')}
  if(st.view==='story'&&!el.querySelector('.isty .snmore'))el.querySelector('.isty')?.insertAdjacentHTML('beforeend','<button type="button" class="snmore stm" data-sned="stedit" aria-label="ストーリーを編集">⋮</button>');
  const nav=el.querySelector('.snav');if(nav&&!nav.querySelector('.snadd'))nav.insertAdjacentHTML('beforeend','<button type="button" class="snadd" data-sned="addacc">＋ ユーザー</button>');
  /* 返信欄：だれが返信するか */
  const xin=el.querySelector('.xin,.iin');if(xin&&!xin.querySelector('.snwho')){const who=new Set(['あなた']);Object.values(snParse(seL(o)).acc).forEach(a=>a.名前&&who.add(`${a.名前}@${a.ID||''}`));snParse(seL(o));o.rows.forEach(r=>{const m=String(r[0]).match(/^(返信|コメント)\s*：\s*([^｜]+)/);if(m)who.add(m[2].trim())});
    const s=document.createElement('select');s.className='snwho';s.innerHTML=[...who].map(w=>`<option>${esc(w)}</option>`).join('')+'<option value="__new">＋ 新しい人…</option>';s.value=o._who&&[...who].includes(o._who)?o._who:[...who][1]||'あなた';
    s.onchange=()=>{if(s.value==='__new'){seSheet(el,'返信する人を追加',[['n','名前','text','',50],['id','ID（@のあと）','text','',15]],v=>{if(!v.n.trim())return;o._who=`${v.n.trim()}${v.id.trim()?'@'+v.id.trim():''}`;save()});return}o._who=s.value};xin.prepend(s)}}
function seEditBind(el,a,o,save){if(el._sned)return;el._sned=1;
  el._after=()=>seEditAfter(el,o,save);
  el.addEventListener('click',e=>{const st=el._st;if(!st)return;const t=e.target;const go=fn=>{e.preventDefault();e.stopImmediatePropagation();fn()};
    const b=t.closest('[data-sned]');
    if(b){const k=b.dataset.k;
      if(b.dataset.sned==='post')return go(()=>sePostSheet(el,o,save,k));
      if(b.dataset.sned==='compose')return go(()=>seCompose(el,o,save,st.acc));
      if(b.dataset.sned==='story')return go(()=>seStorySheet(el,o,save,st.acc,-1));
      if(b.dataset.sned==='stedit')return go(()=>seStorySheet(el,o,save,st.acc,st.hl!=null?-1:(st.si||0),st.hl));
      if(b.dataset.sned==='hl')return go(()=>seHlSheet(el,o,save,st.acc,-1));
      if(b.dataset.sned==='addacc')return go(()=>{const miss=Object.keys(SEREV).filter(s=>seAccIdx(o,s)<0);if(!miss.length){seSheet(el,'ユーザー',[],()=>{},[['4つのアカウント（X本人・X公式・IG本人・IG公式）はもう全部あります。返信する人は、投稿を開いて下の返信欄の「＋ 新しい人」から足せます。',()=>{}]]);return}seAccSheet(el,o,save,miss[0],miss)})}
    const hlb=st.view==='prof'&&t.closest('[data-act="hl"]');if(hlb)return go(()=>seHlSheet(el,o,save,st.acc,+hlb.dataset.j));
    /* プロフィール → ユーザー編集 */
    if(st.view==='prof'&&t.closest('.xcv,.xprt .sav,.xnm,.xpr>small,.xpr>p,.xff,.xmeta,.ihd .iav,.ibio,.icn'))return go(()=>seAccSheet(el,o,save,st.acc));
    if(st.view==='post'){const pk=st.post,[ps,pi]=pk.split(':'),k=sePostIdx(o,ps,+pi);if(k<0)return;
      const nb=t.closest('.xp.big .xa button');if(nb){const act=nb.dataset.act,key=act==='rp'?'RP':act==='like'?'いいね':nb.dataset.open?'返信数':null;if(key)return go(()=>{const it=seIt(o,k);seNum(el,{RP:'リポストの数',いいね:'いいねの数',返信数:'返信の数'}[key],seKVg(it,key)||nb.querySelector('span')?.textContent||'',v=>{seKV(it,key,v);sePut(o,k,it);save()})})}
      if(t.closest('.ilk'))return go(()=>{const it=seIt(o,k);seNum(el,'いいねの数',seKVg(it,'いいね'),v=>{seKV(it,'いいね',v);sePut(o,k,it);save()})});
      if(t.closest('.xp.big .xt,.xp.big .xtime,.icap,.icar'))return go(()=>sePostSheet(el,o,save,pk));
      const rp=t.closest('.xp.rp,.icm .ic');if(rp&&!t.closest('[data-act="rlike"]')){const j=rp.dataset.j!=null?+rp.dataset.j:[...rp.parentElement.children].indexOf(rp);return go(()=>seReplySheet(el,o,save,pk,j))}
      if(t.closest('[data-act="reply"]'))return go(()=>{const inp=el.querySelector('.xin input,.iin input'),v=inp.value.trim();if(!v)return;const who=el.querySelector('.snwho')?.value||'あなた';
        const at=seReplyEnd(o,k),kind=ps[0]==='x'?'返信':'コメント';o.rows.splice(at,0,[`${kind}：${gcl(who)}｜${gcl(v)}｜時間=今`]);o._who=who;save()})}},true)}
function seAccSheet(el,o,save,slot,choices){const k=seAccIdx(o,slot),it=k>=0?seIt(o,k):{kind:'アカウント',parts:[{t:'pos',v:SEREV[slot]}],dirty:true},x=slot[0]==='x';
  const F=[];if(choices&&choices.length>1)F.push(['slot','どのアカウント？','sel',slot,0,choices.map(s=>[s,SNLAB.find(z=>z[0]===s)[1]])]);
  F.push(['アイコン','アイコン','img',seKVg(it,'アイコン')]);if(x)F.push(['カバー','ヘッダー（カバー）','img',seKVg(it,'カバー')]);
  F.push(['名前','名前','text',seKVg(it,'名前'),50],['ID','ユーザーID（@のあと）','text',seKVg(it,'ID'),15],['フォロー','フォロー数','num',seKVg(it,'フォロー'),9],['フォロワー','フォロワー数（例 285.4万）','num',seKVg(it,'フォロワー'),9]);
  if(!x)F.push(['投稿','投稿数','num',seKVg(it,'投稿'),9]);F.push(['紹介','自己紹介','area',seKVg(it,'紹介'),160],['リンク','リンク','text',seKVg(it,'リンク'),40]);if(x)F.push(['開始','はじめた月（例 2024年1月）','text',seKVg(it,'開始'),15]);
  seSheet(el,k>=0?'プロフィールを編集':'ユーザー追加',F,v=>{const s2=v.slot||slot;sePosSet(it,0,SEREV[s2]);['アイコン','カバー','名前','ID','フォロー','フォロワー','投稿','紹介','リンク','開始'].forEach(key=>{if(key in v)seKV(it,key,gcl(v[key]))});
    if(k>=0)sePut(o,k,it);else{it.dirty=true;o.rows.unshift([gBuild(seCfg(),it)])}if(el._st)el._st.acc=s2;save()})}
function seCompose(el,o,save,slot){const lab=SEREV[slot],x=slot[0]==='x';
  seSheet(el,x?'ポストする':'新しい投稿',[['text',x?'いまどうしてる？':'キャプション','area','',x?140:300],['写真',x?'写真（4枚まで）':'写真','imgs',''],['時間','時間（例 2時間・今）','text','今',15]],v=>{if(!v.text.trim()&&!v.写真)return;
    const ln=gBuild(seCfg(),{kind:lab,parts:[{t:'pos',v:v.text}].concat(v.時間?[{t:'kv',k:'時間',v:v.時間}]:[]).concat(v.写真?[{t:'kv',k:'写真',v:v.写真}]:[]).concat([{t:'kv',k:'いいね',v:'0'}]),dirty:true});
    /* その種類の投稿のいちばん上に入れる（新しい投稿が上） */const first=sePostIdx(o,slot,0);const at=first>=0?first:Math.max(0,seL(o).filter(l=>/^アカウント/.test(l)).length);o.rows.splice(at,0,[ln]);SFX.send&&SFX.send();save()})}
function sePostSheet(el,o,save,pk){const [s,i]=pk.split(':'),k=sePostIdx(o,s,+i);if(k<0)return;const it=seIt(o,k),x=s[0]==='x';
  seSheet(el,'投稿を編集',[['text','本文','area',sePosG(it,0),x?140:300],['写真','写真','imgs',seKVg(it,'写真')],['時間','時間（例 2時間）','text',seKVg(it,'時間'),15],['いいね','いいね','num',seKVg(it,'いいね'),9]].concat(x?[['RP','リポスト','num',seKVg(it,'RP'),9],['返信数','返信の数','num',seKVg(it,'返信数'),9],['固定','プロフィールの上に固定','chk',!!seKVg(it,'固定')]]:[]).concat([['削除','読者が見ていると、少しして消える','chk',!!seKVg(it,'削除')]]),
    v=>{sePosSet(it,0,gcl(v.text));['写真','時間','いいね','RP','返信数'].forEach(key=>{if(key in v)seKV(it,key,gcl(v[key]))});if('固定' in v)seKV(it,'固定',v.固定?'1':'');seKV(it,'削除',v.削除?'6':'');sePut(o,k,it);save()},
    [['この投稿を消す',()=>{const end=seReplyEnd(o,k);if(confirm('この投稿と返信を消しますか？')){o.rows.splice(k,end-k);if(el._st){el._st.view='prof'}save()}},'del']])}
function seReplySheet(el,o,save,pk,j){const k=seReplyIdx(o,pk,j);if(k<0)return;const it=seIt(o,k);
  seSheet(el,'返信を編集',[['who','名前@ID','text',sePosG(it,0),60],['text','本文','area',sePosG(it,1),140],['時間','時間','text',seKVg(it,'時間'),15],['いいね','いいね','num',seKVg(it,'いいね'),9]],
    v=>{sePosSet(it,0,gcl(v.who));sePosSet(it,1,gcl(v.text));seKV(it,'時間',gcl(v.時間));seKV(it,'いいね',gcl(v.いいね));sePut(o,k,it);save()},[['この返信を消す',()=>{o.rows.splice(k,1);save()},'del']])}
/* 編集画面のプレビューで使う */
EDT['アイドルSNS'].live=(pv,a,o,save)=>{const el=pv.querySelector('.isn');if(!el)return;pv.classList.add('pvlive');seEditBind(el,a,o,save);if(o._st&&el._st){Object.assign(el._st,o._st);el._draw&&el._draw()}else el._after&&el._after()};
/* IG風：ストーリー（1行に1枚）とハイライト（1行にまとめて「名前=写真」） */
function seStoryIdx(o,slot,n){const lab=SEREV[slot];let c=-1;return seL(o).findIndex(l=>new RegExp('^ストーリー\\s*：\\s*'+lab+'(｜|$)').test(l)&&++c===n)}
function seStorySheet(el,o,save,slot,n,hl){if(hl!=null)return seHlSheet(el,o,save,slot,hl);const k=n>=0?seStoryIdx(o,slot,n):-1,it=k>=0?seIt(o,k):{kind:'ストーリー',parts:[{t:'pos',v:SEREV[slot]}],dirty:true};
  seSheet(el,k>=0?'ストーリーを編集':'ストーリーを追加',[['写真','写真','img',seKVg(it,'写真')],['文字','のせる文字','area',seKVg(it,'文字'),60],['時間','時間（例 2時間）','text',seKVg(it,'時間')||'今',15]],v=>{['写真','文字','時間'].forEach(x=>seKV(it,x,gcl(v[x])));
    if(k>=0)sePut(o,k,it);else{it.dirty=true;const L=seL(o);let at=L.length;for(let x=L.length-1;x>=0;x--)if(/^ストーリー\s*：/.test(L[x])){at=x+1;break}o.rows.splice(at,0,[gBuild(snCfg(),it)])}save()},
    k>=0?[['このストーリーを消す',()=>{o.rows.splice(k,1);if(el._st){el._st.view='prof'}save()},'del']]:null)}
function seHlSheet(el,o,save,slot,j){const lab=SEREV[slot],k=seL(o).findIndex(l=>new RegExp('^ハイライト\\s*：\\s*'+lab+'(｜|$)').test(l));
  const pairs=k>=0?String(o.rows[k][0]).split('｜').slice(1).map(x=>x.split('=').map(y=>y.trim())):[];const cur=j>=0?pairs[j]||['','']:['',''];
  const write=()=>{const ln=pairs.length?`ハイライト：${lab}｜${pairs.map(([n,p])=>`${gcl(n)}=${p}`).join('｜')}`:'';if(k>=0){if(ln)o.rows[k]=[ln];else o.rows.splice(k,1)}else if(ln)o.rows.push([ln]);save()};
  seSheet(el,j>=0?'ハイライトを編集':'ハイライトを追加',[['n','名前（例 DAILY）','text',cur[0],15],['p','表紙の写真','img',cur[1]]],v=>{const pr=[gcl(v.n)||'NEW',String(v.p||'').split(',')[0]||cur[1]||'sn_t1'];if(j>=0)pairs[j]=pr;else pairs.push(pr);write()},
    j>=0?[['このハイライトを消す',()=>{pairs.splice(j,1);write()},'del']]:null)}
/* ===== トーク・コメント欄：画面を触って作る（編集画面のプレビューの中だけ）=====
   トーク：下の欄で「相手／自分」を切り替えて打つ → 送信。＋ で画像・スタンプ・不在着信・日付。吹き出しを押す → 編集。上の名前を押す → 相手の名前
   コメント欄：上の帯で「だれとして書くか」（ふつう・本人・管理者・スパチャ・コイン・システム）を選んで、配信の入力欄から送る。コメントを押す → 編集 */
function pvMove(o,i,d){const j=i+d;if(j<0||j>=o.rows.length)return;[o.rows[i],o.rows[j]]=[o.rows[j],o.rows[i]]}
/* --- トーク（LINE風・カカオ風）：トークメーカーと同じ見た目と操作 ---
   ［トーク 見た目=LINE／カカオ 相手=ハル 人数=5 メンバー=レン、友人、ミオ ひとこと=… アイコン=5 背景=#fce7f3 時計=23:40 不在=1］
   1行＝「自分｜時刻｜既読：本文」「相手｜時刻：本文」「レン：本文」（メンバー）「日付：今日」「システム：〇〇が退出しました。」
   本文の {画像:street} {スタンプ:1} {不在着信} {通話:12:34}。既読の欄は 既読／既読 4／1／未読（付けない） */
const TKMEM=a=>String(a.メンバー||'').split(/[、,，]/).map(s=>s.trim()).filter(Boolean);
BR['トーク']=(a,L)=>{
  const kk=a.見た目==='カカオ'?'kk':'ln',who=a.相手||'相手',grp=(+a.人数||0)>0;let tm=40;
  const bg=/^#[0-9a-f]{3,8}$/i.test(a.背景||'')?a.背景:'';
  const avOf=n=>{const idx=(n===who&&a.アイコン)?String(a.アイコン).replace(/\D/g,''):'';return`<i class="av" data-who="${esc(n)}" style="background-image:url(a/p${idx||pIdx(n)}.jpg)"></i>`};
  const rows=L.map((l,idx)=>{const i=l.indexOf('：');const hd=i<0?['']:l.slice(0,i).split('｜'),k=hd[0],v=i<0?l:l.slice(i+1);let m;
    if(k==='日付')return`<div class="tkd" data-i="${idx}"><span>${esc(v)}</span></div>`;
    if(k==='システム')return`<div class="tkd sys" data-i="${idx}"><span>${esc(v)}</span></div>`;
    const me=k==='自分',nm=k==='相手'?who:k,t=hd[1]||`23:${String(tm++).padStart(2,'0')}`;
    const rd=me?(hd[2]==='未読'?'':(hd[2]||(a.既読!=='なし'?'既読':''))):'';
    let body,cls='bb';
    if((m=v.match(/^\{画像[:：](.+)\}$/))){body=`<img src="a/ph_${esc(m[1])}.jpg" alt="">`;cls='bb bimg'}
    else if((m=v.match(/^\{スタンプ[:：](\d+)\}$/))){body=TKST[(+m[1]-1+TKST.length)%TKST.length];cls='bb bst'}
    else if(/^\{不在着信\}$/.test(v)){body='📞 不在着信<small>タップしてかけ直す</small>';cls='bb bcall'}
    else if((m=v.match(/^\{通話[:：](.+)\}$/))){const vd=/^ビデオ/.test(m[1]);body=`${vd?'📹 ビデオ通話':'📞 音声通話'}<small>${esc(m[1].replace(/^ビデオ\s*/,''))}</small>`;cls='bb bcall ok'}
    else if((m=v.match(/^\{リンク[:：](.+)\}$/))){const [lt,lu]=m[1].split(/[|｜]/);const host=String(lu||'').replace(/^https?:\/\//,'').split('/')[0];body=`<span class="blnu">${esc(lu||'')}</span><span class="blnc"><i></i><b>${esc(lt||'')}</b><small>${esc(host)}</small></span>`;cls='bb blink'}
    else body=inline(v);
    const label=!me&&(grp||k!=='相手')?`<small class="tkn">${esc(nm)}</small>`:'';
    return`<div class="msg ${me?'me':'you'}" data-i="${idx}">${me?'':avOf(nm)}<div class="tkc">${label}<div class="tkr"><div class="${cls}">${body}</div><span class="tm">${rd?`<em>${esc(rd)}</em>`:''}${esc(t)}</span></div></div></div>`}).join('');
  return`<div class="blk talk ${kk}" data-fx="トーク" data-a="${encA(a)}"${bg?` style="--tkbg:${bg}"`:''}><div class="tkst"><span>${esc(a.時計||'23:40')}</span><span>▂▄▆ ◔ ▮</span></div><div class="tkh"><span class="tkbk">‹</span><span class="tkt"><b>${esc(who)}</b>${grp?`<em class="tkcnt">(${esc(a.人数)})</em>`:''}</span><span class="tkico"><i class="tkph">${MRPH}</i><i class="tkmn">☰</i></span></div><div class="tkb">${rows}${a.不在?'<div class="tknm"><span>メンバーがいません</span></div>':''}</div><div class="tki"><i class="tkpl">＋</i><div class="tkin"></div><button type="button" class="tks" disabled>送信</button></div></div>`};
EDT['トーク'].sets.push(['人数','人数（グループにするなら。空ならふたり）'],['メンバー','グループのメンバー（、で区切る）'],['ひとこと','相手のひとこと（プロフィール）'],['背景','背景の色（例 #fce7f3・空なら標準）'],['時計','上の時計（例 23:40）'],['不在','「メンバーがいません」',[['','出さない'],['1','出す']]]);
EDT['トーク'].plain=(o,f)=>`${f?`――― ${o.a.相手||'トーク'} ―――\n`:''}${o.rows.map(r=>{const k=r[0];if(k==='日付')return`― ${r[1]} ―`;if(k==='システム')return`（${r[1]}）`;const nm=k==='自分'?'自分':k==='相手'?(o.a.相手||'相手'):k;return`${nm}：${String(r[1]).replace(/^\{スタンプ[:：]\d+\}$/,'（スタンプ）').replace(/^\{画像[:：].+\}$/,'（画像）').replace(/^\{不在着信\}$/,'（不在着信）').replace(/^\{通話[:：](.+)\}$/,'（音声通話 $1）')}${r[2]?'　'+r[2]:''}${r[3]&&r[3]!=='未読'?'　'+r[3]:''}`}).join('\n')}`;
/* --- 編集画面：画面を触って作る --- */
function tkEditBind(el,a,o,save){if(el._tked)return;el._tked=1;
  const kk=a.見た目==='カカオ',cnt=+a.人数||0,grp=cnt>0,mem=TKMEM(a),who=a.相手||'相手';
  if(!o._tkw)o._tkw='自分';if(o._tkRead===undefined)o._tkRead=true;
  const RDOPT=['','既読','既読 1','既読 2','既読 3','既読 4','既読 5','既読 10','1','2','3'],readOn=()=>o._tkReadTxt||(kk?'1':(grp?`既読 ${Math.max(1,cnt-1)}`:'既読')),readNow=()=>o._tkRead?readOn():'未読';
  const nameOf=k=>k==='自分'?'あなた':k==='相手'?who:k,mine=()=>o._tkw==='自分';
  el.insertAdjacentHTML('afterbegin','<div class="snhint">✎ 下で「だれとして送るか」を選んで送る／吹き出しを押して直す／<b>長押し（右クリック）でメニュー</b>／上の名前・☰で設定／アイコンでプロフィール</div>');
  const opts=[['自分','自分'],['相手',who],...mem.filter(m=>m!==who).map(m=>[m,m])];
  const tb=document.createElement('div');tb.className='tkedt';
  const drawTb=()=>{tb.innerHTML=`<div class="tkpills">${opts.map(([v,l])=>`<button type="button" data-w="${esc(v)}" class="${o._tkw===v?'on':''}">${esc(l)}</button>`).join('')}</div><div class="tktools"><button type="button" data-te="read" class="${o._tkRead?'':'off'}">${o._tkRead?'既読あり':'既読なし'}</button><select data-te="rc" title="既読の数">${RDOPT.map(v=>`<option value="${v}"${(o._tkReadTxt||'')===v?' selected':''}>${v===''?'既読の数：自動':v}</option>`).join('')}</select><button type="button" data-te="date">日付</button><button type="button" data-te="sys">演出/退出</button></div>`};drawTb();
  const bar=el.querySelector('.tki');bar.before(tb);
  bar.innerHTML='<button type="button" class="tkplus" data-te="plus" aria-label="写真・スタンプ・通話">＋</button><input type="text" class="tkinp" maxlength="120"><button type="button" class="tks" data-te="send">送信</button>';
  const inp=bar.querySelector('.tkinp'),ph=()=>{inp.placeholder=(mine()?'自分':nameOf(o._tkw))+'として送る'};ph();
  const add=row=>{o.rows.push(row);save();requestAnimationFrame(()=>{const b=document.querySelector('.tpv .talk .tkb');if(b)b.scrollTop=b.scrollHeight})};
  const send=()=>{const v=inp.value.trim();if(!v)return;add([o._tkw,gcl(v),'',mine()?readNow():''])};
  const unsentText=k=>k==='自分'?'メッセージの送信を取り消しました':`${nameOf(k)}がメッセージの送信を取り消しました`;
  const editRow=i=>{const r=o.rows[i];if(!r)return;let mm;const sp=r[0]==='日付'||r[0]==='システム';
    const F=[['k','向き','sel',r[0],0,[['相手',who+'（左）'],['自分','自分（右）'],...mem.filter(m=>m!==who).map(m=>[m,m+'（左）']),['日付','日付の区切り'],['システム','システム表示（送信取消・退出など）']]]];
    if((mm=String(r[1]).match(/^\{画像[:：](.+)\}$/)))F.push(['img','画像','img','ph_'+mm[1]]);
    else if((mm=String(r[1]).match(/^\{スタンプ[:：](\d+)\}$/)))F.push(['st','スタンプ','sel',mm[1],0,TKST.map((s,j)=>[String(j+1),s])]);
    else if((mm=String(r[1]).match(/^\{通話[:：](.+)\}$/)))F.push(['call','通話時間','text',mm[1],8]);
    else if(!/^\{不在着信\}$/.test(r[1]))F.push(['t',r[0]==='日付'?'日付（例 今日）':r[0]==='システム'?'表示する文':'メッセージ','area',r[1],120]);
    if(!sp)F.push(['tm','時刻（空なら自動）','text',r[2]||'',5]);
    if(r[0]==='自分')F.push(['rd','既読の表記（空＝つけない。例 既読／既読 4／1）','text',r[3]==='未読'?'':(r[3]||(a.既読!=='なし'?'既読':'')),10]);
    seSheet(el,'メッセージを編集',F,v=>{r[0]=v.k;if('t' in v)r[1]=gcl(v.t);if('img' in v&&v.img)r[1]=`{画像:${String(v.img).replace(/^ph_/,'').split(',')[0]}}`;if('st' in v)r[1]=`{スタンプ:${v.st}}`;if('call' in v)r[1]=`{通話:${gcl(v.call)||'12:34'}}`;if('tm' in v)r[2]=gcl(v.tm);if('rd' in v)r[3]=gcl(v.rd)||'未読';save()},
      [['↑ 上へ',()=>{pvMove(o,i,-1);save()}],['↓ 下へ',()=>{pvMove(o,i,1);save()}],['このメッセージを消す',()=>{o.rows.splice(i,1);save()},'del']],/^ph_/)};
  /* 長押し・右クリックのメニュー */
  let menuAt=0,menuI=-1,firedAt=0;const closeMenu=()=>{el.querySelector('.tkmenu')?.remove();el.querySelector('.tkmenubd')?.remove()};
  const openMenu=(i,x,y)=>{const r=o.rows[i];if(!r)return;if(menuI===i&&Date.now()-menuAt<700)return;menuI=i;menuAt=Date.now();closeMenu();
    const sp=r[0]==='日付'||r[0]==='システム',me=r[0]==='自分',has=!!r[3]&&r[3]!=='未読',it=[['edit','✎','編集する']];
    if(!sp&&me)it.push(['read',has?'🙈':'👁',has?'既読をつけない':'既読をつける'],['readn','🔢','既読の数を選ぶ']);if(!sp)it.push(['time','🕒','時刻を変える'],['unsent','↩','送信取消にする']);it.push(['up','↑','上へ'],['down','↓','下へ'],['del','🗑','削除する']);
    const bd=document.createElement('div');bd.className='tkmenubd';const mn=document.createElement('div');mn.className='tkmenu';
    mn.innerHTML=it.map(([k,ic,l])=>`<button type="button" data-m="${k}" class="${k==='del'?'del':''}"><i>${ic}</i>${l}</button>`).join('');el.append(bd,mn);
    const er=el.getBoundingClientRect(),mw=mn.offsetWidth,mh=mn.offsetHeight;let left=x-er.left-mw/2,top=y-er.top+8;left=Math.max(6,Math.min(left,er.width-mw-6));if(top+mh>er.height-6)top=Math.max(6,top-mh-24);mn.style.left=left+'px';mn.style.top=top+'px';
    bd.onclick=bd.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();closeMenu()};
    mn.onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;e.stopPropagation();const k=b.dataset.m;closeMenu();
      if(k==='edit')return editRow(i);
      if(k==='read'){r[3]=has?'未読':readOn();return save()}
      if(k==='readn')return seSheet(el,'既読の数を選ぶ',[['v','既読の表記','sel',(r[3]&&r[3]!=='未読')?r[3]:'未読',0,[['未読','既読なし'],...RDOPT.filter(Boolean).map(x=>[x,x])]]],v=>{r[3]=v.v;save()});
      if(k==='time')return seSheet(el,'時刻を変える',[['tm','時刻（空なら自動）','text',r[2]||'',5]],v=>{r[2]=gcl(v.tm);save()});
      if(k==='unsent'){o.rows[i]=['システム',unsentText(r[0]),'',''];return save()}
      if(k==='up'){pvMove(o,i,-1);return save()}if(k==='down'){pvMove(o,i,1);return save()}if(k==='del'){o.rows.splice(i,1);return save()}}};
  /* 追加のシート */
  const plusSheet=()=>seSheet(el,'送るものを選ぶ',[],()=>{},[['🖼 写真',()=>add([o._tkw,'{画像:street}','',mine()?readNow():''])],['😊 スタンプ',()=>add([o._tkw,'{スタンプ:1}','',''])],['📞 不在着信',()=>add([o._tkw,'{不在着信}','',''])],['📞 音声通話',()=>add([o._tkw,'{通話:12:34}','',mine()?readNow():''])],['📅 日付の区切り',()=>add(['日付','今日','',''])]]);
  const sysSheet=()=>{const nm=nameOf(o._tkw);seSheet(el,'演出・退出などを追加',[['t','自由な文（保存で追加）','text','',60]],v=>{if(v.t.trim())add(['システム',gcl(v.t),'',''])},[[`💬 ${unsentText(o._tkw)}`,()=>add(['システム',unsentText(o._tkw),'','']),''],[`🚪 ${nm}が退出しました。`,()=>add(['システム',`${nm}が退出しました。`,'','']),''],['🚫 メンバーがいません',()=>add(['システム','メンバーがいません','','']),'']])};
  const callSheet=()=>seSheet(el,'通話履歴を追加',[['len','通話時間','text','12:34',8]],v=>add([o._tkw,`{通話:${gcl(v.len)||'12:34'}}`,'',mine()?readNow():'']),[['📞 不在着信を追加',()=>add([o._tkw,'{不在着信}','',''])]]);
  const settings=()=>seSheet(el,'トークの設定',[['n','相手（ルーム）の名前','text',a.相手||'',30],['cnt','人数（グループにするなら。空ならふたり）','num',a.人数||'',3],['mem','グループのメンバー（、で区切る）','text',a.メンバー||'',60],['st','相手のひとこと（プロフィール）','text',a.ひとこと||'',60],['look','見た目','sel',a.見た目||'',0,[['','LINE風'],['カカオ','カカオ風']]],['bg','背景の色','sel',a.背景||'',0,[['','標準'],['#1e293b','ダーク夜'],['#fce7f3','パステル桜'],['#7494c0','LINE'],['#b2c7d9','カカオ']]],['read','自分のメッセージに既読を付ける','chk',a.既読!=='なし'],['nm','「メンバーがいません」を出す','chk',!!a.不在],['clock','上の時計','text',a.時計||'',5]],
    v=>{const S=(k,val)=>{if(val)a[k]=val;else delete a[k]};S('相手',gcl(v.n));S('人数',gcl(v.cnt));S('メンバー',gcl(v.mem).replace(/\s+/g,''));S('ひとこと',gcl(v.st));S('見た目',v.look);S('背景',v.bg);if(v.read)delete a.既読;else a.既読='なし';S('不在',v.nm?'1':'');S('時計',gcl(v.clock));save()});
  const profile=name=>{closeMenu();el.querySelector('.tkprof')?.remove();const isP=name===who,idx=(isP&&a.アイコン?String(a.アイコン).replace(/\D/g,''):'')||pIdx(name),d=document.createElement('div');d.className='tkprof';
    d.innerHTML=`<button type="button" data-p="x" aria-label="閉じる">✕</button><button type="button" data-p="ed" class="pe">プロフィールを編集</button><div class="pc"><i class="pav" style="background-image:url(a/p${idx}.jpg)"></i><b>${esc(name==='自分'?'わたし':name)}</b><small>${esc(isP?(a.ひとこと||''):'')}</small><div class="pb"><button type="button" data-p="x"><i>💬</i><span>トーク</span></button><button type="button" data-p="call"><i>📞</i><span>無料通話</span></button></div></div>`;
    d.onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;e.stopPropagation();const k=b.dataset.p;d.remove();if(k==='ed')settings();if(k==='call')add(['自分','{通話:03:15}','',readNow()])};el.appendChild(d)};
  /* 長押し（スマホ） */
  let lp=null,sx=0,sy=0;
  el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;const m=e.target.closest('.msg[data-i],.tkd[data-i]');if(!m||e.target.closest('.snsh,.tkmenu,.tkprof'))return;sx=e.clientX;sy=e.clientY;clearTimeout(lp);lp=setTimeout(()=>{lp=null;firedAt=Date.now();vib(15);openMenu(+m.dataset.i,sx,sy)},500)});
  el.addEventListener('pointermove',e=>{if(lp&&(Math.abs(e.clientX-sx)>10||Math.abs(e.clientY-sy)>10)){clearTimeout(lp);lp=null}});
  ['pointerup','pointercancel','pointerleave'].forEach(t=>el.addEventListener(t,()=>{clearTimeout(lp);lp=null}));
  el.addEventListener('contextmenu',e=>{const m=e.target.closest('.msg[data-i],.tkd[data-i]');if(!m||e.target.closest('.snsh,.tkmenu,.tkprof'))return;e.preventDefault();e.stopPropagation();openMenu(+m.dataset.i,e.clientX,e.clientY)},true);
  el.addEventListener('click',e=>{const t=e.target;
    if(t.closest('.snsh,.tkmenu,.tkmenubd,.tkprof'))return;if(Date.now()-firedAt<800){e.preventDefault();e.stopPropagation();return}
    const go=fn=>{e.preventDefault();e.stopPropagation();fn()},w=t.closest('[data-w]'),b=t.closest('[data-te]');
    if(w)return go(()=>{o._tkw=w.dataset.w;drawTb();ph()});
    if(b){const k=b.dataset.te;if(k==='rc')return;if(k==='read')return go(()=>{o._tkRead=!o._tkRead;drawTb()});if(k==='send')return go(send);if(k==='date')return go(()=>add(['日付','今日','','']));if(k==='sys')return go(sysSheet);if(k==='plus')return go(plusSheet)}
    if(t.closest('.tkph'))return go(callSheet);if(t.closest('.tkt,.tkmn'))return go(settings);
    const av=t.closest('.av[data-who]');if(av)return go(()=>profile(av.dataset.who));
    const m=t.closest('.msg[data-i],.tkd[data-i]');if(m)go(()=>editRow(+m.dataset.i))},true);
  el.addEventListener('change',e=>{if(e.target.matches('[data-te="rc"]'))o._tkReadTxt=e.target.value},true);
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send()}})}
EDT['トーク'].live=(pv,a,o,save)=>{const el=pv.querySelector('.talk');if(!el)return;pv.classList.add('pvlive');tkEditBind(el,a,o,save);const b=el.querySelector('.tkb');if(b&&o._tkscroll!==false)b.scrollTop=b.scrollHeight};
/* ===== LINE通知：画面の上から降りてくる（LINE風・カカオ風）=====
   ［LINE通知 アプリ=LINE／カカオ 秒=4］ 1行＝「送り主：本文」。順に降りてきて、そのあと文章の中に記録として残る。押すと閉じる */
BLOCKS.add('LINE通知');
BR['LINE通知']=(a,L)=>{const kk=a.アプリ==='カカオ'?'kk':'ln';
  return`<div class="blk lnn" data-fx="LINE通知" data-a="${encA(a)}">${L.filter(l=>l.trim()).map((l,i)=>{const k=l.indexOf('：'),n=k<0?'':l.slice(0,k).trim(),t=k<0?l:l.slice(k+1);
    return`<div class="lnc ${kk}" data-i="${i}"><span class="lnav"><i class="pic" style="background-image:url(a/p${pIdx(n||'相手')}.jpg)"></i><u>${kk==='kk'?'●':'💬'}</u></span><div class="lncb"><div class="lnch"><b>${esc(n)}</b><em>${kk==='kk'?'カカオトーク':'LINE'} • 今</em></div><p>${esc(t)}</p></div></div>`}).join('')}</div>`};
D['LINE通知']={
  prep(el){el.querySelectorAll('.lnc').forEach(x=>x.style.display='none')},
  async run(el,a,c){const cards=[...el.querySelectorAll('.lnc')],sec=(+a.秒||3.6)*1000,pv=el.closest('.tpv');
    for(const card of cards){if(c.dead)return;
      const b=document.createElement('div');b.className='lnb '+(a.アプリ==='カカオ'?'kk':'ln');b.innerHTML=card.innerHTML;
      let rm;if(pv){b.style.top=(pv.scrollTop+8)+'px';pv.appendChild(b);rm=()=>b.remove()}else{const Ly=c.layer('lnl');Ly.appendChild(b);rm=()=>Ly.remove()}
      SFX.notif&&SFX.notif();vib([30,60,30]);
      if(!RDM())b.animate([{transform:'translateY(-130%)',opacity:0},{transform:'none',opacity:1}],{duration:420,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
      const tapped=new Promise(r=>b.addEventListener('click',()=>r(true),{once:true}));
      await Promise.race([c.wait(sec),tapped]);if(c.dead){rm();return}
      if(!RDM())await b.animate([{transform:'none',opacity:1},{transform:'translateY(-130%)',opacity:0}],{duration:360,fill:'forwards'}).finished.catch(()=>{});rm();
      card.style.display='';if(!RDM())card.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:300});keepBottom();
      if(!await c.wait(500))return}}};
TPL['LINE通知']={block:1,attrs:[['アプリ','アプリ',[['LINE','LINE'],['カカオ','カカオトーク']]],['秒','表示する秒数']],cols:[['送り主'],['本文']],parse:l=>{const k=l.indexOf('：');return[k<0?'':l.slice(0,k),k<0?l:l.slice(k+1)]},fmt:r=>`${r[0]}：${r[1]}`};
TPNAME['LINE通知']='LINE通知';
EDT['LINE通知']={item:'通知',sel:'.lnc',label:r=>`${r[0]}：${r[1]}`,blank:()=>['ハル',''],fields:[['送り主',0],['本文',1,'area']],
  sets:[['アプリ','アプリ',[['LINE','LINE'],['カカオ','カカオトーク']]],['秒','表示する秒数（例 4）']],
  presets:{'LINE通知':[['友だちから（LINE）',{アプリ:'LINE'},'ハル：今どこ？'],['続けて3通（LINE）',{アプリ:'LINE'},'ミオ：今日ありがとう！\nミオ：あのね\nミオ：また、ふたりで行きたいな'],['先輩から（カカオ）',{アプリ:'カカオ'},'先輩：明日、少しだけ時間ある？'],['不審な送り主',{アプリ:'LINE'},'？？？：うしろ']]}};
EDT['LINE通知'].play=(pv,a,o)=>pvRun(pv,'LINE通知',a,o,'__none__');
/* ===== 「書き方」の中でトークメーカーを開く（linemaker.html を、そのまま）=====
   開くとき：いまのトーク（相手・見た目・人数・1行ずつの発言）で、メーカーのトークルームを作る
   直したとき：メーカーのトークルームを、本文の形（1行ずつ）に直して、本文に入れる（このとき画面は作り直さない） */
let MKMODE='maker';
EDT['トーク'].maker=(pane,o,a,commit,pv)=>{
  const note=hEl('p','ehint','メーカーそのものです。友だち一覧・トーク一覧・プロフィール・長押しメニューが使えます。いま開いているトークルームの内容が、そのまま本文に入ります。');
  const wrap=hEl('div','mkwrap');const fr=document.createElement('iframe');fr.className='mkfr';fr.src='linemaker.html?embed=1';fr.setAttribute('title','トークメーカー');
  wrap.appendChild(fr);pane.append(note,wrap);
  /* 全画面：上のテンプレート・印・ボタンが邪魔にならないように（スマホは、はじめから全画面） */
  const fb=hEl('button','mkfs','⛶ 全画面で作る');fb.type='button';wrap.prepend(fb);let full=false;
  const setFull=on=>{full=on;if(on){fr.style.cssText='position:fixed;left:0;right:0;top:0;width:100%;height:100vh;height:100dvh;min-height:0;z-index:80;border-radius:0;';fb.style.display='none'}else{fr.style.cssText='';fb.style.display=''}try{fr.contentWindow.postMessage({type:'full',on},'*')}catch(err){}};
  fb.onclick=()=>setFull(true);
  fr.addEventListener('load',()=>{try{const d=fr.contentDocument;d.addEventListener('focusin',e=>{if(e.target.matches('input,textarea,select')&&window.fxKb)fxKb.on(e.target,fr)});d.addEventListener('focusout',()=>window.fxKb&&fxKb.off())}catch(err){}});
  const KEYS=['相手','見た目','人数','メンバー','ひとこと','時計','不在','背景'];
  const onMsg=e=>{if(!document.contains(fr)){removeEventListener('message',onMsg);return}if(e.source!==fr.contentWindow)return;const m=e.data||{};
    if(m.type==='exitFull'){setFull(false);return}
    if(m.type==='ready'){const at={};Object.entries(a).forEach(([k,v])=>{if(k!=='args'&&typeof v==='string')at[k]=v.replace(/ /g,' ')});fr.contentWindow.postMessage({type:'init',attrs:at,rows:o.rows.map(r=>[r[0],r[1],r[2]||'',r[3]||''])},'*');if(innerWidth<=520)setFull(true)}
    else if(m.type==='state'&&Array.isArray(m.rows)){o.rows=m.rows;KEYS.forEach(k=>delete a[k]);Object.entries(m.attrs||{}).forEach(([k,v])=>{if(v)a[k]=v});commit()}};
  addEventListener('message',onMsg)};
/* --- コメント欄 --- */
const CEK=[['ふつう','ふつう'],['本人','🎤本人'],['管理者','◎管理者'],['スパチャ','¥スパチャ'],['コイン','🪙コイン'],['システム','［システム'],];
function chEditBind(el,a,o,save,pv){if(el._ched)return;el._ched=1;const form=a.形||'配信',me=a.配信者||(form==='アイドル'?'HANEUL':'配信者');
  const kinds=CEK.filter(([k])=>form==='星座'?['ふつう','本人','コイン','システム'].includes(k):form==='アイドル'?k!=='':k!=='コイン');
  o._cew=o._cew||{k:'ふつう',n:'',am:'1,000'};const w=o._cew;
  const strip=hEl('div','cewho',`<small>だれとして書く？（下の入力欄から送ると、その人のコメントになります）</small><div class="seg sm">${kinds.map(([k,l])=>`<button type="button" data-k="${k}" class="${w.k===k?'on':''}">${l}</button>`).join('')}</div><div class="cerow"><input type="text" class="cen" placeholder="名前（空なら名無し）" value="${esc(w.k==='本人'?me:w.n)}"${w.k==='本人'||w.k==='システム'?' disabled':''}><input type="text" class="cea" placeholder="金額" value="${esc(w.am)}"${w.k==='スパチャ'||w.k==='コイン'?'':' hidden'}></div>`);
  strip.onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;w.k=b.dataset.k;if(w.k==='コイン'&&!/\d/.test(w.am))w.am='500';save()};
  strip.querySelector('.cen').oninput=e=>{w.n=e.target.value};strip.querySelector('.cea').oninput=e=>{w.am=e.target.value};
  pv.insertBefore(strip,el);
  el.insertAdjacentHTML('afterbegin','<div class="snhint">✎ 上で「だれとして書くか」を選んで、下の入力欄から送る・コメントを押して直す</div>');
  const inp=el.querySelector('.iin input,.yin input');
  const send=()=>{const v=(inp?.value||'').trim();if(!v&&w.k!=='システム')return;const n=w.k==='本人'?me:w.k==='システム'?'':(gcl(w.n)||'名無し');o.rows.push([w.k,n,gcl(v),w.k==='スパチャ'||w.k==='コイン'?gcl(w.am):'']);if(inp)inp.value='';save()};
  el.addEventListener('click',e=>{const t=e.target,go=fn=>{e.preventDefault();e.stopImmediatePropagation();fn()};
    if(t.closest('.snd,.ysnd'))return go(send);
    if(t.closest('.scb,.gf,.hb,.sm'))return;
    const c=t.closest('.cm[data-i]');if(!c)return;const i=+c.dataset.i,r=o.rows[i];if(!r)return;
    go(()=>seSheet(el,'コメントを編集',[['k','種類','sel',r[0],0,kinds],['n','名前','text',r[1],30],['t','コメント','area',r[2],120],['am','金額（スパチャ・コイン）','text',r[3]||'',9]],v=>{r[0]=v.k;r[1]=v.k==='本人'?me:gcl(v.n);r[2]=gcl(v.t);r[3]=v.k==='スパチャ'||v.k==='コイン'?gcl(v.am)||'1,000':'';save()},
      [['↑ 上へ',()=>{pvMove(o,i,-1);save()}],['↓ 下へ',()=>{pvMove(o,i,1);save()}],['このコメントを消す',()=>{o.rows.splice(i,1);save()},'del']]))},true);
  inp&&inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();send()}},true)}
EDT['チャット欄'].live=(pv,a,o,save)=>{const el=pv.querySelector('.chat');if(!el)return;pv.classList.add('pvlive');chEditBind(el,a,o,save,pv);el.querySelectorAll('.cm').forEach(m=>m.style.display='');const box=el.querySelector('.cms');if(box)box.scrollTop=box.scrollHeight};
/* ===== アイドルSNS：Xメーカーで作る（xmaker.html を、そのまま）=====
   開くとき：X本人・X公式のアカウントと、ポスト・返信（本文の行）で、メーカーを作る
   直したとき：メーカーの内容を、本文の行に直して入れる（IG風の行・ストーリー・ハイライトは、そのまま残す。このとき画面は作り直さない） */
const XL_ACC=/^アカウント\s*：\s*(X本人|X公式)\s*(｜|$)/,XL_POST=/^(X本人|X公式)\s*：/,XL_REPLY=/^返信\s*：/;
function xMerge(rows,gen){const L=rows.map(r=>String(r[0]??''));const keep=[];let at=-1,inX=false;
  L.forEach(l=>{const x=XL_ACC.test(l)||XL_POST.test(l)||(inX&&XL_REPLY.test(l));
    if(x){if(at<0)at=keep.length;inX=!XL_ACC.test(l)}else{if(!XL_REPLY.test(l))inX=false;keep.push(l)}});
  if(at<0)at=keep.length;keep.splice(at,0,...gen);return keep.map(s=>[s])}
EDT['アイドルSNS'].mkdef='cards';
EDT['アイドルSNS'].maker=(pane,o,a,commit,pv)=>{
  const note=hEl('p','ehint','Xメーカーです。X本人・X公式のポストと、ファンの返信を作れます。タップして直し、画像は「＋画像」から選びます。IG風の行は、そのまま残ります。');
  const wrap=hEl('div','mkwrap');const fr=document.createElement('iframe');fr.className='mkfr';fr.src='xmaker.html?embed=1';fr.setAttribute('title','Xメーカー');
  wrap.appendChild(fr);pane.append(note,wrap);
  const fb=hEl('button','mkfs','⛶ 全画面で作る');fb.type='button';wrap.prepend(fb);let full=false;
  const setFull=on=>{full=on;if(on){fr.style.cssText='position:fixed;left:0;right:0;top:0;width:100%;height:100vh;height:100dvh;min-height:0;z-index:80;border-radius:0;';fb.style.display='none'}else{fr.style.cssText='';fb.style.display=''}try{fr.contentWindow.postMessage({type:'full',on},'*')}catch(err){}};
  fb.onclick=()=>setFull(true);
  fr.addEventListener('load',()=>{try{const d=fr.contentDocument;d.addEventListener('focusin',e=>{if(e.target.matches('input,textarea,select')&&window.fxKb)fxKb.on(e.target,fr)});d.addEventListener('focusout',()=>window.fxKb&&fxKb.off())}catch(err){}});
  const onMsg=e=>{if(!document.contains(fr)){removeEventListener('message',onMsg);return}if(e.source!==fr.contentWindow)return;const m=e.data||{};
    if(m.type==='exitFull'){setFull(false);return}
    if(m.type==='ready'){fr.contentWindow.postMessage({type:'init',rows:o.rows.map(r=>String(r[0]??'')),attrs:{見る:a.見る||'',テーマ:a.テーマ||''}},'*');if(innerWidth<=520)setFull(true)}
    else if(m.type==='state'&&Array.isArray(m.rows)){o.rows=xMerge(o.rows,m.rows);commit()}};
  addEventListener('message',onMsg)};
/* ===== どのテンプレートでも：画面の文字や写真を押すと、その行を直せる（編集画面のプレビューの中だけ）=====
   押した所の文字・写真から、どの行で書いたものかを探して、その行の入力シートを出す。右下の＋で行を足す */
const pvNorm=s=>String(s??'').replace(/[\s　／｜]/g,'').replace(/<[^>]+>/g,'');
function pvFindRow(o,el,t){const rows=o.rows.map(r=>pvNorm(r[0]));let n=t;
  while(n&&n!==el.parentElement){if(n.nodeType===1){
      const bg=(n.style&&n.style.backgroundImage)||'',src=n.getAttribute&&n.getAttribute('src')||'',m=(bg.match(/a\/([\w-]+)\.jpg/)||src.match(/a\/([\w-]+)\.jpg/)||[])[1];
      if(m){const i=o.rows.findIndex(r=>String(r[0]).includes(m));if(i>=0)return i}
      const tx=pvNorm(n.textContent);if(tx.length>=2&&tx.length<=200){const hits=rows.map((r,i)=>r.includes(tx)?i:-1).filter(i=>i>=0);if(hits.length===1||(hits.length>1&&n===t))return hits[0]}
      /* 飾り（[PHOTO]・› など）が付いていて丸ごとでは合わないときは、中の言葉ひとつずつで探す（長い言葉から） */
      const tw=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),ps=[];while(tw.nextNode()){const x=pvNorm(tw.currentNode.data).replace(/^[\[［(（]|[\]］)）›»]$/g,'');if(x.length>=2)ps.push(x)}
      ps.sort((a,b)=>b.length-a.length);let any=-1;for(const x of ps){const hits=rows.map((r,i)=>r.includes(x)?i:-1).filter(i=>i>=0);if(hits.length===1)return hits[0];if(hits.length&&any<0)any=hits[0]}if(any>=0&&ps.length&&n.children.length<8)return any}
    n=n.parentElement}return -1}
/* その行の入力シート（文例から覚えた名前を使う） */
function pvRowSheet(pv,o,i,k,save){const cfg=GCFG[k],it=gParse(cfg,String(o.rows[i][0])),learn=gLearn(EDT[k],k),lrn=learn[it.kind]||{keys:[],bool:{}};
  const F=[],map=[];if(!it.kind){F.push(['raw','文','area',it.text]);map.push(null)}
  else{const pl=cfg.pos[it.kind]||[];let pi=0;it.parts.forEach((p,j)=>{if(p.t==='pos'){const label=pl[pi++]||'内容';const img=gIsImg(cfg,p.v,label);F.push(['f'+j,label,img?(/写真/.test(label)?'imgs':'img'):(/本文|文|コメント|内容|紹介|タイトル/.test(label)||String(p.v).length>24?'area':'text'),p.v]);map.push(j);return}
      const label=(cfg.keys&&cfg.keys[p.k])||p.k;if(lrn.bool[p.k]||p.flag){F.push(['f'+j,label,'chk',!!p.v&&p.v!=='0']);map.push(j);return}
      F.push(['f'+j,label,gIsImg(cfg,p.v,p.k)?(p.k==='写真'?'imgs':'img'):'text',p.v]);map.push(j)})}
  const sh=seSheet(pv,(it.kind?(cfg.names[it.kind]||it.kind):'文')+'を編集',F,v=>{if(!it.kind){it.text=v.raw}else map.forEach((j,x)=>{if(j==null)return;const p=it.parts[j],val=v['f'+j];if(typeof val==='boolean')p.v=val?'1':'';else p.v=String(val??'').replace(/\n/g,'／')});
      it.dirty=true;o.rows[i]=[gBuild(cfg,it)];save()},
    [['↑ 上へ',()=>{pvMove(o,i,-1);save()}],['↓ 下へ',()=>{pvMove(o,i,1);save()}],['⧉ 複製する',()=>{o.rows.splice(i+1,0,[o.rows[i][0]]);save()}],['この行を消す',()=>{o.rows.splice(i,1);save()},'del']],cfg.img);
  pvPin(pv,sh)}
/* シートを、いま見ている所に出す */
function pvPin(pv,sh){if(!sh)return;sh.style.cssText+=`;inset:auto;left:0;right:0;top:${pv.scrollTop}px;height:${pv.clientHeight}px`}
function pvAddSheet(pv,o,k,save){const cfg=GCFG[k],learn=gLearn(EDT[k],k);
  const sh=seSheet(pv,'行を足す',[],()=>{},Object.entries(learn).sort((a,b)=>b[1].n-a[1].n).map(([kind,lr])=>[`＋ ${cfg.names[kind]||kind}`,()=>{o.rows.push([lr.sample]);save();requestAnimationFrame(()=>{const p2=document.querySelector('.tpv');if(p2)pvRowSheet(p2,o,o.rows.length-1,k,save)})}]).concat([['＋ ふつうの文・印',()=>{o.rows.push(['']);save()}]]));pvPin(pv,sh)}
function pvTapEdit(pv,a,o,save,k,blockSel){const el=pv.querySelector(blockSel);if(!el||el._pvte)return;el._pvte=1;pv.classList.add('pvlive');
  pv.insertAdjacentHTML('afterbegin','<div class="snhint">✎ 文字や写真を押すと、その所を直せます。右下の＋で行を足せます</div>');
  if(!pv.querySelector('.pvfab'))pv.insertAdjacentHTML('beforeend','<button type="button" class="pvfab" aria-label="行を足す">＋</button>');
  pv.querySelector('.pvfab').onclick=e=>{e.stopPropagation();pvAddSheet(pv,o,k,save)};
  el.addEventListener('click',e=>{if(e.target.closest('.snsh'))return;const i=pvFindRow(o,el,e.target);if(i<0)return;e.preventDefault();e.stopImmediatePropagation();pvRowSheet(pv,o,i,k,save)},true)}
EDT['ホムマ'].live=(pv,a,o,save)=>pvTapEdit(pv,a,o,save,'ホムマ','.hm,.hs,[data-fx="ホムマ"]');
EDT['報道'].live=(pv,a,o,save)=>pvTapEdit(pv,a,o,save,'報道','[data-fx="報道"]');

let TKMODE='cards',CHMODE='cards';
EDT['チャット欄'].ccards=1;

async function openBook(withFx){
  S.fx=withFx;$('fxSw').checked=withFx;
  if(withFx){audioInit();}
  try{await document.fonts.ready}catch(e){}
  const cv=$('cover');cv.animate([{opacity:1},{opacity:0}],{duration:500,fill:'forwards'}).finished.then(()=>cv.remove());
  goto(withFx?BOOK.start-1:0,{push:false});
}
$('yes').onclick=()=>openBook(true);
$('no').onclick=()=>openBook(false);

/* スマホのキーボードで入力欄がかくれないように：キーボードの高さだけ余白を足して、入力欄を見える位置までずらす（ページの中・「書き方」の画面・その中のメーカーの中）*/
(()=>{const vv=window.visualViewport;let foc=null,frm=null,where='',lastFrm=null;const KBX=76;/* キーボードの上の候補・自動入力の帯が、ページの下に重なる分 */const sheet=$('sheet');
  const sp=el=>{let p=el&&el.parentElement;while(p&&p!==document.body){const o=getComputedStyle(p).overflowY;if((o==='auto'||o==='scroll')&&p.scrollHeight>p.clientHeight+2)return p;p=p.parentElement}return null};
  const lift=(box,getR,top,bot)=>{let p=box.parentElement,n=0;while(p&&p!==document.body&&n++<10){const o=getComputedStyle(p).overflowY;if((o==='auto'||o==='scroll')&&p.scrollHeight>p.clientHeight+2){const r=getR();if(r.bottom>bot-12)p.scrollTop+=r.bottom-(bot-12);else if(r.top<top+8)p.scrollTop-=top+8-r.top}p=p.parentElement}};
  const fit=()=>{if(!foc)return;const top=vv?vv.offsetTop:0,bot=vv?vv.height+vv.offsetTop:innerHeight,kb=Math.max(0,innerHeight-bot);
    if(where==='sheet'){sheet.style.paddingBottom=kb>60?kb+'px':'';
      if(frm){/* メーカーの枠を、見えている所（キーボードより上）いっぱいに固定する */if(!frm._fit){frm._fit=1;const wr=frm.parentElement;wr.style.minHeight=wr.offsetHeight+'px';frm._was=frm.getAttribute('style')||''}
        frm.style.cssText=`position:fixed;left:0;right:0;width:100%;top:${top}px;height:${Math.max(220,bot-top)}px;min-height:0;z-index:80;border-radius:0;`;try{frm.contentWindow.postMessage({type:'kb',pad:KBX},'*')}catch(e){}lastFrm=frm;return}
      lift(foc,()=>foc.getBoundingClientRect(),top,bot-KBX+12);return}
    if(!document.contains(foc))return;
    page.style.paddingBottom=kb>60?kb+48+'px':'';
    const sc=foc.closest('.sscr');const r=foc.getBoundingClientRect();
    if(r.bottom>bot-KBX)page.scrollTop+=r.bottom-(bot-KBX);else if(r.top<top+56)page.scrollTop-=top+56-r.top;
    if(sc){const r2=foc.getBoundingClientRect();if(r2.bottom>bot-KBX)sc.scrollTop+=r2.bottom-(bot-KBX)}};
  const on=(el,fr)=>{foc=el;frm=fr||null;where=(fr||el.closest('#sheet'))?'sheet':'page';[120,350,700].forEach(t=>setTimeout(fit,t))};
  const off=()=>{foc=null;frm=null;setTimeout(()=>{if(!foc){page.style.paddingBottom='';sheet.style.paddingBottom='';if(lastFrm){try{lastFrm.contentWindow.postMessage({type:'kb',pad:0},'*')}catch(e){}lastFrm.style.cssText=lastFrm._was||'';lastFrm.parentElement.style.minHeight='';lastFrm._fit=0;lastFrm=null}}},250)};
  window.fxKb={on,off,fit};
  document.addEventListener('focusin',e=>{if(e.target.matches('#page input,#page textarea,#sheet input,#sheet textarea,#sheet select'))on(e.target)});
  document.addEventListener('focusout',off);
  if(vv){vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit)}})();