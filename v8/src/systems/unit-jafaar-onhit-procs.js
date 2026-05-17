import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function applyJafaarOnHitProcs(unit, target, {
  frame,
  ohTier,
  damage,
  units,
  enemies,
  bombs,
  beamFx,
  groundEffects,
  randomRange,
  dealDamage,
  applyJafaarAgony,
  findBasicSecondTarget,
  showFlash,
  emitParticle,
  addDamageText,
  shake,
}) {
  const u = unit;
  const t = target;
  const _ohTier = ohTier;
  const dmg = damage;
  const rnd = randomRange;
  const groundFx = groundEffects;
  const addP = emitParticle;
  const addDmg = addDamageText;

  if (u.agony && t.hp > 0) {
    applyJafaarAgony(u, t, false);
  }

  if (u.immolate && t.hp > 0) {
    if (u.immolate.patches.length >= u.immolate.maxPatches) u.immolate.patches.shift();
    u.immolate.patches.push({ x: t.x, y: t.y, dur: u.immolate.dur, t: 0, radius: u.immolate.radius, dmg: Math.round(u.dmg * u.immolate.dmgPct), from: u });
    addP(t.x, t.y, '#ff6600', 12, 3);
    addP(t.x, t.y, '#ffcc00', 5, 2);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: u.immolate.radius, life: 0.32, color: '#ff6600' });
    if (frame % 24 < 2) addDmg(t.x, t.y - t.size - 6, 'IMMOLATE', '#ff6600', { sz: 9, bold: true });
  }

  if (u.havoc && (!u.havoc.target || u.havoc.target.hp <= 0 || u.havoc.target === t)) {
    u.havoc.target = findBasicSecondTarget(u, t, 220);
  }
  if (u.havoc && u.havoc.target && u.havoc.target.hp > 0 && u.havoc.target !== t) {
    const havocDamage = Math.round(dmg * u.havoc.mirrorPct);
    dealDamage(u.havoc.target, havocDamage, u, 'magic');
    for (let i = 1; i <= 4; i++) {
      const pct = i / 4;
      addP(t.x + (u.havoc.target.x - t.x) * pct, t.y + (u.havoc.target.y - t.y) * pct, '#ff4466', 1, 2);
    }
    beamFx.push({ x1: t.x, y1: t.y - t.size * 0.15, x2: u.havoc.target.x, y2: u.havoc.target.y - u.havoc.target.size * 0.15, life: 0.18, maxLife: 0.18, color: '#ff4466', width: 2.5, straight: false });
    if (frame % 12 < 2) groundFx.push({ x: u.havoc.target.x, y: u.havoc.target.y, r: 0, maxR: 30, life: 0.25, color: '#ff4466' });
    if (frame % 20 < 2) addDmg(u.havoc.target.x, u.havoc.target.y - u.havoc.target.size, 'HAVOC!', '#ff4466');
  }

  if (u._maleficRapture && _ohTier === 3 && t.hp > 0) {
    let dotCount = 0;
    if (t._agonyStacks > 0) dotCount++;
    if (t._igniteStacks && t._igniteStacks.length > 0) dotCount++;
    if (t.bleedTimer > 0 || t.garroteBleedTimer > 0) dotCount++;
    if (t.poisonTimer > 0 || t.deadlyPoisonStacks > 0) dotCount++;
    if (t.toxicBrewStacks > 0) dotCount++;
    const raptureMult = Math.min(1.20, 0.50 + 0.20 * dotCount);
    const raptureDamage = Math.round(u.dmg * raptureMult);
    dealDamage(t, raptureDamage, u, 'magic');
    addP(t.x, t.y, '#9b59b6', 18, 5);
    addP(t.x, t.y, '#3a0a3a', 14, 4);
    addP(t.x, t.y, '#cc88ff', 8, 3);
    for (let i = 0; i < 6 + dotCount * 2; i++) addP(t.x + rnd(-14, 14), t.y + rnd(-14, 14), '#7b3a9a', 2, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 25 + dotCount * 5, life: 0.35, color: '#5a1a5a' });
    beamFx.push({ x1: u.x, y1: u.y - u.size * 0.3, x2: t.x, y2: t.y, life: 8, maxLife: 8, color: '#9b59b6', width: 3, straight: true });
    addDmg(t.x, t.y - t.size - 6, dotCount >= 2 ? 'RAPTURE x' + dotCount + '!' : 'RAPTURE!', '#cc88ff');
    if (dotCount >= 2) shake(2 + dotCount);
  }

  if (u._soulRot && _ohTier === 5 && t.hp > 0) {
    const soulRotDamage = Math.round(u.dmg * 0.60);
    const radius = 55;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && dist(t, enemy) <= radius) {
        dealDamage(enemy, soulRotDamage, u, 'magic');
        if (!enemy._agonyStacks) enemy._agonyStacks = 0;
        if (enemy._agonyStacks < (u.agony ? u.agony.maxStacks : 3)) enemy._agonyStacks++;
        enemy._agonyTimer = 6 * GAME_TICK_HZ;
        enemy._agonyFrom = u;
        enemy._agonyTickDmg = Math.round(u.dmg * (u.agony ? u.agony.tickMult : 0.25));
        addP(enemy.x, enemy.y, '#7b3a9a', 10, 4);
        addP(enemy.x, enemy.y, '#9b59b6', 6, 3);
      }
    }
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: radius, life: 0.6, color: '#5a1a5a' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: radius * 0.6, life: 0.4, color: '#9b59b6' });
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI * 2 * i / 10;
      addP(t.x + Math.cos(angle) * radius * 0.7, t.y + Math.sin(angle) * radius * 0.7, '#cc88ff', 2, 3);
    }
    addDmg(t.x, t.y - t.size - 6, 'SOUL ROT!', '#9b59b6');
    shake(4);
  }

  if (u._darkSoulProc && _ohTier === 10 && t.hp > 0) {
    u._darkSoulTimer = 5 * GAME_TICK_HZ;
    if (u.agony && u._dsOrigMaxStacks == null) {
      u._dsOrigMaxStacks = u.agony.maxStacks;
      u.agony.maxStacks = u.agony.maxStacks + 2;
    }
    addP(u.x, u.y, '#9b59b6', 30, 7);
    addP(u.x, u.y, '#3a0a3a', 22, 5);
    addP(u.x, u.y, '#cc88ff', 14, 4);
    for (let i = 0; i < 14; i++) {
      const angle = Math.PI * 2 * i / 14;
      addP(u.x + Math.cos(angle) * u.size * 2, u.y + Math.sin(angle) * u.size * 2, '#9b59b6', 2, 4);
    }
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 2.5, life: 0.6, color: '#5a1a5a' });
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 1.5, life: 0.4, color: '#9b59b6' });
    shake(8);
  }

  if (u._demonbolt && _ohTier === 3 && t.hp > 0) {
    const demonboltDamage = Math.round(u.dmg * 0.70);
    dealDamage(t, demonboltDamage, u, 'magic');
    addP(t.x, t.y, '#aa66ff', 18, 5);
    addP(t.x, t.y, '#5a3a8a', 12, 4);
    addP(t.x, t.y, '#cc88ff', 8, 3);
    for (let i = 0; i < 6; i++) addP(t.x + rnd(-12, 12), t.y + rnd(-12, 12), '#aa66ff', 2, 3);
    addDmg(t.x, t.y - t.size - 6, 'DEMONBOLT!', '#aa66ff');
    beamFx.push({ x1: u.x, y1: u.y - u.size * 0.3, x2: t.x, y2: t.y, life: 10, maxLife: 10, color: '#aa66ff', width: 4, straight: true });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 28, life: 0.3, color: '#5a3a8a' });
    shake(2);
    let nearestMinion = null;
    let nearestDistance = Infinity;
    for (const minion of units) {
      if (minion.isMinion && minion.parent === u && minion.hp > 0) {
        const minionDistance = dist(u, minion);
        if (minionDistance < nearestDistance) {
          nearestDistance = minionDistance;
          nearestMinion = minion;
        }
      }
    }
    if (nearestMinion) {
      const heal = Math.round(nearestMinion.maxHp * 0.05);
      nearestMinion.hp = Math.min(nearestMinion.maxHp, nearestMinion.hp + heal);
      addP(nearestMinion.x, nearestMinion.y, '#33ff66', 8, 3);
      beamFx.push({ x1: u.x, y1: u.y, x2: nearestMinion.x, y2: nearestMinion.y, life: 6, maxLife: 6, color: '#33ff66', width: 2, straight: true });
    }
  }

  if (u._handOfGuldan && _ohTier === 5 && t.hp > 0) {
    for (let i = 0; i < 3; i++) {
      const meteorX = t.x + rnd(-25, 25);
      const meteorY = t.y + rnd(-25, 25);
      bombs.push({
        x: meteorX,
        y: meteorY - 100,
        fromX: meteorX,
        fromY: meteorY - 100,
        tx: meteorX,
        ty: meteorY,
        t: 0,
        dur: 14 + i * 7,
        dmg: Math.round(u.dmg * 0.30),
        radius: 35,
        attacker: u,
        isPlayer: true,
        color: '#33ff66',
      });
      addP(meteorX, meteorY, '#33ff66', 6, 3);
    }
    addP(t.x, t.y, '#33ff66', 16, 4);
    addP(t.x, t.y, '#5a3a8a', 10, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 40, life: 0.4, color: '#33ff66' });
    addDmg(t.x, t.y - t.size - 6, "GUL'DAN!", '#33ff66');
    shake(3);
  }

  if (u._netherPortalProc && _ohTier === 10 && t.hp > 0) {
    u._netherPortalTimer = 6 * GAME_TICK_HZ;
    for (const minion of units) {
      if (!minion.isMinion || minion.parent !== u || minion.hp <= 0) continue;
      if (!minion._npOrigDmg) {
        minion._npOrigDmg = minion.dmg;
        minion._npOrigAtkSpd = minion.atkSpd;
      }
      minion.dmg = Math.round(minion._npOrigDmg * 1.40);
      minion.atkSpd = Math.max(8, Math.round(minion._npOrigAtkSpd * 0.70));
      minion._npTimer = 6 * GAME_TICK_HZ;
      addP(minion.x, minion.y, '#33ff66', 16, 5);
      groundFx.push({ x: minion.x, y: minion.y, r: 0, maxR: minion.size * 2, life: 0.4, color: '#33ff66' });
    }
    addP(u.x, u.y, '#33ff66', 28, 6);
    addP(u.x, u.y, '#5a3a8a', 20, 5);
    addP(u.x, u.y, '#aa66ff', 12, 4);
    for (let i = 0; i < 12; i++) {
      const angle = Math.PI * 2 * i / 12;
      addP(u.x + Math.cos(angle) * u.size * 2, u.y + Math.sin(angle) * u.size * 2, '#33ff66', 2, 4);
    }
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 2.5, life: 0.6, color: '#33ff66' });
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 1.5, life: 0.4, color: '#5a3a8a' });
    addDmg(u.x, u.y - u.size - 10, 'NETHER PORTAL!', '#33ff66');
    showFlash('NETHER PORTAL!', '#33ff66', 30);
    shake(7);
  }

  if (u._conflagrate && _ohTier === 3 && t.hp > 0) {
    let inPatch = false;
    if (u.immolate) {
      for (const patch of u.immolate.patches) {
        if (dist({ x: patch.x, y: patch.y }, t) <= patch.radius) {
          inPatch = true;
          break;
        }
      }
    }
    const conflagrateMult = inPatch ? 1.30 : 0.80;
    const conflagrateDamage = Math.round(u.dmg * conflagrateMult);
    dealDamage(t, conflagrateDamage, u, 'magic');
    addP(t.x, t.y, '#ff6600', 18, 5);
    addP(t.x, t.y, '#ffaa00', 14, 4);
    addP(t.x, t.y, '#ff2200', 8, 3);
    for (let i = 0; i < 8; i++) addP(t.x + rnd(-12, 12), t.y + rnd(-12, 12), i % 2 ? '#ff4400' : '#ffcc00', 2, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: inPatch ? 35 : 25, life: 0.35, color: '#ff4400' });
    beamFx.push({ x1: u.x, y1: u.y - u.size * 0.3, x2: t.x, y2: t.y, life: 8, maxLife: 8, color: '#ff6600', width: 3, straight: true });
    addDmg(t.x, t.y - t.size - 6, inPatch ? 'CONFLAGRATE!!' : 'CONFLAGRATE!', '#ff6600');
    shake(inPatch ? 5 : 2);
  }

  if (u._rainOfFire && _ohTier === 5 && t.hp > 0) {
    const rainDamage = Math.round(u.dmg * 1.0);
    const radius = 60;
    for (const enemy of enemies) {
      if (enemy.hp > 0 && dist(t, enemy) <= radius) {
        dealDamage(enemy, rainDamage, u, 'magic');
        addP(enemy.x, enemy.y, '#ff6600', 12, 4);
        addP(enemy.x, enemy.y, '#ffaa00', 6, 3);
      }
    }
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: radius, life: 0.6, color: '#ff4400' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: radius * 0.6, life: 0.4, color: '#ff6600' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: radius * 1.18, life: 0.35, color: '#ffcc00' });
    for (let i = 0; i < 12; i++) {
      const angle = Math.PI * 2 * i / 12;
      addP(t.x + Math.cos(angle) * radius * 0.7, t.y + Math.sin(angle) * radius * 0.7, '#ff4400', 2, 4);
    }
    addP(t.x, t.y, '#ff6600', 28, 6);
    addP(t.x, t.y, '#ffcc00', 18, 4);
    addP(t.x, t.y, '#220000', 10, 4);
    addDmg(t.x, t.y - t.size - 6, 'RAIN OF FIRE!', '#ff4400');
    if (u.immolate) {
      if (u.immolate.patches.length >= u.immolate.maxPatches) u.immolate.patches.shift();
      u.immolate.patches.push({ x: t.x, y: t.y, dur: 2 * GAME_TICK_HZ, t: 0, radius, dmg: Math.round(u.dmg * u.immolate.dmgPct), from: u });
    }
    shake(6);
  }

  if (u._darkSoulInstability && _ohTier === 10 && t.hp > 0) {
    u._darkSoulInstTimer = 5 * GAME_TICK_HZ;
    if (u.crit && u._dsiOrigCrit == null) {
      u._dsiOrigCrit = u.crit.chance;
      u.crit.chance = Math.min(1, u.crit.chance + 0.30);
    }
    if (u.havoc && u._dsiOrigMirror == null) {
      u._dsiOrigMirror = u.havoc.mirrorPct;
      u.havoc.mirrorPct = 0.80;
    }
    addP(u.x, u.y, '#ff6600', 30, 7);
    addP(u.x, u.y, '#ff2200', 22, 5);
    addP(u.x, u.y, '#ffcc00', 14, 4);
    for (let i = 0; i < 14; i++) {
      const angle = Math.PI * 2 * i / 14;
      addP(u.x + Math.cos(angle) * u.size * 2, u.y + Math.sin(angle) * u.size * 2, '#ff4400', 2, 4);
    }
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 2.5, life: 0.6, color: '#ff4400' });
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 1.5, life: 0.4, color: '#ff6600' });
    shake(8);
  }
}
