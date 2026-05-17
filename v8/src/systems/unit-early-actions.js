import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';
import { PLAYER_UNITS, VODKA } from '../data/units.js';

export function tickUnitEarlyActions(unit, {
  frame,
  enemies,
  units,
  abilities,
  arenaTop,
  randomRange,
  beamFx,
  groundEffects,
  dealDamage,
  clampToLeash,
  addZavsLineShield,
  emitParticle,
  addDamageText,
  showFlash,
  sound,
  shake,
}) {
  tickUnitAbilityAutocasts(unit, { enemies, abilities });
  tickPolymorph(unit, { enemies, emitParticle, showFlash, sound });
  tickMountTimer(unit, { frame, randomRange, beamFx, groundEffects, emitParticle });
  tickAvengingWrath(unit, { frame, randomRange, emitParticle, addDamageText });
  tickBerserkTimer(unit, { frame, randomRange, emitParticle, addDamageText });
  if (tickBannerfallCrash(unit, { frame, enemies, arenaTop, randomRange, groundEffects, dealDamage, clampToLeash, addZavsLineShield, emitParticle, addDamageText, sound, shake })) return true;
  if (tickMeteorSlam(unit, { frame, enemies, arenaTop, randomRange, groundEffects, dealDamage, clampToLeash, emitParticle, shake })) return true;
  tickLastStandSignature(unit, { frame, randomRange, emitParticle });
  tickAvatar(unit, { frame, randomRange, groundEffects, emitParticle, addDamageText });
  tickWarCryUtility(unit, { frame, enemies, units, groundEffects, emitParticle, addDamageText, showFlash });
  tickSpellReflect(unit);
  return false;
}

function tickUnitAbilityAutocasts(unit, { enemies, abilities }) {
  if (unit.unitIdx === undefined) return;
  const data = PLAYER_UNITS[unit.unitIdx] || VODKA;
  if (!data) return;

  const ability3 = unit._branchA3 || data.a3;
  const ability5 = unit._branchA5 || data.a5;
  if (unit.hasL3 && ability3 && abilities[ability3]) {
    if (unit.abilCD[ability3] === undefined) unit.abilCD[ability3] = 3 * GAME_TICK_HZ;
    if (shouldCastAbility(unit, ability3, enemies, unit.hasL3)) abilities[ability3](unit);
  }
  if (unit.hasL5 && ability5 && abilities[ability5]) {
    if (unit.abilCD[ability5] === undefined) unit.abilCD[ability5] = 3 * GAME_TICK_HZ;
    if (shouldCastAbility(unit, ability5, enemies, unit.hasL5)) abilities[ability5](unit);
  }
}

function shouldCastAbility(unit, abilityId, enemies, hasAbility) {
  return hasAbility && unit.abilCD[abilityId] <= 0 && enemies.some(enemy => enemy.hp > 0 && dist(unit, enemy) < 300);
}

function tickPolymorph(unit, { enemies, emitParticle, showFlash, sound }) {
  if (!unit.polymorphCD || (unit.polymorphCDt || 0) > 0) return;

  let target = null;
  let bestDistance = Infinity;
  const range = unit.range * 1.6;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || enemy.isBoss || enemy.isElite) continue;
    if (enemy.polymorphTimer > 0) continue;
    const distance = dist(unit, enemy);
    if (distance < range && distance < bestDistance) {
      bestDistance = distance;
      target = enemy;
    }
  }
  if (!target) return;

  target.polymorphTimer = unit.polymorphDur;
  target._critterType = Math.floor(Math.random() * 3);
  unit.polymorphCDt = unit.polymorphCD;
  const critterNames = ['SHEEP', 'TURTLE', 'PIG'];
  emitParticle(target.x, target.y, '#fff0bb', 24, 4);
  emitParticle(unit.x, unit.y, '#ff66aa', 12, 3);
  showFlash('POLYMORPH - ' + critterNames[target._critterType] + '!', '#ff88cc', 45);
  sound.debuff();
}

function tickMountTimer(unit, { frame, randomRange, beamFx, groundEffects, emitParticle }) {
  if ((unit.mountTimer || 0) <= 0) return;

  unit.mountTimer--;
  if (frame % 2 === 0) {
    emitParticle(unit.x + randomRange(-4, 4), unit.y + unit.size * 0.4, '#886622', 1, 2);
    const wingAngle = frame * 0.15;
    emitParticle(unit.x - unit.size * 0.6 + Math.cos(wingAngle) * 3, unit.y - unit.size * 0.3 + Math.sin(wingAngle) * 2, '#ffd700', 1, 3);
    emitParticle(unit.x + unit.size * 0.6 - Math.cos(wingAngle) * 3, unit.y - unit.size * 0.3 - Math.sin(wingAngle) * 2, '#ffd700', 1, 3);
  }
  if (frame % 3 === 0) {
    emitParticle(unit.x + randomRange(-3, 3), unit.y + unit.size * 0.3, '#ffe066', 1, 3);
    emitParticle(unit.x + (unit.facing || 1) * -8, unit.y, '#ffffff88', 1, 2);
  }
  if (frame % 6 === 0) {
    beamFx.push({ x1: unit.x - unit.size * 0.5, y1: unit.y - unit.size * 0.4, x2: unit.x - unit.size * 1.2, y2: unit.y - unit.size * 0.8, color: '#ffd70066', width: 2, life: 0.1, maxLife: 0.1, straight: true });
    beamFx.push({ x1: unit.x + unit.size * 0.5, y1: unit.y - unit.size * 0.4, x2: unit.x + unit.size * 1.2, y2: unit.y - unit.size * 0.8, color: '#ffd70066', width: 2, life: 0.1, maxLife: 0.1, straight: true });
  }
  if (frame % 10 === 0) groundEffects.push({ x: unit.x, y: unit.y + unit.size * 0.4, r: 0, maxR: unit.size * 1.1, life: 0.2, color: '#ffd70044' });
  if (unit.mountTimer <= 0) unit.mountDR = 0;
}

function tickAvengingWrath(unit, { frame, randomRange, emitParticle, addDamageText }) {
  if ((unit.avengingWrathTimer || 0) <= 0) return;

  unit.avengingWrathTimer--;
  if (frame % 4 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.6, '#ffd700', 1, 3);
  if (unit.avengingWrathTimer > 0) return;

  if (unit._awOrigDmg != null) unit.dmg = unit._awOrigDmg;
  if (unit.crit && unit._awOrigCritChance != null) unit.crit.chance = unit._awOrigCritChance;
  else if (unit._awOrigCritChance === null) unit.crit = null;
  if (unit._awOrigLifesteal != null) unit.lifesteal = unit._awOrigLifesteal;
  unit._awOrigDmg = null;
  unit._awOrigCritChance = null;
  unit._awOrigLifesteal = null;
  addDamageText(unit.x, unit.y - unit.size, 'WRATH ENDS', '#aaa');
}

function tickBerserkTimer(unit, { frame, randomRange, emitParticle, addDamageText }) {
  if ((unit.berserkTimer || 0) <= 0) return;

  unit.berserkTimer--;
  if (frame % 5 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.5, '#ff8866', 1, 3);
  if (unit.berserkTimer > 0) return;

  if (unit._origAtkSpdBerserk != null) {
    unit.atkSpd = unit._origAtkSpdBerserk;
    unit._origAtkSpdBerserk = null;
  }
  if (unit._origDmgBerserk != null) {
    unit.dmg = unit._origDmgBerserk;
    unit._origDmgBerserk = null;
  }
  addDamageText(unit.x, unit.y - unit.size, 'BERSERK ENDS', '#aaa');
}

function tickBannerfallCrash(unit, { frame, enemies, arenaTop, randomRange, groundEffects, dealDamage, clampToLeash, addZavsLineShield, emitParticle, addDamageText, sound, shake }) {
  if (!unit.bannerfallCrashActive) return false;

  unit.bannerfallCrashT++;
  if (unit.bannerfallCrashPhase === 'ascend') {
    unit.y -= 3;
    if (frame % 2 === 0) emitParticle(unit.x + randomRange(-8, 8), unit.y + unit.size, '#ffe066', 2, 3);
    if (unit.bannerfallCrashT >= 50) {
      unit.bannerfallCrashPhase = 'hang';
      unit.bannerfallCrashT = 0;
      unit.x = unit.bannerfallTargetX;
      unit.y = arenaTop - 40;
    }
  } else if (unit.bannerfallCrashPhase === 'hang') {
    if (unit.bannerfallCrashT >= 24) {
      unit.bannerfallCrashPhase = 'descend';
      unit.bannerfallCrashT = 0;
    }
  } else if (unit.bannerfallCrashPhase === 'descend') {
    const progress = Math.min(1, unit.bannerfallCrashT / 28);
    unit.y = arenaTop - 40 + progress * (unit.bannerfallTargetY - (arenaTop - 40));
    if (frame % 1 === 0) emitParticle(unit.x + randomRange(-7, 7), unit.y + unit.size, '#ffd54a', 3, 3);
    if (progress >= 1) {
      unit.bannerfallCrashActive = false;
      unit.untargetable = false;
      unit.y = unit.bannerfallTargetY;
      clampToLeash(unit);
      for (const enemy of enemies) {
        if (enemy.hp > 0 && dist(unit, enemy) <= 130) {
          dealDamage(enemy, Math.round(unit.dmg * 2.0), unit, 'normal');
          if (!enemy.isBoss) enemy.stunned = Math.max(enemy.stunned || 0, Math.round(0.75 * GAME_TICK_HZ));
        }
      }
      unit._bannerfallZone = { x: unit.x, y: unit.y, r: 160, t: 5 * GAME_TICK_HZ };
      unit.bannerfallTimer = 5 * GAME_TICK_HZ;
      unit.bannerfallGuardTimer = 4 * GAME_TICK_HZ;
      addZavsLineShield(unit, Math.round(unit.maxHp * 0.16), 4 * GAME_TICK_HZ);
      for (let i = 0; i < 42; i++) {
        const angle = Math.PI * 2 * i / 42;
        emitParticle(unit.x + Math.cos(angle) * 62, unit.y + Math.sin(angle) * 62, '#ffe066', 2, 4);
      }
      emitParticle(unit.x, unit.y, '#ffe066', 40, 6);
      emitParticle(unit.x, unit.y, '#ffffff', 18, 4);
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 160, life: 0.9, color: '#ffe066' });
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 90, life: 0.55, color: '#b88a32' });
      addDamageText(unit.x, unit.y - unit.size - 8, 'STANDARD RAISED!', '#ffe066', { sz: 15, bold: true });
      shake(14);
      sound.shieldBlock();
    }
  }
  return true;
}

function tickMeteorSlam(unit, { frame, enemies, arenaTop, randomRange, groundEffects, dealDamage, clampToLeash, emitParticle, shake }) {
  if (!unit.meteorSlamActive) return false;

  unit.meteorSlamT++;
  if (unit.meteorSlamPhase === 'ascend') {
    unit.y -= 3;
    if (frame % 2 === 0) emitParticle(unit.x + randomRange(-8, 8), unit.y + unit.size, '#ffaa44', 2, 3);
    if (unit.meteorSlamT >= 60) {
      unit.meteorSlamPhase = 'hang';
      unit.meteorSlamT = 0;
      unit.x = unit.meteorSlamTargetX;
      unit.y = arenaTop - 40;
    }
  } else if (unit.meteorSlamPhase === 'hang') {
    if (unit.meteorSlamT >= 30) {
      unit.meteorSlamPhase = 'descend';
      unit.meteorSlamT = 0;
    }
  } else if (unit.meteorSlamPhase === 'descend') {
    const progress = Math.min(1, unit.meteorSlamT / 30);
    unit.y = arenaTop - 40 + progress * (unit.meteorSlamTargetY - (arenaTop - 40));
    if (frame % 1 === 0) emitParticle(unit.x + randomRange(-6, 6), unit.y + unit.size, '#ff6600', 3, 3);
    if (progress >= 1) {
      unit.meteorSlamActive = false;
      unit.untargetable = false;
      unit.y = unit.meteorSlamTargetY;
      clampToLeash(unit);
      for (const enemy of enemies) {
        if (enemy.hp > 0 && dist(unit, enemy) <= 130) {
          dealDamage(enemy, Math.round(unit.dmg * 4), unit, 'normal');
          if (!enemy.isBoss) enemy.stunned = Math.max(enemy.stunned || 0, 120);
        }
      }
      for (let i = 0; i < 50; i++) {
        const angle = Math.PI * 2 * i / 50;
        emitParticle(unit.x + Math.cos(angle) * 60, unit.y + Math.sin(angle) * 60, '#ff6600', 2, 4);
      }
      emitParticle(unit.x, unit.y, '#ffaa44', 40, 6);
      emitParticle(unit.x, unit.y, '#ffffff', 20, 4);
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 130, life: 0.8, color: '#ff6600' });
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 80, life: 0.5, color: '#ffaa44' });
      shake(16);
    }
  }
  return true;
}

function tickLastStandSignature(unit, { frame, randomRange, emitParticle }) {
  if ((unit.lastStandSigTimer || 0) <= 0) return;
  unit.lastStandSigTimer--;
  if (frame % 3 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.5, '#ff4444', 1, 3);
}

function tickAvatar(unit, { frame, randomRange, groundEffects, emitParticle, addDamageText }) {
  if ((unit.avatarTimer || 0) <= 0) return;

  unit.avatarTimer--;
  if (frame % 3 === 0) {
    emitParticle(unit.x + randomRange(-unit.size * 0.6, unit.size * 0.6), unit.y + randomRange(-unit.size * 0.5, unit.size * 0.5), '#44ff44', 1, 3);
    emitParticle(unit.x + randomRange(-unit.size * 0.4, unit.size * 0.4), unit.y - unit.size * 0.6, '#ffffff', 1, 2);
  }
  if (frame % 10 === 0) groundEffects.push({ x: unit.x, y: unit.y + unit.size * 0.3, r: 0, maxR: unit.size * 0.8, life: 0.2, color: '#44ff44' });
  if (unit.avatarTimer > 0) return;

  unit.size = unit.avatarOrigSize;
  unit.dmg = unit.avatarOrigDmg;
  const hpPct = unit.hp / unit.maxHp;
  unit.maxHp = unit.avatarOrigMaxHp;
  unit.hp = Math.max(1, Math.round(hpPct * unit.maxHp));
  unit.ccImmune = false;
  addDamageText(unit.x, unit.y - unit.size, 'AVATAR ENDS', '#aaa');
}

function tickWarCryUtility(unit, { frame, enemies, units, emitParticle, addDamageText, showFlash }) {
  if (unit.demoShoutCD > 0) unit.demoShoutCD--;
  if (unit.demoShoutActive > 0) {
    unit.demoShoutActive--;
    if (frame % 20 === 0) {
      for (const enemy of enemies) {
        if (enemy.hp > 0 && dist(unit, enemy) < 150) {
          enemy.demoralizedTimer = 30;
          enemy.demoralizedMult = 0.80;
        }
      }
    }
  }
  if (unit.demoShoutCD <= 0 && unit.hasDemoShout && enemies.some(enemy => enemy.hp > 0 && dist(unit, enemy) < 150)) {
    unit.demoShoutCD = 10 * GAME_TICK_HZ;
    unit.demoShoutActive = 5 * GAME_TICK_HZ;
    emitParticle(unit.x, unit.y, '#ff6644', 16, 4);
    addDamageText(unit.x, unit.y - unit.size, 'WAR CRY!', '#ff6644');
    for (const enemy of enemies) {
      if (enemy.hp > 0 && dist(unit, enemy) < 150) {
        enemy.demoralizedTimer = 5 * GAME_TICK_HZ;
        enemy.demoralizedMult = 0.80;
      }
    }
  }

  if (unit.rallyCryCD > 0) unit.rallyCryCD--;
  if (unit.rallyCryActive > 0) {
    unit.rallyCryActive--;
    if (frame % 30 === 0) {
      for (const ally of units) {
        if (ally.isPlayer && ally.hp > 0 && ally !== unit && dist(unit, ally) < 150) {
          if (!ally.rallied) {
            ally.rallied = true;
            ally._rallyOrigDmg = ally.dmg;
            ally._rallyOrigAtkSpd = ally.atkSpd;
          }
          ally.dmg = Math.round(ally._rallyOrigDmg * 1.20);
          ally.atkSpd = Math.round(ally._rallyOrigAtkSpd * 0.85);
          ally.ralliedTimer = 35;
        }
      }
    }
    if (unit.rallyCryActive <= 0) {
      for (const ally of units) {
        if (!ally.rallied) continue;
        ally.dmg = ally._rallyOrigDmg || ally.dmg;
        ally.atkSpd = ally._rallyOrigAtkSpd || ally.atkSpd;
        ally.rallied = false;
        ally._rallyOrigDmg = null;
        ally._rallyOrigAtkSpd = null;
      }
    }
  }
  if (unit.rallyCryCD <= 0 && unit.hasRallyCry && enemies.some(enemy => enemy.hp > 0 && dist(unit, enemy) < 200) && units.some(ally => ally !== unit && ally.isPlayer && ally.hp > 0 && dist(unit, ally) < 150)) {
    unit.rallyCryCD = 40 * GAME_TICK_HZ;
    unit.rallyCryActive = 5 * GAME_TICK_HZ;
    emitParticle(unit.x, unit.y, '#ffd700', 20, 5);
    addDamageText(unit.x, unit.y - unit.size, 'RALLY CRY!', '#ffd700');
    showFlash('RALLY CRY!', '#ffd700', 40);
    for (const ally of units) {
      if (ally.isPlayer && ally.hp > 0 && ally !== unit && dist(unit, ally) < 150) {
        if (!ally.rallied) {
          ally.rallied = true;
          ally._rallyOrigDmg = ally.dmg;
          ally._rallyOrigAtkSpd = ally.atkSpd;
        }
        ally.dmg = Math.round(ally._rallyOrigDmg * 1.20);
        ally.atkSpd = Math.round(ally._rallyOrigAtkSpd * 0.85);
        ally.ralliedTimer = 5 * GAME_TICK_HZ;
      }
    }
  }
}

function tickSpellReflect(unit) {
  if (unit.spellReflectCD > 0) unit.spellReflectCD--;
  if (unit.spellReflectCD <= 0 && unit.hasSpellReflect) unit.spellReflectReady = true;
}
