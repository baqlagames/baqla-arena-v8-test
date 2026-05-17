import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function tickUnitWarlockPassives(unit, {
  frame,
  units,
  enemies,
  randomRange,
  beamFx,
  groundEffects,
  dealDamage,
  findDrainTarget,
  curseWeight,
  applyAgony,
  emitParticle,
  addDamageText,
  shake,
}) {
  tickDrainLife(unit, { frame, enemies, randomRange, beamFx, dealDamage, findDrainTarget, emitParticle });
  tickSoulHarvest(unit, { frame, enemies, beamFx, groundEffects, dealDamage, curseWeight, applyAgony, emitParticle, addDamageText, shake });
  tickDarkPactEffects(unit, { frame, emitParticle });
  tickEngineerShield(unit, { frame, emitParticle });
  tickDemonicEmpowerment(unit, { frame, units, groundEffects, emitParticle, addDamageText });
  tickDemonicEmpowermentMinions(unit, { units });
  tickHavocRemark(unit, { enemies, emitParticle });
  tickImmolatePatches(unit, { frame, enemies, randomRange, dealDamage, emitParticle });
  tickDarkSoulMisery(unit, { frame, randomRange, emitParticle, addDamageText });
  tickNetherPortalMinions(unit, { units });
  tickDarkSoulInstability(unit, { frame, randomRange, emitParticle, addDamageText });
  tickInfernalFireStomp(unit, { enemies, groundEffects, dealDamage, emitParticle, addDamageText });
  tickFelhoundSpellLock(unit, { enemies, beamFx, groundEffects, emitParticle, addDamageText });
}

function tickDrainLife(unit, {
  frame,
  enemies,
  randomRange,
  beamFx,
  dealDamage,
  findDrainTarget,
  emitParticle,
}) {
  if (!unit._drainLife) return;

  const drain = unit._drainLife;
  drain.t++;
  if (!drain.target || drain.target.hp <= 0) {
    let newTarget = findDrainTarget(unit);
    let bestDistance = Infinity;
    if (!newTarget) {
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const distance = dist(unit, enemy);
        if (distance < (unit.range || 180) + 50 && distance < bestDistance) {
          bestDistance = distance;
          newTarget = enemy;
        }
      }
    }
    if (newTarget) drain.target = newTarget;
    else {
      unit._drainLife = null;
      unit._drainChanneling = false;
    }
  }
  if (!unit._drainLife) return;

  if (unit.stunned > 0 || drain.t >= drain.dur) {
    unit._drainLife = null;
    unit._drainChanneling = false;
    return;
  }

  const damage = Math.round(drain.dps / GAME_TICK_HZ);
  if (frame % 2 === 0 && damage > 0) {
    dealDamage(drain.target, damage, unit, 'magic');
    unit.hp = Math.min(unit.maxHp, unit.hp + damage);
    if (frame % 8 === 0) emitParticle(unit.x, unit.y, '#33ff66', 4, 2);
  }
  if (frame % 3 === 0) {
    const pct = Math.random();
    const x = unit.x + (drain.target.x - unit.x) * pct;
    const y = unit.y + (drain.target.y - unit.y) * pct;
    emitParticle(x + randomRange(-3, 3), y + randomRange(-3, 3), '#33ff66', 1, 2);
  }
  if (frame % 5 === 0) {
    beamFx.push({ x1: unit.x, y1: unit.y - unit.size * 0.25, x2: drain.target.x, y2: drain.target.y - drain.target.size * 0.2, life: 0.16, maxLife: 0.16, color: '#33ff66', width: 3.5, straight: false });
  }
}

function tickSoulHarvest(unit, {
  frame,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  curseWeight,
  applyAgony,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!unit._soulHarvest) return;

  const harvest = unit._soulHarvest;
  harvest.timer--;
  harvest.tickCD--;
  harvest.textCD = Math.max(0, (harvest.textCD || 0) - 1);
  if (harvest.tickCD <= 0) {
    harvest.tickCD = harvest.tickEvery || Math.round(0.5 * GAME_TICK_HZ);
    let hit = 0;
    const targets = enemies
      .filter(enemy => enemy.hp > 0 && dist(harvest, enemy) <= harvest.r)
      .sort((a, b) => dist(harvest, a) - dist(harvest, b))
      .slice(0, harvest.maxTargets || 6);
    for (const enemy of targets) {
      dealDamage(enemy, harvest.dmg, unit, 'magic');
      if (enemy._agonyFrom === unit && enemy._agonyStacks > 0) {
        enemy._agonyTimer = Math.max(enemy._agonyTimer || 0, 4 * GAME_TICK_HZ);
        enemy._agonyTickDmg = Math.round(unit.dmg * (unit.agony ? unit.agony.tickMult : 0.25));
      } else {
        applyAgony(unit, enemy, true, false);
      }
      hit++;
      emitParticle(enemy.x, enemy.y, '#9b59b6', 7, 3);
      emitParticle(enemy.x, enemy.y, '#cc88ff', 3, 2);
      if (hit <= 4) beamFx.push({ x1: unit.x, y1: unit.y - unit.size * 0.25, x2: enemy.x, y2: enemy.y - enemy.size * 0.15, life: 0.22, maxLife: 0.22, color: '#cc88ff', width: 2.5, straight: false });
    }
    groundEffects.push({ x: harvest.x, y: harvest.y, r: 0, maxR: harvest.r, life: 0.32, color: '#7b3a9a' });
    if (hit && harvest.textCD <= 0) {
      addDamageText(harvest.x, harvest.y - 18, 'HARVEST', '#cc88ff', { sz: 11, bold: true });
      harvest.textCD = GAME_TICK_HZ;
      shake(2);
    }
  }

  if (frame % 5 === 0) {
    const angle = frame * 0.08;
    const radius = harvest.r * (0.35 + 0.35 * Math.sin(frame * 0.03));
    emitParticle(harvest.x + Math.cos(angle) * radius, harvest.y + Math.sin(angle) * radius, '#cc88ff', 2, 3);
    emitParticle(harvest.x + Math.cos(angle + Math.PI) * radius * 0.75, harvest.y + Math.sin(angle + Math.PI) * radius * 0.75, '#9b59b6', 1.5, 3);
  }

  if (harvest.timer > 0) return;

  let burst = 0;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || dist(harvest, enemy) > harvest.r || curseWeight(enemy) <= 0) continue;
    dealDamage(enemy, harvest.finalDmg, unit, 'magic');
    burst++;
    emitParticle(enemy.x, enemy.y, '#cc88ff', 14, 5);
    emitParticle(enemy.x, enemy.y, '#9b59b6', 8, 3);
  }
  groundEffects.push({ x: harvest.x, y: harvest.y, r: 0, maxR: harvest.r + 24, life: 0.65, color: '#cc88ff' });
  groundEffects.push({ x: harvest.x, y: harvest.y, r: 0, maxR: harvest.r * 0.55, life: 0.45, color: '#7b3a9a' });
  addDamageText(harvest.x, harvest.y - 22, burst ? 'SOUL BURST!' : 'SOUL HARVEST ENDS', '#cc88ff', { sz: 13, bold: true });
  if (burst) shake(7);
  unit._soulHarvest = null;
}

function tickDarkPactEffects(unit, { frame, emitParticle }) {
  if (unit._darkPactDoTSpeed) {
    unit._darkPactDoTSpeed.t++;
    if (frame % 6 === 0) {
      const angle = frame * 0.1;
      emitParticle(unit.x + Math.cos(angle) * unit.size * 0.9, unit.y + Math.sin(angle) * unit.size * 0.9, '#9b59b6', 1, 2);
    }
    if (unit._darkPactDoTSpeed.t >= unit._darkPactDoTSpeed.dur) unit._darkPactDoTSpeed = null;
  }

  if (unit._darkPactShield && unit._darkPactShield.hp > 0 && frame % 6 === 0) {
    const angle = frame * 0.08;
    for (let i = 0; i < 3; i++) {
      const shieldAngle = angle + i * Math.PI * 2 / 3;
      emitParticle(unit.x + Math.cos(shieldAngle) * unit.size * 1.1, unit.y + Math.sin(shieldAngle) * unit.size * 1.1, '#5a1a5a', 1, 2);
    }
  }
}

function tickEngineerShield(unit, { frame, emitParticle }) {
  if (!unit._engShield) return;

  unit._engShield.t++;
  if (unit._engShield.t >= unit._engShield.dur || unit._engShield.hp <= 0) {
    unit._engShield = null;
  } else if (frame % 6 === 0) {
    const angle = frame * 0.1;
    emitParticle(unit.x + Math.cos(angle) * unit.size * 1.1, unit.y + Math.sin(angle) * unit.size * 1.1, '#44aaff', 1, 2);
  }
}

function tickDemonicEmpowerment(unit, {
  units,
  groundEffects,
  emitParticle,
  addDamageText,
}) {
  if (!unit.demonicEmpowerment) return;

  unit.demonicEmpowerment.cd++;
  if (unit.demonicEmpowerment.cd < unit.demonicEmpowerment.every) return;

  unit.demonicEmpowerment.cd = 0;
  let buffed = 0;
  for (const minion of units) {
    if (!minion.isMinion || minion.parent !== unit || minion.hp <= 0) continue;
    minion._demoEmpTimer = unit.demonicEmpowerment.dur;
    if (!minion._demoEmpOrigDmg) {
      minion._demoEmpOrigDmg = minion.dmg;
      minion._demoEmpOrigAtkSpd = minion.atkSpd;
    }
    minion.dmg = Math.round(minion._demoEmpOrigDmg * unit.demonicEmpowerment.dmgMult);
    minion.atkSpd = Math.max(8, Math.round(minion._demoEmpOrigAtkSpd * unit.demonicEmpowerment.atkSpdMult));
    emitParticle(minion.x, minion.y, '#aa66ff', 14, 4);
    groundEffects.push({ x: minion.x, y: minion.y, r: 0, maxR: Math.max(24, minion.size * 2), life: 0.45, color: '#aa66ff' });
    buffed++;
  }
  if (!buffed) return;

  addDamageText(unit.x, unit.y - unit.size, 'DEMONIC EMPOWERMENT!', '#aa66ff', { sz: 12, bold: true });
  emitParticle(unit.x, unit.y, '#aa66ff', 22, 5);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 115, life: 0.55, color: '#5a3a8a' });
}

function tickDemonicEmpowermentMinions(unit, { units }) {
  for (const minion of units) {
    if (!minion.isMinion || minion.parent !== unit || minion.hp <= 0 || !minion._demoEmpTimer) continue;
    minion._demoEmpTimer--;
    if (minion._demoEmpTimer > 0) continue;
    if (minion._demoEmpOrigDmg) {
      minion.dmg = minion._demoEmpOrigDmg;
      minion._demoEmpOrigDmg = null;
    }
    if (minion._demoEmpOrigAtkSpd) {
      minion.atkSpd = minion._demoEmpOrigAtkSpd;
      minion._demoEmpOrigAtkSpd = null;
    }
  }
}

function tickHavocRemark(unit, { enemies, emitParticle }) {
  if (!unit.havoc) return;

  unit.havoc.remarkT++;
  if (unit.havoc.remarkT < unit.havoc.remarkEvery && unit.havoc.target && unit.havoc.target.hp > 0) return;

  unit.havoc.remarkT = 0;
  let first = null;
  let firstDistance = Infinity;
  let second = null;
  let secondDistance = Infinity;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const distance = dist(unit, enemy);
    if (distance < firstDistance) {
      second = first;
      secondDistance = firstDistance;
      first = enemy;
      firstDistance = distance;
    } else if (distance < secondDistance) {
      second = enemy;
      secondDistance = distance;
    }
  }
  unit.havoc.target = second || first;
  if (unit.havoc.target) emitParticle(unit.havoc.target.x, unit.havoc.target.y, '#ff4466', 8, 3);
}

function tickImmolatePatches(unit, {
  frame,
  enemies,
  randomRange,
  dealDamage,
  emitParticle,
}) {
  if (!unit.immolate || unit.immolate.patches.length <= 0) return;

  for (let i = unit.immolate.patches.length - 1; i >= 0; i--) {
    const patch = unit.immolate.patches[i];
    patch.t++;
    if (patch.t >= patch.dur) {
      unit.immolate.patches.splice(i, 1);
      continue;
    }
    if (frame % 30 === 0) {
      for (const enemy of enemies) {
        if (enemy.hp > 0 && dist({ x: patch.x, y: patch.y }, enemy) <= patch.radius) {
          dealDamage(enemy, patch.dmg, patch.from, 'magic');
        }
      }
    }
    if (frame % 4 === 0) {
      emitParticle(patch.x + randomRange(-patch.radius * 0.5, patch.radius * 0.5), patch.y + randomRange(-patch.radius * 0.3, patch.radius * 0.3), '#ff6600', 1, 3);
    }
  }
}

function tickDarkSoulMisery(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if ((unit._darkSoulTimer || 0) <= 0) return;

  unit._darkSoulTimer--;
  if (frame % 4 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.3, '#9b59b6', 1, 3);
  if (unit._darkSoulTimer > 0) return;

  if (unit.agony && unit._dsOrigMaxStacks != null) {
    unit.agony.maxStacks = unit._dsOrigMaxStacks;
    unit._dsOrigMaxStacks = null;
  }
}

function tickNetherPortalMinions(unit, { units }) {
  for (const minion of units) {
    if (!minion.isMinion || minion.parent !== unit || minion.hp <= 0 || !minion._npTimer) continue;
    minion._npTimer--;
    if (minion._npTimer > 0) continue;
    if (minion._npOrigDmg) {
      minion.dmg = minion._npOrigDmg;
      minion._npOrigDmg = null;
    }
    if (minion._npOrigAtkSpd) {
      minion.atkSpd = minion._npOrigAtkSpd;
      minion._npOrigAtkSpd = null;
    }
  }
}

function tickDarkSoulInstability(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if ((unit._darkSoulInstTimer || 0) <= 0) return;

  unit._darkSoulInstTimer--;
  if (frame % 4 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.3, '#ff6600', 1, 3);
  if (unit._darkSoulInstTimer > 0) return;

  if (unit.crit && unit._dsiOrigCrit != null) {
    unit.crit.chance = unit._dsiOrigCrit;
    unit._dsiOrigCrit = null;
  }
  if (unit.havoc && unit._dsiOrigMirror != null) {
    unit.havoc.mirrorPct = unit._dsiOrigMirror;
    unit._dsiOrigMirror = null;
  }
}

function tickInfernalFireStomp(unit, {
  enemies,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
}) {
  if (unit.kind !== 'infernal' || unit._fireStompCD == null) return;

  unit._fireStompCD++;
  if (unit._fireStompCD < unit._fireStompEvery) return;

  unit._fireStompCD = 0;
  let stomped = 0;
  for (const enemy of enemies) {
    if (enemy.hp > 0 && dist(unit, enemy) <= unit._fireStompRadius) {
      dealDamage(enemy, unit._fireStompDmg, unit.parent || unit, 'magic');
      stomped++;
    }
  }
  if (!stomped) return;

  emitParticle(unit.x, unit.y, '#ff4400', 24, 5);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit._fireStompRadius, life: 0.4, color: '#ff4400' });
  addDamageText(unit.x, unit.y - unit.size, 'FIRE STOMP!', '#ff4400');
}

function tickFelhoundSpellLock(unit, {
  enemies,
  beamFx,
  groundEffects,
  emitParticle,
  addDamageText,
}) {
  if (unit.kind !== 'felhound' || unit._spellLockCD == null) return;

  unit._spellLockCD++;
  if (unit._spellLockCD < unit._spellLockEvery) return;

  unit._spellLockCD = 0;
  let target = null;
  let bestDistance = Infinity;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.isBoss || dist(unit, enemy) >= 80) continue;
    const distance = dist(unit, enemy);
    if (distance < bestDistance) {
      bestDistance = distance;
      target = enemy;
    }
  }
  if (!target) return;

  target.silenceTimer = Math.max(target.silenceTimer || 0, 2 * GAME_TICK_HZ);
  emitParticle(target.x, target.y, '#ff8800', 18, 4);
  emitParticle(target.x, target.y, '#aa66ff', 8, 3);
  addDamageText(target.x, target.y - target.size, 'SPELL LOCK!', '#ff8800', { sz: 12, bold: true });
  beamFx.push({ x1: unit.x, y1: unit.y - unit.size * 0.2, x2: target.x, y2: target.y - target.size * 0.2, life: 0.30, maxLife: 0.30, color: '#ff8800', width: 3, straight: true });
  groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 42, life: 0.38, color: '#ff8800' });
}
