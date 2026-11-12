// Pure helpers. Nothing here keeps state between frames.
const W = 1080, H = 1920;
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  outQuint: (x) => 1 - Math.pow(1 - x, 5),
  inBack: (x) => 2.4 * x * x * x - 1.4 * x * x,
};
// Analytic under-damped spring step response 0 -> 1 (overshoots, settles).
function spring(t, f = 3.2, z = 0.38) {
  if (t <= 0) return 0;
  const w = TAU * f, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
}
// Decaying wobble that starts at 0, kicks, and settles at 0 (for impacts).
function kick(t, f = 5, d = 7) { return t <= 0 ? 0 : Math.exp(-d * t) * Math.sin(TAU * f * t); }
// Squash & stretch pair from one spring: returns [sx, sy]
function pop2(t, f = 3.2, z = 0.36) {
  const s = spring(t, f, z), k = kick(t, f, 6) * 0.22;
  return [Math.max(0, s * (1 + k)), Math.max(0, s * (1 - k))];
}
// Deterministic hash noise
function hash(n) { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function h2(a, b) { return hash(a * 17.13 + b * 91.7 + 0.5); }

// ---- colour ---------------------------------------------------------------
function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(c1, c2, t) { const a = hex(c1), b = hex(c2); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join(''); }
function rgba(c, a) { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; }
const fmt$ = (n) => '$' + Math.round(n).toLocaleString('en-US');

// ---- type -----------------------------------------------------------------
const SANS = 'Inter', SERIF = 'Instrument Serif';
function font(ctx, size, o = {}) {
  if (o.serif) { ctx.font = `italic 400 ${size * 1.16}px "${SERIF}"`; ctx.letterSpacing = `${(-0.01 * size).toFixed(2)}px`; }
  else { ctx.font = `${o.weight || 900} ${size}px "${SANS}"`; ctx.letterSpacing = `${((o.ls ?? -0.035) * size).toFixed(2)}px`; }
}
function text(ctx, str, x, y, size, o = {}) {
  font(ctx, size, o);
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || '#111';
  ctx.fillText(str, x, y);
}
function measure(ctx, str, size, o = {}) { font(ctx, size, o); return ctx.measureText(str).width; }

// A line of mixed-style words, each popping in on its own time.
// parts: [{t:'word', serif, color, at}]  -> centred on cx
function richLine(ctx, parts, cx, y, size, now, o = {}) {
  const gap = size * (o.gap ?? 0.26);
  const ws = parts.map((p) => measure(ctx, p.t, size, p));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  let x = cx - total / 2;
  parts.forEach((p, i) => {
    const at = p.at ?? (o.at ?? 0) + i * (o.stagger ?? 0.09);
    const [sx, sy] = pop2(now - at, o.f ?? 3.4, 0.4);
    const out = o.out != null ? E.in(prog(now, o.out, o.out + 0.18)) : 0;
    if (sx > 0.001 && out < 1) {
      ctx.save();
      ctx.translate(x + ws[i] / 2, y + (1 - Math.min(1, spring(now - at, 3, 0.5))) * size * 0.5 - out * size * 0.4);
      ctx.rotate((1 - spring(now - at, 2.6, 0.45)) * (i % 2 ? 0.12 : -0.12));
      ctx.scale(sx * (1 - out), sy * (1 - out));
      ctx.globalAlpha *= clamp((now - at) * 12) * (1 - out);
      text(ctx, p.t, 0, p.serif ? size * 0.02 : 0, size, { ...p, color: p.color || o.color });
      ctx.restore();
    }
    x += ws[i] + gap;
  });
  return total;
}

// ---- shapes ---------------------------------------------------------------
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); }
function blobPath(ctx, cx, cy, rx, ry, t, wob = 0.035, seed = 0, begin = true) {
  const N = 72; const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    const k = 1 + wob * (Math.sin(2 * a + t * 2.3 + seed) * 0.55 + Math.sin(3 * a - t * 1.7 + seed * 2.1) * 0.35 + Math.sin(5 * a + t * 3.1 + seed * 0.7) * 0.18);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  if (begin) ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const p = pts[i % N], q = pts[(i + 1) % N];
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(p[0], p[1], mx, my);
  }
  ctx.closePath();
}
function star4(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rad = i % 2 ? r * 0.22 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function eyes(ctx, x, y, r, gap, o = {}) {
  const blink = o.blink ?? 1, lx = o.lx ?? 0, ly = o.ly ?? 0;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(x + s * gap, y); ctx.scale(1, Math.max(0.08, blink));
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 1.12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#15110f'; ctx.beginPath(); ctx.arc(lx * r * 0.42, ly * r * 0.42, r * 0.52, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lx * r * 0.42 - r * 0.18, ly * r * 0.42 - r * 0.2, r * 0.17, 0, TAU); ctx.fill();
    ctx.restore();
    if (o.sad) { // droopy brow
      ctx.strokeStyle = o.brow || '#7a1500'; ctx.lineWidth = r * 0.32; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + s * (gap - r * 0.9), y - r * 1.75); ctx.lineTo(x + s * (gap + r * 0.9), y - r * 1.3); ctx.stroke();
    }
  }
}
// blink value that closes briefly every few seconds
function blinkAt(t, seed = 0) { const p = (t + seed * 1.37) % 2.6; return p > 2.45 ? Math.abs((p - 2.525) / 0.075) : 1; }

// ---- background dressing --------------------------------------------------
function bubbles(ctx, t, o) {
  const { dot, glossy = '#ffffff', n = 26, seed = 1, alpha = 1 } = o;
  for (let i = 0; i < n; i++) {
    const big = i % 5 === 0;
    const r = big ? 26 + hash(i + seed) * 46 : 5 + hash(i * 3 + seed) * 11;
    const speed = (big ? 26 : 44) + hash(i * 7 + seed) * 40;
    const x0 = hash(i * 13 + seed) * W;
    const yy = ((hash(i * 29 + seed) * (H + 200) - t * speed) % (H + 200) + (H + 200)) % (H + 200) - 100;
    const x = x0 + Math.sin(t * (0.5 + hash(i) * 0.8) + i) * (big ? 30 : 16);
    if (big) {
      const g = ctx.createRadialGradient(x - r * 0.35, yy - r * 0.4, r * 0.05, x, yy, r);
      g.addColorStop(0, rgba(glossy, 0.75 * alpha)); g.addColorStop(0.35, rgba(glossy, 0.16 * alpha)); g.addColorStop(0.85, rgba(glossy, 0.1 * alpha)); g.addColorStop(1, rgba(glossy, 0.38 * alpha));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, yy, r, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.85 * alpha); ctx.beginPath(); ctx.ellipse(x - r * 0.38, yy - r * 0.42, r * 0.2, r * 0.11, -0.7, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = rgba(dot, (0.55 + 0.45 * Math.sin(t * 2 + i)) * alpha * (o.dotAlpha ?? 0.8));
      ctx.beginPath(); ctx.arc(x, yy, r, 0, TAU); ctx.fill();
    }
  }
}
function vignette(ctx, color, a) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, rgba(color, 0)); g.addColorStop(1, rgba(color, a));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---- glossy goo -----------------------------------------------------------
// shapeFn draws solid shapes; they are merged with a goo filter, bitten, then
// shaded as one glossy 3D surface. `over` draws on the surface (clipped to it).
const _mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
let _A, _B, _C;
function goo(ctx, shapeFn, o) {
  _A = _A || _mk(); _B = _B || _mk(); _C = _C || _mk();
  const a = _A.getContext('2d'), b = _B.getContext('2d'), c = _C.getContext('2d');
  const { cx, cy, r, color } = o;
  a.clearRect(0, 0, W, H); a.fillStyle = '#000'; shapeFn(a);
  b.save(); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, H);
  b.filter = o.goo === false ? 'none' : 'url(#goo)'; b.drawImage(_A, 0, 0); b.filter = 'none';
  // bites
  if (o.bites && o.bites.length) {
    b.globalCompositeOperation = 'destination-out'; b.fillStyle = '#000';
    for (const bt of o.bites) {
      b.beginPath(); b.arc(bt.x, bt.y, bt.r, 0, TAU); b.fill();
      const toC = Math.atan2(cy - bt.y, cx - bt.x);
      for (let i = -2; i <= 2; i++) { const an = toC + i * 0.48; b.beginPath(); b.arc(bt.x + Math.cos(an) * bt.r * 0.9, bt.y + Math.sin(an) * bt.r * 0.9, bt.r * 0.3, 0, TAU); b.fill(); }
    }
  }
  // base shade
  b.globalCompositeOperation = 'source-atop';
  const g = b.createRadialGradient(cx - r * 0.38, cy - r * 0.45, r * 0.05, cx - r * 0.1, cy - r * 0.1, r * 1.5);
  g.addColorStop(0, mix(color, '#ffd9b0', 0.55)); g.addColorStop(0.3, mix(color, '#ffb070', 0.12)); g.addColorStop(0.62, color); g.addColorStop(1, mix(color, '#5a0000', 0.5));
  b.fillStyle = g; b.fillRect(0, 0, W, H);
  // inner shadow (bottom-right) and rim light (top-left) from offset copies
  const rim = (dx, dy, blur, col, alpha) => {
    c.save(); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H); c.fillStyle = col; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'destination-out'; c.filter = `blur(${blur}px)`; c.drawImage(_B, dx, dy); c.restore();
    b.globalAlpha = alpha; b.drawImage(_C, 0, 0); b.globalAlpha = 1;
  };
  const k = Math.max(0.35, Math.min(1, r / 300));
  rim(-16 * k, -22 * k, 16 * k, mix(color, '#4a0000', 0.7), 0.6);
  rim(9 * k, 11 * k, 7 * k, '#fff3e0', 0.5);
  // speculars
  b.filter = `blur(${5 * k}px)`; b.fillStyle = 'rgba(255,255,255,0.82)';
  b.beginPath(); b.ellipse(cx - r * 0.42, cy - r * 0.5, r * 0.3, r * 0.13, -0.62, 0, TAU); b.fill();
  b.filter = `blur(${2 * k}px)`; b.beginPath(); b.ellipse(cx - r * 0.7, cy - r * 0.16, r * 0.05, r * 0.1, -0.2, 0, TAU); b.fill();
  b.filter = `blur(${14 * k}px)`; b.fillStyle = 'rgba(255,190,150,0.35)';
  b.beginPath(); b.ellipse(cx + r * 0.42, cy + r * 0.56, r * 0.34, r * 0.1, -0.6, 0, TAU); b.fill();
  b.filter = 'none';
  if (o.over) o.over(b);
  b.restore();
  ctx.save();
  if (o.shadow !== false) { ctx.shadowColor = rgba(mix(color, '#300000', 0.5), o.shadowA ?? 0.32); ctx.shadowBlur = 50 * k; ctx.shadowOffsetY = 34 * k; }
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.drawImage(_B, 0, 0); ctx.restore();
}
// Number printed on the blob
function printed(c, str, x, y, size, color = '#fff') {
  font(c, size); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(110,15,0,0.45)'; c.fillText(str, x + size * 0.02, y + size * 0.055);
  c.fillStyle = color; c.fillText(str, x, y);
}
