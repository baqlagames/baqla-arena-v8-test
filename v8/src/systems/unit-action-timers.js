import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';
import { ARENA_LEASH_BACK, ARENA_LEASH_FWD, ARENA_LEASH_SIDE } from '../data/tuning.js';
import { limitBurstLanding } from './combat-targeting.js';
import { isValidPlayerOffensiveTarget } from './player-target-validity.js';

export function tickUnitActionTimers(unit, {
  frame,
  enemies,
  beamEffects,
  groundEffects,
  randomRange,
  dealDamage,
  fireProjectile,
  clampToArena,
  clampToLeash,
  isGripReserved,
  isGapCloserReserved,
  isTaoonPriorityEnemy,
  reserveGripTarget,
  grantGapInvulnerability,
  addHealFx,
  emitParticle,
  addDamageText,
  showFlash,
  playStealth,
  playHeavySlash,
  playBackstab,
  playFrostBolt,
  shake,
}) {
  tickBarrage(unit, { enemies, fireProjectile });
  tickPlayerBurn(unit, { frame, dealDamage, emitParticle });
  tickFelfelTimers(unit, { frame, enemies, beamEffects, groundEffects, randomRange, dealDamage, clampToArena, clampToLeash, addHealFx, emitParticle, addDamageText, showFlash, playStealth, playHeavySlash, playBackstab, shake });
  tickShieldCharge(unit, { enemies, groundEffects, dealDamage, clampToLeash, isGripReserved, isGapCloserReserved, emitParticle, addDamageText, shake });
  tickDeathGrip(unit, { enemies, beamEffects, groundEffects, isGapCloserReserved, isTaoonPriorityEnemy, reserveGripTarget, grantGapInvulnerability, clampToArena, emitParticle, addDamageText, showFlash, shake });
  tickBoneShield(unit, { emitParticle });
  tickRemorselessWinter(unit, { frame, enemies, groundEffects, dealDamage, emitParticle, playFrostBolt, shake });
  tickDancingRuneWeapon(unit);
  tickRoninDragoonTimers(unit, { frame, enemies, beamEffects, groundEffects, dealDamage, emitParticle, addDamageText, shake });
  tickKingHolySwordTimers(unit, { frame, enemies, beamEffects, groundEffects, dealDamage, emitParticle, addDamageText, shake });
}

function tickBarrage(unit, {
  enemies,
  fireProjectile,
}) {
  if (!(unit._barrageQueue > 0)) return;

  unit._barrageTimer = (unit._barrageTimer || 0) + 1;
  if (unit._barrageTimer < 8) return;

  unit._barrageTimer = 0;
  let best = null;
  let bestDistance = Infinity;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const distance = dist(unit, enemy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = enemy;
    }
  }
  if (best && unit.projType) {
    fireProjectile(unit, best, Math.round(unit.dmg * 1.8), { projType: unit.projType, pierce: unit.pierce, aimed: true });
  }
  unit._barrageQueue--;
}

function tickPlayerBurn(unit, {
  frame,
  dealDamage,
  emitParticle,
}) {
  if (!(unit.burnTimer > 0)) return;

  unit.burnTimer--;
  if (frame % 30 === 0 && unit.burnDmg) {
    const stack = unit.burnStacks || 1;
    dealDamage(unit, unit.burnDmg * stack, unit.burnFrom || null, 'magic');
    emitParticle(unit.x, unit.y - unit.size * 0.5, '#ff7700', 2, 2);
  }
  if (unit.burnTimer <= 0) unit.burnStacks = 0;
}

function tickFelfelTimers(unit, {
  frame,
  enemies,
  beamEffects,
  groundEffects,
  randomRange,
  dealDamage,
  clampToArena,
  clampToLeash,
  addHealFx,
  emitParticle,
  addDamageText,
  showFlash,
  playStealth,
  playHeavySlash,
  playBackstab,
  shake,
}) {
  tickFelfelRestealth(unit, { groundEffects, emitParticle, playStealth });
  if (unit.sliceAndDice && unit.sliceAndDice.timer > 0) unit.sliceAndDice.timer--;
  tickShadowDance(unit, { groundEffects, emitParticle, addDamageText, showFlash, playStealth });
  tickCrimsonVial(unit, { frame, addHealFx, emitParticle, addDamageText });
  tickCheatDeathAndCloak(unit);
  tickDeathFromAbove(unit, { frame, enemies, beamEffects, groundEffects, randomRange, dealDamage, clampToArena, clampToLeash, emitParticle, addDamageText, playHeavySlash, shake });
  tickKillingSpree(unit, { beamEffects, groundEffects, randomRange, dealDamage, clampToArena, clampToLeash, emitParticle, addDamageText, playBackstab, shake });
}

function tickFelfelRestealth(unit, {
  groundEffects,
  emitParticle,
  playStealth,
}) {
  if (!unit.stealth || !(unit.stealthHits > 0)) return;

  unit.idleT = (unit.idleT || 0) + 1;
  if (unit.idleT < 4 * GAME_TICK_HZ) return;

  unit.stealthHits = 0;
  unit.firstHitDone = false;
  unit.idleT = 0;
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2;
    emitParticle(unit.x + Math.cos(angle) * 14, unit.y + Math.sin(angle) * 14, '#3a1a2a', 1, 2);
  }
  emitParticle(unit.x, unit.y, '#5e1218', 18, 4);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 24, life: 0.3, color: '#3a1a2a' });
  playStealth();
}

function tickShadowDance(unit, {
  groundEffects,
  emitParticle,
  addDamageText,
  showFlash,
  playStealth,
}) {
  if (!unit.shadowDance) return;

  unit.shadowDance.t++;
  if (unit.shadowDance.t < unit.shadowDance.every || !(unit.stealthHits > 0)) return;

  unit.shadowDance.t = 0;
  unit.stealthHits = 0;
  unit.firstHitDone = false;
  unit.idleT = 0;
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2;
    emitParticle(unit.x + Math.cos(angle) * 18, unit.y + Math.sin(angle) * 18, '#6622aa', 1, 3);
  }
  emitParticle(unit.x, unit.y, '#440066', 22, 5);
  emitParticle(unit.x, unit.y, '#aa44ff', 10, 3);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 30, life: 0.35, color: '#44006688' });
  addDamageText(unit.x, unit.y - unit.size, 'SHADOW DANCE!', '#cc66ff', { sz: 13, bold: true });
  showFlash('SHADOW DANCE', '#aa44ff', 30);
  playStealth();
}

function tickCrimsonVial(unit, {
  frame,
  addHealFx,
  emitParticle,
  addDamageText,
}) {
  if (!unit.crimsonVial) return;

  if (unit.crimsonVial.timer > 0) unit.crimsonVial.timer--;
  if (unit.crimsonVial.active) {
    unit.crimsonVial.activeTimer--;
    if (frame % GAME_TICK_HZ === 0) {
      const heal = Math.round(unit.maxHp * unit.crimsonVial.healPct);
      unit.hp = Math.min(unit.maxHp, unit.hp + heal);
      addHealFx(unit.x, unit.y, heal);
      emitParticle(unit.x, unit.y, '#cc3344', 4, 2);
    }
    if (unit.crimsonVial.activeTimer <= 0) {
      unit.crimsonVial.active = false;
      unit.crimsonVial.timer = unit.crimsonVial.cd;
    }
    return;
  }

  if (unit.crimsonVial.timer <= 0 && unit.hp < unit.maxHp * unit.crimsonVial.threshold) {
    unit.crimsonVial.active = true;
    unit.crimsonVial.activeTimer = unit.crimsonVial.dur;
    addDamageText(unit.x, unit.y - unit.size, 'CRIMSON VIAL!', '#cc3344');
    emitParticle(unit.x, unit.y, '#cc3344', 12, 3);
  }
}

function tickCheatDeathAndCloak(unit) {
  if (unit.cheatDeathTimer > 0) {
    unit.cheatDeathTimer--;
    if (unit.cheatDeathTimer <= 0) unit.cheatDeathDR = 0;
  }
  if (!unit.cloakOfShadows) return;

  if (unit.cloakOfShadows.active) {
    unit.cloakOfShadows.dur--;
    if (unit.cloakOfShadows.dur <= 0) {
      unit.cloakOfShadows.active = false;
      unit.cloakOfShadows.cd = unit.cloakOfShadows.cooldown;
    }
  } else if (unit.cloakOfShadows.cd > 0) {
    unit.cloakOfShadows.cd--;
  }
}

function tickDeathFromAbove(unit, {
  frame,
  enemies,
  beamEffects,
  groundEffects,
  randomRange,
  dealDamage,
  clampToArena,
  clampToLeash,
  emitParticle,
  addDamageText,
  playHeavySlash,
  shake,
}) {
  if (!(unit.dfaTimer > 0)) return;

  unit.dfaTimer--;
  if (unit.dfaTimer > 30 && frame % 3 === 0) {
    emitParticle(unit.x + randomRange(-4, 4), unit.y + randomRange(5, 12), '#331122', 1, 2);
    emitParticle(unit.x + randomRange(-3, 3), unit.y + randomRange(3, 8), '#ff446644', 1, 2);
  }
  if (unit.dfaTimer === 30) {
    unit.dfaPhase = 'falling';
    let best = null;
    let bestDistance = Infinity;
    for (const enemy of enemies) {
      if (isValidPlayerOffensiveTarget(enemy)) {
        const distance = dist(unit, enemy);
        if (distance < 155 && distance < bestDistance) {
          bestDistance = distance;
          best = enemy;
        }
      }
    }
    if (best) {
      const landing = limitBurstLanding(unit, best.x, best.y, 140);
      unit.dfaX = landing.x;
      unit.dfaY = landing.y;
    }
    emitParticle(unit.x, unit.y, '#ff4466', 16, 4);
  }
  if (unit.dfaTimer < 30 && unit.dfaTimer > 1 && frame % 2 === 0) {
    const progress = (30 - unit.dfaTimer) / 30;
    const x = unit.x + (unit.dfaX - unit.x) * progress;
    const y = unit.y + (unit.dfaY - unit.y) * progress;
    emitParticle(x + randomRange(-5, 5), y + randomRange(-5, 5), '#ff446688', 1, 2);
  }
  if (unit.dfaTimer !== 1) return;

  unit.dfaPhase = null;
  unit.untargetable = false;
  unit.x = unit.dfaX;
  unit.y = unit.dfaY;
  if (typeof clampToLeash === 'function') clampToLeash(unit);
  else clampToArena(unit);
  const damage = Math.round(unit.dmg * 4);
  for (const enemy of enemies) {
    if (!isValidPlayerOffensiveTarget(enemy)) continue;
    if (dist(unit, enemy) <= 80) {
      dealDamage(enemy, damage, unit, 'normal');
      enemy.stunned = Math.max(enemy.stunned || 0, 2 * GAME_TICK_HZ);
      emitParticle(enemy.x, enemy.y, '#ff4466', 14, 4);
    }
  }
  for (let i = 0; i < 10; i++) {
    const angle = i / 10 * Math.PI * 2;
    emitParticle(unit.x + Math.cos(angle) * 35, unit.y + Math.sin(angle) * 35, '#ff4466', 14, 3);
  }
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2;
    beamEffects.push({ x1: unit.x, y1: unit.y, x2: unit.x + Math.cos(angle) * 60, y2: unit.y + Math.sin(angle) * 60, color: '#ff446688', width: 2, life: 0.2, maxLife: 0.2, straight: true });
  }
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 80, life: 0.6, color: '#ff4466' });
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 45, life: 0.35, color: '#aa2244' });
  shake(12);
  emitParticle(unit.x, unit.y, '#ff4466', 36, 7);
  emitParticle(unit.x, unit.y, '#ffffff', 16, 4);
  addDamageText(unit.x, unit.y - unit.size, 'DEATH FROM ABOVE!', '#ff4466', { sz: 14, bold: true });
  playHeavySlash();
}

function tickKillingSpree(unit, {
  beamEffects,
  groundEffects,
  randomRange,
  dealDamage,
  clampToArena,
  clampToLeash,
  emitParticle,
  addDamageText,
  playBackstab,
  shake,
}) {
  if (!unit.killingSpree) return;

  unit.killingSpree.timer++;
  if (unit.killingSpree.timer < unit.killingSpree.interval || unit.killingSpree.idx >= unit.killingSpree.targets.length) return;

  unit.killingSpree.timer = 0;
  const target = unit.killingSpree.targets[unit.killingSpree.idx];
  if (isValidPlayerOffensiveTarget(target)) {
    const fromX = unit.x;
    const fromY = unit.y;
    const landing = limitBurstLanding(unit, target.x + randomRange(-15, 15), target.y + randomRange(-10, 10), unit.killingSpree.maxStep || 140);
    unit.x = landing.x;
    unit.y = landing.y;
    if (typeof clampToLeash === 'function') clampToLeash(unit);
    else clampToArena(unit);
    beamEffects.push({ x1: fromX, y1: fromY, x2: unit.x, y2: unit.y, color: '#ff224488', width: 3, life: 0.15, maxLife: 0.15, straight: true });
    for (let i = 0; i < 5; i++) {
      const fraction = i / 5;
      emitParticle(fromX + (target.x - fromX) * fraction, fromY + (target.y - fromY) * fraction, '#ff224488', 1, 2);
    }
    emitParticle(fromX, fromY, '#ff2244', 6, 3);
    dealDamage(target, Math.round(unit.dmg * 2.5), unit, 'normal');
    const angle = Math.atan2(target.y - fromY, target.x - fromX);
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 28, life: 0.25, swipeArc: true, swipeAngle: angle, color: '#ff2244' });
    emitParticle(target.x, target.y, '#ff2244', 18, 5);
    emitParticle(target.x, target.y, '#ffffff', 8, 3);
    addDamageText(target.x, target.y - target.size, 'SPREE!', '#ff2244', { sz: 13, bold: true });
    shake(4);
  }
  unit.killingSpree.idx++;
  if (unit.killingSpree.idx < unit.killingSpree.targets.length) return;

  unit.untargetable = false;
  unit.x = unit.killingSpree.origX;
  unit.y = unit.killingSpree.origY;
  unit.killingSpree = null;
  emitParticle(unit.x, unit.y, '#ff2244', 12, 4);
  addDamageText(unit.x, unit.y - unit.size, 'KILLING SPREE!', '#ff2244', { sz: 14, bold: true });
  shake(8);
  playBackstab();
}

function tickShieldCharge(unit, {
  enemies,
  groundEffects,
  dealDamage,
  clampToLeash,
  isGripReserved,
  isGapCloserReserved,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!unit.tankCharge || unit.tankCharge.used) return;

  const range = unit.tankCharge.range;
  const homeX = unit.homeX || unit.x;
  const homeY = unit.homeY || unit.y;
  let target = null;
  let bestDistance = Infinity;
  for (const enemy of enemies) {
    if (!isValidPlayerOffensiveTarget(enemy)) continue;
    if (isGripReserved(enemy, unit) || isGapCloserReserved(enemy, unit)) continue;
    const distance = dist(unit, enemy);
    if (distance > range) continue;
    const homeDy = (enemy.y + 12) - homeY;
    const homeDx = Math.abs(enemy.x - homeX);
    if (homeDy < -(ARENA_LEASH_FWD - 30) || homeDy > ARENA_LEASH_BACK) continue;
    if (homeDx > ARENA_LEASH_SIDE) continue;
    if (distance < bestDistance) {
      bestDistance = distance;
      target = enemy;
    }
  }
  if (!target) return;

  unit.tankCharge.used = true;
  const fromX = unit.x;
  const fromY = unit.y;
  unit.x = target.x;
  unit.y = target.y + 12;
  clampToLeash(unit);
  for (const enemy of enemies) {
    if (!isValidPlayerOffensiveTarget(enemy)) continue;
    if (dist(unit, enemy) <= unit.tankCharge.radius) {
      dealDamage(enemy, Math.round(unit.dmg * unit.tankCharge.dmgMult), unit, 'normal');
      if (!enemy.isBoss) enemy.stunned = Math.max(enemy.stunned || 0, unit.tankCharge.stunDur);
    }
  }
  emitParticle(fromX, fromY, '#cc6633', 16, 5);
  emitParticle(unit.x, unit.y, '#cc6633', 24, 6);
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.tankCharge.radius, life: 0.4, color: '#cc6633' });
  addDamageText(unit.x, unit.y - unit.size, 'SHIELD CHARGE!', '#cc6633');
  shake(8);
}

function tickDeathGrip(unit, {
  enemies,
  beamEffects,
  groundEffects,
  isGapCloserReserved,
  isTaoonPriorityEnemy,
  reserveGripTarget,
  grantGapInvulnerability,
  clampToArena,
  emitParticle,
  addDamageText,
  showFlash,
  shake,
}) {
  if (!unit.deathGrip) return;

  if (unit.deathGrip.cd > 0) unit.deathGrip.cd--;
  if (!(unit.deathGrip.cd <= 0)) return;

  const candidates = [];
  for (const enemy of enemies) {
    if (!isValidPlayerOffensiveTarget(enemy) || enemy.isBoss) continue;
    if (isGapCloserReserved(enemy, unit)) continue;
    const distance = dist(unit, enemy);
    if (distance > unit.deathGrip.range) continue;
    let score = distance;
    if (isTaoonPriorityEnemy(enemy)) score -= 140;
    candidates.push({ enemy, score });
  }
  if (!candidates.length) return;

  candidates.sort((a, b) => a.score - b.score);
  const count = Math.min(unit.deathGrip.count || 1, candidates.length);
  unit.deathGrip.cd = unit.deathGrip.every;
  if (unit.unitIdx === 1) grantGapInvulnerability(unit, 'GRIP GUARD', '#aa66ff');
  for (let i = 0; i < count; i++) {
    const target = candidates[i].enemy;
    const fanAngle = (i - (count - 1) / 2) * 0.35;
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const baseAngle = Math.atan2(dy, dx) + fanAngle;
    target.x = unit.x + Math.cos(baseAngle) * 30;
    target.y = unit.y + Math.sin(baseAngle) * 30;
    clampToArena(target);
    reserveGripTarget(target, unit, 60);
    target.stunned = Math.max(target.stunned || 0, unit.deathGrip.stunDur);
    beamEffects.push({ x1: unit.x, y1: unit.y, x2: target.x, y2: target.y, color: '#9944cc', width: 4, life: 0.3, maxLife: 0.3, wavy: true });
    for (let j = 0; j < 5; j++) {
      const angle = j / 5 * Math.PI * 2;
      emitParticle(target.x + Math.cos(angle) * 14, target.y + Math.sin(angle) * 14, '#aa44ff', 12, 2);
    }
    emitParticle(target.x, target.y, '#ff44ff', 14, 4);
    addDamageText(target.x, target.y - target.size, 'GRIP!', '#cc66ff', { sz: 13, bold: true });
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 36, life: 0.35, color: '#8833cc' });
    if (target.arch === 'ranged' || target.arch === 'caster' || target.arch === 'support') {
      target.silenceTimer = Math.max(target.silenceTimer || 0, Math.round(0.6 * GAME_TICK_HZ));
    }
  }
  if (count > 1) {
    showFlash('MASS GRIP!', '#9966cc', 45);
    shake(8);
  }
}

function tickBoneShield(unit, {
  emitParticle,
}) {
  if (!unit.boneShield || unit.boneShield.charges >= unit.boneShield.maxCharges) return;

  unit.boneShield.rechargeT++;
  if (unit.boneShield.rechargeT < unit.boneShield.rechargeEvery) return;

  unit.boneShield.rechargeT = 0;
  unit.boneShield.charges++;
  emitParticle(unit.x, unit.y, '#ccddcc', 8, 3);
}

function tickRemorselessWinter(unit, {
  frame,
  enemies,
  groundEffects,
  dealDamage,
  emitParticle,
  playFrostBolt,
  shake,
}) {
  if (!(unit.remorselessWinterTimer > 0)) return;

  unit.remorselessWinterTimer--;
  unit.remorselessWinterTick++;
  if (frame % 6 === 0) {
    const baseAngle = (frame * 0.05) % (Math.PI * 2);
    for (let i = 0; i < 3; i++) {
      const angle = baseAngle + i * (Math.PI * 2 / 3);
      const radius = 60 + Math.sin(frame * 0.03 + i) * 20;
      emitParticle(unit.x + Math.cos(angle) * radius, unit.y + Math.sin(angle) * radius, '#aaeeff', 1, 2);
    }
  }
  if (frame % 12 === 0) groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 80, life: 0.2, color: '#88ddff44' });
  if (unit.remorselessWinterTick >= GAME_TICK_HZ) {
    unit.remorselessWinterTick = 0;
    for (const enemy of enemies) {
      if (!isValidPlayerOffensiveTarget(enemy)) continue;
      if (dist(unit, enemy) > 120) continue;
      dealDamage(enemy, Math.round(unit.dmg * 0.8), unit, 'magic');
      enemy.slowTimer = Math.max(enemy.slowTimer || 0, 90);
      enemy.slowMult = Math.min(enemy.slowMult || 1, 0.5);
      emitParticle(enemy.x, enemy.y, '#aaeeff', 8, 3);
      groundEffects.push({ x: enemy.x, y: enemy.y, r: 0, maxR: 18, life: 0.2, color: '#aaeeff', iceShard: true });
    }
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 120, life: 0.4, color: '#88ddff' });
    shake(2);
    playFrostBolt();
  }
  if (unit.remorselessWinterTimer <= 0) unit.remorselessWinterTick = 0;
}

function tickDancingRuneWeapon(unit) {
  if (!(unit.dancingRuneWeaponTimer > 0)) return;

  unit.dancingRuneWeaponTimer--;
  if (unit.dancingRuneWeaponTimer <= 0) unit.drwMirrorDmg = 0;
}

function tickRoninDragoonTimers(unit, {
  frame,
  enemies,
  beamEffects,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (unit.thirdEyeTimer > 0) {
    unit.thirdEyeTimer--;
    if (frame % 6 === 0) emitParticle(unit.x, unit.y - unit.size * 0.35, '#7fd7ff', 2, 2);
    if (unit.thirdEyeTimer <= 0) unit.thirdEyeDR = 0;
  }
  if (unit.lifeOfDragonTimer > 0) {
    unit.lifeOfDragonTimer--;
    if (frame % 5 === 0) emitParticle(unit.x, unit.y - unit.size * 0.4, frame % 10 === 0 ? '#ff4f5e' : '#48c7ff', 2, 2);
    if (unit.lifeOfDragonTimer <= 0) unit.lifeOfDragonAtkMult = 0;
  }
  if (Array.isArray(unit.roninEchoes) && unit.roninEchoes.length > 0) {
    for (let i = unit.roninEchoes.length - 1; i >= 0; i--) {
      const echo = unit.roninEchoes[i];
      echo.timer--;
      if (echo.timer > 0) {
        if (frame % 3 === 0) emitParticle(echo.x, echo.y - 18, echo.type === 'nastrond' ? '#ff4f5e' : '#48c7ff', 2, 3);
        continue;
      }
      unit.roninEchoes.splice(i, 1);
      if (echo.type === 'gekko') {
        let hits = 0;
        for (const enemy of enemies) {
          if (!isValidPlayerOffensiveTarget(enemy) || dist({ x: echo.x, y: echo.y }, enemy) > (echo.radius || 90)) continue;
          dealDamage(enemy, echo.dmg || Math.round((unit.dmg || 1) * 1.0), unit, 'normal');
          emitParticle(enemy.x, enemy.y, '#48c7ff', 10, 4);
          emitParticle(enemy.x, enemy.y, '#ff4f5e', 6, 3);
          hits++;
        }
        beamEffects.push({ x1: echo.x, y1: echo.y - 95, x2: echo.x, y2: echo.y + 8, color: '#48c7ffcc', width: 7, life: 0.30, maxLife: 0.30, straight: true });
        groundEffects.push({ x: echo.x, y: echo.y, r: 0, maxR: echo.radius || 90, life: 0.62, color: '#48c7ff' });
        groundEffects.push({ x: echo.x, y: echo.y, r: 0, maxR: (echo.radius || 90) + 30, life: 0.42, color: '#ff4f5e' });
        addDamageText(echo.x, echo.y - 28, echo.label || 'DRAGOON ECHO', '#48c7ff', { sz: 12, bold: true });
        if (hits) shake(5);
      } else if (echo.type === 'nastrond') {
        const len = echo.len || 240;
        const width = echo.width || 80;
        const angle = echo.angle || 0;
        let hits = 0;
        for (const enemy of enemies) {
          if (!isValidPlayerOffensiveTarget(enemy)) continue;
          const ex = enemy.x - echo.x;
          const ey = enemy.y - echo.y;
          const proj = ex * Math.cos(angle) + ey * Math.sin(angle);
          if (proj < 0 || proj > len) continue;
          const perp = Math.abs(ex * -Math.sin(angle) + ey * Math.cos(angle));
          if (perp > width) continue;
          dealDamage(enemy, echo.dmg || Math.round((unit.dmg || 1) * 1.2), unit, 'normal');
          emitParticle(enemy.x, enemy.y, '#ff4f5e', 10, 4);
          emitParticle(enemy.x, enemy.y, '#48c7ff', 8, 3);
          hits++;
        }
        const endX = echo.x + Math.cos(angle) * len;
        const endY = echo.y + Math.sin(angle) * len;
        beamEffects.push({ x1: echo.x, y1: echo.y - 8, x2: endX, y2: endY - 8, color: '#ff4f5ecc', width: 8, life: 0.34, maxLife: 0.34, straight: true });
        beamEffects.push({ x1: echo.x, y1: echo.y + 5, x2: endX, y2: endY + 5, color: '#48c7ffcc', width: 5, life: 0.28, maxLife: 0.28, straight: true });
        groundEffects.push({ x: echo.x + Math.cos(angle) * len * 0.55, y: echo.y + Math.sin(angle) * len * 0.55, r: 0, maxR: len * 0.42, life: 0.48, color: '#ff4f5e', flatten: true });
        addDamageText(echo.x + Math.cos(angle) * len * 0.45, echo.y + Math.sin(angle) * len * 0.45 - 24, echo.label || 'NASTROND ECHO', '#ff4f5e', { sz: 12, bold: true });
        if (hits) shake(7);
      } else if (echo.type === 'stardiver') {
        const target = echo.target;
        if (isValidPlayerOffensiveTarget(target)) {
          dealDamage(target, echo.dmg || Math.round((unit.dmg || 1) * 2.0), unit, 'normal');
          let splashHits = 0;
          for (const enemy of enemies) {
            if (enemy === target || !isValidPlayerOffensiveTarget(enemy) || dist(target, enemy) > (echo.radius || 100)) continue;
            dealDamage(enemy, echo.splashDmg || Math.round((unit.dmg || 1) * 0.8), unit, 'normal');
            emitParticle(enemy.x, enemy.y, '#48c7ff', 8, 3);
            emitParticle(enemy.x, enemy.y, '#ff4f5e', 6, 3);
            splashHits++;
          }
          beamEffects.push({ x1: target.x, y1: target.y - 130, x2: target.x, y2: target.y + 8, color: '#ff4f5ecc', width: 8, life: 0.34, maxLife: 0.34, straight: true });
          beamEffects.push({ x1: target.x - 20, y1: target.y - 110, x2: target.x + 8, y2: target.y + 8, color: '#48c7ffcc', width: 5, life: 0.30, maxLife: 0.30, straight: true });
          groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: echo.radius || 100, life: 0.72, color: '#ff4f5e' });
          groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: (echo.radius || 100) + 42, life: 0.45, color: '#48c7ff' });
          emitParticle(target.x, target.y, '#ff4f5e', 42, 7);
          emitParticle(target.x, target.y, '#48c7ff', 28, 5);
          addDamageText(target.x, target.y - target.size - 18, echo.label || 'STARDIVER ECHO', '#ff4f5e', { sz: 13, bold: true });
          if (splashHits) addDamageText(target.x, target.y + 20, 'ECHO SPLASH x' + splashHits, '#48c7ff', { sz: 11, bold: true });
          shake(10);
        }
      }
    }
  }
}

const KING_TIMER_ARSENAL_DATA = {
  crystal: { label: 'CRYSTAL', color: '#b95cff', alt: '#f5d6ff' },
  thunder: { label: 'THUNDER', color: '#ffb000', alt: '#fff06a' },
  crown: { label: 'CROWN', color: '#ff3d8b', alt: '#ffd166' },
};

function kingTimerArsenalData(stance) {
  return KING_TIMER_ARSENAL_DATA[stance] || KING_TIMER_ARSENAL_DATA.crystal;
}

function kingTimerDamageMult(stance, target) {
  return stance === 'crown' && target && (target.isBoss || target.elite || target.isElite) ? 1.08 : 1;
}

function kingTimerLineDistance(target, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((target.x - x1) * dx + (target.y - y1) * dy) / lenSq));
  return Math.hypot(target.x - (x1 + dx * t), target.y - (y1 + dy * t));
}

function applyKingTimerArsenalCc(unit, target, stance, { enemies, dealDamage, emitParticle, addDamageText }) {
  if (!isValidPlayerOffensiveTarget(target)) return;
  const cfg = unit.holySwordSaintCombo || {};
  const data = kingTimerArsenalData(stance);
  if (stance === 'crystal') {
    if (target.isBoss || target.elite || target.isElite) {
      target.slowTimer = Math.max(target.slowTimer || 0, cfg.crystalBossSlowDur || Math.round(1.5 * GAME_TICK_HZ));
      target.slowMult = Math.min(target.slowMult || 1, cfg.crystalBossSlow || 0.65);
      addDamageText(target.x, target.y - target.size - 16, 'CRYSTAL SLOW', data.color, { sz: 10, bold: true });
    } else {
      target.stunned = Math.max(target.stunned || 0, cfg.crystalStunDur || Math.round(0.55 * GAME_TICK_HZ));
      addDamageText(target.x, target.y - target.size - 16, 'CRYSTAL STUN', data.color, { sz: 10, bold: true });
    }
  } else if (stance === 'thunder') {
    target.slowTimer = Math.max(target.slowTimer || 0, cfg.thunderSlowDur || 2 * GAME_TICK_HZ);
    target.slowMult = Math.min(target.slowMult || 1, cfg.thunderSlow || 0.65);
    let chain = null;
    let chainDist = Infinity;
    for (const enemy of enemies) {
      if (enemy === target || !isValidPlayerOffensiveTarget(enemy)) continue;
      const d = dist(target, enemy);
      if (d <= (cfg.thunderChainRange || 120) && d < chainDist) {
        chain = enemy;
        chainDist = d;
      }
    }
    if (chain) {
      dealDamage(chain, Math.round((unit.dmg || 1) * (cfg.thunderChainMult || 0.35)), unit, 'magic');
      emitParticle(chain.x, chain.y, data.color, 8, 3);
    }
    addDamageText(target.x, target.y - target.size - 16, 'THUNDER SLOW', data.color, { sz: 10, bold: true });
  } else if (stance === 'crown') {
    if (target.isBoss || target.elite || target.isElite) {
      addDamageText(target.x, target.y - target.size - 16, 'CROWN VERDICT', data.color, { sz: 10, bold: true });
    } else {
      const dx = target.x - unit.x;
      const dy = target.y - unit.y;
      const d = Math.hypot(dx, dy) || 1;
      const push = cfg.crownKnockback || 30;
      target.x += dx / d * push;
      target.y += dy / d * push;
      addDamageText(target.x, target.y - target.size - 16, 'CROWN KNOCK', data.color, { sz: 10, bold: true });
    }
  }
  emitParticle(target.x, target.y, data.color, 10, 3);
}

function resolveKingArsenalLanes(unit, echo, { enemies, beamEffects, groundEffects, dealDamage, emitParticle, addDamageText, shake }) {
  const data = kingTimerArsenalData(echo.stance);
  const hit = new Set();
  const main = echo.main;
  if (isValidPlayerOffensiveTarget(main)) {
    dealDamage(main, echo.mainDmg || Math.round((unit.dmg || 1) * 1.0), unit, 'magic');
    hit.add(main);
    if (echo.applyCc !== false) applyKingTimerArsenalCc(unit, main, echo.stance, { enemies, dealDamage, emitParticle, addDamageText });
  }
  for (const lane of echo.lanes || []) {
    beamEffects.push({ x1: lane.x1, y1: lane.y1 - 8, x2: lane.x2, y2: lane.y2 - 8, color: data.color, width: echo.type === 'crownCrossEcho' ? 7 : 10, life: 0.58, maxLife: 0.58, straight: true });
    beamEffects.push({ x1: lane.x1, y1: lane.y1 + 4, x2: lane.x2, y2: lane.y2 + 4, color: data.alt, width: 4, life: 0.48, maxLife: 0.48, straight: true });
    groundEffects.push({ x: (lane.x1 + lane.x2) / 2, y: (lane.y1 + lane.y2) / 2, r: 0, maxR: Math.max(56, Math.hypot(lane.x2 - lane.x1, lane.y2 - lane.y1) * 0.40), life: 0.70, color: data.color, flatten: true });
    for (const enemy of enemies) {
      if (hit.has(enemy) || !isValidPlayerOffensiveTarget(enemy)) continue;
      if (kingTimerLineDistance(enemy, lane.x1, lane.y1, lane.x2, lane.y2) > (lane.width || 44)) continue;
      dealDamage(enemy, Math.round((echo.lineDmg || Math.round((unit.dmg || 1) * 0.5)) * kingTimerDamageMult(echo.stance, enemy)), unit, 'magic');
      hit.add(enemy);
      emitParticle(enemy.x, enemy.y, data.color, 8, 3);
    }
  }
  const labelX = isValidPlayerOffensiveTarget(main) ? main.x : ((echo.lanes && echo.lanes[0]) ? echo.lanes[0].x2 : unit.x);
  const labelY = isValidPlayerOffensiveTarget(main) ? main.y : ((echo.lanes && echo.lanes[0]) ? echo.lanes[0].y2 : unit.y);
  addDamageText(labelX, labelY - 28, echo.label || 'ARSENAL HIT', data.color, { sz: 13, bold: true });
  emitParticle(labelX, labelY, data.color, 30, 6);
  if (hit.size) shake(echo.type === 'crownCrossEcho' ? 7 : 9);
}

function tickKingHolySwordTimers(unit, {
  frame,
  enemies,
  beamEffects,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (unit.crystalGuardTimer > 0) {
    unit.crystalGuardTimer--;
    if (frame % 8 === 0) emitParticle(unit.x, unit.y - unit.size * 0.35, '#ffd166', 2, 2);
    if (unit.crystalGuardTimer <= 0) unit.crystalGuardDR = 0;
  }
  if (unit.saintSwiftnessTimer > 0) {
    unit.saintSwiftnessTimer--;
    if (frame % 6 === 0) emitParticle(unit.x + 4, unit.y - unit.size * 0.3, '#ffb000', 2, 2);
    if (unit.saintSwiftnessTimer <= 0) unit.saintSwiftnessAtkMult = 0;
  }
  if (unit.exaltedEdgeTimer > 0) {
    unit.exaltedEdgeTimer--;
    if (frame % 7 === 0) emitParticle(unit.x - 4, unit.y - unit.size * 0.5, '#ff3d8b', 2, 2);
  }
  if (Array.isArray(unit.holySwordEchoes) && unit.holySwordEchoes.length > 0) {
    for (let i = unit.holySwordEchoes.length - 1; i >= 0; i--) {
      const echo = unit.holySwordEchoes[i];
      echo.timer--;
      if (echo.timer > 0) {
        if (frame % 3 === 0) emitParticle(echo.x, echo.y - 22, echo.type === 'pillar' ? '#ffd166' : '#b95cff', 2, 3);
        continue;
      }
      unit.holySwordEchoes.splice(i, 1);
      if (echo.type === 'crownCross' || echo.type === 'crownCrossEcho' || echo.type === 'astralSever') {
        resolveKingArsenalLanes(unit, echo, { enemies, beamEffects, groundEffects, dealDamage, emitParticle, addDamageText, shake });
        if (echo.type === 'crownCross') {
          unit.holySwordEchoes.push({
            type: 'crownCrossEcho',
            timer: echo.echoTimer || 27,
            stance: echo.stance,
            main: echo.main,
            lanes: echo.lanes,
            mainDmg: echo.echoMainDmg,
            lineDmg: echo.echoLineDmg,
            label: 'CROSS ECHO',
            applyCc: false,
          });
        }
      } else if (echo.type === 'edictPulse') {
        const hit = new Set();
        for (const point of echo.points || []) {
          groundEffects.push({ x: point.x, y: point.y, r: 0, maxR: echo.radius || 55, life: 0.75, color: '#ffb000' });
          beamEffects.push({ x1: point.x, y1: point.y - 105, x2: point.x, y2: point.y + 8, color: '#ffb000dd', width: 7, life: 0.55, maxLife: 0.55, straight: true });
          for (const enemy of enemies) {
            if (hit.has(enemy) || !isValidPlayerOffensiveTarget(enemy) || dist(point, enemy) > (echo.radius || 55)) continue;
            dealDamage(enemy, echo.dmg || Math.round((unit.dmg || 1) * 0.8), unit, 'magic');
            hit.add(enemy);
            emitParticle(enemy.x, enemy.y, '#ffb000', 8, 3);
          }
        }
        if ((echo.points || []).length) addDamageText(echo.points[0].x, echo.points[0].y - 28, echo.label || 'EDICT PULSE', '#ffd166', { sz: 12, bold: true });
        if (hit.size) shake(7);
      } else if (echo.type === 'heavenlyCrown') {
        const target = echo.target;
        if (isValidPlayerOffensiveTarget(target)) {
          dealDamage(target, echo.dmg || Math.round((unit.dmg || 1) * 1.4), unit, 'magic');
          for (const enemy of enemies) {
            if (enemy === target || !isValidPlayerOffensiveTarget(enemy) || dist(target, enemy) > (echo.radius || 110)) continue;
            if (enemy.isBoss || enemy.elite || enemy.isElite) continue;
            const dx = enemy.x - target.x;
            const dy = enemy.y - target.y;
            const d = Math.hypot(dx, dy) || 1;
            enemy.x += dx / d * 34;
            enemy.y += dy / d * 34;
            emitParticle(enemy.x, enemy.y, '#ff3d8b', 8, 3);
          }
          beamEffects.push({ x1: target.x, y1: target.y - 155, x2: target.x, y2: target.y + 8, color: '#ffd166', width: 12, life: 0.88, maxLife: 0.88, straight: true });
          groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: echo.radius || 110, life: 0.95, color: '#ff3d8b' });
          groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: (echo.radius || 110) + 42, life: 0.62, color: '#b95cff' });
          emitParticle(target.x, target.y, '#ff3d8b', 52, 8);
          emitParticle(target.x, target.y, '#ffd166', 24, 5);
          addDamageText(target.x, target.y - target.size - 20, echo.label || 'CROWN SWORD', '#ffd166', { sz: 14, bold: true });
          shake(11);
        }
      } else if (echo.type === 'lightning') {
        const len = echo.len || 220;
        const width = echo.width || 50;
        const angle = echo.angle || 0;
        let hits = 0;
        for (const enemy of enemies) {
          if (!isValidPlayerOffensiveTarget(enemy)) continue;
          const dx = enemy.x - echo.x;
          const dy = enemy.y - echo.y;
          const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
          if (proj < 0 || proj > len) continue;
          const perp = Math.abs(dx * -Math.sin(angle) + dy * Math.cos(angle));
          if (perp > width) continue;
          dealDamage(enemy, echo.dmg || Math.round((unit.dmg || 1) * 0.9), unit, 'magic');
          emitParticle(enemy.x, enemy.y, '#fff2a8', 10, 4);
          emitParticle(enemy.x, enemy.y, '#ffffff', 6, 3);
          hits++;
        }
        const endX = echo.x + Math.cos(angle) * len;
        const endY = echo.y + Math.sin(angle) * len;
        beamEffects.push({ x1: echo.x, y1: echo.y, x2: endX, y2: endY, life: 0.34, maxLife: 0.34, color: '#ffffff', width: 8, straight: true });
        beamEffects.push({ x1: echo.x, y1: echo.y - 8, x2: endX, y2: endY - 8, life: 0.28, maxLife: 0.28, color: '#ffd966', width: 4, straight: true });
        groundEffects.push({ x: echo.x + Math.cos(angle) * len * 0.55, y: echo.y + Math.sin(angle) * len * 0.55, r: 0, maxR: len * 0.44, life: 0.48, color: '#fff2a8', flatten: true });
        addDamageText(echo.x + Math.cos(angle) * len * 0.45, echo.y + Math.sin(angle) * len * 0.45 - 22, echo.label || 'SAINT AFTERIMAGE', '#fff2a8', { sz: 12, bold: true });
        if (hits) shake(7);
      } else if (echo.type === 'pillar') {
        let hits = 0;
        for (const enemy of enemies) {
          if (!isValidPlayerOffensiveTarget(enemy) || dist({ x: echo.x, y: echo.y }, enemy) > (echo.radius || 100)) continue;
          dealDamage(enemy, echo.dmg || Math.round((unit.dmg || 1) * 1.4), unit, 'magic');
          emitParticle(enemy.x, enemy.y, '#ffd966', 12, 5);
          emitParticle(enemy.x, enemy.y, '#dff5ff', 8, 3);
          hits++;
        }
        for (let j = 0; j < 7; j++) {
          const off = (j - 3) * 16;
          beamEffects.push({ x1: echo.x + off, y1: echo.y - 125, x2: echo.x + off * 0.25, y2: echo.y + 8, life: 0.38, maxLife: 0.38, color: j % 2 ? '#dff5ffcc' : '#ffd966cc', width: 3.5, straight: true });
        }
        groundEffects.push({ x: echo.x, y: echo.y, r: 0, maxR: echo.radius || 100, life: 0.76, color: '#ffd966' });
        groundEffects.push({ x: echo.x, y: echo.y, r: 0, maxR: (echo.radius || 100) + 42, life: 0.48, color: '#dff5ff' });
        addDamageText(echo.x, echo.y - 30, echo.label || 'EXALTED DETONATION', '#fff2a8', { sz: 13, bold: true });
        if (hits) shake(9);
      }
    }
  }
  if (!unit.divineRuinationEcho) return;
  unit.divineRuinationEcho.timer--;
  const echo = unit.divineRuinationEcho;
  const target = echo.target;
  if (echo.timer > 0) {
    if (frame % 4 === 0) emitParticle(echo.x, echo.y - 36, '#fff2a8', 2, 3);
    return;
  }
  unit.divineRuinationEcho = null;
  if (!isValidPlayerOffensiveTarget(target)) return;
  dealDamage(target, echo.dmg || Math.round((unit.dmg || 1) * 1.0), unit, 'magic');
  let splashHits = 0;
  for (const enemy of enemies) {
    if (enemy === target || !isValidPlayerOffensiveTarget(enemy) || dist(target, enemy) > (echo.radius || 64)) continue;
    dealDamage(enemy, echo.splashDmg || Math.round((unit.dmg || 1) * 0.45), unit, 'magic');
    emitParticle(enemy.x, enemy.y, '#ffd966', 8, 4);
    emitParticle(enemy.x, enemy.y, '#dff5ff', 5, 3);
    splashHits++;
  }
  beamEffects.push({ x1: target.x, y1: target.y - 95, x2: target.x, y2: target.y + 8, life: 0.30, maxLife: 0.30, color: '#fff2a8', width: 6, straight: true });
  groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: echo.radius || 62, life: 0.48, color: '#dff5ff' });
  emitParticle(target.x, target.y, '#ffd966', 28, 6);
  emitParticle(target.x, target.y, '#ffffff', 12, 4);
  addDamageText(target.x, target.y - target.size - 10, echo.label || 'RUINATION ECHO', '#fff2a8', { sz: 12, bold: true });
  if (splashHits) addDamageText(target.x, target.y + 18, 'ECHO SPLASH x' + splashHits, '#dff5ff', { sz: 11, bold: true });
  shake(8);
}
