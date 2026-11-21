# NIGHTJAR — A Quiet Heist in Three Nights

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/phan67082/nightjar-quiet-heists/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/phan67082/nightjar-quiet-heists/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

An original top-down stealth game for the make.fun **best-stealth-game-20261121-1759**
bounty. You are the nightjar, a hooded thief. Slip past the wardens, steal the
prize of each night, and leave unseen — three nights, three heists, one quiet
legend.

## The nights

1. **The Ink Archive** — steal the Gilt Ledger from the Meridian Archive.
2. **The Clockwork Gallery** — steal the Brass Nightingale under sweeping cameras.
3. **The Lantern Vault** — steal the Ember Crown past five wardens, cameras and lasers.

## How it plays

- **Vision cones are raycast, not painted triangles.** Cones stop at walls and
  crates, so cover really works — and a cone that wraps around a crate reads
  as honest.
- **Suspicion, not instant failure.** A guard that half-sees you comes to look
  ("WHAT WAS THAT?"); one that fully sees you gives chase. Break line of
  sight and the alarm cools — you always get a chance to recover.
- **Sound you can see.** Sprinting is loud, sneaking is silent, and every
  thrown pebble draws an expanding ring that guards walk toward. Footsteps
  tick louder as a guard closes in, and the HUD shows how far away the
  nearest warden is.
- **Light and shadow.** Lit lamps make you easy to spot. Press **E** beside a
  lamp to douse it and make your own pool of shadow. Hedges hide you when you
  crouch or sneak inside them.
- **Ghost bonus.** Finish a night without ever being spotted for +300 points.

## Controls

| Key | Action |
| --- | ------ |
| WASD / arrows | Move |
| Shift | Sneak (slow, silent) |
| Space | Sprint (fast, loud) |
| C | Crouch (harder to see) |
| Q / click | Throw a pebble — lure guards to the ring |
| E | Douse a nearby lamp |
| R | Retry the night |
| Esc | Pause |
| M | Mute |

## Play it

No build step, no network, no libraries. Serve `game/` with any static server
and open `game/index.html` in a desktop browser:

```sh
cd game && python3 -m http.server 8123
# open http://localhost:8123/index.html
```

Or open `game/index.html` directly from disk — everything it loads is a file
under `game/`. All sounds are synthesized with WebAudio; there are no audio
files and no external requests.

## Layout

```
main.ts                 hands the entry in (copies game/ + screenshots/, writes dossier.json)
vendor/makefun-game.ts  the kit's dossier library, unchanged
game/index.html         the playable game
game/src/config.js      every tunable number
game/src/levels.js      the three nights: maps, patrols, cameras, lasers
game/src/vision.js      raycast cones and line of sight
game/src/guards.js      warden patrol / suspicion / search / chase AI + cameras
game/src/player.js      the thief: movement, stances, pebbles, lamp dousing
game/src/noise.js       visible sound rings guards hear and investigate
game/src/audio.js       synthesized footsteps, chimes, alarm stings (WebAudio)
game/src/render.js      everything drawn: level, cones, HUD, banners, overlays
game/src/input.js       keyboard and mouse
game/src/shots.js       the four staged screenshot moments
game/src/main.js        screens, the update loop, detection, pickups, the exit
screenshots/           four real renders of the game's own code
```

## The screenshots

Four real renders of the game's own code in a desktop browser
(`?shot=` stages one frozen, honest moment per frame — no compositing):

1. `1-cover.jpg` — Night 1 mid-heist: the thief hidden in a hedge, a warden's
   cone sweeping past, another warden turning toward a pebble's ring, the
   Gilt Ledger glowing and the exit waiting below.
2. `2-alarm.jpg` — the near miss: **SPOTTED!**, two wardens chasing, the
   thief sprinting for the dark with a footstep ring at her feet.
3. `3-gallery.jpg` — Night 2: the Brass Nightingale under a sweeping camera,
   the thief crouched behind a crate.
4. `4-exit.jpg` — the payoff: the Gilt Ledger taken, **EXIT UNLOCKED ·
   EXTRACT**, ghost bonus within reach.

## Play-tested

Played in headless Chromium (Playwright) with real keyboard input: movement,
crouch, pebble throws, suspicion rising 0 → 100 in a cone, SPOTTED → chase →
caught → respawn with a strike, recovery from SUSPICIOUS back to CALM when
line of sight breaks, camera exposure rising and falling with its sweep,
objective pickup unlocking the exit, and level completion into Night 2.
No console errors, no network requests (the only 404 is the browser's
favicon request).

## License

MIT — see `LICENSE`.
