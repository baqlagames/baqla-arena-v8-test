import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function tickUnitBranchPassives(unit, {
  frame,
  units,
  enemies,
  randomRange,
  groundEffects,
  applyHealingReceived,
  addHealFx,
  emitParticle,
  addDamageText,
  shake,
}) {
  tickFrenzy(unit, { frame, randomRange, emitParticle, addDamageText });
  tickVanish(unit, { frame, randomRange, emitParticle, addDamageText });
  tickArmorRegen(unit);
  tickBatataGuardianPassives(unit, { frame, units, enemies, randomRange, groundEffects, applyHealingReceived, addHealFx, emitParticle, addDamageText, shake });
  tickRejuvenationAura(unit, { frame, units, applyHealingReceived, addHealFx, emitParticle });
  tickMagicWard(unit);
  tickRenewAura(unit, { frame, units, randomRange, groundEffects, applyHealingReceived, addHealFx, emitParticle });
}

function tickFrenzy(unit, {
  frame,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (!unit.frenzy) return;

  const below = unit.hp / unit.maxHp <= unit.frenzy.threshold;
  if (below && !unit.frenzy.active) {
    unit.frenzy.active = true;
    unit._origAtkSpd = unit._origAtkSpd || unit.atkSpd;
    unit._origDmg = unit._origDmg || unit.dmg;
    unit.atkSpd = Math.max(8, Math.round(unit.atkSpd * unit.frenzy.atkSpdMult));
    unit.dmg = Math.round(unit.dmg * unit.frenzy.dmgMult);
    unit.frenzyActive = true;
    addDamageText(unit.x, unit.y - unit.size, 'FRENZY!', '#ff3a3a');
    emitParticle(unit.x, unit.y, '#ff3a3a', 24, 5);
  } else if (!below && unit.frenzy.active) {
    unit.frenzy.active = false;
    if (unit._origAtkSpd) unit.atkSpd = unit._origAtkSpd;
    if (unit._origDmg) unit.dmg = unit._origDmg;
    unit.frenzyActive = false;
  }
  if (unit.frenzyActive && frame % 6 === 0) {
    emitParticle(unit.x + randomRange(-unit.size, unit.size), unit.y - unit.size * 0.5, '#ff3a3a', 1, 2);
  }
}

function tickVanish(unit, {
  frame,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (!unit.vanish) return;

  unit.vanish.t++;
  if (!unit.vanish.active && unit.vanish.t >= unit.vanish.every) {
    unit.vanish.active = true;
    unit.vanish.activeT = 0;
    unit.vanishActive = true;
    unit.untargetable = true;
    emitParticle(unit.x, unit.y, '#440044', 24, 5);
    addDamageText(unit.x, unit.y - unit.size, 'VANISH', '#aa4adc');
  }
  if (!unit.vanish.active) return;

  unit.vanish.activeT = (unit.vanish.activeT || 0) + 1;
  if (frame % 4 === 0) emitParticle(unit.x + randomRange(-unit.size, unit.size), unit.y + randomRange(-unit.size, unit.size), '#7a2a8a', 1, 3);
  if (unit.vanish.activeT >= unit.vanish.dur) {
    unit.vanish.active = false;
    unit.vanish.t = 0;
    unit.vanishActive = false;
    unit.untargetable = false;
    unit.vanishEmpower = unit.vanish.empower;
    emitParticle(unit.x, unit.y, '#aa4adc', 32, 5);
    addDamageText(unit.x, unit.y - unit.size, 'STRIKE!', '#aa4adc');
  }
}

function tickArmorRegen(unit) {
  if (!unit.armorRegen) return;

  unit.armorRegen.t++;
  if (unit.armorRegen.t >= unit.armorRegen.every) {
    unit.armorRegen.t = 0;
    unit.armor = (unit.armor || 0) + unit.armorRegen.amount;
  }
}

function tickBatataGuardianPassives(unit, {
  frame,
  units,
  enemies,
  randomRange,
  groundEffects,
  applyHealingReceived,
  addHealFx,
  emitParticle,
  addDamageText,
  shake,
}) {
  tickIronfur(unit);
  tickBerserk(unit, { frame, randomRange, emitParticle });
  tickIncarnation(unit, { frame, randomRange, groundEffects, emitParticle });
  tickTreeOfLife(unit, { frame, units, randomRange, groundEffects, applyHealingReceived, addHealFx, emitParticle });
  tickEarthwarden(unit, { frame, randomRange, emitParticle });
  tickFrenziedRegen(unit, { frame, randomRange, groundEffects, applyHealingReceived, addHealFx, emitParticle, addDamageText, shake });
  if (unit.galacticGuardian && unit.galacticGuardian.cd > 0) unit.galacticGuardian.cd--;
  tickEntanglingRoots(unit, { enemies, groundEffects, emitParticle, addDamageText, shake });
}

function tickIronfur(unit) {
  if (!unit.ironfur || !(unit.ironfur.stacks > 0)) return;

  unit.ironfur.timer--;
  if (unit.ironfur.timer <= 0) {
    const lost = unit.ironfur.stacks * unit.ironfur.perStack;
    unit.armor = Math.max(0, unit.armor - lost);
    unit.ironfur.stacks = 0;
  }
}

function tickBerserk(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if (!unit.berserkActive || !(unit.berserkTimer > 0)) return;

  unit.berserkTimer--;
  if (frame % 6 === 0) emitParticle(unit.x + randomRange(-unit.size, unit.size), unit.y + randomRange(-unit.size, unit.size), '#8fbc3a', 1, 2);
  if (unit.berserkTimer <= 0) {
    unit.berserkActive = false;
    unit.berserkCleave360 = false;
    if (unit._berserkOrigAtkSpd) unit.atkSpd = unit._berserkOrigAtkSpd;
    if (unit._berserkOrigDmg) unit.dmg = unit._berserkOrigDmg;
    unit._berserkOrigAtkSpd = null;
    unit._berserkOrigDmg = null;
  }
}

function tickIncarnation(unit, {
  frame,
  randomRange,
  groundEffects,
  emitParticle,
}) {
  if (!unit.incarnationActive || !(unit.incarnationTimer > 0)) return;

  unit.incarnationTimer--;
  if (frame % 8 === 0) {
    emitParticle(unit.x + randomRange(-unit.size, unit.size), unit.y + randomRange(-unit.size, unit.size), '#c8a050', 2, 3);
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.size + 20, life: 0.15, color: '#c8a050' });
  }
  if (unit.incarnationTimer <= 0) {
    unit.incarnationActive = false;
    unit.incarnationCleave360 = false;
    unit.incarnationCCImmune = false;
    unit.maxHp = unit._preIncarnMaxHp;
    unit.hp = Math.min(unit.hp, unit.maxHp);
    unit.armor = unit._preIncarnArmor;
    unit.size = unit._preIncarnSize;
  }
}

function tickTreeOfLife(unit, {
  frame,
  units,
  randomRange,
  groundEffects,
  applyHealingReceived,
  addHealFx,
  emitParticle,
}) {
  if (!unit.incarnTreeActive || !(unit.incarnTreeTimer > 0)) return;

  unit.incarnTreeTimer--;
  if (frame % GAME_TICK_HZ === 0) {
    for (const ally of units) {
      if (ally.hp <= 0 || !ally.isPlayer || ally.isGhost) continue;
      if (dist(unit, ally) <= 160) {
        const heal = applyHealingReceived(ally, Math.round(ally.maxHp * 0.03));
        ally.hp = Math.min(ally.maxHp, ally.hp + heal);
        addHealFx(ally.x, ally.y, heal);
      }
    }
  }
  if (frame % 5 === 0) {
    emitParticle(unit.x + randomRange(-unit.size, unit.size), unit.y + randomRange(-unit.size, unit.size), '#33cc33', 2, 3);
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.size + 20, life: 0.15, color: '#33aa33' });
  }
  if (unit.incarnTreeTimer <= 0) {
    unit.incarnTreeActive = false;
    unit.maxHp = unit._preTreeMaxHp;
    unit.hp = Math.min(unit.hp, unit.maxHp);
    unit.armor = unit._preTreeArmor;
  }
}

function tickEarthwarden(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if (!(unit.earthwardenShield > 0) || !(unit.earthwardenTimer > 0)) return;

  unit.earthwardenTimer--;
  if (unit.earthwardenTimer <= 0) unit.earthwardenShield = 0;
  if (frame % 10 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y, '#6b8e23', 1, 2);
}

function tickFrenziedRegen(unit, {
  frame,
  randomRange,
  groundEffects,
  applyHealingReceived,
  addHealFx,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!unit.frenziedRegen) return;

  if (unit.frenziedRegen.cd > 0) unit.frenziedRegen.cd--;
  if (unit.frenziedRegen.active) {
    unit.frenziedRegen.timer--;
    if (frame % GAME_TICK_HZ === 0) {
      const heal = applyHealingReceived(unit, Math.round(unit.maxHp * unit.frenziedRegen.healPct));
      unit.hp = Math.min(unit.maxHp, unit.hp + heal);
      addHealFx(unit.x, unit.y, heal);
      emitParticle(unit.x, unit.y, '#88ff88', 6, 3);
    }
    if (frame % 4 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y + unit.size * 0.5, '#44ff44', 1, 2);
    if (unit.frenziedRegen.timer <= 0) unit.frenziedRegen.active = false;
  } else if (unit.frenziedRegen.cd <= 0 && unit.hp / unit.maxHp < unit.frenziedRegen.threshold) {
    unit.frenziedRegen.active = true;
    unit.frenziedRegen.timer = unit.frenziedRegen.dur;
    unit.frenziedRegen.cd = unit.frenziedRegen.cooldown;
    emitParticle(unit.x, unit.y, '#88ff88', 24, 5);
    emitParticle(unit.x, unit.y, '#44ff44', 10, 3);
    addDamageText(unit.x, unit.y - unit.size, 'FRENZIED REGEN!', '#88ff88');
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 50, life: 0.5, color: '#88ff88' });
    shake(3);
  }
}

function tickEntanglingRoots(unit, {
  enemies,
  groundEffects,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!unit.entanglingRoots) return;

  unit.entanglingRoots.cd++;
  if (unit.entanglingRoots.cd < unit.entanglingRoots.every) return;

  const targets = [];
  for (const enemy of enemies) {
    if (enemy.hp > 0 && !enemy.rooted && !enemy.isBoss && dist(unit, enemy) <= unit.entanglingRoots.radius) targets.push(enemy);
  }
  if (targets.length <= 0) return;

  unit.entanglingRoots.cd = 0;
  targets.sort((a, b) => dist(unit, a) - dist(unit, b));
  const count = Math.min(unit.entanglingRoots.maxTargets, targets.length);
  for (let i = 0; i < count; i++) {
    const enemy = targets[i];
    enemy.rooted = true;
    enemy.rootTimer = unit.entanglingRoots.rootDur;
    enemy.rootX = enemy.x;
    enemy.rootY = enemy.y;
    groundEffects.push({ x: enemy.x, y: enemy.y, r: 0, maxR: enemy.size * 1.5, life: 0.8, rootVine: true, rootTarget: enemy, rootDur: unit.entanglingRoots.rootDur });
    emitParticle(enemy.x, enemy.y, '#33aa33', 14, 4);
    emitParticle(enemy.x, enemy.y + enemy.size, '#228822', 8, 3);
  }
  addDamageText(unit.x, unit.y - unit.size, 'ENTANGLING ROOTS!', '#33cc33');
  shake(4);
}

function tickRejuvenationAura(unit, {
  frame,
  units,
  applyHealingReceived,
  addHealFx,
  emitParticle,
}) {
  if (!unit.rejuvAura || frame % unit.rejuvAura.every !== 0) return;

  for (const ally of units) {
    if (ally.hp <= 0 || !ally.isPlayer || ally.isGhost || ally === unit) continue;
    if (ally.hp >= ally.maxHp) continue;
    if (dist(unit, ally) <= unit.rejuvAura.radius) {
      const heal = applyHealingReceived(ally, Math.round(ally.maxHp * unit.rejuvAura.healPct));
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      addHealFx(ally.x, ally.y, heal);
      emitParticle(ally.x, ally.y, '#44ff44', 3, 2);
    }
  }
}

function tickMagicWard(unit) {
  if (!unit.magicWard || unit.magicWard.ready) return;

  unit.magicWard.t++;
  if (unit.magicWard.t >= unit.magicWard.cd) {
    unit.magicWard.ready = true;
    unit.magicWard.t = 0;
  }
}

function tickRenewAura(unit, {
  frame,
  units,
  randomRange,
  groundEffects,
  applyHealingReceived,
  addHealFx,
  emitParticle,
}) {
  if (!unit.renewAura) return;

  unit.renewAura.tick++;
  if (frame % 30 === 0) groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.renewAura.radius, life: 0.3, color: '#88ffaa', flatten: true });
  if (unit.renewAura.tick < GAME_TICK_HZ) return;

  unit.renewAura.tick = 0;
  for (const ally of units) {
    if (ally.hp <= 0 || !ally.isPlayer || ally === unit || ally.isGhost) continue;
    if (ally.hp >= ally.maxHp) continue;
    if (dist(unit, ally) > unit.renewAura.radius) continue;
    const heal = applyHealingReceived(ally, unit.renewAura.hps);
    ally.hp = Math.min(ally.maxHp, ally.hp + heal);
    addHealFx(ally.x, ally.y, heal);
    emitParticle(ally.x + randomRange(-6, 6), ally.y - ally.size, '#88ffaa', 1, 3);
    emitParticle(ally.x + randomRange(-4, 4), ally.y - ally.size * 0.5, '#ffffff', 1, 2);
  }
}
