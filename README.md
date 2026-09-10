# Tickle Run

PG-13 cartoon **3D endless runner** — flee the Tickle Monster through a cave tunnel maze.  
**Clothing pieces are lives** (shirt → pants → shoes). Built with **Vite + Three.js + TypeScript**.

## Play

**Live (phone-friendly):** https://grey142.github.io/tickle-run/

Open that link on your phone (portrait), tap **Enable tilt**, then **Start Run**.  
Add to Home Screen for an app-like shell.

### Local

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

```bash
npm run build
npm run preview
```

## Controls

| Action | Keys / Touch |
|--------|----------------|
| Jump | ↑ / W / Space / swipe up |
| Slide | ↓ / S / C / Ctrl / swipe down |
| Turn / lane dash | A/D / ←→ / swipe left-right |
| Strafe along track | Hold A/D · **tilt phone** · drag (fallback) |
| Pause | Esc / P / Pause button |
| Equipment | HUD buttons (Shield / Magnet / Boost) |

Jump and slide each last about **1 action beat** (~0.55s). You cannot jump on waterslides.

## Playing on phone

Tickle Run is **phone-first** (portrait). Desktop keyboard still works.

1. **Open in a mobile browser** (Safari / Chrome) over HTTPS or localhost.
2. **Add to Home Screen** for a fullscreen app-like shell:
   - iOS Safari: Share → **Add to Home Screen**
   - Android Chrome: menu → **Install app** / **Add to Home screen**
   - Uses `manifest.webmanifest` + icons in `/public`.
3. **Tilt to strafe**: on the title screen tap **Enable tilt** (required on iOS 13+ via `DeviceOrientationEvent.requestPermission()`). Neutral angle is calibrated when a run starts. If permission is denied, **drag** horizontally to strafe instead.
4. **Swipe**: ↑ jump · ↓ slide · ←→ turn. Equipment and Pause sit in the thumb zone and use `data-ui` so they don’t steal gameplay swipes.
5. If the phone is landscape on a short screen, a light **rotate to portrait** overlay appears.
6. Safe-area insets, larger tap targets (~44px), and a capped pixel ratio keep HUD readable and playable on mid-range devices.

## Clothing & chase rules

- Start **fully clothed (3/3)**. Lose clothing only from traps / catches / fall-off.
- Avatar clothing and the cinematic overlay stay in sync.
- **Tickle Monster**
  - **Caught-up phase:** visible behind you for **60s**.
  - Hit an **obstacle** while caught-up → **monster catch**.
  - Hit a **trap** while caught-up → **dual tickle**.
- **Monster catch**
  - Full clothing (3/3): lose **2** pieces, harsh tickle cinematic, escape, keep running.
  - Less than full: lose the rest → **game over**.
- **Trap hit**
  - Tickle cinematic, lose **1** clothing, monster catches up.
  - Dual tickle: full life → lose **all** clothing and escape; otherwise game over.
- After trap/release interruptions: **3s countdown** before resume.
- **Fall off** a narrow floor → instant game-over tickle.
- **Shield** blocks one hit; **Boost** ignores hazards while active.

## Score & gems

- Speed ≈ **4 steps/sec**. Meters/step: 0.5 → 0.8@200m → 1.3@300m → 1.8@500m → 2.0@800m → 2.11@1000m.
- Score: **1 point per 2 meters** with distance multipliers.
- Game over payout: `gemsFromScore = points * 0.006 + collected gems`.

Collect red **feather gems**, clothing restores, mega clothing, green **escape gem** (revive once), and mega gems (+200).


## Maze

Never-ending **3-level cave**: **upper** / **middle** / **lower**, linked by transitions (no dead-end stop walls).

| Feature | Behavior |
|---------|----------|
| **Levels** | Upper is brighter with hanging roots; middle is the standard tunnel; lower is darker and wet. Scenery (materials, props) changes with the level you are on. |
| **Floor height** | Continuous `floorY` along the track. Middle ≈ 0; upper higher; lower lower. The runner’s Y follows the floor underfoot. |
| **Ramps up** | Inclined segments raise `floorY` over their length. After a ramp you stay on the new level until the next transition. |
| **Waterslides** | Inclined down; forced slide pose; **no jump**; slide-only obstacles/hazards. `floorY` drops over the segment, then persists on the lower level. |
| **Curves** | `curveLeft` / `curveRight` bend the path with angled walls and floor chevrons. Swipe/press **left** or **right** in the turn window. Miss → wall bump / monster catch-up. |
| **Narrow lanes** | 1–2 lane stretches still work; gems only on remaining lanes; falling off the floor is still game over. |
| **Sequencing** | Prefers a stretch on one level, then a ramp or slide to change. Difficulty (narrows, curves, obstacles) ramps with distance. Spawn buffer ahead; cull behind. |

## Store

Between runs, spend gems on **Shield**, **Gem Magnet**, **Boost**, **Escape Gem**, and unlock **adventurers**.  
Progress is saved in `localStorage` (`tickle-run-save-v1`).

## How to add content

### New adventurer

Edit `src/catalogs/adventurers.ts` — add an `AdventurerDef` with `id`, colors, `unlockCost`, and optional `speedBonus`. It appears in the store automatically.

### New trap

1. Add a key to `TrapKind` in `src/game/types.ts`.
2. Register it in `src/catalogs/traps.ts`.
3. Add a mesh branch in `makeTrapMesh` (`src/utils/meshes.ts`).
4. Track generator already samples `TRAP_LIST`.

### New obstacle

1. Add a key to `HazardKind` in `src/game/types.ts`.
2. Register in `src/catalogs/obstacles.ts` (`avoid`, `onSlide`, size).
3. Add mesh in `makeObstacleMesh`.
4. Generator uses `OBSTACLE_LIST` with slide filtering.

## Architecture

```
src/
  main.ts                 Entry
  game/                   Types, Input, Game loop
  player/                 Runner + clothing
  chase/                  Tickle Monster catch-up
  track/                  Procedural segments + entities
  catalogs/               Adventurers, traps, obstacles, creatures
  equipment/ economy/     Store, save, cooldowns
  cinematics/ ui/         Overlay + screens
  utils/meshes.ts         Low-poly Three.js meshes
```

## License

MIT — fan/playable prototype. Keep it PG-13.
