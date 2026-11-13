/* 報道（トレンド・ニュース記事・動画コメント）を、読む画面の本文の中に、絵のまま出す。
   印：［報道 形=炎上｜ニュース｜動画 …］ … ［／報道］（1行＝「種類：値｜値｜キー=値」。fx.js の報道と同じ書き方）
   NewsReader.isSource(src) / html(src,{base}) / plain(src) / scan(root,settings,key) / play(el,{sound}) */
(function (global) {
'use strict';
const KINDS = ['炎上', 'ニュース', '動画', 'コラム', 'タイムライン'];
const RE = /^［報道[ \t]([^］\n]*)］\n?([\s\S]*?)\n?［／報道］\s*$/;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function attrs(s) { const a = {}; String(s || '').trim().split(/[ \t]+/).filter(Boolean).forEach(t => { const i = t.indexOf('='); if (i > 0) a[t.slice(0, i)] = t.slice(i + 1); else if (t === '続き') a.続き = '1'; }); return a; }
function rows(text) {
  return String(text || '').split('\n').filter(l => l.trim()).map(l => {
    let i = l.indexOf('：'); if (i > 8 || l.slice(0, i).includes('｜')) i = -1;
    const ps = l.slice(i + 1).split('｜').map(x => x.trim()), o = {}, v = [];
    ps.forEach(p => { const j = p.indexOf('='); if (j > 0 && j < 6) o[p.slice(0, j)] = p.slice(j + 1); else v.push(p); });
    return { k: i < 0 ? '' : l.slice(0, i).trim(), v, o, raw: l };
  }).map((r, i) => (r.i = i, r));
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
  <div class="nr-top nr-in"><span class="nr-rank">🔥 <em class="nr-rk" data-from="${esc(a.開始 || a.順位 || '1')}" data-to="${esc(a.順位 || '1')}">${esc(a.順位 || '1')}</em>位</span><b class="nr-tag" data-e="a:タグ">${tx(a.タグ || '#話題')}</b><small>${cnt(a.件数, 1)} posts</small></div>
  ${tr.length ? `<div class="nr-tl">${tr.map((r, i) => `<div class="nr-in"><em>${i + 2}</em><b data-e="r:${r.i}:v0">${tx(r.v[0])}</b><small>${esc(r.v[1] || '')}</small></div>`).join('')}</div>` : ''}
  <div class="nr-posts">${ps.map(r => {
    if (r.k === '削除済み') return `<div class="nr-tw nr-del nr-in">🗑 このポストは削除されました。${r.v[0] ? `<span>（スクショが拡散中：「${tx(r.v.join('｜'))}」）</span>` : ''}</div>`;
    const [id, text] = r.v.length >= 2 ? r.v : [r.k || 'user', r.v[0]]; const kind = r.o.種類 || '';
    return `<div class="nr-tw nr-in k-${esc(kind)}"><div class="nr-twh">${avatar(id, kind)}<b>${esc(r.o.名前 || String(id).replace(/^@/, ''))}</b><small>${esc(String(id).startsWith('@') ? id : '@' + id)}</small></div><p data-e="r:${r.i}:t">${tx(text)}</p>${r.o.引用 ? `<div class="nr-q">${tx(r.o.引用)}</div>` : ''}${r.o.訳 ? `<p class="nr-tr" hidden>${tx(r.o.訳)}</p>` : ''}<div class="nr-act"><span>♡ ${cnt(r.o.いいね, 1)}</span><span>↻ ${cnt(r.o.RP, 1)}</span>${r.o.訳 ? '<button type="button" class="nr-trb">翻訳</button>' : ''}</div></div>`;
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
  const user = (r, sm) => `<div class="nr-ycu">${av(r.v[0], sm)}<b data-e="r:${r.i}:u">${esc(r.v[0] || '名無し')}</b>${r.o.時間 ? `<small>${esc(r.o.時間)}</small>` : ''}</div><p data-e="r:${r.i}:t">${tx(r.v.slice(1).join('｜'))}</p>`;
  const photo = (r, i, all) => { const u = img(r.v[0]), cap = r.v.slice(1).join('｜'), m = i === all.length - 1 ? more : 0; return `<figure class="nr-in">${m ? `<span class="nr-more">＋${m}枚</span>` : ''}${u ? `<img src="${esc(u)}" alt="" loading="lazy">` : '<div class="nr-noimg"><span class="nr-cam">📷</span><span>写真</span></div>'}${cap ? `<figcaption data-e="r:${r.i}:cap">${tx(cap)}</figcaption>` : ''}</figure>`; };
  const art = `<div class="nr-nart">`
    + `<div class="nr-nmeta nr-in"><b class="nr-media" data-e="a:媒体">${esc(a.媒体 || 'STAR NEWS')}</b>${a.印 ? `<span class="nr-flag" data-e="a:印">${esc(a.印)}</span>` : ''}${a.閲覧 ? `<span class="nr-views">閲覧: <span data-e="a:閲覧">${cnt(a.閲覧)}</span></span>` : ''}</div>`
    + `<h3 class="nr-in" data-e="a:見出し">${tx(a.見出し || '')}</h3>${a.副題 ? `<h5 class="nr-in" data-e="a:副題">${tx(a.副題)}</h5>` : ''}`
    + (a.日時 || a.記者 ? `<div class="nr-by nr-in">${a.日時 ? `<span data-e="a:日時">${esc(a.日時)}</span>` : ''}${a.記者 ? `<span data-e="a:記者">${esc(a.記者)}</span>` : ''}</div>` : '')
    + (ph.length ? `<div class="nr-phs n${Math.min(3, ph.length)}">${ph.slice(0, 3).map(photo).join('')}</div>` : '')
    + (body.length ? `<div class="nr-nbody">${body.map(r => `<p class="nr-in" data-e="r:${r.i}:all">${tx(r.v.join('｜'))}</p>`).join('')}</div>` : '')
    + fix.map(r => `<div class="nr-fix nr-in">修正 ${esc(r.v[0] || '')}　${tx(r.v[1] || '')}</div>`).join('')
    + (rel.length ? `<div class="nr-rel">${rel.map(r => `<div class="nr-in"><b>関連：</b><span data-e="r:${r.i}:all">${tx(r.v.join('｜'))}</span></div>`).join('')}</div>` : '')
    + `</div>`;
  const head = part === 'cm' ? `<div class="nr-ych"><b>コメント</b><span>${cnt(total)}件</span>${a.見出し ? `<small class="nr-yof">${tx(a.見出し)}</small>` : ''}</div>` : `<div class="nr-ych"><b>コメント</b><span>${cnt(total)}件</span><small class="nr-ytab"><em>おすすめ順</em>｜新着順</small></div>`;
  const comments = cms.length ? `<div class="nr-ycm">${head}${cms.map(({ r, re }) => `<div class="nr-yc nr-in">${user(r)}${reacts(r.o)}${re.length ? `<div class="nr-yrl"><div class="nr-yrn">返信 ${re.length}件</div>${re.map(x => `<div class="nr-yr nr-in">${user(x, 1)}</div>`).join('')}</div>` : ''}</div>`).join('')}</div>` : '';
  return `<div class="nr nr-news p-${part}${small ? ' small' : ''}">${part === 'cm' ? '' : art}${part === 'art' ? '' : comments}</div>`;
}
// 動画コメント欄（参考：急上昇動画のクリップのコメント欄）。返信は「└@名前｜本文」、ふつうは「@名前｜本文」
function video(a, R) {
  const groups = []; let g = null;
  for (const r of R) {
    const first = (r.v[0] || '').trim().replace(/^[―—─－]{1,3}\s*/, ''), reply = /^└/.test(first) || r.k === '返信';
    const id = first.replace(/^└\s*/, ''), text = r.v.length >= 2 ? r.v.slice(1).join('｜') : '';
    const it = { id: r.v.length >= 2 ? id : '', text: r.v.length >= 2 ? text : id, like: r.o.いいね || '', i: r.i, named: r.v.length >= 2 };
    if (reply && g) g.replies.push(it); else if (reply) { g = { c: null, replies: [it] }; groups.push(g); } else { g = { c: it, replies: [] }; groups.push(g); }
  }
  const user = s => esc(s ? (String(s).startsWith('@') ? s : '@' + s) : '@user');
  const light = a.見た目 === '明るい';
  return `<div class="nr nr-video${light ? ' light' : ''}${a.続き ? ' cont' : ''}">${a.続き ? '' : `<div class="nr-vh"><b><span class="nr-play">▶</span> <span data-e="a:題">${tx(a.題 || '急上昇動画 #1 クリップコメント欄')}</span></b><small>コメント ${cnt(a.件数 || String(groups.reduce((n, x) => n + 1 + x.replies.length, 0)))}件</small></div>`}
  ${groups.map(x => `<div class="nr-vg">${x.c ? `<div class="nr-vc nr-in"><span class="nr-vu"${x.c.named ? ` data-e="r:${x.c.i}:u"` : ''}>${user(x.c.id)}</span><span class="nr-vt" data-e="r:${x.c.i}:t">${tx(x.c.text)}</span>${x.c.like ? `<span class="nr-vl">👍 ${cnt(x.c.like, 1)}</span>` : ''}</div>` : ''}${x.replies.map(r => `<div class="nr-vr nr-in"><span class="nr-vu"${r.named ? ` data-e="r:${r.i}:u"` : ''}>${user(r.id)}</span><span class="nr-vt" data-e="r:${r.i}:t">${tx(r.text)}</span></div>`).join('')}</div>`).join('')}</div>`;
}
// コラム（オピニオン・寄稿）。見た目＝マガジン（ふつう）／新聞／ダーク。1行＝1段落。**ここ** は蛍光ペン
function column(a, R) {
  const th = /^新聞/.test(a.見た目 || '') ? 'paper' : /^ダーク/.test(a.見た目 || '') ? 'dark' : 'mag';
  const hl = t => tx(t).replace(/\*\*([^*<]+?)\*\*/g, '<mark class="nr-chl">$1</mark>');
  return `<div class="nr nr-col t-${th}">`
    + (a.分類 ? `<div class="nr-ccat nr-in"><span data-e="a:分類">${esc(a.分類)}</span></div>` : '')
    + `<h3 class="nr-ctit nr-in" data-e="a:題">${tx(a.題 || '【コラム】題を入れます')}</h3>`
    + `<div class="nr-cbody">${R.map(r => `<p class="nr-cp nr-in" data-e="r:${r.i}:raw">${hl(String(r.raw || '').trim())}</p>`).join('')}</div>`
    + (a.署名 ? `<div class="nr-cft nr-in" data-e="a:署名">${esc(a.署名)}</div>` : '')
    + '</div>';
}
// 22：タイムライン（X ダーク／X ライト／インスタ／フェイスブック）。
//   投稿：名前｜@ID｜本文｜時間=2分前｜返信=312｜RP=4,910｜いいね=1.4万｜表示=58万｜色=青｜字=実
//   画像：見出し｜説明｜背景=ステージ｜写真=…｜出す=インスタ（すぐ上の投稿の画像の枠）
//   返信：名前｜@ID｜本文｜時間=…｜いいね=84｜先=@相手（なければ、すぐ上の人へ）　返信の返信：同じ（1段下げる）
const TL_LOOK = { Xダーク: 'xd', Xライト: 'xl', インスタ: 'ig', フェイスブック: 'fb', YouTubeショート: 'ys', インスタリール: 'ir' };
// 動画：場面の題｜場面の下の字｜背景=紫｜音源=…｜印=おすすめ表示｜説明=…｜ID=@…（説明と ID は、書かなければ投稿の本文と @ID）（ショート・リールの見た目のとき、投稿が縦長の動画になる）
const TL_VBG = { 紺: 'v1', 赤: 'v2', 紫: 'v3', 青緑: 'v4' };
const TL_COL = { 青: 'blue', ピンク: 'pink', 紫: 'purple', 緑: 'emerald', 黄: 'amber', 灰: 'slate', 水: 'cyan' };
const TL_COLS = Object.keys(TL_COL);
const TL_BG = { ステージ: 'stage', 夕焼け: 'sunset', スタジオ: 'studio', ネオン: 'neon' };
// ショート：題名｜384万回視聴｜背景=紺（すぐ上の投稿の下に、縦長のカードが3つずつ並ぶ）
const TL_SBG = { 紺: 's1', 赤: 's2', 青緑: 's3' };
const tlCol = (o, id) => { if (TL_COL[o.色]) return TL_COL[o.色]; let h = 0; for (const c of String(id || '')) h = (h * 31 + c.codePointAt(0)) >>> 0; return TL_COL[TL_COLS[h % TL_COLS.length]]; };
const tlId = s => { s = String(s || '').trim() || '@user'; return s.startsWith('@') ? s : '@' + s; };
const tlTx = s => tx(s).replace(/\*\*([^*<]+?)\*\*/g, '<strong>$1</strong>');
function tlGroups(R) {
  const ps = []; let p = null;
  for (const r of R) {
    if (r.k === '投稿') { p = { r, media: null, re: [] }; ps.push(p); }
    else if (r.k === '画像' && p) p.media = r;
    else if (r.k === 'ショート' && p) (p.sh = p.sh || []).push(r);
    else if (r.k === '動画' && p) p.vid = r;
    else if ((r.k === '返信' || r.k === '返信の返信') && p) p.re.push(r);
  }
  return ps;
}
function timeline(a, R, base, ed) {
  const look = TL_LOOK[a.見た目] || 'xd', isX = look === 'xd' || look === 'xl', isV = look === 'ys' || look === 'ir', fy = isX && a.タブ !== 'フォロー中', grid = isV && a.並べ === '横';
  let vh = '';
  const E = (v, k) => v ? ' data-e="r:' + v.i + ':' + k + '"' : '';
  const img = n => /^(md_|ph_|sc_|hs_|sn_)[a-z_0-9]+$/.test(n || '') ? base + 'a/' + n + '.jpg' : /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(n || '') || /^https?:\/\/[^\s"'<>]+$/.test(n || '') ? n : '';
  // ed（メーカーで直すとき）は、空の数も押して入れられるように、空の枠を出す
  const c = (r, k, kk) => r.o[k] ? '<span data-e="r:' + r.i + ':o:' + k + '">' + cnt(r.o[k], kk) + '</span>' : ed ? '<span class="tl-0" data-e="r:' + r.i + ':o:' + k + '"></span>' : '';
  const av = (r, cls) => '<i class="' + cls + ' av-' + tlCol(r.o, r.v[1]) + '" data-av="' + r.i + '">' + esc(r.o.字 || [...String(r.v[0] || '?')][0] || '?') + '</i>';
  const title = look === 'ig' ? 'Instagram' : look === 'fb' ? 'facebook' : look === 'ys' ? 'Shorts' : look === 'ir' ? 'Reels' : '';
  const tagEl = '<small data-e="a:タグ"' + (ed && !a.タグ ? ' class="tl-tag0"' : '') + '>' + tx(a.タグ || '') + '</small>';
  let h = '<div class="nr nr-tml t-' + look + (fy ? ' tab-fy' : '') + '">' + (isX
    ? '<div class="tl-top tl-xtop"><div class="tl-tabs"><span class="tl-tab' + (fy ? ' on' : '') + '" data-tab="おすすめ">おすすめ</span><span class="tl-tab' + (fy ? '' : ' on') + '" data-tab="フォロー中">フォロー中</span></div>' + (a.タグ || ed ? '<div class="tl-xtag">' + tagEl + '</div>' : '') + '</div>'
    : '<div class="tl-top">' + (title ? '<b>' + title + '</b>' : '<b data-e="a:題">' + esc(a.題 || 'おすすめ') + '</b>') + tagEl + '</div>');
  for (const p of tlGroups(R)) {
    const r = p.r, m = p.media, id = tlId(r.v[1]);
    let prev1 = id, prev = id;   // 返信はすぐ上の返信（か投稿）へ。返信の返信は、すぐ上の人へ
    const reps = p.re.map(x => {
      const lv2 = x.k === '返信の返信', xid = tlId(x.v[1]), to = x.o.先 ? tlId(x.o.先) : lv2 ? prev : prev1; prev = xid; if (!lv2) prev1 = xid;
      return '<div class="tl-r nr-in' + (x.k === '返信の返信' ? ' lv2' : '') + '" data-r="' + x.i + '"><div class="tl-rl">' + av(x, 'tl-rav') + '<i class="tl-ln"></i></div><div class="tl-rc"><div class="tl-rw"><div class="tl-rm"><b data-e="r:' + x.i + ':v0">' + esc(x.v[0] || '名無し') + '</b><small class="tl-hd" data-e="r:' + x.i + ':v1">' + esc(xid) + '</small>' + (x.o.時間 || ed ? '<small class="tl-tm">· <span data-e="r:' + x.i + ':o:時間">' + esc(x.o.時間) + '</span></small>' : '') + '</div><div class="tl-to">返信先: <span data-e="r:' + x.i + ':o:先">' + esc(to) + '</span></div><div class="tl-rt" data-e="r:' + x.i + ':v2">' + tlTx(x.v[2] || '') + '</div></div>'
        + '<div class="tl-ra"><span class="f">いいね！</span><span class="f">返信</span><span class="x">💬 ' + c(x, '返信') + '</span><span class="x">🔁 ' + c(x, 'RP') + '</span><span class="xi">♡ ' + c(x, 'いいね') + '</span></div></div></div>';
    }).join('');
    const shelf = p.sh && p.sh.length ? '<div class="tl-sh">' + p.sh.map(s => '<div class="tl-sc nr-in sb-' + (TL_SBG[s.o.背景] || 's1') + '" data-sh="' + s.i + '"><div class="tl-st"><span class="tl-sbd">▶ Shorts</span></div><i class="tl-spl">▶</i><div class="tl-sbt"><b data-e="r:' + s.i + ':v0">' + tlTx(s.v[0] || '') + '</b>' + (s.v[1] || ed ? '<small data-e="r:' + s.i + ':v1">' + esc(s.v[1] || '') + '</small>' : '') + '</div></div>').join('') + '</div>' : '';
    const u = m ? img(m.o.写真) : '';
    const media = m ? '<div class="tl-m bg-' + (TL_BG[m.o.背景] || 'stage') + (m.o.出す === 'インスタ' ? ' only-ig' : '') + (u ? ' ph' : '') + '" data-m="' + m.i + '">' + (u ? '<img src="' + esc(u) + '" alt="" loading="lazy">' : '') + '<div class="tl-mc"><b data-e="r:' + m.i + ':v0">' + tlTx(m.v[0] || '') + '</b>' + (m.v[1] || ed ? '<small data-e="r:' + m.i + ':v1">' + tlTx(m.v[1]) + '</small>' : '') + '</div></div>' : '';
    if (isV) {
      const v = p.vid, fol = look === 'ys' ? 'チャンネル登録' : 'フォローする';
      vh += '<div class="tl-p tl-vp nr-in" data-r="' + r.i + '"><div class="tl-sv sv-' + (TL_VBG[v && v.o.背景] || 'v1') + '"' + (v ? ' data-v="' + v.i + '"' : '') + '>'
        + '<div class="sv-top"><span class="sv-pill">▶ ' + (look === 'ys' ? 'Shorts' : 'Reels') + '</span><span class="sv-tag"' + E(v, 'o:印') + '>' + esc((v && v.o.印) || 'おすすめ表示') + '</span></div>'
        + '<div class="sv-mid"><b' + E(v, 'v0') + '>' + tlTx((v && v.v[0]) || '🎬 切り抜き動画') + '</b>' + ((v && v.v[1]) || (ed && v) ? '<small' + E(v, 'v1') + '>' + tlTx((v && v.v[1]) || '') + '</small>' : '') + '</div>'
        + '<div class="sv-bot"><div class="sv-meta"><div class="sv-ch">' + av(r, 'sv-av') + (v && v.o.ID ? '<span class="sv-hd"' + E(v, 'o:ID') + '>' + esc(tlId(v.o.ID)) + '</span>' : '<span class="sv-hd" data-e="r:' + r.i + ':v1">' + esc(id) + '</span>') + '<span class="sv-fb">' + fol + '</span></div>' + (v && v.o.説明 ? '<div class="sv-cap"' + E(v, 'o:説明') + '>' + tlTx(v.o.説明) + '</div>' : '<div class="sv-cap" data-e="r:' + r.i + ':v2">' + tlTx(r.v[2] || '') + '</div>') + '<div class="sv-au"><span>🎵</span><span' + E(v, 'o:音源') + '>' + esc((v && v.o.音源) || 'オリジナル音源 - ' + (r.v[0] || '')) + '</span></div></div>'
        + '<div class="sv-side">' + (look === 'ys' ? '<div><i>👍</i>' + (c(r, 'いいね') || '0') + '</div><div><i>👎</i><span>低評価</span></div>' : '<div><i>♡</i>' + (c(r, 'いいね') || '0') + '</div>') + '<div><i>💬</i>' + (c(r, '返信') || String(p.re.length)) + '</div><div><i>↗️</i><span>共有</span></div></div></div>'
        + '<i class="sv-prog"><i></i></i></div>'
        + (reps ? '<div class="tl-rs">' + reps + '</div>' : '') + '</div>';
      continue;
    }
    const algo = fy && r.o.おすすめ;
    h += '<div class="tl-p nr-in' + (p.re.length ? ' th' : '') + '" data-r="' + r.i + '">'
      + (algo ? '<div class="tl-algo"><span>✨</span><span data-e="r:' + r.i + ':o:おすすめ">' + esc(r.o.おすすめ) + '</span></div>' : '')
      + '<div class="tl-ph">' + av(r, 'tl-av') + '<div class="tl-pm"><b data-e="r:' + r.i + ':v0">' + esc(r.v[0] || '名無し') + '</b><small class="tl-hd" data-e="r:' + r.i + ':v1">' + esc(id) + '</small><small class="tl-tm">· <span data-e="r:' + r.i + ':o:時間">' + esc(r.o.時間 || 'たった今') + '</span></small></div>' + (algo ? '<span class="tl-fl' + (r.o.フォロー === '中' ? ' on' : '') + '" data-fl="' + r.i + '">' + (r.o.フォロー === '中' ? 'フォロー中' : 'フォローする') + '</span>' : '') + '</div>'
      + '<div class="tl-b" data-e="r:' + r.i + ':v2">' + tlTx(r.v[2] || '') + '</div>' + media + shelf
      + '<div class="tl-igl">いいね！ ' + (c(r, 'いいね') || '0') + '件</div>'
      + '<div class="tl-fbs"><span>' + esc(r.o.反応 || '👍❤️') + ' ' + (c(r, 'いいね') || '0') + '</span><span>コメント ' + (c(r, '返信') || String(p.re.length)) + '件' + (r.o.RP ? ' · シェア ' + c(r, 'RP') + '件' : '') + '</span></div>'
      + '<div class="tl-a"><span class="x">💬 ' + c(r, '返信') + '</span><span class="x">🔁 ' + c(r, 'RP') + '</span><span class="x">♡ ' + c(r, 'いいね') + '</span><span class="x tl-v">📊 ' + c(r, '表示') + '</span>'
      + '<span class="i">♡</span><span class="i">💬</span><span class="i">➤</span><span class="i tl-bm">🔖</span><span class="f">👍 いいね！</span><span class="f">💬 コメント</span><span class="f">↗ シェア</span></div>'
      + (reps ? '<div class="tl-rs">' + reps + '</div>' : '') + '</div>';
  }
  if (vh) h += grid ? '<div class="tl-vgrid">' + vh + '</div>' : vh;
  return h + '</div>';
}
// 読む画面は改行をそのまま空白として出すので、部品の HTML の改行は取り除く
function html(src, opt = {}) { const d = parse(src); if (!d) return ''; const base = opt.base == null ? 'fx/' : opt.base; return (d.a.形 === 'ニュース' ? news(d.a, d.R, base) : d.a.形 === '動画' ? video(d.a, d.R) : d.a.形 === 'コラム' ? column(d.a, d.R) : d.a.形 === 'タイムライン' ? timeline(d.a, d.R, base, !!opt.edit) : trend(d.a, d.R)).replace(/>\s*\n\s*</g, '><').replace(/\n\s*/g, ''); }
// 読み上げ・文字数用の、ふつうの文
function plain(src) {
  const d = parse(src); if (!d) return ''; const a = d.a, out = [];
  if (a.形 === '炎上') { out.push((a.タグ || '') + ' トレンド' + (a.順位 || '1') + '位'); d.R.forEach(r => { if (r.k === 'トレンド') out.push(r.v[0] || ''); else if (r.k === '削除済み') out.push('このポストは削除されました。'); else out.push(r.v.length >= 2 ? r.v[1] : r.v[0] || ''); }); }
  else if (a.形 === 'ニュース') { out.push(a.見出し || ''); if (a.副題) out.push(a.副題); d.R.forEach(r => { if (!r.k) out.push(r.v.join('｜')); else if (r.k === '関連') out.push(r.v.join('｜')); else if (r.k === 'コメント' || r.k === '返信') out.push(r.v.slice(1).join('｜')); }); }
  else if (a.形 === 'タイムライン') { if (a.タグ) out.push(a.タグ); d.R.forEach(r => { if (r.k === '投稿' || r.k === '返信' || r.k === '返信の返信') out.push(r.v[2] || ''); else if (r.k === '画像') out.push(r.v.slice(0, 2).join(' ')); else if (r.k === 'ショート') out.push(r.v[0] || ''); else if (r.k === '動画') out.push(r.v.slice(0, 2).join(' ')); }); }
  else if (a.形 === 'コラム') { if (a.分類) out.push(a.分類); out.push(a.題 || ''); d.R.forEach(r => out.push(String(r.raw || '').trim().replace(/\*\*/g, ''))); if (a.署名) out.push(a.署名); }
  else { if (!a.続き) out.push(a.題 || '動画のコメント欄'); d.R.forEach(r => out.push(r.v.length >= 2 ? r.v.slice(1).join('｜') : String(r.v[0] || '').replace(/^\s*[―—─－]{1,3}\s*/, ''))); }
  return out.map(s => String(s).replace(/／/g, ' ').trim()).filter(Boolean).join('\n') || '​';
}

// ---------- 動き：見えたら、上から順にポンポン出る。数字は増えていく。順位は上がっていく ----------
let actx = null;
function pop(sound, i) { if (!sound) return; try { actx = actx || new (global.AudioContext || global.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime; o.type = 'sine'; o.frequency.value = 784 + (i % 3) * 60; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.16); } catch (e) {} }
const fmt = (n, k) => k ? (n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : n.toLocaleString()) : n.toLocaleString();
function finish(el) { el.querySelectorAll('.nr-in').forEach(x => x.classList.add('on')); el.querySelectorAll('.nr-cnt').forEach(c => { if (c.dataset.final) c.textContent = c.dataset.final; }); el.querySelectorAll('.nr-rk').forEach(r => r.textContent = r.dataset.to); el.classList.remove('nr-playing'); }
function play(el, opt = {}) {
  const root = el.querySelector('.nr') || el; if (!root) return { cancel() {} };
  const items = [...root.querySelectorAll('.nr-in')], timers = []; let done = false, told = false;
  const tell = () => { if (told) return; told = true; if (opt.done) opt.done(); };   // 次のカードへ（出し終わったとき・押して止めたとき）
  const stop = () => { if (done) return; done = true; timers.forEach(clearTimeout); finish(root); tell(); };
  if (global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { stop(); return { cancel() {} }; }
  if (!items.length) { stop(); return { cancel() {} }; }
  root.classList.add('nr-playing'); items.forEach(x => x.classList.remove('on'));
  const fast = root.classList.contains('nr-video') ? 170 : root.classList.contains('nr-col') ? 330 : root.classList.contains('nr-tml') ? 420 : 260;
  // 画面から消えたら（ページを切りかえたら）、そこで止める。音も鳴らさない
  items.forEach((x, i) => timers.push(setTimeout(() => { if (!root.isConnected) { stop(); return; } x.classList.add('on'); pop(opt.sound, i); }, 120 + i * fast)));
  root.querySelectorAll('.nr-cnt').forEach(c => { const v = +c.dataset.v || 0, k = c.dataset.k === '1'; c.dataset.final = c.textContent; if (!v) return; const from = Math.round(v * 0.82), steps = 18; for (let s = 0; s <= steps; s++) timers.push(setTimeout(() => { if (!done) c.textContent = s === steps ? c.dataset.final : fmt(Math.round(from + (v - from) * s / steps), k); }, 200 + s * 70)); });
  root.querySelectorAll('.nr-rk').forEach(r => { let a = parseInt(r.dataset.from, 10) || 1; const b = parseInt(r.dataset.to, 10) || 1; r.textContent = a; let t = 400; while (a > b) { a--; const v = a; timers.push(setTimeout(() => { if (!done) { r.textContent = v; r.classList.remove('bump'); void r.offsetWidth; r.classList.add('bump'); } }, t)); t += 380; } });
  timers.push(setTimeout(tell, 120 + items.length * fast + 250));
  timers.push(setTimeout(stop, 120 + items.length * fast + 1600));
  root.addEventListener('click', stop, { once: true });
  return { cancel: stop };
}
// 翻訳のボタン（読む画面でも押せる。ページはめくらない）
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.nr-trb'); if (!b) return; e.stopPropagation(); e.preventDefault(); const p = b.closest('.nr-tw')?.querySelector('.nr-tr'); if (p) { p.hidden = !p.hidden; b.textContent = p.hidden ? '翻訳' : '原文'; } }, true);

// 読む画面：見えたら1回だけ動く（同じ話の同じ報道は、2回目からは、はじめから全部出す）
const seen = new Set(); let io = null, cfg = {};
// 順番待ち：前のカードが出終わってから、次のカードが動く（同時に動いて、音がかぶらないように）
const queue = []; let busy = false;
let cur = null, gen = 0;
// ページを切りかえたとき：動いているカードと順番待ちを、全部止める
function stopAll() { gen++; queue.length = 0; const c = cur; cur = null; if (c) c.cancel(); busy = false; }
function enqueue(el) { if (!queue.includes(el)) queue.push(el); next(); }
function next() {
  if (busy) return;
  let el; while ((el = queue.shift()) && !el.isConnected) {}
  if (!el) return;
  busy = true; let ended = false;
  const g = gen; let h = null;
  const go = () => { if (ended) return; ended = true; if (g !== gen) return; if (cur === h) cur = null; busy = false; next(); };
  h = play(el, { sound: !!cfg.sound, done: go }); if (!ended) cur = h;
  setTimeout(go, 20000);   // 念のため（止まったままにしない）
}
function scan(root, settings, key) {
  cfg = settings || {}; if (!root) return;
  const list = [...root.querySelectorAll('.fxnews')].filter(el => !el.closest('#reader-editor-box'));
  if (cfg.enabled === false) { list.forEach(el => finish(el)); return; }
  if (!io && global.IntersectionObserver) io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).sort((x, y) => (x.target.compareDocumentPosition(y.target) & 4) ? -1 : 1).forEach(e => { io.unobserve(e.target); enqueue(e.target); }), { threshold: 0.25 });
  list.forEach((el, i) => { if (el.dataset.nrSeen) return; el.dataset.nrSeen = '1'; const k = key + ':' + i + ':' + el.textContent.length; if (seen.has(k) || !io) { finish(el); return; } seen.add(k); el.querySelectorAll('.nr-in').forEach(x => x.classList.remove('on')); io.observe(el); });
}
// 直す：key＝「a:見出し」（印の中の項目）か「r:行:場所」（中の行。all＝行全部／t＝本文／u＝名前／cap＝写真の説明／v0＝はじめ）。空にすると、行は消える
function edit(src, key, val) {
  const m = String(src || '').match(/^(\s*［報道[ \t])([^］\n]*)(］\r?\n?)([\s\S]*?)(\r?\n?［／報道］\s*)$/); if (!m) return src;
  val = String(val == null ? '' : val).replace(/\r/g, '').replace(/\n+$/, '').replace(/\n/g, '／').replace(/\u00a0/g, ' ').trim();
  const [k, a, b, c] = String(key).split(':');
  if (k === 'a') {
    const v = val.replace(/[ \t]+/g, '　').replace(/］/g, '〕'), toks = m[2].trim().split(/[ \t]+/).filter(Boolean), i = toks.findIndex(t => t.startsWith(a + '='));
    if (!v) { if (i >= 0 && a !== '形') toks.splice(i, 1); } else if (i >= 0) toks[i] = a + '=' + v; else toks.push(a + '=' + v);
    return m[1] + toks.join(' ') + m[3] + m[4] + m[5];
  }
  const lines = m[4].split('\n'), idx = []; lines.forEach((l, j) => { if (l.trim()) idx.push(j); });
  const j = idx[+a]; if (j == null) return src;
  const raw = lines[j].replace(/\r$/, ''), lead = raw.match(/^\s*/)[0], r = rows(raw)[0];
  if (!val && b !== 'cap' && b !== 'u' && !/^(v\d|o)$/.test(b)) { lines.splice(j, 1); return m[1] + m[2] + m[3] + lines.join('\n') + m[5]; }
  let v = r.v.slice(); const pre = ((v[0] || '').match(/^\s*(└|[―—─－]{1,3})\s*/) || [''])[0];
  if (b === 'o') { const o = Object.assign({}, r.o), w = /^(返信|RP|いいね|表示|時間|色|字|背景|写真|出す|先|フォロー)$/.test(c) ? val.replace(/[｜\s]/g, '') : val.replace(/｜/g, '|').replace(/\s+/g, ' ').trim(); if (w) o[c] = w; else delete o[c]; lines[j] = lead + (r.k ? r.k + '：' : '') + v.concat(Object.entries(o).map(([x, y]) => x + '=' + y)).join('｜'); return m[1] + m[2] + m[3] + lines.join('\n') + m[5]; }
  if (b === 'raw') { lines[j] = lead + val; return m[1] + m[2] + m[3] + lines.join('\n') + m[5]; }
  if (b === 'all') v = [val];
  else if (b === 'u') { if (v.length >= 2) v[0] = (/^\s*└/.test(v[0]) ? '└' : '') + val; }
  else if (b === 'cap') v = val ? [v[0] || '', val] : [v[0] || ''];
  else if (/^v\d$/.test(b)) { const n = +b.slice(1); while (v.length < n) v.push(''); v[n] = val.replace(/｜/g, '|'); if (n === 1 && v[1] && !v[1].startsWith('@') && r.k !== 'ショート') v[1] = '@' + v[1]; }
  else if (b === 't') v = v.length >= 2 ? [v[0], val] : [pre + val];
  const opts = Object.entries(r.o).map(([x, y]) => x + '=' + y);
  lines[j] = lead + (r.k ? r.k + '：' : '') + v.concat(opts).join('｜');
  return m[1] + m[2] + m[3] + lines.join('\n') + m[5];
}
global.NewsReader = { isSource, html, plain, scan, play, finish, edit, stopAll, KINDS, TL_COLS, TL_BG: Object.keys(TL_BG), TL_SBG: Object.keys(TL_SBG), TL_VBG: Object.keys(TL_VBG), TL_LOOKS: Object.keys(TL_LOOK) };
})(window);
