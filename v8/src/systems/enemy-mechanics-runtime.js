import { ARENA_THREAT_TAG_COLOR, ARENA_WAVE_MECHANIC_LABELS } from '../data/waves.js';
import { drawThreatsPanel as drawThreatPreviewPanel, threatPanelHeight as threatPanelHeightBase } from '../ui/threat-panel.js';
import { arena_pickWaveMechanic, arena_stageOpenerQueue, arena_themedWaveQueue, arena_waveMechanicLimit } from './wave-planner.js';
import { buildWaveThreats } from './wave-threats.js?v=20260522-vizier-wards';

export function createEnemyMechanicsRuntime(deps = {}) {
  const tickHz = deps.tickHz || 60;
  const ctx = deps.ctx;
  const enemyTemplates = deps.enemyTemplates || [];
  const bosses = deps.bosses || [];
  const dist = typeof deps.distance === 'function'
    ? deps.distance
    : ((a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)));
  const rnd = typeof deps.randomRange === 'function'
    ? deps.randomRange
    : ((min, max) => min + Math.random() * (max - min));
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const addParticle = typeof deps.emitParticle === 'function' ? deps.emitParticle : () => {};
  const addDamageText = typeof deps.addDamageText === 'function' ? deps.addDamageText : () => {};

  function initBacklinePressure() {
    for (const enemy of enemyTemplates) {
      if (enemy.projType && enemy.range >= 120) {
        enemy.snipesBackline = true;
        enemy.snipeCD = 900;
      }
      if (enemy.arch === 'caster') {
        enemy.chainBoltCD = 600;
        enemy.chainBoltDmgMult = 0.14;
      }
    }
  }

  function applyWaveMechanic(enemy, template) {
    const v = view();
    const arena = v.arena;
    const currentStage = v.currentStage || {};
    if (!arena || !arena.waveMechanic || !enemy || enemy.isBoss || enemy.isElite || enemy.isBarrier) return;
    const type = arena.waveMechanic.type;
    const stageN = currentStage.n || 1;
    const roundN = arena.round || 1;
    const assigned = arena.waveMechanicAssignedCount || (arena.waveMechanicAssigned ? 1 : 0);
    const limit = arena_waveMechanicLimit(stageN, roundN, type);
    if (assigned >= limit) return;

    const lateSupport = stageN >= 11;
    enemy.waveMechanic = type;
    enemy.name = (ARENA_WAVE_MECHANIC_LABELS[type] || 'Special') + ' ' + (enemy.name || template.name || 'Enemy');
    enemy.points = Math.round((enemy.points || template.points || 10) * 1.15);
    const setHpMult = multiplier => {
      enemy.maxHp = Math.max(1, Math.round(enemy.maxHp * multiplier));
      enemy.hp = enemy.maxHp;
    };

    if (type === 'shield') {
      enemy._shieldCarrier = { r: 130, shieldPct: lateSupport ? 0.08 : 0.06, tick: 0 };
      setHpMult(lateSupport ? 1.05 : 0.85);
    } else if (type === 'banner') {
      enemy._bannerBearer = { r: 145, tick: 0 };
      enemy.dmg = Math.max(1, Math.round(enemy.dmg * 0.75));
      setHpMult(lateSupport ? 0.95 : 0.75);
    } else if (type === 'medic') {
      enemy._medicBug = { r: 150, cd: 45, every: lateSupport ? Math.round(1.7 * tickHz) : 2 * tickHz, healPct: lateSupport ? 0.06 : 0.045 };
      enemy.dmg = Math.max(1, Math.round(enemy.dmg * 0.50));
      setHpMult(lateSupport ? 1.00 : 0.70);
    } else if (type === 'ritual') {
      enemy._ritualCaster = { r: 155, t: 4 * tickHz, done: false };
      enemy.speed = (enemy.speed || 0.25) * 0.85;
      setHpMult(lateSupport ? 0.95 : 0.80);
    } else if (type === 'exploding') {
      enemy._explodingSwarm = { r: 70, dmgMult: 0.35 };
      enemy.dmg = Math.max(1, Math.round(enemy.dmg * 0.80));
      setHpMult(0.75);
    } else if (type === 'sniper') {
      enemy._sniperWindup = { charge: 0, chargeMax: 70, shotMult: 1.35 };
      enemy.range = Math.max(enemy.range || 40, 185);
      enemy.projType = enemy.projType || 'normal';
      enemy.dmg = Math.max(1, Math.round(enemy.dmg * 0.85));
      enemy.atkSpd = Math.max(enemy.atkSpd || 90, 105);
      setHpMult(0.85);
    }

    arena.waveMechanicAssignedCount = assigned + 1;
    arena.waveMechanicAssigned = arena.waveMechanicAssignedCount >= limit;
    addDamageText(enemy.x, enemy.y - enemy.size, (ARENA_WAVE_MECHANIC_LABELS[type] || 'SPECIAL').toUpperCase(), '#ffd700', { sz: 13, bold: true });
    addParticle(enemy.x, enemy.y, '#ffd700', 18, 4);
    (v.groundFx || []).push({ x: enemy.x, y: enemy.y, r: 0, maxR: 50, life: 0.45, color: '#ffd700' });
  }

  function enemyAttackCd(enemy) {
    let cd = enemy && enemy.atkSpd ? enemy.atkSpd : 60;
    if (enemy && enemy._bannerHasteTimer > 0) cd = Math.max(20, Math.round(cd * 0.90));
    if (enemy && enemy._ritualBuffTimer > 0) cd = Math.max(20, Math.round(cd * 0.92));
    return cd;
  }

  function updateEnemyMechanics(enemy) {
    const v = view();
    const arena = v.arena;
    const enemies = v.enemies || [];
    const frame = v.frame || 0;
    const groundFx = v.groundFx || [];
    const beamFx = v.beamFx || [];

    if (!enemy) return;
    if (enemy._enemyShieldTimer > 0) {
      enemy._enemyShieldTimer--;
      if (enemy._enemyShieldTimer <= 0) enemy._enemyShield = 0;
    }
    if (enemy._bannerHasteTimer > 0) enemy._bannerHasteTimer--;
    if (enemy._ritualBuffTimer > 0) enemy._ritualBuffTimer--;

    const inArena = v.state === 'battle' && arena && arena.phase;
    if (!inArena || enemy.isBoss || enemy.isBarrier || enemy.hp <= 0) return;

    if (enemy._shieldCarrier) {
      enemy._shieldCarrier.tick = (enemy._shieldCarrier.tick || 0) - 1;
      if (enemy._shieldCarrier.tick <= 0) {
        enemy._shieldCarrier.tick = 24;
        const radius = enemy._shieldCarrier.r || 130;
        const pct = enemy._shieldCarrier.shieldPct || 0.06;
        for (const ally of enemies) {
          if (ally === enemy || ally.hp <= 0 || ally.isBoss || ally.isBarrier) continue;
          if (dist(enemy, ally) > radius) continue;
          const cap = Math.max(8, Math.round((ally.maxHp || 50) * pct));
          ally._enemyShield = Math.min(cap, Math.max(ally._enemyShield || 0, cap));
          ally._enemyShieldTimer = 50;
          if (frame % 24 === 0) addParticle(ally.x, ally.y, '#44aaff', 2, 2);
        }
        if (frame % 48 === 0) groundFx.push({ x: enemy.x, y: enemy.y, r: 0, maxR: radius, life: 0.35, color: '#44aaff' });
      }
    }

    if (enemy._bannerBearer) {
      enemy._bannerBearer.tick = (enemy._bannerBearer.tick || 0) - 1;
      if (enemy._bannerBearer.tick <= 0) {
        enemy._bannerBearer.tick = 24;
        const radius = enemy._bannerBearer.r || 145;
        for (const ally of enemies) {
          if (ally === enemy || ally.hp <= 0 || ally.isBoss || ally.isBarrier) continue;
          if (dist(enemy, ally) > radius) continue;
          ally._bannerHasteTimer = 36;
          if (frame % 30 === 0) addParticle(ally.x, ally.y, '#ffcc44', 1, 2);
        }
        if (frame % 60 === 0) addDamageText(enemy.x, enemy.y - enemy.size - 8, 'BANNER', '#ffcc44', { sz: 11, bold: true });
      }
    }

    if (enemy._medicBug) {
      enemy._medicBug.cd--;
      if (enemy._medicBug.cd <= 0) {
        enemy._medicBug.cd = enemy._medicBug.every || 2 * tickHz;
        let low = null;
        let lowestPct = 1;
        for (const ally of enemies) {
          if (ally.hp <= 0 || ally.isBoss || ally.isBarrier) continue;
          if (dist(enemy, ally) > (enemy._medicBug.r || 150)) continue;
          const pct = ally.hp / Math.max(1, ally.maxHp);
          if (pct < lowestPct) {
            lowestPct = pct;
            low = ally;
          }
        }
        if (low && lowestPct < 0.98) {
          const heal = Math.max(5, Math.round((low.maxHp || 50) * (enemy._medicBug.healPct || 0.045)));
          low.hp = Math.min(low.maxHp, low.hp + heal);
          addDamageText(low.x, low.y - low.size, '+' + heal, '#44ff88', { sz: 12, bold: true });
          addParticle(low.x, low.y, '#44ff88', 10, 3);
          beamFx.push({ x1: enemy.x, y1: enemy.y - enemy.size * 0.4, x2: low.x, y2: low.y - low.size * 0.2, life: 0.28, maxLife: 0.28, color: '#44ff88', width: 2, straight: false });
        }
      }
    }

    if (enemy._ritualCaster && !enemy._ritualCaster.done) {
      enemy._ritualCaster.t--;
      if (frame % 20 === 0) {
        const radius = enemy._ritualCaster.r || 155;
        groundFx.push({ x: enemy.x, y: enemy.y, r: 0, maxR: radius, life: 0.22, color: '#aa66ff' });
        addParticle(enemy.x + rnd(-20, 20), enemy.y + rnd(-12, 12), '#aa66ff', 2, 2);
      }
      if (frame % 60 === 0) addDamageText(enemy.x, enemy.y - enemy.size - 8, 'CHANNEL', '#aa66ff', { sz: 11, bold: true });
      if (enemy._ritualCaster.t <= 0) {
        enemy._ritualCaster.done = true;
        const radius = enemy._ritualCaster.r || 155;
        for (const ally of enemies) {
          if (ally.hp <= 0 || ally.isBoss || ally.isBarrier) continue;
          if (dist(enemy, ally) <= radius) {
            ally._ritualBuffTimer = 8 * tickHz;
            addParticle(ally.x, ally.y, '#aa66ff', 8, 3);
          }
        }
        groundFx.push({ x: enemy.x, y: enemy.y, r: 0, maxR: radius, life: 0.65, color: '#aa66ff' });
        addDamageText(enemy.x, enemy.y - enemy.size - 8, 'RITUAL BUFF', '#aa66ff', { sz: 13, bold: true });
        if (typeof deps.shake === 'function') deps.shake(3);
      }
    }
  }

  function buildWavePreview() {
    const v = view();
    const arena = v.arena;
    const stage = v.currentStage;
    if (!arena || !stage) return;
    const total = typeof deps.currentStageRounds === 'function' ? deps.currentStageRounds() : 6;
    const isBoss = arena.round >= total;

    if (isBoss) {
      if (stage.bossId != null) {
        const boss = bosses[stage.bossId];
        const label = boss && boss.hasBarrier ? 'BARRIER FIGHT' : boss && boss.isAerial ? 'AERIAL BOSS' : 'BOSS';
        arena.wavePreview = label + ' - ' + ((boss && boss.name) || '?');
      } else if (stage.eliteEnemyId != null) {
        arena.wavePreview = 'FINAL WAVE - ' + ((enemyTemplates[stage.eliteEnemyId] && enemyTemplates[stage.eliteEnemyId].name) || '?');
      } else {
        arena.wavePreview = 'FINAL WAVE';
      }
    } else {
      const wave = (arena.round === 1 ? arena_stageOpenerQueue(stage) : null)
        || arena_themedWaveQueue(arena.round, stage.n || 1, stage.act || 1);
      const isVizierMiniBoss = ((stage.n || 0) === 10 && arena.round === 4);
      arena._nextWaveMiniBoss = isVizierMiniBoss ? 13 : null;
      if (isVizierMiniBoss) {
        arena.wavePreview = 'MINI BOSS - Stormbound Vizier';
        arena._nextWaveQueue = [];
        arena._nextWaveTheme = 'STORM COURT';
      } else {
        arena.wavePreview = wave.theme + ' - ' + wave.previewName;
        const mechanic = arena_pickWaveMechanic(stage.n || 1, arena.round || 1, false);
        if (mechanic) arena.wavePreview += '  +  ' + mechanic.label;
        arena._nextWaveQueue = wave.queue;
        arena._nextWaveTheme = wave.theme;
      }
      arena._waveGoldMult = wave.goldMult || 1;
    }

    arena.waveThreats = buildWaveThreats({
      round: arena.round,
      total,
      isBoss,
      stage,
      queue: arena._nextWaveQueue || [],
      theme: arena._nextWaveTheme || '',
      miniBossId: arena._nextWaveMiniBoss,
    });
  }

  function threatTagColor(tag) {
    return ARENA_THREAT_TAG_COLOR[tag] || '#9aa3b2';
  }

  function threatPanelHeightRuntime(threat) {
    return threatPanelHeightBase(threat);
  }

  function drawThreatsPanel() {
    const v = view();
    const arena = v.arena || {};
    return drawThreatPreviewPanel(ctx, {
      width: v.width,
      phase: arena.phase,
      threat: arena.waveThreats,
      gold: v.gold,
      frame: v.frame || 0,
      buildTimer: arena.buildTimer,
      buildTimerMax: arena.buildTimerMax,
      tagColors: ARENA_THREAT_TAG_COLOR,
    });
  }

  initBacklinePressure();

  return {
    applyWaveMechanic,
    enemyAttackCd,
    updateEnemyMechanics,
    buildWavePreview,
    threatTagColor,
    threatPanelHeight: threatPanelHeightRuntime,
    drawThreatsPanel,
  };
}
