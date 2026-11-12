// Cartoon cast. All drawn from primitives; each is a pure function of its args.

// Purple blob monster. open: 0..1 mouth, look: [-1..1, -1..1]
function monster(ctx, x, y, s, t, open, face = -1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
  const col = '#7B4DFF';
  // shadow
  ctx.fillStyle = 'rgba(40,20,90,.16)'; ctx.beginPath(); ctx.ellipse(0, 190, 150, 22, 0, 0, TAU); ctx.fill();
  // horns
  ctx.fillStyle = '#FFD166';
  for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * 70, -128); ctx.quadraticCurveTo(k * 118, -210, k * 132, -222); ctx.quadraticCurveTo(k * 128, -160, k * 112, -108); ctx.closePath(); ctx.fill(); }
  // feet
  ctx.fillStyle = '#5B2FE0';
  for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(k * 72, 172 + Math.sin(t * 9 + k) * 4, 46, 24, 0, 0, TAU); ctx.fill(); }
  // body
  const g = ctx.createRadialGradient(-60, -90, 10, 0, 0, 230);
  g.addColorStop(0, '#A98BFF'); g.addColorStop(0.5, col); g.addColorStop(1, '#4A22C4');
  ctx.fillStyle = g; blobPath(ctx, 0, 0, 176, 170 - open * 6, t, 0.03, 4); ctx.fill();
  // spots
  ctx.fillStyle = 'rgba(255,255,255,.16)';
  ctx.beginPath(); ctx.arc(-98, 66, 20, 0, TAU); ctx.arc(-126, 14, 11, 0, TAU); ctx.arc(-70, 110, 9, 0, TAU); ctx.fill();
  // arms
  ctx.strokeStyle = col; ctx.lineWidth = 34; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(120, 40); ctx.quadraticCurveTo(190, 30 - open * 40, 214, -8 - open * 50); ctx.stroke();
  // mouth
  const mh = 14 + open * 96;
  ctx.fillStyle = '#2A0F5E'; ctx.beginPath(); ctx.ellipse(60, 52, 86, mh, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(60, 52, 86, mh, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = '#FF6B8B'; ctx.beginPath(); ctx.ellipse(52, 52 + mh * 0.75, 56, mh * 0.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 5; i++) { const tx = -16 + i * 38; ctx.beginPath(); ctx.moveTo(tx, 52 - mh - 4); ctx.lineTo(tx + 19, 52 - mh + 30); ctx.lineTo(tx + 38, 52 - mh - 4); ctx.fill(); }
  for (let i = 0; i < 4; i++) { const tx = 4 + i * 38; ctx.beginPath(); ctx.moveTo(tx, 52 + mh + 4); ctx.lineTo(tx + 19, 52 + mh - 26); ctx.lineTo(tx + 38, 52 + mh + 4); ctx.fill(); }
  ctx.restore();
  // eyes
  eyes(ctx, 38, -68 - open * 12, 34, 44, { lx: 0.7, ly: 0.35, blink: blinkAt(t, 3) });
  ctx.restore();
}

// Pink vortex with a face
function vortex(ctx, x, y, s, t) {
  if (s <= 0.001) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 210);
  g.addColorStop(0, '#FF2E88'); g.addColorStop(0.6, '#FF7DB8'); g.addColorStop(1, 'rgba(255,170,210,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 210, 0, TAU); ctx.fill();
  ctx.lineCap = 'round';
  for (let arm = 0; arm < 4; arm++) {
    for (let i = 0; i < 46; i++) {
      const u = i / 46, a = arm * (TAU / 4) + u * 5.2 - t * 7, r = 14 + u * 178;
      const a2 = arm * (TAU / 4) + (u + 1 / 46) * 5.2 - t * 7, r2 = 14 + (u + 1 / 46) * 178;
      ctx.strokeStyle = arm % 2 ? `rgba(255,255,255,${0.85 * (1 - u)})` : `rgba(214,20,110,${0.9 * (1 - u * 0.8)})`;
      ctx.lineWidth = 5 + (1 - u) * 15;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2); ctx.stroke();
    }
  }
  ctx.fillStyle = '#C01468'; ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill();
  eyes(ctx, 0, -10, 19, 24, { lx: 0.5, ly: 0.6, blink: blinkAt(t, 5) });
  ctx.fillStyle = '#3d0020'; ctx.beginPath(); ctx.ellipse(0, 28, 13, 9 + Math.sin(t * 12) * 3, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

// Little invoice sheet
function invoice(ctx, x, y, s, rot) {
  if (s <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(40,50,70,.22)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#fff'; rr(ctx, -52, -68, 104, 136, 12); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#FF4A1C'; rr(ctx, -38, -52, 44, 12, 6); ctx.fill();
  ctx.fillStyle = '#D5D9E2';
  for (let i = 0; i < 4; i++) { rr(ctx, -38, -26 + i * 20, i === 3 ? 40 : 76, 9, 4); ctx.fill(); }
  ctx.fillStyle = '#E5484D'; font(ctx, 17, { weight: 900, ls: 0.04 }); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.save(); ctx.translate(12, 44); ctx.rotate(-0.2); ctx.fillText('UNPAID', 0, 0); ctx.restore();
  ctx.restore();
}

// Blue ghost. carry: draws an orange chunk in its hands
function ghost(ctx, x, y, s, t, carry, brand) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 3) * 0.06);
  ctx.fillStyle = 'rgba(30,80,160,.13)'; ctx.beginPath(); ctx.ellipse(0, 230, 110, 16, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(-130, -170, 130, 170);
  g.addColorStop(0, '#BFE3FF'); g.addColorStop(0.45, '#5CB4FF'); g.addColorStop(1, '#2F7FE6');
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(-130, 150); ctx.lineTo(-130, -30); ctx.bezierCurveTo(-130, -210, 130, -210, 130, -30); ctx.lineTo(130, 150);
  for (let i = 0; i < 4; i++) { const x0 = 130 - i * 65, w = Math.sin(t * 6 + i * 1.6) * 14; ctx.quadraticCurveTo(x0 - 16, 106 + w, x0 - 32.5, 150 + w * 0.4); ctx.quadraticCurveTo(x0 - 49, 190 + w, x0 - 65, 150); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(-70, -110, 26, 44, 0.5, 0, TAU); ctx.fill();
  eyes(ctx, 14, -50, 26, 40, { lx: 0.6, ly: 0.2, blink: blinkAt(t, 1) });
  ctx.fillStyle = '#163E7A'; ctx.beginPath(); ctx.ellipse(18, 14, 20, carry ? 9 : 24, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,120,160,.55)'; ctx.beginPath(); ctx.ellipse(-52, -8, 20, 12, 0, 0, TAU); ctx.ellipse(80, -8, 20, 12, 0, 0, TAU); ctx.fill();
  if (carry) {
    const cg = ctx.createRadialGradient(108, 60, 4, 126, 84, 76);
    cg.addColorStop(0, mix(brand, '#ffe0c0', 0.6)); cg.addColorStop(0.5, brand); cg.addColorStop(1, mix(brand, '#5a0000', 0.45));
    ctx.fillStyle = cg; blobPath(ctx, 126, 84, 62, 56, t * 2, 0.09, 9); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(104, 60, 15, 7, -0.6, 0, TAU); ctx.fill();
  }
  // hands
  ctx.fillStyle = '#5CB4FF';
  ctx.beginPath(); ctx.ellipse(carry ? 96 : 150, carry ? 126 : 40, 26, 20, 0.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(carry ? 168 : -150, carry ? 112 : 50, 26, 20, -0.4, 0, TAU); ctx.fill();
  ctx.restore();
}

// Calendar block for the double-booking crash
function calBlock(ctx, x, y, s, rot, name, stripe) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(40,50,70,.25)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#fff'; rr(ctx, -150, -74, 300, 148, 26); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = stripe; rr(ctx, -150, -74, 300, 148, 26); ctx.save(); ctx.clip(); ctx.fillRect(-150, -74, 22, 148); ctx.restore();
  text(ctx, '2:00 PM', -106, -24, 42, { align: 'left', color: '#14110f' });
  text(ctx, name, -106, 28, 30, { align: 'left', weight: 600, color: '#6B7280', ls: -0.02 });
  ctx.restore();
}

// App chip (scene 7/8)
function appChip(ctx, x, y, s, rot, label, col, glyph, alpha = 1) {
  if (s <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= alpha;
  const w = measure(ctx, label, 44, { weight: 800, ls: -0.03 }) + 150, h = 112;
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#2C2A31'); g.addColorStop(1, '#1B1A1F');
  ctx.fillStyle = g; rr(ctx, -w / 2, -h / 2, w, h, 34); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2; rr(ctx, -w / 2 + 1, -h / 2 + 1, w - 2, h - 2, 33); ctx.stroke();
  ctx.fillStyle = col; rr(ctx, -w / 2 + 22, -34, 68, 68, 20); ctx.fill();
  text(ctx, glyph, -w / 2 + 56, 2, 36, { color: '#fff', weight: 900, ls: 0 });
  text(ctx, label, -w / 2 + 108, 2, 44, { align: 'left', color: '#F4F2EE', weight: 800, ls: -0.03 });
  ctx.restore();
}

// Logo mark: rounded square + tick. fg/bg let it invert on orange.
function logoMark(ctx, x, y, size, bg, fg) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = bg; rr(ctx, -size / 2, -size / 2, size, size, size * 0.3); ctx.fill();
  ctx.strokeStyle = fg; ctx.lineWidth = size * 0.13; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-size * 0.22, size * 0.02); ctx.lineTo(-size * 0.05, size * 0.19); ctx.lineTo(size * 0.25, -size * 0.17); ctx.stroke();
  ctx.restore();
}
