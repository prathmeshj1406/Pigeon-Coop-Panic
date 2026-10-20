// ===== math.js : Pigeonhole Principle engine =====
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => a.sort(() => Math.random() - .5);

const PHP = {
  // PIGEONHOLE PRINCIPLE: n pigeons in k holes => some hole has at least ceil(n/k) pigeons
  min: (n, k) => Math.ceil(n / k),

  explain(n, k) {
    const q = Math.floor(n / k), r = n % k, m = this.min(n, k);
    return {
      m,
      steps: [`Number of pigeons = <b>${n}</b>`, `Number of coops = <b>${k}</b>`,
        `${n} ÷ ${k} = <b>${q}</b> remainder <b>${r}</b>`, `⌈${n} / ${k}⌉ = <b>${m}</b>`],
      concl: `At least one coop must contain ${m} or more pigeon${m > 1 ? 's' : ''}.`,
      // Proof by contradiction
      proof: `Why? If every coop held at most ${m - 1}, the total would be at most ${k} × ${m - 1} = ${k * (m - 1)}, which is less than ${n}. Contradiction!`
    };
  },

  html(n, k) {
    const e = this.explain(n, k), d = i => `style="animation-delay:${i * .35}s"`;
    return `<div class="why">${e.steps.map((s, i) => `<div class="step" ${d(i)}><b>Step ${i + 1}:</b> ${s}</div>`).join('')}
      <div class="step concl" ${d(4)}>✅ Conclusion: ${e.concl}</div><div class="step" ${d(5)}>💡 ${e.proof}</div></div>`;
  }
};

// ---- Challenge generators (reuse PHP.min) ----
function minQ(title) {
  const k = 2 + rnd(5), n = k + 1 + rnd(20), m = PHP.min(n, k);
  const o = shuffle([...new Set([m, m + 1, Math.max(1, m - 1), Math.max(1, Math.floor(n / k))])]);
  return { title, q: `${n} pigeons fly into ${k} coops. At least one coop must hold at least ___ pigeons.`,
    o: o.map(String), a: o.indexOf(m), why: `⌈${n}/${k}⌉ = ${m}. ${PHP.explain(n, k).proof}` };
}

function mistakeQ(title) {
  const st = [], bad = rnd(3);
  while (st.length < 3) { // three different (n, k) pairs; the 'bad' one claims one more than the guaranteed minimum
    const k = 2 + rnd(5), n = k + 1 + rnd(15), m = PHP.min(n, k), x = st.length == bad ? m + 1 : m;
    if (!st.some(s => s.n == n && s.k == k)) st.push({ t: `${n} pigeons, ${k} coops → some coop has at least ${x}`, n, k, m });
  }
  const b = st[bad];
  return { title, q: 'Which Pigeonhole conclusion is WRONG?', o: st.map(s => s.t), a: bad,
    why: `Only ⌈${b.n}/${b.k}⌉ = ${b.m} is guaranteed, not ${b.m + 1}.` };
}

function makeQuiz(L) {
  const t = L % 3;
  return t == 0 ? [minQ('MINIMUM GUARANTEE')] : t == 1 ? [mistakeQ('FIND THE MISTAKE')]
    : [minQ('SPEED ROUND 1/3'), minQ('SPEED ROUND 2/3'), minQ('SPEED ROUND 3/3')];
}

// Boss levels (5, 10, 15, 20) end with a REQUIRED 3-question quiz; other levels only offer optional practice.
function bossQuiz() {
  return [minQ('BOSS QUIZ 1/3 · MINIMUM GUARANTEE'), mistakeQ('BOSS QUIZ 2/3 · FIND THE MISTAKE'), minQ('BOSS QUIZ 3/3 · QUICK CALCULATION')]
    .map(q => Object.assign(q, { req: true }));
}
