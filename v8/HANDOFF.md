# Baqla Arena v8 Handoff

Saved: 2026-05-15 23:10 +04:00

## Current State

- Repo: `C:\Users\chime\Documents\Codex\2026-05-15\do-you-have-access-in-my\baqla-arena-v7`
- GitHub: `https://github.com/baqlagames/baqla-arena-v7`
- Branch: `v8-modular-foundation`
- Latest commit before this handoff note: `58a5c20 Extract v8 enemy spawn setup`
- v8 app entry: `v8/index.html`
- v8 code folder: `v8/src`
- Stable v7 root `index.html` has been kept untouched during the v8 work.
- Dropbox current v8 copy target: `C:\Users\chime\Dropbox\BaqlaGamesVault\BaqlaArena-v8-current`

## What Was Completed

- Created and continued the v8 modular foundation beside v7.
- Removed v8 dead scope: multiplayer/co-op leftovers, Talents, and legacy card queue/cooldown paths.
- Split render/UI helpers:
  - render primitives, effects, health bars, grid, arena/castle helpers, battle controls/topbar, reports/results.
- Split combat/stat/report helpers:
  - combat stats, combat reports, death handling, absorbs, healing, protection, targeting, projectiles, VFX, status effects.
- Split unit upkeep/tick systems:
  - action timers, branch ticks, signature timers/ticks, companion ticks, healer aura ticks, hunter ticks, warlock ticks, priest ticks, Habaq ticks, Rumman ticks, Alibaba ticks, Zayt/Bakdounes ticks, plague/Jazar ticks.
- Split major on-hit proc blocks:
  - early on-hit procs
  - Zayt on-hit procs
  - Jazar on-hit procs
  - Alibaba on-hit procs
  - Naana/Foul/Felfel on-hit procs
  - Jafaar on-hit procs
  - Zaatar on-hit procs
- Split squad action orchestration:
  - placement, upgrade, sell wrapper flow
  - level-up VFX moved out of `arena-runtime.js`
- Split normal enemy spawn setup:
  - warmup constants and warmup spawn tuning
  - enemy HP/damage scaling
  - early pressure tuning
  - wave mechanic application hook
  - non-arena swarm replication

## Latest Commits To Remember

```text
58a5c20 Extract v8 enemy spawn setup
a13118d Extract v8 squad runtime actions
8efeab6 Extract v8 Zaatar on-hit procs
c03774f Extract v8 Jafaar on-hit procs
b20edf2 Extract v8 Naana Foul Felfel on-hit procs
018b202 Extract v8 Alibaba on-hit procs
a0a5b7c Extract v8 Jazar on-hit procs
3e69729 Extract v8 Zayt on-hit procs
aa4ad31 Extract v8 early on-hit procs
```

## Verification Done Repeatedly

- `node --check` for all files under `v8/src`.
- Cleanup search stayed clean for old names/scope:
  - no `v6_`, `V6_`, `v7_`, `V7_`
  - no multiplayer/co-op/lobby/partner/sharedCastle text
  - no Talent state/defs/ranks/points
  - no old card queue/cooldown names
- Browser smoke tests through:
  - menu
  - campaign
  - stage brief
  - battle screen
  - Start Wave
  - enemy spawning
  - placement picker
  - unit placement
  - manage panel upgrade
- Root v7 files checked untouched:
  - `index.html`
  - `README.md`
  - `CHANGELOG.md`

## Important Design Rules

- Keep v7 root as the stable reference.
- Keep v8 single-player for now.
- No Perks, Beans, rewarded ads, or new balance work until modular foundation is stable.
- No build step; keep browser-native ES modules.
- Keep data/core/systems/render/ui dependency direction clean.
- Continue behavior-preserving extractions first.

## Remaining Big Chunks

- Boss spawning setup:
  - `spawnBossById`
  - barrier boss setup
  - aerial boss setup
  - lieutenants
  - boss support/escort spawn glue
- Boss update mechanics:
  - barrier boss
  - aerial boss
  - lieutenants
  - rift mechanics
  - boss abilities and phase logic
- Remaining render/sprite code:
  - sprite loading
  - unit sprite helpers
  - accessories
  - large unit/enemy draw functions
- Remaining UI screens:
  - manage panel
  - codex
  - screen/click routing
  - battle screen glue
- GameState migration:
  - many globals still live inside `arena-runtime.js`
  - later move them into `GameState` or focused state objects

## Suggested Next Step

Next big pass should be boss spawning setup, but keep it split from boss update mechanics:

1. Create a boss spawn module.
2. Move `spawnBossById`, `spawnBossForStage`, `arena_bossVisibleTop`, `arena_clampTopSpawnBossToVisibleArena`, and `arena_buildLieutenantsFor` if dependencies stay clean.
3. Keep boss update/ability logic for a later pass.
4. Verify Stage 3/normal wave and one boss stage after the extraction.

## Resume Commands

```powershell
cd C:\Users\chime\Documents\Codex\2026-05-15\do-you-have-access-in-my\baqla-arena-v7
git status
git checkout v8-modular-foundation
git pull
```

Then run or serve v8:

```powershell
python -m http.server 8088
```

Open:

```text
http://127.0.0.1:8088/v8/
```
