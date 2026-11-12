// Builds out/audio.wav entirely in code.
//   node scripts/audio.cjs [path/to/music.mp3]
// - Every sound effect is synthesised here (no samples).
// - Music slot: pass a file, or drop one at assets/music.(mp3|wav|m4a|aac|flac).
//   Its beats are detected, written to out/beats.json, and the picture's cuts
//   and hits are snapped onto them (the page reads the same file).
// - Final mix is levelled to -14 LUFS integrated, true peak <= -1.5 dBTP.
const fs = require('fs'), path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const TL = require('../src/timeline.js');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'out');
const SR = 48000, TARGET = -14, MUSIC_GAIN_DB = -7;
fs.mkdirSync(OUT, { recursive: true });

// ---------- tiny synth toolkit ----------
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return (seed / 4294967296) * 2 - 1; };
const buf = (d) => new Float32Array(Math.ceil(d * SR));
const fill = (d, fn) => { const b = buf(d); for (let i = 0; i < b.length; i++) b[i] = fn(i / SR, i / b.length); return b; };
const TAU = Math.PI * 2;
// phase-accumulating oscillator with time-varying frequency
const osc = (d, freq, shape = Math.sin) => { let ph = 0; return fill(d, (t, u) => { ph += (TAU * freq(t, u)) / SR; return shape(ph); }); };
const sq = (p) => (Math.sin(p) > 0 ? 1 : -1);
const noise = (d) => fill(d, () => rnd());
// state-variable filter, fc may vary over time
function svf(x, fc, q = 0.7, mode = 'bp') {
  let low = 0, band = 0; const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const f = 2 * Math.sin(Math.PI * Math.min(0.24, (typeof fc === 'function' ? fc(i / SR, i / x.length) : fc) / SR));
    low += f * band; const high = x[i] - low - (1 / q) * band; band += f * high;
    y[i] = mode === 'lp' ? low : mode === 'hp' ? high : band;
  }
  return y;
}
const mul = (x, fn) => { for (let i = 0; i < x.length; i++) x[i] *= fn(i / SR, i / x.length); return x; };
const add = (a, b, at = 0, g = 1) => { const o = Math.round(at * SR); for (let i = 0; i < b.length && o + i < a.length; i++) a[o + i] += b[i] * g; return a; };
const decay = (k, atk = 0.002) => (t) => Math.min(1, t / atk) * Math.exp(-t * k);
const xp = (a, b, u) => a * Math.pow(b / a, u);

const SFX = {
  pop: ({ pitch = 1 }) => mul(osc(0.14, (t) => xp(260 * pitch, 820 * pitch, Math.min(1, t / 0.05))), decay(34)),
  tick: ({ pitch = 1 }) => add(mul(osc(0.05, () => 2100 * pitch), decay(130, 0.0005)), mul(svf(noise(0.02), 6000, 1, 'hp'), decay(300, 0.0005)), 0, 0.3),
  clock: () => add(mul(svf(noise(0.08), 3400, 9), decay(110, 0.0005)), mul(osc(0.09, () => 820), decay(80, 0.0005)), 0.004, 0.6),
  slam: () => { const b = mul(osc(0.6, (t) => xp(165, 40, Math.min(1, t / 0.18))), decay(8)); add(b, mul(svf(noise(0.25), 1100, 0.8, 'lp'), decay(26, 0.001)), 0, 0.9); return mul(b, () => 1).map((v) => Math.tanh(v * 2.2) * 0.8); },
  glitch: () => { const b = buf(0.24); let t = 0; while (t < 0.22) { const d = 0.012 + Math.abs(rnd()) * 0.022, k = Math.abs(rnd()); const f = 180 + Math.abs(rnd()) * 2800; const seg = k < 0.45 ? osc(d, () => f, sq) : k < 0.8 ? noise(d) : buf(d); let h = 0; for (let i = 0; i < seg.length; i++) { if (i % 7 === 0) h = seg[i]; seg[i] = h; } add(b, seg, t, 0.5); t += d; } return mul(b, (t2, u) => 1 - u * 0.5); },
  whoosh: ({ down }) => mul(svf(noise(0.42), (t, u) => (down ? xp(3800, 350, u) : xp(350, 3800, u)), 1.6), (t, u) => Math.pow(Math.sin(Math.PI * u), 1.6) * 1.3),
  bite: ({ pitch = 1 }) => { const b = mul(svf(noise(0.2), 1900 * pitch, 1.4), (t) => decay(40, 0.001)(t) * (0.6 + 0.4 * sq(TAU * 95 * t)) * 1.6); add(b, mul(osc(0.2, (t) => xp(210 * pitch, 85, Math.min(1, t / 0.1))), decay(26)), 0, 0.9); add(b, mul(svf(noise(0.05), 4200, 2), decay(120, 0.0005)), 0.045, 0.7); return b; },
  rip: () => mul(svf(noise(0.34), (t, u) => xp(1800, 5200, u), 0.9, 'hp'), (t, u) => (Math.sin(TAU * (120 + 180 * u) * t + 3 * Math.sin(t * 310)) > -0.2 ? 1 : 0.15) * Math.pow(1 - u, 1.2) * 0.9),
  swirl: () => { const b = mul(osc(0.75, (t, u) => xp(380, 1500, u) * (1 + 0.08 * Math.sin(TAU * (8 + 14 * u) * t))), (t, u) => Math.sin(Math.PI * u) ** 1.3 * 0.55); add(b, mul(svf(noise(0.75), (t, u) => xp(600, 4000, u), 2.5), (t, u) => Math.sin(Math.PI * u) * 0.7)); return b; },
  ghost: () => { const f = (t, u) => (560 - 170 * u) * (1 + 0.035 * Math.sin(TAU * 6.5 * t)); const b = mul(osc(0.75, f), (t, u) => Math.sin(Math.PI * u) ** 1.2 * 0.5); add(b, mul(osc(0.75, (t, u) => f(t, u) * 1.5), (t, u) => Math.sin(Math.PI * u) * 0.14)); return b; },
  melt: () => { const b = mul(osc(0.8, (t, u) => xp(440, 105, u) * (1 + 0.06 * Math.sin(TAU * 11 * t))), (t, u) => Math.sin(Math.PI * Math.sqrt(u)) * 0.6); [0.34, 0.5, 0.63].forEach((at, i) => add(b, mul(osc(0.09, (t) => xp(500 + i * 150, 1300 + i * 200, Math.min(1, t / 0.05))), decay(40)), at, 0.5)); return b; },
  shatter: () => { const b = mul(svf(noise(0.5), 5200, 0.8, 'hp'), decay(14, 0.0005)); for (let i = 0; i < 12; i++) add(b, mul(osc(0.16, () => 1800 + Math.abs(rnd()) * 5200), decay(38, 0.0005)), Math.abs(rnd()) * 0.34, 0.3); add(b, mul(osc(0.2, (t) => xp(150, 55, Math.min(1, t / 0.1))), decay(20)), 0, 0.8); return b; },
  sigh: () => mul(svf(noise(0.75), (t, u) => xp(1100, 420, u), 1.1), (t, u) => Math.min(1, t / 0.09) * Math.pow(1 - u, 1.5) * 1.1),
  sparkle: () => { const b = buf(0.6); for (let i = 0; i < 6; i++) add(b, mul(osc(0.35, () => 2300 + Math.abs(rnd()) * 3200), decay(16, 0.001)), i * 0.045, 0.3); return b; },
  bell: () => { const b = buf(1.4); [[1, 1], [2.76, 0.5], [5.4, 0.25]].forEach(([m, g]) => add(b, mul(osc(1.4, () => 587 * m), decay(3.2 * Math.sqrt(m), 0.001)), 0, g * 0.5)); return b; },
  riser: () => { const b = mul(svf(noise(1.2), (t, u) => xp(250, 7000, u * u), 2.2), (t, u) => u * u * 1.5); add(b, mul(osc(1.2, (t, u) => xp(90, 900, u * u), (p) => Math.sin(p) + 0.4 * Math.sin(2 * p)), (t, u) => u * u * 0.45)); return mul(b, (t, u) => (u > 0.985 ? (1 - u) / 0.015 : 1)); },
  snap: () => add(mul(osc(0.16, (t) => xp(2200, 500, Math.min(1, t / 0.06))), decay(48, 0.0005)), mul(svf(noise(0.04), 5000, 1, 'hp'), decay(160, 0.0005)), 0, 0.8),
  nfc: () => { const b = buf(0.7); [0, 0.22, 0.44].forEach((at) => add(b, mul(osc(0.07, () => 1320), (t, u) => Math.sin(Math.PI * u) * 0.5), at)); return b; },
  chime: () => { const b = buf(1.1); [[1318.5, 0], [1760, 0.11]].forEach(([f, at]) => add(b, mul(osc(0.9, () => f, (p) => Math.sin(p) + 0.3 * Math.sin(2 * p)), decay(6, 0.002)), at, 0.5)); return b; },
  register: () => {
    const b = buf(1.9);
    add(b, mul(svf(noise(0.06), 2600, 1.2, 'lp'), decay(70, 0.0005)), 0, 1.1);             // "ka"
    add(b, mul(osc(0.2, (t) => xp(180, 70, Math.min(1, t / 0.08))), decay(22)), 0.03, 0.9);   // drawer thunk
    [[0.085, 1], [0.21, 0.55]].forEach(([at, g]) => [[2093, 1], [3136, 0.7], [4186, 0.45], [5587, 0.25]].forEach(([f, pg]) =>
      add(b, mul(osc(1.6, () => f), (t) => decay(3.4 + f / 2500, 0.001)(t) * (1 + 0.15 * Math.sin(TAU * 9 * t))), at, g * pg * 0.42)));   // "ching"
    for (let i = 0; i < 7; i++) add(b, mul(osc(0.12, () => 5200 + Math.abs(rnd()) * 3200), decay(45, 0.0005)), 0.28 + Math.abs(rnd()) * 0.35, 0.14); // coins
    return b;
  },
};

// ---------- beat detection (fixed-tempo grid) ----------
function detectBeats(file) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', '11025', '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error('ffmpeg could not decode ' + file + '\n' + r.stderr);
  const x = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length >> 2), sr = 11025, hop = 128, win = 512;
  const n = Math.floor((x.length - win) / hop); if (n < 200) throw new Error('music too short to analyse');
  const env = new Float32Array(n); let prev = 0, lp = 0;
  const low = new Float32Array(x.length); for (let i = 0; i < x.length; i++) { lp += 0.09 * (x[i] - lp); low[i] = lp; }   // ~160 Hz emphasis
  for (let k = 0; k < n; k++) { let e = 0, el = 0; for (let i = 0; i < win; i++) { const v = x[k * hop + i], w = low[k * hop + i]; e += v * v; el += w * w; } const l = Math.log(1e-7 + e + 4 * el); env[k] = Math.max(0, l - prev); prev = l; }
  const fps = sr / hop; let best = 0, bestLag = 0;
  for (let bpm = 70; bpm <= 180; bpm += 0.25) { const lag = (60 / bpm) * fps; let s = 0; for (let k = 0; k + lag * 4 < n; k++) { const a = env[k]; if (a) s += a * (env[Math.round(k + lag)] + 0.5 * env[Math.round(k + 2 * lag)] + 0.25 * env[Math.round(k + 4 * lag)]); } s *= Math.exp(-0.5 * Math.pow(Math.log2(bpm / 118) / 0.9, 2)); if (s > best) { best = s; bestLag = lag; } }
  let bp = 0, bph = 0; for (let ph = 0; ph < bestLag; ph += 0.5) { let s = 0; for (let k = ph; k < n; k += bestLag) s += env[Math.round(k)] || 0; if (s > bp) { bp = s; bph = ph; } }
  const beats = []; for (let k = bph; k < n; k += bestLag) beats.push(+(k / fps).toFixed(4));
  return { bpm: +(60 / (bestLag / fps)).toFixed(2), beats };
}

// ---------- loudness ----------
function measure(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const tail = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  return { I: parseFloat(/I:\s+(-?[\d.]+) LUFS/.exec(tail)[1]), TP: parseFloat(/Peak:\s+(-?[\d.]+) dBFS/.exec(tail)[1]) };
}
function writeWav(file, L, R) {
  const n = L.length, b = Buffer.alloc(44 + n * 8);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(3, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 8, 28); b.writeUInt16LE(8, 32); b.writeUInt16LE(32, 34); b.write('data', 36); b.writeUInt32LE(n * 8, 40);
  for (let i = 0; i < n; i++) { b.writeFloatLE(L[i], 44 + i * 8); b.writeFloatLE(R[i], 48 + i * 8); }
  fs.writeFileSync(file, b);
}

// ---------- build ----------
const arg = process.argv[2];
const music = arg ? path.resolve(arg) : ['mp3', 'wav', 'm4a', 'aac', 'flac'].map((e) => path.join(ROOT, 'assets', 'music.' + e)).find((f) => fs.existsSync(f));
const beatsFile = path.join(OUT, 'beats.json');
let beats = null;
if (music) { beats = detectBeats(music); fs.writeFileSync(beatsFile, JSON.stringify({ source: path.basename(music), ...beats })); console.log(`music: ${path.basename(music)}  ~${beats.bpm} BPM, ${beats.beats.length} beats -> cuts snapped`); }
else { if (fs.existsSync(beatsFile)) fs.unlinkSync(beatsFile); console.log('music: none (slot empty) - SFX only'); }
const warp = TL.makeWarp(beats && beats.beats), DUR = warp.duration;

const L = buf(DUR), R = buf(DUR);
const cues = TL.cues();
cues.forEach((c, i) => {
  if (!SFX[c.type]) throw new Error('no synth for cue ' + c.type);
  seed = 1000 + i * 7919;
  const s = SFX[c.type](c), pan = Math.sin(i * 2.399) * 0.35, at = warp.toReal(c.t);
  add(L, s, at, c.gain * 0.5 * Math.cos(((pan + 1) * Math.PI) / 4) * 1.4);
  add(R, s, at, c.gain * 0.5 * Math.sin(((pan + 1) * Math.PI) / 4) * 1.4);
});
for (let i = 0; i < L.length; i++) { L[i] = Math.tanh(L[i] * 1.3) / 1.3; R[i] = Math.tanh(R[i] * 1.3) / 1.3; }
const sfx = path.join(OUT, 'sfx.wav'), pre = path.join(OUT, 'premix.wav'), final = path.join(OUT, 'audio.wav');
writeWav(sfx, L, R);
// voiceover slot: assets/vo/cues.json places clips cut from one recorded take
const voCues = path.join(ROOT, 'assets/vo/cues.json'), vo = path.join(OUT, 'vo.wav');
let hasVo = false;
if (fs.existsSync(voCues) && !process.argv.includes('--no-vo')) {
  const j = JSON.parse(fs.readFileSync(voCues, 'utf8')), take = path.join(ROOT, 'assets/vo', j.file), PAD = 0.04;
  if (fs.existsSync(take)) {
    const parts = j.clips.map((c, i) => `[0:a]atrim=${(c.from - PAD).toFixed(3)}:${(c.to + PAD).toFixed(3)},asetpts=PTS-STARTPTS,atempo=${c.tempo || 1},afade=t=in:d=0.02,areverse,afade=t=in:d=0.03,areverse,aresample=${SR},adelay=${Math.round(warp.toReal(c.at) * 1000)}:all=1[v${i}]`);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', take, '-filter_complex',
      `${parts.join(';')};${j.clips.map((_, i) => `[v${i}]`).join('')}amix=inputs=${j.clips.length}:normalize=0,highpass=f=80,apad=whole_dur=${DUR},atrim=0:${DUR},aformat=channel_layouts=stereo[o]`, '-map', '[o]', '-c:a', 'pcm_f32le', vo]);
    hasVo = true; console.log(`voiceover: ${j.clips.length} clips from ${j.file}`);
  }
}
// mix: voice on top, effects duck under it, music sits lowest
const ins = ['-i', sfx], fc = []; let n = 1, bus = '[0:a]';
if (hasVo) { ins.push('-i', vo); fc.push(`[${n}:a]volume=7dB,asplit[vk][vm]`, `[0:a]volume=-3dB[s0]`, `[s0][vk]sidechaincompress=threshold=0.03:ratio=5:attack=15:release=250[sd]`); bus = '[sd][vm]'; n++; }
if (music) { ins.push('-i', music); fc.push(`[${n}:a]aresample=${SR},atrim=0:${DUR},volume=${MUSIC_GAIN_DB - (hasVo ? 4 : 0)}dB,afade=t=in:d=0.03,afade=t=out:st=${(DUR - 0.7).toFixed(3)}:d=0.7[m]`); bus += '[m]'; n++; }
if (n === 1) fs.copyFileSync(sfx, pre);
else execFileSync('ffmpeg', ['-y', '-v', 'error', ...ins, '-filter_complex', `${fc.join(';')};${bus}amix=inputs=${(bus.match(/\[/g) || []).length}:normalize=0:duration=first[o]`, '-map', '[o]', '-c:a', 'pcm_f32le', pre]);

// static gain to target, brick-wall limit, re-measure, correct (no pumping)
let gain = TARGET - measure(pre).I, m;
for (let pass = 0; pass < 4; pass++) {
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', pre, '-af', `apad=whole_dur=${DUR},lowpass=f=17000,volume=${gain.toFixed(2)}dB,aresample=192000,alimiter=limit=0.6:attack=3:release=60:level=false,aresample=${SR}`, '-t', DUR.toFixed(4), '-c:a', 'pcm_s24le', final]);
  m = measure(final); if (Math.abs(m.I - TARGET) < 0.15) break; gain += TARGET - m.I;
}
console.log(`audio: ${cues.length} SFX cues, ${DUR.toFixed(2)}s -> out/audio.wav  ${m.I.toFixed(1)} LUFS, peak ${m.TP.toFixed(1)} dBTP`);
