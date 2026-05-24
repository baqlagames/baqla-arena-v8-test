import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';
import { arena_isCapstoneLevel } from './squad-economy.js';

export function tickUnitZaytBakdounesPassives(unit, {
  frame,
  units,
  enemies,
  projectiles,
  beamEffects,
  randomRange,
  groundEffects,
  dealDamage,
  findLowestAlly,
  applyTrackedHeal,
  beaconSplash,
  addHealFx,
  showFlash,
  playShieldBlock,
  emitParticle,
  addDamageText,
  shake,
}) {
  tickToxicFlask(unit, { frame, enemies, randomRange, dealDamage, emitParticle });
  tickWildGrowth(unit, { findLowestAlly, groundEffects, addHealFx, emitParticle, addDamageText });
  tickFreedom(unit, { units, groundEffects, emitParticle, addDamageText });
  tickConsecration(unit, { frame, units, enemies, randomRange, groundEffects, dealDamage, emitParticle });
  tickMagicShieldGiver(unit, { units, groundEffects, emitParticle, addDamageText });
  tickShieldOfVengeance(unit, { enemies, groundEffects, dealDamage, emitParticle, addDamageText });
  tickPaladinTimers(unit, { frame, randomRange, groundEffects, addHealFx, emitParticle, addDamageText, playShieldBlock, shake });
  tickSimpleSelfHeals(unit, { frame, addHealFx });
  tickAvengersShield(unit, { enemies, projectiles, showFlash, addDamageText, shake });
  tickBeaconOfVirtue(unit, { frame, units, randomRange, emitParticle });
  tickHolyShock(unit, { units, enemies, beamEffects, groundEffects, dealDamage, applyTrackedHeal, beaconSplash, emitParticle, addDamageText });
  tickAntidoteField(unit, { frame, units, randomRange, groundEffects, applyTrackedHeal, emitParticle, addDamageText });
}

function tickToxicFlask(unit, {
  frame,
  enemies,
  randomRange,
  dealDamage,
  emitParticle,
}) {
  if (!unit.toxicFlask || frame % GAME_TICK_HZ !== 0) return;

  for (const enemy of enemies) {
    if (enemy.hp <= 0 || !enemy._toxicStacks) continue;
    for (let i = enemy._toxicStacks.length - 1; i >= 0; i--) {
      const stack = enemy._toxicStacks[i];
      if (stack.from !== unit) continue;
      stack.timer--;
      if (stack.timer <= 0) {
        enemy._toxicStacks.splice(i, 1);
        continue;
      }
      dealDamage(enemy, stack.dmg, unit, 'magic');
      emitParticle(enemy.x + randomRange(-4, 4), enemy.y + randomRange(-4, 4), '#aa44ff', 2, 2);
    }
    if (enemy._corrosiveTimer > 0) enemy._corrosiveTimer--;
  }
}

function tickWildGrowth(unit, {
  findLowestAlly,
  groundEffects,
  addHealFx,
  emitParticle,
  addDamageText,
}) {
  if (!unit.wildGrowth) return;

  unit.wildGrowth.cd++;
  if (unit.wildGrowth.cd < unit.wildGrowth.every) return;

  unit.wildGrowth.cd = 0;
  const ally = findLowestAlly(unit, 300, null);
  if (!ally) return;

  const amount = Math.round(ally.maxHp * unit.wildGrowth.pct);
  ally.hp = Math.min(ally.maxHp, ally.hp + amount);
  addHealFx(ally.x, ally.y, amount);
  for (let i = 0; i < 24; i++) emitParticle(ally.x, ally.y, '#3aff66', 1, 4);
  addDamageText(ally.x, ally.y - ally.size, 'WILD GROWTH', '#3aff66');
  groundEffects.push({ x: ally.x, y: ally.y, r: 0, maxR: 60, life: 0.45, color: '#3aff66' });
}

function tickFreedom(unit, {
  units,
  groundEffects,
  emitParticle,
  addDamageText,
}) {
  if (unit.freedom) {
    unit.freedom.cd++;
    if (unit.freedom.cd >= unit.freedom.every) {
      unit.freedom.cd = 0;
      let target = null;
      for (const ally of units) {
        if (ally === unit || ally.hp <= 0 || !ally.isPlayer || ally.isGhost || ally.isMinion) continue;
        if (ally.arch !== 'tank') continue;
        if (ally.freedomBuffTimer > 0) continue;
        target = ally;
        break;
      }
      if (!target) {
        for (const ally of units) {
          if (ally === unit || ally.hp <= 0 || !ally.isPlayer || ally.isGhost || ally.isMinion) continue;
          if (ally.freedomBuffTimer > 0) continue;
          target = ally;
          break;
        }
      }
      if (!target) target = unit;
      if (target) {
        target._origSpeedFreedom = target._origSpeedFreedom || target.speed;
        target.speed = target._origSpeedFreedom * unit.freedom.mult;
        target.freedomBuffTimer = unit.freedom.dur;
        target.slowTimer = 0;
        target.slowMult = 1;
        emitParticle(target.x, target.y, '#ffe066', 16, 4);
        addDamageText(target.x, target.y - target.size, 'FREEDOM!', '#ffe066');
        groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 50, life: 0.4, color: '#ffe066' });
      }
    }
  }
  if (unit.freedomBuffTimer > 0) {
    unit.freedomBuffTimer--;
    if (unit.freedomBuffTimer <= 0 && unit._origSpeedFreedom) {
      unit.speed = unit._origSpeedFreedom;
      unit._origSpeedFreedom = null;
    }
  }
}

function tickConsecration(unit, {
  frame,
  units,
  enemies,
  randomRange,
  groundEffects,
  dealDamage,
  emitParticle,
}) {
  if (unit.consecration) {
    const hallowActive = unit.consecrationField && unit.consecrationField.hallow;
    if (!unit.consecrationField || (!hallowActive && !unit.consecrationField._protAura)) {
      unit.consecrationField = { x: unit.x, y: unit.y, r: 80, t: 999 * GAME_TICK_HZ, dmg: Math.round(unit.dmg * 0.25), heal: 0, hallow: false, _protAura: true };
    }
    if (unit.consecrationField && unit.consecrationField._protAura) {
      unit.consecrationField.x = unit.x;
      unit.consecrationField.y = unit.y;
      unit.consecrationField.t = 999 * GAME_TICK_HZ;
    }
    if (hallowActive && unit.consecrationField.t <= 0) {
      unit.consecrationField = null;
    }
    let enemyInConsecration = false;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && Math.hypot(enemy.x - unit.x, enemy.y - unit.y) <= (hallowActive ? unit.consecrationField.r : 80)) {
        enemyInConsecration = true;
        break;
      }
    }
    unit._consecDR = enemyInConsecration ? 0.08 : 0;
  }
  if (!unit.consecrationField || unit.consecrationField.t <= 0) return;

  const field = unit.consecrationField;
  field.t--;
  if (field.hallow) {
    groundEffects.push({ x: field.x, y: field.y, r: field.r - 3, maxR: field.r, life: 0.08, color: '#cc2222', flatten: true });
    const pulseRadius = field.r * (0.85 + Math.sin(frame * 0.08) * 0.05);
    groundEffects.push({ x: field.x, y: field.y, r: pulseRadius - 3, maxR: pulseRadius, life: 0.08, color: '#882020', flatten: true });
    groundEffects.push({ x: field.x, y: field.y, r: 0, maxR: field.r * 0.92, life: 0.08, color: '#661010', flatten: true });
    if (frame % 3 === 0) {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = field.r * (0.2 + Math.random() * 0.75);
        const color = ['#ff5544', '#ff8844', '#cc2222', '#ffaa44'][Math.floor(Math.random() * 4)];
        emitParticle(field.x + Math.cos(angle) * radius, field.y + Math.sin(angle) * radius, color, 1, 3);
      }
      const fireAngle = Math.random() * Math.PI * 2;
      const fireRadius = field.r * (0.3 + Math.random() * 0.5);
      emitParticle(field.x + Math.cos(fireAngle) * fireRadius, field.y + Math.sin(fireAngle) * fireRadius - randomRange(8, 20), '#ff884488', 1.5, 2);
    }
    if (frame % 5 === 0) {
      const spin = frame * 0.04;
      for (let i = 0; i < 6; i++) {
        const angle = spin + i * Math.PI / 3;
        emitParticle(field.x + Math.cos(angle) * (field.r - 10), field.y + Math.sin(angle) * (field.r - 10), '#ffaa44', 1, 3);
        emitParticle(field.x + Math.cos(angle) * (field.r - 8), field.y + Math.sin(angle) * (field.r - 8) - randomRange(4, 12), '#ff664488', 1, 2);
      }
    }
    if (frame % 30 === 0) {
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 20 + Math.random() * (field.r - 40);
        const x = field.x + Math.cos(angle) * radius;
        const y = field.y + Math.sin(angle) * radius;
        groundEffects.push({ x, y, r: 0, maxR: 15 + Math.random() * 10, life: 0.4, color: '#ff444488' });
        for (let j = 0; j < 3; j++) emitParticle(x + randomRange(-5, 5), y - randomRange(3, 15), '#ff8844', 1.5, 3);
      }
    }
  }
  if (frame % (GAME_TICK_HZ / 2) === 0) {
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - field.x, enemy.y - field.y) <= field.r) {
        if (field.hallow && !enemy.isBoss) {
          enemy.forcedTarget = unit;
          enemy.forcedTargetTimer = Math.max(enemy.forcedTargetTimer || 0, Math.round(0.75 * GAME_TICK_HZ));
        }
        dealDamage(enemy, field.dmg, unit, 'magic');
        if (frame % 4 === 0) emitParticle(enemy.x, enemy.y, field.hallow ? '#cc2222' : '#ffe066', 2, 3);
      }
    }
    for (const ally of units) {
      if (ally.hp <= 0 || !ally.isPlayer || ally.isGhost) continue;
      const inField = Math.hypot(ally.x - field.x, ally.y - field.y) <= field.r;
      if (!inField) continue;
      if (ally.hp < ally.maxHp) {
        ally.hp = Math.min(ally.maxHp, ally.hp + field.heal);
        emitParticle(ally.x, ally.y - ally.size, '#88ffaa', 2, 3);
      }
    }
  }
  if (field.t <= 0) unit.consecrationField = null;
}

function tickMagicShieldGiver(unit, {
  units,
  groundEffects,
  emitParticle,
  addDamageText,
}) {
  if (!unit.magicShieldGiver) return;

  unit.magicShieldGiver.cd++;
  if (unit.magicShieldGiver.cd < unit.magicShieldGiver.every) return;

  unit.magicShieldGiver.cd = 0;
  let tank = null;
  let bestDistance = Infinity;
  for (const ally of units) {
    if (ally === unit || ally.hp <= 0 || !ally.isPlayer || ally.isGhost || ally.isMinion) continue;
    if (ally.arch !== 'tank') continue;
    const distance = dist(unit, ally);
    if (distance > unit.magicShieldGiver.radius) continue;
    if (distance < bestDistance) {
      bestDistance = distance;
      tank = ally;
    }
  }
  if (!tank) return;

  tank.shieldHp = (tank.shieldHp || 0) + unit.magicShieldGiver.amount;
  emitParticle(tank.x, tank.y, '#88ddff', 24, 5);
  addDamageText(tank.x, tank.y - tank.size, 'MAGIC SHIELD', '#88ddff');
  groundEffects.push({ x: tank.x, y: tank.y, r: 0, maxR: 42, life: 0.4, color: '#88ddff' });
}

function tickShieldOfVengeance(unit, {
  enemies,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
}) {
  if (!unit.shieldOfVengeance) return;

  const shield = unit.shieldOfVengeance;
  shield.cd++;
  if (!shield.active && shield.cd >= shield.every) {
    shield.cd = 0;
    shield.active = true;
    shield.absorbed = 0;
    unit.shieldOfVengeanceHp = Math.round(unit.maxHp * shield.shieldPct);
    emitParticle(unit.x, unit.y, '#ffd700', 16, 4);
    addDamageText(unit.x, unit.y - unit.size, 'SHIELD!', '#ffd700');
  }
  if (shield.active && unit.shieldOfVengeanceHp <= 0) {
    shield.active = false;
    if (shield.absorbed > 0) {
      for (const enemy of enemies) {
        if (enemy.hp > 0 && dist(unit, enemy) <= shield.radius) {
          dealDamage(enemy, shield.absorbed, unit, 'magic');
          emitParticle(enemy.x, enemy.y, '#ffd700', 10, 4);
        }
      }
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: shield.radius, life: 0.4, color: '#ffd700' });
      addDamageText(unit.x, unit.y - unit.size, 'VENGEANCE BURST!', '#ffd700');
    }
  }
}

function tickPaladinTimers(unit, {
  frame,
  randomRange,
  groundEffects,
  addHealFx,
  emitParticle,
  addDamageText,
  playShieldBlock,
  shake,
}) {
  if (unit.bladeOfWrathBuff > 0) {
    unit.bladeOfWrathBuff--;
    if (unit.bladeOfWrathBuff <= 0 && unit._bowOrigDmg) {
      unit.dmg = unit._bowOrigDmg;
      unit._bowOrigDmg = null;
    }
  }
  if (unit.ardentDefenderTimer > 0) unit.ardentDefenderTimer--;
  if (unit.ardentDefender && unit.ardentDefender.used) {
    unit.ardentDefender.resetT = (unit.ardentDefender.resetT || 0) + 1;
    if (unit.ardentDefender.resetT >= unit.ardentDefender.resetCD) {
      unit.ardentDefenderDR = 0.15;
      unit.ardentDefenderDRTimer = 4 * GAME_TICK_HZ;
      unit.ardentDefender.resetT = 0;
      for (let i = 0; i < 8; i++) {
        const angle = i / 8 * Math.PI * 2;
        emitParticle(unit.x + Math.cos(angle) * 22, unit.y + Math.sin(angle) * 22, '#ffd700', 14, 2);
      }
      emitParticle(unit.x, unit.y, '#ffffff', 12, 4);
      emitParticle(unit.x, unit.y, '#ffd700', 16, 5);
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 40, life: 0.5, color: '#ffd700' });
      addDamageText(unit.x, unit.y - unit.size - 6, 'ARDENT DEFENDER', '#ffd700', { sz: 14, bold: true });
      shake(4);
      playShieldBlock();
    }
  }
  if (unit.ardentDefenderDRTimer > 0) {
    unit.ardentDefenderDRTimer--;
    if (unit.ardentDefenderDRTimer <= 0) unit.ardentDefenderDR = 0;
  }
  if (unit.sacredBulwarkTimer > 0) {
    unit.sacredBulwarkTimer--;
    if (frame % 8 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.45, unit.size * 0.45), unit.y - unit.size * 0.2, '#ffd700', 1, 2);
  }
  if (unit.guardianOathTimer > 0) {
    unit.guardianOathTimer--;
    if (frame % 8 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.2, '#ffe066', 1, 2);
    if (unit.guardianOathTimer <= 0) unit.guardianOathDR = 0;
  }
  if (unit.guardiansMercyTimer > 0) {
    unit.guardiansMercyTimer--;
    if (frame % 8 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.2, '#ffd700', 1, 2);
    if (unit.guardiansMercyTimer <= 0) unit.guardiansMercyDR = 0;
  }
  if (unit.ashenGuardianTimer > 0) {
    unit.ashenGuardianTimer--;
    if (frame % 6 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.55, unit.size * 0.55), unit.y - unit.size * 0.25, '#ff8844', 1, 3);
  }
  if (unit.hallowedLeapShieldTimer > 0) {
    unit.hallowedLeapShieldTimer--;
    if (frame % 5 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.2, '#ffe066', 1, 3);
  }
  if (unit.goakTimer > 0) {
    unit.goakTimer--;
    if (frame % GAME_TICK_HZ === 0 && unit.goakHealPerTick > 0) {
      unit.hp = Math.min(unit.maxHp, unit.hp + unit.goakHealPerTick);
      addHealFx(unit.x, unit.y, unit.goakHealPerTick);
    }
    if (frame % 6 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.4, '#ffd700', 1, 3);
    if (unit.goakTimer <= 0) {
      unit.armor = unit._goakOrigArmor;
      unit.goakDR = 0;
      unit.goakHealPerTick = 0;
    }
  }
}

function tickSimpleSelfHeals(unit, {
  frame,
  addHealFx,
}) {
  if (unit.secondWind && unit.hp > 0 && unit.hp < unit.maxHp * 0.5 && frame % GAME_TICK_HZ === 0) {
    const heal = Math.round(unit.maxHp * 0.02);
    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
    addHealFx(unit.x, unit.y, heal);
  }
  if (unit.runicHeal && unit._runicProc) {
    unit._runicProc = false;
    const heal = Math.round(unit.maxHp * unit.runicHealPct);
    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
    addHealFx(unit.x, unit.y, heal);
  }
  if (unit.regenPct && unit.hp > 0 && unit.hp < unit.maxHp && frame % GAME_TICK_HZ === 0) {
    const heal = Math.round(unit.maxHp * unit.regenPct);
    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
    addHealFx(unit.x, unit.y, heal);
  }
  if (unit.infusionOfLightTimer > 0) unit.infusionOfLightTimer--;
  if (unit.barrierOfFaithTimer > 0) {
    unit.barrierOfFaithTimer--;
    if (unit.barrierOfFaithTimer <= 0 && unit.shieldHp > 0) unit.shieldHp = 0;
  }
}

function tickAvengersShield(unit, {
  enemies,
  projectiles,
  showFlash,
  addDamageText,
  shake,
}) {
  if (!unit.avengersShield) return;

  unit.avengersShield.cd++;
  if (unit.avengersShield.cd < unit.avengersShield.every) return;

  let current = null;
  let currentDistance = 0;
  for (const enemy of enemies) {
    if (enemy.hp > 0) {
      const distance = dist(unit, enemy);
      if (distance < 400 && distance > currentDistance) {
        currentDistance = distance;
        current = enemy;
      }
    }
  }
  if (!current) return;

  unit.avengersShield.cd = 0;
  const isCapstone = arena_isCapstoneLevel(unit.level || 1);
  const mult = isCapstone ? (unit.avengersShield.l4Mult || 1.65) : (unit.avengersShield.mult || 1.5);
  const bounces = isCapstone ? (unit.avengersShield.l4Bounces || 5) : (unit.avengersShield.bounces || 3);
  const shieldCap = isCapstone ? (unit.avengersShield.l4ShieldCapPct || 0.16) : (unit.avengersShield.shieldCapPct || 0.12);
  projectiles.push({
    x: unit.x,
    y: unit.y,
    tx: current.x,
    ty: current.y,
    target: current,
    dmg: Math.round(unit.dmg * mult),
    attacker: unit,
    speed: 2.5,
    isPlayer: true,
    projType: 'avengersShield',
    pierce: bounces - 1,
    silenceDur: unit.avengersShield.silenceDur,
    shieldCapPct: shieldCap,
    size: 12,
  });
  addDamageText(unit.x, unit.y - unit.size, "AVENGER'S SHIELD!", '#88aaff');
  showFlash("AVENGER'S SHIELD", '#88aaff', 25);
  shake(3);
}

function tickBeaconOfVirtue(unit, {
  frame,
  units,
  randomRange,
  emitParticle,
}) {
  if (!unit._beaconOfVirtue) return;

  unit._beaconOfVirtue.timer--;
  if (unit._beaconOfVirtue.timer <= 0) {
    unit._beaconOfVirtue = null;
    for (const ally of units) if (ally.isPlayer && ally.hp > 0) ally._beaconMark = 0;
  } else if (frame % 60 === 0) {
    for (const ally of units) {
      if (!ally.isPlayer || ally.hp <= 0 || ally.isGhost) continue;
      emitParticle(ally.x, ally.y + randomRange(-4, 4), '#ffd700', 1, 2);
    }
  }
}

function tickHolyShock(unit, {
  units,
  enemies,
  beamEffects,
  groundEffects,
  dealDamage,
  applyTrackedHeal,
  beaconSplash,
  emitParticle,
  addDamageText,
}) {
  if (!unit.holyShock) return;

  unit.holyShock.cd++;
  if (unit.holyShock.cd < unit.holyShock.every) return;

  unit.holyShock.cd = 0;
  const allies = [];
  for (const ally of units) {
    if (ally.hp <= 0 || !ally.isPlayer || ally.isGhost) continue;
    if (ally.hp / ally.maxHp < 0.85) allies.push(ally);
  }
  allies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
  if (allies.length > 0) {
    const count = Math.min(3, allies.length);
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 60, life: 0.3, color: 'rgba(255,255,255,0.2)' });
    for (let i = 0; i < count; i++) {
      const healTarget = allies[i];
      let heal = Math.round(healTarget.maxHp * unit.holyShock.healPct);
      if (unit.holyShock.critBonus) {
        heal = Math.round(heal * 1.5);
        if (i === count - 1) unit.holyShock.critBonus = false;
      }
      if (unit.infusionOfLightTimer > 0) heal = Math.round(heal * 1.30);
      heal = Math.min(80, heal);
      heal = applyTrackedHeal(healTarget, heal, unit, true);
      beamEffects.push({ x1: unit.x, y1: unit.y, x2: healTarget.x, y2: healTarget.y, life: 20, maxLife: 20, color: '#ffffff', width: 2, straight: false });
      emitParticle(healTarget.x, healTarget.y, '#ffffff', 6, 3);
      emitParticle(healTarget.x, healTarget.y, '#ffe066', 4, 2);
      beaconSplash(unit, healTarget, heal);
    }
    if (count > 0) addDamageText(unit.x, unit.y - unit.size - 6, 'HOLY SHOCK', '#ffffff', { sz: 12, bold: true, outline: '#555500' });
    return;
  }

  let damageTarget = null;
  let bestDistance = Infinity;
  for (const enemy of enemies) {
    if (enemy.hp > 0) {
      const distance = dist(unit, enemy);
      if (distance < 200 && distance < bestDistance) {
        bestDistance = distance;
        damageTarget = enemy;
      }
    }
  }
  if (!damageTarget) return;

  const damage = Math.round(unit.dmg * unit.holyShock.mult);
  const isCrit = unit.crit && Math.random() < unit.crit.chance;
  dealDamage(damageTarget, isCrit ? damage * 2 : damage, unit, 'magic');
  if (isCrit) {
    unit.holyShock.critBonus = true;
    if (unit.infusionOfLight) unit.infusionOfLightTimer = 240;
  }
  beamEffects.push({ x1: unit.x, y1: unit.y, x2: damageTarget.x, y2: damageTarget.y, life: 15, maxLife: 15, color: '#ffe066', width: 2, straight: false });
  emitParticle(damageTarget.x, damageTarget.y, '#ffe066', 8, 3);
}

function tickAntidoteField(unit, {
  frame,
  units,
  randomRange,
  groundEffects,
  applyTrackedHeal,
  emitParticle,
  addDamageText,
}) {
  if (!unit.antidoteField) return;

  unit.antidoteField.cd++;
  if (unit.antidoteField.active) {
    const field = unit.antidoteField.active;
    field.t++;
    for (const ally of units) {
      if (ally.hp <= 0 || !ally.isPlayer || ally.isGhost) continue;
      if (ally.hp >= ally.maxHp) continue;
      if (dist({ x: field.x, y: field.y }, ally) > unit.antidoteField.radius) continue;
      if (frame % 30 === 0) applyTrackedHeal(ally, Math.round(unit.antidoteField.hps / 2), unit, false);
    }
    if (frame % 30 === 0) {
      groundEffects.push({ x: field.x, y: field.y, r: 0, maxR: unit.antidoteField.radius, life: 0.6, color: '#88ffaa' });
    }
    if (frame % 6 === 0) {
      const angle = Math.random() * Math.PI * 2;
      emitParticle(field.x + Math.cos(angle) * unit.antidoteField.radius * 0.7, field.y + Math.sin(angle) * unit.antidoteField.radius * 0.7, '#88ffaa', 1, 3);
    }
    if (field.t >= unit.antidoteField.dur) unit.antidoteField.active = null;
  } else if (unit.antidoteField.cd >= unit.antidoteField.every) {
    unit.antidoteField.cd = 0;
    unit.antidoteField.active = { x: unit.x, y: unit.y, t: 0 };
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.antidoteField.radius, life: 0.5, color: '#88ffaa' });
    addDamageText(unit.x, unit.y - unit.size, 'ANTIDOTE', '#88ffaa');
  }
}
