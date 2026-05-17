import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function applyCoreFamilyOnHitProcs(unit, target, {
  ohTier,
  damage,
  units,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  applyRuneWound,
  isTaoonPriorityEnemy,
  applyTrackedHeal,
  applyTaoonBloodTithe,
  addTaoonBloodShield,
  addBatataShield,
  isBatataBacklineAlly,
  isZavsMeleeAlly,
  applyMuddied,
  emitParticle,
  addDamageText,
  sound,
  shake,
}) {
  applyBuiltInCleaveProc(unit, target, {
    damage,
    enemies,
    beamFx,
    groundEffects,
    dealDamage,
    emitParticle,
    addDamageText,
  });
  applyZavsOnHitProcs(unit, target, {
    ohTier,
    units,
    enemies,
    beamFx,
    groundEffects,
    dealDamage,
    isZavsMeleeAlly,
    emitParticle,
    addDamageText,
    sound,
    shake,
  });
  applyTaoonOnHitProcs(unit, target, {
    ohTier,
    units,
    enemies,
    beamFx,
    groundEffects,
    dealDamage,
    applyRuneWound,
    isTaoonPriorityEnemy,
    applyTrackedHeal,
    applyTaoonBloodTithe,
    addTaoonBloodShield,
    emitParticle,
    addDamageText,
    sound,
    shake,
  });
  applyBatataOnHitProcs(unit, target, {
    ohTier,
    units,
    enemies,
    beamFx,
    groundEffects,
    dealDamage,
    addBatataShield,
    isBatataBacklineAlly,
    applyMuddied,
    emitParticle,
    addDamageText,
    sound,
    shake,
  });
}

function applyBuiltInCleaveProc(unit, target, {
  damage,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
}) {
  if (!unit._cleaveProc || target.hp <= 0) return;

  if (unit._cleaveType === 'blade') {
    const cleaveDamage = Math.round(damage * 0.50);
    let hit = 0;
    for (const enemy of enemies) {
      if (enemy !== target && enemy.hp > 0 && dist(target, enemy) < 40) {
        dealDamage(enemy, cleaveDamage, unit, 'normal');
        hit++;
        emitParticle(enemy.x, enemy.y, '#ff8844', 6, 2);
      }
    }
    if (hit > 0) {
      const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 40, life: 0.3, swipeArc: true, swipeAngle: angle, color: '#ff6622' });
      emitParticle(target.x, target.y, '#ffaa44', 8, 3);
    }
  } else if (unit._cleaveType === 'shadow') {
    const splashDamage = Math.round(damage * 0.40);
    let hit = 0;
    for (const enemy of enemies) {
      if (enemy !== target && enemy.hp > 0 && dist(target, enemy) < 35) {
        dealDamage(enemy, splashDamage, unit, 'magic');
        hit++;
        emitParticle(enemy.x, enemy.y, '#9944ff', 6, 2);
      }
    }
    if (hit > 0) {
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 35, life: 0.3, color: '#7722cc' });
      emitParticle(target.x, target.y, '#aa66ff', 8, 3);
    }
  } else if (unit._cleaveType === 'pierce') {
    const pierceAngle = Math.atan2(target.y - unit.y, target.x - unit.x);
    let pierceTarget = null;
    let bestDistance = Infinity;
    for (const enemy of enemies) {
      if (enemy === target || enemy.hp <= 0) continue;
      const enemyDistance = dist(target, enemy);
      if (enemyDistance > 80) continue;
      const enemyAngle = Math.atan2(enemy.y - target.y, enemy.x - target.x);
      const angleDiff = Math.abs(enemyAngle - pierceAngle);
      if (angleDiff < 0.7 && enemyDistance < bestDistance) {
        bestDistance = enemyDistance;
        pierceTarget = enemy;
      }
    }
    if (pierceTarget) {
      const pierceDamage = Math.round(damage * 0.60);
      dealDamage(pierceTarget, pierceDamage, unit, 'normal');
      beamFx.push({ x1: target.x, y1: target.y, x2: pierceTarget.x, y2: pierceTarget.y, life: 0.2, maxLife: 0.2, color: '#44ddff', width: 2, straight: true });
      emitParticle(pierceTarget.x, pierceTarget.y, '#44ddff', 8, 3);
      addDamageText(pierceTarget.x, pierceTarget.y - pierceTarget.size, 'PIERCE!', '#44ddff');
    }
  }
}

function applyZavsOnHitProcs(unit, target, {
  ohTier,
  units,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  isZavsMeleeAlly,
  emitParticle,
  addDamageText,
  sound,
  shake,
}) {
  if (unit.unitIdx !== 0) return;

  if (ohTier === 3 && unit._zavsShieldBash && target.hp > 0) {
    const bashDamage = Math.round(unit.dmg * 0.35);
    dealDamage(target, bashDamage, unit, 'normal');
    target.dentedTimer = 3 * GAME_TICK_HZ;
    target.dentedMult = 0.90;
    emitParticle(target.x, target.y, '#cfd6df', 12, 4);
    beamFx.push({ x1: unit.x, y1: unit.y, x2: target.x, y2: target.y, color: '#cfd6df', width: 3, life: 0.18, maxLife: 0.18, straight: true });
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 34, life: 0.35, color: '#9ca3af' });
    addDamageText(target.x, target.y - target.size, 'DENTED!', '#cfd6df', { sz: 12, bold: true });
    sound.shieldBlock();
  }

  if (ohTier === 5 && target.hp > 0) {
    if (unit.zavsCitadel) {
      unit.zavsGuardPulseTimer = 3 * GAME_TICK_HZ;
      let pulses = 0;
      for (const enemy of enemies) {
        if (enemy.hp <= 0 || dist(unit, enemy) > 95) continue;
        if (!enemy.isBoss) {
          enemy.forcedTarget = unit;
          enemy.forcedTargetTimer = 2 * GAME_TICK_HZ;
        }
        emitParticle(enemy.x, enemy.y, '#cfd6df', 5, 2);
        pulses++;
      }
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 95, life: 0.55, color: '#cfd6df' });
      addDamageText(unit.x, unit.y - unit.size, 'GUARD PULSE!', '#cfd6df', { sz: 13, bold: true });
      if (pulses) shake(4);
    } else if (unit.zavsVanguard) {
      const armorDamage = Math.round(unit.dmg * 0.45);
      let hit = 0;
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        if (dist(target, enemy) > 75 && dist(unit, enemy) > 75) continue;
        dealDamage(enemy, armorDamage, unit, 'normal');
        enemy.crackedArmorTimer = 4 * GAME_TICK_HZ;
        enemy.crackedArmorMult = enemy.isBoss ? 0.05 : 0.10;
        emitParticle(enemy.x, enemy.y, '#d6b45f', 8, 3);
        hit++;
      }
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 75, life: 0.45, color: '#d6b45f' });
      addDamageText(target.x, target.y - target.size, 'ARMOR CRACK!', '#d6b45f', { sz: 13, bold: true });
      if (hit) shake(5);
    }
  }

  if (ohTier === 10 && target.hp > 0) {
    if (unit.zavsCitadel) {
      const selfShield = Math.round(unit.maxHp * 0.22);
      unit._zavsLineShield = Math.max(unit._zavsLineShield || 0, selfShield);
      unit._zavsLineShieldTimer = 4 * GAME_TICK_HZ;
      for (const ally of units) {
        if (!isZavsMeleeAlly(ally) || dist(unit, ally) > 140) continue;
        const allyShield = Math.round(unit.maxHp * 0.07);
        ally._zavsLineShield = Math.max(ally._zavsLineShield || 0, allyShield);
        ally._zavsLineShieldTimer = 4 * GAME_TICK_HZ;
        emitParticle(ally.x, ally.y, '#cfd6df', 8, 3);
      }
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 140, life: 0.65, color: '#cfd6df' });
      addDamageText(unit.x, unit.y - unit.size, 'UNBREAKABLE LINE!', '#cfd6df', { sz: 14, bold: true });
      sound.shieldBlock();
    } else if (unit.zavsVanguard) {
      target.focusMarkTimer = 4 * GAME_TICK_HZ;
      target.focusMarkMult = target.isBoss ? 0.06 : 0.12;
      emitParticle(target.x, target.y, '#ffe066', 18, 5);
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 50, life: 0.50, color: '#ffe066' });
      addDamageText(target.x, target.y - target.size, 'FOCUS MARK!', '#ffe066', { sz: 14, bold: true });
    }
  }
}

function applyTaoonOnHitProcs(unit, target, {
  ohTier,
  units,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  applyRuneWound,
  isTaoonPriorityEnemy,
  applyTrackedHeal,
  applyTaoonBloodTithe,
  addTaoonBloodShield,
  emitParticle,
  addDamageText,
  sound,
  shake,
}) {
  if (unit.unitIdx !== 1) return;

  if (ohTier === 3 && target.hp > 0) {
    const woundDamage = Math.round(unit.dmg * 0.35);
    dealDamage(target, woundDamage, unit, 'magic');
    if (!target.isBoss) {
      const woundMult = isTaoonPriorityEnemy(target) ? 0.88 : 0.92;
      applyRuneWound(target, unit, woundMult, Math.round(3 * GAME_TICK_HZ));
      addDamageText(target.x, target.y - target.size, 'RUNE WOUND!', '#aa66ff', { sz: 12, bold: true });
    }
    emitParticle(target.x, target.y, '#8a66ff', 12, 4);
    beamFx.push({ x1: unit.x, y1: unit.y, x2: target.x, y2: target.y, color: '#8a66ffaa', width: 3, life: 0.18, maxLife: 0.18, wavy: true });
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 32, life: 0.35, color: '#7b3fd1' });
  }

  if (ohTier === 5 && target.hp > 0) {
    if (unit.branch === 'a') {
      const strikeDamage = Math.round(unit.dmg * 0.60);
      dealDamage(target, strikeDamage, unit, 'magic');
      const low = unit.hp < unit.maxHp * (unit.deathStrike && unit.deathStrike.lowThreshold || 0.45);
      const healPct = low ? (unit.deathStrike && unit.deathStrike.lowHealPct || 0.12) : (unit.deathStrike && unit.deathStrike.healPct || 0.08);
      const heal = applyTrackedHeal(unit, Math.round(unit.maxHp * healPct), unit, true);
      if (heal > 0) applyTaoonBloodTithe(unit, heal);
      emitParticle(unit.x, unit.y, '#cc2244', 16, 5);
      emitParticle(target.x, target.y, '#ff6688', 12, 4);
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 48, life: 0.4, color: '#cc2244' });
      addDamageText(unit.x, unit.y - unit.size, 'DEATH STRIKE!', '#ff6688', { sz: 13, bold: true });
      sound.heal();
    } else if (unit.branch === 'b') {
      const chainTargets = [target];
      const near = enemies.filter(enemy => enemy !== target && enemy.hp > 0 && !enemy.isBoss && dist(target, enemy) <= 80)
        .sort((a, b) => dist(target, a) - dist(target, b)).slice(0, 2);
      for (const enemy of near) chainTargets.push(enemy);
      for (const enemy of chainTargets) {
        dealDamage(enemy, Math.round(unit.dmg * 0.35), unit, 'magic');
        if (!enemy.isBoss) {
          enemy.soulChainsTimer = Math.max(enemy.soulChainsTimer || 0, unit.soulChains ? unit.soulChains.slowDur : Math.round(2.5 * GAME_TICK_HZ));
          enemy.soulChainsFrom = unit;
          enemy.slowTimer = Math.max(enemy.slowTimer || 0, enemy.soulChainsTimer);
          enemy.slowMult = Math.min(enemy.slowMult || 1, unit.soulChains ? unit.soulChains.slowMult : 0.75);
          if (enemy.arch === 'ranged' || enemy.arch === 'caster' || enemy.arch === 'support') enemy.silenceTimer = Math.max(enemy.silenceTimer || 0, unit.soulChains ? unit.soulChains.interruptDur : Math.round(0.35 * GAME_TICK_HZ));
        }
        emitParticle(enemy.x, enemy.y, '#44c7ff', 8, 3);
        emitParticle(enemy.x, enemy.y, '#8a66ff', 5, 2);
        beamFx.push({ x1: unit.x, y1: unit.y, x2: enemy.x, y2: enemy.y, color: '#44c7ffaa', width: 2, life: 0.20, maxLife: 0.20, wavy: true });
      }
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 80, life: 0.45, color: '#44c7ff' });
      addDamageText(target.x, target.y - target.size, 'SOUL CHAINS!', '#66d9ff', { sz: 13, bold: true });
      shake(4);
    }
  }

  if (ohTier === 10 && target.hp > 0) {
    if (unit.branch === 'a') {
      const allies = units.filter(ally => ally && ally.hp > 0 && ally.isPlayer && !ally.isGhost && !ally.isMinion && ally !== unit && dist(unit, ally) <= 180)
        .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp)).slice(0, 2);
      for (const ally of allies) {
        addTaoonBloodShield(ally, Math.round(unit.maxHp * 0.06), Math.round(4 * GAME_TICK_HZ), 0.10);
        beamFx.push({ x1: unit.x, y1: unit.y, x2: ally.x, y2: ally.y, color: '#ff6688aa', width: 2, life: 0.25, maxLife: 0.25, straight: true });
      }
      emitParticle(unit.x, unit.y, '#ff6688', 18, 5);
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 180, life: 0.45, color: '#cc2244' });
      addDamageText(unit.x, unit.y - unit.size, 'BLOOD OATH!', '#ff6688', { sz: 14, bold: true });
    } else if (unit.branch === 'b') {
      let marked = 0;
      for (const enemy of enemies) {
        if (enemy.hp <= 0 || enemy.isBoss || dist(target, enemy) > 90) continue;
        enemy.markedForRuinTimer = Math.max(enemy.markedForRuinTimer || 0, Math.round(4 * GAME_TICK_HZ));
        enemy.markedForRuinMult = Math.max(enemy.markedForRuinMult || 0, 0.08);
        enemy.markedForRuinFrom = unit;
        dealDamage(enemy, Math.round(unit.dmg * 0.25), unit, 'magic');
        emitParticle(enemy.x, enemy.y, '#bb99ff', 10, 3);
        marked++;
      }
      if (marked) {
        groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 90, life: 0.48, color: '#bb99ff' });
        addDamageText(target.x, target.y - target.size, 'MARKED FOR RUIN!', '#bb99ff', { sz: 14, bold: true });
        shake(4);
      }
    }
  }
}

function applyBatataOnHitProcs(unit, target, {
  ohTier,
  units,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  addBatataShield,
  isBatataBacklineAlly,
  applyMuddied,
  emitParticle,
  addDamageText,
  sound,
  shake,
}) {
  if (unit.unitIdx !== 2) return;

  if (ohTier === 3 && unit.batataMudClap && target.hp > 0 && !target.isBoss) {
    let hit = 0;
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || enemy.isBoss) continue;
      if (dist(target, enemy) > 55) continue;
      dealDamage(enemy, Math.round(unit.dmg * 0.30), unit, 'normal');
      applyMuddied(enemy, unit, Math.round(3 * GAME_TICK_HZ), 0.80, 0.92);
      emitParticle(enemy.x, enemy.y, '#8a6a32', 8, 3);
      hit++;
    }
    if (hit) {
      groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 55, life: 0.38, color: '#8a6a32' });
      addDamageText(target.x, target.y - target.size, 'MUD CLAP!', '#b0793a', { sz: 12, bold: true });
      shake(3);
    }
  }

  if (ohTier === 5 && target.hp > 0) {
    if (unit.backlineGarden) {
      unit.shelterPulseTimer = Math.round(3.5 * GAME_TICK_HZ);
      for (const enemy of enemies) {
        if (enemy.hp > 0 && !enemy.isBoss && dist(unit, enemy) <= 120) applyMuddied(enemy, unit, Math.round(2 * GAME_TICK_HZ), 0.75, 0.92);
      }
      emitParticle(unit.x, unit.y, '#6fbf5a', 20, 5);
      emitParticle(unit.x, unit.y, '#8a6a32', 12, 4);
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 120, life: 0.55, color: '#6fbf5a' });
      addDamageText(unit.x, unit.y - unit.size, 'SHELTER PULSE!', '#6fbf5a', { sz: 13, bold: true });
    } else if (unit.batataMauler) {
      let hit = 0;
      for (const enemy of enemies) {
        if (enemy.hp <= 0 || enemy.isBoss || dist(unit, enemy) > 85) continue;
        dealDamage(enemy, Math.round(unit.dmg * 0.35), unit, 'normal');
        applyMuddied(enemy, unit, Math.round(4 * GAME_TICK_HZ), 0.70, 0.88);
        emitParticle(enemy.x, enemy.y, '#b0793a', 9, 3);
        hit++;
      }
      if (hit) {
        groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 85, life: 0.48, color: '#b0793a' });
        addDamageText(unit.x, unit.y - unit.size, 'QUAKE SNARE!', '#b0793a', { sz: 13, bold: true });
        shake(5);
      }
    }
  }

  if (ohTier === 10 && target.hp > 0) {
    if (unit.backlineGarden) {
      addBatataShield(unit, Math.round(unit.maxHp * 0.18), Math.round(4 * GAME_TICK_HZ));
      const allies = units.filter(ally => isBatataBacklineAlly(ally) && dist(unit, ally) <= 190)
        .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp)).slice(0, 3);
      for (const ally of allies) {
        addBatataShield(ally, Math.round(unit.maxHp * 0.07), Math.round(4 * GAME_TICK_HZ));
        beamFx.push({ x1: unit.x, y1: unit.y, x2: ally.x, y2: ally.y, life: 0.25, maxLife: 0.25, color: '#8a6a32', width: 2, straight: true });
      }
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 190, life: 0.55, color: '#8a6a32' });
      addDamageText(unit.x, unit.y - unit.size, 'ROOT SHELTER!', '#6fbf5a', { sz: 14, bold: true });
      sound.shieldBlock();
    } else if (unit.batataMauler) {
      addBatataShield(unit, Math.round(unit.maxHp * 0.16), Math.round(4 * GAME_TICK_HZ));
      let roared = 0;
      for (const enemy of enemies) {
        if (enemy.hp <= 0 || enemy.isBoss || dist(unit, enemy) > 120) continue;
        enemy.mudbreakerRoarTimer = Math.max(enemy.mudbreakerRoarTimer || 0, Math.round(4 * GAME_TICK_HZ));
        enemy.mudbreakerRoarMult = Math.min(enemy.mudbreakerRoarMult || 1, 0.88);
        applyMuddied(enemy, unit, Math.round(4 * GAME_TICK_HZ), 0.75, 0.88);
        emitParticle(enemy.x, enemy.y, '#b0793a', 8, 3);
        roared++;
      }
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 120, life: 0.52, color: '#b0793a' });
      addDamageText(unit.x, unit.y - unit.size, 'MUDBREAKER ROAR!', '#b0793a', { sz: 14, bold: true });
      if (roared) shake(6);
    }
  }
}
