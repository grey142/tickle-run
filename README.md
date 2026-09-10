# Tickle Run

PG-13 cartoon **3D endless runner** — flee the Tickle Monster through a cave tunnel maze.  
**Clothing pieces are lives** (shirt → pants → shoes). Built with **Vite + Three.js + TypeScript**.

## Play

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
| Strafe / lane change | A/D / ←→ / swipe left-right / drag |
| Pause | Esc / P / Pause button |
| Equipment | HUD buttons (Shield / Magnet / Boost) |

Jump and slide each last about **1 action beat** (~0.55s). You cannot jump on waterslides.

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
