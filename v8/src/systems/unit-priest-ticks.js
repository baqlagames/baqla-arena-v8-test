import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function tickUnitPriestPassives(unit, {
  frame,
  units,
  enemies,
  projectiles,
  beamEffects,
  arena,
  randomRange,
  groundEffects,
  dealDamage,
  applyHealingReceived,
  addHealFx,
  findEnemyForUnit,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (tickAngelForm(unit, { frame, units, projectiles, randomRange, applyHealingReceived, addHealFx, emitParticle, addDamageText })) return true;
  tickPrayerOfMending(unit, { frame, units, projectiles, emitParticle, addDamageText });
  tickHolyComfortAura(unit, { units, applyHealingReceived, addHealFx, emitParticle });
  tickHolyRenew(unit, { frame, units, projectiles, applyHealingReceived, addHealFx, emitParticle, addDamageText });
  tickPowerWordBarrier(unit, { frame, units, projectiles, beamEffects, randomRange, emitParticle, addDamageText });
  tickDivineHymn(unit, { frame, units, enemies, projectiles, randomRange, groundEffects, applyHealingReceived, addHealFx, emitParticle });
  tickRapture(unit, { units, projectiles, emitParticle });
  tickSurrenderToMadness(unit, { frame, randomRange, emitParticle, addDamageText });
  if (tickMadnessStun(unit)) return true;
  tickVoidEruption(unit, { frame, enemies, randomRange, groundEffects, dealDamage, emitParticle, addDamageText, shake });
  tickVoidform(unit, { frame, randomRange, emitParticle });
  tickGuardianSpirit(unit, { frame, emitParticle });
  tickShadowWordPain(unit, { frame, enemies, arena, randomRange, dealDamage, emitParticle, addDamageText });
  tickVoidTorrent(unit, { enemies, beamEffects, groundEffects, dealDamage, findEnemyForUnit, emitParticle, addDamageText });
  return false;
}

function tickAngelForm(unit, {
  frame,
  units,
  projectiles,
  randomRange,
  applyHealingReceived,
  addHealFx,
  emitParticle,
  addDamageText,
}) {
  if (!unit._angelForm) return false;

  unit._angelForm.timer--;
  if (unit._angelForm.timer <= 0) {
    unit.untargetable = false;
    unit.hp = 0;
    unit.removed = true;
    addDamageText(unit.x, unit.y - unit.size, 'REST IN PEACE', '#66ffaa');
    return true;
  }
  if (frame % 60 === 0) {
    for (const ally of units) {
      if (!ally.isPlayer || ally.hp <= 0 || ally === unit || ally.isGhost) continue;
      if (dist(unit, ally) > unit._angelForm.radius) continue;
      const heal = applyHealingReceived(ally, Math.round(ally.maxHp * 0.06));
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      addHealFx(ally.x, ally.y, heal);
      projectiles.push({ x: unit.x, y: unit.y, target: ally, tx: ally.x, ty: ally.y, speed: 2.5, projType: 'pomOrb', visualOnly: true, color: '#66ffaa', _arrN: 6, _arrSz: 3, isPlayer: true, dmg: 0 });
    }
  }
  if (frame % 8 === 0) {
    emitParticle(unit.x + randomRange(-unit.size * 0.6, unit.size * 0.6), unit.y + randomRange(-unit.size * 0.5, unit.size * 0.3), '#66ffaa', 2, 3);
    emitParticle(unit.x + randomRange(-unit.size * 0.3, unit.size * 0.3), unit.y - unit.size * 0.6, '#ffffff', 1, 3);
  }
  return false;
}

function tickPrayerOfMending(unit, {
  frame,
  units,
  projectiles,
  emitParticle,
  addDamageText,
}) {
  if (unit.prayerOfMending) {
    unit.prayerOfMending.cd++;
    if (unit.prayerOfMending.cd >= unit.prayerOfMending.every) {
      unit.prayerOfMending.cd = 0;
      let lowest = null;
      let lowestPct = Infinity;
      for (const ally of units) {
        if (ally.isPlayer && ally.hp > 0 && !ally.isGhost && !ally._pom) {
          const pct = ally.hp / ally.maxHp;
          if (pct < lowestPct) {
            lowestPct = pct;
            lowest = ally;
          }
        }
      }
      if (lowest && !lowest._pom) {
        lowest._pom = { bounces: unit.prayerOfMending.maxBounces, healPct: unit.prayerOfMending.healPct, from: unit };
        projectiles.push({ x: unit.x, y: unit.y, target: lowest, tx: lowest.x, ty: lowest.y, speed: 3, projType: 'pomOrb', visualOnly: true, color: '#66ffaa', _arrN: 12, _arrSz: 4, _arrGnd: 30, isPlayer: true, dmg: 0 });
        addDamageText(unit.x, unit.y - unit.size, 'PRAYER', '#66ffaa');
      }
    }
  }
  if (unit._pom && unit._pom.bounces > 0 && unit.hp > 0 && frame % 8 === 0) {
    const angle = frame * 0.08;
    emitParticle(unit.x + Math.cos(angle) * unit.size * 0.6, unit.y + Math.sin(angle) * unit.size * 0.3, '#66ffaa', 1, 2);
  }
}

function tickHolyRenew(unit, {
  frame,
  units,
  projectiles,
  applyHealingReceived,
  addHealFx,
  emitParticle,
  addDamageText,
}) {
  if (unit.holyRenew) {
    unit.holyRenew.cd++;
    if (unit.holyRenew.cd >= unit.holyRenew.every) {
      const candidates = units
        .filter(ally => ally && ally.isPlayer && ally.hp > 0 && !ally.isGhost && ally.hp < ally.maxHp * 0.98)
        .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
      const targets = [];
      for (const ally of candidates) {
        if (!ally._holyRenew) targets.push(ally);
        if (targets.length >= (unit.holyRenew.count || 1)) break;
      }
      for (const ally of candidates) {
        if (targets.length >= (unit.holyRenew.count || 1)) break;
        if (!targets.includes(ally)) targets.push(ally);
      }
      if (targets.length) {
        unit.holyRenew.cd = 0;
        for (const target of targets) {
          target._holyRenew = { timer: unit.holyRenew.dur, healPct: unit.holyRenew.healPct, from: unit, tick: 0 };
          projectiles.push({ x: unit.x, y: unit.y, target, tx: target.x, ty: target.y, speed: 3, projType: 'pomOrb', visualOnly: true, color: '#fff5b0', _arrN: 8, _arrSz: 3, _arrGnd: 28, isPlayer: true, dmg: 0 });
          emitParticle(target.x, target.y - target.size * 0.35, '#fff5b0', 4, 2);
        }
      }
    }
  }
  for (const ally of units) {
    if (!ally || !ally._holyRenew) continue;
    ally._holyRenew.timer--;
    ally._holyRenew.tick = (ally._holyRenew.tick || 0) + 1;
    if (ally._holyRenew.timer <= 0 || ally.hp <= 0 || ally.isGhost) {
      ally._holyRenew = null;
      continue;
    }
    if (ally._holyRenew.tick >= GAME_TICK_HZ) {
      ally._holyRenew.tick = 0;
      const heal = applyHealingReceived(ally, Math.round(ally.maxHp * ally._holyRenew.healPct));
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      addHealFx(ally.x, ally.y, heal, false, ally._holyRenew.from, ally);
      emitParticle(ally.x, ally.y - ally.size * 0.25, '#fff5b0', 5, 2);
    } else if (frame % 12 === 0) {
      emitParticle(ally.x, ally.y - ally.size * 0.35, '#fff5b0', 1, 2);
    }
  }
}

function tickHolyComfortAura(unit, {
  units,
  applyHealingReceived,
  addHealFx,
  emitParticle,
}) {
  if (!unit.holyComfortAura) return;
  unit.holyComfortAura.cd++;
  if (unit.holyComfortAura.cd < unit.holyComfortAura.every) return;
  unit.holyComfortAura.cd = 0;
  let healed = 0;
  for (const ally of units) {
    if (!ally || !ally.isPlayer || ally.hp <= 0 || ally.isGhost || ally.hp >= ally.maxHp) continue;
    const raw = Math.max(1, Math.round(ally.maxHp * unit.holyComfortAura.healPct));
    const heal = Math.min(ally.maxHp - ally.hp, applyHealingReceived(ally, raw));
    if (heal <= 0) continue;
    ally.hp += heal;
    addHealFx(ally.x, ally.y, heal, false, unit, ally, { silent: true });
    healed++;
    if (healed <= 3) emitParticle(ally.x, ally.y - ally.size * 0.2, '#caffd8', 2, 2);
  }
}

function tickPowerWordBarrier(unit, {
  frame,
  units,
  projectiles,
  beamEffects,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (unit.powerWordBarrier) {
    unit.powerWordBarrier.cd++;
    if (unit.powerWordBarrier.cd >= unit.powerWordBarrier.every) {
      unit.powerWordBarrier.cd = 0;
      let lowest = null;
      let lowestPct = Infinity;
      for (const ally of units) {
        if (ally.isPlayer && ally.hp > 0 && ally !== unit && !ally.isGhost) {
          const pct = ally.hp / ally.maxHp;
          if (pct < lowestPct) {
            lowestPct = pct;
            lowest = ally;
          }
        }
      }
      if (lowest) {
        const shield = unit.powerWordBarrier.absorb;
        lowest._pwBarrier = { hp: shield, max: shield, timer: 8 * GAME_TICK_HZ };
        projectiles.push({ x: unit.x, y: unit.y, target: lowest, tx: lowest.x, ty: lowest.y, speed: 3, projType: 'pomOrb', visualOnly: true, color: '#ffaadd', _arrN: 14, _arrSz: 4, _arrGnd: 30, isPlayer: true, dmg: 0 });
        beamEffects.push({ x1: unit.x, y1: unit.y, x2: lowest.x, y2: lowest.y, life: 20, maxLife: 20, color: '#ffaadd', width: 2, straight: true });
        addDamageText(lowest.x, lowest.y - lowest.size, 'BARRIER', '#ffaadd');
      }
    }
  }
  if (!unit._pwBarrier) return;

  unit._pwBarrier.timer--;
  if (unit._pwBarrier.timer <= 0 || unit._pwBarrier.hp <= 0) {
    unit._pwBarrier = null;
  } else if (frame % 12 === 0) {
    emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.3, '#ffaadd', 1, 2);
  }
}

function tickDivineHymn(unit, {
  frame,
  units,
  enemies,
  projectiles,
  randomRange,
  groundEffects,
  applyHealingReceived,
  addHealFx,
  emitParticle,
}) {
  if (!unit._divineHymn) return;

  unit._divineHymn.timer--;
  if (unit._divineHymn.timer <= 0) {
    unit._divineHymn = null;
    return;
  }
  if (frame % 60 === 0) {
    const candidates = [];
    for (const ally of units) {
      if (!ally.isPlayer || ally.hp <= 0 || ally.isGhost) continue;
      if (dist(unit, ally) > unit._divineHymn.radius) continue;
      candidates.push(ally);
    }
    candidates.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
    const targets = candidates.slice(0, 5);
    for (const ally of targets) {
      const heal = applyHealingReceived(ally, Math.round(ally.maxHp * unit._divineHymn.healPct));
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      addHealFx(ally.x, ally.y, heal, true);
      if (unit._divineHymn.renew) ally._holyRenew = { timer: 6 * GAME_TICK_HZ, healPct: 0.025, from: unit, tick: 0 };
      if (ally !== unit) projectiles.push({ x: unit.x, y: unit.y, target: ally, tx: ally.x, ty: ally.y, speed: 3, projType: 'pomOrb', visualOnly: true, color: '#66ffaa', _arrN: 6, _arrSz: 3, isPlayer: true, dmg: 0 });
    }
  }
  for (const enemy of enemies) {
    if (enemy.hp > 0 && dist(unit, enemy) <= unit._divineHymn.radius) {
      enemy.slowMult = Math.min(enemy.slowMult || 1, 1 - unit._divineHymn.slowPct);
      enemy.slowTimer = Math.max(enemy.slowTimer || 0, 30);
    }
  }
  if (frame % 20 === 0) {
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit._divineHymn.radius, life: 0.4, color: '#66ffaa', flatten: true });
    for (let i = 0; i < 4; i++) emitParticle(unit.x + randomRange(-30, 30), unit.y + randomRange(-30, 15), '#ffffff', 1, 3);
  }
}

function tickRapture(unit, {
  units,
  projectiles,
  emitParticle,
}) {
  if (unit._rapture) {
    unit._rapture.timer--;
    unit._rapture.t++;
    if (unit._rapture.timer <= 0) {
      unit._rapture = null;
    } else if (unit._rapture.t >= unit._rapture.refreshEvery) {
      unit._rapture.t = 0;
      const candidates = [];
      for (const ally of units) if (ally.isPlayer && ally.hp > 0 && !ally.isGhost) candidates.push(ally);
      candidates.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
      const targets = candidates.slice(0, 5);
      for (const ally of targets) {
        const shield = Math.round(ally.maxHp * unit._rapture.shieldPct);
        ally._raptureShield = { hp: shield, max: shield };
        emitParticle(ally.x, ally.y, '#ffaadd', 8, 3);
        if (ally !== unit) projectiles.push({ x: unit.x, y: unit.y, target: ally, tx: ally.x, ty: ally.y, speed: 3.5, projType: 'pomOrb', visualOnly: true, color: '#ffaadd', _arrN: 6, _arrSz: 3, isPlayer: true, dmg: 0 });
      }
    }
  }
  if (unit._raptureShield && unit._raptureShield.hp <= 0) unit._raptureShield = null;
}

function tickSurrenderToMadness(unit, {
  frame,
  randomRange,
  emitParticle,
  addDamageText,
}) {
  if (!unit._madness) return;

  unit._madness.timer--;
  if (unit._madness.timer <= 0) {
    unit.dmg = unit._madnessOrigDmg;
    unit._madnessStun = 2 * GAME_TICK_HZ;
    unit._madness = null;
    addDamageText(unit.x, unit.y - unit.size, 'EXHAUSTED', '#aa66ff');
  }
  if (frame % 8 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y + randomRange(-unit.size * 0.3, unit.size * 0.5), '#6622aa', 1, 3);
}

function tickMadnessStun(unit) {
  if (!(unit._madnessStun > 0)) return false;

  unit._madnessStun--;
  return unit._madnessStun > 0;
}

function tickVoidEruption(unit, {
  frame,
  enemies,
  randomRange,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!unit._voidEruption) return;

  unit._voidEruption.timer--;
  if (unit._voidEruption.timer > 0) return;

  const hasTarget = enemies.some(enemy => enemy.hp > 0 && dist(unit, enemy) <= unit._voidEruption.range + 40);
  if (!hasTarget) {
    unit._voidEruption.timer = GAME_TICK_HZ;
    return;
  }

  unit._voidEruption.timer = unit._voidEruption.cd;
  const damage = Math.round(unit.dmg * unit._voidEruption.dmgMult);
  for (const enemy of enemies) {
    if (enemy.hp > 0 && dist(unit, enemy) <= unit._voidEruption.range) {
      dealDamage(enemy, damage, unit, 'magic');
      emitParticle(enemy.x, enemy.y, '#6622aa', 12, 4);
    }
  }
  const duration = unit.hasL5 ? 7 * GAME_TICK_HZ : 5 * GAME_TICK_HZ;
  if (unit._voidform) {
    unit._voidform.timer = Math.max(unit._voidform.timer, duration);
  } else {
    unit._voidform = { timer: duration, splashRadius: 35, atkSpdBoost: true, dotDoubleTick: true };
    if (!unit._vfOrigAtkSpd) {
      unit._vfOrigAtkSpd = unit.atkSpd;
      unit.atkSpd = Math.max(8, Math.round(unit.atkSpd * 0.80));
    }
  }
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit._voidEruption.range, life: 0.5, color: '#3a0a5a' });
  for (let i = 0; i < 20; i++) {
    const angle = Math.PI * 2 * i / 20;
    emitParticle(unit.x + Math.cos(angle) * 50, unit.y + Math.sin(angle) * 50, '#6622aa', 1, 4);
  }
  for (let i = 0; i < 12; i++) emitParticle(unit.x + randomRange(-25, 25), unit.y + randomRange(-25, 25), '#aa66ff', 1, 4);
  addDamageText(unit.x, unit.y - unit.size, 'VOID ERUPTION!', '#aa66ff');
  shake(7);
}

function tickVoidform(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if (!unit._voidform) return;

  unit._voidform.timer--;
  if (unit._voidform.timer <= 0) {
    unit._voidform = null;
    if (unit._vfOrigAtkSpd) {
      unit.atkSpd = unit._vfOrigAtkSpd;
      unit._vfOrigAtkSpd = null;
    }
  } else if (frame % 10 === 0) {
    emitParticle(unit.x + randomRange(-unit.size * 0.4, unit.size * 0.4), unit.y + randomRange(-unit.size * 0.3, unit.size * 0.4), '#aa66ff', 1, 2);
  }
}

function tickGuardianSpirit(unit, {
  frame,
  emitParticle,
}) {
  if (!unit._guardianSpirit) return;

  unit._guardianSpirit.timer--;
  if (unit._guardianSpirit.timer <= 0) {
    unit._guardianSpirit = null;
  } else if (frame % 12 === 0) {
    const angle = frame * 0.1;
    emitParticle(unit.x + Math.cos(angle) * unit.size * 0.5, unit.y - unit.size * 0.7 + Math.sin(angle) * 3, '#ffd700', 1, 2);
  }
}

function tickShadowWordPain(unit, {
  frame,
  enemies,
  arena,
  randomRange,
  dealDamage,
  emitParticle,
  addDamageText,
}) {
  const tickNow = unit.shadowWordPain && frame % GAME_TICK_HZ === 0;
  const doubleTick = unit.shadowWordPain && unit._voidform && unit._voidform.dotDoubleTick && frame % Math.round(GAME_TICK_HZ / 2) === 0 && !tickNow;
  if (!tickNow && !doubleTick) return;

  let apparitionTicks = 0;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || !enemy._swpStacks) continue;
    for (let i = enemy._swpStacks.length - 1; i >= 0; i--) {
      const stack = enemy._swpStacks[i];
      if (stack.from !== unit) continue;
      if (tickNow) {
        stack.timer--;
        if (stack.timer <= 0) {
          enemy._swpStacks.splice(i, 1);
          continue;
        }
      }
      dealDamage(enemy, stack.dmg, unit, 'magic');
      emitParticle(enemy.x + randomRange(-8, 8), enemy.y + randomRange(-8, 8), '#6622aa', 4, 3);
      emitParticle(enemy.x, enemy.y, '#aa66ff', 3, 2);
      addDamageText(enemy.x + randomRange(-8, 8), enemy.y - enemy.size - randomRange(0, 6), '-' + stack.dmg, '#aa66ff');
      apparitionTicks++;
      if (unit.shadowApparitions && apparitionTicks % 3 === 0) {
        const alive = enemies.filter(target => target.hp > 0);
        if (alive.length > 0) {
          const target = alive[Math.floor(Math.random() * alive.length)];
          const damage = Math.round(unit.dmg * unit.shadowApparitions.dmgPct);
          const x = enemy.x + randomRange(-25, 25);
          const y = enemy.y + randomRange(-25, 25);
          if (!arena.shadowApparitions) arena.shadowApparitions = [];
          arena.shadowApparitions.push({ x, y, tx: target.x, ty: target.y, target, dmg: damage, from: unit, speed: 4.5, life: 300 });
          emitParticle(x, y, '#aa66ff', 8, 3);
          addDamageText(x, y - 10, 'GHOST!', '#cc88ff');
        }
      }
    }
  }
}

function tickVoidTorrent(unit, {
  enemies,
  beamEffects,
  groundEffects,
  dealDamage,
  findEnemyForUnit,
  emitParticle,
  addDamageText,
}) {
  if (!unit._voidTorrent) return;

  unit._channeling = true;
  unit._voidTorrent.timer--;
  const torrent = unit._voidTorrent;
  for (let i = torrent.targets.length - 1; i >= 0; i--) {
    if (torrent.targets[i].hp <= 0) {
      torrent.targets.splice(i, 1);
      const nextTarget = findEnemyForUnit(unit);
      if (nextTarget && !torrent.targets.includes(nextTarget)) torrent.targets.push(nextTarget);
    }
  }
  if (torrent.targets.length === 0) {
    unit._voidTorrent = null;
    unit._channeling = false;
  }
  if (!unit._voidTorrent) return;

  torrent.pulseCD--;
  if (torrent.pulseCD <= 0 && torrent.targets.length > 0) {
    torrent.pulseCD = torrent.pulseEvery;
    for (const target of torrent.targets) {
      dealDamage(target, torrent.dmgPerPulse, unit, 'magic');
      addDamageText(target.x, target.y - target.size, '-' + torrent.dmgPerPulse, '#aa66ff');
      beamEffects.push({ x1: unit.x, y1: unit.y, x2: target.x, y2: target.y, life: torrent.pulseEvery, maxLife: torrent.pulseEvery, color: '#aa66ff', width: 3, straight: true });
      for (const enemy of enemies) {
        if (enemy.hp <= 0 || torrent.targets.includes(enemy)) continue;
        if (dist(target, enemy) <= torrent.splashRadius) {
          dealDamage(enemy, torrent.splashDmg, unit, 'magic');
          emitParticle(enemy.x, enemy.y, '#6622aa', 6, 3);
          addDamageText(enemy.x, enemy.y - enemy.size, '-' + torrent.splashDmg, '#9944cc');
        }
      }
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: torrent.splashRadius, life: 0.3, color: '#6622aa' });
      for (let i = 0; i < 8; i++) {
        const angle = Math.PI * 2 * i / 8;
        emitParticle(target.x + Math.cos(angle) * 30, target.y + Math.sin(angle) * 30, '#aa66ff', 1, 3);
      }
      emitParticle(target.x, target.y, '#3a0a5a', 10, 4);
    }
  }
  if (torrent.timer <= 0) {
    unit._voidTorrent = null;
    unit._channeling = false;
  }
}
