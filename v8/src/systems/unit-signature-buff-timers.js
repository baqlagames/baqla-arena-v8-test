import { dist } from '../core/math.js';

export function tickUnitSignatureBuffTimers(unit, {
  frame,
  units,
  enemies,
  arena,
  groundEffects,
  randomRange,
  dealDamage,
  drainHealToBarrier,
  addHealFx,
  emitParticle,
  addDamageText,
  showFlash,
  shake,
}) {
  tickTwinSync(unit);
  tickPersonalWhirlwind(unit, { frame, enemies, groundEffects, dealDamage, emitParticle, addDamageText, shake });
  tickBattleStandard(unit, { frame, arena, groundEffects, emitParticle, addDamageText });
  tickResurrection(unit, { units, arena, randomRange, groundEffects, addHealFx, emitParticle, addDamageText, showFlash, shake });
  tickCombatVisualTimers(unit);
  tickVanishingAct(unit);
  tickAegisWall(unit, { frame, randomRange, emitParticle });
  tickHeartOfEarth(unit, { frame, units, groundEffects, addHealFx });
  tickMageWard(unit, { frame, groundEffects });
  tickTreeOfLife(unit, { frame, units, groundEffects, drainHealToBarrier, emitParticle });
  tickRenewalField(unit, { frame, units, groundEffects, emitParticle });
  tickSmokeBomb(unit, { frame, units, groundEffects, emitParticle });
  tickBladeStorm(unit, { frame, enemies, dealDamage });
  tickFrenzyForceActive(unit);
  tickTemporaryDamageBuffs(unit);
  tickInvulnerabilityTimers(unit, { frame, randomRange, emitParticle });
}

function tickTwinSync(unit) {
  if (!(unit.twinSyncTimer > 0)) return;

  unit.twinSyncTimer--;
  if (unit.twinSyncTimer <= 0 && unit._origAtkSpdTS) {
    unit.atkSpd = unit._origAtkSpdTS;
    unit._origAtkSpdTS = null;
  }
}

function tickPersonalWhirlwind(unit, {
  frame,
  enemies,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!unit.personalWhirlwind) return;

  unit.personalWhirlwind.cd++;
  if (unit.personalWhirlwind.cd < unit.personalWhirlwind.every) return;

  unit.personalWhirlwind.cd = 0;
  let hit = 0;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    if (dist(unit, enemy) <= unit.personalWhirlwind.radius) {
      dealDamage(enemy, Math.round(unit.dmg * unit.personalWhirlwind.mult), unit, 'normal');
      hit++;
    }
  }
  if (hit <= 0) return;

  addDamageText(unit.x, unit.y - unit.size - 4, 'WHIRLWIND!', '#88ddff');
  unit.whirlwindFx = 28;
  unit.whirlwindFxR = unit.personalWhirlwind.radius;
  unit.whirlwindFxColor = '#88ddff';
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.personalWhirlwind.radius, life: 0.5, color: '#88ddff' });
  for (let i = 0; i < 18; i++) {
    const angle = Math.PI * 2 * i / 18 + frame * 0.3;
    emitParticle(unit.x + Math.cos(angle) * unit.personalWhirlwind.radius * 0.75, unit.y + Math.sin(angle) * unit.personalWhirlwind.radius * 0.75, '#ffffff', 1, 3);
    emitParticle(unit.x + Math.cos(angle) * unit.personalWhirlwind.radius * 0.55, unit.y + Math.sin(angle) * unit.personalWhirlwind.radius * 0.55, '#88ddff', 1, 2);
  }
  shake(6);
}

function tickBattleStandard(unit, {
  frame,
  arena,
  groundEffects,
  emitParticle,
  addDamageText,
}) {
  if (unit.battleStandard && !unit.battleStandard.placed && arena.phase === 'wave') {
    unit.battleStandard.placed = true;
    unit.battleStandard.x = unit.homeX || unit.x;
    unit.battleStandard.y = unit.homeY || unit.y;
    addDamageText(unit.battleStandard.x, unit.battleStandard.y, 'STANDARD', '#ffe066');
    groundEffects.push({ x: unit.battleStandard.x, y: unit.battleStandard.y, r: 0, maxR: unit.battleStandard.radius, life: 0.6, color: '#ffe066' });
  }
  if (!unit.battleStandard || !unit.battleStandard.placed) return;

  if (frame % 30 === 0) {
    groundEffects.push({ x: unit.battleStandard.x, y: unit.battleStandard.y, r: 0, maxR: unit.battleStandard.radius, life: 0.6, color: '#ffe066' });
  }
  if (frame % 10 === 0) {
    const angle = Math.random() * Math.PI * 2;
    emitParticle(unit.battleStandard.x + Math.cos(angle) * unit.battleStandard.radius * 0.6, unit.battleStandard.y + Math.sin(angle) * unit.battleStandard.radius * 0.6, '#ffe066', 1, 3);
  }
}

function tickResurrection(unit, {
  units,
  arena,
  randomRange,
  groundEffects,
  addHealFx,
  emitParticle,
  addDamageText,
  showFlash,
  shake,
}) {
  if (!unit.resurrection || unit.resurrection.used) return;

  unit.resurrection.t++;
  if (unit.resurrection.t < unit.resurrection.scanEvery) return;

  unit.resurrection.t = 0;
  let dead = null;
  for (const ally of units) {
    if (ally === unit || ally.isMinion || ally.isGhost || ally.isMirror) continue;
    if (ally.isPlayer && ally.hp <= 0 && !ally.removed) {
      dead = ally;
      break;
    }
  }
  if (!dead) {
    for (const key in arena.cells) {
      const cell = arena.cells[key];
      if (!cell || !cell.unitRef || cell.unitRef === unit) continue;
      if (cell.unitRef.hp <= 0) {
        dead = cell.unitRef;
        break;
      }
    }
  }
  if (!dead) return;

  dead.hp = Math.round(dead.maxHp * unit.resurrection.pct);
  dead.removed = false;
  if (units.indexOf(dead) === -1) units.push(dead);
  unit.resurrection.used = true;
  addHealFx(dead.x, dead.y, dead.hp);
  for (let i = 1; i <= 12; i++) {
    const fraction = i / 12;
    emitParticle(unit.x + (dead.x - unit.x) * fraction, unit.y + (dead.y - unit.y) * fraction, '#ffd700', 2, 5);
    emitParticle(unit.x + (dead.x - unit.x) * fraction + randomRange(-5, 5), unit.y + (dead.y - unit.y) * fraction + randomRange(-5, 5), '#ffffff', 1, 3);
  }
  for (let i = 0; i < 40; i++) {
    const angle = Math.PI * 2 * i / 40;
    emitParticle(dead.x + Math.cos(angle) * 30, dead.y + Math.sin(angle) * 30, '#ffd700', 1, 5);
  }
  for (let i = 0; i < 20; i++) emitParticle(dead.x + randomRange(-15, 15), dead.y + randomRange(-20, 5), '#ffffff', 1, 4);
  groundEffects.push({ x: dead.x, y: dead.y, r: 0, maxR: 80, life: 0.7, color: '#ffd700' });
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 50, life: 0.5, color: '#ffe8a0' });
  addDamageText(dead.x, dead.y - dead.size, 'RESURRECT!', '#ffd700');
  showFlash('RESURRECTION', '#ffd700', 60);
  shake(8);
}

function tickCombatVisualTimers(unit) {
  if (unit.whirlwindFx > 0) unit.whirlwindFx--;
  if (unit.cleaveFx > 0) {
    unit.cleaveFx--;
    if (unit.cleaveFx <= 0) {
      unit.cleaveFxColor = null;
      unit.cleaveFxBig = false;
    }
  }
}

function tickVanishingAct(unit) {
  if (!(unit.vanishActiveTimer > 0)) return;

  unit.vanishActiveTimer--;
  if (unit.vanishActiveTimer <= 0) {
    unit.vanishActive = false;
    unit.untargetable = false;
  }
}

function tickAegisWall(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if (!(unit.aegisShieldTimer > 0)) return;

  unit.aegisShieldTimer--;
  if (unit.aegisShieldTimer <= 0) unit.aegisReflect = false;
  if (frame % 6 === 0) emitParticle(unit.x + randomRange(-unit.size, unit.size), unit.y + randomRange(-unit.size, unit.size), '#ffd700', 1, 2);
}

function tickHeartOfEarth(unit, {
  frame,
  units,
  groundEffects,
  addHealFx,
}) {
  if (!(unit.heartOfEarthTimer > 0)) return;

  unit.heartOfEarthTimer--;
  if (frame % 30 !== 0) return;

  for (const ally of units) {
    if (!ally.isPlayer || ally.hp <= 0 || ally.isGhost) continue;
    if (dist(unit, ally) > 200) continue;
    const heal = Math.round(ally.maxHp * 0.08);
    ally.hp = Math.min(ally.maxHp, ally.hp + heal);
    addHealFx(ally.x, ally.y, heal);
  }
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 200, life: 0.4, color: '#a06030' });
}

function tickMageWard(unit, {
  frame,
  groundEffects,
}) {
  if (!unit.mageWardZone) return;

  unit.mageWardZone.t--;
  if (unit.mageWardZone.t <= 0) {
    unit.mageWardZone = null;
  } else if (frame % 30 === 0) {
    groundEffects.push({ x: unit.mageWardZone.x, y: unit.mageWardZone.y, r: 0, maxR: unit.mageWardZone.r, life: 0.6, color: '#5a8aff' });
  }
}

function tickTreeOfLife(unit, {
  frame,
  units,
  groundEffects,
  drainHealToBarrier,
  emitParticle,
}) {
  if (!unit.treeOfLifeZone) return;

  unit.treeOfLifeZone.t--;
  if (unit.treeOfLifeZone.t <= 0) {
    unit.treeOfLifeZone = null;
  }
  if (unit.treeOfLifeZone && frame % 30 === 0) {
    drainHealToBarrier(unit.treeOfLifeZone.heal, unit);
  } else if (frame % 30 === 0) {
    for (const ally of units) {
      if (!ally.isPlayer || ally.hp <= 0 || ally.isGhost) continue;
      if (dist({ x: unit.treeOfLifeZone.x, y: unit.treeOfLifeZone.y }, ally) > unit.treeOfLifeZone.r) continue;
      ally.hp = Math.min(ally.maxHp, ally.hp + unit.treeOfLifeZone.heal);
      if (frame % 2 === 0) emitParticle(ally.x, ally.y - ally.size * 0.5, '#3aff66', 1, 2);
    }
    groundEffects.push({ x: unit.treeOfLifeZone.x, y: unit.treeOfLifeZone.y, r: 0, maxR: unit.treeOfLifeZone.r, life: 0.6, color: '#3aa84e' });
  }
}

function tickRenewalField(unit, {
  frame,
  units,
  groundEffects,
  emitParticle,
}) {
  if (!unit.renewalFieldZone) return;

  unit.renewalFieldZone.t--;
  if (unit.renewalFieldZone.t <= 0) {
    unit.renewalFieldZone = null;
    return;
  }
  if (frame % 30 !== 0) return;

  for (const ally of units) {
    if (!ally.isPlayer || ally.hp <= 0 || ally.isGhost) continue;
    if (dist({ x: unit.renewalFieldZone.x, y: unit.renewalFieldZone.y }, ally) > unit.renewalFieldZone.r) continue;
    ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(ally.maxHp * 0.05));
    ally.poisonTimer = 0;
    ally.bleedTimer = 0;
    ally.burnTimer = 0;
    ally.slowTimer = 0;
    ally.slowMult = 1;
    emitParticle(ally.x, ally.y - ally.size * 0.5, '#88ffaa', 1, 2);
  }
  groundEffects.push({ x: unit.renewalFieldZone.x, y: unit.renewalFieldZone.y, r: 0, maxR: unit.renewalFieldZone.r, life: 0.5, color: '#88ffaa' });
}

function tickSmokeBomb(unit, {
  frame,
  units,
  groundEffects,
  emitParticle,
}) {
  if (unit.smokeBombZone) {
    unit.smokeBombZone.t--;
    if (unit.smokeBombZone.t <= 0) {
      unit.smokeBombZone = null;
    } else {
      for (const ally of units) {
        if (!ally.isPlayer || ally.hp <= 0 || ally === unit) continue;
        if (dist({ x: unit.smokeBombZone.x, y: unit.smokeBombZone.y }, ally) <= unit.smokeBombZone.r) {
          ally.smokeBombShield = true;
          ally.smokeBombShieldT = 4;
        }
      }
      if (frame % 6 === 0) {
        const angle = Math.random() * Math.PI * 2;
        emitParticle(unit.smokeBombZone.x + Math.cos(angle) * unit.smokeBombZone.r * 0.6, unit.smokeBombZone.y + Math.sin(angle) * unit.smokeBombZone.r * 0.6, '#888', 1, 5);
      }
      if (frame % 30 === 0) groundEffects.push({ x: unit.smokeBombZone.x, y: unit.smokeBombZone.y, r: 0, maxR: unit.smokeBombZone.r, life: 0.5, color: '#888' });
    }
  }

  if (!(unit.smokeBombShieldT > 0)) return;

  unit.smokeBombShieldT--;
  if (unit.smokeBombShieldT <= 0) {
    unit.smokeBombShield = false;
    unit.untargetable = unit.untargetable && unit.vanishActive;
  } else {
    unit.untargetable = true;
  }
}

function tickBladeStorm(unit, {
  frame,
  enemies,
  dealDamage,
}) {
  if (!(unit.bladeStormTimer > 0)) return;

  unit.bladeStormTimer--;
  if (frame % 6 !== 0) return;

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    if (dist(unit, enemy) <= 90) dealDamage(enemy, Math.round(unit.dmg * 0.4), unit, 'normal');
  }
}

function tickFrenzyForceActive(unit) {
  if (!(unit.frenzyForceActiveTimer > 0)) return;

  unit.frenzyForceActiveTimer--;
  if (unit.frenzy && !unit.frenzy.active) {
    unit.frenzy.active = true;
    unit._origAtkSpd = unit._origAtkSpd || unit.atkSpd;
    unit._origDmg = unit._origDmg || unit.dmg;
    unit.atkSpd = Math.max(8, Math.round(unit.atkSpd * 0.77));
    unit.dmg = Math.round(unit.dmg * 1.30);
    unit.frenzyActive = true;
  }
  if (unit.frenzyForceActiveTimer <= 0 && unit.frenzy && unit.frenzy.active) {
    unit.frenzy.active = false;
    if (unit._origAtkSpd) unit.atkSpd = unit._origAtkSpd;
    if (unit._origDmg) unit.dmg = unit._origDmg;
    unit.frenzyActive = false;
  }
}

function tickTemporaryDamageBuffs(unit) {
  if (unit.cleaveBoostTimer > 0) {
    unit.cleaveBoostTimer--;
    if (unit.cleaveBoostTimer <= 0 && unit.cleave && unit._origCleaveMult) {
      unit.cleave.mult = unit._origCleaveMult;
      unit._origCleaveMult = null;
    }
  }
  if (unit.championBoostTimer > 0) {
    unit.championBoostTimer--;
    if (unit.championBoostTimer <= 0 && unit.champion && unit._origChampionMult) {
      unit.champion.mult = unit._origChampionMult;
      unit._origChampionMult = null;
    }
  }
  if (unit.championWrathTimer > 0) {
    unit.championWrathTimer--;
    if (unit.championWrathTimer <= 0 && unit._origDmgCW) {
      unit.dmg = unit._origDmgCW;
      unit._origDmgCW = null;
    }
  }
}

function tickInvulnerabilityTimers(unit, {
  frame,
  randomRange,
  emitParticle,
}) {
  if (unit.divineShieldTimer > 0) unit.divineShieldTimer--;
  if (unit.invulnerableTimer > 0) unit.invulnerableTimer--;
  if (!(unit._gapInvulnerableTimer > 0)) return;

  unit._gapInvulnerableTimer--;
  if (frame % 8 === 0) {
    const color = unit._gapInvulnerableColor || '#ffffff';
    emitParticle(unit.x + randomRange(-unit.size * 0.45, unit.size * 0.45), unit.y - unit.size * 0.15, color, 1, 2);
  }
  if (unit._gapInvulnerableTimer <= 0) {
    unit._gapInvulnerableTimer = 0;
    unit._gapInvulnerableLabel = null;
    unit._gapInvulnerableColor = null;
  }
}
