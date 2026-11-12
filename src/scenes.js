// Scenes 1-8 and 10 on canvas. Each is a pure function of scene-local time `s`
// (seconds since the scene's cut, in base time) and absolute base time `t`.
const OFF = '#F2F2F0', INK = '#14110f', NIGHT = '#0C0B10';
const { BOOKED, LEAKS, PAID, HIT, CUTS } = TL;

// ---------- shared bits ----------
function bgOrange(ctx, t, B) {
  const g = ctx.createRadialGradient(W * 0.3, H * 0.25, 50, W / 2, H / 2, H * 0.8);
  g.addColorStop(0, mix(B.color, '#ffb27a', 0.35)); g.addColorStop(0.5, B.color); g.addColorStop(1, mix(B.color, '#8a0d00', 0.35));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  bubbles(ctx, t, { dot: mix(B.color, '#ffe2c8', 0.75), glossy: '#ffffff', n: 34, seed: 3 });
  bubbles(ctx, t * 0.7 + 9, { dot: mix(B.color, '#6a0a00', 0.45), n: 14, seed: 41, dotAlpha: 0.5 });
}
function bgLight(ctx, t, B) {
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, '#F8F7F4'); g.addColorStop(1, '#DFE3EA');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  bubbles(ctx, t, { dot: B.color, glossy: B.color, n: 30, seed: 17, alpha: 0.85 });
}
function bgNight(ctx, t, B, glow = 0.16) {
  ctx.fillStyle = NIGHT; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H * 0.52, 20, W / 2, H * 0.52, 900);
  g.addColorStop(0, rgba(B.color, glow)); g.addColorStop(1, rgba(B.color, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    const x = hash(i * 3.1 + 2) * W, y = (hash(i * 7.7 + 5) * H + t * (4 + hash(i) * 10)) % H, r = 1.2 + hash(i * 1.3) * 2.6;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.6 * Math.abs(Math.sin(t * (1 + hash(i) * 3) + i))})`;
    if (i % 11 === 0) star4(ctx, x, y, r * 4.5, t * 0.6 + i); else { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  }
  bubbles(ctx, t, { dot: B.color, glossy: B.color, n: 16, seed: 77, alpha: 0.5 });
}
function glitch(ctx, amt, seed, yc, yr, draw) {
  if (amt > 0.3) {
    ctx.save(); ctx.translate(-amt, amt * 0.18); draw('#00E5FF'); ctx.restore();
    ctx.save(); ctx.translate(amt, -amt * 0.18); draw('#FF0A54'); ctx.restore();
    ctx.save(); ctx.translate(0, amt * 0.35); draw('#FFFFFF'); ctx.restore();
  }
  draw(null);
  if (amt > 6) for (let i = 0; i < 6; i++) {
    const y = yc + (hash(seed * 7.3 + i) - 0.5) * 2 * yr, hh = 14 + hash(seed * 3.1 + i) * 56, dx = (hash(seed + i * 5.7) - 0.5) * amt * 5;
    ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, hh); ctx.clip(); ctx.translate(dx, 0); draw(i % 2 ? '#00E5FF' : null); ctx.restore();
  }
}
function cornerLabel(ctx, t, B, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const y = 118 + Math.sin(t * 3) * 4;
  goo(ctx, (c) => { blobPath(c, 92, y, 40, 38, t * 2, 0.06, 2); c.fill(); }, { cx: 92, cy: y, r: 40, color: B.color, goo: false, shadowA: 0.25 });
  eyes(ctx, 94, y - 4, 9, 12, { lx: 0.6, ly: -0.2, blink: blinkAt(t, 2) });
  text(ctx, "where'd it go?", 150, 120, 40, { align: 'left', weight: 800, color: INK, ls: -0.03 });
  ctx.restore();
}

// ---------- 1 + 2: calendar / LYING ----------
function calendarCard(ctx, s, B) {
  const cw = 880, ch = 560;
  ctx.shadowColor = 'rgba(110,15,0,.35)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 36;
  ctx.fillStyle = '#fff'; rr(ctx, -cw / 2, -ch / 2, cw, ch, 60); ctx.fill();
  ctx.shadowColor = 'transparent';
  // icon
  ctx.fillStyle = B.color; rr(ctx, -cw / 2 + 52, -ch / 2 + 50, 96, 96, 26); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(ctx, -cw / 2 + 52, -ch / 2 + 50, 96, 30, 26); ctx.fill();
  text(ctx, '12', -cw / 2 + 100, -ch / 2 + 110, 46, { color: '#fff' });
  text(ctx, 'Today', -cw / 2 + 176, -ch / 2 + 98, 70, { align: 'left', color: INK });
  // live pill
  ctx.fillStyle = '#EEF0F4'; rr(ctx, cw / 2 - 232, -ch / 2 + 66, 180, 64, 32); ctx.fill();
  text(ctx, 'Thu', cw / 2 - 142, -ch / 2 + 99, 32, { color: '#6B7280', weight: 800, ls: -0.01 });
  const cnt = E.out(prog(s, 1.2, 1.9));
  text(ctx, `${Math.round(6 * cnt)} jobs booked`, -cw / 2 + 56, -30, 60, { align: 'left', color: '#6B7280', weight: 800, ls: -0.03 });
  text(ctx, fmt$(Math.round(BOOKED * cnt / 50) * 50), -cw / 2 + 48, 110, 210, { align: 'left', color: INK, ls: -0.05 });
  // six booked slots
  for (let i = 0; i < 6; i++) {
    const p = spring(s - 1.25 - i * 0.07, 4, 0.45);
    if (p <= 0) continue;
    ctx.fillStyle = i % 2 ? mix(B.color, '#ffffff', 0.55) : B.color;
    rr(ctx, -cw / 2 + 56 + i * 130, ch / 2 - 62 - 0, 112 * Math.min(1.1, p), 22, 11); ctx.fill();
  }
}
function scene1(ctx, s, t, B) {
  bgOrange(ctx, t, B);
  richLine(ctx, [{ t: 'Your' }, { t: 'calendar' }], 540, 360, 132, s, { at: 0.12, stagger: 0.22, color: '#fff' });
  richLine(ctx, [{ t: 'is', serif: true, color: INK }], 540, 520, 150, s, { at: 2.3 });
  const [sx, sy] = pop2(s - 0.8, 2.6, 0.42);
  if (sx > 0) {
    ctx.save(); ctx.translate(540, 1060 + (1 - Math.min(1, sx)) * 500 + Math.sin(t * 1.8) * 10);
    ctx.rotate(-0.035 + Math.sin(t * 1.3) * 0.012 + (1 - spring(s - 0.8, 2.2, 0.5)) * 0.25); ctx.scale(sx, sy);
    calendarCard(ctx, s, B); ctx.restore();
  }
}
function scene2(ctx, s, t, B) {
  const q = s - (HIT.shatter - CUTS[1]);     // time since shatter
  const shake = Math.exp(-s * 10) * 34;
  ctx.save(); ctx.translate((hash(Math.floor(t * 30)) - 0.5) * shake, (hash(Math.floor(t * 30) + 9) - 0.5) * shake);
  bgOrange(ctx, t, B);
  // headline stays, card recoils then falls
  ctx.save(); ctx.globalAlpha = 1 - prog(q, 0, 0.25);
  text(ctx, 'Your calendar', 540, 360, 132, { color: '#fff' });
  text(ctx, 'is', 540, 523, 150, { serif: true, color: INK }); ctx.restore();
  const fall = q > 0 ? q : 0;
  ctx.save(); ctx.translate(540 + kick(s, 6, 6) * 30, 1060 + Math.sin(t * 1.8) * 10 * (1 - prog(s, 0, 0.1)) + 2400 * fall * fall + (q > 0 ? -160 * fall : 0));
  ctx.rotate(-0.035 + 0.1 * spring(s, 3, 0.3) + fall * 1.3); ctx.scale(1 - 0.06 * prog(s, 0, 0.1), 1 - 0.06 * prog(s, 0, 0.1));
  calendarCard(ctx, 3, B);
  ctx.fillStyle = 'rgba(20,17,15,.28)'; rr(ctx, -440, -280, 880, 560, 60); ctx.fill();
  ctx.restore();

  // LYING.
  const size = 292, word = 'LYING.', cx = 540, cy = 1040;
  font(ctx, size, { ls: -0.05 });
  const adv = [...word].map((ch) => ctx.measureText(ch).width); const total = adv.reduce((a, b) => a + b, 0);
  const sc = 1 + 2.4 * (1 - E.outExpo(prog(s, 0, 0.16))) + kick(s - 0.16, 5, 8) * 0.08;
  const seed = Math.floor(t * 30);
  const burst = s > 0.3 && s < 0.42 ? 16 : s > 0.92 && s < 0.99 ? 9 : 0;
  const amt = 46 * Math.exp(-s * 8) + burst + 2.2 * (0.5 + 0.5 * Math.sin(t * 40));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.07); ctx.scale(sc, sc);
  const drawWord = (col) => {
    font(ctx, size, { ls: -0.05 }); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    let x = -total / 2;
    [...word].forEach((ch, i) => {
      if (q <= 0) { ctx.fillStyle = col || INK; ctx.fillText(ch, x, 0); }
      else if (!col) {
        // 4 shards per letter around a random interior point
        const w = adv[i], hh = size * 0.78, ix = x + w * (0.35 + 0.3 * h2(i, 1)), iy = (h2(i, 2) - 0.5) * hh * 0.4;
        const L = x - 8, R = x + w + 8, T = -hh / 2 - 20, Bm = hh / 2 + 20;
        const e = [[lerp(L, R, 0.3 + 0.4 * h2(i, 3)), T], [R, lerp(T, Bm, 0.3 + 0.4 * h2(i, 4))], [lerp(L, R, 0.3 + 0.4 * h2(i, 5)), Bm], [L, lerp(T, Bm, 0.3 + 0.4 * h2(i, 6))]];
        const corners = [[R, T], [R, Bm], [L, Bm], [L, T]];
        for (let k = 0; k < 4; k++) {
          const poly = [[ix, iy], e[k], corners[k], e[(k + 1) % 4]];
          const pcx = (poly[1][0] + poly[2][0] + poly[3][0] + ix) / 4, pcy = (poly[1][1] + poly[2][1] + poly[3][1] + iy) / 4;
          const d = Math.max(0, q - h2(i, k + 20) * 0.1);
          const vx = (pcx - 0) * 1.1 + (h2(i, k + 7) - 0.5) * 700, vy = -500 - h2(i, k + 9) * 900 + (pcy) * 2;
          ctx.save(); ctx.translate(pcx + vx * d, pcy + vy * d + 2600 * d * d); ctx.rotate((h2(i, k + 11) - 0.5) * 14 * d); ctx.translate(-pcx, -pcy);
          ctx.beginPath(); poly.forEach((p, n) => (n ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.clip();
          ctx.fillStyle = INK; ctx.fillText(ch, x, 0); ctx.restore();
        }
      }
      x += adv[i];
    });
  };
  glitch(ctx, q > 0 ? 0 : amt, seed, 0, size * 0.4, drawWord);
  ctx.restore();

  // "to you."
  const [tx, ty] = pop2(s - 0.6, 3.2, 0.36);
  if (tx > 0) {
    const d = Math.max(0, q - 0.08);
    ctx.save(); ctx.translate(600 + 260 * d, 1330 - 500 * d + 2700 * d * d); ctx.rotate(-0.05 + d * 2.2 + (1 - spring(s - 0.6, 2.4, 0.4)) * 0.2); ctx.scale(tx, ty);
    text(ctx, 'to you.', 0, 0, 220, { serif: true, color: '#fff' }); ctx.restore();
  }
  ctx.restore();
  const fl = 1 - prog(s, 0, 0.12);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl * 0.85})`; ctx.fillRect(0, 0, W, H); }
  const fl2 = q > 0 ? 1 - prog(q, 0, 0.1) : 0;
  if (fl2 > 0) { ctx.fillStyle = `rgba(255,255,255,${fl2 * 0.4})`; ctx.fillRect(0, 0, W, H); }
}

// ---------- 3: booked vs actually paid ----------
const GROUND = 1440;
function sparkles(ctx, cx, cy, r, t, a, B) {
  for (let i = 0; i < 9; i++) {
    const an = i * 0.7 + 0.4, d = r * (1.12 + 0.28 * hash(i + 3)), tw = Math.max(0, Math.sin(t * 5 + i * 1.9));
    ctx.fillStyle = i % 3 ? B.color : '#FFB703'; ctx.globalAlpha = a * (0.35 + 0.65 * tw);
    star4(ctx, cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.95, (18 + hash(i) * 30) * (0.5 + tw * 0.6) * a, t + i);
  }
  ctx.globalAlpha = 1;
}
function scene3(ctx, s, t, B) {
  bgLight(ctx, t, B);
  // ground shadow line
  const swap = 1.7;
  richLine(ctx, [{ t: 'It' }, { t: 'says' }], 540, 290, 136, s, { at: 0.05, stagger: 0.1, out: swap - 0.14, color: INK });
  richLine(ctx, [{ t: 'you' }, { t: 'booked' }], 540, 440, 136, s, { at: 0.25, stagger: 0.1, out: swap - 0.14, color: INK });
  // "actually" gets the RGB split
  const ga = 26 * Math.exp(-(s - swap - 0.12) * 9) * (s > swap + 0.12 ? 1 : 0);
  richLine(ctx, [{ t: 'You' }], 250, 300, 136, s, { at: swap + 0.02, color: INK });
  if (s > swap + 0.12) glitch(ctx, ga, Math.floor(t * 30), 300, 80, (col) =>
    richLine(ctx, [{ t: 'actually', serif: true, color: col || B.color }], 690, 300, 150, s, { at: swap + 0.12 }));
  richLine(ctx, [{ t: 'got' }, { t: 'paid' }], 540, 450, 136, s, { at: swap + 0.3, stagger: 0.1, color: INK });

  const m = E.inOut(prog(s, 1.95, 2.75));            // melt
  const re = prog(s, 2.72, 3.3);                     // reform
  const sp = spring(s - 2.72, 2.5, 0.36);
  const [px, py] = pop2(s - 0.42, 2.6, 0.34);
  const R = 320, by = 1040 + Math.sin(t * 2.2) * 12 * (1 - m);
  const bcy = lerp(by, GROUND - 60, E.in(m));
  const rx = R * (1 - 0.78 * m) * px, ry = R * (1 - 0.86 * m) * (1 + 0.3 * Math.sin(Math.PI * m)) * py;
  const smallR = 158 * sp, scy = GROUND - 128 * sp + Math.sin(t * 3) * 5 * re;
  if (px > 0) {
    const k = E.inOut(prog(m, 0.45, 1));
    const shade = { cx: 540, cy: lerp(bcy, GROUND - 130, k), r: lerp(R * Math.max(px, 0.3), 165, k), color: B.color };
    // soft floor shadow
    ctx.fillStyle = 'rgba(120,40,10,.13)'; ctx.beginPath(); ctx.ellipse(540, GROUND + 26, lerp(260 * px, 400, m) * (1 - 0.5 * E.inOut(re)), 30, 0, 0, TAU); ctx.fill();
    goo(ctx, (c) => {
      if (m < 0.995) { blobPath(c, 540, bcy, rx, ry, t, 0.035 + m * 0.05, 0); c.fill(); }
      if (m > 0) {
        const pr = 400 * E.out(m) * (1 - 0.6 * E.inOut(re)), ph = 54 * E.out(m) * (1 - 0.25 * E.inOut(re));
        c.beginPath(); c.ellipse(540, GROUND, pr, ph, 0, 0, TAU); c.fill();
        const cw = 170 * Math.sin(Math.PI * m); if (cw > 2) { c.beginPath(); c.roundRect(540 - cw / 2, bcy, cw, GROUND - bcy, cw / 2); c.fill(); }
        for (let i = 0; i < 7; i++) {
          const d = prog(m, 0.05 + hash(i) * 0.35, 0.55 + hash(i) * 0.4), x = 540 + (i - 3) * 84 * (1 - m * 0.2);
          if (d > 0 && d < 1) { c.beginPath(); c.ellipse(x, lerp(bcy + ry * 0.6, GROUND, E.in(d)), 26 - d * 6, 30 + d * 26, 0, 0, TAU); c.fill(); }
        }
      }
      if (sp > 0) { blobPath(c, 540, scy, smallR * (1 + kick(s - 2.72, 3, 5) * 0.12), smallR * (1 - kick(s - 2.72, 3, 5) * 0.12), t * 1.4, 0.04, 7); c.fill(); }
    }, {
      ...shade,
      over: (c) => {
        const a = 1 - prog(m, 0.1, 0.5);
        if (a > 0) { c.save(); c.globalAlpha = a; c.translate(540, bcy); c.scale(px * (1 - 0.3 * m), py * (1 - 0.7 * m)); printed(c, fmt$(BOOKED), 0, 6, 176); c.restore(); }
        if (sp > 0.2) { const v = Math.round(lerp(1400, PAID, E.out(prog(s, 2.8, 3.25))) / 10) * 10; c.save(); c.globalAlpha = prog(sp, 0.2, 0.7); printed(c, fmt$(v), 540, scy + 50 * sp, 96 * Math.min(1.1, sp)); c.restore(); }
      },
    });
    if (m < 0.2) sparkles(ctx, 540, by, R, t, Math.min(1, px) * (1 - m * 5), B);
    if (sp > 0.4) eyes(ctx, 540, scy - 46 * sp, 25 * sp, 34 * sp, { lx: 0.3 * Math.sin(t * 2), ly: 0.6, blink: blinkAt(t, 0.4), sad: true, brow: mix(B.color, '#400000', 0.6) });
  }
  // (sigh)
  const sg = prog(s, 3.25, 3.6);
  if (sg > 0) {
    ctx.save(); ctx.globalAlpha = sg; ctx.translate(815 + Math.sin(t * 2.4) * 12, 1190 - (s - 3.25) * 46); ctx.rotate(0.1);
    text(ctx, '(sigh)', 0, 0, 92, { serif: true, color: '#8A909C' });
    ctx.restore();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(138,144,156,${0.5 * sg})`; ctx.beginPath(); ctx.arc(720 - i * 26, 1262 + i * 20 - (s - 3.25) * 20, 12 - i * 3, 0, TAU); ctx.fill(); }
  }
}

// ---------- 4: where'd it go? ----------
function scene4(ctx, s, t, B) {
  bgLight(ctx, t, B);
  const p = E.inOut(prog(s, 0, 0.3));
  const g = E.inOut(prog(s, 0.68, 0.98));
  const qs = spring(s - 0.06, 3, 0.36) * (1 - g);
  const qx = lerp(540, 92, g), qy = lerp(1010 + Math.sin(t * 4) * 10, 118, g);
  const br = lerp(158, 0, p) + 40 * g, bx = lerp(540, qx, Math.max(p, g)), byy = lerp(GROUND - 128, qy, Math.max(p, g));
  goo(ctx, (c) => {
    if (br > 1) { blobPath(c, bx, byy, br, br, t * 2, 0.05, 7); c.fill(); }
    if (qs > 0.01) {
      c.save(); c.translate(qx, qy); c.rotate(kick(s - 0.06, 2.4, 4) * 0.25); c.scale(qs * (1 + kick(s - 0.06, 3, 5) * 0.15), qs * (1 - kick(s - 0.06, 3, 5) * 0.15));
      font(c, 860); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, 30); c.restore();
    }
  }, { cx: lerp(540, 92, g), cy: lerp(940, 118, g), r: lerp(330, 40, g), color: B.color });
  // curved caption
  const str = "where'd it go?", size = 92, Rr = 480;
  font(ctx, size); const ws = [...str].map((ch) => ctx.measureText(ch).width); const tot = ws.reduce((a, b) => a + b, 0);
  let acc = -tot / 2;
  [...str].forEach((ch, i) => {
    const at = 0.14 + i * 0.022, k = spring(s - at, 4, 0.4) * (1 - E.in(prog(s, 0.66, 0.8)));
    const a = (acc + ws[i] / 2) / Rr + Math.sin(t * 2) * 0.03;
    if (k > 0.01) { ctx.save(); ctx.translate(540 + Math.sin(a) * Rr, 1010 - Math.cos(a) * Rr); ctx.rotate(a); ctx.scale(k, k); text(ctx, ch, 0, 0, size, { color: INK }); ctx.restore(); }
    acc += ws[i];
  });
  if (g > 0.6) { ctx.save(); ctx.globalAlpha = prog(g, 0.6, 1); eyes(ctx, 94, 114, 9, 12, { lx: 0.6, ly: -0.2 }); text(ctx, "where'd it go?", 150, 120, 40, { align: 'left', weight: 800, color: INK, ls: -0.03 }); ctx.restore(); }
}

// ---------- 5: the four leaks ----------
const SEG = [0, 2, 4, 6];
const BITE = [[0.88, -0.74, 0.4], [-0.9, -0.74, 0.45], [-0.96, 0.7, 0.38], [0.98, 0.7, 0.31]];
function moneyAt(s) {
  let v = BOOKED;
  LEAKS.forEach((l, k) => { v -= l.amt * E.out(prog(s, HIT.bites[k] - CUTS[4], HIT.bites[k] - CUTS[4] + 0.5)); });
  return v;
}
function scene5(ctx, s, t, B) {
  bgLight(ctx, t, B);
  cornerLabel(ctx, t, B);
  const hits = HIT.bites.map((h) => h - CUTS[4]);
  const k = s < 2 ? 0 : s < 4 ? 1 : s < 6 ? 2 : 3, q = s - SEG[k], hq = hits[k] - SEG[k];
  const v = moneyAt(s), settled = hits.every((h) => s < h || s > h + 0.5);
  const R = 300 * (0.84 + 0.16 * (v - PAID) / (BOOKED - PAID));
  const lastHit = Math.max(...hits.filter((h) => s >= h), -9), since = s - lastHit;
  const hitDir = [[-1, 0.5], [0.6, 0.7], [0.6, -0.5], [0, 0]][Math.max(0, hits.filter((h) => s >= h).length - 1)];
  const kx = kick(since, 4, 6);
  const [ex, ey] = pop2(s - 0.02, 2.8, 0.36);
  const squeeze = k === 3 && since >= 0 && since < 1 ? kick(since, 3.4, 5) * 0.2 : 0;
  const cx = 540 + hitDir[0] * kx * 46, cy = 1100 + Math.sin(t * 2.4) * 10 + hitDir[1] * kx * 46;
  const sx = ex * (1 + kx * 0.07 - squeeze), sy = ey * (1 - kx * 0.07 + squeeze);

  // heading
  const lab = LEAKS[k].label;
  const lines = { 0: [['No-shows', 'ate']], 1: [['Unpaid', 'invoices'], ['took']], 2: [['Forgot', 'to'], ['follow', 'up']], 3: [['And', 'the'], ['double-booking?']] }[k];
  lines.forEach((ln, i) => richLine(ctx, ln.map((w) => ({ t: w })), 540, (lines.length === 1 ? 350 : 280) + i * 132, 118, q, { at: 0.04 + i * 0.14, stagger: 0.09, color: INK, out: k < 3 ? 1.86 : 9 }));
  void lab;

  // vortex sits behind the blob
  if (k === 1) {
    const vs = spring(q - 0.12, 2.6, 0.4) * (1 - E.in(prog(q, 1.6, 1.9)));
    vortex(ctx, 200, 700, vs * 0.95, t);
  }

  // the blob
  const bites = BITE.filter((_, i) => s >= hits[i]).map(([bx, by, br]) => ({ x: cx + bx * R * sx, y: cy + by * R * sy, r: br * R }));
  ctx.fillStyle = 'rgba(120,40,10,.12)'; ctx.beginPath(); ctx.ellipse(540, 1100 + R + 70, R * 0.8 * sx, 28, 0, 0, TAU); ctx.fill();
  goo(ctx, (c) => { blobPath(c, cx, cy, R * sx, R * sy, t, 0.03, 0); c.fill(); }, {
    cx, cy, r: R, color: B.color, goo: false, bites,
    over: (c) => { c.save(); c.translate(cx, cy + 58); const pk = 1 + (settled ? 0 : 0.06 * Math.sin(t * 60)); c.scale(sx * pk, sy * pk); printed(c, fmt$(settled ? v : Math.round(v / 10) * 10), 0, 0, 128 * R / 300); c.restore(); },
  });
  const look = [[0.9, -0.5], [-0.9, -0.6], [-0.9, 0.7], [0.9, 0.3]][k];
  const scared = q > 0.3 && q < hq + 0.5;
  eyes(ctx, cx, cy - 78 * sy, 27 * (scared ? 1.15 : 1), 40, { lx: look[0], ly: look[1], blink: since > 0 && since < 0.16 ? 0.1 : blinkAt(t, 0.3), sad: v <= PAID + 160, brow: mix(B.color, '#400000', 0.6) });
  if (!scared || since < 0.4) { ctx.fillStyle = mix(B.color, '#400000', 0.7); ctx.beginPath(); ctx.ellipse(cx, cy - 22 * sy, 12, since >= 0 && since < 0.4 ? 15 : 5, 0, 0, TAU); ctx.fill(); }

  // the culprits
  if (k === 0) {
    const inn = E.out(prog(q, 0.22, 0.6)), out = E.in(prog(q, 1.5, 1.95));
    const lunge = E.in(prog(q, hq - 0.16, hq)) * (1 - E.out(prog(q, hq, hq + 0.25)));
    const open = q < hq ? E.out(prog(q, 0.45, hq - 0.12)) : 0.16 + 0.3 * Math.abs(Math.sin((q - hq) * 16)) * (1 - prog(q, hq + 0.1, hq + 0.75));
    const mx = lerp(1340, 905, inn) - lunge * 80 + out * 520, hop = Math.abs(Math.sin(prog(q, 0.22, 0.6) * Math.PI * 2)) * 70 * (1 - inn) + Math.abs(Math.sin(out * Math.PI * 2)) * 60;
    monster(ctx, mx, 880 - hop + lunge * 40, 0.92 * (1 + kick(q - hq, 4, 6) * 0.06), t, open, -1);
  }
  if (k === 1) {
    const from = [cx + BITE[1][0] * R, cy + BITE[1][1] * R];
    for (let i = 0; i < 7; i++) {
      const e = prog(q, hq + i * 0.07, hq + 0.55 + i * 0.07);
      if (e <= 0 || e >= 1) continue;
      const ee = E.inOut(e), an = ee * 7 + i * 0.9, rad = Math.sin(Math.PI * e) * 150 * (1 - ee * 0.6);
      invoice(ctx, lerp(from[0] + (h2(i, 1) - 0.5) * 80, 200, ee) + Math.cos(an) * rad, lerp(from[1] + (h2(i, 2) - 0.5) * 80, 700, ee) + Math.sin(an) * rad, lerp(1.15, 0.15, ee), an * 1.8);
    }
  }
  if (k === 2) {
    const a = E.out(prog(q, 0.1, hq)), b = E.inOut(prog(q, hq + 0.1, 2.0));
    const gx = lerp(lerp(-200, 255, a), -260, b), gy = lerp(lerp(1640, 1385, a), 800, b) + Math.sin(t * 5) * 14;
    ghost(ctx, gx, gy, 0.8 * (1 + kick(q - hq, 4, 6) * 0.08), t, q >= hq, B.color);
  }
  if (k === 3) {
    const a = E.in(prog(q, 0.42, hq)), d = Math.max(0, q - hq);
    const reach = R * 0.82 + 150;
    for (const sd of [-1, 1]) {
      const x = 540 + sd * (lerp(900, reach, a) + (d > 0 ? 420 * d - 90 * Math.exp(-d * 9) : 0));
      const y = 1100 + sd * 26 + (d > 0 ? -380 * d + 2000 * d * d : 0);
      calBlock(ctx, x, y, 1, sd * (0.06 - a * 0.1) + sd * d * 3.4, sd < 0 ? 'Smith · Tune-up' : 'Lopez · Detail', sd < 0 ? '#4DA8FF' : '#7B4DFF');
    }
    if (d > 0 && d < 0.35) { // impact burst
      ctx.strokeStyle = INK; ctx.lineWidth = 12 * (1 - d / 0.35); ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) { const an = i * 0.628 + 0.3, r0 = R + 40 + d * 500, r1 = r0 + 60; ctx.beginPath(); ctx.moveTo(540 + Math.cos(an) * r0, 1100 + Math.sin(an) * r0); ctx.lineTo(540 + Math.cos(an) * r1, 1100 + Math.sin(an) * r1); ctx.stroke(); }
    }
  }
  // delta
  const dq = q - hq;
  if (dq > 0) {
    const [dx, dy] = pop2(dq, 3.4, 0.32), out = k < 3 ? E.in(prog(q, 1.8, 1.98)) : 0;
    ctx.save(); ctx.translate(540, 1100 + R + 215 - out * 60); ctx.rotate(-0.06 + kick(dq, 3, 5) * 0.12); ctx.scale(dx * (1 - out), dy * (1 - out));
    glitch(ctx, 22 * Math.exp(-dq * 10), Math.floor(t * 30), 0, 80, (col) => text(ctx, '−' + fmt$(LEAKS[k].amt), 0, 0, 190, { serif: true, color: col || B.color }));
    ctx.restore();
  }
  if (since >= 0 && since < 0.09) { ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - since / 0.09)})`; ctx.fillRect(0, 0, W, H); }
}

// ---------- 6: 11:47 PM ----------
function scene6(ctx, s, t, B) {
  const hq = s - (HIT.time - CUTS[5]);
  const shake = hq > 0 ? Math.exp(-hq * 10) * 30 : 0;
  ctx.save(); ctx.translate((hash(Math.floor(t * 30)) - 0.5) * shake, (hash(Math.floor(t * 30) + 4) - 0.5) * shake);
  bgNight(ctx, t, B, 0.14);
  // moon
  ctx.save(); ctx.translate(948, 132 + Math.sin(t) * 8); ctx.fillStyle = '#F5EBD0'; ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.fill();
  ctx.fillStyle = NIGHT; ctx.beginPath(); ctx.arc(20, -12, 41, 0, TAU); ctx.fill(); ctx.restore();
  const up = E.inOut(prog(hq, -0.1, 0.15));
  ctx.save(); ctx.translate(0, -up * 60);
  richLine(ctx, [{ t: 'And' }, { t: 'you' }, { t: 'only' }], 540, 300, 118, s, { at: 0.06, stagger: 0.08, color: '#fff' });
  richLine(ctx, [{ t: 'find' }, { t: 'out' }, { t: 'at' }], 540, 430, 118, s, { at: 0.3, stagger: 0.08, color: '#fff' });
  ctx.restore();
  // clock
  const [cx0, cy0] = pop2(s - 0.42, 2.8, 0.38);
  if (cx0 > 0) {
    const sc = lerp(1, 0.62, up), R = 290;
    ctx.save(); ctx.translate(540, lerp(1040, 800, up) + Math.sin(t * 2) * 8); ctx.scale(cx0 * sc, cy0 * sc); ctx.rotate(kick(hq, 4, 5) * 0.08);
    ctx.shadowColor = rgba(B.color, 0.5); ctx.shadowBlur = 90;
    ctx.fillStyle = B.color; ctx.beginPath(); ctx.arc(0, 0, R + 26, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
    const fg = ctx.createRadialGradient(-80, -100, 20, 0, 0, R); fg.addColorStop(0, '#FFFFFF'); fg.addColorStop(1, '#E6E4DE');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate((i / 12) * TAU); ctx.fillStyle = i % 3 ? '#B9B6AE' : INK; rr(ctx, -6, -R + 22, 12, i % 3 ? 30 : 54, 6); ctx.fill(); ctx.restore(); }
    const p = E.outQuint(prog(s, 0.5, HIT.time - CUTS[5]));
    const steps = 9, stepped = Math.floor(p * steps) / steps + (1 / steps) * E.out(prog((p * steps) % 1, 0, 0.5)) ;
    const turn = (1 - Math.min(1, stepped)) ;
    const mA = (47 / 60) * TAU - turn * TAU * 5, hA = ((11 + 47 / 60) / 12) * TAU - turn * TAU * 5 / 12 * 7;
    ctx.lineCap = 'round'; ctx.strokeStyle = INK;
    ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(hA) * R * 0.5, -Math.cos(hA) * R * 0.5); ctx.stroke();
    ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(mA) * R * 0.78, -Math.cos(mA) * R * 0.78); ctx.stroke();
    const sA = t * TAU * 0.9; ctx.strokeStyle = B.color; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-Math.sin(sA) * 40, Math.cos(sA) * 40); ctx.lineTo(Math.sin(sA) * R * 0.84, -Math.cos(sA) * R * 0.84); ctx.stroke();
    ctx.fillStyle = B.color; ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill();
    // sleepy eyes
    ctx.strokeStyle = INK; ctx.lineWidth = 9;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(k * 74, 110, 22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    ctx.restore();
  }
  // 11:47 PM
  if (hq > 0) {
    const sc = 1 + 2 * (1 - E.outExpo(prog(hq, 0, 0.16))) + kick(hq - 0.16, 5, 8) * 0.06;
    ctx.save(); ctx.translate(540, 1300); ctx.rotate(-0.035); ctx.scale(sc, sc);
    glitch(ctx, 40 * Math.exp(-hq * 8) + (hq > 0.5 && hq < 0.58 ? 12 : 0), Math.floor(t * 30), 0, 120, (col) => {
      text(ctx, '11:47', -118, 0, 286, { color: col || '#fff', ls: -0.05 });
      text(ctx, 'PM', 386, 26, 170, { serif: true, color: col || B.color });
    });
    ctx.restore();
    // zzz
    for (let i = 0; i < 3; i++) { const z = (hq * 0.7 + i * 0.33) % 1; ctx.save(); ctx.globalAlpha = Math.sin(Math.PI * z) * 0.8; text(ctx, 'z', 790 + z * 90 + i * 14, 700 - z * 170, 50 + z * 50, { serif: true, color: '#9aa0ad' }); ctx.restore(); }
    const fl = 1 - prog(hq, 0, 0.1); if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl * 0.7})`; ctx.fillRect(-50, -50, W + 100, H + 100); }
  }
  ctx.restore();
}

// ---------- 7 + 8: six apps -> one logo ----------
const APPS = [
  ['Messages', '#34C759', '…', 270, 215], ['Calendar', '#FF3B30', '12', 790, 345], ['Notes', '#FFB703', '≡', 330, 480],
  ['jobs.xlsx', '#1D8F4E', 'X', 770, 1420], ['Invoices.pdf', '#E5484D', 'P', 330, 1570], ['Payments', '#5B6CFF', '$', 740, 1720],
];
function chipPose(i, t) {
  const [, , , x, y] = APPS[i];
  const z = Math.sin(t * 1.1 + i * 1.9);                          // fake depth
  return { x: x + Math.sin(t * 0.9 + i * 2.3) * 40 + z * 16, y: y + Math.cos(t * 1.2 + i * 1.3) * 24, s: 1.14 + z * 0.13, rot: Math.sin(t * 0.8 + i) * 0.11 + (i % 2 ? 0.05 : -0.05), z };
}
function appsTitle(ctx, s, t, B, k = 1) {
  const n = Math.max(1, Math.min(6, 1 + Math.floor((s - 0.25) / 0.22 + 0.001)));
  const count = s < 0.25 ? 0 : n;
  const oq = s - 1.75;
  ctx.save(); ctx.translate(540, 960); ctx.scale(k, k); ctx.rotate((1 - k) * 2);
  const bump = 1 + Math.max(0, kick(((s - 0.25) % 0.22), 6, 14)) * (s < 1.6 && s > 0.25 ? 0.16 : 0);
  ctx.save(); ctx.translate(-330, -130); ctx.scale(bump * Math.min(1, spring(s, 3, 0.4) * 1.0), bump * spring(s, 3, 0.4));
  text(ctx, String(count), 0, 0, 420, { color: B.color, ls: -0.05 }); ctx.restore();
  const [ax, ay] = pop2(s - 0.08, 3, 0.4);
  ctx.save(); ctx.translate(150, -120); ctx.scale(ax, ay); text(ctx, 'APPS', 0, 0, 236, { color: '#fff', ls: -0.05 }); ctx.restore();
  if (oq > 0) {
    const [ox, oy] = pop2(oq, 3.2, 0.34);
    ctx.save(); ctx.translate(40, 150); ctx.rotate(-0.04); ctx.scale(ox, oy);
    glitch(ctx, 30 * Math.exp(-oq * 9), Math.floor(t * 30), 0, 100, (col) => text(ctx, 'open.', 0, 0, 300, { serif: true, color: col || B.color }));
    ctx.restore();
  }
  ctx.restore();
}
function scene7(ctx, s, t, B) {
  bgNight(ctx, t, B, 0.2);
  const draw = (front) => APPS.forEach((a, i) => {
    const p = chipPose(i, t); if ((p.z > 0) !== front) return;
    const [sx] = pop2(s - 0.25 - i * 0.22, 3.4, 0.36);
    appChip(ctx, p.x, p.y + (1 - Math.min(1, sx)) * 80, p.s * sx, p.rot + (1 - Math.min(1, sx)) * 0.5, a[0], a[1], a[2], front ? 1 : 0.78);
  });
  draw(false); appsTitle(ctx, s, t, B); draw(true);
}
function scene8(ctx, s, t, B) {
  const lq = s - (HIT.logo - CUTS[7]);
  const shake = lq > 0 ? Math.exp(-lq * 9) * 26 : s * 5;
  ctx.save(); ctx.translate((hash(Math.floor(t * 30)) - 0.5) * shake, (hash(Math.floor(t * 30) + 4) - 0.5) * shake);
  bgNight(ctx, t, B, 0.2 + 0.25 * prog(s, 0, 1.2));
  const C = [540, 900];
  if (lq < 0) {
    const tk = 1 - E.inBack(prog(s, 0.25, 0.95));
    if (tk > 0.01) appsTitle(ctx, 3 + s, t, B, tk);
    // speed lines into the centre
    for (let i = 0; i < 26; i++) {
      const an = hash(i) * TAU + s * 2, u = (hash(i + 50) + s * 1.6) % 1, r0 = lerp(1000, 60, E.in(u));
      ctx.strokeStyle = rgba(i % 3 ? '#ffffff' : B.color, 0.35 * (1 - u) * prog(s, 0, 0.3)); ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(C[0] + Math.cos(an) * r0, C[1] + Math.sin(an) * r0); ctx.lineTo(C[0] + Math.cos(an + 0.12) * (r0 - 90 * (1 - u)), C[1] + Math.sin(an + 0.12) * (r0 - 90 * (1 - u))); ctx.stroke();
    }
    let eaten = 0;
    APPS.forEach((a, i) => {
      const p = chipPose(i, t), u = E.in(prog(s, 0.08 + i * 0.09, 0.62 + i * 0.09));
      if (u >= 1) { eaten++; return; }
      const dx = p.x - C[0], dy = p.y - C[1], an = Math.atan2(dy, dx) + u * 3.6, d = Math.hypot(dx, dy) * (1 - u);
      appChip(ctx, C[0] + Math.cos(an) * d, C[1] + Math.sin(an) * d, p.s * (1 - u * 0.86), p.rot + u * 7, a[0], a[1], a[2]);
    });
    // growing core
    const cr = 20 + eaten * 17 + prog(s, 0, 1.2) * 30 + Math.sin(t * 50) * 4;
    const g = ctx.createRadialGradient(C[0], C[1], 2, C[0], C[1], cr * 3.2);
    g.addColorStop(0, '#fff'); g.addColorStop(0.25, mix(B.color, '#ffd0a0', 0.4)); g.addColorStop(0.5, rgba(B.color, 0.5)); g.addColorStop(1, rgba(B.color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(C[0], C[1], cr * 3.2, 0, TAU); ctx.fill();
  } else {
    // shockwaves + sparks
    for (let i = 0; i < 2; i++) { const u = prog(lq, i * 0.1, 0.6 + i * 0.1); if (u > 0 && u < 1) { ctx.strokeStyle = rgba(i ? '#ffffff' : B.color, 1 - u); ctx.lineWidth = 26 * (1 - u); ctx.beginPath(); ctx.arc(C[0], C[1], 120 + E.out(u) * 900, 0, TAU); ctx.stroke(); } }
    for (let i = 0; i < 18; i++) { const an = i * 0.349 + hash(i), u = E.out(prog(lq, 0, 0.5)); ctx.fillStyle = rgba(i % 2 ? '#ffffff' : B.color, 1 - prog(lq, 0.2, 0.6)); ctx.beginPath(); ctx.arc(C[0] + Math.cos(an) * (150 + u * (300 + hash(i + 3) * 320)), C[1] + Math.sin(an) * (150 + u * (300 + hash(i + 3) * 320)), 9 * (1 - u * 0.6), 0, TAU); ctx.fill(); }
    const [lx, ly] = pop2(lq, 3.2, 0.3);
    ctx.save(); ctx.translate(C[0], C[1] - 60 + Math.sin(t * 2.4) * 6); ctx.rotate((1 - spring(lq, 2.6, 0.4)) * -0.5); ctx.scale(lx, ly);
    ctx.shadowColor = rgba(B.color, 0.65); ctx.shadowBlur = 110; logoMark(ctx, 0, 0, 330, B.color, '#fff'); ctx.restore();
    const fs = Math.min(170, (170 * 900) / measure(ctx, B.name, 170));
    richLine(ctx, [{ t: B.name }], 540, 1210, fs, lq, { at: 0.14, color: '#fff' });
    const fl = 1 - prog(lq, 0, 0.14); if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(-50, -50, W + 100, H + 100); }
  }
  ctx.restore();
}

// ---------- 9: canvas only paints the backdrop; ui.js does the rest ----------
function scene9(ctx, s, t, B) { bgLight(ctx, t, B); }

// ---------- 10: end card ----------
function scene10(ctx, s, t, B) {
  const shake = Math.exp(-s * 10) * 22;
  ctx.save(); ctx.translate((hash(Math.floor(t * 30)) - 0.5) * shake, (hash(Math.floor(t * 30) + 4) - 0.5) * shake);
  bgOrange(ctx, t, B);
  const [lx, ly] = pop2(s - 0.02, 3, 0.32);
  ctx.save(); ctx.translate(540, 470 + Math.sin(t * 2.2) * 8); ctx.rotate((1 - spring(s, 2.4, 0.4)) * -0.4); ctx.scale(lx, ly);
  ctx.shadowColor = 'rgba(110,15,0,.4)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26; logoMark(ctx, 0, 0, 250, '#fff', B.color); ctx.restore();
  const fs = Math.min(176, (176 * 920) / measure(ctx, B.name, 176));
  richLine(ctx, [{ t: B.name }], 540, 740, fs, s, { at: 0.14, color: '#fff' });
  richLine(ctx, [{ t: 'Run' }, { t: 'your' }, { t: 'whole' }, { t: 'day' }], 540, 990, 100, s, { at: 0.5, stagger: 0.07, color: '#fff' });
  richLine(ctx, [{ t: 'in', color: '#fff' }, { t: 'one', serif: true, color: INK }, { t: 'app.', serif: true, color: INK }], 540, 1120, 112, s, { at: 0.8, stagger: 0.09 });
  // button
  const [bx, by] = pop2(s - 1.2, 3, 0.32);
  if (bx > 0) {
    const pulse = 1 + 0.025 * Math.sin((s - 1.2) * 7);
    ctx.save(); ctx.translate(540, 1400); ctx.scale(bx * pulse, by * pulse);
    const rp = ((s - 1.5) % 1.1) / 1.1; if (s > 1.5) { ctx.strokeStyle = `rgba(20,17,15,${0.5 * (1 - rp)})`; ctx.lineWidth = 8; rr(ctx, -310 - rp * 50, -90 - rp * 50, 620 + rp * 100, 180 + rp * 100, 140); ctx.stroke(); }
    ctx.shadowColor = 'rgba(60,5,0,.45)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
    ctx.fillStyle = INK; rr(ctx, -310, -90, 620, 180, 90); ctx.fill(); ctx.shadowColor = 'transparent';
    text(ctx, 'Try it free', -36, 2, 74, { color: '#fff' });
    const ar = 190 + Math.sin(s * 7) * 8; ctx.strokeStyle = B.color; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(ar, 0); ctx.lineTo(ar + 56, 0); ctx.moveTo(ar + 32, -24); ctx.lineTo(ar + 56, 0); ctx.lineTo(ar + 32, 24); ctx.stroke();
    ctx.restore();
  }
  const us = Math.min(66, (66 * 900) / measure(ctx, B.url, 66, { weight: 800, ls: -0.02 }));
  ctx.save(); ctx.globalAlpha = prog(s, 1.45, 1.7); text(ctx, B.url, 540, 1590 + (1 - E.out(prog(s, 1.45, 1.8))) * 30, us, { color: '#fff', weight: 800, ls: -0.02 }); ctx.restore();
  ctx.restore();
  const fl = 1 - prog(s, 0, 0.12); if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl * 0.8})`; ctx.fillRect(0, 0, W, H); }
}

const SCENES = [scene1, scene2, scene3, scene4, scene5, scene6, scene7, scene8, scene9, scene10];
