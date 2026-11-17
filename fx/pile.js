/* 通知の山：たまったメッセージ（カカオ・LINE など）が、次々と積み上がって、未読の数がふくらむ
   ［通知の山 アプリ=カカオ 件数=999 時刻=23:41］
   名前：本文
   ［／通知の山］
   読む画面（index.html）と、演出ビュー（fx.js）の両方で使う */
(function (global) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const APPS = { 'カカオ': { k: 'kk', ic: 'TALK', name: 'カカオトーク' }, 'LINE': { k: 'ln', ic: 'LINE', name: 'LINE' }, 'メール': { k: 'ml', ic: '✉', name: 'メール' }, 'インスタ': { k: 'ig', ic: '◎', name: 'Instagram' } };
  function app(a) { return APPS[(a && a.アプリ) || 'カカオ'] || { k: 'ot', ic: String(a.アプリ || '').slice(0, 1) || '●', name: a.アプリ || '通知' }; }
  function parseRows(L) {
    return (L || []).map(l => String(l).trim()).filter(Boolean).map(l => { const m = l.match(/^([^：:]{1,20})[：:]\s*(.*)$/); return m ? { n: m[1].trim(), b: m[2].trim() } : { n: '', b: l }; });
  }
  function total(a, rows) { const n = Number(String((a && a.件数) || '').replace(/[０-９]/g, d => '０１２３４５６７８９'.indexOf(d)).replace(/[^0-9]/g, '')); return n > 0 ? n : Math.max(rows.length, 99); }
  const badge = n => n >= 999 ? '999+' : String(n);
  function card(r, ap) { return '<div class="pl-c"><i class="pl-ic">' + esc(ap.ic) + '</i><div class="pl-tx"><div class="pl-h"><b>' + esc(r.n || ap.name) + '</b><small>今</small></div><div class="pl-b">' + esc(r.b) + '</div></div></div>'; }
  const MAXV = 5;
  function listHtml(rows, ap) {
    const show = rows.slice(-MAXV).reverse(), rest = rows.length - show.length;
    return show.map(r => card(r, ap)).join('') + (rest > 0 ? '<div class="pl-more">ほか ' + rest + '件の通知</div>' : '');
  }
  function html(a, L, cls, extra) {
    a = a || {}; const rows = parseRows(L), ap = app(a), n = total(a, rows);
    return '<div class="' + (cls || 'fxpile') + ' pl-' + ap.k + '" data-rows="' + esc(JSON.stringify(rows)) + '" data-n="' + n + '" data-app="' + esc(a.アプリ || 'カカオ') + '"' + (extra || '') + '>'
      + '<div class="pl-top"><span class="pl-time">' + esc(a.時刻 || '23:41') + '</span><span class="pl-app">' + esc(ap.name) + '</span><span class="pl-badge">未読 <b>' + badge(n) + '</b></span></div>'
      + '<div class="pl-list">' + listHtml(rows, ap) + '</div></div>';
  }
  /* o: { wait(ms)→Promise<bool>, sound()→void, dead()→bool } */
  async function run(el, o) {
    let rows = []; try { rows = JSON.parse(el.dataset.rows || '[]'); } catch (e) {}
    const ap = APPS[el.dataset.app] || app({ アプリ: el.dataset.app }), n = Number(el.dataset.n) || rows.length;
    const list = el.querySelector('.pl-list'), bd = el.querySelector('.pl-badge b'); if (!list || !bd) return;
    let stop = false; const done = () => { stop = true; list.innerHTML = listHtml(rows, ap); bd.textContent = badge(n); el.classList.remove('pl-run'); };
    el.addEventListener('click', done, { once: true });
    list.innerHTML = ''; bd.textContent = '0'; el.classList.add('pl-run');
    let cnt = 0;
    for (let i = 0; i < rows.length; i++) {
      if (stop || (o.dead && o.dead())) return;
      const d = document.createElement('div'); d.innerHTML = card(rows[i], ap); const c = d.firstChild; list.prepend(c);
      try { c.animate([{ transform: 'translateY(-60%) scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' }); } catch (e) {}
      const cs = list.querySelectorAll('.pl-c'); if (cs.length > MAXV) { cs[cs.length - 1].remove(); let m = list.querySelector('.pl-more'); if (!m) { m = document.createElement('div'); m.className = 'pl-more'; list.appendChild(m); } m.textContent = 'ほか ' + (i + 1 - MAXV) + '件の通知'; }
      cnt = Math.max(cnt + 1, Math.round((i + 1) / rows.length * Math.min(n, rows.length * 3))); bd.textContent = badge(Math.min(cnt, n));
      const gap = Math.max(70, 520 * Math.pow(0.82, i)); if (gap > 110 || i % 3 === 0) o.sound && o.sound();
      if (!await o.wait(gap)) return;
    }
    // 残りは、数字だけが一気にふくらむ
    const from = Math.min(cnt, n), steps = 24;
    for (let s = 1; s <= steps; s++) {
      if (stop || (o.dead && o.dead())) return;
      bd.textContent = badge(Math.round(from + (n - from) * (s / steps) ** 1.6)); if (s % 4 === 0) o.sound && o.sound();
      if (!await o.wait(60)) return;
    }
    done();
  }
  global.FxPile = { html, run, parseRows };
})(typeof window !== 'undefined' ? window : this);
