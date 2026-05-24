import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';
import { limitBurstLanding } from './combat-targeting.js';

function roninSenStacks(u) {
  return Math.min(3, u.azureSenStacks || 0);
}

function roninDamageMult(u) {
  const cfg = u.roninDragoonCombo || {};
  return 1 + roninSenStacks(u) * (cfg.senDmgPerStack || 0.03);
}

function syncRoninSenStacks(u) {
  const flags = u.azureSenFlags || {};
  u.azureSenStacks = Math.min(3, (flags.setsu ? 1 : 0) + (flags.getsu ? 1 : 0) + (flags.ka ? 1 : 0));
}

function grantRoninSen(u, key) {
  if (!u.azureSenFlags) u.azureSenFlags = { setsu: false, getsu: false, ka: false };
  u.azureSenFlags[key] = true;
  syncRoninSenStacks(u);
}

function grantRoninThirdEye(u) {
  const cfg = u.thirdEye || u.roninDragoonCombo || {};
  u.thirdEyeTimer = Math.max(u.thirdEyeTimer || 0, cfg.dur || cfg.thirdEyeDur || Math.round(1.5 * GAME_TICK_HZ));
  u.thirdEyeDR = Math.max(u.thirdEyeDR || 0, cfg.dr || cfg.thirdEyeDr || 0.20);
}

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

  if (u.unitIdx === 13 && u.roninDragoonCombo && t.hp > 0) {
    const cfg = u.roninDragoonCombo;
    if (_ohTier === 3) {
      const bonusDamage = Math.round(u.dmg * (cfg.hakazeMult || 0.65) * roninDamageMult(u));
      dealDamage(t, bonusDamage, u, 'normal');
      grantRoninSen(u, 'setsu');
      const angle = Math.atan2(t.y - u.y, t.x - u.x);
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 42, life: 0.45, swipeArc: true, swipeAngle: angle, color: '#ffd166' });
      beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, color: '#ffd166aa', width: 2.5, life: 0.18, maxLife: 0.18, straight: true });
      addP(t.x, t.y, '#ffd166', 16, 4);
      addP(t.x, t.y, '#ffffff', 6, 2);
      addDmg(t.x, t.y - t.size - 6, 'HAKAZE THRUST', '#ffd166', { sz: 12, bold: true });
    }
    if (_ohTier === 5) {
      const fromX = u.x;
      const fromY = u.y;
      const angle = Math.atan2(t.y - u.y, t.x - u.x);
      const land = limitBurstLanding(u, t.x - Math.cos(angle) * 18, t.y - Math.sin(angle) * 18, 90);
      u.x = land.x;
      u.y = land.y;
      if (typeof clampToArena === 'function') clampToArena(u);
      const damage = Math.round(u.dmg * (cfg.gekkoMult || 1.25) * roninDamageMult(u));
      dealDamage(t, damage, u, 'normal');
      let splashHits = 0;
      const radius = cfg.gekkoSplashRadius || 55;
      const splashDamage = Math.round(u.dmg * (cfg.gekkoSplashMult || 0.45) * roninDamageMult(u));
      for (const enemy of enemies) {
        if (enemy === t || enemy.hp <= 0 || dist(t, enemy) > radius) continue;
        dealDamage(enemy, splashDamage, u, 'normal');
        addP(enemy.x, enemy.y, '#48c7ff', 8, 3);
        splashHits++;
      }
      grantRoninSen(u, 'getsu');
      grantRoninThirdEye(u);
      beamFx.push({ x1: fromX, y1: fromY, x2: u.x, y2: u.y, color: '#48c7ffaa', width: 5, life: 0.24, maxLife: 0.24, straight: true });
      beamFx.push({ x1: fromX, y1: fromY - 18, x2: u.x, y2: u.y, color: '#ffffffaa', width: 2, life: 0.20, maxLife: 0.20, straight: true });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: radius, life: 0.45, color: '#48c7ff' });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: radius + 24, life: 0.34, color: '#ff4f5e' });
      addP(t.x, t.y, '#48c7ff', 24, 5);
      addP(u.x, u.y, '#7fd7ff', 10, 3);
      addDmg(t.x, t.y - t.size - 8, 'GEKKO DIVE', '#48c7ff', { sz: 13, bold: true });
      if (splashHits) addDmg(t.x, t.y + 16, 'SPLASH x' + splashHits, '#7fd7ff', { sz: 11, bold: true });
      u.roninEchoes = u.roninEchoes || [];
      u.roninEchoes.push({ type: 'gekko', timer: 9, x: t.x, y: t.y, radius: radius + 34, dmg: Math.round(u.dmg * 0.95 * roninDamageMult(u)), label: 'DRAGOON AFTERIMAGE' });
    }
    if (_ohTier === 10) {
      const angle = Math.atan2(t.y - u.y, t.x - u.x);
      const primaryDamage = Math.round(u.dmg * (cfg.nastrondMult || 2.20) * roninDamageMult(u));
      dealDamage(t, primaryDamage, u, 'normal');
      const lineDamage = Math.round(u.dmg * (cfg.nastrondLineMult || 1.10) * roninDamageMult(u));
      const len = cfg.nastrondLength || 210;
      const width = cfg.nastrondWidth || 54;
      let lineHits = 0;
      for (const enemy of enemies) {
        if (enemy === t || enemy.hp <= 0) continue;
        const ex = enemy.x - u.x;
        const ey = enemy.y - u.y;
        const proj = ex * Math.cos(angle) + ey * Math.sin(angle);
        if (proj < 0 || proj > len) continue;
        const perp = Math.abs(ex * -Math.sin(angle) + ey * Math.cos(angle));
        if (perp > width) continue;
        dealDamage(enemy, lineDamage, u, 'normal');
        addP(enemy.x, enemy.y, '#48c7ff', 10, 3);
        addP(enemy.x, enemy.y, '#ff4f5e', 6, 3);
        lineHits++;
      }
      grantRoninSen(u, 'ka');
      grantRoninThirdEye(u);
      const endX = u.x + Math.cos(angle) * len;
      const endY = u.y + Math.sin(angle) * len;
      beamFx.push({ x1: u.x, y1: u.y, x2: endX, y2: endY, color: '#48c7ffcc', width: 7, life: 0.28, maxLife: 0.28, straight: true });
      beamFx.push({ x1: u.x, y1: u.y, x2: endX, y2: endY, color: '#ff4f5ecc', width: 3.5, life: 0.24, maxLife: 0.24, straight: true });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 86, life: 0.55, color: '#ff4f5e', swipeArc: true, swipeAngle: angle });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 62, life: 0.38, color: '#48c7ff' });
      for (let i = 0; i < 5; i++) {
        const f = (i + 1) / 6;
        groundFx.push({ x: u.x + Math.cos(angle) * len * f, y: u.y + Math.sin(angle) * len * f, r: 0, maxR: 28 + i * 8, life: 0.36, color: i % 2 ? '#48c7ff' : '#ff4f5e' });
      }
      addP(t.x, t.y, '#ff4f5e', 32, 5);
      addP(t.x, t.y, '#48c7ff', 24, 5);
      addDmg(t.x, t.y - t.size - 10, 'MIDARE NASTROND', '#ff4f5e', { sz: 14, bold: true });
      if (lineHits) addDmg(t.x, t.y + 20, 'LINE x' + lineHits, '#48c7ff', { sz: 11, bold: true });
      u.roninEchoes = u.roninEchoes || [];
      u.roninEchoes.push({ type: 'nastrond', timer: 11, x: u.x, y: u.y, angle, len, width: width + 22, dmg: Math.round(u.dmg * 1.20 * roninDamageMult(u)), label: 'NASTROND ECHO' });
      showFlash('MIDARE NASTROND', '#48c7ff', 35);
      shake(7);
    }
  }

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
