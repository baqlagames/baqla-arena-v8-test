import { ARENA_RIFT_BONUS_GOLD } from './rift-runtime.js';
import { addBatataShield, addGoldShield, addTaoonBloodShield, addZavsLineShield, applyHealingReceived as applyHealingReceivedBase } from './combat-healing.js';
import { createCombatFeedbackRuntime } from './combat-feedback-runtime.js?v=9d6b186-combat-feedback';
import { createCombatDamageContextRuntime } from './combat-damage-context-runtime.js?v=9d6b186-combat-feedback';
import { dealDamageRuntime, handleCombatDeath } from './combat-damage-runtime.js?v=9d6b186-combat-feedback';
import { clampCombatActorToArena, clampCombatActorToLeash, createCombatBounds, createTargetingView, moveCombatActorToward, resolvePlayerUnitOverlaps } from './combat-positioning.js';
import { batataCovers, batataHealingReceivedMultiplier, isBatataBacklineAlly, isZavsMeleeAlly, zavsAllyAttackSpeedFactor, zavsAllyDamageMultiplier, zavsBodyguardCovers } from './combat-protection.js';
import { findEnemyTargetForUnit, findNearestTarget, findRangedEnemyTargetForUnit, isReachableFromLeash, isSaturatedCombatTarget, updateBossEngagementCounts } from './combat-targeting.js';
import { playerCombatColor, spawnPlayerAbilityCastVfx, spawnPlayerImpactVfx, spawnPlayerProjectileCastVfx } from './combat-vfx.js';

export function createCombatHelperRuntime(deps = {}) {
  const tickHz = deps.tickHz || 60;
  const dist = typeof deps.distance === 'function'
    ? deps.distance
    : ((a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)));
  const rnd = typeof deps.randomRange === 'function'
    ? deps.randomRange
    : ((min, max) => min + Math.random() * (max - min));
  const view = () => (typeof deps.view === 'function' ? deps.view() || {} : {});
  const shake = value => {
    if (typeof deps.shake === 'function') deps.shake(value || 0);
  };
  const showFlash = typeof deps.showFlash === 'function' ? deps.showFlash : () => {};

  const feedbackRuntime = createCombatFeedbackRuntime({
    initialCombatStats: deps.initialCombatStats,
    setCombatStats: deps.setCombatStats,
    frame: () => view().frame || 0,
    particles: () => view().particles || [],
    damageNumbers: () => view().damageNumbers || [],
    healingNumbers: () => view().healingNumbers || [],
    randomRange: rnd,
    sound: deps.sound || {},
  });

  function addParticle(x, y, color, n, sz) {
    return feedbackRuntime.addParticle(x, y, color, n, sz);
  }

  function addDamageText(x, y, value, color, opts) {
    return feedbackRuntime.addDamageText(x, y, value, color, opts);
  }

  function addHealEffect(x, y, value, big, source, target, meta) {
    return feedbackRuntime.addHealFx(x, y, value, big, source, target, meta);
  }

  function applyHealingReceivedRuntime(target, amount) {
    return applyHealingReceivedBase(target, amount, { healingReceivedMult: batataHealingReceivedMult });
  }

  function resetStageStats(stage) {
    feedbackRuntime.resetStage(stage);
  }

  function startRoundStats() {
    const v = view();
    feedbackRuntime.startRound({ stage: v.currentStage, round: (v.arena && v.arena.round) || 1, tickHz });
  }

  function recordDamage(target, attacker, amount, meta) {
    feedbackRuntime.recordDamage(target, attacker, amount, meta);
  }

  function recordPrevented(target, source, amount, meta) {
    feedbackRuntime.recordPrevented(target, source, amount, meta);
  }

  function recordHeal(source, target, amount, overheal) {
    feedbackRuntime.recordHeal(source, target, amount, overheal);
  }

  function trackedHeal(target, amount, source, big, alreadyAdjusted) {
    const effects = typeof deps.perkEffects === 'function' ? deps.perkEffects() || {} : {};
    const tunedAmount = source && source.isPlayer && source.arch === 'healer'
      ? Math.round(amount * (1 + (effects.healerOutputMult || 0)))
      : amount;
    return feedbackRuntime.trackedHeal(target, tunedAmount, {
      source,
      big,
      alreadyAdjusted,
      adjustHealingReceived: applyHealingReceivedRuntime,
    });
  }

  function finishRoundStats(result) {
    feedbackRuntime.finishRound(result, tickHz);
  }

  function formatStats(value) {
    return feedbackRuntime.format(value);
  }

  function applySearingBrandOnBasic(attacker, target) {
    const v = view();
    if (!attacker || !target || target.hp <= 0) return;
    if (!attacker.searingBrandEvery) return;
    if (!(target.arch === 'tank' || target.taunt)) return;
    attacker._searingBrandHits = (attacker._searingBrandHits || 0) + 1;
    if (attacker._searingBrandHits < attacker.searingBrandEvery) return;
    attacker._searingBrandHits = 0;
    const extra = Math.max(1, Math.round((target.maxHp || target.hp || 1) * (attacker.searingBrandHpPct || 0.05)));
    target._searingBrandTimer = attacker.searingBrandDur || Math.round(4 * tickHz);
    target._searingBrandHealCut = attacker.searingBrandHealCut || 0.10;
    dealDamage(target, extra, attacker, 'magic');
    addDamageText(target.x, target.y - (target.size || 20) - 8, 'SEARING BRAND', '#ff6a22', { sz: 13, bold: true, outline: '#4a1700' });
    addParticle(target.x, target.y, '#ff6a22', 18, 4);
    addParticle(target.x, target.y, '#ffd08a', 8, 3);
    (v.groundFx || []).push({ x: target.x, y: target.y, r: 0, maxR: Math.max(38, (target.size || 20) * 1.5), life: 0.45, color: '#ff6a22' });
  }

  function applyRoyalStingOnBasic(attacker, target) {
    const v = view();
    if (!attacker || !target || target.hp <= 0) return;
    if (attacker.name !== 'Hornet Sovereign' || !attacker.royalStingEvery) return;
    if (!(target.arch === 'tank' || target.taunt)) return;
    attacker._royalStingHits = (attacker._royalStingHits || 0) + 1;
    if (attacker._royalStingHits < attacker.royalStingEvery) return;
    attacker._royalStingHits = 0;
    const extra = Math.max(1, Math.round((target.maxHp || target.hp || 1) * (attacker.royalStingHpPct || 0.03)));
    dealDamage(target, extra, attacker, 'magic');
    target.poisonTimer = Math.max(target.poisonTimer || 0, attacker.royalStingDur || 360);
    target.poisonDmgVal = Math.max(target.poisonDmgVal || 0, attacker.royalStingPoisonDmg || 4);
    target.ampTimer = Math.max(target.ampTimer || 0, attacker.royalStingDur || 360);
    target.ampMult = Math.max(target.ampMult || 1, attacker.royalStingAmp || 1.12);
    target._royalStingTimer = Math.max(target._royalStingTimer || 0, attacker.royalStingDur || 360);
    addDamageText(target.x, target.y - (target.size || 20) - 8, 'ROYAL STING', '#ffdd44', { sz: 12, bold: true, outline: '#4a2600' });
    addParticle(target.x, target.y, '#ffdd44', 14, 4);
    addParticle(target.x, target.y, '#88cc00', 8, 3);
    (v.groundFx || []).push({ x: target.x, y: target.y, r: 0, maxR: Math.max(34, (target.size || 20) * 1.35), life: 0.35, color: '#ffdd44' });
  }

  function isProtectedByTank(unit) {
    const { units = [] } = view();
    if (!unit || unit.hp <= 0) return false;
    for (const tank of units) {
      if (!tank || tank === unit || tank.hp <= 0 || !tank.isPlayer || tank.isGhost || tank.isMinion) continue;
      if (!(tank.arch === 'tank' || tank.taunt)) continue;
      const tankInFront = tank.y <= unit.y + 20;
      const laneCover = Math.abs(tank.x - unit.x) <= 125;
      if (tankInFront && laneCover && dist(tank, unit) <= 230) return true;
    }
    return false;
  }

  function emberDecreeDamage(base, target, isTankCircle) {
    if (!target) return base;
    if (target.isMinion) return Math.round(base * 0.50);
    if (target.arch === 'tank' || target.taunt) return Math.round(base * (isTankCircle ? 1.0 : 0.65));
    if (target.arch === 'melee') return Math.round(base * 0.75);
    if (isProtectedByTank(target)) return Math.round(base * 0.45);
    return base;
  }

  function combatBounds() {
    const v = view();
    const lane = typeof deps.laneBounds === 'function'
      ? deps.laneBounds()
      : { left: v.arenaLeft || 0, right: v.arenaRight || v.width || 500 };
    return createCombatBounds({
      arenaLeft: lane.left,
      arenaRight: lane.right,
      arenaTop: v.arenaTop,
      arenaBot: v.arenaBottom,
      playerCastle: v.playerCastle,
      enemyCastle: v.enemyCastle,
      leashForward: deps.leashForward,
      leashBack: deps.leashBack,
      leashSide: deps.leashSide,
    });
  }

  function moveToward(unit, tx, ty, speed) {
    moveCombatActorToward(unit, tx, ty, speed, combatBounds());
  }

  function clampToArena(unit) {
    clampCombatActorToArena(unit, combatBounds());
  }

  function fireDivineStorm(unit) {
    const v = view();
    const enemies = v.enemies || [];
    const units = v.units || [];
    const groundFx = v.groundFx || [];
    if (!unit || unit.hp <= 0) return;
    const waveLen = 160;
    const waveWidth = 36;
    let hasReachable = false;
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - unit.x, enemy.y - unit.y) <= waveLen + waveWidth) {
        hasReachable = true;
        break;
      }
    }
    if (!hasReachable) return;
    const damage = Math.round(unit.dmg * 1.20);
    const heal = Math.round(unit.maxHp * 0.05);
    const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    for (const angle of angles) {
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const ex = enemy.x - unit.x;
        const ey = enemy.y - unit.y;
        const proj = ex * Math.cos(angle) + ey * Math.sin(angle);
        if (proj < 0 || proj > waveLen) continue;
        const perp = Math.abs(ex * -Math.sin(angle) + ey * Math.cos(angle));
        if (perp > waveWidth) continue;
        dealDamage(enemy, damage, unit, 'magic');
        addParticle(enemy.x, enemy.y, '#ffe066', 8, 4);
      }
      for (const ally of units) {
        if (ally.hp <= 0 || !ally.isPlayer || ally.isGhost) continue;
        const ax = ally.x - unit.x;
        const ay = ally.y - unit.y;
        const proj = ax * Math.cos(angle) + ay * Math.sin(angle);
        if (proj < 0 || proj > waveLen) continue;
        const perp = Math.abs(ax * -Math.sin(angle) + ay * Math.cos(angle));
        if (perp > waveWidth) continue;
        if (ally.hp < ally.maxHp) trackedHeal(ally, heal, unit, false);
      }
      const midR = waveLen * 0.5;
      groundFx.push({ x: unit.x + Math.cos(angle) * midR, y: unit.y + Math.sin(angle) * midR, r: 0, maxR: waveWidth + 8, life: 0.32, color: '#ffe066', flatten: true });
      for (let i = 1; i <= 10; i++) {
        const px = unit.x + Math.cos(angle) * waveLen * (i / 10);
        const py = unit.y + Math.sin(angle) * waveLen * (i / 10);
        addParticle(px, py, '#ffe066', 2, 3);
      }
    }
    groundFx.push({ x: unit.x, y: unit.y, r: 0, maxR: waveLen, life: 0.5, color: '#ffd700', flatten: true });
    groundFx.push({ x: unit.x, y: unit.y, r: 0, maxR: 50, life: 0.3, color: '#ffe066', flatten: true });
    addDamageText(unit.x, unit.y - unit.size - 6, 'DIVINE STORM!', '#ffe066');
    shake(5);
  }

  function clampToLeash(unit) {
    clampCombatActorToLeash(unit, combatBounds());
  }

  function resolvePlayerOverlaps() {
    const v = view();
    resolvePlayerUnitOverlaps({
      isWaveActive: v.state === 'battle' && v.arena && v.arena.phase === 'wave',
      units: v.units || [],
      frame: v.frame || 0,
      bounds: combatBounds(),
    });
  }

  function findTarget(unit, list) {
    return findNearestTarget(unit, list);
  }

  function isGripReserved(enemy, unit) {
    const { frame = 0 } = view();
    return !!(enemy && enemy._gripReservedUntil && frame < enemy._gripReservedUntil && enemy._grippedBy !== unit);
  }

  function reserveGripTarget(enemy, unit, duration) {
    const { frame = 0 } = view();
    if (!enemy) return;
    enemy._gripReservedUntil = frame + (duration || 60);
    enemy._grippedBy = unit;
  }

  function isGapCloserReserved(enemy, unit) {
    const { frame = 0 } = view();
    return !!(enemy && enemy._gapCloserReservedUntil && frame < enemy._gapCloserReservedUntil && enemy._gapCloserBy !== unit);
  }

  function reserveGapCloserTarget(enemy, unit, duration) {
    const { frame = 0 } = view();
    if (!enemy) return;
    enemy._gapCloserReservedUntil = frame + (duration || 36);
    enemy._gapCloserBy = unit;
  }

  function findUnreservedEnemyInRange(unit, maxRange, minRange) {
    const { enemies = [] } = view();
    let best = null;
    let bestD = Infinity;
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || enemy.charmed || enemy.burrowing || enemy.untargetable) continue;
      if (isGripReserved(enemy, unit) || isGapCloserReserved(enemy, unit)) continue;
      const d = dist(unit, enemy);
      if (d < (minRange || 0) || d > maxRange) continue;
      if (d < bestD) {
        bestD = d;
        best = enemy;
      }
    }
    return best;
  }

  function targetingView() {
    const v = view();
    return createTargetingView({
      bounds: combatBounds(),
      inArena: v.state === 'battle' && v.arena && v.arena.phase,
      enemies: v.enemies || [],
      towers: v.towers || [],
    });
  }

  function updateBossEngagement() {
    const { enemies = [], units = [] } = view();
    updateBossEngagementCounts({ enemies, units });
  }

  function isSaturatedTarget(target) {
    return isSaturatedCombatTarget(target);
  }

  function isReachable(unit, target) {
    return isReachableFromLeash(unit, target, targetingView());
  }

  function findEnemyForUnit(unit) {
    return findEnemyTargetForUnit(unit, targetingView());
  }

  function findRangedEnemyForUnit(unit) {
    return findRangedEnemyTargetForUnit(unit, targetingView());
  }

  function findTankAnchor(unit) {
    const { units = [] } = view();
    let best = null;
    let bestY = Infinity;
    for (const ally of units) {
      if (ally === unit || !ally.isPlayer || ally.hp <= 0 || ally.isMinion || ally.isHero) continue;
      if (ally.arch !== 'tank') continue;
      if (ally.y < bestY) {
        bestY = ally.y;
        best = ally;
      }
    }
    return best;
  }

  function findAllyForHealer(unit) {
    const { units = [], vodkaUnit = null } = view();
    let best = null;
    let bestPct = Infinity;
    for (const ally of units) {
      if (ally === unit || ally.hp <= 0 || ally.isMinion) continue;
      const pct = ally.hp / ally.maxHp;
      if (pct < 1 && pct < bestPct) {
        bestPct = pct;
        best = ally;
      }
    }
    if (!best && vodkaUnit && vodkaUnit.hp < vodkaUnit.maxHp && vodkaUnit !== unit) {
      if (vodkaUnit.hp / vodkaUnit.maxHp < bestPct) return vodkaUnit;
    }
    return best;
  }

  function spawnAbilityCastVfx(unit, label) {
    const v = view();
    spawnPlayerAbilityCastVfx({ unit, label, frame: v.frame || 0, emitParticle: addParticle, groundEffects: v.groundFx || [] });
  }

  function spawnProjectileCastVfx(from, to, opts) {
    const v = view();
    spawnPlayerProjectileCastVfx({ from, to, opts, frame: v.frame || 0, emitParticle: addParticle, beamEffects: v.beamFx || [] });
  }

  function spawnImpactVfx(target, attacker, dmgType, attackTypeOverride, damage, opts) {
    const v = view();
    spawnPlayerImpactVfx({
      target,
      attacker,
      dmgType,
      attackTypeOverride,
      damage,
      opts,
      frame: v.frame || 0,
      emitParticle: addParticle,
      groundEffects: v.groundFx || [],
      beamEffects: v.beamFx || [],
    });
  }

  function zavsAllyDmgMult(unit) {
    return zavsAllyDamageMultiplier(unit, { units: view().units || [] });
  }

  function zavsAllyAtkSpdFactor(unit) {
    return zavsAllyAttackSpeedFactor(unit, { units: view().units || [] });
  }

  function applyMuddied(enemy, from, duration, slowMult, dmgMult) {
    if (!enemy || enemy.hp <= 0 || enemy.isBoss) return;
    enemy.muddiedTimer = Math.max(enemy.muddiedTimer || 0, duration || Math.round(3 * tickHz));
    enemy.muddiedSlowMult = Math.min(enemy.muddiedSlowMult || 1, slowMult || 0.80);
    enemy.muddiedDamageMult = Math.min(enemy.muddiedDamageMult || 1, dmgMult || 0.92);
    enemy.muddiedFrom = from || null;
    enemy.slowTimer = Math.max(enemy.slowTimer || 0, enemy.muddiedTimer);
    enemy.slowMult = Math.min(enemy.slowMult || 1, enemy.muddiedSlowMult);
  }

  function batataHealingReceivedMult(target) {
    return batataHealingReceivedMultiplier(target, { units: view().units || [] });
  }

  function addZavsShield(target, amount, duration) {
    addZavsLineShield(target, amount, { duration, tickHz, emitParticle: addParticle });
  }

  function addGoldShieldRuntime(target, amount, duration, cap, noExpireHeal, visual = {}) {
    return addGoldShield(target, amount, { duration, cap, noExpireHeal, tickHz, emitParticle: addParticle, color: visual.color, type: visual.type });
  }

  function addBatataShieldRuntime(target, amount, duration) {
    addBatataShield(target, amount, { duration, tickHz, emitParticle: addParticle });
  }

  function isTaoonPriorityEnemy(enemy) {
    if (!enemy || enemy.hp <= 0 || enemy.isBoss) return false;
    return enemy.arch === 'ranged'
      || enemy.arch === 'caster'
      || enemy.arch === 'support'
      || enemy.arch === 'healer'
      || (enemy.range || 0) > 80
      || enemy.projType === 'curse';
  }

  function applyRuneWound(enemy, from, mult, duration) {
    if (!enemy || enemy.hp <= 0 || enemy.isBoss) return;
    enemy.runeWoundTimer = Math.max(enemy.runeWoundTimer || 0, duration || Math.round(3 * tickHz));
    enemy.runeWoundMult = Math.min(enemy.runeWoundMult || 1, mult || 0.92);
    enemy.runeWoundFrom = from || null;
  }

  function addTaoonBloodShieldRuntime(target, amount, duration, damageReduction) {
    addTaoonBloodShield(target, amount, { duration, damageReduction, tickHz, emitParticle: addParticle });
  }

  function taoonBloodTithe(unit, healAmount) {
    const { units = [], beamFx = [] } = view();
    if (!unit || !unit.bloodTithe || healAmount <= 0) return;
    let best = null;
    let bestPct = Infinity;
    for (const ally of units) {
      if (!ally || ally === unit || ally.hp <= 0 || !ally.isPlayer || ally.isGhost || ally.isMinion) continue;
      if (dist(unit, ally) > unit.bloodTithe.radius) continue;
      const pct = ally.hp / ally.maxHp;
      if (pct < bestPct) {
        bestPct = pct;
        best = ally;
      }
    }
    if (!best) return;
    const shield = Math.min(Math.round(healAmount * unit.bloodTithe.shieldPct), Math.round(unit.maxHp * unit.bloodTithe.capPct));
    addTaoonBloodShieldRuntime(best, shield, Math.round(4 * tickHz), 0);
    beamFx.push({ x1: unit.x, y1: unit.y, x2: best.x, y2: best.y, color: '#cc2244aa', width: 2, life: 0.22, maxLife: 0.22, straight: true });
    addDamageText(best.x, best.y - best.size, 'BLOOD TITHE', '#ff6688', { sz: 11, bold: true });
  }

  function grantGapInvulnerability(unit, label, color) {
    const { groundFx = [] } = view();
    if (!unit || unit.hp <= 0) return;
    unit._gapInvulnerableTimer = Math.max(unit._gapInvulnerableTimer || 0, Math.round(3 * tickHz));
    unit._gapInvulnerableLabel = label || 'INVULNERABLE';
    unit._gapInvulnerableColor = color || '#ffffff';
    addParticle(unit.x, unit.y, unit._gapInvulnerableColor, 18, 4);
    groundFx.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.size + 24, life: 0.45, color: unit._gapInvulnerableColor });
    addDamageText(unit.x, unit.y - unit.size - 8, unit._gapInvulnerableLabel, unit._gapInvulnerableColor, { sz: 12, bold: true });
  }

  const damageContextRuntime = createCombatDamageContextRuntime({
    riftBonusGold: () => ARENA_RIFT_BONUS_GOLD,
    view: () => {
      const v = view();
      return {
        state: v.state,
        arena: v.arena,
        units: v.units,
        enemies: v.enemies,
        projectiles: v.projectiles,
        currentStage: v.currentStage,
        frame: v.frame,
        groundFx: v.groundFx,
      };
    },
    emitParticle: addParticle,
    addDamageText,
    addHealEffect,
    randomRange: rnd,
    sound: deps.sound || {},
    shake,
    showFlash,
    arena_spawnPlayerImpactVfx: spawnImpactVfx,
    arena_statsRecordDamage: recordDamage,
    arena_statsRecordPrevented: recordPrevented,
    arena_applyHealingReceived: applyHealingReceivedRuntime,
    arena_addGoldShield: addGoldShieldRuntime,
    arena_spawnGhost: (...args) => (typeof deps.spawnGhost === 'function' ? deps.spawnGhost(...args) : null),
    arena_applyFelfelDeadlyPoison: (...args) => (typeof deps.applyFelfelDeadlyPoison === 'function' ? deps.applyFelfelDeadlyPoison(...args) : null),
    arena_spawnGhoul: (...args) => (typeof deps.spawnGhoul === 'function' ? deps.spawnGhoul(...args) : null),
    setVodkaDead: deps.setVodkaDead || (() => {}),
    setVodkaRespawn: deps.setVodkaRespawn || (() => {}),
    setVodkaUnit: deps.setVodkaUnit || (() => {}),
    addGold: deps.addGold || (() => {}),
    addStageGold: deps.addStageGold || (() => {}),
    dealDamageRuntime,
    handleCombatDeath,
  });

  function combatDamageContext() {
    return damageContextRuntime.combatDamageContext();
  }

  function dealDamage(target, raw, attacker, dmgType, attackTypeOverride, opts) {
    return damageContextRuntime.dealDamage(target, raw, attacker, dmgType, attackTypeOverride, opts);
  }

  function onDeath(target, killer) {
    return damageContextRuntime.onDeath(target, killer);
  }

  return {
    addParticle,
    addDamageText,
    addHealEffect,
    applyHealingReceived: applyHealingReceivedRuntime,
    resetStageStats,
    startRoundStats,
    recordDamage,
    recordPrevented,
    recordHeal,
    trackedHeal,
    finishRoundStats,
    formatStats,
    applySearingBrandOnBasic,
    applyRoyalStingOnBasic,
    isProtectedByTank,
    emberDecreeDamage,
    combatBounds,
    moveToward,
    clampToArena,
    fireDivineStorm,
    clampToLeash,
    resolvePlayerOverlaps,
    findTarget,
    isGripReserved,
    reserveGripTarget,
    isGapCloserReserved,
    reserveGapCloserTarget,
    findUnreservedEnemyInRange,
    targetingView,
    updateBossEngagement,
    isSaturatedTarget,
    isReachable,
    findEnemyForUnit,
    findRangedEnemyForUnit,
    findTankAnchor,
    findAllyForHealer,
    playerCombatColor,
    spawnAbilityCastVfx,
    spawnProjectileCastVfx,
    spawnImpactVfx,
    isZavsMeleeAlly,
    zavsBodyguardCovers,
    zavsAllyDmgMult,
    zavsAllyAtkSpdFactor,
    isBatataBacklineAlly,
    batataCovers,
    applyMuddied,
    batataHealingReceivedMult,
    addZavsShield,
    addGoldShield: addGoldShieldRuntime,
    addBatataShield: addBatataShieldRuntime,
    isTaoonPriorityEnemy,
    applyRuneWound,
    addTaoonBloodShield: addTaoonBloodShieldRuntime,
    taoonBloodTithe,
    grantGapInvulnerability,
    combatDamageContext,
    dealDamage,
    onDeath,
  };
}
