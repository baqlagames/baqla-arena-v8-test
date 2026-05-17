import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function tickUnitCompanionPassives(unit, {
  frame,
  units,
  enemies,
  randomRange,
  groundEffects,
  dealDamage,
  applyHealingReceived,
  addHealFx,
  emitParticle,
  addDamageText,
  shake,
}) {
  tickRepairBot(unit, { units, applyHealingReceived, addHealFx, emitParticle, addDamageText });
  tickTraps(unit, { enemies, randomRange, groundEffects, dealDamage, emitParticle, addDamageText, shake });
  tickBestialWrath(unit, { frame, units, randomRange, emitParticle, addDamageText, shake });
  tickSpiritMend(unit, { addHealFx, emitParticle, addDamageText });
  tickTrueshotAura(unit, { frame, emitParticle });
  tickWildfireZone(unit, { frame, enemies, groundEffects, dealDamage, emitParticle });
  tickBarbedShot(unit, { frame, randomRange, emitParticle });
  tickBeastMasteryFrenzy(unit, { frame, randomRange, emitParticle });
}

function tickRepairBot(unit, {
  units,
  applyHealingReceived,
  addHealFx,
  emitParticle,
  addDamageText,
}) {
  if (unit.kind !== 'repairBot' || !unit._healTarget) return;

  if (unit._healTarget.hp <= 0) {
    let lowest = null;
    let lowestPct = Infinity;
    for (const ally of units) {
      if (ally.isPlayer && ally.hp > 0 && ally !== unit && !ally.isMinion) {
        const pct = ally.hp / ally.maxHp;
        if (pct < lowestPct) {
          lowestPct = pct;
          lowest = ally;
        }
      }
    }
    unit._healTarget = lowest;
  }
  if (!unit._healTarget || unit._healTarget.hp <= 0) return;

  const dx = unit._healTarget.x - unit.x;
  const dy = unit._healTarget.y - unit.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > 30) {
    unit.x += dx / distance * unit.speed * 2;
    unit.y += dy / distance * unit.speed * 2;
  }
  unit._healTick++;
  if (unit._healTick < GAME_TICK_HZ) return;

  unit._healTick = 0;
  const heal = applyHealingReceived(unit._healTarget, unit._healAmt);
  unit._healTarget.hp = Math.min(unit._healTarget.maxHp, unit._healTarget.hp + heal);
  addHealFx(unit._healTarget.x, unit._healTarget.y, heal);
  if (unit._healTarget.hp < unit._healTarget.maxHp * 0.40 && (!unit._healTarget._engShield || unit._healTarget._engShield.hp <= 0)) {
    const shield = Math.round(unit._healTarget.maxHp * 0.08);
    unit._healTarget._engShield = { hp: shield, max: shield, dur: 4 * GAME_TICK_HZ, t: 0 };
    addDamageText(unit._healTarget.x, unit._healTarget.y - unit._healTarget.size, 'REPAIR SHIELD', '#44aaff');
    emitParticle(unit._healTarget.x, unit._healTarget.y, '#44aaff', 10, 3);
  }
  emitParticle(unit.x, unit.y, '#44cc88', 4, 2);
}

function tickTraps(unit, {
  enemies,
  randomRange,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!unit.explosiveTrap) return;

  const trapTypes = ['explosive', 'frost', 'root'];
  const trapColors = { explosive: '#ff6600', frost: '#44ccff', root: '#44aa22' };
  if (unit.explosiveTrap.cd < unit.explosiveTrap.every) unit.explosiveTrap.cd++;
  if (unit.explosiveTrap.cd >= unit.explosiveTrap.every && (!unit._traps || unit._traps.length < unit.explosiveTrap.maxTraps)) {
    unit.explosiveTrap.cd = 0;
    const y = unit.y - 100 - Math.random() * 100;
    const x = unit.x + randomRange(-70, 70);
    if (!unit._traps) unit._traps = [];
    const type = trapTypes[unit.explosiveTrap.nextType % 3];
    unit._traps.push({ x, y, armed: Math.round(GAME_TICK_HZ * 0.4), armTimer: 0, type });
    unit.explosiveTrap.nextType++;
    const names = { explosive: 'FIRE TRAP', frost: 'FROST TRAP', root: 'ROOT TRAP' };
    addDamageText(x, y - 5, names[type], trapColors[type]);
  }
  for (let i = (unit._traps || []).length - 1; i >= 0; i--) {
    const trap = unit._traps[i];
    if (trap.armTimer < trap.armed) {
      trap.armTimer++;
      continue;
    }
    let detonated = false;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && dist(trap, enemy) < unit.explosiveTrap.triggerDist) {
        detonated = true;
        break;
      }
    }
    if (!detonated) continue;

    const radius = unit.explosiveTrap.radius;
    const color = trapColors[trap.type];
    if (trap.type === 'explosive') {
      const trapDamage = Math.round(unit.dmg * unit.explosiveTrap.dmgMult);
      for (const enemy of enemies) {
        if (enemy.hp > 0 && dist(trap, enemy) <= radius) {
          dealDamage(enemy, trapDamage, unit, 'physical');
          emitParticle(enemy.x, enemy.y, '#ff6600', 8, 3);
        }
      }
      addDamageText(trap.x, trap.y - 10, 'BOOM!', '#ff6600');
      shake(6);
    } else if (trap.type === 'frost') {
      for (const enemy of enemies) {
        if (enemy.hp > 0 && dist(trap, enemy) <= radius) {
          enemy.slowTimer = Math.max(enemy.slowTimer || 0, unit.explosiveTrap.slowDur);
          enemy.slowMult = Math.min(enemy.slowMult || 1, 1 - unit.explosiveTrap.slowPct);
          dealDamage(enemy, Math.round(unit.dmg * 0.5), unit, 'magic');
          emitParticle(enemy.x, enemy.y, '#44ccff', 8, 3);
        }
      }
      addDamageText(trap.x, trap.y - 10, 'FROZEN!', '#44ccff');
    } else {
      for (const enemy of enemies) {
        if (enemy.hp > 0 && dist(trap, enemy) <= radius) {
          if (!enemy.isBoss) enemy.stunned = Math.max(enemy.stunned || 0, unit.explosiveTrap.rootDur);
          dealDamage(enemy, Math.round(unit.dmg * 0.5), unit, 'physical');
          emitParticle(enemy.x, enemy.y, '#44aa22', 8, 3);
        }
      }
      addDamageText(trap.x, trap.y - 10, 'ROOTED!', '#44aa22');
    }
    groundEffects.push({ x: trap.x, y: trap.y, r: 0, maxR: radius, life: 0.5, color });
    emitParticle(trap.x, trap.y, color, 20, 5);
    if (unit.lockAndLoad) unit.lockAndLoad.charges = unit.lockAndLoad.maxCharges;
    unit._traps.splice(i, 1);
  }
}

function tickBestialWrath(unit, {
  frame,
  units,
  randomRange,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (unit.bestialWrath) {
    unit.bestialWrath.cd++;
    if (unit.bestialWrath.cd >= unit.bestialWrath.every) {
      unit.bestialWrath.cd = 0;
      let buffed = 0;
      for (const minion of units) {
        if (!minion.isMinion || minion.parent !== unit || minion.hp <= 0) continue;
        minion._bestialWrathTimer = unit.bestialWrath.dur;
        if (!minion._bwOrigDmg) {
          minion._bwOrigDmg = minion.dmg;
          minion._bwOrigAtkSpd = minion.atkSpd;
        }
        minion.dmg = Math.round(minion._bwOrigDmg * unit.bestialWrath.dmgMult);
        minion.atkSpd = Math.max(8, Math.round(minion._bwOrigAtkSpd * unit.bestialWrath.atkSpdMult));
        emitParticle(minion.x, minion.y, '#ff4444', 10, 3);
        buffed++;
      }
      if (buffed) {
        addDamageText(unit.x, unit.y - unit.size, 'BESTIAL WRATH!', '#ff4444');
        emitParticle(unit.x, unit.y, '#ff4444', 16, 4);
        shake(4);
      }
    }
  }
  if (unit.isMinion && unit._bestialWrathTimer > 0) {
    unit._bestialWrathTimer--;
    if (frame % 6 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.3, '#ff4444', 1, 2);
    if (unit._bestialWrathTimer <= 0) {
      if (unit._bwOrigDmg) {
        unit.dmg = unit._bwOrigDmg;
        unit._bwOrigDmg = null;
      }
      if (unit._bwOrigAtkSpd) {
        unit.atkSpd = unit._bwOrigAtkSpd;
        unit._bwOrigAtkSpd = null;
      }
    }
  }
}

function tickSpiritMend(unit, {
  addHealFx,
  emitParticle,
  addDamageText,
}) {
  if (unit.kind !== 'spiritBeast' || unit._spiritMendCD == null || !unit.parent || unit.parent.hp <= 0) return;

  unit._spiritMendCD++;
  if (unit._spiritMendCD < unit._spiritMendEvery) return;

  unit._spiritMendCD = 0;
  const heal = Math.round(unit.parent.maxHp * unit._spiritMendPct);
  unit.parent.hp = Math.min(unit.parent.maxHp, unit.parent.hp + heal);
  addHealFx(unit.parent.x, unit.parent.y, heal);
  for (let i = 1; i <= 5; i++) {
    const pct = i / 5;
    emitParticle(unit.x + (unit.parent.x - unit.x) * pct, unit.y + (unit.parent.y - unit.y) * pct, '#3aa84e', 1, 2);
  }
  addDamageText(unit.x, unit.y - unit.size, 'SPIRIT MEND!', '#3aa84e');
}

function tickTrueshotAura(unit, {
  frame,
  emitParticle,
}) {
  if (!(unit._trueshotAuraTimer > 0)) return;

  unit._trueshotAuraTimer--;
  if (frame % 6 === 0) {
    const angle = frame * 0.12;
    emitParticle(unit.x + Math.cos(angle) * unit.size * 1.2, unit.y + Math.sin(angle) * unit.size * 1.2, '#ffd700', 1, 3);
  }
  if (unit._trueshotAuraTimer <= 0 && unit._taOrigAtkSpd) {
    unit.atkSpd = unit._taOrigAtkSpd;
    unit._taOrigAtkSpd = null;
  }
}

function tickWildfireZone(unit, {
  frame,
  enemies,
  groundEffects,
  dealDamage,
  emitParticle,
}) {
  if (!unit._wildfireZone) return;

  const zone = unit._wildfireZone;
  zone.dur--;
  zone.tickCD++;
  if (zone.tickCD >= zone.tickRate) {
    zone.tickCD = 0;
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - zone.x, enemy.y - zone.y) <= zone.r) {
        dealDamage(enemy, zone.dmgPerTick, zone.from, 'magic');
        emitParticle(enemy.x, enemy.y, '#ff6600', 2, 2);
      }
    }
  }
  if (frame % 4 === 0) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * zone.r;
    emitParticle(zone.x + Math.cos(angle) * distance, zone.y + Math.sin(angle) * distance, '#ff4400', 1, 2);
  }
  if (zone.dur <= 0) unit._wildfireZone = null;
}

function tickBarbedShot(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if (!unit.isMinion || !(unit._barbedShotTimer > 0)) return;

  unit._barbedShotTimer--;
  if (frame % 8 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.4, unit.size * 0.4), unit.y - unit.size * 0.2, '#cc2222', 1, 2);
  if (unit._barbedShotTimer <= 0 && unit._bsOrigAtkSpd) {
    unit.atkSpd = unit._bsOrigAtkSpd;
    unit._bsOrigAtkSpd = null;
  }
}

function tickBeastMasteryFrenzy(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if (!unit.isMinion || !(unit._frenzyBMTimer > 0)) return;

  unit._frenzyBMTimer--;
  if (frame % 5 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.3, '#ff4444', 1, 2);
  if (frame % 30 === 0 && unit.hp < unit.maxHp) {
    const heal = Math.round(unit.maxHp * 0.01);
    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
    emitParticle(unit.x, unit.y, '#44ff44', 2, 2);
  }
  if (unit._frenzyBMTimer <= 0 && unit._frenzyBMOrigAtkSpd) {
    unit.atkSpd = unit._frenzyBMOrigAtkSpd;
    unit._frenzyBMOrigAtkSpd = null;
  }
}
