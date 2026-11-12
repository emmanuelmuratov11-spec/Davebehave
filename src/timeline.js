// Shared by the browser (render) and Node (audio). Everything is authored in
// "base time" (the storyboard seconds). If a music track is supplied, the
// anchors below are snapped to its beats and base time is warped piecewise-
// linearly so every cut and hit lands on a beat. Scenes never know.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TL = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const FPS = 30;
  const BASE_DUR = 36;

  // Scene cuts (base seconds)
  const CUTS = [0, 3, 5, 9, 10, 18, 21, 24, 26, 33, 36];

  // The money maths. Every number on screen comes from here.
  const BOOKED = 2400;
  const LEAKS = [
    { label: 'No-shows ate', amt: 400 },
    { label: 'Unpaid invoices took', amt: 650 },
    { label: 'Forgot to follow up', amt: 300 },
    { label: 'And the double-booking?', amt: 150 },
  ];
  const PAID = BOOKED - LEAKS.reduce((s, l) => s + l.amt, 0); // 900
  const JOBS = [
    { time: '9:00', title: 'AC tune-up', client: 'M. Alvarez', price: 280 },
    { time: '11:30', title: 'Full detail', client: 'J. Park', price: 350 },
    { time: '1:00', title: 'Deep clean', client: 'The Okafors', price: 420 },
    { time: '2:30', title: 'Furnace repair', client: 'D. Whitman', price: 640 },
    { time: '4:00', title: 'Ceramic coat', client: 'S. Romano', price: 520 },
    { time: '5:30', title: 'Duct cleaning', client: 'L. Nguyen', price: 190 },
  ];
  const jobSum = JOBS.reduce((s, j) => s + j.price, 0);
  if (jobSum !== BOOKED) throw new Error('Jobs sum to ' + jobSum + ', not ' + BOOKED);
  if (PAID !== 900) throw new Error('Leaks do not leave $900');

  // Key hits (base seconds). Used for SFX and as beat-snap anchors.
  const HIT = {
    slam: 3.0,          // LYING.
    shatter: 4.25,
    bites: [10.95, 12.85, 14.9, 16.85],
    time: 19.75,        // 11:47 PM
    logo: 25.2,
    paid: 29.75,        // tap to pay -> Paid
    payoff: 31.45,      // big pill lands
  };

  const ANCHORS = [...CUTS, HIT.bites[0], HIT.bites[1], HIT.bites[2], HIT.bites[3], HIT.time, HIT.logo, HIT.payoff]
    .sort((a, b) => a - b);

  // SFX cue sheet (base seconds). audio.cjs synthesises each one.
  function cues() {
    const c = [];
    const add = (t, type, gain = 1, p = {}) => c.push({ t, type, gain, ...p });
    // 1 calendar
    add(0.15, 'pop', 0.8, { pitch: 0.9 }); add(0.38, 'pop', 0.8, { pitch: 1.1 });
    add(0.75, 'whoosh', 0.5); add(0.95, 'pop', 1, { pitch: 0.7 });
    for (let i = 0; i < 9; i++) add(1.25 + i * 0.07, 'tick', 0.35, { pitch: 1 + i * 0.05 });
    add(2.3, 'pop', 0.6, { pitch: 1.3 });
    // 2 lying
    add(HIT.slam, 'slam', 1.2); add(HIT.slam, 'glitch', 1); add(3.32, 'glitch', 0.5);
    add(3.6, 'pop', 0.7, { pitch: 0.8 });
    add(HIT.shatter, 'shatter', 1); add(4.6, 'whoosh', 0.4, { down: true });
    // 3 booked vs paid
    add(5.05, 'pop', 0.7); add(5.4, 'pop', 1.1, { pitch: 0.6 }); add(5.7, 'sparkle', 0.5);
    add(6.7, 'glitch', 0.45); add(6.75, 'pop', 0.7, { pitch: 1.2 });
    add(6.95, 'melt', 1); add(7.75, 'pop', 0.9, { pitch: 1.5 }); add(8.3, 'sigh', 0.9);
    // 4 question
    add(9.0, 'whoosh', 0.6); add(9.12, 'pop', 1, { pitch: 0.8 }); add(9.72, 'whoosh', 0.45, { down: true });
    // 5 leaks
    add(10.0, 'pop', 1, { pitch: 0.6 });
    add(10.3, 'whoosh', 0.5); add(HIT.bites[0], 'bite', 1.2); add(11.3, 'bite', 0.4); add(11.5, 'bite', 0.35);
    add(12.1, 'whoosh', 0.6); add(HIT.bites[1], 'rip', 1); add(13.0, 'swirl', 0.9);
    add(14.1, 'ghost', 0.8); add(HIT.bites[2], 'bite', 0.9, { pitch: 1.3 }); add(15.2, 'ghost', 0.6);
    add(16.45, 'whoosh', 0.7); add(HIT.bites[3], 'slam', 1); add(HIT.bites[3] + 0.03, 'bite', 0.7);
    for (let k = 0; k < 4; k++) for (let i = 0; i < 6; i++) add(HIT.bites[k] + 0.08 + i * 0.07, 'tick', 0.3, { pitch: 1.5 - i * 0.07 });
    add(17.5, 'sigh', 0.6);
    // 6 11:47
    add(18.0, 'slam', 0.6); add(18.1, 'pop', 0.6, { pitch: 0.8 });
    for (let i = 0; i < 9; i++) add(18.55 + 1.1 * (1 - Math.pow(1 - i / 9, 1.8)), 'clock', 0.7 + i * 0.03);
    add(HIT.time, 'slam', 1.2); add(HIT.time, 'bell', 0.7);
    add(20.25, 'clock', 0.8); add(20.75, 'clock', 0.8);
    // 7 six apps
    add(21.0, 'slam', 0.8);
    for (let i = 0; i < 6; i++) add(21.25 + i * 0.22, 'pop', 0.85, { pitch: 0.75 + i * 0.12 });
    add(22.75, 'pop', 0.9, { pitch: 0.6 }); add(22.75, 'glitch', 0.4);
    // 8 snap
    add(24.0, 'riser', 1); add(HIT.logo, 'slam', 1.1); add(HIT.logo, 'snap', 1); add(25.55, 'sparkle', 0.5);
    // 9 product
    add(26.0, 'whoosh', 0.7); add(26.1, 'pop', 0.8, { pitch: 0.7 });
    for (let i = 0; i < 6; i++) add(26.45 + i * 0.16, 'pop', 0.55, { pitch: 1 + i * 0.08 });
    add(27.1, 'pop', 0.9, { pitch: 0.9 }); add(27.6, 'pop', 0.9, { pitch: 1.0 }); add(28.1, 'pop', 0.9, { pitch: 1.12 });
    add(28.45, 'whoosh', 0.55); add(29.05, 'nfc', 0.9); add(HIT.paid, 'chime', 1);
    for (let i = 0; i < 6; i++) add(29.95 + i * 0.1, 'tick', 0.4, { pitch: 1 + i * 0.1 });
    add(30.6, 'melt', 0.9); add(HIT.payoff - 0.12, 'whoosh', 0.5);
    add(HIT.payoff, 'register', 1.3); add(HIT.payoff, 'slam', 0.7);
    add(32.1, 'pop', 0.9, { pitch: 0.8 }); add(32.35, 'pop', 0.9, { pitch: 0.95 }); add(32.6, 'pop', 1, { pitch: 1.2 });
    // 10 end card
    add(33.0, 'slam', 0.9); add(33.05, 'snap', 0.7); add(33.6, 'pop', 0.7); add(34.2, 'pop', 0.9, { pitch: 1.3 });
    add(34.25, 'sparkle', 0.5);
    return c.sort((a, b) => a.t - b.t);
  }

  // ---- beat warp -----------------------------------------------------------
  // beats: sorted array of beat times (seconds) from the music, or null.
  function makeWarp(beats) {
    let real = ANCHORS.slice();
    if (beats && beats.length > 4) {
      const period = (beats[beats.length - 1] - beats[0]) / (beats.length - 1);
      const nearest = (t) => {
        let best = beats[0];
        for (const b of beats) if (Math.abs(b - t) < Math.abs(best - t)) best = b;
        // extend the grid past the last detected beat
        if (t > beats[beats.length - 1]) best = beats[beats.length - 1] + Math.round((t - beats[beats.length - 1]) / period) * period;
        return best;
      };
      let prevB = 0, prevR = 0;
      real = ANCHORS.map((a, i) => {
        if (i === 0) return 0;
        const want = prevR + (a - prevB);          // keep authored spacing
        let r = nearest(want);
        const ratio = (r - prevR) / (a - prevB);
        if (ratio < 0.72 || ratio > 1.38 || r <= prevR) r = want; // don't distort; skip this anchor
        prevB = a; prevR = r;
        return r;
      });
    }
    const seg = (xs, x) => { let i = 0; while (i < xs.length - 2 && x >= xs[i + 1]) i++; return i; };
    const map = (from, to) => (x) => {
      if (x <= from[0]) return to[0] + (x - from[0]);
      const i = seg(from, x);
      return to[i] + ((x - from[i]) / (from[i + 1] - from[i])) * (to[i + 1] - to[i]);
    };
    return { toReal: map(ANCHORS, real), toBase: map(real, ANCHORS), duration: real[real.length - 1], anchors: real };
  }

  return { FPS, BASE_DUR, CUTS, BOOKED, LEAKS, PAID, JOBS, HIT, ANCHORS, cues, makeWarp };
});
