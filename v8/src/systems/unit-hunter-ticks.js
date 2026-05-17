import { dist } from '../core/math.js';

export function tickUnitHunterPassives(unit, {
  frame,
  enemies,
  randomRange,
  fireProjectile,
  emitParticle,
  addDamageText,
}) {
  tickSteadyFocus(unit, { frame, randomRange, emitParticle, addDamageText });
  tickRapidFire(unit, { enemies, fireProjectile, emitParticle });
  tickTrueshot(unit, { frame, emitParticle });
  tickArrowRainZone(unit);
}

function tickSteadyFocus(unit, {
  frame,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (!unit.steadyFocus) return;

  if (unit._sfLastX == null) {
    unit._sfLastX = unit.x;
    unit._sfLastY = unit.y;
  }
  if (Math.abs(unit.x - unit._sfLastX) < 0.5 && Math.abs(unit.y - unit._sfLastY) < 0.5) {
    unit.steadyFocus.timer++;
    if (unit.steadyFocus.timer >= unit.steadyFocus.threshold && !unit.steadyFocus.active) {
      unit.steadyFocus.active = true;
      unit._sfOrigAtkSpd = unit._sfOrigAtkSpd || unit.atkSpd;
      unit.atkSpd = Math.max(8, Math.round(unit._sfOrigAtkSpd * unit.steadyFocus.speedBonus));
      addDamageText(unit.x, unit.y - unit.size, 'STEADY FOCUS!', '#88ccff');
      emitParticle(unit.x, unit.y, '#88ccff', 12, 3);
    }
  } else {
    unit.steadyFocus.timer = 0;
    if (unit.steadyFocus.active) {
      unit.steadyFocus.active = false;
      if (unit._sfOrigAtkSpd) unit.atkSpd = unit._sfOrigAtkSpd;
    }
  }
  unit._sfLastX = unit.x;
  unit._sfLastY = unit.y;
  if (unit.steadyFocus.active && frame % 8 === 0) {
    emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y + randomRange(-unit.size * 0.3, unit.size * 0.3), '#88ccff', 1, 2);
  }
}

function tickRapidFire(unit, {
  enemies,
  fireProjectile,
  emitParticle,
}) {
  if (!unit._rapidFire) return;

  const rapid = unit._rapidFire;
  rapid.shotTimer++;
  if (!rapid.target || rapid.target.hp <= 0) {
    let newTarget = null;
    let bestDistance = Infinity;
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      const distance = dist(unit, enemy);
      if (distance < (unit.range || 198) + 50 && distance < bestDistance) {
        bestDistance = distance;
        newTarget = enemy;
      }
    }
    if (newTarget) rapid.target = newTarget;
    else {
      unit._rapidFire = null;
      unit._rapidChanneling = false;
    }
  }
  if (!unit._rapidFire) return;

  if (unit.stunned > 0 || rapid.shots <= 0) {
    unit._rapidFire = null;
    unit._rapidChanneling = false;
    return;
  }
  if (rapid.shotTimer < rapid.shotInterval) return;

  rapid.shotTimer = 0;
  rapid.shots--;
  const damage = Math.round(unit.dmg * rapid.dmgMult);
  fireProjectile(unit, rapid.target, damage, { projType: unit.projType || 'normal', pierce: unit.pierce, aimed: true });
  emitParticle(unit.x, unit.y, '#ffd700', 4, 2);
  for (let i = 1; i <= 4; i++) {
    const pct = i / 4;
    emitParticle(unit.x + (rapid.target.x - unit.x) * pct, unit.y + (rapid.target.y - unit.y) * pct, '#ffd700', 1, 2);
  }
}

function tickTrueshot(unit, {
  frame,
  emitParticle,
}) {
  if (!unit._trueshot) return;

  unit._trueshot.t++;
  if (unit._trueshot.t >= unit._trueshot.dur) {
    if (unit._trueshotOrigRange != null) unit.range = unit._trueshotOrigRange;
    unit._trueshot = null;
    unit._trueshotOrigRange = null;
    return;
  }
  if (frame % 6 === 0) {
    const angle = frame * 0.15;
    emitParticle(unit.x + Math.cos(angle) * unit.size * 1.1, unit.y + Math.sin(angle) * unit.size * 1.1, '#ffd700', 1, 2);
  }
}

function tickArrowRainZone(unit) {
  if (!unit._arrowRainZone) return;

  const zone = unit._arrowRainZone;
  zone.timer--;
  if (zone._active > 0) zone._active--;
  if (zone.timer <= 0) unit._arrowRainZone = null;
}
