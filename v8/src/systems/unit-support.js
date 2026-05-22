import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function calculateAllyDamageMultiplier(unit, {
  units,
  zavsAllyDamageMultiplier,
}) {
  let bestChampion = 1;
  let bestStandard = 1;
  for (const ally of units) {
    if (ally === unit || ally.hp <= 0 || !ally.isPlayer) continue;
    if (ally.champion && ally.champion.mult > bestChampion) bestChampion = ally.champion.mult;
    if (ally.battleStandard && ally.battleStandard.placed) {
      const standard = ally.battleStandard;
      if (Math.hypot(unit.x - standard.x, unit.y - standard.y) <= standard.radius && standard.mult > bestStandard) {
        bestStandard = standard.mult;
      }
    }
  }
  let multiplier = bestChampion * bestStandard;
  multiplier *= zavsAllyDamageMultiplier(unit);
  if (unit._astralPower && unit._astralPower.stacks > 0) multiplier *= (1 + unit._astralPower.stacks * unit._astralPower.dmgPerStack);
  if (unit._celestialAlignment) multiplier *= 1.25;
  if (unit.sisterhoodMult || (unit.isMirror && unit.parent && unit.parent.sisterhoodMult)) {
    const root = unit.isMirror ? unit.parent : unit;
    if (root) {
      let alive = root.hp > 0 ? 1 : 0;
      for (const ally of units) {
        if (ally.hp <= 0) continue;
        if (ally.isMirror && ally.parent === root) alive++;
      }
      if (alive >= 2) multiplier *= (root.sisterhoodMult || 1);
    }
  }
  return multiplier;
}

export function applyBeaconSplash(healer, target, healAmount, {
  units,
  projectiles,
  applyTrackedHeal,
}) {
  if (!healer._beaconOfVirtue || healer._beaconOfVirtue.timer <= 0) return;
  const candidates = [];
  for (const ally of units) {
    if (ally === target || ally === healer || ally.hp <= 0 || !ally.isPlayer || ally.isGhost) continue;
    if (ally.hp >= ally.maxHp) continue;
    candidates.push(ally);
  }
  candidates.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
  const splashTargets = candidates.slice(0, 4);
  for (const ally of splashTargets) {
    applyTrackedHeal(ally, Math.round(healAmount * healer._beaconOfVirtue.mult), healer, true);
    projectiles.push({ x: target.x, y: target.y, target: ally, tx: ally.x, ty: ally.y, speed: 2, projType: 'pomOrb', visualOnly: true, color: '#ffd700', _arrN: 6, _arrSz: 2, isPlayer: true, dmg: 0 });
  }
}

export function findLowestAlly(unit, maxRange, skip, { units }) {
  let best = null;
  let bestPct = Infinity;
  for (const ally of units) {
    if (ally.hp <= 0 || !ally.isPlayer) continue;
    if (skip && ally === skip) continue;
    if (ally.isGhost) continue;
    if (ally.hp >= ally.maxHp) continue;
    if (maxRange && dist(unit, ally) > maxRange) continue;
    const pct = ally.hp / ally.maxHp;
    if (pct < bestPct) {
      bestPct = pct;
      best = ally;
    }
  }
  return best;
}

export function tickHealerTriage(unit, {
  arena,
  units,
  frame,
  projectiles,
  applyTrackedHeal,
  drainHealToBarrier,
  addDamageText,
}) {
  if (!unit || unit.arch !== 'healer' || unit.hp <= 0 || unit.isGhost || unit.untargetable) return;
  if (!arena || arena.phase !== 'wave') return;
  if ((unit._stormSilenceTimer || 0) > 0 || (unit.silenceTimer || 0) > 0) return;
  if (!unit.healAmt) return;
  if (unit.healCDt > 0) {
    unit.healCDt--;
    return;
  }
  const range = Math.max(190, (unit.range || 160) + 55);
  let best = null;
  let bestPct = 1;
  let bestTank = null;
  let bestTankPct = 1;
  for (const ally of units) {
    if (ally.hp <= 0 || !ally.isPlayer || ally.isGhost || ally.isMinion) continue;
    if (ally.hp >= ally.maxHp) continue;
    if (dist(unit, ally) > range) continue;
    const pct = ally.hp / ally.maxHp;
    if (pct < bestPct) {
      bestPct = pct;
      best = ally;
    }
    if ((ally.arch === 'tank' || ally.taunt) && pct < bestTankPct) {
      bestTankPct = pct;
      bestTank = ally;
    }
  }
  const target = bestTankPct < 0.72 ? bestTank : best;
  if (!target || bestPct > 0.92) return;
  unit.healCDt = unit.healCD || 90;
  const roleMult = unit.unitIdx === 10 ? 0.84 : (unit.unitIdx === 12 ? 0.62 : unit.unitIdx === 11 ? 0.72 : 0.78);
  const heal = applyTrackedHeal(target, Math.max(8, Math.round((unit.healAmt || 60) * roleMult)), unit, false);
  if (heal <= 0) return;
  unit._healCast = 20;
  unit._healCastCount = (unit._healCastCount || 0) + 1;
  unit._lastHealTarget = target;
  unit._lastHealAmt = heal;
  drainHealToBarrier(heal, unit);
  const color = unit.unitIdx === 10 ? '#fff2aa' : unit.unitIdx === 11 ? '#66ff88' : '#88cc66';
  projectiles.push({ x: unit.x, y: unit.y, target, tx: target.x, ty: target.y, speed: 3, projType: 'pomOrb', visualOnly: true, color, _arrN: 8, _arrSz: 3, _arrGnd: 18, isPlayer: true, dmg: 0 });
  if (frame % 12 === 0) addDamageText(unit.x, unit.y - unit.size, 'TRIAGE', '#66ffaa');
}

export function findEmergencyTarget(unit, maxRange, threshold, { units }) {
  let bestTank = null;
  let bestTankPct = Infinity;
  let bestAny = null;
  let bestAnyPct = Infinity;
  for (const ally of units) {
    if (ally.hp <= 0 || !ally.isPlayer || ally === unit || ally.isGhost) continue;
    if (maxRange && dist(unit, ally) > maxRange) continue;
    const pct = ally.hp / ally.maxHp;
    if (pct >= threshold) continue;
    if (ally.arch === 'tank' && pct < bestTankPct) {
      bestTankPct = pct;
      bestTank = ally;
    }
    if (pct < bestAnyPct) {
      bestAnyPct = pct;
      bestAny = ally;
    }
  }
  return bestTank || bestAny;
}

export function updateCharmedEnemy(enemy, {
  enemies,
  dealDamage,
  emitParticle,
}) {
  if (enemy.hp <= 0) return;
  if (enemy.cd > 0) enemy.cd--;
  if (enemy.stunned > 0) {
    enemy.stunned--;
    return;
  }
  let near = null;
  let nearDistance = Infinity;
  for (const other of enemies) {
    if (other === enemy || other.hp <= 0 || other.charmed) continue;
    const distance = dist(enemy, other);
    if (distance < nearDistance) {
      nearDistance = distance;
      near = other;
    }
  }
  if (!near) {
    enemy.bobPhase = (enemy.bobPhase || 0) + 0.06;
    return;
  }
  const range = enemy.range || 32;
  if (nearDistance > range) {
    const speed = enemy.speed || 0.18;
    const dx = near.x - enemy.x;
    const dy = near.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;
    enemy.x += (dx / distance) * speed * GAME_TICK_HZ * 0.0625;
    enemy.y += (dy / distance) * speed * GAME_TICK_HZ * 0.0625;
    enemy.facing = Math.sign(dx) || enemy.facing || 1;
    return;
  }
  if (enemy.cd <= 0) {
    enemy.cd = enemy.atkSpd || 60;
    dealDamage(near, enemy.dmg, enemy.charmedBy || null, 'normal');
    emitParticle(near.x, near.y, '#a855f7', 6, 3);
  }
  enemy.bobPhase = (enemy.bobPhase || 0) + 0.06;
}

export function spawnFelfelMirror(parent, level, {
  units,
  randomRange,
  setPassive,
  isCapstoneLevel,
  emitParticle,
  groundEffects,
  addDamageText,
}) {
  const baseHp = parent.maxHp || 200;
  const hp = Math.round(baseHp * 0.60);
  const mirror = {
    x: parent.x + randomRange(-18, 18),
    y: parent.y + randomRange(-12, 12),
    maxHp: hp,
    hp,
    dmg: parent.dmg,
    speed: parent.speed,
    atkSpd: parent.atkSpd,
    range: parent.range,
    size: (parent.size || 16) * 0.95,
    armor: parent.armor || 0,
    magicRes: parent.magicRes || 0,
    isPlayer: true,
    isMinion: true,
    isMirror: true,
    parent,
    kind: 'felfelMirror',
    attackType: parent.attackType || 'physical',
    cd: 0,
    facing: 1,
    branch: parent.branch || null,
    color: '#5e1218',
    accent: '#2a0509',
    bobPhase: Math.random() * Math.PI * 2,
    drawFn: 'drawFelfel',
    arch: parent.arch || 'melee',
    activeBuffs: [],
  };
  setPassive(mirror, 'shadowStrike', 1 + 0.10 * (level - 1), isCapstoneLevel(level) ? 1.5 : 1.0);
  units.push(mirror);
  emitParticle(parent.x, parent.y, '#5e1218', 24, 5);
  emitParticle(mirror.x, mirror.y, '#aa3366', 32, 6);
  emitParticle(mirror.x, mirror.y, '#ffffff', 10, 4);
  groundEffects.push({ x: mirror.x, y: mirror.y, r: 0, maxR: 34, life: 0.45, color: '#aa3366' });
  for (let i = 0; i < 4; i++) emitParticle(mirror.x + randomRange(-8, 8), mirror.y + randomRange(-12, 4), '#7a1a3a', 1, 3);
  addDamageText(parent.x, parent.y - parent.size, 'MIRROR', '#aa3366');
}

export function spawnGhost(src, {
  units,
  emitParticle,
  addDamageText,
  showFlash,
}) {
  const ghost = {
    isPlayer: true,
    isGhost: true,
    untargetable: true,
    x: src.x,
    y: src.y,
    size: Math.max(14, src.size || 16),
    hp: 1,
    maxHp: 1,
    dmg: src.dmg,
    speed: src.ghostOnDeath.speed,
    radius: src.ghostOnDeath.radius,
    dmgMult: src.ghostOnDeath.dmgMult,
    color: '#cccccc',
    accent: '#666',
    drawFn: null,
    sourceUnit: src,
    facing: 1,
    bobPhase: Math.random() * Math.PI * 2,
    cd: 0,
    target: null,
    arch: 'ghost',
    activeBuffs: [],
    lifeTicks: 6 * GAME_TICK_HZ,
  };
  units.push(ghost);
  emitParticle(src.x, src.y, '#dddddd', 32, 6);
  addDamageText(src.x, src.y - src.size, 'GHOST!', '#dddddd');
  showFlash('SAPPER GHOST RISES', '#dddddd', 45);
}

export function updateGhostUnit(unit, {
  enemies,
  moveToward,
  dealDamage,
  emitParticle,
  groundEffects,
  addDamageText,
  shake,
}) {
  if (!unit.isGhost) return false;
  unit.lifeTicks--;
  if (unit.lifeTicks <= 0) {
    unit.hp = 0;
    unit.removed = true;
    return true;
  }
  let near = null;
  let nearDistance = Infinity;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const distance = dist(unit, enemy);
    if (distance < nearDistance) {
      nearDistance = distance;
      near = enemy;
    }
  }
  if (!near) {
    unit.bobPhase += 0.1;
    return true;
  }
  moveToward(unit, near.x, near.y, unit.speed);
  if (nearDistance <= Math.max(20, (unit.size || 14) + (near.size || 14)) * 0.7) {
    const radius = unit.radius;
    const damage = Math.round(unit.dmg * unit.dmgMult);
    for (const enemy of enemies) {
      if (enemy.hp > 0 && dist(unit, enemy) <= radius) dealDamage(enemy, damage, unit, 'normal');
    }
    emitParticle(unit.x, unit.y, '#dddddd', 64, 8);
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: radius, life: 0.55, color: '#dddddd' });
    addDamageText(unit.x, unit.y - unit.size, 'BOOM!', '#dddddd');
    shake(12);
    unit.hp = 0;
    unit.removed = true;
  }
  unit.bobPhase += 0.12;
  return true;
}
