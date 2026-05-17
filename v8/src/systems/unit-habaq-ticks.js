import { GAME_TICK_HZ } from '../core/constants.js';
import { dist } from '../core/math.js';

export function tickUnitHabaqPassives(unit, {
  frame,
  units,
  projectiles,
  beamEffects,
  randomRange,
  groundEffects,
  applyTrackedHeal,
  emitParticle,
  addDamageText,
}) {
  tickSoothingAroma(unit, { frame, units, projectiles, beamEffects, randomRange, groundEffects, emitParticle, addDamageText });
  tickEssenceInfusion(unit, { beamEffects, randomRange, groundEffects, emitParticle, addDamageText });
  tickEssenceBond(unit, { units });
  tickPrescientMist(unit, { randomRange, groundEffects, applyTrackedHeal, emitParticle, addDamageText });
  tickElixirOfLife(unit, { frame, units, randomRange, groundEffects, applyTrackedHeal, emitParticle });
  tickAromaticRain(unit, { frame, units, randomRange, applyTrackedHeal, emitParticle });
  tickTranscendence(unit, { frame, randomRange, groundEffects, emitParticle });
}

function tickSoothingAroma(unit, {
  frame,
  units,
  projectiles,
  beamEffects,
  randomRange,
  groundEffects,
  emitParticle,
  addDamageText,
}) {
  if (!unit.soothingAroma || !unit._aromaStatues) return;

  unit.soothingAroma.spawnCD++;
  if (unit.soothingAroma.spawnCD >= unit.soothingAroma.spawnEvery) {
    unit.soothingAroma.spawnCD = 0;
    if (unit._aromaStatues.length >= unit.soothingAroma.maxStatues) unit._aromaStatues.shift();
    const x = unit.x + randomRange(-35, 35);
    const y = unit.y + randomRange(-25, 25);
    unit._aromaStatues.push({
      x,
      y,
      timer: unit.soothingAroma.statueDur,
      maxTimer: unit.soothingAroma.statueDur,
      boltCD: 0,
      boltEvery: unit.soothingAroma.boltEvery,
      healAmt: Math.round((unit.healAmt || 60) * unit.soothingAroma.healPct),
      born: frame,
    });
    addDamageText(x, y - 14, 'PLANTED!', '#88cc66', { sz: 12, bold: true });
    for (let i = 0; i < 16; i++) {
      const angle = Math.PI * 2 * i / 16;
      emitParticle(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15, '#88cc66', 2, 3);
    }
    emitParticle(x, y, '#aaffaa', 14, 5);
    emitParticle(x, y, '#ffffff', 6, 3);
    emitParticle(x, y, '#ffd700', 4, 2);
    groundEffects.push({ x, y, r: 0, maxR: 30, life: 0.4, color: '#88cc66' });
    groundEffects.push({ x, y, r: 0, maxR: 15, life: 0.25, color: '#aaffaa' });
    beamEffects.push({ x1: unit.x, y1: unit.y, x2: x, y2: y, life: 0.25, maxLife: 0.25, color: '#88cc66', width: 3, straight: false });
    for (let i = 0; i < 4; i++) {
      const angle = Math.PI * 2 * i / 4;
      beamEffects.push({ x1: x, y1: y, x2: x + Math.cos(angle) * 18, y2: y + Math.sin(angle) * 18, life: 0.15, maxLife: 0.15, color: '#aaffaa', width: 1.5, straight: true });
    }
  }

  const specColor = unit.branch === 'a' ? '#ffd700' : (unit.branch === 'b' ? '#aa55dd' : '#88cc66');
  for (let i = unit._aromaStatues.length - 1; i >= 0; i--) {
    const statue = unit._aromaStatues[i];
    statue.timer--;
    statue.boltCD++;
    if (statue.boltCD >= statue.boltEvery) {
      statue.boltCD = 0;
      let best = null;
      let bestPct = 1;
      for (const ally of units) {
        if (!ally.isPlayer || ally.hp <= 0 || ally.isGhost) continue;
        const pct = ally.hp / ally.maxHp;
        if (pct < bestPct && pct < 0.92) {
          bestPct = pct;
          best = ally;
        }
      }
      if (best) {
        projectiles.push({
          x: statue.x,
          y: statue.y - 12,
          target: best,
          tx: best.x,
          ty: best.y,
          speed: 2.2,
          projType: 'pomOrb',
          visualOnly: true,
          color: specColor,
          _arrN: 10,
          _arrSz: 3,
          _arrGnd: 20,
          isPlayer: true,
          dmg: 0,
          _aromaHeal: statue.healAmt,
          _aromaOwner: unit,
        });
      }
    }
    if (frame % 10 === 0) emitParticle(statue.x + randomRange(-6, 6), statue.y - 12 + randomRange(-6, 0), '#aaffaa', 1, 3);
    if (statue.timer <= 0) {
      const allies = [];
      for (const ally of units) {
        if (ally.isPlayer && ally.hp > 0 && !ally.isGhost && !ally.isMinion) allies.push(ally);
      }
      allies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
      const targets = allies.slice(0, 5);
      if (targets.indexOf(unit) === -1 && unit.hp > 0) targets.push(unit);
      const farewellHeal = Math.round(statue.healAmt * 1.5);
      for (const target of targets) {
        projectiles.push({
          x: statue.x,
          y: statue.y - 12,
          target,
          tx: target.x,
          ty: target.y,
          speed: 2.5,
          projType: 'pomOrb',
          visualOnly: true,
          color: specColor,
          _arrN: 12,
          _arrSz: 4,
          _arrGnd: 25,
          isPlayer: true,
          dmg: 0,
          _aromaHeal: farewellHeal,
          _aromaOwner: unit,
        });
      }
      addDamageText(statue.x, statue.y - 16, 'FAREWELL!', specColor);
      for (let j = 0; j < 16; j++) emitParticle(statue.x + randomRange(-12, 12), statue.y + randomRange(-12, 4), specColor, 1, 3);
      groundEffects.push({ x: statue.x, y: statue.y, r: 0, maxR: 40, life: 0.4, color: specColor });
      unit._aromaStatues.splice(i, 1);
    }
  }
}

function tickEssenceInfusion(unit, {
  beamEffects,
  randomRange,
  groundEffects,
  emitParticle,
  addDamageText,
}) {
  if (!unit.essenceInfusion || !unit._healCastCount) return;

  if (unit._essenceInfICD > 0) unit._essenceInfICD--;
  if (unit._healCastCount % unit.essenceInfusion.every !== 0 || !unit._lastHealTarget || unit._lastHealTarget.hp <= 0 || unit._essenceInfICD > 0) return;

  const target = unit._lastHealTarget;
  if (target._essenceHot) return;

  target._essenceHot = {
    timer: unit.essenceInfusion.dur,
    tick: 0,
    heal: Math.round((unit.healAmt || 60) * unit.essenceInfusion.healMult),
    from: unit,
  };
  unit._essenceInfICD = 3 * GAME_TICK_HZ;
  for (let i = 0; i < 14; i++) emitParticle(target.x + randomRange(-10, 10), target.y + randomRange(-10, 10), '#aaffaa', 2, 3);
  emitParticle(target.x, target.y, '#ffd700', 8, 4);
  emitParticle(target.x, target.y, '#ffffff', 4, 2);
  beamEffects.push({ x1: unit.x, y1: unit.y, x2: target.x, y2: target.y, life: 0.2, maxLife: 0.2, color: '#aaffaa', width: 3, straight: true });
  groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 20, life: 0.25, color: '#aaffaa' });
  addDamageText(target.x, target.y - target.size, 'INFUSED!', '#aaffaa');
}

function tickEssenceBond(unit, { units }) {
  if (!unit.essenceBond) return;

  unit.essenceBond.scanT++;
  if (unit.essenceBond.scanT < unit.essenceBond.scanEvery) return;

  unit.essenceBond.scanT = 0;
  let best = null;
  let bestPct = 1;
  for (const ally of units) {
    if (ally.isPlayer && ally.hp > 0 && ally !== unit && !ally.isGhost && !ally.isMinion) {
      const pct = ally.hp / ally.maxHp;
      if (pct < bestPct) {
        bestPct = pct;
        best = ally;
      }
    }
  }
  unit.essenceBond.target = best;
}

function tickPrescientMist(unit, {
  randomRange,
  groundEffects,
  applyTrackedHeal,
  emitParticle,
  addDamageText,
}) {
  if (!unit.prescientMist || !unit.essenceBond || !unit.essenceBond.target) return;

  if (unit.prescientMist.icd > 0) unit.prescientMist.icd--;
  const target = unit.essenceBond.target;
  if (target.hp <= 0 || target.hp / target.maxHp >= unit.prescientMist.threshold || unit.prescientMist.icd > 0) return;

  applyTrackedHeal(target, Math.round((unit.healAmt || 60) * unit.prescientMist.healMult), unit, true);
  unit.prescientMist.icd = unit.prescientMist.icdMax;
  addDamageText(target.x, target.y - target.size, 'PRESCIENT MIST!', '#ffd700');
  for (let i = 0; i < 16; i++) emitParticle(target.x + randomRange(-12, 12), target.y + randomRange(-12, 12), '#ffd700', 1, 4);
  groundEffects.push({ x: target.x, y: target.y, r: 0, maxR: 60, life: 0.5, color: '#ffd700' });
}

function tickElixirOfLife(unit, {
  frame,
  units,
  randomRange,
  groundEffects,
  applyTrackedHeal,
  emitParticle,
}) {
  if (!(unit._elixirTimer > 0)) return;

  unit._elixirTimer--;
  if (frame % 6 === 0) {
    for (const ally of units) {
      if (!ally.isPlayer || ally.hp <= 0 || ally.isGhost) continue;
      applyTrackedHeal(ally, unit._elixirHeal, unit, false);
      emitParticle(ally.x + randomRange(-10, 10), ally.y - randomRange(5, 20), '#ffd700', 1, 3);
      emitParticle(ally.x + randomRange(-6, 6), ally.y - randomRange(15, 35), '#ffe066', 1, 2);
    }
  }
  if (frame % 2 === 0) {
    const angle = Math.random() * Math.PI * 2;
    const radius = randomRange(10, 50);
    emitParticle(unit.x + Math.cos(angle) * radius, unit.y + Math.sin(angle) * radius, '#ffe066', 1, 4);
  }
  if (frame % 3 === 0) emitParticle(unit.x + randomRange(-8, 8), unit.y - randomRange(20, 45), '#ffd700', 1, 3);
  if (frame % 30 === 0) groundEffects.push({ x: unit.x, y: unit.y, r: 0, maxR: 40, life: 0.4, color: '#ffd700' });
}

function tickAromaticRain(unit, {
  frame,
  units,
  randomRange,
  applyTrackedHeal,
  emitParticle,
}) {
  if (!unit._aromaBurstZone) return;

  const zone = unit._aromaBurstZone;
  zone.timer--;
  if (frame % GAME_TICK_HZ === 0) {
    for (const ally of units) {
      if (!ally.isPlayer || ally.hp <= 0 || ally.isGhost) continue;
      if (dist({ x: zone.x, y: zone.y }, ally) <= zone.r) {
        const heal = applyTrackedHeal(ally, zone.healAmt, unit, false);
        unit._healCastCount = (unit._healCastCount || 0) + 1;
        unit._lastHealTarget = ally;
        unit._lastHealAmt = heal;
      }
    }
  }
  if (zone.timer > 0) return;

  unit._aromaBurstZone = null;
  for (let i = 0; i < 20; i++) emitParticle(zone.x + randomRange(-zone.r * 0.6, zone.r * 0.6), zone.y + randomRange(-zone.r * 0.4, zone.r * 0.4), '#88cc66', 1, 3);
}

function tickTranscendence(unit, {
  frame,
  randomRange,
  groundEffects,
  emitParticle,
}) {
  if (!(unit._transcendenceTimer > 0)) return;

  unit._transcendenceTimer--;
  if (frame % 8 === 0) emitParticle(unit.x + randomRange(-30, 30), unit.y + randomRange(-20, 20), '#88cc66', 1, 3);
  const fastBolt = Math.max(8, Math.round(unit.soothingAroma ? unit.soothingAroma.boltEvery * 0.6 : 14));
  if (unit._aromaStatues) {
    for (const statue of unit._aromaStatues) {
      statue.boltEvery = fastBolt;
      statue._transMistCD = (statue._transMistCD || 0) - 1;
      if (statue._transMistCD <= 0) {
        const activeMist = groundEffects.filter(effect => effect.mistZone && effect.mistOwner === unit).length;
        if (activeMist >= Math.min(3, unit._aromaStatues.length)) continue;
        statue._transMistCD = Math.round(0.75 * GAME_TICK_HZ);
        const x = statue.x + randomRange(-30, 30);
        const y = statue.y + randomRange(-20, 20);
        groundEffects.push({ x, y, r: 0, maxR: 46, life: 0.9, color: '#88cc66', mistZone: true, mistHeal: Math.round((unit.healAmt || 60) * 0.20), mistOwner: unit });
      }
    }
  }
  if (unit._transcendenceTimer <= 0 && unit.soothingAroma && unit._aromaStatues) {
    for (const statue of unit._aromaStatues) statue.boltEvery = unit.soothingAroma.boltEvery;
  }
}
