import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

function kingHolySwordCfg(u) {
  return u && u.unitIdx === 3 && !u.branch ? (u.holySwordSaintCombo || null) : null;
}

function kingSealStacks(u, target) {
  if (!u || !target || target.judgmentSealSource !== u || !(target.judgmentSealTimer > 0)) return 0;
  return Math.min(3, target.judgmentSealStacks || 0);
}

function applyKingJudgmentSeal(u, target, addP, addDmg) {
  const cfg = kingHolySwordCfg(u);
  if (!cfg || !u.judgmentSeals || !target || target.hp <= 0) return 0;
  const maxStacks = cfg.sealMax || u.judgmentSealMax || 3;
  if (target.judgmentSealSource !== u || !(target.judgmentSealTimer > 0)) target.judgmentSealStacks = 0;
  target.judgmentSealSource = u;
  target.judgmentSealStacks = Math.min(maxStacks, (target.judgmentSealStacks || 0) + 1);
  target.judgmentSealTimer = cfg.sealDur || 7 * GAME_TICK_HZ;
  if (addP) {
    addP(target.x, target.y, '#ffd966', 8, 3);
    addP(target.x, target.y, '#dff5ff', 4, 2);
  }
  if (addDmg && target.judgmentSealStacks >= maxStacks) addDmg(target.x, target.y - target.size - 16, '3 SEALS', '#fff2a8', { sz: 11, bold: true });
  return target.judgmentSealStacks;
}

function grantKingCrystalGuard(u, dr, dur) {
  if (!u || u.unitIdx !== 3 || u.branch) return;
  u.crystalGuardDR = Math.max(u.crystalGuardDR || 0, dr || 0.08);
  u.crystalGuardTimer = Math.max(u.crystalGuardTimer || 0, dur || 3 * GAME_TICK_HZ);
}

function grantKingSaintSwiftness(u) {
  const cfg = kingHolySwordCfg(u);
  if (!cfg) return;
  u.saintSwiftnessAtkMult = cfg.saintSwiftnessAtkMult || 0.90;
  u.saintSwiftnessTimer = Math.max(u.saintSwiftnessTimer || 0, cfg.saintSwiftnessDur || 3 * GAME_TICK_HZ);
}

function grantKingExaltedEdge(u) {
  const cfg = kingHolySwordCfg(u);
  if (!cfg) return;
  u.exaltedEdgeMult = cfg.exaltedEdgeMult || 1.10;
  u.exaltedEdgeTimer = Math.max(u.exaltedEdgeTimer || 0, cfg.exaltedEdgeDur || 4 * GAME_TICK_HZ);
}

export function applyZaytOnHitProcs(unit, target, {
  arena,
  frame,
  ohTier,
  damage,
  isCrit,
  units,
  enemies,
  projectiles,
  beamFx,
  groundEffects,
  randomRange,
  dealDamage,
  fireDivineStorm,
  addGoldShield,
  applyHealingReceived,
  beaconSplash,
  findLowestAlly,
  soundEffects,
  showFlash,
  addHealFx,
  emitParticle,
  addDamageText,
  shake,
}) {
  const u = unit;
  const t = target;
  const _ohTier = ohTier;
  const dmg = damage;
  const groundFx = groundEffects;
  const rnd = randomRange;
  const addP = emitParticle;
  const addDmg = addDamageText;
  const SFX = soundEffects;

  const swordCfg = kingHolySwordCfg(u);
  if (swordCfg && _ohTier > 0 && t.hp > 0) {
    const angle = Math.atan2(t.y - u.y, t.x - u.x);
    if (_ohTier === 3) {
      applyKingJudgmentSeal(u, t, addP, addDmg);
      const stasisDamage = Math.round((u.dmg || dmg || 1) * (swordCfg.stasisMult || 0.75));
      dealDamage(t, stasisDamage, u, 'magic');
      if (t.isBoss || t.elite || t.isElite) {
        t.slowTimer = Math.max(t.slowTimer || 0, swordCfg.stasisBossSlowDur || Math.round(1.5 * GAME_TICK_HZ));
        t.slowMult = Math.min(t.slowMult || 1, swordCfg.stasisBossSlow || 0.75);
      } else {
        t.stunned = Math.max(t.stunned || 0, swordCfg.stasisStunDur || Math.round(0.7 * GAME_TICK_HZ));
      }
      grantKingCrystalGuard(u, swordCfg.crystalGuardDr || 0.08, swordCfg.crystalGuardDur || 3 * GAME_TICK_HZ);
      beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.22, maxLife: 0.22, color: '#fff2a8', width: 4, straight: true });
      beamFx.push({ x1: t.x - Math.cos(angle + Math.PI / 2) * 24, y1: t.y - Math.sin(angle + Math.PI / 2) * 24, x2: t.x + Math.cos(angle + Math.PI / 2) * 24, y2: t.y + Math.sin(angle + Math.PI / 2) * 24, life: 0.18, maxLife: 0.18, color: '#dff5ff', width: 3, straight: true });
      beamFx.push({ x1: t.x - Math.cos(angle) * 24, y1: t.y - Math.sin(angle) * 24, x2: t.x + Math.cos(angle) * 24, y2: t.y + Math.sin(angle) * 24, life: 0.18, maxLife: 0.18, color: '#ffd966', width: 3, straight: true });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 42, life: 0.42, color: '#dff5ff' });
      addP(t.x, t.y, '#ffd966', 18, 4);
      addP(t.x, t.y, '#dff5ff', 10, 3);
      addDmg(t.x, t.y - t.size - 8, 'STASIS SWORD', '#fff2a8', { sz: 12, bold: true, outline: '#5a4a10' });
      u.swordSaintCycle = 'lightning';
      if (SFX.holyLight) SFX.holyLight();
    }

    if (_ohTier === 5) {
      applyKingJudgmentSeal(u, t, addP, addDmg);
      const primaryDamage = Math.round((u.dmg || dmg || 1) * (swordCfg.lightningMult || 1.35));
      const lineDamage = Math.round((u.dmg || dmg || 1) * (swordCfg.lightningLineMult || 0.55));
      dealDamage(t, primaryDamage, u, 'magic');
      let lineHits = 0;
      const length = swordCfg.lightningLineLength || 175;
      const width = swordCfg.lightningLineWidth || 34;
      for (const enemy of enemies) {
        if (enemy === t || enemy.hp <= 0) continue;
        const dx = enemy.x - u.x;
        const dy = enemy.y - u.y;
        const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
        if (proj < 0 || proj > length) continue;
        const perp = Math.abs(dx * -Math.sin(angle) + dy * Math.cos(angle));
        if (perp > width) continue;
        dealDamage(enemy, lineDamage, u, 'magic');
        addP(enemy.x, enemy.y, '#fff2a8', 8, 3);
        addP(enemy.x, enemy.y, '#ffffff', 4, 2);
        lineHits++;
      }
      grantKingSaintSwiftness(u);
      beamFx.push({ x1: u.x, y1: u.y, x2: u.x + Math.cos(angle) * length, y2: u.y + Math.sin(angle) * length, life: 0.24, maxLife: 0.24, color: '#fff2a8', width: 6, straight: true });
      beamFx.push({ x1: u.x, y1: u.y - 6, x2: u.x + Math.cos(angle) * length, y2: u.y + Math.sin(angle) * length - 6, life: 0.18, maxLife: 0.18, color: '#ffffff', width: 2, straight: true });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 50, life: 0.36, swipeArc: true, swipeAngle: angle, color: '#ffd966' });
      addP(t.x, t.y, '#ffd966', 20, 4);
      addP(t.x, t.y, '#ffffff', 10, 3);
      addDmg(t.x, t.y - t.size - 8, 'LIGHTNING STAB', '#fff2a8', { sz: 13, bold: true, outline: '#5a4a10' });
      if (lineHits) addDmg(t.x, t.y + 16, 'LINE x' + lineHits, '#ffffff', { sz: 10, bold: true });
      u.swordSaintCycle = 'holy';
      if (SFX.holyLight) SFX.holyLight();
    }

    if (_ohTier === 10) {
      const stacks = applyKingJudgmentSeal(u, t, addP, addDmg);
      const fullSealBonus = stacks >= (swordCfg.sealMax || 3) ? (1 + (swordCfg.holyExplosionFullSealBonus || 0.20)) : 1;
      const primaryDamage = Math.round((u.dmg || dmg || 1) * (swordCfg.holyExplosionMult || 2.35) * fullSealBonus);
      const splashDamage = Math.round((u.dmg || dmg || 1) * (swordCfg.holyExplosionSplashMult || 1.15) * fullSealBonus);
      const radius = swordCfg.holyExplosionRadius || 85;
      dealDamage(t, primaryDamage, u, 'magic');
      let splashHits = 0;
      for (const enemy of enemies) {
        if (enemy === t || enemy.hp <= 0 || dist(t, enemy) > radius) continue;
        dealDamage(enemy, splashDamage, u, 'magic');
        addP(enemy.x, enemy.y, '#ffd966', 12, 4);
        addP(enemy.x, enemy.y, '#dff5ff', 6, 3);
        splashHits++;
      }
      grantKingExaltedEdge(u);
      beamFx.push({ x1: t.x, y1: t.y - 90, x2: t.x, y2: t.y + 12, life: 0.34, maxLife: 0.34, color: '#fff2a8', width: 8, straight: true });
      beamFx.push({ x1: t.x - 12, y1: t.y - 70, x2: t.x + 12, y2: t.y + 8, life: 0.28, maxLife: 0.28, color: '#dff5ff', width: 3, straight: true });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: radius, life: 0.68, color: '#ffd966' });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: radius + 34, life: 0.4, color: '#dff5ff' });
      addP(t.x, t.y, '#ffd966', 34, 6);
      addP(t.x, t.y, '#ffffff', 14, 4);
      addDmg(t.x, t.y - t.size - 12, 'HOLY EXPLOSION', '#fff2a8', { sz: 14, bold: true, outline: '#5a4a10' });
      if (splashHits) addDmg(t.x, t.y + 20, 'SPLASH x' + splashHits, '#fff2a8', { sz: 11, bold: true });
      showFlash('HOLY EXPLOSION', '#fff2a8', 42);
      shake(9);
      u.swordSaintCycle = 'stasis';
      if (SFX.holyLight) SFX.holyLight();
    }
  }

  if (u.whirlwind) {
    u.whirlwind.counter++;
    if (u.whirlwind.counter >= u.whirlwind.every) {
      u.whirlwind.counter = 0;
      let hit = 0;
      for (const enemy of enemies) {
        if (enemy === t || enemy.hp <= 0) continue;
        if (dist(u, enemy) <= u.whirlwind.radius) {
          dealDamage(enemy, Math.round(dmg * u.whirlwind.mult), u, 'normal');
          hit++;
        }
      }
      if (hit > 0) {
        addDmg(u.x, u.y - u.size - 4, 'WHIRLWIND!', '#ffe066');
        u.whirlwindFx = 24;
        u.whirlwindFxR = u.whirlwind.radius;
        groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.whirlwind.radius, life: 0.45, color: '#ffe066' });
        for (let i = 0; i < 14; i++) {
          const angle = Math.PI * 2 * i / 14 + frame * 0.3;
          addP(u.x + Math.cos(angle) * u.whirlwind.radius * 0.75, u.y + Math.sin(angle) * u.whirlwind.radius * 0.75, '#ffffff', 1, 3);
          addP(u.x + Math.cos(angle) * u.whirlwind.radius * 0.55, u.y + Math.sin(angle) * u.whirlwind.radius * 0.55, '#ffe066', 1, 2);
        }
        shake(4);
      }
    }
  }

  if (u.divineStorm) {
    u.divineStorm.counter++;
    if (u.divineStorm.counter >= u.divineStorm.every) {
      u.divineStorm.counter = 0;
      fireDivineStorm(u);
    }
  }

  if (u.artOfWar && isCrit) {
    if (u.abilCD && u.abilCD.bladeOfWrath > GAME_TICK_HZ) {
      u.abilCD.bladeOfWrath = 0;
      addDmg(u.x, u.y - u.size - 8, 'ART OF WAR!', '#ffe066');
      addP(u.x, u.y, '#ffe066', 10, 3);
    }
  }

  if (u.hammerOfWrath && t.hp > 0 && t.hp < t.maxHp * 0.35) {
    const hammerDamage = Math.round(u.dmg * 1.0);
    dealDamage(t, hammerDamage, u, 'magic');
    addP(t.x, t.y, '#ffd700', 10, 4);
    if (frame % 30 < 2) addDmg(t.x, t.y - t.size - 4, 'HAMMER!', '#ffd700');
  }

  if (u._bladeOfJustice && _ohTier === 3) {
    const bladeDamage = Math.round(u.dmg * 1.20);
    dealDamage(t, bladeDamage, u, 'magic');
    addDmg(t.x, t.y - t.size - 4, '-' + bladeDamage, '#ffd700');
    const angle = Math.atan2(t.y - u.y, t.x - u.x);
    beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 10, maxLife: 10, color: '#ffd700', width: 4, straight: true });
    beamFx.push({ x1: t.x - Math.cos(angle + 1.2) * 20, y1: t.y - Math.sin(angle + 1.2) * 20, x2: t.x + Math.cos(angle + 1.2) * 20, y2: t.y + Math.sin(angle + 1.2) * 20, life: 8, maxLife: 8, color: '#ffe066', width: 3, straight: true });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 28, life: 0.3, swipeArc: true, swipeAngle: angle - Math.PI / 2, color: '#ffd700' });
    addP(t.x, t.y, '#ffd700', 16, 5);
    addP(t.x, t.y, '#ffffff', 8, 3);
    for (let i = 0; i < 6; i++) {
      const sparkAngle = Math.PI * 2 * i / 6;
      addP(t.x + Math.cos(sparkAngle) * 15, t.y + Math.sin(sparkAngle) * 15, '#ffe066', 1, 3);
    }
    SFX.holyLight();
  }

  if (u._hammerOfLight && _ohTier === 5) {
    if (!arena.hammerOfLight) arena.hammerOfLight = [];
    const delay = Math.round(GAME_TICK_HZ * 0.25);
    arena.hammerOfLight.push({
      ux: u.x,
      uy: u.y,
      x: t.x,
      y: t.y,
      delay,
      maxDelay: delay,
      dmg: Math.round(u.dmg * 1.80),
      from: u,
      radius: 50,
      unit: u,
    });
  }

  if (u._wakeOfAshesProc && _ohTier === 10) {
    const angle = Math.atan2(t.y - u.y, t.x - u.x);
    const length = 200;
    const cone = 0.45;
    const wakeDamage = Math.round(u.dmg * 1.80);
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      const dx = enemy.x - u.x;
      const dy = enemy.y - u.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > length) continue;
      const enemyAngle = Math.atan2(dy, dx);
      let diff = enemyAngle - angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > cone) continue;
      dealDamage(enemy, wakeDamage, u, 'magic');
      enemy.stunned = Math.max(enemy.stunned || 0, enemy.isBoss ? Math.round(1.5 * GAME_TICK_HZ) : Math.round(2.5 * GAME_TICK_HZ));
      addP(enemy.x, enemy.y, '#ffd700', 18, 5);
      addP(enemy.x, enemy.y, '#ffffff', 10, 3);
      addDmg(enemy.x, enemy.y - enemy.size, '-' + wakeDamage, '#ffd700');
    }
    if (!arena.wakeOfAshesWaves) arena.wakeOfAshesWaves = [];
    arena.wakeOfAshesWaves.push({ x: u.x, y: u.y, ang: angle, len: length, cone, life: 18, maxLife: 18 });
    for (let i = 0; i < 7; i++) {
      const fanAngle = angle + (i - 3) / 3 * cone;
      beamFx.push({ x1: u.x, y1: u.y, x2: u.x + Math.cos(fanAngle) * length, y2: u.y + Math.sin(fanAngle) * length, life: 10, maxLife: 10, color: '#ffe88a', width: 1.5, straight: true });
    }
    for (let i = 0; i < 24; i++) {
      const pct = (i + 1) / 24;
      const particleAngle = angle + rnd(-cone, cone);
      const px = u.x + Math.cos(particleAngle) * pct * length;
      const py = u.y + Math.sin(particleAngle) * pct * length;
      addP(px, py, '#ffe88a', 1.5 + Math.random() * 2, 2);
      addP(px, py, '#fff7c4', 1, 1.5);
      if (i % 5 === 0) addP(px, py - rnd(5, 12), '#ffffff', 1, 1.5);
    }
    for (let i = 0; i < 5; i++) {
      const groundDistance = 30 + i * 35;
      groundFx.push({ x: u.x + Math.cos(angle) * groundDistance, y: u.y + Math.sin(angle) * groundDistance, r: 0, maxR: 20 + i * 6, life: 0.3, color: '#ffe88a' });
    }
    groundFx.push({ x: u.x + Math.cos(angle) * 100, y: u.y + Math.sin(angle) * 100, r: 0, maxR: length * 0.6, life: 0.35, color: '#ffe88a' });
    addDmg(u.x + Math.cos(angle) * 60, u.y + Math.sin(angle) * 60 - 25, 'WAKE OF ASHES!', '#ffd700');
    showFlash('WAKE OF ASHES', '#ffd700', 45);
    shake(12);
  }

  if (u.unitIdx === 3 && u.branch === 'a' && _ohTier === 3 && t.hp > 0) {
    const judgmentDamage = Math.round(u.dmg * 0.35);
    dealDamage(t, judgmentDamage, u, 'magic');
    if (!t.isBoss) {
      t.avengedTimer = Math.max(t.avengedTimer || 0, Math.round(3 * GAME_TICK_HZ));
      t.avengedMult = Math.min(t.avengedMult || 1, 0.92);
    }
    addP(t.x, t.y, '#ffd700', 12, 4);
    addP(t.x, t.y, '#ffffff', 6, 3);
    beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.18, maxLife: 0.18, color: '#ffe066', width: 3, straight: true });
    addDmg(t.x, t.y - t.size, 'JUDGMENT GUARD!', '#ffd700', { sz: 12, bold: true });
  }

  if (u.unitIdx === 3 && u.branch === 'a' && _ohTier === 5 && t.hp > 0) {
    const shieldAmount = Math.round(u.maxHp * 0.045);
    addGoldShield(u, shieldAmount, Math.round(4 * GAME_TICK_HZ), Math.round(u.maxHp * 0.18), true);
    u.sacredBulwarkTimer = Math.max(u.sacredBulwarkTimer || 0, Math.round(4 * GAME_TICK_HZ));
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: 65, life: 0.45, color: '#ffd700' });
    addP(u.x, u.y, '#ffd700', 18, 5);
    addP(u.x, u.y, '#ffffff', 8, 3);
    addDmg(u.x, u.y - u.size, 'SACRED BULWARK!', '#ffe066', { sz: 13, bold: true });
    SFX.shieldBlock();
  }

  if (u.unitIdx === 3 && u.branch === 'a' && _ohTier === 10 && t.hp > 0) {
    const shieldAmount = Math.round(u.maxHp * 0.06);
    const duration = Math.round(4 * GAME_TICK_HZ);
    const targets = [u];
    const allies = units
      .filter(ally => ally && ally !== u && ally.hp > 0 && ally.isPlayer && !ally.isGhost && !ally.isMinion && !ally.isMirror && dist(u, ally) <= 170)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))
      .slice(0, 2);
    for (const ally of allies) targets.push(ally);
    for (const ally of targets) {
      addGoldShield(ally, shieldAmount, duration, Math.round((ally.maxHp || u.maxHp) * 0.20), true);
      ally.guardianOathTimer = Math.max(ally.guardianOathTimer || 0, duration);
      ally.guardianOathDR = Math.max(ally.guardianOathDR || 0, 0.06);
      if (ally !== u) beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, life: 0.24, maxLife: 0.24, color: '#ffe066aa', width: 2, straight: true });
    }
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: 170, life: 0.55, color: '#ffd700' });
    addP(u.x, u.y, '#ffd700', 22, 5);
    addP(u.x, u.y, '#ffffff', 10, 3);
    addDmg(u.x, u.y - u.size, 'GUARDIAN OATH!', '#ffd700', { sz: 14, bold: true });
    SFX.shieldBlock();
  }

  if (u.kingHolyCombo && _ohTier > 0 && t.hp > 0) {
    const cfg = u.kingHolyCombo;
    const woundedAllies = units
      .filter(ally => ally && ally.hp > 0 && ally.isPlayer && !ally.isGhost && !ally.isMinion && ally.maxHp > 0 && ally.hp < ally.maxHp)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
    const tankUnder = threshold => woundedAllies.find(ally => ally.arch === 'tank' && ally.hp / ally.maxHp < threshold) || null;
    const applyHolyHeal = (ally, amount, big = true) => {
      if (!ally) return 0;
      const heal = applyHealingReceived(ally, Math.max(1, Math.round(amount || 0)));
      const before = ally.hp;
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      const actual = Math.max(0, Math.round(ally.hp - before));
      addHealFx(ally.x, ally.y, actual, big);
      if (actual > 0) beaconSplash(u, ally, actual);
      return actual;
    };

    if (_ohTier === 3 && woundedAllies.length > 0) {
      const ally = tankUnder(cfg.judgmentTankThreshold) || woundedAllies[0];
      const actual = applyHolyHeal(ally, (u.healAmt || 60) * cfg.judgmentHealMult, true);
      addP(ally.x, ally.y, '#ffe066', 10, 4);
      addP(ally.x, ally.y - ally.size, '#ffffff', 5, 2);
      beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, life: 0.2, maxLife: 0.2, color: '#fff7c4', width: 3, straight: true });
      groundFx.push({ x: ally.x, y: ally.y, r: 0, maxR: 34, life: 0.3, color: '#ffe066' });
      if (actual > 0) addDmg(ally.x, ally.y - ally.size - 8, 'JUDGMENT OF LIGHT', '#fff7c4', { sz: 12, bold: true, outline: '#553300' });
      SFX.holyLight();
    }

    if (_ohTier === 5 && woundedAllies.length > 0) {
      const ally = woundedAllies[0];
      const low = ally.hp / ally.maxHp < cfg.wordLowThreshold;
      const healPct = low ? cfg.wordLowHealPct : cfg.wordHealPct;
      const actual = applyHolyHeal(ally, ally.maxHp * healPct, true);
      ally.hotTimer = Math.max(ally.hotTimer || 0, cfg.wordHotDur);
      ally.hotAmt = Math.round(ally.maxHp * cfg.wordHotPct);
      ally.hotTick = 0;
      ally._eternalFlame = cfg.wordHotDur;
      projectiles.push({ x: u.x, y: u.y, target: ally, tx: ally.x, ty: ally.y, speed: 1.8, projType: 'wogFlame', visualOnly: true, color: '#ff8800', _arrN: 12, _arrSz: 4, isPlayer: true, dmg: 0 });
      beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, life: 0.35, maxLife: 0.35, color: '#ffcc66', width: 3, straight: true });
      groundFx.push({ x: ally.x, y: ally.y, r: 0, maxR: 55, life: 0.6, color: '#ff8800' });
      groundFx.push({ x: u.x, y: u.y, r: 0, maxR: 30, life: 0.3, color: '#ffaa00' });
      addP(ally.x, ally.y, '#ff8800', 12, 4);
      addP(ally.x, ally.y, '#fff7c4', 6, 2);
      if (actual > 0) addDmg(u.x, u.y - u.size - 6, 'WORD OF GLORY', '#ffaa00', { sz: 13, bold: true, outline: '#553300' });
      addDmg(ally.x, ally.y - ally.size - 6, 'ETERNAL FLAME', '#ff6600', { sz: 11, bold: true, outline: '#442200' });
      SFX.holyLight();
    }

    if (_ohTier === 10 && woundedAllies.length > 0) {
      const ally = tankUnder(cfg.mercyTankThreshold) || woundedAllies[0];
      const low = ally.hp / ally.maxHp < cfg.mercyLowThreshold;
      const healPct = low ? cfg.mercyLowHealPct : cfg.mercyHealPct;
      const shieldPct = low ? cfg.mercyLowShieldPct : cfg.mercyShieldPct;
      const actual = applyHolyHeal(ally, ally.maxHp * healPct, true);
      const shieldAmount = Math.round(ally.maxHp * shieldPct);
      addGoldShield(ally, shieldAmount, cfg.mercyDur, Math.round(ally.maxHp * 0.24), true);
      ally.guardiansMercyTimer = Math.max(ally.guardiansMercyTimer || 0, cfg.mercyDur);
      ally.guardiansMercyDR = Math.max(ally.guardiansMercyDR || 0, cfg.mercyDr);
      addP(ally.x, ally.y, '#ffd700', 24, 6);
      addP(ally.x, ally.y, '#ffffff', 14, 4);
      groundFx.push({ x: ally.x, y: ally.y, r: 0, maxR: 72, life: 0.55, color: '#ffd700' });
      groundFx.push({ x: ally.x, y: ally.y, r: 0, maxR: 42, life: 0.35, color: '#ffffff' });
      beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, life: 0.28, maxLife: 0.28, color: '#ffd700', width: 4, straight: true });
      if (actual > 0) addDmg(ally.x, ally.y - ally.size - 10, "GUARDIAN'S MERCY", '#ffd700', { sz: 14, bold: true, outline: '#553300' });
      showFlash("GUARDIAN'S MERCY", '#ffd700', 35);
      SFX.shieldBlock();
      shake(4);
    }
  }

  if (u.lightOfDawn) {
    u.lightOfDawn.counter++;
    if (u.lightOfDawn.counter >= u.lightOfDawn.every) {
      u.lightOfDawn.counter = 0;
      const angle = Math.atan2(t.y - u.y, t.x - u.x) + Math.PI;
      const radius = u.lightOfDawn.range;
      const arc = u.lightOfDawn.arc;
      const allies = [];
      for (const ally of units) {
        if (ally.hp <= 0 || !ally.isPlayer || ally.isGhost) continue;
        const distance = dist(u, ally);
        if (distance > radius) continue;
        if (ally === u) {
          allies.push(ally);
          continue;
        }
        const allyAngle = Math.atan2(ally.y - u.y, ally.x - u.x);
        let diff = allyAngle - angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) <= arc / 2) allies.push(ally);
      }
      if (allies.length <= 1) {
        const fallback = [];
        for (const ally of units) {
          if (ally.hp <= 0 || !ally.isPlayer || ally.isGhost || allies.includes(ally)) continue;
          if (dist(u, ally) <= radius) fallback.push(ally);
        }
        fallback.sort((a, b) => dist(u, a) - dist(u, b));
        for (let i = 0; i < Math.min(3, fallback.length); i++) allies.push(fallback[i]);
      }
      if (allies.length > 0) {
        groundFx.push({ x: u.x, y: u.y, r: 0, maxR: radius, life: 0.8, color: 'rgba(255,224,102,0.25)', _lodCone: true, _lodAng: angle, _lodArc: arc });
        for (let i = 0; i < 5; i++) {
          const rayAngle = angle - arc / 2 + (i + 0.5) / 5 * arc;
          beamFx.push({ x1: u.x, y1: u.y, x2: u.x + Math.cos(rayAngle) * radius, y2: u.y + Math.sin(rayAngle) * radius, color: '#ffd70066', width: 2, life: 0.3, maxLife: 0.3, straight: true });
        }
        for (let i = 0; i < 12; i++) {
          const particleAngle = angle - arc / 2 + Math.random() * arc;
          const particleDistance = 20 + Math.random() * (radius - 20);
          const color = ['#ffe066', '#ffd700', '#fff7c4', '#ffffff'][Math.floor(Math.random() * 4)];
          addP(u.x + Math.cos(particleAngle) * particleDistance, u.y + Math.sin(particleAngle) * particleDistance, color, 1.5, 3);
        }
        for (let i = 0; i < 6; i++) {
          const particleAngle = angle - arc / 2 + Math.random() * arc;
          const particleDistance = 10 + Math.random() * (radius * 0.6);
          addP(u.x + Math.cos(particleAngle) * particleDistance, u.y + Math.sin(particleAngle) * particleDistance - rnd(5, 15), '#ffffff', 1, 2);
        }
        for (const ally of allies) {
          let heal = Math.round(ally.maxHp * u.lightOfDawn.healPct);
          if (u.infusionOfLightTimer > 0) heal = Math.round(heal * 1.30);
          heal = applyHealingReceived(ally, heal);
          ally.hp = Math.min(ally.maxHp, ally.hp + heal);
          addHealFx(ally.x, ally.y, heal, true);
          beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, color: '#ffe06644', width: 2, life: 0.2, maxLife: 0.2, straight: true });
          addP(ally.x, ally.y, '#ffe066', 8, 3);
          addP(ally.x, ally.y, '#ffffff', 4, 2);
          beaconSplash(u, ally, heal);
        }
        addDmg(u.x, u.y - u.size - 6, 'LIGHT OF DAWN', '#ffe066', { sz: 13, bold: true, outline: '#553300' });
      }
    }
  }

  if (u.wordOfGlory) {
    u.wordOfGlory.counter++;
    if (u.wordOfGlory.counter >= u.wordOfGlory.every) {
      u.wordOfGlory.counter = 0;
      const ally = findLowestAlly(u, 200);
      if (ally) {
        let heal = Math.round(ally.maxHp * u.wordOfGlory.healPct);
        if (u.infusionOfLightTimer > 0) heal = Math.round(heal * 1.30);
        heal = applyHealingReceived(ally, heal);
        ally.hp = Math.min(ally.maxHp, ally.hp + heal);
        addHealFx(ally.x, ally.y, heal, true);
        ally.hotTimer = Math.max(ally.hotTimer || 0, u.wordOfGlory.hotDur);
        ally.hotAmt = Math.round(ally.maxHp * u.wordOfGlory.hotPct);
        ally.hotTick = 0;
        ally._eternalFlame = u.wordOfGlory.hotDur;
        projectiles.push({ x: u.x, y: u.y, target: ally, tx: ally.x, ty: ally.y, speed: 1.8, projType: 'wogFlame', visualOnly: true, color: '#ff8800', _arrN: 12, _arrSz: 4, isPlayer: true, dmg: 0 });
        beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, life: 35, maxLife: 35, color: '#ff8800', width: 3, straight: true });
        groundFx.push({ x: ally.x, y: ally.y, r: 0, maxR: 55, life: 0.6, color: '#ff8800' });
        groundFx.push({ x: u.x, y: u.y, r: 0, maxR: 30, life: 0.3, color: '#ffaa00' });
        for (let i = 0; i < 6; i++) addP(ally.x + rnd(-10, 10), ally.y + rnd(-8, 4), '#ff6600', 1, 3);
        addDmg(u.x, u.y - u.size - 6, 'WORD OF GLORY', '#ffaa00', { sz: 13, bold: true, outline: '#553300' });
        addDmg(ally.x, ally.y - ally.size - 6, 'ETERNAL FLAME', '#ff6600', { sz: 11, bold: true, outline: '#442200' });
        beaconSplash(u, ally, heal);
      }
    }
  }
}
