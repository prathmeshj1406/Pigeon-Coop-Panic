// ===== levels.js : procedural level generator =====
// Boss rules (each one is really implemented in game.js):
//   tight   : zero spare capacity (capacity = exact Pigeonhole minimum)
//   falcon  : every `gap` seconds a coop is closed for `close` seconds
//   impatient: waiting VIPs raise panic twice as fast
//   vipExtra: extra VIP pigeons arrive
const BOSS = [
  { n: 'COOP OVERLORD', r: 'No spare spots! Every coop is exactly as big as the Pigeonhole minimum, so every place counts.', tight: true },
  { n: 'THE FALCON', r: 'Every 12 seconds the falcon dives and closes one coop for 5 seconds.', falcon: { gap: 12, close: 5 } },
  { n: 'PIGEON KING', r: 'The king brings extra VIPs, and waiting VIPs are impatient (they raise panic twice as fast).', impatient: true, vipExtra: 2 },
  { n: 'FINAL PANIC', r: 'Falcon dives every 16 seconds (closing a coop for 4 s) AND impatient VIPs.', falcon: { gap: 16, close: 4 }, impatient: true, vipExtra: 1 }
];

function genLevel(L) {
  const F = Math.floor, boss = L % 5 == 0, B = boss ? BOSS[L / 5 - 1] : null;
  const a = L >= 4 ? Math.min(F(L / 4), 2 + F(L / 10)) : 0;                    // angry pigeons (each needs its own coop)
  const v = L >= 3 ? 1 + F(L / 7) + (B ? B.vipExtra || 0 : 0) : 0;            // VIP pigeons (golden coop only)
  const s = L >= 2 ? 1 + F(L / 3) : 0;                                         // social pigeons
  const tw = L >= 6 ? 1 + F(L / 9) : 0;                                        // twin pairs (2 pigeons each)
  const n = 6 + L + (boss ? 4 : 0);                                            // total pigeons
  const hasVip = v > 0;
  const k = Math.max(3 + F(L / 6), a + (hasVip ? 1 : 0) + 2);                  // total coops
  const m = k - (hasVip ? 1 : 0) - a;                                          // ordinary coops that share the remaining pigeons
  const x = n - a - v;                                                         // pigeons that must share those m coops
  const slack = B && B.tight ? 0 : (L < 6 ? 2 : 1);                            // spare spots per coop
  // PIGEONHOLE: x pigeons in m coops => some coop holds at least ceil(x/m), so capacity must be >= that.
  const cap = Math.ceil(x / m) + slack;
  const vipCap = hasVip ? v + (B && B.tight ? 0 : 1) : 0;
  const P = []; let id = 0;
  const add = (t, c) => { for (let i = 0; i < c; i++) P.push({ id: id++, t, size: t == 'twins' ? 2 : 1 }); };
  add('angry', a); add('vip', v); add('social', s); add('twins', tw); add('normal', n - a - v - s - 2 * tw);
  return { L, boss, B, a, v, k, n, m, x, cap, vipCap, hasVip, pigeons: shuffle(P),
    gap: Math.max(3.6, 6 - L * .15), rate: (1 + L * .03) * (boss ? 1.2 : 1) };
}
