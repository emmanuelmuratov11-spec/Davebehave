// Renders every frame with seek(frame / fps) in headless Chromium, then encodes
// with ffmpeg and muxes out/audio.wav -> out/final.mp4.
//   node scripts/render.cjs [--workers 4] [--keep-frames]
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const { serve, ROOT } = require('./serve.cjs');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const OUT = path.join(ROOT, 'out'), FR = path.join(OUT, 'frames');
  fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
  const wide = process.argv.includes('--wide'), sfx = wide ? '-16x10' : '';
  const N = +arg('--workers', Math.max(1, Math.min(6, os.cpus().length)));
  const { srv, url } = await serve();
  const browser = await chromium.launch();
  let fps, total, done = 0; const t0 = Date.now();
  const worker = async (k) => {
    const page = await browser.newPage({ viewport: wide ? { width: 1920, height: 1200 } : { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => { console.error('PAGE ERROR', e.message); process.exit(1); });
    await page.goto(url + '?render' + (wide ? '&layout=wide' : '')); await page.waitForFunction('window.ready === true');
    if (k === 0) { fps = await page.evaluate('window.FPS'); total = Math.round((await page.evaluate('window.DURATION')) * fps); }
    return async () => {
      for (let f = k; f < total; f += N) {
        await page.evaluate((t) => window.seek(t), f / fps);
        await page.screenshot({ path: path.join(FR, `f${String(f).padStart(5, '0')}.png`) });
        if (++done % 90 === 0) console.log(`  ${done}/${total} frames  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
      }
      await page.close();
    };
  };
  const runs = []; for (let k = 0; k < N; k++) runs.push(await worker(k));
  console.log(`rendering ${total} frames @ ${fps}fps with ${N} workers`);
  await Promise.all(runs.map((r) => r()));
  await browser.close(); srv.close();
  const audio = path.join(OUT, 'audio.wav'), hasAudio = fs.existsSync(audio);
  if (!hasAudio) console.warn('no out/audio.wav - run `npm run audio` first for sound');
  // video-only master first, so audio can be swapped later without re-rendering
  const master = path.join(OUT, `video${sfx}.mp4`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(fps), '-i', path.join(FR, 'f%05d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(fps),
    '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', master], { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', master, ...(hasAudio ? ['-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000'] : []),
    '-c:v', 'copy', '-movflags', '+faststart', path.join(OUT, `final${sfx}.mp4`)], { stdio: 'inherit' });
  if (!process.argv.includes('--keep-frames')) fs.rmSync(FR, { recursive: true, force: true });
  console.log(`done -> out/final${sfx}.mp4  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
})();
