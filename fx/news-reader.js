/* 報道（トレンド・ニュース記事・動画コメント）を、読む画面の本文の中に、絵のまま出す。
   印：［報道 形=炎上｜ニュース｜動画 …］ … ［／報道］（1行＝「種類：値｜値｜キー=値」。fx.js の報道と同じ書き方）
   NewsReader.isSource(src) / html(src,{base}) / plain(src) / scan(root,settings,key) / play(el,{sound}) */
(function (global) {
'use strict';
const KINDS = ['炎上', 'ニュース', '動画'];
const RE = /^［報道[ \t]([^］\n]*)］\n?([\s\S]*?)\n?［／報道］\s*$/;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function attrs(s) { const a = {}; String(s || '').trim().split(/[ \t]+/).filter(Boolean).forEach(t => { const i = t.indexOf('='); if (i > 0) a[t.slice(0, i)] = t.slice(i + 1); }); return a; }
function rows(text) {
  return String(text || '').split('\n').filter(l => l.trim()).map(l => {
    let i = l.indexOf('：'); if (i > 8 || l.slice(0, i).includes('｜')) i = -1;
    const ps = l.slice(i + 1).split('｜').map(x => x.trim()), o = {}, v = [];
    ps.forEach(p => { const j = p.indexOf('='); if (j > 0 && j < 6) o[p.slice(0, j)] = p.slice(j + 1); else v.push(p); });
    return { k: i < 0 ? '' : l.slice(0, i).trim(), v, o };
  });
}
function parse(src) { const m = String(src || '').trim().match(RE); if (!m) return null; const a = attrs(m[1]); if (!KINDS.includes(a.形)) return null; return { a, R: rows(m[2]) }; }
const isSource = src => !!parse(src);
// 文：「／」で改行、#タグ・@名前は青、0:47 のような時刻は青い字、█ は黒塗り
const tx = s => esc(s || '').replace(/／/g, '<br>').replace(/█+/g, m => `<span class="nr-rd">${m}</span>`).replace(/(^|[\s>（「])((?:\d{1,2}:)?\d{1,2}:\d{2})(?=[\s　、。！？」）]|$)/g, '$1<span class="nr-ts">$2</span>').replace(/([#＃][^\s#＃<、。！？「」（）]+|@[A-Za-z0-9_.\-]+)/g, '<span class="nr-tg">$1</span>');
const num = s => { s = String(s || '0').replace(/,/g, '').trim(); let m; if ((m = s.match(/([\d.]+)\s*万/))) return Math.round(parseFloat(m[1]) * 1e4); if ((m = s.match(/([\d.]+)\s*K/i))) return Math.round(parseFloat(m[1]) * 1e3); if ((m = s.match(/([\d.]+)\s*M/i))) return Math.round(parseFloat(m[1]) * 1e6); return parseInt(s, 10) || 0; };
const cnt = (s, k) => `<span class="nr-cnt" data-v="${num(s)}"${k ? ' data-k="1"' : ''}>${esc(s || '0')}</span>`;
const AV = { ファン: '💙', アンチ: '⚡', ニュース: '📰', 海外: '🌏' };
const avatar = (id, kind) => `<i class="nr-av k-${esc(kind || '')}">${esc(AV[kind] || [...String(id || '?').replace(/^[@└\s]+/, '')][0] || '?')}</i>`;

function trend(a, R) {
  const tr = R.filter(r => r.k === 'トレンド'), ps = R.filter(r => r.k !== 'トレンド');
  return `<div class="nr nr-trend"><div class="nr-h"><b>TRENDING NOW</b><small>トレンド</small></div>
  <div class="nr-top nr-in"><span class="nr-rank">🔥 <em class="nr-rk" data-from="${esc(a.開始 || a.順位 || '1')}" data-to="${esc(a.順位 || '1')}">${esc(a.順位 || '1')}</em>位</span><b class="nr-tag">${tx(a.タグ || '#話題')}</b><small>${cnt(a.件数, 1)} posts</small></div>
  ${tr.length ? `<div class="nr-tl">${tr.map((r, i) => `<div class="nr-in"><em>${i + 2}</em><b>${tx(r.v[0])}</b><small>${esc(r.v[1] || '')}</small></div>`).join('')}</div>` : ''}
  <div class="nr-posts">${ps.map(r => {
    if (r.k === '削除済み') return `<div class="nr-tw nr-del nr-in">🗑 このポストは削除されました。${r.v[0] ? `<span>（スクショが拡散中：「${tx(r.v.join('｜'))}」）</span>` : ''}</div>`;
    const [id, text] = r.v.length >= 2 ? r.v : [r.k || 'user', r.v[0]]; const kind = r.o.種類 || '';
    return `<div class="nr-tw nr-in k-${esc(kind)}"><div class="nr-twh">${avatar(id, kind)}<b>${esc(r.o.名前 || String(id).replace(/^@/, ''))}</b><small>${esc(String(id).startsWith('@') ? id : '@' + id)}</small></div><p>${tx(text)}</p>${r.o.引用 ? `<div class="nr-q">${tx(r.o.引用)}</div>` : ''}${r.o.訳 ? `<p class="nr-tr" hidden>${tx(r.o.訳)}</p>` : ''}<div class="nr-act"><span>♡ ${cnt(r.o.いいね, 1)}</span><span>↻ ${cnt(r.o.RP, 1)}</span>${r.o.訳 ? '<button type="button" class="nr-trb">翻訳</button>' : ''}</div></div>`;
  }).join('')}</div></div>`;
}
function news(a, R, base) {
  const body = R.filter(r => !r.k), rel = R.filter(r => r.k === '関連'), ph = R.filter(r => r.k === '写真'), fix = R.filter(r => r.k === '修正');
  const img = n => /^(md_|ph_|sc_|hs_|sn_)[a-z_]+$/.test(n || '') ? `${base}a/${n}.jpg` : /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(n || '') || /^https?:\/\/[^\s"'<>]+$/.test(n || '') ? n : '';
  // コメントと、その下の返信（「返信：」は、すぐ上のコメントへ）
  const cms = []; for (const r of R) { if (r.k === 'コメント') cms.push({ r, re: [] }); else if (r.k === '返信' && cms.length) cms[cms.length - 1].re.push(r); }
  const total = a.コメント数 || String(cms.reduce((n, c) => n + 1 + c.re.length, 0));
  const more = parseInt(String(a.写真ほか || '').replace(/[^0-9]/g, ''), 10) || 0;
  // 部分=記事（記事だけ）／コメント（コメント欄だけ）。小説で、地の文をはさんで抜粋するときに使う。大きさ=小 で小さめ
  const part = a.部分 === '記事' ? 'art' : a.部分 === 'コメント' ? 'cm' : 'all', small = /^(小|小さめ)$/.test(a.大きさ || '');
  const av = (name, sm) => `<i class="nr-yav${sm ? ' sm' : ''}">${esc([...String(name || '?')][0] || '?')}</i>`;
  const reacts = o => `<div class="nr-yre"><span>👍 共感した ${cnt(o.共感 || '0')}</span><span>💡 なるほど ${cnt(o.なるほど || '0')}</span><span>🤔 うーん ${cnt(o.うーん || o.反対 || '0')}</span></div>`;
  const user = (r, sm) => `<div class="nr-ycu">${av(r.v[0], sm)}<b>${esc(r.v[0] || '名無し')}</b>${r.o.時間 ? `<small>${esc(r.o.時間)}</small>` : ''}</div><p>${tx(r.v.slice(1).join('｜'))}</p>`;
  const photo = (r, i, all) => { const u = img(r.v[0]), cap = r.v.slice(1).join('｜'), m = i === all.length - 1 ? more : 0; return `<figure class="nr-in">${m ? `<span class="nr-more">＋${m}枚</span>` : ''}${u ? `<img src="${esc(u)}" alt="" loading="lazy">` : '<div class="nr-noimg"><span class="nr-cam">📷</span><span>写真</span></div>'}${cap ? `<figcaption>${tx(cap)}</figcaption>` : ''}</figure>`; };
  const art = `<div class="nr-nart">`
    + `<div class="nr-nmeta nr-in"><b class="nr-media">${esc(a.媒体 || 'STAR NEWS')}</b>${a.印 ? `<span class="nr-flag">${esc(a.印)}</span>` : ''}${a.閲覧 ? `<span class="nr-views">閲覧: ${cnt(a.閲覧)}</span>` : ''}</div>`
    + `<h3 class="nr-in">${tx(a.見出し || '')}</h3>${a.副題 ? `<h5 class="nr-in">${tx(a.副題)}</h5>` : ''}`
    + (a.日時 || a.記者 ? `<div class="nr-by nr-in">${a.日時 ? `<span>${esc(a.日時)}</span>` : ''}${a.記者 ? `<span>${esc(a.記者)}</span>` : ''}</div>` : '')
    + (ph.length ? `<div class="nr-phs n${Math.min(3, ph.length)}">${ph.slice(0, 3).map(photo).join('')}</div>` : '')
    + (body.length ? `<div class="nr-nbody">${body.map(r => `<p class="nr-in">${tx(r.v.join('｜'))}</p>`).join('')}</div>` : '')
    + fix.map(r => `<div class="nr-fix nr-in">修正 ${esc(r.v[0] || '')}　${tx(r.v[1] || '')}</div>`).join('')
    + (rel.length ? `<div class="nr-rel">${rel.map(r => `<div class="nr-in"><b>関連：</b>${tx(r.v.join('｜'))}</div>`).join('')}</div>` : '')
    + `</div>`;
  const head = part === 'cm' ? `<div class="nr-ych"><b>コメント</b><span>${cnt(total)}件</span>${a.見出し ? `<small class="nr-yof">${tx(a.見出し)}</small>` : ''}</div>` : `<div class="nr-ych"><b>コメント</b><span>${cnt(total)}件</span><small class="nr-ytab"><em>おすすめ順</em>｜新着順</small></div>`;
  const comments = cms.length ? `<div class="nr-ycm">${head}${cms.map(({ r, re }) => `<div class="nr-yc nr-in">${user(r)}${reacts(r.o)}${re.length ? `<div class="nr-yrl"><div class="nr-yrn">返信 ${re.length}件</div>${re.map(x => `<div class="nr-yr nr-in">${user(x, 1)}</div>`).join('')}</div>` : ''}</div>`).join('')}</div>` : '';
  return `<div class="nr nr-news p-${part}${small ? ' small' : ''}">${part === 'cm' ? '' : art}${part === 'art' ? '' : comments}</div>`;
}
// 動画コメント欄（参考：急上昇動画のクリップのコメント欄）。返信は「└@名前｜本文」、ふつうは「@名前｜本文」
function video(a, R) {
  const groups = []; let g = null;
  for (const r of R) {
    const first = (r.v[0] || '').trim(), reply = /^└/.test(first) || r.k === '返信';
    const id = first.replace(/^└\s*/, ''), text = r.v.length >= 2 ? r.v.slice(1).join('｜') : '';
    const it = { id: r.v.length >= 2 ? id : '', text: r.v.length >= 2 ? text : id, like: r.o.いいね || '' };
    if (reply && g) g.replies.push(it); else { g = { c: it, replies: [] }; groups.push(g); }
  }
  const user = s => esc(s ? (String(s).startsWith('@') ? s : '@' + s) : '@user');
  const light = a.見た目 === '明るい';
  return `<div class="nr nr-video${light ? ' light' : ''}"><div class="nr-vh"><b><span class="nr-play">▶</span> ${tx(a.題 || '急上昇動画 #1 クリップコメント欄')}</b><small>コメント ${cnt(a.件数 || String(groups.reduce((n, x) => n + 1 + x.replies.length, 0)))}件</small></div>
  ${groups.map(x => `<div class="nr-vg"><div class="nr-vc nr-in"><span class="nr-vu">${user(x.c.id)}</span><span class="nr-vt">${tx(x.c.text)}</span>${x.c.like ? `<span class="nr-vl">👍 ${cnt(x.c.like, 1)}</span>` : ''}</div>${x.replies.map(r => `<div class="nr-vr nr-in"><span class="nr-vi">└</span><span class="nr-vu">${user(r.id)}</span><span class="nr-vt">${tx(r.text)}</span></div>`).join('')}</div>`).join('')}</div>`;
}
// 読む画面は改行をそのまま空白として出すので、部品の HTML の改行は取り除く
function html(src, opt = {}) { const d = parse(src); if (!d) return ''; const base = opt.base == null ? 'fx/' : opt.base; return (d.a.形 === 'ニュース' ? news(d.a, d.R, base) : d.a.形 === '動画' ? video(d.a, d.R) : trend(d.a, d.R)).replace(/>\s*\n\s*</g, '><').replace(/\n\s*/g, ''); }
// 読み上げ・文字数用の、ふつうの文
function plain(src) {
  const d = parse(src); if (!d) return ''; const a = d.a, out = [];
  if (a.形 === '炎上') { out.push((a.タグ || '') + ' トレンド' + (a.順位 || '1') + '位'); d.R.forEach(r => { if (r.k === 'トレンド') out.push(r.v[0] || ''); else if (r.k === '削除済み') out.push('このポストは削除されました。'); else out.push(r.v.length >= 2 ? r.v[1] : r.v[0] || ''); }); }
  else if (a.形 === 'ニュース') { out.push(a.見出し || ''); if (a.副題) out.push(a.副題); d.R.forEach(r => { if (!r.k) out.push(r.v.join('｜')); else if (r.k === '関連') out.push(r.v.join('｜')); else if (r.k === 'コメント' || r.k === '返信') out.push(r.v.slice(1).join('｜')); }); }
  else { out.push(a.題 || '動画のコメント欄'); d.R.forEach(r => out.push(r.v.length >= 2 ? r.v.slice(1).join('｜') : r.v[0] || '')); }
  return out.map(s => String(s).replace(/／/g, ' ').trim()).filter(Boolean).join('\n') || '​';
}

// ---------- 動き：見えたら、上から順にポンポン出る。数字は増えていく。順位は上がっていく ----------
let actx = null;
function pop(sound, i) { if (!sound) return; try { actx = actx || new (global.AudioContext || global.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime; o.type = 'sine'; o.frequency.value = 784 + (i % 3) * 60; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.16); } catch (e) {} }
const fmt = (n, k) => k ? (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : n.toLocaleString()) : n.toLocaleString();
function finish(el) { el.querySelectorAll('.nr-in').forEach(x => x.classList.add('on')); el.querySelectorAll('.nr-cnt').forEach(c => { if (c.dataset.final) c.textContent = c.dataset.final; }); el.querySelectorAll('.nr-rk').forEach(r => r.textContent = r.dataset.to); el.classList.remove('nr-playing'); }
function play(el, opt = {}) {
  const root = el.querySelector('.nr') || el; if (!root) return { cancel() {} };
  const items = [...root.querySelectorAll('.nr-in')], timers = []; let done = false;
  const stop = () => { if (done) return; done = true; timers.forEach(clearTimeout); finish(root); };
  if (global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { stop(); return { cancel() {} }; }
  root.classList.add('nr-playing'); items.forEach(x => x.classList.remove('on'));
  const fast = root.classList.contains('nr-video') ? 170 : 260;
  items.forEach((x, i) => timers.push(setTimeout(() => { x.classList.add('on'); pop(opt.sound, i); }, 120 + i * fast)));
  root.querySelectorAll('.nr-cnt').forEach(c => { const v = +c.dataset.v || 0, k = c.dataset.k === '1'; c.dataset.final = c.textContent; if (!v) return; const from = Math.round(v * 0.82), steps = 18; for (let s = 0; s <= steps; s++) timers.push(setTimeout(() => { if (!done) c.textContent = s === steps ? c.dataset.final : fmt(Math.round(from + (v - from) * s / steps), k); }, 200 + s * 70)); });
  root.querySelectorAll('.nr-rk').forEach(r => { let a = parseInt(r.dataset.from, 10) || 1; const b = parseInt(r.dataset.to, 10) || 1; r.textContent = a; let t = 400; while (a > b) { a--; const v = a; timers.push(setTimeout(() => { if (!done) { r.textContent = v; r.classList.remove('bump'); void r.offsetWidth; r.classList.add('bump'); } }, t)); t += 380; } });
  timers.push(setTimeout(stop, 120 + items.length * fast + 1600));
  root.addEventListener('click', stop, { once: true });
  return { cancel: stop };
}
// 翻訳のボタン（読む画面でも押せる。ページはめくらない）
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.nr-trb'); if (!b) return; e.stopPropagation(); e.preventDefault(); const p = b.closest('.nr-tw')?.querySelector('.nr-tr'); if (p) { p.hidden = !p.hidden; b.textContent = p.hidden ? '翻訳' : '原文'; } }, true);

// 読む画面：見えたら1回だけ動く（同じ話の同じ報道は、2回目からは、はじめから全部出す）
const seen = new Set(); let io = null, cfg = {};
function scan(root, settings, key) {
  cfg = settings || {}; if (!root) return;
  const list = [...root.querySelectorAll('.fxnews')].filter(el => !el.closest('#reader-editor-box'));
  if (cfg.enabled === false) { list.forEach(el => finish(el)); return; }
  if (!io && global.IntersectionObserver) io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); play(e.target, { sound: !!cfg.sound }); }), { threshold: 0.25 });
  list.forEach((el, i) => { if (el.dataset.nrSeen) return; el.dataset.nrSeen = '1'; const k = key + ':' + i + ':' + el.textContent.length; if (seen.has(k) || !io) { finish(el); return; } seen.add(k); el.querySelectorAll('.nr-in').forEach(x => x.classList.remove('on')); io.observe(el); });
}
global.NewsReader = { isSource, html, plain, scan, play, finish, KINDS };
})(window);
