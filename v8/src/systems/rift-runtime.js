import { GAME_TICK_HZ } from '../core/constants.js';

export const ARENA_RIFT_TELEGRAPH_FRAMES = 8 * GAME_TICK_HZ;
export const ARENA_RIFT_BONUS_GOLD = 8;
export const ARENA_RIFT_TRIGGER_MIN_FRAMES = 8 * GAME_TICK_HZ;
export const ARENA_RIFT_PER_STAGE_CHANCE = 0;

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
    if (v.arena) v.arena.scheduledRiftRound = null;
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
    const arenaLeft = v.arenaLeft || 0;
    const arenaRight = v.arenaRight || width;
    const units = v.units || [];
    const currentStage = v.currentStage || {};
    const enemiesData = v.enemiesData || [];

    let rx = width / 2, ry = arenaTop + randomRange(60, Math.max(80, deployTop - arenaTop - 20));
    for (let tries = 0; tries < 12; tries++) {
      const tx = arenaLeft + 60 + Math.random() * (arenaRight - arenaLeft - 120);
      const ty = arenaTop + 50 + Math.random() * (deployTop - arenaTop - 60);
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

    const count = 3 + Math.floor((currentStage.n || 1) / 3);
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

    for (let i = 0; i < list.length; i++) {
      const tmpl = enemiesData[list[i]];
      if (!tmpl) continue;
      const tankBuff = tmpl.arch === 'tank' ? 1.10 : 1;
      const stageHpM = (stageHpMult[currentStageIdx] || 1) * hpMultEnemy * tankBuff;
      const stageDmgM = stageDmgMult[currentStageIdx] || 1;
      const ang = (i / r.count) * Math.PI * 2 + Math.random() * 0.4;
      const ox = Math.cos(ang) * 22, oy = Math.sin(ang) * 16;
      enemies.push({
        ...tmpl,
        name: 'Rift ' + tmpl.name,
        x: r.x + ox,
        y: r.y + oy,
        size: (tmpl.size || 16) * unitSizeScale,
        maxHp: Math.round(tmpl.hp * stageHpM * 1.3),
        hp: Math.round(tmpl.hp * stageHpM * 1.3),
        dmg: Math.round(tmpl.dmg * stageDmgM * 1.5),
        isEnemy: true,
        fromRift: true,
        cd: 0,
        facing: -1,
        bobPhase: Math.random() * Math.PI * 2,
        debuffs: {},
        points: Math.round((tmpl.points || 10) * 1.6),
        color: '#5a2a7a',
        accent: '#3a1850'
      });
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
