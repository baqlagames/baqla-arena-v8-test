import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';
import { isValidPlayerOffensiveTarget } from './player-target-validity.js';

function kingHolySwordCfg(u) {
  return u && u.unitIdx === 3 && !u.branch ? (u.holySwordSaintCombo || null) : null;
}

const KING_ARSENAL_STANCES = ['crystal', 'thunder', 'crown'];
const KING_ARSENAL_DATA = {
  crystal: { label: 'CRYSTAL', color: '#b95cff', alt: '#f5d6ff' },
  thunder: { label: 'THUNDER', color: '#ffb000', alt: '#fff06a' },
  crown: { label: 'CROWN', color: '#ff3d8b', alt: '#ffd166' },
};

function kingArsenalStance(u) {
  return KING_ARSENAL_DATA[u && u.livingArsenalStance] ? u.livingArsenalStance : 'crystal';
}

function kingArsenalData(stance) {
  return KING_ARSENAL_DATA[stance] || KING_ARSENAL_DATA.crystal;
}

function advanceKingArsenalStance(u) {
  const idx = KING_ARSENAL_STANCES.indexOf(kingArsenalStance(u));
  u.livingArsenalStance = KING_ARSENAL_STANCES[(idx + 1) % KING_ARSENAL_STANCES.length];
  return u.livingArsenalStance;
}

function kingArsenalDamageMult(stance, target) {
  return stance === 'crown' && target && (target.isBoss || target.elite || target.isElite) ? 1.08 : 1;
}

function grantKingHolySwordCharges(u, amount, fill = false) {
  const cfg = kingHolySwordCfg(u) || {};
  const max = cfg.chargeMax || u.holySwordChargeMax || 5;
  u.holySwordCharges = fill ? max : Math.min(max, (u.holySwordCharges || 0) + amount);
  return u.holySwordCharges;
}

function grantKingCrystalGuard(u, dr, dur) {
  const cfg = kingHolySwordCfg(u);
  if (!cfg) return;
  u.crystalGuardDR = Math.max(u.crystalGuardDR || 0, dr || cfg.arsenalGuardDr || 0.08);
  u.crystalGuardTimer = Math.max(u.crystalGuardTimer || 0, dur || cfg.arsenalGuardDur || 2 * GAME_TICK_HZ);
}

function grantKingHolySwordDamageBuff(u, pct, dur) {
  const cfg = kingHolySwordCfg(u);
  if (!cfg) return;
  const nextMult = 1 + (pct || 0);
  const currentMult = u.holySwordDamageBuffTimer > 0 ? (u.holySwordDamageBuffMult || 1) : 1;
  if (nextMult < currentMult) return;
  u.holySwordDamageBuffMult = nextMult;
  u.holySwordDamageBuffTimer = Math.max(u.holySwordDamageBuffTimer || 0, dur || 0);
}

function applyKingArsenalCc(u, target, stance, cfg, enemies, dealDamage, addP, addDmg) {
  if (!u || !target || !isValidPlayerOffensiveTarget(target)) return;
  const data = kingArsenalData(stance);
  if (stance === 'crystal') {
    if (target.isBoss || target.elite || target.isElite) {
      target.slowTimer = Math.max(target.slowTimer || 0, cfg.crystalBossSlowDur || Math.round(1.5 * GAME_TICK_HZ));
      target.slowMult = Math.min(target.slowMult || 1, cfg.crystalBossSlow || 0.65);
      addDmg(target.x, target.y - target.size - 16, 'CRYSTAL SLOW', data.color, { sz: 10, bold: true });
    } else {
      target.stunned = Math.max(target.stunned || 0, cfg.crystalStunDur || Math.round(0.55 * GAME_TICK_HZ));
      addDmg(target.x, target.y - target.size - 16, 'CRYSTAL STUN', data.color, { sz: 10, bold: true });
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
      const chainDmg = Math.round((u.dmg || 1) * (cfg.thunderChainMult || 0.35));
      dealDamage(chain, chainDmg, u, 'magic');
      addP(chain.x, chain.y, data.color, 8, 3);
    }
    addDmg(target.x, target.y - target.size - 16, 'THUNDER SLOW', data.color, { sz: 10, bold: true });
  } else if (stance === 'crown') {
    if (target.isBoss || target.elite || target.isElite) {
      addDmg(target.x, target.y - target.size - 16, 'CROWN VERDICT', data.color, { sz: 10, bold: true });
    } else {
      const dx = target.x - u.x;
      const dy = target.y - u.y;
      const d = Math.hypot(dx, dy) || 1;
      const push = cfg.crownKnockback || 30;
      target.x += dx / d * push;
      target.y += dy / d * push;
      addDmg(target.x, target.y - target.size - 16, 'CROWN KNOCK', data.color, { sz: 10, bold: true });
    }
  }
  addP(target.x, target.y, data.color, 10, 3);
  addP(target.x, target.y, data.alt, 5, 2);
}

function lineDistanceToSegment(target, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((target.x - x1) * dx + (target.y - y1) * dy) / lenSq));
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  return Math.hypot(target.x - px, target.y - py);
}

function pickKingSwordTargets(u, enemies, primary, range, count) {
  const picked = [];
  for (const enemy of enemies) {
    if (!isValidPlayerOffensiveTarget(enemy) || dist(u, enemy) > range) continue;
    picked.push(enemy);
  }
  if (primary && isValidPlayerOffensiveTarget(primary) && !picked.includes(primary)) picked.push(primary);
  picked.sort((a, b) => {
    const score = e => (e === primary ? 10000 : 0) + (e.isBoss ? 700 : 0) + ((e.elite || e.isElite) ? 350 : 0) + Math.min(e.hp || 0, 2500) * 0.02 - dist(u, e) * 0.05;
    return score(b) - score(a);
  });
  return picked.slice(0, count);
}

function pushKingArsenalLineWarn(groundFx, x1, y1, x2, y2, width, color, label, frames = 30) {
  groundFx.push({ x: x1, y: y1, x2, y2, r: 0, maxR: 34, life: 0.82, color, holyBladeWarn: true, warnTimer: frames, warnMax: frames, warnKind: 'line', width, label });
}

function buildKingArsenalLanes(u, primary, targets, count, len, width) {
  const lanes = [];
  const baseAngle = primary ? Math.atan2(primary.y - u.y, primary.x - u.x) : 0;
  for (let i = 0; i < count; i++) {
    const target = targets[i] || null;
    const angle = target ? Math.atan2(target.y - u.y, target.x - u.x) : baseAngle + (i - Math.floor(count / 2)) * 0.28;
    const laneLen = target ? Math.max(80, Math.min(len, dist(u, target) + 28)) : len;
    lanes.push({ x1: u.x, y1: u.y, x2: u.x + Math.cos(angle) * laneLen, y2: u.y + Math.sin(angle) * laneLen, width, angle });
  }
  return lanes;
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
  if (swordCfg && t && t.hp > 0) {
    const angle = Math.atan2(t.y - u.y, t.x - u.x);
    const stance = kingArsenalStance(u);
    const stanceData = kingArsenalData(stance);
    beamFx.push({ x1: u.x, y1: u.y - 4, x2: t.x, y2: t.y, life: 0.18, maxLife: 0.18, color: stanceData.color + 'bb', width: 3.2, straight: true });
    if (_ohTier <= 0) {
      if (frame % 3 === 0) addP(t.x, t.y, stanceData.color, 1, 2);
    }
  }
  if (swordCfg && _ohTier > 0 && t.hp > 0) {
    const angle = Math.atan2(t.y - u.y, t.x - u.x);
    const stance = kingArsenalStance(u);
    const data = kingArsenalData(stance);
    if (_ohTier === 3) {
      grantKingHolySwordCharges(u, 1);
      const len = swordCfg.arsenalCutLength || 165;
      const width = swordCfg.arsenalCutWidth || 42;
      const x2 = u.x + Math.cos(angle) * len;
      const y2 = u.y + Math.sin(angle) * len;
      pushKingArsenalLineWarn(groundFx, u.x, u.y, x2, y2, width, data.color, data.label, 24);
      const primaryDamage = Math.round((u.dmg || dmg || 1) * (swordCfg.arsenalCutMult || 0.85) * kingArsenalDamageMult(stance, t));
      const laneDamage = Math.round((u.dmg || dmg || 1) * (swordCfg.arsenalCutLaneMult || 0.45));
      dealDamage(t, primaryDamage, u, 'magic');
      let laneHits = 0;
      for (const enemy of enemies) {
        if (enemy === t || !isValidPlayerOffensiveTarget(enemy)) continue;
        if (lineDistanceToSegment(enemy, u.x, u.y, x2, y2) > width) continue;
        dealDamage(enemy, Math.round(laneDamage * kingArsenalDamageMult(stance, enemy)), u, 'magic');
        addP(enemy.x, enemy.y, data.color, 6, 3);
        laneHits++;
      }
      applyKingArsenalCc(u, t, stance, swordCfg, enemies, dealDamage, addP, addDmg);
      beamFx.push({ x1: u.x, y1: u.y, x2, y2, life: 0.42, maxLife: 0.42, color: data.color, width: 7.5, straight: true });
      beamFx.push({ x1: t.x - Math.cos(angle + Math.PI / 2) * 26, y1: t.y - Math.sin(angle + Math.PI / 2) * 26, x2: t.x + Math.cos(angle + Math.PI / 2) * 26, y2: t.y + Math.sin(angle + Math.PI / 2) * 26, life: 0.34, maxLife: 0.34, color: data.alt, width: 4.5, straight: true });
      groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 52, life: 0.62, color: data.color });
      addP(t.x, t.y, data.color, 18, 4);
      addP(t.x, t.y, data.alt, 10, 3);
      addDmg(t.x, t.y - t.size - 8, 'ARSENAL CUT', data.color, { sz: 12, bold: true, outline: '#132033' });
      if (laneHits) addDmg(t.x, t.y + 16, 'LANE x' + laneHits, data.alt, { sz: 10, bold: true });
      advanceKingArsenalStance(u);
      if (SFX.holyLight) SFX.holyLight();
    }

    if (_ohTier === 5) {
      grantKingHolySwordCharges(u, 2);
      grantKingCrystalGuard(u, swordCfg.fivefoldGuardDr || 0.10, swordCfg.fivefoldGuardDur || 2 * GAME_TICK_HZ);
      grantKingHolySwordDamageBuff(u, swordCfg.fivefoldDamageBuff || 0.08, swordCfg.fivefoldDamageBuffDur || 4 * GAME_TICK_HZ);
      const targets = pickKingSwordTargets(u, enemies, t, swordCfg.fivefoldRange || 300, 5);
      const priority = targets[0] || t;
      for (let i = 0; i < 5; i++) {
        const target = targets[i] || priority;
        if (!target || !isValidPlayerOffensiveTarget(target)) continue;
        const extra = !targets[i];
        const mult = (swordCfg.fivefoldSwordMult || 0.62) * (extra ? (swordCfg.fivefoldConvergeMult || 0.35) : 1);
        dealDamage(target, Math.round((u.dmg || dmg || 1) * mult * kingArsenalDamageMult(stance, target)), u, 'magic');
        projectiles.push({ x: u.x + (i - 2) * 7, y: u.y - u.size * (0.92 + i * 0.04), target, tx: target.x, ty: target.y, speed: 1.9 + i * 0.10, projType: 'holySword', visualOnly: true, color: data.color, altColor: data.alt, _arrN: 18, _arrSz: 5, _swordLen: 42, _swordW: 10, _trailColor: data.alt, isPlayer: true, dmg: 0 });
        beamFx.push({ x1: u.x, y1: u.y - 8, x2: target.x, y2: target.y, life: 0.28, maxLife: 0.28, color: data.color + 'bb', width: 3.5, straight: true });
        addP(target.x, target.y, data.color, 6, 3);
      }
      applyKingArsenalCc(u, priority, stance, swordCfg, enemies, dealDamage, addP, addDmg);
      groundFx.push({ x: u.x, y: u.y, r: 0, maxR: 82, life: 0.66, color: data.color, flatten: true });
      addP(u.x, u.y, data.color, 24, 5);
      addP(u.x, u.y, data.alt, 14, 3);
      addDmg(priority.x, priority.y - priority.size - 8, 'FIVEFOLD JUDGMENT', data.color, { sz: 13, bold: true, outline: '#132033' });
      addDmg(u.x, u.y - u.size - 14, 'SAINT EDGE +8%', data.alt, { sz: 11, bold: true, outline: '#2a0f2d' });
      advanceKingArsenalStance(u);
      if (SFX.holyLight) SFX.holyLight();
    }

    if (_ohTier === 10) {
      grantKingHolySwordCharges(u, 0, true);
      grantKingCrystalGuard(u, swordCfg.crownCrossGuardDr || 0.12, swordCfg.crownCrossGuardDur || 3 * GAME_TICK_HZ);
      grantKingHolySwordDamageBuff(u, swordCfg.crownCrossDamageBuff || 0.15, swordCfg.crownCrossDamageBuffDur || 5 * GAME_TICK_HZ);
      const targets = pickKingSwordTargets(u, enemies, t, swordCfg.crownCrossRange || 300, 5);
      const lanes = buildKingArsenalLanes(u, t, targets, 5, swordCfg.crownCrossLength || 300, swordCfg.crownCrossWidth || 44);
      for (const lane of lanes) pushKingArsenalLineWarn(groundFx, lane.x1, lane.y1, lane.x2, lane.y2, lane.width, data.color, 'CROSS', swordCfg.crownCrossDelay || 15);
      u.holySwordEchoes = u.holySwordEchoes || [];
      u.holySwordEchoes.push({
        type: 'crownCross',
        timer: swordCfg.crownCrossDelay || 15,
        stance,
        main: t,
        lanes,
        mainDmg: Math.round((u.dmg || dmg || 1) * (swordCfg.crownCrossMainMult || 2.40) * kingArsenalDamageMult(stance, t)),
        lineDmg: Math.round((u.dmg || dmg || 1) * (swordCfg.crownCrossLineMult || 1.05)),
        echoTimer: swordCfg.crownCrossEchoDelay || 27,
        echoMainDmg: Math.round((u.dmg || dmg || 1) * (swordCfg.crownCrossEchoMainMult || 1.20)),
        echoLineDmg: Math.round((u.dmg || dmg || 1) * (swordCfg.crownCrossEchoLineMult || 0.55)),
        label: 'CROWN CROSS'
      });
      addP(t.x, t.y, data.color, 36, 6);
      addP(t.x, t.y, data.alt, 18, 4);
      addDmg(t.x, t.y - t.size - 12, 'CROWN CROSS', data.color, { sz: 14, bold: true, outline: '#132033' });
      addDmg(u.x, u.y - u.size - 14, 'ARSENAL SURGE +15%', data.alt, { sz: 12, bold: true, outline: '#2a0f2d' });
      showFlash('CROWN CROSS', data.color, 42);
      shake(9);
      advanceKingArsenalStance(u);
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
