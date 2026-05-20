import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function tickUnitUpkeep(unit, {
  frame,
  units,
  enemies,
  randomRange,
  groundEffects,
  beamFx,
  dealDamage,
  applyTrackedHeal,
  applyTaoonBloodTithe,
  addTaoonBloodShield,
  applyMuddied,
  clampToArena,
  healerTriageTick,
  emitParticle,
  addDamageText,
}) {
  if (unit.cd > 0) unit.cd--;
  if (unit.justiceReachCD > 0) unit.justiceReachCD--;
  for (const key in unit.abilCD) {
    if (unit.abilCD[key] > 0) unit.abilCD[key]--;
  }
  if (unit.lastStandTimer > 0) {
    unit.lastStandTimer--;
    if (unit.lastStandTimer <= 0) unit.lastStandActive = false;
  }
  if (unit.ironwillTimer > 0) {
    unit.ironwillTimer--;
    if (unit.ironwillTimer <= 0) unit.ironwillActive = false;
  }
  if (unit.atkSpdBuffTimer > 0) {
    unit.atkSpdBuffTimer--;
    if (unit.atkSpdBuffTimer <= 0) unit.atkSpdBuff = 1;
  }
  if (unit._jazarSigHasteTimer > 0) {
    unit._jazarSigHasteTimer--;
    const color = unit._jazarSigAoeTimer > 0 ? (unit._jazarSigAoeColor || '#ffcc00') : (unit.branch === 'b' ? '#44ccff' : '#ffcc00');
    if (frame % 5 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.45, unit.size * 0.45), unit.y - unit.size * 0.25, color, 1, 3);
    if (unit._jazarSigHasteTimer <= 0) addDamageText(unit.x, unit.y - unit.size, 'HASTE ENDS', '#aa8844');
  }
  if (unit._jazarSigAoeTimer > 0) {
    unit._jazarSigAoeTimer--;
    if (frame % 8 === 0) groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: unit._jazarSigAoeRadius || 90, life: 0.22, color: unit._jazarSigAoeColor || '#ffcc00' });
    if (unit._jazarSigAoeTimer <= 0) addDamageText(unit.x, unit.y - unit.size - 12, 'FURY ENDS', '#aa8844');
  }
  if (unit.armorBuffTimer > 0) {
    unit.armorBuffTimer--;
    if (unit.armorBuffTimer <= 0) unit.armorBuff = 0;
  }
  if (unit.polymorphCDt > 0) unit.polymorphCDt--;
  if (unit.zavsGuardPulseTimer > 0) {
    unit.zavsGuardPulseTimer--;
    if (frame % 8 === 0) groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 95, life: 0.25, color: '#cfd6df' });
  }
  if (unit.citadelWallTimer > 0) {
    unit.citadelWallTimer--;
    if (frame % 6 === 0) {
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 160, life: 0.22, color: '#d6b45f' });
      emitParticle(unit.x + randomRange(-unit.size, unit.size), unit.y - unit.size * 0.2, '#d6b45f', 1, 3);
    }
  }
  if (unit.bannerfallGuardTimer > 0) {
    unit.bannerfallGuardTimer--;
    if (frame % 8 === 0) {
      emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.2, '#ffe066', 1, 2);
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 70, life: 0.18, color: '#ffe066' });
    }
  }
  if (unit._zavsLineShieldTimer > 0) {
    unit._zavsLineShieldTimer--;
    if (frame % 8 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.3, '#cfd6df', 1, 2);
    if (unit._zavsLineShieldTimer <= 0) unit._zavsLineShield = 0;
  }
  if (unit._bannerfallZone && unit._bannerfallZone.t > 0) {
    unit._bannerfallZone.t--;
    unit.bannerfallTimer = unit._bannerfallZone.t;
    if (frame % 10 === 0) groundEffects.push({ x: unit._bannerfallZone.x, y: unit._bannerfallZone.y, r: 0, maxR: unit._bannerfallZone.r, life: 0.24, color: '#ffe066' });
    if (unit._bannerfallZone.t <= 0) {
      unit._bannerfallZone = null;
      unit.bannerfallTimer = 0;
    }
  }
  if (unit._batataMudShieldTimer > 0) {
    unit._batataMudShieldTimer--;
    if (frame % 8 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.45, unit.size * 0.45), unit.y - unit.size * 0.2, '#8a6a32', 1, 2);
    if (unit._batataMudShieldTimer <= 0) unit._batataMudShield = 0;
  }
  if (unit._taoonBloodShieldTimer > 0) {
    unit._taoonBloodShieldTimer--;
    if (frame % 8 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.45, unit.size * 0.45), unit.y - unit.size * 0.2, '#cc2244', 1, 2);
    if (unit._taoonBloodShieldTimer <= 0) unit._taoonBloodShield = 0;
  }
  if (unit.tankResolveCDTimer > 0) unit.tankResolveCDTimer--;
  if (unit.tankResolveDRTimer > 0) {
    unit.tankResolveDRTimer--;
    if (frame % 8 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.25, '#9fb8ff', 1, 2);
    if (unit.tankResolveDRTimer <= 0) unit.tankResolveDR = 0;
  }
  if (unit.bloodOathTimer > 0) {
    unit.bloodOathTimer--;
    if (unit.bloodOathTimer <= 0) unit.bloodOathDR = 0;
  }
  if (unit.necropolisGuard) {
    if (unit.necropolisGuard.timer > 0) {
      unit.necropolisGuard.timer--;
      unit.necropolisGuardTimer = unit.necropolisGuard.timer;
      if (frame % 8 === 0) emitParticle(unit.x + randomRange(-unit.size * 0.5, unit.size * 0.5), unit.y - unit.size * 0.2, '#6622aa', 1, 2);
    } else {
      unit.necropolisGuardTimer = 0;
    }
    if (unit.necropolisGuard.cdTimer > 0) unit.necropolisGuard.cdTimer--;
  }
  if (unit.crimsonCovenantTimer > 0) {
    unit.crimsonCovenantTimer--;
    unit.crimsonCovenantTick = (unit.crimsonCovenantTick || 0) + 1;
    if (frame % 8 === 0) groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 165, life: 0.22, color: '#cc2244' });
    if (unit.crimsonCovenantTick >= Math.round(0.5 * GAME_TICK_HZ)) {
      unit.crimsonCovenantTick = 0;
      const targets = (unit.crimsonCovenantTargets || []).filter(enemy => enemy && enemy.hp > 0 && dist(unit, enemy) <= 210).slice(0, 5);
      let totalDrain = 0;
      for (const enemy of targets) {
        const damage = Math.max(1, Math.round(unit.crimsonCovenantDmg || unit.dmg * 0.3));
        dealDamage(enemy, damage, unit, 'magic');
        totalDrain += damage;
        beamFx.push({ x1: unit.x, y1: unit.y, x2: enemy.x, y2: enemy.y, color: '#cc2244aa', width: 2, life: 0.18, maxLife: 0.18, wavy: true });
        emitParticle(enemy.x, enemy.y, '#cc2244', 4, 2);
      }
      const selfHeal = applyTrackedHeal(unit, Math.round(totalDrain * 0.35), unit, false);
      if (selfHeal > 0) applyTaoonBloodTithe(unit, selfHeal);
      const allies = units.filter(ally => ally && ally.hp > 0 && ally.isPlayer && !ally.isGhost && !ally.isMinion && ally !== unit && dist(unit, ally) <= 210)
        .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp)).slice(0, 3);
      for (const ally of allies) {
        const shield = Math.round(unit.maxHp * 0.06);
        addTaoonBloodShield(ally, shield, Math.round(4 * GAME_TICK_HZ), 0);
        const heal = applyTrackedHeal(ally, Math.round(unit.maxHp * 0.025), unit, false);
        if (heal > 0) emitParticle(ally.x, ally.y, '#ff6688', 4, 2);
      }
    }
    if (unit.crimsonCovenantTimer <= 0) {
      unit.crimsonCovenantTargets = null;
      unit.crimsonCovenantTick = 0;
    }
  }
  if (unit.mawOfGrave && unit.mawOfGrave.t > 0) {
    const maw = unit.mawOfGrave;
    maw.t--;
    maw.tick = (maw.tick || 0) + 1;
    if (frame % 10 === 0) {
      groundEffects.push({ x: maw.x, y: maw.y, r: 0, maxR: maw.r, life: 0.26, color: '#7b3fd1' });
      emitParticle(maw.x + randomRange(-maw.r * 0.4, maw.r * 0.4), maw.y + randomRange(-maw.r * 0.25, maw.r * 0.25), '#44c7ff', 1, 2);
    }
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || enemy.isBoss || dist(maw, enemy) > maw.r) continue;
      const dx = maw.x - enemy.x;
      const dy = maw.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      enemy.x += dx / distance * 1.25;
      enemy.y += dy / distance * 0.95;
      clampToArena(enemy);
      enemy.slowTimer = Math.max(enemy.slowTimer || 0, Math.round(0.4 * GAME_TICK_HZ));
      enemy.slowMult = Math.min(enemy.slowMult || 1, 0.70);
      enemy.markedForRuinTimer = Math.max(enemy.markedForRuinTimer || 0, Math.round(0.8 * GAME_TICK_HZ));
      enemy.markedForRuinMult = Math.max(enemy.markedForRuinMult || 0, 0.08);
      enemy.markedForRuinFrom = unit;
    }
    if (maw.tick >= Math.round(0.5 * GAME_TICK_HZ)) {
      maw.tick = 0;
      for (const enemy of enemies) {
        if (enemy.hp <= 0 || dist(maw, enemy) > maw.r) continue;
        dealDamage(enemy, maw.dmg, unit, 'magic');
        emitParticle(enemy.x, enemy.y, '#8a66ff', 3, 2);
      }
    }
    if (maw.t <= 0) unit.mawOfGrave = null;
  }
  if (unit.shelterPulseTimer > 0) {
    unit.shelterPulseTimer--;
    if (frame % 15 === 0) {
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 120, life: 0.24, color: '#6fbf5a' });
      for (const enemy of enemies) {
        if (enemy.hp > 0 && !enemy.isBoss && dist(unit, enemy) <= 120) applyMuddied(enemy, unit, Math.round(0.75 * GAME_TICK_HZ), 0.80, 0.92);
      }
    }
  }
  if (unit.livingBulwarkTimer > 0) {
    unit.livingBulwarkTimer--;
    if (frame % 18 === 0) {
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 160, life: 0.26, color: '#6fbf5a' });
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 105, life: 0.20, color: '#8a6a32' });
      for (const enemy of enemies) {
        if (enemy.hp > 0 && !enemy.isBoss && dist(unit, enemy) <= 160) applyMuddied(enemy, unit, Math.round(0.75 * GAME_TICK_HZ), 0.70, 0.88);
      }
    }
  }
  if (unit.quakebreakRampartTimer > 0) {
    unit.quakebreakRampartTimer--;
    if (frame % 15 === 0) {
      groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 150, life: 0.25, color: '#b0793a' });
      for (const enemy of enemies) {
        if (enemy.hp <= 0 || enemy.isBoss || dist(unit, enemy) > 150) continue;
        applyMuddied(enemy, unit, Math.round(0.9 * GAME_TICK_HZ), 0.65, 0.86);
        enemy.mudbreakerRoarTimer = Math.max(enemy.mudbreakerRoarTimer || 0, Math.round(0.9 * GAME_TICK_HZ));
        enemy.mudbreakerRoarMult = Math.min(enemy.mudbreakerRoarMult || 1, 0.88);
      }
    }
  }
  healerTriageTick(unit);
}
