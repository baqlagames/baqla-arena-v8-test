import { dist, rnd } from '../core/math.js';

export function advanceSharedOnHitCounter(unit) {
  if (!unit || !unit._onHitMax) return 0;
  unit._onHitCount = (unit._onHitCount || 0) + 1;
  const level = unit.level || 1;
  let tier = 0;
  if (unit._onHitCount === unit._hit3 && level >= 2) tier = 3;
  if (unit._onHitCount === unit._hit5 && level >= 3) tier = 5;
  if (unit._onHitCount === unit._hit10 && level >= 4) tier = 10;
  if (unit._onHitCount >= unit._onHitMax) unit._onHitCount = 0;
  return tier;
}

export function applyPostHitSupportProcs({
  unit,
  target,
  damage,
  frame,
  units,
  enemies,
  beamEffects,
  emitParticle,
  addDamageText,
  addHealFx,
  showFlash,
  lobBomb,
  findLowestAlly,
  findEmergencyTarget,
  drainHealToBarrier,
  beaconSplash,
  shake,
}) {
  const u = unit;
  const t = target;
  const dmg = damage;
  const addP = emitParticle;
  const addDmg = addDamageText;
  const beamFx = beamEffects;

  if (u.lifesteal) {
    const heal = dmg * u.lifesteal;
    u.hp = Math.min(u.maxHp, u.hp + heal);
    if (heal > 1) {
      addP(u.x, u.y - u.size * 0.5, '#ff4488', 5, 3);
      addHealFx(u.x, u.y, Math.round(heal));
    }
  }

  if (u.drain) {
    const heal = dmg * u.drain;
    u.hp = Math.min(u.maxHp, u.hp + heal);
    if (heal > 1) {
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const f = i / steps;
        const wave = Math.sin(f * Math.PI * 3 + frame * 0.5) * 6 * (1 - Math.abs(f - 0.5) * 1.4);
        const bx = t.x + (u.x - t.x) * f;
        const by = t.y + (u.y - t.y) * f;
        const ang = Math.atan2(u.y - t.y, u.x - t.x) + Math.PI / 2;
        addP(bx + Math.cos(ang) * wave, by + Math.sin(ang) * wave, i % 2 ? '#3aff66' : '#88ffaa', 1, 3);
      }
      addP(u.x, u.y - u.size * 0.5, '#3aff66', 6, 4);
      addHealFx(u.x, u.y, Math.round(heal));
      if (frame % 3 === 0) addP(t.x + rnd(-4, 4), t.y - t.size * 0.5, '#88ffaa', 1, 2);
    }
  }

  if (u.devour && u.devour.heal) {
    u.hp = Math.min(u.maxHp, u.hp + dmg * u.devour.heal);
  }

  if (u.lightOfMartyr && !u.smiteHeal) {
    const ally = findLowestAlly(u, 200);
    if (ally) {
      let heal = Math.round(ally.maxHp * 0.02);
      if (u.infusionOfLightTimer > 0) heal = Math.round(heal * 1.30);
      heal = Math.min(20, heal);
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      addHealFx(ally.x, ally.y, heal);
      beaconSplash(u, ally, heal);
    }
  }

  if (u.smiteHeal) {
    const ally = findLowestAlly(u, 180);
    if (ally) {
      ally.hp = Math.min(ally.maxHp, ally.hp + u.smiteHeal);
      addHealFx(ally.x, ally.y, u.smiteHeal);
      u._healCast = 20;
      drainHealToBarrier(u.smiteHeal, u);
      if (u.beacon) {
        const second = findLowestAlly(u, 260, ally);
        if (second) {
          const amt = Math.round(u.smiteHeal * u.beacon.mult);
          if (amt > 0) {
            second.hp = Math.min(second.maxHp, second.hp + amt);
            addHealFx(second.x, second.y, amt);
            addP(second.x, second.y - second.size, '#ffe14a', 8, 3);
          }
        }
      }
    }
    if (u.emergencyHeal) {
      u.emergencyHeal.counter++;
      if (u.emergencyHeal.counter >= u.emergencyHeal.every) {
        u.emergencyHeal.counter = 0;
        const healTarget = findEmergencyTarget(u, 260, u.emergencyHeal.threshold);
        if (healTarget) {
          const heal = healTarget.maxHp - healTarget.hp;
          healTarget.hp = healTarget.maxHp;
          addHealFx(healTarget.x, healTarget.y, heal);
          addDmg(healTarget.x, healTarget.y - healTarget.size, 'LAY ON HANDS!', '#ffe14a');
          addP(healTarget.x, healTarget.y, '#ffe14a', 32, 6);
          showFlash('LAY ON HANDS', '#ffe14a', 45);
        }
      }
    }
  }

  if (u.essenceBond && u.essenceBond.target && u._lastHealAmt > 0) {
    const bondedTarget = u.essenceBond.target;
    if (bondedTarget.hp > 0) {
      const echo = Math.round(u._lastHealAmt * u.essenceBond.echoPct);
      bondedTarget.hp = Math.min(bondedTarget.maxHp, bondedTarget.hp + echo);
      addHealFx(bondedTarget.x, bondedTarget.y, echo);
    }
    u._lastHealAmt = 0;
  }

  if (u.volatileMixture && u._hitCount) {
    if (u._hitCount % u.volatileMixture.every === 0) {
      let best = null;
      let bestDist = Infinity;
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const d = dist(u, enemy);
        if (d <= u.range * 1.5 && d < bestDist) {
          bestDist = d;
          best = enemy;
        }
      }
      if (best) {
        const potDmg = Math.round(u.dmg * u.volatileMixture.dmgMult);
        lobBomb(u, best.x, best.y, potDmg, u.volatileMixture.radius, {
          dur: 35,
          color: '#aa55dd',
          altColor: '#55ff77',
          toxicPotion: true,
        });
        beamFx.push({ x1: u.x, y1: u.y, x2: best.x, y2: best.y - 40, life: 0.3, maxLife: 0.3, color: '#aa55dd', width: 3, straight: true });
        beamFx.push({ x1: u.x + 5, y1: u.y - 8, x2: best.x, y2: best.y - 20, life: 0.22, maxLife: 0.22, color: '#55ff77', width: 2, straight: true });
        addP(u.x, u.y, '#aa55dd', 14, 5);
        addP(u.x, u.y, '#ffffff', 6, 2);
        addDmg(u.x, u.y - u.size, 'VOLATILE!', '#aa55dd');
        shake(2);
      }
    }
  }

  if (u.shieldEvery) {
    u.shieldEvery.counter++;
    if (u.shieldEvery.counter >= u.shieldEvery.every) {
      u.shieldEvery.counter = 0;
      let tank = null;
      let tankDist = Infinity;
      for (const ally of units) {
        if (ally.isPlayer && ally.hp > 0 && ally.arch === 'tank') {
          const d = dist(u, ally);
          if (d < tankDist) {
            tankDist = d;
            tank = ally;
          }
        }
      }
      if (tank) {
        tank.shieldHp = (tank.shieldHp || 0) + u.shieldEvery.amount;
        addP(tank.x, tank.y, '#ffd700', 24, 5);
        addDmg(tank.x, tank.y - tank.size, '+SHIELD', '#ffd700');
      }
    }
  }
}
