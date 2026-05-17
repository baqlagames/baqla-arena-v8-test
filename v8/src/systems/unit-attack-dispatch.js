import { dist } from '../core/math.js';

export function dispatchUnitBasicAttack(unit, target, attack, {
  frame,
  enemies,
  units,
  randomRange,
  beamFx,
  groundEffects,
  basicSecondHitFor,
  findBasicSecondTarget,
  fireProjectile,
  dealDamage,
  addHealFx,
  emitParticle,
  addDamageText,
  shake,
}) {
  const damage = attack.damage;
  const paladinMelee = unit.paladinHybrid && dist(unit, target) <= 55;
  const basicSecondHit = !unit.tripleShot ? basicSecondHitFor(unit) : null;

  if (basicSecondHit && unit.unitIdx === 8) {
    const secondTarget = findBasicSecondTarget(unit, target, basicSecondHit.range || 150);
    if (secondTarget) {
      basicSecondHit.target = secondTarget;
      fireProjectile(unit, secondTarget, 0, { projType: unit.projType || 'normal', speed: 5, visualOnly: true, color: basicSecondHit.color || '#44ddff', _arrN: 8, _arrSz: 3 });
    }
  }

  if (unit.projType) {
    if (unit.tripleShot) {
      const baseAngle = Math.atan2(target.y - unit.y, target.x - unit.x);
      const perShotDamage = Math.round(damage * unit.tripleShot.mult);
      fireProjectile(unit, target, perShotDamage, { projType: unit.projType, pierce: unit.pierce, aimed: attack.isAimed, _isCrit: attack.isCrit });
      for (let offsetIndex = 0; offsetIndex < unit.tripleShot.count - 1; offsetIndex++) {
        const angle = baseAngle + (offsetIndex === 0 ? -unit.tripleShot.spread : unit.tripleShot.spread);
        const radius = Math.max(40, dist(unit, target));
        const fakeTarget = { x: unit.x + Math.cos(angle) * radius, y: unit.y + Math.sin(angle) * radius, size: target.size || 16 };
        fireProjectile(unit, fakeTarget, perShotDamage, { projType: unit.projType, pierce: unit.pierce });
      }
    } else {
      fireProjectile(unit, target, damage, { projType: unit.projType, pierce: unit.pierce, aimed: attack.isAimed, _isCrit: attack.isCrit, basicSecondHit });
    }
  } else if (unit.paladinHybrid && !paladinMelee) {
    fireProjectile(unit, target, damage, { projType: 'holy', attackType: 'magic', _isCrit: attack.isCrit });
  } else {
    dealDamage(target, damage, unit, unit.projType === 'curse' ? 'magic' : 'normal', undefined, attack.isCrit ? { isCrit: true } : undefined);
    if (unit.paladinHybrid && paladinMelee) {
      unit.cleaveFx = 14;
      unit.cleaveFxAng = Math.atan2(target.y - unit.y, target.x - unit.x);
      unit.cleaveFxColor = '#ffe066';
      unit.cleaveFxBig = true;
      emitParticle(target.x, target.y, '#ffe066', 12, 5);
      emitParticle(target.x, target.y, '#ffffff', 6, 3);
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        emitParticle(target.x + Math.cos(angle) * target.size * 0.5, target.y + Math.sin(angle) * target.size * 0.5, '#ffffff', 1, 2);
      }
    }
  }

  if (unit._jazarSigAoeTimer > 0 && unit.unitIdx === 5) {
    const radius = unit._jazarSigAoeRadius || 90;
    const aoeDamage = Math.round(damage * (unit._jazarSigAoeMult || 0.60));
    const color = unit._jazarSigAoeColor || '#ffcc00';
    let hit = 0;
    for (const enemy of enemies) {
      if (enemy === target || enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - target.x, enemy.y - target.y) <= radius) {
        dealDamage(enemy, aoeDamage, unit, 'normal');
        emitParticle(enemy.x, enemy.y, color, 7, 3);
        hit++;
      }
    }
    if (hit) {
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: radius, life: 0.28, color });
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: radius * 0.55, life: 0.20, color: '#ffffff' });
      emitParticle(target.x, target.y, color, 12, 4);
      if (frame % 12 < 2) addDamageText(target.x, target.y - target.size - 12, 'FURY AOE', '#ffdd66', { sz: 11, bold: true });
      shake(4);
    }
  }

  if (attack.isCrit && !unit.projType) {
    addDamageText(target.x, target.y - 26, 'CRIT!', '#cc44ff', { sz: 18, bold: true, outline: '#220044' });
    emitParticle(target.x, target.y, '#cc44ff', 14, 6);
    emitParticle(target.x, target.y, '#ffffff', 8, 3);
    for (let i = 0; i < 5; i++) {
      const px = target.x + randomRange(-8, 8);
      const py = target.y - target.size - 10 + i * 5;
      emitParticle(px, py, '#cc44ff', 2, 3);
    }
    emitParticle(target.x, target.y - target.size * 0.5, '#e066ff', 4, 4);
  }
  if (attack.firstStrike) {
    addDamageText(target.x, target.y - 26, 'AMBUSH!', '#a855f7');
    emitParticle(target.x, target.y, '#a855f7', 16, 4);
  }
  if (attack.isExecute) addDamageText(target.x, target.y - 22, 'EXECUTE!', '#ff2222');
  if (attack.isEmpower) {
    addDamageText(target.x, target.y - 30, 'EMPOWERED!', '#ffaa00');
    emitParticle(target.x, target.y, '#ffaa00', 12, 4);
  }
  if (attack.allyMult > 1.05) emitParticle(target.x, target.y - target.size * 0.3, '#ffe14a', 2, 2);
  emitParticle(target.x, target.y, '#fff', 3, 2);

  if (unit.atonement) {
    let lowest = null;
    let lowPct = Infinity;
    for (const ally of units) {
      if (ally.hp <= 0 || !ally.isPlayer || ally.isGhost) continue;
      if (ally.hp >= ally.maxHp) continue;
      const allyDistance = Math.hypot(ally.x - unit.x, ally.y - unit.y);
      if (allyDistance > unit.atonement.radius) continue;
      const pct = ally.hp / ally.maxHp;
      if (pct < lowPct) {
        lowPct = pct;
        lowest = ally;
      }
    }
    if (lowest) {
      const heal = Math.round(damage * unit.atonement.pct);
      lowest.hp = Math.min(lowest.maxHp, lowest.hp + heal);
      addHealFx(lowest.x, lowest.y, heal);
      beamFx.push({ x1: unit.x, y1: unit.y, x2: lowest.x, y2: lowest.y, life: 0.15, maxLife: 0.15, color: '#ffaadd', width: 2, straight: true });
      emitParticle(lowest.x, lowest.y, '#ffaadd', 5, 3);
      emitParticle(lowest.x, lowest.y, '#ffffff', 3, 2);
    }
  }

  if (unit.stealth) unit.idleT = 0;
}
