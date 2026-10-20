// ===== game.js : state, pigeons, UI, scoring =====
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
let save = { unlocked: 1, high: 0, stars: {} }, G = null, tick = null, msgT = null;
try { save = Object.assign(save, JSON.parse(localStorage.getItem('pcp'))); } catch (e) {}
const store = () => { try { localStorage.setItem('pcp', JSON.stringify(save)); } catch (e) {} };
const MAXL = 20;

const TYPES = {
  normal: { c: '#9aa3b5', n: 'Normal', d: 'Can enter any coop.', i: '' },
  social: { c: '#ff9ec4', n: 'Social', d: 'Needs at least one other pigeon in the coop.', i: '💬' },
  angry: { c: '#e74c3c', n: 'Angry', d: 'Must stay alone. Nobody may join it.', i: '💢' },
  vip: { c: '#f4c430', n: 'VIP', d: 'Only the golden VIP coop.', i: '👑' },
  twins: { c: '#5dade2', n: 'Twins', d: 'Linked pair: needs 2 free spots in one coop.', i: '👯' }
};
const pigeonSVG = t => `<svg viewBox="0 0 60 50"><path d="M14 28L0 20 4 36Z" fill="#0003"/><ellipse cx="30" cy="30" rx="18" ry="13" fill="${TYPES[t].c}"/><circle cx="46" cy="20" r="9" fill="${TYPES[t].c}"/><path d="M54 21L60 23 54 25Z" fill="#f90"/><circle cx="48" cy="18" r="2.2" fill="#222"/><path class="wing" d="M22 28Q30 12 42 30Z" fill="#0003"/><path d="M26 42v6M34 42v6" stroke="#f90" stroke-width="2"/>${t == 'angry' ? '<path d="M43 12l9 4" stroke="#222" stroke-width="2.5"/>' : ''}${t == 'vip' ? '<path d="M40 11l3-7 3 4 3-4 3 7z" fill="gold" stroke="#b8860b"/>' : ''}</svg>`;

const used = c => c.mem.reduce((s, p) => s + p.size, 0);
const stack = p => pigeonSVG(p.t) + (p.size > 1 ? pigeonSVG(p.t) : '');

function show(id) {
  $$('.screen').forEach(s => s.classList.toggle('on', s.id == id));
  if (id == 'levels') buildLevels();
  if (id == 'menu') $('#hi').textContent = `🏆 Highest score: ${save.high}`;
}
function box(h, fn = {}) { $('#box').innerHTML = h; $('#modal').classList.remove('hide'); for (const k in fn) $('#' + k).onclick = fn[k]; }
const closeBox = () => $('#modal').classList.add('hide');
function msg(t) { $('#evt').textContent = t; clearTimeout(msgT); msgT = setTimeout(() => $('#evt').textContent = '', 3500); }
function popup(t) {
  const d = document.createElement('div'); d.className = 'pop'; d.textContent = t;
  d.style.left = 35 + rnd(25) + '%'; d.style.top = 30 + rnd(15) + '%'; document.body.appendChild(d); setTimeout(() => d.remove(), 1000);
}
function menu() { clearInterval(tick); closeBox(); document.body.classList.remove('boss'); show('menu'); }

function buildLevels() {
  $('#lvg').innerHTML = Array.from({ length: MAXL }, (_, i) => i + 1).map(L =>
    `<button class="btn lv" data-l="${L}" ${L > save.unlocked ? 'disabled' : ''}>${L % 5 ? L : '👑' + L}<br><small>${'⭐'.repeat(save.stars[L] || 0) || (L > save.unlocked ? '🔒' : '·')}</small></button>`).join('');
  $$('.lv').forEach(b => b.onclick = () => start(+b.dataset.l));
}

// ---------- level flow ----------
function start(L) {
  const c = genLevel(L); closeBox();
  G = { L, c, queue: c.pigeons.slice(), wait: [], coops: [], panic: 0, score: 0, combo: 1, best: 1, sel: null, freeze: 0, chaos: 0, sp: 0, ev: 15, fal: 0, practiced: false, done: false, pw: { freeze: 1, coop: 1, hint: 2 } };
  G.ev = L < 3 ? 1e9 : 15; G.fal = c.B && c.B.falcon ? c.B.falcon.gap : 1e9; G.practiced = false;
  for (let i = 0; i < c.k; i++) G.coops.push({ cap: i == 0 && c.hasVip ? c.vipCap : c.cap, vip: i == 0 && c.hasVip, mem: [], closed: 0 });
  document.body.classList.toggle('boss', !!c.boss);
  $('#obj').innerHTML = (c.boss ? `<b>👑 BOSS: ${c.B.n}</b><br><i>${c.B.r}</i><br><br>` : '') +
    `Place all <b>${c.n}</b> pigeons.` + (c.hasVip ? ` The golden 👑 coop is for the ${c.v} VIP(s) only.` : '') + (c.a ? ` ${c.a} angry pigeon(s) need a coop alone.` : '') +
    `<br><br><b>Pigeonhole:</b> the other ${c.x} pigeons must share ${c.m} ordinary coops, so some coop gets at least ⌈${c.x}/${c.m}⌉ = <b>${PHP.min(c.x, c.m)}</b>. Each coop holds ${c.cap}.`;
  $('#info').textContent = 'Click a pigeon, then click a coop. Click a pigeon inside a coop to send it back.';
  $('#hL').textContent = L + (c.boss ? ' 👑' : '');
  show('game'); spawn(); spawn(); render();
  clearInterval(tick); tick = setInterval(step, 500);
}

function spawn() { if (!G.queue.length || G.wait.length >= 7) return false; G.wait.push(G.queue.shift()); return true; }

function step() {
  if (!G || G.done) return; const c = G.c, dt = .5;
  G.sp += dt; if (G.sp >= c.gap) { G.sp = 0; if (spawn()) render(); }
  G.coops.forEach(o => { if (o.closed > 0) { o.closed -= dt; if (o.closed <= 0) render(); } });
  G.ev -= dt; if (G.ev <= 0) event();
  G.fal -= dt; if (G.fal <= 0) falcon();
  if (G.chaos > 0) G.chaos -= dt;
  if (G.freeze > 0) G.freeze -= dt;
  else { // waiting pigeons cause panic; impatient VIPs (King / Final Panic) count double
    const w = G.wait.reduce((t, p) => t + (c.B && c.B.impatient && p.t == 'vip' ? 2 : 1), 0);
    G.panic += w * .45 * c.rate * (G.chaos > 0 ? 1.5 : 1) + (G.wait.length >= 7 ? 2 : 0);
  }
  hud(); if (G.panic >= 100) end(false);
}

function falcon() { // boss rule (Falcon / Final Panic): close one open coop on a fixed timer
  const f = G.c.B.falcon, open = G.coops.filter(o => !o.closed); G.fal = f.gap;
  if (open.length > 1) { open[rnd(open.length)].closed = f.close; msg(`🦅 THE FALCON dives! A coop is closed for ${f.close}s.`); render(); }
}

function event() {
  G.ev = 18 + rnd(10);
  const r = ['rush', 'closed', 'food', 'chaos'][rnd(4)], open = G.coops.filter(o => !o.closed);
  if (r == 'rush') { spawn(); spawn(); msg('🐦 PIGEON RUSH! Extra pigeons arrive!'); }
  else if (r == 'closed' && open.length > 1) { open[rnd(open.length)].closed = 6; msg('🚧 COOP CLOSED for 6 seconds!'); }
  else if (r == 'food') { G.panic = Math.max(0, G.panic - 15); msg('🍞 FOOD DROP! Panic down by 15!'); }
  else { G.chaos = 8; msg('🌪 CHAOS! Panic rises 50% faster for 8s!'); }
  render();
}

function select(id) {
  const p = G.wait.find(x => x.id == id); G.sel = G.sel === p ? null : p;
  if (G.sel) $('#info').innerHTML = `<b>${TYPES[p.t].i} ${TYPES[p.t].n}</b> (size ${p.size}): ${TYPES[p.t].d}`;
  render();
}

function place(i) {
  const p = G.sel, c = G.coops[i]; if (G.done) return;
  if (!p) return msg('Pick a pigeon first!');
  let err = null;
  if (c.closed > 0) err = 'That coop is closed!';
  else if (used(c) + p.size > c.cap) err = 'Coop is full!';
  else if (p.t == 'vip' && !c.vip) err = 'VIPs only enter the golden coop!';
  else if (c.vip && p.t != 'vip') err = 'The golden coop is reserved for VIPs!';
  else if (p.t == 'angry' && c.mem.length) err = 'Angry pigeons need an empty coop!';
  else if (c.mem.some(x => x.t == 'angry')) err = 'An angry pigeon lives there!';
  else if (p.t == 'social' && !c.mem.length) err = 'Social pigeons hate empty coops!';
  if (err) return bad(err);
  c.mem.push(p); G.wait = G.wait.filter(x => x !== p); G.sel = null;
  const gain = 10 * G.combo; G.score += gain; p.pts = gain; popup(`+${gain}  COMBO x${G.combo}!`);
  G.combo = Math.min(G.combo + 1, 8); G.best = Math.max(G.best, G.combo - 1);
  G.panic = Math.max(0, G.panic - 4); render();
  if (!G.queue.length && !G.wait.length) win();
}

function sendBack(id) { // undo a placement: pigeon returns to the waiting area (costs panic, resets combo, takes its points back)
  if (G.done) return;
  const c = G.coops.find(o => o.mem.some(p => p.id == id)); if (!c) return;
  if (G.wait.length >= 7) return msg('Waiting area is full!');
  const p = c.mem.find(x => x.id == id); c.mem = c.mem.filter(x => x !== p); G.wait.push(p);
  G.score = Math.max(0, G.score - (p.pts || 0)); G.combo = 1; G.panic += 3; msg('↩ Pigeon sent back (+3 panic)'); render();
}

function bad(t) {
  G.combo = 1; G.panic += 10; msg('❌ ' + t); hud();
  const g = $('#game'); g.classList.remove('shake'); void g.offsetWidth; g.classList.add('shake');
  if (G.panic >= 100) end(false);
}

function usePw(k) {
  if (!G || G.done) return; if (G.pw[k] <= 0) return msg('No charges left!');
  G.pw[k]--;
  if (k == 'freeze') { G.freeze = 6; msg('❄ FEATHER FREEZE: panic stopped for 6s!'); }
  if (k == 'coop') { G.coops.push({ cap: 3, mem: [], closed: 0, vip: false, extra: true }); msg('➕ Extra coop added!'); }
  if (k == 'hint') { const K = G.coops.length, e = PHP.explain(G.c.n, K); msg(`💡 ${G.c.n} pigeons in ${K} coops: ⌈${G.c.n}/${K}⌉ = ${e.m}. Some coop must hold at least ${e.m}!`); }
  render();
}

function render() {
  $('#wait').innerHTML = G.wait.map(p => `<div class="pg${G.sel === p ? ' sel' : ''}" data-id="${p.id}" title="${TYPES[p.t].n}: ${TYPES[p.t].d}" style="animation-delay:-${(p.id % 5) * .15}s">${stack(p)}<i>${TYPES[p.t].i}</i></div>`).join('');
  $('#coops').innerHTML = G.coops.map((c, i) => `<div class="coop${c.vip ? ' vip' : ''}${c.closed > 0 ? ' x' : ''}" data-i="${i}"><div class="rf"></div><div class="cb">${c.mem.map(p => `<span class="mini" data-id="${p.id}" title="Click to send back">${stack(p)}</span>`).join('')}</div><div class="n">${c.vip ? '👑 VIP ' : c.extra ? '➕ ' : ''}COOP ${i + 1}: ${used(c)} / ${c.cap}</div></div>`).join('');
  $('#cst').innerHTML = G.coops.map((c, i) => `Coop ${i + 1}: ${used(c)}/${c.cap}${c.vip ? ' 👑' : ''}${c.closed > 0 ? ' 🚧' : ''}`).join('<br>') + `<br>Waiting: ${G.wait.length} · Still coming: ${G.queue.length}`;
  $$('#pw button i').forEach(i => i.textContent = G.pw[i.parentNode.dataset.p]);
  hud();
}

function hud() {
  $('#hS').textContent = G.score; $('#hC').textContent = 'COMBO x' + G.combo;
  const p = Math.min(100, Math.round(G.panic)); $('#panF').style.width = p + '%'; $('#panT').textContent = p + '%' + (G.freeze > 0 ? ' ❄' : '');
}

// ---------- ending ----------
function win() { G.done = true; clearInterval(tick); G.kEnd = G.coops.length; if (G.c.boss) runQuiz(bossQuiz(), result); else result(); }
function end(w) {
  if (G.done) return; G.done = true; clearInterval(tick);
  box(`<h1>💥 LEVEL FAILED</h1><p>Panic hit 100%!</p><button class="btn" id="r">RETRY</button><button class="btn" id="m">MENU</button>`, { r: () => start(G.L), m: menu });
}

function runQuiz(qs, done, i = 0, ok = 0) {
  const q = qs[i];
  box(`<h2>🧠 ${q.title}</h2><small>${q.req ? 'Required to finish the boss level' : 'Optional practice'}</small><p>${q.q}</p>${q.o.map((o, j) => `<button class="btn opt" data-j="${j}">${o}</button>`).join('')}<p id="fb"></p>`);
  $$('.opt').forEach(b => b.onclick = () => {
    const r = +b.dataset.j == q.a; if (r) { G.score += 50; ok++; }
    $$('.opt').forEach(x => x.disabled = true); b.classList.add(r ? 'ok' : 'no');
    $('#fb').innerHTML = (r ? '✅ Correct! +50. ' : '❌ Not quite. ') + q.why + `<br><button class="btn" id="nx">${i + 1 < qs.length ? 'NEXT' : 'CONTINUE'}</button>`;
    $('#nx').onclick = () => i + 1 < qs.length ? runQuiz(qs, done, i + 1, ok) : done(ok);
  });
}

function result() {
  const left = Math.max(0, Math.round(100 - G.panic)), st = left > 65 ? 3 : left > 35 ? 2 : 1;
  save.stars[G.L] = Math.max(save.stars[G.L] || 0, st); save.unlocked = Math.min(MAXL, Math.max(save.unlocked, G.L + 1));
  save.high = Math.max(save.high, G.score); store();
  const last = G.L >= MAXL;
  box(`<h1>🎉 LEVEL COMPLETE!</h1><div class="stars">${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}</div>
    <p>Score: <b>${G.score}</b> · Best combo: <b>x${G.best}</b> · Panic remaining: <b>${left}%</b></p>
    ${last ? '<h2>🏆 You beat FINAL PANIC!</h2>' : ''}
    <button class="btn" id="sw">SHOW WHY</button>${G.c.boss || G.practiced ? '' : '<button class="btn" id="pr">PRACTICE QUESTION (optional)</button>'}<button class="btn" id="nl">${last ? 'MENU' : 'NEXT LEVEL'}</button><button class="btn" id="m">MENU</button>`,
    { sw: () => box(`<h2>📐 Why? n = ${G.c.n}, k = ${G.kEnd}</h2>${PHP.html(G.c.n, G.kEnd)}<button class="btn" id="bk">BACK</button>`, { bk: result }), pr: () => { G.practiced = true; runQuiz(makeQuiz(G.L), result); }, nl: () => last ? menu() : start(G.L + 1), m: menu });
}

// ---------- init ----------
function lab() {
  const n = +$('#labN').value, k = +$('#labK').value, o = $('#labOut');
  if (!(n >= 1 && k >= 1 && Number.isInteger(n) && Number.isInteger(k))) return o.innerHTML = '⚠ Enter whole numbers ≥ 1.';
  o.innerHTML = `<h2>⌈${n} / ${k}⌉ = ${PHP.min(n, k)}</h2><p>"${PHP.explain(n, k).concl}"</p>${PHP.html(n, k)}`;
}

$$('[data-go]').forEach(b => b.onclick = () => show(b.dataset.go));
$('#bPlay').onclick = () => start(Math.min(save.unlocked, MAXL));
$('#calc').onclick = lab;
$('#quit').onclick = menu;
$('#wait').onclick = e => { const el = e.target.closest('.pg'); if (el && G && !G.done) select(+el.dataset.id); };
$('#coops').onclick = e => {
  const m = e.target.closest('.mini'); if (m && G) return sendBack(+m.dataset.id);
  const el = e.target.closest('.coop'); if (el && G) place(+el.dataset.i);
};
$$('#pw button').forEach(b => b.onclick = () => usePw(b.dataset.p));
show('menu');
