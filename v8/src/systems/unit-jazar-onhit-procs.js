import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function applyJazarOnHitProcs(unit, target, {
  frame,
  ohTier,
  enemies,
  beamFx,
  groundEffects,
  randomRange,
  dealDamage,
  clampToArena,
  grantJazarGuard,
  showFlash,
  emitParticle,
  addDamageText,
  shake,
}) {
  const u = unit;
  const t = target;
  const _ohTier = ohTier;
  const rnd = randomRange;
  const groundFx = groundEffects;
  const addP = emitParticle;
  const addDmg = addDamageText;

  if (u.risingSlash) {
    u.risingSlash.counter++;
    if (u.risingSlash.counter >= u.risingSlash.every) {
      u.risingSlash.counter = 0;
      const bonusDamage = Math.round(u.dmg * (u.risingSlash.mult - 1));
      dealDamage(t, bonusDamage, u, 'normal');
      if (!t.isBoss) t.stunned = Math.max(t.stunned || 0, u.risingSlash.stunDur);
      const angle = Math.atan2(t.y - u.y, t.x - u.x);
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 35, life: 0.6, swipeArc: true, swipeAngle: angle - Math.PI / 2, color: '#ff8800' });
      addP(t.x, t.y - 8, '#ffcc00', 16, 5);
      addDmg(t.x, t.y - t.size - 6, 'RISING SLASH!', '#ff8800');
    }
  }

  if (u.mortalStrike && _ohTier === 3) {
    const bonusDamage = Math.round(u.dmg * (u.mortalStrike.mult - 1));
    dealDamage(t, bonusDamage, u, 'normal');
    t._healReduction = 0.50;
    t._healReductionTimer = 240;
    const angle = Math.atan2(t.y - u.y, t.x - u.x);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 38, life: 0.5, swipeArc: true, swipeAngle: angle + 0.5, color: '#ff4400' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 38, life: 0.5, swipeArc: true, swipeAngle: angle - 0.5, color: '#ff4400' });
    addP(t.x, t.y, '#ff4400', 20, 5);
    addDmg(t.x, t.y - t.size - 6, 'MORTAL STRIKE!', '#ff4400');
  }

  if (u.executeBlade && t.hp > 0 && t.hp < t.maxHp * u.executeBlade.threshold) {
    const executeDamage = Math.round(u.dmg * (u.executeBlade.mult - 1));
    dealDamage(t, executeDamage, u, 'normal');
    addP(t.x, t.y, '#ff2200', 12, 4);
    if (frame % 20 < 2) addDmg(t.x, t.y - t.size, 'EXECUTE!', '#ff2200');
  }

  if (u.windStep && t.hp <= 0) {
    let next = null;
    let nearestDistance = Infinity;
    for (const enemy of enemies) {
      if (enemy === t || enemy.hp <= 0) continue;
      const enemyDistance = dist(u, enemy);
      if (enemyDistance < 200 && enemyDistance < nearestDistance) {
        nearestDistance = enemyDistance;
        next = enemy;
      }
    }
    if (next) {
      const fromX = u.x;
      const fromY = u.y;
      addP(u.x, u.y, '#44ccff', 14, 4);
      for (let i = 0; i < 4; i++) {
        const angle = i / 4 * Math.PI * 2;
        addP(u.x + Math.cos(angle) * 12, u.y + Math.sin(angle) * 12, '#88eeff', 1, 2);
      }
      u.x = next.x;
      u.y = next.y + 10;
      clampToArena(u);
      u._iframes = u.windStep.iframeDur;
      grantJazarGuard(u, Math.round(3 * GAME_TICK_HZ), 0.35);
      beamFx.push({ x1: fromX, y1: fromY, x2: u.x, y2: u.y, color: '#44ccff99', width: 2.5, life: 0.18, maxLife: 0.18, straight: true });
      for (let i = 0; i < 6; i++) {
        const pct = i / 6;
        addP(fromX + (u.x - fromX) * pct, fromY + (u.y - fromY) * pct, '#88eeff', 1, 2);
      }
      addP(u.x, u.y, '#44ccff', 18, 5);
      addP(u.x, u.y, '#ffffff', 8, 3);
      addDmg(u.x, u.y - u.size, 'WIND STEP!', '#44ccff', { sz: 13, bold: true });
    }
  }

  if (u._thousandCutsTimer > 0) {
    let phantom = null;
    for (const enemy of enemies) {
      if (enemy !== t && enemy.hp > 0 && dist(u, enemy) < 100) {
        if (!phantom || Math.random() < 0.3) phantom = enemy;
      }
    }
    if (phantom) {
      dealDamage(phantom, Math.round(u.dmg * 0.6), u, 'normal');
      const color = u.branch === 'b' ? '#44ccff' : '#ffdd00';
      addP(phantom.x, phantom.y, color, 8, 3);
      groundFx.push({ x: phantom.x, y: phantom.y, r: 0, maxR: 25, life: 0.35, swipeArc: true, swipeAngle: Math.random() * Math.PI * 2, color });
    }
  }

  if (u._ragingBlow && _ohTier === 3 && t.hp > 0) {
    const blowDamage = Math.round(u.dmg * 0.40);
    dealDamage(t, blowDamage, u, 'normal');
    dealDamage(t, blowDamage, u, 'normal');
    addDmg(t.x - 8, t.y - t.size - 4, '-' + blowDamage, '#ff6622');
    addDmg(t.x + 8, t.y - t.size - 10, '-' + blowDamage, '#ff6622');
    const angle = Math.atan2(t.y - u.y, t.x - u.x);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 30, life: 0.3, swipeArc: true, swipeAngle: angle + 0.4, color: '#ff4400' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 30, life: 0.3, swipeArc: true, swipeAngle: angle - 0.4, color: '#ff4400' });
    addP(t.x, t.y, '#ff4400', 10, 3);
    addP(t.x, t.y, '#ff8844', 6, 2);
    for (let i = 0; i < 4; i++) addP(t.x + rnd(-10, 10), t.y + rnd(-10, 10), '#ff2200', 1.5, 2);
  }

  if (u._rampage && _ohTier === 5 && t.hp > 0) {
    const rampageDamage = Math.round(u.dmg * 0.35);
    for (let i = 0; i < 3; i++) {
      dealDamage(t, rampageDamage, u, 'normal');
      addDmg(t.x + rnd(-12, 12), t.y - t.size - rnd(0, 14), '-' + rampageDamage, '#ff8844');
      const angle = Math.atan2(t.y - u.y, t.x - u.x) + (i - 1) * 0.6;
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 25, life: 0.25, swipeArc: true, swipeAngle: angle, color: '#ff6622' });
    }
    const heal = Math.round(u.maxHp * (u.rampageHealPct || 0.035));
    u.hp = Math.min(u.maxHp, u.hp + heal);
    grantJazarGuard(u, Math.round(2 * GAME_TICK_HZ), u.bladeGuard && u.bladeGuard.dr || 0.30);
    addP(u.x, u.y, '#ff4400', 14, 4);
    addP(u.x, u.y - u.size, '#44ff44', 6, 2);
    addDmg(u.x, u.y - u.size - 6, 'RAMPAGE!', '#ff6622');
  }

  if (u._warbreaker && _ohTier === 10 && t.hp > 0) {
    const radius = 80;
    const warbreakerDamage = Math.round(u.dmg * 1.20);
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || dist(u, enemy) > radius) continue;
      dealDamage(enemy, warbreakerDamage, u, 'normal');
      enemy.armorBreak = (enemy.armorBreak || 0) + 3;
      enemy.armorBreakTimer = 5 * GAME_TICK_HZ;
      addP(enemy.x, enemy.y, '#ff4400', 12, 4);
      addDmg(enemy.x, enemy.y - enemy.size, '-' + warbreakerDamage, '#ff4400');
    }
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: radius * 1.2, life: 0.6, color: '#ff4400' });
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: radius * 0.5, life: 0.35, color: '#ff8844' });
    for (let i = 0; i < 16; i++) {
      const angle = Math.PI * 2 * i / 16;
      addP(u.x + Math.cos(angle) * radius * 0.7, u.y + Math.sin(angle) * radius * 0.7, '#ff4400', 2, 4);
    }
    for (let i = 0; i < 8; i++) addP(u.x + rnd(-15, 15), u.y + rnd(-15, 15), '#ff2200', 2, 3);
    addDmg(u.x, u.y - u.size - 10, 'WARBREAKER!', '#ff4400');
    showFlash('WARBREAKER', '#ff4400', 30);
    shake(8);
  }
}
