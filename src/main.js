// Boot: load brand + optional beat grid, then expose window.seek(t).
// seek(t) renders the frame at real time t (seconds) from scratch; nothing is
// carried from one frame to the next, so frames can render in any order.
(async () => {
  const j = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const B = Object.assign({ name: 'YourApp', url: 'yourapp.com', color: '#FF4A1C' }, (await j('../brand.json')) || {});
  const beats = new URLSearchParams(location.search).has('nobeats') ? null : await j('../out/beats.json');
  const warp = TL.makeWarp(beats && beats.beats);
  document.documentElement.style.setProperty('--brand', B.color);
  await Promise.all(['900 80px Inter', '800 80px Inter', '600 80px Inter', '500 80px Inter', 'italic 400 80px "Instrument Serif"'].map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  UI.build(B);
  const ctx = document.getElementById('c').getContext('2d');

  function renderBase(b) {
    b = clamp(b, 0, TL.BASE_DUR - 1e-6);
    let i = 0; while (i < TL.CUTS.length - 2 && b >= TL.CUTS[i + 1]) i++;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.shadowColor = 'transparent';
    ctx.clearRect(0, 0, W, H);
    ctx.save(); SCENES[i](ctx, b - TL.CUTS[i], b, B); ctx.restore();
    UI.update(b - TL.CUTS[8], b, i === 8);
  }
  window.seek = (t) => renderBase(warp.toBase(t));
  window.seekBase = renderBase;
  window.DURATION = warp.duration;
  window.FPS = TL.FPS;

  if (!new URLSearchParams(location.search).has('render')) {
    // preview: fit to window, scrub or play in real time
    const stage = document.getElementById('stage'), bar = document.getElementById('bar'), scrub = document.getElementById('scrub'), tc = document.getElementById('tc');
    bar.style.display = 'flex'; scrub.max = warp.duration;
    const fit = () => { const k = Math.min(innerWidth / W, (innerHeight - 40) / H); stage.style.transform = `translate(${(innerWidth - W * k) / 2}px,0) scale(${k})`; };
    addEventListener('resize', fit); fit();
    let playing = false, t0 = 0;
    const show = (t) => { window.seek(t); scrub.value = t; tc.textContent = t.toFixed(2); };
    scrub.oninput = () => { playing = false; show(+scrub.value); };
    document.getElementById('pp').onclick = () => { playing = !playing; t0 = performance.now() / 1000 - +scrub.value; loop(); };
    const loop = () => { if (!playing) return; const t = (performance.now() / 1000 - t0) % warp.duration; show(t); requestAnimationFrame(loop); };
  }
  window.seek(0);
  window.ready = true;
})();
