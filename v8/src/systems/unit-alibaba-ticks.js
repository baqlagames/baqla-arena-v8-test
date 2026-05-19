import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function tickUnitAlibabaPassives(unit, {
  frame,
  enemies,
  arenaBounds,
  groundEffects,
  randomRange,
  dealDamage,
  findBestEnemyClusterPoint,
  emitParticle,
  addDamageText,
  shake,
}) {
  tickCombustion(unit, { frame, randomRange, emitParticle, addDamageText });
  tickIcyVeins(unit, { frame, randomRange, emitParticle, addDamageText });
  tickAscendance(unit, { frame, randomRange, groundEffects, emitParticle, addDamageText });
  tickFlameCircle(unit, { frame, enemies, groundEffects, randomRange, dealDamage, emitParticle });
  tickInfernoOrb(unit, { frame, enemies, arenaBounds, groundEffects, randomRange, dealDamage, findBestEnemyClusterPoint, emitParticle, addDamageText, shake });
  tickBlizzard(unit, { frame, enemies, randomRange, dealDamage, emitParticle });
  tickIceBarrier(unit, { enemies, emitParticle, addDamageText, shake });
  tickFrozenOrb(unit, { frame, enemies, arenaBounds, groundEffects, randomRange, dealDamage, findBestEnemyClusterPoint, emitParticle });
  tickThunderstorm(unit, { frame, enemies, arenaBounds, groundEffects, randomRange, dealDamage, emitParticle, addDamageText, shake });
}

function tickCombustion(unit, {
  frame,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (!(unit._combustionTimer > 0)) return;

  unit._combustionTimer--;
  if (frame % 4 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.3, '#ff4400', 1, 3);
  if (unit._combustionTimer <= 0) {
    if (unit.crit && unit._combustOrigCrit != null) {
      unit.crit.chance = unit._combustOrigCrit;
      unit._combustOrigCrit = null;
    }
    addDamageText(unit.x, unit.y - unit.size, 'COMBUSTION ENDS', '#996600');
  }
}

function tickIcyVeins(unit, {
  frame,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (!(unit._icyVeinsTimer > 0)) return;

  unit._icyVeinsTimer--;
  if (frame % 6 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y + randomRange(-unit.size * 0.3, unit.size * 0.3), '#88ddff', 1, 3);
  if (unit._icyVeinsTimer <= 0) {
    if (unit._ivOrigAtkSpd != null) {
      unit.atkSpd = unit._ivOrigAtkSpd;
      unit._ivOrigAtkSpd = null;
    }
    addDamageText(unit.x, unit.y - unit.size, 'ICY VEINS ENDS', '#4488aa');
  }
}

function tickAscendance(unit, {
  frame,
  randomRange,
  groundEffects,
  emitParticle,
  addDamageText,
}) {
  if (!(unit._ascendanceTimer > 0)) return;

  unit._ascendanceTimer--;
  if (frame % 4 === 0) {
    emitParticle(unit.x + randomRange(-unit.size * 0.6, unit.size * 0.6), unit.y + randomRange(-unit.size * 0.4, unit.size * 0.4), '#aa88ff', 1, 3);
    const angle = Math.random() * Math.PI * 2;
    const radius = unit.size * 1.2;
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 0, life: 0.15, lightningBolt: true, lbX2: unit.x + Math.cos(angle) * radius, lbY2: unit.y + Math.sin(angle) * radius, color: '#aa88ff' });
  }
  if (unit._ascendanceTimer <= 0) {
    if (unit.overload && unit._ascOrigChain != null) {
      unit.overload.chainCount = unit._ascOrigChain;
      unit._ascOrigChain = null;
      unit.overload.chance = unit._ascOrigChance;
      unit._ascOrigChance = null;
    }
    addDamageText(unit.x, unit.y - unit.size, 'ASCENDANCE ENDS', '#6644aa');
  }
}

function tickFlameCircle(unit, {
  frame,
  enemies,
  groundEffects,
  randomRange,
  dealDamage,
  emitParticle,
}) {
  if (!unit._flameCircle) return;

  const circle = unit._flameCircle;
  circle.timer--;
  circle.tick--;
  if (circle.tick <= 0) {
    circle.tick = 15;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && Math.hypot(enemy.x - circle.x, enemy.y - circle.y) <= circle.r) {
        dealDamage(enemy, circle.dmg, circle.from, 'magic');
        if (frame % 6 < 2) emitParticle(enemy.x + randomRange(-7, 7), enemy.y + randomRange(-7, 7), '#ff6600', 2, 3);
      }
    }
    groundEffects.push({ x: circle.x, y: circle.y, r: 0, maxR: circle.r, life: 0.22, color: '#ff4400' });
  }
  if (frame % 5 === 0) {
    const angle = Math.random() * Math.PI * 2;
    const radius = circle.r * (0.25 + Math.random() * 0.72);
    emitParticle(circle.x + Math.cos(angle) * radius, circle.y + Math.sin(angle) * radius, Math.random() < 0.5 ? '#ff4400' : '#ffaa00', 2, 3);
  }
  if (circle.timer <= 0) unit._flameCircle = null;
}

function tickInfernoOrb(unit, {
  frame,
  enemies,
  arenaBounds,
  groundEffects,
  randomRange,
  dealDamage,
  findBestEnemyClusterPoint,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!unit._infernoOrb) return;

  const orb = unit._infernoOrb;
  const best = findBestEnemyClusterPoint({ x: orb.x, y: orb.y }, 260, 110);
  if (best) {
    const desired = Math.atan2(best.y - orb.y, best.x - orb.x);
    const delta = Math.atan2(Math.sin(desired - orb.ang), Math.cos(desired - orb.ang));
    orb.ang += Math.max(-0.09, Math.min(0.09, delta));
  }
  orb.x += Math.cos(orb.ang) * orb.speed;
  orb.y += Math.sin(orb.ang) * orb.speed;
  orb.timer--;
  orb.tickCD--;
  if (orb.tickCD <= 0) {
    orb.tickCD = orb.tickEvery || 12;
    let hit = 0;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && Math.hypot(enemy.x - orb.x, enemy.y - orb.y) <= orb.radius) {
        dealDamage(enemy, orb.dmg, orb.from, 'magic');
        const wasCursed = enemy._flameCurseTimer > 0;
        enemy._flameCurseTimer = 3 * GAME_TICK_HZ;
        if (!wasCursed) enemy._flameCurseTick = 0;
        enemy._flameCurseDmg = Math.max(1, Math.round(((orb.from && orb.from.dmg) || orb.dmg || 1) * 0.06));
        enemy._flameCurseFrom = orb.from;
        enemy._flameCurseDamageMult = 0.95;
        emitParticle(enemy.x, enemy.y, '#ff6600', 5, 3);
        emitParticle(enemy.x + randomRange(-6, 6), enemy.y - randomRange(0, enemy.size || 18), '#ffaa33', 2, 2);
        if (!wasCursed) addDamageText(enemy.x, enemy.y - (enemy.size || 18), 'FLAME CURSE', '#ff6633', { sz: 11, bold: true });
        hit++;
      }
    }
    groundEffects.push({ x: orb.x, y: orb.y, r: 0, maxR: orb.radius, life: 0.35, color: '#ff4400' });
    groundEffects.push({ x: orb.x, y: orb.y, r: 0, maxR: orb.radius * 0.58, life: 0.22, color: '#ffaa00' });
    if (hit) shake(3);
  }
  if (frame % 3 === 0) {
    emitParticle(orb.x + randomRange(-orb.radius * 0.18, orb.radius * 0.18), orb.y + randomRange(-orb.radius * 0.18, orb.radius * 0.18), '#ff6600', 2, 4);
    emitParticle(orb.x + randomRange(-orb.radius * 0.12, orb.radius * 0.12), orb.y + randomRange(-orb.radius * 0.12, orb.radius * 0.12), '#ffcc00', 1, 3);
  }
  if (orb.timer <= 0 || orb.x < arenaBounds.left - 50 || orb.x > arenaBounds.right + 50 || orb.y < arenaBounds.top - 50 || orb.y > arenaBounds.bottom + 50) unit._infernoOrb = null;
}

function tickBlizzard(unit, {
  frame,
  enemies,
  randomRange,
  dealDamage,
  emitParticle,
}) {
  if (!(unit._blizzardTimer > 0)) return;

  unit._blizzardTimer--;
  if (frame % 15 === 0) {
    const radius = unit._blizzardRadius || 70;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && Math.hypot(enemy.x - unit._blizzardX, enemy.y - unit._blizzardY) <= radius) {
        dealDamage(enemy, unit._blizzardDmg, unit, 'magic');
        enemy.slowTimer = Math.max(enemy.slowTimer || 0, 60);
        enemy.slowMult = Math.min(enemy.slowMult || 1, 0.60);
        emitParticle(enemy.x, enemy.y, '#88ddff', 4, 2);
      }
    }
  }
  if (frame % 6 === 0) emitParticle(unit._blizzardX + randomRange(-60, 60), unit._blizzardY + randomRange(-60, 60), '#ddeeff', 1, 2);
  if (unit._blizzardTimer <= 0) {
    unit._blizzardX = null;
    unit._blizzardY = null;
  }
}

function tickIceBarrier(unit, {
  enemies,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!unit._iceBarrier) return;

  unit._iceBarrier.dur--;
  if (unit._iceBarrier.dur > 0 && unit._iceBarrier.hp > 0) return;

  if (unit._iceBarrier.hp <= 0) {
    for (const enemy of enemies) {
      if (enemy.hp > 0 && dist(unit, enemy) < 90 && !enemy.isBoss) {
        enemy.stunned = Math.max(enemy.stunned || 0, Math.round(1.5 * GAME_TICK_HZ));
        emitParticle(enemy.x, enemy.y, '#88ddff', 12, 4);
      }
    }
    addDamageText(unit.x, unit.y - unit.size, 'BARRIER SHATTER!', '#66ccff');
    shake(6);
  }
  unit._iceBarrier = null;
}

function tickFrozenOrb(unit, {
  frame,
  enemies,
  arenaBounds,
  groundEffects,
  randomRange,
  dealDamage,
  findBestEnemyClusterPoint,
  emitParticle,
}) {
  if (!unit._frozenOrb) return;

  const orb = unit._frozenOrb;
  const best = findBestEnemyClusterPoint({ x: orb.x, y: orb.y }, 300, 110);
  if (best) {
    const desired = Math.atan2(best.y - orb.y, best.x - orb.x);
    const delta = Math.atan2(Math.sin(desired - orb.ang), Math.cos(desired - orb.ang));
    const steer = orb.homing || 0.08;
    orb.ang += Math.max(-steer, Math.min(steer, delta));
  }
  orb.x += Math.cos(orb.ang) * orb.speed;
  orb.y += Math.sin(orb.ang) * orb.speed;
  orb.timer--;
  orb.tickCD--;
  if (orb.tickCD <= 0) {
    orb.tickCD = orb.tickEvery || 12;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && Math.hypot(enemy.x - orb.x, enemy.y - orb.y) <= orb.radius) {
        dealDamage(enemy, orb.dmg, orb.from, 'magic');
        enemy.slowTimer = Math.max(enemy.slowTimer || 0, 96);
        enemy.slowMult = Math.min(enemy.slowMult || 1, 0.50);
        if (!enemy.isBoss) {
          enemy.rooted = true;
          enemy.rootTimer = Math.max(enemy.rootTimer || 0, Math.round(0.5 * GAME_TICK_HZ));
          enemy.rootX = enemy.x;
          enemy.rootY = enemy.y;
        }
        emitParticle(enemy.x, enemy.y, '#88ddff', 6, 3);
      }
    }
    groundEffects.push({ x: orb.x, y: orb.y, r: 0, maxR: orb.radius, life: 0.22, color: '#88ddff' });
  }
  if (frame % 3 === 0) {
    emitParticle(orb.x + randomRange(-16, 16), orb.y + randomRange(-16, 16), '#66ccff', 1, 3);
    emitParticle(orb.x + randomRange(-10, 10), orb.y + randomRange(-10, 10), '#ffffff', 1, 2);
  }
  if (orb.timer <= 0 || orb.x < arenaBounds.left - 20 || orb.x > arenaBounds.right + 20 || orb.y < arenaBounds.top - 20 || orb.y > arenaBounds.bottom + 20) unit._frozenOrb = null;
}

function tickThunderstorm(unit, {
  frame,
  enemies,
  arenaBounds,
  groundEffects,
  randomRange,
  dealDamage,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!unit._thunderstorm) return;

  const storm = unit._thunderstorm;
  storm.timer--;
  storm.tickCD--;

  if (frame % 4 === 0) {
    emitParticle(unit.x + randomRange(-unit.size * 0.7, unit.size * 0.7), unit.y + randomRange(-unit.size * 0.45, unit.size * 0.2), '#ffee66', 1, 3);
    emitParticle(unit.x + randomRange(-unit.size * 0.55, unit.size * 0.55), unit.y + randomRange(-unit.size * 0.6, unit.size * 0.1), '#ff9f2e', 1, 2);
  }

  if (frame % 10 === 0) {
    const pulse = 0.55 + 0.35 * (storm.timer / Math.max(1, storm.maxTimer || storm.timer));
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: storm.radius * pulse, life: 0.22, color: '#ffee66' });
  }

  if (storm.tickCD <= 0) {
    storm.tickCD = storm.tickEvery || 15;
    const targets = enemies
      .filter(enemy => enemy.hp > 0 && dist(unit, enemy) <= storm.radius)
      .sort((a, b) => {
        const bossBiasA = a.isBoss ? 120 : 0;
        const bossBiasB = b.isBoss ? 120 : 0;
        return (dist(unit, a) + bossBiasA) - (dist(unit, b) + bossBiasB);
      })
      .slice(0, storm.maxTargets || 8);

    const leftSource = { x: unit.x - unit.size * 1.45, y: unit.y - unit.size * 1.9 };
    const rightSource = { x: unit.x + unit.size * 1.45, y: unit.y - unit.size * 1.9 };
    groundEffects.push({ x: leftSource.x, y: leftSource.y, r: 0, maxR: 32, life: 0.18, color: '#ffee66' });
    groundEffects.push({ x: rightSource.x, y: rightSource.y, r: 0, maxR: 32, life: 0.18, color: '#ff9f2e' });

    let hit = 0;
    const skyTop = Math.max(18, (arenaBounds && arenaBounds.top || 70) + 10);
    for (const target of targets) {
      const source = hit % 2 === 0 ? leftSource : rightSource;
      const tx = target.x + randomRange(-8, 8);
      const ty = target.y - (target.size || 18) * 0.25 + randomRange(-5, 5);
      const skyX = target.x + randomRange(-28, 28);
      const skyY = Math.max(skyTop, target.y - 330 + randomRange(-28, 18));
      dealDamage(target, storm.dmg, storm.from || unit, 'magic', 'lightning');
      if (!target.isBoss) {
        target.stunned = Math.max(target.stunned || 0, storm.stun || Math.round(0.5 * GAME_TICK_HZ));
        if (storm.timer > (storm.maxTimer || 0) - (storm.tickEvery || 15) - 2) addDamageText(target.x, target.y - (target.size || 18) - 8, 'STUN', '#ffee66', { sz: 11, bold: true });
      }
      groundEffects.push({ x: skyX, y: skyY, r: 0, maxR: 0, life: 0.36, lightningBolt: true, lbX2: tx, lbY2: ty, color: hit % 2 === 0 ? '#ffee66' : '#ff9f2e', width: 5, segments: 8 });
      groundEffects.push({ x: source.x, y: source.y, r: 0, maxR: 0, life: 0.16, lightningBolt: true, lbX2: tx, lbY2: ty, color: hit % 2 === 0 ? '#fff3a0' : '#ffc15a', width: 2.2, segments: 4 });
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: (target.size || 18) + 22, life: 0.24, color: hit % 2 === 0 ? '#ffee66' : '#ff9f2e' });
      emitParticle(target.x, target.y, '#ffee66', 6, 4);
      emitParticle(target.x + randomRange(-7, 7), target.y + randomRange(-8, 5), '#ffffff', 2, 3);
      hit++;
    }
    if (hit) shake(4);
  }

  if (storm.timer <= 0) {
    unit._thunderstorm = null;
    addDamageText(unit.x, unit.y - unit.size, 'STORM ENDS', '#b8860b', { sz: 11, bold: true });
  }
}
