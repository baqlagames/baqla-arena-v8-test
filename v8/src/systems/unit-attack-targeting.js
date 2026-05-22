import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';
import { arenaEngagementBands, effectiveArenaAttackRange, isArenaRangedActor, limitBurstLanding } from './combat-targeting.js?v=20260522-warden-micro-boost';

function meleeBossOrbitPoint(unit, target) {
  const isTank = !!(unit && (unit.arch === 'tank' || unit.taunt));
  const radius = Math.max(68, (target.size || 46) * 0.98 + (unit.size || 18) * 0.56);
  if (isTank) {
    return { x: target.x, y: target.y + radius * 0.56 };
  }
  const slots = [
    { x: -radius * 0.88, y: radius * 0.22 },
    { x: radius * 0.88, y: radius * 0.22 },
    { x: -radius * 0.62, y: radius * 0.66 },
    { x: radius * 0.62, y: radius * 0.66 },
  ];
  const id = Math.abs((unit.unitIdx ?? unit.id ?? 0) | 0);
  const slot = slots[id % slots.length];
  return { x: target.x + slot.x, y: target.y + slot.y };
}

export function prepareUnitAttackTarget(unit, {
  arena,
  enemies,
  frame,
  arenaTop,
  arenaBottom,
  randomRange,
  findRangedEnemyForUnit,
  findEnemyForUnit,
  followFamiliarAnchor,
  isReachable,
  moveToward,
  clampToArena,
  clampToLeash,
  beamFx,
  groundEffects,
  emitParticle,
  addDamageText,
  sound,
  shake,
}) {
  if (unit.familiar) followFamiliarAnchor(unit);
  let target = unit.prefersRanged ? findRangedEnemyForUnit(unit) : findEnemyForUnit(unit);
  if (!target) {
    unit.target = null;
    if (unit.familiar) {
      followFamiliarAnchor(unit);
      return { canAttack: false };
    }
    if (unit.kind === 'mechTurret') return { canAttack: false };

    const isMelee = !isArenaRangedActor(unit);
    const marchSpeed = unit.speed * ((unit._bullCharging > 0 || unit._dgCharging > 0) ? 3 : 1);
    if (arena && arena.phase === 'wave') {
      const bands = arenaEngagementBands({ arenaTop, arenaBot: arenaBottom });
      const targetableEnemies = enemies.filter(enemy => enemy.hp > 0 && !enemy.charmed && !enemy.burrowing && !enemy.untargetable && !enemy.isBarrier);
      if (targetableEnemies.length === 0) {
        if (unit.homeX != null && Math.hypot(unit.x - unit.homeX, unit.y - unit.homeY) > 4) moveToward(unit, unit.homeX, unit.homeY, unit.speed * 0.45);
        return { canAttack: false };
      }
      const hasReachable = targetableEnemies.some(enemy => isReachable(unit, enemy));
      const airOnly = targetableEnemies.every(enemy => enemy.flying) && !hasReachable;
      if (isMelee && airOnly) {
        if (unit.homeX != null && Math.hypot(unit.x - unit.homeX, unit.y - unit.homeY) > 4) moveToward(unit, unit.homeX, unit.homeY, unit.speed * 0.45);
        return { canAttack: false };
      }
      if (isMelee) {
        moveToward(unit, unit.homeX || unit.x, bands.playerMeleeY, marchSpeed);
      } else {
        const advanceY = Math.max(bands.playerRangedY, unit.homeY - 70);
        moveToward(unit, unit.homeX, advanceY, unit.speed * 0.6);
      }
    } else if (unit.homeX != null) {
      if (!unit._idleWander || frame % 180 === 0) {
        unit._idleWander = { x: unit.homeX + randomRange(-12, 12), y: unit.homeY + randomRange(-8, 8) };
      }
      const dx = unit._idleWander.x - unit.x;
      const dy = unit._idleWander.y - unit.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        moveToward(unit, unit._idleWander.x, unit._idleWander.y, unit.speed * 0.3);
      }
    }
    return { canAttack: false };
  }

  unit.target = target;
  let distance = dist(unit, target);
  let attackRange = unit.range || 40;
  if (arena && arena.phase === 'wave') attackRange = effectiveArenaAttackRange(unit, { inArena: true });

  if (unit.shadowStep && unit.stealth && unit.stealthHits === 0 && !unit.firstHitDone && distance > attackRange && distance <= unit.shadowStep.range) {
    const fromX = unit.x;
    const fromY = unit.y;
    const offset = unit.shadowStep.landOffset || 25;
    const landing = limitBurstLanding(unit, target.x, target.y + offset, unit.shadowStep.maxJump || 115);
    unit.x = landing.x;
    unit.y = landing.y;
    if (typeof clampToLeash === 'function') clampToLeash(unit);
    else clampToArena(unit);
    emitParticle(fromX, fromY, '#5e1218', 16, 4);
    emitParticle(unit.x, unit.y, '#7a1a3a', 24, 5);
    for (let i = 0; i < 5; i++) {
      const tx = fromX + (unit.x - fromX) * (i / 5);
      const ty = fromY + (unit.y - fromY) * (i / 5);
      emitParticle(tx, ty, '#5e1218', 1, 3);
    }
    addDamageText(unit.x, unit.y - unit.size, 'SHADOWSTEP', '#a855f7');
    return { canAttack: false };
  }

  if (unit.paladinHybrid && (unit.justiceReachCD || 0) <= 0 && distance > 120 && distance < 500 && !(unit.mountTimer > 0)) {
    unit.mountTimer = 3 * GAME_TICK_HZ;
    unit.mountSpeedMult = 2.8;
    unit.mountDR = 0.40;
    unit.justiceReachCD = 15 * GAME_TICK_HZ;
    for (let i = 0; i < 10; i++) {
      const angle = i / 10 * Math.PI * 2;
      emitParticle(unit.x + Math.cos(angle) * 24, unit.y + Math.sin(angle) * 24, '#ffd700', 14, 3);
    }
    emitParticle(unit.x, unit.y, '#ffffff', 14, 5);
    emitParticle(unit.x, unit.y, '#ffe066', 20, 4);
    beamFx.push({ x1: unit.x - unit.size, y1: unit.y - unit.size * 0.3, x2: unit.x - unit.size * 2, y2: unit.y - unit.size * 1.5, color: '#ffd700', width: 3, life: 0.25, maxLife: 0.25, straight: true });
    beamFx.push({ x1: unit.x + unit.size, y1: unit.y - unit.size * 0.3, x2: unit.x + unit.size * 2, y2: unit.y - unit.size * 1.5, color: '#ffd700', width: 3, life: 0.25, maxLife: 0.25, straight: true });
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 45, life: 0.5, color: '#ffd700' });
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 28, life: 0.3, color: '#ffffff' });
    addDamageText(unit.x, unit.y - unit.size, 'CRUSADER CHARGE!', '#ffd700', { sz: 14, bold: true });
    shake(4);
    sound.buff();
  }

  const chargeSpeed = (unit._bullCharging > 0 || unit._dgCharging > 0) ? 3 : 1;
  const paladinSpeed = unit.speed * ((unit.mountTimer > 0) ? (unit.mountSpeedMult || 2.8) : chargeSpeed);
  const meleeBossSlot = arena && arena.phase === 'wave' && !isArenaRangedActor(unit) && (target.isBoss || target.isElite)
    ? meleeBossOrbitPoint(unit, target)
    : null;
  if (unit.paladinHybrid && distance > 50) {
    moveToward(unit, meleeBossSlot ? meleeBossSlot.x : target.x, meleeBossSlot ? meleeBossSlot.y : target.y, paladinSpeed);
    if (distance > attackRange || unit.cd > 0) return { canAttack: false };
  } else if (distance > attackRange) {
    if (unit.familiar) {
      followFamiliarAnchor(unit);
      return { canAttack: false };
    }
    if (unit.kind === 'mechTurret') return { canAttack: false };
    if (unit.speed > 0) {
      moveToward(unit, meleeBossSlot ? meleeBossSlot.x : target.x, meleeBossSlot ? meleeBossSlot.y : target.y, paladinSpeed);
      return { canAttack: false };
    }

    let inRangeTarget = null;
    let inRangeDistance = Infinity;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && !enemy.charmed && !enemy.burrowing && !enemy.untargetable) {
        const enemyDistance = dist(unit, enemy);
        if (enemyDistance <= attackRange && enemyDistance < inRangeDistance) {
          inRangeDistance = enemyDistance;
          inRangeTarget = enemy;
        }
      }
    }
    if (!inRangeTarget) return { canAttack: false };
    target = inRangeTarget;
    distance = inRangeDistance;
  }
  if (meleeBossSlot && unit.speed > 0 && Math.hypot(unit.x - meleeBossSlot.x, unit.y - meleeBossSlot.y) > 7) {
    moveToward(unit, meleeBossSlot.x, meleeBossSlot.y, unit.speed * 0.45);
  }

  return { canAttack: true, target, distance };
}
