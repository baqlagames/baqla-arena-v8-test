import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function applyEarlyOnHitProcs(unit, target, {
  arena,
  frame,
  ohTier,
  damage,
  units,
  enemies,
  projectiles,
  beamFx,
  groundEffects,
  randomRange,
  dealDamage,
  findLowestAlly,
  applyTrackedHeal,
  moonkinControlBurst,
  moonkinDisplaceEnemy,
  showFlash,
  addHealFx,
  emitParticle,
  addDamageText,
  shake,
}) {
  const u = unit;
  const t = target;
  const rnd = randomRange;
  const groundFx = groundEffects;
  const addP = emitParticle;
  const addDmg = addDamageText;
  const _ohTier = ohTier;
  let dmg = damage;

  if (u.mindBlast) {
    u.mindBlast.counter++;
    if (u.mindBlast.counter >= u.mindBlast.every) {
      u.mindBlast.counter = 0;
      dmg = Math.round(dmg * u.mindBlast.mult);
      beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.5, maxLife: 0.5, color: '#6622aa', width: 6, straight: true });
      beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.35, maxLife: 0.35, color: '#aa66ff', width: 10, straight: true });
      for (let i = 1; i <= 8; i++) {
        const f = i / 8;
        const swirl = Math.sin(f * Math.PI * 3) * 8;
        const angle = Math.atan2(t.y - u.y, t.x - u.x) + Math.PI / 2;
        addP(u.x + (t.x - u.x) * f + Math.cos(angle) * swirl, u.y + (t.y - u.y) * f + Math.sin(angle) * swirl, '#9b44dd', 2, 3);
      }
      addP(u.x, u.y, '#3a0a5a', 14, 5);
      addP(t.x, t.y, '#aa66ff', 26, 6);
      addP(t.x, t.y, '#ffffff', 8, 3);
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI * 2 * i / 6;
        beamFx.push({ x1: t.x, y1: t.y, x2: t.x + Math.cos(angle) * 25, y2: t.y + Math.sin(angle) * 25, life: 0.4, maxLife: 0.4, color: '#aa66ff', width: 3, straight: true });
      }
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 35, life: 0.4, color: '#6622aa' });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 20, life: 0.25, color: '#aa66ff' });
      addDmg(t.x, t.y - t.size, 'MIND BLAST!', '#aa66ff');
      shake(4);
    }
  }

  if (u.penance) {
    u.penance.counter++;
    if (u.penance.counter >= u.penance.every) {
      u.penance.counter = 0;
      const penanceDamage = Math.round(dmg * u.penance.dmgMult);
      for (let i = 0; i < u.penance.bolts; i++) dealDamage(t, penanceDamage, u, 'magic');
      for (let i = 0; i < u.penance.bolts; i++) {
        projectiles.push({ x: u.x + rnd(-3, 3), y: u.y + rnd(-3, 3), target: t, tx: t.x, ty: t.y, speed: 3.5 + (u.penance.bolts - i) * 0.3, projType: 'penanceBolt', visualOnly: true, color: '#ffaadd', _arrN: 4, _arrSz: 3, isPlayer: true, dmg: 0 });
      }
      const ally = findLowestAlly(u, 200);
      if (ally) {
        const heal = Math.round(penanceDamage * u.penance.bolts * 0.5);
        ally.hp = Math.min(ally.maxHp, ally.hp + heal);
        addHealFx(ally.x, ally.y, heal);
        projectiles.push({ x: u.x, y: u.y, target: ally, tx: ally.x, ty: ally.y, speed: 3, projType: 'pomOrb', visualOnly: true, color: '#ffaadd', _arrN: 8, _arrSz: 3, isPlayer: true, dmg: 0 });
      }
      u._healCast = 20;
      beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.4, maxLife: 0.4, color: '#ffaadd', width: 4, straight: true });
      addP(t.x, t.y, '#ffaadd', 16, 5);
      addP(t.x, t.y, '#ffffff', 8, 3);
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 25, life: 0.3, color: '#ffaadd' });
      addDmg(t.x, t.y - t.size, 'PENANCE!', '#ffaadd');
      shake(3);
    }
  }

  if (u.shadowWordPain && t.hp > 0) {
    if (!t._swpStacks) t._swpStacks = [];
    let myStacks = 0;
    for (const stack of t._swpStacks) if (stack.from === u) myStacks++;
    if (myStacks < u.shadowWordPain.maxStacks) {
      t._swpStacks.push({ from: u, dmg: Math.round(u.dmg * u.shadowWordPain.dmgPct), timer: Math.round(u.shadowWordPain.dur / GAME_TICK_HZ) });
      addP(t.x, t.y, '#6622aa', 8, 4);
      addP(t.x + rnd(-4, 4), t.y + rnd(-4, 4), '#aa66ff', 4, 2);
      beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 12, maxLife: 12, color: '#6622aa', width: 3, wavy: true });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 15, life: 0.2, color: '#3a0a5a' });
      if (myStacks === 0) {
        addDmg(t.x, t.y - t.size, 'SW:PAIN', '#aa66ff');
        addP(t.x, t.y, '#aa66ff', 14, 4);
      }
    } else {
      for (const stack of t._swpStacks) if (stack.from === u) stack.timer = Math.round(u.shadowWordPain.dur / GAME_TICK_HZ);
    }
  }

  if (u._shadowCrash && _ohTier === 5) {
    if (!arena.shadowCrashes) arena.shadowCrashes = [];
    const delay = Math.round(GAME_TICK_HZ * 0.9);
    arena.shadowCrashes.push({ x: t.x, y: t.y, startY: t.y - 120, delay, maxDelay: delay, dmg: Math.round(u.dmg * 2.5), from: u, radius: 50 });
    beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y - 60, life: 0.4, maxLife: 0.4, color: '#6622aa', width: 4, wavy: true });
    addP(u.x, u.y, '#aa66ff', 14, 4);
    addP(t.x, t.y, '#3a0a5a', 10, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 30, life: 0.3, color: '#3a0a5a' });
    addDmg(u.x, u.y - u.size, 'SHADOW CRASH!', '#aa66ff');
  }

  if (u._voidTentacles && _ohTier === 10) {
    if (!arena.voidTentacles) arena.voidTentacles = [];
    const count = u._voidTentacles.count;
    for (let i = 0; i < count; i++) {
      const validEnemies = enemies.filter(enemy => enemy.hp > 0);
      if (validEnemies.length === 0) break;
      const tentacleTarget = validEnemies[Math.floor(Math.random() * validEnemies.length)];
      const x = tentacleTarget.x + rnd(-30, 30);
      const y = tentacleTarget.y + rnd(-20, 20);
      arena.voidTentacles.push({ x, y, timer: u._voidTentacles.dur, maxTimer: u._voidTentacles.dur, atkCD: 0, atkEvery: u._voidTentacles.atkEvery, dmg: Math.round(u.dmg * u._voidTentacles.dmgPct), from: u, phase: Math.random() * Math.PI * 2 });
      groundFx.push({ x, y, r: 0, maxR: 30, life: 0.5, color: '#3a0a5a' });
      groundFx.push({ x, y, r: 0, maxR: 18, life: 0.35, color: '#6622aa' });
      addP(x, y, '#aa66ff', 14, 5);
      addP(x, y, '#3a0a5a', 8, 3);
      beamFx.push({ x1: u.x, y1: u.y, x2: x, y2: y, life: 0.3, maxLife: 0.3, color: '#6622aa', width: 3, wavy: true });
    }
    addP(u.x, u.y, '#aa66ff', 22, 6);
    addP(u.x, u.y, '#3a0a5a', 14, 4);
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 2, life: 0.4, color: '#3a0a5a' });
    addDmg(u.x, u.y - u.size, 'VOID TENTACLES!', '#aa66ff');
    showFlash('VOID TENTACLES!', '#aa66ff', 25);
    shake(5);
  }

  if (u.lifebloom && t.hp > 0) {
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
    if (!lowest) lowest = u;
    if (!lowest._lifebloomStacks) lowest._lifebloomStacks = [];
    let myStacks = 0;
    for (const stack of lowest._lifebloomStacks) if (stack.from === u) myStacks++;
    const healMult = u._incarnation ? 1.5 : 1.0;
    if (myStacks < u.lifebloom.bloomAt) {
      lowest._lifebloomStacks.push({ from: u, hotPct: u.lifebloom.hotPct * healMult, timer: 8 * GAME_TICK_HZ, tick: 0 });
      const angle = Math.PI * 2 * myStacks / 3 + frame * 0.15;
      addP(lowest.x + Math.cos(angle) * 10, lowest.y - lowest.size + Math.sin(angle) * 6, '#44ff66', 5, 3);
      addP(lowest.x + rnd(-6, 6), lowest.y - lowest.size - 4, '#88ffaa', 3, 2);
      beamFx.push({ x1: u.x, y1: u.y, x2: lowest.x, y2: lowest.y, life: 0.15, maxLife: 0.15, color: '#44ff66', width: 2, straight: true });
      if (myStacks === 1) addDmg(lowest.x, lowest.y - lowest.size, 'LIFEBLOOM', '#44ff88');
      myStacks++;
      if (myStacks >= u.lifebloom.bloomAt) {
        const bloomHeal = Math.round(lowest.maxHp * u.lifebloom.bloomPct * healMult);
        for (const ally of units) {
          if (ally.isPlayer && ally.hp > 0 && !ally.isMinion && dist(lowest, ally) <= u.lifebloom.bloomR) {
            applyTrackedHeal(ally, bloomHeal, u, true);
            addP(ally.x, ally.y, '#44ff66', 10, 4);
            addP(ally.x, ally.y, '#ffffff', 5, 2);
            beamFx.push({ x1: lowest.x, y1: lowest.y, x2: ally.x, y2: ally.y, life: 0.2, maxLife: 0.2, color: '#44ff88', width: 2, straight: true });
          }
        }
        groundFx.push({ x: lowest.x, y: lowest.y, r: 0, maxR: u.lifebloom.bloomR, life: 0.5, color: '#44ff88' });
        groundFx.push({ x: lowest.x, y: lowest.y, r: 0, maxR: u.lifebloom.bloomR * 0.5, life: 0.35, color: '#88ffcc' });
        for (let i = 0; i < 20; i++) addP(lowest.x + rnd(-24, 24), lowest.y + rnd(-18, 18), '#66ff88', 1, 4);
        for (let i = 0; i < 8; i++) {
          const bloomAngle = Math.PI * 2 * i / 8;
          addP(lowest.x + Math.cos(bloomAngle) * u.lifebloom.bloomR * 0.6, lowest.y + Math.sin(bloomAngle) * u.lifebloom.bloomR * 0.6, '#44ff66', 2, 3);
        }
        addDmg(lowest.x, lowest.y - lowest.size - 6, 'BLOOM!', '#44ff88', { sz: 14, bold: true });
        showFlash('BLOOM!', '#44ff88', 20);
        shake(3);
        lowest._lifebloomStacks = lowest._lifebloomStacks.filter(stack => stack.from !== u);
      }
    } else {
      for (const stack of lowest._lifebloomStacks) if (stack.from === u) stack.timer = 8 * GAME_TICK_HZ;
    }
  }

  if (u.bakdounesRestoCombo && t.hp > 0 && _ohTier > 0) {
    const cfg = u.bakdounesRestoCombo;
    const woundedAllies = units
      .filter(ally => ally.isPlayer && ally.hp > 0 && !ally.isMinion && ally.maxHp > 0 && ally.hp < ally.maxHp)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));

    if (_ohTier === 3 && woundedAllies.length > 0) {
      const ally = woundedAllies[0];
      const heal = applyTrackedHeal(ally, Math.max(8, Math.round((u.healAmt || 60) * cfg.regrowthHealMult)), u, true);
      if (ally._lifebloomStacks) {
        for (const stack of ally._lifebloomStacks) if (stack.from === u) stack.timer = 8 * GAME_TICK_HZ;
      }
      addP(ally.x, ally.y - ally.size, '#88ffaa', 10, 4);
      addP(ally.x + rnd(-8, 8), ally.y - ally.size - 4, '#ffffff', 4, 2);
      beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, life: 0.18, maxLife: 0.18, color: '#88ffaa', width: 2, straight: true });
      if (heal > 0) addDmg(ally.x, ally.y - ally.size - 8, 'REGROWTH', '#88ffaa', { sz: 12, bold: true });
    }

    if (_ohTier === 5 && woundedAllies.length > 0) {
      const heal = Math.max(8, Math.round((u.healAmt || 60) * cfg.medicaHealMult));
      const targets = woundedAllies.slice(0, cfg.medicaTargets || 3);
      for (const ally of targets) {
        applyTrackedHeal(ally, heal, u, false);
        const currentHot = ally._wgHot && ally._wgHot.timer > 0 ? ally._wgHot : null;
        ally._wgHot = {
          timer: Math.max((currentHot && currentHot.timer) || 0, cfg.medicaHotDur),
          tick: 0,
          healPct: Math.max((currentHot && currentHot.healPct) || 0, cfg.medicaHotPct),
          from: u
        };
        addP(ally.x, ally.y, '#66ffcc', 8, 4);
        beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, life: 0.2, maxLife: 0.2, color: '#66ffcc', width: 2, straight: true });
      }
      groundFx.push({ x: u.x, y: u.y, r: 0, maxR: 80, life: 0.4, color: '#66ffcc' });
      addDmg(u.x, u.y - u.size - 10, 'MEDICA BLOOM', '#66ffcc', { sz: 12, bold: true });
    }

    if (_ohTier === 10 && woundedAllies.length > 0) {
      const ally = woundedAllies[0];
      const allyPct = ally.hp / ally.maxHp;
      const healPct = allyPct < cfg.benedictionThreshold ? cfg.benedictionLowPct : cfg.benedictionHighPct;
      applyTrackedHeal(ally, Math.round(ally.maxHp * healPct), u, true);
      for (const splash of units) {
        if (splash === ally || !splash.isPlayer || splash.hp <= 0 || splash.isMinion || !splash.maxHp || splash.hp >= splash.maxHp) continue;
        if (dist(ally, splash) > cfg.benedictionRadius) continue;
        applyTrackedHeal(splash, Math.round(splash.maxHp * cfg.benedictionSplashPct), u, false);
        addP(splash.x, splash.y, '#ccffee', 10, 4);
        beamFx.push({ x1: ally.x, y1: ally.y, x2: splash.x, y2: splash.y, life: 0.22, maxLife: 0.22, color: '#ccffee', width: 2, straight: true });
      }
      addP(ally.x, ally.y - ally.size, '#ffffff', 16, 5);
      addP(ally.x, ally.y, '#88ffaa', 22, 5);
      groundFx.push({ x: ally.x, y: ally.y, r: 0, maxR: cfg.benedictionRadius, life: 0.5, color: '#88ffaa' });
      addDmg(ally.x, ally.y - ally.size - 12, 'BENEDICTION BLOOM', '#ccffee', { sz: 13, bold: true });
      showFlash('BENEDICTION BLOOM', '#88ffaa', 30);
      shake(4);
    }
  }

  if (u.habaqAromancerCombo && t.hp > 0 && _ohTier > 0) {
    const cfg = u.habaqAromancerCombo;
    const woundedAllies = units
      .filter(ally => ally.isPlayer && ally.hp > 0 && !ally.isGhost && !ally.isMinion && ally.maxHp > 0 && ally.hp < ally.maxHp)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));

    if (_ohTier === 3 && woundedAllies.length > 0) {
      const ally = woundedAllies[0];
      applyTrackedHeal(ally, Math.max(8, Math.round((u.healAmt || 60) * cfg.aromaBoltHealMult)), u, false);
      addP(ally.x, ally.y, '#aaffaa', 9, 4);
      addP(ally.x + rnd(-6, 6), ally.y - ally.size, '#88cc66', 4, 3);
      beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, life: 0.18, maxLife: 0.18, color: '#aaffaa', width: 2, straight: true });
      if (u._aromaStatues && u._aromaStatues.length > 0) {
        const statue = u._aromaStatues.reduce((best, st) => (!best || dist(st, ally) < dist(best, ally)) ? st : best, null);
        if (statue) {
          applyTrackedHeal(ally, Math.max(4, Math.round((u.healAmt || 60) * cfg.aromaBoltEchoMult)), u, false);
          addP(statue.x, statue.y - 10, '#88cc66', 6, 3);
          beamFx.push({ x1: statue.x, y1: statue.y - 12, x2: ally.x, y2: ally.y, life: 0.2, maxLife: 0.2, color: '#88cc66', width: 2, straight: false });
        }
      }
      addDmg(ally.x, ally.y - ally.size - 8, 'AROMA BOLT', '#aaffaa', { sz: 12, bold: true });
    }

    if (_ohTier === 5 && woundedAllies.length > 0) {
      const ally = woundedAllies[0];
      applyTrackedHeal(ally, Math.max(8, Math.round((u.healAmt || 60) * cfg.infusionInitialHealMult)), u, false);
      const currentHot = ally._essenceHot && ally._essenceHot.timer > 0 ? ally._essenceHot : null;
      const hotHealMult = u.essenceInfusion && u.essenceInfusion.healMult ? u.essenceInfusion.healMult : cfg.infusionHotHealMult;
      const hotDur = u.essenceInfusion && u.essenceInfusion.dur ? u.essenceInfusion.dur : cfg.infusionDur;
      ally._essenceHot = {
        timer: Math.max((currentHot && currentHot.timer) || 0, hotDur),
        tick: 0,
        heal: Math.max((currentHot && currentHot.heal) || 0, Math.round((u.healAmt || 60) * hotHealMult)),
        from: u
      };
      addP(ally.x, ally.y, '#ffd700', 10, 4);
      addP(ally.x, ally.y - ally.size, '#ffffff', 5, 2);
      beamFx.push({ x1: u.x, y1: u.y, x2: ally.x, y2: ally.y, life: 0.22, maxLife: 0.22, color: '#ffd700', width: 3, straight: true });
      groundFx.push({ x: ally.x, y: ally.y, r: 0, maxR: 24, life: 0.3, color: '#aaffaa' });
      addDmg(ally.x, ally.y - ally.size - 10, 'ESSENCE INFUSION', '#ffd700', { sz: 12, bold: true });
    }

    if (_ohTier === 10 && woundedAllies.length > 0) {
      if (!u._aromaStatues) u._aromaStatues = [];
      u._aromaStatues = u._aromaStatues.filter(st => !st.bloomingShrine || st.timer > 0);
      if (u._aromaStatues.length === 0) {
        u._aromaStatues.push({
          x: u.x,
          y: u.y,
          timer: cfg.shrineDur,
          maxTimer: cfg.shrineDur,
          boltCD: 0,
          boltEvery: cfg.shrineBoltEvery,
          healAmt: Math.max(8, Math.round((u.healAmt || 60) * cfg.shrineHealMult)),
          born: frame,
          bloomingShrine: true
        });
      }
      const pulsed = new Set();
      for (const statue of u._aromaStatues) {
        addP(statue.x, statue.y - 10, '#aaffaa', 14, 5);
        addP(statue.x, statue.y, '#ffd700', 6, 3);
        groundFx.push({ x: statue.x, y: statue.y, r: 0, maxR: cfg.shrineRadius, life: 0.45, color: '#88cc66' });
        for (const ally of woundedAllies) {
          if (pulsed.has(ally) || dist(statue, ally) > cfg.shrineRadius) continue;
          pulsed.add(ally);
          applyTrackedHeal(ally, Math.max(10, Math.round((u.healAmt || 60) * cfg.shrinePulseHealMult)), u, false);
          addP(ally.x, ally.y, '#aaffaa', 12, 4);
          beamFx.push({ x1: statue.x, y1: statue.y - 12, x2: ally.x, y2: ally.y, life: 0.24, maxLife: 0.24, color: '#aaffaa', width: 2, straight: false });
        }
      }
      addDmg(u.x, u.y - u.size - 12, 'BLOOMING SHRINE', '#aaffaa', { sz: 13, bold: true });
      showFlash('BLOOMING SHRINE', '#88cc66', 35);
      shake(3);
    }
  }

  if (u.toxicFlask && t.hp > 0) {
    if (!t._toxicStacks) t._toxicStacks = [];
    let myPoison = 0;
    for (const stack of t._toxicStacks) if (stack.from === u) myPoison++;
    if (myPoison < u.toxicFlask.maxStacks) {
      t._toxicStacks.push({ from: u, dmg: Math.round(u.dmg * u.toxicFlask.dmgPct), timer: Math.round(u.toxicFlask.dur / GAME_TICK_HZ) });
      addP(t.x, t.y, '#aa44ff', 6, 3);
      addP(t.x + rnd(-4, 4), t.y + rnd(-4, 4), '#66ff88', 3, 2);
      beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.15, maxLife: 0.15, color: '#aa44ff', width: 2, straight: true });
      if (myPoison === 0) {
        addDmg(t.x, t.y - t.size, 'TOXIC!', '#aa44ff');
        groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 18, life: 0.2, color: '#7722aa' });
      }
    } else {
      for (const stack of t._toxicStacks) if (stack.from === u) stack.timer = Math.round(u.toxicFlask.dur / GAME_TICK_HZ);
    }
    if (u.corrosiveBrew && t._toxicStacks && t._toxicStacks.length > 0) {
      t._corrosiveAmp = u.corrosiveBrew.ampPct;
      t._corrosiveTimer = 60;
    }
  }

  if (u._eclipse && t.hp > 0) {
    const ec = u._eclipse;
    const celestial = !!u._celestialAlignment;
    const maxCount = celestial ? 3 : ec.maxCount;
    ec.count++;
    if (u._solarGust) {
      u._solarGust.counter++;
      if (u._solarGust.counter >= u._solarGust.every) {
        u._solarGust.counter = 0;
        const hit = moonkinControlBurst(t.x, t.y, 72, u, Math.round(u.dmg * 0.42), 'push', 24, 'SOLAR GUST', '#99ddff');
        if (hit) {
          addP(u.x, u.y, '#99ddff', 8, 3);
          shake(2);
        }
      }
    }
    if (u._astralPower) u._astralPower.decayCD = 0;
    if (celestial) {
      const bonusDamage = Math.round(u.dmg * 0.55);
      dealDamage(t, bonusDamage, u, 'magic');
      addP(t.x + rnd(-6, 6), t.y + rnd(-6, 6), '#ffd700', 3, 2);
      addP(t.x + rnd(-6, 6), t.y + rnd(-6, 6), '#aaccff', 3, 2);
      beamFx.push({ x1: u.x - 6, y1: u.y - 18, x2: t.x, y2: t.y, life: 0.18, maxLife: 0.18, color: '#ffd700', width: 2.5, straight: true });
      beamFx.push({ x1: u.x + 6, y1: u.y - 18, x2: t.x, y2: t.y, life: 0.18, maxLife: 0.18, color: '#aaccff', width: 2.5, straight: true });
      if (t.speed > 0) t.speed *= 0.92;
    } else if (ec.phase === 'lunar') {
      if (t.speed > 0) {
        const slow = 1 - ec.lunarSlowPct;
        t.speed *= slow;
      }
      addP(t.x + rnd(-4, 4), t.y + rnd(-4, 4), '#aaccff', 3, 2);
      beamFx.push({ x1: u.x, y1: u.y - 12, x2: t.x, y2: t.y, life: 0.14, maxLife: 0.14, color: '#aaccff', width: 2, straight: true });
    } else {
      addP(t.x + rnd(-4, 4), t.y + rnd(-4, 4), '#ffd700', 3, 2);
      beamFx.push({ x1: u.x, y1: u.y - 12, x2: t.x, y2: t.y, life: 0.14, maxLife: 0.14, color: '#ffd700', width: 2, straight: true });
    }
    if (ec.count >= maxCount) {
      const empowered = u._astralPower && u._astralPower.stacks >= u._astralPower.maxStacks;
      if (ec.phase === 'solar') {
        const flareDamage = Math.round(u.dmg * (empowered ? 4.8 : 3.4));
        const flareRadius = empowered ? 118 : 78;
        for (const enemy of enemies) {
          if (enemy.hp > 0 && dist(t, enemy) <= flareRadius) {
            dealDamage(enemy, flareDamage, u, 'magic');
            addP(enemy.x, enemy.y, '#ffd700', 8, 4);
            addP(enemy.x, enemy.y, '#ff8800', 5, 3);
            moonkinDisplaceEnemy(t, enemy, empowered ? 38 : 28, 'push');
          }
        }
        beamFx.push({ x1: t.x, y1: t.y - 260, x2: t.x, y2: t.y, life: 0.28, maxLife: 0.28, color: '#ffd700', width: 10, straight: true });
        groundFx.push({ x: t.x, y: t.y, r: 0, maxR: flareRadius, life: 0.55, solarFlareFx: true, color: '#ffd700' });
        addDmg(t.x, t.y - t.size - 6, 'SOLAR FLARE!', '#ffd700', { sz: 14, bold: true });
        for (let i = 0; i < 16; i++) {
          const angle = Math.PI * 2 * i / 16;
          const radius = rnd(10, flareRadius * 0.8);
          addP(t.x + Math.cos(angle) * radius, t.y + Math.sin(angle) * radius, '#ffaa00', 1, 4);
        }
        shake(empowered ? 8 : 5);
        if (!celestial) {
          ec.phase = 'lunar';
          ec.count = 0;
        } else {
          ec.count = 0;
        }
      } else {
        const lunarDamage = Math.round(u.dmg * (empowered ? 3.4 : 2.35));
        const lunarRadius = empowered ? 108 : 74;
        for (const enemy of enemies) {
          if (enemy.hp > 0 && dist(t, enemy) <= lunarRadius) {
            dealDamage(enemy, lunarDamage, u, 'magic');
            addP(enemy.x, enemy.y, '#aaccff', 8, 4);
            addP(enemy.x, enemy.y, '#6688cc', 5, 3);
            if (enemy.speed > 0) enemy.speed *= 0.75;
            moonkinDisplaceEnemy(t, enemy, empowered ? 30 : 22, 'pull');
          }
        }
        beamFx.push({ x1: t.x, y1: t.y - 250, x2: t.x, y2: t.y, life: 0.28, maxLife: 0.28, color: '#aaccff', width: 9, straight: true });
        groundFx.push({ x: t.x, y: t.y, r: 0, maxR: lunarRadius, life: 0.55, lunarStrikeFx: true, color: '#aaccff' });
        addDmg(t.x, t.y - t.size - 6, 'LUNAR STRIKE!', '#aaccff', { sz: 14, bold: true });
        for (let i = 0; i < 12; i++) {
          const angle = Math.PI * 2 * i / 12;
          const radius = rnd(10, lunarRadius * 0.7);
          addP(t.x + Math.cos(angle) * radius, t.y + Math.sin(angle) * radius, '#88aaee', 1, 4);
        }
        shake(empowered ? 7 : 4);
        if (!celestial) {
          ec.phase = 'solar';
          ec.count = 0;
        } else {
          ec.count = 0;
        }
      }
      if (u._astralPower && !celestial) {
        if (u._astralPower.stacks < u._astralPower.maxStacks) {
          u._astralPower.stacks++;
          addDmg(u.x, u.y - u.size, 'ASTRAL +' + u._astralPower.stacks, '#ccaaff');
          addP(u.x, u.y, '#ccaaff', 8, 3);
        }
        if (empowered) u._astralPower.stacks = 0;
        u._astralPower.decayCD = 0;
      }
    }
  }

  if (u._voidform) {
    for (const enemy of enemies) {
      if (enemy === t || enemy.hp <= 0) continue;
      if (dist(t, enemy) <= u._voidform.splashRadius) {
        dealDamage(enemy, Math.round(dmg * 0.3), u, 'magic');
        addP(enemy.x, enemy.y, '#6622aa', 5, 3);
        beamFx.push({ x1: t.x, y1: t.y, x2: enemy.x, y2: enemy.y, life: 8, maxLife: 8, color: '#6622aa', width: 1 });
      }
    }
  }

  if (u._madness) {
    const chainTargets = [];
    for (const enemy of enemies) {
      if (enemy === t || enemy.hp <= 0) continue;
      if (dist(t, enemy) <= 120) chainTargets.push(enemy);
    }
    chainTargets.sort((a, b) => dist(t, a) - dist(t, b));
    for (let i = 0; i < Math.min(u._madness.chainTargets, chainTargets.length); i++) {
      const enemy = chainTargets[i];
      dealDamage(enemy, Math.round(dmg * 0.6), u, 'magic');
      beamFx.push({ x1: t.x, y1: t.y, x2: enemy.x, y2: enemy.y, life: 18, maxLife: 18, color: '#aa66ff', width: 2.5 });
      projectiles.push({ x: t.x, y: t.y, target: enemy, tx: enemy.x, ty: enemy.y, speed: 5, projType: 'voidBolt', visualOnly: true, color: '#aa66ff', _arrN: 8, _arrSz: 3, isPlayer: true, dmg: 0 });
    }
    if (t.hp <= 0 && u._madness) {
      u._madness.timer += 2 * GAME_TICK_HZ;
      addDmg(u.x, u.y - u.size, 'EXTENDED!', '#aa66ff');
    }
  }

  if (u.cleave) {
    let cleaveHit = 0;
    for (const enemy of enemies) {
      if (enemy === t || enemy.hp <= 0) continue;
      if (dist(u, enemy) > u.range + 20) continue;
      const dx = enemy.x - u.x;
      const dy = enemy.y - u.y;
      const targetDx = t.x - u.x;
      const targetDy = t.y - u.y;
      const angleA = Math.atan2(dy, dx);
      const angleB = Math.atan2(targetDy, targetDx);
      let deltaAngle = Math.abs(angleA - angleB);
      if (deltaAngle > Math.PI) deltaAngle = 2 * Math.PI - deltaAngle;
      if (deltaAngle * 180 / Math.PI <= u.cleave.arc / 2) {
        dealDamage(enemy, Math.round(dmg * u.cleave.mult), u, 'normal');
        cleaveHit++;
      }
    }
    if (cleaveHit > 0) {
      addDmg(u.x, u.y - u.size, 'CLEAVE!', '#ffe6c0');
      u.cleaveFx = 14;
      u.cleaveFxAng = Math.atan2(t.y - u.y, t.x - u.x);
      const angle = u.cleaveFxAng;
      for (let i = -3; i <= 3; i++) {
        const arcAngle = angle + (i / 3) * (u.cleave.arc / 2) * Math.PI / 180;
        addP(u.x + Math.cos(arcAngle) * u.range * 0.85, u.y + Math.sin(arcAngle) * u.range * 0.85, '#ffeed0', 1, 3);
        addP(u.x + Math.cos(arcAngle) * u.range * 0.6, u.y + Math.sin(arcAngle) * u.range * 0.6, '#ffffff', 1, 2);
      }
    }
  }

  if (u.splash && u.projType) {
    let splashHit = 0;
    for (const enemy of enemies) {
      if (enemy === t || enemy.hp <= 0) continue;
      if (dist(t, enemy) <= u.splash.radius) {
        dealDamage(enemy, Math.round(dmg * u.splash.mult), u, 'normal');
        splashHit++;
      }
    }
    if (splashHit > 0) {
      addP(t.x, t.y, '#ff6600', 16, 4);
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: u.splash.radius, life: 0.3, color: '#ff6600' });
    }
  }

  return { damage: dmg };
}
