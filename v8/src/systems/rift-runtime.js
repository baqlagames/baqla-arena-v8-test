import { GAME_TICK_HZ } from '../core/constants.js';
import { clampActorToSpawnArea, clampSpawnValue, spawnAreaFromView } from './arena-spawn-bounds.js';

export const ARENA_RIFT_TELEGRAPH_FRAMES = 8 * GAME_TICK_HZ;
export const ARENA_RIFT_BONUS_GOLD = 12;
export const ARENA_RIFT_TRIGGER_MIN_FRAMES = 10 * GAME_TICK_HZ;
export const ARENA_RIFT_PER_STAGE_CHANCE = 0.16;
export const ARENA_RIFT_MIN_STAGE = 6;
export const ARENA_RIFT_HP_MULT = 1.14;
export const ARENA_RIFT_DMG_MULT = 1.14;

export function createRiftRuntime(deps) {
  const randomRange = typeof deps.randomRange === 'function' ? deps.randomRange : ((min, max) => min + Math.random() * (max - min));
  const distance = typeof deps.distance === 'function' ? deps.distance : ((a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)));
  const emitParticle = typeof deps.emitParticle === 'function' ? deps.emitParticle : (() => {});
  const showFlash = typeof deps.showFlash === 'function' ? deps.showFlash : (() => {});
  const shake = typeof deps.shake === 'function' ? deps.shake : (() => {});

  function view() {
    return typeof deps.view === 'function' ? deps.view() || {} : {};
  }

  function rollStageRift() {
    const v = view();
    const arena = v.arena;
    if (!arena) return;
    arena.scheduledRiftRound = null;
    const currentStage = v.currentStage || {};
    if ((currentStage.n || 1) < ARENA_RIFT_MIN_STAGE) return;
    if (randomRange(0, 1) >= ARENA_RIFT_PER_STAGE_CHANCE) return;
    arena.scheduledRiftRound = randomRange(0, 1) < 0.5 ? 4 : 5;
  }

  function tryTriggerRift() {
    const v = view();
    const arena = v.arena;
    if (!arena) return;
    if (arena.rift) return;
    if (arena.riftFiredThisRound) return;
    if (arena.scheduledRiftRound == null) return;
    if (arena.round !== arena.scheduledRiftRound) return;
    if (arena.phase !== 'wave') return;
    if (arena.waveElapsed < ARENA_RIFT_TRIGGER_MIN_FRAMES) return;
    if ((v.enemies || []).filter(enemy => enemy.hp > 0).length === 0) return;
    triggerRift();
  }

  function triggerRift() {
    const v = view();
    const arena = v.arena;
    if (!arena) return;
    const width = v.width || 500;
    const arenaTop = v.arenaTop || 0;
    const deployTop = v.deployTop || 600;
    const arenaBottom = v.arenaBottom || deployTop;
    const arenaLeft = v.arenaLeft || 0;
    const arenaRight = v.arenaRight || width;
    const spawnArea = spawnAreaFromView({ arenaLeft, arenaRight, arenaTop, arenaBottom, fallbackWidth: width });
    const units = v.units || [];
    const currentStage = v.currentStage || {};
    const enemiesData = v.enemiesData || [];

    let rx = clampSpawnValue(width / 2, spawnArea.left + 58, spawnArea.right - 58);
    let ry = clampSpawnValue(arenaTop + randomRange(60, Math.max(80, deployTop - arenaTop - 20)), spawnArea.top + 58, Math.min(spawnArea.bottom - 72, deployTop - 24));
    for (let tries = 0; tries < 12; tries++) {
      const tx = clampSpawnValue(arenaLeft + 60 + randomRange(0, Math.max(1, arenaRight - arenaLeft - 120)), spawnArea.left + 58, spawnArea.right - 58);
      const ty = clampSpawnValue(arenaTop + 50 + randomRange(0, Math.max(1, deployTop - arenaTop - 60)), spawnArea.top + 58, Math.min(spawnArea.bottom - 72, deployTop - 24));
      let safe = true;
      for (const unit of units) {
        if (unit.hp <= 0 || !unit.isPlayer) continue;
        if (distance({ x: tx, y: ty }, unit) < 80) { safe = false; break; }
      }
      if (safe) { rx = tx; ry = ty; break; }
    }

    const act = currentStage.act || 1;
    const actEnemies = enemiesData.filter(enemy => enemy.act === act);
    const order = ['assassin', 'dps', 'caster', 'ranged', 'tank'];
    const mix = [];
    for (const arch of order) {
      const candidate = actEnemies.find(enemy => enemy.arch === arch);
      if (candidate) mix.push(candidate.id);
    }
    if (!mix.length && actEnemies.length) mix.push(actEnemies[0].id);

    const count = Math.min(6, 3 + Math.floor((currentStage.n || 1) / 5));
    const spawnList = [];
    for (let i = 0; i < count; i++) spawnList.push(mix[i % mix.length]);
    arena.rift = { x: rx, y: ry, telegraphTimer: ARENA_RIFT_TELEGRAPH_FRAMES, spawnList, count, totalTime: ARENA_RIFT_TELEGRAPH_FRAMES };
    arena.riftFiredThisRound = true;
    showFlash('MAGICAL RIFT OPENING', '#aa66ff', 150);
    shake(12);
  }

  function spawnRiftMinions() {
    const v = view();
    const arena = v.arena;
    if (!arena || !arena.rift) return;
    const r = arena.rift;
    const list = r.spawnList || [];
    const enemiesData = v.enemiesData || [];
    const currentStageIdx = v.currentStageIdx || 0;
    const stageHpMult = v.stageHpMult || [];
    const stageDmgMult = v.stageDmgMult || [];
    const hpMultEnemy = v.hpMultEnemy || 1;
    const unitSizeScale = v.unitSizeScale || 1;
    const enemies = v.enemies || [];
    const groundFx = v.groundFx || [];
    const spawnArea = spawnAreaFromView({
      arenaLeft: v.arenaLeft,
      arenaRight: v.arenaRight,
      arenaTop: v.arenaTop,
      arenaBottom: v.arenaBottom,
      fallbackWidth: v.width,
    });

    for (let i = 0; i < list.length; i++) {
      const tmpl = enemiesData[list[i]];
      if (!tmpl) continue;
      const tankBuff = tmpl.arch === 'tank' ? 1.10 : 1;
      const stageHpM = (stageHpMult[currentStageIdx] || 1) * hpMultEnemy * tankBuff;
      const stageDmgM = stageDmgMult[currentStageIdx] || 1;
      const ang = (i / r.count) * Math.PI * 2 + randomRange(0, 0.4);
      const ox = Math.cos(ang) * 22, oy = Math.sin(ang) * 16;
      const enemy = {
        ...tmpl,
        name: 'Rift ' + tmpl.name,
        x: r.x + ox,
        y: r.y + oy,
        size: (tmpl.size || 16) * unitSizeScale,
        maxHp: Math.round(tmpl.hp * stageHpM * ARENA_RIFT_HP_MULT),
        hp: Math.round(tmpl.hp * stageHpM * ARENA_RIFT_HP_MULT),
        dmg: Math.round(tmpl.dmg * stageDmgM * ARENA_RIFT_DMG_MULT),
        isEnemy: true,
        fromRift: true,
        cd: 0,
        facing: -1,
        bobPhase: randomRange(0, Math.PI * 2),
        debuffs: {},
        points: Math.round((tmpl.points || 10) * 1.6),
        color: '#5a2a7a',
        accent: '#3a1850'
      };
      clampActorToSpawnArea(enemy, {
        ...spawnArea,
        topMargin: 52,
        bottomMargin: 58,
      });
      enemies.push(enemy);
    }

    for (let i = 0; i < 48; i++) emitParticle(r.x, r.y, '#aa66ff', 1, 5);
    for (let i = 0; i < 24; i++) emitParticle(r.x, r.y, '#ffd700', 1, 4);
    groundFx.push({ x: r.x, y: r.y, r: 0, maxR: 90, life: 0.7, color: '#aa66ff' });
    showFlash('RIFT BREACH!', '#aa66ff', 100);
    shake(18);
    arena.rift = null;
  }

  return { rollStageRift, tryTriggerRift, triggerRift, spawnRiftMinions };
}
