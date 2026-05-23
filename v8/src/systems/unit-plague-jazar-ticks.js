import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';
import { limitBurstLanding } from './combat-targeting.js';
import { isValidPlayerOffensiveTarget } from './player-target-validity.js';

export function tickUnitPlagueAndJazarPassives(unit, {
  frame,
  units,
  enemies,
  beamEffects,
  groundEffects,
  randomRange,
  dealDamage,
  clampToArena,
  clampToLeash,
  grantJazarGuard,
  triggerJazarSignatureSurge,
  addHealFx,
  emitParticle,
  addDamageText,
  showFlash,
  playHeavySlash,
  shake,
}) {
  tickPlagueDot(unit, { frame, units, enemies, dealDamage, emitParticle });
  tickRaiseGhoulCount(unit, { units });
  tickBladeGuard(unit, { frame, randomRange, groundEffects, emitParticle });
  tickBladeRush(unit, { enemies, beamEffects, groundEffects, randomRange, dealDamage, clampToArena, clampToLeash, grantJazarGuard, emitParticle, addDamageText, playHeavySlash, shake });
  tickBladeStormChannel(unit, { enemies, beamEffects, groundEffects, dealDamage, emitParticle, addDamageText });
  tickShadowClone(unit, { emitParticle });
  tickOmnislash(unit, { beamEffects, groundEffects, randomRange, dealDamage, clampToArena, clampToLeash, triggerJazarSignatureSurge, emitParticle, addDamageText, shake });
  tickBladeDance(unit, { enemies, groundEffects, dealDamage, emitParticle, addDamageText });
  tickEnrageBlade(unit, { addHealFx, grantJazarGuard, emitParticle, addDamageText, showFlash, shake });
  tickThousandCuts(unit);
  tickArmorShred(unit);
}

function tickPlagueDot(unit, {
  frame,
  units,
  enemies,
  dealDamage,
  emitParticle,
}) {
  if (!(unit.plagueTimer > 0)) return;

  unit.plagueTimer--;
  if (frame % GAME_TICK_HZ === 0 && unit.plagueDmg > 0) {
    dealDamage(unit, unit.plagueDmg, unit.plagueFrom || null, 'magic');
    emitParticle(unit.x, unit.y, '#55aa33', 3, 2);
  }
  if (unit.plagueTimer > 0 || !(unit.plagueSpreadRadius > 0)) return;

  for (const nearby of (unit.isPlayer ? units : enemies)) {
    if (nearby.hp <= 0 || nearby === unit) continue;
    if (dist(unit, nearby) > unit.plagueSpreadRadius) continue;
    if (nearby.plagueTimer && nearby.plagueTimer >= 2 * GAME_TICK_HZ) continue;
    nearby.plagueTimer = unit.plagueDur || 3 * GAME_TICK_HZ;
    nearby.plagueDmg = unit.plagueDmg;
    nearby.plagueFrom = unit.plagueFrom;
    nearby.plagueSpreadRadius = 0;
    emitParticle(nearby.x, nearby.y, '#55aa33', 6, 3);
  }
}

function tickRaiseGhoulCount(unit, { units }) {
  if (!unit.raiseGhoul) return;

  let count = 0;
  for (const minion of units) {
    if (minion.isMinion && minion.parent === unit && minion.kind === 'ghoul' && minion.hp > 0) count++;
  }
  unit.raiseGhoul.active = count;
}

function tickBladeGuard(unit, {
  frame,
  randomRange,
  groundEffects,
  emitParticle,
}) {
  if (!(unit.bladeGuardTimer > 0)) return;

  unit.bladeGuardTimer--;
  if (frame % 8 === 0) {
    emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y + randomRange(-unit.size * 0.4, unit.size * 0.3), '#44ccff', 1.5, 2);
    if (frame % 24 === 0) groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.size + 12, life: 0.18, color: '#44ccff' });
  }
  if (unit.bladeGuardTimer <= 0) unit.bladeGuardDR = 0;
}

function tickBladeRush(unit, {
  enemies,
  beamEffects,
  groundEffects,
  randomRange,
  dealDamage,
  clampToArena,
  clampToLeash,
  grantJazarGuard,
  emitParticle,
  addDamageText,
  playHeavySlash,
  shake,
}) {
  if (!unit.bladeRush) return;

  unit.bladeRush.cd++;
  if (unit.bladeRush.cd < unit.bladeRush.every) return;

  let best = null;
  let bestDistance = Infinity;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const distance = dist(unit, enemy);
    if (distance < unit.bladeRush.radius && distance < bestDistance) {
      bestDistance = distance;
      best = enemy;
    }
  }
  if (!best) return;

  unit.bladeRush.cd = 0;
  const fromX = unit.x;
  const fromY = unit.y;
  const angle = Math.atan2(best.y - unit.y, best.x - unit.x);
  const landing = limitBurstLanding(unit, best.x, best.y + 15, unit.bladeRush.maxDash || 135);
  const toX = landing.x;
  const toY = landing.y;
  let hit = 0;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const enemyX = enemy.x - fromX;
    const enemyY = enemy.y - fromY;
    const lineX = toX - fromX;
    const lineY = toY - fromY;
    const lineLength = Math.sqrt(lineX * lineX + lineY * lineY) || 1;
    const t = Math.max(0, Math.min(1, (enemyX * lineX + enemyY * lineY) / (lineLength * lineLength)));
    const pointX = fromX + lineX * t;
    const pointY = fromY + lineY * t;
    if (Math.hypot(enemy.x - pointX, enemy.y - pointY) <= unit.bladeRush.width) {
      dealDamage(enemy, Math.round(unit.dmg * unit.bladeRush.dmgMult), unit, 'normal');
      emitParticle(enemy.x, enemy.y, '#ff8800', 12, 4);
      hit++;
    }
  }
  unit.x = toX;
  unit.y = toY;
  if (typeof clampToLeash === 'function') clampToLeash(unit);
  else clampToArena(unit);
  grantJazarGuard(unit, Math.round(3 * GAME_TICK_HZ), unit.bladeGuard && unit.bladeGuard.dr || 0.32);
  beamEffects.push({ x1: fromX, y1: fromY, x2: unit.x, y2: unit.y, color: '#ff880088', width: 4, life: 0.2, maxLife: 0.2, straight: true });
  beamEffects.push({ x1: fromX, y1: fromY, x2: unit.x, y2: unit.y, color: '#ffcc4444', width: 2, life: 0.15, maxLife: 0.15, straight: true });
  for (let i = 0; i < 12; i++) {
    const fraction = i / 12;
    emitParticle(fromX + (unit.x - fromX) * fraction + randomRange(-3, 3), fromY + (unit.y - fromY) * fraction + randomRange(-3, 3), '#ff8800', 1.5, 3);
  }
  for (let i = 0; i < 4; i++) {
    const fraction = i / 4;
    emitParticle(fromX + (unit.x - fromX) * fraction, fromY + (unit.y - fromY) * fraction, '#ffffff', 1, 2);
  }
  groundEffects.push({ x: (fromX + unit.x) / 2, y: (fromY + unit.y) / 2, r: 0, maxR: Math.max(30, dist({ x: fromX, y: fromY }, unit) / 2), life: 0.5, swipeArc: true, swipeAngle: angle, color: '#ff8800' });
  emitParticle(unit.x, unit.y, '#ffcc44', 14, 4);
  if (hit) {
    addDamageText(unit.x, unit.y - unit.size, 'BLADE RUSH!', '#ff8800', { sz: 14, bold: true });
    shake(6);
    playHeavySlash();
  }
}

function tickBladeStormChannel(unit, {
  enemies,
  beamEffects,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
}) {
  if (!(unit._bladeStormTimer > 0)) return;

  unit._bladeStormTimer--;
  unit._bladeStormTick++;
  if (unit._bladeStormTick % 12 === 0) {
    const angle = Math.PI * 2 * (unit._bladeStormTick / 12) / 5;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && dist(unit, enemy) < 75) {
        dealDamage(enemy, Math.round(unit.dmg * 0.8), unit, 'normal');
        emitParticle(enemy.x, enemy.y, '#ffaa44', 4, 3);
        emitParticle(enemy.x, enemy.y, '#ffffff', 2, 2);
      }
    }
    for (let i = 0; i < 3; i++) {
      const beamAngle = angle + Math.PI * 2 * i / 3;
      beamEffects.push({ x1: unit.x, y1: unit.y, x2: unit.x + Math.cos(beamAngle) * 70, y2: unit.y + Math.sin(beamAngle) * 70, color: '#ff8800', width: 2.5, life: 0.18, maxLife: 0.18, straight: true });
    }
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 75, life: 0.25, color: '#ff880044' });
  }
  if (unit._bladeStormTimer <= 0) addDamageText(unit.x, unit.y - unit.size, 'STORM END', '#ff8800');
}

function tickShadowClone(unit, {
  emitParticle,
}) {
  if (!unit._isClone) return;

  unit._cloneTimer--;
  if (unit._cloneTimer <= 0) {
    unit.hp = 0;
    emitParticle(unit.x, unit.y, '#ff8c0088', 12, 3);
  }
}

function tickOmnislash(unit, {
  beamEffects,
  groundEffects,
  randomRange,
  dealDamage,
  clampToArena,
  clampToLeash,
  triggerJazarSignatureSurge,
  emitParticle,
  addDamageText,
  shake,
}) {
  if (!unit._omnislashActive) return;

  unit._omnislashTimer++;
  if (unit._omnislashTimer < unit._omnislashDur) return;

  unit._omnislashTimer = 0;
  const target = unit._omnislashTargets[unit._omnislashIdx];
  if (isValidPlayerOffensiveTarget(target)) {
    const fromX = unit.x;
    const fromY = unit.y;
    const maxStep = unit._omnislashMaxStep || 135;
    if (Math.hypot(target.x - fromX, target.y - fromY) > maxStep) {
      unit._omnislashIdx++;
      return;
    }
    const landing = limitBurstLanding(unit, target.x, target.y, maxStep);
    unit.x = landing.x;
    unit.y = landing.y;
    if (typeof clampToLeash === 'function') clampToLeash(unit);
    dealDamage(target, Math.round(unit.dmg * 2.0), unit, 'normal');
    const angle = Math.atan2(target.y - fromY, target.x - fromX);
    beamEffects.push({ x1: fromX, y1: fromY, x2: target.x, y2: target.y, color: '#ffaa0088', width: 3, life: 0.15, maxLife: 0.15, straight: true });
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 30, life: 0.35, swipeArc: true, swipeAngle: angle + randomRange(-0.3, 0.3), color: '#ffcc00' });
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 22, life: 0.25, swipeArc: true, swipeAngle: angle + Math.PI * 0.5, color: '#ff8800' });
    emitParticle(target.x, target.y, '#ff8800', 16, 5);
    emitParticle(target.x, target.y, '#ffffff', 6, 3);
    emitParticle(fromX, fromY, '#ffaa0044', 6, 2);
    for (let i = 0; i < 6; i++) {
      const fraction = i / 6;
      emitParticle(fromX + (target.x - fromX) * fraction, fromY + (target.y - fromY) * fraction, '#ffaa00', 1, 3);
    }
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 44, life: 0.28, color: '#ffcc00' });
    shake(5);
  }
  unit._omnislashIdx++;
  if (unit._omnislashIdx < unit._omnislashTargets.length) return;

  unit._omnislashActive = false;
  unit._omnislashImmune = false;
  unit.untargetable = false;
  if (typeof clampToLeash === 'function') clampToLeash(unit);
  else clampToArena(unit);
  for (let i = 0; i < 4; i++) groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 55 + i * 22, life: 0.35 + i * 0.08, color: i % 2 ? '#ffffff' : '#ffcc00' });
  addDamageText(unit.x, unit.y - unit.size, 'OMNISLASH!', '#ffcc00');
  shake(10);
  emitParticle(unit.x, unit.y, '#ffcc00', 24, 6);
  triggerJazarSignatureSurge(unit, 5, { color: '#ffcc00', label: 'OMNI HASTE!' });
}

function tickBladeDance(unit, {
  enemies,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
}) {
  if (!unit.bladeDance) return;

  unit.bladeDance.cd++;
  if (unit.bladeDance.cd < unit.bladeDance.every) return;

  let hit = 0;
  for (const enemy of enemies) {
    if (enemy.hp > 0 && dist(unit, enemy) < unit.bladeDance.radius) {
      dealDamage(enemy, Math.round(unit.dmg * unit.bladeDance.mult), unit, 'normal');
      emitParticle(enemy.x, enemy.y, '#44ccff', 8, 3);
      hit++;
    }
  }
  if (!hit) return;

  unit.bladeDance.cd = 0;
  groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.bladeDance.radius, life: 0.5, swipeSlam: true, color: '#44ccff' });
  addDamageText(unit.x, unit.y - unit.size, 'BLADE DANCE!', '#44ccff');
  emitParticle(unit.x, unit.y, '#44ccff', 16, 4);
}

function tickEnrageBlade(unit, {
  addHealFx,
  grantJazarGuard,
  emitParticle,
  addDamageText,
  showFlash,
  shake,
}) {
  if (unit.enrageBlade && !unit.enrageBlade.active && unit.hp < unit.maxHp * unit.enrageBlade.threshold && unit.hp > 0) {
    unit.enrageBlade.active = true;
    unit._enrageTimer = unit.enrageBlade.dur;
    unit._enrageOrigAtkSpd = unit.atkSpd;
    unit._enrageOrigDmg = unit.dmg;
    unit.atkSpd = Math.max(12, Math.round(unit.atkSpd / unit.enrageBlade.spdMult));
    unit.dmg = Math.round(unit.dmg * unit.enrageBlade.dmgMult);
    const heal = Math.round(unit.maxHp * 0.16);
    unit.hp = Math.min(unit.maxHp, unit.hp + heal);
    addHealFx(unit.x, unit.y, heal);
    grantJazarGuard(unit, Math.round(4 * GAME_TICK_HZ), 0.35);
    unit._enraged = true;
    emitParticle(unit.x, unit.y, '#ff2200', 28, 6);
    addDamageText(unit.x, unit.y - unit.size, 'ENRAGED!', '#ff4400');
    showFlash('ENRAGE!', '#ff4400', 50);
    shake(8);
  }
  if (!(unit._enrageTimer > 0)) return;

  unit._enrageTimer--;
  if (unit._enrageTimer <= 0) {
    unit._enraged = false;
    unit.enrageBlade.active = false;
    unit.atkSpd = unit._enrageOrigAtkSpd;
    unit.dmg = unit._enrageOrigDmg;
    addDamageText(unit.x, unit.y - unit.size, 'ENRAGE FADED', '#996600');
  }
}

function tickThousandCuts(unit) {
  if (!(unit._thousandCutsTimer > 0)) return;

  unit._thousandCutsTimer--;
  if (unit._thousandCutsTimer <= 0 && unit._origAtkSpd) {
    unit.atkSpd = unit._origAtkSpd;
    delete unit._origAtkSpd;
  }
}

function tickArmorShred(unit) {
  if (!(unit._armorShredTimer > 0)) return;

  unit._armorShredTimer--;
  if (unit._armorShredTimer <= 0) unit._armorShred = 0;
}
