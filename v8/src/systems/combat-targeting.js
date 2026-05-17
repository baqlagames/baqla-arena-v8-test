import { dist } from '../core/math.js';

const MOVE_SPEED_SCALE = 0.55;
const ENEMY_SPEED_SCALE = 0.85;
const MAX_BOSS_ENGAGE = 3;
const BOSS_ENGAGE_DIST = 110;

export function clampActorToArena(actor, bounds) {
  const m = (actor.size || 16) * 0.5 + 2;
  if (actor.x < bounds.arenaLeft + m) actor.x = bounds.arenaLeft + m;
  else if (actor.x > bounds.arenaRight - m) actor.x = bounds.arenaRight - m;
  if (actor.y < bounds.arenaTop + Math.max(m, 55)) actor.y = bounds.arenaTop + Math.max(m, 55);
  else if (actor.y > bounds.arenaBot - m) actor.y = bounds.arenaBot - m;

  if (actor.isPlayer && bounds.playerCastle && actor.y > bounds.playerCastle.y - 12) actor.y = bounds.playerCastle.y - 12;
  if (actor.isEnemy && bounds.enemyCastle && actor.y < bounds.enemyCastle.y + 12) actor.y = bounds.enemyCastle.y + 12;
}

export function moveActorToward(actor, tx, ty, speed, bounds) {
  if (actor.isPlayer && actor.homeX != null) {
    const stepDx = tx - actor.x;
    const stepDy = ty - actor.y;
    const stepD = Math.sqrt(stepDx * stepDx + stepDy * stepDy);
    if (stepD < 0.5) return;

    const slowFactor = actor.stunned > 0 ? 0 : (actor.slowMult || 1);
    const scaledSpeed = speed * MOVE_SPEED_SCALE * slowFactor;
    const candX = actor.x + (stepDx / stepD) * scaledSpeed;
    const candY = actor.y + (stepDy / stepD) * scaledSpeed;
    const dyFromHome = candY - actor.homeY;
    const dxFromHome = Math.abs(candX - actor.homeX);
    const yOk = dyFromHome >= -bounds.leashForward && dyFromHome <= bounds.leashBack;
    const xOk = dxFromHome <= bounds.leashSide;

    if (yOk && xOk) {
      actor.x = candX;
      actor.y = candY;
    } else {
      const curDxH = Math.abs(actor.x - actor.homeX);
      const curDyHsigned = actor.y - actor.homeY;
      const curOutsideX = curDxH > bounds.leashSide;
      const curOutsideY = curDyHsigned < -bounds.leashForward || curDyHsigned > bounds.leashBack;
      if (curOutsideX && dxFromHome <= curDxH + 0.01) actor.x = candX;
      if (curOutsideY) {
        const newDyHsigned = candY - actor.homeY;
        const curOver = curDyHsigned < -bounds.leashForward ? (-bounds.leashForward - curDyHsigned) : (curDyHsigned - bounds.leashBack);
        const newOver = newDyHsigned < -bounds.leashForward
          ? (-bounds.leashForward - newDyHsigned)
          : (newDyHsigned > bounds.leashBack ? (newDyHsigned - bounds.leashBack) : 0);
        if (newOver <= curOver + 0.01) actor.y = candY;
      }
    }

    actor.facing = stepDx >= 0 ? 1 : -1;
    clampActorToArena(actor, bounds);
    return;
  }

  const dx = tx - actor.x;
  const dy = ty - actor.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 0.5) return;
  const slowFactor = actor.stunned > 0 ? 0 : (actor.slowMult || 1);
  const teamScale = (actor.isEnemy || actor.isBoss) ? ENEMY_SPEED_SCALE : 1;
  const scaledSpeed = speed * MOVE_SPEED_SCALE * teamScale * slowFactor;
  actor.x += (dx / d) * scaledSpeed;
  actor.y += (dy / d) * scaledSpeed;
  actor.facing = dx >= 0 ? 1 : -1;
  clampActorToArena(actor, bounds);
}

export function clampActorToLeash(actor, bounds) {
  if (!actor || !actor.isPlayer || actor.homeX == null || actor.homeY == null) return;
  const xLo = actor.homeX - bounds.leashSide + 8;
  const xHi = actor.homeX + bounds.leashSide - 8;
  const yLo = actor.homeY - bounds.leashForward + 12;
  const yHi = actor.homeY + bounds.leashBack - 12;
  if (actor.x < xLo) actor.x = xLo;
  else if (actor.x > xHi) actor.x = xHi;
  if (actor.y < yLo) actor.y = yLo;
  else if (actor.y > yHi) actor.y = yHi;
  clampActorToArena(actor, bounds);
}

export function findNearestTarget(unit, list) {
  let best = null;
  let bestD = Infinity;
  for (const target of list) {
    if (target.hp <= 0) continue;
    const d = dist(unit, target);
    if (d < bestD) {
      bestD = d;
      best = target;
    }
  }
  return best;
}

export function updateBossEngagementCounts({ enemies, units, bossEngageDist = BOSS_ENGAGE_DIST }) {
  for (const enemy of enemies) {
    if (enemy.isBoss || enemy.isElite) enemy.engagedByCount = 0;
  }
  for (const unit of units) {
    if (!unit.isPlayer || unit.hp <= 0 || unit.isMinion) continue;
    for (const enemy of enemies) {
      if (!(enemy.isBoss || enemy.isElite)) continue;
      if (dist(unit, enemy) < bossEngageDist) enemy.engagedByCount = (enemy.engagedByCount || 0) + 1;
    }
  }
}

export function isSaturatedCombatTarget(target, maxBossEngage = MAX_BOSS_ENGAGE) {
  return (target.isBoss || target.isElite) && (target.engagedByCount || 0) >= maxBossEngage;
}

export function isReachableFromLeash(unit, target, bounds) {
  if (!unit.isPlayer || unit.homeX == null) return true;
  if (target.fromRift) return true;
  if (unit.paladinHybrid) {
    const paladinDistance = Math.abs(target.x - unit.homeX) + Math.abs(target.y - unit.homeY);
    return paladinDistance < 400;
  }

  const range = unit.range || 40;
  const minY = unit.homeY - bounds.leashForward - range;
  const maxY = unit.homeY + bounds.leashBack + range;
  const minX = unit.homeX - bounds.leashSide - range;
  const maxX = unit.homeX + bounds.leashSide + range;
  if (target.x >= minX && target.x <= maxX && target.y >= minY && target.y <= maxY) return true;

  const displacedY = Math.abs(unit.y - unit.homeY);
  const displacedX = Math.abs(unit.x - unit.homeX);
  if (displacedY > 30 || displacedX > 30) {
    const currentDistance = dist(unit, target);
    if (currentDistance <= range + 20) return true;
  }
  return false;
}

export function findEnemyTargetForUnit(unit, view) {
  const candidates = [];
  for (const enemy of view.enemies) {
    if (enemy.hp <= 0 || enemy.charmed) continue;
    if (enemy.burrowing) continue;
    if (enemy.untargetable) continue;
    if (enemy.isBarrier) continue;
    candidates.push(enemy);
  }
  if (view.enemyCastle && view.enemyCastle.hp > 0) candidates.push(view.enemyCastle);
  for (const tower of view.towers || []) {
    if (tower.hp > 0 && tower.isEnemy) candidates.push(tower);
  }

  let best = null;
  let bestD = Infinity;
  let bestAlt = null;
  let bestAltD = Infinity;
  let bestReach = null;
  let bestReachScore = Infinity;
  const meleeForwardBias = view.inArena && !unit.prefersRanged;

  for (const target of candidates) {
    const d = dist(unit, target);
    if (d < bestD) {
      bestD = d;
      best = target;
    }
    if (!isSaturatedCombatTarget(target, view.maxBossEngage) && d < bestAltD) {
      bestAltD = d;
      bestAlt = target;
    }
    if (view.inArena && isReachableFromLeash(unit, target, view)) {
      let score = d;
      if (meleeForwardBias && target.y != null && unit.homeY != null) {
        const forwardness = unit.homeY - target.y;
        if (forwardness > 0) score -= Math.min(80, forwardness * 0.5);
        else score += Math.min(60, (-forwardness) * 0.6);
      }
      if (score < bestReachScore) {
        bestReachScore = score;
        bestReach = target;
      }
    }
  }

  if (view.inArena) {
    if (bestReach) return bestReach;
    if (best && best.flying && !unit.prefersRanged) return null;
    return best || null;
  }

  if (best && isSaturatedCombatTarget(best, view.maxBossEngage) && bestAlt && bestAlt !== best) return bestAlt;
  return best;
}

export function findRangedEnemyTargetForUnit(unit, view) {
  let best = null;
  let bestD = Infinity;
  let bestReach = null;
  let bestReachD = Infinity;
  for (const enemy of view.enemies) {
    if (enemy.hp <= 0 || enemy.charmed) continue;
    if (enemy.untargetable || enemy.isBarrier) continue;
    if (enemy.arch !== 'ranged' && enemy.arch !== 'caster') continue;
    const d = dist(unit, enemy);
    if (d < bestD) {
      bestD = d;
      best = enemy;
    }
    if (view.inArena && isReachableFromLeash(unit, enemy, view) && d < bestReachD) {
      bestReachD = d;
      bestReach = enemy;
    }
  }
  if (view.inArena) {
    if (bestReach) return bestReach;
    return findEnemyTargetForUnit(unit, view);
  }
  return best || findEnemyTargetForUnit(unit, view);
}
