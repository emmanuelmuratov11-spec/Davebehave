// One still per scene (or custom times): node scripts/stills.cjs [t1 t2 ...]
// Times are storyboard ("base") seconds. Writes out/stills/*.png + a contact sheet.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const { serve, ROOT } = require('./serve.cjs');
const DEFAULT = [2.6, 3.5, 4.5, 6.3, 7.45, 8.7, 9.5, 11.05, 13.1, 15.3, 17.1, 19.2, 20.4, 23.2, 24.7, 25.6, 28.3, 29.9, 31.0, 32.8, 35.2];
(async () => {
  const times = process.argv.slice(2).filter((a) => !a.startsWith('-')).map(Number);
  const list = times.length ? times : DEFAULT;
  const out = path.join(ROOT, 'out/stills'); fs.mkdirSync(out, { recursive: true });
  if (!times.length) for (const f of fs.readdirSync(out)) fs.unlinkSync(path.join(out, f));
  const { srv, url } = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()));
  await page.goto(url + '?render&nobeats'); await page.waitForFunction('window.ready === true');
  const files = [];
  for (const t of list) {
    await page.evaluate((x) => window.seekBase(x), t);
    const f = path.join(out, `t${t.toFixed(2).padStart(5, '0')}.png`);
    await page.screenshot({ path: f }); files.push(f);
  }
  await browser.close(); srv.close();
  if (!times.length || process.argv.includes('--sheet')) {
    const cols = 7, rows = Math.ceil(files.length / cols);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', path.join(out, 't*.png'), '-vf', `scale=270:480,tile=${cols}x${rows}:padding=6:color=0x222222`, '-frames:v', '1', path.join(out, 'sheet.png')]);
  }
  console.log('stills:', files.length, '->', out);
})();
