import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function tickUnitHealerAuraPassives(unit, deps) {
  tickHealAura(unit, deps);
  tickLifebloom(unit, deps);
  tickEfflorescenceSpawner(unit, deps);
  tickMushroomRing(unit, deps);
  tickTreantMinion(unit, deps);
  tickWildGrowthCaster(unit, deps);
  tickWildGrowthHot(unit, deps);
  tickNaturesBlessing(unit, deps);
  tickNaturesBlessingTimer(unit);
  tickIncarnation(unit, deps);
  tickTranquility(unit, deps);
  tickPlagueCloud(unit, deps);
  tickCelestialAlignment(unit, deps);
  tickAstralPower(unit);
  tickEclipse(unit, deps);
  tickSustainWisp(unit, deps);
  tickLayOnHands(unit, deps);
  tickSlowAura(unit, deps);
}

function tickHealAura(unit, {
  frame,
  units,
  randomRange,
  applyTrackedHeal,
  drainHealToBarrier,
  emitParticle,
}) {
  if (!unit.healAura) return;

  unit.healAura.tick++;
  if (unit.healAura.tick >= GAME_TICK_HZ) {
    unit.healAura.tick = 0;
    for (const ally of units) {
      if (ally === unit || ally.hp <= 0 || !ally.isPlayer) continue;
      if (ally.hp >= ally.maxHp) continue;
      if (dist(unit, ally) <= unit.healAura.radius) {
        applyTrackedHeal(ally, unit.healAura.hps, unit, false);
        for (let i = 0; i < 3; i++) emitParticle(ally.x + randomRange(-3, 3), ally.y - i * 4, '#3aff66', 1, 3);
      }
    }
    drainHealToBarrier(unit.healAura.hps, unit);
  }
  if (frame % 18 === 0) emitParticle(unit.x + randomRange(-6, 6), unit.y - unit.size * 0.5 + randomRange(-3, 3), '#3aff66', 1, 2);
}

function tickLifebloom(unit, {
  frame,
  applyTrackedHeal,
  emitParticle,
}) {
  if (!unit._lifebloomStacks || unit._lifebloomStacks.length <= 0) return;

  for (let i = unit._lifebloomStacks.length - 1; i >= 0; i--) {
    const stack = unit._lifebloomStacks[i];
    stack.tick++;
    if (stack.tick >= GAME_TICK_HZ) {
      stack.tick = 0;
      if (unit.hp > 0 && unit.hp < unit.maxHp) applyTrackedHeal(unit, Math.round(unit.maxHp * stack.hotPct), stack.from, false);
    }
    stack.timer--;
    if (stack.timer <= 0) unit._lifebloomStacks.splice(i, 1);
  }

  if (frame % 8 === 0 && unit._lifebloomStacks.length > 0) {
    const angle = frame * 0.05;
    for (let i = 0; i < unit._lifebloomStacks.length; i++) {
      const leafAngle = angle + i * (Math.PI * 2 / 3);
      emitParticle(unit.x + Math.cos(leafAngle) * 8, unit.y - unit.size * 0.5 + Math.sin(leafAngle) * 5, '#44ff66', 1, 2);
    }
  }
}

function tickEfflorescenceSpawner(unit, {
  units,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (!unit.efflorescence) return;

  unit.efflorescence.cd++;
  if (unit.efflorescence.cd < unit.efflorescence.every) return;

  const ringCount = units.filter(minion => minion.isMinion && minion.parent === unit && minion.kind === 'mushroom' && minion.hp > 0).length;
  if (ringCount >= unit.efflorescence.maxRings) return;

  unit.efflorescence.cd = 0;
  let lowest = null;
  let lowPct = Infinity;
  for (const ally of units) {
    if (ally.isPlayer && ally.hp > 0 && !ally.isMinion) {
      const pct = ally.hp / ally.maxHp;
      if (pct < lowPct) {
        lowPct = pct;
        lowest = ally;
      }
    }
  }

  const x = lowest ? lowest.x + randomRange(-20, 20) : unit.x;
  const y = lowest ? lowest.y + randomRange(-10, 10) : unit.y;
  const level = unit.level || 1;
  const hp = 60 + level * 15;
  units.push({
    x,
    y,
    maxHp: hp,
    hp,
    dmg: 0,
    speed: 0,
    atkSpd: 999,
    range: unit.efflorescence.ringR,
    size: 6,
    armor: 0,
    magicRes: 3,
    isPlayer: true,
    isMinion: true,
    parent: unit,
    kind: 'mushroom',
    cd: 0,
    _mushroomHealPct: unit.efflorescence.healPct,
    _mushroomTick: 0,
    _mushroomPhase: Math.random() * Math.PI * 2,
    color: '#44ff88',
    accent: '#228844',
    facing: 1,
    bobPhase: 0,
    lifeTicks: unit.efflorescence.ringDur,
  });
  emitParticle(x, y, '#44ff88', 14, 4);
  emitParticle(x, y, '#88ffaa', 8, 3);
  addDamageText(x, y - 8, 'MUSHROOM!', '#44ff88');
}

function tickMushroomRing(unit, {
  units,
  applyTrackedHeal,
}) {
  if (unit.kind !== 'mushroom' || !unit._mushroomHealPct) return;

  unit._mushroomTick++;
  if (unit._mushroomTick < GAME_TICK_HZ) return;

  unit._mushroomTick = 0;
  const healMult = unit.parent && unit.parent._incarnation ? 1.5 : 1.0;
  for (const ally of units) {
    if (ally.isPlayer && ally.hp > 0 && ally !== unit && !ally.isMinion && ally.hp < ally.maxHp && dist(unit, ally) <= unit.range) {
      applyTrackedHeal(ally, Math.round(ally.maxHp * unit._mushroomHealPct * healMult), unit.parent || unit, false);
    }
  }
}

function tickTreantMinion(unit, {
  frame,
  units,
  beamEffects,
  applyTrackedHeal,
  randomRange,
  emitParticle,
}) {
  if (unit.kind !== 'treant' || !unit._treantHealPct) return;

  unit._treantTick++;
  if (unit._treantTick >= GAME_TICK_HZ) {
    unit._treantTick = 0;
    const healMult = unit.parent && unit.parent._incarnation ? 1.5 : 1.0;
    let lowest = null;
    let lowPct = Infinity;
    for (const ally of units) {
      if (ally.isPlayer && ally.hp > 0 && ally !== unit && !ally.isMinion) {
        const pct = ally.hp / ally.maxHp;
        if (pct < lowPct) {
          lowPct = pct;
          lowest = ally;
        }
      }
    }
    if (lowest && lowPct < 0.95) {
      applyTrackedHeal(lowest, Math.round(lowest.maxHp * unit._treantHealPct * healMult), unit.parent || unit, false);
      beamEffects.push({ x1: unit.x, y1: unit.y, x2: lowest.x, y2: lowest.y, life: 12, maxLife: 12, color: '#44ff66', width: 1.5, straight: true });
      emitParticle(lowest.x, lowest.y, '#44ff66', 4, 2);
    }
  }

  if (frame % 10 === 0) emitParticle(unit.x + randomRange(-5, 5), unit.y - unit.size, '#44ff6688', 1, 2);
}

function tickWildGrowthCaster(unit, {
  units,
  projectiles,
  emitParticle,
  addDamageText,
}) {
  if (!unit.wildGrowth) return;

  unit.wildGrowth.cd++;
  if (unit.wildGrowth.cd < unit.wildGrowth.every) return;

  unit.wildGrowth.cd = 0;
  const healMult = unit._incarnation ? 1.5 : 1.0;
  const targets = [];
  for (const ally of units) {
    if (ally.isPlayer && ally.hp > 0 && !ally.isMinion) targets.push({ unit: ally, pct: ally.hp / ally.maxHp });
  }
  targets.sort((a, b) => a.pct - b.pct);
  const count = Math.min(unit.wildGrowth.targets, targets.length);
  for (let i = 0; i < count; i++) {
    const target = targets[i].unit;
    target._wgHot = { timer: unit.wildGrowth.hotDur, tick: 0, healPct: unit.wildGrowth.hotPct * healMult, from: unit };
    projectiles.push({ x: unit.x, y: unit.y, target, tx: target.x, ty: target.y, speed: 3, projType: 'pomOrb', visualOnly: true, color: '#44ff66', _arrN: 6, _arrSz: 2, isPlayer: true, dmg: 0 });
    emitParticle(target.x, target.y, '#44ff66', 6, 3);
  }
  if (count > 0) addDamageText(unit.x, unit.y - unit.size, 'WILD GROWTH!', '#44ff66');
}

function tickWildGrowthHot(unit, {
  frame,
  randomRange,
  applyTrackedHeal,
  emitParticle,
}) {
  if (!unit._wgHot) return;

  unit._wgHot.tick++;
  if (unit._wgHot.tick >= GAME_TICK_HZ) {
    unit._wgHot.tick = 0;
    if (unit.hp > 0 && unit.hp < unit.maxHp) {
      applyTrackedHeal(unit, Math.round(unit.maxHp * unit._wgHot.healPct), unit._wgHot.from, false);
      emitParticle(unit.x + randomRange(-4, 4), unit.y - unit.size * 0.5, '#44ff66', 1, 2);
    }
  }
  unit._wgHot.timer--;
  if (unit._wgHot.timer <= 0) unit._wgHot = null;
  if (frame % 8 === 0) emitParticle(unit.x + randomRange(-6, 6), unit.y - unit.size * 0.6, '#44ff6644', 1, 2);
}

function tickNaturesBlessing(unit, {
  units,
  emitParticle,
  addDamageText,
}) {
  if (!unit.naturesBlessing) return;

  unit.naturesBlessing.cd++;
  if (unit.naturesBlessing.cd < unit.naturesBlessing.every) return;

  let lowest = null;
  let lowPct = Infinity;
  for (const ally of units) {
    if (ally.isPlayer && ally.hp > 0 && ally !== unit && !ally.isMinion && !ally._nbBuff) {
      const pct = ally.hp / ally.maxHp;
      if (pct < lowPct) {
        lowPct = pct;
        lowest = ally;
      }
    }
  }
  if (!lowest) return;

  unit.naturesBlessing.cd = 0;
  lowest._nbBuff = unit.naturesBlessing.dur;
  lowest._nbOrigDmg = lowest._nbOrigDmg || lowest.dmg;
  lowest.dmg = Math.round(lowest._nbOrigDmg * (1 + unit.naturesBlessing.dmgBuff));
  addDamageText(lowest.x, lowest.y - lowest.size, 'BLESSED!', '#ffaa33');
  emitParticle(lowest.x, lowest.y, '#ffaa33', 10, 3);
}

function tickNaturesBlessingTimer(unit) {
  if (!(unit._nbBuff > 0)) return;

  unit._nbBuff--;
  if (unit._nbBuff <= 0 && unit._nbOrigDmg) {
    unit.dmg = unit._nbOrigDmg;
    unit._nbOrigDmg = null;
  }
}

function tickIncarnation(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if (!unit._incarnation) return;

  unit._incarnation.timer--;
  if (unit._incarnation.timer <= 0) {
    unit._incarnation = null;
  } else if (frame % 6 === 0) {
    emitParticle(unit.x + randomRange(-8, 8), unit.y - unit.size + randomRange(-4, 4), '#44ff66', 1, 3);
    emitParticle(unit.x + randomRange(-5, 5), unit.y + randomRange(-3, 3), '#88ffaa44', 1, 2);
  }
}

function tickTranquility(unit, {
  frame,
  units,
  beamEffects,
  groundEffects,
  randomRange,
  applyTrackedHeal,
  emitParticle,
}) {
  if (!unit._tranquility) return;

  unit._tranquility.tick++;
  if (unit._tranquility.tick >= unit._tranquility.tickRate) {
    unit._tranquility.tick = 0;
    const healMult = unit._incarnation ? 1.5 : 1.0;
    const allies = [];
    for (const ally of units) {
      if (ally.isPlayer && ally.hp > 0 && !ally.isMinion) allies.push(ally);
    }
    allies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
    const targets = allies.slice(0, 5);
    for (const ally of targets) {
      applyTrackedHeal(ally, Math.round(ally.maxHp * unit._tranquility.healPct * healMult), unit, true);
      emitParticle(ally.x + randomRange(-6, 6), ally.y - randomRange(10, 30), '#44ff88', 1, 3);
      emitParticle(ally.x + randomRange(-4, 4), ally.y - randomRange(5, 20), '#88ffcc', 1, 2);
      beamEffects.push({ x1: unit.x, y1: unit.y, x2: ally.x, y2: ally.y, life: 0.12, maxLife: 0.12, color: '#44ff88', width: 2, straight: false });
      emitParticle(ally.x, ally.y, '#66ffaa', 6, 3);
    }
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 120, life: 0.3, color: '#44ff8844' });
  }

  unit._tranquility.timer--;
  if (unit._tranquility.timer <= 0) {
    unit._tranquility = null;
    return;
  }

  if (frame % 3 === 0) {
    const x = unit.x + randomRange(-80, 80);
    const y = unit.y - randomRange(40, 80);
    emitParticle(x, y, '#44ff8866', 1, 4);
    emitParticle(x + randomRange(-10, 10), y + randomRange(5, 15), '#88ffaa44', 1, 3);
  }
  if (frame % 6 === 0) emitParticle(unit.x + randomRange(-10, 10), unit.y - unit.size - randomRange(0, 10), '#33ff77', 1, 3);
}

function tickPlagueCloud(unit, {
  frame,
  enemies,
  randomRange,
  dealDamage,
  emitParticle,
}) {
  if (!unit._plagueCloud) return;

  unit._plagueCloud.t--;
  if (unit._plagueCloud.t <= 0) {
    unit._plagueCloud = null;
  } else if (frame % 60 === 0) {
    for (const enemy of enemies) {
      if (enemy.hp > 0 && dist({ x: unit._plagueCloud.x, y: unit._plagueCloud.y }, enemy) <= unit._plagueCloud.r) {
        dealDamage(enemy, unit._plagueCloud.dmg, unit._plagueCloud.from, 'magic');
        emitParticle(enemy.x, enemy.y, '#aa44ff', 3, 2);
      }
    }
    if (frame % 12 === 0) emitParticle(unit._plagueCloud.x + randomRange(-60, 60), unit._plagueCloud.y + randomRange(-60, 60), '#8833cc', 1, 3);
  }
}

function tickCelestialAlignment(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if (!unit._celestialAlignment) return;

  unit._celestialAlignment.timer--;
  if (unit._celestialAlignment.timer <= 0) {
    unit._celestialAlignment = null;
    return;
  }

  if (frame % 4 === 0) {
    const angle = frame * 0.06;
    emitParticle(unit.x + Math.cos(angle) * randomRange(12, 28), unit.y + Math.sin(angle) * randomRange(8, 20), '#ffd700', 1, 3);
    emitParticle(unit.x + Math.cos(angle + Math.PI) * randomRange(12, 28), unit.y + Math.sin(angle + Math.PI) * randomRange(8, 20), '#aaccff', 1, 3);
  }
}

function tickAstralPower(unit) {
  if (!unit._astralPower || unit._astralPower.stacks <= 0) return;

  unit._astralPower.decayCD++;
  if (unit._astralPower.decayCD >= unit._astralPower.decayEvery) {
    unit._astralPower.stacks = Math.max(0, unit._astralPower.stacks - 1);
    unit._astralPower.decayCD = 0;
  }
}

function tickEclipse(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if (!unit._eclipse || frame % 6 !== 0) return;

  if (unit._eclipse.phase === 'solar') {
    emitParticle(unit.x + randomRange(-8, 8), unit.y - unit.size * 0.6, '#ffd70066', 1, 2);
  } else {
    emitParticle(unit.x + randomRange(-8, 8), unit.y - unit.size * 0.6, '#aaccff66', 1, 2);
  }
}

function tickSustainWisp(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if (!(unit.smiteHeal || unit._aromaStatues || unit.beacon) || frame % 18 !== 0) return;

  emitParticle(unit.x + randomRange(-6, 6), unit.y - unit.size * 0.6, '#7aff9a', 1, 3);
  emitParticle(unit.x + randomRange(-4, 4), unit.y - unit.size * 0.3, '#ffffff', 1, 2);
}

function tickLayOnHands(unit, {
  units,
  projectiles,
  groundEffects,
  drainHealToBarrier,
  addHealFx,
  emitParticle,
  addDamageText,
}) {
  if (!unit.layOnHandsProc) return;

  unit.layOnHandsProc.counter++;
  if (unit.layOnHandsProc.counter < unit.layOnHandsProc.every) return;

  let target = null;
  if (unit.arch === 'healer') {
    let bestPct = Infinity;
    let bestTank = null;
    let bestTankPct = Infinity;
    let best = null;
    for (const ally of units) {
      if (ally.hp <= 0 || !ally.isPlayer || ally.isGhost) continue;
      const pct = ally.hp / ally.maxHp;
      if (pct >= unit.layOnHandsProc.threshold) continue;
      if (pct < bestPct) {
        bestPct = pct;
        best = ally;
      }
      if (ally.arch === 'tank' && pct < bestTankPct) {
        bestTankPct = pct;
        bestTank = ally;
      }
    }
    target = bestTank || best;
  } else {
    const pct = unit.hp / unit.maxHp;
    if (pct < unit.layOnHandsProc.threshold) target = unit;
  }

  if (target) {
    unit.layOnHandsProc.counter = 0;
    const amount = target.maxHp - target.hp;
    target.hp = target.maxHp;
    addHealFx(target.x, target.y, amount, true);
    emitParticle(target.x, target.y, '#ffd700', 32, 6);
    emitParticle(target.x, target.y, '#ffffff', 16, 4);
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 60, life: 0.4, color: '#ffd700' });
    addDamageText(target.x, target.y - target.size - 6, 'LAY ON HANDS', '#ffd700', { sz: 15, bold: true });
    applyBeaconLayOnHands(unit, target, { units, projectiles, groundEffects, addHealFx, emitParticle, addDamageText });
    drainHealToBarrier(amount, unit);
  } else {
    unit.layOnHandsProc.counter = 0;
  }
}

function applyBeaconLayOnHands(unit, target, {
  units,
  projectiles,
  groundEffects,
  addHealFx,
  emitParticle,
  addDamageText,
}) {
  if (!unit._beaconOfVirtue || unit._beaconOfVirtue.timer <= 0) return;

  const allies = [];
  for (const ally of units) {
    if (ally === target || ally.hp <= 0 || !ally.isPlayer || ally.isGhost) continue;
    if (!ally._beaconMark || ally._beaconMark <= 0) continue;
    allies.push(ally);
  }
  allies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
  const targets = allies.slice(0, 4);
  for (const ally of targets) {
    const amount = ally.maxHp - ally.hp;
    ally.hp = ally.maxHp;
    addHealFx(ally.x, ally.y, amount || 0, true);
    emitParticle(ally.x, ally.y, '#ffd700', 24, 5);
    emitParticle(ally.x, ally.y, '#ffffff', 12, 3);
    groundEffects.push({ x: ally.x, y: ally.y, r: 0, maxR: 50, life: 0.35, color: '#ffd700' });
    addDamageText(ally.x, ally.y - ally.size - 6, 'LAY ON HANDS', '#ffd700', { sz: 14, bold: true });
    projectiles.push({ x: target.x, y: target.y, target: ally, tx: ally.x, ty: ally.y, speed: 2.5, projType: 'serenityOrb', visualOnly: true, color: '#ffd700', _arrN: 8, _arrSz: 3, isPlayer: true, dmg: 0 });
  }
}

function tickSlowAura(unit, {
  enemies,
}) {
  if (!unit.slowAura) return;

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    if (dist(unit, enemy) <= unit.slowAura.radius) {
      enemy.slowTimer = Math.max(enemy.slowTimer || 0, 30);
      enemy.slowMult = Math.min(enemy.slowMult || 1, unit.slowAura.mult);
    }
  }
}
