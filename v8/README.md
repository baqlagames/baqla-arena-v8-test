# Baqla Arena v8 Modular Foundation

This folder is the v8 single-player mobile foundation. It is intentionally separate from the v7 root build so v7 remains the stable playable backup while v8 is cleaned and modularized.

## Run

From the repository root:

```powershell
python -m http.server 8080
```

Open:

```text
http://localhost:8080/v8/
```

Opening `v8/index.html` directly also works for the current asset layout.

## Smoke Checks

From the repository root, run the upgrade-path renderer smoke before touching unit upgrade, branch, spec, or actor drawing code:

```powershell
node v8/scripts/smoke-unit-upgrade-paths.mjs
```

It constructs every direct unit branch and every role-root path, upgrades them through the runtime squad flow, respawns the matching units/minions, and draws them through the actor renderer to catch missing render dependencies.

For a real canvas-click route through root pick, spec/path pick, and battle upgrades on the highest-risk role paths:

```powershell
node v8/scripts/playtest-upgrade-paths.mjs
```

This opens a temporary headless Edge session against a local v8 server and clicks through Hunter, Rumman, Naana, Bakdounes, and Habaq upgrade paths to the current max level.

For boss mechanics stabilization after touching boss spawn, phases, barriers, aerial logic, or boss abilities:

```powershell
node v8/scripts/smoke-boss-mechanics.mjs
```

It spawns every authored boss, forces phase gates, purifies the barrier boss, lands the aerial boss after lieutenants die, and breaks royal carapace shields.

For boss renderer work after touching actor, enemy, or boss sprite drawing:

```powershell
node v8/scripts/smoke-boss-renderers.mjs
```

It draws every authored boss body through the actor renderer with a no-op canvas context to catch missing render dependencies.

For normal enemy renderer work after touching enemy silhouettes or art branch routing:

```powershell
node v8/scripts/smoke-enemy-renderers.mjs
```

It draws every authored normal enemy through both Gerban and classic art branches via the actor renderer.

## Migration Status

- v8 HTML/CSS/JS shell has been extracted from the v7 single-file build.
- `src/main.js` is now a small bootstrap that starts `src/systems/arena-runtime.js`.
- Sprite paths are adjusted to load from `../BaqlaGames/BaqlaArena/`.
- Old `v6_`/`v7_` prefixes have been mechanically renamed in v8 source.
- Save key is separated as `baqlaArenaV8` so v8 does not overwrite v7 saves.
- v7 root files are preserved.
- Pure content tables now live in `src/data/`.
- Core helpers now live in `src/core/`.
- Shared button drawing primitives now live in `src/ui/buttons.js`.
- Menu and stage brief drawing now live in `src/ui/menu.js` and `src/ui/stage-brief.js`.
- Campaign stage select drawing now lives in `src/ui/stage-select.js`.
- Deck and spell picker drawing now lives in `src/ui/pickers.js`.
- Victory/defeat screen composition and combat report panel framing now live in `src/ui/results.js`.
- Battle HUD overlay drawing now lives in `src/ui/battle-hud.js`.
- Desktop and mobile battle bottom controls for resources, castle HP, start wave, and active skills now live in `src/ui/battle-controls.js`.
- In-battle unit placement picker layout, cards, scroll hints, and hit rectangles now live in `src/ui/unit-picker.js`.
- Stage objective star panels and animated victory star results now live in `src/ui/stars.js`.
- Battle top stage/round chrome and pause button drawing now live in `src/ui/battle-topbar.js`.
- Encounter bars for purify, lieutenants, boss HP, and boss casting now live in `src/ui/encounter-bars.js`.
- In-battle round report chip drawing now lives in `src/ui/round-report.js`.
- Shared combat report stats-column drawing now lives in `src/ui/stats-column.js`.
- Next-wave threat preview panel drawing now lives in `src/ui/threat-panel.js`.
- Pause menu drawing now lives in `src/ui/pause-menu.js`.
- Codex reference screens for threat tags and armor matrices now live in `src/ui/codex-reference-screens.js`.
- Manage-panel branch/spec card drawing now lives in `src/ui/manage-panel-cards.js`.
- Menu, campaign, picker, and result screen-flow drawing now lives in `src/ui/screen-flow-runtime.js`.
- Canvas text cleanup now lives in `src/render/text.js`.
- HUD canvas primitives now live in `src/render/primitives.js`.
- Transient overlay effects for beams, particles, floating numbers, flash text, and signature banners now live in `src/render/effects.js`.
- Weather particle setup and overlay drawing now live in `src/render/weather.js`.
- Classic arena floor, ambient arena decor, and boss-corner decoration now live in `src/render/arena.js`.
- The battle arena now has a projected 2.5D fortress-board pass in `src/render/arena-25d.js`.
- Build-phase placement grid drawing, including the projected camera variant, now lives in `src/render/grid.js`.
- Player keep/base drawing now lives in `src/render/castle.js`.
- Battle structure rendering for castles, towers, crystal nodes, castle banners, and large HP bars now lives in `src/render/battle-structures.js`.
- Unit, enemy, and large banner health bar drawing now lives in `src/render/health-bars.js`.
- Combat feedback text is compact, close to units, and strips noisy combat suffixes in `src/render/effects.js`.
- Status icon collection and chip drawing now live in `src/render/status-icons.js`.
- Companion/minion placeholder sprites now live in `src/render/companion-sprites.js`.
- Sprite-only specialty overlays now live in `src/render/unit-sprite-overlays.js`.
- Boss-specific body renderers now live in `src/render/boss-sprites.js`.
- Normal enemy and Gerban brood vehicle body renderers now live in `src/render/enemy-sprites.js`.
- 2.5D arena and low-poly enemy art targets live in `assets/concepts/`.
- Campaign progress load/save normalization now lives in `src/systems/progress.js`.
- Role-root/spec/path progression helpers now live in `src/systems/role-progression.js`.
- Playtest-only browser debug plumbing now lives in `src/systems/playtest-hook.js`.
- Wave planner rules for themed queues, stage openers, and wave mechanics now live in `src/systems/wave-planner.js`.
- Structured build-phase wave threat data now lives in `src/systems/wave-threats.js`.
- Wave start state, spawn queue construction, spawn cadence, and wave reward calculation now live in `src/systems/wave-lifecycle.js`.
- Stage economy, starting gold, round count, and late-round scaling helpers now live in `src/systems/stage-economy.js`.
- Magical rift scheduling and rift minion spawning now live in `src/systems/rift-runtime.js`.
- Boss phase, cooldown scaling, and target-pick helpers now live in `src/systems/boss-mechanics-helpers.js`.
- Royal carapace shield, hatchling, burst, and break logic now lives in `src/systems/boss-royal-carapace.js`.
- Stage run setup for king stats, stage reset fields, and starting resources now lives in `src/systems/stage-lifecycle.js`.
- Stage star rules, squad challenge counting, star criteria, and result scoring now live in `src/systems/stage-stars.js`.
- Existing Bloodlust and Tranquility active-skill activation and timer/heal logic now live in `src/systems/active-skills.js`.
- Squad placement costs, upgrade pricing, path pricing, capstone checks, placement affordability, and sell refunds now live in `src/systems/squad-economy.js`.
- Combat stat tracking, round summaries, stage report list building, and report value formatting now live in `src/systems/combat-stats.js`.
- Squad respawn helpers for cooldown snapshots, player unit creation, legacy ability cleanup, cooldown restoration, and squad-attached minion/pet spawning rules now live in `src/systems/squad-lifecycle.js`.
- Unit passive application, signature cooldown remapping, and branch-aware role tuning now live in `src/systems/unit-passives.js`.
- Shared on-hit tier bookkeeping and generic post-hit support/sustain procs now live in `src/systems/unit-onhit-procs.js`.
- Player-facing sandbox, dummy-spawn, and test/boss-test UI paths have been removed from v8.
- Inactive multiplayer/co-op compatibility code has been removed from v8.
- Old Talents are ignored on load and no longer saved or applied; future Perks will be added separately.
- Legacy card cycling/cooldown remnants have been removed; v8 keeps the current six-visible-card deck.
- The remaining large runtime is the compatibility bridge for combat, render, and UI code that still depends on shared closure state.

## Next Cleanup Passes

1. Convert more runtime globals into the `GameState` shape in `src/core/state.js`.
2. Move combat/waves/upgrades/abilities into focused `src/systems/` modules.
3. Move screen drawing and click handlers into `src/ui/`.
4. Continue moving canvas, sprites, arena floor, battle HUD, and screen render code into `src/render/` and `src/ui/`.
5. Add Perks, Beans, and rewarded-ad hooks after the modular foundation is stable.
