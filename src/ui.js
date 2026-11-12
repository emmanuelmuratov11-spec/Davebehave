// Scene 9: the product UI, built from real HTML/CSS. update(s) sets every
// style from scratch as a pure function of scene-local time.
const UI = (() => {
  let root, win, chrome, cards = [], sts = [], chips = [], phone, rings = [], core, msg, cc, gooL, ghosts = [], pillBase, pill, pillTx, caps = [], live;
  // every position comes from this table, one per layout
  const L = WIDE ? {
    win: [70, 120, 1040, 980], card: { x: 326, w: 760, h: 120 }, top0: 278, step: 132, pill: { x: 410, y: 400, w: 1100, h: 270 }, pillFont: [88, 64],
    chips: [[1190, 105, -0.05], [1330, 225, 0.04], [1215, 345, -0.02]], phone: [1390, 465], cc: [1170, 745], capTop: 770,
  } : {
    win: [50, 400, 980, 1110], card: { x: 306, w: 698, h: 136 }, top0: 562, step: 152, pill: { x: 70, y: 780, w: 940, h: 250 }, pillFont: [74, 56],
    chips: [[60, 128, -0.05], [470, 150, 0.04], [290, 262, -0.02]], phone: [640, 900], cc: [420, 1180], capTop: 1120,
  };
  const CARD_TOP = (i) => L.top0 + i * L.step, CARD = L.card, PILL = L.pill;
  const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const nfc = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M7 8.5a6 6 0 010 7M11 6a10 10 0 010 12M15 3.5a14 14 0 010 17"/></svg>';
  const el = (cls, html = '', parent = root) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; parent.appendChild(d); return d; };
  const money = (n, c = 0) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: c, maximumFractionDigits: c });

  function build(B) {
    root = document.getElementById('ui');
    [['Every', 'job.'], ['Every', 'client.'], ['Every', 'invoice.']].forEach(([a, b]) => chips.push(el('chip', `${a}<i>${b}</i>`)));
    win = el('win'); win.style.cssText = `left:${L.win[0]}px;top:${L.win[1]}px;width:${L.win[2]}px;height:${L.win[3]}px`;
    chrome = el('chrome', `
      <div class="side">
        <div class="brandrow"><div class="mark">${tick}</div><span id="bn"></span></div>
        ${['Today', 'Schedule', 'Clients', 'Jobs', 'Invoices', 'Payments'].map((n, i) => `<div class="nav ${i ? '' : 'on'}"><b></b>${n}</div>`).join('')}
      </div>
      <div class="head"><h1>Today</h1><div class="live"><u></u>Live</div></div>
      <div class="sub">Thu, Nov 12 · ${TL.JOBS.length} jobs · ${money(TL.BOOKED)} booked</div>`, win);
    chrome.querySelector('#bn').textContent = B.name;
    const bn = chrome.querySelector('.brandrow'); bn.style.fontSize = Math.min(30, 30 * 8 / Math.max(8, B.name.length * 0.95)) + 'px';
    live = chrome.querySelector('.live u');
    TL.JOBS.forEach((j, i) => {
      const c = el('card', `<div class="t">${j.time}</div><div class="m"><div>${j.title}</div><span>${j.client}</span></div><div class="p"><div>${money(j.price)}</div><span class="st"></span></div>`);
      c.style.cssText = `top:${CARD_TOP(i)}px;left:${CARD.x}px;width:${CARD.w}px;height:${CARD.h}px`; cards.push(c); sts.push(c.querySelector('.st'));
    });
    cc = el('cc'); cc.style.cssText = `left:${L.cc[0]}px;top:${L.cc[1]}px;` + 'width:270px;height:170px;border-radius:24px;background:linear-gradient(135deg,#2C2A31,#14110f);box-shadow:0 30px 50px rgba(20,17,15,.35)';
    cc.innerHTML = '<div style="position:absolute;left:26px;top:60px;width:52px;height:40px;border-radius:9px;background:#FFB703"></div><div style="position:absolute;left:26px;bottom:22px;color:#aaa;font:600 20px Inter;letter-spacing:.14em">•••• 4242</div>';
    phone = el('phone', `<div class="scr"><div class="notch"></div><div class="lbl">${TL.JOBS[1].title} · ${TL.JOBS[1].client}</div><div class="amt">${money(TL.JOBS[1].price, 2)}</div>
      <div class="ring"></div><div class="ring"></div><div class="ring"></div><div class="core"><span class="i1">${nfc}</span><span class="i2">${tick}</span></div><div class="msg"></div></div>`);
    phone.style.left = L.phone[0] + 'px'; phone.style.top = L.phone[1] + 'px';
    rings = [...phone.querySelectorAll('.ring')]; core = phone.querySelector('.core'); msg = phone.querySelector('.msg');
    gooL = el('goo');
    TL.JOBS.forEach(() => ghosts.push(el('', '', gooL)));
    pillBase = el('', '', gooL);
    pill = el('pill', '<div class="gl"></div><div class="tx"><small>Paid today:</small><span></span></div>');
    pill.style.cssText = `left:${PILL.x}px;top:${PILL.y}px;width:${PILL.w}px;height:${PILL.h}px;border-radius:${PILL.h / 2}px`;
    pill.querySelector('.tx').style.fontSize = L.pillFont[0] + 'px'; pill.querySelector('small').style.fontSize = L.pillFont[1] + 'px';
    pillTx = pill.querySelector('.tx span');
    const cap = el('cap', '<span>Booked.</span><span>Done.</span><span><i>Paid.</i></span>'); caps = [...cap.children]; cap.style.top = L.capTop + 'px'; cap.style.width = W + 'px';
  }
  const T = (e, x, y, sx = 1, sy = sx, r = 0) => { e.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(4)}rad) scale(${Math.max(0, sx).toFixed(4)},${Math.max(0, sy).toFixed(4)})`; };

  function update(s, t, on) {
    root.style.display = on ? 'block' : 'none';
    if (!on) return;
    const paidAt = (i) => (i === 1 ? TL.HIT.paid - TL.CUTS[8] : 3.95 + i * 0.1);
    const M0 = 4.6, LAND = TL.HIT.payoff - TL.CUTS[8];
    const float = Math.sin(t * 1.8) * 6;
    // window
    const [wx, wy] = pop2(s - 0.04, 2.6, 0.42), wOut = prog(s, M0, M0 + 0.22);
    T(win, 0, (1 - Math.min(1, wx)) * 500 + float, wx, wy, (1 - spring(s - 0.04, 2.2, 0.5)) * -0.12);
    chrome.style.opacity = 1 - wOut; chrome.style.transform = `scale(${1 - 0.05 * wOut})`;
    live.style.transform = `scale(${1 + 0.35 * Math.max(0, Math.sin(t * 6))})`;
    // chips
    const cp = L.chips;
    chips.forEach((c, i) => {
      const [sx, sy] = pop2(s - (1.1 + i * 0.5), 3.4, 0.34), out = 1 - E.in(prog(s, M0 - 0.12 + i * 0.03, M0 + 0.1 + i * 0.03));
      c.style.left = cp[i][0] + 'px'; c.style.top = cp[i][1] + 'px';
      T(c, Math.sin(t * 2 + i * 2) * 5, Math.cos(t * 1.7 + i) * 6 + (1 - Math.min(1, sx)) * 60, sx * out, sy * out, cp[i][2] + (1 - spring(s - (1.1 + i * 0.5), 2.6, 0.4)) * 0.3);
    });
    // job cards
    cards.forEach((c, i) => {
      const at = 0.45 + i * 0.16, sp = spring(s - at, 2.8, 0.5), k = kick(s - at, 3, 6);
      const pd = s - paidAt(i), bump = pd > 0 ? 1 + kick(pd, 4, 9) * 0.05 : 1;
      T(c, (1 - sp) * 820, float + (1 - sp) * 40, (1 + k * 0.05) * bump, (1 - k * 0.05) * bump, (1 - sp) * 0.12);
      c.style.opacity = s < at ? 0 : 1 - prog(s, M0 + 0.02, M0 + 0.14);
      const paid = pd > 0; sts[i].className = 'st' + (paid ? ' paid' : ''); sts[i].textContent = paid ? 'Paid ✓' : 'Booked';
      sts[i].style.transform = `scale(${paid ? 1 + Math.max(0, kick(pd, 4, 8)) * 0.5 : 1})`;
      c.style.borderColor = paid && pd < 0.5 ? '#12B76A' : '#E9EBF0';
    });
    // phone + card tap
    const pin = spring(s - 2.45, 2.2, 0.5), pout = E.in(prog(s, 4.3, 4.62));
    const pq = s - (TL.HIT.paid - TL.CUTS[8]), paid = pq > 0;
    T(phone, 0, (1 - pin) * 1150 + pout * 1250 + float * 1.4, 1 + (paid ? kick(pq, 4, 7) * 0.05 : 0), 1 - (paid ? kick(pq, 4, 7) * 0.05 : 0), 0.05 + (1 - pin) * 0.3 - pout * 0.3);
    const tap = E.out(prog(s, 2.85, 3.2)), away = E.in(prog(s, 3.85, 4.2));
    T(cc, -700 * (1 - tap) - 800 * away, 200 * (1 - tap) + float * 1.4 + 200 * away, 1, 1, -0.28 + 0.5 * (1 - tap) - away);
    cc.style.opacity = s > 2.8 && s < 4.25 ? 1 : 0;
    rings.forEach((r, i) => {
      const u = ((s - 3.0 + i * 0.22) % 0.66) / 0.66, vis = s > 3.0 - i * 0.22 && !paid;
      r.style.transform = `scale(${1 + u * 1.5})`; r.style.opacity = vis ? (1 - u) * 0.9 : 0;
    });
    const burst = paid ? prog(pq, 0, 0.5) : 0;
    core.style.background = paid ? '#12B76A' : 'var(--brand)';
    core.style.transform = `scale(${paid ? 1 + kick(pq, 3.6, 6) * 0.3 : 1 + 0.06 * Math.sin(t * 9)})`;
    core.style.boxShadow = paid ? `0 0 0 ${burst * 90}px rgba(18,183,106,${0.35 * (1 - burst)})` : 'none';
    core.querySelector('.i1').style.opacity = paid ? 0 : 1; core.querySelector('.i2').style.opacity = paid ? 1 : 0;
    msg.textContent = paid ? 'Paid ✓' : 'Tap to pay'; msg.style.color = paid ? '#0E9F5B' : '#14110f';
    msg.style.transform = `scale(${paid ? 1 + Math.max(0, kick(pq, 4, 7)) * 0.4 : 1})`;
    // melt: orange ghosts take over each card, run together into the pill
    const pc = [PILL.x + PILL.w / 2, PILL.y + PILL.h / 2];
    gooL.style.opacity = s < M0 ? 0 : 1 - prog(s, LAND + 0.06, LAND + 0.2);
    ghosts.forEach((g, i) => {
      const u = E.inOut(prog(s, M0 + 0.06 + i * 0.05, LAND - 0.12 + i * 0.03)), sag = Math.sin(Math.PI * u);
      const w = lerp(CARD.w, 260, u) * (1 - 0.25 * sag), h = lerp(CARD.h, 190, u) * (1 + 0.9 * sag);
      const x = lerp(CARD.x + CARD.w / 2, pc[0] + (i - 2.5) * 110, u), y = lerp(CARD_TOP(i) + CARD.h / 2, pc[1], u) + sag * 60;
      g.style.cssText = `left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px;border-radius:${lerp(28, 110, Math.min(1, u * 3))}px;opacity:${prog(s, M0, M0 + 0.1)}`;
    });
    const pb = E.out(prog(s, LAND - 0.4, LAND));
    pillBase.style.cssText = `left:${pc[0] - PILL.w / 2 * pb}px;top:${pc[1] - PILL.h / 2 * pb}px;width:${PILL.w * pb}px;height:${PILL.h * pb}px;border-radius:${PILL.h / 2}px`;
    const lq = s - LAND, [px, py] = pop2(lq + 0.05, 3, 0.3);
    pill.style.opacity = prog(lq, -0.06, 0.04);
    T(pill, 0, Math.sin(t * 2.2) * 7, 0.9 + 0.1 * px * (1 + kick(lq, 3, 5) * 0.12), 0.9 + 0.1 * py * (1 - kick(lq, 3, 5) * 0.2), kick(lq, 2.6, 5) * 0.03);
    pillTx.textContent = money(TL.BOOKED * E.out(prog(lq, 0, 0.5)), 2);
    caps.forEach((c, i) => {
      const [sx, sy] = pop2(s - (6.1 + i * 0.25), 3.4, 0.34);
      c.style.transform = `translateY(${(1 - Math.min(1, sx)) * 50}px) rotate(${(1 - spring(s - (6.1 + i * 0.25), 2.6, 0.4)) * (i % 2 ? 0.2 : -0.2)}rad) scale(${sx},${sy})`;
    });
  }
  return { build, update };
})();
