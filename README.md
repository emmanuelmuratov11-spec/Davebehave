# Vertical ad, rendered from code

A 9:16 ad (1080×1920, 30 fps, 36 s) for a field-service CRM. No stock footage, no video
generators: one HTML page with a `seek(t)` function, captured frame by frame with Playwright
and encoded with ffmpeg. Every sound effect is synthesised in `scripts/audio.cjs`.

## Make it yours

Edit `brand.json` (name, URL, brand colour), then:

```
npm run build      # audio + all frames + out/final.mp4
```

| Command | What it does |
| --- | --- |
| `npm run preview` | Serves the page at http://127.0.0.1:5173/src/index.html with play + scrub |
| `npm run stills` | One PNG per scene into `out/stills/` (pass times to pick your own) |
| `npm run audio` | Rebuilds `out/audio.wav` (SFX, plus music if present) |
| `npm run render` | Renders every frame and muxes `out/final.mp4` |
| `npm run remux` | Swaps new audio into the existing video without re-rendering |

Needs Node 18+, ffmpeg, and Playwright with Chromium (`npm i && npx playwright install chromium`).

## Music slot

Drop a track at `assets/music.mp3` (or run `node scripts/audio.cjs path/to/track.mp3`), then
`npm run build`. The script detects the tempo and beat grid, writes `out/beats.json`, and the
cuts and big hits snap to the nearest beat (the video length shifts by a fraction of a second
to end on a beat). Music sits 7 dB under the effects; the mix is levelled to −14 LUFS.
Because the picture timing changes, music needs a full `build`, not just `remux`.

## How it stays stutter-free

`seek(t)` redraws the whole frame from `t` alone: no timers, no `Math.random()`, no state
carried between frames. Frames are rendered out of order across parallel pages and still match.

## Where things live

- `src/timeline.js`: cut times, the money maths, the SFX cue sheet, beat warping. The build
  fails if the jobs do not sum to the booked total or the leaks do not leave the paid amount.
- `src/scenes.js`, `src/characters.js`, `src/lib.js`: canvas scenes, cartoon cast, glossy goo.
- `src/ui.js` + CSS in `src/index.html`: the product UI scene, in real HTML.
- `assets/fonts`: Inter and Instrument Serif (both SIL Open Font License).

## Voiceover slot

`assets/vo/take.mp3` is one recorded take of the script; `assets/vo/cues.json` cuts it into
lines and says when each one starts. Edit the times (or swap in a new take and update the
`from`/`to` marks), then `npm run audio && npm run remux`. The effects duck under the voice.
`node scripts/audio.cjs --no-vo` builds the mix without it.

## 16:10 landscape version

`npm run render:wide` renders `out/final-16x10.mp4` (1920×1200) from the same scenes and the
same audio. Scenes are authored in portrait coordinates; the `LAY` table at the top of
`src/scenes.js` (and `L` in `src/ui.js`) re-places each group of elements for the wide frame.
`node scripts/stills.cjs --wide` gives wide stills.
