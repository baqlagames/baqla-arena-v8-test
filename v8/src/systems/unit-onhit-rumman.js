import { GAME_TICK_HZ } from '../core/constants.js';

export function applyRummanOnHitProcs(unit, target, {
  ohTier,
  damage,
  units,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  randomRange,
  emitParticle,
  addDamageText,
  showFlash,
  shake,
}) {
  applyRummanBaseOnHitProcs(unit, target, {
    ohTier,
    damage,
    units,
    enemies,
    beamFx,
    groundEffects,
    dealDamage,
    emitParticle,
    addDamageText,
    showFlash,
    shake,
  });
  applyRummanSiegeOnHitProcs(unit, target, {
    ohTier,
    damage,
    units,
    enemies,
    beamFx,
    groundEffects,
    dealDamage,
    emitParticle,
    addDamageText,
    showFlash,
    shake,
  });
  applyRummanCannonOnHitProcs(unit, target, {
    ohTier,
    damage,
    enemies,
    beamFx,
    groundEffects,
    dealDamage,
    randomRange,
    emitParticle,
    addDamageText,
    showFlash,
    shake,
  });
}

function applyRummanBaseOnHitProcs(unit, target, {
  ohTier,
  damage,
  units,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
  showFlash,
  shake,
}) {
  if (unit._taserShock && ohTier === 3 && target.hp > 0) {
    const taserDamage = Math.round(damage * 0.60);
    dealDamage(target, taserDamage, unit, 'magic');
    if (!target.isBoss) target.stunned = Math.max(target.stunned || 0, Math.round(0.5 * GAME_TICK_HZ));
    beamFx.push({ x1: unit.x, y1: unit.y, x2: target.x, y2: target.y, life: 0.7, maxLife: 0.7, color: '#44ccff', width: 7, straight: false });
    beamFx.push({ x1: unit.x, y1: unit.y, x2: target.x, y2: target.y, life: 0.5, maxLife: 0.5, color: '#ffffff', width: 3, straight: false });
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 2 * i / 8;
      beamFx.push({ x1: target.x, y1: target.y, x2: target.x + Math.cos(angle) * 30, y2: target.y + Math.sin(angle) * 30, life: 0.5, maxLife: 0.5, color: '#88eeff', width: 3, straight: false });
    }
    beamFx.push({ x1: target.x - 8, y1: target.y - 25, x2: target.x + 4, y2: target.y - 8, life: 0.7, maxLife: 0.7, color: '#ffff44', width: 4, straight: true });
    beamFx.push({ x1: target.x + 4, y1: target.y - 8, x2: target.x - 4, y2: target.y + 8, life: 0.7, maxLife: 0.7, color: '#ffff44', width: 4, straight: true });
    beamFx.push({ x1: target.x - 4, y1: target.y + 8, x2: target.x + 8, y2: target.y + 25, life: 0.7, maxLife: 0.7, color: '#ffff44', width: 4, straight: true });
    emitParticle(target.x, target.y, '#44ccff', 28, 6);
    emitParticle(target.x, target.y, '#ffffff', 14, 4);
    emitParticle(target.x, target.y, '#ffff44', 8, 3);
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 40, life: 0.5, color: '#44ccff' });
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 25, life: 0.35, color: '#88eeff' });
    addDamageText(target.x, target.y - target.size, 'TASER!', '#44ccff');
    shake(3);
  }

  if (unit._grenadeToss && ohTier === 5 && target.hp > 0) {
    const grenadeDamage = Math.round(damage * 1.05);
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - target.x, enemy.y - target.y) <= 58) {
        dealDamage(enemy, grenadeDamage, unit, 'physical');
        emitParticle(enemy.x, enemy.y, '#ff8844', 6, 3);
      }
    }
    const midX = (unit.x + target.x) / 2;
    const midY = Math.min(unit.y, target.y) - 50;
    beamFx.push({ x1: unit.x, y1: unit.y, x2: midX, y2: midY, life: 0.5, maxLife: 0.5, color: '#888888', width: 4, straight: true });
    beamFx.push({ x1: midX, y1: midY, x2: target.x, y2: target.y, life: 0.5, maxLife: 0.5, color: '#888888', width: 4, straight: true });
    beamFx.push({ x1: target.x - 30, y1: target.y, x2: target.x + 30, y2: target.y, life: 0.6, maxLife: 0.6, color: '#ff4400', width: 5, straight: true });
    beamFx.push({ x1: target.x, y1: target.y - 30, x2: target.x, y2: target.y + 30, life: 0.6, maxLife: 0.6, color: '#ff4400', width: 5, straight: true });
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 2 * i / 8;
      beamFx.push({ x1: target.x, y1: target.y, x2: target.x + Math.cos(angle) * 35, y2: target.y + Math.sin(angle) * 35, life: 0.5, maxLife: 0.5, color: '#ffaa00', width: 2, straight: true });
    }
    emitParticle(target.x, target.y, '#ff4400', 30, 7);
    emitParticle(target.x, target.y, '#ffaa00', 20, 5);
    emitParticle(target.x, target.y, '#ffcc00', 10, 4);
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 65, life: 0.6, color: '#ff4400' });
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 35, life: 0.4, color: '#ffaa00' });
    addDamageText(target.x, target.y - target.size, 'GRENADE!', '#ff4400');
    showFlash('GRENADE!', '#ff4400', 20);
    shake(5);
  }

  if (unit._turretOverdrive && ohTier === 10 && target.hp > 0) {
    unit._turretODTimer = 5 * GAME_TICK_HZ;
    for (const minion of units) {
      if (!minion.isMinion || minion.parent !== unit || minion.kind !== 'turret' || minion.hp <= 0) continue;
      if (!minion._todOrigDmg) {
        minion._todOrigDmg = minion.dmg;
        minion._todOrigAtkSpd = minion.atkSpd;
      }
      minion.dmg = Math.round(minion._todOrigDmg * 1.50);
      minion.atkSpd = Math.max(8, Math.round(minion._todOrigAtkSpd * 0.67));
      minion._turretODTimer = 5 * GAME_TICK_HZ;
      emitParticle(minion.x, minion.y, '#44ccff', 12, 4);
    }
    emitParticle(unit.x, unit.y, '#44ccff', 30, 7);
    emitParticle(unit.x, unit.y, '#88eeff', 20, 5);
    for (let i = 0; i < 12; i++) {
      const angle = Math.PI * 2 * i / 12;
      emitParticle(unit.x + Math.cos(angle) * unit.size * 2, unit.y + Math.sin(angle) * unit.size * 2, '#44ccff', 2, 4);
    }
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.size * 2.5, life: 0.6, color: '#44ccff' });
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.size * 1.5, life: 0.4, color: '#88eeff' });
    addDamageText(unit.x, unit.y - unit.size - 10, 'TURRET OVERDRIVE!', '#44ccff');
    showFlash('TURRET OVERDRIVE!', '#44ccff', 30);
    shake(6);
  }
}

function applyRummanSiegeOnHitProcs(unit, target, {
  ohTier,
  damage,
  units,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  emitParticle,
  addDamageText,
  showFlash,
  shake,
}) {
  if (unit._clusterMunition && ohTier === 3 && target.hp > 0) {
    const clusterDamage = Math.round(damage * 0.75);
    dealDamage(target, clusterDamage, unit, 'physical');
    for (let i = 0; i < 3; i++) {
      const angle = Math.PI * 2 * i / 3 + Math.random() * 0.5;
      const distance = 25 + Math.random() * 20;
      const x = target.x + Math.cos(angle) * distance;
      const y = target.y + Math.sin(angle) * distance;
      const bombDamage = Math.round(damage * 0.35);
      for (const enemy of enemies) {
        if (enemy.hp > 0 && Math.hypot(enemy.x - x, enemy.y - y) <= 32) {
          dealDamage(enemy, bombDamage, unit, 'physical');
          emitParticle(enemy.x, enemy.y, '#ff6600', 8, 4);
        }
      }
      emitParticle(x, y, '#ff4400', 16, 5);
      emitParticle(x, y, '#ffaa00', 8, 3);
      groundEffects.push({ x, y, r: 0, maxR: 36, life: 0.5, color: '#ff4400' });
      beamFx.push({ x1: x - 15, y1: y, x2: x + 15, y2: y, life: 0.5, maxLife: 0.5, color: '#ff6600', width: 3, straight: true });
      beamFx.push({ x1: x, y1: y - 15, x2: x, y2: y + 15, life: 0.5, maxLife: 0.5, color: '#ff6600', width: 3, straight: true });
    }
    beamFx.push({ x1: unit.x, y1: unit.y, x2: target.x, y2: target.y, life: 0.5, maxLife: 0.5, color: '#ff8844', width: 5, straight: true });
    emitParticle(target.x, target.y, '#ff8844', 24, 6);
    emitParticle(target.x, target.y, '#ffcc00', 12, 4);
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 40, life: 0.5, color: '#ff8844' });
    addDamageText(target.x, target.y - target.size, 'CLUSTER!', '#ff8844');
    shake(4);
  }

  if (unit._napalmStrike && ohTier === 5 && target.hp > 0) {
    const napalmDamage = Math.round(damage * 1.15);
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - target.x, enemy.y - target.y) <= 65) {
        dealDamage(enemy, napalmDamage, unit, 'magic');
        emitParticle(enemy.x, enemy.y, '#ff4400', 6, 3);
      }
    }
    unit._napalmZone = { x: target.x, y: target.y, r: 65, dur: 2 * GAME_TICK_HZ, dmgPerTick: Math.round(damage * 0.20 / GAME_TICK_HZ * 30), tickRate: 30, tickCD: 0, from: unit };
    beamFx.push({ x1: target.x, y1: target.y - 80, x2: target.x, y2: target.y, life: 0.6, maxLife: 0.6, color: '#ff4400', width: 10, straight: true });
    beamFx.push({ x1: target.x, y1: target.y - 80, x2: target.x, y2: target.y, life: 0.4, maxLife: 0.4, color: '#ffcc00', width: 5, straight: true });
    for (let i = 0; i < 12; i++) {
      const angle = Math.PI * 2 * i / 12;
      beamFx.push({ x1: target.x, y1: target.y, x2: target.x + Math.cos(angle) * 65, y2: target.y + Math.sin(angle) * 65, life: 0.6, maxLife: 0.6, color: '#ff6600', width: 3, straight: true });
    }
    emitParticle(target.x, target.y, '#ff4400', 36, 8);
    emitParticle(target.x, target.y, '#ff8800', 24, 6);
    emitParticle(target.x, target.y, '#ffcc00', 16, 4);
    for (let i = 0; i < 16; i++) {
      const angle = Math.PI * 2 * i / 16;
      emitParticle(target.x + Math.cos(angle) * 65, target.y + Math.sin(angle) * 65, '#ff4400', 3, 4);
    }
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 75, life: 0.7, color: '#ff4400' });
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 52, life: 0.5, color: '#ff8800' });
    addDamageText(target.x, target.y - target.size, 'NAPALM!', '#ff4400');
    showFlash('NAPALM!', '#ff4400', 25);
    shake(7);
  }

  if (unit._siegeMode && ohTier === 10 && target.hp > 0) {
    unit._siegeModeTimer = 5 * GAME_TICK_HZ;
    if (!unit._smOrigRange) {
      unit._smOrigRange = unit.range;
      unit.range = Math.round(unit.range * 1.50);
    }
    if (!unit._smOrigDmg) {
      unit._smOrigDmg = unit.dmg;
      unit.dmg = Math.round(unit.dmg * 1.30);
    }
    for (const minion of units) {
      if (!minion.isMinion || minion.parent !== unit || minion.kind !== 'turret' || minion.hp <= 0) continue;
      if (!minion._smOrigAtkSpd) {
        minion._smOrigAtkSpd = minion.atkSpd;
        minion.atkSpd = Math.max(8, Math.round(minion.atkSpd * 0.50));
      }
      minion._siegeModeTimer = 5 * GAME_TICK_HZ;
      emitParticle(minion.x, minion.y, '#ffcc66', 12, 4);
    }
    emitParticle(unit.x, unit.y, '#ffcc66', 30, 7);
    emitParticle(unit.x, unit.y, '#d9a52a', 20, 5);
    for (let i = 0; i < 14; i++) {
      const angle = Math.PI * 2 * i / 14;
      emitParticle(unit.x + Math.cos(angle) * unit.size * 2.5, unit.y + Math.sin(angle) * unit.size * 2.5, '#ffcc66', 2, 4);
    }
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.size * 3, life: 0.7, color: '#ffcc66' });
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.size * 2, life: 0.5, color: '#d9a52a' });
    addDamageText(unit.x, unit.y - unit.size - 10, 'SIEGE MODE!', '#ffcc66');
    showFlash('SIEGE MODE!', '#ffcc66', 30);
    shake(8);
  }
}

function applyRummanCannonOnHitProcs(unit, target, {
  ohTier,
  damage,
  enemies,
  beamFx,
  groundEffects,
  dealDamage,
  randomRange,
  emitParticle,
  addDamageText,
  showFlash,
  shake,
}) {
  if (unit._gatlingBurst && ohTier === 3 && target.hp > 0) {
    for (let i = 0; i < 4; i++) {
      const gatlingDamage = Math.round(damage * 0.20);
      dealDamage(target, gatlingDamage, unit, 'physical');
      const offset = (i - 1.5) * 5;
      beamFx.push({ x1: unit.x, y1: unit.y + offset, x2: target.x + randomRange(-8, 8), y2: target.y + randomRange(-8, 8), life: 8, maxLife: 8, color: '#ffcc44', width: 4, straight: true });
      beamFx.push({ x1: unit.x, y1: unit.y + offset, x2: target.x + randomRange(-8, 8), y2: target.y + randomRange(-8, 8), life: 6, maxLife: 6, color: '#ffffff', width: 2, straight: true });
      emitParticle(target.x + randomRange(-8, 8), target.y + randomRange(-8, 8), '#ffcc44', 4, 3);
    }
    emitParticle(unit.x + (unit.facing || 1) * 15, unit.y, '#ffff44', 12, 5);
    emitParticle(unit.x + (unit.facing || 1) * 15, unit.y, '#ffffff', 6, 3);
    for (let i = 0; i < 6; i++) emitParticle(unit.x - (unit.facing || 1) * 12, unit.y - 8 + i * 4, '#ccaa44', 2, 3);
    emitParticle(target.x, target.y, '#ffcc44', 24, 6);
    emitParticle(target.x, target.y, '#ff8844', 14, 4);
    emitParticle(target.x, target.y, '#ffffff', 8, 3);
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 30, life: 0.4, color: '#ffcc44' });
    addDamageText(target.x, target.y - target.size, 'PEARL CANNON!', '#ffcc44');
    shake(3);
  }

  if (unit._missileSalvo && ohTier === 5 && target.hp > 0) {
    const extraTargets = [];
    for (const enemy of enemies) {
      if (enemy.hp > 0 && enemy !== target && Math.hypot(enemy.x - unit.x, enemy.y - unit.y) <= unit.range * 1.5) extraTargets.push(enemy);
    }
    extraTargets.sort(() => Math.random() - 0.5);
    const targets = [target, ...extraTargets.slice(0, 1)];
    for (const missileTarget of targets) {
      const missileDamage = Math.round(damage * 0.60);
      dealDamage(missileTarget, missileDamage, unit, 'physical');
      beamFx.push({ x1: unit.x, y1: unit.y, x2: missileTarget.x, y2: missileTarget.y, life: 10, maxLife: 10, color: '#ff5ca8', width: 6, straight: true });
      beamFx.push({ x1: unit.x, y1: unit.y, x2: missileTarget.x, y2: missileTarget.y, life: 8, maxLife: 8, color: '#ffcc00', width: 3, straight: true });
      beamFx.push({ x1: missileTarget.x - 20, y1: missileTarget.y, x2: missileTarget.x + 20, y2: missileTarget.y, life: 8, maxLife: 8, color: '#ff5ca8', width: 4, straight: true });
      beamFx.push({ x1: missileTarget.x, y1: missileTarget.y - 20, x2: missileTarget.x, y2: missileTarget.y + 20, life: 8, maxLife: 8, color: '#ff5ca8', width: 4, straight: true });
      emitParticle(missileTarget.x, missileTarget.y, '#ff4400', 22, 6);
      emitParticle(missileTarget.x, missileTarget.y, '#ffaa00', 14, 5);
      emitParticle(missileTarget.x, missileTarget.y, '#ffffff', 6, 3);
      groundEffects.push({ x: missileTarget.x, y: missileTarget.y, r: 0, maxR: 40, life: 0.5, color: '#ff4400' });
      groundEffects.push({ x: missileTarget.x, y: missileTarget.y, r: 0, maxR: 25, life: 0.35, color: '#ffaa00' });
    }
    emitParticle(unit.x, unit.y - unit.size * 0.5, '#aaaaaa', 16, 5);
    emitParticle(unit.x + (unit.facing || 1) * 10, unit.y - unit.size * 0.3, '#888888', 10, 4);
    addDamageText(unit.x, unit.y - unit.size, 'SEED SALVO!', '#ff5ca8');
    showFlash('SEED SALVO!', '#ff5ca8', 20);
    shake(6);
  }

  if (unit._mechOverload && ohTier === 10 && target.hp > 0) {
    unit._mechOLTimer = 5 * GAME_TICK_HZ;
    if (!unit._molOrigDmg) {
      unit._molOrigDmg = unit.dmg;
      unit.dmg = Math.round(unit.dmg * 1.50);
    }
    if (!unit._molOrigAtkSpd) {
      unit._molOrigAtkSpd = unit.atkSpd;
      unit.atkSpd = Math.max(8, Math.round(unit.atkSpd * 0.70));
    }
    unit._mechOLAoe = 45;
    emitParticle(unit.x, unit.y, '#ff4400', 30, 7);
    emitParticle(unit.x, unit.y, '#ff8800', 22, 5);
    emitParticle(unit.x, unit.y, '#ffcc00', 14, 4);
    for (let i = 0; i < 14; i++) {
      const angle = Math.PI * 2 * i / 14;
      emitParticle(unit.x + Math.cos(angle) * unit.size * 2, unit.y + Math.sin(angle) * unit.size * 2, '#ff4400', 2, 4);
    }
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.size * 2.5, life: 0.6, color: '#ff4400' });
    groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit.size * 1.5, life: 0.4, color: '#ff8800' });
    addDamageText(unit.x, unit.y - unit.size - 10, 'CANNON OVERDRIVE!', '#ff5ca8');
    showFlash('CANNON OVERDRIVE!', '#ff5ca8', 30);
    shake(8);
  }

  if (unit._mechOLAoe > 0 && unit._mechOLTimer > 0 && target.hp > 0) {
    for (const enemy of enemies) {
      if (enemy !== target && enemy.hp > 0 && Math.hypot(enemy.x - target.x, enemy.y - target.y) <= unit._mechOLAoe) {
        dealDamage(enemy, Math.round(damage * 0.40), unit, 'physical');
        emitParticle(enemy.x, enemy.y, '#ff4400', 3, 2);
      }
    }
    groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: unit._mechOLAoe, life: 0.2, color: '#ff4400' });
  }
}
