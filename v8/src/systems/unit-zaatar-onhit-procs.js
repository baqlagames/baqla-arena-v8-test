import { GAME_TICK_HZ } from '../core/constants.js';

export function applyZaatarOnHitProcs(unit, target, {
  frame,
  ohTier,
  damage,
  isAimed,
  units,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  showFlash,
  emitParticle,
  addDamageText,
  shake,
}) {
  const u = unit;
  const t = target;
  const _ohTier = ohTier;
  const dmg = damage;
  const groundFx = groundEffects;
  const addP = emitParticle;
  const addDmg = addDamageText;
  let aimed = isAimed;

  if (u.aimedShotMark && t.hp > 0) {
    const trueshotActive = u._trueshot && u._trueshot.t < u._trueshot.dur;
    if (trueshotActive) {
      const trueshotDamage = Math.round(dmg * (u._trueshot.dmgMult - 1));
      dealDamage(t, trueshotDamage, u, 'normal');
      t._hunterMark = { dur: u.aimedShotMark.markDur, amp: u.aimedShotMark.markAmp, from: u };
      aimed = true;
      addP(t.x, t.y, '#ffd700', 6, 2);
      if (frame % 20 < 3) addDmg(t.x, t.y - t.size, 'MARKED!', '#ff4444');
    } else {
      u.aimedShotMark.counter++;
      if (u.aimedShotMark.counter >= u.aimedShotMark.every) {
        u.aimedShotMark.counter = 0;
        const aimedDamage = Math.round(dmg * (u.aimedShotMark.mult - 1));
        dealDamage(t, aimedDamage, u, 'normal');
        t._hunterMark = { dur: u.aimedShotMark.markDur, amp: u.aimedShotMark.markAmp, from: u };
        aimed = true;
        addP(u.x, u.y, '#ffd700', 32, 5);
        addP(t.x, t.y, '#ff4444', 16, 4);
        addDmg(u.x, u.y - u.size, 'AIMED!', '#ffd700');
        addDmg(t.x, t.y - t.size, 'MARKED!', '#ff4444');
        shake(4);
      }
    }
  }

  if (u.aimedShotMark && _ohTier === 10 && t.hp > 0) {
    const arrowRainDamage = Math.round(u.dmg * 0.50);
    u._arrowRainZone = { x: t.x, y: t.y, r: 80, timer: 5 * GAME_TICK_HZ, maxTimer: 5 * GAME_TICK_HZ, dmg: arrowRainDamage, owner: u, _active: 0 };
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 80, life: 0.4, color: '#ff6644' });
    addDmg(t.x, t.y - t.size - 10, 'KILL ZONE!', '#ff8844');
  }

  if (u.aimedShotMark && t.hp > 0 && u._arrowRainZone) {
    const az = u._arrowRainZone;
    if (Math.hypot(t.x - az.x, t.y - az.y) <= az.r) {
      az._active = 12;
      for (const enemy of enemies) {
        if (enemy === t || enemy.hp <= 0) continue;
        if (Math.hypot(enemy.x - az.x, enemy.y - az.y) <= az.r) {
          dealDamage(enemy, az.dmg, az.owner, 'physical');
          addP(enemy.x, enemy.y, '#ff8844', 4, 3);
        }
      }
      addP(t.x, t.y, '#ff8844', 6, 3);
    }
  }

  if (u.lockAndLoad && u.lockAndLoad.charges > 0 && t.hp > 0) {
    u.lockAndLoad.charges--;
    const bonusDamage = Math.round(dmg * u.lockAndLoad.dmgMult);
    dealDamage(t, bonusDamage, u, 'physical');
    addP(t.x, t.y, '#ff8844', 6, 3);
    addDmg(t.x, t.y - t.size, 'LOADED!', '#ff8844');
  }

  if (u.killCommand && t.hp > 0) {
    u.killCommand.counter++;
    if (u.killCommand.counter >= u.killCommand.every) {
      u.killCommand.counter = 0;
      let pet = null;
      for (const minion of units) {
        if (minion.isMinion && minion.parent === u && minion.hp > 0) {
          pet = minion;
          break;
        }
      }
      if (pet) {
        const killCommandDamage = Math.round(u.dmg * u.killCommand.dmgMult);
        dealDamage(t, killCommandDamage, u, 'physical');
        for (let i = 1; i <= 6; i++) {
          const pct = i / 6;
          addP(pet.x + (t.x - pet.x) * pct, pet.y + (t.y - pet.y) * pct, '#3aa84e', 2, 3);
        }
        addP(t.x, t.y, '#3aa84e', 16, 4);
        addDmg(t.x, t.y - t.size, 'KILL COMMAND!', '#3aa84e');
        shake(4);
      }
    }
  }

  if (u._arcaneShot && _ohTier === 3 && t.hp > 0) {
    const arcaneDamage = Math.round(dmg * 0.70);
    dealDamage(t, arcaneDamage, u, 'magic');
    beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.6, maxLife: 0.6, color: '#aa44ff', width: 6, straight: true });
    beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.4, maxLife: 0.4, color: '#cc88ff', width: 10, straight: true });
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI * 2 * i / 6 + frame * 0.05;
      beamFx.push({ x1: t.x, y1: t.y, x2: t.x + Math.cos(angle) * 45, y2: t.y + Math.sin(angle) * 45, life: 0.7, maxLife: 0.7, color: '#cc88ff', width: 4, straight: true });
    }
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI * 2 * i / 6 + frame * 0.05 + Math.PI / 6;
      beamFx.push({ x1: t.x, y1: t.y, x2: t.x + Math.cos(angle) * 30, y2: t.y + Math.sin(angle) * 30, life: 0.6, maxLife: 0.6, color: '#aa44ff', width: 3, straight: true });
    }
    for (let i = 0; i < 16; i++) {
      const angle = Math.PI * 2 * i / 16;
      addP(t.x + Math.cos(angle) * 38, t.y + Math.sin(angle) * 38, '#aa44ff', 3, 4);
    }
    addP(t.x, t.y, '#cc88ff', 24, 6);
    addP(t.x, t.y, '#ffffff', 8, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 50, life: 0.6, color: '#aa44ff' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 35, life: 0.4, color: '#cc88ff' });
    addDmg(t.x, t.y - t.size, 'ARCANE!', '#aa44ff');
    shake(3);
  }

  if (u._multiShot && _ohTier === 5 && t.hp > 0) {
    let shotCount = 0;
    for (const enemy of enemies) {
      if (enemy === t || enemy.hp <= 0 || shotCount >= 3) continue;
      if (Math.hypot(enemy.x - t.x, enemy.y - t.y) <= 120) {
        const multiShotDamage = Math.round(dmg * 0.40);
        dealDamage(enemy, multiShotDamage, u, 'physical');
        beamFx.push({ x1: u.x, y1: u.y, x2: enemy.x, y2: enemy.y, life: 0.5, maxLife: 0.5, color: '#ffcc44', width: 4, straight: true });
        addP(enemy.x, enemy.y, '#ffcc44', 12, 5);
        groundFx.push({ x: enemy.x, y: enemy.y, r: 0, maxR: 25, life: 0.3, color: '#ffcc44' });
        shotCount++;
      }
    }
    addP(u.x, u.y, '#ffcc44', 28, 6);
    addP(u.x, u.y, '#ffffff', 10, 3);
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: 40, life: 0.4, color: '#ffcc44' });
    addDmg(u.x, u.y - u.size, 'MULTI-SHOT!', '#ffcc44');
    showFlash('MULTI-SHOT!', '#ffcc44', 20);
    shake(4);
  }

  if (u._trueshotProc && _ohTier === 10 && t.hp > 0) {
    u._trueshotAuraTimer = 5 * GAME_TICK_HZ;
    if (!u._taOrigAtkSpd) {
      u._taOrigAtkSpd = u.atkSpd;
      u.atkSpd = Math.max(8, Math.round(u.atkSpd * 0.70));
    }
    addP(u.x, u.y, '#ffd700', 30, 7);
    addP(u.x, u.y, '#ffaa00', 20, 5);
    for (let i = 0; i < 12; i++) {
      const angle = Math.PI * 2 * i / 12;
      addP(u.x + Math.cos(angle) * u.size * 2, u.y + Math.sin(angle) * u.size * 2, '#ffd700', 2, 4);
    }
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 2.5, life: 0.6, color: '#ffd700' });
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 1.5, life: 0.4, color: '#ffaa00' });
    addDmg(u.x, u.y - u.size - 10, 'TRUESHOT AURA!', '#ffd700');
    showFlash('TRUESHOT AURA!', '#ffd700', 30);
    shake(6);
  }

  if (u._trueshotAuraTimer > 0 && u.aimedShotMark) {
    if (u.aimedShotMark.counter >= 2 && u.aimedShotMark.counter < u.aimedShotMark.every) {
      u.aimedShotMark.counter = u.aimedShotMark.every;
    }
  }

  if (u._serpentSting && _ohTier === 3 && t.hp > 0) {
    const serpentDamage = Math.round(dmg * 0.60);
    dealDamage(t, serpentDamage, u, 'magic');
    t._serpentPoison = { dur: 3 * GAME_TICK_HZ, dmgPerTick: Math.round(dmg * 0.15 / GAME_TICK_HZ * 30), tickRate: 30, tickCD: 0, from: u };
    beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.6, maxLife: 0.6, color: '#44cc22', width: 5, straight: true });
    beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.4, maxLife: 0.4, color: '#88ff44', width: 9, straight: true });
    const serpentAngle = Math.atan2(t.y - u.y, t.x - u.x);
    for (let i = 0; i < 24; i++) {
      const pct = i / 24;
      const x = u.x + (t.x - u.x) * pct;
      const y = u.y + (t.y - u.y) * pct;
      const offset = Math.sin(pct * Math.PI * 4) * 16;
      addP(x + Math.cos(serpentAngle + Math.PI / 2) * offset, y + Math.sin(serpentAngle + Math.PI / 2) * offset, '#44cc22', 2, 4);
    }
    beamFx.push({ x1: t.x - 14, y1: t.y - 10, x2: t.x, y2: t.y + 14, life: 0.7, maxLife: 0.7, color: '#44cc22', width: 5, straight: true });
    beamFx.push({ x1: t.x + 14, y1: t.y - 10, x2: t.x, y2: t.y + 14, life: 0.7, maxLife: 0.7, color: '#44cc22', width: 5, straight: true });
    beamFx.push({ x1: t.x - 14, y1: t.y - 10, x2: t.x + 14, y2: t.y - 10, life: 0.7, maxLife: 0.7, color: '#88ff44', width: 4, straight: true });
    beamFx.push({ x1: t.x, y1: t.y + 14, x2: t.x - 8, y2: t.y + 24, life: 0.6, maxLife: 0.6, color: '#ff4444', width: 2, straight: true });
    beamFx.push({ x1: t.x, y1: t.y + 14, x2: t.x + 8, y2: t.y + 24, life: 0.6, maxLife: 0.6, color: '#ff4444', width: 2, straight: true });
    addP(t.x - 6, t.y - 6, '#ffff00', 3, 3);
    addP(t.x + 6, t.y - 6, '#ffff00', 3, 3);
    addP(t.x, t.y, '#44cc22', 22, 6);
    addP(t.x, t.y, '#88ff44', 14, 4);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 45, life: 0.5, color: '#44cc22' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 30, life: 0.35, color: '#88ff44' });
    addDmg(t.x, t.y - t.size, 'SERPENT STING!', '#44cc22');
    shake(3);
  }

  if (u._steelTrap && _ohTier === 5 && t.hp > 0) {
    const steelTrapDamage = Math.round(dmg * 0.80);
    dealDamage(t, steelTrapDamage, u, 'physical');
    if (!t.isBoss) t.stunned = Math.max(t.stunned || 0, Math.round(1.5 * GAME_TICK_HZ));
    beamFx.push({ x1: t.x - 25, y1: t.y + 15, x2: t.x, y2: t.y - 10, life: 0.8, maxLife: 0.8, color: '#888888', width: 6, straight: true });
    beamFx.push({ x1: t.x + 25, y1: t.y + 15, x2: t.x, y2: t.y - 10, life: 0.8, maxLife: 0.8, color: '#888888', width: 6, straight: true });
    for (let i = 0; i < 4; i++) {
      const pct = 0.2 + i * 0.2;
      beamFx.push({ x1: t.x - 25 * (1 - pct), y1: t.y + 15 - 25 * pct, x2: t.x - 25 * (1 - pct) + 8, y2: t.y + 15 - 25 * pct - 6, life: 0.7, maxLife: 0.7, color: '#aaaaaa', width: 2, straight: true });
    }
    for (let i = 0; i < 4; i++) {
      const pct = 0.2 + i * 0.2;
      beamFx.push({ x1: t.x + 25 * (1 - pct), y1: t.y + 15 - 25 * pct, x2: t.x + 25 * (1 - pct) - 8, y2: t.y + 15 - 25 * pct - 6, life: 0.7, maxLife: 0.7, color: '#aaaaaa', width: 2, straight: true });
    }
    beamFx.push({ x1: t.x, y1: t.y - 60, x2: t.x, y2: t.y, life: 0.5, maxLife: 0.5, color: '#ccaa44', width: 8, straight: true });
    addP(t.x, t.y, '#888888', 30, 6);
    addP(t.x, t.y, '#ccaa44', 18, 5);
    addP(t.x, t.y, '#ffffff', 8, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 50, life: 0.6, color: '#888888' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 30, life: 0.4, color: '#ccaa44' });
    addDmg(t.x, t.y - t.size, 'STEEL TRAP!', '#888888');
    showFlash('STEEL TRAP!', '#ccaa44', 20);
    shake(6);
  }

  if (u._wildfireBomb && _ohTier === 10 && t.hp > 0) {
    const wildfireDamage = Math.round(dmg * 1.20);
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - t.x, enemy.y - t.y) <= 65) {
        dealDamage(enemy, wildfireDamage, u, 'magic');
        addP(enemy.x, enemy.y, '#ff6600', 8, 4);
      }
    }
    u._wildfireZone = { x: t.x, y: t.y, r: 65, dur: 3 * GAME_TICK_HZ, dmgPerTick: Math.round(dmg * 0.20 / GAME_TICK_HZ * 30), tickRate: 30, tickCD: 0, from: u };
    addP(t.x, t.y, '#ff4400', 30, 7);
    addP(t.x, t.y, '#ff8800', 22, 5);
    addP(t.x, t.y, '#ffcc00', 14, 4);
    for (let i = 0; i < 14; i++) {
      const angle = Math.PI * 2 * i / 14;
      addP(t.x + Math.cos(angle) * 65, t.y + Math.sin(angle) * 65, '#ff6600', 2, 4);
    }
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 65, life: 0.6, color: '#ff4400' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 40, life: 0.4, color: '#ff8800' });
    addDmg(t.x, t.y - t.size - 10, 'WILDFIRE BOMB!', '#ff4400');
    showFlash('WILDFIRE BOMB!', '#ff4400', 30);
    shake(8);
  }

  if (u._cobraShot && _ohTier === 3 && t.hp > 0) {
    const cobraDamage = Math.round(dmg * 0.60);
    dealDamage(t, cobraDamage, u, 'magic');
    for (const minion of units) {
      if (!minion.isMinion || minion.parent !== u || minion.hp <= 0) continue;
      if (minion._bestialWrathTimer > 0) minion._bestialWrathTimer += GAME_TICK_HZ;
      if (minion._frenzyBMTimer > 0) minion._frenzyBMTimer += GAME_TICK_HZ;
    }
    beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.6, maxLife: 0.6, color: '#44aa22', width: 5, straight: true });
    beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.4, maxLife: 0.4, color: '#66cc44', width: 9, straight: true });
    for (let i = 0; i < 9; i++) {
      const angle = -Math.PI * 0.8 + Math.PI * 1.6 * i / 8;
      beamFx.push({ x1: t.x, y1: t.y - 8, x2: t.x + Math.cos(angle) * 40, y2: t.y - 8 + Math.sin(angle) * 40, life: 0.7, maxLife: 0.7, color: '#44aa22', width: 4, straight: true });
    }
    for (let i = 0; i < 8; i++) {
      const angleA = -Math.PI * 0.8 + Math.PI * 1.6 * i / 8;
      const angleB = -Math.PI * 0.8 + Math.PI * 1.6 * (i + 1) / 8;
      beamFx.push({ x1: t.x + Math.cos(angleA) * 40, y1: t.y - 8 + Math.sin(angleA) * 40, x2: t.x + Math.cos(angleB) * 40, y2: t.y - 8 + Math.sin(angleB) * 40, life: 0.7, maxLife: 0.7, color: '#66cc44', width: 3, straight: true });
    }
    beamFx.push({ x1: t.x - 8, y1: t.y + 4, x2: t.x - 5, y2: t.y + 24, life: 0.7, maxLife: 0.7, color: '#ffffff', width: 3, straight: true });
    beamFx.push({ x1: t.x + 8, y1: t.y + 4, x2: t.x + 5, y2: t.y + 24, life: 0.7, maxLife: 0.7, color: '#ffffff', width: 3, straight: true });
    addP(t.x - 8, t.y - 12, '#ffff00', 4, 4);
    addP(t.x + 8, t.y - 12, '#ffff00', 4, 4);
    addP(t.x, t.y, '#44aa22', 24, 6);
    addP(t.x, t.y, '#66cc44', 14, 4);
    addP(t.x, t.y, '#ffffff', 6, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 50, life: 0.5, color: '#44aa22' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 35, life: 0.35, color: '#66cc44' });
    addDmg(t.x, t.y - t.size, 'COBRA SHOT!', '#44aa22');
    shake(3);
  }

  if (u._barbedShot && _ohTier === 5 && t.hp > 0) {
    const barbedDamage = Math.round(dmg * 0.80);
    dealDamage(t, barbedDamage, u, 'physical');
    t._barbedBleed = { dur: 3 * GAME_TICK_HZ, dmgPerTick: Math.round(dmg * 0.25 / GAME_TICK_HZ * 30), tickRate: 30, tickCD: 0, from: u };
    for (const minion of units) {
      if (!minion.isMinion || minion.parent !== u || minion.hp <= 0) continue;
      if (!minion._bsOrigAtkSpd) {
        minion._bsOrigAtkSpd = minion.atkSpd;
        minion.atkSpd = Math.max(8, Math.round(minion.atkSpd * 0.85));
      }
      minion._barbedShotTimer = 3 * GAME_TICK_HZ;
    }
    beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.6, maxLife: 0.6, color: '#cc2222', width: 6, straight: true });
    beamFx.push({ x1: u.x, y1: u.y, x2: t.x, y2: t.y, life: 0.4, maxLife: 0.4, color: '#ff4444', width: 10, straight: true });
    beamFx.push({ x1: t.x - 20, y1: t.y - 20, x2: t.x + 20, y2: t.y + 20, life: 0.7, maxLife: 0.7, color: '#cc2222', width: 4, straight: true });
    beamFx.push({ x1: t.x + 20, y1: t.y - 20, x2: t.x - 20, y2: t.y + 20, life: 0.7, maxLife: 0.7, color: '#cc2222', width: 4, straight: true });
    addP(t.x, t.y, '#cc2222', 28, 6);
    addP(t.x, t.y, '#ff4444', 18, 5);
    addP(t.x, t.y, '#880000', 10, 3);
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 45, life: 0.5, color: '#cc2222' });
    groundFx.push({ x: t.x, y: t.y, r: 0, maxR: 28, life: 0.35, color: '#ff4444' });
    addDmg(t.x, t.y - t.size, 'BARBED SHOT!', '#cc2222');
    showFlash('BARBED SHOT!', '#cc2222', 20);
    shake(5);
  }

  if (u._frenzyProc && _ohTier === 10 && t.hp > 0) {
    for (const minion of units) {
      if (!minion.isMinion || minion.parent !== u || minion.hp <= 0) continue;
      if (!minion._frenzyBMOrigAtkSpd) minion._frenzyBMOrigAtkSpd = minion.atkSpd;
      minion.atkSpd = Math.max(8, Math.round(minion._frenzyBMOrigAtkSpd * 0.60));
      minion._frenzyBMTimer = 5 * GAME_TICK_HZ;
      minion._frenzyBMHealPct = 0.03;
      addP(minion.x, minion.y, '#ff4444', 12, 4);
      addP(minion.x, minion.y, '#ff8800', 8, 3);
    }
    addP(u.x, u.y, '#ff4444', 30, 7);
    addP(u.x, u.y, '#ff8800', 20, 5);
    for (let i = 0; i < 12; i++) {
      const angle = Math.PI * 2 * i / 12;
      addP(u.x + Math.cos(angle) * u.size * 2, u.y + Math.sin(angle) * u.size * 2, '#ff4444', 2, 4);
    }
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 2.5, life: 0.6, color: '#ff4444' });
    groundFx.push({ x: u.x, y: u.y, r: 0, maxR: u.size * 1.5, life: 0.4, color: '#ff8800' });
    addDmg(u.x, u.y - u.size - 10, 'FRENZY!', '#ff4444');
    showFlash('FRENZY!', '#ff4444', 30);
    shake(6);
  }

  return { isAimed: aimed };
}
